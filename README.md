## ✦ The Sheet Forge

A fantasy-styled hub of interactive, fillable tabletop character sheets. Pick a system from the sidebar, fill in your character, and export it as a PNG or PDF whenever you're ready.

## 🚀 How to Use

1. **Online Version:** Visit [https://phaizona.github.io/dndsheet/](https://phaizona.github.io/dndsheet/).
2. **Local Version:** Clone this repository and open `docs/index.html` directly in your browser — no build step or server needed.

Pick a system on the left, fill in the sheet, upload a portrait if it has one, and use **Export PNG** / **Export PDF** in the top bar to save it. Your inputs are also autosaved to your browser's local storage per sheet, so refreshing the page won't lose your progress.

## 📜 Included Systems

- Dungeons & Dragons 5th Edition
- Pathfinder 2nd Edition
- Savage Worlds Adventure Edition
- Fate Condensed
- Mage: the Ascension (20th Anniversary Edition)
- Vampire: the Masquerade 5th Edition
- Legend of the Five Rings

## 🛠 Tech Stack

Vanilla **HTML5 / CSS3 / JavaScript** — no build step, no framework. `html2canvas` and `jsPDF` (loaded from CDN) power the PNG/PDF export.

## 🧩 Project Structure

```
docs/
  index.html            shell (sidebar + top bar) + one <template> per sheet
  css/
    base.css            shared shell/sidebar/topbar + reusable components
                         (cards, checkboxes, dot ratings, die selects, portraits...)
    sheets/<id>.css      layout & look specific to one sheet system
  js/
    core/app.js          sidebar wiring, sheet switching, export, autosave, shared helpers
    sheets/<id>.js        small system-specific behavior (e.g. ability modifiers)
  assets/thumbs/<id>.jpg  optional sidebar thumbnail per system (falls back to an emoji)
```

### Adding a new sheet system

1. Add an entry to `SHEET_REGISTRY` in [`js/core/app.js`](docs/js/core/app.js) (id, name, icon, accent color, portrait/landscape).
2. Add a `<template id="tpl-<id>">…</template>` with the sheet markup in `index.html`.
3. Add `css/sheets/<id>.css` for its layout and `js/sheets/<id>.js` for any calculated fields (both files are simple and self-contained — copy an existing one as a starting point).
4. Drop a thumbnail at `assets/thumbs/<id>.jpg` (optional — an emoji is shown until then).

That's it — the shell, export buttons, autosave, portrait upload, checkboxes and dot-ratings are all handled generically by `core/app.js` and `base.css`.

## 🎨 Design by
Template created by **Phaizona**.

---
*Happy adventuring! May your rolls always be natural 20s.*
