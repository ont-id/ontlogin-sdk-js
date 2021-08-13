module.exports = {
  entry: './src/index.ts',
  output: {
    filename: 'index.js',
    libraryTarget: 'commonjs2'
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: [
          {
            loader: "babel-loader",
            options: {
              presets: ['@babel/preset-env', '@babel/preset-typescript']
            }
          }
        ]
      }
    ]
  },
  resolve: {
    extensions: ['.ts']
  }
};
