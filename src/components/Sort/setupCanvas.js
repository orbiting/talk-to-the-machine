import { scaleLinear, transition } from 'd3'

export default ({width, x, domain, colorScale, duration, renderCircles}) => {
  const margin = {top: 20, right: 0, bottom: 10, left: 0}
  const rowHeight = 20
  const strokeWidth = 6

  const bottom = renderCircles.height - renderCircles.padding - rowHeight
  
  const dpi = window.devicePixelRatio
  const canvas = document.createElement('canvas')
  canvas.style.position = 'absolute'
  canvas.style.bottom = `${bottom}px`
  canvas.style.left = '0'
  const context = canvas.getContext('2d')
  
  let innerHeight
  function setCanvasSize(swaps) {
    innerHeight = (swaps.length - 1) * rowHeight
    canvas.width = width * dpi
    canvas.height = (innerHeight +  margin.top + margin.bottom) * dpi
    canvas.style.width = width + 'px'
    context.scale(dpi, dpi)
    context.translate(margin.left, margin.top)
  }
  let time
  function reset() {
    time = 0
    setCanvasSize([]) // setting canvas width/height attr clears
  }
  reset()

  const y = scaleLinear()
    .domain([0, 1])
    .range([0, rowHeight])
  
  context.lineWidth = 6
  context.lineCap = 'round'
  context.lineJoin = 'round'
  
  function drawPath(v, i0, i1, t0, t1, t) {
    context.beginPath()
    context.moveTo(x(i0), y(t0))
    if (i0 === i1 || t < 1 / 3) {
      context.lineTo(x(i0), y(t0) + (y(t1) - y(t0)) * Math.max(t, 1e-4))
    } else {
      context.lineTo(x(i0), y(t0) + (y(t1) - y(t0)) / 3)
      if (t < 2 / 3) {
        context.lineTo(x(i0) + (x(i1) - x(i0)) * (t - 1 / 3) * 3, y(t0) + (y(t1) - y(t0)) * t)
      } else {
        context.lineTo(x(i1), y(t0) + (y(t1) - y(t0)) * 2 / 3)
        context.lineTo(x(i1), y(t0) + (y(t1) - y(t0)) * t)
      }
    }
    context.lineWidth = strokeWidth + 2
    context.strokeStyle = "#fff"
    context.stroke()
    context.lineWidth = strokeWidth
    context.strokeStyle = colorScale(domain.indexOf(v))
    context.stroke()
  }

  function next(history) {
    const record0 = history[time]
    const record1 = history[time + 1]
    if (!record0 || !record1) {
      return
    }
    const time0 = time
    const time1 = ++time

    const box = [
      [-strokeWidth, time0 ? y(time0) : -strokeWidth],
      [width + strokeWidth, time0 ? y(time0) : -strokeWidth],
      [width + strokeWidth, y(time1) + strokeWidth],
      [-strokeWidth, y(time1) + strokeWidth]
    ]
    
    transition()
      .duration(duration)
      .on('start', function() {
        context.save()
        context.beginPath()
        context.moveTo(box[0][0], box[0][1])
        context.lineTo(box[1][0], box[1][1])
        context.lineTo(box[2][0], box[2][1])
        context.lineTo(box[3][0], box[3][1])
        context.closePath()
        context.clip()
      })
      .tween('path', function() {
        return function(t) {
          context.clearRect(-strokeWidth, -strokeWidth, width + strokeWidth * 2, innerHeight + strokeWidth * 2)
          record0.forEach((d, i) => {
            drawPath(d, i, record1.indexOf(d), time0, time1, t)
          })
          canvas.style.bottom = `${bottom + rowHeight * t}px`
        }
      })
      .on('end', function() {
        context.restore()
        next(history)
      })
  }
  function render(history) {
    setCanvasSize(history)
    for (let time0 = 0; time0 < time; time0++) {
      const record0 = history[time0]
      const record1 = history[time0 + 1]
      record0.forEach((d, i) => {
        drawPath(d, i, record1.indexOf(d), time0, time0 + 1, 1)
      })
    }
    next(history)
  }
  render.node = canvas
  render.reset = reset
  
  return render
}