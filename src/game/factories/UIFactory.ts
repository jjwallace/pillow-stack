import Phaser from "phaser";

export class UIFactory {
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  createPillowLivesIcon(
    x: number,
    y: number,
    width: number,
    height: number,
    color: number
  ): Phaser.GameObjects.Graphics {
    const icon = this.scene.add.graphics();
    icon.fillStyle(color, 1);
    icon.fillRoundedRect(-width / 2, -height / 2, width, height, 10);
    icon.lineStyle(2, 0x999999, 1);
    icon.strokeRoundedRect(-width / 2, -height / 2, width, height, 10);
    icon.x = x;
    icon.y = y;
    icon.setDepth(100);
    return icon;
  }

  createPillowCounterText(
    x: number,
    y: number,
    initialCount: number
  ): Phaser.GameObjects.Text {
    const text = this.scene.add.text(x, y, `Pillows: ${initialCount}`, {
      fontSize: "16px",
      color: "#ffffff",
      fontFamily: "Arial",
      stroke: "#666666",
      strokeThickness: 2,
    });
    text.setOrigin(0, 0);
    text.setDepth(100);
    return text;
  }

  createRestartButton(x: number, y: number): Phaser.GameObjects.Text {
    const button = this.scene.add.text(x, y, "RESTART", {
      fontSize: "20px",
      color: "#ffffff",
      fontFamily: "Arial",
      stroke: "#666666",
      strokeThickness: 3,
      backgroundColor: "#999999",
      padding: { x: 15, y: 8 },
    });
    button.setOrigin(0.5, 0.5);
    button.setDepth(101);
    button.setVisible(false);
    button.setInteractive({ useHandCursor: true });
    button.setStyle({ borderRadius: "8px" });
    return button;
  }
}
