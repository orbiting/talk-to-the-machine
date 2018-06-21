import tf from '@tensorflow/tfjs'

const THE98ONE_URL = 'https://cdn.republik.space/s3/republik-assets/dynamic-components/talk-to-the-machine/neural-network/the98one.json'
const LEARNING_RATE = 0.15

export async function createModel() {
  const model = tf.sequential()
  
  model.add(tf.layers.conv2d({
    inputShape: [28, 28, 1],
    kernelSize: 5,
    filters: 8,
    strides: 1,
    activation: 'relu',
    kernelInitializer: 'VarianceScaling'
  }))
  model.add(tf.layers.maxPooling2d({
    poolSize: [2, 2],
    strides: [2, 2]
  }))
  model.add(tf.layers.conv2d({
    kernelSize: 5,
    filters: 16,
    strides: 1,
    activation: 'relu',
    kernelInitializer: 'VarianceScaling'
  }))
  model.add(tf.layers.maxPooling2d({
    poolSize: [2, 2],
    strides: [2, 2]
  }))
  model.add(tf.layers.flatten())
  model.add(tf.layers.dense({
    units: 10,
    kernelInitializer: 'VarianceScaling',
    activation: 'softmax'
    // useBias: false // pretrained one has bias
  }))
  
  const optimizer = tf.train.sgd(LEARNING_RATE)
  
  await model.compile({
    optimizer: optimizer,
    loss: 'categoricalCrossentropy',
    metrics: ['accuracy']
  })
  
  return model
}

export async function loadPretrained() {
  const model = await tf.loadModel(THE98ONE_URL)
  return model
}

