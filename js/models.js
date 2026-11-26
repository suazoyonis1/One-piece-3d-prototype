import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// ------------------------------------
// BASIC HELPERS
// ------------------------------------

function makeMaterial(color) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: 0.75
  });
}

function addSphere(parent, color, position, scale) {
  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(1, 16, 12),
    makeMaterial(color)
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
    makeMaterial(color)
  );

  mesh.position.set(...position);
  mesh.castShadow = true;
  mesh.receiveShadow = true;

  parent.add(mesh);
  return mesh;
}

function addCapsule(parent, color, start, end, radius) {
  const a = new THREE.Vector3(...start);
  const b = new THREE.Vector3(...end);
  const direction = new THREE.Vector3().subVectors(b, a);
  const length = direction.length();

  const mesh = new THREE.Mesh(
    new THREE.CapsuleGeometry(
      radius,
      Math.max(0.01, length - radius * 2),
      5,
      12
    ),
    makeMaterial(color)
  );

  mesh.position.copy(a).add(b).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    direction.normalize()
  );

  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);

  return mesh;
}

// ------------------------------------
// PROCEDURAL CHARACTER FALLBACKS
// ------------------------------------

function createProceduralCharacter(type = 'pirate') {
  const root = new THREE.Group();
  const body = new THREE.Group();

  root.add(body);

  const configs = {
    luffy: {
      skin: 0xf1c27d,
      shirt: 0xdc2626,
      pants: 0x1d4ed8,
      hair: 0x171717,
      hat: true
    },

    zoro: {
      skin: 0xf1c27d,
      shirt: 0xf8fafc,
      pants: 0x14532d,
      hair: 0x16a34a
    },

    nami: {
      skin: 0xf5cba7,
      shirt: 0x38bdf8,
      pants: 0x1d4ed8,
      hair: 0xf97316
    },

    sanji: {
      skin: 0xf1c27d,
      shirt: 0x111827,
      pants: 0x111827,
      hair: 0xfacc15
    },

    marine: {
      skin: 0xf1c27d,
      shirt: 0xffffff,
      pants: 0x1e3a8a,
      hair: 0x1f2937
    },

    mayor: {
      skin: 0xe0ac69,
      shirt: 0x7c3aed,
      pants: 0x292524,
      hair: 0x78350f
    },

    pirate: {
      skin: 0xd2996c,
      shirt: 0x7f1d1d,
      pants: 0x292524,
      hair: 0x111827
    }
  };

  const colors = configs[type] || configs.pirate;

  // Body
  addSphere(
    body,
    colors.shirt,
    [0, 1.55, 0],
    [0.42, 0.55, 0.28]
  );

  // Neck
  addSphere(
    body,
    colors.skin,
    [0, 2.05, 0],
    [0.15, 0.17, 0.15]
  );

  // Head
  addSphere(
    body,
    colors.skin,
    [0, 2.35, 0],
    [0.32, 0.38, 0.3]
  );

  // Hair
  addSphere(
    body,
    colors.hair,
    [0, 2.65, -0.02],
    [0.34, 0.2, 0.32]
  );

  // Eyes
  for (const x of [-0.12, 0.12]) {
    addSphere(
      body,
      0xffffff,
      [x, 2.39, 0.27],
      [0.055, 0.07, 0.035]
    );

    addSphere(
      body,
      0x111111,
      [x, 2.39, 0.3],
      [0.025, 0.04, 0.02]
    );
  }

  // Luffy's straw hat
  if (colors.hat) {
    const brim = new THREE.Mesh(
      new THREE.CylinderGeometry(0.62, 0.62, 0.07, 24),
      makeMaterial(0xf4bd35)
    );

    brim.position.y = 2.82;
    brim.castShadow = true;
    body.add(brim);

    const hat = new THREE.Mesh(
      new THREE.CylinderGeometry(0.3, 0.38, 0.28, 24),
      makeMaterial(0xf4bd35)
    );

    hat.position.y = 2.96;
    body.add(hat);

    addBox(
      body,
      0xc62828,
      [0, 2.87, 0],
      [0.65, 0.06, 0.65]
    );
  }

  // Arms
  const arms = [];

  for (const side of [-1, 1]) {
    const arm = new THREE.Group();
    arm.position.set(side * 0.43, 1.95, 0);
    body.add(arm);

    addCapsule(
      arm,
      colors.shirt,
      [0, 0, 0],
      [side * 0.08, -0.35, 0],
      0.15
    );

    addCapsule(
      arm,
      colors.skin,
      [side * 0.08, -0.35, 0],
      [side * 0.13, -0.72, 0],
      0.12
    );

    addSphere(
      arm,
      colors.skin,
      [side * 0.13, -0.76, 0],
      [0.13, 0.13, 0.13]
    );

    arms.push(arm);
  }

  // Legs
  const legs = [];

  for (const side of [-1, 1]) {
    const leg = new THREE.Group();
    leg.position.set(side * 0.19, 1.05, 0);
    body.add(leg);

    addCapsule(
      leg,
      colors.pants,
      [0, 0, 0],
      [0, -0.4, 0],
      0.16
    );

    addCapsule(
      leg,
      colors.pants,
      [0, -0.4, 0],
      [0, -0.82, 0],
      0.13
    );

    addSphere(
      leg,
      0x713f12,
      [0, -0.9, 0.1],
      [0.19, 0.13, 0.3]
    );

    legs.push(leg);
  }

  root.userData.animate = (
    time = 0,
    speed = 0,
    state = 'idle'
  ) => {
    const moving = state === 'walk' || state === 'run';
    const amount = moving
      ? Math.sin(time * 10) * speed
      : 0;

    legs[0].rotation.x = amount;
    legs[1].rotation.x = -amount;

    arms[0].rotation.x = -amount * 0.7;
    arms[1].rotation.x = amount * 0.7;

    body.position.y = state === 'idle'
      ? Math.sin(time * 2) * 0.025
      : 0;
  };

  return root;
}

// ------------------------------------
// LOAD REAL LUFFY MODEL
// ------------------------------------

function createLuffyMesh() {
  const root = new THREE.Group();
  const fallback = createProceduralCharacter('luffy');

  root.add(fallback);

  root.userData.loaded = false;
  root.userData.loadFailed = false;

  const loader = new GLTFLoader();

  let mixer = null;
  let actions = {};
  let activeAction = null;
  let previousTime = null;

  function playAnimation(state) {
    if (!mixer) return;

    const nextAction =
      actions[state] ||
      actions.idle;

    if (!nextAction || nextAction === activeAction) {
      return;
    }

    if (activeAction) {
      activeAction.fadeOut(0.15);
    }

    nextAction.reset();
    nextAction.fadeIn(0.15);
    nextAction.play();

    activeAction = nextAction;
  }

  root.userData.animate = (
    time = 0,
    speed = 0,
    state = 'idle'
  ) => {
    if (!root.userData.loaded) {
      fallback.userData.animate?.(time, speed, state);
      return;
    }

    if (mixer) {
      const delta = previousTime === null
        ? 0
        : THREE.MathUtils.clamp(
            time - previousTime,
            0,
            0.05
          );

      mixer.update(delta);
      previousTime = time;

      playAnimation(state);
    }
  };

  // IMPORTANT: folder name uses capital L
  loader.load(
    './models/Luffy/scene.gltf',

    (gltf) => {
      const model = gltf.scene;

      // Calculate model size
      const bounds = new THREE.Box3().setFromObject(model);
      const size = bounds.getSize(new THREE.Vector3());
      const center = bounds.getCenter(new THREE.Vector3());

      // Resize model
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

      // Load animations
      if (gltf.animations && gltf.animations.length > 0) {
        mixer = new THREE.AnimationMixer(model);

        const idleClip =
          gltf.animations.find(animation =>
            /idle|stand|blink/i.test(animation.name)
          ) || gltf.animations[0];

        actions.idle = mixer.clipAction(idleClip);

        for (const animation of gltf.animations) {
          const name = animation.name.toLowerCase();

          if (/walk/.test(name)) {
            actions.walk = mixer.clipAction(animation);
          }

          if (/run|sprint/.test(name)) {
            actions.run = mixer.clipAction(animation);
          }

          if (/jump/.test(name)) {
            actions.jump = mixer.clipAction(animation);
          }

          if (/roll|dodge/.test(name)) {
            actions.dodge = mixer.clipAction(animation);
          }

          if (/punch|attack/.test(name)) {
            actions.pistol = mixer.clipAction(animation);
            actions.gatling = mixer.clipAction(animation);
          }
        }

        activeAction = actions.idle;
        activeAction.play();
      }

      console.log('Luffy model loaded successfully');
    },

    (progress) => {
      if (progress.total > 0) {
        console.log(
          'Loading Luffy:',
          Math.round(
            progress.loaded / progress.total * 100
          ) + '%'
        );
      }
    },

    (error) => {
      root.userData.loadFailed = true;

      console.error(
        'Luffy model failed to load:',
        error
      );
    }
  );

  return root;
}

// ------------------------------------
// CHARACTER EXPORT
// ------------------------------------

export function createCharacterMesh(type = 'pirate') {
  if (type === 'luffy') {
    return createLuffyMesh();
  }

  return createProceduralCharacter(type);
}

// ------------------------------------
// GOING MERRY
// ------------------------------------

export function createGoingMerryMesh() {
  const ship = new THREE.Group();

  const wood = makeMaterial(0x92400e);
  const deckMaterial = makeMaterial(0xd97706);
  const white = makeMaterial(0xf8fafc);

  // Hull
  const hull = new THREE.Mesh(
    new THREE.BoxGeometry(5.5, 2.2, 13),
    wood
  );

  hull.position.y = 1;
  ship.add(hull);

  // Deck
  const deck = new THREE.Mesh(
    new THREE.BoxGeometry(5.1, 0.2, 12.6),
    deckMaterial
  );

  deck.position.y = 2.15;
  ship.add(deck);

  // Mast
  const mast = new THREE.Mesh(
    new THREE.CylinderGeometry(0.22, 0.28, 11, 12),
    wood
  );

  mast.position.set(0, 7.2, 0.5);
  ship.add(mast);

  // Main sail
  const sail = new THREE.Mesh(
    new THREE.BoxGeometry(6.2, 5.2, 0.15),
    white
  );

  sail.position.set(0, 8.2, 0.8);
  ship.add(sail);

  // Figurehead
  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.85, 16, 16),
    white
  );

  head.position.set(0, 2.7, 7.2);
  ship.add(head);

  const figureHead = new THREE.Mesh(
    new THREE.SphereGeometry(0.35, 16, 12),
    makeMaterial(0xf4bd35)
  );

  figureHead.position.set(0, 3, 7.75);
  ship.add(figureHead);

  // Side railings
  const railingMaterial = makeMaterial(0x78350f);

  for (const side of [-1, 1]) {
    const railing = new THREE.Mesh(
      new THREE.BoxGeometry(0.15, 0.65, 10),
      railingMaterial
    );

    railing.position.set(side * 2.45, 2.55, 0);
    ship.add(railing);
  }

  // Rear railing
  const rearRail = new THREE.Mesh(
    new THREE.BoxGeometry(4.9, 0.65, 0.15),
    railingMaterial
  );

  rearRail.position.set(0, 2.55, -5.9);
  ship.add(rearRail);

  // Shadows
  ship.traverse((object) => {
    if (object.isMesh) {
      object.castShadow = true;
      object.receiveShadow = true;
    }
  });

  return ship;
}
