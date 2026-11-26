
import * as THREE from 'three';
import { buildDawnIsland } from './dawn-island.js';

// Procedural ground textures
function createGroundTexture(baseColor, details, repeat = 8) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;

  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Could not create ground texture canvas');
  }

  ctx.fillStyle = baseColor;
  ctx.fillRect(0, 0, 512, 512);

  for (let i = 0; i < 5000; i++) {
    ctx.fillStyle = details[
      Math.floor(Math.random() * details.length)
    ];

    ctx.globalAlpha = Math.random() * 0.4;

    const size = Math.random() * 3 + 1;

    ctx.fillRect(
      Math.random() * 512,
      Math.random() * 512,
      size,
      size
    );
  }

  ctx.globalAlpha = 1;

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(repeat, repeat);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;

  return texture;
}

const grassTexture = createGroundTexture(
  '#4b963e',
  ['#387c32', '#6cae45', '#83b956', '#315f2d', '#a1c96b'],
  7
);

const sandTexture = createGroundTexture(
  '#d9bd82',
  ['#c9a96d', '#ead49c', '#f0dfb5', '#b99760'],
  6
);

const woodTexture = createGroundTexture(
  '#98613b',
  ['#744326', '#b47b4b', '#c18b58', '#81502e'],
  3
);

export class World {
  constructor(scene) {
    this.scene = scene;
    this.islands = [];
    this.supplyCrates = [];
    this.waterTime = 0;
    this.clouds = [];

    // Sky
    this.scene.background = new THREE.Color(0x79c9ed);
    this.scene.fog = new THREE.FogExp2(0xa4d9e8, 0.00055);

    // Natural lighting
    const ambient = new THREE.HemisphereLight(
      0xc7eaff,
      0x526b3b,
      2
    );

    this.scene.add(ambient);

    const sun = new THREE.DirectionalLight(0xffe6b5, 3);

    sun.position.set(120, 180, 100);
    sun.castShadow = true;

    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.left = -350;
    sun.shadow.camera.right = 350;
    sun.shadow.camera.top = 350;
    sun.shadow.camera.bottom = -350;
    sun.shadow.camera.near = 1;
    sun.shadow.camera.far = 500;
    sun.shadow.bias = -0.0002;
    sun.shadow.normalBias = 0.03;

    this.scene.add(sun);

    // Ocean
    const waterGeometry = new THREE.PlaneGeometry(
      2400,
      2400,
      80,
      80
    );

    waterGeometry.rotateX(-Math.PI / 2);

    this.waterPositions =
      waterGeometry.attributes.position.array.slice();

    this.oceanMesh = new THREE.Mesh(
      waterGeometry,
      new THREE.MeshPhysicalMaterial({
        color: 0x159bc5,
        roughness: 0.28,
        metalness: 0.08,
        clearcoat: 1,
        clearcoatRoughness: 0.12,
        reflectivity: 0.85
      })
    );

    this.oceanMesh.receiveShadow = true;
    this.scene.add(this.oceanMesh);

    // Foosha Village
    this.addIsland(
      'foosha',
      'Foosha Village',
      new THREE.Vector3(0, 0, 0),
      48,
      0x45a94b,
      2.3
    );

    this.createFooshaVillage();
    buildDawnIsland(this.scene, this);

    // Shells Town
    this.addIsland(
      'shells',
      'Shells Town (Marine Base)',
      new THREE.Vector3(240, 0, 210),
      58,
      0xb5a58b,
      2.25
    );

    // Baratie
    this.addIsland(
      'baratie',
      'Baratie (Sea Restaurant)',
      new THREE.Vector3(-230, 0, 260),
      36,
      0x38bdf8,
      4
    );

    // Supply crates
    const cratePositions = [
      new THREE.Vector3(14, 2.8, 6),
      new THREE.Vector3(-12, 2.8, 12),
      new THREE.Vector3(4, 2.8, 22)
    ];

    cratePositions.forEach((position, index) => {
      const crate = new THREE.Mesh(
        new THREE.BoxGeometry(1.8, 1.8, 1.8),
        new THREE.MeshStandardMaterial({
          map: woodTexture,
          color: 0xffffff,
          roughness: 0.85
        })
      );

      crate.position.copy(position);
      crate.castShadow = true;
      crate.receiveShadow = true;

      crate.userData = {
        id: index,
        collected: false
      };

      this.scene.add(crate);
      this.supplyCrates.push(crate);
    });

    this.createClouds();
  }

  addIsland(id, name, center, radius, color, groundY) {
    const texture = id === 'shells'
      ? sandTexture
      : grassTexture;

    const material = new THREE.MeshStandardMaterial({
      map: texture,
      color: color,
      roughness: 0.95
    });

    const island = new THREE.Mesh(
      new THREE.CylinderGeometry(
        radius,
        radius + 5,
        groundY * 2,
        64
      ),
      material
    );

    island.position.set(center.x, 0, center.z);
    island.receiveShadow = true;
    island.castShadow = true;

    this.scene.add(island);

    this.islands.push({
      id,
      name,
      center,
      radius,
      groundY
    });

    this.decorateIsland(center, radius, groundY);
  }

  decorateIsland(center, radius, groundY) {
    // Palm trees
    const treeCount = Math.floor(radius / 5);

    for (let i = 0; i < treeCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.random() * radius * 0.65;

      const x = center.x + Math.cos(angle) * distance;
      const z = center.z + Math.sin(angle) * distance;

      const tree = new THREE.Group();

      const trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.18, 0.32, 6, 9),
        new THREE.MeshStandardMaterial({
          color: 0x79502b,
          roughness: 0.95
        })
      );

      trunk.position.y = 3;
      trunk.castShadow = true;
      tree.add(trunk);

      for (let j = 0; j < 7; j++) {
        const rotation = (j / 7) * Math.PI * 2;

        const leaf = new THREE.Mesh(
          new THREE.ConeGeometry(0.45, 5, 7),
          new THREE.MeshStandardMaterial({
            color: j % 2 === 0 ? 0x16803a : 0x249b4b,
            roughness: 0.85
          })
        );

        leaf.position.set(
          Math.cos(rotation) * 1.5,
          6,
          Math.sin(rotation) * 1.5
        );

        leaf.rotation.z = Math.PI / 2;
        leaf.rotation.y = -rotation;
        leaf.castShadow = true;

        tree.add(leaf);
      }

      tree.position.set(x, groundY, z);
      this.scene.add(tree);
    }

    // Rocks
    for (let i = 0; i < 12; i++) {
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.random() * radius * 0.75;

      const rock = new THREE.Mesh(
        new THREE.DodecahedronGeometry(
          0.7 + Math.random() * 1.2,
          0
        ),
        new THREE.MeshStandardMaterial({
          color: 0x777c78,
          roughness: 1
        })
      );

      rock.position.set(
        center.x + Math.cos(angle) * distance,
        groundY + 0.3,
        center.z + Math.sin(angle) * distance
      );

      rock.rotation.set(
        Math.random(),
        Math.random(),
        Math.random()
      );

      rock.castShadow = true;
      rock.receiveShadow = true;
      this.scene.add(rock);
    }

    // Bushes
    for (let i = 0; i < 24; i++) {
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.random() * radius * 0.7;

      const bush = new THREE.Mesh(
        new THREE.SphereGeometry(1.1, 12, 10),
        new THREE.MeshStandardMaterial({
          color: [0x238b45, 0x347c36, 0x56a83d][i % 3],
          roughness: 1
        })
      );

      bush.position.set(
        center.x + Math.cos(angle) * distance,
        groundY + 0.5,
        center.z + Math.sin(angle) * distance
      );

      bush.scale.set(1.2, 0.7, 1);
      bush.castShadow = true;
      this.scene.add(bush);
    }

    // Flowers
    const flowerColors = [
      0xff4d6d,
      0xffd166,
      0xffffff,
      0xc77dff,
      0xff8c42
    ];

    for (let i = 0; i < 35; i++) {
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.random() * radius * 0.78;

      const flower = new THREE.Group();

      const stem = new THREE.Mesh(
        new THREE.CylinderGeometry(0.035, 0.045, 0.55, 6),
        new THREE.MeshStandardMaterial({
          color: 0x287a36
        })
      );

      stem.position.y = 0.27;
      flower.add(stem);

      const color = flowerColors[
        Math.floor(Math.random() * flowerColors.length)
      ];

      for (let j = 0; j < 5; j++) {
        const angle2 = (j / 5) * Math.PI * 2;

        const petal = new THREE.Mesh(
          new THREE.SphereGeometry(0.12, 10, 8),
          new THREE.MeshStandardMaterial({
            color,
            roughness: 0.65
          })
        );

        petal.position.set(
          Math.cos(angle2) * 0.13,
          0.58,
          Math.sin(angle2) * 0.13
        );

        petal.scale.set(1, 0.65, 1);
        flower.add(petal);
      }

      const centerDot = new THREE.Mesh(
        new THREE.SphereGeometry(0.075, 10, 8),
        new THREE.MeshStandardMaterial({
          color: 0xffd700
        })
      );

      centerDot.position.y = 0.59;
      flower.add(centerDot);

      flower.position.set(
        center.x + Math.cos(angle) * distance,
        groundY,
        center.z + Math.sin(angle) * distance
      );

      this.scene.add(flower);
    }
  }

  createFooshaVillage() {
    const groundY = 2.3;

    // Beach
    const beach = new THREE.Mesh(
      new THREE.TorusGeometry(45, 2.2, 8, 80),
      new THREE.MeshStandardMaterial({
        map: sandTexture,
        color: 0xffffff,
        roughness: 1
      })
    );

    beach.rotation.x = -Math.PI / 2;
    beach.position.y = groundY + 0.08;
    beach.receiveShadow = true;
    this.scene.add(beach);

    // Walking path
    const pathMaterial = new THREE.MeshStandardMaterial({
      map: sandTexture,
      color: 0xffffff,
      roughness: 1
    });

    for (let i = 0; i < 8; i++) {
      const path = new THREE.Mesh(
        new THREE.BoxGeometry(3.5, 0.12, 5),
        pathMaterial
      );

      path.position.set(0, groundY + 0.12, 9 - i * 4);
      path.receiveShadow = true;
      this.scene.add(path);
    }

    // Stepping stones
    const stoneMaterial = new THREE.MeshStandardMaterial({
      color: 0xb8a58b,
      roughness: 1
    });

    for (let i = 0; i < 24; i++) {
      const stone = new THREE.Mesh(
        new THREE.DodecahedronGeometry(
          0.35 + Math.random() * 0.25,
          0
        ),
        stoneMaterial
      );

      stone.position.set(
        (Math.random() - 0.5) * 5,
        groundY + 0.2,
        12 - Math.random() * 42
      );

      stone.scale.y = 0.25;
      stone.rotation.y = Math.random() * Math.PI;
      this.scene.add(stone);
    }

    // Houses
    this.createVillageHouse(-17, -12, 0, false);
    this.createVillageHouse(17, -12, Math.PI / 2, false);
    this.createVillageHouse(-19, 12, 0, false);
    this.createVillageHouse(19, 12, Math.PI / 2, true);
    this.createVillageHouse(0, -25, 0, true, true);

    this.createVillageDock();
    this.createVillageProps();
  }

  createVillageHouse(x, z, rotation = 0, large = false, tavern = false) {
    const group = new THREE.Group();

    const width = large ? 10 : 7;
    const height = large ? 6 : 4.5;
    const depth = large ? 9 : 6;

    const wood = new THREE.MeshStandardMaterial({
      map: woodTexture,
      color: tavern ? 0xb87948 : 0xd5a16b,
      roughness: 0.85
    });

    const roofMaterial = new THREE.MeshStandardMaterial({
      color: tavern ? 0x71352a : 0x8b3d2d,
      roughness: 1
    });

    // House body
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(width, height, depth),
      wood
    );

    body.position.y = height / 2;
    group.add(body);

    // Roof
    const roof = new THREE.Mesh(
      new THREE.ConeGeometry(width * 0.82, 3.5, 4),
      roofMaterial
    );

    roof.position.y = height + 1.5;
    roof.rotation.y = Math.PI / 4;
    group.add(roof);

    // Door
    const door = new THREE.Mesh(
      new THREE.BoxGeometry(1.5, 2.7, 0.2),
      new THREE.MeshStandardMaterial({
        color: 0x49301f
      })
    );

    door.position.set(0, 1.35, depth / 2 + 0.12);
    group.add(door);

    // Windows
    const windowMaterial = new THREE.MeshStandardMaterial({
      color: 0x75c9e8,
      roughness: 0.3,
      metalness: 0.1
    });

    const frameMaterial = new THREE.MeshStandardMaterial({
      color: 0x6b3d24,
      roughness: 0.9
    });

    [-width / 3, width / 3].forEach(wx => {
      const frame = new THREE.Mesh(
        new THREE.BoxGeometry(1.55, 1.55, 0.12),
        frameMaterial
      );

      frame.position.set(
        wx,
        height * 0.65,
        depth / 2 + 0.08
      );

      group.add(frame);

      const window = new THREE.Mesh(
        new THREE.BoxGeometry(1.3, 1.3, 0.2),
        windowMaterial
      );

      window.position.set(
        wx,
        height * 0.65,
        depth / 2 + 0.14
      );

      group.add(window);

      const verticalBar = new THREE.Mesh(
        new THREE.BoxGeometry(0.08, 1.3, 0.08),
        frameMaterial
      );

      verticalBar.position.set(
        wx,
        height * 0.65,
        depth / 2 + 0.25
      );

      group.add(verticalBar);

      const horizontalBar = new THREE.Mesh(
        new THREE.BoxGeometry(1.3, 0.08, 0.08),
        frameMaterial
      );

      horizontalBar.position.set(
        wx,
        height * 0.65,
        depth / 2 + 0.25
      );

      group.add(horizontalBar);
    });

    // Tavern sign
    if (tavern) {
      const sign = new THREE.Mesh(
        new THREE.BoxGeometry(3.5, 1, 0.2),
        new THREE.MeshStandardMaterial({
          color: 0xf0c36d
        })
      );

      sign.position.set(
        0,
        height + 0.2,
        depth / 2 + 0.2
      );

      group.add(sign);
    }

    group.position.set(x, 2.3, z);
    group.rotation.y = rotation;

    group.traverse(obj => {
      if (obj.isMesh) {
        obj.castShadow = true;
        obj.receiveShadow = true;
      }
    });

    this.scene.add(group);
  }

  createVillageDock() {
    const dock = new THREE.Group();

    const wood = new THREE.MeshStandardMaterial({
      map: woodTexture,
      color: 0xffffff,
      roughness: 0.9
    });

    const walkway = new THREE.Mesh(
      new THREE.BoxGeometry(9, 0.5, 25),
      wood
    );

    dock.add(walkway);

    // Planks
    for (let i = 0; i < 12; i++) {
      const plank = new THREE.Mesh(
        new THREE.BoxGeometry(9.2, 0.15, 1.7),
        wood
      );

      plank.position.set(0, 0.32, -11 + i * 2);
      dock.add(plank);
    }

    // Support pillars
    for (const x of [-3.5, 3.5]) {
      for (const z of [-11, 0, 11]) {
        const pillar = new THREE.Mesh(
          new THREE.CylinderGeometry(0.35, 0.45, 4, 8),
          wood
        );

        pillar.position.set(x, -1.5, z);
        dock.add(pillar);
      }
    }

    dock.traverse(obj => {
      if (obj.isMesh) {
        obj.castShadow = true;
        obj.receiveShadow = true;
      }
    });

    dock.position.set(5, 2.5, -38);
    this.scene.add(dock);
  }

  createVillageProps() {
    const barrelMaterial = new THREE.MeshStandardMaterial({
      color: 0x98602f,
      roughness: 0.9
    });

    const crateMaterial = new THREE.MeshStandardMaterial({
      map: woodTexture,
      color: 0xffffff,
      roughness: 0.9
    });

    const positions = [
      [-11, -18],
      [12, -18],
      [-24, 2],
      [25, 0],
      [8, -29],
      [-8, -29]
    ];

    positions.forEach((p, i) => {
      const barrel = new THREE.Mesh(
        new THREE.CylinderGeometry(0.65, 0.65, 1.5, 12),
        barrelMaterial
      );

      barrel.position.set(p[0], 3.05, p[1]);
      barrel.castShadow = true;
      this.scene.add(barrel);

      if (i % 2 === 0) {
        const crate = new THREE.Mesh(
          new THREE.BoxGeometry(1.5, 1.5, 1.5),
          crateMaterial
        );

        crate.position.set(p[0] + 2, 3.05, p[1]);
        crate.castShadow = true;
        this.scene.add(crate);
      }
    });
  }

  createClouds() {
    const material = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 1
    });

    for (let i = 0; i < 12; i++) {
      const cloud = new THREE.Group();

      for (let j = 0; j < 5; j++) {
        const puff = new THREE.Mesh(
          new THREE.SphereGeometry(
            3 + Math.random() * 2,
            12,
            10
          ),
          material
        );

        puff.position.set(
          j * 3 - 6,
          Math.random() * 2,
          Math.random() * 2
        );

        puff.scale.y = 0.65;
        cloud.add(puff);
      }

      cloud.position.set(
        Math.random() * 1000 - 500,
        65 + Math.random() * 30,
        Math.random() * 1000 - 500
      );

      this.scene.add(cloud);
      this.clouds.push(cloud);
    }
  }

  getIslandAt(pos) {
    if (!pos || !this.islands) return null;

    for (const island of this.islands) {
      const distance = Math.hypot(
        pos.x - island.center.x,
        pos.z - island.center.z
      );

      if (distance <= island.radius) {
        return island;
      }
    }

    return null;
  }

  update(dt) {
    if (!this.oceanMesh || !this.oceanMesh.geometry) {
      return;
    }

    this.waterTime += dt;

    // Animated ocean waves
    const positions =
      this.oceanMesh.geometry.attributes.position;

    for (let i = 0; i < positions.count; i++) {
      const x = this.waterPositions[i * 3];
      const z = this.waterPositions[i * 3 + 2];

      const wave =
        Math.sin(x * 0.025 + this.waterTime * 1.4) * 0.5 +
        Math.cos(z * 0.035 + this.waterTime) * 0.35 +
        Math.sin(
          (x + z) * 0.018 + this.waterTime * 0.7
        ) * 0.2;

      positions.array[i * 3 + 1] =
        this.waterPositions[i * 3 + 1] + wave;
    }

    positions.needsUpdate = true;

    // Recalculate ocean normals less frequently
    if (Math.floor(this.waterTime * 10) !==
        Math.floor((this.waterTime - dt) * 10)) {
      this.oceanMesh.geometry.computeVertexNormals();
    }

    // Moving clouds
    this.clouds.forEach(cloud => {
      cloud.position.x += dt * 2;

      if (cloud.position.x > 650) {
        cloud.position.x = -650;
      }
    });
  }
}
