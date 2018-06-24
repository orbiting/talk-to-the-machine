import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import { scaleLinear, transition } from 'd3'

let id = 0

class History extends PureComponent {
  constructor (props, ...args) {
    super(props, ...args)

    this.id = id++
    this.setCanvas = (canvas) => {
      this.canvas = canvas
      this.ctx = canvas
        ? canvas.getContext('2d')
        : undefined
    }
    this.enrich = ({ orientation, rowHeight }) => {
      this.oContext = orientation === 'horizontal' ? {
        clearRect: (x, y, width, height) =>
          this.ctx.clearRect(y, x, height, width),
        lineTo: (x, y) =>
          this.ctx.lineTo(y, x),
        moveTo: (x, y) =>
          this.ctx.moveTo(y, x)
      } : {
        clearRect: (...args) => this.ctx.clearRect(...args),
        lineTo: (...args) => this.ctx.lineTo(...args),
        moveTo: (...args) => this.ctx.moveTo(...args)
      }
      this.y = scaleLinear()
        .domain([0, 1])
        .range([0, rowHeight])
    }
    this.enrich(props)
  }
  clipStart (time0, time1) {
    const { ctx, oContext, y } = this
    const { width, isFastUpdate, strokeWidth } = this.props
    const box = [
      [-strokeWidth, time0 ? y(time0) : -strokeWidth],
      [width + strokeWidth, time0 ? y(time0) : -strokeWidth],
      [width + strokeWidth, y(time1) + strokeWidth],
      [-strokeWidth, y(time1) + strokeWidth]
    ]

    ctx.save()
    ctx.beginPath()
    oContext.moveTo(box[0][0], box[0][1])
    oContext.lineTo(box[1][0], box[1][1])
    oContext.lineTo(box[2][0], box[2][1])
    oContext.lineTo(box[3][0], box[3][1])
    ctx.closePath()
    ctx.clip()

    // avoid flicker by skipping rounded if running in fast update state
    if (!isFastUpdate || time0) {
      ctx.lineCap = 'round'
    }
    ctx.lineJoin = 'round'
  }
  clipEnd () {
    this.ctx.restore()
  }
  drawPath(v, i0, i1, t0, t1, t) {
    const { ctx, oContext, y } = this
    const { x, strokeWidth, answer, colorScale } = this.props
    ctx.beginPath()
    oContext.moveTo(x(i0), y(t0))
    if (i0 === i1 || t < 1 / 3) {
      oContext.lineTo(x(i0), y(t0) + (y(t1) - y(t0)) * Math.max(t, 1e-4))
    } else {
      oContext.lineTo(x(i0), y(t0) + (y(t1) - y(t0)) / 3)
      if (t < 2 / 3) {
        oContext.lineTo(x(i0) + (x(i1) - x(i0)) * (t - 1 / 3) * 3, y(t0) + (y(t1) - y(t0)) * t)
      } else {
        oContext.lineTo(x(i1), y(t0) + (y(t1) - y(t0)) * 2 / 3)
        oContext.lineTo(x(i1), y(t0) + (y(t1) - y(t0)) * t)
      }
    }
    ctx.lineWidth = strokeWidth + 2
    ctx.strokeStyle = '#fff'
    ctx.stroke()
    ctx.lineWidth = strokeWidth
    ctx.strokeStyle = colorScale(answer.indexOf(v))
    ctx.stroke()
  }
  next () {
    const { history, width, strokeWidth, duration, time, rowHeight, orientation } = this.props

    const time0 = time
    const time1 = time + 1
    const record0 = history[time0]
    const record1 = history[time1]

    if (!record0 || !record1) {
      return
    }

    if (orientation === 'vertical') {
      this.canvas.style.marginBottom = `-${rowHeight}px`
    }

    const { y } = this
    transition(`History${this.id}`)
      .duration(duration)
      .on('start', () => {
        this.clipStart(time0, time1)
      })
      .tween('path', () => t => {
        this.oContext.clearRect(-strokeWidth, -strokeWidth + y(time0), width + strokeWidth * 2, rowHeight + strokeWidth * 2)
        record0.forEach((d, i) => {
          this.drawPath(d, i, record1.indexOf(d), time0, time1, t)
        })

        if (orientation === 'vertical') {
          this.canvas.style.marginBottom = `-${rowHeight * (1 - t)}px`
        }
      })
      .on('interrupt', () => {
        record0.forEach((d, i) => {
          record0.forEach((d, i) => {
            this.drawPath(d, i, record1.indexOf(d), time0, time1, 1)
          })
        })
        this.clipEnd()
        this.props.onNext && this.props.onNext(time0, time1)
      })
      .on('end', () => {
        this.clipEnd()
        this.props.onNext && this.props.onNext(time0, time1)
      })
  }
  draw () {
    const { history, time, width, rowHeight, strokeWidth, orientation } = this.props

    const dpi = window.devicePixelRatio
    const innerHeight = (history.length - 1) * rowHeight
    if (orientation === 'vertical') {
      this.canvas.height = (innerHeight +  strokeWidth * 2) * dpi
      this.canvas.width = width * dpi
      this.canvas.style.width = width + 'px'
      this.ctx.scale(dpi, dpi)
      this.ctx.translate(0, strokeWidth)
    } else {
      this.canvas.height = width * dpi
      this.canvas.width = (innerHeight +  strokeWidth * 2) * dpi
      this.canvas.style.height = width + 'px'
      this.ctx.scale(dpi, dpi)
      this.ctx.translate(strokeWidth, 0)
    }

    for (let time0 = 0; time0 < time; time0++) {
      const record0 = history[time0]
      const record1 = history[time0 + 1]
      if (!record1) {
        break
      }
      const shouldClip = time0 === 0 || time0 === history.length - 2
      if (shouldClip) {
        this.clipStart(time0, time0 + 1)
      }
      record0.forEach((d, i) => {
        this.drawPath(d, i, record1.indexOf(d), time0, time0 + 1, 1)
      })
      if (shouldClip) {
        this.clipEnd()
      }
    }

    this.next()
  }
  componentWillReceiveProps (nextProps) {
    if (
      nextProps.orientation !== this.props.orientation ||
      nextProps.rowHeight !== this.props.rowHeight
    ) {
      this.enrich(nextProps)
    }
  }
  componentDidMount () {
    this.draw()
  }
  componentDidUpdate () {
    this.draw()
  }
  render () {
    return <canvas ref={this.setCanvas} />
  }
}

History.defaultProps = {
  orientation: 'vertical',
  duration: 400,
  rowHeight: 20,
  strokeWidth: 6
}

History.propTypes = {
  strokeWidth: PropTypes.number.isRequired,
  rowHeight: PropTypes.number.isRequired,
  orientation: PropTypes.oneOf(['vertical', 'horizontal']).isRequired,
  width: PropTypes.number.isRequired,
  duration: PropTypes.number.isRequired,
  history: PropTypes.arrayOf(
    PropTypes.arrayOf(
      PropTypes.number.isRequired
    ).isRequired
  ).isRequired,
  // usually a point scale
  x: PropTypes.func,
  time: PropTypes.number,
  onNext: PropTypes.func,
  colorScale: PropTypes.func
}

export default History
