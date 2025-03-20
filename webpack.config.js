const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const NodePolyfillPlugin = require("node-polyfill-webpack-plugin");
const webpack = require("webpack");

module.exports = {
  mode: "development",
  entry: {
    main: "./public/renderer.tsx",
    login: "./public/loginRender.tsx", 
  },
  target: "electron-renderer", // Set to 'web' for renderer compatibility
  output: {
    filename: "[name].js",
    path: path.resolve(__dirname, "dist"),
    publicPath: "",
  },
  devtool: "source-map",
  resolve: {
    extensions: [".ts", ".tsx", ".js"],
    fallback: {
      global: require.resolve("global"),
      module: require.resolve("module"),
      fs: false,
    },
    alias: {
      jspdf: "jspdf/dist/jspdf.umd.min.js", // Use browser-compatible build
    },
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        use: ["style-loader", "css-loader"],
      },
    ],
  },
  externals: {
    "better-sqlite3": "commonjs better-sqlite3",
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: "./public/index.html",  // Template for the main window
      filename: "index.html",           // Output file name for main window
    }),
    new HtmlWebpackPlugin({
      template: "./public/Login.html",  // Template for the login window
      filename: "Login.html",           // Output file name for login window
    }),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: "public/style.css",
          to: "style.css",  // Ensures CSS file is copied to dist
        },
              
      ],
    }),
    new CopyWebpackPlugin({
      patterns: [
        { from: "public/Images", to: "images" }, 
      ],
    }),
    new NodePolyfillPlugin(),
    new webpack.DefinePlugin({
      global: "globalThis", // Polyfill global
    }),
  ],
  stats: {
    errorDetails: true,
    warningsFilter: [/Critical dependency: require function is used/],
  },
};
