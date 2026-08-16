const CONTROL_ID = 'open-elsewhere';
const PANEL = 'font:12px/1.45 system-ui,sans-serif;background:#fff;color:#111;border:1px solid #d4d4d8;' +
    'border-radius:6px;padding:8px;box-shadow:0 2px 8px rgba(0,0,0,.15)';
const LINK = 'display:block;padding:4px 6px;color:#1d4ed8;text-decoration:none;border-radius:4px;white-space:nowrap';
// Formats confirmed against each site's own permalink builder.
const TARGETS = [
    {
        key: 'osm',
        label: 'OpenStreetMap',
        url: (lat, lng, z) => 'https://www.openstreetmap.org/#map=' + z + '/' + lat.toFixed(5) + '/' + lng.toFixed(5),
    },
    {
        key: 'google',
        label: 'Google Maps',
        url: (lat, lng, z) => 'https://www.google.com/maps/@' + lat.toFixed(6) + ',' + lng.toFixed(6) + ',' + z + 'z',
    },
    {
        key: 'bing',
        label: 'Bing Maps',
        url: (lat, lng, z) => 'https://www.bing.com/maps?cp=' + lat.toFixed(6) + '~' + lng.toFixed(6) + '&lvl=' + z,
    },
    {
        key: 'openrailwaymap',
        label: 'OpenRailwayMap',
        url: (lat, lng, z) => 'https://www.openrailwaymap.org/?style=standard&lat=' + lat.toFixed(6) + '&lon=' + lng.toFixed(6) + '&zoom=' + z,
    },
    {
        key: 'opentopomap',
        label: 'OpenTopoMap',
        url: (lat, lng, z) => 'https://opentopomap.org/#map=' + z + '/' + lat.toFixed(5) + '/' + lng.toFixed(5),
    },
    {
        key: 'mapillary',
        label: 'Mapillary',
        url: (lat, lng, z) => 'https://www.mapillary.com/app/?lat=' + lat.toFixed(6) + '&lng=' + lng.toFixed(6) + '&z=' + z,
    },
    {
        key: 'geohack',
        label: 'GeoHack (all services)',
        url: (lat, lng) => 'https://geohack.toolforge.org/geohack.php?params=' + lat.toFixed(6) + '_N_' + lng.toFixed(6) + '_E',
    },
];
plugin.mapHook.onHook(function () {
    const enabledRaw = String(plugin.settings.get('services') || 'osm,google,openrailwaymap,geohack');
    const enabled = enabledRaw.split(',').map(function (part) { return part.trim(); });
    const targets = TARGETS.filter(function (t) { return enabled.indexOf(t.key) !== -1; });
    const shown = targets.length > 0 ? targets : TARGETS;
    let markup = '<div style="' + PANEL + '">' +
        '<div style="font-weight:600;margin-bottom:4px">Open this view in…</div>';
    for (let i = 0; i < shown.length; i++) {
        markup += '<a href="#" data-open-target="' + shown[i].key + '" style="' + LINK + '">' + shown[i].label + '</a>';
    }
    markup += '<div data-open-coords style="margin-top:6px;color:#71717a;font-variant-numeric:tabular-nums"></div></div>';
    plugin.mapHook.createControl({
        id: CONTROL_ID,
        position: String(plugin.settings.get('position') || 'top-left'),
        html: markup,
    });
    const root = document.querySelector('[data-map-control-id="' + CONTROL_ID + '"]');
    if (!root) {
        plugin.error('Open elsewhere: control markup not found in the page');
        return;
    }
    const coords = root.querySelector('[data-open-coords]');
    function currentView() {
        const center = plugin.mapHook.getCenter();
        if (!center)
            return null;
        const zoom = plugin.mapHook.getZoom();
        return { lat: center.lat, lng: center.lng, zoom: typeof zoom === 'number' ? Math.round(zoom) : 14 };
    }
    function refreshCoords() {
        if (!coords)
            return;
        const view = currentView();
        coords.textContent = view ? view.lat.toFixed(5) + ', ' + view.lng.toFixed(5) + ' · z' + view.zoom : '';
    }
    for (let i = 0; i < shown.length; i++) {
        const target = shown[i];
        const link = root.querySelector('[data-open-target="' + target.key + '"]');
        if (!link)
            continue;
        link.addEventListener('click', function (event) {
            event.preventDefault();
            const view = currentView();
            if (!view) {
                plugin.warn('Open elsewhere: the map has no centre yet');
                return;
            }
            // Opened from a real click, so this is a user gesture and not treated as a popup.
            window.open(target.url(view.lat, view.lng, view.zoom), '_blank', 'noopener,noreferrer');
        });
    }
    refreshCoords();
    plugin.mapHook.onMoveEnd(refreshCoords);
    plugin.mapHook.onZoomEnd(refreshCoords);
    plugin.log('Open-elsewhere control ready with', shown.length, 'targets');
});
