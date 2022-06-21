const { ExternalsPlugin, ContextReplacementPlugin } = require("webpack");
const nodeExternals = require("webpack-node-externals");
const path = require("path");
module.exports = {
  /**
   * This is the main entry point for your application, it's the first file
   * that runs in the main process.
   */
  entry: ["./src/main.js"],
  // Put your normal webpack config below here
  module: {
    rules: require("./webpack.rules"),
  },
  node: {
    __filename: true,
  },
  externals: ["mock-aws-s3", "aws-sdk", "nock", "pg-hstore"],
};
