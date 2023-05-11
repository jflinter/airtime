// Function to calculate max height
export function heightFromSeconds(timeInAir: number): number {
  let t = timeInAir / 2;
  let g = 9.8; // m/s^2
  let v0 = g * t;
  let height = v0 * t + (-g * t * t) / 2;
  let heightFt = height * 3.281;
  return heightFt;
}
