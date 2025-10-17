import { onMount, onCleanup } from "solid-js"
import Phaser from "phaser"
import { createGameConfig } from "./config"
import { setupTweakpane } from "./tweakpane"
import type { Pane } from 'tweakpane'

export default function Game() {
  let gameRef: Phaser.Game | null = null
  let paneRef: Pane | null = null

  onMount(() => {
    if (typeof window !== "undefined" && !gameRef) {
      const config = createGameConfig()
      gameRef = new Phaser.Game(config)
      paneRef = setupTweakpane()
    }
  })

  onCleanup(() => {
    if (paneRef) {
      paneRef.dispose()
      paneRef = null
    }
    if (gameRef) {
      gameRef.destroy(true)
      gameRef = null
    }
  })

  return (
    <main class="w-screen h-screen overflow-hidden">
      <div id="game-container" class="w-full h-full" />
    </main>
  )
}
