import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// materials
function material(color) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: 0.75
  });
}

function addSphere(parent, color, position, scale) {
  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(1, 16, 12),
    material(color)
  );

  mesh.position.set(...position);
  mesh.scale.set(...scale);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);

  return mesh;
}

function addBox(parent, color, position, scale) {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(...scale),
    material(color)
  );

  mesh.position.set(...position);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);

  return mesh;
}

// fallback characters
function createProceduralCharacter(type = 'pirate') {
  const root = new THREE.Group();

  const colors = {
    luffy: [0xf1c27d, 0xdc2626, 0x1d4ed8, 0x171717],
    zoro: [0xf1c27d, 0xf8fafc, 0x14532d, 0x16a34a],
    nami: [0xf5cba7, 0x38bdf8, 0x1d4ed8, 0xf97316],
    sanji: [0xf1c27d, 0x111827, 0x111827, 0xfacc15],
    marine: [0xf1c27d, 0xffffff, 0x1e3a8a, 0x1f2937],
    pirate: [0xd2996c, 0x7f1d1d, 0x292524, 0x111827]
  };

  const [skin, shirt, pants, hair] =
    colors[type] || colors.pirate;

  const body = new THREE.Group();
  root.add(body);

  addSphere(body, shirt, [0, 1.55, 0], [0.42, 0.55, 0.28]);
  addSphere(body, pants, [0, 0.95, 0], [0.35, 0.22, 0.25]);
  addSphere(body, skin, [0, 2.35, 0], [0.32, 0.38, 0.3]);
  addSphere(body, hair, [0, 2.65, -0.02], [0.34, 0.2, 0.32]);

  // eyes
  for (const x of [-0.12, 0.12]) {
    addSphere(body, 0xffffff, [x, 2.39, 0.27], [0.055, 0.07, 0.035]);
    addSphere(body, 0x111111, [x, 2.39, 0.3], [0.025, 0.04, 0.02]);
  }

  // straw hat
  if (type === 'luffy') {
    const brim = new THREE.Mesh(
      new THREE.CylinderGeometry(0.62, 0.62, 0.07, 24),
      material(0xf4bd35)
    );
    brim.position.y = 2.82;
    body.add(brim);

    const hat = new THREE.Mesh(
      new THREE.CylinderGeometry(0.3, 0.38, 0.28, 24),
      material(0xf4bd35)
    );
    hat.position.y = 2.96;
    body.add(hat);

    addBox(body, 0xc62828, [0, 2.87, 0], [0.65, 0.06, 0.65]);
  }

  // arms
  const arms = [];

  for (const side of [-1, 1]) {
    const arm = new THREE.Group();
    arm.position.set(side * 0.48, 1.85, 0);
    body.add(arm);

    addSphere(arm, shirt, [0, -0.15, 0], [0.17, 0.25, 0.17]);
    addSphere(arm, skin, [side * 0.04, -0.48, 0], [0.13, 0.3, 0.13]);
    arms.push(arm);
  }

  // legs
  const legs = [];

  for (const side of [-1, 1]) {
    const leg = new THREE.Group();
    leg.position.set(side * 0.19, 0.85, 0);
    body.add(leg);

    addSphere(leg, pants, [0, -0.22, 0], [0.16, 0.3, 0.16]);
    addSphere(leg, pants, [0, -0.55, 0], [0.14, 0.25, 0.14]);
    addSphere(leg, 0x713f12, [0, -0.78, 0.08], [0.18, 0.11, 0.25]);

    legs.push(leg);
  }

  root.userData.animate = (time = 0, speed = 0, state = 'idle') => {
    const moving = state === 'walk' || state === 'run';
    const amount = moving ? Math.sin(time * 10) * speed : 0;

    legs[0].rotation.x = amount;
    legs[1].rotation.x = -amount;
    arms[0].rotation.x = -amount * 0.7;
    arms[1].rotation.x = amount * 0.7;

    if (state === 'idle') {
      body.position.y = Math.sin(time * 2) * 0.02;
    } else {
      body.position.y = 0;
    }
  };

  return root;
}

// load your real Luffy model
function createLuffyMesh() {
  const root = new THREE.Group();
  const fallback = createProceduralCharacter('luffy');

  root.add(fallback);
  root.userData.loaded = false;
  root.userData.loadFailed = false;

  const loader = new GLTFLoader();

  let mixer = null;
  let previousTime = null;

  loader.load(
    './models/luffy/scene.gltf',

    (gltf) => {
      const model = gltf.scene;

      // automatically resize and center the model
      const bounds = new THREE.Box3().setFromObject(model);
      const size = bounds.getSize(new THREE.Vector3());
      const center = bounds.getCenter(new THREE.Vector3());

      const targetHeight = 2.8;
      const scale = targetHeight / (size.y || 1);

      model.scale.setScalar(scale);
      model.position.set(
        -center.x * scale,
        -bounds.min.y * scale,
        -center.z * scale
      );

      model.traverse((object) => {
        if (object.isMesh) {
          object.castShadow = true;
          object.receiveShadow = true;
        }
      });

      root.remove(fallback);
      root.add(model);
      root.userData.loaded = true;

      if (gltf.animations.length > 0) {
        mixer = new THREE.AnimationMixer(model);

        const idle =
          gltf.animations.find(a => /idle|stand/i.test(a.name)) ||
          gltf.animations[0];

        mixer.clipAction(idle).play();
      }

      console.log('Luffy model loaded successfully');
    },

    (progress) => {
      if (progress.total > 0) {
        console.log(
          'Loading Luffy:',
          Math.round(progress.loaded / progress.total * 100) + '%'
        );
      }
    },

    (error) => {
      root.userData.loadFailed = true;
      console.error('Luffy model failed to load:', error);
    }
  );

  root.userData.animate = (time = 0, speed = 0, state = 'idle') => {
    if (!root.userData.loaded) {
      fallback.userData.animate?.(time, speed, state);
      return;
    }

    if (mixer) {
      const delta = previousTime === null
        ? 0
        : THREE.MathUtils.clamp(time - previousTime, 0, 0.05);

      mixer.update(delta);
      previousTime = time;
    }
  };

  return root;
}

// character export
export function createCharacterMesh(type = 'pirate') {
  if (type === 'luffy') {
    return createLuffyMesh();
  }

  return createProceduralCharacter(type);
}

// going merry ship
export function createGoingMerryMesh() {
  const ship = new THREE.Group();

  const wood = material(0x92400e);
  const deckMaterial = material(0xd97706);
  const white = material(0xf8fafc);

  const hull = new THREE.Mesh(
    new THREE.BoxGeometry(5.5, 2.2, 13),
    wood
  );
  hull.position.y = 1;
  ship.add(hull);

  const deck = new THREE.Mesh(
    new THREE.BoxGeometry(5.1, 0.2, 12.6),
    deckMaterial
  );
  deck.position.y = 2.15;
  ship.add(deck);

  const mast = new THREE.Mesh(
    new THREE.CylinderGeometry(0.22, 0.28, 11, 12),
    wood
  );
  mast.position.set(0, 7.2, 0.5);
  ship.add(mast);

  const sail = new THREE.Mesh(
    new THREE.BoxGeometry(6.2, 5.2, 0.15),
    white
  );
  sail.position.set(0, 8.2, 0.8);
  ship.add(sail);

  // front figurehead
  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.85, 16, 16),
    white
  );
  head.position.set(0, 2.7, 7.2);
  ship.add(head);

  const figureHead = new THREE.Mesh(
    new THREE.SphereGeometry(0.35, 16, 12),
    material(0xf4bd35)
  );
  figureHead.position.set(0, 3, 7.75);
  ship.add(figureHead);

  // railings
  const railingMaterial = material(0x78350f);

  for (const side of [-1, 1]) {
    const railing = new THREE.Mesh(
      new THREE.BoxGeometry(0.15, 0.65, 10),
      railingMaterial
    );
    railing.position.set(side * 2.45, 2.55, 0);
    ship.add(railing);
  }

  const rearRail = new THREE.Mesh(
    new THREE.BoxGeometry(4.9, 0.65, 0.15),
    railingMaterial
  );
  rearRail.position.set(0, 2.55, -5.9);
  ship.add(rearRail);

  ship.traverse((object) => {
    if (object.isMesh) {
      object.castShadow = true;
      object.receiveShadow = true;
    }
  });

  return ship;
}
