import tf from '@tensorflow/tfjs'

import {
  line as d3Line,
  event as d3Event,
  curveBasis,
  select,
  drag
} from 'd3'

export function createResult({model}) {
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')
  
  const size = 28
  canvas.width = size
  canvas.height = size
  // canvas.style.border = '1px solid black'
  
  // const resultText = document.createTextNode(' ')
  
  // const div = document.createElement('div')
  // div.appendChild(canvas)
  // div.appendChild(document.createTextNode(' '))
  // div.appendChild(resultText)
  
  // const numberFormat = d3.format('.1f')
  
  const models = model.layers.map(layer => tf.model({name: `inspect-${layer.name}`, inputs: model.inputs, outputs: layer.output}))
  
  return {
    read(inputCanvas) {
      context.clearRect(0, 0, size, size)
      context.beginPath()
      context.rect(0, 0, size, size)
      context.fillStyle = '#fff'
      context.fill()
      
      // center draw
      let {x1: sx, y1: sy, width: sw, height: sh} = getBounds(inputCanvas)
      if (sw > sh) {
        sy -= (sw - sh) / 2
        sh = sw
      }
      if (sh > sw) {
        sx -= (sh - sw) / 2
        sw = sh
      }
      context.drawImage(
        inputCanvas,
        sx, sy, sw, sh,
        4, 4, size - 8, size - 8
      )
      
      const imgData = context.getImageData(0, 0, size, size)
      const data = imgData.data
  
      // invert
      for(let i = 0; i < imgData.data.length; i += 4) {
        imgData.data[i] = 255 - imgData.data[i]
        imgData.data[i + 1] = 255 - imgData.data[i + 1]
        imgData.data[i + 2] = 255 - imgData.data[i + 2]
      }
      
      return tf.tidy(() => {
        const image = tf.fromPixels(imgData, 1)

        const reshaped = image.reshape([1, 28, 28, 1])
        const casted = tf.cast(reshaped, 'float32')

        // const output = model.predict(casted)
        
        return [casted].concat(models.map(m => {
          return m.predict(casted)
        }))
      })
    }
  }
}

function getBounds(canvas) {
  const { width: w, height: h } = canvas
  const context = canvas.getContext('2d')
  const imageData = context.getImageData(0, 0, w, h)
  const buffer = imageData.data
  
  let x1 = w
  let y1 = h
  let x2 = 0
  let y2 = 0

  // get left edge
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (buffer[(x + y * w) * 4 + 3] > 0) {
        if (x < x1) x1 = x
      }
    }
  }
  
  // get right edge
  for (let y = 0; y < h; y++) {
    for (let x = w; x >= 0; x--) {
      if (buffer[(x + y * w) * 4 + 3] > 0) {
        if (x > x2) x2 = x
      }
    }
  }
  
  // get top edge
  for (let x = 0; x < w; x++) {
    for (let y = 0; y < h; y++) {
      if (buffer[(x + y * w) * 4 + 3] > 0) {
        if (y < y1) y1 = y
      }
    }
  }
  
  // get bottom edge
  for (let x = 0; x < w; x++) {
    for (let y = h; y >= 0; y--) {
      if (buffer[(x + y * w) * 4 + 3] > 0) {
        if (y > y2) y2 = y
      }
    }
  }
  const width = x2 - x1
  const height = y2 - y1
  return {x1, y1, x2, y2, width, height}
}

export function createInput({ onDraw, onClear }) {
  const dpi = window.devicePixelRatio
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')
  
  const size = 200
  canvas.width = size * dpi
  canvas.height = size * dpi
  canvas.style.width = size + 'px'
  canvas.style.border = '1px solid black'
  context.scale(dpi, dpi)
  
  let paths = []
  
  const line = d3Line()
    .curve(curveBasis)
    .context(context)

  function draw() {
    context.clearRect(0, 0, size, size)
    context.beginPath()
    context.lineCap = 'round'
    paths.forEach(path => {
      line(path)
    })
    context.lineWidth = 10
    context.stroke()
  }
  function dragstarted() {
    const d = d3Event.subject
    let x0 = d3Event.x
    let y0 = d3Event.y
    paths.push(d)
  
    d3Event.on('drag', function() {
      var x1 = d3Event.x,
          y1 = d3Event.y,
          dx = x1 - x0,
          dy = y1 - y0;
  
      if (dx * dx + dy * dy > 100) d.push([x0 = x1, y0 = y1])
      else d[d.length - 1] = [x1, y1]
      draw()
      onDraw && onDraw(canvas)
    })
  }
  select(canvas).call(drag()
    .container(function() { return this })
    .subject(function() { var p = [d3Event.x, d3Event.y]; return [p, p]; })
    .on("start", dragstarted)
  )
  
  return {
    canvas,
    clear() {
      paths = []
      draw()
      onClear()
    },
    read() {
      return context.getImageData(0, 0, size * dpi, size * dpi)
    }
  }
}
