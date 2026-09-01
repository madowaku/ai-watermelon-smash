import * as THREE from "three";
import type { GameState, ObstacleState } from "../game/types";

const WATERMELON_RADIUS = 0.48;

export class SceneView {
  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.PerspectiveCamera(48, 1, 0.1, 100);
  private readonly renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  private readonly player = new THREE.Group();
  private readonly stickPivot = new THREE.Group();
  private readonly watermelonWhole = new THREE.Group();
  private readonly watermelonBroken = new THREE.Group();
  private readonly particles = new THREE.Group();
  private lastSwingCount = 0;
  private lastBroken = false;
  private swingStartedAt = -1;
  private breakStartedAt = -1;

  constructor(
    private readonly host: HTMLElement,
    private readonly getState: () => Readonly<GameState>,
  ) {
    this.scene.background = new THREE.Color(0x8fd8ef);
    this.scene.fog = new THREE.Fog(0x8fd8ef, 22, 48);

    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.host.appendChild(this.renderer.domElement);

    this.camera.position.set(11.5, 13.5, 15.5);
    this.camera.lookAt(0, 0, 0);

    this.addLights();
    this.addEnvironment();
    this.buildPlayer();
    this.buildWatermelon();
    this.buildObstacles(this.getState().obstacles);

    this.scene.add(this.player, this.watermelonWhole, this.watermelonBroken, this.particles);
    this.resize();
    window.addEventListener("resize", this.resize);
  }

  render(nowMs: number): void {
    const state = this.getState();

    this.player.position.set(state.player.x, 0, state.player.z);
    // Game heading 0 faces local -Z. Three.js positive Y rotation turns -Z
    // toward -X, so negate the game heading to keep the visual facing aligned.
    this.player.rotation.y = THREE.MathUtils.degToRad(-state.player.headingDeg);

    this.watermelonWhole.position.set(state.watermelon.x, WATERMELON_RADIUS, state.watermelon.z);
    this.watermelonBroken.position.set(state.watermelon.x, WATERMELON_RADIUS * 0.7, state.watermelon.z);
    this.particles.position.set(state.watermelon.x, WATERMELON_RADIUS, state.watermelon.z);

    if (state.round.swingCount !== this.lastSwingCount) {
      if (state.round.swingCount > this.lastSwingCount) {
        this.swingStartedAt = nowMs;
      } else {
        this.swingStartedAt = -1;
      }
      this.lastSwingCount = state.round.swingCount;
    }

    if (state.watermelon.broken !== this.lastBroken) {
      this.lastBroken = state.watermelon.broken;
      this.breakStartedAt = state.watermelon.broken ? nowMs : -1;
      this.resetParticles();
    }

    this.updateSwing(nowMs);
    this.updateWatermelonBreak(nowMs, state.watermelon.broken);
    this.renderer.render(this.scene, this.camera);
  }

  private readonly resize = (): void => {
    const width = Math.max(1, this.host.clientWidth);
    const height = Math.max(1, this.host.clientHeight);
    const aspect = width / height;
    this.camera.aspect = aspect;

    if (aspect < 0.75) {
      this.camera.position.set(0, 18, 13.5);
      this.camera.fov = 62;
    } else if (aspect < 1.15) {
      this.camera.position.set(8.5, 18, 19.5);
      this.camera.fov = 54;
    } else {
      this.camera.position.set(11.5, 13.5, 15.5);
      this.camera.fov = 48;
    }
    this.camera.lookAt(0, 0, 0);
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
  };

  private addLights(): void {
    const hemi = new THREE.HemisphereLight(0xe9fbff, 0xc79555, 2.4);
    this.scene.add(hemi);

    const sun = new THREE.DirectionalLight(0xfff2c8, 3.2);
    sun.position.set(-7, 14, 9);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.camera.left = -13;
    sun.shadow.camera.right = 13;
    sun.shadow.camera.top = 13;
    sun.shadow.camera.bottom = -13;
    this.scene.add(sun);
  }

  private addEnvironment(): void {
    const sand = new THREE.Mesh(
      new THREE.PlaneGeometry(20, 20),
      new THREE.MeshStandardMaterial({ color: 0xe9c276, roughness: 0.95 }),
    );
    sand.rotation.x = -Math.PI / 2;
    sand.receiveShadow = true;
    this.scene.add(sand);

    const water = new THREE.Mesh(
      new THREE.PlaneGeometry(38, 18),
      new THREE.MeshStandardMaterial({ color: 0x2aa8cc, roughness: 0.28, metalness: 0.05 }),
    );
    water.rotation.x = -Math.PI / 2;
    water.position.set(0, -0.05, -18.5);
    this.scene.add(water);

    const shore = new THREE.Mesh(
      new THREE.BoxGeometry(20, 0.05, 0.3),
      new THREE.MeshStandardMaterial({ color: 0xf3e1b4 }),
    );
    shore.position.set(0, 0.02, -9.85);
    this.scene.add(shore);
  }

  private buildPlayer(): void {
    const skin = new THREE.MeshStandardMaterial({ color: 0xf1b98f, roughness: 0.8 });
    const shirt = new THREE.MeshStandardMaterial({ color: 0xf2f2ee, roughness: 0.9 });
    const shorts = new THREE.MeshStandardMaterial({ color: 0x3c6f95, roughness: 0.85 });
    const blindfold = new THREE.MeshStandardMaterial({ color: 0x222327, roughness: 0.7 });
    const wood = new THREE.MeshStandardMaterial({ color: 0xa46b32, roughness: 0.9 });

    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.38, 0.7, 5, 10), shirt);
    body.position.y = 1.15;
    body.castShadow = true;
    this.player.add(body);

    const hips = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.42, 0.45, 12), shorts);
    hips.position.y = 0.58;
    hips.castShadow = true;
    this.player.add(hips);

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.34, 18, 14), skin);
    head.position.y = 1.95;
    head.castShadow = true;
    this.player.add(head);

    const band = new THREE.Mesh(new THREE.BoxGeometry(0.64, 0.18, 0.12), blindfold);
    band.position.set(0, 1.99, -0.31);
    band.castShadow = true;
    this.player.add(band);

    const nose = new THREE.Mesh(new THREE.ConeGeometry(0.075, 0.2, 8), skin);
    nose.position.set(0, 1.86, -0.34);
    nose.rotation.x = -Math.PI / 2;
    nose.castShadow = true;
    this.player.add(nose);

    const legGeometry = new THREE.CylinderGeometry(0.11, 0.12, 0.65, 9);
    for (const x of [-0.2, 0.2]) {
      const leg = new THREE.Mesh(legGeometry, skin);
      leg.position.set(x, 0.15, 0);
      leg.castShadow = true;
      this.player.add(leg);
    }

    this.stickPivot.position.set(0.4, 1.35, -0.08);
    const stickLength = 2.25;
    const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.055, stickLength, 10), wood);
    stick.position.set(0, -stickLength / 2, 0);
    stick.castShadow = true;
    this.stickPivot.add(stick);
    this.player.add(this.stickPivot);
  }

  private buildWatermelon(): void {
    const rind = new THREE.MeshStandardMaterial({ color: 0x42a941, roughness: 0.7 });
    const stripe = new THREE.MeshStandardMaterial({ color: 0x155d34, roughness: 0.72 });

    const melon = new THREE.Mesh(new THREE.SphereGeometry(WATERMELON_RADIUS, 28, 20), rind);
    melon.scale.y = 0.88;
    melon.castShadow = true;
    this.watermelonWhole.add(melon);

    for (const rotation of [0, Math.PI / 3, -Math.PI / 3]) {
      const band = new THREE.Mesh(new THREE.TorusGeometry(WATERMELON_RADIUS * 0.76, 0.025, 8, 32), stripe);
      band.rotation.y = rotation;
      band.scale.y = 0.88;
      this.watermelonWhole.add(band);
    }

    const flesh = new THREE.MeshStandardMaterial({ color: 0xe64d45, roughness: 0.78 });
    const shell = new THREE.MeshStandardMaterial({ color: 0x2d913d, roughness: 0.8 });

    for (const side of [-1, 1]) {
      const half = new THREE.Group();
      const outer = new THREE.Mesh(new THREE.SphereGeometry(WATERMELON_RADIUS * 0.72, 20, 14), shell);
      outer.scale.set(0.72, 0.8, 0.5);
      outer.castShadow = true;
      half.add(outer);

      const cut = new THREE.Mesh(new THREE.CircleGeometry(WATERMELON_RADIUS * 0.55, 24), flesh);
      cut.position.z = side > 0 ? -0.26 : 0.26;
      cut.rotation.y = side > 0 ? 0 : Math.PI;
      half.add(cut);

      half.position.x = side * 0.34;
      half.rotation.z = side * -0.28;
      this.watermelonBroken.add(half);
    }

    this.watermelonBroken.visible = false;

    const particleMaterial = new THREE.MeshStandardMaterial({ color: 0xe64d45, roughness: 0.9 });
    for (let index = 0; index < 14; index += 1) {
      const particle = new THREE.Mesh(new THREE.SphereGeometry(0.045 + (index % 3) * 0.012, 7, 5), particleMaterial);
      particle.visible = false;
      particle.userData.index = index;
      this.particles.add(particle);
    }
  }

  private buildObstacles(obstacles: readonly ObstacleState[]): void {
    for (const obstacle of obstacles) {
      const group = new THREE.Group();
      group.position.set(obstacle.x, 0, obstacle.z);

      if (obstacle.kind === "rock") {
        const rock = new THREE.Mesh(
          new THREE.DodecahedronGeometry(0.72, 0),
          new THREE.MeshStandardMaterial({ color: 0x7f8584, roughness: 1 }),
        );
        rock.position.y = 0.52;
        rock.scale.set(1.15, 0.8, 0.95);
        rock.rotation.set(0.2, 0.5, -0.12);
        rock.castShadow = true;
        group.add(rock);
      }

      if (obstacle.kind === "bucket") {
        const bucket = new THREE.Mesh(
          new THREE.CylinderGeometry(0.42, 0.32, 0.65, 16, 1, true),
          new THREE.MeshStandardMaterial({ color: 0xf2b535, roughness: 0.65, side: THREE.DoubleSide }),
        );
        bucket.position.y = 0.34;
        bucket.castShadow = true;
        group.add(bucket);
      }

      if (obstacle.kind === "palm") {
        const trunk = new THREE.Mesh(
          new THREE.CylinderGeometry(0.24, 0.34, 4.2, 10),
          new THREE.MeshStandardMaterial({ color: 0x9b6838, roughness: 0.95 }),
        );
        trunk.position.y = 2.1;
        trunk.rotation.z = -0.08;
        trunk.castShadow = true;
        group.add(trunk);

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
      }

      this.scene.add(group);
    }
  }

  private updateSwing(nowMs: number): void {
    if (this.swingStartedAt < 0) {
      this.stickPivot.rotation.x = -0.15;
      return;
    }

    const elapsed = nowMs - this.swingStartedAt;
    const duration = 420;
    const t = Math.min(1, elapsed / duration);
    const strike = Math.sin(t * Math.PI);
    this.stickPivot.rotation.x = -0.15 + strike * 1.35;

    if (t >= 1) {
      this.swingStartedAt = -1;
    }
  }

  private updateWatermelonBreak(nowMs: number, broken: boolean): void {
    this.watermelonWhole.visible = !broken;
    this.watermelonBroken.visible = broken;

    if (!broken || this.breakStartedAt < 0) {
      this.particles.visible = false;
      return;
    }

    this.particles.visible = true;
    const elapsedSec = Math.max(0, nowMs - this.breakStartedAt) / 1000;

    this.particles.children.forEach((object, childIndex) => {
      const particle = object as THREE.Mesh;
      const angle = (childIndex / this.particles.children.length) * Math.PI * 2;
      const speed = 1.2 + (childIndex % 4) * 0.35;
      const rise = 2.8 + (childIndex % 3) * 0.45;
      const t = Math.min(elapsedSec, 1.2);
      particle.visible = elapsedSec < 1.25;
      particle.position.set(
        Math.cos(angle) * speed * t,
        rise * t - 4.3 * t * t,
        Math.sin(angle) * speed * t,
      );
    });
  }

  private resetParticles(): void {
    this.particles.children.forEach((object) => {
      object.position.set(0, 0, 0);
      object.visible = false;
    });
  }
}
