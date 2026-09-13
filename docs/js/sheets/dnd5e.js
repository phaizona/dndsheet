/* D&D 5th Edition — sheet-specific behavior */
window.Sheets.dnd5e = {
  init(root) {
    const statInputs = root.querySelectorAll(".stat-score");
    statInputs.forEach((input) => {
      const stat = input.dataset.stat;
      const modBox = root.querySelector(`#mod-${stat}`);
      const update = () => { if (modBox) modBox.value = SheetCore.calcMod(input.value); };
      update();
      input.addEventListener("input", update);
    });
  },
};
