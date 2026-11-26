
import * as THREE from 'three';

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
  const yellow = mat(0xf4bd35);
  const red = mat(0xc62828);

  const brim = new THREE.Mesh(
    new THREE.CylinderGeometry(0.66, 0.66, 0.075, 32),
    yellow
  );

  brim.position.y = 2.91;
  brim.castShadow = true;
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
    yellow
  );

  crown.position.y = 2.92;
  crown.scale.y = 0.8;
  root.add(crown);

  const band = new THREE.Mesh(
    new THREE.CylinderGeometry(0.395, 0.395, 0.09, 24),
    red
  );

  band.position.y = 2.98;
  root.add(band);
}

function createArm(root, side, skin, shirt) {
  const arm = new THREE.Group();
  arm.position.set(side * 0.43, 1.98, 0);
  root.add(arm);

  // Shoulder and sleeve
  sphere(arm, shirt, [0, -0.08, 0], [0.19, 0.20, 0.18]);

  capsule(
    arm,
    shirt,
    [0, -0.05, 0],
    [side * 0.06, -0.30, 0],
    0.15
  );

  // Upper arm
  capsule(
    arm,
    skin,
    [side * 0.06, -0.25, 0],
    [side * 0.12, -0.55, 0],
    0.115
  );

  // Forearm
  capsule(
    arm,
    skin,
    [side * 0.12, -0.50, 0],
    [side * 0.18, -0.78, 0.02],
    0.105
  );

  // Hand
  sphere(
    arm,
    skin,
    [side * 0.18, -0.84, 0.03],
    [0.13, 0.14, 0.13]
  );

  return arm;
}

function createLeg(root, side, pants) {
  const leg = new THREE.Group();
  leg.position.set(side * 0.20, 1.05, 0);
  root.add(leg);

  // Upper leg
  capsule(
    leg,
    pants,
    [0, 0, 0],
    [0, -0.40, 0],
    0.16
  );

  // Knee
  sphere(
    leg,
    pants,
    [0, -0.40, 0],
    [0.155, 0.16, 0.16]
  );

  // Lower leg
  capsule(
    leg,
    pants,
    [0, -0.40, 0],
    [0, -0.82, 0],
    0.13
  );

  // Shoe
  sphere(
    leg,
    0x713f12,
    [0, -0.90, 0.10],
    [0.19, 0.13, 0.30]
  );

  return leg;
}

export function createCharacterMesh(type) {
  const root = new THREE.Group();

  const cfg = {
    luffy: {
      skin: 0xf1c27d,
      shirt: 0xdc2626,
      pants: 0x2563eb,
      hair: 0x24160e,
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
  }[type] || {
    skin: 0xf1c27d,
    shirt: 0xf8fafc,
    pants: 0x1e3a8a,
    hair: 0x1f2937
  };

  const { skin, shirt, pants, hair } = cfg;

  // Animated upper body
  const body = new THREE.Group();
  root.add(body);

  cylinder(body, skin, 0.14, 0.15, 0.22, [0, 2.12, 0]);

  sphere(body, shirt, [0, 1.65, 0], [0.43, 0.59, 0.29]);
  sphere(body, pants, [0, 1.12, 0], [0.37, 0.20, 0.28]);

  sphere(body, skin, [0, 2.48, 0], [0.34, 0.40, 0.31], 24);

  addFace(body, skin);
  addHair(body, hair);

  // Luffy's sash and vest detail
  if (type === 'luffy') {
    const sash = new THREE.Mesh(
      new THREE.TorusGeometry(0.30, 0.065, 8, 24),
      mat(0xfacc15)
    );

    sash.position.set(0, 1.22, 0);
    sash.rotation.x = Math.PI / 2;
    body.add(sash);

    sphere(
      body,
      0xfacc15,
      [0, 1.67, 0.275],
      [0.045, 0.35, 0.025]
    );
  }

  if (cfg.hat) {
    addStrawHat(body);
  }

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
    body.add(cap);
  }

  // Separate animated arms
  const leftArm = createArm(root, -1, skin, shirt);
  const rightArm = createArm(root, 1, skin, shirt);

  // Separate animated legs
  const leftLeg = createLeg(root, -1, pants);
  const rightLeg = createLeg(root, 1, pants);

  // Animation controller
  root.userData.animate = function(time = 0, speed = 0, state = 'idle') {
    const movement = THREE.MathUtils.clamp(speed, 0, 1);
    const isMoving = movement > 0.05;

    const running = state === 'run' || movement > 0.75;
    const jumping = state === 'jump';
    const dodging = state === 'dodge';

    const frequency = running ? 13 : 8;
    const amount = isMoving ? movement : 0;

    const swing = Math.sin(time * frequency) * amount;

    // Reset body pose
    body.rotation.x = 0;
    body.rotation.z = 0;

    // Idle breathing
    const breathing = Math.sin(time * 2.5) * 0.018;
    body.position.y = breathing;

    // Normal walking and running
    leftLeg.rotation.x = swing * 0.8;
    rightLeg.rotation.x = -swing * 0.8;

    leftArm.rotation.x = -swing * 0.65;
    rightArm.rotation.x = swing * 0.65;

    // Running body movement
    if (running && isMoving) {
      body.position.y += Math.abs(swing) * 0.045;
      body.rotation.x = -0.08;
    }

    // Jump pose
    if (jumping) {
      leftArm.rotation.x = -1.1;
      rightArm.rotation.x = -1.1;

      leftArm.rotation.z = -0.25;
      rightArm.rotation.z = 0.25;

      leftLeg.rotation.x = -0.55;
      rightLeg.rotation.x = -0.55;

      body.rotation.x = -0.08;
    }

    // Dodge pose
    if (dodging) {
      body.rotation.z = 0.22;

      leftArm.rotation.x = -0.9;
      rightArm.rotation.x = 0.9;

      leftLeg.rotation.x = -0.65;
      rightLeg.rotation.x = 0.45;
    }

    // Gentle idle arm movement
    if (!isMoving && !jumping && !dodging) {
      leftArm.rotation.z = Math.sin(time * 2) * 0.025;
      rightArm.rotation.z = -Math.sin(time * 2) * 0.025;
    }
  };

  root.scale.setScalar(cfg.scale || 1);

  return root;
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

  ship.add(hull, deck, mast, sail, head);

  return ship;
}
