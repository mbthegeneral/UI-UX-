# GoW Design System — "Raw Can"

Brutalistisches Design-System für die GoW-Snus-Landingpage.
Quelle der Wahrheit für Code: [`tokens.css`](./tokens.css).

---

## 1. Stil-Definition

| | |
|---|---|
| **Stil** | Brutalism (Neo-Brutalism, print-inspiriert) |
| **Keywords** | roh, laut, ehrlich, kantig, grafisch, Raster sichtbar |
| **Prinzipien** | Struktur zeigen statt verstecken · harte Kanten · keine Verläufe · keine weichen Schatten · Typografie trägt das Design |
| **Passt zu** | Produkt mit klarer Haltung, erwachsene Zielgruppe, "kein Schnickschnack" |
| **Vermeiden** | Glassmorphism, Gradients, abgerundete Ecken, Stock-Fotos mit Lifestyle-Inszenierung, Emojis als Icons |

**Verantwortung:** Nikotinprodukt → Inhalte richten sich ausschließlich an Erwachsene (18+). Keine jugendaffine Bildsprache, keine Gesundheits- oder Leistungsversprechen. Warnhinweis ist ein festes, nicht entfernbares Pattern.

---

## 2. Farben

| Token | Hex | Rolle |
|---|---|---|
| `--c-ink` | `#0B0B0B` | Text, Rahmen, Schatten, dunkle Flächen |
| `--c-paper` | `#F3EFE6` | Seitenhintergrund (ungebleichtes Papier) |
| `--c-white` | `#FFFFFF` | Karten, Inputs |
| `--c-signal` | `#FF3D00` | Primär-Akzent (Signalrot) — CTAs, Highlights |
| `--c-acid` | `#D4FF00` | Sekundär-Akzent — Badges, Hover, Marker |
| `--c-muted` | `#4A4A4A` | Sekundärtext auf Papier/Weiß |
| `--c-warning-bg` | `#0B0B0B` | Warnhinweis-Fläche |
| `--c-warning-fg` | `#FFFFFF` | Warnhinweis-Text |

### Kontrast (WCAG 2.2, geprüft in `checks/predelivery.cjs`)

| Kombination | Ratio | Erlaubt für |
|---|---|---|
| ink auf paper | ~17.5 : 1 | alles |
| muted auf paper | ~7.7 : 1 | Fließtext |
| ink auf signal | ~5.5 : 1 | Button-Text, Labels |
| ink auf acid | ~16 : 1 | alles |
| paper auf ink | ~17.5 : 1 | alles |
| signal auf ink | ~3.8 : 1 | **nur** große Display-Schrift ≥ 24px / dekorativ |
| ~~signal auf paper~~ | ~3.0 : 1 | **verboten** als Text |

**Regel:** Signalrot ist eine *Fläche*, keine Textfarbe. Text auf Rot ist immer `--c-ink`.

---

## 3. Typografie

| Rolle | Font | Gewicht | Fallback |
|---|---|---|---|
| Display | **Archivo Black** | 400 (ist schon Black) | Impact, Arial Black, sans-serif |
| Body | **Space Grotesk** | 400 / 500 / 700 | system-ui, sans-serif |
| Data / Labels | **Space Mono** | 400 / 700 | ui-monospace, monospace |

Google Fonts, `display=swap`, `preconnect` gesetzt.

### Skala (fluid, `clamp()`)

| Token | Wert | Einsatz |
|---|---|---|
| `--fs-mega` | `clamp(6rem, 28vw, 22rem)` | Hero-Wortmarke "GoW" |
| `--fs-h1` | `clamp(2rem, 7vw, 5.5rem)` | Section-Headlines |
| `--fs-h2` | `clamp(1.375rem, 4vw, 3rem)` | Unterüberschriften |
| `--fs-h3` | `1.375rem` | Karten-Titel |
| `--fs-body` | `1.0625rem` (17px) | Fließtext |
| `--fs-small` | `0.875rem` | Meta, Labels |
| `--fs-label` | `0.75rem` | Mono-Labels, uppercase, `letter-spacing: .08em` |

Zeilenhöhe: Display `0.9`, Headlines `1.0`, Body `1.55`. Fließtext max. `65ch`.

---

## 4. Spacing & Raster

4px-Basis. Tokens `--sp-1` … `--sp-10`:

`4 · 8 · 12 · 16 · 24 · 32 · 48 · 64 · 96 · 128` px

- Seiten-Gutter: `--gutter: clamp(16px, 4vw, 48px)`
- Max-Breite Content: `--max-w: 1320px`
- Sections: vertikal `--sp-9` (96px) Desktop / `--sp-8` (64px) Mobile
- Raster: 12 Spalten Desktop, 1 Spalte Mobile; Spalten durch **sichtbare** 3px-Linien getrennt

---

## 5. Form, Rahmen, Schatten

| Token | Wert |
|---|---|
| `--radius` | `0` — immer |
| `--bw` | `3px` (Standard-Rahmen) |
| `--bw-thick` | `6px` (Hero, Sektionstrenner) |
| `--shadow` | `6px 6px 0 0 var(--c-ink)` — harter Versatzschatten |
| `--shadow-sm` | `3px 3px 0 0 var(--c-ink)` |

Keine Blur-Schatten. Keine Gradients.

---

## 6. Motion

| Token | Wert |
|---|---|
| `--dur-fast` | `120ms` |
| `--dur` | `200ms` |
| `--ease` | `cubic-bezier(.2, 0, 0, 1)` |

- Nur `transform` / `opacity` / Farben animieren (kein Layout-Shift).
- Button-Press: Element bewegt sich um den Schattenversatz → Schatten verschwindet ("physischer Klick").
- Ticker-Laufband pausiert bei Hover und wird bei `prefers-reduced-motion: reduce` statisch.

---

## 7. Komponenten

| Komponente | Spezifikation |
|---|---|
| **Button primär** | bg signal, Text ink, 3px Rahmen ink, `--shadow`, min-height 48px, Mono uppercase. Hover: bg acid. Active: `translate(6px,6px)`, Schatten 0 |
| **Button sekundär** | bg paper, sonst wie primär |
| **Karte** | bg white, 3px Rahmen, `--shadow`, Padding `--sp-6` |
| **Badge** | bg acid, 3px Rahmen, Mono-Label |
| **Stärke-Meter** | 5 quadratische Blöcke, gefüllt = ink, leer = Rahmen; mit Textalternative ("Stärke 4 von 5") |
| **Spec-Tabelle** | echte `<table>`, Zeilen durch 3px-Linien, Werte in Mono |
| **FAQ** | native `<details>/<summary>`, Plus-Icon als SVG, dreht auf 45° |
| **Input** | bg white, 3px Rahmen, min-height 48px, sichtbares `<label>`; Fokus: 4px acid-Outline + ink-Rahmen |
| **Warnhinweis** | volle Breite, ink-Fläche, weißer Text, fett, nicht schließbar |
| **Age-Gate** | natives `<dialog>`, modal, ESC schließt nicht |

### Fokus
`:focus-visible { outline: 4px solid var(--c-acid); outline-offset: 2px; box-shadow: 0 0 0 7px var(--c-ink) }` — funktioniert auf jedem Hintergrund (auch auf Acid-Flächen durch den Ink-Ring).

---

## 8. Icons

Inline-SVG, `stroke-width: 3`, `stroke-linecap: square`, 24×24, `currentColor`. Dekorative Icons `aria-hidden="true"`. **Keine Emojis.**

---

## 9. Anti-Patterns (werden im Pre-Delivery-Check geprüft)

- [ ] Emojis als Icons
- [ ] Text-Kontrast < 4.5:1 (Fließtext) bzw. < 3:1 (≥ 24px)
- [ ] Horizontaler Scroll auf 320 / 375 / 768 / 1024 / 1440 px
- [ ] Klickflächen < 44×44 px
- [ ] Interaktive Elemente ohne `cursor: pointer` / ohne Hover-State
- [ ] Fehlender sichtbarer Fokus
- [ ] Bilder ohne `alt`, Inputs ohne `<label>`
- [ ] Animationen ohne `prefers-reduced-motion`-Fallback
- [ ] Fehlende Überschriften-Hierarchie (genau ein `<h1>`, keine Sprünge)
- [ ] Layout-Shift durch Hover (Rahmenbreite ändern, Padding ändern)
- [ ] Fehlender Gesundheits-Warnhinweis / Altershinweis
