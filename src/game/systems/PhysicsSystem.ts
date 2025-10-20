import Phaser from "phaser";

export class PhysicsSystem {
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  update(delta: number) {
    // This system will primarily manage global physics settings or apply forces
    // to objects that are not handled by individual systems (e.g., falling feathers).
    // For now, individual systems (like PillowStackingSystem) manage their own physics.
    // If more complex physics interactions are needed, they can be centralized here.
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
  }
}
