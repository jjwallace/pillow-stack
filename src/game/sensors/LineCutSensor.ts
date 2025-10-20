import Phaser from "phaser";
import { PillowStackingSystem } from "../systems/PillowStackingSystem";

export class LineCutSensor {
  private scene: Phaser.Scene;
  private pillowStackingSystem: PillowStackingSystem;

  constructor(scene: Phaser.Scene, pillowStackingSystem: PillowStackingSystem) {
    this.scene = scene;
    this.pillowStackingSystem = pillowStackingSystem;
  }

  checkLineCut(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    lineX: number,
    lineBottom: number
  ) {
    const lineTop = 0;

    const crossesLineX =
      (x1 <= lineX && x2 >= lineX) || (x1 >= lineX && x2 <= lineX);

    if (crossesLineX) {
      const dx = x2 - x1;
      const dy = y2 - y1;
      const t = (lineX - x1) / dx;
      const intersectY = y1 + dy * t;

      if (intersectY >= lineTop && intersectY <= lineBottom) {
        this.cutLine(intersectY);
      }
    }
  }

  cutLine(cutY: number) {
    this.pillowStackingSystem.setLineCut(true);
    this.pillowStackingSystem.setCutY(cutY);
    this.pillowStackingSystem.setShowLine(false);

    const snipSound = Math.random() < 0.5 ? "snip" : "snip2";
    this.scene.sound.play(snipSound);

    this.pillowStackingSystem.setUpperLineEndY(cutY);

    this.pillowStackingSystem.dropPillow();

    this.scene.tweens.add({
      targets: this.pillowStackingSystem,
      upperLineEndY: 0,
      duration: 800,
      ease: "Power2.easeIn",
    });
  }
}
