import * as tf from '@tensorflow/tfjs'
import '@tensorflow/tfjs-backend-webgl'
import * as handpose from '@tensorflow-models/handpose'
import * as math from 'mathjs'

let webcamElement = null
let canvasElement = null
let canvasCtx = null
let loaded = false
let throttle = false
let foundHand = false
let detectionInterval = null
let net
let scrollThrottle = false
const SCROLL_AMOUNT = 20
let zoomThrottle = false

// Need to Load TensorFlow Model in to begin
async function loadModel() {
  await tf.setBackend('webgl')
  await tf.ready()
  const net = await handpose.load()
  console.log('Handpose model loaded.')
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
  console.log('handpose loaded')
}

function startDetection() {
  if (!detectionInterval && loaded) {
    detectionInterval = setInterval(() => {
      detect(net)
      console.log('Running detection ...')
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
  if (webcamElement.readyState === 4) {
    const videoWidth = webcamElement.videoWidth
    const videoHeight = webcamElement.videoHeight
    webcamElement.width = videoWidth
    webcamElement.height = videoHeight
    canvasElement.width = videoWidth
    canvasElement.height = videoHeight
    const hand = await net.estimateHands(webcamElement)
    if (hand.length) {
      notifyFoundHand()
      process(hand)
    }
  }
}

const handleNextTab = (hand) => {
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
            chrome.runtime.sendMessage({ action: 'nextTab' }, function (response) {})
            setTimeout(() => {
              throttle = false
            }, 1000)
          }
        }
      }
    }
  }
}

const handlePrevTab = (hand) => {
  let thumb = [hand[0].landmarks[1], hand[0].landmarks[4]]
  let index = [hand[0].landmarks[5], hand[0].landmarks[8]]
  let middle = [hand[0].landmarks[9], hand[0].landmarks[12]]
  let ring = [hand[0].landmarks[13], hand[0].landmarks[16]]
  let pinky = [hand[0].landmarks[17], hand[0].landmarks[20]]
  let mainFingers = [index, middle, ring, pinky]

  let downDirection = [0, -1]
  let rightDirection = [1, 0.25]
  let leftDirection = [-1, 0]

  const getAngle = (fromto, dir) => {
    let vector = [fromto[0][0] - fromto[1][0], fromto[0][1] - fromto[1][1]] // <x2-x1, y2-y1>
    let vectorLength = math.sqrt(vector[0] ** 2 + vector[1] ** 2)
    let normVector = [vector[0] / vectorLength, vector[1] / vectorLength]
    let direction = math.dot(normVector, dir) // costheta of vector and down
    let angle = math.acos(direction)
    return angle
  }
  // check thumb
  let isLeftTab = getAngle(thumb, leftDirection) < 1.5
  // check fingers
  for (const finger of mainFingers) {
    isLeftTab = isLeftTab && math.abs(getAngle(finger, downDirection)) < 1.5
  }

  if (isLeftTab) {
    throttle = true
    console.log('Prev tab symbol!')
    chrome.runtime.sendMessage({ action: 'prevTab' }, function (response) {})
    setTimeout(() => {
      throttle = false
    }, 1000)
  }
}

const handleScrollUp = (hand) => {
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
  if (thumb4[0] < thumb2[0]) {
    if (
      indexTip[1] < indexSubTip[1] &&
      middleTip[1] + TOLERANCE > middleKnuckle[1] &&
      ringTip[1] + TOLERANCE > ringKnuckle[1] &&
      pinkyTip[1] + TOLERANCE > pinkyKnuckle[1] &&
      !scrollThrottle
    ) {
      chrome.storage.sync.get(['left', 'right', 'up', 'down'], (result) => {
        let up = result.up || false
        if (up) {
          console.log('Scroll up symbol!')
          scrollThrottle = true
          window.scrollBy(0, -SCROLL_AMOUNT) // Scrolls down by 100 pixels
          setTimeout(() => {
            scrollThrottle = false
          }, SCROLL_AMOUNT)
        }
      })
    }
  }
}

const handleScrollDown = (hand) => {
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
  if (thumb4[0] < thumb2[0]) {
    if (
      indexTip[1] + TOLERANCE > indexKnuckle[1] &&
      middleTip[1] + TOLERANCE > middleKnuckle[1] &&
      ringTip[1] + TOLERANCE > ringKnuckle[1] &&
      pinkyTip[1] < pinkySubTip[1] &&
      !scrollThrottle
    ) {
      chrome.storage.sync.get(['left', 'right', 'up', 'down'], (result) => {
        let down = result.down || false
        if (down) {
          console.log('Scroll down symbol!')
          scrollThrottle = true
          window.scrollBy(0, SCROLL_AMOUNT) // Scrolls down by 100 pixels
          setTimeout(() => {
            scrollThrottle = false
          }, SCROLL_AMOUNT)
        }
      })
    }
  }
}

const handleZoomIn = (hand) => {
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
  if (thumb4[0] < thumb2[0]) {
    if (
      indexTip[1] < indexSubTip[1] &&
      middleTip[1] + TOLERANCE > middleKnuckle[1] &&
      ringTip[1] + TOLERANCE > ringKnuckle[1] &&
      pinkyTip[1] + TOLERANCE > pinkyKnuckle[1] &&
      !zoomThrottle
    ) {
      console.log('Zoom in')
      zoomThrottle = true
      chrome.runtime.sendMessage({ action: 'zoomIn' })
      setTimeout(() => {
        zoomThrottle = false
      }, 20)
    }
  }
}

const handleZoomOut = (hand) => {
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
  if (thumb4[0] < thumb2[0]) {
    if (
      indexTip[1] + TOLERANCE > indexKnuckle[1] &&
      middleTip[1] + TOLERANCE > middleKnuckle[1] &&
      ringTip[1] + TOLERANCE > ringKnuckle[1] &&
      pinkyTip[1] < pinkySubTip[1] &&
      !zoomThrottle
    ) {
      console.log('Zoom in')
      zoomThrottle = true
      chrome.runtime.sendMessage({ action: 'zoomOut' })
      setTimeout(() => {
        zoomThrottle = false
      }, 20)
    }
  }
}

const process = (hand) => {
  handleNextTab(hand)
  handleZoomIn(hand)
  handleZoomOut(hand)
  //   handleScrollUp()
  //   handleScrollDown()
  handlePrevTab(hand)
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

main()
