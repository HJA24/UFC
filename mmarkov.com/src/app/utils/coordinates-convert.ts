

export function polarToCartesian(
  r: number,
  theta: number
): {x: number, y: number} {
  return {
    x: r * Math.cos(theta),
    y: r * Math.sin(theta)
  }
}
