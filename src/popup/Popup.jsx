import { useState, useEffect } from 'react'

import './Popup.css'

import SwitchPanel from './SwitchPanel'

export const Popup = () => {
  const [count, setCount] = useState(0)
  const link = 'https://github.com/guocaoyi/create-chrome-ext'

  const minus = () => {
    if (count > 0) setCount(count - 1)
  }

  const add = () => setCount(count + 1)

  useEffect(() => {
    chrome.storage.sync.get(['count'], (result) => {
      setCount(result.count || 0)
    })
  }, [])

  useEffect(() => {
    chrome.storage.sync.set({ count })
    chrome.runtime.sendMessage({ type: 'COUNT', count })
  }, [count])

  return (
    <main style={{ flex: 1 }}>
      <header class="text-style h1-style">swipe</header>
      <h2 class="text-style h2-style">Intuitive Gesture Control</h2>
      <section>
        <p class="text-style p-style">
          Navigate, zoom, and scroll with simple gestures. Experience seamless browsing without
          touching a mouse or keyboard
        </p>
      </section>
      <SwitchPanel></SwitchPanel>
      <footer className="popup-footer">Swipe 2024 ©</footer>
    </main>
  )
}

export default Popup
