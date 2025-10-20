import Phaser from "phaser";

export class Pillow extends Phaser.GameObjects.Graphics {
  declare body: Phaser.Physics.Arcade.Body;

  private _width: number;
  private _height: number;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    width: number,
    height: number,
    color: number,
    thickness: number
  ) {
    super(scene, { x, y });
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.x = x;
    this.y = y;
    this.setDepth(2);

    this._width = width;
    this._height = height;

    this.drawPillow(width, thickness, color);

    this.body.setAllowGravity(false);
    this.body.setImmovable(true);
    this.body.setSize(width, height); // Set physics body size
  }

  private drawPillow(width: number, thickness: number, color: number) {
    this.clear();
    this.fillStyle(color, 1);
    this.fillRoundedRect(-width / 2, -thickness / 2, width, thickness, 10);
    this.lineStyle(2, 0x999999, 1);
    this.strokeRoundedRect(-width / 2, -thickness / 2, width, thickness, 10);
  }

  updateAppearance(
    width: number,
    height: number,
    color: number,
    thickness: number
  ) {
    this._width = width;
    this._height = height;
    this.drawPillow(width, thickness, color);
    this.body.setSize(width, height); // Update physics body size
  }

  get width(): number {
    return this._width;
  }

  get height(): number {
    return this._height;
  }
}
