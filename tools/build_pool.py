#!/usr/bin/env python3
"""Build data/pool-v1.json from the USGS earthquake catalog (ComCat): every magnitude 6+ earthquake since 1973.

Source: https://earthquake.usgs.gov/fdsnws/event/1/ (US Geological Survey, public domain). One request. 1973 is the start
because global coverage of magnitude 6+ is considered complete from the modern network era onward; earlier years are left out
rather than mixing in an incomplete record. A rerun gives a newer snapshot (the catalog is updated and revised).

Usage: python tools/build_pool.py
"""
import datetime as dt
import json
import pathlib
import re
import urllib.parse
import urllib.request

UA = "QuakeRNG-fan-prototype/0.1 (https://github.com/sharkjujg/quakerng)"
today = dt.datetime.now(dt.timezone.utc).date()
END = (today - dt.timedelta(days=1)).isoformat()  # leave out today: the newest events are still being revised
URL = "https://earthquake.usgs.gov/fdsnws/event/1/query?" + urllib.parse.urlencode({
    "format": "geojson", "minmagnitude": 6, "starttime": "1973-01-01", "endtime": END, "eventtype": "earthquake", "orderby": "time-asc", "limit": 20000})
with urllib.request.urlopen(urllib.request.Request(URL, headers={"User-Agent": UA}), timeout=170) as r:
    feats = json.load(r)["features"]
print(len(feats), "events from the catalog", flush=True)


def region(place):
    """The place name after the last comma ("12 km S of Hualien, Taiwan" -> "Taiwan"); a bare "Fiji region" is its own region;
    a named event ("2004 Sumatra - Andaman Islands Earthquake") has no reliable region and stays unknown."""
    if not place or place.endswith("Earthquake"):
        return None
    if "," in place:
        return place.rsplit(",", 1)[1].strip() or None
    return re.sub(r"^\d+ km [NESW]+ of ", "", place).strip() or None


members = []
for f in feats:
    p, (lon, lat, depth) = f["properties"], f["geometry"]["coordinates"]
    if p.get("mag") is None or p.get("time") is None or depth is None:
        continue
    t = dt.datetime.fromtimestamp(p["time"] / 1000, dt.timezone.utc)
    members.append({"id": f["id"], "time": t.strftime("%Y-%m-%dT%H:%MZ"), "mag": round(p["mag"], 1), "magType": p.get("magType"),
                    "depth": round(depth, 1), "lat": round(lat, 2), "lon": round(lon, 2), "place": p.get("place") or "", "region": region(p.get("place")),
                    "tsunami": bool(p.get("tsunami")), "felt": p.get("felt") or None, "mmi": round(p["mmi"], 1) if p.get("mmi") else None,
                    "alert": p.get("alert"), "sig": p.get("sig") or None, "url": p.get("url") or ""})  # a zero count or intensity means "not measured": store unknown
n = len(members)


def coverage(field):
    return f"known for {sum(m[field] is not None for m in members):,} of {n:,}; unknown never satisfies a badge"


meta = {"version": "v1", "publishedAt": today.isoformat(), "capturedAt": today.isoformat(),
        "source": "USGS Earthquake Hazards Program, ComCat catalog (public domain)",
        "provenance": f"Snapshot taken {today.isoformat()} by tools/build_pool.py. Earthquake data courtesy of the U.S. Geological Survey.",
        "selection": f"Every earthquake of magnitude 6.0 or more from 1973-01-01 to {END}. Earlier years are left out because global coverage is less complete.",
        "fieldStatus": {"id": "known", "time": "known (UTC)", "mag": "known", "depth": "known", "lat": "known", "lon": "known", "place": "known",
                        **{f: coverage(f) for f in ("region", "felt", "mmi", "alert", "sig")}, "tsunami": "known (USGS flag, not a confirmed wave)"}}
lines = ",\n".join("  " + json.dumps(m, ensure_ascii=False, separators=(",", ":")) for m in members)
out = '{"meta":' + json.dumps(meta, ensure_ascii=False) + ',\n"members":[\n' + lines + "\n]}\n"
path = pathlib.Path(__file__).resolve().parent.parent / "data" / "pool-v1.json"
path.parent.mkdir(exist_ok=True)
path.write_bytes(out.encode("utf-8"))
print(f"wrote {path}: {n} earthquakes", flush=True)
