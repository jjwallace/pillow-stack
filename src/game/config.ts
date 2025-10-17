import Phaser from "phaser"
import { GameScene } from "./GameScene"

export const createGameConfig = (): Phaser.Types.Core.GameConfig => ({
  type: Phaser.AUTO,
  width: window.innerWidth,
  height: window.innerHeight,
  parent: "game-container",
  physics: {
    default: "arcade",
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false,
    },
  },
  scene: [GameScene],
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
})

export const GAME_CONFIG = {
  pillow: {
    maxWidth: 50,
    maxHeight: 20, // Increased from 10 to 20 (10px taller)
    minWidth: 25,
    minHeight: 10,
  },
  tower: {
    swayAngle: 0.02, // Reduced from 0.08 (was ~4.5 degrees, now ~1.1 degrees)
    swaySpeed: 1.5,
  },
  floor: {
    groundHeight: 100, // Fixed height from bottom where ground and tower start (100px from bottom)
    tileSize: 32,
    grassRows: 1,
    earthRows: 8, // Increased for more safe space below ground
  },
  collision: {
    earlyDetectionPixels: 0, // Set to 0 for precise collision detection
  },
}
