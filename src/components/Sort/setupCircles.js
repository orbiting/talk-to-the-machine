import {
  rgb,
  select,
  event,
  ascending,
  drag
} from 'd3'

export const CIRCLE_PADDING = 50
 
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

export default ({node, x, domain, colorScale, onChange, duration}) => {
  let circleData = []
  
  const render = ({data, radius, onEnd}) => {
    const svg = select(node)
    
    circleData = data.map((label, i) => {
      const d = (
        circleData.find(datum => datum.label === label) ||
        {label}
      )

      d.x = x(i)
      d.y = CIRCLE_PADDING + radius
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
  }
  
  return render
}
