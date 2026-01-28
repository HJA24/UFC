export const CONFIG = {
  numberOfRounds: 3,
  margin: { top: 50, right: 50, bottom: 50, left: 50 },
  width: 500,
  height: 500,
  blueLegendHeight: 8,
  redLegendWidth: 8,
  rightMarginalWidth: 50,
  baseTicks: [0, 0.5, 1],
  tickOverlapPx: 30, // px tolerance for merging extra tick with base ticks
  zeroTolPx: 3       // px to treat KDE as ~0 near the baseline (hide circle & extra tick)
};
