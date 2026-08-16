plugin.mapHook.onHook(function () {
    let opacity = Number(plugin.settings.get('opacity'));
    if (isNaN(opacity) || opacity < 0 || opacity > 1)
        opacity = 1;
    // Seamark tiles are symbol-only and transparent, so they are mostly empty inland — that is
    // expected, not a failure. No Referer header is required by this server.
    plugin.mapHook.createTileLayer({
        urlTemplate: 'https://tiles.openseamap.org/seamark/{z}/{x}/{y}.png',
        attribution: '© OpenSeaMap contributors (CC-BY-SA)',
        opacity: opacity,
        tileSize: 256,
        minZoom: 0,
        maxZoom: 18,
    });
    plugin.log('OpenSeaMap seamark overlay attached — opacity:', opacity);
});
