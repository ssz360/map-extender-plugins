plugin.mapHook.onHook(function () {
  let opacity = Number(plugin.settings.get('opacity'));
  if (isNaN(opacity) || opacity < 0 || opacity > 1) opacity = 0.8;

  plugin.mapHook.createWmsLayer({
    url: 'https://wms.cartografia.agenziaentrate.gov.it/inspire/wms/ows01.php',
    layers: 'province,CP.CadastralZoning,CP.CadastralParcel,fabbricati,strade,vestizioni,acque',
    format: 'image/png',
    transparent: true,
    opacity: opacity,
    version: '1.1.1',
    srs: 'EPSG:6706',
    tileSize: 512,
  });

  plugin.log('Italy Cadastral overlay attached, opacity:', opacity);
});
