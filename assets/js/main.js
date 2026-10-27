(() => {
  "use strict";

  const AGE_KEY = "gow-age-ok";

  const storage = {
    get(key) { try { return localStorage.getItem(key); } catch { return null; } },
    set(key, value) { try { localStorage.setItem(key, value); } catch { /* storage unavailable */ } },
  };

  // ---------- Age gate ----------
  const gate = document.getElementById("age-gate");
  if (gate && typeof gate.showModal === "function" && storage.get(AGE_KEY) !== "1") {
    gate.showModal();
    // ESC must not bypass the gate.
    gate.addEventListener("cancel", (e) => e.preventDefault());

    gate.querySelector('[data-age="yes"]').addEventListener("click", () => {
      storage.set(AGE_KEY, "1");
      gate.close();
    });
    gate.querySelector('[data-age="no"]').addEventListener("click", () => {
      gate.querySelector('[data-state="ask"]').hidden = true;
      const denied = gate.querySelector('[data-state="denied"]');
      denied.hidden = false;
      denied.setAttribute("tabindex", "-1");
      denied.focus();
    });
  }

  // ---------- Mobile nav ----------
  const toggle = document.querySelector(".nav-toggle");
  const nav = document.getElementById("site-nav");
  if (toggle && nav) {
    const setOpen = (open) => {
      toggle.setAttribute("aria-expanded", String(open));
      nav.classList.toggle("is-open", open);
    };
    toggle.addEventListener("click", () => setOpen(toggle.getAttribute("aria-expanded") !== "true"));
    nav.addEventListener("click", (e) => { if (e.target.closest("a")) setOpen(false); });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && nav.classList.contains("is-open")) { setOpen(false); toggle.focus(); }
    });
  }

  // ---------- Dealer form ----------
  const form = document.getElementById("dealer-form");
  if (form) {
    const rules = {
      email: (el) => (el.validity.valueMissing ? "Bitte E-Mail angeben." : el.validity.typeMismatch ? "Das ist keine gültige E-Mail." : ""),
      zip: (el) => (el.validity.valueMissing ? "Bitte Postleitzahl angeben." : el.validity.patternMismatch ? "4–5 Ziffern, bitte." : ""),
      age: (el) => (el.checked ? "" : "Nur für Erwachsene ab 18."),
    };

    const check = (el) => {
      const msg = rules[el.name](el);
      el.setAttribute("aria-invalid", String(Boolean(msg)));
      document.getElementById(el.getAttribute("aria-describedby")).textContent = msg;
      return !msg;
    };

    Object.keys(rules).forEach((name) => {
      const el = form.elements[name];
      el.addEventListener("blur", () => { if (el.hasAttribute("aria-invalid")) check(el); });
      el.addEventListener("change", () => { if (el.hasAttribute("aria-invalid")) check(el); });
    });

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const fields = Object.keys(rules).map((n) => form.elements[n]);
      const results = fields.map(check);
      const firstInvalid = fields[results.indexOf(false)];
      const status = form.querySelector(".form__status");
      if (firstInvalid) {
        status.textContent = "";
        firstInvalid.focus();
        return;
      }
      // No backend yet: confirm locally.
      status.textContent = "Danke. Wir melden uns per E-Mail.";
      form.reset();
      fields.forEach((el) => el.removeAttribute("aria-invalid"));
    });
  }

  // ---------- Footer year ----------
  const year = document.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());
})();
