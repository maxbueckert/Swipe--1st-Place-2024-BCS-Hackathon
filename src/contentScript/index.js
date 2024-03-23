import * as tf from '@tensorflow/tfjs'
import '@tensorflow/tfjs-backend-webgl'
import * as handpose from '@tensorflow-models/handpose'

let webcamElement = null
let canvasElement = null
let canvasCtx = null

// Need to Load TensorFlow Model in to begin
async function loadModel() {
  // Set the backend to WebGL.
  await tf.setBackend('webgl')
  // Now TensorFlow.js can use the WebGL backend.
  await tf.ready()
  // Load your model.
  const net = await handpose.load()
  console.log('Handpose model loaded.')
  // Your model is now ready to use...
}

// Dynamically create and insert the webcam and canvas elements into the page
function insertVideoAndCanvasElements() {
  webcamElement = document.createElement('video')
  canvasElement = document.createElement('canvas')

  // Apply styles to make the video and canvas fit appropriately
  webcamElement.setAttribute('style', 'position: absolute; top: 0; left: 0; visibility: hidden;')
  canvasElement.setAttribute('style', 'position: absolute; top: 0; left: 0;')

  document.body.appendChild(webcamElement)
  document.body.appendChild(canvasElement)

  canvasCtx = canvasElement.getContext('2d')
}

// Run handpose model
async function runHandpose() {
  const net = await handpose.load()

  // Loop and detect hands
  setInterval(() => {
    detect(net)
  }, 20)
}

let throttle = false
let foundHand = false

const notifyFoundHand = () => {
  if (!foundHand) {
    foundHand = true
    console.log('found hand')
  }
}

async function detect(net) {
  //   console.log('detecting')
  if (webcamElement.readyState === 4) {
    const videoWidth = webcamElement.videoWidth
    const videoHeight = webcamElement.videoHeight
    // Set video width
    webcamElement.width = videoWidth
    webcamElement.height = videoHeight
    // Set canvas height and width
    canvasElement.width = videoWidth
    canvasElement.height = videoHeight
    // Make detections
    const hand = await net.estimateHands(webcamElement)
    // console.log(hand.length > 0 ? 'found hand' : null)

    if (hand.length && hand[0].annotations.indexFinger[3] < hand[0].annotations.indexFinger[0]) {
      notifyFoundHand()
      //   console.log('UPSIDE DOWN DETECTED')
      if (throttle) {
        // console.log('but throttled')
      }

      if (!throttle) {
        throttle = true
        chrome.runtime.sendMessage({ action: 'changeTab' }, function (response) {
          //   console.log('received result')
          //   console.log(response.result)
        })
        setTimeout(() => {
          throttle = false
          //   console.log('throttle reset')
        }, 1000)
      }
    }
  }
}

// This function will be called to start the whole process
function main() {
  chrome.runtime.sendMessage({ action: 'getTabIndex' }, async function (response) {
    if (response.index === 0) {
      // This is the first tab, start the interval loop
      console.log('This is the first tab. Starting interval loop.')
      await loadModel()
      insertVideoAndCanvasElements()
      navigator.mediaDevices
        .getUserMedia({ video: true })
        .then((stream) => {
          webcamElement.srcObject = stream
          webcamElement.play()
          runHandpose()
        })
        .catch((err) => {
          console.error('Error accessing webcam:', err)
        })
    } else {
      console.log("This tab is not the first one. Interval loop won't start.")
    }
  })
}

// Execute main function when content script loads
main()
