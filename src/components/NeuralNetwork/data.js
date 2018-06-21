import tf from '@tensorflow/tfjs'
const MNIST_LABELS_PATH =
    'https://cdn.republik.space/s3/republik-assets/dynamic-components/talk-to-the-machine/neural-network/mnist_labels_uint8'
const MNIST_IMAGES_SPRITE_PATH =
    'https://cdn.republik.space/s3/republik-assets/dynamic-components/talk-to-the-machine/neural-network/mnist_images.png'

const BATCH_SIZE = 64
const TEST_BATCH_SIZE = 1000
const TEST_ITERATION_FREQUENCY = 5
export const IMAGE_SIZE = 784
const NUM_CLASSES = 10
const NUM_DATASET_ELEMENTS = 65000
const NUM_TRAIN_ELEMENTS = 55000
const NUM_TEST_ELEMENTS = NUM_DATASET_ELEMENTS - NUM_TRAIN_ELEMENTS
const TRAIN_BATCHES = 100

class MnistData {
  constructor() {
    this.shuffledTrainIndex = 0;
    this.shuffledTestIndex = 0;
  }

  async load() {
    // Make a request for the MNIST sprited image.
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const imgRequest = new Promise((resolve, reject) => {
      img.crossOrigin = '';
      img.onload = () => {
        img.width = img.naturalWidth;
        img.height = img.naturalHeight;

        const datasetBytesBuffer =
            new ArrayBuffer(NUM_DATASET_ELEMENTS * IMAGE_SIZE * 4);

        const chunkSize = 5000;
        canvas.width = img.width;
        canvas.height = chunkSize;

        for (let i = 0; i < NUM_DATASET_ELEMENTS / chunkSize; i++) {
          const datasetBytesView = new Float32Array(
              datasetBytesBuffer, i * IMAGE_SIZE * chunkSize * 4,
              IMAGE_SIZE * chunkSize);
          ctx.drawImage(
              img, 0, i * chunkSize, img.width, chunkSize, 0, 0, img.width,
              chunkSize);

          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

          for (let j = 0; j < imageData.data.length / 4; j++) {
            // All channels hold an equal value since the image is grayscale, so
            // just read the red channel.
            datasetBytesView[j] = imageData.data[j * 4] / 255;
          }
        }
        this.datasetImages = new Float32Array(datasetBytesBuffer);

        resolve();
      };
      img.src = MNIST_IMAGES_SPRITE_PATH;
    });

    const labelsRequest = fetch(MNIST_LABELS_PATH);
    const [imgResponse, labelsResponse] =
        await Promise.all([imgRequest, labelsRequest]);

    this.datasetLabels = new Uint8Array(await labelsResponse.arrayBuffer());

    // Create shuffled indices into the train/test set for when we select a
    // random dataset element for training / validation.
    this.trainIndices = tf.util.createShuffledIndices(NUM_TRAIN_ELEMENTS);
    this.testIndices = tf.util.createShuffledIndices(NUM_TEST_ELEMENTS);

    // Slice the the images and labels into train and test sets.
    this.trainImages =
        this.datasetImages.slice(0, IMAGE_SIZE * NUM_TRAIN_ELEMENTS);
    this.testImages = this.datasetImages.slice(IMAGE_SIZE * NUM_TRAIN_ELEMENTS);
    this.trainLabels =
        this.datasetLabels.slice(0, NUM_CLASSES * NUM_TRAIN_ELEMENTS);
    this.testLabels =
        this.datasetLabels.slice(NUM_CLASSES * NUM_TRAIN_ELEMENTS);
  }

  nextTrainBatch(batchSize) {
    return this.nextBatch(
        batchSize, [this.trainImages, this.trainLabels], () => {
          this.shuffledTrainIndex =
              (this.shuffledTrainIndex + 1) % this.trainIndices.length;
          return this.trainIndices[this.shuffledTrainIndex];
        });
  }

  nextTestBatch(batchSize) {
    return this.nextBatch(batchSize, [this.testImages, this.testLabels], () => {
      this.shuffledTestIndex =
          (this.shuffledTestIndex + 1) % this.testIndices.length;
      return this.testIndices[this.shuffledTestIndex];
    });
  }

  nextBatch(batchSize, data, index) {
    const batchImagesArray = new Float32Array(batchSize * IMAGE_SIZE);
    const batchLabelsArray = new Uint8Array(batchSize * NUM_CLASSES);

    for (let i = 0; i < batchSize; i++) {
      const idx = index();

      const image =
          data[0].slice(idx * IMAGE_SIZE, idx * IMAGE_SIZE + IMAGE_SIZE);
      batchImagesArray.set(image, i * IMAGE_SIZE);

      const label =
          data[1].slice(idx * NUM_CLASSES, idx * NUM_CLASSES + NUM_CLASSES);
      batchLabelsArray.set(label, i * NUM_CLASSES);
    }

    const xs = tf.tensor2d(batchImagesArray, [batchSize, IMAGE_SIZE]);
    const labels = tf.tensor2d(batchLabelsArray, [batchSize, NUM_CLASSES]);

    return {xs, labels};
  }
}

export async function loadData() {
  const data = new MnistData()
  await data.load()
  return data
}

export async function train(model, data, { onBatchEnd, onFitEnd } = {}) {
  const lossValues = []
  const accuracyValues = []

  for (let i = 0; i < TRAIN_BATCHES; i++) {
    const batch = data.nextTrainBatch(BATCH_SIZE)

    let testBatch
    let validationData
    // Every few batches test the accuracy of the mode.
    if (i % TEST_ITERATION_FREQUENCY === 0) {
      testBatch = data.nextTestBatch(TEST_BATCH_SIZE)
      validationData = [
        testBatch.xs.reshape([TEST_BATCH_SIZE, 28, 28, 1]), testBatch.labels
      ]
    }

    // The entire dataset doesn't fit into memory so we call fit repeatedly
    // with batches.
    const history = await model.fit(
      batch.xs.reshape([BATCH_SIZE, 28, 28, 1]), batch.labels,
      {
        batchSize: BATCH_SIZE,
        validationData,
        epochs: 1,
        callbacks: {
          onBatchEnd() {
            onBatchEnd && onBatchEnd({model})
          }
        }
      }
    )

    const loss = history.history.loss[0]
    const accuracy = history.history.acc[0]

    // Plot loss / accuracy.
    lossValues.push({'batch': i, 'loss': loss, 'set': 'train'})

    if (testBatch != null) {
      accuracyValues.push({'batch': i, 'accuracy': accuracy, 'set': 'train'})
    }

    onFitEnd && onFitEnd({
      model,
      accuracy,
      loss
    })

    batch.xs.dispose()
    batch.labels.dispose()
    if (testBatch != null) {
      testBatch.xs.dispose()
      testBatch.labels.dispose()
    }

    await tf.nextFrame()
  }
}
