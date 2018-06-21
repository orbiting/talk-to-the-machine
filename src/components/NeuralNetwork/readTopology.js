import tf from '@tensorflow/tfjs'
import { IMAGE_SIZE } from './data'

function readTopology({ model }) {
  const input = model.inputs[0]
  let inputNodes = 1
  let size = IMAGE_SIZE
  const layers = [{
    nodes: inputNodes,
    outSize: size,
    outShape: input.shape.slice(1),
    name: 'input',
  }]
  
  for (let tfLayer of model.layers) {
    const name = tfLayer.name
    const nodes = tfLayer.filters || tfLayer.units || (name.match(/flatten/) ? 1 : inputNodes)
    const layer = {
      nodes,
      inSize: size
    }
    // don't know why but the output of conv2d layers seem to always loose 4px size
    if (name.match(/^conv2d/)) {
      size = Math.pow(Math.sqrt(size) - 4, 2)
    }
    // max sample half (not supporting other configurations)
    if (name.match(/^max_pooling2d/)) {
      size =  Math.pow(Math.sqrt(size) / 2, 2)
    }
    if (name.match(/^flatten/)) {
      size =  inputNodes * size
    }
    if (name.match(/^dense/)) {
      size = 1
    }
    layer.outSize = size
    layer.outShape = tfLayer.output.shape.slice(1)
    layer.name = name
    if (tfLayer.useBias) {
      layer.bias = tfLayer.bias.val.dataSync()
    }
    if (tfLayer.kernel) {
      const kernelVal = tfLayer.kernel.val
      // expect weights per node
      if (nodes > 1 && kernelVal.shape[kernelVal.shape.length - 1] !== nodes) {
        console.warn('unexpected kernel val shape, ignoring weights')
        return
      }
      const weightsPerNode = nodes > 1
        ? tf.split(kernelVal, nodes, kernelVal.shape.length - 1).map(val => val.squeeze())
        : [tfLayer.kernel.val]

      layer.weights = weightsPerNode
        .map(perNode => {
          if (inputNodes > 1) {
            // expect weights per input node
            if (inputNodes > 1 && perNode.shape[perNode.shape.length - 1] !== inputNodes) {
              console.warn('unexpected kernel val shape, ignoring weights')
              return
            }
            return tf.split(perNode, inputNodes, perNode.shape.length - 1).map(val => val.squeeze())
          }
          return [perNode]
        })
        .map(vals => vals.map(val => val.dataSync()))

      // layer.weightExtent = layer.weights.map(n => n.map(i => d3.extent(i)))
      // layer.weightSums = layer.weights.map(n => n.map(i => d3.sum(i)))
    }
    layers.push(layer)
    inputNodes = nodes
  }
  
  return layers
}

export default readTopology
