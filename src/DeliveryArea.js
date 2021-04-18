import { Map } from 'leaflet/src/map';
import { SVG, Polygon } from 'leaflet/src/layer/vector';
import { LayerGroup } from 'leaflet/src/layer/LayerGroup';
import { GeoJSON } from 'leaflet/src/layer/GeoJSON';

export var DeliveryAreaMap = Map.extend({
  options: {
    maxBoundsViscosity: 0.75,
    renderer: new SVG({ padding: 2 }),
    zoomSnap: 0.5,
    zoomDelta: 0.5
  }
});

export var DeliveryArea = GeoJSON.extend({
  initialize(deliveryZones, options) {
    GeoJSON.prototype.initialize.call(this, deliveryZones, options)
    this.getLayers().forEach((zoneLayer, index) => {
      zoneLayer.on(this.zoneEventHandlers(zoneLayer))
      zoneLayer.setStyle(this.zoneStyle(zoneLayer));
    });
  },
  onAdd(map) {
    LayerGroup.prototype.onAdd.call(this, map);
    map.setMaxBounds(this.getBounds().pad(0.25));
    map.setMinZoom(map.getBoundsZoom(this.getBounds()));
    map.setZoom(map.getMinZoom());
    map.panInsideBounds(this.getBounds());
  },
  zoneEventHandlers(zoneLayer) {
    const stateStyle = (state) => this.zoneStyle(zoneLayer, state)
    return {
      mouseover(event) {
        zoneLayer.setStyle(stateStyle('focused'));
        zoneLayer.bringToFront();
      },
      mouseout(event) {
        zoneLayer.setStyle(stateStyle('normal'));
      },
      click(event) {
        if (zoneLayer._map)
          zoneLayer._map.flyToBounds(zoneLayer.getBounds());
      }
    }
  },
  zoneStyle(zoneLayer, state) {
    return {
      weight: state === 'focused' ? 6 : 3,
      color: zoneLayer.feature.properties.fill,
      fillOpacity: state === 'focused' ? 0.2 : 0.5
    }
  }
});

export var InvertedDeliveryArea = Polygon.extend({
  initialize(internal, options) {
    const bounds = internal.getBounds().pad(1);
    const world = [ bounds.getSouthWest(), bounds.getNorthWest(),
                    bounds.getNorthEast(), bounds.getSouthEast() ];
    const holes = layerPolygons(internal);
    Polygon.prototype.initialize.call(this, [world, ...holes], options);
  }
});

function layerPolygons(layer) {
  if (layer.getLayers)
    return [...layer.getLayers().map(layerPolygons)];
  else if (layer.getLatLngs)
    return [...layer.getLatLngs()]
  else {
    console.warn("layerPolygons: something went wrong", layer);
    return [];
  }
}
