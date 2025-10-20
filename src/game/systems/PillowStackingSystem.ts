import Phaser from "phaser";
import { GAME_CONFIG } from "../config";
import { PillowFactory } from "../factories/PillowFactory";
import { WorldScrollingSystem } from "./WorldScrollingSystem";
import { Pillow } from "../entities/Pillow";

export class PillowStackingSystem {
  private scene: Phaser.Scene;
  private pillowFactory: PillowFactory;
  private worldScrollingSystem: WorldScrollingSystem;

  private pillowStack: Pillow[] = [];
  private pillowConnectionOffsets: number[] = [];
  private pillowHeights: number[] = [];
  private floatingPillow!: Pillow;
  private floatingPillowFeatherCount: number = 0;
  private isDropping: boolean = false;
  private dropCount: number = 0;
  private pillowVelocityY: number = 0;
  private towerSwayAngle: number = 0;
  private pivotPoint!: { x: number; y: number };
  private lineAnimating: boolean = false;
  private lineRetractY: number = 0;
  private canClickPillow: boolean = false;
  private pillowLoweringTargetY: number = 0;
  private pillowLoweringStartY: number = 0;
  private pillowLoweringStartTime: number = 0;
  private pillowLoweringDuration: number = 800;

  // Line drawing graphics
  private suspensionLine!: Phaser.GameObjects.Graphics;
  private upperLineSegment!: Phaser.GameObjects.Graphics;
  private lowerLineSegment!: Phaser.GameObjects.Graphics;
  private lineCut: boolean = false;
  private cutY: number = 0;
  private upperLineEndY: number = 0;
  private lowerLineStartY: number = 0;
  private showLine: boolean = true;

  constructor(
    scene: Phaser.Scene,
    pillowFactory: PillowFactory,
    worldScrollingSystem: WorldScrollingSystem
  ) {
    this.scene = scene;
    this.pillowFactory = pillowFactory;
    this.worldScrollingSystem = worldScrollingSystem;
  }

  create() {
    const width = this.scene.cameras.main.width;
    const height = this.scene.cameras.main.height;

    this.pivotPoint = {
      x: width / 2,
      y: this.worldScrollingSystem.getGroundLevel(),
    };

    this.pillowStack = [];
    this.pillowConnectionOffsets = [0];

    this.suspensionLine = this.scene.add.graphics();
    this.suspensionLine.setDepth(98);

    this.upperLineSegment = this.scene.add.graphics();
    this.upperLineSegment.setDepth(98);

    this.lowerLineSegment = this.scene.add.graphics();
    this.lowerLineSegment.setDepth(98);

    this.createFloatingPillow();
  }

  createFloatingPillow() {
    const width = this.scene.cameras.main.width;

    this.lineCut = false;
    this.cutY = 0;
    this.upperLineEndY = 0;
    this.lowerLineStartY = 0;
    this.upperLineSegment.clear();
    this.lowerLineSegment.clear();

    let targetY: number;
    const newPillowHeight = GAME_CONFIG.pillow.minHeight;

    if (this.pillowStack.length === 0) {
      targetY =
        this.worldScrollingSystem.getGroundLevel() -
        80 -
        this.worldScrollingSystem.getWorldY();
    } else {
      const topPillow = this.pillowStack[this.pillowStack.length - 1];
      const topPillowHeight = this.pillowHeights[this.pillowHeights.length - 1];
      const heightAboveTower = Math.min(50 + this.dropCount * 10, 80);
      targetY =
        topPillow.y -
        topPillowHeight / 2 -
        newPillowHeight / 2 -
        heightAboveTower;
    }

    this.floatingPillow = this.pillowFactory.createFloatingPillow(
      width / 2,
      0,
      GAME_CONFIG.pillow.minWidth,
      GAME_CONFIG.pillow.minHeight
    );
    this.floatingPillow.setDepth(99);
    this.floatingPillowFeatherCount = 0;
    this.lineAnimating = true;
    this.showLine = true;
    this.lineRetractY = 0;
    this.pillowVelocityY = 0;
    this.canClickPillow = false;

    this.pillowLoweringTargetY = targetY;
    this.pillowLoweringStartY = 0;
    this.pillowLoweringStartTime = this.scene.time.now;
    this.pillowLoweringDuration = 800;

    this.scene.tweens.add({
      targets: this,
      lineRetractY: targetY,
      duration: 800,
      ease: "Power1",
    });
  }

  dropPillow() {
    this.isDropping = true;
    this.showLine = false;

    this.scene.tweens.killTweensOf(this.floatingPillow);
    this.scene.tweens.killTweensOf(this);

    this.pillowVelocityY = 0;
    this.floatingPillow.body.setAllowGravity(true);
    this.floatingPillow.body.setImmovable(false);
  }

  checkPillowLanding() {
    if (!this.floatingPillow || !this.isDropping) return;

    const groundLevel =
      this.worldScrollingSystem.getGroundLevel() -
      5 -
      this.worldScrollingSystem.getWorldY();

    let landingY: number;
    let collisionTarget: number;
    let targetX: number;

    const heightGrowthPerFeather =
      (GAME_CONFIG.pillow.maxHeight - GAME_CONFIG.pillow.minHeight) / 46;
    const dropPillowHeight = Math.min(
      GAME_CONFIG.pillow.minHeight +
        this.floatingPillowFeatherCount * heightGrowthPerFeather,
      GAME_CONFIG.pillow.maxHeight
    );

    if (this.pillowStack.length === 0) {
      landingY = groundLevel - dropPillowHeight / 2;
      collisionTarget = landingY + dropPillowHeight / 2 - 5;
      targetX = this.floatingPillow.x;
    } else {
      const topPillow = this.pillowStack[this.pillowStack.length - 1];
      const topPillowHeight = this.pillowHeights[this.pillowHeights.length - 1];
      landingY = topPillow.y - topPillowHeight / 2 - dropPillowHeight / 2;
      collisionTarget = landingY + dropPillowHeight / 2 - 5;
      targetX = topPillow.x;
    }

    const widthGrowthPerFeather =
      (GAME_CONFIG.pillow.maxWidth - GAME_CONFIG.pillow.minWidth) / 46;
    const dropPillowWidth =
      GAME_CONFIG.pillow.minWidth +
      this.floatingPillowFeatherCount * widthGrowthPerFeather;
    const dropPillowBottom = this.floatingPillow.y + dropPillowHeight / 2;

    if (
      dropPillowBottom >=
      collisionTarget - GAME_CONFIG.collision.earlyDetectionPixels
    ) {
      const dropPillowLeft = this.floatingPillow.x - dropPillowWidth / 2;
      const dropPillowRight = this.floatingPillow.x + dropPillowWidth / 2;

      const collisionMargin = 20;
      const targetCollisionLeft =
        targetX - GAME_CONFIG.pillow.minWidth + collisionMargin;
      const targetCollisionRight =
        targetX + GAME_CONFIG.pillow.minWidth - collisionMargin;

      const overlapsCollisionArea =
        dropPillowRight >= targetCollisionLeft &&
        dropPillowLeft <= targetCollisionRight;

      if (overlapsCollisionArea) {
        this.scene.sound.play("impact");

        this.isDropping = false;
        this.pillowVelocityY = 0;
        this.floatingPillow.body.setAllowGravity(false);
        this.floatingPillow.body.setImmovable(true);
        this.floatingPillow.body.setVelocity(0, 0);

        const landedX = this.floatingPillow.x;

        this.floatingPillow.x = landedX;
        this.floatingPillow.y = landingY;
        this.floatingPillow.rotation = 0;

        if (this.pillowStack.length === 0) {
          this.pillowConnectionOffsets[0] = landedX;
          this.pivotPoint.x = landedX;
        } else {
          const connectionOffset = landedX - targetX;
          this.pillowConnectionOffsets.push(connectionOffset);
        }

        const currentHeight = Math.min(
          GAME_CONFIG.pillow.minHeight +
            this.floatingPillowFeatherCount * heightGrowthPerFeather,
          GAME_CONFIG.pillow.maxHeight
        );
        this.pillowHeights.push(currentHeight);

        this.pillowStack.push(this.floatingPillow);

        this.dropCount++;

        this.scene.tweens.killTweensOf(this);

        this.lineRetractY = 0;

        this.lineCut = false;
        this.upperLineSegment.clear();
        this.lowerLineSegment.clear();

        this.createFloatingPillow();

        return;
      } else if (this.pillowStack.length > 0) {
        const targetFullLeft = targetX - GAME_CONFIG.pillow.minWidth;
        const targetFullRight = targetX + GAME_CONFIG.pillow.minWidth;
        const overlapsTarget =
          dropPillowRight >= targetFullLeft &&
          dropPillowLeft <= targetFullRight;

        if (overlapsTarget) {
          const missedLeft = dropPillowRight < targetCollisionLeft;
          const spinDirection = missedLeft ? -1 : 1;

          this.floatingPillow.setData("angularVelocity", spinDirection * 3);
          this.floatingPillow.setData(
            "horizontalVelocity",
            spinDirection * 100
          );
          this.floatingPillow.setData("isFalling", true);
        }
      }

      if (this.floatingPillow.y > this.scene.cameras.main.height + 50) {
        this.scene.sound.play("fail");

        this.floatingPillow.destroy();
        this.isDropping = false;
        this.pillowVelocityY = 0;

        this.lineCut = false;
        this.upperLineSegment.clear();
        this.lowerLineSegment.clear();

        this.scene.events.emit("pillowMissed"); // Emit event for UI system
      }
    }
  }

  updatePillowSway() {
    if (this.pillowStack.length <= 1) return;

    const time = this.scene.time.now / 1000;
    this.towerSwayAngle =
      Math.sin(time * GAME_CONFIG.tower.swaySpeed) *
      GAME_CONFIG.tower.swayAngle;

    const combinedAngle = this.towerSwayAngle;

    const groundLevel =
      this.worldScrollingSystem.getGroundLevel() -
      5 -
      this.worldScrollingSystem.getWorldY();

    for (let i = 0; i < this.pillowStack.length; i++) {
      const pillow = this.pillowStack[i];

      let baseX: number;
      if (i === 0) {
        baseX = this.pillowConnectionOffsets[0];
      } else {
        baseX = this.pillowConnectionOffsets[0];
        for (let j = 1; j <= i; j++) {
          baseX += this.pillowConnectionOffsets[j];
        }
      }

      let stackHeight = 0;

      stackHeight += this.pillowHeights[i] / 2;

      for (let j = 0; j < i; j++) {
        stackHeight += this.pillowHeights[j];
      }

      const baseY = groundLevel - stackHeight;

      const pivotX = this.pivotPoint.x;
      const pivotY = this.pivotPoint.y - this.worldScrollingSystem.getWorldY();
      const relativeX = baseX - pivotX;
      const relativeY = baseY - pivotY;

      const rotatedX =
        relativeX * Math.cos(combinedAngle) -
        relativeY * Math.sin(combinedAngle);
      const rotatedY =
        relativeX * Math.sin(combinedAngle) +
        relativeY * Math.cos(combinedAngle);

      pillow.x = rotatedX + pivotX;
      pillow.y = rotatedY + pivotY;

      pillow.rotation = combinedAngle;
    }
  }

  handleResize(gameSize: Phaser.Structs.Size) {
    const width = gameSize.width;
    const height = gameSize.height;

    this.pivotPoint.x = width / 2;
    this.pivotPoint.y = height - GAME_CONFIG.floor.groundHeight;

    if (this.floatingPillow && !this.isDropping) {
      const currentOffset = this.floatingPillow.x - width / 2;
      this.floatingPillow.x = width / 2 + currentOffset;
    }
  }

  update(delta: number) {
    this.checkPillowLanding();

    if (this.isDropping && this.floatingPillow) {
      const gravity = 800;
      const deltaTime = delta / 1000;
      this.pillowVelocityY += gravity * deltaTime;
      this.floatingPillow.y += this.pillowVelocityY * deltaTime;

      const isFalling = this.floatingPillow.getData("isFalling");
      if (isFalling) {
        const angularVelocity =
          this.floatingPillow.getData("angularVelocity") || 0;
        const horizontalVelocity =
          this.floatingPillow.getData("horizontalVelocity") || 0;

        this.floatingPillow.rotation += angularVelocity * deltaTime;
        this.floatingPillow.x += horizontalVelocity * deltaTime;
      }
    }

    this.updatePillowSway();

    if (this.floatingPillow && !this.isDropping) {
      const time = this.scene.time.now / 1000;
      const swayAmount = 1 + this.dropCount;
      const sway = Math.sin(time * 2) * swayAmount;

      this.floatingPillow.x = this.scene.cameras.main.width / 2 + sway;

      if (this.lineAnimating) {
        const elapsed = this.scene.time.now - this.pillowLoweringStartTime;
        const progress = Math.min(elapsed / this.pillowLoweringDuration, 1);

        const easedProgress = progress * (2 - progress);

        this.floatingPillow.y =
          this.pillowLoweringStartY +
          (this.pillowLoweringTargetY - this.pillowLoweringStartY) *
            easedProgress;

        const halfwayY = this.pillowLoweringTargetY / 2;
        if (this.floatingPillow.y >= halfwayY && !this.canClickPillow) {
          this.canClickPillow = true;
        }

        if (progress >= 1) {
          this.floatingPillow.y = this.pillowLoweringTargetY;
          this.lineAnimating = false;
        }
      }
    }

    if (this.floatingPillow) {
      if (this.lineCut) {
        this.upperLineSegment.clear();
        if (this.upperLineEndY > 0) {
          this.upperLineSegment.lineStyle(1, 0xffffff, 0.5);
          this.upperLineSegment.beginPath();
          this.upperLineSegment.moveTo(this.floatingPillow.x, 0);
          this.upperLineSegment.lineTo(
            this.floatingPillow.x,
            this.upperLineEndY
          );
          this.upperLineSegment.strokePath();
        }

        const targetDistance = 20;
        const targetStartY = Math.max(
          this.cutY,
          this.floatingPillow.y - targetDistance
        );
        this.lowerLineStartY += (targetStartY - this.lowerLineStartY) * 0.3;

        this.lowerLineSegment.clear();
        if (this.floatingPillow.y > this.lowerLineStartY) {
          this.lowerLineSegment.lineStyle(1, 0xffffff, 0.5);
          this.lowerLineSegment.beginPath();
          this.lowerLineSegment.moveTo(
            this.floatingPillow.x,
            this.lowerLineStartY
          );
          this.lowerLineSegment.lineTo(
            this.floatingPillow.x,
            this.floatingPillow.y
          );
          this.lowerLineSegment.strokePath();
        }

        this.suspensionLine.clear();
      } else if (this.showLine) {
        this.suspensionLine.clear();
        this.suspensionLine.lineStyle(1, 0xffffff, 0.5);
        this.suspensionLine.beginPath();
        this.suspensionLine.moveTo(this.floatingPillow.x, 0);
        this.suspensionLine.lineTo(this.floatingPillow.x, this.lineRetractY);
        this.suspensionLine.strokePath();

        this.upperLineSegment.clear();
        this.lowerLineSegment.clear();
      } else {
        this.suspensionLine.clear();
        this.upperLineSegment.clear();
        this.lowerLineSegment.clear();
      }
    }
  }

  getPillowStackLength(): number {
    return this.pillowStack.length;
  }

  getFloatingPillow(): Pillow {
    return this.floatingPillow;
  }

  getIsDropping(): boolean {
    return this.isDropping;
  }

  getCanClickPillow(): boolean {
    return this.canClickPillow;
  }

  getShowLine(): boolean {
    return this.showLine;
  }

  getLineCut(): boolean {
    return this.lineCut;
  }

  getLineRetractY(): number {
    return this.lineRetractY;
  }

  getCutY(): number {
    return this.cutY;
  }

  getUpperLineEndY(): number {
    return this.upperLineEndY;
  }

  getLowerLineStartY(): number {
    return this.lowerLineStartY;
  }

  setLineCut(value: boolean) {
    this.lineCut = value;
  }

  setCutY(value: number) {
    this.cutY = value;
  }

  setUpperLineEndY(value: number) {
    this.upperLineEndY = value;
  }

  setShowLine(value: boolean) {
    this.showLine = value;
  }

  collectFeather() {
    this.floatingPillowFeatherCount++;
    const widthGrowthPerFeather =
      (GAME_CONFIG.pillow.maxWidth - GAME_CONFIG.pillow.minWidth) / 46;
    const newWidth = Math.min(
      GAME_CONFIG.pillow.minWidth +
        this.floatingPillowFeatherCount * widthGrowthPerFeather,
      GAME_CONFIG.pillow.maxWidth
    );

    const heightGrowthPerFeather =
      (GAME_CONFIG.pillow.maxHeight - GAME_CONFIG.pillow.minHeight) / 46;
    const newThickness = Math.min(
      GAME_CONFIG.pillow.minHeight +
        this.floatingPillowFeatherCount * heightGrowthPerFeather,
      GAME_CONFIG.pillow.maxHeight
    );

    this.floatingPillow.updateAppearance(
      newWidth,
      newThickness,
      0xffffff,
      GAME_CONFIG.pillow.minHeight
    );
  }
}
