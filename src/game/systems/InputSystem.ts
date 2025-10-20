import Phaser from "phaser";
import { DuckSystem } from "./DuckSystem";
import { PillowStackingSystem } from "./PillowStackingSystem";
import { LineCutSensor } from "../sensors/LineCutSensor";

export class InputSystem {
  private scene: Phaser.Scene;
  private duckSystem: DuckSystem;
  private pillowStackingSystem: PillowStackingSystem;
  private lineCutSensor: LineCutSensor;

  private currentX: number = 0;
  private currentY: number = 0;
  private targetX: number = 0;
  private targetY: number = 0;
  private lastPointerX: number = 0;
  private lastPointerY: number = 0;
  private isPointerDown: boolean = false;
  private mouseTrailEmitter!: Phaser.GameObjects.Particles.ParticleEmitter;

  constructor(
    scene: Phaser.Scene,
    duckSystem: DuckSystem,
    pillowStackingSystem: PillowStackingSystem,
    lineCutSensor: LineCutSensor
  ) {
    this.scene = scene;
    this.duckSystem = duckSystem;
    this.pillowStackingSystem = pillowStackingSystem;
    this.lineCutSensor = lineCutSensor;
  }

  create() {
    const width = this.scene.cameras.main.width;
    const height = this.scene.cameras.main.height;

    this.createMouseParticles();

    this.mouseTrailEmitter = this.scene.add.particles(0, 0, "mouseParticle", {
      speed: 0,
      scale: { start: 0.4, end: 0.1 },
      alpha: { start: 0.8, end: 0 },
      lifespan: 400,
      blendMode: "NORMAL",
      frequency: -1,
    });
    this.mouseTrailEmitter.setDepth(10);

    this.currentX = width / 2;
    this.currentY = height / 2;
    this.targetX = width / 2;
    this.targetY = height / 2;

    this.scene.input.on("pointermove", (pointer: Phaser.Input.Pointer) => {
      this.targetX = pointer.x;
      this.targetY = pointer.y;

      if (
        this.isPointerDown &&
        !this.pillowStackingSystem.getIsDropping() &&
        this.pillowStackingSystem.getFloatingPillow() &&
        this.pillowStackingSystem.getCanClickPillow() &&
        this.pillowStackingSystem.getShowLine() &&
        !this.pillowStackingSystem.getLineCut()
      ) {
        this.lineCutSensor.checkLineCut(
          this.lastPointerX,
          this.lastPointerY,
          pointer.x,
          pointer.y,
          this.pillowStackingSystem.getFloatingPillow().x,
          this.pillowStackingSystem.getLineRetractY()
        );
      }

      this.lastPointerX = pointer.x;
      this.lastPointerY = pointer.y;
    });

    this.scene.input.on("pointerup", () => {
      this.isPointerDown = false;
    });

    this.scene.time.addEvent({
      delay: 8,
      callback: () => {
        const prevX = this.currentX;
        const prevY = this.currentY;

        const smoothing = 0.15;
        this.currentX += (this.targetX - this.currentX) * smoothing;
        this.currentY += (this.targetY - this.currentY) * smoothing;

        const dx = this.currentX - prevX;
        const dy = this.currentY - prevY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        const particleCount = Math.ceil(distance / 4) + 1;

        for (let i = 0; i < particleCount; i++) {
          const t = i / particleCount;
          const interpX = prevX + dx * t;
          const interpY = prevY + dy * t;
          this.mouseTrailEmitter.emitParticleAt(interpX, interpY, 1);
        }
      },
      loop: true,
    });

    this.scene.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      this.isPointerDown = true;
      this.lastPointerX = pointer.x;
      this.lastPointerY = pointer.y;

      const clickedDuck = this.duckSystem.getDucks().getChildren().find((duck) => {
        const sprite = duck as Phaser.GameObjects.Sprite;
        const bounds = sprite.getBounds();
        return bounds.contains(pointer.x, pointer.y);
      }) as Phaser.GameObjects.Sprite | undefined;

      if (clickedDuck) {
        this.scene.sound.play("pillowHit");
        this.createFeatherExplosion(clickedDuck.x, clickedDuck.y);
        this.duckSystem.removeDuck(clickedDuck as any); // Cast to any for now
      } else if (
        !this.pillowStackingSystem.getIsDropping() &&
        this.pillowStackingSystem.getFloatingPillow() &&
        this.pillowStackingSystem.getCanClickPillow()
      ) {
        const tapAreaPadding = 20;
        const floatingPillow = this.pillowStackingSystem.getFloatingPillow();
        const pillowWidth = floatingPillow.width; // Assuming width is set on pillow entity
        const pillowHeight = floatingPillow.height; // Assuming height is set on pillow entity

        const pillowLeft = floatingPillow.x - pillowWidth / 2 - tapAreaPadding;
        const pillowRight = floatingPillow.x + pillowWidth / 2 + tapAreaPadding;
        const pillowTop = floatingPillow.y - pillowHeight / 2 - tapAreaPadding;
        const pillowBottom = floatingPillow.y + pillowHeight / 2 + tapAreaPadding;

        const tappedPillow =
          pointer.x >= pillowLeft &&
          pointer.x <= pillowRight &&
          pointer.y >= pillowTop &&
          pointer.y <= pillowBottom;

        if (tappedPillow) {
          this.pillowStackingSystem.dropPillow();
        }
      }
    });
  }

  createMouseParticles() {
    const size = 12;
    const graphics = this.scene.add.graphics();
    for (let i = size / 2; i > 0; i -= 2) {
      const alpha = Math.pow(i / (size / 2), 2) * 0.6;
      graphics.fillStyle(0xffffff, alpha);
      graphics.fillCircle(size / 2, size / 2, i);
    }
    graphics.generateTexture("mouseParticle", size, size);
    graphics.destroy();

    const featherGraphics1 = this.scene.add.graphics();
    featherGraphics1.fillStyle(0xffffff, 1);
    featherGraphics1.fillRect(0, 0, 1, 1);
    featherGraphics1.generateTexture("featherParticle1", 1, 1);
    featherGraphics1.destroy();

    const featherGraphics2 = this.scene.add.graphics();
    featherGraphics2.fillStyle(0xffffff, 1);
    featherGraphics2.fillRect(0, 0, 2, 2);
    featherGraphics2.generateTexture("featherParticle2", 2, 2);
    featherGraphics2.destroy();

    const featherGraphics3 = this.scene.add.graphics();
    featherGraphics3.fillStyle(0xffffff, 1);
    featherGraphics3.fillRect(0, 0, 3, 3);
    featherGraphics3.generateTexture("featherParticle3", 3, 3);
    featherGraphics3.destroy();
  }

  createFeatherExplosion(x: number, y: number) {
    const newFeathers: Phaser.GameObjects.Image[] = [];

    for (let i = 0; i < 23; i++) {
      const featherSize = Math.random() < 0.5 ? 2 : 3;
      const featherTexture = featherSize === 2 ? "featherParticle2" : "featherParticle3";
      const feather = this.scene.add.image(x, y, featherTexture);
      feather.setDepth(5);

      this.scene.physics.add.existing(feather);
      const body = feather.body as Phaser.Physics.Arcade.Body;

      const angle = Phaser.Math.Between(0, 360);
      const speed = Phaser.Math.Between(90, 180);
      const velocityX = Math.cos((angle * Math.PI) / 180) * speed;
      const velocityY = Math.sin((angle * Math.PI) / 180) * speed;

      body.setVelocity(velocityX, velocityY);
      body.setDrag(200);

      const isFastLeftFeather = Math.random() < 0.3;

      const startTime = this.scene.time.now;
      const frequency = Phaser.Math.FloatBetween(0.002, 0.004);
      const amplitude = Phaser.Math.Between(20, 40);

      let currentLeftAccel = isFastLeftFeather ? -40 : -15;

      newFeathers.push(feather);

      this.scene.time.delayedCall(300, () => {
        body.setDrag(0);
        body.setVelocityY(30);

        body.setAccelerationX(currentLeftAccel);

        const wobbleEvent = this.scene.time.addEvent({
          delay: 16,
          callback: () => {
            const elapsed = this.scene.time.now - startTime;
            const wobbleX = Math.sin(elapsed * frequency) * amplitude;
            const spreadX = (elapsed - 300) * 0.003;

            currentLeftAccel -= 0.5;
            body.setAccelerationX(currentLeftAccel);

            body.setVelocityX(wobbleX + currentLeftAccel + spreadX);
          },
          loop: true,
        });

        this.scene.time.delayedCall(10000, () => {
          wobbleEvent.remove();
        });
      });
    });

    this.scene.time.delayedCall(3000, () => {
      const animationDuration = 500;
      const feathersPerGroup = Math.ceil(newFeathers.length * 0.1);
      const groupDelay = animationDuration * 0.3;

      newFeathers.forEach((feather, index) => {
        const groupIndex = Math.floor(index / feathersPerGroup);
        const delay = groupIndex * groupDelay;

        this.scene.time.delayedCall(delay, () => {
          if (feather.active && this.pillowStackingSystem.getFloatingPillow()) {
            const body = feather.body as Phaser.Physics.Arcade.Body;
            body.setAcceleration(0, 0);
            body.setVelocity(0, 0);

            this.scene.tweens.add({
              targets: feather,
              x: this.pillowStackingSystem.getFloatingPillow().x,
              y: this.pillowStackingSystem.getFloatingPillow().y,
              duration: animationDuration,
              ease: "Power2",
              onComplete: () => {
                feather.destroy();
                this.pillowStackingSystem.collectFeather();
              },
            });
          } else if (feather.active) {
            feather.destroy();
          }
        });
      });
    });
  }
}
