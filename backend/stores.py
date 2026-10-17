"""Nearby stores from OpenStreetMap, plus evidence from recorded offers."""

import math
from datetime import UTC, datetime, timedelta
from threading import Lock
from time import monotonic, sleep
from urllib.parse import urlencode

try:
    from .kitchen import optimize
    from .network import SourceError, read_json
except ImportError:
    from kitchen import optimize
    from network import SourceError, read_json

GATE = Lock()
LAST_GEOCODE = 0.0


def geocode(parameters):
    global LAST_GEOCODE
    with GATE:
        sleep(max(0, 1.05 - (monotonic() - LAST_GEOCODE)))
        LAST_GEOCODE = monotonic()
        return read_json(
            "https://nominatim.openstreetmap.org/search?" + urlencode(parameters),
            {"nominatim.openstreetmap.org"},
        )


def distance(a, b, x, y):
    a, b, x, y = map(math.radians, (a, b, x, y))
    value = math.sin((x - a) / 2) ** 2 + math.cos(a) * math.cos(x) * math.sin((y - b) / 2) ** 2
    return round(6371 * 2 * math.asin(min(1, math.sqrt(value))), 2)


def nearby(db, location, radius=5000):
    key = location.strip().lower() + ":" + str(radius)
    cached = db.get("store_search", key)
    now = datetime.now(UTC)
    if cached and datetime.fromisoformat(cached["fetched_at"]) > now - timedelta(days=1):
        return {**cached["result"], "cached": True}
    # Only explicit searches, never keystroke/autocomplete requests. One request/sec.
    places = geocode({"q": location.strip(), "format": "jsonv2", "limit": 1})
    if not places:
        raise SourceError("Location not found. Include a city and country, or a postal code.")
    lat, lon = float(places[0]["lat"]), float(places[0]["lon"])
    query = f'[out:json][timeout:15];nwr["shop"~"^(supermarket|grocery|greengrocer|butcher)$"](around:{radius},{lat},{lon});out center tags 80;'
    data = None
    for host in ("overpass-api.de", "overpass.private.coffee"):
        try:
            candidate = read_json(
                "https://" + host + "/api/interpreter?" + urlencode({"data": query}), {host}
            )
            if (
                isinstance(candidate, dict)
                and isinstance(candidate.get("elements"), list)
                and not candidate.get("remark")
            ):
                data = candidate
                break
        except SourceError:
            continue
    fallback = data is None
    if fallback:
        delta_lat = radius / 111_000
        delta_lon = delta_lat / max(0.2, math.cos(math.radians(lat)))
        found = geocode(
            {
                "q": "supermarket",
                "format": "jsonv2",
                "limit": 20,
                "namedetails": 1,
                "extratags": 1,
                "bounded": 1,
                "viewbox": f"{lon - delta_lon},{lat + delta_lat},{lon + delta_lon},{lat - delta_lat}",
            }
        )
        data = {
            "elements": [
                {
                    "type": place["osm_type"],
                    "id": place["osm_id"],
                    "lat": float(place["lat"]),
                    "lon": float(place["lon"]),
                    "tags": {
                        "name": place.get("name") or place.get("namedetails", {}).get("name"),
                        "shop": "supermarket",
                        **(place.get("extratags") or {}),
                    },
                }
                for place in found
            ]
        }
    stores = []
    for row in data.get("elements", []):
        tags = row.get("tags", {})
        center = row.get("center", row)
        name = tags.get("name") or tags.get("brand")
        if not name or "lat" not in center or "lon" not in center:
            continue
        store_lat, store_lon = center["lat"], center["lon"]
        if distance(lat, lon, store_lat, store_lon) > radius / 1000:
            continue
        stores.append(
            {
                "id": f"{row['type']}/{row['id']}",
                "name": name,
                "kind": tags.get("shop"),
                "distance_km": distance(lat, lon, store_lat, store_lon),
                "address": ", ".join(
                    filter(
                        None,
                        [
                            " ".join(
                                filter(
                                    None, [tags.get("addr:housenumber"), tags.get("addr:street")]
                                )
                            ),
                            tags.get("addr:city"),
                        ],
                    )
                ),
                "halal": tags.get("diet:halal", "unknown"),
                "url": f"https://www.openstreetmap.org/{row['type']}/{row['id']}",
                "directions_url": "https://www.google.com/maps/dir/?"
                + urlencode(
                    {"api": 1, "destination": f"{store_lat},{store_lon}", "travelmode": "driving"}
                ),
            }
        )
    result = {
        "location": places[0]["display_name"],
        "stores": sorted(
            stores,
            key=lambda store: (
                {"supermarket": 0, "grocery": 1, "greengrocer": 2, "butcher": 3}.get(
                    store["kind"], 4
                ),
                store["distance_km"],
                store["name"],
            ),
        )[:20],
        "source": "OpenStreetMap contributors (ODbL)",
        "source_url": "https://www.openstreetmap.org/copyright",
        "fetched_at": now.isoformat(),
        "cached": False,
        "note": "Distances are straight-line estimates. Map listings do not establish stock, prices, opening hours, or halal certification; check with the store."
        + (
            " Public map queries were busy; these results include mapped supermarkets only."
            if fallback
            else ""
        ),
    }
    db.save("store_search", {"fetched_at": now.isoformat(), "result": result}, key)
    return result


def recommend(grocery, offers, lookup, currency):
    names = sorted({offer["store"] for offer in offers})
    comparisons = []
    for store in names:
        result = optimize(
            grocery, [offer for offer in offers if offer["store"] == store], lookup, currency
        )
        covered = len(result["items"])
        if not covered:
            continue
        comparisons.append(
            {
                "store": store,
                "priced_lines": covered,
                "unpriced_lines": len(result["unpriced"]),
                "subtotal": result["total"],
                "complete": not result["unpriced"],
            }
        )
    comparisons.sort(
        key=lambda result: (result["unpriced_lines"], result["subtotal"], result["store"])
    )
    return {
        "currency": currency,
        "stores": comparisons,
        "split_basket": optimize(grocery, offers, lookup, currency),
        "recommendation": comparisons[0]["store"] if comparisons else None,
        "reason": "Ranked by coverage first, then comparable whole-pack subtotal. A partial subtotal cannot establish the cheapest full basket. Offers are entered records, not live stock or price guarantees.",
    }
