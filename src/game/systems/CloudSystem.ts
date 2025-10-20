import Phaser from "phaser";
import { WorldScrollingSystem } from "./WorldScrollingSystem";

export class CloudSystem {
  private scene: Phaser.Scene;
  private worldScrollingSystem: WorldScrollingSystem;
  private clouds!: Phaser.GameObjects.Group;
  private horizonClouds!: Phaser.GameObjects.Group;

  constructor(scene: Phaser.Scene, worldScrollingSystem: WorldScrollingSystem) {
    this.scene = scene;
    this.worldScrollingSystem = worldScrollingSystem;
  }

  create() {
    this.clouds = this.scene.add.group({
      runChildUpdate: true,
    });

    this.horizonClouds = this.scene.add.group({
      runChildUpdate: true,
    });

    for (let i = 0; i < 30; i++) {
      this.spawnCloud();
    }

    for (let i = 0; i < 50; i++) {
      this.spawnHorizonCloud();
    }
  }

  spawnCloud() {
    const width = this.scene.cameras.main.width;
    const height = this.scene.cameras.main.height;

    const cloudNumber = Phaser.Math.Between(1, 8);
    const cloudKey = `cloud${cloudNumber}`;

    const x = Phaser.Math.Between(0, width);

    const screenY = Phaser.Math.Between(50, height - 150);

    const groundLevel = this.worldScrollingSystem.getGroundLevel();
    const worldY =
      groundLevel - screenY + this.worldScrollingSystem.getWorldY();

    const cloud = this.scene.add.image(x, screenY, cloudKey);
    cloud.setScale(0.1);
    cloud.setAlpha(0.7);
    cloud.setDepth(-2);

    cloud.setData("groundY", worldY);
    cloud.setData("baseSpeed", Phaser.Math.Between(10, 25));

    this.scene.physics.add.existing(cloud);
    const body = cloud.body as Phaser.Physics.Arcade.Body;

    const speed = cloud.getData("baseSpeed");
    body.setVelocityX(-speed);

    this.clouds.add(cloud);
  }

  spawnHorizonCloud() {
    const width = this.scene.cameras.main.width;

    const cloudNumber = Phaser.Math.Between(1, 8);
    const cloudKey = `cloud${cloudNumber}`;

    const x = Phaser.Math.Between(0, width);

    const horizonOffset = Phaser.Math.Between(-25, 25);
    const screenY = -100 + horizonOffset;

    const groundLevel = this.worldScrollingSystem.getGroundLevel();
    const worldY =
      groundLevel - screenY + this.worldScrollingSystem.getWorldY();

    const cloud = this.scene.add.image(x, screenY, cloudKey);
    cloud.setScale(0.1);
    cloud.setAlpha(0.8);
    cloud.setDepth(10);

    cloud.setData("groundY", worldY);
    cloud.setData("horizonOffset", horizonOffset);

    this.scene.physics.add.existing(cloud);
    const body = cloud.body as Phaser.Physics.Arcade.Body;
    body.setVelocityX(-Phaser.Math.Between(30, 40));

    this.horizonClouds.add(cloud);
  }

  update() {
    const width = this.scene.cameras.main.width;
    const groundLevel = this.worldScrollingSystem.getGroundLevel();
    const worldY = this.worldScrollingSystem.getWorldY();

    this.clouds.children.entries.forEach((child) => {
      const cloud = child as Phaser.GameObjects.Image;
      const body = cloud.body as Phaser.Physics.Arcade.Body;

      const groundY = cloud.getData("groundY");
      if (groundY !== undefined) {
        cloud.y = groundLevel - groundY + worldY;
      }

      const baseSpeed = cloud.getData("baseSpeed") || 15;
      const heightMultiplier = 1 + worldY / 500;
      const currentSpeed = baseSpeed * heightMultiplier;
      body.setVelocityX(-currentSpeed);

      if (cloud.x < -200) {
        cloud.x = width + 200;
      }

      if (cloud.y > this.scene.cameras.main.height + 200 || cloud.y < -400) {
        cloud.destroy();
      }
    });

    this.horizonClouds.children.entries.forEach((child) => {
      const cloud = child as Phaser.GameObjects.Image;
      const body = cloud.body as Phaser.Physics.Arcade.Body;

      const horizonOffset = cloud.getData("horizonOffset") || 0;
      cloud.y = -100 + horizonOffset;

      const heightMultiplier = 1 + worldY / 400;
      const currentSpeed = Phaser.Math.Between(30, 40) * heightMultiplier;
      body.setVelocityX(-currentSpeed);

      if (cloud.x < -200) {
        cloud.x = width + 200;
        const newOffset = Phaser.Math.Between(-25, 25);
        cloud.setData("horizonOffset", newOffset);
      }
    });
  }
}
