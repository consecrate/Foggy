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
    columnGutters: [
      {
        track: 1,
        element: getRoot().getElementById("foggy-gutter-col"),
      },
    ],
    columnMinSizes: { 0: 200, 2: 300 },
  });

  splitGrid({
    rowGutters: [
      {
        track: 1,
        element: getRoot().getElementById("foggy-gutter-row"),
      },
    ],
    rowMinSizes: { 0: 36, 2: 36 },
  });
}
