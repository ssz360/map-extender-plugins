# Contributing a plugin

## Add a folder

```
plugins/my-plugin/
  plugin.json
  plugin.js
  screenshots/main.png     (optional)
```

`plugin.json`:

```json
{
  "id": "extender:my-plugin",
  "name": "My Plugin",
  "description": "One sentence on what it does and where the data comes from.",
  "version": "1.0.0",
  "author": "Your Name",
  "homepage": "https://github.com/you/your-repo",
  "usage": "Short hint shown in the extension popup when enabled",
  "matchPatterns": ["*://*/*"],
  "settingsSchema": [
    { "key": "color", "label": "Marker colour", "type": "text", "default": "red" }
  ],
  "settings": { "color": "red" },
  "screenshots": ["https://ssz360.github.io/map-extender-plugins/plugins/my-plugin/screenshots/main.png"]
}
```

Then run `node validate.mjs`.

## Rules validation enforces

- **`id` starts with `extender:`** and is unique. The extension refuses ids claiming `builtin:`,
  and pins each installed plugin to the registry it came from, so a plugin cannot be hijacked by
  another registry reusing its id.
- **`version` is `major.minor.patch`.** Bump it whenever `plugin.js` changes — installs compare
  versions numerically to offer an update, and a stale version means nobody ever gets the fix.
- **Every `settingsSchema` key has a value in `settings`.** Otherwise the plugin reads `undefined`
  at runtime.
- **A `select` default is one of its own `options`.**
- **`matchPatterns` are `chrome.userScripts` patterns** — `<all_urls>`, `*://*/*`,
  `*://*.example.com/*`. Matched per URL component, so a bare hostname is not a pattern.
- **Screenshots must be absolute `https:` URLs** (or inline `data:image/*`). Relative paths are
  rejected: the extension stores the URL verbatim and renders it from whatever context it is in,
  so there is no reliable base to resolve against. Commit the image under your plugin's
  `screenshots/` folder and point at its published address — `validate.mjs` checks that a URL
  under this registry's own base actually exists on disk, so a typo fails the build instead of
  publishing a link that silently never loads.
- **Keep screenshots to roughly 1400px wide.** Full-resolution Retina captures are several
  megabytes each and the gallery loads one per plugin; the card renders them a few hundred pixels
  wide. Avoid spaces in filenames — use hyphens.
- **`plugin.js` has no `import` or `export`.** It is injected as a source string, not a module.

## Writing the code

[`types/plugin.d.ts`](./types/plugin.d.ts) is the reference for the `plugin` global — every method
a plugin can call, with its signature. Adding `// @ts-check` to the top of `plugin.js` gets you
completion and checking in most editors with no build step.

Things that are easy to get wrong:

- **Clean up after yourself.** Layers and map subscriptions are disposed for you. Anything else —
  an injected `<style>`, a timer, a listener on your own control markup — needs `plugin.onDispose`,
  or it survives until the page reloads.
- **`plugin.fetch`, not `fetch`.** Direct `fetch` from a plugin is subject to the page's origin;
  `plugin.fetch` goes through the extension.
- **Debounce anything driven by `onMoveEnd`,** and ignore stale responses. Panning fires often,
  and public APIs like Overpass are donated infrastructure.
- **Tile URLs substitute only `{z}`, `{x}` and `{y}`.** An `{s}` subdomain placeholder is left
  literal by the Google Maps adapter and every tile 404s. Use a fixed hostname.
- **Guard your control lookup.** `document.querySelector('[data-map-control-id="…"]')` can return
  null if the map container went away; log and bail rather than throwing.

## Review

A plugin runs with the extension's access on every site its patterns match. Expect review to ask
about: what it sends over the network and where, why its match patterns are as broad as they are,
and whether it cleans up. Narrow patterns and an obvious data source get merged faster.
