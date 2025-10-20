import Phaser from "phaser";
import { Duck } from "../entities/Duck";

export class DuckFactory {
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  createDuck(
    x: number,
    y: number,
    flipX: boolean,
    velocityX: number,
    groundY: number
  ): Duck {
    const duck = new Duck(this.scene, x, y, "spritesheet");
    duck.play("fly");
    duck.setFlipX(flipX);
    (duck.body as Phaser.Physics.Arcade.Body).setVelocityX(velocityX);
    duck.setData("groundY", groundY);
    return duck;
  }
}
