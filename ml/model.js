import * as tf from '@tensorflow/tfjs';

const data = {
  features: tf.tensor2d([[0, 0], [0, 1], [1, 0], [1, 1], [0.5, 0.5], [1, 0.5]]),
  // One-hot encoded labels for classes
  labels: tf.tensor2d([[1, 0, 0], [0, 1, 0], [0, 0, 1], [1, 0, 0], [0, 1, 0], [0, 0, 1]])
};

const model = tf.sequential();
model.add(tf.layers.dense({units: 8, activation: 'relu', inputShape: [2]}));
const numOutputs = 3
model.add(tf.layers.dense({units: numOutputs, activation: 'softmax'}));

// Compile the model with categoricalCrossentropy loss for multi-class classification
model.compile({
  optimizer: tf.train.adam(),
  loss: 'categoricalCrossentropy',
  metrics: ['accuracy']
});

async function trainModel() {
  await model.fit(data.features, data.labels, {
    epochs: 200,
    callbacks: {
      onEpochEnd: (epoch, logs) => console.log(`Epoch: ${epoch + 1}, Loss: ${logs.loss}, Accuracy: ${logs.acc}`)
    }
  });

  console.log('Model training complete.');
}

function predict(inputFeatures) {
  tf.tidy(() => {
    const inputTensor = tf.tensor2d([inputFeatures]);
    const predictions = model.predict(inputTensor);

    const predictedClassIndex = predictions.argMax(-1).dataSync()[0];
    const probabilities = predictions.dataSync(); // Get all probabilities for the input

    const predictedProbability = probabilities[predictedClassIndex];
    console.log(`Predicted class: ${predictedClassIndex + 1}`);
    console.log(`Predicted probability: ${predictedProbability}`);
  });
}

// called in frontend
export async function getTrainedModel() {
  await trainModel();
  return model;
}

// Example usage
trainModel().then(() => {
  console.log('Making a prediction:');
  predict([0.5, 0.5]);
});