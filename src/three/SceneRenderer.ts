import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { GameState, StrategyType, Weather } from '../types/GameTypes';
import type { GraphicsQuality } from '../types/UITypes';
import { CrowdSimulator } from './CrowdSimulator';
import {
  brand_color,
  camera_distance,
  damp_factor,
  frame_camera,
  lighting_for,
  mix_color,
  pillar_height,
  shop_slots,
  to_css_color,
  type FrameRect,
  type ShopSlot,
} from './SceneLayout';

/**
 * WebGL glue for the plaza diorama. All game logic stays outside; this class
 * only mirrors state. Covered by Playwright rather than unit tests because it
 * needs a real GPU context.
 */

export interface SceneShopInfo {
  id: string;
  name: string;
  type: 'player' | 'ai';
  strategyType?: StrategyType;
}

export interface SceneOptions {
  quality: GraphicsQuality;
  reducedMotion: boolean;
  onSelect: (id: string | null) => void;
}

interface CanvasLabel {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  texture: THREE.CanvasTexture;
  text: string;
}

interface ShopView {
  info: SceneShopInfo;
  slot: ShopSlot;
  color: number;
  group: THREE.Group;
  sign: CanvasLabel;
  badge: CanvasLabel;
  badgeSprite: THREE.Sprite;
  pillar: THREE.Mesh;
  pillarCap: THREE.Mesh;
  pillarHeight: number;
  targetHeight: number;
  windows: THREE.MeshStandardMaterial;
  chimney: THREE.Mesh;
  hitbox: THREE.Mesh;
  hover: number;
}

interface Particle {
  life: number;
  vx: number;
  vy: number;
  vz: number;
}

const FONT = "'M PLUS Rounded 1c', 'Hiragino Maru Gothic ProN', system-ui, sans-serif";
const MAX_WALKERS = 140;
const CONFETTI = 500;
const PETALS = 220;
const RAIN = 700;

/** Checks for a usable WebGL context without keeping it. */
function webgl_available(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return !!(canvas.getContext('webgl2') ?? canvas.getContext('webgl'));
  } catch {
    return false;
  }
}

function create_label(width: number, height: number): CanvasLabel {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return { canvas, ctx, texture, text: '' };
}

function rounded_rect(ctx: CanvasRenderingContext2D, w: number, h: number, r: number): void {
  ctx.beginPath();
  ctx.moveTo(r, 0);
  ctx.arcTo(w, 0, w, h, r);
  ctx.arcTo(w, h, 0, h, r);
  ctx.arcTo(0, h, 0, 0, r);
  ctx.arcTo(0, 0, w, 0, r);
  ctx.closePath();
}

function draw_text_label(
  label: CanvasLabel,
  text: string,
  background: string,
  foreground: string,
  maxFont: number
): void {
  if (label.text === text) return;
  label.text = text;
  const { ctx, canvas } = label;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  rounded_rect(ctx, canvas.width, canvas.height, canvas.height * 0.3);
  ctx.fillStyle = background;
  ctx.fill();
  let size = maxFont;
  ctx.font = `800 ${size}px ${FONT}`;
  while (ctx.measureText(text).width > canvas.width * 0.88 && size > 12) {
    size -= 2;
    ctx.font = `800 ${size}px ${FONT}`;
  }
  ctx.fillStyle = foreground;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, canvas.width / 2, canvas.height / 2 + size * 0.05);
  label.texture.needsUpdate = true;
}

function soft_dot_texture(): THREE.Texture {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 64;
  const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
  const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  gradient.addColorStop(0, 'rgba(255,255,255,1)');
  gradient.addColorStop(0.5, 'rgba(255,255,255,0.8)');
  gradient.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 64, 64);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function striped_texture(color: number): THREE.Texture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 16;
  const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
  for (let i = 0; i < 8; i++) {
    ctx.fillStyle = i % 2 === 0 ? to_css_color(color) : '#fffaf2';
    ctx.fillRect(i * 16, 0, 16, 16);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/** Deterministic pseudo-random sequence for static scenery. */
function seeded(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export class SceneRenderer {
  private readonly renderer: THREE.WebGLRenderer;
  private readonly scene = new THREE.Scene();
  private readonly camera: THREE.PerspectiveCamera;
  private readonly controls: OrbitControls;
  private readonly hemi: THREE.HemisphereLight;
  private readonly sun: THREE.DirectionalLight;
  private readonly raycaster = new THREE.Raycaster();
  private readonly pointer = new THREE.Vector2();
  private readonly resizeObserver: ResizeObserver;
  private readonly dot = soft_dot_texture();
  private readonly shopsRoot = new THREE.Group();
  private readonly lampBulbs: THREE.MeshStandardMaterial;
  private readonly crown: THREE.Group;
  private readonly marker: THREE.Mesh;
  private readonly markerRing: THREE.Mesh;
  private readonly selectRing: THREE.Mesh;
  private readonly bodies: THREE.InstancedMesh;
  private readonly heads: THREE.InstancedMesh;
  private readonly confetti: THREE.Points;
  private readonly confettiState: Particle[] = [];
  private readonly petals: THREE.Points;
  private readonly rain: THREE.LineSegments;
  private readonly clouds: THREE.Group[] = [];
  private readonly dummy = new THREE.Object3D();
  private readonly tmpColor = new THREE.Color();
  private shops: ShopView[] = [];
  private crowd: CrowdSimulator = new CrowdSimulator([]);
  private mode: 'title' | 'game' = 'title';
  private paused = false;
  private progress = 0.7;
  private weather: Weather = 'sunny';
  private leaderId: string | null = null;
  private selectedId: string | null = null;
  private skyColor = 0xbfe6ff;
  private rainAmount = 0;
  private cloudAmount = 0;
  private lastTime = 0;
  private titleTrafficTimer = 0;
  private pointerDown: { x: number; y: number } | null = null;
  private freeArea: FrameRect | null = null;
  private disposed = false;

  private constructor(
    private readonly container: HTMLElement,
    private options: SceneOptions
  ) {
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.renderer.domElement.className = 'scene-canvas';
    this.renderer.domElement.setAttribute('aria-hidden', 'true');
    container.appendChild(this.renderer.domElement);

    this.camera = new THREE.PerspectiveCamera(38, 1, 0.5, 300);
    this.camera.position.set(0, 24, 40);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.enablePan = false;
    this.controls.minDistance = 18;
    this.controls.maxDistance = 75;
    this.controls.minPolarAngle = 0.35;
    this.controls.maxPolarAngle = 1.22;
    this.controls.target.set(0, 1.5, 0);
    this.controls.autoRotateSpeed = 0.55;

    this.scene.fog = new THREE.Fog(this.skyColor, 60, 140);
    this.scene.background = new THREE.Color(this.skyColor);

    this.hemi = new THREE.HemisphereLight(0xffffff, 0x88aa77, 1.1);
    this.scene.add(this.hemi);
    this.sun = new THREE.DirectionalLight(0xffffff, 2.4);
    this.sun.shadow.camera.left = -32;
    this.sun.shadow.camera.right = 32;
    this.sun.shadow.camera.top = 32;
    this.sun.shadow.camera.bottom = -32;
    this.sun.shadow.camera.far = 140;
    this.sun.shadow.bias = -0.0008;
    this.scene.add(this.sun, this.sun.target);

    this.build_ground();
    this.build_tree();
    this.lampBulbs = this.build_lamps();
    this.build_scenery();
    this.scene.add(this.shopsRoot);
    this.crown = this.build_crown();
    [this.marker, this.markerRing] = this.build_player_marker();
    this.selectRing = this.build_select_ring();
    [this.bodies, this.heads] = this.build_walkers();
    this.confetti = this.build_confetti();
    this.petals = this.build_petals();
    this.rain = this.build_rain();
    this.build_clouds();

    this.apply_quality(options.quality);
    this.bind_pointer();
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(container);
    this.resize();
    this.set_mode('title');
    this.renderer.setAnimationLoop(time => this.frame(time));
  }

  /**
   * Creates the renderer, or returns null when WebGL is unavailable.
   * @param container - Element the canvas is appended to.
   * @param options - Quality, motion and selection callback.
   */
  static create(container: HTMLElement, options: SceneOptions): SceneRenderer | null {
    if (!webgl_available()) return null;
    try {
      return new SceneRenderer(container, options);
    } catch (error) {
      console.error('3D scene failed to start', error);
      return null;
    }
  }

  /** Builds (or rebuilds) the six shops. */
  set_restaurants(list: SceneShopInfo[]): void {
    this.shops.forEach(shop => this.shopsRoot.remove(shop.group));
    const slots = shop_slots(list.length);
    this.shops = list.map((info, i) => this.build_shop(info, slots[i]));
    this.crowd = new CrowdSimulator(slots, MAX_WALKERS);
  }

  /** Updates sign texts (e.g. after a language switch). */
  set_names(names: Record<string, string>): void {
    this.shops.forEach(shop => {
      const name = names[shop.info.id];
      if (name) {
        shop.info.name = name;
        draw_text_label(shop.sign, name, to_css_color(shop.color), '#ffffff', 64);
      }
    });
  }

  /**
   * Mirrors the game state: share pillars, ranking badges, leader crown, weather.
   * @param state - Game state.
   * @param progress - Day progress 0..1 (drives the sun).
   */
  sync(state: GameState, progress: number): void {
    this.progress = progress;
    this.weather = state.weatherCondition;
    const ranked = [...state.restaurants].sort((a, b) => b.marketShare - a.marketShare);
    this.leaderId = state.elapsedSeconds > 0 ? ranked[0].id : null;
    state.restaurants.forEach(restaurant => {
      const shop = this.shops.find(s => s.info.id === restaurant.id);
      if (!shop) return;
      shop.targetHeight = pillar_height(restaurant.marketShare);
      const rank = ranked.indexOf(restaurant) + 1;
      draw_text_label(
        shop.badge,
        `#${rank}  ${restaurant.marketShare.toFixed(1)}%`,
        'rgba(255,255,255,0.92)',
        to_css_color(mix_color(shop.color, 0x222222, 0.35)),
        54
      );
      const level = restaurant.equipment.find(e => e.type === 'kitchen')?.level ?? 1;
      shop.chimney.scale.y = 0.6 + level * 0.35;
      shop.chimney.visible = level > 1;
    });
  }

  /**
   * Feeds one simulated second of guest traffic to the crowd.
   * @param traffic - Served/lost guests per shop, in restaurant order.
   */
  add_traffic(traffic: Array<{ served: number; lost: number }>): void {
    if (!this.paused) this.crowd.add_traffic(traffic);
  }

  /**
   * Confetti burst above a shop (campaigns, upgrades...).
   * @param id - Restaurant id.
   */
  burst(id: string): void {
    const shop = this.shops.find(s => s.info.id === id);
    if (!shop || this.options.reducedMotion) return;
    const positions = this.confetti.geometry.getAttribute('position') as THREE.BufferAttribute;
    const colors = this.confetti.geometry.getAttribute('color') as THREE.BufferAttribute;
    let spawned = 0;
    for (let i = 0; i < CONFETTI && spawned < 50; i++) {
      const p = this.confettiState[i];
      if (p.life > 0) continue;
      spawned += 1;
      p.life = 1.6 + Math.random() * 0.8;
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 4;
      p.vx = Math.cos(angle) * speed;
      p.vz = Math.sin(angle) * speed;
      p.vy = 6 + Math.random() * 5;
      positions.setXYZ(i, shop.slot.x, 6, shop.slot.z);
      this.tmpColor.setHex(
        Math.random() < 0.5 ? shop.color : [0xffffff, 0xffd166, 0xff8fab][i % 3]
      );
      colors.setXYZ(i, this.tmpColor.r, this.tmpColor.g, this.tmpColor.b);
    }
    positions.needsUpdate = true;
    colors.needsUpdate = true;
  }

  /** Title mode orbits slowly; game mode holds the camera for play. */
  set_mode(mode: 'title' | 'game'): void {
    this.mode = mode;
    this.controls.autoRotate = mode === 'title' && !this.options.reducedMotion;
    this.resize();
    if (mode === 'game') this.crowd.clear();
    this.reset_camera();
  }

  /**
   * Declares the unobstructed part of the canvas so the plaza is framed there.
   * @param rect - Free rectangle in canvas CSS pixels, or null for the full canvas.
   */
  set_free_area(rect: FrameRect | null): void {
    this.freeArea = rect;
    this.resize();
    this.reset_camera();
  }

  private reset_camera(): void {
    const { distance } = frame_camera(
      { width: this.container.clientWidth, height: this.container.clientHeight },
      this.freeArea,
      this.camera.fov
    );
    const elevation = 0.62;
    this.camera.position.set(0, Math.sin(elevation) * distance, Math.cos(elevation) * distance);
    this.controls.target.set(0, 1, 0);
  }

  /** Freezes the crowd while the game is paused. */
  set_paused(paused: boolean): void {
    this.paused = paused;
  }

  /** Highlights a shop (or clears with null). */
  select(id: string | null): void {
    this.selectedId = id;
  }

  /** Switches shadow/pixel-ratio quality. */
  set_quality(quality: GraphicsQuality): void {
    this.options = { ...this.options, quality };
    this.apply_quality(quality);
  }

  /** Stops rendering and frees GPU resources. */
  dispose(): void {
    this.disposed = true;
    this.renderer.setAnimationLoop(null);
    this.resizeObserver.disconnect();
    this.controls.dispose();
    this.scene.traverse(object => {
      if (
        object instanceof THREE.Mesh ||
        object instanceof THREE.Points ||
        object instanceof THREE.LineSegments
      ) {
        object.geometry.dispose();
      }
    });
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }

  // ---------------------------------------------------------------- building

  private material(
    color: number,
    extra: THREE.MeshStandardMaterialParameters = {}
  ): THREE.MeshStandardMaterial {
    return new THREE.MeshStandardMaterial({
      color,
      roughness: 0.8,
      metalness: 0,
      flatShading: true,
      ...extra,
    });
  }

  private mesh(
    geometry: THREE.BufferGeometry,
    material: THREE.Material,
    shadows: { cast?: boolean; receive?: boolean } = { cast: true }
  ): THREE.Mesh {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = !!shadows.cast;
    mesh.receiveShadow = !!shadows.receive;
    return mesh;
  }

  private build_ground(): void {
    const grass = this.mesh(new THREE.CircleGeometry(90, 64), this.material(0x9fd89a), {
      receive: true,
    });
    grass.rotation.x = -Math.PI / 2;
    this.scene.add(grass);

    const plaza = this.mesh(new THREE.CircleGeometry(19.5, 64), this.material(0xf6ead8), {
      receive: true,
    });
    plaza.rotation.x = -Math.PI / 2;
    plaza.position.y = 0.02;
    this.scene.add(plaza);

    const rim = this.mesh(new THREE.RingGeometry(19.5, 20.4, 64), this.material(0xe2cfb3), {
      receive: true,
    });
    rim.rotation.x = -Math.PI / 2;
    rim.position.y = 0.03;
    this.scene.add(rim);

    [5.2, 9].forEach((radius, i) => {
      const ring = this.mesh(
        new THREE.RingGeometry(radius - 0.35, radius, 64),
        this.material(i === 0 ? 0xf2c6d3 : 0xeadbc6),
        { receive: true }
      );
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = 0.04;
      this.scene.add(ring);
    });
  }

  private build_tree(): void {
    const tree = new THREE.Group();
    const trunk = this.mesh(new THREE.CylinderGeometry(0.45, 0.7, 4, 7), this.material(0x8a5a44));
    trunk.position.y = 2;
    tree.add(trunk);
    const blossoms = [0xffb7c5, 0xff9eb7, 0xffc9d6, 0xffd6e0];
    const rand = seeded(7);
    for (let i = 0; i < 9; i++) {
      const size = 1.3 + rand() * 1.1;
      const puff = this.mesh(
        new THREE.IcosahedronGeometry(size, 1),
        this.material(blossoms[i % blossoms.length])
      );
      const angle = (i / 9) * Math.PI * 2;
      const r = i === 0 ? 0 : 1.4 + rand() * 0.8;
      puff.position.set(
        Math.cos(angle) * r,
        4.6 + rand() * 1.4 + (i === 0 ? 1 : 0),
        Math.sin(angle) * r
      );
      tree.add(puff);
    }
    const bench = this.mesh(new THREE.TorusGeometry(3, 0.28, 6, 32), this.material(0xb07a55));
    bench.rotation.x = Math.PI / 2;
    bench.position.y = 0.35;
    tree.add(bench);
    this.scene.add(tree);
  }

  private build_lamps(): THREE.MeshStandardMaterial {
    const bulbMaterial = this.material(0xfff3c4, { emissive: 0xffd27a, emissiveIntensity: 0 });
    const poleMaterial = this.material(0x4b4f6b);
    shop_slots(6, 10).forEach(slot => {
      const angle = slot.angle + Math.PI / 6;
      const pole = this.mesh(new THREE.CylinderGeometry(0.08, 0.1, 3, 6), poleMaterial);
      pole.position.set(Math.cos(angle) * 10, 1.5, Math.sin(angle) * 10);
      const bulb = this.mesh(new THREE.SphereGeometry(0.28, 12, 8), bulbMaterial, {});
      bulb.position.set(pole.position.x, 3.15, pole.position.z);
      this.scene.add(pole, bulb);
    });
    return bulbMaterial;
  }

  private build_scenery(): void {
    const rand = seeded(42);
    const leaf = [0x6cc070, 0x5ab36a, 0x83cf7c];
    for (let i = 0; i < 34; i++) {
      const angle = rand() * Math.PI * 2;
      const radius = 25 + rand() * 30;
      const tree = new THREE.Group();
      const trunk = this.mesh(
        new THREE.CylinderGeometry(0.2, 0.3, 1.2, 5),
        this.material(0x8a5a44)
      );
      trunk.position.y = 0.6;
      const crown = this.mesh(
        new THREE.ConeGeometry(1 + rand() * 0.8, 2.4 + rand() * 1.6, 6),
        this.material(leaf[i % leaf.length])
      );
      crown.position.y = 2.2;
      tree.add(trunk, crown);
      tree.position.set(Math.cos(angle) * radius, 0, Math.sin(angle) * radius);
      tree.scale.setScalar(0.8 + rand() * 0.7);
      this.scene.add(tree);
    }
  }

  private build_shop(info: SceneShopInfo, slot: ShopSlot): ShopView {
    const color = brand_color(info.type, info.strategyType);
    const group = new THREE.Group();
    group.position.set(slot.x, 0, slot.z);
    group.rotation.y = slot.rotation;

    const base = this.mesh(new THREE.BoxGeometry(5.4, 0.3, 4.4), this.material(0xd9c7b0), {
      cast: true,
      receive: true,
    });
    base.position.y = 0.15;
    const walls = this.mesh(new THREE.BoxGeometry(4.6, 2.8, 3.6), this.material(0xfff5e8), {
      cast: true,
      receive: true,
    });
    walls.position.y = 1.7;
    const roof = this.mesh(new THREE.ConeGeometry(3.9, 1.9, 4), this.material(color));
    roof.position.y = 4.05;
    roof.rotation.y = Math.PI / 4;
    roof.scale.set(1, 1, 0.85);
    const trim = this.mesh(
      new THREE.BoxGeometry(4.8, 0.22, 3.8),
      this.material(mix_color(color, 0xffffff, 0.35))
    );
    trim.position.y = 3.15;

    const awning = this.mesh(
      new THREE.BoxGeometry(4.8, 0.12, 1.3),
      new THREE.MeshStandardMaterial({ map: striped_texture(color), roughness: 0.7 })
    );
    awning.position.set(0, 2.55, 2.35);
    awning.rotation.x = 0.35;

    const door = this.mesh(new THREE.BoxGeometry(1, 1.7, 0.1), this.material(0x7a4b35), {});
    door.position.set(0, 1.15, 1.83);
    const windows = this.material(0xfff0c2, { emissive: 0xffc36b, emissiveIntensity: 0.05 });
    [-1.45, 1.45].forEach(x => {
      const win = this.mesh(new THREE.BoxGeometry(1.1, 0.9, 0.1), windows, {});
      win.position.set(x, 1.7, 1.83);
      group.add(win);
    });

    const sign = create_label(512, 112);
    draw_text_label(sign, info.name, to_css_color(color), '#ffffff', 64);
    const signMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(4.2, 0.92),
      new THREE.MeshBasicMaterial({ map: sign.texture, transparent: true, toneMapped: false })
    );
    signMesh.position.set(0, 3.55, 1.92);

    const chimney = this.mesh(new THREE.BoxGeometry(0.55, 1.4, 0.55), this.material(0xb8a99a));
    chimney.position.set(1.3, 4.3, -0.6);
    chimney.visible = false;

    const pillarMaterial = this.material(color, {
      emissive: color,
      emissiveIntensity: 0.25,
      roughness: 0.4,
    });
    const pillar = this.mesh(new THREE.CylinderGeometry(0.42, 0.42, 1, 12), pillarMaterial);
    pillar.position.set(3.4, 0.5, 1.2);
    const pillarCap = this.mesh(
      new THREE.SphereGeometry(0.55, 14, 10),
      this.material(0xffffff, { emissive: color, emissiveIntensity: 0.6 })
    );
    pillarCap.position.set(3.4, 1, 1.2);

    const badge = create_label(320, 96);
    const badgeSprite = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: badge.texture,
        transparent: true,
        depthTest: false,
        toneMapped: false,
      })
    );
    badgeSprite.scale.set(3, 0.9, 1);
    badgeSprite.renderOrder = 10;

    const hitbox = new THREE.Mesh(
      new THREE.BoxGeometry(6, 6, 5),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    hitbox.position.y = 3;
    hitbox.userData.shopId = info.id;

    group.add(
      base,
      walls,
      roof,
      trim,
      awning,
      door,
      signMesh,
      chimney,
      pillar,
      pillarCap,
      badgeSprite,
      hitbox
    );
    this.shopsRoot.add(group);

    return {
      info,
      slot,
      color,
      group,
      sign,
      badge,
      badgeSprite,
      pillar,
      pillarCap,
      pillarHeight: 0.3,
      targetHeight: pillar_height(100 / 6),
      windows,
      chimney,
      hitbox,
      hover: 0,
    };
  }

  private build_crown(): THREE.Group {
    const gold = this.material(0xffcf3f, {
      metalness: 0.6,
      roughness: 0.3,
      emissive: 0xffa600,
      emissiveIntensity: 0.35,
    });
    const crown = new THREE.Group();
    const band = this.mesh(new THREE.CylinderGeometry(0.9, 0.8, 0.5, 10, 1, true), gold);
    crown.add(band);
    for (let i = 0; i < 5; i++) {
      const spike = this.mesh(new THREE.ConeGeometry(0.22, 0.6, 5), gold);
      const angle = (i / 5) * Math.PI * 2;
      spike.position.set(Math.cos(angle) * 0.8, 0.5, Math.sin(angle) * 0.8);
      crown.add(spike);
    }
    crown.visible = false;
    this.scene.add(crown);
    return crown;
  }

  private build_player_marker(): [THREE.Mesh, THREE.Mesh] {
    const color = brand_color('player');
    const marker = this.mesh(
      new THREE.OctahedronGeometry(0.55, 0),
      this.material(color, { emissive: color, emissiveIntensity: 0.6 })
    );
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(1.4, 1.75, 40),
      new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.7,
        side: THREE.DoubleSide,
      })
    );
    ring.rotation.x = -Math.PI / 2;
    this.scene.add(marker, ring);
    return [marker, ring];
  }

  private build_select_ring(): THREE.Mesh {
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(3.4, 3.8, 48),
      new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.85,
        side: THREE.DoubleSide,
      })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.visible = false;
    this.scene.add(ring);
    return ring;
  }

  private build_walkers(): [THREE.InstancedMesh, THREE.InstancedMesh] {
    const bodies = new THREE.InstancedMesh(
      new THREE.CapsuleGeometry(0.24, 0.42, 3, 8),
      this.material(0xffffff, { flatShading: false, roughness: 0.6 }),
      MAX_WALKERS
    );
    const heads = new THREE.InstancedMesh(
      new THREE.SphereGeometry(0.2, 10, 8),
      this.material(0xffe0c7, { flatShading: false, roughness: 0.6 }),
      MAX_WALKERS
    );
    bodies.count = 0;
    heads.count = 0;
    bodies.frustumCulled = false;
    heads.frustumCulled = false;
    this.scene.add(bodies, heads);
    return [bodies, heads];
  }

  private build_confetti(): THREE.Points {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      'position',
      new THREE.BufferAttribute(new Float32Array(CONFETTI * 3).fill(-999), 3)
    );
    geometry.setAttribute('color', new THREE.BufferAttribute(new Float32Array(CONFETTI * 3), 3));
    for (let i = 0; i < CONFETTI; i++) this.confettiState.push({ life: 0, vx: 0, vy: 0, vz: 0 });
    const points = new THREE.Points(
      geometry,
      new THREE.PointsMaterial({
        size: 0.45,
        vertexColors: true,
        map: this.dot,
        transparent: true,
        depthWrite: false,
      })
    );
    points.frustumCulled = false;
    this.scene.add(points);
    return points;
  }

  private build_petals(): THREE.Points {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(PETALS * 3);
    for (let i = 0; i < PETALS; i++) this.reset_petal(positions, i, true);
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const points = new THREE.Points(
      geometry,
      new THREE.PointsMaterial({
        size: 0.32,
        color: 0xffb3c6,
        map: this.dot,
        transparent: true,
        depthWrite: false,
      })
    );
    points.frustumCulled = false;
    this.scene.add(points);
    return points;
  }

  private reset_petal(positions: Float32Array, i: number, anywhere: boolean): void {
    const angle = Math.random() * Math.PI * 2;
    const r = Math.random() * 3.2;
    positions[i * 3] = Math.cos(angle) * r;
    positions[i * 3 + 1] = anywhere ? Math.random() * 7 : 5 + Math.random() * 2;
    positions[i * 3 + 2] = Math.sin(angle) * r;
  }

  private build_rain(): THREE.LineSegments {
    const positions = new Float32Array(RAIN * 6);
    for (let i = 0; i < RAIN; i++) {
      const x = (Math.random() - 0.5) * 70;
      const y = Math.random() * 30;
      const z = (Math.random() - 0.5) * 70;
      positions.set([x, y, z, x + 0.1, y + 0.9, z], i * 6);
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const rain = new THREE.LineSegments(
      geometry,
      new THREE.LineBasicMaterial({ color: 0xcfe3ff, transparent: true, opacity: 0 })
    );
    rain.frustumCulled = false;
    rain.visible = false;
    this.scene.add(rain);
    return rain;
  }

  private build_clouds(): void {
    const material = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 1,
      flatShading: true,
      transparent: true,
      opacity: 0.75,
    });
    const rand = seeded(99);
    for (let i = 0; i < 6; i++) {
      const cloud = new THREE.Group();
      for (let j = 0; j < 4; j++) {
        const puff = new THREE.Mesh(new THREE.IcosahedronGeometry(1.6 + rand() * 1.4, 0), material);
        puff.position.set(j * 1.8 - 2.7, rand() * 0.8, rand() * 1.2);
        cloud.add(puff);
      }
      cloud.userData.angle = (i / 6) * Math.PI * 2;
      cloud.userData.radius = 22 + rand() * 18;
      cloud.position.y = 17 + rand() * 6;
      this.clouds.push(cloud);
      this.scene.add(cloud);
    }
  }

  // ---------------------------------------------------------------- runtime

  private apply_quality(quality: GraphicsQuality): void {
    const high = quality === 'high';
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, high ? 2 : 1));
    this.renderer.shadowMap.enabled = high;
    this.sun.castShadow = high;
    this.sun.shadow.mapSize.set(high ? 2048 : 512, high ? 2048 : 512);
    this.bodies.castShadow = high;
    this.petals.visible = high || !this.options.reducedMotion;
    this.scene.traverse(object => {
      if (object instanceof THREE.Mesh && object.material instanceof THREE.Material) {
        object.material.needsUpdate = true;
      }
    });
    this.resize();
  }

  private resize(): void {
    const width = Math.max(1, this.container.clientWidth);
    const height = Math.max(1, this.container.clientHeight);
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    const framing = frame_camera({ width, height }, this.freeArea, this.camera.fov);
    if (framing.offsetX !== 0 || framing.offsetY !== 0) {
      this.camera.setViewOffset(width, height, framing.offsetX, framing.offsetY, width, height);
    } else {
      this.camera.clearViewOffset();
    }
    this.camera.updateProjectionMatrix();
    this.controls.maxDistance = Math.max(
      75,
      camera_distance(this.camera.aspect, this.camera.fov) + 10
    );
  }

  private bind_pointer(): void {
    const canvas = this.renderer.domElement;
    canvas.addEventListener('pointerdown', event => {
      this.pointerDown = { x: event.clientX, y: event.clientY };
    });
    canvas.addEventListener('pointermove', event => {
      const hit = this.pick(event);
      canvas.style.cursor = hit ? 'pointer' : 'grab';
      this.shops.forEach(shop => {
        shop.hover = shop.info.id === hit ? 1 : 0;
      });
    });
    canvas.addEventListener('pointerleave', () => {
      this.shops.forEach(shop => {
        shop.hover = 0;
      });
    });
    canvas.addEventListener('pointerup', event => {
      const start = this.pointerDown;
      this.pointerDown = null;
      if (!start || Math.hypot(event.clientX - start.x, event.clientY - start.y) > 6) return;
      if (this.mode !== 'game') return;
      this.options.onSelect(this.pick(event));
    });
  }

  private pick(event: PointerEvent): string | null {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.pointer.set(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1
    );
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const hits = this.raycaster.intersectObjects(
      this.shops.map(s => s.hitbox),
      false
    );
    return hits.length > 0 ? (hits[0].object.userData.shopId as string) : null;
  }

  private frame(time: number): void {
    if (this.disposed) return;
    const dt = Math.min(0.1, Math.max(0, (time - this.lastTime) / 1000));
    this.lastTime = time;
    const t = time / 1000;
    const motion = this.options.reducedMotion ? 0.25 : 1;

    if (this.mode === 'title') {
      this.progress = 0.72;
      this.titleTrafficTimer -= dt;
      if (this.titleTrafficTimer <= 0) {
        this.titleTrafficTimer = 1;
        this.crowd.add_traffic(this.shops.map(() => ({ served: 2 + Math.random() * 4, lost: 0 })));
      }
    }

    this.update_lighting(dt);
    this.update_shops(dt, t);
    if (!this.paused) this.crowd.update(dt);
    this.update_walkers();
    this.update_particles(dt, t, motion);
    this.controls.update(dt);
    this.renderer.render(this.scene, this.camera);
  }

  private update_lighting(dt: number): void {
    const target = lighting_for(this.progress, this.weather);
    const k = damp_factor(2.5, dt);
    this.skyColor = mix_color(this.skyColor, target.sky, k);
    (this.scene.background as THREE.Color).setHex(this.skyColor);
    (this.scene.fog as THREE.Fog).color.setHex(this.skyColor);
    this.hemi.color.setHex(this.skyColor);
    this.hemi.groundColor.setHex(target.ground);
    this.hemi.intensity = target.ambientIntensity;
    this.sun.color.setHex(target.sun);
    this.sun.intensity = target.sunIntensity;
    const azimuth = -0.6 + this.progress * 1.8;
    this.sun.position.set(
      Math.sin(azimuth) * 40 * Math.cos(target.sunElevation),
      Math.sin(target.sunElevation) * 40,
      Math.cos(azimuth) * 40 * Math.cos(target.sunElevation)
    );
    this.lampBulbs.emissiveIntensity = target.night * 2.2;
    this.shops.forEach(shop => {
      shop.windows.emissiveIntensity = 0.05 + target.night * 1.4;
    });

    const wantsRain = this.weather === 'rainy' ? 1 : 0;
    const wantsCloud = this.weather === 'sunny' ? 0.15 : this.weather === 'cloudy' ? 0.8 : 1;
    this.rainAmount += (wantsRain - this.rainAmount) * damp_factor(1.5, dt);
    this.cloudAmount += (wantsCloud - this.cloudAmount) * damp_factor(1, dt);
  }

  private update_shops(dt: number, t: number): void {
    const k = damp_factor(3, dt);
    this.shops.forEach(shop => {
      shop.pillarHeight += (shop.targetHeight - shop.pillarHeight) * k;
      shop.pillar.scale.y = shop.pillarHeight;
      shop.pillar.position.y = shop.pillarHeight / 2;
      shop.pillarCap.position.y = shop.pillarHeight + 0.2;
      shop.badgeSprite.position.set(3.4, shop.pillarHeight + 1.25, 1.2);
      const pop = 1 + shop.hover * 0.04;
      shop.group.scale.setScalar(shop.group.scale.x + (pop - shop.group.scale.x) * k);
    });

    const leader = this.shops.find(s => s.info.id === this.leaderId);
    this.crown.visible = !!leader;
    if (leader) {
      this.crown.position.set(leader.slot.x, 6.4 + Math.sin(t * 2) * 0.25, leader.slot.z);
      this.crown.rotation.y = t * 0.8;
    }

    const player = this.shops.find(s => s.info.type === 'player');
    this.marker.visible = !!player && this.mode === 'game';
    this.markerRing.visible = this.marker.visible;
    if (player) {
      const crownOffset = leader === player ? 1.6 : 0;
      this.marker.position.set(
        player.slot.x,
        6.2 + crownOffset + Math.sin(t * 3) * 0.3,
        player.slot.z
      );
      this.marker.rotation.y = t * 1.5;
      this.markerRing.position.set(player.slot.doorX, 0.06, player.slot.doorZ);
      const pulse = 1 + Math.sin(t * 3) * 0.08;
      this.markerRing.scale.set(pulse, pulse, pulse);
    }

    const selected = this.shops.find(s => s.info.id === this.selectedId);
    this.selectRing.visible = !!selected;
    if (selected) {
      this.selectRing.position.set(selected.slot.x, 0.07, selected.slot.z);
      (this.selectRing.material as THREE.MeshBasicMaterial).color.setHex(selected.color);
      this.selectRing.rotation.z = t * 0.6;
    }
  }

  private update_walkers(): void {
    let index = 0;
    for (const walker of this.crowd.get_walkers()) {
      if (walker.phase === 'inside') continue;
      const bob = Math.abs(Math.sin(walker.bob)) * 0.12;
      this.dummy.position.set(walker.x, 0.5 + bob, walker.z);
      this.dummy.rotation.set(0, walker.heading, 0);
      this.dummy.scale.setScalar(1);
      this.dummy.updateMatrix();
      this.bodies.setMatrixAt(index, this.dummy.matrix);
      this.tmpColor.setHex(walker.rejected && walker.phase === 'leave' ? 0x9aa0a6 : walker.tint);
      this.bodies.setColorAt(index, this.tmpColor);
      this.dummy.position.y = 1.08 + bob;
      this.dummy.updateMatrix();
      this.heads.setMatrixAt(index, this.dummy.matrix);
      index += 1;
    }
    this.bodies.count = index;
    this.heads.count = index;
    this.bodies.instanceMatrix.needsUpdate = true;
    this.heads.instanceMatrix.needsUpdate = true;
    if (this.bodies.instanceColor) this.bodies.instanceColor.needsUpdate = true;
  }

  private update_particles(dt: number, t: number, motion: number): void {
    // Confetti
    const positions = this.confetti.geometry.getAttribute('position') as THREE.BufferAttribute;
    let active = false;
    this.confettiState.forEach((p, i) => {
      if (p.life <= 0) return;
      active = true;
      p.life -= dt;
      p.vy -= 12 * dt;
      positions.setXYZ(
        i,
        positions.getX(i) + p.vx * dt,
        Math.max(0.1, positions.getY(i) + p.vy * dt),
        positions.getZ(i) + p.vz * dt
      );
      if (p.life <= 0) positions.setXYZ(i, 0, -999, 0);
    });
    if (active) positions.needsUpdate = true;

    // Sakura petals drifting from the tree
    const petalPositions = this.petals.geometry.getAttribute('position') as THREE.BufferAttribute;
    const array = petalPositions.array as Float32Array;
    const fall = (this.rainAmount > 0.5 ? 2.4 : 0.9) * motion;
    for (let i = 0; i < PETALS; i++) {
      const o = i * 3;
      array[o] += (Math.sin(t + i) * 0.6 + array[o] * 0.08) * dt * motion;
      array[o + 1] -= fall * dt * (0.6 + (i % 5) * 0.12);
      array[o + 2] += (Math.cos(t * 0.8 + i) * 0.6 + array[o + 2] * 0.08) * dt * motion;
      if (array[o + 1] < 0.05) this.reset_petal(array, i, false);
    }
    petalPositions.needsUpdate = true;

    // Rain
    this.rain.visible = this.rainAmount > 0.02;
    (this.rain.material as THREE.LineBasicMaterial).opacity = this.rainAmount * 0.55;
    if (this.rain.visible) {
      const rainPositions = this.rain.geometry.getAttribute('position') as THREE.BufferAttribute;
      const r = rainPositions.array as Float32Array;
      for (let i = 0; i < RAIN; i++) {
        const o = i * 6;
        let y = r[o + 1] - 28 * dt;
        if (y < 0) y += 30;
        r[o + 1] = y;
        r[o + 4] = y + 0.9;
      }
      rainPositions.needsUpdate = true;
    }

    // Clouds
    this.clouds.forEach((cloud, i) => {
      const angle = (cloud.userData.angle as number) + t * 0.02 * motion;
      const radius = cloud.userData.radius as number;
      cloud.position.x = Math.cos(angle) * radius;
      cloud.position.z = Math.sin(angle) * radius - 10;
      cloud.visible = this.cloudAmount > 0.05;
      cloud.children.forEach(child => {
        const material = (child as THREE.Mesh).material as THREE.MeshStandardMaterial;
        material.opacity = 0.35 + this.cloudAmount * 0.55;
        material.color.setHex(mix_color(0xffffff, 0x8892a6, this.rainAmount * 0.8));
      });
      cloud.rotation.y = i;
    });
  }
}
