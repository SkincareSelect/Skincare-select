import zambiaBoundary from "./zambia-boundary.json";

type Coordinate = readonly [longitude: number, latitude: number];

// Natural Earth 1:10m Admin 0 boundary for Zambia (public domain), simplified to 0.005 degrees.
const boundary: readonly Coordinate[] = zambiaBoundary.map(
  ([longitude, latitude]) => [longitude, latitude] as const,
);

export const ZAMBIA_BOUNDS = {
  south: -18.069232,
  west: 21.979878,
  north: -8.194124,
  east: 33.674203,
};

export function isWithinZambia(latitude: number, longitude: number) {
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return false;
  }

  let inside = false;
  for (let index = 0, previous = boundary.length - 1; index < boundary.length; previous = index++) {
    const [currentLongitude, currentLatitude] = boundary[index];
    const [previousLongitude, previousLatitude] = boundary[previous];
    const cross =
      (longitude - currentLongitude) * (previousLatitude - currentLatitude) -
      (latitude - currentLatitude) * (previousLongitude - currentLongitude);
    const withinSegment =
      Math.abs(cross) < 1e-9 &&
      longitude >= Math.min(currentLongitude, previousLongitude) &&
      longitude <= Math.max(currentLongitude, previousLongitude) &&
      latitude >= Math.min(currentLatitude, previousLatitude) &&
      latitude <= Math.max(currentLatitude, previousLatitude);
    if (withinSegment) {
      return true;
    }

    const crossesLatitude =
      (currentLatitude > latitude) !== (previousLatitude > latitude);
    if (
      crossesLatitude &&
      longitude <
        ((previousLongitude - currentLongitude) * (latitude - currentLatitude)) /
          (previousLatitude - currentLatitude) +
          currentLongitude
    ) {
      inside = !inside;
    }
  }

  return inside;
}
