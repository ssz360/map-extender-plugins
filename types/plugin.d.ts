/**
 * Ambient declaration of the `plugin` global available inside every plugin.js.
 *
 * Plugins are plain JavaScript — this file exists so editors give completion and so a plugin can
 * opt into checking with `// @ts-check` at the top of plugin.js. It is never shipped.
 *
 * This is the reference for what a plugin may call. It tracks the API the extension exposes; if
 * the extension adds a capability and this file has not caught up, open an issue.
 */

interface MapLatLng {
  lat: number
  lng: number
}

interface MapBounds {
  south: number
  west: number
  north: number
  east: number
}

type ControlPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'

interface FeatureLayer<TAdd> {
  update(id: string, options: Record<string, unknown>): void
  on(
    eventType: 'click' | 'doubleClick' | 'rightClick' | 'mouseOver' | 'mouseOut',
    id: string,
    handler: (event: MapLatLng & { id: string }) => void,
  ): () => void
  remove(id: string): void
  clear(): void
  dispose(): void
  add: TAdd
}

interface MarkerLayer {
  addMarker(options: {
    id?: string
    lat: number
    lng: number
    color?: string
    popup?: string
    tooltip?: string
    title?: string
    iconUrl?: string
    size?: number
    opacity?: number
  }): void
  update(id: string, options: Record<string, unknown>): void
  on(eventType: string, id: string, handler: (event: unknown) => void): () => void
  remove(id: string): void
  clear(): void
  dispose(): void
}

interface PolylineLayer {
  addPolyline(options: {
    id?: string
    path: MapLatLng[]
    color?: string
    weight?: number
    opacity?: number
  }): void
  update(id: string, options: Record<string, unknown>): void
  on(eventType: string, id: string, handler: (event: unknown) => void): () => void
  remove(id: string): void
  clear(): void
  dispose(): void
}

interface ShapeLayer {
  addPolygon?(options: Record<string, unknown>): void
  addCircle?(options: Record<string, unknown>): void
  addRectangle?(options: Record<string, unknown>): void
  update(id: string, options: Record<string, unknown>): void
  on(eventType: string, id: string, handler: (event: unknown) => void): () => void
  remove(id: string): void
  clear(): void
  dispose(): void
}

interface OpacityLayer {
  setOpacity(opacity: number): void
  dispose(): void
}

interface GeoJsonLayer {
  addGeoJson(geoJson: Record<string, unknown>): void
  clear(): void
  dispose(): void
}

interface ControlHandle {
  dispose(): void
}

interface MapHook {
  onHook(cb: () => void): void
  isHooked(): boolean
  getMapType(): string | null
  getBounds(): MapBounds | null
  getCenter(): MapLatLng | null
  getZoom(): number | null
  setView(center: MapLatLng, zoom?: number): void
  setCenter(center: MapLatLng): void
  setZoom(zoom: number): void
  panTo(center: MapLatLng): void
  panBy(point: { x: number; y: number }): void
  fitBounds(bounds: MapBounds): void
  getContainerSize(): { width: number; height: number } | null
  latLngToContainerPoint(latLng: MapLatLng): { x: number; y: number } | null
  containerPointToLatLng(point: { x: number; y: number }): MapLatLng | null

  onClick(cb: (e: MapLatLng) => void): () => void
  onDoubleClick(cb: (e: MapLatLng) => void): () => void
  onRightClick(cb: (e: MapLatLng) => void): () => void
  onMouseDown(cb: (e: MapLatLng) => void): () => void
  onMouseUp(cb: (e: MapLatLng) => void): () => void
  onMouseMove(cb: (e: MapLatLng) => void): () => void
  onDragStart(cb: () => void): () => void
  onDrag(cb: () => void): () => void
  onDragEnd(cb: () => void): () => void
  onZoomStart(cb: () => void): () => void
  onZoomEnd(cb: () => void): () => void
  onResize(cb: () => void): () => void
  onBoundsChanged(cb: (bounds: MapBounds | null) => void): () => void
  onMoveEnd(cb: (bounds: MapBounds | null) => void): () => void

  createMarkerLayer(): MarkerLayer
  createPolylineLayer(): PolylineLayer
  createPolygonLayer(): ShapeLayer
  createCircleLayer(): ShapeLayer
  createRectangleLayer(): ShapeLayer
  createGeoJsonLayer(): GeoJsonLayer
  createTileLayer(options: {
    urlTemplate: string
    attribution?: string
    opacity?: number
    tileSize?: number
    minZoom?: number
    maxZoom?: number
  }): OpacityLayer
  createWmsLayer(options: Record<string, unknown>): OpacityLayer
  createImageOverlay(options: Record<string, unknown>): OpacityLayer
  createControl(options: { id?: string; position?: ControlPosition; html: string }): ControlHandle
}

interface PluginApi {
  pluginId: string
  log(...args: unknown[]): void
  warn(...args: unknown[]): void
  error(...args: unknown[]): void
  /** Cleanup for anything that is not a layer or a map subscription. */
  onDispose(cb: () => void): void
  onPageLoad(cb: () => void): void
  onUrlChange(cb: (url: string) => void): () => void
  onElementAppear(selector: string, cb: (el: Element) => void): () => void
  waitForElement(selector: string, timeoutMs?: number): Promise<Element>
  settings: {
    get(key: string): string | number | boolean | undefined
    getAll(): Record<string, string | number | boolean>
  }
  store: {
    get(key: string): Promise<unknown>
    set(key: string, value: unknown): Promise<void>
    remove(key: string): Promise<void>
  }
  fetch(
    url: string,
    init?: { method?: string; headers?: Record<string, string>; body?: string },
  ): Promise<{
    ok: boolean
    status: number
    text(): Promise<string>
    json<T = unknown>(): Promise<T>
  }>
  mapHook: MapHook
}

declare const plugin: PluginApi
