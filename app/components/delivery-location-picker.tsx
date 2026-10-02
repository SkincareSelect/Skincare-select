"use client";

import { useEffect, useRef, useState } from "react";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";
import L, { type LatLngExpression } from "leaflet";

export type DeliveryLocation = {
  latitude: number;
  longitude: number;
  label?: string;
};

const LUSAKA_CENTER: LatLngExpression = [-15.4167, 28.2833];
const ZAMBIA_BOUNDS: L.LatLngBoundsExpression = [[-18.1, 21.9], [-8.2, 33.7]];

function isWithinZambia(latitude: number, longitude: number) {
  return latitude >= -18.1 && latitude <= -8.2 && longitude >= 21.9 && longitude <= 33.7;
}

const pinIcon = L.divIcon({
  className: "delivery-map-pin",
  html: "<span></span>",
  iconSize: [28, 36],
  iconAnchor: [14, 34],
});

function MapClickHandler({ onSelect }: { onSelect: (location: DeliveryLocation) => void }) {
  useMapEvents({
    click(event) {
      onSelect({
        latitude: event.latlng.lat,
        longitude: event.latlng.lng,
      });
    },
  });
  return null;
}

function RecenterMap({ location }: { location: DeliveryLocation | null }) {
  const map = useMap();

  useEffect(() => {
    if (location) {
      map.flyTo([location.latitude, location.longitude], Math.max(map.getZoom(), 15));
    }
  }, [location, map]);

  return null;
}

export function DeliveryLocationPicker({
  location,
  onChange,
}: {
  location: DeliveryLocation | null;
  onChange: (location: DeliveryLocation | null) => void;
}) {
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const lastSearchAt = useRef(0);

  const findAddress = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = search.trim();
    if (!query) {
      setMessage("Enter an area, street, landmark, or place name to search.");
      return;
    }

    const wait = 1100 - (Date.now() - lastSearchAt.current);
    if (wait > 0) {
      setMessage("Please wait a moment before searching again.");
      return;
    }

    lastSearchAt.current = Date.now();
    setBusy(true);
    setMessage("");
    try {
      const params = new URLSearchParams({
        q: query,
        format: "jsonv2",
        limit: "1",
        countrycodes: "zm",
        viewbox: "28.0,-15.75,28.6,-15.1",
      });
      const response = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`);
      if (!response.ok) {
        throw new Error(`Location search failed with status ${response.status}.`);
      }
      const results = (await response.json()) as Array<{
        lat: string;
        lon: string;
        display_name: string;
      }>;
      const result = results[0];
      if (!result) {
        setMessage("No matching place found in Zambia. Try another name or drop the pin on the map.");
        return;
      }
      const latitude = Number(result.lat);
      const longitude = Number(result.lon);
      if (!isWithinZambia(latitude, longitude)) {
        setMessage("That place is outside Zambia. Search for a Zambian delivery location.");
        return;
      }
      onChange({
        latitude,
        longitude,
        label: result.display_name,
      });
      setMessage(`Pin moved to ${result.display_name}.`);
    } catch (error) {
      console.error("DELIVERY LOCATION SEARCH ERROR:", error);
      setMessage("Location search is unavailable right now. You can still place the pin manually.");
    } finally {
      setBusy(false);
    }
  };

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      setMessage("This browser does not support location access. You can place the pin manually.");
      return;
    }

    setBusy(true);
    setMessage("");
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        if (!isWithinZambia(coords.latitude, coords.longitude)) {
          setMessage("Your current location appears to be outside Zambia. Search for a Zambian delivery location instead.");
          setBusy(false);
          return;
        }
        onChange({ latitude: coords.latitude, longitude: coords.longitude });
        setMessage("Pin moved to your current location.");
        setBusy(false);
      },
      (error) => {
        console.error("DELIVERY GEOLOCATION ERROR:", error);
        setMessage(
          error.code === error.PERMISSION_DENIED
            ? "Location permission was declined. You can search for a place or drop the pin manually."
            : "Your current location could not be determined. You can place the pin manually.",
        );
        setBusy(false);
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 },
    );
  };

  return (
    <section className="mt-5 space-y-3 rounded-2xl border border-[#eadfce] bg-[#fffdfb] p-4">
      <div>
        <h2 className="font-semibold text-slate-900">Pin your delivery location</h2>
        <p className="mt-1 text-sm text-slate-600">
          Search for a Lusaka area or landmark, use your current location, or tap the map and move the pin to your exact delivery point.
        </p>
      </div>

      <form onSubmit={findAddress} className="flex flex-col gap-2 sm:flex-row">
        <label className="sr-only" htmlFor="delivery-location-search">Search a Zambian location</label>
        <input
          id="delivery-location-search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="e.g. Kabulonga, Lusaka"
          className="min-w-0 flex-1 rounded-xl border border-[#eadfce] px-4 py-3"
        />
        <button type="submit" disabled={busy} className="rounded-xl border border-[#eadfce] px-4 py-3 text-sm font-semibold text-slate-800 disabled:opacity-60">
          Search map
        </button>
        <button type="button" onClick={useCurrentLocation} disabled={busy} className="rounded-xl bg-[#2f241f] px-4 py-3 text-sm font-semibold text-white disabled:opacity-60">
          Use my location
        </button>
      </form>

      <div className="h-72 overflow-hidden rounded-2xl border border-[#eadfce]" aria-label="Interactive delivery location map">
        <MapContainer
          center={LUSAKA_CENTER}
          zoom={12}
          minZoom={6}
          maxZoom={19}
          maxBounds={ZAMBIA_BOUNDS}
          maxBoundsViscosity={1}
          className="h-full w-full"
          scrollWheelZoom
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            maxZoom={19}
          />
          <MapClickHandler onSelect={onChange} />
          <RecenterMap location={location} />
          {location ? (
            <Marker
              position={[location.latitude, location.longitude]}
              icon={pinIcon}
              draggable
              eventHandlers={{
                dragend(event) {
                  const point = event.target.getLatLng();
                  onChange({ latitude: point.lat, longitude: point.lng });
                },
              }}
            />
          ) : null}
        </MapContainer>
      </div>

      {location ? (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-[#f7f2eb] px-3 py-2 text-sm text-slate-700">
          <span>
            Selected pin: {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
          </span>
          <button type="button" onClick={() => onChange(null)} className="font-medium text-[#8d6e63] underline">
            Clear pin
          </button>
        </div>
      ) : (
        <p className="text-sm font-medium text-amber-800">Select your delivery point on the map before submitting your order.</p>
      )}
      {message ? <p className="text-sm text-slate-600" role="status">{message}</p> : null}
      <p className="text-xs text-slate-500">
        Map data &copy; OpenStreetMap contributors. Searching sends the place name to OpenStreetMap; browser location is requested only if you choose &ldquo;Use my location.&rdquo; Your selected coordinates are included with the delivery address on your order.
      </p>
    </section>
  );
}
