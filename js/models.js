
import * as THREE from 'three';
import { GLTFLoader } from './GLTFLoader.js';
import { mergeGeometries } from './BufferGeometryUtils.js';

// ========================================
// MATERIALS AND HELPERS
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
  mesh.scale.set(...scale);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);

  return mesh;
}

// ========================================
// PROCEDURAL CHARACTER
// ========================================

const characterMaterialCache = new Map();

function mergeStaticMeshes(group) {
  const buckets=new Map();
  for(const child of [...group.children]){
    if(!child.isMesh||!child.geometry||Array.isArray(child.material)||child.userData.keepSeparate)continue;
    child.updateMatrix();
    const geometry=child.geometry.clone();geometry.applyMatrix4(child.matrix);
    const list=buckets.get(child.material)||[];list.push({geometry,source:child});buckets.set(child.material,list);
  }
  for(const [material,items] of buckets){
    const compatible=new Map();
    for(const item of items){
      const signature=Object.keys(item.geometry.attributes).sort().map(name=>{
        const a=item.geometry.attributes[name];return `${name}:${a.itemSize}:${a.array.constructor.name}:${a.normalized}`;
      }).join('|');
      const list=compatible.get(signature)||[];list.push(item);compatible.set(signature,list);
    }
    for(const groupItems of compatible.values()){
      if(groupItems.length<2){groupItems.forEach(item=>item.geometry.dispose());continue;}
      let merged=null;
      try{merged=mergeGeometries(groupItems.map(item=>item.geometry),false);}catch(error){console.warn('Character mesh merge skipped:',error);}
      if(!merged){groupItems.forEach(item=>item.geometry.dispose());continue;}
      groupItems.forEach(item=>{group.remove(item.source);item.source.geometry.dispose();item.geometry.dispose();});
      merged.computeBoundingSphere();
      const mesh=new THREE.Mesh(merged,material);mesh.castShadow=true;mesh.receiveShadow=true;mesh.frustumCulled=true;group.add(mesh);
    }
  }
}

function fabricTexture(base = '#75604a', seed = 1) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 256;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, 256, 256);
  // Fine woven fibres, irregular dye variation and subtle seam-like grain.
  let state = seed >>> 0;
  const rand = () => { state = (state * 1664525 + 1013904223) >>> 0; return state / 4294967296; };
  for (let i = 0; i < 10500; i++) {
    const a = rand() * .12;
    ctx.fillStyle = rand() > .5 ? `rgba(255,238,205,${a})` : `rgba(20,15,12,${a})`;
    const x = rand() * 256, y = rand() * 256;
    ctx.fillRect(x, y, .5 + rand() * 1.4, .35 + rand() * .8);
  }
  ctx.strokeStyle = 'rgba(25,18,13,.10)'; ctx.lineWidth = 1;
  for (let y = 0; y < 256; y += 8) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(256,y); ctx.stroke(); }
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1.5, 2.2);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

function characterMat(key, color, roughness = .9, metalness = 0, textured = false) {
  if (characterMaterialCache.has(key)) return characterMaterialCache.get(key);
  const material = new THREE.MeshStandardMaterial({
    color, roughness, metalness,
    map: textured ? fabricTexture('#bdbdbd', key.length * 7919) : null
  });
  characterMaterialCache.set(key, material);
  return material;
}

function createProceduralCharacter(type = 'pirate') {
  // Stylized-realistic low-poly character with a continuous silhouette, layered
  // cloth, shaped anatomy and role-specific 16th-century-inspired pirate attire.
  const root = new THREE.Group();
  const palettes = {
    luffy:[0xb9784e,0xb92f2b,0x263b55,0x30221b], shanks:[0xb9784e,0x7d2927,0x29252a,0x6a3422],
    garp:[0xb9784e,0x315b82,0x34445c,0xaaa18c], ace:[0x9e6847,0x28252a,0x65432e,0x2c211b],
    sabo:[0xc18a62,0x344d69,0x55402e,0x9b7747], zoro:[0xb9784e,0xe2dfd3,0x31513d,0x36513a],
    nami:[0xd6a27d,0x4d91a1,0x344a65,0xc77b36], sanji:[0xc58d68,0x202b38,0x202b38,0x40332d],
    marine:[0xc18a62,0xd8d9d6,0x263e5a,0x263e5a], mayor:[0xb9784e,0x667d42,0x55432f,0xaaa18c],
    morgan:[0xb9784e,0x334052,0x273044,0xc1a34e], pirate:[0xb9784e,0x794039,0x37313a,0x30231e],
    civilian:[0xb9784e,0x9a7654,0x51473d,0x4b382d], merchant:[0xc58d68,0x55766b,0x554333,0x49372a],
    sailor:[0xb9784e,0xe2ded0,0x39536a,0x43352b], guard:[0xb9784e,0x8b4134,0x38465a,0x2b2927],
    fisher:[0x986b4f,0x496b65,0x4a4034,0x352c24], cook:[0xc58d68,0xe6d9c2,0x3e454b,0x4b3025],
    traveler:[0xc18a62,0x76513e,0x4a4b51,0x30241d], noble:[0xe0b995,0x6d527d,0x45384b,0x513a2e],
    bandit:[0x9f6c4c,0x74402e,0x39333a,0x241d1b], swordsman:[0xb9784e,0x718b70,0x293d34,0x2b211c],
    innkeeper:[0xb9784e,0x79583e,0x4d4037,0x5a3927], navigator:[0xd6a27d,0x527c8b,0x344a65,0xb56d38],
    porter:[0x9e704f,0x8a6b4b,0x51473d,0x33251f], carpenter:[0xb9784e,0x9a6339,0x4c443a,0x39291f],
    doctor:[0xc58d68,0xe8e2d4,0x52606b,0x6c503e]
  };
  const [skin, shirt, trousers, hair] = palettes[type] || palettes.pirate;
  const skinMat = characterMat(`skin-${skin}`, skin, .78);
  const cloth = characterMat(`cloth-${shirt}`, shirt, .94, 0, true);
  const pants = characterMat(`pants-${trousers}`, trousers, .96, 0, true);
  const hairMat = characterMat(`hair-${hair}`, hair, .92);
  const dark = characterMat('leather-dark', 0x29231f, .88);
  const leather = characterMat('leather-warm', 0x68452f, .9, 0, true);
  const brass = characterMat('aged-brass', 0xb08a4f, .38, .58);
  const ivory = characterMat('eye-ivory', 0xf0e7d6, .55);
  const iris = characterMat('eye-ink', 0x30251d, .42);
  const rootBody = new THREE.Group(); root.add(rootBody);
  const add = (geo, material, parent, pos, scale, rot) => {
    const mesh = new THREE.Mesh(geo, material);
    if (pos) mesh.position.set(...pos);
    if (scale) mesh.scale.set(...scale);
    if (rot) mesh.rotation.set(...rot);
    mesh.castShadow = true; mesh.receiveShadow = true; parent.add(mesh); return mesh;
  };
  const lathe = (profile, material, parent, pos, radial = 18) => add(
    new THREE.LatheGeometry(profile.map(p => new THREE.Vector2(p[0],p[1])), radial), material, parent, pos
  );
  const capsule = (radius, length, material, parent, pos, scale) => add(
    new THREE.CapsuleGeometry(radius, length, 7, 12), material, parent, pos, scale
  );

  // Legs are tapered and jointed; boots and trouser cuffs give a grounded stance.
  const legs = [], arms = [];
  for (const side of [-1, 1]) {
    const hip = new THREE.Group(); hip.position.set(side*.145, .98, 0); rootBody.add(hip);
    capsule(.125,.34,pants,hip,[0,-.22,0],[.92,1,.88]);
    add(new THREE.SphereGeometry(.115,14,12),pants,hip,[0,-.43,0],[1,.9,.95]);
    capsule(.105,.34,pants,hip,[0,-.66,0],[.9,1,.92]);
    add(new THREE.TorusGeometry(.105,.018,7,16),leather,hip,[0,-.48,0],[1,1,.94],[Math.PI/2,0,0]);
    add(new THREE.CapsuleGeometry(.115,.18,5,10),leather,hip,[0,-.91,.09],[1,.58,1.45]);
    legs.push(hip);

    const shoulder = new THREE.Group(); shoulder.position.set(side*.34,1.79,0); rootBody.add(shoulder);
    add(new THREE.SphereGeometry(.155,16,12),cloth,shoulder,[0,-.07,0],[1,1,.95]);
    capsule(.105,.36,cloth,shoulder,[0,-.29,0],[1,1,.94]);
    const elbow = new THREE.Group(); elbow.position.set(0,-.48,0); shoulder.add(elbow);
    add(new THREE.SphereGeometry(.09,12,10),skinMat,elbow,[0,-.015,.005]);
    capsule(.078,.30,skinMat,elbow,[0,-.19,.018]);
    add(new THREE.SphereGeometry(.085,12,10),skinMat,elbow,[0,-.39,.045],[1,.82,.92]);
    add(new THREE.TorusGeometry(.108,.022,7,16),leather,shoulder,[0,-.47,0],[1,1,1],[Math.PI/2,0,0]);
    arms.push({shoulder, elbow});
  }

  // Pelvis, waistcoat and shaped torso use lathed profiles instead of stacked cubes.
  lathe([[.18,.82],[.25,.91],[.27,1.08],[.23,1.22],[.26,1.35],[.32,1.52],[.34,1.72],[.28,1.88],[.17,1.94],[.12,1.86]], pants, rootBody, [0,0,0]);
  lathe([[.17,1.18],[.24,1.25],[.28,1.43],[.34,1.61],[.32,1.78],[.25,1.91],[.13,1.96]], cloth, rootBody, [0,0,0]);
  // Waist sash, belt, buckle and diagonal leather cross-body strap.
  add(new THREE.TorusGeometry(.245,.055,8,24),characterMat('sash-red',0x9c3d31,.95,0,true),rootBody,[0,1.23,0],[1,1,.88],[Math.PI/2,0,0]);
  add(new THREE.TorusGeometry(.245,.027,7,24),leather,rootBody,[0,1.13,0],[1,1,.9],[Math.PI/2,0,0]);
  add(new THREE.BoxGeometry(.115,.12,.035),brass,rootBody,[0,1.13,.25]);
  const strap = add(new THREE.CapsuleGeometry(.035,.75,4,8),leather,rootBody,[-.13,1.58,.22],[1,1,1],[0,0,-.38]);
  strap.rotation.z=-.34;
  // Neck and sculpted head with tapered jaw/cheek profile.
  lathe([[.075,1.91],[.105,2.02],[.105,2.15],[.09,2.2]],skinMat,rootBody,[0,0,0],14);
  const head = new THREE.Group(); head.position.set(0,2.29,0); rootBody.add(head);
  lathe([[.035,-.20],[.105,-.17],[.17,-.08],[.205,.035],[.20,.16],[.16,.245],[.09,.29],[.025,.30]],skinMat,head,[0,0,0],20);
  // Ears, brow ridge, inset eyes, nose bridge and mouth create a readable face.
  for (const side of [-1,1]) {
    add(new THREE.SphereGeometry(.052,12,10),skinMat,head,[side*.198,.015,0],[.62,1,.72]);
    add(new THREE.SphereGeometry(.048,12,10),ivory,head,[side*.078,.045,.178],[1,.68,.35]);
    add(new THREE.SphereGeometry(.021,10,8),iris,head,[side*.078,.045,.195],[1,1,.5]);
    add(new THREE.CapsuleGeometry(.018,.065,3,6),hairMat,head,[side*.078,.105,.18],[1,.55,1],[0,0,side*.1]);
  }
  add(new THREE.ConeGeometry(.035,.105,8),skinMat,head,[0,-.015,.19],[.65,1,.7],[Math.PI/2,0,0]);
  add(new THREE.CapsuleGeometry(.012,.075,3,5),dark,head,[0,-.105,.174],[1,.45,.6]);
  // Hair cap and swept locks with role-specific facial hair.
  add(new THREE.SphereGeometry(.205,18,12),hairMat,head,[0,.235,-.018],[1.04,.52,.98]);
  for (let i=0;i<5;i++) {
    const x=(i-2)*.078;
    add(new THREE.ConeGeometry(.055,.19,8),hairMat,head,[x,.205,.12+Math.abs(i-2)*.008],[1,1,.82],[.18,0,(i-2)*.13]);
  }
  if (['shanks','garp','mayor','pirate','morgan'].includes(type)) {
    add(new THREE.CapsuleGeometry(.075,.12,4,8),hairMat,head,[0,-.15,.11],[1,.8,.65]);
  }

  // Open-front vest / coat lapels, hem panels and sleeve piping.
  const trim = brass;
  for (const side of [-1,1]) {
    const lapel = add(new THREE.ConeGeometry(.105,.34,4),cloth,rootBody,[side*.13,1.77,.245],[1,.8,.5],[.18,0,side*.22]);
    lapel.rotation.z=side*.18;
    add(new THREE.CapsuleGeometry(.026,.43,4,6),trim,rootBody,[side*.13,1.53,.252],[1,1,.7],[0,0,side*.06]);
    add(new THREE.SphereGeometry(.025,8,6),brass,rootBody,[side*.22,1.44,.26]);
  }
  // Role-specific One Piece-inspired silhouettes and period accessories.
  if (type==='marine' || type==='guard' || type==='morgan') {
    const hat = new THREE.Group();
    add(new THREE.CylinderGeometry(.255,.245,.055,24),brass,hat,[0,0,0]);
    add(new THREE.CylinderGeometry(.16,.19,.16,18),cloth,hat,[0,.09,0]);
    add(new THREE.BoxGeometry(.17,.065,.025),brass,hat,[0,.1,.18]);
    hat.position.y=2.59; rootBody.add(hat);
    add(new THREE.CapsuleGeometry(.035,.34,4,7),brass,rootBody,[.29,1.62,.03],[1,1,1],[0,0,-.7]);
  } else if (['merchant','mayor','fisher','cook','traveler','noble','bandit','swordsman','innkeeper','navigator','porter','carpenter','doctor'].includes(type)) {
    const hat = new THREE.Group();
    if(type==='cook'){
      const white=characterMat('chef-white',0xe9e3d4,.98,0,true);
      add(new THREE.CylinderGeometry(.16,.18,.12,16),white,hat,[0,0,0]);
      add(new THREE.CylinderGeometry(.15,.12,.28,16),white,hat,[0,.18,0]);
      add(new THREE.TorusGeometry(.16,.025,6,16),characterMat('chef-band',0x9c3c32,.92),hat,[0,.04,0]);
    } else if(type==='fisher'){
      const straw=characterMat('straw-hat',0xb69a60,.98,0,true);
      add(new THREE.CylinderGeometry(.34,.32,.045,22),straw,hat,[0,0,0]);
      add(new THREE.CylinderGeometry(.17,.21,.18,18),straw,hat,[0,.1,0]);
    } else if(type==='noble'){
      add(new THREE.CylinderGeometry(.31,.27,.055,22),leather,hat,[0,0,0]);
      add(new THREE.CylinderGeometry(.17,.19,.2,18),hairMat,hat,[0,.11,0]);
      add(new THREE.ConeGeometry(.055,.38,5),characterMat('noble-feather',0xe8dfc7,.8),hat,[.12,.34,0],[1,1,.55],[0,0,-.35]);
    } else if(type==='bandit'||type==='swordsman'||type==='traveler'){
      add(new THREE.TorusGeometry(.205,.035,7,22),leather,head,[0,.19,0],[1,1,.94],[Math.PI/2,0,0]);
    } else {
      add(new THREE.CylinderGeometry(.28,.25,.055,20),leather,hat,[0,0,0]);
      add(new THREE.CylinderGeometry(.16,.19,.19,16),hairMat,hat,[0,.1,0]);
    }
    if(type!=='bandit'&&type!=='swordsman'&&type!=='traveler'){hat.position.y=2.59;rootBody.add(hat);}
    add(new THREE.CapsuleGeometry(.045,.32,4,7),leather,rootBody,[.22,1.12,.2],[1,1,1],[0,0,.55]);
  } else if (['pirate','sailor','shanks','ace','civilian','fisher','cook','traveler','bandit','swordsman','innkeeper','navigator','porter','carpenter','doctor'].includes(type)) {
    const band = add(new THREE.TorusGeometry(.205,.026,7,22),leather,head,[0,.19,0],[1,1,.94],[Math.PI/2,0,0]);
    if (type==='pirate' || type==='sailor') {
      const brim=add(new THREE.CylinderGeometry(.31,.29,.045,24),hairMat,head,[0,.205,0]);
      const crown=add(new THREE.CylinderGeometry(.17,.20,.19,18),hairMat,head,[0,.30,0]);
      brim.rotation.z=-.08; crown.rotation.z=-.08;
    }
  }
  // Signature silhouettes for the core Straw Hat cast when the GLTF is unavailable.
  if(type==='luffy'){
    const straw=characterMat('luffy-straw',0xc6a45f,.98,0,true),redBand=characterMat('luffy-hat-band',0x9f302b,.88);
    add(new THREE.CylinderGeometry(.34,.32,.055,28),straw,rootBody,[0,2.59,0]);
    add(new THREE.CylinderGeometry(.18,.22,.22,20),straw,rootBody,[0,2.71,0]);
    add(new THREE.TorusGeometry(.205,.028,7,24),redBand,rootBody,[0,2.68,0],[1,1,1],[Math.PI/2,0,0]);
    add(new THREE.CapsuleGeometry(.012,.075,3,5),characterMat('luffy-scar',0x6d3b2c,.9),head,[-.105,-.075,.17],[1,.55,1],[0,0,-.18]);
  }
  if(type==='ace'){
    const orange=characterMat('ace-hat',0xb97832,.88,0,true),beads=characterMat('ace-beads',0xd6b65e,.72);
    add(new THREE.CylinderGeometry(.31,.28,.06,24),orange,rootBody,[0,2.59,0]);
    add(new THREE.CylinderGeometry(.18,.2,.2,18),orange,rootBody,[0,2.7,0]);
    for(let i=0;i<9;i++){const a=i/9*Math.PI*2;add(new THREE.SphereGeometry(.035,8,6),beads,rootBody,[Math.cos(a)*.24,2.64,Math.sin(a)*.24]);}
  }
  if(type==='sabo'){
    const blueHat=characterMat('sabo-top-hat',0x344b68,.9,0,true);
    add(new THREE.CylinderGeometry(.28,.25,.05,24),leather,rootBody,[0,2.59,0]);
    add(new THREE.CylinderGeometry(.19,.21,.34,20),blueHat,rootBody,[0,2.77,0]);
    add(new THREE.TorusGeometry(.19,.022,6,22),brass,rootBody,[0,2.68,0],[1,1,1],[Math.PI/2,0,0]);
  }
  if(type==='zoro'){
    const bandana=characterMat('zoro-bandana',0x315a43,.94,0,true);
    add(new THREE.TorusGeometry(.205,.035,7,24),bandana,head,[0,.18,-.005],[1,1,.96],[Math.PI/2,0,0]);
    for(let i=0;i<3;i++){
      const sheath=add(new THREE.CapsuleGeometry(.035,.66,4,7),leather,rootBody,[.32+i*.075,1.0,-.12-i*.08],[1,1,1],[0,0,-.52+i*.08]);
      add(new THREE.TorusGeometry(.045,.012,5,10),brass,rootBody,[.32+i*.075,.78,-.12-i*.08],[1,1,1],[Math.PI/2,0,0]);
    }
  }
  if(type==='shanks'){
    const scar=characterMat('shanks-scar',0x71352d,.9);
    for(let i=0;i<3;i++)add(new THREE.CapsuleGeometry(.012,.13,3,5),scar,head,[-.105-i*.025,.055-i*.045,.17],[1,.55,1],[0,0,-.42]);
  }

  // Pouches, stitched cuffs, boot straps and a sheathed short cutlass for sailors/pirates.
  add(new THREE.BoxGeometry(.16,.18,.10),leather,rootBody,[.27,1.05,.12],[1,1,1],[0,.2,.12]);
  for (const side of [-1,1]) {
    add(new THREE.TorusGeometry(.09,.014,6,14),trim,arms[side===-1?0:1].shoulder,[0,-.45,0],[1,1,1],[Math.PI/2,0,0]);
  }
  if (['pirate','sailor','guard','marine'].includes(type)) {
    const scabbard=add(new THREE.CapsuleGeometry(.035,.48,4,7),dark,rootBody,[.34,.88,-.08],[1,1,1],[0,0,-.42]);
    add(new THREE.ConeGeometry(.04,.10,8),brass,rootBody,[.34,.59,-.08],[1,1,1],[Math.PI,0,0]);
  }
  if (type==='marine' || type==='guard') {
    // A compact matchlock/arquebus carried on the back, appropriate to the era.
    const stock=add(new THREE.BoxGeometry(.13,.14,.72),leather,rootBody,[-.30,1.48,-.19],[1,1,1],[.12,0,-.18]);
    const barrel=add(new THREE.CylinderGeometry(.035,.05,1.08,9),brass,rootBody,[-.30,1.91,-.23],[1,1,1],[Math.PI/2,0,0]);
    add(new THREE.TorusGeometry(.055,.012,5,10),brass,rootBody,[-.30,1.64,-.2],[1,1,1],[Math.PI/2,0,0]);
  }

  // Merge static anatomy, clothing and facial detail into smooth material batches.
  // Only articulated pivots remain separate, reducing draw calls substantially.
  mergeStaticMeshes(rootBody);
  mergeStaticMeshes(head);
  arms.forEach(({shoulder,elbow})=>{mergeStaticMeshes(shoulder);mergeStaticMeshes(elbow);});
  legs.forEach(mergeStaticMeshes);

  root.userData.animate=(time=0,speed=0,state='idle',progress=0)=>{
    const moving=state==='walk'||state==='run';
    const stride=state==='run'?10.5:7.2;
    const swing=moving?Math.sin(time*stride)*Math.min(1,speed):0;
    legs[0].rotation.x=swing*.78; legs[1].rotation.x=-swing*.78;
    arms[0].shoulder.rotation.x=-swing*.62; arms[1].shoulder.rotation.x=swing*.62;
    arms[0].elbow.rotation.x=moving?-.12:Math.sin(time*1.4)*.025;
    arms[1].elbow.rotation.x=moving?-.12:Math.sin(time*1.4+1)*.025;
    if(state==='pistol') arms[1].shoulder.rotation.x=-.92-Math.sin(progress*Math.PI)*.2;
    if(state==='gatling') { arms[0].shoulder.rotation.x=-.9+Math.sin(time*24)*.10; arms[1].shoulder.rotation.x=-.9-Math.sin(time*24)*.10; }
    if(state==='wave') { arms[1].shoulder.rotation.x=-1.18+Math.sin(time*5)*.12; arms[1].shoulder.rotation.z=-.18; }
    if(state==='talk') { arms[0].shoulder.rotation.x=-.48+Math.sin(time*4.2)*.22; arms[1].shoulder.rotation.x=-.35+Math.sin(time*3.8+1)*.2; }
    if(state==='stretch') { arms[0].shoulder.rotation.z=.95; arms[1].shoulder.rotation.z=-.95; arms[0].shoulder.rotation.x=-.15; arms[1].shoulder.rotation.x=-.15; }
    if(state==='inspect') { arms[0].shoulder.rotation.x=-.85; arms[1].shoulder.rotation.x=-.85; arms[0].elbow.rotation.x=-.55; arms[1].elbow.rotation.x=-.55; }
    if(state==='fish') { arms[0].shoulder.rotation.x=-.82+Math.sin(time*2.2)*.08; arms[1].shoulder.rotation.x=-.25; arms[1].elbow.rotation.x=-.35; }
    if(state==='carry') { arms[0].shoulder.rotation.x=-.72; arms[1].shoulder.rotation.x=-.72; arms[0].elbow.rotation.x=-.35; arms[1].elbow.rotation.x=-.35; }
    if(state==='sweep') { arms[1].shoulder.rotation.x=-.25+Math.sin(time*4)*.45; arms[1].shoulder.rotation.z=-.2; }
    if(state==='point') { arms[1].shoulder.rotation.x=-1.15; arms[1].elbow.rotation.x=-.12; }
    if(state==='gashing') { const hit=Math.sin(Math.min(1,progress)*Math.PI); arms[0].shoulder.rotation.x=-1.05-hit*.35; arms[1].shoulder.rotation.x=-1.05-hit*.35; arms[0].elbow.rotation.x=-.3; arms[1].elbow.rotation.x=-.3; rootBody.rotation.x=-.08+hit*.1; }
    rootBody.position.y=(moving?Math.abs(Math.sin(time*stride))*.035:Math.sin(time*1.65)*.012);
    rootBody.rotation.z=moving?Math.sin(time*3.4)*.018:Math.sin(time*.7)*.006;
    head.rotation.y=state==='lookout'?Math.sin(time*.75)*.48:(moving?Math.sin(time*1.7)*.025:Math.sin(time*.8)*.035);
    head.rotation.x=Math.sin(time*1.15)*.012;
  };
  root.userData.characterStyle='tailored-procedural';
  return root;
}

// ========================================
// LUFFY MODEL
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

  const bones = {};

  const X_AXIS = new THREE.Vector3(1, 0, 0);
  const Y_AXIS = new THREE.Vector3(0, 1, 0);
  const Z_AXIS = new THREE.Vector3(0, 0, 1);

  function findBone(model, pattern) {
    let found = null;

    model.traverse((object) => {
      if (object.isBone && pattern.test(object.name)) {
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

  // ========================================
  // FIND ANIMATION BONES
  // ========================================

  function setupBones(model) {
    bones.leftThigh = saveBone(findBone(model, /thigh\.L_/i));
    bones.rightThigh = saveBone(findBone(model, /thigh\.R_/i));

    bones.leftKnee = saveBone(findBone(model, /knee\.L_/i));
    bones.rightKnee = saveBone(findBone(model, /knee\.R_/i));

    bones.leftShoulder = saveBone(findBone(model, /shoulder 1\.L_/i));
    bones.rightShoulder = saveBone(findBone(model, /shoulder 1\.R_/i));

    bones.leftElbow = saveBone(findBone(model, /elbow\.L_/i));
    bones.rightElbow = saveBone(findBone(model, /elbow\.R_/i));

    bones.leftAnkle = saveBone(findBone(model, /ankle\.L_431/i));
    bones.rightAnkle = saveBone(findBone(model, /ankle\.R_442/i));

    bones.leftToe = saveBone(findBone(model, /toes\.L_433/i));
    bones.rightToe = saveBone(findBone(model, /toes\.R_444/i));

    bones.spine = saveBone(findBone(model, /spine upper_/i));

    const found = Object.keys(bones).filter(
      key => bones[key] !== null
    );

    console.log('LUFFY ANIMATION BONES FOUND:', found);
    console.log('LUFFY ANIMATION BONE COUNT:', found.length);
    const coreRig=['leftThigh','rightThigh','leftShoulder','rightShoulder'];
    root.userData.rigReady = found.length >= 8 && coreRig.every(key=>bones[key]!==null);

    for (const [name, bone] of Object.entries(bones)) {
      if (!bone) {
        console.warn('Missing Luffy bone:', name);
      }
    }
  }

  // ========================================
  // WALKING AND ACTION ANIMATION
  // ========================================

  function animateSkeleton(time, state, speed, progress) {
    const moving = state === 'walk' || state === 'run';
    const running = state === 'run';

    const stride = running ? 11 : 8;
    const phase = time * stride;

    const leftPhase = Math.sin(phase);
    const rightPhase = Math.sin(phase + Math.PI);

    const strength = moving
      ? (running ? 0.65 : 0.48)
      : 0;

    // Legs swing around their measured local Z axes.
    rotateBone(
      bones.leftThigh,
      Z_AXIS,
      -leftPhase * strength
    );

    rotateBone(
      bones.rightThigh,
      Z_AXIS,
      -rightPhase * strength
    );

    // Knees bend during the lifting part of each step.
    const kneeStrength = running ? 0.95 : 0.75;

    const leftKnee = moving
      ? Math.max(0, Math.cos(phase)) * kneeStrength
      : 0;

    const rightKnee = moving
      ? Math.max(0, Math.cos(phase + Math.PI)) * kneeStrength
      : 0;

    rotateBone(bones.leftKnee, Z_AXIS, leftKnee);
    rotateBone(bones.rightKnee, Z_AXIS, rightKnee);

    // Ankle movement follows the knee bend.
    rotateBone(
      bones.leftAnkle,
      Z_AXIS,
      -leftKnee * 0.3
    );

    rotateBone(
      bones.rightAnkle,
      Z_AXIS,
      -rightKnee * 0.3
    );

    rotateBone(
      bones.leftToe,
      Z_AXIS,
      moving ? Math.max(0, leftPhase) * 0.12 : 0
    );

    rotateBone(
      bones.rightToe,
      Z_AXIS,
      moving ? Math.max(0, rightPhase) * 0.12 : 0
    );

    // Lower the arms from the original T-pose.
    // Both shoulders use their measured local Y axis.
    const armBase = 1.05;
    const armSwing = moving ? leftPhase * 0.16 : 0;

    rotateBone(
      bones.leftShoulder,
      Y_AXIS,
      armBase + armSwing
    );

    rotateBone(
      bones.rightShoulder,
      Y_AXIS,
      armBase - armSwing
    );

    rotateBone(
      bones.leftElbow,
      X_AXIS,
      moving ? 0.12 : 0
    );

    rotateBone(
      bones.rightElbow,
      X_AXIS,
      moving ? 0.12 : 0
    );

    rotateBone(
      bones.spine,
      X_AXIS,
      moving ? -0.04 : 0
    );

    // Jump pose.
    if (state === 'jump') {
      rotateBone(bones.leftThigh, Z_AXIS, -0.45);
      rotateBone(bones.rightThigh, Z_AXIS, -0.45);

      rotateBone(bones.leftKnee, Z_AXIS, 0.85);
      rotateBone(bones.rightKnee, Z_AXIS, 0.85);
    }

    // Pistol pose.
    if (state === 'pistol') {
      const punch = Math.sin(
        Math.PI * Math.min(1, progress)
      );

      rotateBone(
        bones.rightShoulder,
        Y_AXIS,
        armBase + 0.8 * punch
      );

      rotateBone(
        bones.rightElbow,
        X_AXIS,
        -0.25 * punch
      );
    }

    // Gatling pose.
    if (state === 'gatling') {
      const rapid = Math.sin(time * 35);

      rotateBone(
        bones.leftShoulder,
        Y_AXIS,
        armBase + rapid * 0.45
      );

      rotateBone(
        bones.rightShoulder,
        Y_AXIS,
        armBase - rapid * 0.45
      );
    }
    if (state === 'gashing') {
      const impact = Math.sin(Math.PI * Math.min(1,progress));
      rotateBone(bones.leftShoulder,Y_AXIS,armBase+0.75+impact*.3);
      rotateBone(bones.rightShoulder,Y_AXIS,armBase+0.75+impact*.3);
      rotateBone(bones.leftElbow,X_AXIS,-.28);
      rotateBone(bones.rightElbow,X_AXIS,-.28);
      rotateBone(bones.spine,X_AXIS,-.12+impact*.08);
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
        : THREE.MathUtils.clamp(time - previousTime, 0, 0.05);

      mixer.update(delta);
      previousTime = time;
    }

    animateSkeleton(time, state, speed, progress);
  };

  // ========================================
  // LOAD LUFFY GLTF
  // ========================================

  loader.load(
    './model/Luffy/scene.gltf',

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
      if(!root.userData.rigReady){
        root.userData.loadFailed=true;
        console.warn('Luffy GLTF rig is incomplete; keeping the animated character fallback instead of displaying a T-pose.');
        return;
      }

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
  const ship=new THREE.Group();
  const wood=new THREE.MeshStandardMaterial({color:0x70432e,roughness:.9});
  const plankMat=new THREE.MeshStandardMaterial({color:0x9a6844,roughness:.92});
  const darkWood=new THREE.MeshStandardMaterial({color:0x493025,roughness:.95});
  const brass=new THREE.MeshStandardMaterial({color:0xb18b50,roughness:.38,metalness:.58});
  const canvasMat=new THREE.MeshStandardMaterial({color:0xf1eadb,roughness:.98,side:THREE.DoubleSide});
  const red=new THREE.MeshStandardMaterial({color:0x9d3831,roughness:.9});
  const add=(geo,mat,pos,rot,scale)=>{const m=new THREE.Mesh(geo,mat);if(pos)m.position.set(...pos);if(rot)m.rotation.set(...rot);if(scale)m.scale.set(...scale);m.castShadow=true;m.receiveShadow=true;ship.add(m);return m;};

  // Curved V-hull assembled from tapered stations rather than a rectangular box.
  const stations=[[-7.1,.04],[-5.8,1.35],[-3.8,2.12],[-1.2,2.55],[2.2,2.5],[4.7,2.12],[6.3,1.45],[7.2,.08]];
  const vertices=[],indices=[];
  stations.forEach(([z,w])=>vertices.push(-w,1.95,z,w,1.95,z,0,.38,z));
  for(let i=0;i<stations.length-1;i++){const a=i*3,b=(i+1)*3;indices.push(a,b,a+2,a+2,b,b+2,a+1,b+1,a+2,a+2,b+1,b+2);}
  const hullGeo=new THREE.BufferGeometry();hullGeo.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));hullGeo.setIndex(indices);hullGeo.computeVertexNormals();
  const hull=new THREE.Mesh(hullGeo,wood);hull.material.side=THREE.DoubleSide;hull.castShadow=true;hull.receiveShadow=true;ship.add(hull);
  // Layered strakes and bright upper wale follow the ship's tapered profile.
  for(let level=0;level<3;level++){
    const y=.78+level*.42,ptsL=[],ptsR=[];
    stations.forEach(([z,w])=>{const width=w*(.55+level*.16);ptsL.push(new THREE.Vector3(-width,y,z));ptsR.push(new THREE.Vector3(width,y,z));});
    for(const pts of [ptsL,ptsR]){const curve=new THREE.CatmullRomCurve3(pts);const line=new THREE.Mesh(new THREE.TubeGeometry(curve,48,.055,6,false),level===2?red:darkWood);ship.add(line);}
  }
  // Deck and long individual deck planks.
  const deck=new THREE.Mesh(new THREE.BoxGeometry(4.7,.22,12.4),plankMat);deck.position.set(0,2.02,-.05);deck.castShadow=true;deck.receiveShadow=true;ship.add(deck);
  for(let i=0;i<12;i++){
    const x=-2.15+i*.39;const board=new THREE.Mesh(new THREE.BoxGeometry(.34,.07,11.7),i%3===0?wood:plankMat);board.position.set(x,2.16,-.08);ship.add(board);
    for(let z of [-5.2,5.2]){const nail=new THREE.Mesh(new THREE.SphereGeometry(.035,7,6),brass);nail.position.set(x,2.205,z);ship.add(nail);}
  }
  // Raised gunwales with carved rails and evenly spaced posts.
  for(const side of [-1,1]){
    const rail=new THREE.Mesh(new THREE.BoxGeometry(.18,.52,11.7),darkWood);rail.position.set(side*2.34,2.42,-.1);ship.add(rail);
    for(let i=0;i<9;i++){
      const post=new THREE.Mesh(new THREE.CylinderGeometry(.075,.09,.8,8),plankMat);post.position.set(side*2.34,2.55,-5.25+i*1.28);ship.add(post);
      const cap=new THREE.Mesh(new THREE.SphereGeometry(.09,8,6),brass);cap.position.set(side*2.34,2.98,-5.25+i*1.28);ship.add(cap);
    }
    const topRail=new THREE.Mesh(new THREE.BoxGeometry(.14,.13,11.8),plankMat);topRail.position.set(side*2.34,2.93,-.1);ship.add(topRail);
  }
  // Stern cabin with door, framed windows and a tiled roof.
  const cabin=new THREE.Group();
  const cabinWall=new THREE.MeshStandardMaterial({color:0xd9c5a0,roughness:.96});
  const cabinBody=new THREE.Mesh(new THREE.BoxGeometry(3.7,1.65,2.7),cabinWall);cabinBody.position.y=2.95;cabin.add(cabinBody);
  const cabinRoof=new THREE.Mesh(new THREE.BoxGeometry(4.1,.22,3.1),red);cabinRoof.position.y=3.83;cabinRoof.rotation.x=.02;cabin.add(cabinRoof);
  for(const x of [-1.05,1.05]){
    const frame=new THREE.Mesh(new THREE.BoxGeometry(.78,.72,.1),darkWood);frame.position.set(x,3.1,1.38);cabin.add(frame);
    const glass=new THREE.Mesh(new THREE.BoxGeometry(.58,.5,.08),new THREE.MeshStandardMaterial({color:0x83b4c1,roughness:.28,metalness:.08}));glass.position.set(x,3.1,1.45);cabin.add(glass);
    const cross=new THREE.Mesh(new THREE.BoxGeometry(.06,.5,.05),brass);cross.position.set(x,3.1,1.51);cabin.add(cross);
  }
  const cabinDoor=new THREE.Mesh(new THREE.BoxGeometry(.78,1.3,.12),darkWood);cabinDoor.position.set(0,2.82,1.4);cabin.add(cabinDoor);
  cabin.position.set(0,0,-4.65);ship.add(cabin);

  // Two masts and curved, canvas-textured sails.
  const masts=[{z:-2.2,height:10.8,width:5.6},{z:2.6,height:8.6,width:4.6}];
  ship.userData.sails=[];
  const ropeMat=new THREE.LineBasicMaterial({color:0x574330,transparent:true,opacity:.82});
  const sailCanvas=document.createElement('canvas');sailCanvas.width=512;sailCanvas.height=512;
  const sc=sailCanvas.getContext('2d');sc.fillStyle='#e8e1d2';sc.fillRect(0,0,512,512);
  for(let i=0;i<5000;i++){sc.fillStyle=Math.random()>.5?'rgba(255,255,255,.045)':'rgba(70,57,42,.035)';sc.fillRect(Math.random()*512,Math.random()*512,.6+Math.random()*1.3,.5+Math.random());}
  const sailTexture=new THREE.CanvasTexture(sailCanvas);sailTexture.colorSpace=THREE.SRGBColorSpace;
  const sailCloth=new THREE.MeshStandardMaterial({map:sailTexture,color:0xffffff,roughness:.98,side:THREE.DoubleSide});
  const emblemCanvas=document.createElement('canvas');emblemCanvas.width=256;emblemCanvas.height=256;const ec=emblemCanvas.getContext('2d');
  ec.clearRect(0,0,256,256);ec.fillStyle='#342a27';ec.beginPath();ec.arc(128,112,52,0,Math.PI*2);ec.fill();
  ec.fillStyle='#e8e1d2';ec.beginPath();ec.arc(108,108,9,0,Math.PI*2);ec.arc(148,108,9,0,Math.PI*2);ec.fill();
  ec.strokeStyle='#e8e1d2';ec.lineWidth=8;ec.beginPath();ec.moveTo(103,151);ec.lineTo(153,151);ec.stroke();
  ec.lineWidth=14;ec.beginPath();ec.moveTo(56,193);ec.lineTo(200,230);ec.moveTo(200,193);ec.lineTo(56,230);ec.stroke();
  const emblemTex=new THREE.CanvasTexture(emblemCanvas);emblemTex.colorSpace=THREE.SRGBColorSpace;
  masts.forEach((m,index)=>{
    const mast=new THREE.Mesh(new THREE.CylinderGeometry(.13,.2,m.height,12),darkWood);mast.position.set(0,2.1+m.height/2,m.z);ship.add(mast);
    const yard=new THREE.Mesh(new THREE.CylinderGeometry(.075,.075,m.width+.45,10),darkWood);yard.rotation.z=Math.PI/2;yard.position.set(0,2.1+m.height*.76,m.z);ship.add(yard);
    const sailGeo=new THREE.PlaneGeometry(m.width,m.height*.54,10,12);const a=sailGeo.attributes.position;
    for(let v=0;v<a.count;v++){const x=a.getX(v),y=a.getY(v);a.setZ(v,-.22*Math.sin((x/m.width+.5)*Math.PI)*Math.sin((y/(m.height*.54)+.5)*Math.PI));}sailGeo.computeVertexNormals();
    const sail=new THREE.Mesh(sailGeo,sailCloth);sail.position.set(0,2.1+m.height*.68,m.z+.12);sail.userData.keepSeparate=true;ship.add(sail);ship.userData.sails.push(sail);
    const emblem=new THREE.Mesh(new THREE.PlaneGeometry(1.05,1.05),new THREE.MeshBasicMaterial({map:emblemTex,transparent:true,side:THREE.DoubleSide,depthWrite:false}));emblem.position.set(0,0,.14);sail.add(emblem);
    const flag=new THREE.Mesh(new THREE.PlaneGeometry(1.2,.65),new THREE.MeshStandardMaterial({color:index===0?0x9f3d32:0xe9e2d3,side:THREE.DoubleSide,roughness:1}));flag.position.set(.72,2.1+m.height+.28,m.z);flag.userData.keepSeparate=true;ship.add(flag);if(index===0)ship.userData.flag=flag;
    for(const side of [-1,1]){
      const line=new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0,2.1+m.height,m.z),new THREE.Vector3(side*2.3,2.5,m.z+3.8)]),ropeMat);ship.add(line);
      const backLine=new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0,2.1+m.height,m.z),new THREE.Vector3(side*2.2,2.5,m.z-3.8)]),ropeMat);ship.add(backLine);
    }
  });

  // Merry's sheep figurehead: shaped muzzle, ears, eyes and curled horns.
  const headMat=new THREE.MeshStandardMaterial({color:0xf0e8d8,roughness:.88});
  const head=new THREE.Group();
  const skull=new THREE.Mesh(new THREE.CapsuleGeometry(.42,.62,7,14),headMat);skull.rotation.x=Math.PI/2;head.add(skull);
  const muzzle=new THREE.Mesh(new THREE.SphereGeometry(.32,18,14),new THREE.MeshStandardMaterial({color:0xd6c5ad,roughness:.9}));muzzle.position.set(0,-.12,.42);muzzle.scale.set(1,.78,.75);head.add(muzzle);
  for(const side of [-1,1]){
    const eye=new THREE.Mesh(new THREE.SphereGeometry(.07,12,10),new THREE.MeshStandardMaterial({color:0x2d2926,roughness:.35}));eye.position.set(side*.28,.12,.42);head.add(eye);
    const ear=new THREE.Mesh(new THREE.CapsuleGeometry(.12,.32,5,9),headMat);ear.position.set(side*.48,.1,-.02);ear.rotation.z=side*.72;head.add(ear);
    const hornCurve=new THREE.CatmullRomCurve3([new THREE.Vector3(side*.32,.34,-.02),new THREE.Vector3(side*.62,.62,-.16),new THREE.Vector3(side*.86,.46,-.34),new THREE.Vector3(side*.8,.18,-.4)]);
    const horn=new THREE.Mesh(new THREE.TubeGeometry(hornCurve,18,.09,8,false),new THREE.MeshStandardMaterial({color:0x9c875f,roughness:.8}));head.add(horn);
  }
  head.position.set(0,2.35,7.25);head.rotation.x=-.08;ship.add(head);
  // Anchor, rudder, rope coil and deck cargo.
  const anchorRing=new THREE.Mesh(new THREE.TorusGeometry(.34,.075,8,20),brass);anchorRing.position.set(2.05,1.55,5.65);anchorRing.rotation.x=Math.PI/2;ship.add(anchorRing);
  const anchorStem=new THREE.Mesh(new THREE.CylinderGeometry(.07,.09,1.2,8),darkWood);anchorStem.position.set(2.05,.95,5.65);ship.add(anchorStem);
  for(let i=0;i<4;i++){const crate=new THREE.Mesh(new THREE.BoxGeometry(.8,.72,.78),new THREE.MeshStandardMaterial({color:i%2?0x805335:0x9b7047,roughness:.98}));crate.position.set(-1.35,2.62,-2.7+i*.95);ship.add(crate);}
  for(let i=0;i<2;i++){const barrel=new THREE.Mesh(new THREE.CylinderGeometry(.34,.4,.85,12),darkWood);barrel.position.set(1.2,2.58,-2.4+i*1.3);ship.add(barrel);}
  const rudder=new THREE.Mesh(new THREE.BoxGeometry(.18,1.8,.42),darkWood);rudder.position.set(0,.85,-7.15);ship.add(rudder);
  // Ship nameplate at the stern.
  const nameCanvas=document.createElement('canvas');nameCanvas.width=512;nameCanvas.height=128;const nc=nameCanvas.getContext('2d');
  nc.fillStyle='#ead8ad';nc.fillRect(0,0,512,128);nc.fillStyle='#4c3024';nc.font='bold 54px Georgia';nc.textAlign='center';nc.textBaseline='middle';nc.fillText('GOING MERRY',256,64);
  const nameTex=new THREE.CanvasTexture(nameCanvas);nameTex.colorSpace=THREE.SRGBColorSpace;
  const namePlate=new THREE.Mesh(new THREE.PlaneGeometry(3.1,.72),new THREE.MeshStandardMaterial({map:nameTex,roughness:.86,side:THREE.DoubleSide}));namePlate.position.set(0,3.05,-6.15);namePlate.rotation.y=Math.PI;ship.add(namePlate);

  mergeStaticMeshes(cabin);
  mergeStaticMeshes(head);
  mergeStaticMeshes(ship);
  ship.traverse(object=>{if(object.isMesh){object.castShadow=true;object.receiveShadow=true;}});
  return ship;
}

