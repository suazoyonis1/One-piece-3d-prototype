import * as THREE from 'three';
import { GLTFLoader } from './GLTFLoader.js';

// Optional licensed environment models load after the procedural world. If an
// external file fails, the existing procedural vegetation remains untouched.
const ASSET_ROOT = './assets/external/';

function prepareModel(root, { castShadow = false, receiveShadow = true } = {}) {
  root.traverse((object) => {
    if (!object.isMesh) return;
    object.castShadow = castShadow;
    object.receiveShadow = receiveShadow;
    object.frustumCulled = true;
    if (object.material) {
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      materials.forEach((material) => {
        material.side = THREE.DoubleSide;
        material.needsUpdate = true;
      });
    }
  });
  return root;
}

function fitToHeight(root, height) {
  const bounds = new THREE.Box3().setFromObject(root);
  const size = bounds.getSize(new THREE.Vector3());
  const scale = height / Math.max(size.x, size.y, size.z, 0.001);
  root.scale.setScalar(scale);
  root.updateMatrixWorld(true);
  const fitted = new THREE.Box3().setFromObject(root);
  root.position.y -= fitted.min.y;
  return root;
}

function load(loader, path) {
  return new Promise((resolve, reject) => {
    loader.load(path, resolve, undefined, reject);
  });
}

export async function loadEnvironmentAssets(world) {
  const loader = new GLTFLoader();
  const report = { grass: 0, rocks: 0, forestPacks: 0, waveMeshes: 0, fishReady: false };

  const jobs = await Promise.allSettled([
    load(loader, `${ASSET_ROOT}grass/scene.gltf`),
    load(loader, `${ASSET_ROOT}rock-game-assets/scene.gltf`),
    Promise.resolve(null),
    load(loader, `${ASSET_ROOT}freshwater-grouper/scene.gltf`),
    Promise.resolve(null),
    Promise.resolve(null),
    Promise.resolve(null),
    Promise.resolve(null)
  ]);

  const [grassResult, rockResult, forestResult, fishResult, waveResult, mayaWaveResult, mountainLandscapeResult, psxHousesResult] = jobs;
  const dawn = world.islands.find((island) => island.id === 'dawn-mainland');
  const anchor = dawn?.center || new THREE.Vector3(0, 0, -75);

  if (grassResult.status === 'fulfilled') {
    const grass = prepareModel(grassResult.value.scene, { castShadow: false });
    const positions = [
      [22, -190], [42, -205], [62, -218], [78, -235],
      [-22, -215], [-42, -235], [-62, -250], [-82, -260],
      [18, -280], [42, -292], [66, -275], [-18, -290],
      [94, -205], [108, -225], [-100, -225], [-112, -245],
      [6, -245], [28, -255], [-34, -265], [54, -245]
    ];
    positions.forEach(([x, z], index) => {
      const patch = grass.clone(true);
      fitToHeight(patch, 3.6 + (index % 4) * 0.35);
      patch.position.x += anchor.x + x;
      patch.position.z += anchor.z + z + 75;
      patch.rotation.y = (index * 2.399) % (Math.PI * 2);
      patch.traverse((o) => { if (o.isMesh) o.castShadow = false; });
      world.scene.add(patch);
      report.grass++;
    });
  } else {
    console.warn('Optional grass model could not load; keeping procedural ground cover.', grassResult.reason);
  }

  if (rockResult.status === 'fulfilled') {
    const rockSource = prepareModel(rockResult.value.scene, { castShadow: true });
    const placements = [
      [-174, -155, 1.15], [-154, -92, .82], [178, -128, 1.05],
      [196, -58, .76], [-185, 28, .9], [180, 65, 1.1],
      [-118, -320, .88], [126, -330, 1.0]
    ];
    placements.forEach(([x, z, factor], index) => {
      const rock = rockSource.clone(true);
      fitToHeight(rock, 4.4 * factor);
      rock.position.x += anchor.x + x;
      rock.position.z += anchor.z + z + 75;
      rock.rotation.y = index * 1.71;
      world.scene.add(rock);
      report.rocks++;
    });
  } else {
    console.warn('Optional rock model could not load; keeping procedural rocks.', rockResult.reason);
  }

  if (forestResult?.status === 'fulfilled' && forestResult.value) {
    // The source is a complete multi-tree/rock display pack. Use one scaled
    // grove as a landmark rather than cloning all 30 meshes across the map.
    const grove = prepareModel(forestResult.value.scene, { castShadow: false });
    fitToHeight(grove, 24);
    grove.position.x += anchor.x - 154;
    grove.position.z += anchor.z - 178;
    grove.rotation.y = -0.28;
    grove.traverse((o) => { if (o.isMesh) o.castShadow = false; });
    world.scene.add(grove);
    report.forestPacks++;
  } else {
    console.warn('Optional forest model could not load; keeping procedural trees.', forestResult.reason);
  }

  // One animated crest mesh adds a readable breaking-wave accent offshore.
  // The base ocean remains the primary water surface and continues its existing
  // procedural animation; this optional GLTF is deliberately kept to one copy.
  if (waveResult?.status === 'fulfilled' && waveResult.value) {
    const waveScene = prepareModel(waveResult.value.scene, { castShadow: false, receiveShadow: false });
    waveScene.scale.setScalar(0.58);
    waveScene.position.set(720, 0.7, 520);
    waveScene.rotation.y = -0.42;
    waveScene.traverse((object) => {
      if (!object.isMesh) return;
      object.castShadow = false;
      object.receiveShadow = false;
      if (object.material) {
        object.material.transparent = true;
        object.material.depthWrite = false;
        object.material.side = THREE.DoubleSide;
      }
    });
    world.scene.add(waveScene);
    if (waveResult.value.animations?.length) {
      const mixer = new THREE.AnimationMixer(waveScene);
      const action = mixer.clipAction(waveResult.value.animations[0]);
      action.play();
      world.environmentMixers ||= [];
      world.environmentMixers.push(mixer);
    }
    report.waveMeshes++;
  } else {
    console.warn('Optional ocean-wave model could not load; procedural ocean waves remain active.', waveResult.reason);
  }

  // A second, larger animated breaker from the Maya wave pack. It is placed
  // farther offshore as a single accent; the procedural ocean remains primary.
  if (mayaWaveResult?.status === 'fulfilled' && mayaWaveResult.value) {
    const mayaWave = prepareModel(mayaWaveResult.value.scene, { castShadow: false, receiveShadow: false });
    mayaWave.scale.setScalar(1.18);
    // Source mesh is authored in a Z-up orientation; rotate into Three.js Y-up.
    mayaWave.rotation.x = -Math.PI / 2;
    mayaWave.position.set(-760, 1.05, 500);
    mayaWave.rotation.z = 0.24;
    mayaWave.traverse((object) => {
      if (!object.isMesh) return;
      object.castShadow = false;
      object.receiveShadow = false;
      if (object.material) {
        object.material.transparent = true;
        object.material.depthWrite = false;
        object.material.side = THREE.DoubleSide;
      }
    });
    world.scene.add(mayaWave);
    if (mayaWaveResult.value.animations?.length) {
      const mixer = new THREE.AnimationMixer(mayaWave);
      mayaWaveResult.value.animations.forEach((clip) => mixer.clipAction(clip).play());
      world.environmentMixers ||= [];
      world.environmentMixers.push(mixer);
    }
    report.waveMeshes++;
  } else {
    console.warn('Optional Maya ocean-wave model could not load; existing ocean effects remain active.', mayaWaveResult.reason);
  }

  // A single mountain-forest landscape set piece expands the Dawn Island
  // wilderness silhouette. Keep it as a distant scenic feature, not a new
  // collision surface; the existing island terrain and movement remain intact.
  if (mountainLandscapeResult?.status === 'fulfilled' && mountainLandscapeResult.value) {
    const mountainLandscape = prepareModel(mountainLandscapeResult.value.scene, {
      castShadow: false,
      receiveShadow: false
    });
    // Sketchfab's exported scene already includes its source-axis conversion.
    fitToHeight(mountainLandscape, 82);
    mountainLandscape.position.x += anchor.x + 245;
    mountainLandscape.position.z += anchor.z + 115;
    mountainLandscape.position.y -= 0.35;
    mountainLandscape.traverse((object) => {
      if (!object.isMesh) return;
      object.castShadow = false;
      object.receiveShadow = false;
      object.frustumCulled = true;
    });
    world.scene.add(mountainLandscape);
    report.mountainLandscapes = 1;
  } else {
    console.warn('Optional mountain-forest landscape could not load; keeping existing island scenery.', mountainLandscapeResult.reason);
  }

  // Low-poly PSX-style buildings add a compact architectural cluster to
  // Shells Town. Keep this as visual set dressing so existing paths, NPCs,
  // collisions, and quest interactions remain unchanged.
  if (psxHousesResult?.status === 'fulfilled' && psxHousesResult.value) {
    const houseCluster = prepareModel(psxHousesResult.value.scene, {
      castShadow: true,
      receiveShadow: true
    });
    fitToHeight(houseCluster, 19);
    houseCluster.position.set(240 + 13, 2.25, 210 + 10);
    houseCluster.rotation.y = -0.38;
    houseCluster.traverse((object) => {
      if (!object.isMesh) return;
      object.castShadow = true;
      object.receiveShadow = true;
    });
    world.scene.add(houseCluster);
    report.psxHouseClusters = 1;
  } else {
    console.warn('Optional PSX houses could not load; keeping existing Shells Town buildings.', psxHousesResult.reason);
  }

  // The grouper is retained in the project with its license, but is not placed
  // in open water yet: the current ocean is opaque and has no underwater view.
  report.fishReady = fishResult.status === 'fulfilled';
  if (fishResult.status === 'rejected') {
    console.warn('Optional fish model could not load.', fishResult.reason);
  }

  world.environmentAssetReport = report;
  console.info('Environment asset pass loaded:', report);
  return report;
}
