import { getRoot } from "./root.js";

export function initSplitGrid() {
  var splitGrid =
    window.SplitGrid && window.SplitGrid.default
      ? window.SplitGrid.default
      : window.SplitGrid;

  if (!splitGrid) {
    console.warn("SplitGrid not loaded");
    return;
  }

  splitGrid({
    gridTemplateColumns: "2fr 10px 3fr",
    columnGutters: [
      {
        track: 1,
        element: getRoot().getElementById("foggy-gutter-col"),
      },
    ],
    columnMinSizes: { 0: 200, 2: 300 },
  });

  splitGrid({
    gridTemplateRows: "1fr 10px 0.88fr",
    rowGutters: [
      {
        track: 1,
        element: getRoot().getElementById("foggy-gutter-row"),
      },
    ],
    rowMinSizes: { 0: 36, 2: 36 },
  });
}
