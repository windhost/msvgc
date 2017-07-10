const help = require('./help')
const log = require('./customLogger')

const defaultConfig = {
  pathToFiles: process.cwd(),
  targetPath: process.cwd(),
  reactNative: false,
  typescript: false
}

module.exports = argv => {
  let config = defaultConfig
  // { pathToFiles: './dianji.svg',
  //   targetPath: './',
  //   reactNative: true,
  //   typescript: false }

  if (argv.includes('-h') || argv.includes('--help')) {
    help.show()
    process.exit()
  }

  for (let i = 0; i < argv.length; i += 1) {
    let argument = argv[i]

    switch (argument) {
      case '-f':
      case '--folder': {
        config.pathToFiles = argv[i += 1]
        break
      }
      case '-o':
      case '--output': {
        config.targetPath = argv[i += 1]
        break
      }
      case '--react-native': {
        config.reactNative = true
        break
      }
      case '--typescript': {
        config.typescript = true
        break
      }
      default: {
        log.any('Warn', 'Unknown option', argument)
      }
    }
  }
  return config
}
