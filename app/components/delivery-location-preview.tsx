const DELIVERY_PIN_PATTERN =
  /(?:\nDelivery pin: )?(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)(?:\nhttps:\/\/www\.google\.com\/maps\?q=-?\d+(?:\.\d+)?,-?\d+(?:\.\d+)?)?/;

function parseDeliveryLocation(address: string) {
  const match = DELIVERY_PIN_PATTERN.exec(address);
  if (!match) {
    return null;
  }

  const latitude = Number(match[1]);
  const longitude = Number(match[2]);
  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    latitude < -18.1 ||
    latitude > -8.2 ||
    longitude < 21.9 ||
    longitude > 33.7
  ) {
    return null;
  }

  return { latitude, longitude };
}

function getCleanAddress(address: string) {
  return address
    .replace(DELIVERY_PIN_PATTERN, "")
    .replace(/\s*,\s*,/g, ",")
    .replace(/^[\s,]+|[\s,]+$/g, "")
    .trim();
}

function getMapUrls(latitude: number, longitude: number) {
  const offset = 0.012;
  const bounds = [
    longitude - offset,
    latitude - offset,
    longitude + offset,
    latitude + offset,
  ].join(",");
  const marker = `${latitude},${longitude}`;

  return {
    google: `https://www.google.com/maps?q=${marker}`,
    openStreetMap: `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(bounds)}&layer=mapnik&marker=${encodeURIComponent(marker)}`,
  };
}

export function DeliveryLocationPreview({
  address,
  city,
  province,
  landmark,
}: {
  address: string;
  city?: string | null;
  province?: string | null;
  landmark?: string | null;
}) {
  const location = parseDeliveryLocation(address);
  const cleanAddress = [getCleanAddress(address), city, province].filter(Boolean).join(", ");
  const urls = location ? getMapUrls(location.latitude, location.longitude) : null;

  return (
    <section className="mt-3 rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-700">
      <p className="font-semibold text-slate-900">Delivery location</p>
      {cleanAddress ? <p className="mt-1">{cleanAddress}</p> : null}
      {landmark ? <p className="mt-1">Landmark: {landmark}</p> : null}
      {location && urls ? (
        <>
          <p className="mt-2 text-xs text-slate-600">
            Exact pin: {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
          </p>
          <div className="mt-2 h-56 overflow-hidden rounded-lg border border-slate-200">
            <iframe
              title={`Delivery map at ${location.latitude.toFixed(5)}, ${location.longitude.toFixed(5)}`}
              src={urls.openStreetMap}
              className="h-full w-full border-0"
              loading="lazy"
              referrerPolicy="no-referrer"
            />
          </div>
          <a
            href={urls.google}
            target="_blank"
            rel="noreferrer"
            className="mt-2 inline-flex font-semibold text-[#75584f] underline underline-offset-2"
          >
            Open exact pin in Google Maps
          </a>
        </>
      ) : (
        <p className="mt-2 text-amber-800">No map pin was saved for this order.</p>
      )}
    </section>
  );
}
