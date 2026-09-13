/* Pathfinder 2nd Edition — sheet-specific behavior */
window.Sheets.pathfinder2e = {
  init(root) {
    const statInputs = root.querySelectorAll(".ab-score");
    statInputs.forEach((input) => {
      const stat = input.dataset.stat;
      const modBox = root.querySelector(`#pf-mod-${stat}`);
      const update = () => { if (modBox) modBox.value = SheetCore.calcMod(input.value); };
      update();
      input.addEventListener("input", update);
    });
  },
};
