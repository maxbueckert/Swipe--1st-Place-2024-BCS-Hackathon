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
  const TOLERANCE = 20
  const palm = hand[0].landmarks[0]
  const thumb1 = hand[0].landmarks[1]
  const thumb2 = hand[0].landmarks[2]
  const thumb3 = hand[0].landmarks[3]
  const thumb4 = hand[0].landmarks[4]
  const indexKnuckle = hand[0].landmarks[5]
  const indexPostKnuckle = hand[0].landmarks[6]
  const indexSubTip = hand[0].landmarks[7]
  const indexTip = hand[0].landmarks[8]
  const middleKnuckle = hand[0].landmarks[9]
  const middleSubTip = hand[0].landmarks[11]
  const middleTip = hand[0].landmarks[12]
  const ringKnuckle = hand[0].landmarks[13]
  const ringSubTip = hand[0].landmarks[15]
  const ringTip = hand[0].landmarks[16]
  const pinkyKnuckle = hand[0].landmarks[17]
  const pinkySubTip = hand[0].landmarks[19]
  const pinkyTip = hand[0].landmarks[20]

  const thumbExtendedToRight =
    thumb4[0] < thumb3[0] &&
    thumb4[1] < thumb3[1] &&
    thumb3[0] < thumb2[0] &&
    thumb3[1] < thumb2[1] &&
    thumb2[0] < thumb1[0] &&
    thumb2[1] < thumb1[1] &&
    thumb1[0] < palm[0] &&
    thumb1[1] < palm[1]
  const thumbRightOfKnuckel = thumb4[0] + TOLERANCE * 3 < indexKnuckle[0]
  const allFingersFoldedDown =
    indexTip[1] + TOLERANCE > indexKnuckle[1] &&
    middleTip[1] + TOLERANCE > middleKnuckle[1] &&
    ringTip[1] + TOLERANCE > ringKnuckle[1] &&
    pinkyTip[1] + TOLERANCE > pinkyKnuckle[1]
  if (thumbExtendedToRight && allFingersFoldedDown && thumbRightOfKnuckel) {
    console.log('Next tab symbol!')
    throttle = true
    console.log('Next tab symbol!')
    chrome.runtime.sendMessage({ action: 'nextTab' }, function (response) {})
    setTimeout(() => {
      throttle = false
    }, 1000)
  }
}

const handlePrevTab = (hand) => {
  const TOLERANCE = 20
  const palm = hand[0].landmarks[0]
  const thumb1 = hand[0].landmarks[1]
  const thumb2 = hand[0].landmarks[2]
  const thumb3 = hand[0].landmarks[3]
  const thumb4 = hand[0].landmarks[4]
  const indexKnuckle = hand[0].landmarks[5]
  const indexPostKnuckle = hand[0].landmarks[6]
  const indexSubTip = hand[0].landmarks[7]
  const indexTip = hand[0].landmarks[8]
  const middleKnuckle = hand[0].landmarks[9]
  const middleSubTip = hand[0].landmarks[11]
  const middleTip = hand[0].landmarks[12]
  const ringKnuckle = hand[0].landmarks[13]
  const ringSubTip = hand[0].landmarks[15]
  const ringTip = hand[0].landmarks[16]
  const pinkyKnuckle = hand[0].landmarks[17]
  const pinkySubTip = hand[0].landmarks[19]
  const pinkyTip = hand[0].landmarks[20]
  const thumbExtendedToLeft =
    thumb4[0] > thumb3[0] &&
    thumb4[1] < thumb3[1] &&
    thumb3[0] > thumb2[0] &&
    thumb3[1] < thumb2[1] &&
    thumb2[0] > thumb1[0] &&
    thumb2[1] < thumb1[1] &&
    thumb1[0] > palm[0] &&
    thumb1[1] < palm[1]
  const thumbLeftOfKnuckel = thumb4[0] > indexPostKnuckle[0] + TOLERANCE * 3
  const allFingersFoldedDown =
    indexTip[1] + TOLERANCE > indexKnuckle[1] &&
    middleTip[1] + TOLERANCE > middleKnuckle[1] &&
    ringTip[1] + TOLERANCE > ringKnuckle[1] &&
    pinkyTip[1] + TOLERANCE > pinkyKnuckle[1]

  if (thumbExtendedToLeft && allFingersFoldedDown && thumbLeftOfKnuckel) {
    throttle = true
    console.log('Prev tab symbol!')
    chrome.runtime.sendMessage({ action: 'prevTab' }, function (response) {})
    setTimeout(() => {
      throttle = false
    }, 1000)
  }
}

const handleScrollUp = (hand) => {
  const TOLERANCE = 20
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
  const TOLERANCE = 20
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
  const LOWER_TOLERANCE = 30 * 1.3
  const UPPER_TOLERANCE = 10 * 1.3
  const x = 0
  const y = 1
  const pointer1 = hand[0].landmarks[8]
  const pointer2 = hand[0].landmarks[7]
  const pointer3 = hand[0].landmarks[6]
  const pointerKnuckle = hand[0].landmarks[5]

  const middle1 = hand[0].landmarks[12]
  const middle2 = hand[0].landmarks[11]
  const middle3 = hand[0].landmarks[10]
  const middleKnuckle = hand[0].landmarks[9]

  const ring1 = hand[0].landmarks[16]
  const ring2 = hand[0].landmarks[15]
  const ring3 = hand[0].landmarks[14]
  const ringKnuckle = hand[0].landmarks[13]

  const pinky1 = hand[0].landmarks[20]
  const pinky2 = hand[0].landmarks[19]
  const pinky3 = hand[0].landmarks[18]
  const pinkyKnuckle = hand[0].landmarks[17]

  const thumb1 = hand[0].landmarks[4]
  const thumb2 = hand[0].landmarks[3]
  const thumbKnuckle = hand[0].landmarks[2]

  const isRightHandForward = thumbKnuckle[x] > pinkyKnuckle[x]
  const isPointerClenched =
    (pointer1[y] > pointerKnuckle[y] &&
      Math.abs(pointer1[y] - pointerKnuckle[y]) <= LOWER_TOLERANCE) ||
    Math.abs(pointerKnuckle[y] - pointer1[y]) <= UPPER_TOLERANCE
  const isMiddleClenched =
    (middle1[y] > middleKnuckle[y] && Math.abs(middle1[y] - middleKnuckle[y]) <= LOWER_TOLERANCE) ||
    Math.abs(pointerKnuckle[y] - pointer1[y]) <= UPPER_TOLERANCE
  const isRingClenched =
    (ring1[y] > ringKnuckle[y] && Math.abs(ring1[y] - ringKnuckle[y]) <= LOWER_TOLERANCE) ||
    Math.abs(pointerKnuckle[y] - pointer1[y]) <= UPPER_TOLERANCE
  const isPinkyClenched =
    (pinky1[y] > pinkyKnuckle[y] && Math.abs(pinky1[y] - pinkyKnuckle[y]) <= LOWER_TOLERANCE) ||
    Math.abs(pointerKnuckle[y] - pointer1[y]) <= UPPER_TOLERANCE
  const { xMin, yMin } = getMinFingerVertices()
  const { xMax, yMax } = getMaxFingerVertices()
  const isThumbWithinBounds =
    xMin < thumb1[x] && thumb1[x] < xMax && yMin < thumb1[y] && thumb1[y] < yMax
  const isHandClosed =
    isPointerClenched &&
    isMiddleClenched &&
    isRingClenched &&
    isPinkyClenched &&
    isThumbWithinBounds &&
    isRightHandForward

  if (isHandClosed) {
    console.log('Zoom in')
    zoomThrottle = true
    chrome.runtime.sendMessage({ action: 'zoomIn' })
    setTimeout(() => {
      zoomThrottle = false
    }, 20)
  }

  function getMinFingerVertices() {
    const fingers = [
      pointer1,
      pointer2,
      pointer3,
      middle1,
      middle2,
      middle3,
      ring1,
      ring2,
      ring3,
      pinky1,
      pinky2,
      pinky3,
    ]
    let xMin = fingers[0][x]
    let yMin = fingers[0][y]
    fingers.forEach((finger) => {
      xMin = finger[x] < xMin ? finger[x] : xMin
      yMin = finger[y] < yMin ? finger[y] : yMin
    })
    return { xMin: xMin, yMin: yMin }
  }

  function getMaxFingerVertices() {
    const fingers = [
      pointer1,
      pointer2,
      pointer3,
      middle1,
      middle2,
      middle3,
      ring1,
      ring2,
      ring3,
      pinky1,
      pinky2,
      pinky3,
    ]
    let xMax = fingers[0][x]
    let yMax = fingers[0][y]
    fingers.forEach((finger) => {
      xMax = finger[x] > xMax ? finger[x] : xMax
      yMax = finger[y] > yMax ? finger[y] : yMax
    })
    return { xMax: xMax, yMax: yMax }
  }
  // const TOLERANCE = 20
  // const palm = hand[0].landmarks[0]
  // const thumb1 = hand[0].landmarks[1]
  // const thumb2 = hand[0].landmarks[2]
  // const thumb3 = hand[0].landmarks[3]
  // const thumb4 = hand[0].landmarks[4]
  // const indexKnuckle = hand[0].landmarks[5]
  // const middleKnuckle = hand[0].landmarks[9]
  // const ringKnuckle = hand[0].landmarks[13]
  // const pinkyKnuckle = hand[0].landmarks[17]
  // const indexSubTip = hand[0].landmarks[7]
  // const indexTip = hand[0].landmarks[8]
  // const middleSubTip = hand[0].landmarks[11]
  // const middleTip = hand[0].landmarks[12]
  // const ringSubTip = hand[0].landmarks[15]
  // const ringTip = hand[0].landmarks[16]
  // const pinkySubTip = hand[0].landmarks[19]
  // const pinkyTip = hand[0].landmarks[20]
  // if (thumb4[0] < thumb2[0]) {
  //   if (
  //     indexTip[1] < indexSubTip[1] &&
  //     middleTip[1] + TOLERANCE > middleKnuckle[1] &&
  //     ringTip[1] + TOLERANCE > ringKnuckle[1] &&
  //     pinkyTip[1] + TOLERANCE > pinkyKnuckle[1] &&
  //     !zoomThrottle
  //   ) {
  // console.log('Zoom in')
  // zoomThrottle = true
  // chrome.runtime.sendMessage({ action: 'zoomIn' })
  // setTimeout(() => {
  //   zoomThrottle = false
  // }, 20)
  //   }
  // }
}

const handleZoomOut = (hand) => {
  const LOWER_TOLERANCE = 30
  const UPPER_TOLERANCE = 10
  const x = 0
  const y = 1
  const pointer1 = hand[0].landmarks[8]
  const pointer2 = hand[0].landmarks[7]
  const pointer3 = hand[0].landmarks[6]
  const pointerKnuckle = hand[0].landmarks[5]

  const middle1 = hand[0].landmarks[12]
  const middle2 = hand[0].landmarks[11]
  const middle3 = hand[0].landmarks[10]
  const middleKnuckle = hand[0].landmarks[9]

  const ring1 = hand[0].landmarks[16]
  const ring2 = hand[0].landmarks[15]
  const ring3 = hand[0].landmarks[14]
  const ringKnuckle = hand[0].landmarks[13]

  const pinky1 = hand[0].landmarks[20]
  const pinky2 = hand[0].landmarks[19]
  const pinky3 = hand[0].landmarks[18]
  const pinkyKnuckle = hand[0].landmarks[17]

  const thumb1 = hand[0].landmarks[4]
  const thumb2 = hand[0].landmarks[3]
  const thumbKnuckle = hand[0].landmarks[2]

  const isPointerUp =
    pointer1[y] < pointer2[y] && pointer2[y] < pointer3[y] && pointer3[y] < pointerKnuckle[y]
  const isMiddleUp =
    middle1[y] < middle2[y] && middle2[y] < middle3[y] && middle3[y] < middleKnuckle[y]
  const isRingUp = ring1[y] < ring2[y] && ring2[y] < ring3[y] && ring3[y] < ringKnuckle[y]
  const isPinkyUp = pinky1[y] < pinky2[y] && pinky2[y] < pinky3[y] && pinky3[y] < pinkyKnuckle[y]
  const isThumbUp = thumb1[y] < thumb2[y] && thumb2[y] < thumbKnuckle[y]
  const isThumbLeft = thumb1[x] > thumb2[x] && thumb2[x] > thumbKnuckle[x]
  const isRightHandForward = thumbKnuckle[x] > pinkyKnuckle[x]

  if (
    isPointerUp &&
    isMiddleUp &&
    isRingUp &&
    isPinkyUp &&
    isThumbUp &&
    isThumbLeft &&
    isRightHandForward
  ) {
    console.log('Zoom out')
    zoomThrottle = true
    chrome.runtime.sendMessage({ action: 'zoomOut' })
    setTimeout(() => {
      zoomThrottle = false
    }, 20)
  }
  // const TOLERANCE = 20
  // const palm = hand[0].landmarks[0]
  // const thumb1 = hand[0].landmarks[1]
  // const thumb2 = hand[0].landmarks[2]
  // const thumb3 = hand[0].landmarks[3]
  // const thumb4 = hand[0].landmarks[4]
  // const indexKnuckle = hand[0].landmarks[5]
  // const middleKnuckle = hand[0].landmarks[9]
  // const ringKnuckle = hand[0].landmarks[13]
  // const pinkyKnuckle = hand[0].landmarks[17]
  // const indexSubTip = hand[0].landmarks[7]
  // const indexTip = hand[0].landmarks[8]
  // const middleSubTip = hand[0].landmarks[11]
  // const middleTip = hand[0].landmarks[12]
  // const ringSubTip = hand[0].landmarks[15]
  // const ringTip = hand[0].landmarks[16]
  // const pinkySubTip = hand[0].landmarks[19]
  // const pinkyTip = hand[0].landmarks[20]
  // if (thumb4[0] < thumb2[0]) {
  //   if (
  //     indexTip[1] + TOLERANCE > indexKnuckle[1] &&
  //     middleTip[1] + TOLERANCE > middleKnuckle[1] &&
  //     ringTip[1] + TOLERANCE > ringKnuckle[1] &&
  //     pinkyTip[1] < pinkySubTip[1] &&
  //     !zoomThrottle
  //   ) {
  // console.log('Zoom out')
  // zoomThrottle = true
  // chrome.runtime.sendMessage({ action: 'zoomOut' })
  // setTimeout(() => {
  //   zoomThrottle = false
  // }, 20)
  //   }
  // }
}

const process = (hand) => {
  handleNextTab(hand)
  handleZoomIn(hand)
  handleZoomOut(hand)
  handleScrollUp(hand)
  handleScrollDown(hand)
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
