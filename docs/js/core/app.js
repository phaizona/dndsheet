/* ============================================================
   CORE APP — sidebar, sheet switching, export, shared helpers.
   To add a new sheet system:
     1. Add an entry to SHEET_REGISTRY below.
     2. Add <template id="tpl-<id>"> ... </template> markup in index.html.
     3. Add css/sheets/<id>.css and js/sheets/<id>.js (window.Sheets.<id>.init(root)).
     4. (optional) drop a thumbnail at assets/thumbs/<id>.jpg — it fills the
        whole nav button; until then a faint emoji is shown instead.

   A sheet can be a single page, or split into multiple <div class="sheet-page">
   sections switched by a <div class="sheet-tabs"> nav (see pathfinder2e for an
   example) — Core wires the tab clicks, and export automatically treats each
   page as its own PDF page / exports the visible one as PNG.
   ============================================================ */

window.Sheets = window.Sheets || {};

const SHEET_REGISTRY = [
  { id: "dnd5e", name: "D&D 5th Edition", icon: "🐉", accent: "#8a4b38", orientation: "portrait" },
  { id: "pathfinder2e", name: "Pathfinder 2E", icon: "🗡️", accent: "#8c1f28", orientation: "landscape" },
  { id: "swade", name: "Savage Worlds", icon: "🃏", accent: "#2f6b4f", orientation: "portrait" },
  { id: "fate", name: "Fate Condensed", icon: "⚖️", accent: "#2a7f8a", orientation: "portrait" },
  { id: "mage20", name: "Mage: the Ascension", icon: "🔮", accent: "#5b3b8c", orientation: "portrait" },
  { id: "vtm5", name: "Vampire: the Masquerade", icon: "🩸", accent: "#7a1420", orientation: "portrait" },
  { id: "l5r", name: "Legend of the Five Rings", icon: "🎋", accent: "#3f6b3a", orientation: "landscape" },
];

const STORAGE_PREFIX = "phaizona-sheet:";

document.addEventListener("DOMContentLoaded", () => {
  const nav = document.getElementById("sheet-nav");
  const viewport = document.getElementById("sheet-viewport");
  const titleName = document.getElementById("topbar-name");
  const titleTag = document.getElementById("topbar-tag");

  function buildNav() {
    SHEET_REGISTRY.forEach((sheet) => {
      const btn = document.createElement("button");
      btn.className = "sheet-nav-item";
      btn.dataset.sheet = sheet.id;
      btn.title = sheet.name;
      btn.style.setProperty("--accent", sheet.accent);
      btn.innerHTML = `
        <span class="nav-image">
          <span class="nav-fallback"><span class="thumb-emoji">${sheet.icon}</span></span>
          <img src="assets/thumbs/${sheet.id}.jpg" alt="" onerror="this.remove()">
        </span>
        <span class="nav-name">${sheet.name}</span>
      `;
      btn.addEventListener("click", () => selectSheet(sheet.id));
      nav.appendChild(btn);
    });
  }

  function selectSheet(id) {
    const sheet = SHEET_REGISTRY.find((s) => s.id === id);
    if (!sheet) return;

    nav.querySelectorAll(".sheet-nav-item").forEach((el) => {
      el.classList.toggle("active", el.dataset.sheet === id);
    });

    const tpl = document.getElementById(`tpl-${id}`);
    if (!tpl) {
      viewport.innerHTML = `<div style="color:#e9dcc4;font-family:var(--font-heading);padding:40px;">This sheet is still being illuminated by the scribes… (missing template: ${id})</div>`;
      return;
    }

    viewport.innerHTML = "";
    const node = tpl.content.cloneNode(true);
    const container = node.querySelector(".sheet-container");
    if (container) container.classList.add(`orient-${sheet.orientation}`, `sheet-${sheet.id}`);

    const wrap = document.createElement("div");
    wrap.className = "sheet-scale-wrap";
    wrap.appendChild(node);
    viewport.appendChild(wrap);

    titleName.textContent = sheet.name;
    titleTag.textContent = "";

    // common behaviors available to every sheet
    Core.autoResizeAll(viewport);
    Core.wirePortraits(viewport);
    Core.wireDotRatings(viewport);
    Core.wireStatBlocks(viewport);
    Core.wireRepeatLists(viewport);
    Core.wireSheetTabs(viewport);
    Core.autoAssignFields(viewport);
    Core.loadState(id, viewport);
    Core.wireStatBlocks(viewport); // recompute totals now that saved values are loaded
    Core.wireAutosave(id, viewport);
    Core.fitSheetToViewport();

    // sheet-specific behavior
    const mod = window.Sheets[id];
    if (mod && typeof mod.init === "function") {
      mod.init(viewport);
    }

    history.replaceState(null, "", `#${id}`);
  }

  const Core = {
    autoResizeAll(root) {
      root.querySelectorAll("textarea.auto-resize").forEach((t) => {
        const resize = () => { t.style.height = "auto"; t.style.height = t.scrollHeight + "px"; };
        resize();
        t.addEventListener("input", resize);
      });
    },

    wirePortraits(root) {
      root.querySelectorAll(".portrait-box").forEach((box) => {
        const input = box.querySelector('input[type="file"]');
        if (!input) return;
        input.addEventListener("change", (e) => {
          const file = e.target.files[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = (ev) => {
            box.style.backgroundImage = `url(${ev.target.result})`;
            box.classList.add("has-image");
          };
          reader.readAsDataURL(file);
        });
      });
    },

    wireDotRatings(root) {
      root.querySelectorAll(".dot-rating").forEach((group) => {
        if (group.dataset.wired) return;
        group.dataset.wired = "1";
        group.addEventListener("click", (e) => {
          const dot = e.target.closest(".dot");
          if (!dot) return;
          const dots = Array.from(group.querySelectorAll(".dot"));
          const idx = dots.indexOf(dot);
          const current = dots.filter((d) => d.classList.contains("filled")).length;
          const clickedValue = idx + 1;
          const newValue = clickedValue === current ? clickedValue - 1 : clickedValue;
          dots.forEach((d, i) => d.classList.toggle("filled", i < newValue));
          group.dataset.value = newValue;
        });
      });
    },

    calcModNum(score) {
      const s = parseInt(score, 10);
      return isNaN(s) ? 0 : Math.floor((s - 10) / 2);
    },

    calcMod(score) {
      const m = Core.calcModNum(score);
      return m >= 0 ? `+${m}` : `${m}`;
    },

    // ---- proficiency-based stat rows (Pathfinder-style): Total = Key + Prof + Item ----
    // <div class="calc-row" data-ability="dex" [data-dc]>
    //   <select class="ability-select">...</select>          (optional, overrides data-ability)
    //   <div class="dot-rating teml">...</div>                (proficiency rank, 0-4)
    //   <input data-role="key" readonly>                      (auto: ability modifier)
    //   <input data-role="prof" readonly>                      (auto: level-based prof bonus)
    //   <input data-role="item" data-role-item>                (manual: item bonus)
    //   <input data-role="total" readonly>                    (auto: sum, +10 if data-dc)
    // </div>
    wireStatBlocks(root) {
      const rows = root.querySelectorAll(".calc-row");
      if (!rows.length) return;

      const getAbilityMod = (ability) => {
        const input = root.querySelector(`[data-stat="${ability}"]`);
        return input ? Core.calcModNum(input.value) : 0;
      };
      const getLevel = () => {
        const lvl = root.querySelector('[data-field="level"]');
        return lvl ? parseInt(lvl.value, 10) || 0 : 0;
      };
      const fmt = (n) => (n >= 0 ? `+${n}` : `${n}`);

      const recalcRow = (row) => {
        const select = row.querySelector(".ability-select");
        const ability = select ? select.value : row.dataset.ability;
        const keyMod = getAbilityMod(ability);
        const teml = row.querySelector(".dot-rating");
        const rank = teml ? parseInt(teml.dataset.value || "0", 10) : 0;
        const prof = rank > 0 ? getLevel() + rank * 2 : 0;
        const itemBox = row.querySelector('[data-role="item"]');
        const item = itemBox ? parseInt(itemBox.value, 10) || 0 : 0;
        const base = row.hasAttribute("data-dc") ? 10 : 0;
        const total = base + keyMod + prof + item;

        const keyBox = row.querySelector('[data-role="key"]');
        const profBox = row.querySelector('[data-role="prof"]');
        const totalBox = row.querySelector('[data-role="total"]');
        if (keyBox) keyBox.value = fmt(keyMod);
        if (profBox) profBox.value = fmt(prof);
        if (totalBox) totalBox.value = base ? total : fmt(total);
      };

      const recalcAll = () => rows.forEach(recalcRow);

      if (!root.dataset.statBlocksWired) {
        root.dataset.statBlocksWired = "1";
        root.querySelectorAll("[data-stat]").forEach((inp) => inp.addEventListener("input", recalcAll));
        const lvlInput = root.querySelector('[data-field="level"]');
        if (lvlInput) lvlInput.addEventListener("input", recalcAll);

        rows.forEach((row) => {
          const itemBox = row.querySelector('[data-role="item"]');
          if (itemBox) itemBox.addEventListener("input", () => recalcRow(row));
          const select = row.querySelector(".ability-select");
          if (select) select.addEventListener("change", () => recalcRow(row));
          const teml = row.querySelector(".dot-rating");
          if (teml) teml.addEventListener("click", () => setTimeout(() => recalcRow(row), 0));
        });
      }

      // re-run on every call (cheap) so it also reflects freshly-loaded autosave data
      recalcAll();
    },

    // ---- repeatable row lists: inventory items, actions, known spells... ----
    // <div class="repeat-list">
    //   <div class="repeat-rows"><div class="repeat-row">...</div></div>
    //   <button class="add-row-btn no-print" type="button">+ Add</button>
    // </div>
    wireRepeatLists(root) {
      root.querySelectorAll(".repeat-list").forEach((list) => {
        if (list.dataset.wired) return;
        list.dataset.wired = "1";
        const rowsWrap = list.querySelector(".repeat-rows");
        const addBtn = list.querySelector(".add-row-btn");

        const wireRow = (row) => {
          const removeBtn = row.querySelector(".remove-row-btn");
          if (removeBtn) {
            removeBtn.addEventListener("click", () => {
              if (rowsWrap.children.length > 1) row.remove();
            });
          }
        };

        rowsWrap.querySelectorAll(".repeat-row").forEach(wireRow);

        if (addBtn) {
          addBtn.addEventListener("click", () => {
            const template = rowsWrap.querySelector(".repeat-row");
            if (!template) return;
            const clone = template.cloneNode(true);
            clone.querySelectorAll("input, textarea, select").forEach((el) => {
              if (el.type === "checkbox" || el.type === "radio") el.checked = false;
              else el.value = "";
            });
            clone.querySelectorAll(".dot-rating").forEach((g) => {
              g.dataset.value = "0";
              g.querySelectorAll(".dot").forEach((d) => d.classList.remove("filled"));
            });
            rowsWrap.appendChild(clone);
            wireRow(clone);
            Core.autoResizeAll(clone);
          });
        }
      });
    },

    // ---- multi-page sheets: <div class="sheet-tabs"><button class="tab-btn" data-page="x">
    //      + <div class="sheet-page" data-page="x"> sections ----
    wireSheetTabs(root) {
      const tabs = root.querySelectorAll(".sheet-tabs .tab-btn");
      if (!tabs.length) return;
      const pages = root.querySelectorAll(".sheet-page");
      tabs.forEach((tab) => {
        tab.addEventListener("click", () => {
          tabs.forEach((t) => t.classList.toggle("active", t === tab));
          pages.forEach((p) => {
            p.hidden = p.dataset.page !== tab.dataset.page;
          });
          // hidden textareas can't measure scrollHeight; recheck once visible
          const activePage = root.querySelector(`.sheet-page[data-page="${tab.dataset.page}"]`);
          if (activePage) Core.autoResizeAll(activePage);
          Core.fitSheetToViewport();
        });
      });
    },

    // ---- gives every input inside a [data-autoname] block a stable data-field,
    //      so long hand-written lists (feats, skills...) get autosave for free
    //      without hand-numbering every single row ----
    autoAssignFields(root) {
      root.querySelectorAll("[data-autoname]").forEach((block) => {
        const prefix = block.dataset.autoname;
        block.querySelectorAll("input, textarea, select").forEach((el, i) => {
          if (!el.dataset.field) el.dataset.field = `${prefix}-${i}`;
        });
        block.querySelectorAll(".dot-rating").forEach((el, i) => {
          if (!el.dataset.field) el.dataset.field = `${prefix}-dots-${i}`;
        });
      });
    },

    // ---- lightweight autosave to localStorage, per sheet id ----
    stateKey(id) { return STORAGE_PREFIX + id; },

    serialize(root) {
      const data = {};
      root.querySelectorAll("[data-field]").forEach((el) => {
        const key = el.dataset.field;
        if (el.type === "checkbox") data[key] = el.checked;
        else data[key] = el.value;
      });
      root.querySelectorAll(".dot-rating[data-field]").forEach((el) => {
        data[el.dataset.field] = el.dataset.value || "0";
      });
      return data;
    },

    loadState(id, root) {
      let raw;
      try { raw = localStorage.getItem(Core.stateKey(id)); } catch (e) { return; }
      if (!raw) return;
      let data;
      try { data = JSON.parse(raw); } catch (e) { return; }

      root.querySelectorAll("[data-field]").forEach((el) => {
        const key = el.dataset.field;
        if (!(key in data)) return;
        if (el.type === "checkbox") el.checked = !!data[key];
        else {
          el.value = data[key];
          el.dispatchEvent(new Event("input"));
          el.dispatchEvent(new Event("change"));
        }
      });
      root.querySelectorAll(".dot-rating[data-field]").forEach((group) => {
        const key = group.dataset.field;
        if (!(key in data)) return;
        const value = parseInt(data[key], 10) || 0;
        const dots = Array.from(group.querySelectorAll(".dot"));
        dots.forEach((d, i) => d.classList.toggle("filled", i < value));
        group.dataset.value = value;
      });
    },

    wireAutosave(id, root) {
      let timer = null;
      const save = () => {
        clearTimeout(timer);
        timer = setTimeout(() => {
          try { localStorage.setItem(Core.stateKey(id), JSON.stringify(Core.serialize(root))); } catch (e) { /* ignore quota errors */ }
        }, 300);
      };
      root.addEventListener("input", save);
      root.addEventListener("change", save);
      root.addEventListener("click", (e) => { if (e.target.closest(".dot")) save(); });
    },

    // ---- shrink a fixed-width paper sheet to fit narrow viewports/screens ----
    fitSheetToViewport() {
      const wrap = viewport.querySelector(".sheet-scale-wrap");
      const container = wrap && wrap.querySelector(".sheet-container");
      if (!wrap || !container) return;

      container.style.transform = "";
      container.style.transformOrigin = "top center";
      wrap.style.height = "";

      const styles = getComputedStyle(viewport);
      const available = viewport.clientWidth - parseFloat(styles.paddingLeft) - parseFloat(styles.paddingRight);
      const natural = container.offsetWidth;
      const naturalHeight = container.offsetHeight;

      if (natural > available && available > 0) {
        const scale = available / natural;
        container.style.transform = `scale(${scale})`;
        wrap.style.height = `${naturalHeight * scale}px`;
      }
    },
  };

  window.SheetCore = Core;

  let resizeTimer = null;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => Core.fitSheetToViewport(), 120);
  });

  // ---- export ----
  function activeSheetId() {
    const active = document.querySelector(".sheet-nav-item.active");
    return active ? active.dataset.sheet : "character-sheet";
  }

  function withHiddenChrome(fn) {
    document.querySelectorAll(".no-print").forEach((el) => (el.style.visibility = "hidden"));
    return fn().finally(() => {
      document.querySelectorAll(".no-print").forEach((el) => (el.style.visibility = ""));
    });
  }

  // temporarily undo the responsive scale-down so exports are always full resolution
  function withNaturalScale(container, fn) {
    const prevTransform = container.style.transform;
    container.style.transform = "";
    return fn().finally(() => {
      container.style.transform = prevTransform;
    });
  }

  document.getElementById("btn-export-png").addEventListener("click", () => {
    const wrap = document.querySelector(".sheet-scale-wrap");
    const container = wrap && wrap.querySelector(".sheet-container");
    if (!container) return;
    const visiblePage = container.querySelector(".sheet-page:not([hidden])");
    const target = visiblePage || container;

    withHiddenChrome(() =>
      withNaturalScale(container, () =>
        html2canvas(target, { scale: 2, backgroundColor: null }).then((canvas) => {
          const link = document.createElement("a");
          link.download = `${activeSheetId()}-sheet.png`;
          link.href = canvas.toDataURL("image/png");
          link.click();
        })
      )
    );
  });

  document.getElementById("btn-export-pdf").addEventListener("click", () => {
    const wrap = document.querySelector(".sheet-scale-wrap");
    const container = wrap && wrap.querySelector(".sheet-container");
    if (!container) return;

    const pages = Array.from(container.querySelectorAll(".sheet-page"));
    const tabs = container.querySelectorAll(".sheet-tabs .tab-btn");
    const previouslyVisible = pages.find((p) => !p.hidden);

    withHiddenChrome(() =>
      withNaturalScale(container, async () => {
        const { jsPDF } = window.jspdf;
        let pdf = null;

        const targets = pages.length ? pages : [container];
        for (let i = 0; i < targets.length; i++) {
          const page = targets[i];
          if (pages.length) pages.forEach((p) => { p.hidden = p !== page; });
          // eslint-disable-next-line no-await-in-loop
          const canvas = await html2canvas(page, { scale: 2 });
          const imgData = canvas.toDataURL("image/png");
          const landscape = canvas.width > canvas.height;
          const format = [canvas.width / 2, canvas.height / 2]; // pt ≈ px/2 at scale 2, good enough aspect ratio
          if (!pdf) {
            pdf = new jsPDF({ orientation: landscape ? "l" : "p", unit: "pt", format });
          } else {
            pdf.addPage(format, landscape ? "l" : "p");
          }
          pdf.addImage(imgData, "PNG", 0, 0, format[0], format[1]);
        }

        if (pages.length && previouslyVisible) {
          pages.forEach((p) => { p.hidden = p !== previouslyVisible; });
          tabs.forEach((t) => t.classList.toggle("active", t.dataset.page === previouslyVisible.dataset.page));
        }

        pdf.save(`${activeSheetId()}-sheet.pdf`);
      })
    );
  });

  buildNav();
  const initial = (location.hash || "").replace("#", "") || SHEET_REGISTRY[0].id;
  selectSheet(SHEET_REGISTRY.some((s) => s.id === initial) ? initial : SHEET_REGISTRY[0].id);
});
