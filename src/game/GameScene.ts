import Phaser from "phaser"
import { GAME_CONFIG } from "./config"

export class GameScene extends Phaser.Scene {
  private ducks!: Phaser.GameObjects.Group
  private clouds!: Phaser.GameObjects.Group
  private floorTiles: Phaser.GameObjects.Image[] = []
  private balloon!: Phaser.GameObjects.Image
  private disk!: Phaser.GameObjects.Image
  private mouseTrailEmitter!: Phaser.GameObjects.Particles.ParticleEmitter
  private currentX = 0
  private currentY = 0
  private targetX = 0
  private targetY = 0
  private duckCount = 0
  private duckCounterText!: Phaser.GameObjects.Text
  private pillowStack: Phaser.GameObjects.Graphics[] = []
  private pillowConnectionOffsets: number[] = []
  private pillowHeights: number[] = [] // Track height of each pillow in the stack
  private floatingPillow!: Phaser.GameObjects.Graphics
  private activeDuckCount = 0
  private isDropping = false
  private floatingPillowFeatherCount = 0
  private pivotPoint!: { x: number; y: number }
  private suspensionLine!: Phaser.GameObjects.Graphics
  private dropCount = 0
  private lineAnimating = false
  private pillowLives = 5
  private pillowLivesIcons: Phaser.GameObjects.Graphics[] = []
  private showLine = true
  private lineRetractY = 0
  private pillowVelocityY = 0
  private towerSwayAngle = 0
  private swayDirection = 1
  private canClickPillow = false
  private lastGroundHeight = 0
  private lastPointerX = 0
  private lastPointerY = 0
  private isPointerDown = false
  private upperLineSegment!: Phaser.GameObjects.Graphics
  private lowerLineSegment!: Phaser.GameObjects.Graphics
  private lineCut = false
  private cutY = 0
  private upperLineEndY = 0 // Where the upper segment ends (animates up to 0)
  private lowerLineStartY = 0 // Where the lower segment starts (animates down to pillow)
  private pillowLoweringTargetY = 0 // Target Y position for programmatic lowering
  private pillowLoweringStartY = 0 // Starting Y position for easing calculation
  private pillowLoweringStartTime = 0 // Start time for easing calculation
  private pillowLoweringDuration = 800 // Duration in milliseconds
  private restartButton!: Phaser.GameObjects.Text

  constructor() {
    super({ key: "GameScene" })
  }

  getGroundLevel(): number {
    return this.cameras.main.height - GAME_CONFIG.floor.groundHeight
  }

  restartGame() {
    // Restart the scene
    this.scene.restart()
  }

  createFloorTiles() {
    // Destroy existing floor tiles
    this.floorTiles.forEach(tile => tile.destroy())
    this.floorTiles = []

    const width = this.cameras.main.width
    const height = this.cameras.main.height
    const tileSize = GAME_CONFIG.floor.tileSize

    // Extend tiles 1000px in each direction beyond viewport
    const startX = -1000
    const endX = width + 1000
    const tilesWide = Math.ceil((endX - startX) / tileSize) + 1

    // Floor Y position is always groundHeight pixels from the bottom of viewport
    const floorStartY = height - GAME_CONFIG.floor.groundHeight

    // Grass top tile is at row 4 (5 down, 0-indexed), column 3 (4 over, 0-indexed)
    const grassFrameIndex = 4 * 10 + 3 // row 4, column 3
    // Earth tile is one row below (row 5, column 3)
    const earthFrameIndex = 5 * 10 + 3 // row 5, column 3

    // Create grass row (top row) - moved up by 10 pixels for better pillow alignment
    for (let i = 0; i < tilesWide; i++) {
      const x = startX + (i * tileSize)
      const grassTile = this.add.image(x, floorStartY - 10, "spritesheet-nature", grassFrameIndex)
      grassTile.setOrigin(0, 0)
      grassTile.setDepth(-1)
      this.floorTiles.push(grassTile)
    }

    // Create earth rows below grass
    for (let y = 1; y <= GAME_CONFIG.floor.earthRows; y++) {
      for (let i = 0; i < tilesWide; i++) {
        const x = startX + (i * tileSize)
        const earthTile = this.add.image(x, floorStartY - 10 + (y * tileSize), "spritesheet-nature", earthFrameIndex)
        earthTile.setOrigin(0, 0)
        earthTile.setDepth(-1)
        this.floorTiles.push(earthTile)
      }
    }
  }

  handleResize(gameSize: Phaser.Structs.Size) {
    const width = gameSize.width
    const height = gameSize.height

    // Recreate floor tiles at new position
    this.createFloorTiles()

    // Update pivot point to stay centered
    this.pivotPoint.x = width / 2
    this.pivotPoint.y = height - GAME_CONFIG.floor.groundHeight

    // Update floating pillow to stay centered
    if (this.floatingPillow && !this.isDropping) {
      // Keep floating pillow centered during resize
      const currentOffset = this.floatingPillow.x - (this.cameras.main.width / 2)
      this.floatingPillow.x = width / 2 + currentOffset
    }

    // Update restart button position
    if (this.restartButton) {
      this.restartButton.setPosition(width / 2, height - 50)
    }
  }

  preload() {
    this.load.spritesheet("spritesheet", "/assets/gameobjects/spritesheet.png", {
      frameWidth: 32,
      frameHeight: 32,
    })
    this.load.spritesheet("spritesheet-nature", "/assets/gameobjects/spritesheet-nature.png", {
      frameWidth: 32,
      frameHeight: 32,
    })
    this.load.image("sky", "/assets/gameobjects/sky-tile.png")
    this.load.image("balloon", "/assets/gameobjects/balloon.png")
    this.load.image("disk", "/assets/gameobjects/disk.png")
    this.load.image("cloud1", "/assets/gameobjects/cloud1.png")
    this.load.image("cloud2", "/assets/gameobjects/cloud2.png")
    this.load.image("cloud3", "/assets/gameobjects/cloud3.png")
    this.load.image("cloud4", "/assets/gameobjects/cloud4.png")
    this.load.image("cloud5", "/assets/gameobjects/cloud5.png")
    this.load.image("cloud6", "/assets/gameobjects/cloud6.png")
    this.load.image("cloud7", "/assets/gameobjects/cloud7.png")
    this.load.image("cloud8", "/assets/gameobjects/cloud8.png")

    // Load sound effects
    this.load.audio("pillowHit", "/assets/sfx/pillow-hit.wav")
    this.load.audio("snip", "/assets/sfx/snip.mp3")
    this.load.audio("snip2", "/assets/sfx/snip2.mp3")
    this.load.audio("impact", "/assets/sfx/impact.mp3")
    this.load.audio("impact2", "/assets/sfx/impact2.mp3")
    this.load.audio("fail", "/assets/sfx/fail.mp3")
  }

  create() {
    const width = this.cameras.main.width
    const height = this.cameras.main.height

    this.cameras.main.setBackgroundColor(0x4eadf5)

    // Create floor tiles
    this.createFloorTiles()

    this.clouds = this.add.group({
      runChildUpdate: true,
    })

    for (let i = 0; i < 30; i++) {
      this.spawnCloud()
    }

    // Set pivot point at ground level for tower sway
    this.pivotPoint = { x: width / 2, y: this.getGroundLevel() }

    // Store initial ground height for change detection
    this.lastGroundHeight = GAME_CONFIG.floor.groundHeight

    // Start with empty stack - pillows will land on the ground
    this.pillowStack = []
    this.pillowConnectionOffsets = [0] // Base offset for ground level

    this.suspensionLine = this.add.graphics()
    this.suspensionLine.setDepth(98)

    this.upperLineSegment = this.add.graphics()
    this.upperLineSegment.setDepth(98)

    this.lowerLineSegment = this.add.graphics()
    this.lowerLineSegment.setDepth(98)

    this.createFloatingPillow()

    // Hide duck counter - replaced with pillow counter
    this.duckCounterText = this.add.text(20, 20, "Pillows: 0", {
      fontSize: "16px",
      color: "#ffffff",
      fontFamily: "Arial",
      stroke: "#666666",
      strokeThickness: 2,
    })
    this.duckCounterText.setOrigin(0, 0)
    this.duckCounterText.setDepth(100)

    // Make life icons larger (30x15 instead of 20x10)
    for (let i = 0; i < 5; i++) {
      const icon = this.createPillowGraphics(30, 15, 0xffffff)
      icon.x = width - 40 - i * 38
      icon.y = 35
      icon.setDepth(100)
      this.pillowLivesIcons.push(icon)
    }

    // Create restart button at bottom middle (hidden initially)
    this.restartButton = this.add.text(width / 2, height - 50, "RESTART", {
      fontSize: "20px",
      color: "#ffffff",
      fontFamily: "Arial",
      stroke: "#666666",
      strokeThickness: 3,
      backgroundColor: "#999999",
      padding: { x: 15, y: 8 },
    })
    this.restartButton.setOrigin(0.5, 0.5)
    this.restartButton.setDepth(101)
    this.restartButton.setVisible(false)
    this.restartButton.setInteractive({ useHandCursor: true })
    // Add rounded rectangle styling using DOM
    this.restartButton.setStyle({ borderRadius: '8px' })
    this.restartButton.on("pointerdown", () => {
      this.restartGame()
    })
    this.restartButton.on("pointerover", () => {
      this.restartButton.setScale(1.05)
      this.restartButton.setStyle({ backgroundColor: "#aaaaaa" })
    })
    this.restartButton.on("pointerout", () => {
      this.restartButton.setScale(1.0)
      this.restartButton.setStyle({ backgroundColor: "#999999" })
    })

    this.balloon = this.add.image(width / 2, height / 2, "balloon")
    this.balloon.setOrigin(0.5, 0.5)
    this.balloon.setScale(0.5)
    this.balloon.setDepth(3)
    this.balloon.setVisible(false)

    const balloonBottom = this.balloon.y + this.balloon.displayHeight / 2
    this.disk = this.add.image(0, 0, "disk")
    this.disk.setOrigin(0.5, 0)
    this.disk.setScale(0.5)
    this.disk.setPosition(this.balloon.x, balloonBottom)
    this.disk.setDepth(1)
    this.disk.setVisible(false)

    const startFrame = 11 * 15 + 4
    const endFrame = 11 * 15 + 6

    this.anims.create({
      key: "fly",
      frames: this.anims.generateFrameNumbers("spritesheet", {
        start: startFrame,
        end: endFrame,
      }),
      frameRate: 8,
      repeat: -1,
    })

    this.ducks = this.add.group({
      runChildUpdate: true,
    })

    this.time.addEvent({
      delay: 1000,
      callback: this.spawnDuck,
      callbackScope: this,
      loop: true,
    })

    const size = 12
    const graphics = this.add.graphics()
    for (let i = size / 2; i > 0; i -= 2) {
      const alpha = Math.pow(i / (size / 2), 2) * 0.6
      graphics.fillStyle(0xffffff, alpha)
      graphics.fillCircle(size / 2, size / 2, i)
    }
    graphics.generateTexture("mouseParticle", size, size)
    graphics.destroy()

    const featherGraphics1 = this.add.graphics()
    featherGraphics1.fillStyle(0xffffff, 1)
    featherGraphics1.fillRect(0, 0, 1, 1)
    featherGraphics1.generateTexture("featherParticle1", 1, 1)
    featherGraphics1.destroy()

    const featherGraphics2 = this.add.graphics()
    featherGraphics2.fillStyle(0xffffff, 1)
    featherGraphics2.fillRect(0, 0, 2, 2)
    featherGraphics2.generateTexture("featherParticle2", 2, 2)
    featherGraphics2.destroy()

    const featherGraphics3 = this.add.graphics()
    featherGraphics3.fillStyle(0xffffff, 1)
    featherGraphics3.fillRect(0, 0, 3, 3)
    featherGraphics3.generateTexture("featherParticle3", 3, 3)
    featherGraphics3.destroy()

    this.mouseTrailEmitter = this.add.particles(0, 0, "mouseParticle", {
      speed: 0,
      scale: { start: 0.4, end: 0.1 },
      alpha: { start: 0.8, end: 0 },
      lifespan: 400,
      blendMode: "NORMAL",
      frequency: -1,
    })
    this.mouseTrailEmitter.setDepth(10)

    this.currentX = width / 2
    this.currentY = height / 2
    this.targetX = width / 2
    this.targetY = height / 2

    this.input.on("pointermove", (pointer: Phaser.Input.Pointer) => {
      this.targetX = pointer.x
      this.targetY = pointer.y

      // Check for line cutting when pointer is down and moving
      if (this.isPointerDown && !this.isDropping && this.floatingPillow && this.canClickPillow && this.showLine && !this.lineCut) {
        this.checkLineCut(this.lastPointerX, this.lastPointerY, pointer.x, pointer.y)
      }

      this.lastPointerX = pointer.x
      this.lastPointerY = pointer.y
    })

    this.input.on("pointerup", () => {
      this.isPointerDown = false
    })

    this.time.addEvent({
      delay: 8,
      callback: () => {
        const prevX = this.currentX
        const prevY = this.currentY

        const smoothing = 0.15
        this.currentX += (this.targetX - this.currentX) * smoothing
        this.currentY += (this.targetY - this.currentY) * smoothing

        const dx = this.currentX - prevX
        const dy = this.currentY - prevY
        const distance = Math.sqrt(dx * dx + dy * dy)

        const particleCount = Math.ceil(distance / 4) + 1

        for (let i = 0; i < particleCount; i++) {
          const t = i / particleCount
          const interpX = prevX + dx * t
          const interpY = prevY + dy * t
          this.mouseTrailEmitter.emitParticleAt(interpX, interpY, 1)
        }
      },
      loop: true,
    })

    this.spawnDuck()

    // Handle window resize to keep tower and pillow centered
    this.scale.on('resize', this.handleResize, this)

    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      this.isPointerDown = true
      this.lastPointerX = pointer.x
      this.lastPointerY = pointer.y

      const clickedDuck = this.ducks.getChildren().find((duck) => {
        const sprite = duck as Phaser.GameObjects.Sprite
        const bounds = sprite.getBounds()
        return bounds.contains(pointer.x, pointer.y)
      }) as Phaser.GameObjects.Sprite | undefined

      if (clickedDuck) {
        this.sound.play("pillowHit")
        this.createFeatherExplosion(clickedDuck.x, clickedDuck.y)
        clickedDuck.destroy()
        this.activeDuckCount--
      } else if (!this.isDropping && this.floatingPillow && this.canClickPillow) {
        // Check if tap is within 20px of the pillow (mobile-friendly tap area)
        const tapAreaPadding = 20
        const pillowWidth = GAME_CONFIG.pillow.minWidth + this.floatingPillowFeatherCount * ((GAME_CONFIG.pillow.maxWidth - GAME_CONFIG.pillow.minWidth) / 46)
        const pillowHeight = GAME_CONFIG.pillow.maxHeight

        const pillowLeft = this.floatingPillow.x - pillowWidth / 2 - tapAreaPadding
        const pillowRight = this.floatingPillow.x + pillowWidth / 2 + tapAreaPadding
        const pillowTop = this.floatingPillow.y - pillowHeight / 2 - tapAreaPadding
        const pillowBottom = this.floatingPillow.y + pillowHeight / 2 + tapAreaPadding

        const tappedPillow = pointer.x >= pillowLeft && pointer.x <= pillowRight &&
                            pointer.y >= pillowTop && pointer.y <= pillowBottom

        if (tappedPillow) {
          this.dropPillow()
        }
      }
    })
  }

  createPillowGraphics(width: number, thickness: number, color: number): Phaser.GameObjects.Graphics {
    const pillow = this.add.graphics()
    // Draw fill first without border
    pillow.fillStyle(color, 1)
    pillow.fillRoundedRect(-width / 2, -thickness / 2, width, thickness, 10)
    // Then draw border on top to avoid white corners
    pillow.lineStyle(2, 0x999999, 1)
    pillow.strokeRoundedRect(-width / 2, -thickness / 2, width, thickness, 10)
    // Set depth to be above ground tiles and ducks
    pillow.setDepth(2)
    return pillow
  }

  checkLineCut(x1: number, y1: number, x2: number, y2: number) {
    if (!this.floatingPillow) return

    const lineX = this.floatingPillow.x
    const lineTop = 0
    const lineBottom = this.lineRetractY

    // Check if the pointer movement crosses the line
    const crossesLineX = (x1 <= lineX && x2 >= lineX) || (x1 >= lineX && x2 <= lineX)

    if (crossesLineX) {
      // Calculate intersection Y
      const dx = x2 - x1
      const dy = y2 - y1
      const t = (lineX - x1) / dx
      const intersectY = y1 + dy * t

      // Check if intersection is within the line bounds
      if (intersectY >= lineTop && intersectY <= lineBottom) {
        this.cutLine(intersectY)
      }
    }
  }

  cutLine(cutY: number) {
    console.log('Line cut at Y:', cutY)
    this.lineCut = true
    this.cutY = cutY
    this.showLine = false

    // Play random snip sound effect
    const snipSound = Math.random() < 0.5 ? "snip" : "snip2"
    this.sound.play(snipSound)

    // Initialize line segment positions at the cut point
    this.upperLineEndY = cutY // Upper segment ends at cut point
    this.lowerLineStartY = cutY // Lower segment starts at cut point

    // Drop the pillow
    this.dropPillow()

    // Animate upper segment: bottom moves up to top (0) - slower with ease in
    this.tweens.add({
      targets: this,
      upperLineEndY: 0,
      duration: 800,
      ease: "Power2.easeIn",
    })

    // Lower segment top point follows the pillow down naturally in update loop
  }

  createFloatingPillow() {
    const width = this.cameras.main.width

    // Reset line cut state
    this.lineCut = false
    this.cutY = 0
    this.upperLineEndY = 0
    this.lowerLineStartY = 0
    this.upperLineSegment.clear()
    this.lowerLineSegment.clear()

    // If stack is empty, target ground level, otherwise target above the top pillow
    let targetY: number
    const newPillowHeight = GAME_CONFIG.pillow.minHeight // Starting height

    if (this.pillowStack.length === 0) {
      targetY = this.getGroundLevel() - 80 // Hover above the ground
    } else {
      const topPillow = this.pillowStack[this.pillowStack.length - 1]
      const topPillowHeight = this.pillowHeights[this.pillowHeights.length - 1]
      const heightAboveTower = Math.min(50 + this.dropCount * 10, 80)
      // Position above the top pillow: topPillow.y - (half of top) - (half of new) - gap
      targetY = topPillow.y - (topPillowHeight / 2) - (newPillowHeight / 2) - heightAboveTower
    }

    this.floatingPillow = this.createPillowGraphics(GAME_CONFIG.pillow.minWidth, GAME_CONFIG.pillow.minHeight, 0xffffff)
    this.floatingPillow.x = width / 2
    this.floatingPillow.y = 0
    this.floatingPillow.setDepth(99)
    this.floatingPillowFeatherCount = 0
    this.lineAnimating = true
    this.showLine = true
    this.lineRetractY = 0
    this.pillowVelocityY = 0
    this.canClickPillow = false

    // Set up programmatic lowering with easing
    this.pillowLoweringTargetY = targetY
    this.pillowLoweringStartY = 0
    this.pillowLoweringStartTime = this.time.now
    this.pillowLoweringDuration = 800

    // Still use tween for line retraction
    this.tweens.add({
      targets: this,
      lineRetractY: targetY,
      duration: 800,
      ease: "Power1",
    })
  }

  dropPillow() {
    this.isDropping = true
    this.showLine = false

    this.tweens.killTweensOf(this.floatingPillow)
    this.tweens.killTweensOf(this)

    this.pillowVelocityY = 0
  }

  checkPillowLanding() {
    if (!this.floatingPillow || !this.isDropping) return

    const groundLevel = this.getGroundLevel() - 5 // Just above the ground

    // Check if landing on ground (empty stack) or on top pillow
    let landingY: number
    let collisionTarget: number
    let targetX: number

    // Calculate drop pillow height first (needed for positioning)
    const heightGrowthPerFeather = (GAME_CONFIG.pillow.maxHeight - GAME_CONFIG.pillow.minHeight) / 46
    const dropPillowHeight = Math.min(GAME_CONFIG.pillow.minHeight + this.floatingPillowFeatherCount * heightGrowthPerFeather, GAME_CONFIG.pillow.maxHeight)

    if (this.pillowStack.length === 0) {
      // Landing on ground - pillow center should be half its height above ground
      landingY = groundLevel - dropPillowHeight / 2
      collisionTarget = landingY + dropPillowHeight / 2 - 5
      // Let the pillow land wherever it is (not forced to center)
      targetX = this.floatingPillow.x
    } else {
      // Landing on top pillow - edges should touch (no gap or overlap)
      const topPillow = this.pillowStack[this.pillowStack.length - 1]
      const topPillowHeight = this.pillowHeights[this.pillowHeights.length - 1]
      // Position center at: topPillow.y - (half of top pillow) - (half of current pillow)
      landingY = topPillow.y - (topPillowHeight / 2) - (dropPillowHeight / 2)
      collisionTarget = landingY + dropPillowHeight / 2 - 5
      targetX = topPillow.x
    }

    // Calculate drop pillow width
    const widthGrowthPerFeather = (GAME_CONFIG.pillow.maxWidth - GAME_CONFIG.pillow.minWidth) / 46
    const dropPillowWidth = GAME_CONFIG.pillow.minWidth + this.floatingPillowFeatherCount * widthGrowthPerFeather
    const dropPillowBottom = this.floatingPillow.y + dropPillowHeight / 2

    // Check collision very early for instant stacking
    if (dropPillowBottom >= collisionTarget - GAME_CONFIG.collision.earlyDetectionPixels) {
      const dropPillowLeft = this.floatingPillow.x - dropPillowWidth / 2
      const dropPillowRight = this.floatingPillow.x + dropPillowWidth / 2

      // Define collision area with 20px margins on each side
      const collisionMargin = 20
      const targetCollisionLeft = targetX - GAME_CONFIG.pillow.minWidth + collisionMargin
      const targetCollisionRight = targetX + GAME_CONFIG.pillow.minWidth - collisionMargin

      // Check if the pillow overlaps with the collision area
      const overlapsCollisionArea = dropPillowRight >= targetCollisionLeft && dropPillowLeft <= targetCollisionRight

      if (overlapsCollisionArea) {
        console.log('COLLISION DETECTED at frame:', this.game.loop.frame, 'pillow Y:', this.floatingPillow.y)

        // Play random impact sound effect
        const impactSound = Math.random() < 0.5 ? "impact" : "impact2"
        this.sound.play(impactSound)

        // STOP all movement FIRST
        this.isDropping = false
        this.pillowVelocityY = 0

        // Capture the exact X position where it landed BEFORE any sway updates
        const landedX = this.floatingPillow.x

        // IMMEDIATELY snap to exact position - NO DELAY
        this.floatingPillow.x = landedX
        this.floatingPillow.y = landingY
        this.floatingPillow.rotation = 0

        // Store connection offset
        if (this.pillowStack.length === 0) {
          // First pillow: store absolute X position (replace the base 0)
          this.pillowConnectionOffsets[0] = landedX
          // Update pivot point to be at the first pillow's X position
          this.pivotPoint.x = landedX
        } else {
          // Subsequent pillows: store offset relative to the pillow below
          const connectionOffset = landedX - targetX
          this.pillowConnectionOffsets.push(connectionOffset)
        }

        // Calculate and store the current pillow height
        const heightGrowthPerFeather = (GAME_CONFIG.pillow.maxHeight - GAME_CONFIG.pillow.minHeight) / 46
        const currentHeight = Math.min(GAME_CONFIG.pillow.minHeight + this.floatingPillowFeatherCount * heightGrowthPerFeather, GAME_CONFIG.pillow.maxHeight)
        this.pillowHeights.push(currentHeight)

        // Add to stack
        this.pillowStack.push(this.floatingPillow)

        console.log('ADDED TO STACK at frame:', this.game.loop.frame, 'stack length:', this.pillowStack.length)

        this.dropCount++

        // Update pillow counter
        this.duckCounterText.setText(`Pillows: ${this.pillowStack.length}`)

        // Kill any existing tweens on 'this' to prevent conflicts
        this.tweens.killTweensOf(this)

        // Reset line immediately for next pillow
        this.lineRetractY = 0

        // Clear line cut segments when pillow lands
        this.lineCut = false
        this.upperLineSegment.clear()
        this.lowerLineSegment.clear()

        // Create new pillow IMMEDIATELY - no waiting for line retraction
        console.log('NEW PILLOW CREATED IMMEDIATELY')
        this.createFloatingPillow()

        // Prevent any further collision checks
        return
      } else if (this.pillowStack.length > 0) {
        // Check if we're still above the top pillow (missed collision)
        const targetFullLeft = targetX - GAME_CONFIG.pillow.minWidth
        const targetFullRight = targetX + GAME_CONFIG.pillow.minWidth
        const overlapsTarget = dropPillowRight >= targetFullLeft && dropPillowLeft <= targetFullRight

        if (overlapsTarget) {
          // We hit the pillow but outside the collision area - start falling and spinning
          const missedLeft = dropPillowRight < targetCollisionLeft
          const spinDirection = missedLeft ? -1 : 1

          // Add horizontal velocity and angular velocity for spinning
          this.floatingPillow.setData('angularVelocity', spinDirection * 3)
          this.floatingPillow.setData('horizontalVelocity', spinDirection * 100)
          this.floatingPillow.setData('isFalling', true)
        }
      }

        // Destroy the pillow if it goes off screen
        if (this.floatingPillow.y > this.cameras.main.height + 50) {
          // Play fail sound effect
          this.sound.play("fail")

          this.floatingPillow.destroy()
          this.isDropping = false
          this.pillowVelocityY = 0

          // Clear line cut segments when pillow falls off
          this.lineCut = false
          this.upperLineSegment.clear()
          this.lowerLineSegment.clear()

          this.pillowLives--
          if (this.pillowLives >= 0 && this.pillowLivesIcons[this.pillowLives]) {
            const icon = this.pillowLivesIcons[this.pillowLives]
            this.tweens.add({
              targets: icon,
              alpha: 0,
              duration: 300,
              onComplete: () => {
                icon.destroy()
              },
            })
          }

          if (this.pillowLives > 0) {
            this.tweens.add({
              targets: this,
              lineRetractY: 0,
              duration: 600,
              ease: "Power2",
              onComplete: () => {
                this.createFloatingPillow()
              },
            })
          } else {
            // Game over - show restart button
            this.time.delayedCall(500, () => {
              this.restartButton.setVisible(true)
            })
          }
        }
    }
  }

  updatePillowSway() {
    if (this.pillowStack.length <= 1) return

    // Update tower sway animation - keep centered, no weight-based leaning
    const time = this.time.now / 1000
    this.towerSwayAngle = Math.sin(time * GAME_CONFIG.tower.swaySpeed) * GAME_CONFIG.tower.swayAngle

    const combinedAngle = this.towerSwayAngle

    // Calculate ground level
    const groundLevel = this.getGroundLevel() - 5

    for (let i = 0; i < this.pillowStack.length; i++) {
      const pillow = this.pillowStack[i]

      // Calculate base position from connection offsets
      let baseX: number
      if (i === 0) {
        // First pillow uses its absolute stored position (not relative to center)
        baseX = this.pillowConnectionOffsets[0]
      } else {
        // Subsequent pillows build off the first pillow's position
        baseX = this.pillowConnectionOffsets[0]
        for (let j = 1; j <= i; j++) {
          baseX += this.pillowConnectionOffsets[j]
        }
      }

      // Stack from ground level up, accounting for actual pillow heights
      // Each pillow is positioned at its center, so we need to account for half-heights
      let stackHeight = 0

      // Add half of current pillow's height (since it's centered)
      stackHeight += this.pillowHeights[i] / 2

      // Add full heights of all pillows below
      for (let j = 0; j < i; j++) {
        stackHeight += this.pillowHeights[j]
      }

      const baseY = groundLevel - stackHeight

      // Apply rotation around pivot point
      const relativeX = baseX - this.pivotPoint.x
      const relativeY = baseY - this.pivotPoint.y

      const rotatedX = relativeX * Math.cos(combinedAngle) - relativeY * Math.sin(combinedAngle)
      const rotatedY = relativeX * Math.sin(combinedAngle) + relativeY * Math.cos(combinedAngle)

      pillow.x = rotatedX + this.pivotPoint.x
      pillow.y = rotatedY + this.pivotPoint.y

      pillow.rotation = combinedAngle
    }
  }

  spawnCloud() {
    const width = this.cameras.main.width
    const height = this.cameras.main.height

    const cloudNumber = Phaser.Math.Between(1, 8)
    const cloudKey = `cloud${cloudNumber}`

    const x = Phaser.Math.Between(0, width)
    const y = Phaser.Math.Between(50, height - 100)

    const cloud = this.add.image(x, y, cloudKey)
    cloud.setScale(0.1)
    cloud.setAlpha(0.7)
    cloud.setDepth(-2)

    this.physics.add.existing(cloud)
    const body = cloud.body as Phaser.Physics.Arcade.Body
    body.setVelocityX(-Phaser.Math.Between(10, 25))

    this.clouds.add(cloud)
  }

  createFeatherExplosion(x: number, y: number) {
    this.duckCount++

    const newFeathers: Phaser.GameObjects.Image[] = []

    for (let i = 0; i < 23; i++) {
      const featherSize = Math.random() < 0.5 ? 2 : 3
      const featherTexture = featherSize === 2 ? "featherParticle2" : "featherParticle3"
      const feather = this.add.image(x, y, featherTexture)
      feather.setDepth(5)

      this.physics.add.existing(feather)
      const body = feather.body as Phaser.Physics.Arcade.Body

      const angle = Phaser.Math.Between(0, 360)
      const speed = Phaser.Math.Between(90, 180)
      const velocityX = Math.cos((angle * Math.PI) / 180) * speed
      const velocityY = Math.sin((angle * Math.PI) / 180) * speed

      body.setVelocity(velocityX, velocityY)
      body.setDrag(200)

      const isFastLeftFeather = Math.random() < 0.3

      const startTime = this.time.now
      const frequency = Phaser.Math.FloatBetween(0.002, 0.004)
      const amplitude = Phaser.Math.Between(20, 40)

      let currentLeftAccel = isFastLeftFeather ? -40 : -15

      newFeathers.push(feather)

      this.time.delayedCall(300, () => {
        body.setDrag(0)
        body.setVelocityY(30)

        body.setAccelerationX(currentLeftAccel)

        const wobbleEvent = this.time.addEvent({
          delay: 16,
          callback: () => {
            const elapsed = this.time.now - startTime
            const wobbleX = Math.sin(elapsed * frequency) * amplitude
            const spreadX = (elapsed - 300) * 0.003

            currentLeftAccel -= 0.5
            body.setAccelerationX(currentLeftAccel)

            body.setVelocityX(wobbleX + currentLeftAccel + spreadX)
          },
          loop: true,
        })

        this.time.delayedCall(10000, () => {
          wobbleEvent.remove()
        })
      })
    }

    this.time.delayedCall(3000, () => {
      const animationDuration = 500
      const feathersPerGroup = Math.ceil(newFeathers.length * 0.1)
      const groupDelay = animationDuration * 0.3

      newFeathers.forEach((feather, index) => {
        const groupIndex = Math.floor(index / feathersPerGroup)
        const delay = groupIndex * groupDelay

        this.time.delayedCall(delay, () => {
          // Don't collect feathers if no lives left
          if (feather.active && this.floatingPillow && this.pillowLives > 0) {
            const body = feather.body as Phaser.Physics.Arcade.Body
            body.setAcceleration(0, 0)
            body.setVelocity(0, 0)

            this.tweens.add({
              targets: feather,
              x: this.floatingPillow.x,
              y: this.floatingPillow.y,
              duration: animationDuration,
              ease: "Power2",
              onComplete: () => {
                feather.destroy()
                this.floatingPillowFeatherCount++
                const widthGrowthPerFeather = (GAME_CONFIG.pillow.maxWidth - GAME_CONFIG.pillow.minWidth) / 46
                const newWidth = Math.min(GAME_CONFIG.pillow.minWidth + this.floatingPillowFeatherCount * widthGrowthPerFeather, GAME_CONFIG.pillow.maxWidth)

                // Make height grow proportionally with width
                const heightGrowthPerFeather = (GAME_CONFIG.pillow.maxHeight - GAME_CONFIG.pillow.minHeight) / 46
                const newThickness = Math.min(GAME_CONFIG.pillow.minHeight + this.floatingPillowFeatherCount * heightGrowthPerFeather, GAME_CONFIG.pillow.maxHeight)

                this.floatingPillow.clear()
                // Draw fill first without border
                this.floatingPillow.fillStyle(0xffffff, 1)
                this.floatingPillow.fillRoundedRect(-newWidth / 2, -newThickness / 2, newWidth, newThickness, 10)
                // Then draw border on top to avoid white corners
                this.floatingPillow.lineStyle(2, 0x999999, 1)
                this.floatingPillow.strokeRoundedRect(-newWidth / 2, -newThickness / 2, newWidth, newThickness, 10)
              },
            })
          } else if (feather.active) {
            // Just destroy the feather if game is over
            feather.destroy()
          }
        })
      })
    })
  }

  spawnDuck() {
    if (this.activeDuckCount >= 12) {
      return
    }

    const width = this.cameras.main.width
    const height = this.cameras.main.height

    const spawnOnLeft = Math.random() < 0.5

    const x = spawnOnLeft ? -50 : width + 50
    const y = Phaser.Math.Between(100, height - 100)

    const duck = this.add.sprite(x, y, "spritesheet")
    duck.setScale(1)
    duck.play("fly")
    duck.setDepth(0)

    if (spawnOnLeft) {
      duck.setFlipX(false)
      this.physics.add.existing(duck)
      ;(duck.body as Phaser.Physics.Arcade.Body).setVelocityX(150)
    } else {
      duck.setFlipX(true)
      this.physics.add.existing(duck)
      ;(duck.body as Phaser.Physics.Arcade.Body).setVelocityX(-150)
    }

    this.ducks.add(duck)
    this.activeDuckCount++
  }

  update() {
    // Check if ground height changed in Tweakpane
    if (GAME_CONFIG.floor.groundHeight !== this.lastGroundHeight) {
      this.lastGroundHeight = GAME_CONFIG.floor.groundHeight
      this.createFloorTiles()
      this.pivotPoint.y = this.getGroundLevel()
    }

    // Check collision BEFORE applying movement to prevent overshooting
    this.checkPillowLanding()

    if (this.isDropping && this.floatingPillow) {
      const gravity = 800
      const deltaTime = this.game.loop.delta / 1000
      this.pillowVelocityY += gravity * deltaTime
      this.floatingPillow.y += this.pillowVelocityY * deltaTime

      // Apply spinning and horizontal movement if falling off
      const isFalling = this.floatingPillow.getData('isFalling')
      if (isFalling) {
        const angularVelocity = this.floatingPillow.getData('angularVelocity') || 0
        const horizontalVelocity = this.floatingPillow.getData('horizontalVelocity') || 0

        this.floatingPillow.rotation += angularVelocity * deltaTime
        this.floatingPillow.x += horizontalVelocity * deltaTime
      }
    }

    this.updatePillowSway()

    this.ducks.children.entries.forEach((child) => {
      const duck = child as Phaser.GameObjects.Sprite
      const body = duck.body as Phaser.Physics.Arcade.Body
      const width = this.cameras.main.width

      if (duck.x > width + 50) {
        duck.x = -50
        duck.setFlipX(false)
        body.setVelocityX(150)
      } else if (duck.x < -50) {
        duck.x = width + 50
        duck.setFlipX(true)
        body.setVelocityX(-150)
      }

      const bounds = duck.getBounds()
      if (bounds.contains(this.currentX, this.currentY)) {
        this.sound.play("pillowHit")
        this.createFeatherExplosion(duck.x, duck.y)
        duck.destroy()
        this.activeDuckCount--
      }
    })

    this.clouds.children.entries.forEach((child) => {
      const cloud = child as Phaser.GameObjects.Image
      if (cloud.x > this.cameras.main.width + 200) {
        cloud.x = -200
      } else if (cloud.x < -200) {
        cloud.x = this.cameras.main.width + 200
      }
    })

    // Handle floating pillow programmatic lowering and sway
    if (this.floatingPillow && !this.isDropping) {
      const time = this.time.now / 1000
      const swayAmount = 1 + this.dropCount
      const sway = Math.sin(time * 2) * swayAmount

      // Always apply sway to X position
      this.floatingPillow.x = this.cameras.main.width / 2 + sway

      // Programmatically lower the pillow if still animating with easing
      if (this.lineAnimating) {
        const elapsed = this.time.now - this.pillowLoweringStartTime
        const progress = Math.min(elapsed / this.pillowLoweringDuration, 1)

        // Power1 easing out (starts fast, ends slow)
        const easedProgress = progress * (2 - progress)

        // Calculate Y position with easing
        this.floatingPillow.y = this.pillowLoweringStartY + (this.pillowLoweringTargetY - this.pillowLoweringStartY) * easedProgress

        // Enable clicking when pillow reaches halfway point
        const halfwayY = this.pillowLoweringTargetY / 2
        if (this.floatingPillow.y >= halfwayY && !this.canClickPillow) {
          this.canClickPillow = true
        }

        // Check if animation complete
        if (progress >= 1) {
          this.floatingPillow.y = this.pillowLoweringTargetY
          this.lineAnimating = false
        }
      }
    }

    // Draw suspension line or line segments
    if (this.floatingPillow) {
      if (this.lineCut) {
        // Draw upper segment (bottom end animates up to top)
        this.upperLineSegment.clear()
        if (this.upperLineEndY > 0) {
          this.upperLineSegment.lineStyle(1, 0xffffff, 0.5)
          this.upperLineSegment.beginPath()
          this.upperLineSegment.moveTo(this.floatingPillow.x, 0)
          this.upperLineSegment.lineTo(this.floatingPillow.x, this.upperLineEndY)
          this.upperLineSegment.strokePath()
        }

        // Animate lower segment start point down to pillow
        // Keep it slightly ahead of the pillow for a "dragging" effect
        const targetDistance = 20 // Keep lower segment 20px above pillow
        const targetStartY = Math.max(this.cutY, this.floatingPillow.y - targetDistance)
        this.lowerLineStartY += (targetStartY - this.lowerLineStartY) * 0.3

        // Draw lower segment (top end animates down with pillow)
        this.lowerLineSegment.clear()
        if (this.floatingPillow.y > this.lowerLineStartY) {
          this.lowerLineSegment.lineStyle(1, 0xffffff, 0.5)
          this.lowerLineSegment.beginPath()
          this.lowerLineSegment.moveTo(this.floatingPillow.x, this.lowerLineStartY)
          this.lowerLineSegment.lineTo(this.floatingPillow.x, this.floatingPillow.y)
          this.lowerLineSegment.strokePath()
        }

        // Clear the main suspension line
        this.suspensionLine.clear()
      } else if (this.showLine) {
        // Draw normal suspension line
        this.suspensionLine.clear()
        this.suspensionLine.lineStyle(1, 0xffffff, 0.5)
        this.suspensionLine.beginPath()
        this.suspensionLine.moveTo(this.floatingPillow.x, 0)
        this.suspensionLine.lineTo(this.floatingPillow.x, this.lineRetractY)
        this.suspensionLine.strokePath()

        // Clear segment graphics
        this.upperLineSegment.clear()
        this.lowerLineSegment.clear()
      } else {
        // Clear all line graphics
        this.suspensionLine.clear()
        this.upperLineSegment.clear()
        this.lowerLineSegment.clear()
      }
    }
  }
}
