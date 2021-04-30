const config = {
  presets: [
    [
      '@babel/env',
      {
        targets: {
          node: '10'
        }
      }
    ]
  ]
};

module.exports = config;
