export type ShoeSizeSystem = "EU" | "UK" | "US";

export function shoeSizeSystemLabel(system: ShoeSizeSystem | null | undefined) {
  switch (system) {
    case "EU":
      return "EU (Europe)";
    case "UK":
      return "UK";
    case "US":
      return "US (USA)";
    default:
      return undefined;
  }
}

export function formatShoeSize(size: string, system: ShoeSizeSystem | null | undefined) {
  const systemLabel = shoeSizeSystemLabel(system);
  return systemLabel ? `${size} ${systemLabel}` : size;
}
