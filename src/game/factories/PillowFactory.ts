import Phaser from "phaser";
import { GAME_CONFIG } from "../config";
import { Pillow } from "../entities/Pillow";

export class PillowFactory {
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  createPillowGraphics(
    width: number,
    thickness: number,
    color: number
  ): Phaser.GameObjects.Graphics {
    const pillow = this.scene.add.graphics();
    pillow.fillStyle(color, 1);
    pillow.fillRoundedRect(-width / 2, -thickness / 2, width, thickness, 10);
    pillow.lineStyle(2, 0x999999, 1);
    pillow.strokeRoundedRect(-width / 2, -thickness / 2, width, thickness, 10);
    pillow.setDepth(2);
    return pillow;
  }

  createFloatingPillow(
    x: number,
    y: number,
    width: number,
    height: number
  ): Pillow {
    const pillow = new Pillow(
      this.scene,
      x,
      y,
      width,
      height,
      0xffffff,
      GAME_CONFIG.pillow.minHeight
    );
    pillow.setDepth(99);
    return pillow;
  }
}
