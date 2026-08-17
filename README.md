# Map Extender Plugins

A registry of community plugins for the Map Extender browser extension.

Add it in the extension: **Plugins → Browse gallery → Add registry**, then paste:

```
https://ssz360.github.io/map-extender-plugins/registry.json
```

Push it to its own remote:

This registry is published from the `main` branch of this repository.

## What's here

| Plugin | Description |
| --- | --- |
| Rail Tracks | Railway polylines from OpenStreetMap via Overpass |
| Open This View Elsewhere | Jump to the same coordinates on OSM, Google, Bing, OpenRailwayMap and others |
| Saved Views | Bookmark map positions by name |
| Coordinate Inspector | Live lat/lng in decimal and DMS, plus the tile under the pointer |
| Waymarked Trails Overlay | Hiking, cycling, riding and piste route networks |
| OpenSeaMap Seamarks | Nautical marks, lights and navigation aids |
| OSM Points of Interest | One configurable layer over eight OSM categories |
| Dark Map | Dark filter over map tiles only |

## Layout

```
plugins/<slug>/
  plugin.json      metadata — id, version, match patterns, settings schema
  plugin.js        the code, plain JavaScript
  screenshots/     optional PNGs, referenced from plugin.json
types/plugin.d.ts  ambient `plugin` global for editor completion
build.mjs          plugins/* -> registry.json
validate.mjs       the rules, also runnable on its own
```

## Building

```bash
node validate.mjs
node build.mjs
```

`build.mjs` refuses to write `registry.json` if validation fails. Set `REGISTRY_BASE_URL` to
override what relative screenshot paths resolve against; it defaults to this repository's raw
URL on `main`.

## Publishing

`registry.json` is committed and published by GitHub Pages from the `main` branch, alongside the
gallery page at https://ssz360.github.io/map-extender-plugins/. Pages serves it as
`application/json` with permissive CORS and an `ETag`, so the extension's conditional refresh
works against it.

It is cached for ten minutes (`cache-control: max-age=600`), so a push can take that long to
become visible. A publish that seems not to have landed is usually just that cache.

The same file is also reachable at
`https://raw.githubusercontent.com/ssz360/map-extender-plugins/refs/heads/main/registry.json`,
which is always current but serves `text/plain`. The extension parses the payload rather than
trusting the content type, so either address works.

The extension parses the response rather than trusting its `Content-Type`, so `text/plain` from
raw.githubusercontent is fine.

## Licence

Not yet chosen — add a `LICENSE` before accepting contributions, and decide whether plugins may
carry their own via a `license` field.

See [CONTRIBUTING.md](./CONTRIBUTING.md) to add a plugin.
