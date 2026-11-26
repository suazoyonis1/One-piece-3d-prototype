
import * as THREE from 'three';

// ==========================================
// MATERIALS
// ==========================================

const materials = {
  skin: new THREE.MeshStandardMaterial({ color: 0xf2b58c, roughness: 0.85 }),
  luffyShirt: new THREE.MeshStandardMaterial({ color: 0xc92828, roughness: 0.8 }),
  shorts: new THREE.MeshStandardMaterial({ color: 0x2453a0, roughness: 0.85 }),
  hair: new THREE.MeshStandardMaterial({ color: 0x24150e }),
  straw: new THREE.MeshStandardMaterial({ color: 0xd9a52d }),
  strawDark: new THREE.MeshStandardMaterial({ color: 0x8b5a20 }),
  black: new THREE.MeshStandardMaterial({ color: 0x171717 }),
  white: new THREE.MeshStandardMaterial({ color: 0xf3eee0 }),
  green: new THREE.MeshStandardMaterial({ color: 0x23834b }),
  orange: new THREE.MeshStandardMaterial({ color: 0xe58a24 }),
  blue: new THREE.MeshStandardMaterial({ color: 0x263f88 }),
  gold: new THREE.MeshStandardMaterial({ color: 0xd9a52d, metalness: 0.65, roughness: 0.3 }),
  wood: new THREE.MeshStandardMaterial({ color: 0x87502d, roughness: 0.85 }),
  darkWood: new THREE.MeshStandardMaterial({ color: 0x4b2919, roughness: 0.9 }),
  lightWood: new THREE.MeshStandardMaterial({ color: 0xb77b42, roughness: 0.85 }),
  sail: new THREE.MeshStandardMaterial({ color: 0xf1e6c8, side: THREE.DoubleSide, roughness: 0.95 }),
  red: new THREE.MeshStandardMaterial({ color: 0xb92d2d, side: THREE.DoubleSide, roughness: 0.95 })
};

// ==========================================
// HELPER FUNCTIONS
// ==========================================

function addMesh(parent, geometry, material, position = [0, 0, 0]) {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(...position);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function box(parent, size, position, material) {
  return addMesh(
    parent,
    new THREE.BoxGeometry(...size),
    material,
    position
  );
}

function sphere(parent, radius, position, material, scale = [1, 1, 1]) {
  const mesh = addMesh(
    parent,
    new THREE.SphereGeometry(radius, 16, 12),
    material,
    position
  );

  mesh.scale.set(...scale);
  return mesh;
}

function cylinder(parent, top, bottom, height, position, material, segments = 12) {
  return addMesh(
    parent,
    new THREE.CylinderGeometry(top, bottom, height, segments),
    material,
    position
  );
}

// ==========================================
// PROCEDURAL CHARACTER MODELS
// ==========================================

export function createCharacterMesh(type = 'luffy') {
  const name = String(type).toLowerCase();
  const root = new THREE.Group();
  const body = new THREE.Group();

  root.add(body);

  let shirt = materials.luffyShirt;
  let pants = materials.shorts;
  let hair = materials.hair;

  if (name.includes('zoro')) {
    shirt = materials.green;
    pants = materials.darkWood;
  } else if (name.includes('nami')) {
    shirt = materials.orange;
    pants = materials.blue;
    hair = materials.orange;
  } else if (name.includes('sanji')) {
    shirt = materials.black;
    pants = materials.black;
    hair = materials.gold;
  } else if (name.includes('marine') || name.includes('morgan')) {
    shirt = materials.white;
    pants = materials.blue;
  } else if (name.includes('mayor')) {
    shirt = materials.green;
    pants = materials.darkWood;
  } else if (name.includes('pirate')) {
    shirt = materials.darkWood;
    pants = materials.black;
  }

  // torso
  const torso = cylinder(
    body,
    0.43,
    0.34,
    0.9,
    [0, 1.35, 0],
    shirt,
    12
  );

  torso.rotation.z = 0;

  // neck and head
  cylinder(body, 0.14, 0.14, 0.2, [0, 1.9, 0], materials.skin);

  sphere(body, 0.34, [0, 2.25, 0], materials.skin, [0.9, 1.1, 0.85]);

  // hair
  if (!name.includes('marine') && !name.includes('morgan')) {
    sphere(body, 0.34, [0, 2.48, -0.03], hair, [1, 0.65, 0.9]);
  } else {
    sphere(body, 0.34, [0, 2.48, -0.03], materials.white, [1, 0.55, 0.9]);
  }

  // eyes
  sphere(body, 0.045, [-0.12, 2.27, 0.285], materials.black);
  sphere(body, 0.045, [0.12, 2.27, 0.285], materials.black);

  // mouth
  const mouth = box(
    body,
    [0.12, 0.025, 0.025],
    [0, 2.08, 0.3],
    materials.black
  );

  // Luffy straw hat
  if (name.includes('luffy')) {
    cylinder(body, 0.42, 0.42, 0.07, [0, 2.66, 0], materials.straw, 20);
    cylinder(body, 0.25, 0.25, 0.2, [0, 2.76, 0], materials.straw, 20);

    cylinder(body, 0.43, 0.43, 0.045, [0, 2.65, 0], materials.red, 20);
  }

  // Zoro bandana
  if (name.includes('zoro')) {
    box(body, [0.66, 0.1, 0.58], [0, 2.47, 0], materials.green);
  }

  // legs
  const legs = [];

  for (const side of [-1, 1]) {
    const leg = cylinder(
      body,
      0.13,
      0.16,
      0.65,
      [side * 0.19, 0.55, 0],
      pants
    );

    legs.push(leg);

    // shoes
    sphere(
      body,
      0.16,
      [side * 0.19, 0.16, 0.08],
      materials.black,
      [1, 0.65, 1.3]
    );
  }

  // arms
  const arms = [];

  for (const side of [-1, 1]) {
    const arm = cylinder(
      body,
      0.12,
      0.15,
      0.72,
      [side * 0.48, 1.38, 0]
    , materials.skin);

    arm.rotation.z = side * -0.18;
    arms.push(arm);

    sphere(body, 0.14, [side * 0.5, 0.98, 0], materials.skin);
  }

  // Luffy's open shirt sleeves
  if (name.includes('luffy')) {
    sphere(body, 0.17, [-0.43, 1.58, 0], shirt, [1, 0.85, 1]);
    sphere(body, 0.17, [0.43, 1.58, 0], shirt, [1, 0.85, 1]);
  }

  root.userData.animate = (time, speed = 0, state = 'idle') => {
    const moving = speed > 0.1;
    const swing = moving ? Math.sin(time * 10) * 0.55 : 0;

    legs[0].rotation.x = swing;
    legs[1].rotation.x = -swing;

    arms[0].rotation.x = -swing * 0.7;
    arms[1].rotation.x = swing * 0.7;

    body.position.y = moving
      ? Math.abs(Math.sin(time * 10)) * 0.06
      : Math.sin(time * 2) * 0.015;

    if (state === 'attack') {
      arms[1].rotation.x = -1.5;
    }

    if (state === 'jump') {
      legs[0].rotation.x = -0.5;
      legs[1].rotation.x = 0.5;
    }
  };

  root.traverse(object => {
    if (object.isMesh) {
      object.castShadow = true;
      object.receiveShadow = true;
    }
  });

  return root;
}

// ==========================================
// GOING MERRY SHIP
// ==========================================

export function createGoingMerryMesh() {
  const ship = new THREE.Group();

  // hull shape
  const stations = [
    { z: -6.5, width: 1.2 },
    { z: -5.5, width: 2.5 },
    { z: -3.5, width: 3.6 },
    { z: 0, width: 4.1 },
    { z: 3.5, width: 3.7 },
    { z: 5.5, width: 2.7 },
    { z: 6.8, width: 0.15 }
  ];

  const crossSection = [
    [0, 1.3],
    [-0.75, 0.85],
    [-1, 0.2],
    [-0.65, -0.65],
    [0, -1],
    [0.65, -0.65],
    [1, 0.2],
    [0.75, 0.85]
  ];

  const vertices = [];
  const indices = [];

  for (const station of stations) {
    for (const [x, y] of crossSection) {
      vertices.push(
        x * station.width,
        y * 1.15,
        station.z
      );
    }
  }

  for (let i = 0; i < stations.length - 1; i++) {
    for (let j = 0; j < crossSection.length; j++) {
      const a = i * crossSection.length + j;
      const b = i * crossSection.length + (j + 1) % crossSection.length;
      const c = (i + 1) * crossSection.length + j;
      const d = (i + 1) * crossSection.length + (j + 1) % crossSection.length;

      indices.push(a, b, c, b, d, c);
    }
  }

  const hullGeometry = new THREE.BufferGeometry();

  hullGeometry.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(vertices, 3)
  );

  hullGeometry.setIndex(indices);
  hullGeometry.computeVertexNormals();

  addMesh(
    ship,
    hullGeometry,
    new THREE.MeshStandardMaterial({
      color: 0x75401f,
      roughness: 0.8,
      side: THREE.DoubleSide
    })
  );

  // deck
  box(ship, [7.1, 0.22, 12.2], [0, 1.35, -0.1], materials.lightWood);

  // deck planks
  for (let z = -5.7; z <= 5.7; z += 0.55) {
    box(
      ship,
      [6.8, 0.025, 0.035],
      [0, 1.48, z],
      materials.darkWood
    );
  }

  // gold trim
  for (const side of [-1, 1]) {
    box(
      ship,
      [0.15, 0.18, 10.5],
      [side * 3.35, 1.45, -0.1],
      materials.gold
    );
  }

  // railing
  for (const side of [-1, 1]) {
    for (let z = -5; z <= 5; z += 1.1) {
      cylinder(
        ship,
        0.07,
        0.07,
        0.65,
        [side * 3.35, 1.8, z],
        materials.wood
      );
    }

    box(
      ship,
      [0.12, 0.12, 10.5],
      [side * 3.35, 2.1, 0],
      materials.lightWood
    );
  }

  // mast
  cylinder(ship, 0.18, 0.27, 10.5, [0, 6.5, -0.5], materials.wood, 16);

  // mast support
  box(ship, [0.4, 0.35, 1.1], [0, 1.65, -0.5], materials.darkWood);

  // crossbars
  cylinder(ship, 0.09, 0.09, 9, [0, 8.5, -0.5], materials.wood, 12);
  cylinder(ship, 0.08, 0.08, 7.3, [0, 5.3, -0.5], materials.wood, 12);

  // striped curved sails
  function makeSail(width, height, y, z, segments = 12) {
    const sailGroup = new THREE.Group();

    const positions = [];
    const colors = [];
    const indices = [];

    const cream = new THREE.Color(0xf1e6c8);
    const red = new THREE.Color(0xb92d2d);

    for (let row = 0; row <= 8; row++) {
      const v = row / 8;

      for (let col = 0; col <= segments; col++) {
        const u = col / segments;

        const x = (u - 0.5) * width;
        const curve = Math.sin(u * Math.PI) * 0.35;

        positions.push(
          x,
          -v * height + curve,
          Math.sin(v * Math.PI) * 0.25
        );

        const stripe = Math.floor(u * segments / 2) % 2 === 0;
        const color = stripe ? cream : red;

        colors.push(color.r, color.g, color.b);
      }
    }

    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < segments; col++) {
        const a = row * (segments + 1) + col;
        const b = a + 1;
        const c = a + segments + 1;
        const d = c + 1;

        indices.push(a, c, b, b, c, d);
      }
    }

    const geometry = new THREE.BufferGeometry();

    geometry.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(positions, 3)
    );

    geometry.setAttribute(
      'color',
      new THREE.Float32BufferAttribute(colors, 3)
    );

    geometry.setIndex(indices);
    geometry.computeVertexNormals();

    const material = new THREE.MeshStandardMaterial({
      vertexColors: true,
      side: THREE.DoubleSide,
      roughness: 0.95
    });

    addMesh(sailGroup, geometry, material);
    sailGroup.position.set(0, y, z);
    ship.add(sailGroup);

    return sailGroup;
  }

  makeSail(7.2, 3.5, 9.7, -0.5);
  makeSail(5.5, 2.1, 6.4, -0.5);

  // rigging ropes
  function rope(start, end, radius = 0.035) {
    const a = new THREE.Vector3(...start);
    const b = new THREE.Vector3(...end);

    const direction = new THREE.Vector3().subVectors(b, a);
    const length = direction.length();

    const mesh = new THREE.Mesh(
      new THREE.CylinderGeometry(radius, radius, length, 6),
      materials.darkWood
    );

    mesh.position.copy(a).add(b).multiplyScalar(0.5);
    mesh.quaternion.setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      direction.normalize()
    );

    mesh.castShadow = true;
    ship.add(mesh);
  }

  rope([-3.5, 2, 5.5], [0, 11.5, -0.5]);
  rope([3.5, 2, 5.5], [0, 11.5, -0.5]);
  rope([-3.5, 2, -5.5], [0, 11.5, -0.5]);
  rope([3.5, 2, -5.5], [0, 11.5, -0.5]);

  // sheep figurehead at the bow
  const figurehead = new THREE.Group();
  figurehead.position.set(0, 2.5, 6.4);
  ship.add(figurehead);

  sphere(figurehead, 0.65, [0, 0.2, 0.35], materials.white, [1, 1, 1.1]);
  sphere(figurehead, 0.4, [0, -0.2, 0.75], materials.white, [1, 0.75, 0.8]);

  // sheep muzzle
  sphere(figurehead, 0.25, [0, -0.2, 1.05], materials.white);
  sphere(figurehead, 0.08, [-0.12, -0.15, 1.25], materials.black);
  sphere(figurehead, 0.08, [0.12, -0.15, 1.25], materials.black);

  // eyes
  sphere(figurehead, 0.08, [-0.32, 0.35, 0.8], materials.black);
  sphere(figurehead, 0.08, [0.32, 0.35, 0.8], materials.black);

  // horns
  for (const side of [-1, 1]) {
    const horn = cylinder(
      figurehead,
      0.015,
      0.14,
      0.8,
      [side * 0.55, 0.55, 0.2],
      materials.gold
    );

    horn.rotation.z = side * -0.9;
  }

  // ears
  sphere(figurehead, 0.28, [-0.7, 0.2, 0.2], materials.white, [1.3, 0.45, 0.7]);
  sphere(figurehead, 0.28, [0.7, 0.2, 0.2], materials.white, [1.3, 0.45, 0.7]);

  // rear cabin
  box(ship, [3.8, 1.8, 2.5], [0, 2.3, -4.2], materials.wood);
  box(ship, [4.1, 0.2, 2.8], [0, 3.25, -4.2], materials.darkWood);

  // cabin windows
  for (const side of [-1, 1]) {
    cylinder(
      ship,
      0.28,
      0.28,
      0.08,
      [side * 1.95, 2.55, -4.2],
      materials.gold,
      16
    );
  }

  // cabin door
  box(ship, [0.8, 1.25, 0.08], [0, 2.05, -2.92], materials.darkWood);

  // ship wheel
  const wheel = new THREE.Group();
  wheel.position.set(0, 2.6, -2.7);
  ship.add(wheel);

  const wheelRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.48, 0.055, 8, 20),
    materials.wood
  );

  wheel.add(wheelRing);

  cylinder(
    wheel,
    0.1,
    0.1,
    0.25,
    [0, 0, 0],
    materials.gold
  );

  // small flag
  box(ship, [0.08, 1.1, 0.08], [0, 11.8, -0.5], materials.wood);

  const flag = box(
    ship,
    [1.5, 0.8, 0.05],
    [0.75, 11.7, -0.5],
    materials.white
  );

  flag.rotation.z = -0.08;

  // finish
  ship.traverse(object => {
    if (object.isMesh) {
      object.castShadow = true;
      object.receiveShadow = true;
    }
  });

  ship.userData.isGoingMerry = true;

  return ship;
}
