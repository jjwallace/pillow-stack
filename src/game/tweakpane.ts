import { Pane } from 'tweakpane'
import { GAME_CONFIG } from './config'

export function setupTweakpane() {
  const pane = new Pane({
    title: 'Game Config',
    expanded: false // Start collapsed/closed
  })

  // Position at bottom of viewport
  const paneElement = pane.element
  paneElement.style.position = 'fixed'
  paneElement.style.bottom = '0'
  paneElement.style.top = 'auto'
  paneElement.style.right = '0'

  // Pillow settings
  const pillowFolder = pane.addFolder({ title: 'Pillow', expanded: false })
  pillowFolder.addBinding(GAME_CONFIG.pillow, 'minWidth', { min: 10, max: 100, step: 1 })
  pillowFolder.addBinding(GAME_CONFIG.pillow, 'minHeight', { min: 5, max: 50, step: 1 })
  pillowFolder.addBinding(GAME_CONFIG.pillow, 'maxWidth', { min: 10, max: 150, step: 1 })
  pillowFolder.addBinding(GAME_CONFIG.pillow, 'maxHeight', { min: 5, max: 50, step: 1 })

  // Tower settings
  const towerFolder = pane.addFolder({ title: 'Tower', expanded: false })
  towerFolder.addBinding(GAME_CONFIG.tower, 'swayAngle', { min: 0, max: 0.2, step: 0.001, label: 'Sway Angle (rad)' })
  towerFolder.addBinding(GAME_CONFIG.tower, 'swaySpeed', { min: 0.1, max: 5, step: 0.1 })

  // Floor settings
  const floorFolder = pane.addFolder({ title: 'Floor', expanded: false })
  floorFolder.addBinding(GAME_CONFIG.floor, 'groundHeight', { min: 50, max: 300, step: 10 })

  // Collision settings
  const collisionFolder = pane.addFolder({ title: 'Collision', expanded: false })
  collisionFolder.addBinding(GAME_CONFIG.collision, 'earlyDetectionPixels', {
    min: 0,
    max: 50,
    step: 1,
    label: 'Early Detection (px)'
  })

  return pane
}
