const Parser = require('xmldom').DOMParser
const fs = require('fs')

const enabledTags = [
  'svg',
  'circle',
  'ellipse',
  'g',
  'linearGradient',
  'radialGradient',
  'line',
  'path',
  'polygon',
  'polyline',
  'rect',
  'symbol',
  'text',
  'use',
  'defs',
  'stop',
]

let usedTags = new Set()

function forEach (context, callback) {
  return [].forEach.call(context, callback)
}

function map (context, callback) {
  return [].map.call(context, callback)
}

function filter (context, callback) {
  return [].filter.call(context, callback)
}

function iterateMarkup (markup, config) {
  let tagName = markup.nodeName

  if (enabledTags.indexOf(tagName) === -1 && tagName !== 'style' ) {
    return ''
  }

  let attrs = []

  if (tagName === 'svg') {
    let viewBox = markup.attributes ? filter(markup.attributes, attr => attr.name === 'viewBox')[0] : false
    viewBox = viewBox ? viewBox.value.split(' ') : false

    attrs.push({
      name: 'width',
      value: viewBox ? `{props.width || ${viewBox[2]}}` : `{props.width}`
    })
    attrs.push({
      name: 'height',
      value: viewBox ? `{props.height || ${viewBox[3]}}` : `{props.height}`
    })
    attrs.push({
      name: 'viewBox',
      value: viewBox ? `\"${viewBox.join(' ')}\"` : '0 0 50 50'
    })
  } else {
    forEach(markup.attributes, attr => {
      attrs.push({
        name: attr.name,
        value: `\"${attr.value}\"`
      })
    })
  }

  if (config.reactNative) {
    tagName = tagName[0].toUpperCase() + tagName.slice(1)
    if (tagName !== 'Svg') {
      usedTags.add(tagName)
    }
  }

  if (tagName == 'Style') {
    return `\n  <${tagName} ${map(attrs, attr => `${attr.name}=${attr.value}`).join(' ')}>${
      markup.childNodes[0].data}</${tagName}>`
  } else {
    return `<${tagName} ${map(attrs, attr => `${attr.name}=${attr.value}`).join(' ')}>${
      markup.childNodes.length ? map(markup.childNodes, child => iterateMarkup(child, config)).join('\n  ') : ''
      }</${tagName}>`
  }

}

module.exports = (svgString, config) => {
  let markup = (new Parser()).parseFromString(svgString, 'image/svg+xml')
  // console.log(markup.childNodes[0])
//   fs.writeFile('./svg/a.js', JSON.stringify(markup), (err) => {
//     if (err) {
//       console.log(err)
//     }
// })


  const outputString = `${iterateMarkup(markup.childNodes[0], config)}`
  //console.log(markup.childNodes[0].childNodes[0])
  //console.log(outputString)
  return {
    outputString: outputString,
    usedTags: usedTags
  }
}
