import tf from '@tensorflow/tfjs'
import debounce from 'lodash.debounce'

import {
  fontFamilies
} from '@project-r/styleguide'

import {
  max,
  scaleSqrt,
  scaleLinear,
  scaleSequential,
  scalePoint,
  interpolatePiYG,
  range,
  line as d3Line,
  // curveBundle,
  linkHorizontal
} from 'd3'

const HIDDEN_CONNECTIONS = []
const DRAW_RESULT = true

const blockDpi = 2

function createVis({ canvas, width }) {
  const dpi = window.devicePixelRatio
  const context = canvas.getContext('2d')
  
  const canvasWidth = Math.max(width, 830)
  const height = canvasWidth * 0.5

  canvas.width = canvasWidth * dpi
  canvas.height = height * dpi
  canvas.style.width = canvasWidth + 'px'
  context.scale(dpi, dpi)
  
  // const bundledLine = d3Line()
  //   .curve(curveBundle.beta(1.3))
  //   .context(context)
  const link = linkHorizontal()
    .context(context)
    .source(d => d[0])
    .target(d => d[1])

  let layersWithCords = []
  function drawTopology(topology) {
    context.clearRect(0, 0, canvasWidth, height)
    const sizeScale = scaleSqrt()
      .domain([1, max(topology, d => d.outSize)])
      .range([4, 40])
    
    let xCursor = 0
    const opacityScale = scaleLinear()
      .domain([-1, 1])
      .range([0.001, 0.04])
    
    const piyg = scaleSequential(interpolatePiYG)
      .domain([-0.15, 0.15])
    
    layersWithCords = topology.map((layer, i) => {
      const nodeIndexes = range(layer.nodes)
      
      xCursor += 20
      
      const yScale = scalePoint()
        .domain(nodeIndexes)
        .rangeRound([0, height])
        .padding(1)
      const size = sizeScale(layer.outSize)

      let weights
      if (layer.weights) {
        if (layer.weights[0].length > 1) {
          xCursor += 30
        }
        const baseWX = xCursor
        weights = layer.weights.map((nodeWeights, i) => {
          const y = yScale(i)
          const blockSize = Math.sqrt(nodeWeights[0].length)
          const actualSize = blockSize * blockDpi
          let wx = baseWX
          let wy = y - actualSize / 2

          const pad = 3
          return nodeWeights.map(weights => {
            const block = {
              baseWX,
              size: blockSize,
              data: weights,
              cx: wx + actualSize / 2,
              cy: wy + actualSize / 2,
              x: wx,
              y: wy
            }
            wx += blockSize * blockDpi + pad
            
            return block
          })
        })

        xCursor = max(weights.reduce(
          (all, blocks) => all.concat(blocks.map(block => block.x + block.size * blockDpi)),
          []
        )) + 20
      }
      
      xCursor += size / 2
      const x = xCursor
      
      const nodes = nodeIndexes.map((node, i) => {
        const y = yScale(node)
  
        return {
          x,
          y
        }
      })
      xCursor += size + 20
      
      return {
        data: layer,
        x,
        size,
        nodes,
        weights
      }
    })

    layersWithCords.forEach((layer, i, all) => {
      const prev = all[i - 1]

      if (layer.data.bias) {
        context.globalAlpha = 1
        layer.nodes.forEach(({ y }, i) => {
          context.fillStyle = piyg(layer.data.bias[i])
          context.fillRect(layer.x + layer.size / 2, y - layer.size / 2, 4, layer.size)
        })
      }

      if (prev && !HIDDEN_CONNECTIONS.includes(layer.data.name)) {
        const sourceX = prev.x
        if (layer.weights) {
          context.strokeStyle = '#000'
          layer.weights.forEach((nodeWeights, i) => {
            const node = layer.nodes[i]
            nodeWeights.forEach((block, i) => {
              const prevNode = prev.nodes[i]
              const targetX = block.x
              const targetY = block.y
              const blockCenter = [block.cx, block.cy]
              context.globalAlpha = nodeWeights.length > 1 ? 0.07 : 0.2
              context.beginPath()
              // if (nodeWeights.length > 1) {
              //   bundledLine([
              //     [sourceX + prev.size / 2, prevNode.y],
              //     [block.baseWX - 20, node.y],
              //     blockCenter
              //   ])
              // } else {
              link([
                [sourceX, prevNode.y],
                blockCenter
              ])
              // }
              context.stroke()
              context.globalAlpha = nodeWeights.length > 1 ? 0.1 : 0.2
              context.beginPath()
              link([
                blockCenter,
                [layer.x - layer.size / 2, node.y]
              ])
              context.stroke()
            })
          })
        } else {
          context.globalAlpha = 0.2
          if (layer.nodes.length === prev.nodes.length) {
            layer.nodes.forEach((node, i) => {
              const prevNode = prev.nodes[i]
              context.beginPath()
              link([
                [sourceX + prev.size / 2 + (prev.data.bias ? 4 : 0), prevNode.y],
                [layer.x, node.y]
              ])
              context.stroke()
            })
          } else {
            prev.nodes.forEach((prevNode) => {
              layer.nodes.forEach((node) => {
                context.beginPath()
                link([
                  [sourceX + prev.size / 2 + (prev.data.bias ? 4 : 0), prevNode.y],
                  // layer.size / 4 looks best
                  [layer.x - layer.size / 4, node.y]
                ])
                context.stroke()
              })
            })
          }
        }
      }
    })
    context.globalAlpha = 1
    layersWithCords.forEach((layer, i, all) => {
      if (layer.weights) {
        const isConv2D = layer.data.name.match(/^conv2d/)
        layer.weights.forEach((nodeWeights, i) => {
          nodeWeights.forEach((block, i) => {
            context.translate(block.x, block.y)
            if (isConv2D) {
              // context.save()
              // context.rotate(10 * Math.PI / 180)
            }
            block.data.forEach((d, i) => {
              const color = piyg(d)
              const row = Math.floor(i / block.size)
              context.fillStyle = color
              context.fillRect((i % block.size) * blockDpi, row * blockDpi, blockDpi, blockDpi)
            })
            if (isConv2D) {
              // context.restore()
            }
            context.translate(-block.x, -block.y)
          })
        })
      }
    })
    context.globalAlpha = 1
  }
  async function drawResults(results) {
    for (let i = 0; i < layersWithCords.length; i++) {
      const layer = layersWithCords[i]
      const { x, size } = layer

      const xEnd = (
        x +
        size / 2 +
        (layer.data.weights
          ? Math.sqrt(layer.data.weights[0].length) * blockDpi
          : 0) +
        1 + // border
        1 // padding
      )
      if (i === layersWithCords.length - 1) {
        context.clearRect(xEnd, 0, 100, height)
      }
      const result = results && results[i]
      if (result) {
        const dataPerNode = tf.tidy(() => {
          // console.log('---')
          // console.log(layer.data.name)
          const activation = results[i].squeeze([0])
          // activation.print(true)
          
          const perNode =  tf.split(activation, layer.data.nodes, layer.data.outShape.length - 1)
            .map(t => t.squeeze().clipByValue(0, 1))
            .map(t => {
              if (t.rank === 0) {
                return t.expandDims().expandDims()
              }
              if (t.rank === 1) {
                const s = Math.sqrt(t.shape[0])
                return t.reshape([s, s])
              }
              return t
            })
            .map(t => t.mul(tf.scalar(255)).cast('int32'))
  
          // perNode.map(n => n.print(true))
          
          return perNode
        })
        
        for (let i = 0; i < dataPerNode.length; i++) {
          if (dataPerNode[i].rank === 2) {
            const canvas = document.createElement('canvas')
            await tf.toPixels(dataPerNode[i], canvas)
            const y = layer.nodes[i].y
            context.drawImage(canvas, x - size / 2, y - size / 2, size, size)
          }
        }
        if (i === layersWithCords.length - 1) {
          // console.log('res', result.dataSync())
          if (DRAW_RESULT) {
            const firstLayer = layersWithCords[0]
            const y = height / 2
            const digit = result.argMax(1).dataSync()
            const rNode = layer.nodes[digit]
            context.globalAlpha = 0.2
            context.beginPath()
            link([
              [xEnd, rNode.y],
              [x + 62, y]
            ])
            context.stroke()

            context.globalAlpha = 1

            context.beginPath()
            context.rect(
              x + 62,
              y - firstLayer.size / 2,
              firstLayer.size,
              firstLayer.size
            )
            context.fillStyle = '#fff'
            context.fill()
            context.strokeStyle = '#000'
            context.stroke()

            context.font = `${firstLayer.size}px ${fontFamilies.sansSerifRegular}`
            context.textAlign = 'center'
            context.textBaseline = 'middle'
            context.fillStyle = '#000'
            context.fillText(digit, x + 62 + firstLayer.size / 2, height / 2)
          }
        }
      } else {
        layer.nodes.forEach(({ y }) => {
          context.clearRect(x - size / 2, y - size / 2, size, size)
        })
      }
      layer.nodes.forEach(({ y }) => {
        context.strokeStyle = '#000'
        context.strokeRect(x - size / 2, y - size / 2, size + (layer.data.bias ? 4 : 0), size)
      })
    }
  }
  
  // let raf
  const drawResultsOnNAF = (results) => {
    // raf && window.cancelAnimationFrame(raf)
    window.requestAnimationFrame(() => {
      drawResults(results)
    })
  }
  const drawResultsWhenEv = debounce(drawResultsOnNAF, 200)
  // throttle or debounce? leading: false, maxWait: 1000

  let lastTopology
  function draw(topology, results) {
    if (lastTopology !== topology) {
      drawTopology(topology)
      drawResults(results)
      lastTopology = topology
    } else {
      drawResultsWhenEv(results)
    }
  }
  
  return {
    // drawTopology,
    // drawResults: throttle(drawResults, 100),
    draw
  }
}

export default createVis
