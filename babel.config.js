module.exports = {
    presets: [
        [
            "@babel/preset-env",
            {
                targets: {
                    node: "current",
                },
                modules: "commonjs",
            },
        ],
        "@babel/preset-typescript",
        ["@babel/preset-react", { runtime: "automatic" }],
    ],
    plugins: [
        "@babel/plugin-transform-runtime",
        ["@babel/plugin-proposal-decorators", { legacy: true }],
        "@babel/plugin-transform-class-properties",
        "@babel/plugin-proposal-export-default-from",
        "@babel/plugin-syntax-dynamic-import",
    ],
};
