const path = require('path');
const nodeExternals = require('webpack-node-externals');

module.exports = {
  entry: {
    restaurant_api: ['./restaurant_api.js'],
    branch_api: ['./branch_api.js'],
    menu_api: ['./menu_api.js'],
    item_api: ['./item_api.js']
  },
  target: 'node',
  externals: [nodeExternals()],
  module: {
    loaders: [{
      test: /\.js$/,
      loaders: ['babel-loader'],
      include: __dirname,
      exclude: /node_modules/,
    }]
  },
  output: {
    libraryTarget: 'commonjs',
    path: path.join(__dirname, '.webpack'),
    filename: '[name].js'
  }
};