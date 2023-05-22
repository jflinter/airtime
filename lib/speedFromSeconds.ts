// Function to calculate max height
export function speedFromSeconds(timeInAir: number) {
  let t = timeInAir / 2;
  let g = 9.8; // m/s^2
  let v = g * t;
  let vFps = v * 3.281;
  let vMph = (vFps * 3600) / 5280;
  return vMph;
}
