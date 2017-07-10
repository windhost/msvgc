const generateComponents = require('./lib/generateComponents')
const generateConfig = require('./lib/generateConfig');

// Entry point
(() => {
  const argv = process.argv.slice(2)
    // [ '/Users/wind/.nvm/versions/node/v8.1.2/bin/node',
    // '/Users/wind/.nvm/versions/node/v8.1.2/bin/msvgc',
    // '--react-native',
    // '-f',
    // './dianji.svg',
    // '-o',
    // './' ]
  const config = generateConfig(argv)

  if (config.error) {
    process.end(1)
  }

  generateComponents(config)
})()
