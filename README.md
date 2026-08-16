# Map Extender Plugins

A registry of community plugins for the Map Extender browser extension.

Add it in the extension: **Plugins → Browse gallery → Add registry**, then paste:

```
https://REPLACE-ME.github.io/map-extender-plugins/registry.json
```

Or the raw alternate:

```
https://raw.githubusercontent.com/REPLACE-ME/map-extender-plugins/main/registry.json
```

Push it to its own remote:

```bash
git remote add origin git@github.com:<user>/map-extender-plugins.git
git push -u origin main
```

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
REGISTRY_BASE_URL=https://REPLACE-ME.github.io/map-extender-plugins node build.mjs
```

`build.mjs` refuses to write `registry.json` if validation fails. `REGISTRY_BASE_URL` is what
relative screenshot paths are resolved against — set it or screenshots will not load.

## Publishing

`registry.json` is committed and served from the repository root. GitHub Pages is the canonical
URL; `raw.githubusercontent.com` works too and is always current, where Pages is CDN-cached for a
few minutes after a push. A publish that seems not to have landed is usually just that cache.

The extension parses the response rather than trusting its `Content-Type`, so `text/plain` from
raw.githubusercontent is fine.

## Licence

Not yet chosen — add a `LICENSE` before accepting contributions, and decide whether plugins may
carry their own via a `license` field.

See [CONTRIBUTING.md](./CONTRIBUTING.md) to add a plugin.
