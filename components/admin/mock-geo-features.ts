export const geoFeatures = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: {
        name: "Japan"
      },
      id: "JPN",
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [139.7671248, 35.6811673],
            [139.7671248, 35.6811673],
            [139.7671248, 35.6811673]
          ]
        ]
      }
    },
    {
      type: "Feature",
      properties: {
        name: "United States"
      },
      id: "USA",
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [-77.0364, 38.8951],
            [-77.0364, 38.8951],
            [-77.0364, 38.8951]
          ]
        ]
      }
    }
  ]
} 