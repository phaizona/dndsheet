## ✦ Character Forge

A fantasy-styled hub of interactive, fillable tabletop character sheets. Pick a system from the sidebar, fill in your character, and export it as a PNG or PDF whenever you're ready.

## 🚀 How to Use

1. **Online Version:** Visit [https://phaizona.github.io/dndsheet/](https://phaizona.github.io/dndsheet/).
2. **Local Version:** Clone this repository and open `docs/index.html` directly in your browser — no build step or server needed.

Pick a system on the left, fill in the sheet, upload a portrait if it has one, and use **Export PNG** / **Export PDF** in the top bar to save it. Longer sheets are split into a few tabs (e.g. Character / Spells) right inside the sheet — PDF export walks every tab and stitches them into one multi-page PDF automatically. Your inputs are also autosaved to your browser's local storage per sheet, so refreshing the page won't lose your progress. The sheets are fully responsive and scale to fit on a phone screen too.

## 📜 Included Systems

- Dungeons & Dragons 5th Edition
- Pathfinder 2nd Edition
- Savage Worlds Adventure Edition
- Fate Condensed
- Mage: the Ascension (20th Anniversary Edition)
- Vampire: the Masquerade 5th Edition
- Legend of the Five Rings

Each one is modeled after its real, official character sheet — including a few nice touches where it's worth it, like Pathfinder 2E's skills auto-calculating from your ability scores, proficiency rank and level, or Legend of the Five Rings' Derived Attributes updating live from your Rings.

## 🛠 Tech Stack

Vanilla **HTML5 / CSS3 / JavaScript** — no build step, no framework. `html2canvas` and `jsPDF` (loaded from CDN) power the PNG/PDF export.

## 🧩 Project Structure

```
docs/
  index.html            shell (sidebar + top bar) + one <template> per sheet
  css/
    base.css            shared shell/sidebar/topbar + reusable components
                         (cards, checkboxes, dot ratings, die selects, portraits,
                         tabs, repeatable row lists...)
    sheets/<id>.css      layout & look specific to one sheet system
  js/
    core/app.js          sidebar wiring, sheet switching, export (incl. multi-tab
                         PDFs), autosave, proficiency auto-calc, shared helpers
    sheets/<id>.js        small system-specific behavior (e.g. ability modifiers)
  assets/
    logosheet.png         site logo, shown in the sidebar
    thumbs/<id>.jpg        sidebar thumbnail per system (falls back to an emoji)
```

### Adding a new sheet system

1. Add an entry to `SHEET_REGISTRY` in [`js/core/app.js`](docs/js/core/app.js) (id, name, icon, accent color, portrait/landscape).
2. Add a `<template id="tpl-<id>">…</template>` with the sheet markup in `index.html`. For a longer sheet, split it into `<nav class="sheet-tabs">` + `<section class="sheet-page" data-page="...">` blocks — the core handles the rest.
3. Add `css/sheets/<id>.css` for its layout and `js/sheets/<id>.js` for any calculated fields (both files are simple and self-contained — copy an existing one as a starting point).
4. Drop a thumbnail at `assets/thumbs/<id>.jpg` (optional — an emoji is shown until then).

That's it — the shell, export buttons (single- and multi-tab), autosave, portrait upload, checkboxes, dot-ratings and repeatable row lists are all handled generically by `core/app.js` and `base.css`.

## 🎨 Design by
Template created by **Phaizona**.

---
*Happy adventuring! May your rolls always be natural 20s.*
