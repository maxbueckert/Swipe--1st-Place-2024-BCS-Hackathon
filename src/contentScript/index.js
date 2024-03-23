import * as tf from '@tensorflow/tfjs'
import '@tensorflow/tfjs-backend-webgl'
import * as handpose from '@tensorflow-models/handpose'

let webcamElement = null
let canvasElement = null
let canvasCtx = null
let loaded = false
let throttle = false
let foundHand = false
let detectionInterval = null
let net

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

function insertVideoAndCanvasElements() {
  webcamElement = document.createElement('video')
  canvasElement = document.createElement('canvas')
  webcamElement.setAttribute('style', 'position: absolute; top: 0; left: 0; visibility: hidden;')
  canvasElement.setAttribute('style', 'position: absolute; top: 0; left: 0;')
  document.body.appendChild(webcamElement)
  document.body.appendChild(canvasElement)
  canvasCtx = canvasElement.getContext('2d')
}

async function runHandpose() {
  net = await handpose.load()
  loaded = true
}

function startDetection() {
  if (!detectionInterval && loaded) {
    detectionInterval = setInterval(() => {
      detect(net)
      console.log('Running detection...')
    }, 20) // Adjust the interval as needed
  }
}

// Function to stop the detection interval
function stopDetection() {
  if (detectionInterval) {
    clearInterval(detectionInterval)
    detectionInterval = null
    console.log('Detection stopped.')
  }
}

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

    if (hand.length) {
      notifyFoundHand()
      process(hand)
    }

    // if (hand.length && hand[0].annotations.indexFinger[3] < hand[0].annotations.indexFinger[0]) {
    //   notifyFoundHand()
    //   if (!throttle) {
    //     throttle = true
    //     chrome.runtime.sendMessage({ action: 'changeTab' }, function (response) {})
    //     setTimeout(() => {
    //       throttle = false
    //     }, 1000)
    //   }
    // }
  }
}

const process = (hand) => {
  const TOLERANCE = Math.abs(hand[0].landmarks[0][0] - hand[0].landmarks[1][0]) / 3
  const palm = hand[0].landmarks[0]
  const thumb1 = hand[0].landmarks[1]
  const thumb2 = hand[0].landmarks[2]
  const thumb3 = hand[0].landmarks[3]
  const thumb4 = hand[0].landmarks[4]
  const indexKnuckle = hand[0].landmarks[5]
  const middleKnuckle = hand[0].landmarks[9]
  const ringKnuckle = hand[0].landmarks[13]
  const pinkyKnuckle = hand[0].landmarks[17]
  const indexSubTip = hand[0].landmarks[7]
  const indexTip = hand[0].landmarks[8]
  const middleSubTip = hand[0].landmarks[11]
  const middleTip = hand[0].landmarks[12]
  const ringSubTip = hand[0].landmarks[15]
  const ringTip = hand[0].landmarks[16]
  const pinkySubTip = hand[0].landmarks[19]
  const pinkyTip = hand[0].landmarks[20]
  if (thumb4[0] < thumb3[0] && thumb4[1] < thumb3[1]) {
    if (thumb3[0] < thumb2[0] && thumb3[1] < thumb2[1]) {
      if (thumb2[0] < thumb1[0] && thumb2[1] < thumb1[1]) {
        if (thumb1[0] < palm[0] && thumb1[1] < palm[1]) {
          if (
            indexTip[1] + TOLERANCE > indexKnuckle[1] &&
            middleTip[1] + TOLERANCE > middleKnuckle[1] &&
            ringTip[1] + TOLERANCE > ringKnuckle[1] &&
            pinkyTip[1] + TOLERANCE > pinkyKnuckle[1]
          ) {
            throttle = true
            console.log('Next tab symbol!')
            chrome.runtime.sendMessage({ action: 'changeTab' }, function (response) {})
            setTimeout(() => {
              throttle = false
            }, 1000)
          }
        }
      }
    }
  }
  if (thumb4[0] > thumb3[0] && thumb4[1] < thumb3[1]) {
    if (thumb3[0] > thumb2[0] && thumb3[1] < thumb2[1]) {
      if (thumb2[0] > thumb1[0] && thumb2[1] < thumb1[1]) {
        if (thumb1[0] > palm[0] && thumb1[1] < palm[1]) {
          if (
            indexTip[1] + TOLERANCE > indexKnuckle[1] &&
            middleTip[1] + TOLERANCE > middleKnuckle[1] &&
            ringTip[1] + TOLERANCE > ringKnuckle[1] &&
            pinkyTip[1] + TOLERANCE > pinkyKnuckle[1]
          ) {
            throttle = true
            console.log('Previous tab symbol!')
          }
        }
      }
    }
  }
}

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    // The page is now visible
    startDetection()
  } else {
    // The page is now hidden
    stopDetection()
  }
})

// Initial check to start detection if the page is initially visible
if (document.visibilityState === 'visible') {
  startDetection()
}

// This function will be called to start the whole process
async function main() {
  //   chrome.runtime.sendMessage({ action: 'getTabIndex' }, async function (response) {

  // This is the first tab, start the interval loop

  await loadModel()
  insertVideoAndCanvasElements()
  navigator.mediaDevices
    .getUserMedia({ video: true })
    .then((stream) => {
      webcamElement.srcObject = stream
      webcamElement.play()
      runHandpose()
      startDetection()
    })
    .catch((err) => {
      console.error('Error accessing webcam:', err)
    })
}
//   })

// Execute main function when content script loads
main()
