module.exports = {
  presets: [
    [
      "next/babel",
      {
        "preset-env": {
          targets: {
            node: "current"
          }
        }
      }
    ]
  ],
  plugins: [
    ["@babel/plugin-proposal-decorators", { legacy: true }],
    "@babel/plugin-transform-class-properties",
    "@babel/plugin-proposal-export-default-from",
    "@babel/plugin-syntax-dynamic-import",
    "@babel/plugin-transform-private-methods",
    "@babel/plugin-transform-private-property-in-object"
  ]
}; 