import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";
import { PointerLockControls } from "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/controls/PointerLockControls.js";

const bootstrap = window.storeBootstrap || { products: [], cashiers: [] };
let products = bootstrap.products || [];
const cashiers = bootstrap.cashiers || [];

const stageEl = document.getElementById("store-stage");
const canvas = document.getElementById("store-canvas");
const labelOverlay = document.getElementById("label-overlay");
const interactionHint = document.getElementById("interaction-hint");
const experienceOverlay = document.getElementById("experience-overlay");
const experienceMessage = document.getElementById("experience-message");
const experienceButton = document.getElementById("enter-store");

const cartList = document.getElementById("cart-items");
const totalHtEl = document.getElementById("total-ht");
const totalTvaEl = document.getElementById("total-tva");
const totalTtcEl = document.getElementById("total-ttc");
const checkoutButton = document.getElementById("checkout");
const statusBox = document.getElementById("status");
const customerInput = document.getElementById("customer");

const shelfModal = document.getElementById("shelf-modal");
const shelfTitleEl = document.getElementById("shelf-title");
const shelfDescriptionEl = document.getElementById("shelf-description");
const shelfProductsEl = document.getElementById("shelf-products");
const shelfSearchInput = document.getElementById("shelf-search");

const chatModal = document.getElementById("chat-modal");
const chatLog = document.getElementById("chat-log");
const chatForm = document.getElementById("chat-form");
const chatInput = document.getElementById("chat-input");

const checkoutModal = document.getElementById("checkout-modal");
const checkoutCaption = document.getElementById("checkout-caption");
const checkoutItemsEl = document.getElementById("checkout-items");
const modalTotalHtEl = document.getElementById("modal-total-ht");
const modalTotalTvaEl = document.getElementById("modal-total-tva");
const modalTotalTtcEl = document.getElementById("modal-total-ttc");
const modalCustomerInput = document.getElementById("modal-customer");
const confirmCheckoutButton = document.getElementById("confirm-checkout");
const checkoutStatus = document.getElementById("checkout-status");

const state = {
  cart: new Map(),
  selectedCashier: null,
  activeModal: null,
};

const PLAYER_HEIGHT = 1.6;
const PLAYER_RADIUS = 0.45;
const WALK_SPEED = 7.2;
const SPRINT_MULTIPLIER = 1.45;
const STORE_BOUNDS = { minX: -10, maxX: 10, minZ: -12, maxZ: 6.5 };
const INTERACTION_DISTANCE = 2.6;

const shelfDefinitions = [
  {
    id: "produce",
    title: "Fruits & légumes",
    description: "Des étals colorés et croquants, parfaits pour des salades vitaminées.",
    keywords: ["pomme", "banane", "tomate", "salade", "carotte", "fruits", "légumes", "poire", "kiwi", "ananas"],
    layout: {
      position: { x: -6.5, z: -6.5 },
      size: { x: 3.2, y: 2.2, z: 4.4 },
      color: 0xffb347,
      highlight: 0xffdf9c,
      neon: 0xffb347,
    },
  },
  {
    id: "bakery",
    title: "Boulangerie & douceurs",
    description: "Pain doré, pâtisseries et biscuits croustillants tout juste sortis du four.",
    keywords: ["pain", "baguette", "brioche", "gâteau", "biscuit", "viennoiserie", "croissant", "madeleine"],
    layout: {
      position: { x: 0, z: -6.8 },
      size: { x: 3, y: 2.2, z: 4.6 },
      color: 0xf9d97f,
      highlight: 0xffe8a9,
      neon: 0xffb36f,
    },
  },
  {
    id: "grocery",
    title: "Épicerie fine",
    description: "Conserves, pâtes, sauces et ingrédients pour sublimer vos plats maison.",
    keywords: ["pâte", "riz", "sauce", "huile", "épice", "conserve", "pois", "lentille", "haricot"],
    layout: {
      position: { x: 6.5, z: -6.3 },
      size: { x: 3.1, y: 2.2, z: 4.4 },
      color: 0xa0d995,
      highlight: 0xc4f2b7,
      neon: 0x7ed37a,
    },
  },
  {
    id: "snacks",
    title: "Snacking & plaisirs sucrés",
    description: "Chocolats, biscuits et gourmandises pour une pause bien méritée.",
    keywords: ["chocolat", "bonbon", "snack", "biscuits", "barre", "sucré", "dessert", "cookies"],
    layout: {
      position: { x: -6.2, z: -0.6 },
      size: { x: 3.1, y: 2.2, z: 4.2 },
      color: 0xff95c0,
      highlight: 0xffc6df,
      neon: 0xff70b4,
    },
  },
  {
    id: "dairy",
    title: "Frais & crèmerie",
    description: "Produits laitiers, fromages et œufs pour des recettes fondantes.",
    keywords: ["fromage", "yaourt", "beurre", "lait", "crème", "oeuf", "œuf"],
    layout: {
      position: { x: 0.1, z: -0.2 },
      size: { x: 3.2, y: 2.2, z: 4.2 },
      color: 0xcfe3ff,
      highlight: 0xe3f1ff,
      neon: 0x8bd0ff,
    },
  },
  {
    id: "drinks",
    title: "Boissons & rafraîchissements",
    description: "Sodas, jus pressés et boissons chaudes pour toutes les envies.",
    keywords: ["jus", "soda", "cola", "limonade", "thé", "café", "boisson", "eau"],
    layout: {
      position: { x: 6.4, z: 0.2 },
      size: { x: 3.1, y: 2.2, z: 4.4 },
      color: 0x9ee7ff,
      highlight: 0xc3f3ff,
      neon: 0x6ad1ff,
    },
  },
];

const CASHIER_SPOTS = [
  { position: { x: -4.5, z: 5.2 }, accent: 0xffb347 },
  { position: { x: 0, z: 5.2 }, accent: 0x74d4ff },
  { position: { x: 4.5, z: 5.2 }, accent: 0xff8bd2 },
];

const CHATBOT_SPOT = { position: { x: 0, z: -10 }, accent: 0xe1a7ff };

let scene;
let camera;
let renderer;
let controls;
let clock;

const collisionBoxes = [];
const interactiveTargets = [];
const floatingActors = [];

const moveState = { forward: false, backward: false, left: false, right: false };
let isSprinting = false;
const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();
let hoveredTarget = null;
let hasStarted = false;

setupExperience();

bindModalClose();
renderCart();
updateTotals();
updateCheckoutButton();

if (canvas) {
  document.addEventListener("keydown", onKeyDown);
  document.addEventListener("keyup", onKeyUp);
  window.addEventListener("resize", onWindowResize);
}

function setupExperience() {
  if (!canvas || !stageEl) return;
  initThree();
  buildEnvironment();
  onWindowResize();
  animate();
  updateExperienceOverlay();
}

function initThree() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xf6f4ff);
  scene.fog = new THREE.Fog(0xf6f4ff, 22, 42);

  camera = new THREE.PerspectiveCamera(60, 1, 0.1, 80);
  camera.position.set(0, PLAYER_HEIGHT, 6);

  renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  controls = new PointerLockControls(camera, canvas);
  controls.getObject().position.set(0, PLAYER_HEIGHT, 6);
  scene.add(controls.getObject());

  clock = new THREE.Clock();

  experienceButton?.addEventListener("click", () => {
    if (!controls?.isLocked) {
      controls?.lock();
    }
  });

  canvas.addEventListener("click", () => {
    if (!controls?.isLocked && !state.activeModal) {
      controls?.lock();
    }
  });

  controls.addEventListener("lock", () => {
    hasStarted = true;
    updateExperienceOverlay();
  });

  controls.addEventListener("unlock", () => {
    velocity.set(0, 0, 0);
    moveState.forward = moveState.backward = moveState.left = moveState.right = false;
    isSprinting = false;
    updateExperienceOverlay();
  });
}

function buildEnvironment() {
  createLighting();
  createRoom();
  shelfDefinitions.forEach((definition) => createShelf(definition));
  createCashiers();
  createChatbot();
  createDecor();
}

function createLighting() {
  const hemi = new THREE.HemisphereLight(0xfff2f2, 0xc7d9ff, 0.75);
  scene.add(hemi);

  const mainLight = new THREE.DirectionalLight(0xffffff, 0.65);
  mainLight.position.set(6, 10, 8);
  mainLight.castShadow = true;
  mainLight.shadow.camera.near = 0.5;
  mainLight.shadow.camera.far = 50;
  mainLight.shadow.camera.left = -18;
  mainLight.shadow.camera.right = 18;
  mainLight.shadow.camera.top = 14;
  mainLight.shadow.camera.bottom = -14;
  mainLight.shadow.mapSize.set(2048, 2048);
  scene.add(mainLight);

  const fillLight = new THREE.SpotLight(0xffc9f5, 0.45, 40, Math.PI / 5, 0.45, 1);
  fillLight.position.set(-8, 8, -6);
  scene.add(fillLight);

  const coolGlow = new THREE.PointLight(0x9fdcff, 0.32, 32, 2);
  coolGlow.position.set(8, 6, 4);
  scene.add(coolGlow);
}

function createRoom() {
  const floorMaterial = new THREE.MeshStandardMaterial({
    color: 0xfbf7ff,
    roughness: 0.85,
    metalness: 0.05,
  });
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(26, 26), floorMaterial);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  const border = new THREE.Mesh(
    new THREE.CylinderGeometry(13, 13, 0.3, 48),
    new THREE.MeshStandardMaterial({ color: 0xe8ddff, roughness: 0.9, metalness: 0.05 })
  );
  border.position.y = -0.14;
  scene.add(border);

  const wallsMaterial = new THREE.MeshStandardMaterial({
    color: 0xdfe8ff,
    side: THREE.BackSide,
    emissive: 0x1f2f66,
    emissiveIntensity: 0.04,
    roughness: 0.92,
  });
  const walls = new THREE.Mesh(new THREE.BoxGeometry(26, 8, 26), wallsMaterial);
  walls.position.y = 4;
  scene.add(walls);

  const grid = new THREE.GridHelper(24, 24, 0xe5edff, 0xf7f2ff);
  grid.position.y = 0.01;
  scene.add(grid);
}

function createShelf(definition) {
  const { layout } = definition;
  const group = new THREE.Group();

  const shelf = new THREE.Mesh(
    new THREE.BoxGeometry(layout.size.x, layout.size.y, layout.size.z),
    new THREE.MeshStandardMaterial({
      color: layout.color,
      roughness: 0.45,
      metalness: 0.12,
    })
  );
  shelf.castShadow = true;
  shelf.receiveShadow = true;
  shelf.position.set(layout.position.x, layout.size.y / 2, layout.position.z);
  group.add(shelf);

  const topper = new THREE.Mesh(
    new THREE.BoxGeometry(layout.size.x + 0.4, 0.18, layout.size.z + 0.4),
    new THREE.MeshStandardMaterial({
      color: layout.highlight,
      emissive: layout.highlight,
      emissiveIntensity: 0.35,
    })
  );
  topper.position.set(layout.position.x, layout.size.y + 0.12, layout.position.z);
  group.add(topper);

  const halo = new THREE.Mesh(
    new THREE.TorusGeometry(Math.max(layout.size.x, layout.size.z) * 0.35, 0.06, 16, 80),
    new THREE.MeshStandardMaterial({
      color: layout.neon,
      emissive: layout.neon,
      emissiveIntensity: 0.55,
    })
  );
  halo.rotation.x = Math.PI / 2;
  halo.position.set(layout.position.x, layout.size.y + 0.7, layout.position.z);
  group.add(halo);
  floatingActors.push({ object: halo, amplitude: 0.08, speed: 1.3 + Math.random() * 0.4, baseY: halo.position.y });

  scene.add(group);

  shelf.updateMatrixWorld(true);
  const shelfBox = new THREE.Box3().setFromObject(shelf);
  collisionBoxes.push(expandBox(shelfBox, 0.35));

  const label = createWorldLabel(definition.title, "Rayon interactif");
  interactiveTargets.push({
    type: "shelf",
    data: definition,
    position: new THREE.Vector3(layout.position.x, PLAYER_HEIGHT, layout.position.z),
    triggerRadius: INTERACTION_DISTANCE,
    label,
    labelOffset: layout.size.y + 1.1,
    message: () => `Appuie sur E pour parcourir ${definition.title}`,
    interact: () => openShelfModal(definition),
  });
}

function createCashiers() {
  if (!cashiers.length) return;
  cashiers.forEach((cashier, index) => {
    const spot = CASHIER_SPOTS[index % CASHIER_SPOTS.length];
    const counterSize = { width: 3.2, height: 1.1, depth: 1.5 };

    const counter = new THREE.Mesh(
      new THREE.BoxGeometry(counterSize.width, counterSize.height, counterSize.depth),
      new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.32, metalness: 0.08 })
    );
    counter.castShadow = true;
    counter.receiveShadow = true;
    counter.position.set(spot.position.x, counterSize.height / 2, spot.position.z);

    const neonStrip = new THREE.Mesh(
      new THREE.BoxGeometry(counterSize.width + 0.2, 0.18, 0.32),
      new THREE.MeshStandardMaterial({
        color: spot.accent,
        emissive: spot.accent,
        emissiveIntensity: 0.65,
      })
    );
    neonStrip.position.set(spot.position.x, counterSize.height - 0.1, spot.position.z + counterSize.depth / 2 + 0.02);

    const body = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.45, 1.1, 12, 20),
      new THREE.MeshStandardMaterial({ color: 0xfff1f4, emissive: spot.accent, emissiveIntensity: 0.16 })
    );
    body.position.set(spot.position.x, counterSize.height + 0.95, spot.position.z - 0.35);
    body.castShadow = true;

    const head = new THREE.Mesh(
      new THREE.SphereGeometry(0.42, 24, 16),
      new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0x2c2e4e, emissiveIntensity: 0.08 })
    );
    head.position.set(spot.position.x, counterSize.height + 1.6, spot.position.z - 0.35);
    head.castShadow = true;

    scene.add(counter, neonStrip, body, head);

    const counterBox = new THREE.Box3().setFromObject(counter);
    counterBox.max.z -= 0.45;
    collisionBoxes.push(expandBox(counterBox, 0.25));

    const label = createWorldLabel(cashier.display_name, "Caisse");
    interactiveTargets.push({
      type: "cashier",
      data: cashier,
      position: new THREE.Vector3(spot.position.x, PLAYER_HEIGHT, spot.position.z + 1.05),
      triggerRadius: 2.4,
      label,
      labelOffset: 2.4,
      message: () => `Appuie sur E pour parler à ${cashier.display_name}`,
      interact: () => {
        state.selectedCashier = cashier;
        updateCheckoutButton();
        openCheckoutModal();
      },
    });
  });
}

function createChatbot() {
  const botGroup = new THREE.Group();

  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(0.65, 0.75, 0.32, 36),
    new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.25, metalness: 0.3 })
  );
  base.castShadow = true;
  base.receiveShadow = true;
  botGroup.add(base);

  const body = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.55, 1.4, 14, 24),
    new THREE.MeshStandardMaterial({ color: 0xe7baff, emissive: CHATBOT_SPOT.accent, emissiveIntensity: 0.6 })
  );
  body.position.y = 1.1;
  botGroup.add(body);

  const visor = new THREE.Mesh(
    new THREE.SphereGeometry(0.48, 24, 18),
    new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0x241c3f, emissiveIntensity: 0.35 })
  );
  visor.position.y = 1.8;
  botGroup.add(visor);

  botGroup.position.set(CHATBOT_SPOT.position.x, 0, CHATBOT_SPOT.position.z);
  scene.add(botGroup);

  floatingActors.push({ object: botGroup, amplitude: 0.32, speed: 1.1, baseY: botGroup.position.y });

  const label = createWorldLabel("Mia – magicienne IA", "Assistante virtuelle");
  interactiveTargets.push({
    type: "chatbot",
    data: null,
    position: new THREE.Vector3(CHATBOT_SPOT.position.x, PLAYER_HEIGHT, CHATBOT_SPOT.position.z + 0.5),
    triggerRadius: 2.6,
    label,
    labelOffset: 2.6,
    message: () => "Appuie sur E pour demander un produit à Mia",
    interact: () => openChatModal(),
  });
}

function createDecor() {
  const arch = new THREE.Mesh(
    new THREE.TorusGeometry(7.5, 0.18, 24, 160),
    new THREE.MeshStandardMaterial({ color: 0xff8fd4, emissive: 0xff8fd4, emissiveIntensity: 0.4 })
  );
  arch.rotation.x = Math.PI / 2;
  arch.position.set(0, 3.4, -2);
  scene.add(arch);
  floatingActors.push({ object: arch, amplitude: 0.12, speed: 0.45, baseY: arch.position.y });

  const bannerTexture = createTextTexture("But Market 360°", "Courses immersives");
  const bannerMaterial = new THREE.MeshBasicMaterial({ map: bannerTexture, transparent: true });
  const banner = new THREE.Mesh(new THREE.PlaneGeometry(6, 1.8), bannerMaterial);
  banner.position.set(0, 3.1, 4.8);
  banner.rotation.y = Math.PI;
  scene.add(banner);
  floatingActors.push({ object: banner, amplitude: 0.1, speed: 0.6, baseY: banner.position.y });

  const sparkle = new THREE.PointLight(0xffa8f5, 0.28, 18, 2);
  sparkle.position.set(-3, 4.5, -5);
  scene.add(sparkle);
}

function createTextTexture(title, subtitle) {
  const canvasEl = document.createElement("canvas");
  canvasEl.width = 1024;
  canvasEl.height = 256;
  const ctx = canvasEl.getContext("2d");
  if (!ctx) return null;

  ctx.fillStyle = "rgba(255, 255, 255, 0.92)";
  ctx.fillRect(0, 0, canvasEl.width, canvasEl.height);

  ctx.fillStyle = "#2d2f52";
  ctx.font = "bold 120px 'Fredoka', 'Poppins', sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(title, canvasEl.width / 2, canvasEl.height / 2 - 40);

  ctx.fillStyle = "#ff6fba";
  ctx.font = "700 72px 'Fredoka', sans-serif";
  ctx.fillText(subtitle, canvasEl.width / 2, canvasEl.height / 2 + 60);

  const texture = new THREE.CanvasTexture(canvasEl);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

function onKeyDown(event) {
  if (event.key === "Escape" && state.activeModal) {
    closeModal(state.activeModal);
    return;
  }
  if (!controls?.isLocked) return;

  switch (event.code) {
    case "KeyW":
    case "ArrowUp":
    case "KeyZ":
      moveState.forward = true;
      break;
    case "KeyS":
    case "ArrowDown":
      moveState.backward = true;
      break;
    case "KeyA":
    case "ArrowLeft":
    case "KeyQ":
      moveState.left = true;
      break;
    case "KeyD":
    case "ArrowRight":
      moveState.right = true;
      break;
    case "ShiftLeft":
    case "ShiftRight":
      isSprinting = true;
      break;
    case "Space":
    case "Enter":
    case "KeyE":
      event.preventDefault();
      attemptInteraction();
      break;
    default:
      break;
  }
}

function onKeyUp(event) {
  switch (event.code) {
    case "KeyW":
    case "ArrowUp":
    case "KeyZ":
      moveState.forward = false;
      break;
    case "KeyS":
    case "ArrowDown":
      moveState.backward = false;
      break;
    case "KeyA":
    case "ArrowLeft":
    case "KeyQ":
      moveState.left = false;
      break;
    case "KeyD":
    case "ArrowRight":
      moveState.right = false;
      break;
    case "ShiftLeft":
    case "ShiftRight":
      isSprinting = false;
      break;
    default:
      break;
  }
}

function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();
  updateMovement(delta);
  updateFloating(delta);
  renderer.render(scene, camera);
  updateLabels();
  updateInteractionHint();
}

function updateMovement(delta) {
  if (!controls?.isLocked || state.activeModal) return;

  velocity.x -= velocity.x * 8.0 * delta;
  velocity.z -= velocity.z * 8.0 * delta;

  direction.z = Number(moveState.forward) - Number(moveState.backward);
  direction.x = Number(moveState.right) - Number(moveState.left);
  direction.normalize();

  const speed = isSprinting ? WALK_SPEED * SPRINT_MULTIPLIER : WALK_SPEED;

  if (moveState.forward || moveState.backward) {
    velocity.z -= direction.z * speed * delta;
  }
  if (moveState.left || moveState.right) {
    velocity.x -= direction.x * speed * delta;
  }

  const player = controls.getObject();
  const previousPosition = player.position.clone();

  controls.moveRight(-velocity.x * delta);
  controls.moveForward(-velocity.z * delta);

  player.position.y = PLAYER_HEIGHT;

  if (isBlocked(player.position)) {
    player.position.copy(previousPosition);
    velocity.set(0, 0, 0);
  }
}

function updateFloating(delta) {
  const time = clock.elapsedTime;
  floatingActors.forEach((actor) => {
    if (!actor.object) return;
    actor.object.position.y = actor.baseY + Math.sin(time * actor.speed) * actor.amplitude;
    actor.object.rotation.y += delta * actor.speed * 0.25;
  });
}

function isBlocked(position) {
  if (
    position.x < STORE_BOUNDS.minX + PLAYER_RADIUS ||
    position.x > STORE_BOUNDS.maxX - PLAYER_RADIUS ||
    position.z < STORE_BOUNDS.minZ + PLAYER_RADIUS ||
    position.z > STORE_BOUNDS.maxZ - PLAYER_RADIUS
  ) {
    return true;
  }
  const testPoint = new THREE.Vector3(position.x, 1, position.z);
  return collisionBoxes.some((box) => box.containsPoint(testPoint));
}

function expandBox(box, padding) {
  const expanded = box.clone();
  expanded.min.x -= padding;
  expanded.min.z -= padding;
  expanded.max.x += padding;
  expanded.max.z += padding;
  return expanded;
}

function updateLabels() {
  if (!labelOverlay || !renderer || !camera) return;
  const rect = labelOverlay.getBoundingClientRect();
  const overlayVisible = experienceOverlay && !experienceOverlay.classList.contains("hidden");

  interactiveTargets.forEach((target) => {
    if (!target.label) return;
    if (!controls?.isLocked || state.activeModal || overlayVisible) {
      target.label.classList.add("hidden");
      return;
    }
    const screenPosition = target.position.clone();
    screenPosition.y += target.labelOffset || 0;
    screenPosition.project(camera);

    if (screenPosition.z < 0 || screenPosition.z > 1) {
      target.label.classList.add("hidden");
      return;
    }

    const x = (screenPosition.x * 0.5 + 0.5) * rect.width;
    const y = (-screenPosition.y * 0.5 + 0.5) * rect.height;
    target.label.style.transform = `translate(-50%, -50%) translate(${x}px, ${y}px)`;
    target.label.classList.remove("hidden");
  });
}

function findNearestTarget() {
  if (!controls) return null;
  const origin = controls.getObject().position;
  let nearest = null;
  interactiveTargets.forEach((target) => {
    const distance = origin.distanceTo(target.position);
    if (distance <= (target.triggerRadius || INTERACTION_DISTANCE)) {
      if (!nearest || distance < nearest.distance) {
        nearest = { target, distance };
      }
    }
  });
  return nearest;
}

function updateInteractionHint() {
  if (!interactionHint) return;
  if (!controls?.isLocked || state.activeModal) {
    interactionHint.classList.add("hidden");
    hoveredTarget = null;
    return;
  }
  const candidate = findNearestTarget();
  if (!candidate) {
    interactionHint.classList.add("hidden");
    hoveredTarget = null;
    return;
  }
  hoveredTarget = candidate.target;
  interactionHint.textContent = hoveredTarget.message();
  interactionHint.classList.remove("hidden");
}

function attemptInteraction() {
  if (!controls?.isLocked) return;
  const candidate = findNearestTarget();
  if (!candidate) {
    showStatus("Approche-toi d'un rayon, de Mia ou d'une caisse pour interagir.", "info");
    return;
  }
  candidate.target.interact?.();
}

function onWindowResize() {
  if (!renderer || !camera || !stageEl) return;
  const { clientWidth, clientHeight } = stageEl;
  renderer.setSize(clientWidth, clientHeight);
  camera.aspect = clientWidth / clientHeight;
  camera.updateProjectionMatrix();
  updateLabels();
}

function createWorldLabel(title, subtitle) {
  if (!labelOverlay) return null;
  const label = document.createElement("div");
  label.className = "world-label hidden";
  const strong = document.createElement("strong");
  strong.textContent = title;
  label.appendChild(strong);
  if (subtitle) {
    const span = document.createElement("span");
    span.textContent = subtitle;
    label.appendChild(span);
  }
  labelOverlay.appendChild(label);
  return label;
}

function updateExperienceOverlay() {
  if (!experienceOverlay) return;
  if (state.activeModal || (controls && controls.isLocked)) {
    experienceOverlay.classList.add("hidden");
    return;
  }
  experienceOverlay.classList.remove("hidden");
  if (experienceMessage) {
    experienceMessage.textContent = hasStarted
      ? "Clique sur « Reprendre » ou directement dans le décor pour continuer la visite 3D."
      : "Clique sur « Entrer » pour débuter la visite 3D.";
  }
  if (experienceButton) {
    experienceButton.textContent = hasStarted ? "Reprendre la visite" : "Entrer dans le magasin";
  }
}

function openModal(modal) {
  if (!modal) return;
  state.activeModal = modal;
  modal.classList.remove("hidden");
  if (controls?.isLocked) {
    controls.unlock();
  } else {
    updateExperienceOverlay();
  }
}

function closeModal(modal) {
  if (!modal) return;
  modal.classList.add("hidden");
  if (state.activeModal === modal) {
    state.activeModal = null;
    updateExperienceOverlay();
  }
}

function bindModalClose() {
  document.querySelectorAll(".modal-close").forEach((button) => {
    button.addEventListener("click", () => {
      const target = button.dataset.close;
      if (!target) return;
      closeModal(document.getElementById(target));
    });
  });

  [shelfModal, chatModal, checkoutModal].forEach((modal) => {
    modal?.addEventListener("click", (event) => {
      if (event.target === modal) {
        closeModal(modal);
      }
    });
  });
}

function openShelfModal(shelf) {
  if (!shelfModal) return;
  shelfTitleEl.textContent = shelf.title;
  shelfDescriptionEl.textContent = shelf.description;
  shelfSearchInput.value = "";
  renderShelfProducts(shelf, "");
  openModal(shelfModal);
}

function renderShelfProducts(shelf, query) {
  const lowerQuery = (query || "").trim().toLowerCase();
  let filtered = products.filter((product) => {
    const name = product.name.toLowerCase();
    const keywordsMatch = shelf.keywords.some((keyword) => name.includes(keyword));
    return keywordsMatch;
  });

  if (lowerQuery) {
    filtered = filtered.filter((product) => product.name.toLowerCase().includes(lowerQuery));
  }

  if (!filtered.length) {
    filtered = products
      .filter((product) => product.name.toLowerCase().includes(lowerQuery))
      .slice(0, 9);
  }

  shelfProductsEl.innerHTML = "";
  if (!filtered.length) {
    const empty = document.createElement("p");
    empty.textContent = "Rien de trouvé. Demande à Mia pour inventer cet article !";
    shelfProductsEl.appendChild(empty);
    return;
  }

  filtered.forEach((product) => {
    shelfProductsEl.appendChild(createProductTile(product));
  });
}

function createProductTile(product) {
  const article = document.createElement("article");
  article.className = "product-tile";
  article.innerHTML = `
    <h3>${product.name}</h3>
    <div class="price">${product.price_ht.toFixed(2)} € HT</div>
    <div class="meta">${product.unit_quantity} ${product.unit} · TVA ${(product.vat_rate * 100).toFixed(1)}%</div>
    <div class="origin">Origine : ${product.origin}</div>
  `;
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = "Ajouter";
  button.addEventListener("click", () => {
    addToCart(product, 1);
  });
  article.appendChild(button);
  return article;
}

shelfSearchInput?.addEventListener("input", () => {
  const shelf = shelfDefinitions.find((definition) => definition.title === shelfTitleEl.textContent);
  if (!shelf) return;
  renderShelfProducts(shelf, shelfSearchInput.value);
});

function openChatModal() {
  if (!chatModal) return;
  if (!chatLog.hasChildNodes()) {
    appendChatMessage("bot", "👋 Salut ! Je suis Mia. Dis-moi ce qu'il te manque et je le créerai en rayon.");
  }
  openModal(chatModal);
  chatInput.focus();
}

function appendChatMessage(author, message) {
  const entry = document.createElement("div");
  entry.className = `chat-message ${author}`;
  const authorEl = document.createElement("span");
  authorEl.className = "author";
  authorEl.textContent = author === "bot" ? "Mia" : "Vous";
  const bubble = document.createElement("div");
  bubble.className = "bubble";
  bubble.textContent = message;
  entry.appendChild(authorEl);
  entry.appendChild(bubble);
  chatLog.appendChild(entry);
  chatLog.scrollTop = chatLog.scrollHeight;
}

chatForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const query = chatInput.value.trim();
  if (!query) return;
  appendChatMessage("user", query);
  chatInput.value = "";
  try {
    const product = await lookupProduct(query);
    addToCart(product, 1);
    const createdText = product.created
      ? "Je viens de l'inventer rien que pour toi !"
      : "Il était déjà rangé, je te l'ai mis de côté.";
    appendChatMessage(
      "bot",
      `${product.name} est prêt (${product.price_ht.toFixed(2)} € HT). ${createdText}`
    );
  } catch (error) {
    appendChatMessage("bot", error.message || "Oups, quelque chose s'est mal passé.");
  }
});

const cart = state.cart;

function addToCart(product, quantity) {
  const key = product.id;
  const current = cart.get(key);
  if (current) {
    current.quantity += quantity;
  } else {
    cart.set(key, { ...product, quantity });
  }
  renderCart();
  updateTotals();
  showStatus(`${product.name} ajouté au panier`, "success");
}

function renderCart() {
  if (!cartList) return;
  cartList.innerHTML = "";
  cart.forEach((item, key) => {
    const li = document.createElement("li");
    const info = document.createElement("div");
    info.className = "info";
    const name = document.createElement("div");
    name.className = "name";
    name.textContent = item.name;
    const meta = document.createElement("div");
    meta.className = "meta";
    meta.textContent = `${item.unit_quantity} ${item.unit} · TVA ${(item.vat_rate * 100).toFixed(1)}%`;
    info.appendChild(name);
    info.appendChild(meta);

    const actions = document.createElement("div");
    actions.className = "actions";
    const quantityInput = document.createElement("input");
    quantityInput.type = "number";
    quantityInput.min = "0.1";
    quantityInput.step = "0.1";
    quantityInput.value = item.quantity.toString();
    quantityInput.addEventListener("input", () => {
      const value = parseFloat(quantityInput.value);
      if (Number.isFinite(value) && value > 0) {
        cart.get(key).quantity = value;
        updateTotals();
      }
    });

    const removeButton = document.createElement("button");
    removeButton.className = "remove";
    removeButton.type = "button";
    removeButton.textContent = "Retirer";
    removeButton.addEventListener("click", () => {
      cart.delete(key);
      renderCart();
      updateTotals();
    });

    actions.appendChild(quantityInput);
    actions.appendChild(removeButton);
    li.appendChild(info);
    li.appendChild(actions);
    cartList.appendChild(li);
  });
  updateCheckoutButton();
}

function updateTotals() {
  let totalHt = 0;
  let totalTva = 0;
  cart.forEach((item) => {
    totalHt += item.price_ht * item.quantity;
    totalTva += item.price_ht * item.quantity * item.vat_rate;
  });
  const totalTtc = totalHt + totalTva;
  totalHtEl.textContent = formatCurrency(totalHt);
  totalTvaEl.textContent = formatCurrency(totalTva);
  totalTtcEl.textContent = formatCurrency(totalTtc);
  modalTotalHtEl.textContent = formatCurrency(totalHt);
  modalTotalTvaEl.textContent = formatCurrency(totalTva);
  modalTotalTtcEl.textContent = formatCurrency(totalTtc);
}

function formatCurrency(value) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(value);
}

function updateCheckoutButton() {
  if (!checkoutButton) return;
  if (!state.selectedCashier) {
    checkoutButton.textContent = "Choisir une caisse";
    checkoutButton.disabled = true;
    return;
  }
  checkoutButton.textContent = `Voir ${state.selectedCashier.display_name}`;
  checkoutButton.disabled = cart.size === 0;
}

checkoutButton?.addEventListener("click", () => {
  if (!state.selectedCashier) {
    showStatus("Approchez-vous d'un caissier pour finaliser vos courses.", "info");
    return;
  }
  if (!cart.size) {
    showStatus("Votre panier est vide, remplissez-le avant de passer en caisse.", "error");
    return;
  }
  openCheckoutModal();
});

function openCheckoutModal() {
  if (!checkoutModal || !state.selectedCashier) return;
  checkoutCaption.textContent = `Vous êtes face à ${state.selectedCashier.display_name}.`;
  renderCheckoutItems();
  syncCustomerFields();
  checkoutStatus.textContent = "";
  openModal(checkoutModal);
}

function renderCheckoutItems() {
  checkoutItemsEl.innerHTML = "";
  cart.forEach((item) => {
    const li = document.createElement("li");
    li.innerHTML = `<span>${item.quantity.toFixed(2)} × ${item.name}</span><strong>${formatCurrency(
      item.quantity * item.price_ht * (1 + item.vat_rate)
    )}</strong>`;
    checkoutItemsEl.appendChild(li);
  });
}

function syncCustomerFields() {
  if (modalCustomerInput && customerInput) {
    modalCustomerInput.value = customerInput.value;
  }
}

customerInput?.addEventListener("input", () => {
  if (modalCustomerInput) {
    modalCustomerInput.value = customerInput.value;
  }
});

modalCustomerInput?.addEventListener("input", () => {
  if (customerInput) {
    customerInput.value = modalCustomerInput.value;
  }
});

confirmCheckoutButton?.addEventListener("click", async () => {
  if (!state.selectedCashier) {
    checkoutStatus.textContent = "Choisissez un caissier.";
    checkoutStatus.className = "status error";
    return;
  }
  if (!cart.size) {
    checkoutStatus.textContent = "Votre panier est vide.";
    checkoutStatus.className = "status error";
    return;
  }
  const items = Array.from(cart.entries()).map(([productId, item]) => ({
    productId,
    quantity: item.quantity,
    name: item.name,
  }));
  const payload = {
    customer: modalCustomerInput?.value || "",
    cashierId: state.selectedCashier.id,
    items,
  };
  try {
    confirmCheckoutButton.disabled = true;
    confirmCheckoutButton.textContent = "Impression...";
    const response = await fetch("/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error || "Impossible de finaliser la commande");
    }
    const data = await response.json();
    window.location.href = data.redirect;
  } catch (error) {
    checkoutStatus.textContent = error.message;
    checkoutStatus.className = "status error";
    confirmCheckoutButton.disabled = false;
    confirmCheckoutButton.textContent = "Imprimer le ticket";
  }
});

function showStatus(message, type = "info") {
  if (!statusBox) return;
  statusBox.textContent = message;
  statusBox.className = `status ${type}`;
  if (message) {
    setTimeout(() => {
      if (statusBox.textContent === message) {
        statusBox.textContent = "";
        statusBox.className = "status";
      }
    }, 4000);
  }
}

async function lookupProduct(query) {
  const response = await fetch("/api/lookup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.error || "Impossible d'ajouter cet article");
  }
  const payload = await response.json();
  if (payload.created) {
    await refreshCatalog();
  }
  return { ...payload.product, created: payload.created };
}

async function refreshCatalog() {
  const response = await fetch("/api/products");
  products = await response.json();
}
