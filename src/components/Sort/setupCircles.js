import {
  rgb,
  select,
  event,
  ascending,
  drag
} from 'd3'

export default ({width, x, domain, colorScale, onChange, duration}) => {
  const padding = 50
  const size = Math.max(x.step(), 4)
  const radius = Math.min(30, Math.max(size / 2 - 5, 2))
  const height = padding * 2 + radius * 2
  
  const svgNode = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  svgNode.setAttribute('width', width)
  svgNode.setAttribute('height', height)
  svgNode.style.position = 'relative'

  let circleData = []
  
  function endAll(transition, onEnd) {
    if (!onEnd) {
      return
    }
    let n = transition.size()
    transition.on('end', () => {
      --n
      if (!n) {
        onEnd()
      }
    })
  }
  function textColor(bgColor) {
    const color = rgb(bgColor)
    const yiq = (color.r * 299 + color.g * 587 + color.b * 114) / 1000
    return yiq >= 128 ? 'black' : 'white'
  }
  
  const render = (data, onEnd) => {
    // const rows = Math.ceil(data.length / ((width - padding) / size))
    // const columns = Math.ceil(data.length / rows)
    // const xPad = (width - size * columns) / 2
    // const height = rows * size + padding
    
    
    const svg = select(svgNode)
    svg.attr('width', width)
    svg.attr('height', height)
    svg.attr('viewBox', [0, 0, width, height])
    
    circleData = data.map((label, i) => {
      const d = (
        circleData.find(datum => datum.label === label) ||
        {label}
      )
      // const row = Math.floor(i / columns)
      // d.x = xPad + i % columns * size
      // d.y = padding / 2 + row * size + size / 2
      d.x = x(i)
      d.y = padding + radius
      return d
    })
  
    function dragstarted() {
      select(this).raise().select('circle').attr('stroke', '#000')
    }
    
    function dragged(d, i) {
      d.x = event.x
      d.y = event.y
      select(this).attr('transform', `translate(${[d.x, d.y]})`)
    }
  
    function dragended() {
      select(this).select('circle').attr('stroke', 'none')
      
      //onChange(circleData
      //  .map(d => ({
      //    label: d.label,
      //    x: d.x,
      //    row: Math.max(0, Math.floor((d.y - padding / 2) / size))
      //  }))
      //  .sort((a, b) => ascending(a.row, b.row) || ascending(a.x, b.x))
      //  .map(d => d.label))
      onChange(circleData
        .slice()
        .sort((a, b) => ascending(a.x, b.x))
        .map(d => d.label)
      )
    }
  
    const circles = svg.selectAll('g').data(circleData, d => d.label)
    const newCircles = circles.enter().append('g')
      .attr('transform', d => `translate(${[d.x, d.y]})`)
      .call(drag()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended)
      )
    newCircles.append('circle')
      .attr('r', radius)
      .attr('fill', d => colorScale(domain.indexOf(d.label)))
    newCircles.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '0.3em')
      .attr('fill', d => textColor(colorScale(domain.indexOf(d.label))))
      .style('font-size', Math.min(16, radius))
      .text(radius > 5 ? d => d.label : undefined)
    
    circles.transition()
      .duration(duration)
      .attr('transform', d => `translate(${[d.x, d.y]})`)
      .call(endAll, onEnd)
  
    return svgNode
  }
  render.node = svgNode
  render.height = height
  render.padding = padding
  
  return render
}
