const STYLE_ID = 'map-ext-dark-map';

// script-src doesn't apply to this plugin's own execution, but style-src still applies to any
// <style> it creates — a nonce-based CSP rejects one with no nonce. Nonces aren't bound to the
// element that first carried them, so copying one already on the page onto our own <style> is a
// legitimate way to interoperate with that CSP, not a bypass. Does nothing for hash-based CSP,
// since a hash has to be precomputed for exact, known-ahead-of-time content.
function pageNonce() {
  var nonced = document.querySelector('script[nonce], style[nonce], link[nonce]');
  return nonced ? nonced.nonce : undefined;
}

plugin.mapHook.onHook(function () {
  let brightness = Number(plugin.settings.get('brightness'));
  if (isNaN(brightness) || brightness < 0.3 || brightness > 1.5) brightness = 0.9;

  let contrast = Number(plugin.settings.get('contrast'));
  if (isNaN(contrast) || contrast < 0.5 || contrast > 2) contrast = 1.05;

  // invert + hue-rotate keeps landmasses dark while leaving hues roughly recognisable.
  const filter = 'invert(1) hue-rotate(180deg) brightness(' + brightness + ') contrast(' + contrast + ')';

  const css =
    // Leaflet exposes a real, stable class for just the tile layer, so only that gets
    // filtered — markers, popups and Leaflet's own controls keep their normal colours.
    '.leaflet-tile-pane{filter:' + filter + '}' +
    // Google Maps has no equivalent public hook. Tiles, markers and controls are all
    // rendered inside .gm-style with an internal structure Google does not document and
    // changes between versions — an earlier attempt at guessing a narrower selector
    // (.gm-style > div:first-child > div:first-child) turned out not to match reality.
    // Filtering the whole container is the only option that reliably works, which means
    // markers and Google's own UI controls get inverted too on this engine.
    '.gm-style{filter:' + filter + '}';

  const existing = document.getElementById(STYLE_ID);
  if (existing) existing.remove();

  const style = document.createElement('style');
  style.id = STYLE_ID;
  const nonce = pageNonce();
  if (nonce) style.nonce = nonce;
  style.textContent = css;
  document.head.appendChild(style);

  // Injected DOM is not tracked as a layer, so it has to be cleaned up explicitly.
  plugin.onDispose(function () {
    style.remove();
  });

  plugin.log('Dark map applied — brightness', brightness, 'contrast', contrast);
});
