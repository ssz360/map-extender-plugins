const STYLE_ID = 'map-ext-dark-map';
plugin.mapHook.onHook(function () {
    let brightness = Number(plugin.settings.get('brightness'));
    if (isNaN(brightness) || brightness < 0.3 || brightness > 1.5)
        brightness = 0.9;
    let contrast = Number(plugin.settings.get('contrast'));
    if (isNaN(contrast) || contrast < 0.5 || contrast > 2)
        contrast = 1.05;
    // invert + hue-rotate keeps landmasses dark while leaving hues roughly recognisable.
    const filter = 'invert(1) hue-rotate(180deg) brightness(' + brightness + ') contrast(' + contrast + ')';
    const css = 
    // Leaflet: filter the tile pane only, so markers and overlays keep their real colours.
    '.leaflet-tile-pane{filter:' + filter + '}' +
        // Google Maps draws its base raster into the first child of .gm-style.
        '.gm-style > div:first-child > div:first-child{filter:' + filter + '}';
    const existing = document.getElementById(STYLE_ID);
    if (existing)
        existing.remove();
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = css;
    document.head.appendChild(style);
    // Injected DOM is not tracked as a layer, so it has to be cleaned up explicitly.
    plugin.onDispose(function () {
        style.remove();
    });
    plugin.log('Dark map applied — brightness', brightness, 'contrast', contrast);
});
