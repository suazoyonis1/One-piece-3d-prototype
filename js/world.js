
import * as THREE from 'three';

export class World {
  constructor(scene) {
    this.scene = scene;
    this.islands = [];
    this.supplyCrates = [];
    this.waterTime = 0;
    this.clouds = [];

    // Sky and atmosphere
    this.scene.background = new THREE.Color(0x87ceeb);
    this.scene.fog = new THREE.FogExp2(0x9bd8e8, 0.00085);

    // Lighting
    this.scene.add(
      new THREE.HemisphereLight(0xdaf3ff, 0x557344, 1.5)
    );

    const sun = new THREE.DirectionalLight(0xfff1cc, 2.0);
    sun.position.set(120, 220, 100);
    sun.castShadow = true;
    this.scene.add(sun);

    // Animated ocean
    const wGeo = new THREE.PlaneGeometry(2400, 2400, 80, 80);
    wGeo.rotateX(-Math.PI / 2);

    this.waterPositions = wGeo.attributes.position.array.slice();

    this.oceanMesh = new THREE.Mesh(
      wGeo,
      new THREE.MeshStandardMaterial({
        color: 0x087eaa,
        roughness: 0.28,
        metalness: 0.12,
        flatShading: false
      })
    );

    this.scene.add(this.oceanMesh);

    // Islands
    this.addIsland(
      'foosha',
      'Foosha Village',
      new THREE.Vector3(0, 0, 0),
      48,
      0x45a94b,
      2.3
    );

    this.addIsland(
      'shells',
      'Shells Town (Marine Base)',
      new THREE.Vector3(240, 0, 210),
      58,
      0xb5a58b,
      2.25
    );

    this.addIsland(
      'baratie',
      'Baratie (Sea Restaurant)',
      new THREE.Vector3(-230, 0, 260),
      36,
      0x38bdf8,
      4.0
    );

    // Supply crates
    [
      new THREE.Vector3(14, 2.8, 6),
      new THREE.Vector3(-12, 2.8, 12),
      new THREE.Vector3(4, 2.8, 22)
    ].forEach((p, idx) => {
      const crate = new THREE.Mesh(
        new THREE.BoxGeometry(1.8, 1.8, 1.8),
        new THREE.MeshStandardMaterial({
          color: 0xd97706,
          roughness: 0.85
        })
      );

      crate.position.copy(p);
      crate.userData = {
        id: idx,
        collected: false
      };

      this.scene.add(crate);
      this.supplyCrates.push(crate);
    });

    this.createClouds();
  }

  addIsland(id, name, center, radius, color, groundY) {
    const material = new THREE.MeshStandardMaterial({
      color,
      roughness: 0.9
    });

    const island = new THREE.Mesh(
      new THREE.CylinderGeometry(
        radius,
        radius + 5,
        groundY * 2,
        48
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
        new THREE.CylinderGeometry(0.18, 0.32, 6, 7),
        new THREE.MeshStandardMaterial({
          color: 0x79502b
        })
      );

      trunk.position.y = 3;
      tree.add(trunk);

      // Palm leaves
      for (let j = 0; j < 7; j++) {
        const leaf = new THREE.Mesh(
          new THREE.ConeGeometry(0.45, 5, 5),
          new THREE.MeshStandardMaterial({
            color: j % 2 === 0 ? 0x16803a : 0x249b4b
          })
        );

        const rotation = (j / 7) * Math.PI * 2;

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

    // Decorative rocks
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

      this.scene.add(rock);
    }

    // Small greenery
    for (let i = 0; i < 18; i++) {
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.random() * radius * 0.7;

      const bush = new THREE.Mesh(
        new THREE.SphereGeometry(1.1, 7, 6),
        new THREE.MeshStandardMaterial({
          color: 0x238b45,
          roughness: 1
        })
      );

      bush.position.set(
        center.x + Math.cos(angle) * distance,
        groundY + 0.5,
        center.z + Math.sin(angle) * distance
      );

      bush.scale.set(1.2, 0.7, 1);
      this.scene.add(bush);
    }
  }

  createClouds() {
    for (let i = 0; i < 12; i++) {
      const cloud = new THREE.Group();

      const material = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 1
      });

      for (let j = 0; j < 5; j++) {
        const puff = new THREE.Mesh(
          new THREE.SphereGeometry(
            3 + Math.random() * 2,
            8,
            8
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
    return this.islands.find(i =>
      Math.hypot(
        pos.x - i.center.x,
        pos.z - i.center.z
      ) <= i.radius
    ) || null;
  }

  update(dt) {
    this.waterTime += dt;

    // Ocean waves
    const positions = this.oceanMesh.geometry.attributes.position;

    for (let i = 0; i < positions.count; i++) {
      const x = this.waterPositions[i * 3];
      const z = this.waterPositions[i * 3 + 2];

      const wave =
        Math.sin(x * 0.025 + this.waterTime * 1.2) * 0.45 +
        Math.cos(z * 0.035 + this.waterTime * 0.8) * 0.3;

      positions.array[i * 3 + 1] =
        this.waterPositions[i * 3 + 1] + wave;
    }

    positions.needsUpdate = true;
    this.oceanMesh.geometry.computeVertexNormals();

    // Moving clouds
    this.clouds.forEach(cloud => {
      cloud.position.x += dt * 2;

      if (cloud.position.x > 650) {
        cloud.position.x = -650;
      }
    });
  }
}
