import * as tf from '@tensorflow/tfjs';
import * as fs from 'fs';
import { parse } from 'csv-parse';

export function predict(inputFeatures, threshold) {
  let returnClass = -1;
  tf.tidy(() => {
    const inputTensor = tf.tensor2d([inputFeatures]);
    const predictions = model.predict(inputTensor);

    const predictedClassIndex = predictions.argMax(-1).dataSync()[0];
    const probabilities = predictions.dataSync(); // Get all probabilities for the input

    const predictedProbability = probabilities[predictedClassIndex];
    console.log(`Predicted class: ${predictedClassIndex + 1}`);
    console.log(`Predicted probability: ${predictedProbability}`);
    if (predictedProbability >= threshold) {
      returnClass =  predictedClassIndex + 1;
    } 
  });
  return returnClass;
}

// call this externally
export async function getModel() {
  // Define the path to your CSV file
  const csvFilePath = 'ml/data.csv';
  // Create a parser instance
  const parser = parse({
    columns: false, 
  });
  
  // Read the CSV file and parse its contents
  let input = [];
  let output = [];
  
  fs.createReadStream(csvFilePath)
    .pipe(parser)
    .on('data', async (row) => {
      // Process each row here
      let outputvals = row[0].split(';').map((item)=>parseInt(item));
      let inputvals = row[1].split(';').map((item)=>parseInt(item));
      if (outputvals.length === 6 && inputvals.length === 42) {
        output.push(outputvals);
        input.push(inputvals);
      }

      console.log(outputvals.length);
      console.log(inputvals.length);
    })
    .on('end', async () => {
      console.log('CSV file has been processed');
      console.log(input.length)
      console.log(output.length)
      let model = await getTrainedModel(input, output);
      return model;
    });
    console.log('DONE');
}

async function getTrainedModel(input, output) {
  const data = {
    features: tf.tensor2d(input),
    // One-hot encoded labels for classes
    labels: tf.tensor2d(output)
  };
  const model = tf.sequential();
  model.add(tf.layers.dense({units: 6, activation: 'relu', inputShape: [42]}));
  model.add(tf.layers.dense({units: 6, activation: 'softmax'}));
  
  // Compile the model with categoricalCrossentropy loss for multi-class classification
  model.compile({
    optimizer: tf.train.adam(),
    loss: 'categoricalCrossentropy',
    metrics: ['accuracy']
  });

  await trainModel(model, data);
  return model;
}

async function trainModel(model, data) {
  await model.fit(data.features, data.labels, {
    epochs: 200,
    callbacks: {
      onEpochEnd: (epoch, logs) => console.log(`Epoch: ${epoch + 1}, Loss: ${logs.loss}, Accuracy: ${logs.acc}`)
    }
  });

  console.log('Model training complete.');
}

let model = await getModel();
console.log(model);
console.log('here')