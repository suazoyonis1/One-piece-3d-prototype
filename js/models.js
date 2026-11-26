
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
    new THREE.CapsuleGeometry(radius, Math.max(0.01, length - radius * 2), 5, segments),
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
  // Eyes
  for (const x of [-0.16, 0.16]) {
    sphere(root, 0xffffff, [x, 2.56, 0.305], [0.075, 0.09, 0.035], 12);
    sphere(root, 0x171717, [x, 2.56, 0.338], [0.035, 0.055, 0.018], 12);
    sphere(root, 0xffffff, [x - 0.012, 2.58, 0.355], [0.012, 0.015, 0.008], 8);
  }

  // Nose
  sphere(root, skinColor, [0, 2.43, 0.33], [0.055, 0.065, 0.07], 12);

  // Mouth
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
    new THREE.SphereGeometry(0.39, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2),
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

  // Neck
  cylinder(root, skin, 0.14, 0.15, 0.22, [0, 2.12, 0]);

  // Rounded torso
  sphere(root, shirt, [0, 1.65, 0], [0.43, 0.59, 0.29]);

  // Waist
  sphere(root, pants, [0, 1.12, 0], [0.37, 0.20, 0.28]);

  // Legs
  capsule(root, pants, [-0.20, 0.98, 0], [-0.22, 0.32, 0], 0.16);
  capsule(root, pants, [0.20, 0.98, 0], [0.22, 0.32, 0], 0.16);

  // Knees
  sphere(root, pants, [-0.22, 0.42, 0], [0.16, 0.17, 0.16]);
  sphere(root, pants, [0.22, 0.42, 0], [0.16, 0.17, 0.16]);

  // Shoes
  sphere(root, 0x713f12, [-0.22, 0.14, 0.09], [0.19, 0.13, 0.30]);
  sphere(root, 0x713f12, [0.22, 0.14, 0.09], [0.19, 0.13, 0.30]);

  // Arms
  capsule(root, skin, [-0.43, 1.98, 0], [-0.62, 1.48, 0.02], 0.115);
  capsule(root, skin, [0.43, 1.98, 0], [0.62, 1.48, 0.02], 0.115);

  // Sleeves
  capsule(root, shirt, [-0.43, 1.99, 0], [-0.49, 1.79, 0], 0.15);
  capsule(root, shirt, [0.43, 1.99, 0], [0.49, 1.79, 0], 0.15);

  // Hands
  sphere(root, skin, [-0.62, 1.42, 0.03], [0.13, 0.15, 0.13]);
  sphere(root, skin, [0.62, 1.42, 0.03], [0.13, 0.15, 0.13]);

  // Head
  sphere(root, skin, [0, 2.48, 0], [0.34, 0.40, 0.31], 24);

  addFace(root, skin);
  addHair(root, hair);

  // Luffy's yellow sash
  if (type === 'luffy') {
    const sash = new THREE.Mesh(
      new THREE.TorusGeometry(0.30, 0.065, 8, 24),
      mat(0xfacc15)
    );
    sash.position.set(0, 1.22, 0);
    sash.rotation.x = Math.PI / 2;
    root.add(sash);

    // Red vest opening detail
    sphere(root, 0xfacc15, [0, 1.67, 0.275], [0.045, 0.35, 0.025]);
  }

  if (cfg.hat) {
    addStrawHat(root);
  }

  if (cfg.cap) {
    const cap = new THREE.Mesh(
      new THREE.SphereGeometry(0.36, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2),
      mat(0xffffff)
    );
    cap.position.y = 2.82;
    root.add(cap);
  }

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
