/* Legend of the Five Rings — sheet-specific behavior */
window.Sheets.l5r = {
  init(root) {
    const getRing = (field) => parseInt(root.querySelector(`[data-field="${field}"]`)?.value, 10) || 0;

    const recalc = () => {
      const earth = getRing("ring-earth");
      const air = getRing("ring-air");
      const water = getRing("ring-water");
      const fire = getRing("ring-fire");
      const voidRing = getRing("ring-void");

      const set = (field, value) => {
        const el = root.querySelector(`[data-field="${field}"]`);
        if (el) el.value = value;
      };
      set("endurance", (earth + fire) * 2);
      set("composure", (earth + water) * 2);
      set("focus", air + fire);
      set("vigilance", Math.floor((air + water) / 2));
      set("void-max", voidRing);
    };

    root.querySelectorAll(".ring-pip").forEach((input) => input.addEventListener("input", recalc));
    recalc();
  },
};
