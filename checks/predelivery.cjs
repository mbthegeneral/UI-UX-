#!/usr/bin/env node
// Pre-delivery UI/UX checks for the GoW landing page.
// Usage: node checks/predelivery.cjs [--shots <dir>]
// Exits non-zero if any check fails.

const path = require("path");
const fs = require("fs");
const { chromium } = require("playwright");

const ROOT = path.resolve(__dirname, "..");
const URL = "file://" + path.join(ROOT, "index.html");
const WIDTHS = [320, 375, 768, 1024, 1440];
const shotsIdx = process.argv.indexOf("--shots");
const SHOTS = shotsIdx > -1 ? path.resolve(process.argv[shotsIdx + 1]) : null;

const results = [];
const record = (name, ok, detail = "") => results.push({ name, ok, detail });

async function openPage(browser, width, opts = {}) {
  const ctx = await browser.newContext({ viewport: { width, height: 900 }, ...opts });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => { if (m.type() === "error" && !/fonts\.g/.test(m.text())) errors.push(m.text()); });
  await page.goto(URL, { waitUntil: "load" });
  return { ctx, page, errors };
}

async function passAgeGate(page) {
  await page.click('[data-age="yes"]');
}

(async () => {
  const browser = await chromium.launch();

  // 1. Age gate behaviour
  {
    const { ctx, page, errors } = await openPage(browser, 1024);
    const openAtStart = await page.$eval("#age-gate", (d) => d.open);
    await page.keyboard.press("Escape");
    const openAfterEsc = await page.$eval("#age-gate", (d) => d.open);
    await passAgeGate(page);
    const openAfterYes = await page.$eval("#age-gate", (d) => d.open);
    record("Age-Gate: öffnet, ESC umgeht nicht, 'Ja' schließt", openAtStart && openAfterEsc && !openAfterYes,
      `start=${openAtStart} esc=${openAfterEsc} yes=${openAfterYes}`);
    record("Keine JS-/Konsolenfehler", errors.length === 0, errors.join(" | "));
    await ctx.close();
  }

  // 2. Per-viewport checks
  for (const width of WIDTHS) {
    const { ctx, page } = await openPage(browser, width);
    await passAgeGate(page);
    await page.evaluate(() => document.fonts && document.fonts.ready);

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    record(`Kein horizontaler Scroll @${width}px`, overflow <= 0, `Überhang ${overflow}px`);

    // Touch targets (visible interactive elements)
    const small = await page.evaluate(() => {
      const out = [];
      document.querySelectorAll("a, button, input, summary, select, textarea").forEach((el) => {
        if (el.classList.contains("skip-link") || el.closest("dialog")) return;
        const r = el.getBoundingClientRect();
        const cs = getComputedStyle(el);
        if (r.width === 0 || cs.visibility === "hidden" || cs.display === "none") return;
        if (r.width < 44 || r.height < 44) out.push(`${el.tagName.toLowerCase()}("${(el.textContent || el.id).trim().slice(0, 20)}") ${Math.round(r.width)}×${Math.round(r.height)}`);
      });
      return out;
    });
    record(`Klickflächen ≥ 44×44px @${width}px`, small.length === 0, small.join(", "));

    if (SHOTS) {
      fs.mkdirSync(SHOTS, { recursive: true });
      await page.screenshot({ path: path.join(SHOTS, `gow-${width}.png`), fullPage: true });
    }
    await ctx.close();
  }

  // 3. Static / a11y checks at desktop
  {
    const { ctx, page } = await openPage(browser, 1440);
    await passAgeGate(page);
    await page.evaluate(() => document.fonts && document.fonts.ready);

    // Contrast of every visible text node against its effective background
    const lowContrast = await page.evaluate(() => {
      const parse = (c) => { const m = c.match(/[\d.]+/g); return m ? m.map(Number) : [0, 0, 0, 0]; };
      const lum = ([r, g, b]) => {
        const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
        return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
      };
      const bgOf = (el) => {
        for (let n = el; n; n = n.parentElement) {
          const c = parse(getComputedStyle(n).backgroundColor);
          if (c.length < 4 || c[3] > 0.5) return c;
        }
        return [255, 255, 255];
      };
      const out = [];
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      const seen = new Set();
      while (walker.nextNode()) {
        const el = walker.currentNode.parentElement;
        if (!walker.currentNode.textContent.trim() || seen.has(el)) continue;
        seen.add(el);
        if (el.closest("dialog, .visually-hidden, .skip-link, svg, [hidden]")) continue;
        const cs = getComputedStyle(el);
        const r = el.getBoundingClientRect();
        if (r.width === 0 || cs.visibility === "hidden") continue;
        const fg = parse(cs.color), bg = bgOf(el);
        const L1 = lum(fg), L2 = lum(bg);
        const ratio = (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
        const size = parseFloat(cs.fontSize), bold = parseInt(cs.fontWeight, 10) >= 700;
        const large = size >= 24 || (bold && size >= 18.66);
        const min = large ? 3 : 4.5;
        if (ratio < min) out.push(`"${el.textContent.trim().slice(0, 30)}" ${ratio.toFixed(2)}:1 (min ${min})`);
      }
      return out;
    });
    record("Text-Kontrast WCAG AA", lowContrast.length === 0, lowContrast.join(" | "));

    const emoji = await page.evaluate(() => {
      const m = document.body.innerText.match(/(?![©®™])\p{Extended_Pictographic}/gu);
      return m ? m.join(" ") : "";
    });
    record("Keine Emojis als Icons", !emoji, emoji);

    const headings = await page.evaluate(() => {
      const hs = [...document.querySelectorAll("h1,h2,h3,h4,h5,h6")].filter((h) => !h.closest("dialog"));
      const h1 = hs.filter((h) => h.tagName === "H1").length;
      const skips = [];
      hs.reduce((prev, h) => { const l = +h.tagName[1]; if (l > prev + 1) skips.push(`${h.tagName} nach H${prev}: "${h.textContent.trim()}"`); return l; }, 1);
      return { h1, skips };
    });
    record("Überschriften: genau ein H1, keine Sprünge", headings.h1 === 1 && headings.skips.length === 0,
      `h1=${headings.h1} ${headings.skips.join("; ")}`);

    const a11y = await page.evaluate(() => {
      const issues = [];
      document.querySelectorAll("img").forEach((i) => { if (!i.hasAttribute("alt")) issues.push(`img ohne alt: ${i.src}`); });
      document.querySelectorAll('svg[role="img"]').forEach((s) => { if (!s.querySelector("title") && !s.getAttribute("aria-label")) issues.push("svg[role=img] ohne Titel"); });
      document.querySelectorAll("svg:not([role])").forEach((s) => { if (s.getAttribute("aria-hidden") !== "true") issues.push("dekoratives svg ohne aria-hidden"); });
      document.querySelectorAll("input, select, textarea").forEach((el) => {
        if (!(el.labels && el.labels.length) && !el.getAttribute("aria-label")) issues.push(`Feld ohne Label: ${el.name}`);
      });
      if (!document.documentElement.lang) issues.push("html ohne lang");
      if (!document.querySelector("main")) issues.push("kein <main>");
      return issues;
    });
    record("Alt-Texte, Labels, Landmarks", a11y.length === 0, a11y.join(" | "));

    const pointer = await page.evaluate(() => {
      const bad = [];
      document.querySelectorAll("a[href], button, summary, input[type=checkbox], input[type=radio]").forEach((el) => {
        if (el.closest("dialog") || el.classList.contains("skip-link")) return;
        if (getComputedStyle(el).cursor !== "pointer") bad.push(`${el.tagName.toLowerCase()}("${el.textContent.trim().slice(0, 20)}")`);
      });
      return bad;
    });
    record("cursor:pointer auf allen Klickelementen", pointer.length === 0, pointer.join(", "));

    // Hover must not shift layout
    const shifts = [];
    for (const sel of [".hero__actions .btn", ".site-nav a", ".faq__item summary", ".site-footer__links a"]) {
      for (const h of await page.$$(sel)) {
        const before = await h.boundingBox();
        await h.hover();
        await page.waitForTimeout(250);
        const after = await h.boundingBox();
        if (before && after && (Math.abs(before.width - after.width) > 0.5 || Math.abs(before.height - after.height) > 0.5)) shifts.push(sel);
      }
    }
    record("Hover ohne Layout-Shift", shifts.length === 0, shifts.join(", "));

    // Visible focus for keyboard users
    const noFocus = [];
    await page.mouse.move(0, 0);
    for (let i = 0; i < 14; i++) {
      await page.keyboard.press("Tab");
      const f = await page.evaluate(() => {
        const el = document.activeElement;
        if (!el || el === document.body) return null;
        const cs = getComputedStyle(el);
        return { name: `${el.tagName.toLowerCase()}("${el.textContent.trim().slice(0, 16)}")`, ok: cs.outlineStyle !== "none" && parseFloat(cs.outlineWidth) >= 2 };
      });
      if (f && !f.ok) noFocus.push(f.name);
    }
    record("Sichtbarer Fokus (Tastatur)", noFocus.length === 0, noFocus.join(", "));

    const warn = await page.evaluate(() => {
      const w = document.querySelector(".warning");
      return !!w && /schädigt Ihre Gesundheit/.test(w.textContent) && /18/.test(document.querySelector(".site-footer").textContent);
    });
    record("Gesundheitswarnung + 18+-Hinweis vorhanden", warn);

    // Form validation surfaces errors and focuses the first invalid field
    await page.click('#dealer-form button[type="submit"]');
    const formState = await page.evaluate(() => ({
      focused: document.activeElement.id,
      errors: [...document.querySelectorAll(".field__error")].filter((e) => e.textContent).length,
    }));
    record("Formular: Fehlermeldungen + Fokus auf erstes Feld", formState.focused === "f-email" && formState.errors === 3,
      JSON.stringify(formState));
    await ctx.close();
  }

  // 4. Reduced motion
  {
    const { ctx, page } = await openPage(browser, 1024, { reducedMotion: "reduce" });
    const anim = await page.$eval(".ticker__track", (el) => getComputedStyle(el).animationName);
    record("prefers-reduced-motion stoppt Laufband", anim === "none", `animation-name=${anim}`);
    await ctx.close();
  }

  // 5. Mobile nav
  {
    const { ctx, page } = await openPage(browser, 375);
    await passAgeGate(page);
    const hiddenBefore = await page.isHidden("#site-nav");
    await page.click(".nav-toggle");
    const expanded = await page.getAttribute(".nav-toggle", "aria-expanded");
    const visible = await page.isVisible("#site-nav");
    await page.keyboard.press("Escape");
    const closed = await page.isHidden("#site-nav");
    record("Mobile-Navigation: Toggle, aria-expanded, ESC", hiddenBefore && expanded === "true" && visible && closed);
    await ctx.close();
  }

  await browser.close();

  const pad = Math.max(...results.map((r) => r.name.length));
  let failed = 0;
  for (const r of results) {
    if (!r.ok) failed++;
    console.log(`${r.ok ? "PASS" : "FAIL"}  ${r.name.padEnd(pad)}  ${r.ok ? "" : r.detail}`);
  }
  console.log(`\n${results.length - failed}/${results.length} Checks bestanden.`);
  process.exit(failed ? 1 : 0);
})();
