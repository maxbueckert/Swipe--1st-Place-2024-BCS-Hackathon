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
  const [left, setLeft] = React.useState(false)
  const [right, setRight] = React.useState(false)
  const [up, setUp] = React.useState(false)
  const [down, setDown] = React.useState(false)

  // Change global state
  React.useEffect(() => {
    chrome.storage.local.set({ left, right, up, down })
  }, [left, right, up, down])

  // Initial Sync With Global State
  React.useEffect(() => {
    // Initial sync from storage
    chrome.storage.local.get(['left', 'right', 'up', 'down'], (result) => {
      setLeft(result.left || false)
      setRight(result.right || false)
      setUp(result.up || false)
      setDown(result.down || false)
    })

    // Listen for changes
    chrome.storage.onChanged.addListener((changes, namespace) => {
      for (let [key, { newValue }] of Object.entries(changes)) {
        if (key === 'left') setLeft(newValue)
        if (key === 'right') setRight(newValue)
        if (key === 'up') setUp(newValue)
        if (key === 'down') setDown(newValue)
      }
    })

    // Cleanup listener
    return () => chrome.storage.onChanged.removeListener(listener)
  }, [])

  return (
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
          onChange={() => setLeft((prev) => !prev)}
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
          onChange={() => setUp((prev) => !prev)}
          checked={up}
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
          onChange={() => setDown((prev) => !prev)}
          checked={down}
          inputProps={{
            'aria-labelledby': 'switch-list-label-wifi',
          }}
        />
      </ListItem>
    </List>
  )
}
