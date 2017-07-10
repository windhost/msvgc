const path = require('path')
const fs = require('fs')
const SVGO = require('svgo')
const log = require('./customLogger')
const strings = require('./strings')
const renderMarkup = require('./renderMarkup')
const writeComponentsFile = require('./writeComponentsFile')
const optimizer = new SVGO()

const isPathValid = (pathString, type) => {
  let stats

  // If path is relative
  if (pathString[0] === '.' || pathString !== '/') {
    // 解析为绝对路径
    pathString = path.resolve(process.cwd(), pathString) // cwd 当前进城工作目录
    // path.resolve('/Users/wind/Desktop/version/akita/app/img', './dianji.svg'')
    //   /Users/wind/Desktop/version/akita/app/img/dianji.svg
  }

  try {
    // Stats {
    //   dev: 16777221,
    //     mode: 16877,
    //     nlink: 12,
    //     uid: 501,
    //     gid: 20,
    //     rdev: 0,
    //     blksize: 4096,
    //     ino: 30175786,
    //     size: 408,
    //     blocks: 0,
    //     atimeMs: 1499410476000,
    //     mtimeMs: 1499405291000,
    //     ctimeMs: 1499405291000,
    //     birthtimeMs: 1483508532000,
    //     atime: 2017-07-07T06:54:36.000Z,
    //     mtime: 2017-07-07T05:28:11.000Z,
    //     ctime: 2017-07-07T05:28:11.000Z,
    //     birthtime: 2017-01-04T05:42:12.000Z }
    stats = fs.lstatSync(pathString)
  } catch (error) {
    return false
  }

  if (type === 'directory') {
    return stats.isDirectory()
  } else if (type === 'file') {
    return stats.isFile()
  } else if (type === 'any') {
    return stats.isDirectory() || stats.isFile()
  } else {
    return false
  }
}

/**
 * Function to generate strings, which will be used in components file creating
 * @param {Array<Object>} filesTexts - array of object, consisting of svg file name and source
 * @param {Object}        config     - object with command settings
 * @return {Void}
 */
function generateComponentsStrings (filesTexts, config) {
  filesTexts.forEach(svg => {
    let reactImportString
    let svgLibImportString
    let componentDeclarationString
    let endOfDeclaration
    let markup
    let exportingString

    if (config.typescript) {
      reactImportString = strings.import.reactOnTypescript()
    } else {
      reactImportString = strings.import.react()
    }

    componentDeclarationString = strings.componentDeclaration(svg.filename)

    markup = renderMarkup(svg.source, config)
  // filesTexts.push({
  //   filename: filename,
  //   source: res.data
  // })
    if (config.reactNative) {
      let usedTags = []
      markup.usedTags.forEach(tag => usedTags.push(tag))
      svgLibImportString = strings.import.reactNaiveSvg(usedTags)
    } else {
      svgLibImportString = ''
    }

    endOfDeclaration = strings.endOfDeclaration()

    exportingString = strings.exportingString(svg.filename)

    writeComponentsFile({
      reactImportString: reactImportString,
      svgLibImportString: svgLibImportString,
      componentDeclarationString: componentDeclarationString,
      markup: markup.outputString,
      endOfDeclaration: endOfDeclaration,
      exportingString: exportingString
    }, svg.filename, config)
  })
}

function optimizeSources (svgSources, config) {
  // /Users/wind/Desktop/version/akita/app/img/dianji.svg
  let filesTexts = []
  svgSources.forEach(content => {
    fs.readFile(content, 'utf8', (err, data) => {
      if (err) {
        log.error(err)
      }

      optimizer.optimize(data, res => {
        let filename = path.win32.basename(content, '.svg') // dianji
        filename = filename[0].toUpperCase() + filename.slice(1)
        filesTexts.push({
          filename: filename,
          source: res.data
        })

        if (filesTexts.length === svgSources.length) {
          generateComponentsStrings(filesTexts, config)
        }
      })
    })
  })
}

module.exports = config => {
  let svgSources = []

  if (!isPathValid(config.pathToFiles, 'any')) {
    log.error('\nmsvgc --folder [pathToFiles], path to directory with .svg files or concrete file\n')
    process.exit(1)
  } else if (isPathValid(config.pathToFiles, 'directory')) {
    const dirContent = fs.readdirSync(config.pathToFiles) // 同步 readdir().返回文件数组列表
      // [ '.DS_Store',
      // 'banner1.jpg',
      // 'banner2.jpg',
      // 'banner3.jpg',
      // 'banner4.jpg',
      // 'dianji.svg',
      // 'empty.png',
      // 'fingerprint.png',
      // 'mobile212.svg',
      // 'svg' ]
    dirContent.forEach(content => {
      let filePath = path.resolve(config.pathToFiles, content)

      if (isPathValid(filePath, 'file') && path.extname(filePath) === '.svg') {
        svgSources.push(filePath)
      }
    })
  } else if (path.extname(config.pathToFiles) === '.svg') {
    svgSources.push(config.pathToFiles)
  }

  if (!isPathValid(config.targetPath, 'directory')) {
    log.error('\nmsvgc --output [targetPath], path must be path to folder\n')
    process.exit(1)
  }

  optimizeSources(svgSources, config)
}
