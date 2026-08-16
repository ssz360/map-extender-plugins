// Waymarked Trails serves a transparent route overlay per activity, designed to sit on top of
// an existing basemap. Verified live: all four render and none require a Referer header.
const ROUTES = ['hiking', 'cycling', 'riding', 'slopes'];
plugin.mapHook.onHook(function () {
    let route = String(plugin.settings.get('route') || 'hiking');
    if (ROUTES.indexOf(route) === -1)
        route = 'hiking';
    let opacity = Number(plugin.settings.get('opacity'));
    if (isNaN(opacity) || opacity < 0 || opacity > 1)
        opacity = 1;
    plugin.mapHook.createTileLayer({
        urlTemplate: 'https://tile.waymarkedtrails.org/' + route + '/{z}/{x}/{y}.png',
        attribution: '© waymarkedtrails.org, OpenStreetMap contributors (CC-BY-SA)',
        opacity: opacity,
        tileSize: 256,
        minZoom: 0,
        maxZoom: 18,
    });
    plugin.log('Waymarked Trails overlay attached — route:', route, 'opacity:', opacity);
});
