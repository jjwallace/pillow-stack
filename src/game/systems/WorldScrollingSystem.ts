import Phaser from "phaser";
import { GAME_CONFIG } from "../config";

export class WorldScrollingSystem {
  private scene: Phaser.Scene;
  private groundHeight: number;
  private floorTiles: Phaser.GameObjects.Image[] = [];
  private worldY: number = 0; // World vertical offset - everything is positioned relative to ground
  private lastGroundHeight: number;

  constructor(scene: Phaser.Scene, initialGroundHeight: number) {
    this.scene = scene;
    this.groundHeight = initialGroundHeight;
    this.lastGroundHeight = initialGroundHeight;
  }

  getGroundLevel(): number {
    return this.scene.cameras.main.height - this.groundHeight;
  }

  getWorldY(): number {
    return this.worldY;
  }

  setWorldY(y: number) {
    this.worldY = y;
  }

  createFloorTiles() {
    this.floorTiles.forEach((tile) => tile.destroy());
    this.floorTiles = [];

    const width = this.scene.cameras.main.width;
    const height = this.scene.cameras.main.height;
    const tileSize = GAME_CONFIG.floor.tileSize;

    const startX = -1000;
    const endX = width + 1000;
    const tilesWide = Math.ceil((endX - startX) / tileSize) + 1;

    const floorStartY = height - GAME_CONFIG.floor.groundHeight;

    const grassFrameIndex = 4 * 10 + 3;
    const earthFrameIndex = 5 * 10 + 3;

    for (let i = 0; i < tilesWide; i++) {
      const x = startX + i * tileSize;
      const baseY = floorStartY - 10;
      const grassTile = this.scene.add.image(
        x,
        baseY,
        "spritesheet-nature",
        grassFrameIndex
      );
      grassTile.setOrigin(0, 0);
      grassTile.setDepth(-1);
      grassTile.setData("baseY", baseY);
      this.floorTiles.push(grassTile);
    }

    for (let y = 1; y <= GAME_CONFIG.floor.earthRows; y++) {
      for (let i = 0; i < tilesWide; i++) {
        const x = startX + i * tileSize;
        const baseY = floorStartY - 10 + y * tileSize;
        const earthTile = this.scene.add.image(
          x,
          baseY,
          "spritesheet-nature",
          earthFrameIndex
        );
        earthTile.setOrigin(0, 0);
        earthTile.setDepth(-1);
        earthTile.setData("baseY", baseY);
        this.floorTiles.push(earthTile);
      }
    }
  }

  handleResize(gameSize: Phaser.Structs.Size) {
    this.createFloorTiles();
  }

  update() {
    if (GAME_CONFIG.floor.groundHeight !== this.lastGroundHeight) {
      this.lastGroundHeight = GAME_CONFIG.floor.groundHeight;
      this.createFloorTiles();
    }

    const groundLevel = this.getGroundLevel();
    this.floorTiles.forEach((tile) => {
      const baseY = tile.getData("baseY");
      if (baseY !== undefined) {
        tile.y = baseY - this.worldY;
      }
    });
  }
}
