import * as React from 'react'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import ListSubheader from '@mui/material/ListSubheader'
import Switch from '@mui/material/Switch'
import WifiIcon from '@mui/icons-material/Wifi'
import BluetoothIcon from '@mui/icons-material/Bluetooth'
import SwipeLeftAltIcon from '@mui/icons-material/SwipeLeftAlt'
import SwipeRightAltIcon from '@mui/icons-material/SwipeRightAlt'
import SwipeDownAltIcon from '@mui/icons-material/SwipeDownAlt'
import SwipeUpAltIcon from '@mui/icons-material/SwipeUpAlt'
import { Preview, PreviewTwoTone } from '@mui/icons-material'

export default function SwitchListSecondary() {
  const [left, setLeft] = React.useState(null)
  const [right, setRight] = React.useState(null)
  const [up, setUp] = React.useState(null)
  const [down, setDown] = React.useState(null)
  const [firstRender, setFirstRender] = React.useState(true)

  //   console.log('here')

  // Change global state
  React.useEffect(() => {
    console.log('sending')
    const changeState = async () => {
      if (left !== null && right !== null && up !== null && down !== null) {
        chrome.storage.sync.set({ left: left, right: right, up: up, down: down }, function () {
          if (chrome.runtime.lastError) {
            console.log(`Error setting values: ${chrome.runtime.lastError}`)
          }
        })
        console.log('sent')
        const result = chrome.storage.sync.get(['left', 'right', 'up', 'down'], (result) => {
          console.log('sent result')
          console.log(result)
        })
      }
    }
    changeState()
  }, [left, right, up, down])

  React.useEffect(() => {
    const restoreState = async () => {
      if (firstRender) {
        console.log('initial retrieve async')
        const result = chrome.storage.sync.get(['left', 'right', 'up', 'down'], (result) => {
          console.log('fresh result')
          console.log(result)
          setLeft(result.left || false)
          setRight(result.right || false)
          setUp(result.up || false)
          setDown(result.down || false)
        })
      }
      setFirstRender(false)
    }
    restoreState()
  }, [firstRender])
  //   console.log(chrome.storage.local.set({ left, right, up, down }))

  return up === null || down === null || right === null || left === null ? null : (
    <List sx={{ width: '100%', maxWidth: 360 }}>
      <ListItem>
        <ListItemIcon>
          <SwipeLeftAltIcon sx={{ color: 'grey' }} />
        </ListItemIcon>
        <ListItemText
          sx={{ color: '#61dafb' }}
          id="switch-list-label-wifi"
          primary="Previous Tab"
        />
        <Switch
          edge="end"
          onChange={() => {
            setLeft((prev) => !prev)
            console.log('left')
          }}
          checked={left}
          inputProps={{
            'aria-labelledby': 'switch-list-label-wifi',
          }}
        />
      </ListItem>
      <ListItem>
        <ListItemIcon>
          <SwipeRightAltIcon sx={{ color: 'grey' }} />
        </ListItemIcon>
        <ListItemText sx={{ color: '#61dafb' }} id="switch-list-label-wifi" primary="Next Tab" />
        <Switch
          edge="end"
          onChange={() => setRight((prev) => !prev)}
          checked={right}
          inputProps={{
            'aria-labelledby': 'switch-list-label-wifi',
          }}
        />
      </ListItem>
      <ListItem>
        <ListItemIcon>
          <SwipeDownAltIcon sx={{ color: 'grey' }} />
        </ListItemIcon>
        <ListItemText sx={{ color: '#61dafb' }} id="switch-list-label-wifi" primary="Scroll Down" />
        <Switch
          edge="end"
          onChange={() => setDown((prev) => !prev)}
          checked={down}
          inputProps={{
            'aria-labelledby': 'switch-list-label-wifi',
          }}
        />
      </ListItem>{' '}
      <ListItem>
        <ListItemIcon>
          <SwipeUpAltIcon sx={{ color: 'grey' }} />
        </ListItemIcon>
        <ListItemText sx={{ color: '#61dafb' }} id="switch-list-label-wifi" primary="Scroll Up" />
        <Switch
          edge="end"
          onChange={() => setUp((prev) => !prev)}
          checked={up}
          inputProps={{
            'aria-labelledby': 'switch-list-label-wifi',
          }}
        />
      </ListItem>
    </List>
  )
}
