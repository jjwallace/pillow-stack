import Phaser from "phaser";
import { GAME_CONFIG } from "../config";
import { AssetLoader } from "../assets/AssetLoader";
import { DuckFactory } from "../factories/DuckFactory";
import { PillowFactory } from "../factories/PillowFactory";
import { UIFactory } from "../factories/UIFactory";
import { CloudSystem } from "../systems/CloudSystem";
import { DuckSystem } from "../systems/DuckSystem";
import { PillowStackingSystem } from "../systems/PillowStackingSystem";
import { InputSystem } from "../systems/InputSystem";
import { WorldScrollingSystem } from "../systems/WorldScrollingSystem";
import { LineCutSensor } from "../sensors/LineCutSensor";
import { PhysicsSystem } from "../systems/PhysicsSystem";
import { UISystem } from "../systems/UISystem";

export class GameScene extends Phaser.Scene {
  private assetLoader!: AssetLoader;
  private duckFactory!: DuckFactory;
  private pillowFactory!: PillowFactory;
  private uiFactory!: UIFactory;

  private cloudSystem!: CloudSystem;
  private duckSystem!: DuckSystem;
  private pillowStackingSystem!: PillowStackingSystem;
  private inputSystem!: InputSystem;
  private worldScrollingSystem!: WorldScrollingSystem;
  private physicsSystem!: PhysicsSystem;
  private uiSystem!: UISystem;

  private lineCutSensor!: LineCutSensor;

  constructor() {
    super({ key: "GameScene" });
  }

  preload() {
    this.assetLoader = new AssetLoader(this);
    this.assetLoader.preload();
  }

  create() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    this.cameras.main.setBackgroundColor(0x4eadf5);

    this.worldScrollingSystem = new WorldScrollingSystem(
      this,
      GAME_CONFIG.floor.groundHeight
    );
    this.worldScrollingSystem.createFloorTiles();

    this.cloudSystem = new CloudSystem(this, this.worldScrollingSystem);
    this.cloudSystem.create();

    this.duckFactory = new DuckFactory(this);
    this.pillowFactory = new PillowFactory(this);
    this.uiFactory = new UIFactory(this);

    this.pillowStackingSystem = new PillowStackingSystem(
      this,
      this.pillowFactory,
      this.worldScrollingSystem
    );
    this.pillowStackingSystem.create();

    this.duckSystem = new DuckSystem(
      this,
      this.duckFactory,
      this.worldScrollingSystem
    );
    this.duckSystem.create();

    this.lineCutSensor = new LineCutSensor(this, this.pillowStackingSystem);

    this.physicsSystem = new PhysicsSystem(this);

    this.uiSystem = new UISystem(
      this,
      this.uiFactory,
      this.pillowStackingSystem
    );
    this.uiSystem.create();

    this.inputSystem = new InputSystem(
      this,
      this.duckSystem,
      this.pillowStackingSystem,
      this.lineCutSensor
    );
    this.inputSystem.create();

    this.scale.on("resize", this.handleResize, this);
  }

  handleResize(gameSize: Phaser.Structs.Size) {
    this.worldScrollingSystem.handleResize(gameSize);
    this.pillowStackingSystem.handleResize(gameSize);
    this.uiSystem.handleResize(gameSize);
  }

  update(time: number, delta: number) {
    this.worldScrollingSystem.update();
    this.pillowStackingSystem.update(delta);
    this.duckSystem.update();
    this.cloudSystem.update();
    this.physicsSystem.update(delta);
    this.uiSystem.update();
  }
}
