import * as THREE from 'three';
import { io } from 'socket.io-client';

// ══════════════════════════════════════════════════
//  OTTER VILLAGE 🦦 — 3D Multiplayer Animal Crossing
// ══════════════════════════════════════════════════

const ANIMALS = {
  otter: '🦦', cat: '🐱', bunny: '🐰', bear: '🐻',
  fox: '🦊', penguin: '🐧', frog: '🐸', deer: '🦌'
};
const EMOTE_LIST = ['wave','heart','laugh','sad','angry','dance','sleep','wave2'];
const MOVE_SPEED = 8;
const ROTATE_SPEED = 8;
const CAMERA_DISTANCE = 18;
const CAMERA_HEIGHT = 14;
const CAMERA_ANGLE = Math.PI / 6;
const LERP_SPEED = 12;
const SEND_RATE = 1 / 20; // 20 Hz position updates

// ── Seeded RNG ──
function mulberry32(a) {
  return () => {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

class Game {
  constructor() {
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.clock = new THREE.Clock();
    this.socket = null;
    this.myId = null;
    this.myName = '';
    this.myAnimal = 'otter';
    this.localPlayer = null;
    this.players = new Map();
    this.worldObjects = [];
    this.input = { w:false, a:false, s:false, d:false };
    this.chatFocused = false;
    this.selectedAnimal = 'otter';
    this.dayTime = 0.35; // start at morning
    this.sunLight = null;
    this.ambientLight = null;
    this.hemisphereLight = null;
    this.sendTimer = 0;
    this.lastSentPos = { x: 0, z: 0 };
    this.playerMeshes = new Map();
    this.chatBubbles = new Map();
    this.emoteMeshes = new Map();
  }

  // ════════════════════════════════════════════════
  //  INIT
  // ════════════════════════════════════════════════
  init() {
    this.setupLogin();
  }

  setupLogin() {
    const grid = document.getElementById('animalGrid');
    Object.entries(ANIMALS).forEach(([key, emoji]) => {
      const el = document.createElement('div');
      el.className = 'animal-option' + (key === 'otter' ? ' selected' : '');
      el.dataset.animal = key;
      el.innerHTML = `${emoji}<span>${key}</span>`;
      el.addEventListener('click', () => {
        grid.querySelectorAll('.animal-option').forEach(e => e.classList.remove('selected'));
        el.classList.add('selected');
        this.selectedAnimal = key;
      });
      grid.appendChild(el);
    });

    const nameInput = document.getElementById('nameInput');
    const joinBtn = document.getElementById('joinBtn');

    joinBtn.addEventListener('click', () => this.join());
    nameInput.addEventListener('keydown', e => { if (e.key === 'Enter') this.join(); });

    nameInput.focus();
  }

  join() {
    const name = document.getElementById('nameInput').value.trim() || 'Villager';
    this.myName = name;
    this.myAnimal = this.selectedAnimal;

    // Hide login, show HUD
    document.getElementById('login').classList.add('hidden');
    document.getElementById('hud').classList.remove('hidden');

    this.initThree();
    this.initInput();
    this.initNetwork();
    this.animate();
  }

  initThree() {
    const canvas = document.getElementById('gameCanvas');

    // Scene
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x87CEEB, 0.008);

    // Renderer
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;

    // Camera (isometric-style)
    this.camera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 0.1, 200);
    this.camera.position.set(CAMERA_DISTANCE, CAMERA_HEIGHT, CAMERA_DISTANCE);
    this.camera.lookAt(0, 0, 0);

    // Lighting
    this.ambientLight = new THREE.AmbientLight(0x404060, 0.4);
    this.scene.add(this.ambientLight);

    this.hemisphereLight = new THREE.HemisphereLight(0x87CEEB, 0x3a5f0b, 0.6);
    this.scene.add(this.hemisphereLight);

    this.sunLight = new THREE.DirectionalLight(0xfff4e6, 1.2);
    this.sunLight.position.set(30, 40, 20);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 2048;
    this.sunLight.shadow.mapSize.height = 2048;
    this.sunLight.shadow.camera.near = 0.5;
    this.sunLight.shadow.camera.far = 100;
    this.sunLight.shadow.camera.left = -40;
    this.sunLight.shadow.camera.right = 40;
    this.sunLight.shadow.camera.top = 40;
    this.sunLight.shadow.camera.bottom = -40;
    this.sunLight.shadow.bias = -0.001;
    this.scene.add(this.sunLight);

    // Window resize
    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }

  // ════════════════════════════════════════════════
  //  NETWORKING
  // ════════════════════════════════════════════════
  initNetwork() {
    const url = window.location.hostname === 'localhost'
      ? 'http://localhost:3001'
      : window.location.origin;

    this.socket = io(url, {
      transports: ['websocket', 'polling']
    });

    this.socket.on('connect', () => {
      this.myId = this.socket.id;
      this.socket.emit('join', { name: this.myName, animal: this.myAnimal });
    });

    this.socket.on('world', (data) => {
      this.buildWorld(data);
      // Init local player
      const myData = data.players[this.myId];
      if (myData) this.initLocalPlayer(myData);
      // Spawn existing remote players
      Object.values(data.players).forEach(p => {
        if (p.id !== this.myId) this.addRemotePlayer(p);
      });
      // Chat history
      data.chatHistory?.forEach(m => this.addChatMessage(m, false));
      this.updatePlayerList();
    });

    this.socket.on('playerJoined', (p) => {
      if (p.id !== this.myId) {
        this.addRemotePlayer(p);
        this.addChatMessage({
          playerName: p.name,
          text: `joined the village! ${ANIMALS[p.animal] || ''}`,
          system: true
        });
      }
    });

    this.socket.on('playerLeft', ({ id }) => {
      const p = this.players.get(id);
      if (p) {
        this.addChatMessage({
          playerName: p.name,
          text: 'left the village',
          system: true
        });
      }
      this.removePlayer(id);
    });

    this.socket.on('playerMoved', ({ id, x, z, rotation }) => {
      const p = this.players.get(id);
      if (p) {
        p.targetX = x;
        p.targetZ = z;
        p.targetRotation = rotation;
      }
    });

    this.socket.on('chatMessage', (msg) => {
      this.addChatMessage(msg);
    });

    this.socket.on('playerEmote', ({ id, emote }) => {
      if (id === this.myId) return;
      this.showEmote(id, emote);
    });
  }

  // ════════════════════════════════════════════════
  //  WORLD BUILDING
  // ════════════════════════════════════════════════
  buildWorld(data) {
    // Sky gradient
    const skyGeo = new THREE.SphereGeometry(90, 32, 16);
    const skyMat = new THREE.ShaderMaterial({
      uniforms: {
        topColor: { value: new THREE.Color(0x4a90d9) },
        bottomColor: { value: new THREE.Color(0x87CEEB) },
        offset: { value: 10 },
        exponent: { value: 0.6 }
      },
      vertexShader: `
        varying vec3 vWorldPos;
        void main() {
          vec4 worldPos = modelMatrix * vec4(position, 1.0);
          vWorldPos = worldPos.xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 topColor;
        uniform vec3 bottomColor;
        uniform float offset;
        uniform float exponent;
        varying vec3 vWorldPos;
        void main() {
          float h = normalize(vWorldPos + offset).y;
          gl_FragColor = vec4(mix(bottomColor, topColor, max(pow(max(h, 0.0), exponent), 0.0)), 1.0);
        }
      `,
      side: THREE.BackSide
    });
    this.scene.add(new THREE.Mesh(skyGeo, skyMat));

    // Ground
    const groundSize = data.worldSize || 80;
    const groundGeo = new THREE.PlaneGeometry(groundSize, groundSize, 64, 64);
    // Gentle terrain noise
    const posAttr = groundGeo.attributes.position;
    for (let i = 0; i < posAttr.count; i++) {
      const x = posAttr.getX(i);
      const y = posAttr.getY(i);
      const noise = Math.sin(x * 0.3) * Math.cos(y * 0.3) * 0.3 +
                    Math.sin(x * 0.7 + 1.5) * Math.cos(y * 0.5 + 2.1) * 0.15;
      posAttr.setZ(i, noise);
    }
    groundGeo.computeVertexNormals();

    const groundMat = new THREE.MeshLambertMaterial({ color: 0x5daa3d });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);

    // Path (dirt path through village)
    const pathGeo = new THREE.PlaneGeometry(2.5, 30);
    const pathMat = new THREE.MeshLambertMaterial({ color: 0xc4a35a });
    const path = new THREE.Mesh(pathGeo, pathMat);
    path.rotation.x = -Math.PI / 2;
    path.position.set(0, 0.02, 0);
    this.scene.add(path);

    const path2 = new THREE.Mesh(new THREE.PlaneGeometry(20, 2.5), pathMat);
    path2.rotation.x = -Math.PI / 2;
    path2.position.set(0, 0.02, 0);
    this.scene.add(path2);

    // World objects
    data.objects?.forEach(obj => this.addObject(obj));
  }

  addObject(obj) {
    let mesh;
    switch (obj.type) {
      case 'tree': mesh = this.createTree(obj); break;
      case 'flower': mesh = this.createFlower(obj); break;
      case 'rock': mesh = this.createRock(obj); break;
      case 'house': mesh = this.createHouse(obj); break;
      case 'fence': mesh = this.createFence(obj); break;
      case 'pond': mesh = this.createPond(obj); break;
      case 'bridge': mesh = this.createBridge(obj); break;
      case 'townhall': mesh = this.createTownHall(obj); break;
    }
    if (mesh) {
      mesh.position.set(obj.x, 0, obj.z);
      mesh.scale.setScalar(obj.scale || 1);
      mesh.rotation.y = obj.rotation || 0;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      this.scene.add(mesh);
    }
  }

  createTree(obj) {
    const group = new THREE.Group();
    const trunkGeo = new THREE.CylinderGeometry(0.15, 0.2, 1.5, 6);
    const trunkMat = new THREE.MeshLambertMaterial({ color: 0x8B6914 });
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.y = 0.75;
    trunk.castShadow = true;
    group.add(trunk);

    const colors = [0x2d8a4e, 0x3aaf60, 0x228b22];
    const leafColor = colors[obj.variant % colors.length];

    // Layered canopy
    for (let i = 0; i < 3; i++) {
      const r = 1.2 - i * 0.25;
      const h = 1.0 - i * 0.1;
      const leafGeo = new THREE.SphereGeometry(r, 8, 6);
      const leafMat = new THREE.MeshLambertMaterial({ color: leafColor });
      const leaf = new THREE.Mesh(leafGeo, leafMat);
      leaf.position.y = 1.8 + i * 0.6;
      leaf.scale.y = 0.7;
      leaf.castShadow = true;
      group.add(leaf);
    }

    return group;
  }

  createFlower(obj) {
    const group = new THREE.Group();
    const colors = [0xFF6B6B, 0xFFB347, 0xFF69B4, 0x9B59B6, 0xFFE66D];
    const color = colors[obj.variant % colors.length];

    // Stem
    const stemGeo = new THREE.CylinderGeometry(0.02, 0.03, 0.4, 4);
    const stemMat = new THREE.MeshLambertMaterial({ color: 0x4CAF50 });
    const stem = new THREE.Mesh(stemGeo, stemMat);
    stem.position.y = 0.2;
    group.add(stem);

    // Petals
    for (let i = 0; i < 5; i++) {
      const petalGeo = new THREE.SphereGeometry(0.12, 6, 4);
      const petalMat = new THREE.MeshLambertMaterial({ color });
      const petal = new THREE.Mesh(petalGeo, petalMat);
      const angle = (i / 5) * Math.PI * 2;
      petal.position.set(Math.cos(angle) * 0.1, 0.45, Math.sin(angle) * 0.1);
      petal.scale.set(1, 0.5, 1);
      group.add(petal);
    }

    // Center
    const centerGeo = new THREE.SphereGeometry(0.08, 6, 4);
    const centerMat = new THREE.MeshLambertMaterial({ color: 0xFFEB3B });
    const center = new THREE.Mesh(centerGeo, centerMat);
    center.position.y = 0.45;
    group.add(center);

    return group;
  }

  createRock(obj) {
    const geo = new THREE.DodecahedronGeometry(0.5, 0);
    const mat = new THREE.MeshLambertMaterial({ color: 0x888888 });
    const rock = new THREE.Mesh(geo, mat);
    rock.scale.y = 0.6;
    return rock;
  }

  createHouse(obj) {
    const group = new THREE.Group();
    const houseColors = [0xE8B87A, 0xD4956B, 0xC9A87C, 0xB8D4E3];
    const roofColors = [0xCC4444, 0x44AA44, 0x4488CC, 0xCC8844];
    const hc = houseColors[obj.variant % houseColors.length];
    const rc = roofColors[obj.variant % roofColors.length];

    // Walls
    const wallGeo = new THREE.BoxGeometry(3, 2.5, 3);
    const wallMat = new THREE.MeshLambertMaterial({ color: hc });
    const walls = new THREE.Mesh(wallGeo, wallMat);
    walls.position.y = 1.25;
    walls.castShadow = true;
    group.add(walls);

    // Roof
    const roofGeo = new THREE.ConeGeometry(2.5, 1.8, 4);
    const roofMat = new THREE.MeshLambertMaterial({ color: rc });
    const roof = new THREE.Mesh(roofGeo, roofMat);
    roof.position.y = 3.4;
    roof.rotation.y = Math.PI / 4;
    roof.castShadow = true;
    group.add(roof);

    // Door
    const doorGeo = new THREE.PlaneGeometry(0.7, 1.2);
    const doorMat = new THREE.MeshLambertMaterial({ color: 0x654321 });
    const door = new THREE.Mesh(doorGeo, doorMat);
    door.position.set(0, 0.6, 1.51);
    group.add(door);

    // Windows
    const winGeo = new THREE.PlaneGeometry(0.5, 0.5);
    const winMat = new THREE.MeshLambertMaterial({ color: 0x87CEEB, emissive: 0x1a3a5a, emissiveIntensity: 0.3 });
    [-0.8, 0.8].forEach(x => {
      const win = new THREE.Mesh(winGeo, winMat);
      win.position.set(x, 1.8, 1.51);
      group.add(win);
    });

    return group;
  }

  createFence(obj) {
    const group = new THREE.Group();
    const mat = new THREE.MeshLambertMaterial({ color: 0xDEB887 });

    // Posts
    [-0.4, 0.4].forEach(x => {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.6, 6), mat);
      post.position.set(x, 0.3, 0);
      group.add(post);
    });

    // Rails
    [0.15, 0.4].forEach(y => {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.06, 0.04), mat);
      rail.position.y = y;
      group.add(rail);
    });

    return group;
  }

  createPond(obj) {
    const group = new THREE.Group();
    const waterGeo = new THREE.CircleGeometry(1, 24);
    const waterMat = new THREE.MeshPhongMaterial({
      color: 0x4488cc,
      transparent: true,
      opacity: 0.7,
      shininess: 100
    });
    const water = new THREE.Mesh(waterGeo, waterMat);
    water.rotation.x = -Math.PI / 2;
    water.position.y = 0.05;
    group.add(water);

    // Lily pads
    for (let i = 0; i < 5; i++) {
      const lilyGeo = new THREE.CircleGeometry(0.2, 8);
      const lilyMat = new THREE.MeshLambertMaterial({ color: 0x2d8a4e });
      const lily = new THREE.Mesh(lilyGeo, lilyMat);
      lily.rotation.x = -Math.PI / 2;
      const angle = (i / 5) * Math.PI * 2;
      lily.position.set(Math.cos(angle) * 0.5, 0.06, Math.sin(angle) * 0.5);
      group.add(lily);
    }

    return group;
  }

  createBridge(obj) {
    const group = new THREE.Group();
    const mat = new THREE.MeshLambertMaterial({ color: 0xA0522D });

    // Planks
    const plankGeo = new THREE.BoxGeometry(2, 0.1, 0.5);
    for (let i = -2; i <= 2; i++) {
      const plank = new THREE.Mesh(plankGeo, mat);
      plank.position.set(0, 0.3, i * 0.55);
      group.add(plank);
    }

    // Rails
    const railGeo = new THREE.BoxGeometry(0.08, 0.5, 2.5);
    [-0.9, 0.9].forEach(x => {
      const rail = new THREE.Mesh(railGeo, mat);
      rail.position.set(x, 0.55, 0);
      group.add(rail);
    });

    return group;
  }

  createTownHall(obj) {
    const group = new THREE.Group();

    // Main building
    const wallMat = new THREE.MeshLambertMaterial({ color: 0xF5F5DC });
    const walls = new THREE.Mesh(new THREE.BoxGeometry(5, 4, 4), wallMat);
    walls.position.y = 2;
    walls.castShadow = true;
    group.add(walls);

    // Roof
    const roofMat = new THREE.MeshLambertMaterial({ color: 0x2F4F4F });
    const roof = new THREE.Mesh(new THREE.ConeGeometry(4, 2, 4), roofMat);
    roof.position.y = 6;
    roof.rotation.y = Math.PI / 4;
    group.add(roof);

    // Columns
    const colMat = new THREE.MeshLambertMaterial({ color: 0xE8E8D0 });
    [[-1.5, 2.1], [1.5, 2.1], [-1.5, -2.1], [1.5, -2.1]].forEach(([x, z]) => {
      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 4, 8), colMat);
      col.position.set(x, 2, z);
      group.add(col);
    });

    // Clock
    const clockFace = new THREE.Mesh(
      new THREE.CircleGeometry(0.5, 16),
      new THREE.MeshLambertMaterial({ color: 0xFFFFFF })
    );
    clockFace.position.set(0, 3.5, 2.01);
    group.add(clockFace);

    return group;
  }

  // ════════════════════════════════════════════════
  //  PLAYER SYSTEM
  // ════════════════════════════════════════════════
  createAnimalMesh(animal, color) {
    const group = new THREE.Group();
    const bodyColor = new THREE.Color(color);

    // Body
    const bodyGeo = new THREE.CapsuleGeometry(0.35, 0.5, 8, 12);
    const bodyMat = new THREE.MeshLambertMaterial({ color: bodyColor });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.7;
    body.castShadow = true;
    group.add(body);

    // Head
    const headGeo = new THREE.SphereGeometry(0.3, 10, 8);
    const headMat = new THREE.MeshLambertMaterial({ color: bodyColor });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.set(0, 1.2, 0.15);
    head.castShadow = true;
    group.add(head);

    // Eyes
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x111111 });
    const eyeWhiteMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    [-0.1, 0.1].forEach(x => {
      const white = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 6), eyeWhiteMat);
      white.position.set(x, 1.28, 0.38);
      group.add(white);
      const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 6), eyeMat);
      pupil.position.set(x, 1.28, 0.42);
      group.add(pupil);
    });

    // Nose
    const noseMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
    const nose = new THREE.Mesh(new THREE.SphereGeometry(0.04, 6, 4), noseMat);
    nose.position.set(0, 1.2, 0.43);
    group.add(nose);

    // Ears (varies by animal)
    const earMat = new THREE.MeshLambertMaterial({ color: bodyColor.clone().multiplyScalar(0.85) });
    if (animal === 'bunny') {
      // Long ears
      [-0.12, 0.12].forEach(x => {
        const ear = new THREE.Mesh(new THREE.CapsuleGeometry(0.06, 0.35, 4, 6), earMat);
        ear.position.set(x, 1.65, 0.1);
        ear.rotation.z = x > 0 ? 0.15 : -0.15;
        group.add(ear);
      });
    } else if (animal === 'cat' || animal === 'fox') {
      // Pointy ears
      [-0.15, 0.15].forEach(x => {
        const ear = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.2, 4), earMat);
        ear.position.set(x, 1.5, 0.1);
        group.add(ear);
      });
    } else if (animal === 'bear') {
      // Round ears
      [-0.18, 0.18].forEach(x => {
        const ear = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 6), earMat);
        ear.position.set(x, 1.48, 0.05);
        group.add(ear);
      });
    } else {
      // Default small ears
      [-0.15, 0.15].forEach(x => {
        const ear = new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 4), earMat);
        ear.position.set(x, 1.48, 0.1);
        group.add(ear);
      });
    }

    // Tail
    const tailMat = new THREE.MeshLambertMaterial({ color: bodyColor.clone().multiplyScalar(0.9) });
    if (animal === 'bunny') {
      const tail = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 6), tailMat);
      tail.position.set(0, 0.6, -0.4);
      group.add(tail);
    } else if (animal === 'fox' || animal === 'cat') {
      const tail = new THREE.Mesh(new THREE.CapsuleGeometry(0.06, 0.35, 4, 6), tailMat);
      tail.position.set(0, 0.8, -0.45);
      tail.rotation.x = -0.5;
      group.add(tail);
    } else {
      const tail = new THREE.Mesh(new THREE.SphereGeometry(0.07, 6, 4), tailMat);
      tail.position.set(0, 0.7, -0.35);
      group.add(tail);
    }

    // Shadow
    const shadowGeo = new THREE.CircleGeometry(0.35, 16);
    const shadowMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.15 });
    const shadow = new THREE.Mesh(shadowGeo, shadowMat);
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.02;
    group.add(shadow);

    return group;
  }

  addRemotePlayer(data) {
    const mesh = this.createAnimalMesh(data.animal || 'otter', data.color);
    mesh.position.set(data.x, 0, data.z);
    this.scene.add(mesh);

    // Name tag
    const nameTag = this.createNameTag(data.name, data.color);
    nameTag.position.y = 2.2;
    mesh.add(nameTag);

    this.players.set(data.id, {
      ...data,
      targetX: data.x,
      targetZ: data.z,
      targetRotation: 0,
      mesh,
      nameTag
    });
    this.playerMeshes.set(data.id, mesh);
    this.updatePlayerList();
  }

  removePlayer(id) {
    const p = this.players.get(id);
    if (p) {
      this.scene.remove(p.mesh);
      this.players.delete(id);
      this.playerMeshes.delete(id);
      this.chatBubbles.delete(id);
      this.emoteMeshes.delete(id);
    }
    this.updatePlayerList();
  }

  createNameTag(name, color) {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.roundRect(0, 8, 256, 48, 12);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 28px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(name, 128, 32);

    const texture = new THREE.CanvasTexture(canvas);
    const mat = new THREE.SpriteMaterial({ map: texture, transparent: true });
    const sprite = new THREE.Sprite(mat);
    sprite.scale.set(2, 0.5, 1);
    return sprite;
  }

  // ════════════════════════════════════════════════
  //  LOCAL PLAYER
  // ════════════════════════════════════════════════
  initLocalPlayer(spawn) {
    const mesh = this.createAnimalMesh(this.myAnimal, spawn?.color || '#4ECDC4');
    mesh.position.set(spawn?.x || 0, 0, spawn?.z || 0);
    this.scene.add(mesh);

    const nameTag = this.createNameTag(this.myName, spawn?.color);
    nameTag.position.y = 2.2;
    mesh.add(nameTag);

    this.localPlayer = {
      mesh,
      x: spawn?.x || 0,
      z: spawn?.z || 0,
      rotation: 0,
      targetRotation: 0,
      velocity: new THREE.Vector3(),
      bobPhase: 0
    };

    this.playerMeshes.set(this.myId, mesh);

    // Camera follow target
    this.cameraTarget = new THREE.Vector3(spawn?.x || 0, 0, spawn?.z || 0);
  }

  // ════════════════════════════════════════════════
  //  INPUT
  // ════════════════════════════════════════════════
  initInput() {
    const chatInput = document.getElementById('chatInput');

    document.addEventListener('keydown', (e) => {
      if (document.activeElement === chatInput) {
        if (e.key === 'Enter') {
          const text = chatInput.value.trim();
          if (text) {
            this.socket.emit('chat', { text });
            chatInput.value = '';
          }
          chatInput.blur();
          this.chatFocused = false;
        }
        if (e.key === 'Escape') {
          chatInput.blur();
          this.chatFocused = false;
        }
        return;
      }

      switch (e.key.toLowerCase()) {
        case 'w': case 'arrowup': this.input.w = true; break;
        case 'a': case 'arrowleft': this.input.a = true; break;
        case 's': case 'arrowdown': this.input.s = true; break;
        case 'd': case 'arrowright': this.input.d = true; break;
        case 'enter':
          e.preventDefault();
          chatInput.focus();
          this.chatFocused = true;
          break;
        case '1': case '2': case '3': case '4':
        case '5': case '6': case '7': case '8':
          const emoteIdx = parseInt(e.key) - 1;
          if (emoteIdx < EMOTE_LIST.length) {
            this.socket.emit('emote', { emote: EMOTE_LIST[emoteIdx] });
            this.showEmote(this.myId, EMOTE_LIST[emoteIdx]);
          }
          break;
      }
    });

    document.addEventListener('keyup', (e) => {
      switch (e.key.toLowerCase()) {
        case 'w': case 'arrowup': this.input.w = false; break;
        case 'a': case 'arrowleft': this.input.a = false; break;
        case 's': case 'arrowdown': this.input.s = false; break;
        case 'd': case 'arrowright': this.input.d = false; break;
      }
    });

    // Emote buttons
    document.querySelectorAll('.emote-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const emote = btn.dataset.emote;
        this.socket.emit('emote', { emote });
        this.showEmote(this.myId, emote);
      });
    });
  }

  // ════════════════════════════════════════════════
  //  CHAT & EMOTES
  // ════════════════════════════════════════════════
  addChatMessage(msg, animate = true) {
    const container = document.getElementById('chatMessages');
    const el = document.createElement('div');
    el.className = 'chat-msg';
    if (!animate) el.style.animation = 'none';

    if (msg.system) {
      el.innerHTML = `<span class="system">${msg.playerName} ${msg.text}</span>`;
    } else {
      el.innerHTML = `<span class="name" style="color:${msg.color || '#4ECDC4'}">${msg.playerName}:</span>${msg.text}`;
    }

    container.appendChild(el);
    container.scrollTop = container.scrollHeight;

    // Keep only last 50 messages in DOM
    while (container.children.length > 50) container.removeChild(container.firstChild);

    // Show bubble above player
    if (!msg.system && msg.playerId) {
      this.showChatBubble(msg.playerId, msg.text);
    }
  }

  showChatBubble(playerId, text) {
    const mesh = this.playerMeshes.get(playerId);
    if (!mesh) return;

    // Remove old bubble
    const old = this.chatBubbles.get(playerId);
    if (old) mesh.remove(old);

    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    // Bubble background
    ctx.fillStyle = 'rgba(255,255,255,0.95)';
    ctx.beginPath();
    ctx.roundRect(16, 8, 480, 96, 20);
    ctx.fill();

    // Text
    ctx.fillStyle = '#333';
    ctx.font = '32px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const truncated = text.length > 30 ? text.slice(0, 27) + '...' : text;
    ctx.fillText(truncated, 256, 56);

    const texture = new THREE.CanvasTexture(canvas);
    const mat = new THREE.SpriteMaterial({ map: texture, transparent: true });
    const sprite = new THREE.Sprite(mat);
    sprite.scale.set(3, 0.75, 1);
    sprite.position.y = 2.8;
    mesh.add(sprite);
    this.chatBubbles.set(playerId, sprite);

    // Auto-remove after 5s
    setTimeout(() => {
      mesh.remove(sprite);
      this.chatBubbles.delete(playerId);
    }, 5000);
  }

  showEmote(playerId, emote) {
    const mesh = this.playerMeshes.get(playerId);
    if (!mesh) return;

    // Remove old emote
    const old = this.emoteMeshes.get(playerId);
    if (old) mesh.remove(old);

    if (!emote) return;

    const emojiMap = {
      wave: '👋', heart: '❤️', laugh: '😂', sad: '😢',
      angry: '😠', dance: '💃', sleep: '😴', wave2: '🖐️'
    };

    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    ctx.font = '96px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(emojiMap[emote] || '✨', 64, 64);

    const texture = new THREE.CanvasTexture(canvas);
    const mat = new THREE.SpriteMaterial({ map: texture, transparent: true });
    const sprite = new THREE.Sprite(mat);
    sprite.scale.set(1, 1, 1);
    sprite.position.y = 2.5;
    mesh.add(sprite);
    this.emoteMeshes.set(playerId, sprite);

    // Animate float up and fade
    const startTime = performance.now();
    const animateEmote = () => {
      const elapsed = (performance.now() - startTime) / 1000;
      if (elapsed > 3) {
        mesh.remove(sprite);
        this.emoteMeshes.delete(playerId);
        return;
      }
      sprite.position.y = 2.5 + elapsed * 0.5;
      sprite.material.opacity = Math.max(0, 1 - elapsed / 3);
      requestAnimationFrame(animateEmote);
    };
    requestAnimationFrame(animateEmote);
  }

  // ════════════════════════════════════════════════
  //  CAMERA
  // ════════════════════════════════════════════════
  updateCamera(dt) {
    if (!this.localPlayer) return;

    const target = this.cameraTarget || new THREE.Vector3();
    target.lerp(new THREE.Vector3(this.localPlayer.x, 0, this.localPlayer.z), LERP_SPEED * dt);

    const angle = CAMERA_ANGLE;
    this.camera.position.set(
      target.x + Math.sin(angle) * CAMERA_DISTANCE,
      CAMERA_HEIGHT,
      target.z + Math.cos(angle) * CAMERA_DISTANCE
    );
    this.camera.lookAt(target.x, 0, target.z);
  }

  // ════════════════════════════════════════════════
  //  DAY/NIGHT CYCLE
  // ════════════════════════════════════════════════
  updateDayNight(dt) {
    this.dayTime = (this.dayTime + dt * 0.01) % 1; // Full cycle ~100s

    const sunAngle = this.dayTime * Math.PI * 2;
    const sunY = Math.sin(sunAngle);
    const sunX = Math.cos(sunAngle);

    this.sunLight.position.set(sunX * 40, Math.max(sunY * 40, 2), 20);
    this.sunLight.intensity = Math.max(0, sunY) * 1.2 + 0.1;

    // Colors
    const dayColor = new THREE.Color(0xfff4e6);
    const sunsetColor = new THREE.Color(0xff8844);
    const nightColor = new THREE.Color(0x334477);

    let lightColor;
    if (sunY > 0.3) lightColor = dayColor;
    else if (sunY > 0) lightColor = dayColor.clone().lerp(sunsetColor, 1 - sunY / 0.3);
    else lightColor = sunsetColor.clone().lerp(nightColor, Math.min(1, -sunY * 3));

    this.sunLight.color.copy(lightColor);

    // Sky color
    this.scene.fog.color.copy(
      sunY > 0
        ? new THREE.Color(0x87CEEB).lerp(new THREE.Color(0x2a1a4a), Math.max(0, 1 - sunY * 3))
        : new THREE.Color(0x0a0a2e)
    );
    this.renderer.setClearColor(this.scene.fog.color);

    // Ambient
    this.ambientLight.intensity = Math.max(0.15, sunY * 0.4 + 0.2);

    // HUD clock
    const hour = Math.floor(this.dayTime * 24);
    const isDay = hour >= 6 && hour < 18;
    const icon = isDay ? (hour < 10 ? '🌅' : hour < 16 ? '☀️' : '🌇') : '🌙';
    const h12 = hour % 12 || 12;
    const ampm = hour < 12 ? 'AM' : 'PM';
    document.getElementById('clock').textContent = `${icon} ${h12}:00 ${ampm}`;
  }

  // ════════════════════════════════════════════════
  //  GAME LOOP
  // ════════════════════════════════════════════════
  animate() {
    requestAnimationFrame(() => this.animate());

    const dt = Math.min(this.clock.getDelta(), 0.05);

    this.updateLocalPlayer(dt);
    this.updateRemotePlayers(dt);
    this.updateCamera(dt);
    this.updateDayNight(dt);

    this.renderer.render(this.scene, this.camera);
  }

  updateLocalPlayer(dt) {
    if (!this.localPlayer) return;

    const lp = this.localPlayer;
    const moveDir = new THREE.Vector3();

    // Camera-relative movement
    const camForward = new THREE.Vector3(-1, 0, -1).normalize();
    const camRight = new THREE.Vector3(1, 0, -1).normalize();

    if (this.input.w) moveDir.add(camForward);
    if (this.input.s) moveDir.sub(camForward);
    if (this.input.a) moveDir.sub(camRight);
    if (this.input.d) moveDir.add(camRight);

    if (moveDir.lengthSq() > 0) {
      moveDir.normalize();
      lp.x += moveDir.x * MOVE_SPEED * dt;
      lp.z += moveDir.z * MOVE_SPEED * dt;

      // Face movement direction
      lp.targetRotation = Math.atan2(moveDir.x, moveDir.z);
    }

    // Clamp to world
    const bound = 38;
    lp.x = Math.max(-bound, Math.min(bound, lp.x));
    lp.z = Math.max(-bound, Math.min(bound, lp.z));

    // Smooth rotation
    const rotDiff = lp.targetRotation - lp.rotation;
    const normalizedDiff = ((rotDiff + Math.PI) % (Math.PI * 2)) - Math.PI;
    lp.rotation += normalizedDiff * Math.min(1, ROTATE_SPEED * dt);

    // Update mesh
    lp.mesh.position.x = lp.x;
    lp.mesh.position.z = lp.z;
    lp.mesh.rotation.y = lp.rotation;

    // Walk bobbing
    if (moveDir.lengthSq() > 0) {
      lp.bobPhase += dt * 10;
      lp.mesh.position.y = Math.abs(Math.sin(lp.bobPhase)) * 0.08;
    } else {
      lp.mesh.position.y *= 0.9;
    }

    // Send position to server
    this.sendTimer += dt;
    if (this.sendTimer >= SEND_RATE) {
      this.sendTimer = 0;
      const dx = lp.x - this.lastSentPos.x;
      const dz = lp.z - this.lastSentPos.z;
      if (dx * dx + dz * dz > 0.001) {
        this.socket.emit('move', { x: lp.x, z: lp.z, rotation: lp.rotation });
        this.lastSentPos = { x: lp.x, z: lp.z };
      }
    }
  }

  updateRemotePlayers(dt) {
    this.players.forEach((p) => {
      if (p.id === this.myId) return;

      // Interpolate position
      const mesh = p.mesh;
      mesh.position.x += (p.targetX - mesh.position.x) * Math.min(1, LERP_SPEED * dt);
      mesh.position.z += (p.targetZ - mesh.position.z) * Math.min(1, LERP_SPEED * dt);

      // Interpolate rotation
      const targetRot = p.targetRotation ?? mesh.rotation.y;
      const rotDiff = targetRot - mesh.rotation.y;
      const normalizedDiff = ((rotDiff + Math.PI) % (Math.PI * 2)) - Math.PI;
      mesh.rotation.y += normalizedDiff * Math.min(1, LERP_SPEED * dt);

      // Bobbing when moving
      const dx = p.targetX - mesh.position.x;
      const dz = p.targetZ - mesh.position.z;
      if (dx * dx + dz * dz > 0.01) {
        p._bobPhase = (p._bobPhase || 0) + dt * 10;
        mesh.position.y = Math.abs(Math.sin(p._bobPhase)) * 0.08;
      } else {
        mesh.position.y *= 0.9;
      }
    });
  }

  // ════════════════════════════════════════════════
  //  UI
  // ════════════════════════════════════════════════
  updatePlayerList() {
    const container = document.getElementById('playerListItems');
    container.innerHTML = '';

    // Local player first
    if (this.localPlayer) {
      const el = document.createElement('div');
      el.className = 'player-item you';
      el.innerHTML = `<span class="player-dot" style="background:#4ECDC4"></span>${this.myName} (you)`;
      container.appendChild(el);
    }

    this.players.forEach((p) => {
      const el = document.createElement('div');
      el.className = 'player-item';
      el.innerHTML = `<span class="player-dot" style="background:${p.color}"></span>${p.name}`;
      container.appendChild(el);
    });

    const total = (this.localPlayer ? 1 : 0) + this.players.size;
    document.getElementById('playerCount').textContent = `\u{1F9A6} ${total} online`;
  }
}

// ── BOOT ──
const game = new Game();
game.init();
