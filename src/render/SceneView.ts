import * as THREE from "three";
import type { GameState, ObstacleState } from "../game/types";

const WATERMELON_RADIUS = 0.48;
const POSITION_EPSILON = 0.0001;
const HEADING_EPSILON = 0.0001;
const SWING_BASE_ROTATION = 0.06;
const SWING_DURATION_MS = 640;
const COLLISION_DURATION_MS = 180;
const BREAK_DURATION_MS = 1_350;

interface ParticleMotion {
  angle: number;
  speed: number;
  rise: number;
  gravity: number;
  spin: number;
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function easeOutCubic(value: number): number {
  const inverse = 1 - clamp01(value);
  return 1 - inverse * inverse * inverse;
}

function easeInOut(value: number): number {
  const t = clamp01(value);
  return t * t * (3 - 2 * t);
}

function normalizeRadians(value: number): number {
  return ((value + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI;
}

function shortestAngleRadians(value: number): number {
  return normalizeRadians(value);
}

function distance3d(a: THREE.Vector3, b: THREE.Vector3): number {
  return a.distanceTo(b);
}

export class SceneView {
  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.PerspectiveCamera(48, 1, 0.1, 100);
  private readonly renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  private readonly player = new THREE.Group();
  private readonly characterVisual = new THREE.Group();
  private readonly swingRig = new THREE.Group();
  private readonly watermelonWhole = new THREE.Group();
  private readonly watermelonBroken = new THREE.Group();
  private readonly watermelonHalves: THREE.Group[] = [];
  private readonly particles = new THREE.Group();
  private readonly decorationGroup = new THREE.Group();
  private readonly foamStrips: THREE.Mesh[] = [];
  private readonly particleMotions: ParticleMotion[] = [];
  private readonly impactRing = new THREE.Mesh(
    new THREE.RingGeometry(WATERMELON_RADIUS * 0.72, WATERMELON_RADIUS * 0.82, 32),
    new THREE.MeshBasicMaterial({ color: 0xfff3bf, transparent: true, opacity: 0, side: THREE.DoubleSide }),
  );

  private readonly visualPosition = new THREE.Vector3();
  private readonly targetPosition = new THREE.Vector3();
  private readonly positionFrom = new THREE.Vector3();
  private readonly positionTo = new THREE.Vector3();
  private readonly cameraBasePosition = new THREE.Vector3();
  private readonly cameraLookAt = new THREE.Vector3(0, 0, 0);
  private readonly cameraOffset = new THREE.Vector3();
  private readonly tempDirection = new THREE.Vector3();
  private visualHeadingRad = 0;
  private targetHeadingRad = 0;
  private headingFromRad = 0;
  private headingToRad = 0;
  private positionStartedAt = -1;
  private positionDuration = 0;
  private headingStartedAt = -1;
  private headingDuration = 0;
  private collisionStartedAt = -1;
  private swingStartedAt = -1;
  private breakStartedAt = -1;
  private lastRoundStartedAt = -1;
  private lastCollisionCount = 0;
  private lastSwingCount = 0;
  private lastBroken = false;
  private initialized = false;

  constructor(
    private readonly host: HTMLElement,
    private readonly getState: () => Readonly<GameState>,
  ) {
    this.scene.background = new THREE.Color(0x8fd8ef);
    this.scene.fog = new THREE.Fog(0x8fd8ef, 24, 52);

    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.08;
    this.host.appendChild(this.renderer.domElement);

    this.addLights();
    this.addEnvironment();
    this.buildPlayer();
    this.buildWatermelon();
    this.buildObstacles(this.getState().obstacles);

    this.impactRing.rotation.x = -Math.PI / 2;
    this.scene.add(this.player, this.watermelonWhole, this.watermelonBroken, this.particles, this.impactRing);
    this.scene.add(this.decorationGroup);
    this.resize();
    window.addEventListener("resize", this.resize);
  }

  render(nowMs: number): void {
    const state = this.getState();
    this.observeRound(state, nowMs);
    this.updateVisualMotion(nowMs);
    this.updateCharacterMotion(nowMs);

    this.player.position.copy(this.visualPosition);
    this.player.rotation.y = this.visualHeadingRad;

    this.watermelonWhole.position.set(state.watermelon.x, WATERMELON_RADIUS, state.watermelon.z);
    this.watermelonBroken.position.set(state.watermelon.x, WATERMELON_RADIUS * 0.72, state.watermelon.z);
    this.particles.position.set(state.watermelon.x, WATERMELON_RADIUS, state.watermelon.z);
    this.impactRing.position.set(state.watermelon.x, 0.035, state.watermelon.z);

    this.updateSwing(nowMs);
    this.updateWatermelonBreak(nowMs, state.watermelon.broken);
    this.updateShoreline(nowMs);
    this.updateCamera(nowMs);
    this.renderer.render(this.scene, this.camera);
  }

  private readonly resize = (): void => {
    const width = Math.max(1, this.host.clientWidth);
    const height = Math.max(1, this.host.clientHeight);
    const aspect = width / height;
    this.camera.aspect = aspect;

    if (aspect < 0.75) {
      this.cameraBasePosition.set(0, 18, 13.5);
      this.camera.fov = 62;
    } else if (aspect < 1.15) {
      this.cameraBasePosition.set(8.5, 18, 19.5);
      this.camera.fov = 54;
    } else {
      this.cameraBasePosition.set(11.5, 13.5, 15.5);
      this.camera.fov = 48;
    }
    this.camera.position.copy(this.cameraBasePosition);
    this.camera.lookAt(this.cameraLookAt);
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
  };

  private observeRound(state: Readonly<GameState>, nowMs: number): void {
    if (!this.initialized || state.round.startedAtMs !== this.lastRoundStartedAt) {
      this.resetVisualState(state);
      this.lastRoundStartedAt = state.round.startedAtMs;
      this.initialized = true;
      return;
    }

    const nextPosition = this.tempDirection.set(state.player.x, 0, state.player.z);
    const positionChanged = distance3d(this.targetPosition, nextPosition) > POSITION_EPSILON;
    const nextHeading = normalizeRadians(THREE.MathUtils.degToRad(-state.player.headingDeg));
    const headingChanged = Math.abs(shortestAngleRadians(nextHeading - this.targetHeadingRad)) > HEADING_EPSILON;

    if (positionChanged) {
      this.positionFrom.copy(this.visualPosition);
      this.positionTo.copy(nextPosition);
      this.positionStartedAt = nowMs;
      const distance = distance3d(this.positionFrom, this.positionTo);
      this.positionDuration = Math.min(650, Math.max(250, 240 + distance * 150));
      this.targetPosition.copy(nextPosition);
    }

    if (headingChanged) {
      this.headingFromRad = this.visualHeadingRad;
      this.headingToRad = this.visualHeadingRad + shortestAngleRadians(nextHeading - this.visualHeadingRad);
      this.headingStartedAt = nowMs;
      const angleDegrees = Math.abs(THREE.MathUtils.radToDeg(this.headingToRad - this.headingFromRad));
      this.headingDuration = Math.min(320, Math.max(180, 150 + angleDegrees * 0.78));
      this.targetHeadingRad = nextHeading;
    }

    if (state.round.collisionCount !== this.lastCollisionCount) {
      this.collisionStartedAt = state.round.collisionCount > this.lastCollisionCount ? nowMs : -1;
      this.lastCollisionCount = state.round.collisionCount;
    }

    if (state.round.swingCount !== this.lastSwingCount) {
      this.swingStartedAt = state.round.swingCount > this.lastSwingCount ? nowMs : -1;
      this.lastSwingCount = state.round.swingCount;
    }

    if (state.watermelon.broken !== this.lastBroken) {
      this.lastBroken = state.watermelon.broken;
      this.breakStartedAt = state.watermelon.broken ? nowMs : -1;
      this.resetParticles();
      if (!state.watermelon.broken) {
        this.resetWatermelonHalves();
      }
    }

  }

  private resetVisualState(state: Readonly<GameState>): void {
    this.visualPosition.set(state.player.x, 0, state.player.z);
    this.targetPosition.copy(this.visualPosition);
    this.positionFrom.copy(this.visualPosition);
    this.positionTo.copy(this.visualPosition);
    this.positionStartedAt = -1;

    this.visualHeadingRad = normalizeRadians(THREE.MathUtils.degToRad(-state.player.headingDeg));
    this.targetHeadingRad = this.visualHeadingRad;
    this.headingFromRad = this.visualHeadingRad;
    this.headingToRad = this.visualHeadingRad;
    this.headingStartedAt = -1;

    this.collisionStartedAt = -1;
    this.swingStartedAt = -1;
    this.breakStartedAt = -1;
    this.lastCollisionCount = state.round.collisionCount;
    this.lastSwingCount = state.round.swingCount;
    this.lastBroken = state.watermelon.broken;
    this.resetParticles();
    this.resetWatermelonHalves();
    this.characterVisual.position.set(0, 0, 0);
    this.characterVisual.rotation.set(0, 0, 0);
    this.characterVisual.scale.set(1, 1, 1);
    this.swingRig.rotation.set(0, 0, 0);
  }

  private updateVisualMotion(nowMs: number): void {
    if (this.positionStartedAt >= 0) {
      const raw = (nowMs - this.positionStartedAt) / this.positionDuration;
      const progress = clamp01(raw);
      this.visualPosition.lerpVectors(this.positionFrom, this.positionTo, easeInOut(progress));
      if (progress >= 1) {
        this.visualPosition.copy(this.positionTo);
        this.positionStartedAt = -1;
      }
    }

    if (this.headingStartedAt >= 0) {
      const raw = (nowMs - this.headingStartedAt) / this.headingDuration;
      const progress = clamp01(raw);
      this.visualHeadingRad = THREE.MathUtils.lerp(this.headingFromRad, this.headingToRad, easeInOut(progress));
      if (progress >= 1) {
        this.visualHeadingRad = this.headingToRad;
        this.headingStartedAt = -1;
      }
    }
  }

  private updateCharacterMotion(nowMs: number): void {
    const moving = this.positionStartedAt >= 0;
    const movementElapsed = moving ? Math.max(0, nowMs - this.positionStartedAt) : 0;
    const bob = moving ? Math.sin((movementElapsed / 1000) * Math.PI * 7) * 0.045 : Math.sin(nowMs / 1500) * 0.012;

    let recoil = 0;
    if (this.collisionStartedAt >= 0) {
      const progress = clamp01((nowMs - this.collisionStartedAt) / COLLISION_DURATION_MS);
      recoil = Math.sin(progress * Math.PI);
      if (progress >= 1) {
        this.collisionStartedAt = -1;
      }
    }

    this.characterVisual.position.y = bob + recoil * 0.045;
    this.characterVisual.rotation.x = recoil * -0.09;
    this.characterVisual.rotation.z = recoil * 0.1;
    const squash = recoil * 0.055;
    this.characterVisual.scale.set(1 - squash, 1 + squash * 0.75, 1 - squash);
  }

  private addLights(): void {
    const hemi = new THREE.HemisphereLight(0xe9fbff, 0xc48d52, 2.45);
    this.scene.add(hemi);

    const sun = new THREE.DirectionalLight(0xfff2c8, 3.35);
    sun.position.set(-7, 14, 9);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.camera.left = -13;
    sun.shadow.camera.right = 13;
    sun.shadow.camera.top = 13;
    sun.shadow.camera.bottom = -13;
    sun.shadow.bias = -0.0004;
    sun.shadow.radius = 4;
    this.scene.add(sun);
  }

  private addEnvironment(): void {
    const base = new THREE.Mesh(
      new THREE.BoxGeometry(20.5, 0.38, 20.5),
      new THREE.MeshStandardMaterial({ color: 0xc79a58, roughness: 1 }),
    );
    base.position.y = -0.2;
    base.receiveShadow = true;
    this.scene.add(base);

    const sand = new THREE.Mesh(
      new THREE.PlaneGeometry(20, 20),
      new THREE.MeshStandardMaterial({ color: 0xe9c276, roughness: 0.96 }),
    );
    sand.rotation.x = -Math.PI / 2;
    sand.position.y = 0.01;
    sand.receiveShadow = true;
    this.scene.add(sand);

    const water = new THREE.Mesh(
      new THREE.PlaneGeometry(38, 18),
      new THREE.MeshStandardMaterial({ color: 0x2aa8cc, roughness: 0.28, metalness: 0.05 }),
    );
    water.rotation.x = -Math.PI / 2;
    water.position.set(0, -0.3, -18.5);
    water.receiveShadow = true;
    this.scene.add(water);

    const shore = new THREE.Mesh(
      new THREE.BoxGeometry(20, 0.08, 0.3),
      new THREE.MeshStandardMaterial({ color: 0xf3e1b4, roughness: 0.85 }),
    );
    shore.position.set(0, 0.035, -9.85);
    shore.receiveShadow = true;
    this.scene.add(shore);

    const foamMaterial = new THREE.MeshStandardMaterial({
      color: 0xfaf4da,
      roughness: 0.72,
      transparent: true,
      opacity: 0.62,
    });
    for (const [index, z] of [-9.68, -9.84, -10.02].entries()) {
      const foam = new THREE.Mesh(new THREE.BoxGeometry(19.5 - index * 1.8, 0.035, 0.11), foamMaterial);
      foam.position.set(index % 2 === 0 ? 0.2 : -0.35, 0.085 + index * 0.008, z);
      foam.userData.baseX = foam.position.x;
      foam.rotation.y = index === 1 ? -0.008 : 0.006;
      foam.receiveShadow = true;
      this.foamStrips.push(foam);
      this.scene.add(foam);
    }

    const patchMaterial = new THREE.MeshStandardMaterial({
      color: 0xc48c4d,
      roughness: 1,
      transparent: true,
      opacity: 0.18,
      depthWrite: false,
    });
    for (const [x, z, scale] of [
      [-6.6, 5.9, 1.2],
      [6.8, 2.9, 0.8],
      [-7.4, -0.2, 0.65],
      [7.2, -6.8, 0.9],
    ]) {
      const patch = new THREE.Mesh(new THREE.CircleGeometry(0.72, 24), patchMaterial);
      patch.rotation.x = -Math.PI / 2;
      patch.position.set(x, 0.026, z);
      patch.scale.set(scale, scale * 0.55, scale);
      this.decorationGroup.add(patch);
    }

    const shellMaterial = new THREE.MeshStandardMaterial({ color: 0xf4d6a2, roughness: 0.86 });
    for (const [x, z, rotation] of [
      [-7.7, 6.8, 0.2],
      [7.5, 6.3, -0.6],
      [-7.6, -6.8, 0.8],
      [7.6, -4.2, -0.3],
    ]) {
      const shell = new THREE.Mesh(new THREE.IcosahedronGeometry(0.13, 1), shellMaterial);
      shell.position.set(x, 0.13, z);
      shell.scale.set(1.2, 0.55, 0.8);
      shell.rotation.y = rotation;
      shell.castShadow = true;
      this.decorationGroup.add(shell);
    }

    const pebbleMaterial = new THREE.MeshStandardMaterial({ color: 0xb6a17f, roughness: 1 });
    for (const [x, z, scale] of [
      [-8.4, 3.8, 0.75],
      [8.3, -1.8, 0.6],
      [-7.9, -5.4, 0.55],
      [6.7, 7.4, 0.65],
    ]) {
      const pebble = new THREE.Mesh(new THREE.DodecahedronGeometry(0.12, 0), pebbleMaterial);
      pebble.position.set(x, 0.12, z);
      pebble.scale.set(scale, scale * 0.65, scale * 0.9);
      pebble.castShadow = true;
      this.decorationGroup.add(pebble);
    }

    const footprintMaterial = new THREE.MeshStandardMaterial({
      color: 0xb9874a,
      roughness: 1,
      transparent: true,
      opacity: 0.26,
      depthWrite: false,
    });
    for (const [x, z, rotation] of [
      [5.9, 5.8, -0.28],
      [6.35, 5.2, -0.25],
      [6.8, 4.6, -0.25],
    ]) {
      const footprint = new THREE.Mesh(new THREE.SphereGeometry(0.17, 12, 8), footprintMaterial);
      footprint.position.set(x, 0.028, z);
      footprint.scale.set(0.7, 0.08, 1.55);
      footprint.rotation.y = rotation;
      this.decorationGroup.add(footprint);
    }

    const tuftMaterial = new THREE.MeshStandardMaterial({ color: 0x76a75f, roughness: 0.94 });
    for (const [x, z] of [
      [-8.7, 7.7],
      [8.55, 7.8],
      [-8.65, -7.7],
      [8.6, -8.1],
    ]) {
      const tuft = new THREE.Group();
      tuft.position.set(x, 0.02, z);
      for (let index = 0; index < 3; index += 1) {
        const blade = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.4, 5), tuftMaterial);
        blade.position.set((index - 1) * 0.1, 0.2, (index % 2) * 0.04);
        blade.rotation.z = (index - 1) * 0.24;
        blade.castShadow = true;
        tuft.add(blade);
      }
      this.decorationGroup.add(tuft);
    }
  }

  private buildPlayer(): void {
    const skin = new THREE.MeshStandardMaterial({ color: 0xf1b98f, roughness: 0.8 });
    const shirt = new THREE.MeshStandardMaterial({ color: 0xf3f0e8, roughness: 0.88 });
    const shorts = new THREE.MeshStandardMaterial({ color: 0x3c6f95, roughness: 0.82 });
    const blindfold = new THREE.MeshStandardMaterial({ color: 0x20232a, roughness: 0.68 });
    const darkTrim = new THREE.MeshStandardMaterial({ color: 0x263947, roughness: 0.72 });
    const shirtTrim = new THREE.MeshStandardMaterial({ color: 0xf5bd47, roughness: 0.7 });
    const shoe = new THREE.MeshStandardMaterial({ color: 0xd87d52, roughness: 0.86 });
    const wood = new THREE.MeshStandardMaterial({ color: 0xa46b32, roughness: 0.9 });

    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.38, 0.7, 5, 12), shirt);
    body.position.y = 1.15;
    body.castShadow = true;
    this.characterVisual.add(body);

    const chestBadge = new THREE.Mesh(new THREE.CapsuleGeometry(0.105, 0.18, 4, 8), shirtTrim);
    chestBadge.position.set(0, 1.24, -0.36);
    chestBadge.rotation.x = Math.PI / 2;
    chestBadge.scale.set(1, 1, 0.35);
    chestBadge.castShadow = true;
    this.characterVisual.add(chestBadge);

    const hips = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.42, 0.45, 12), shorts);
    hips.position.y = 0.58;
    hips.castShadow = true;
    this.characterVisual.add(hips);

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.38, 20, 16), skin);
    head.position.y = 1.95;
    head.scale.set(1.04, 1, 0.98);
    head.castShadow = true;
    this.characterVisual.add(head);

    const band = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.2, 0.13), blindfold);
    band.position.set(0, 1.99, -0.34);
    band.castShadow = true;
    this.characterVisual.add(band);

    for (const x of [-0.34, 0.34]) {
      const wrap = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.19, 0.33), blindfold);
      wrap.position.set(x, 1.99, -0.22);
      wrap.rotation.y = x < 0 ? -0.18 : 0.18;
      wrap.castShadow = true;
      this.characterVisual.add(wrap);
    }

    const nose = new THREE.Mesh(new THREE.ConeGeometry(0.078, 0.2, 8), skin);
    nose.position.set(0, 1.84, -0.38);
    nose.rotation.x = -Math.PI / 2;
    nose.castShadow = true;
    this.characterVisual.add(nose);

    const antennaStem = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.045, 0.3, 8), darkTrim);
    antennaStem.position.set(0, 2.38, 0.02);
    antennaStem.rotation.z = -0.12;
    antennaStem.castShadow = true;
    this.characterVisual.add(antennaStem);

    const antennaTip = new THREE.Mesh(new THREE.SphereGeometry(0.09, 12, 8), shirtTrim);
    antennaTip.position.set(-0.035, 2.56, 0.02);
    antennaTip.castShadow = true;
    this.characterVisual.add(antennaTip);

    const legGeometry = new THREE.CapsuleGeometry(0.105, 0.48, 4, 8);
    for (const x of [-0.2, 0.2]) {
      const leg = new THREE.Mesh(legGeometry, skin);
      leg.position.set(x, 0.26, 0);
      leg.castShadow = true;
      this.characterVisual.add(leg);

      const foot = new THREE.Mesh(new THREE.CapsuleGeometry(0.13, 0.18, 4, 8), shoe);
      foot.position.set(x, 0.09, -0.13);
      foot.rotation.x = Math.PI / 2;
      foot.castShadow = true;
      this.characterVisual.add(foot);
    }

    this.swingRig.position.set(0.05, 1.4, -0.13);
    this.characterVisual.add(this.swingRig);

    const armMaterial = new THREE.MeshStandardMaterial({ color: 0xf1b98f, roughness: 0.82 });
    for (const x of [-0.28, 0.28]) {
      const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.095, 0.38, 4, 8), armMaterial);
      arm.position.set(x * 0.76, -0.02, -0.015);
      arm.rotation.z = x < 0 ? -0.52 : 0.52;
      arm.rotation.x = -0.2;
      arm.castShadow = true;
      this.swingRig.add(arm);

      const hand = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 8), skin);
      hand.position.set(x * 0.58, -0.23, -0.085);
      hand.castShadow = true;
      this.swingRig.add(hand);
    }

    const stickLength = 2.15;
    const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.06, stickLength, 10), wood);
    stick.position.set(0, -stickLength / 2 - 0.08, -0.015);
    stick.castShadow = true;
    this.swingRig.add(stick);

    const stickCap = new THREE.Mesh(new THREE.SphereGeometry(0.08, 10, 8), shirtTrim);
    stickCap.position.set(0, -stickLength - 0.08, -0.015);
    stickCap.castShadow = true;
    this.swingRig.add(stickCap);

    this.player.add(this.characterVisual);
  }

  private buildWatermelon(): void {
    const rind = new THREE.MeshStandardMaterial({ color: 0x42a941, roughness: 0.7 });
    const stripe = new THREE.MeshStandardMaterial({ color: 0x155d34, roughness: 0.72 });

    const mat = new THREE.Mesh(
      new THREE.CircleGeometry(0.76, 32),
      new THREE.MeshStandardMaterial({ color: 0xb78348, roughness: 1, transparent: true, opacity: 0.35, depthWrite: false }),
    );
    mat.rotation.x = -Math.PI / 2;
    mat.position.y = -WATERMELON_RADIUS + 0.025;
    this.watermelonWhole.add(mat);

    const brokenMat = mat.clone();
    brokenMat.position.y = -WATERMELON_RADIUS * 0.72 + 0.025;
    this.watermelonBroken.add(brokenMat);

    const straw = new THREE.Mesh(
      new THREE.TorusGeometry(0.62, 0.045, 6, 28),
      new THREE.MeshStandardMaterial({ color: 0xd5a55b, roughness: 1 }),
    );
    straw.rotation.x = -Math.PI / 2;
    straw.position.y = -WATERMELON_RADIUS + 0.035;
    this.watermelonWhole.add(straw);

    const brokenStraw = straw.clone();
    brokenStraw.position.y = -WATERMELON_RADIUS * 0.72 + 0.045;
    this.watermelonBroken.add(brokenStraw);

    const melon = new THREE.Mesh(new THREE.SphereGeometry(WATERMELON_RADIUS, 28, 20), rind);
    melon.scale.y = 0.9;
    melon.castShadow = true;
    this.watermelonWhole.add(melon);

    for (const [index, y] of [-0.18, 0, 0.18].entries()) {
      const band = new THREE.Mesh(new THREE.TorusGeometry(WATERMELON_RADIUS * (0.72 + index * 0.02), 0.032, 8, 32), stripe);
      band.rotation.x = Math.PI / 2;
      band.position.y = y;
      band.scale.z = 0.96;
      band.castShadow = true;
      this.watermelonWhole.add(band);
    }

    const stem = new THREE.Mesh(
      new THREE.CylinderGeometry(0.045, 0.065, 0.2, 8),
      new THREE.MeshStandardMaterial({ color: 0x5e7d39, roughness: 0.9 }),
    );
    stem.position.set(0.02, WATERMELON_RADIUS * 0.86, 0.01);
    stem.rotation.z = -0.18;
    stem.castShadow = true;
    this.watermelonWhole.add(stem);

    const flesh = new THREE.MeshStandardMaterial({ color: 0xe64d45, roughness: 0.78 });
    const shell = new THREE.MeshStandardMaterial({ color: 0x2d913d, roughness: 0.8 });
    const seedMaterial = new THREE.MeshStandardMaterial({ color: 0x33251e, roughness: 0.76 });

    for (const side of [-1, 1]) {
      const half = new THREE.Group();
      half.userData.side = side;

      const outer = new THREE.Mesh(new THREE.SphereGeometry(WATERMELON_RADIUS * 0.72, 20, 14), shell);
      outer.scale.set(0.74, 0.82, 0.52);
      outer.castShadow = true;
      half.add(outer);

      const cut = new THREE.Mesh(new THREE.CircleGeometry(WATERMELON_RADIUS * 0.55, 24), flesh);
      cut.position.z = side > 0 ? -0.28 : 0.28;
      cut.rotation.y = side > 0 ? 0 : Math.PI;
      cut.castShadow = true;
      half.add(cut);

      for (const [seedIndex, seedPosition] of [
        [-0.12, 0.06, -0.305],
        [0.09, -0.05, -0.308],
        [0.02, 0.14, -0.31],
      ].entries()) {
        const seed = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 6), seedMaterial);
        seed.position.set(seedPosition[0], seedPosition[1], side > 0 ? seedPosition[2] : -seedPosition[2]);
        seed.scale.set(0.55, 1.25, 0.28);
        seed.rotation.z = (seedIndex - 1) * 0.5;
        half.add(seed);
      }

      half.position.set(side * 0.28, 0, 0);
      half.rotation.z = side * -0.24;
      this.watermelonHalves.push(half);
      this.watermelonBroken.add(half);
    }

    this.watermelonBroken.visible = false;

    const fleshParticleMaterial = new THREE.MeshStandardMaterial({ color: 0xe64d45, roughness: 0.9 });
    const seedParticleMaterial = new THREE.MeshStandardMaterial({ color: 0x33251e, roughness: 0.74 });
    const rindParticleMaterial = new THREE.MeshStandardMaterial({ color: 0x42a941, roughness: 0.8 });
    for (let index = 0; index < 24; index += 1) {
      const isSeed = index >= 14 && index < 20;
      const isRind = index >= 20;
      const material = isSeed ? seedParticleMaterial : isRind ? rindParticleMaterial : fleshParticleMaterial;
      const particle = new THREE.Mesh(
        new THREE.SphereGeometry(isSeed ? 0.038 : 0.045 + (index % 3) * 0.012, isSeed ? 7 : 8, 6),
        material,
      );
      particle.visible = false;
      particle.userData.index = index;
      if (isSeed) particle.scale.set(0.55, 1.3, 0.3);
      this.particles.add(particle);
      this.particleMotions.push({
        angle: (index / 24) * Math.PI * 2 + (index % 2) * 0.15,
        speed: 1.25 + (index % 5) * 0.25,
        rise: 2.45 + (index % 4) * 0.4,
        gravity: 4.25 + (index % 3) * 0.35,
        spin: (index % 2 === 0 ? 1 : -1) * (2.2 + (index % 4) * 0.4),
      });
    }
  }

  private buildObstacles(obstacles: readonly ObstacleState[]): void {
    for (const obstacle of obstacles) {
      const group = new THREE.Group();
      group.position.set(obstacle.x, 0, obstacle.z);
      group.userData.decorativeOnly = true;

      if (obstacle.kind === "rock") {
        const rock = new THREE.Mesh(
          new THREE.DodecahedronGeometry(0.72, 1),
          new THREE.MeshStandardMaterial({ color: 0x7f8584, roughness: 1 }),
        );
        rock.position.y = 0.52;
        rock.scale.set(1.15, 0.8, 0.95);
        rock.rotation.set(0.2, 0.5, -0.12);
        rock.castShadow = true;
        group.add(rock);

        const rockHighlight = new THREE.Mesh(
          new THREE.SphereGeometry(0.22, 10, 8),
          new THREE.MeshStandardMaterial({ color: 0xa9afaa, roughness: 1, transparent: true, opacity: 0.6 }),
        );
        rockHighlight.position.set(-0.22, 0.75, -0.38);
        rockHighlight.scale.set(1.1, 0.45, 0.5);
        group.add(rockHighlight);
      }

      if (obstacle.kind === "bucket") {
        const bucketMaterial = new THREE.MeshStandardMaterial({ color: 0xf2b535, roughness: 0.65, side: THREE.DoubleSide });
        const bucket = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.32, 0.65, 16, 1, true), bucketMaterial);
        bucket.position.y = 0.34;
        bucket.castShadow = true;
        group.add(bucket);

        const rim = new THREE.Mesh(new THREE.TorusGeometry(0.41, 0.035, 8, 24), bucketMaterial);
        rim.rotation.x = Math.PI / 2;
        rim.position.y = 0.67;
        rim.castShadow = true;
        group.add(rim);

        const handle = new THREE.Mesh(
          new THREE.TorusGeometry(0.42, 0.026, 7, 22, Math.PI),
          new THREE.MeshStandardMaterial({ color: 0x8d6b38, roughness: 0.9 }),
        );
        handle.position.y = 0.55;
        handle.rotation.set(Math.PI / 2, 0, Math.PI / 2);
        handle.castShadow = true;
        group.add(handle);
      }

      if (obstacle.kind === "palm") {
        const trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x9b6838, roughness: 0.95 });
        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.34, 4.2, 10), trunkMaterial);
        trunk.position.y = 2.1;
        trunk.rotation.z = -0.08;
        trunk.castShadow = true;
        group.add(trunk);

        for (const y of [1.25, 2.35, 3.45]) {
          const ring = new THREE.Mesh(new THREE.TorusGeometry(0.27, 0.028, 6, 16), trunkMaterial);
          ring.rotation.x = Math.PI / 2;
          ring.position.y = y;
          ring.castShadow = true;
          group.add(ring);
        }

        const leafMaterial = new THREE.MeshStandardMaterial({ color: 0x278753, roughness: 0.85, side: THREE.DoubleSide });
        for (let index = 0; index < 7; index += 1) {
          const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.32, 2.3, 5), leafMaterial);
          leaf.position.y = 4.15;
          leaf.rotation.z = Math.PI / 2.15;
          leaf.rotation.y = (index / 7) * Math.PI * 2;
          leaf.translateY(0.82);
          leaf.castShadow = true;
          group.add(leaf);
        }

        const coconutMaterial = new THREE.MeshStandardMaterial({ color: 0x5b4429, roughness: 0.94 });
        for (const [x, z] of [[-0.16, -0.12], [0.12, -0.08], [0.02, 0.16]]) {
          const coconut = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 8), coconutMaterial);
          coconut.position.set(x, 3.9, z);
          coconut.castShadow = true;
          group.add(coconut);
        }
      }

      this.scene.add(group);
    }
  }

  private updateSwing(nowMs: number): void {
    if (this.swingStartedAt < 0) {
      this.swingRig.rotation.set(SWING_BASE_ROTATION, 0, 0);
      return;
    }

    const progress = clamp01((nowMs - this.swingStartedAt) / SWING_DURATION_MS);
    let rotationX = SWING_BASE_ROTATION;
    let rotationZ = 0;

    if (progress < 0.22) {
      const phase = easeInOut(progress / 0.22);
      rotationX = THREE.MathUtils.lerp(SWING_BASE_ROTATION, -0.4, phase);
      rotationZ = THREE.MathUtils.lerp(0, -0.08, phase);
    } else if (progress < 0.56) {
      const phase = easeOutCubic((progress - 0.22) / 0.34);
      rotationX = THREE.MathUtils.lerp(-0.4, 1.2, phase);
      rotationZ = THREE.MathUtils.lerp(-0.08, 0.04, phase);
    } else {
      const phase = easeOutCubic((progress - 0.56) / 0.44);
      rotationX = THREE.MathUtils.lerp(1.2, SWING_BASE_ROTATION, phase);
      rotationZ = THREE.MathUtils.lerp(0.04, 0, phase);
    }

    this.swingRig.rotation.set(rotationX, 0, rotationZ);
    if (progress >= 1) {
      this.swingStartedAt = -1;
    }
  }

  private updateWatermelonBreak(nowMs: number, broken: boolean): void {
    this.watermelonWhole.visible = !broken;
    this.watermelonBroken.visible = broken;

    const impactMaterial = this.impactRing.material as THREE.MeshBasicMaterial;
    if (!broken || this.breakStartedAt < 0) {
      this.particles.visible = false;
      this.impactRing.visible = false;
      impactMaterial.opacity = 0;
      return;
    }

    const elapsed = Math.max(0, nowMs - this.breakStartedAt);
    const elapsedSec = elapsed / 1000;
    const progress = clamp01(elapsed / BREAK_DURATION_MS);
    const split = easeOutCubic(Math.min(1, progress / 0.68));

    for (const half of this.watermelonHalves) {
      const side = Number(half.userData.side) || 1;
      half.position.x = side * (0.28 + split * 0.62);
      half.position.y = Math.sin(Math.min(1, progress) * Math.PI) * 0.28;
      half.position.z = side * split * 0.12;
      half.rotation.z = side * (-0.24 - split * 1.15);
      half.rotation.y = side * split * 0.58;
    }

    const ringProgress = clamp01(elapsed / 820);
    this.impactRing.visible = ringProgress < 1;
    this.impactRing.scale.setScalar(0.58 + easeOutCubic(ringProgress) * 2.4);
    impactMaterial.opacity = Math.max(0, (1 - ringProgress) * 0.78);

    this.particles.visible = elapsed < 1_550;
    const t = Math.min(elapsedSec, 1.35);
    this.particles.children.forEach((object, index) => {
      const particle = object as THREE.Mesh;
      const motion = this.particleMotions[index];
      if (!motion) return;
      particle.visible = elapsed < 1_550;
      particle.position.set(
        Math.cos(motion.angle) * motion.speed * t,
        motion.rise * t - motion.gravity * t * t,
        Math.sin(motion.angle) * motion.speed * t,
      );
      particle.rotation.x = t * motion.spin;
      particle.rotation.y = t * motion.spin * 0.72;
    });
  }

  private updateShoreline(nowMs: number): void {
    const time = nowMs / 1000;
    for (const [index, foam] of this.foamStrips.entries()) {
      const material = foam.material as THREE.MeshStandardMaterial;
      const wave = Math.sin(time * 1.25 + index * 1.7) * 0.012;
      const baseX = Number(foam.userData.baseX) || 0;
      foam.position.x = baseX + wave;
      material.opacity = 0.56 + Math.sin(time * 1.3 + index) * 0.06;
    }
  }

  private updateCamera(nowMs: number): void {
    this.cameraOffset.set(0, 0, 0);

    if (this.collisionStartedAt >= 0) {
      const progress = clamp01((nowMs - this.collisionStartedAt) / COLLISION_DURATION_MS);
      const nudge = Math.sin(progress * Math.PI) * 0.1;
      this.cameraOffset.set(Math.sin(nowMs * 0.06) * nudge, nudge * 0.5, 0);
    }

    if (this.breakStartedAt >= 0) {
      const progress = clamp01((nowMs - this.breakStartedAt) / 900);
      const punch = Math.sin(progress * Math.PI) * 0.35;
      this.tempDirection.copy(this.cameraBasePosition).normalize();
      this.cameraOffset.addScaledVector(this.tempDirection, -punch);
    }

    this.camera.position.copy(this.cameraBasePosition).add(this.cameraOffset);
    this.camera.lookAt(this.cameraLookAt);
  }

  private resetParticles(): void {
    this.particles.children.forEach((object) => {
      object.position.set(0, 0, 0);
      object.rotation.set(0, 0, 0);
      object.visible = false;
    });
    this.impactRing.visible = false;
    (this.impactRing.material as THREE.MeshBasicMaterial).opacity = 0;
  }

  private resetWatermelonHalves(): void {
    for (const half of this.watermelonHalves) {
      const side = Number(half.userData.side) || 1;
      half.position.set(side * 0.28, 0, 0);
      half.rotation.set(0, 0, side * -0.24);
    }
  }
}
