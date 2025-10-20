import Phaser from "phaser";
import { DuckFactory } from "../factories/DuckFactory";
import { WorldScrollingSystem } from "./WorldScrollingSystem";
import { Duck } from "../entities/Duck";

export class DuckSystem {
  private scene: Phaser.Scene;
  private duckFactory: DuckFactory;
  private worldScrollingSystem: WorldScrollingSystem;
  private ducks!: Phaser.GameObjects.Group;
  private activeDuckCount: number = 0;

  constructor(
    scene: Phaser.Scene,
    duckFactory: DuckFactory,
    worldScrollingSystem: WorldScrollingSystem
  ) {
    this.scene = scene;
    this.duckFactory = duckFactory;
    this.worldScrollingSystem = worldScrollingSystem;
  }

  create() {
    this.ducks = this.scene.add.group({
      runChildUpdate: true,
    });

    this.scene.time.addEvent({
      delay: 1000,
      callback: this.spawnDuck,
      callbackScope: this,
      loop: true,
    });

    this.spawnDuck(); // Initial spawn
  }

  spawnDuck() {
    if (this.activeDuckCount >= 12) {
      return;
    }

    const width = this.scene.cameras.main.width;
    const height = this.scene.cameras.main.height;

    const spawnOnLeft = Math.random() < 0.5;
    const x = spawnOnLeft ? -50 : width + 50;

    const screenY = Phaser.Math.Between(100, height - 150);

    const groundLevel = this.worldScrollingSystem.getGroundLevel();
    const worldY =
      groundLevel - screenY + this.worldScrollingSystem.getWorldY();

    const velocityX = spawnOnLeft ? 150 : -150;
    const flipX = !spawnOnLeft;

    const duck = this.duckFactory.createDuck(
      x,
      screenY,
      flipX,
      velocityX,
      worldY
    );

    this.ducks.add(duck);
    this.activeDuckCount++;
  }

  removeDuck(duck: Duck) {
    duck.destroy();
    this.activeDuckCount--;
  }

  getDucks(): Phaser.GameObjects.Group {
    return this.ducks;
  }

  update() {
    const width = this.scene.cameras.main.width;
    const groundLevel = this.worldScrollingSystem.getGroundLevel();
    const worldY = this.worldScrollingSystem.getWorldY();

    this.ducks.children.entries.forEach((child) => {
      const duck = child as Duck;
      const body = duck.body as Phaser.Physics.Arcade.Body;

      const groundY = duck.getData("groundY");
      if (groundY !== undefined) {
        duck.y = groundLevel - groundY + worldY;
      }

      if (duck.x > width + 50) {
        duck.x = -50;
        duck.setFlipX(false);
        body.setVelocityX(150);
      } else if (duck.x < -50) {
        duck.x = width + 50;
        duck.setFlipX(true);
        body.setVelocityX(-150);
      }
    });
  }
}
