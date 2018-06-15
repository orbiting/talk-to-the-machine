module.exports = {
  webpack: (config, { dev }) => {
    config.module.rules.push(
      {
        test: /\.md/,
        use: 'raw-loader'
      }
    )
    return config
  }
}