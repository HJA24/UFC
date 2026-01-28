
export const redScale = d3.scaleSequential()
    .domain([0, 1])
    .interpolator(d3.interpolateRgb("#ffdddd", "#bf0700"));

export const blueScale = d3.scaleSequential()
    .domain([0, 1])
    .interpolator(d3.interpolateRgb("#dbe9ff", "#0045b9"));

export const purpleScale = d3.scaleSequential()
  .domain([0, 1])
  .interpolator(d3.interpolateRgb("#EDE3EE", "#60265D"));