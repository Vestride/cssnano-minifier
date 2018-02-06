const path = require('path');

module.exports = {
  devtool: 'cheap-source-map',
  entry: './src/app.ts',
  output: {
    path: path.resolve(path.join(__dirname, './public')),
    filename: 'js/[name].js',
    chunkFilename: 'js/[name].js',
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loader: 'ts-loader',
      },
    ],
  },
};
