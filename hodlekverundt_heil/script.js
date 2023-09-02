import { gpx } from "https://unpkg.com/@tmcw/togeojson?module";

import EsriMap from "esri/Map.js";
import SceneView from "esri/views/SceneView.js";
import ElevationProfile from "esri/widgets/ElevationProfile.js";
import LayerList from "esri/widgets/LayerList.js";
import FeatureLayer from "esri/layers/FeatureLayer.js";
import { LineSymbol3D, LineSymbol3DLayer, PointSymbol3D, IconSymbol3DLayer } from "esri/symbols.js";
import { Polyline, Point } from "esri/geometry.js";
import ElevationProfileLineInput from "esri/widgets/ElevationProfile/ElevationProfileLineInput.js";
import Graphic from "esri/Graphic.js";
import GraphicsLayer from "esri/layers/GraphicsLayer.js";

const map = new EsriMap({
  basemap: "satellite",
  ground: "world-elevation",
});

const view = new SceneView({
  map: map,
  container: "viewDiv",
  qualityProfile: "high",
  camera: {
    position: [
      7.0327145,
      61.2920237,
      2000.99619
    ],
    heading: 270.07,
    tilt: 69.62
  },
  environment: {
    atmosphere: { quality: "high" },
  },
  ui: {
    components: ["attribution"],
  },
  popup: {
    defaultPopupTemplateEnabled: true
  }
});

const elevationProfile = new ElevationProfile({
  view,
  profiles: [
    new ElevationProfileLineInput({ color: [245, 203, 66], title: "Hodlekve rundt fulldistanse" }),
  ],
  visibleElements: {
    selectButton: false,
    sketchButton: false,
    settingsButton: false,
  },
});

view.ui.add(elevationProfile, "top-right");

(async () => {
  // read the gpx file and convert it to geojson
  const response = await fetch("./hodlekve_rundt_modifisert.gpx");
  const gpxcontent = await response.text();
  const geojson = gpx(new DOMParser().parseFromString(gpxcontent, "text/xml"));
  const coordinates = geojson.features[0].geometry.coordinates;

  // add the track as an input for the ElevationProfile widget
  const geometry = new Polyline({
    paths: [coordinates],
    hasZ: true
  });
  elevationProfile.input = new Graphic({ geometry: geometry });

  // add the bike track layer
  const bikeTrackLayer = new GraphicsLayer({
    elevationInfo: {
      mode: "relative-to-ground",
      featureExpressionInfo: {
        expression: "5"
      }
    },
    listMode: "hide",
    copyright: ""
  });

  const bikeTrack = new Graphic({
    geometry: geometry,
    symbol: new LineSymbol3D({
      symbolLayers: [new LineSymbol3DLayer({
        material: { color: [245, 203, 66] },
        size: 3
      })]
    })
  });
  bikeTrackLayer.add(bikeTrack);


  // create a point layer showing the start and the end points of the track
  const start = coordinates[0];
  const startPoint = {
    geometry: new Point({
      x: start[0],
      y: start[1],
      z: start[2]
    }),
    attributes: {
      ObjectID: 1,
      type: "start"
    }

  };
  const end = coordinates[coordinates.length - 1];
  const endPoint = {
    geometry: new Point({
      x: end[0],
      y: end[1],
      z: end[2]
    }),
    attributes: {
      ObjectID: 2,
      type: "end"
    }
  };
  
 const kambaFjell = {
    geometry: new Point({
      x: 6.9293104,
      y: 61.2993389,
      z: 1214
    }),
    attributes: {
      ObjectID: 3,
      type: "kambafjell"
    }
  };
  
   const helleBerg = {
    geometry: new Point({
      x: 6.9412095,
      y: 61.2679821,
      z: 988
    }),
    attributes: {
      ObjectID: 4,
      type: "helleberg"
    }
  };
  
   const drikke = {
    geometry: new Point({
      x: 6.9600784,
      y: 61.2881388,
      z: 665
    }),
    attributes: {
      ObjectID: 5,
      type: "drikke"
    }
  };

  const pointsLayer = new FeatureLayer({
    source: [startPoint, endPoint, kambaFjell, helleBerg, drikke],
    objectIdField: "ObjectID",
    title: "Interessepunkter",
    fields: [{
      name: "ObjectID",
      alias: "ObjectID",
      type: "oid"
    }, {
      name: "type",
      alias: "type",
      type: "string"
    }],
    renderer: {
      type: "unique-value",
      field: "type",
      uniqueValueInfos: [{
        value: "start",
        symbol: getPointSymbol([108, 235, 184]),
        label: "Start"
      }, {
        value: "end",
        symbol: getPointSymbol([168, 8, 8]),
        label: "Mål"
      }, {
        value: "kambafjell",
        symbol: getPointSymbol([0, 42, 255]),
        label: "Mellomtid"
      }, {
        value: "helleberg",
        symbol: getPointSymbol([0, 42, 255]),
        label: "Mellomtid"
      }, {
        value: "drikke",
        symbol: getPointSymbol([255, 255, 0]),
        label: "Drikkestasjon"
      }],
      legendOptions: {
        title: " "
      }
    }
  });

  map.addMany([bikeTrackLayer, pointsLayer]);

  const layerList = new LayerList({
    view: view,
    // display the legend of the layers in the layer list
    listItemCreatedFunction: function(event){
      const item = event.item;
      if (item.layer.title === "Bicycle track visualized by heart rate") {
        item.watch("visible", function(value) {
          bikeTrackLayer.visible = !value;
        });
      }
      item.panel = {
        content: "legend"
      };
    }
  });

  view.ui.add(layerList, "top-right");

})();


function getPointSymbol(color) {
  return new PointSymbol3D({
    symbolLayers: [new IconSymbol3DLayer({
      resource: { primitive: "circle"},
      material: { color: color },
      outline: {
        color: [255, 255, 255, 1],
        size: 1.5
      },
      size: 10
    })],
    verticalOffset: {
      screenLength: 40,
      maxWorldLength: 200,
      minWorldLength: 20
    },
    callout: {
      type: "line",
      size: 1.5,
      color: [255, 255, 255, 1],
      border: {
        color: [0, 0, 0, 0]
      }
    }
  });
}
