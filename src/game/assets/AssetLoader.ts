import Phaser from "phaser";

export class AssetLoader {
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  preload() {
    this.scene.load.spritesheet(
      "spritesheet",
      "/assets/gameobjects/spritesheet.png",
      {
        frameWidth: 32,
        frameHeight: 32,
      }
    );
    this.scene.load.spritesheet(
      "spritesheet-nature",
      "/assets/gameobjects/spritesheet-nature.png",
      {
        frameWidth: 32,
        frameHeight: 32,
      }
    );
    this.scene.load.image("sky", "/assets/gameobjects/sky-tile.png");
    this.scene.load.image("balloon", "/assets/gameobjects/balloon.png");
    this.scene.load.image("disk", "/assets/gameobjects/disk.png");
    this.scene.load.image("cloud1", "/assets/gameobjects/cloud1.png");
    this.scene.load.image("cloud2", "/assets/gameobjects/cloud2.png");
    this.scene.load.image("cloud3", "/assets/gameobjects/cloud3.png");
    this.scene.load.image("cloud4", "/assets/gameobjects/cloud4.png");
    this.scene.load.image("cloud5", "/assets/gameobjects/cloud5.png");
    this.scene.load.image("cloud6", "/assets/gameobjects/cloud6.png");
    this.scene.load.image("cloud7", "/assets/gameobjects/cloud7.png");
    this.scene.load.image("cloud8", "/assets/gameobjects/cloud8.png");

    this.scene.load.audio("pillowHit", "/assets/sfx/pillow-hit.wav");
    this.scene.load.audio("snip", "/assets/sfx/snip.mp3");
    this.scene.load.audio("snip2", "/assets/sfx/snip2.mp3");
    this.scene.load.audio("impact", "/assets/sfx/impact.mp3");
    this.scene.load.audio("impact2", "/assets/sfx/impact2.mp3");
    this.scene.load.audio("fail", "/assets/sfx/fail.mp3");
  }
}
