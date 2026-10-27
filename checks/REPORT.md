# Pre-Delivery-Report — GoW Landingpage

Automatisiert mit `node checks/predelivery.cjs` (Playwright/Chromium).
Viewports: 320 · 375 · 768 · 1024 · 1440 px.

## Ergebnis: 23 / 23 bestanden

| Check | Status |
|---|---|
| Age-Gate öffnet, ESC umgeht ihn nicht, „Ja“ schließt | PASS |
| Keine JS-/Konsolenfehler | PASS |
| Kein horizontaler Scroll (alle 5 Viewports) | PASS |
| Klickflächen ≥ 44×44 px (alle 5 Viewports) | PASS |
| Text-Kontrast WCAG AA (jeder sichtbare Textknoten) | PASS |
| Keine Emojis als Icons | PASS |
| Genau ein H1, keine Sprünge in der Überschriften-Hierarchie | PASS |
| Alt-Texte, Labels, `lang`, `<main>` | PASS |
| `cursor: pointer` auf allen Klickelementen | PASS |
| Hover ohne Layout-Shift | PASS |
| Sichtbarer Tastatur-Fokus | PASS |
| Gesundheitswarnung + 18+-Hinweis | PASS |
| Formular: Fehlermeldungen + Fokus auf erstes ungültiges Feld | PASS |
| `prefers-reduced-motion` stoppt Animation | PASS |
| Mobile-Navigation: Toggle, `aria-expanded`, ESC | PASS |

## Im ersten Lauf gefunden und behoben

| Befund | Ursache | Fix |
|---|---|---|
| 35 px Überhang @320 px | Display-Schriften zu groß, Grid-Spalten ohne `min-width: 0` | `--fs-h1`/`--fs-h2` Minimum gesenkt, `min-width: 0` auf Grid-Kinder |
| 2 px Überhang @1024 px | Spec-Tabelle sprengte Spalte | `table-layout: fixed` + `overflow-wrap: anywhere` |
| Nav-Link „FAQ“ nur 28 px breit | kurzer Text ohne Mindestbreite | `min-width: 44px` + Padding |
| Silbentrennung „VERSPRE-CHEN“ auf Desktop | `hyphens: auto` global | nur noch ≤ 480 px |

Zwei Fehlalarme der Prüflogik selbst wurden korrigiert: `©` zählte als Emoji, und Labels von Textfeldern wurden fälschlich auf `cursor: pointer` geprüft.
