let seq = 0;
let debounce;
plugin.mapHook.onHook(function () {
    const layer = plugin.mapHook.createPolylineLayer();
    function load(bounds) {
        if (!bounds) {
            layer.clear();
            return;
        }
        const requestSeq = ++seq;
        const bbox = [bounds.south, bounds.west, bounds.north, bounds.east].join(',');
        const query = `[out:json][timeout:25];\n(\n  way["railway"](${bbox});\n);\nout geom;`;
        plugin
            .fetch('https://overpass-api.de/api/interpreter', { method: 'POST', body: query })
            .then(function (res) {
            return res.json();
        })
            .then(function (data) {
            if (requestSeq !== seq)
                return;
            layer.clear();
            const elements = data.elements || [];
            for (let i = 0; i < elements.length; i++) {
                const el = elements[i];
                if (el.type !== 'way' || !Array.isArray(el.geometry))
                    continue;
                const path = [];
                for (let j = 0; j < el.geometry.length; j++) {
                    const pt = el.geometry[j];
                    if (typeof pt.lat === 'number' && typeof pt.lon === 'number') {
                        path.push({ lat: pt.lat, lng: pt.lon });
                    }
                }
                if (path.length > 1)
                    layer.addPolyline({ path, color: 'red', weight: 2 });
            }
            plugin.log('Loaded ' + elements.length + ' railway segments');
        })
            .catch(function (e) {
            const message = e instanceof Error ? e.message : String(e);
            plugin.error('Railways error:', message);
        });
    }
    function schedule(bounds) {
        clearTimeout(debounce);
        debounce = setTimeout(function () {
            load(bounds);
        }, 500);
    }
    schedule(plugin.mapHook.getBounds());
    plugin.mapHook.onMoveEnd(schedule);
});
