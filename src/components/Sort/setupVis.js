import {
  scaleLinear, scaleSequential,
  scalePoint,
  interpolateCubehelix, interpolateRainbow,
  hsl
} from 'd3'
import randomWrong from '../../lib/randomWrong'

import setupCircles from './setupCircles'
import setupCanvas from './setupCanvas'

export default ({ width, element, answer: domain, duration, onChange }) => {
  const maxIndex = domain.length - 1
  const colorScale = maxIndex < 9
    ? scaleLinear()
      .interpolate(interpolateCubehelix)
      .domain([0, maxIndex / 2, maxIndex])
      .range([hsl('rgb(24,100,170)'), hsl('#FFB3E8'), hsl('rgb(187,21,26)')])
    : scaleSequential(interpolateRainbow).domain([0, maxIndex * 1.16])
  /* const colorScale = scaleLinear()
    .interpolate(interpolateCubehelix)
    .domain([0, maxIndex / 2, maxIndex]) // maxIndex / 2 - 0.1, maxIndex / 2, maxIndex / 2 + 0.1, 
    .range([hsl('rgb(24,100,170)'), hsl('#FFB3E8'), hsl('rgb(187,21,26)')]) //  hsl('#fff'), hsl('#eee'), hsl('#fff'), */
  
  const x = scalePoint()
    .domain(domain.map((d, i) => i))
    .range([0, width])
    .round(true)
    .padding(2)
  
  const renderCircles = setupCircles({width, x, domain, colorScale, duration, onChange})
  const renderCanvas = setupCanvas({width, x, domain, colorScale, duration, renderCircles})
  
  while (element.firstChild) {
    element.removeChild(element.firstChild)
  }
  element.style = `position: relative; padding-top: ${Math.min(window.innerHeight * 0.8,domain.length * 20 * 2)}px; overflow: hidden;`
  element.appendChild(renderCanvas.node)
  element.appendChild(renderCircles.node)
  
  let history = []
  const record = (nextData) => {
    const previous = history[history.length - 1]
    if (JSON.stringify(previous) === JSON.stringify(nextData)) {
      return
    }
    history.push(nextData.slice())
  }
  const reset = () => {
    let nextData = randomWrong(domain)
    renderCanvas.reset()
    history = [nextData.slice()]
    onChange(nextData)
    return nextData
  }
  
  return {
    render(data) {
      record(data)
      renderCanvas(history)
      renderCircles(data)
      return element
    },
    update(data, onEnd) {
      record(data)
      renderCanvas(history)
      return renderCircles(data, onEnd)
    },
    reset
  }
}
