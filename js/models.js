
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

function mat(color, roughness = 0.7) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness,
    metalness: 0
  });
}

function sphere(parent, color, position, scale, segments = 20) {
  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(1, segments, segments),
    mat(color)
  );

  mesh.position.set(...position);
  mesh.scale.set(...scale);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);

  return mesh;
}

function capsule(parent, color, start, end, radius, segments = 12) {
  const a = new THREE.Vector3(...start);
  const b = new THREE.Vector3(...end);
  const direction = new THREE.Vector3().subVectors(b, a);
  const length = direction.length();

  const mesh = new THREE.Mesh(
    new THREE.CapsuleGeometry(
      radius,
      Math.max(0.01, length - radius * 2),
      5,
      segments
    ),
    mat(color)
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

function cylinder(parent, color, radiusTop, radiusBottom, height, position) {
  const mesh = new THREE.Mesh(
    new THREE.CylinderGeometry(radiusTop, radiusBottom, height, 20),
    mat(color)
  );

  mesh.position.set(...position);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);

  return mesh;
}

function addFace(root, skinColor) {
  for (const x of [-0.16, 0.16]) {
    sphere(root, 0xffffff, [x, 2.56, 0.305], [0.075, 0.09, 0.035], 12);
    sphere(root, 0x171717, [x, 2.56, 0.338], [0.035, 0.055, 0.018], 12);
    sphere(root, 0xffffff, [x - 0.012, 2.58, 0.355], [0.012, 0.015, 0.008], 8);
  }

  sphere(root, skinColor, [0, 2.43, 0.33], [0.055, 0.065, 0.07], 12);

  const mouth = new THREE.Mesh(
    new THREE.TorusGeometry(0.065, 0.012, 6, 16, Math.PI),
    mat(0x6b3028)
  );

  mouth.position.set(0, 2.36, 0.31);
  mouth.rotation.z = Math.PI;
  root.add(mouth);
}

function addHair(root, color) {
  sphere(root, color, [0, 2.77, -0.015], [0.39, 0.20, 0.37]);

  for (let i = 0; i < 5; i++) {
    const x = (i - 2) * 0.13;
    sphere(root, color, [x, 2.68, 0.20], [0.12, 0.17, 0.13]);
  }
}

function addStrawHat(root) {
  const brim = new THREE.Mesh(
    new THREE.CylinderGeometry(0.66, 0.66, 0.075, 32),
    mat(0xf4bd35)
  );

  brim.position.y = 2.91;
  brim.castShadow = true;
  brim.receiveShadow = true;
  root.add(brim);

  const crown = new THREE.Mesh(
    new THREE.SphereGeometry(
      0.39,
      24,
      16,
      0,
      Math.PI * 2,
      0,
      Math.PI / 2
    ),
    mat(0xf4bd35)
  );

  crown.position.y = 2.92;
  crown.scale.y = 0.8;
  crown.castShadow = true;
  root.add(crown);

  const band = new THREE.Mesh(
    new THREE.CylinderGeometry(0.395, 0.395, 0.09, 24),
    mat(0xc62828)
  );

  band.position.y = 2.98;
  band.castShadow = true;
  root.add(band);
}

function createArm(parent, side, skin, shirt) {
  const arm = new THREE.Group();
  arm.position.set(side * 0.43, 1.98, 0);
  parent.add(arm);

  sphere(arm, shirt, [0, -0.08, 0], [0.19, 0.20, 0.18]);
  capsule(arm, shirt, [0, -0.05, 0], [side * 0.06, -0.30, 0], 0.15);
  capsule(arm, skin, [side * 0.06, -0.25, 0], [side * 0.12, -0.55, 0], 0.115);
  capsule(arm, skin, [side * 0.12, -0.50, 0], [side * 0.18, -0.78, 0.02], 0.105);
  sphere(arm, skin, [side * 0.18, -0.84, 0.03], [0.13, 0.14, 0.13]);

  return arm;
}

function createLeg(parent, side, pants) {
  const leg = new THREE.Group();
  leg.position.set(side * 0.20, 1.05, 0);
  parent.add(leg);

  capsule(leg, pants, [0, 0, 0], [0, -0.40, 0], 0.16);
  sphere(leg, pants, [0, -0.40, 0], [0.155, 0.16, 0.16]);
  capsule(leg, pants, [0, -0.40, 0], [0, -0.82, 0], 0.13);
  sphere(leg, 0x713f12, [0, -0.90, 0.10], [0.19, 0.13, 0.30]);

  return leg;
}

// Creates all procedural characters, including the Luffy fallback.
function createProceduralCharacter(type) {
  const root = new THREE.Group();

  const pivot = new THREE.Group();
  pivot.position.y = 1.55;
  root.add(pivot);

  const character = new THREE.Group();
  character.position.y = -1.55;
  pivot.add(character);

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
    mayor: {
      skin: 0xe0ac69,
      shirt: 0x65a30d,
      pants: 0x78350f,
      hair: 0xe2e8f0
    },
    marine: {
      skin: 0xf1c27d,
      shirt: 0xf8fafc,
      pants: 0x1e3a8a,
      hair: 0x1f2937,
      cap: true
    },
    morgan: {
      skin: 0xe0ac69,
      shirt: 0x1e293b,
      pants: 0x0f172a,
      hair: 0xfacc15,
      scale: 1.45
    },
    pirate: {
      skin: 0xd2996c,
      shirt: 0x7f1d1d,
      pants: 0x292524,
      hair: 0x111827
    }
  };

  const cfg = configs[type] || configs.pirate;
  const { skin, shirt, pants, hair } = cfg;

  const body = new THREE.Group();
  character.add(body);

  cylinder(body, skin, 0.14, 0.15, 0.22, [0, 2.12, 0]);
  sphere(body, shirt, [0, 1.65, 0], [0.43, 0.59, 0.29]);
  sphere(body, pants, [0, 1.12, 0], [0.37, 0.20, 0.28]);
  sphere(body, skin, [0, 2.48, 0], [0.34, 0.40, 0.31], 24);

  addFace(body, skin);
  addHair(body, hair);

  if (cfg.cap) {
    const cap = new THREE.Mesh(
      new THREE.SphereGeometry(
        0.36,
        20,
        12,
        0,
        Math.PI * 2,
        0,
        Math.PI / 2
      ),
      mat(0xffffff)
    );

    cap.position.y = 2.82;
    cap.castShadow = true;
    body.add(cap);
  }

  if (cfg.hat) {
    addStrawHat(body);
  }

  const leftArm = createArm(character, -1, skin, shirt);
  const rightArm = createArm(character, 1, skin, shirt);
  const leftLeg = createLeg(character, -1, pants);
  const rightLeg = createLeg(character, 1, pants);

  root.userData.animate = function(
    time = 0,
    speed = 0,
    state = 'idle',
    progress = 0
  ) {
    const movement = THREE.MathUtils.clamp(speed, 0, 1);
    const running = state === 'run';
    const jumping = state === 'jump';
    const dodging = state === 'dodge';
    const pistol = state === 'pistol';
    const gatling = state === 'gatling';

    const swing = Math.sin(time * (running ? 13 : 8)) * movement;

    pivot.rotation.set(0, 0, 0);
    body.rotation.set(0, 0, 0);

    leftArm.rotation.set(0, 0, 0);
    rightArm.rotation.set(0, 0, 0);
    leftLeg.rotation.set(0, 0, 0);
    rightLeg.rotation.set(0, 0, 0);

    body.position.y = Math.sin(time * 2.5) * 0.018;

    if (state === 'walk' || running) {
      leftLeg.rotation.x = swing * 0.8;
      rightLeg.rotation.x = -swing * 0.8;
      leftArm.rotation.x = -swing * 0.65;
      rightArm.rotation.x = swing * 0.65;

      if (running) {
        body.rotation.x = -0.08;
        body.position.y += Math.abs(swing) * 0.045;
      }
    }

    if (pistol) {
      const p = THREE.MathUtils.clamp(progress, 0, 1);

      if (p < 0.30) {
        const pull = p / 0.30;
        rightArm.rotation.x = 0.85 * pull;
        rightArm.rotation.z = -0.35 * pull;
        body.rotation.y = -0.12 * pull;
      } else if (p < 0.62) {
        const punch = (p - 0.30) / 0.32;
        rightArm.rotation.x = 0.85 - punch * 2.55;
        rightArm.rotation.z = -0.35 + punch * 0.35;
        body.rotation.y = -0.12 + punch * 0.25;
        body.rotation.x = -0.10;
      } else {
        const recover = (p - 0.62) / 0.38;
        rightArm.rotation.x = -1.70 * (1 - recover);
        body.rotation.y = 0.13 * (1 - recover);
      }

      leftArm.rotation.x = 0.35;
      leftLeg.rotation.x = -0.10;
      rightLeg.rotation.x = 0.10;
    }

    if (gatling) {
      const rapid = Math.sin(time * 42);

      rightArm.rotation.x = rapid > 0 ? -1.65 : 0.35;
      leftArm.rotation.x = rapid < 0 ? -1.65 : 0.35;

      rightArm.rotation.z = -0.12;
      leftArm.rotation.z = 0.12;

      body.rotation.x = -0.12;
      body.rotation.y = Math.sin(time * 18) * 0.06;

      leftLeg.rotation.x = Math.sin(time * 18) * 0.12;
      rightLeg.rotation.x = -Math.sin(time * 18) * 0.12;
    }

    if (jumping) {
      leftArm.rotation.x = -1.1;
      rightArm.rotation.x = -1.1;
      leftArm.rotation.z = -0.25;
      rightArm.rotation.z = 0.25;
      leftLeg.rotation.x = -0.55;
      rightLeg.rotation.x = -0.55;
      body.rotation.x = -0.08;
    }

    if (dodging) {
      const p = THREE.MathUtils.clamp(progress, 0, 1);
      const eased = p * p * (3 - 2 * p);

      pivot.rotation.x = Math.PI * 2 * eased;

      leftArm.rotation.x = -0.65;
      rightArm.rotation.x = -0.65;
      leftArm.rotation.z = -0.35;
      rightArm.rotation.z = 0.35;
      leftLeg.rotation.x = 0.35;
      rightLeg.rotation.x = 0.35;
    }

    if (state === 'idle') {
      leftArm.rotation.z = Math.sin(time * 2) * 0.025;
      rightArm.rotation.z = -Math.sin(time * 2) * 0.025;
    }
  };

  root.scale.setScalar(cfg.scale || 1);

  return root;
}

// Loads the real Luffy model, while keeping a visible fallback.
function createLuffyMesh() {
  const root = new THREE.Group();
  const fallback = createProceduralCharacter('luffy');
  const loader = new GLTFLoader();

  root.add(fallback);
  root.userData.loaded = false;
  root.userData.loadFailed = false;

  let mixer = null;
  let activeAction = null;
  let actions = {};
  let previousTime = null;

  function chooseAnimation(state) {
    if (!mixer) return;

    const patterns = {
      idle: /idle|stand/i,
      walk: /walk/i,
      run: /run|sprint/i,
      jump: /jump/i,
      dodge: /roll|dodge/i,
      pistol: /punch|attack/i,
      gatling: /attack|punch|fight/i
    };

    const pattern = patterns[state] || patterns.idle;
    const nextAction = actions[state] || actions.idle;

    if (!nextAction) return;
    if (activeAction === nextAction) return;

    if (activeAction) {
      activeAction.fadeOut(0.15);
    }

    nextAction.reset();
    nextAction.fadeIn(0.15);
    nextAction.play();

    activeAction = nextAction;
  }

  root.userData.animate = function(
    time = 0,
    speed = 0,
    state = 'idle',
    progress = 0
  ) {
    if (!root.userData.loaded) {
      fallback.userData.animate?.(time, speed, state, progress);
      return;
    }

    if (mixer) {
      const delta = previousTime === null
        ? 0
        : THREE.MathUtils.clamp(time - previousTime, 0, 0.05);

      mixer.update(delta);
      previousTime = time;

      chooseAnimation(state);
    }
  };

  loader.load(
    './models/luffy/scene.gltf',

    (gltf) => {
      const model = gltf.scene;

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

      if (gltf.animations && gltf.animations.length > 0) {
        mixer = new THREE.AnimationMixer(model);

        const idleClip =
          gltf.animations.find(animation =>
            /idle|stand/i.test(animation.name)
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
          Math.round(progress.loaded / progress.total * 100) + '%'
        );
      }
    },

    (error) => {
      root.userData.loadFailed = true;
      console.error('Luffy model failed to load. Using fallback:', error);
    }
  );

  return root;
}

export function createCharacterMesh(type) {
  if (type === 'luffy') {
    return createLuffyMesh();
  }

  return createProceduralCharacter(type);
}

export function createGoingMerryMesh() {
  const ship = new THREE.Group();

  const hull = new THREE.Mesh(
    new THREE.BoxGeometry(5.5, 2.2, 13),
    mat(0x92400e)
  );

  hull.position.y = 1.0;

  const deck = new THREE.Mesh(
    new THREE.BoxGeometry(5.1, 0.2, 12.6),
    mat(0xd97706)
  );

  deck.position.y = 2.15;

  const mast = new THREE.Mesh(
    new THREE.CylinderGeometry(0.22, 0.28, 11, 12),
    mat(0x78350f)
  );

  mast.position.set(0, 7.2, 0.5);

  const sail = new THREE.Mesh(
    new THREE.BoxGeometry(6.2, 5.2, 0.15),
    mat(0xf8fafc)
  );

  sail.position.set(0, 8.2, 0.8);

  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.85, 16, 16),
    mat(0xf8fafc)
  );

  head.position.set(0, 2.7, 7.2);

  const figureHead = new THREE.Mesh(
    new THREE.SphereGeometry(0.35, 16, 12),
    mat(0xf4bd35)
  );

  figureHead.position.set(0, 3.0, 7.75);

  const railingMaterial = mat(0x78350f);

  const railings = [];

  for (const side of [-1, 1]) {
    const railing = new THREE.Mesh(
      new THREE.BoxGeometry(0.15, 0.65, 10),
      railingMaterial
    );

    railing.position.set(side * 2.45, 2.55, 0);
    railings.push(railing);
  }

  const rearRail = new THREE.Mesh(
    new THREE.BoxGeometry(4.9, 0.65, 0.15),
    railingMaterial
  );

  rearRail.position.set(0, 2.55, -5.9);

  ship.add(
    hull,
    deck,
    mast,
    sail,
    head,
    figureHead,
    ...railings,
    rearRail
  );

  ship.traverse((object) => {
    if (object.isMesh) {
      object.castShadow = true;
      object.receiveShadow = true;
    }
  });

  return ship;
}
