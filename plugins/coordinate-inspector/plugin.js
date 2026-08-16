const CONTROL_ID = 'coordinate-inspector';
const PANEL = 'font:12px/1.5 ui-monospace,SFMono-Regular,Menlo,monospace;background:#fff;color:#111;' +
    'border:1px solid #d4d4d8;border-radius:6px;padding:8px;box-shadow:0 2px 8px rgba(0,0,0,.15);' +
    'min-width:210px;font-variant-numeric:tabular-nums';
/** Slippy-map tile the coordinate falls in, at the current zoom. */
function tileForLatLng(position, zoom) {
    const n = Math.pow(2, zoom);
    const latRad = (position.lat * Math.PI) / 180;
    const x = Math.floor(((position.lng + 180) / 360) * n);
    const y = Math.floor(((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n);
    return { x: x, y: y };
}
/** Degrees to degrees/minutes/seconds, e.g. 48°08'13.2"N */
function toDms(value, positive, negative) {
    const hemisphere = value >= 0 ? positive : negative;
    const abs = Math.abs(value);
    const degrees = Math.floor(abs);
    const minutesFull = (abs - degrees) * 60;
    const minutes = Math.floor(minutesFull);
    const seconds = ((minutesFull - minutes) * 60).toFixed(1);
    return degrees + '°' + minutes + "'" + seconds + '"' + hemisphere;
}
plugin.mapHook.onHook(function () {
    const decimals = Math.min(8, Math.max(2, Number(plugin.settings.get('decimals')) || 5));
    plugin.mapHook.createControl({
        id: CONTROL_ID,
        position: String(plugin.settings.get('position') || 'bottom-right'),
        html: '<div style="' + PANEL + '">' +
            '<div data-coord-latlng>Move the pointer over the map</div>' +
            '<div data-coord-dms style="color:#71717a"></div>' +
            '<div data-coord-tile style="color:#71717a"></div>' +
            '<div data-coord-hint style="margin-top:4px;color:#71717a">Right-click the map to copy</div>' +
            '</div>',
    });
    const root = document.querySelector('[data-map-control-id="' + CONTROL_ID + '"]');
    if (!root) {
        plugin.error('Coordinate inspector: control markup not found in the page');
        return;
    }
    const latLngOut = root.querySelector('[data-coord-latlng]');
    const dmsOut = root.querySelector('[data-coord-dms]');
    const tileOut = root.querySelector('[data-coord-tile]');
    const hintOut = root.querySelector('[data-coord-hint]');
    function show(position) {
        if (latLngOut) {
            latLngOut.textContent = position.lat.toFixed(decimals) + ', ' + position.lng.toFixed(decimals);
        }
        if (dmsOut) {
            dmsOut.textContent = toDms(position.lat, 'N', 'S') + ' ' + toDms(position.lng, 'E', 'W');
        }
        if (tileOut) {
            const zoom = plugin.mapHook.getZoom();
            if (typeof zoom === 'number') {
                const tile = tileForLatLng(position, Math.round(zoom));
                tileOut.textContent = 'tile ' + Math.round(zoom) + '/' + tile.x + '/' + tile.y;
            }
            else {
                tileOut.textContent = '';
            }
        }
    }
    plugin.mapHook.onMouseMove(show);
    plugin.mapHook.onRightClick(function (position) {
        show(position);
        const text = position.lat.toFixed(decimals) + ', ' + position.lng.toFixed(decimals);
        if (!navigator.clipboard) {
            if (hintOut)
                hintOut.textContent = text;
            return;
        }
        navigator.clipboard
            .writeText(text)
            .then(function () {
            if (hintOut)
                hintOut.textContent = 'Copied ' + text;
        })
            .catch(function () {
            // Some sites block clipboard writes; showing the value still lets the user copy it.
            if (hintOut)
                hintOut.textContent = text;
        });
    });
    plugin.log('Coordinate inspector ready');
});
