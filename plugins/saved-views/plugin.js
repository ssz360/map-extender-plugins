const CONTROL_ID = 'saved-views';
const STORE_KEY = 'views';
const PANEL = 'font:12px/1.45 system-ui,sans-serif;background:#fff;color:#111;border:1px solid #d4d4d8;' +
    'border-radius:6px;padding:8px;box-shadow:0 2px 8px rgba(0,0,0,.15);min-width:200px';
const BTN = 'font:12px/1 system-ui,sans-serif;padding:5px 9px;border:1px solid #d4d4d8;border-radius:4px;' +
    'background:#f4f4f5;color:#111;cursor:pointer;margin-right:4px';
plugin.mapHook.onHook(function () {
    plugin.mapHook.createControl({
        id: CONTROL_ID,
        position: String(plugin.settings.get('position') || 'bottom-left'),
        html: '<div style="' + PANEL + '">' +
            '<div style="font-weight:600;margin-bottom:6px">Saved views</div>' +
            '<select data-views-list style="width:100%;margin-bottom:6px;font:12px system-ui,sans-serif;padding:4px"></select>' +
            '<div>' +
            '<button type="button" data-views-go style="' + BTN + '">Go</button>' +
            '<button type="button" data-views-save style="' + BTN + '">Save…</button>' +
            '<button type="button" data-views-delete style="' + BTN + '">Delete</button>' +
            '</div>' +
            '<div data-views-status style="margin-top:6px;color:#71717a"></div>' +
            '</div>',
    });
    const root = document.querySelector('[data-map-control-id="' + CONTROL_ID + '"]');
    if (!root) {
        plugin.error('Saved views: control markup not found in the page');
        return;
    }
    const list = root.querySelector('[data-views-list]');
    const status = root.querySelector('[data-views-status]');
    let views = [];
    function setStatus(text) {
        if (status)
            status.textContent = text;
    }
    function renderList() {
        if (!list)
            return;
        list.innerHTML = '';
        if (views.length === 0) {
            const option = document.createElement('option');
            option.textContent = 'No saved views yet';
            option.value = '';
            list.appendChild(option);
            return;
        }
        for (let i = 0; i < views.length; i++) {
            const option = document.createElement('option');
            option.value = String(i);
            option.textContent = views[i].name + '  (z' + views[i].zoom + ')';
            list.appendChild(option);
        }
    }
    function persist() {
        return plugin.store.set(STORE_KEY, views).catch(function (err) {
            plugin.error('Saved views: could not save —', err instanceof Error ? err.message : String(err));
        });
    }
    plugin.store
        .get(STORE_KEY)
        .then(function (stored) {
        if (Array.isArray(stored))
            views = stored;
        renderList();
        setStatus(views.length + ' saved');
    })
        .catch(function (err) {
        plugin.error('Saved views: could not load —', err instanceof Error ? err.message : String(err));
        renderList();
    });
    const goButton = root.querySelector('[data-views-go]');
    const saveButton = root.querySelector('[data-views-save]');
    const deleteButton = root.querySelector('[data-views-delete]');
    if (goButton) {
        goButton.addEventListener('click', function () {
            if (!list || !list.value)
                return;
            const view = views[Number(list.value)];
            if (!view)
                return;
            plugin.mapHook.setView({ lat: view.lat, lng: view.lng }, view.zoom);
            setStatus('Moved to ' + view.name);
        });
    }
    if (saveButton) {
        saveButton.addEventListener('click', function () {
            const center = plugin.mapHook.getCenter();
            if (!center) {
                setStatus('The map has no centre yet');
                return;
            }
            const zoom = plugin.mapHook.getZoom();
            const suggested = 'View ' + (views.length + 1);
            const name = window.prompt('Name this view', suggested);
            if (!name)
                return;
            views.push({
                name: name,
                lat: center.lat,
                lng: center.lng,
                zoom: typeof zoom === 'number' ? Math.round(zoom) : 14,
            });
            renderList();
            setStatus(views.length + ' saved');
            void persist();
        });
    }
    if (deleteButton) {
        deleteButton.addEventListener('click', function () {
            if (!list || !list.value)
                return;
            const index = Number(list.value);
            if (!views[index])
                return;
            const removed = views.splice(index, 1)[0];
            renderList();
            setStatus('Deleted ' + removed.name);
            void persist();
        });
    }
    plugin.log('Saved views ready');
});
