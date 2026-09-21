export function formatCoord(value: number) {
  return value.toFixed(3);
}

export function formatDistance(distanceKm: number | null | undefined) {
  if (distanceKm == null) return null;
  return `${distanceKm}km`;
}
