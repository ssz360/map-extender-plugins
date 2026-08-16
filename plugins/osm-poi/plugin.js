/**
 * One plugin covering many POI types, rather than one plugin per type. Overpass is a donated
 * public service and this extension already ships three plugins that query it, so every extra
 * always-on layer is extra load on it.
 */
const CATEGORIES = [
    { key: 'charging', label: 'EV charging', filter: '"amenity"="charging_station"', color: '#16a34a' },
    { key: 'drinking_water', label: 'Drinking water', filter: '"amenity"="drinking_water"', color: '#0284c7' },
    { key: 'toilets', label: 'Toilets', filter: '"amenity"="toilets"', color: '#7c3aed' },
    { key: 'bicycle_parking', label: 'Bicycle parking', filter: '"amenity"="bicycle_parking"', color: '#2563eb' },
    { key: 'pharmacy', label: 'Pharmacy', filter: '"amenity"="pharmacy"', color: '#dc2626' },
    { key: 'cafe', label: 'Cafe', filter: '"amenity"="cafe"', color: '#b45309' },
    { key: 'supermarket', label: 'Supermarket', filter: '"shop"="supermarket"', color: '#ca8a04' },
    { key: 'viewpoint', label: 'Viewpoint', filter: '"tourism"="viewpoint"', color: '#0d9488' },
];
let sequence = 0;
let debounceTimer;
plugin.mapHook.onHook(function () {
    const categoryKey = String(plugin.settings.get('category') || 'charging');
    let category = CATEGORIES[0];
    for (let i = 0; i < CATEGORIES.length; i++) {
        if (CATEGORIES[i].key === categoryKey)
            category = CATEGORIES[i];
    }
    const color = String(plugin.settings.get('color') || '') || category.color;
    let minZoom = Number(plugin.settings.get('minZoom'));
    if (isNaN(minZoom) || minZoom < 8 || minZoom > 20)
        minZoom = 14;
    const layer = plugin.mapHook.createMarkerLayer();
    function load(bounds) {
        if (!bounds) {
            layer.clear();
            return;
        }
        // Below this zoom the bounding box covers a whole region and the query gets expensive
        // for Overpass while returning more markers than anyone can read.
        const zoom = plugin.mapHook.getZoom();
        if (typeof zoom === 'number' && zoom < minZoom) {
            layer.clear();
            plugin.log('Zoom in to ' + minZoom + '+ to load ' + category.label.toLowerCase());
            return;
        }
        const requestSequence = ++sequence;
        const bbox = [bounds.south, bounds.west, bounds.north, bounds.east].join(',');
        const query = '[out:json][timeout:25];(' +
            'node[' + category.filter + '](' + bbox + ');' +
            'way[' + category.filter + '](' + bbox + ');' +
            ');out center;';
        plugin
            .fetch('https://overpass-api.de/api/interpreter', { method: 'POST', body: query })
            .then(function (response) {
            if (!response.ok)
                throw new Error('Overpass returned HTTP ' + response.status);
            return response.json();
        })
            .then(function (data) {
            if (requestSequence !== sequence)
                return;
            layer.clear();
            const elements = data.elements || [];
            let drawn = 0;
            for (let i = 0; i < elements.length; i++) {
                const element = elements[i];
                const lat = typeof element.lat === 'number' ? element.lat : element.center && element.center.lat;
                const lon = typeof element.lon === 'number' ? element.lon : element.center && element.center.lon;
                if (typeof lat !== 'number' || typeof lon !== 'number')
                    continue;
                const tags = element.tags || {};
                const name = tags.name || category.label;
                layer.addMarker({
                    id: category.key + '-' + element.type + '-' + i,
                    lat: lat,
                    lng: lon,
                    color: color,
                    popup: name,
                    tooltip: name,
                });
                drawn++;
            }
            plugin.log('Loaded ' + drawn + ' ' + category.label.toLowerCase() + ' markers');
        })
            .catch(function (err) {
            if (requestSequence !== sequence)
                return;
            plugin.error(category.label + ' error:', err instanceof Error ? err.message : String(err));
        });
    }
    function schedule(bounds) {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(function () {
            load(bounds);
        }, 600);
    }
    schedule(plugin.mapHook.getBounds());
    plugin.mapHook.onMoveEnd(schedule);
    plugin.onDispose(function () {
        clearTimeout(debounceTimer);
        sequence++;
    });
});
