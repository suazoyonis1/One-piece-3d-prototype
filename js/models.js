
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// ========================================
// BASIC HELPERS
// ========================================

function makeMaterial(color, roughness = 0.75) {
  return new THREE.MeshStandardMaterial({ color, roughness });
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

// ========================================
// PROCEDURAL CHARACTER FALLBACK
// ========================================

function createProceduralCharacter(type = 'pirate') {
  const root = new THREE.Group();
  const colors = {
    luffy: [0xf1c27d, 0xdc2626, 0x1d4ed8, 0x171717],
    zoro: [0xf1c27d, 0xf8fafc, 0x14532d, 0x16a34a],
    nami: [0xf5cba7, 0x38bdf8, 0x1d4ed8, 0xf97316],
    sanji: [0xf1c27d, 0x111827, 0x111827, 0xfacc15],
    marine: [0xf1c27d, 0xffffff, 0x1e3a8a, 0x1f2937],
    mayor: [0xe0ac69, 0x65a30d, 0x78350f, 0xe2e8f0],
    morgan: [0xe0ac69, 0x1e293b, 0x0f172a, 0xfacc15],
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

  for (const x of [-0.12, 0.12]) {
    addSphere(body, 0xffffff, [x, 2.39, 0.27], [0.055, 0.07, 0.035]);
    addSphere(body, 0x111111, [x, 2.39, 0.30], [0.025, 0.04, 0.02]);
  }

  if (type === 'luffy') {
    const brim = new THREE.Mesh(
      new THREE.CylinderGeometry(0.62, 0.62, 0.07, 24),
      makeMaterial(0xf4bd35)
    );
    brim.position.y = 2.82;
    body.add(brim);

    const hat = new THREE.Mesh(
      new THREE.CylinderGeometry(0.3, 0.38, 0.28, 24),
      makeMaterial(0xf4bd35)
    );
    hat.position.y = 2.96;
    body.add(hat);

    addBox(body, 0xc62828, [0, 2.87, 0], [0.65, 0.06, 0.65]);
  }

  const arms = [];
  const legs = [];

  for (const side of [-1, 1]) {
    const arm = new THREE.Group();
    arm.position.set(side * 0.48, 1.85, 0);
    body.add(arm);

    addSphere(arm, shirt, [0, -0.15, 0], [0.17, 0.25, 0.17]);
    addSphere(arm, skin, [side * 0.04, -0.48, 0], [0.13, 0.3, 0.13]);

    arms.push(arm);

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
    const swing = moving ? Math.sin(time * 10) * speed : 0;

    legs[0].rotation.x = swing;
    legs[1].rotation.x = -swing;
    arms[0].rotation.x = -swing * 0.7;
    arms[1].rotation.x = swing * 0.7;

    body.position.y = state === 'idle'
      ? Math.sin(time * 2) * 0.02
      : 0;
  };

  return root;
}

// ========================================
// LUFFY MODEL AND SKELETON
// ========================================

function createLuffyMesh() {
  const root = new THREE.Group();
  const fallback = createProceduralCharacter('luffy');

  root.add(fallback);
  root.userData.loaded = false;
  root.userData.loadFailed = false;

  const manager = new THREE.LoadingManager();

  manager.setURLModifier((url) => {
    return url.replace(/\/textures\//g, '/texture/');
  });

  const loader = new GLTFLoader(manager);

  let mixer = null;
  let previousTime = null;
  let bones = {};

  const X_AXIS = new THREE.Vector3(1, 0, 0);
  const Y_AXIS = new THREE.Vector3(0, 1, 0);
  const Z_AXIS = new THREE.Vector3(0, 0, 1);

  function findBone(model, pattern) {
    let found = null;

    model.traverse((object) => {
      if (
        (object.isBone || object.type === 'Bone') &&
        pattern.test(object.name)
      ) {
        found = object;
      }
    });

    return found;
  }

  function saveBone(bone) {
    if (!bone) return null;

    return {
      bone,
      original: bone.quaternion.clone()
    };
  }

  function rotateBone(saved, axis, amount) {
    if (!saved) return;

    const offset = new THREE.Quaternion()
      .setFromAxisAngle(axis, amount);

    saved.bone.quaternion
      .copy(saved.original)
      .multiply(offset);
  }

  function rotateBoneMultiple(saved, rotations) {
    if (!saved) return;

    const result = saved.original.clone();

    for (const rotation of rotations) {
      const offset = new THREE.Quaternion()
        .setFromAxisAngle(rotation.axis, rotation.amount);

      result.multiply(offset);
    }

    saved.bone.quaternion.copy(result);
  }

  // ========================================
  // FIND THE ACTUAL LUFFY BONES
  // ========================================

  function setupBones(model) {
    bones.leftThigh = saveBone(
      findBone(model, /thighL_/i)
    );

    bones.rightThigh = saveBone(
      findBone(model, /thighR_/i)
    );

    bones.leftKnee = saveBone(
      findBone(model, /kneeL_/i)
    );

    bones.rightKnee = saveBone(
      findBone(model, /kneeR_/i)
    );

    bones.leftShoulder = saveBone(
      findBone(model, /shoulder_1L_/i)
    );

    bones.rightShoulder = saveBone(
      findBone(model, /shoulder_1R_/i)
    );

    bones.leftElbow = saveBone(
      findBone(model, /elbowL_/i)
    );

    bones.rightElbow = saveBone(
      findBone(model, /elbowR_/i)
    );

    bones.spine = saveBone(
      findBone(model, /spine_upper_/i)
    );

    const found = Object.keys(bones).filter(
      key => bones[key] !== null
    );

    console.log('LUFFY ANIMATION BONES FOUND:', found);
    console.log('LUFFY ANIMATION BONE COUNT:', found.length);

    // FIND FOOT, ANKLE AND TOE BONES
    model.traverse((object) => {
      if (
        object.isBone &&
        /foot|ankle|toe/i.test(object.name)
      ) {
        console.log('LUFFY FOOT BONE:', object.name);
      }
    });

    for (const [name, bone] of Object.entries(bones)) {
      if (!bone) {
        console.warn('Missing Luffy bone:', name);
      }
    }
  }

  // ========================================
  // WALKING AND RUNNING ANIMATION
  // ========================================

  function animateSkeleton(time, state, speed, progress) {
    const moving = state === 'walk' || state === 'run';
    const running = state === 'run';

    const stride = running ? 11 : 8;
    const amount = moving ? Math.sin(time * stride) : 0;
    const strength = moving ? (running ? 0.85 : 0.55) : 0;

    rotateBone(
      bones.leftThigh,
      X_AXIS,
      amount * strength
    );

    rotateBone(
      bones.rightThigh,
      X_AXIS,
      -amount * strength
    );

    const leftKneeBend = moving
      ? Math.max(0, Math.sin(time * stride + Math.PI / 2)) * 0.55
      : 0;

    const rightKneeBend = moving
      ? Math.max(0, Math.sin(time * stride - Math.PI / 2)) * 0.55
      : 0;

    rotateBone(bones.leftKnee, X_AXIS, leftKneeBend);
    rotateBone(bones.rightKnee, X_AXIS, rightKneeBend);

    const armSwing = moving ? amount * strength * 0.35 : 0;

    rotateBoneMultiple(bones.leftShoulder, [
      { axis: Z_AXIS, amount: 1.15 },
      { axis: X_AXIS, amount: armSwing }
    ]);

    rotateBoneMultiple(bones.rightShoulder, [
      { axis: Z_AXIS, amount: -1.15 },
      { axis: X_AXIS, amount: -armSwing }
    ]);

    rotateBone(
      bones.leftElbow,
      X_AXIS,
      moving ? 0.25 + Math.max(0, amount) * 0.2 : 0.12
    );

    rotateBone(
      bones.rightElbow,
      X_AXIS,
      moving ? 0.25 + Math.max(0, -amount) * 0.2 : 0.12
    );

    rotateBone(
      bones.spine,
      X_AXIS,
      moving ? -0.06 : 0
    );

    if (state === 'jump') {
      rotateBone(bones.leftThigh, X_AXIS, -0.55);
      rotateBone(bones.rightThigh, X_AXIS, -0.55);

      rotateBoneMultiple(bones.leftShoulder, [
        { axis: Z_AXIS, amount: 0.45 },
        { axis: X_AXIS, amount: -0.5 }
      ]);

      rotateBoneMultiple(bones.rightShoulder, [
        { axis: Z_AXIS, amount: -0.45 },
        { axis: X_AXIS, amount: 0.5 }
      ]);
    }

    if (state === 'pistol') {
      const punch = Math.sin(
        Math.PI * Math.min(1, progress)
      );

      rotateBoneMultiple(bones.rightShoulder, [
        { axis: Z_AXIS, amount: -0.5 },
        { axis: X_AXIS, amount: 1.1 * punch }
      ]);

      rotateBone(
        bones.rightElbow,
        X_AXIS,
        -0.3 * punch
      );
    }

    if (state === 'gatling') {
      const rapid = Math.sin(time * 35);

      rotateBoneMultiple(bones.leftShoulder, [
        { axis: Z_AXIS, amount: 0.7 },
        { axis: X_AXIS, amount: rapid * 0.8 }
      ]);

      rotateBoneMultiple(bones.rightShoulder, [
        { axis: Z_AXIS, amount: -0.7 },
        { axis: X_AXIS, amount: -rapid * 0.8 }
      ]);
    }
  }

  // ========================================
  // ANIMATION UPDATE
  // ========================================

  root.userData.animate = (
    time = 0,
    speed = 0,
    state = 'idle',
    progress = 0
  ) => {
    if (!root.userData.loaded) {
      fallback.userData.animate?.(time, speed, state, progress);
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
    }

    animateSkeleton(time, state, speed, progress);
  };

  // ========================================
  // LOAD MODEL
  // ========================================

  loader.load(
    './models/Luffy/scene.gltf',

    (gltf) => {
      const model = gltf.scene;

      const bounds = new THREE.Box3().setFromObject(model);
      const size = bounds.getSize(new THREE.Vector3());
      const center = bounds.getCenter(new THREE.Vector3());

      const scale = 2.8 / (size.y || 1);
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

      setupBones(model);

      root.remove(fallback);
      root.add(model);

      root.userData.loaded = true;

      if (gltf.animations && gltf.animations.length > 0) {
        mixer = new THREE.AnimationMixer(model);

        const blink = gltf.animations.find(
          animation => /blink/i.test(animation.name)
        );

        if (blink) {
          mixer.clipAction(blink).play();
        }
      }

      console.log('Luffy model and skeleton loaded');
    },

    undefined,

    (error) => {
      root.userData.loadFailed = true;
      console.error('Luffy model failed to load:', error);
    }
  );

  return root;
}

// ========================================
// CHARACTER EXPORT
// ========================================

export function createCharacterMesh(type = 'pirate') {
  if (type === 'luffy') {
    return createLuffyMesh();
  }

  return createProceduralCharacter(type);
}

// ========================================
// GOING MERRY
// ========================================

export function createGoingMerryMesh() {
  const ship = new THREE.Group();
  const wood = makeMaterial(0x92400e);
  const deckMaterial = makeMaterial(0xd97706);
  const white = makeMaterial(0xf8fafc);

  const hull = new THREE.Mesh(
    new THREE.BoxGeometry(5.5, 2.2, 13),
    wood
  );

  hull.position.y = 1;

  const deck = new THREE.Mesh(
    new THREE.BoxGeometry(5.1, 0.2, 12.6),
    deckMaterial
  );

  deck.position.y = 2.15;

  const mast = new THREE.Mesh(
    new THREE.CylinderGeometry(0.22, 0.28, 11, 12),
    wood
  );

  mast.position.set(0, 7.2, 0.5);

  const sail = new THREE.Mesh(
    new THREE.BoxGeometry(6.2, 5.2, 0.15),
    white
  );

  sail.position.set(0, 8.2, 0.8);

  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.85, 16, 16),
    white
  );

  head.position.set(0, 2.7, 7.2);

  const figureHead = new THREE.Mesh(
    new THREE.SphereGeometry(0.35, 16, 12),
    makeMaterial(0xf4bd35)
  );

  figureHead.position.set(0, 3, 7.75);

  const railingMaterial = makeMaterial(0x78350f);
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
