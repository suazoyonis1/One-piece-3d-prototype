import * as THREE from 'three';
import { GLTFLoader } from './GLTFLoader.js';
const gltfLoader = new GLTFLoader();
function attachCustomGLB(root, path, targetHeight) {
  gltfLoader.load(path, (gltf) => {
    const m = gltf.scene;
    const box = new THREE.Box3().setFromObject(m);
    const s = targetHeight / (box.getSize(new THREE.Vector3()).y || 1);
    m.scale.setScalar(s);
    box.setFromObject(m);
    const c = box.getCenter(new THREE.Vector3());
    m.position.set(-c.x, -box.min.y, -c.z);
    root.clear(); root.add(m);
  });
}


function createMaterial(color, roughness = 0.6) {
  return new THREE.MeshStandardMaterial({ color, roughness });
}

export function createCharacterMesh(type) {
  const root = new THREE.Group();
  const configs = {
    luffy:  { skin: 0xf1c27d, shirt: 0xdc2626, pants: 0x2563eb, hair: 0x111827, hat: true },
    zoro:   { skin: 0xf1c27d, shirt: 0xf8fafc, pants: 0x14532d, hair: 0x16a34a, swords: true },
    nami:   { skin: 0xf5cba7, shirt: 0x38bdf8, pants: 0x1d4ed8, hair: 0xf97316, staff: true },
    sanji:  { skin: 0xf1c27d, shirt: 0x111827, pants: 0x111827, hair: 0xfacc15, tie: true },
    mayor:  { skin: 0xe0ac69, shirt: 0x65a30d, pants: 0x78350f, hair: 0xe2e8f0, hatMayor: true },
    marine: { skin: 0xf1c27d, shirt: 0xf8fafc, pants: 0x1e3a8a, hair: 0x1f2937, marineCap: true },
    morgan: { skin: 0xe0ac69, shirt: 0x1e293b, pants: 0x0f172a, hair: 0xfacc15, axeHand: true, scale: 1.45 },
    pirate: { skin: 0xd2996c, shirt: 0x7f1d1d, pants: 0x292524, hair: 0x111827, bandana: true }
  };

  const cfg = configs[type] || configs.marine;
  const scale = cfg.scale || 1.0;

  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.1, 0.5), createMaterial(cfg.shirt));
  torso.position.y = 1.45;
  torso.castShadow = true;
  root.add(torso);

  const leftLeg = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.9, 0.4), createMaterial(cfg.pants));
  leftLeg.position.set(-0.22, 0.45, 0);
  leftLeg.castShadow = true;
  root.add(leftLeg);

  const rightLeg = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.9, 0.4), createMaterial(cfg.pants));
  rightLeg.position.set(0.22, 0.45, 0);
  rightLeg.castShadow = true;
  root.add(rightLeg);

  const head = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.65, 0.65), createMaterial(cfg.skin));
  head.position.y = 2.35;
  head.castShadow = true;
  root.add(head);

  const hair = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.35, 0.7), createMaterial(cfg.hair));
  hair.position.y = 2.62;
  root.add(hair);

  const leftArmPivot = new THREE.Group();
  leftArmPivot.position.set(-0.62, 1.9, 0);
  const leftArm = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.9, 0.3), createMaterial(cfg.skin));
  leftArm.position.y = -0.35;
  leftArm.castShadow = true;
  leftArmPivot.add(leftArm);
  root.add(leftArmPivot);

  const rightArmPivot = new THREE.Group();
  rightArmPivot.position.set(0.62, 1.9, 0);
  const rightArm = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.9, 0.3), createMaterial(cfg.skin));
  rightArm.position.y = -0.35;
  rightArm.castShadow = true;
  rightArmPivot.add(rightArm);
  root.add(rightArmPivot);

  if (cfg.hat) {
    const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.75, 0.06, 20), createMaterial(0xfacc15));
    brim.position.y = 2.72;
    const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.48, 0.28, 20), createMaterial(0xfacc15));
    crown.position.y = 2.86;
    const ribbon = new THREE.Mesh(new THREE.CylinderGeometry(0.49, 0.49, 0.08, 20), createMaterial(0xdc2626));
    ribbon.position.y = 2.77;
    root.add(brim, crown, ribbon);
  }

  if (cfg.swords) {
    for (let i = 0; i < 3; i++) {
      const sword = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.5, 8), createMaterial(0x111827));
      sword.position.set(0.55, 1.1 + i * 0.14, 0.15);
      sword.rotation.x = Math.PI / 3;
      root.add(sword);
    }
  }

  if (cfg.staff) {
    const staff = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.9, 8), createMaterial(0x0284c7));
    staff.position.set(0, -0.4, 0.35);
    staff.rotation.x = Math.PI / 2.3;
    rightArmPivot.add(staff);
  }

  if (cfg.marineCap) {
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.22, 16), createMaterial(0xffffff));
    cap.position.y = 2.75;
    const visor = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.05, 0.35), createMaterial(0x1e3a8a));
    visor.position.set(0, 2.66, 0.35);
    root.add(cap, visor);
  }

  if (cfg.axeHand) {
    const axeHandle = new THREE.Mesh(new THREE.BoxGeometry(0.22, 1.1, 0.22), createMaterial(0x475569));
    axeHandle.position.set(0, -0.65, 0.2);
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.7, 0.65), createMaterial(0x94a3b8, 0.2));
    blade.position.set(0, -0.95, 0.45);
    rightArmPivot.add(axeHandle, blade);
  }

  if (cfg.bandana) {
    const bandana = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.18, 0.72), createMaterial(0xdc2626));
    bandana.position.y = 2.58;
    root.add(bandana);
  }

  root.scale.setScalar(scale);
  root.userData.limbs = { leftLeg, rightLeg, leftArmPivot, rightArmPivot, head };
  attachCustomGLB(root, `./assets/${type}.glb`, 3.1 * scale);
  return root;
}

export function createGoingMerryMesh() {
  const ship = new THREE.Group();
  const hullMat = createMaterial(0x92400e, 0.7);
  const deckMat = createMaterial(0xd97706, 0.7);
  const hull = new THREE.Mesh(new THREE.BoxGeometry(5.5, 2.2, 13), hullMat);
  hull.position.y = 1.0;
  hull.castShadow = true;
  hull.receiveShadow = true;
  ship.add(hull);

  const bow = new THREE.Mesh(new THREE.ConeGeometry(3.8, 4.5, 4), hullMat);
  bow.rotation.x = Math.PI / 2;
  bow.rotation.y = Math.PI / 4;
  bow.position.set(0, 1.0, 8.2);
  ship.add(bow);

  const deck = new THREE.Mesh(new THREE.BoxGeometry(5.1, 0.2, 12.6), deckMat);
  deck.position.y = 2.15;
  deck.receiveShadow = true;
  ship.add(deck);

  const sheepHead = new THREE.Mesh(new THREE.SphereGeometry(0.85, 16, 16), createMaterial(0xf8fafc));
  sheepHead.position.set(0, 2.7, 9.5);
  const leftHorn = new THREE.Mesh(new THREE.TorusGeometry(0.45, 0.14, 8, 16), createMaterial(0xd97706));
  leftHorn.position.set(-0.7, 2.8, 9.3);
  leftHorn.rotation.y = Math.PI / 2;
  const rightHorn = leftHorn.clone();
  rightHorn.position.x = 0.7;
  ship.add(sheepHead, leftHorn, rightHorn);

  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.28, 11, 12), createMaterial(0x78350f));
  mast.position.set(0, 7.2, 0.5);
  ship.add(mast);

  const sail = new THREE.Mesh(new THREE.BoxGeometry(6.2, 5.2, 0.15), createMaterial(0xf8fafc));
  sail.position.set(0, 8.2, 0.8);
  ship.add(sail);

  const emblem = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, 0.2, 20), createMaterial(0xfacc15));
  emblem.rotation.x = Math.PI / 2;
  emblem.position.set(0, 8.2, 0.9);
  const emblemBand = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.28, 0.24), createMaterial(0xdc2626));
  emblemBand.position.set(0, 8.2, 0.9);
  ship.add(emblem, emblemBand);

  const helm = new THREE.Mesh(new THREE.TorusGeometry(0.65, 0.08, 8, 16), createMaterial(0x451a03));
  helm.position.set(0, 3.1, -3.5);
  ship.add(helm);

  return ship;
}
