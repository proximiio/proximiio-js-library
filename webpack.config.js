const path = require('path');

module.exports = {
  entry: './src/index.ts',
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  output: {
    path: path.resolve(__dirname, 'lib'),
    filename: 'proximiio.js',
    library: 'Proximiio',
    libraryTarget: 'var',
  },
  mode: 'development',
  optimization: {
    usedExports: true,
  },
};
