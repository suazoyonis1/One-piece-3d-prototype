
import * as THREE from 'three';
import { buildDawnIsland } from './dawn-island.js';
import { createCharacterMesh } from './models.js';

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

  for (let i = 0; i < 11500; i++) {
    ctx.fillStyle = details[
      Math.floor(Math.random() * details.length)
    ];

    ctx.globalAlpha = Math.random() * 0.4;

    const size = Math.random() * 3.8 + .35;
    const x = Math.random() * 512, y = Math.random() * 512;
    ctx.fillRect(x, y, size, size * (.35 + Math.random() * .9));
    if (Math.random() > .91) { ctx.globalAlpha *= .7; ctx.fillRect(x + 2, y + 1, size * 2.8, .65); ctx.globalAlpha = .3; }
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

function createWoodGrainTexture() {
  const canvas=document.createElement('canvas');canvas.width=canvas.height=512;const ctx=canvas.getContext('2d');
  ctx.fillStyle='#95613b';ctx.fillRect(0,0,512,512);
  for(let i=0;i<1450;i++){
    const y=Math.random()*512,x=Math.random()*512,len=25+Math.random()*230;
    ctx.strokeStyle=Math.random()>.48?`rgba(48,27,16,${.035+Math.random()*.12})`:`rgba(236,187,127,${.025+Math.random()*.09})`;
    ctx.lineWidth=.35+Math.random()*2.2;ctx.beginPath();ctx.moveTo(x,y);ctx.bezierCurveTo(x+len*.25,y-2,x+len*.7,y+2,x+len,y+(Math.random()-.5)*3);ctx.stroke();
  }
  for(let i=0;i<12;i++){
    const x=Math.random()*512,y=Math.random()*512;ctx.strokeStyle='rgba(47,27,17,.18)';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(x,y,5+Math.random()*8,2+Math.random()*4,Math.random(),0,Math.PI*2);ctx.stroke();
  }
  const tex=new THREE.CanvasTexture(canvas);tex.wrapS=tex.wrapT=THREE.RepeatWrapping;tex.repeat.set(2,2);tex.colorSpace=THREE.SRGBColorSpace;tex.anisotropy=8;return tex;
}

function createMasonryTexture(kind='stone') {
  const canvas=document.createElement('canvas');canvas.width=canvas.height=512;const ctx=canvas.getContext('2d');
  const brick=kind==='brick',limestone=kind==='limestone';
  const mortar=brick?'#8e8272':limestone?'#c5bba4':'#77766f';ctx.fillStyle=mortar;ctx.fillRect(0,0,512,512);
  const palette=brick?['#985847','#ad6853','#875044','#b9785c']:limestone?['#d8ceb7','#c9bea7','#e3d9c4','#bfb49d']:['#9a9a8d','#85877f','#aaa89a','#777d78','#b5ae9d'];
  if(brick){
    const bh=42,bw=102;for(let row=0;row<13;row++){const offset=row%2? -bw/2:0;for(let col=-1;col<7;col++){const x=col*bw+offset+4,y=row*bh+4;ctx.fillStyle=palette[Math.floor(Math.random()*palette.length)];ctx.fillRect(x,y,bw-8,bh-8);ctx.strokeStyle='rgba(48,34,28,.22)';ctx.lineWidth=2;ctx.strokeRect(x+1,y+1,bw-10,bh-10);ctx.strokeStyle='rgba(255,224,194,.12)';ctx.beginPath();ctx.moveTo(x+4,y+3);ctx.lineTo(x+bw-13,y+3);ctx.stroke();}}
  } else {
    const cell=limestone?120:82;for(let row=0;row<7;row++){let xOffset=row%2?-cell*.42:0;for(let col=-1;col<7;col++){const x=col*cell+xOffset+4,y=row*cell*.78+4,w=cell*(.72+Math.random()*.28),h=cell*(.56+Math.random()*.22);ctx.beginPath();for(let k=0;k<6;k++){const a=k/6*Math.PI*2,rr=.82+Math.random()*.18,px=x+Math.cos(a)*w*.5*rr,py=y+Math.sin(a)*h*.5*rr;k?ctx.lineTo(px,py):ctx.moveTo(px,py);}ctx.closePath();ctx.fillStyle=palette[Math.floor(Math.random()*palette.length)];ctx.fill();ctx.strokeStyle='rgba(45,43,36,.28)';ctx.lineWidth=3;ctx.stroke();ctx.strokeStyle='rgba(255,247,221,.12)';ctx.lineWidth=1;ctx.stroke();}}
  }
  for(let i=0;i<3400;i++){ctx.fillStyle=Math.random()>.5?'rgba(255,255,255,.035)':'rgba(0,0,0,.035)';ctx.fillRect(Math.random()*512,Math.random()*512,.5+Math.random()*1.5,.5+Math.random()*1.5);}
  const tex=new THREE.CanvasTexture(canvas);tex.wrapS=tex.wrapT=THREE.RepeatWrapping;tex.repeat.set(2,2);tex.colorSpace=THREE.SRGBColorSpace;tex.anisotropy=8;return tex;
}

const stoneTexture=createMasonryTexture('stone');
const brickTexture=createMasonryTexture('brick');
const limestoneTexture=createMasonryTexture('limestone');
const woodGrainTexture=createWoodGrainTexture();

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

const woodTexture = woodGrainTexture;

function createOceanDetailTexture() {
  const canvas = document.createElement('canvas'); canvas.width = canvas.height = 512;
  const ctx = canvas.getContext('2d');
  const image = ctx.createImageData(512,512);
  for (let y=0;y<512;y++) for(let x=0;x<512;x++) {
    const i=(y*512+x)*4;
    const broad=Math.sin(x*.028+Math.sin(y*.017)*2.3)+Math.cos(y*.043+x*.012);
    const fine=Math.sin(x*.19+y*.035)*.32+Math.cos(y*.23-x*.027)*.24;
    const grain=(Math.random()-.5)*.28;
    const v=Math.max(0,Math.min(255,128+broad*14+fine*8+grain*18));
    image.data[i]=image.data[i+1]=image.data[i+2]=v; image.data[i+3]=255;
  }
  ctx.putImageData(image,0,0);
  // Long, broken glints imitate wind-combed wavelets rather than a flat tiled noise map.
  for(let i=0;i<1450;i++) {
    const x=Math.random()*512,y=Math.random()*512,len=8+Math.random()*42;
    const alpha=.025+Math.random()*.09;
    ctx.strokeStyle=`rgba(228,248,241,${alpha})`; ctx.lineWidth=.45+Math.random()*1.25;
    ctx.beginPath(); ctx.moveTo(x,y);
    ctx.bezierCurveTo(x+len*.25,y-2,x+len*.7,y+2,x+len,y-1+Math.random()*3); ctx.stroke();
  }
  const tex=new THREE.CanvasTexture(canvas); tex.wrapS=tex.wrapT=THREE.RepeatWrapping;
  tex.repeat.set(18,18); tex.colorSpace=THREE.NoColorSpace; tex.anisotropy=8; return tex;
}

function createOceanColorTexture() {
  const canvas=document.createElement('canvas');canvas.width=canvas.height=512;
  const ctx=canvas.getContext('2d');
  const base=ctx.createLinearGradient(0,0,512,512);
  base.addColorStop(0,'#0a5d7d');base.addColorStop(.48,'#0b7391');base.addColorStop(1,'#07516f');
  ctx.fillStyle=base;ctx.fillRect(0,0,512,512);
  for(let i=0;i<4200;i++){
    const x=Math.random()*512,y=Math.random()*512,a=.012+Math.random()*.055;
    ctx.fillStyle=Math.random()>.5?`rgba(125,213,211,${a})`:`rgba(1,25,46,${a})`;
    ctx.fillRect(x,y,.5+Math.random()*2,.5+Math.random()*1.5);
  }
  for(let i=0;i<680;i++){
    const x=Math.random()*512,y=Math.random()*512,len=12+Math.random()*48;
    ctx.strokeStyle=`rgba(174,229,220,${.025+Math.random()*.075})`;ctx.lineWidth=.45+Math.random()*1.1;
    ctx.beginPath();ctx.moveTo(x,y);ctx.quadraticCurveTo(x+len*.45,y-2,x+len,y+Math.random()*3);ctx.stroke();
  }
  const tex=new THREE.CanvasTexture(canvas);tex.wrapS=tex.wrapT=THREE.RepeatWrapping;tex.repeat.set(16,16);tex.colorSpace=THREE.SRGBColorSpace;tex.anisotropy=8;return tex;
}

function createOceanEnvironment() {
  const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=512;
  const ctx=canvas.getContext('2d');
  const sky=ctx.createLinearGradient(0,0,0,512);
  sky.addColorStop(0,'#397fae');sky.addColorStop(.48,'#9dc8d3');sky.addColorStop(.68,'#e8c69c');sky.addColorStop(1,'#31566c');
  ctx.fillStyle=sky;ctx.fillRect(0,0,1024,512);
  const sun=ctx.createRadialGradient(725,205,3,725,205,115);
  sun.addColorStop(0,'rgba(255,239,196,.92)');sun.addColorStop(.12,'rgba(255,218,159,.36)');sun.addColorStop(1,'rgba(255,210,160,0)');
  ctx.fillStyle=sun;ctx.fillRect(590,70,270,270);
  for(let i=0;i<75;i++){
    const x=Math.random()*1024,y=55+Math.random()*180,w=24+Math.random()*95,h=3+Math.random()*8;
    ctx.fillStyle=`rgba(244,249,249,${.025+Math.random()*.055})`;ctx.beginPath();ctx.ellipse(x,y,w,h,0,0,Math.PI*2);ctx.fill();
  }
  const tex=new THREE.CanvasTexture(canvas);tex.mapping=THREE.EquirectangularReflectionMapping;tex.colorSpace=THREE.SRGBColorSpace;tex.needsUpdate=true;return tex;
}

export class World {
  constructor(scene) {
    this.scene = scene;
    this.islands = [];
    this.supplyCrates = [];
    this.waterTime = 0;
    this.clouds = [];
    this.buildingColliders = [];

    // Sky
    this.scene.background = new THREE.Color(0x83d2ee);
    this.scene.fog = new THREE.FogExp2(0xb4e3e8, 0.00038);
    this.createAtmosphereSky();

    // Natural lighting
    const ambient = new THREE.HemisphereLight(
      0xd7f3ff,
      0x53694a,
      1.75
    );

    this.ambientLight = ambient;
    this.scene.add(ambient);

    const sun = new THREE.DirectionalLight(0xffedc7, 3.15);

    sun.position.set(120, 180, 100);
    sun.castShadow = true;

    sun.shadow.mapSize.set(3072, 3072);
    sun.shadow.camera.left = -350;
    sun.shadow.camera.right = 350;
    sun.shadow.camera.top = 350;
    sun.shadow.camera.bottom = -350;
    sun.shadow.camera.near = 1;
    sun.shadow.camera.far = 500;
    sun.shadow.bias = -0.0002;
    sun.shadow.normalBias = 0.03;

    this.sunLight = sun;
    this.daySky = new THREE.Color(0x83d2ee);
    this.nightSky = new THREE.Color(0x101d3a);
    this.dayFog = new THREE.Color(0xb4e3e8);
    this.nightFog = new THREE.Color(0x263653);
    this.scene.add(sun);
    this.moonLight = new THREE.DirectionalLight(0x9db8df, .22);
    this.moonLight.position.set(-100,120,-80);
    this.scene.add(this.moonLight);

    // Ocean
    const waterGeometry = new THREE.PlaneGeometry(
      2400,
      2400,
      144,
      144
    );

    waterGeometry.rotateX(-Math.PI / 2);

    this.waterPositions =
      waterGeometry.attributes.position.array.slice();

    this.oceanMesh = new THREE.Mesh(
      waterGeometry,
      new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        map: createOceanColorTexture(),
        roughness: 0.22,
        metalness: 0.025,
        bumpMap: createOceanDetailTexture(),
        bumpScale: 0.34,
        envMap: createOceanEnvironment(),
        envMapIntensity: 0.58,
        clearcoat: 0.98,
        clearcoatRoughness: 0.1,
        reflectivity: 0.92
      })
    );

    this.oceanMesh.receiveShadow = true;
    this.oceanMaterial = this.oceanMesh.material;
    this.dayWaterTint=new THREE.Color(0xffffff);this.nightWaterTint=new THREE.Color(0x536b80);
    this.oceanMesh.frustumCulled = false;
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
    this.createLoguetown();
    this.createReverseMountain();

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

    this.createTreasureCaches();
    this.createClouds();
    this.createCelestialSky();
    this.createSeabirds();
    this.createAmbientVessels();
  }


  createLoguetown() {
    const center = new THREE.Vector3(0, 0, -650);
    const groundY = 2.6;
    this.addIsland('logue', 'Loguetown', center, 145, 0xb9a77f, groundY);

    const stone = new THREE.MeshStandardMaterial({ map:stoneTexture,bumpMap:stoneTexture,bumpScale:.12,color:0xffffff,roughness:.98 });
    const pale = new THREE.MeshStandardMaterial({ map:sandTexture,bumpMap:sandTexture,bumpScale:.06,color:0xe7dfca,roughness:.96 });
    const roof = new THREE.MeshStandardMaterial({ color: 0x6f5142, roughness: 0.9 });
    const redRoof = new THREE.MeshStandardMaterial({ color: 0x8e4538, roughness: 0.9 });
    const brick = new THREE.MeshStandardMaterial({ map:brickTexture,bumpMap:brickTexture,bumpScale:.11,color:0xffffff,roughness:.98 });
    const limestone = new THREE.MeshStandardMaterial({ map:limestoneTexture,bumpMap:limestoneTexture,bumpScale:.08,color:0xffffff,roughness:.99 });
    const wood = new THREE.MeshStandardMaterial({ map: woodTexture, color: 0xffffff, roughness: 0.9 });

    // Main streets and plaza.
    const avenue = new THREE.Mesh(new THREE.BoxGeometry(18, 0.18, 190), stone);
    avenue.position.set(0, groundY + 0.1, center.z);
    this.scene.add(avenue);
    const crossStreet = new THREE.Mesh(new THREE.BoxGeometry(220, 0.18, 14), stone);
    crossStreet.position.set(0, groundY + 0.11, center.z + 6);
    this.scene.add(crossStreet);

    const addBuilding = (x, z, width, height, depth, material, roofMaterial = roof) => {
      const group = new THREE.Group();
      const wallMeshes=[];
      const groupWall=(w,h,d,xp,yp,zp)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material.clone());m.position.set(xp,yp,zp);m.userData.wallHealth=material===wood?155:260;m.userData.wallMaxHealth=m.userData.wallHealth;m.userData.baseColor=m.material.color.clone();m.userData.localBounds={x:xp,z:zp,width:w,depth:d,height:h};wallMeshes.push(m);group.add(m);return m;};
      const doorW=Math.min(1.65,width*.2), wallT=.32;
      groupWall(width,height,wallT,0,height/2,-depth/2);
      groupWall(wallT,height,depth,-width/2,height/2,0);
      groupWall(wallT,height,depth,width/2,height/2,0);
      groupWall((width-doorW)/2,height,wallT,-(width+doorW)/4,height/2,depth/2);
      groupWall((width-doorW)/2,height,wallT,(width+doorW)/4,height/2,depth/2);
      groupWall(doorW,height*.52,wallT,0,height*.74,depth/2);
      const top = new THREE.Mesh(new THREE.ConeGeometry(width * 0.78, height * 0.34, 4), roofMaterial);
      top.position.y = height + height * 0.17;
      top.rotation.y = Math.PI / 4;
      const door = new THREE.Mesh(new THREE.BoxGeometry(doorW, height * .48, .16),new THREE.MeshStandardMaterial({color:0x49301f,roughness:.9}));
      const hinge=new THREE.Group();hinge.position.set(doorW/2,0,depth/2+.12);door.position.set(-doorW/2,height*.24,0);hinge.rotation.y=-.68;hinge.add(door);
      group.add(top,hinge);
      group.position.set(x, groundY, z);
      this.buildingColliders.push({x,z,rotation:0,width,depth,doorWidth:width*.16,doorSide:1,baseY:groundY,wallMeshes,breaches:[],windowOpenings:[]});
      group.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
      this.scene.add(group);
      return group;
    };

    // Dense market / residential blocks around the central avenue.
    const blocks = [
      [-54,-710,18,12,16],[-28,-710,16,10,15],[34,-710,18,13,17],[62,-710,17,11,16],
      [-62,-675,18,11,16],[-34,-675,16,9,15],[38,-675,17,12,16],[66,-675,18,13,16],
      [-70,-625,20,12,18],[-40,-625,17,10,16],[42,-625,18,11,16],[72,-625,18,12,17],
      [-55,-585,18,10,15],[-26,-585,16,12,15],[32,-585,18,11,16],[60,-585,18,12,16]
    ];
    const facadeMaterials=[stone,pale,brick,limestone];
    blocks.forEach((b,i) => addBuilding(b[0],b[1],b[2],b[3],b[4],facadeMaterials[i%facadeMaterials.length],i%2?redRoof:roof));

    // Market stalls.
    for (let i=0;i<6;i++) {
      const stall = new THREE.Group();
      const counter = new THREE.Mesh(new THREE.BoxGeometry(8,1.3,3), wood);
      counter.position.y=0.65;
      const canopy = new THREE.Mesh(new THREE.BoxGeometry(9,0.35,4), new THREE.MeshStandardMaterial({color:[0xb64235,0xe4bd58,0x477b8a][i%3]}));
      canopy.position.y=3.2;
      stall.add(counter,canopy);
      const produce=[0xc94c35,0xe2b64d,0x6f9a4b,0x9d5b85][i%4];
      for(let f=0;f<7;f++){
        const item=new THREE.Mesh(new THREE.SphereGeometry(.24+Math.random()*.06,10,8),new THREE.MeshStandardMaterial({color:produce,roughness:.78}));
        item.position.set(-2.8+(f%4)*.72,1.48+(f%2)*.08,-.45+Math.floor(f/4)*.42);stall.add(item);
      }
      const awningEdge=new THREE.Mesh(new THREE.BoxGeometry(9,.12,.18),wood);awningEdge.position.set(0,2.95,2.02);stall.add(awningEdge);
      stall.position.set(-48+i*19,groundY,-642+(i%2)*9);
      this.scene.add(stall);
    }

    // Execution platform and stairs.
    const platform = new THREE.Group();
    const deck = new THREE.Mesh(new THREE.BoxGeometry(32,2.2,22),wood);
    deck.position.y=6.2;
    platform.add(deck);
    const supports = [[-13,0,-8],[13,0,-8],[-13,0,8],[13,0,8]];
    supports.forEach(([x,y,z])=>{
      const post=new THREE.Mesh(new THREE.CylinderGeometry(.65,.8,8,10),wood);
      post.position.set(x,4,z); platform.add(post);
    });
    const stair = new THREE.Mesh(new THREE.BoxGeometry(10,1.1,12),wood);
    stair.position.set(0,2.7,17); stair.rotation.x=-0.24; platform.add(stair);
    platform.position.set(0,groundY,-650);
    platform.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});
    this.scene.add(platform);

    // Marine headquarters: walled compound with a watch tower.
    const base = new THREE.Group();
    const hq = new THREE.Mesh(new THREE.BoxGeometry(58,20,42),pale);
    hq.position.y=10;
    const hqRoof = new THREE.Mesh(new THREE.ConeGeometry(36,13,4),new THREE.MeshStandardMaterial({color:0x526a7c}));
    hqRoof.position.y=26; hqRoof.rotation.y=Math.PI/4;
    base.add(hq,hqRoof);
    for (const [x,z,rot] of [[-34,-24,0],[34,-24,0],[-34,24,0],[34,24,0]]) {
      const tower=new THREE.Mesh(new THREE.BoxGeometry(7,14,7),stone);
      tower.position.set(x,7,z); base.add(tower);
    }
    base.position.set(91,groundY,-680);
    base.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});
    this.scene.add(base);

    // A small harbor at the south-west edge, facing the approach from East Blue.
    const harbor = new THREE.Group();
    const pier = new THREE.Mesh(new THREE.BoxGeometry(12,.55,34),wood);
    harbor.add(pier);
    for (let i=0;i<8;i++) {
      const plank = new THREE.Mesh(new THREE.BoxGeometry(12.2,.12,3.8),wood);
      plank.position.z=-15+i*4; plank.position.y=.32; harbor.add(plank);
    }
    harbor.position.set(-92,groundY,-548);
    this.scene.add(harbor);
  }

  createReverseMountain() {
    const center = new THREE.Vector3(0, 0, -1050);
    const groundY = 5.5;
    this.addIsland('reverse-mountain', 'Reverse Mountain', center, 118, 0x687c68, groundY);
    const rock = new THREE.MeshStandardMaterial({ color: 0x66736d, roughness: 1 });
    const snow = new THREE.MeshStandardMaterial({ color: 0xdde7e5, roughness: 0.95 });
    const peak = new THREE.Mesh(new THREE.ConeGeometry(62, 150, 9), rock);
    peak.position.set(0,78,-1050);
    peak.castShadow=true; peak.receiveShadow=true; this.scene.add(peak);
    for (let i=0;i<4;i++) {
      const ridge = new THREE.Mesh(new THREE.ConeGeometry(25+i*3,78+i*8,8),rock);
      ridge.position.set(Math.cos(i*Math.PI/2)*53,38+i*3,-1050+Math.sin(i*Math.PI/2)*53);
      ridge.castShadow=true; this.scene.add(ridge);
    }
    const cap = new THREE.Mesh(new THREE.ConeGeometry(22,24,9),snow);
    cap.position.set(0,145,-1050); this.scene.add(cap);

    // Bright blue current channel winds up the mountain as a readable sailing route.
    const points = [
      new THREE.Vector3(-72,7,-1110), new THREE.Vector3(-48,12,-1090),
      new THREE.Vector3(-25,24,-1070), new THREE.Vector3(4,42,-1050),
      new THREE.Vector3(28,62,-1030), new THREE.Vector3(48,83,-1005),
      new THREE.Vector3(66,105,-980)
    ];
    const currentCurve = new THREE.CatmullRomCurve3(points);
    const current = new THREE.Mesh(
      new THREE.TubeGeometry(currentCurve,80,3.4,10,false),
      new THREE.MeshStandardMaterial({color:0x39bde0,roughness:.25,metalness:.08,emissive:0x073e58})
    );
    current.castShadow=false; this.scene.add(current);
  }

  createTreasureCaches() {
    this.treasureCaches = [];
    const cacheSpots = [
      { name: 'Foosha Beach Cache', position: new THREE.Vector3(-31, 2.45, -28), reward: 250 },
      { name: 'Foosha Hillside Cache', position: new THREE.Vector3(39, 2.35, 34), reward: 400 },
      { name: 'Mount Colubo Cache', position: new THREE.Vector3(65, 2.2, -190), reward: 650 },
      { name: 'Gray Terminal Cache', position: new THREE.Vector3(-168, 2.2, -72), reward: 500 },
      { name: 'Shells Town Cache', position: new THREE.Vector3(270, 2.4, 230), reward: 900 },
      { name: 'Baratie Cache', position: new THREE.Vector3(-250, 4.2, 282), reward: 1200 }
    ];

    for (const data of cacheSpots) {
      const cache = new THREE.Group();
      const wood = new THREE.MeshStandardMaterial({ color: 0x81502e, roughness: 0.85 });
      const trim = new THREE.MeshStandardMaterial({ color: 0xd5a33e, metalness: 0.35, roughness: 0.45 });
      const base = new THREE.Mesh(new THREE.BoxGeometry(1.65, 1.05, 1.15), wood);
      base.position.y = 0.53;
      base.castShadow = true;
      base.receiveShadow = true;
      cache.add(base);

      const lidPivot = new THREE.Group();
      lidPivot.position.set(0, 1.05, -0.56);
      const lid = new THREE.Mesh(new THREE.BoxGeometry(1.72, 0.28, 1.22), wood);
      lid.position.set(0, 0.08, 0.56);
      lid.castShadow = true;
      lidPivot.add(lid);
      cache.add(lidPivot);

      const band = new THREE.Mesh(new THREE.BoxGeometry(0.2, 1.15, 1.2), trim);
      band.position.set(0, 0.58, 0);
      cache.add(band);
      const lock = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.3, 0.12), trim);
      lock.position.set(0, 0.83, 0.62);
      cache.add(lock);

      cache.position.copy(data.position);
      cache.userData = { ...data, opened: false, lidPivot };
      cache.traverse(object => {
        if (object.isMesh) { object.castShadow = true; object.receiveShadow = true; }
      });
      this.scene.add(cache);
      this.treasureCaches.push(cache);
    }
  }

  getNearbyTreasure(position, range = 4.5) {
    return (this.treasureCaches || []).find(cache =>
      !cache.userData.opened && position.distanceTo(cache.position) <= range
    ) || null;
  }

  addIsland(id, name, center, radius, color, groundY) {
    const texture = id === 'shells'
      ? sandTexture
      : grassTexture;

    const material = new THREE.MeshStandardMaterial({
      map: texture,
      bumpMap: texture,
      bumpScale: 0.16,
      color: color,
      roughness: 0.91
    });

    const island = new THREE.Mesh(
      new THREE.CylinderGeometry(
        radius,
        radius + 7,
        groundY * 2,
        96,
        2
      ),
      material
    );

    island.position.set(center.x, 0, center.z);
    island.receiveShadow = true;
    island.castShadow = true;

    this.scene.add(island);

    // Soft sandy shoreline gives each island a readable edge against the sea.
    const shoreline = new THREE.Mesh(
      new THREE.TorusGeometry(radius * 0.985, 1.65, 8, 128),
      new THREE.MeshStandardMaterial({
        color: 0xe6d09c,
        roughness: 0.92,
        transparent: true,
        opacity: 0.82
      })
    );
    shoreline.rotation.x = -Math.PI / 2;
    shoreline.position.set(center.x, groundY + 0.09, center.z);
    shoreline.receiveShadow = true;
    this.scene.add(shoreline);
    this.foamRings ||= [];
    const foam=new THREE.Mesh(new THREE.TorusGeometry(radius*1.012,.48,5,144),new THREE.MeshBasicMaterial({color:0xd9f3e8,transparent:true,opacity:.18,depthWrite:false}));
    foam.rotation.x=-Math.PI/2;foam.position.set(center.x,groundY+.12,center.z);this.scene.add(foam);this.foamRings.push(foam);

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
    // Tropical palms and broadleaf trees with bark rings, roots and leaf-shaped fronds.
    const treeCount = Math.max(8, Math.floor(radius / 3.9));
    this.windFoliage ||= [];
    const bark = new THREE.MeshStandardMaterial({color:0x76502f,roughness:.98});
    const barkLight = new THREE.MeshStandardMaterial({color:0x9a7046,roughness:1});
    const leafMats = [0x286c3b,0x347f43,0x4b9148,0x1d5e38].map(c=>new THREE.MeshStandardMaterial({color:c,roughness:.94,side:THREE.DoubleSide}));
    const makeFrond = () => {
      const verts=[], indices=[]; const rows=16, cols=4;
      for(let a=0;a<=rows;a++){
        const t=a/rows, width=Math.sin(Math.PI*t)*.48+.012;
        const y=-.12-t*1.15+Math.sin(t*Math.PI)*.42;
        for(let b=0;b<=cols;b++){
          const u=b/cols*2-1; verts.push(t*4.25,y,u*width);
        }
      }
      for(let a=0;a<rows;a++)for(let b=0;b<cols;b++){
        const q=a*(cols+1)+b; indices.push(q,q+cols+1,q+1,q+1,q+cols+1,q+cols+2);
      }
      const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));g.setIndex(indices);g.computeVertexNormals();return g;
    };
    const frondGeo=makeFrond();
    for (let i=0;i<treeCount;i++) {
      const angle=Math.random()*Math.PI*2, distance=Math.random()*radius*.69;
      const x=center.x+Math.cos(angle)*distance, z=center.z+Math.sin(angle)*distance;
      const tree=new THREE.Group();
      const palm=Math.random()>.38;
      const trunkHeight=palm?6.4+Math.random()*2.4:4.2+Math.random()*2.2;
      const trunk=new THREE.Mesh(new THREE.CylinderGeometry(palm?.16:.22,palm?.34:.42,trunkHeight,12,5),bark);
      trunk.position.y=trunkHeight/2; trunk.rotation.z=(Math.random()-.5)*.09; trunk.castShadow=true;tree.add(trunk);
      // Raised bark bands and flared roots add scale and believable surface breakup.
      for(let band=0;band<Math.floor(trunkHeight/.48);band++){
        const y=.28+band*.46;
        const ring=new THREE.Mesh(new THREE.TorusGeometry(.2+(y/trunkHeight)*.08,.018,5,14),band%2?barkLight:bark);
        ring.rotation.x=Math.PI/2;ring.position.set(0,y,0);ring.scale.set(1,1,.9);tree.add(ring);
      }
      for(let r=0;r<4;r++){
        const rootFlare=new THREE.Mesh(new THREE.ConeGeometry(.18,.95,7),bark);
        const a=r*Math.PI/2+.4;rootFlare.position.set(Math.cos(a)*.27,.35,Math.sin(a)*.27);
        rootFlare.rotation.z=Math.cos(a)*-.65;rootFlare.rotation.x=Math.sin(a)*.65;tree.add(rootFlare);
      }
      if(palm){
        const crown=new THREE.Group();crown.position.y=trunkHeight*.91;tree.add(crown);
        for(let j=0;j<8;j++){
          const a=j/8*Math.PI*2;
          const leaf=new THREE.Mesh(frondGeo,leafMats[(i+j)%leafMats.length]);
          leaf.rotation.y=a;leaf.rotation.x=(Math.random()-.5)*.12;leaf.scale.setScalar(.86+Math.random()*.25);
          leaf.castShadow=true;crown.add(leaf);
          const ribCurve=new THREE.CatmullRomCurve3([new THREE.Vector3(0,0,0),new THREE.Vector3(1.4,-.35,0),new THREE.Vector3(2.8,-.72,0),new THREE.Vector3(4.15,-1.27,0)]);
          const rib=new THREE.Mesh(new THREE.TubeGeometry(ribCurve,12,.025,5,false),barkLight);rib.rotation.y=a;crown.add(rib);
        }
        const coconuts=new THREE.Mesh(new THREE.IcosahedronGeometry(.24,1),new THREE.MeshStandardMaterial({color:0x6d5836,roughness:1}));
        coconuts.position.set(.12,-.18,.12);crown.add(coconuts);
        this.windFoliage.push({object:crown,phase:Math.random()*6.28,amount:.035});
      } else {
        const crown=new THREE.Group();crown.position.y=trunkHeight*.78;tree.add(crown);
        for(let j=0;j<9;j++){
          const geo=new THREE.IcosahedronGeometry(1,2),a=geo.attributes.position;
          for(let k=0;k<a.count;k++){const v=1+.045*Math.sin(a.getX(k)*8+j)*Math.cos(a.getZ(k)*7);a.setXYZ(k,a.getX(k)*v,a.getY(k)*v,a.getZ(k)*v);}geo.computeVertexNormals();
          const blob=new THREE.Mesh(geo,leafMats[(i+j)%leafMats.length]);
          const ang=j/9*Math.PI*2;blob.position.set(Math.cos(ang)*.9,(Math.random()-.3)*1.1,Math.sin(ang)*.9);
          blob.scale.set(1.15+Math.random()*.45,1.05+Math.random()*.5,1.1+Math.random()*.45);blob.castShadow=true;crown.add(blob);
        }
        this.windFoliage.push({object:crown,phase:Math.random()*6.28,amount:.018});
      }
      tree.position.set(x,groundY,z);tree.rotation.y=Math.random()*Math.PI*2;this.scene.add(tree);
    }

    // Broken rock clusters, grass tufts and fern-like ground cover add height variation.
    for(let i=0;i<24;i++){
      const a=Math.random()*Math.PI*2,d=Math.random()*radius*.76,sz=.55+Math.random()*1.25;
      const rock=new THREE.Mesh(new THREE.IcosahedronGeometry(sz,1),new THREE.MeshStandardMaterial({color:[0x69736e,0x85877c,0x9a927f][i%3],roughness:1}));
      rock.position.set(center.x+Math.cos(a)*d,groundY+sz*.28,center.z+Math.sin(a)*d);
      rock.scale.set(1.2,.62,.9);rock.rotation.set(Math.random(),Math.random(),Math.random());rock.castShadow=true;rock.receiveShadow=true;this.scene.add(rock);
    }
    const earthMat=new THREE.MeshStandardMaterial({map:grassTexture,bumpMap:grassTexture,bumpScale:.11,color:0x8ab36a,roughness:1});
    for(let i=0;i<7;i++){
      const a=Math.random()*Math.PI*2,d=radius*(.25+Math.random()*.48);
      const mound=new THREE.Mesh(new THREE.SphereGeometry(1,20,14),earthMat);
      mound.position.set(center.x+Math.cos(a)*d,groundY-.12,center.z+Math.sin(a)*d);
      mound.scale.set(3.2+Math.random()*3.5,.28+Math.random()*.22,2.8+Math.random()*3.2);
      mound.rotation.y=Math.random()*Math.PI;mound.receiveShadow=true;this.scene.add(mound);
    }
    for(let i=0;i<110;i++){
      const a=Math.random()*Math.PI*2,d=Math.random()*radius*.82,x=center.x+Math.cos(a)*d,z=center.z+Math.sin(a)*d;
      const tuft=new THREE.Group();
      for(let j=0;j<4;j++){
        const blade=new THREE.Mesh(new THREE.ConeGeometry(.075,.48+Math.random()*.35,5),leafMats[(i+j)%leafMats.length]);
        blade.position.set((Math.random()-.5)*.24,.2, (Math.random()-.5)*.24);blade.rotation.z=(Math.random()-.5)*.65;blade.rotation.x=(Math.random()-.5)*.45;tuft.add(blade);
      }
      tuft.position.set(x,groundY+.02,z);this.scene.add(tuft);
    }

    // Bushes with varied clumps rather than uniform green spheres.
    for(let i=0;i<22;i++){
      const a=Math.random()*Math.PI*2,d=Math.random()*radius*.72,x=center.x+Math.cos(a)*d,z=center.z+Math.sin(a)*d;
      const bush=new THREE.Group();
      for(let j=0;j<3;j++){
        const blob=new THREE.Mesh(new THREE.IcosahedronGeometry(.78+Math.random()*.25,1),leafMats[(i+j)%leafMats.length]);
        blob.position.set((j-1)*.55,Math.random()*.22,Math.sin(j*2)*.28);blob.scale.set(1,.72,.9);blob.castShadow=true;bush.add(blob);
      }
      bush.position.set(x,groundY+.42,z);this.scene.add(bush);
    }

    // Flowers
    const flowerColors = [
      0xff4d6d,
      0xffd166,
      0xffffff,
      0xc77dff,
      0xff8c42
    ];

    for (let i = 0; i < 55; i++) {
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

    const wood = new THREE.MeshStandardMaterial({map:woodTexture,color:tavern?0x98613d:0xc18b59,roughness:.91});
    const wallStyles = [
      new THREE.MeshStandardMaterial({map:stoneTexture,bumpMap:stoneTexture,bumpScale:.12,color:0xffffff,roughness:.99}),
      new THREE.MeshStandardMaterial({map:brickTexture,bumpMap:brickTexture,bumpScale:.10,color:0xffffff,roughness:.98}),
      new THREE.MeshStandardMaterial({map:limestoneTexture,bumpMap:limestoneTexture,bumpScale:.08,color:0xffffff,roughness:.99}),
      new THREE.MeshStandardMaterial({map:sandTexture,bumpMap:sandTexture,bumpScale:.07,color:0xd9c9a8,roughness:.99})
    ];
    const styleIndex=(Math.abs(Math.round(x*7+z*11))+(tavern?2:0))%5;
    const wallMaterial=styleIndex===0?wood:wallStyles[(styleIndex-1)%wallStyles.length];
    const roofMaterial = new THREE.MeshStandardMaterial({color:tavern?0x59352e:[0x754239,0x58604e,0x8b4935,0x6c4a37][styleIndex%4],roughness:.96});

    // Thick perimeter walls, with timber framing and masonry plinths; the door is a true opening.
    const wallT=.38, doorW=1.55, doorH=2.65;
    const wallMeshes=[];
    const wall=(w,h,d,xp,yp,zp,material=wallMaterial)=>{
      const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material.clone());
      m.position.set(xp,yp,zp);m.castShadow=true;m.receiveShadow=true;
      m.userData.wallHealth=material===wood?150:material===wallMaterial?220:280;
      m.userData.wallMaxHealth=m.userData.wallHealth;
      m.userData.baseColor=m.material.color.clone();
      m.userData.localBounds={x:xp,z:zp,width:w,depth:d,height:h};
      wallMeshes.push(m);group.add(m);return m;
    };
    wall(width,height,wallT,0,height/2,-depth/2);
    wall(wallT,height,depth, -width/2,height/2,0);
    wall(wallT,height,depth, width/2,height/2,0);
    const windowW=1.12,windowH=1.12,windowCenterY=height*.64;
    const windowBottom=windowCenterY-windowH/2,windowTop=windowCenterY+windowH/2;
    const windowOpenings=[];
    for(const side of [-1,1]){
      const segMin=side<0?-width/2:doorW/2,segMax=side<0?-doorW/2:width/2;
      const segW=segMax-segMin,segCenter=(segMin+segMax)/2,wx=side*width/3;
      const leftW=wx-windowW/2-segMin,rightW=segMax-(wx+windowW/2);
      wall(segW,windowBottom,wallT,segCenter,windowBottom/2,depth/2);
      wall(segW,height-windowTop,wallT,segCenter,(height+windowTop)/2,depth/2);
      wall(leftW,windowH,wallT,segMin+leftW/2,windowCenterY,depth/2);
      wall(rightW,windowH,wallT,wx+windowW/2+rightW/2,windowCenterY,depth/2);
      windowOpenings.push({x:wx,width:windowW,bottom:windowBottom,top:windowTop});
    }
    wall(doorW,height-doorH,wallT,0,doorH+(height-doorH)/2,depth/2);
    const masonry=new THREE.MeshStandardMaterial({color:styleIndex%2?0x887b68:0xa69a84,roughness:1});
    wall(width+.16,.52,depth+.16,0,.26,0,masonry);
    const floor=new THREE.Mesh(new THREE.BoxGeometry(width-.35,.22,depth-.35),new THREE.MeshStandardMaterial({color:0x92704d,roughness:.95}));
    floor.position.y=.12;floor.receiveShadow=true;group.add(floor);
    // Timber corner posts and lintel make the wall thickness visible.
    for(const sx of [-1,1]) for(const sz of [-1,1]) wall(.24,height+.08,.24,sx*(width/2-.12),height/2,sz*(depth/2-.12),wood);
    this.buildingColliders.push({x,z,rotation,width,depth,doorWidth:doorW,doorSide:1,baseY:2.3,windowOpenings,wallMeshes,breaches:[]});

    // Gabled timber roof with visible rafters and overlapping tile courses.
    const slopeLength=Math.sqrt((width*.52)**2+2.15**2);
    for(const side of [-1,1]){
      const panel=new THREE.Mesh(new THREE.BoxGeometry(slopeLength,.24,depth+.7),roofMaterial);
      panel.position.set(side*width*.235,height+1.02,0);
      panel.rotation.z=side===-1?.72:-.72;
      panel.castShadow=true;panel.receiveShadow=true;group.add(panel);
      for(let row=0;row<7;row++){
        const tileLine=new THREE.Mesh(new THREE.BoxGeometry(.045,.035,depth+.74),new THREE.MeshStandardMaterial({color:0x352d29,roughness:1}));
        const localX=(row-3)*.48;
        tileLine.position.set(side*width*.235+localX*Math.cos(panel.rotation.z),height+1.02+localX*Math.sin(panel.rotation.z),0);
        tileLine.rotation.z=panel.rotation.z;group.add(tileLine);
      }
    }
    const ridge=new THREE.Mesh(new THREE.CylinderGeometry(.12,.12,depth+.8,10),wood);
    ridge.rotation.x=Math.PI/2;ridge.position.set(0,height+2.08,0);group.add(ridge);
    // Small chimney gives the roofline a lived-in silhouette.
    if(large){const chimney=new THREE.Mesh(new THREE.BoxGeometry(.72,1.6,.72),wallStyles[0]);chimney.position.set(width*.28,height+2.05,-depth*.22);chimney.castShadow=true;group.add(chimney);}

    // Door
    const door = new THREE.Mesh(
      new THREE.BoxGeometry(1.5, 2.7, 0.2),
      new THREE.MeshStandardMaterial({
        color: 0x49301f
      })
    );

    const hinge=new THREE.Group();
    hinge.position.set(doorW/2,0,depth/2+.08);
    door.position.set(-doorW/2,1.35,0);
    hinge.rotation.y=-.72;
    hinge.add(door);group.add(hinge);

    // Windows
    const windowMaterial = new THREE.MeshStandardMaterial({
      color: 0x9ac9ce,
      roughness: 0.24,
      metalness: 0.08,
      transparent: true,
      opacity: 0.28
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
      new THREE.BoxGeometry(9, 0.5, 35),
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

    dock.position.set(5, 2.5, 40);
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

    // Open-air market stall with striped canvas, produce baskets and hand-built timber.
    const stall=new THREE.Group();
    const timber=new THREE.MeshStandardMaterial({map:woodTexture,color:0x9a6742,roughness:.95});
    const canvasRed=new THREE.MeshStandardMaterial({color:0xa94e3e,roughness:1,side:THREE.DoubleSide});
    const canvasCream=new THREE.MeshStandardMaterial({color:0xe5d6b8,roughness:1,side:THREE.DoubleSide});
    for(const sx of [-1.8,1.8])for(const sz of [-1.15,1.15]){
      const post=new THREE.Mesh(new THREE.CylinderGeometry(.09,.12,3.2,8),timber);post.position.set(sx,1.6,sz);stall.add(post);
    }
    const counter=new THREE.Mesh(new THREE.BoxGeometry(4.1,.2,1.1),timber);counter.position.set(0,1.05,.1);stall.add(counter);
    const canopy=new THREE.Mesh(new THREE.BoxGeometry(4.35,.12,3.05,1,1,6),canvasCream);canopy.position.y=3.12;canopy.rotation.x=-.04;stall.add(canopy);
    for(let i=0;i<7;i++){
      const awning=new THREE.Mesh(new THREE.BoxGeometry(.58,.08,1.05),i%2?canvasRed:canvasCream);awning.position.set(-1.75+i*.58,2.94,1.55);awning.rotation.x=-.18;stall.add(awning);
    }
    const fruitColors=[0xc94c35,0xe8b94f,0x6c9a47,0x8e4d9c,0xd88b43];
    for(let i=0;i<18;i++){
      const fruit=new THREE.Mesh(new THREE.SphereGeometry(.16+Math.random()*.05,10,8),new THREE.MeshStandardMaterial({color:fruitColors[i%fruitColors.length],roughness:.72}));
      fruit.position.set(-1.55+(i%6)*.62,1.28+Math.floor(i/6)*.04,.12+(Math.floor(i/6)-1)*.22);stall.add(fruit);
    }
    stall.position.set(20,2.3,8);this.scene.add(stall);

    // Fish drying rack, net bundles and lanterns make the dock feel occupied.
    const rack=new THREE.Group();
    const rackWood=new THREE.MeshStandardMaterial({color:0x765238,roughness:1});
    for(const x of [-1.3,1.3]){const post=new THREE.Mesh(new THREE.CylinderGeometry(.08,.11,2.8,8),rackWood);post.position.set(x,1.4,0);rack.add(post);}
    const beam=new THREE.Mesh(new THREE.CylinderGeometry(.07,.07,2.8,8),rackWood);beam.rotation.z=Math.PI/2;beam.position.y=2.55;rack.add(beam);
    for(let i=0;i<5;i++){
      const fish=new THREE.Mesh(new THREE.ConeGeometry(.16,.75,8),new THREE.MeshStandardMaterial({color:i%2?0x8d9e9a:0xb7b6a2,roughness:.78}));
      fish.rotation.z=Math.PI/2;fish.position.set(-.95+i*.47,2.05,.05);rack.add(fish);
    }
    rack.position.set(-31,2.3,35);this.scene.add(rack);
    this.lanternLights ||= [];
    for(const [x,z] of [[-23,-14],[22,-14],[7,27],[-40,13]]){
      const pole=new THREE.Mesh(new THREE.CylinderGeometry(.08,.11,3.8,8),rackWood);pole.position.set(x,4.2,z);this.scene.add(pole);
      const arm=new THREE.Mesh(new THREE.CylinderGeometry(.045,.045,1.15,7),rackWood);arm.rotation.z=Math.PI/2;arm.position.set(x,5.95,z);this.scene.add(arm);
      const lantern=new THREE.Mesh(new THREE.BoxGeometry(.38,.48,.38),new THREE.MeshStandardMaterial({color:0xe7a74f,emissive:0xffa33e,emissiveIntensity:.55,transparent:true,opacity:.88}));lantern.position.set(x,5.55,z);this.scene.add(lantern);
      const light=new THREE.PointLight(0xffb866,.42,10,2);light.position.copy(lantern.position);this.scene.add(light);this.lanternLights.push({light,lantern});
    }
  }

  createAtmosphereSky() {
    const uniforms={
      topColor:{value:new THREE.Color(0x4d9fc8)},
      horizonColor:{value:new THREE.Color(0xf0cba0)},
      lowerColor:{value:new THREE.Color(0x7aa8b1)}
    };
    const material=new THREE.ShaderMaterial({
      uniforms,side:THREE.BackSide,depthWrite:false,
      vertexShader:`varying vec3 vDirection; void main(){ vec4 world=modelMatrix*vec4(position,1.0); vDirection=normalize(world.xyz-cameraPosition); gl_Position=projectionMatrix*viewMatrix*world; }`,
      fragmentShader:`uniform vec3 topColor; uniform vec3 horizonColor; uniform vec3 lowerColor; varying vec3 vDirection; void main(){ float h=normalize(vDirection).y; float upper=smoothstep(-.10,.72,h); vec3 c=mix(horizonColor,topColor,upper); float low=smoothstep(-.55,-.08,h); c=mix(lowerColor,c,low); float haze=1.0-smoothstep(-.12,.22,h); c=mix(c,horizonColor,haze*.22); gl_FragColor=vec4(c,1.0); }`
    });
    this.skyDome=new THREE.Mesh(new THREE.SphereGeometry(1150,48,24),material);
    this.skyDome.frustumCulled=false;this.skyDome.renderOrder=-100;this.scene.add(this.skyDome);
    this.skyUniforms=uniforms;
    this.dayTop=new THREE.Color(0x4d9fc8);this.nightTop=new THREE.Color(0x08152f);
    this.dayHorizon=new THREE.Color(0xf1c99d);this.nightHorizon=new THREE.Color(0x253752);
    this.dayLower=new THREE.Color(0x8bb5bd);this.nightLower=new THREE.Color(0x101d32);
  }

  createClouds() {
    this.clouds=[];
    const top=new THREE.MeshStandardMaterial({color:0xf8fbff,roughness:1,transparent:true,opacity:.94});
    const shade=new THREE.MeshStandardMaterial({color:0xb8c9d4,roughness:1,transparent:true,opacity:.52});
    const haze=new THREE.MeshBasicMaterial({color:0xeaf5fb,transparent:true,opacity:.075,depthWrite:false});
    for(let i=0;i<22;i++) {
      const cloud=new THREE.Group();
      const width=15+Math.random()*26, depth=7+Math.random()*10;
      // Irregular, softly overlapping lobes; geometry is gently perturbed so the silhouette is not toy-like.
      const count=7+Math.floor(Math.random()*5);
      for(let j=0;j<count;j++) {
        const geo=new THREE.IcosahedronGeometry(1,2);
        const a=geo.attributes.position;
        for(let k=0;k<a.count;k++) {
          const x=a.getX(k),y=a.getY(k),z=a.getZ(k);
          const n=1+.035*Math.sin(x*9+y*6+ i)+.025*Math.cos(z*11-y*4);
          a.setXYZ(k,x*n,y*n,z*n);
        }
        geo.computeVertexNormals();
        const puff=new THREE.Mesh(geo,j%4===0?shade:top);
        const t=j/(count-1);
        puff.position.set((t-.5)*width,(Math.random()-.5)*2.3,Math.sin(j*1.9+i)*depth*.22);
        puff.scale.set(3.6+Math.random()*3.4,1.25+Math.random()*1.5,2.8+Math.random()*2.8);
        cloud.add(puff);
      }
      const under=new THREE.Mesh(new THREE.SphereGeometry(1,18,12),haze);
      under.scale.set(width*.52,1.7,depth*.68); under.position.y=-1.3; cloud.add(under);
      cloud.position.set(Math.random()*1700-850,82+Math.random()*58,Math.random()*2000-1300);
      cloud.userData.speed=.75+Math.random()*1.3;
      cloud.userData.phase=Math.random()*Math.PI*2;
      this.scene.add(cloud); this.clouds.push(cloud);
      this.cloudMaterials={top,shade,haze};
    }
  }

  createCelestialSky() {
    const glowCanvas=document.createElement('canvas'); glowCanvas.width=glowCanvas.height=128;
    const g=glowCanvas.getContext('2d'); const grad=g.createRadialGradient(64,64,2,64,64,62);
    grad.addColorStop(0,'rgba(255,245,205,.95)'); grad.addColorStop(.18,'rgba(255,220,150,.42)'); grad.addColorStop(1,'rgba(255,210,140,0)');
    g.fillStyle=grad; g.fillRect(0,0,128,128);
    const glowTex=new THREE.CanvasTexture(glowCanvas);
    this.sunDisc=new THREE.Mesh(new THREE.SphereGeometry(7,32,24),new THREE.MeshBasicMaterial({color:0xffedc4}));
    this.sunGlow=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex,color:0xffdca0,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending}));
    this.sunGlow.scale.set(92,92,1); this.sunDisc.add(this.sunGlow); this.scene.add(this.sunDisc);
    this.moonDisc=new THREE.Mesh(new THREE.SphereGeometry(5.6,32,24),new THREE.MeshStandardMaterial({color:0xe9f0fa,emissive:0x65758d,emissiveIntensity:.34,roughness:.96}));
    this.scene.add(this.moonDisc);
    const starPositions=[], starSizes=[];
    for(let i=0;i<900;i++) {
      const theta=Math.random()*Math.PI*2, y=.12+Math.random()*.88, r=690+Math.random()*180;
      const h=Math.sqrt(1-y*y); starPositions.push(Math.cos(theta)*h*r,y*r,Math.sin(theta)*h*r);
      starSizes.push(.65+Math.random()*1.5);
    }
    const geo=new THREE.BufferGeometry(); geo.setAttribute('position',new THREE.Float32BufferAttribute(starPositions,3));
    this.stars=new THREE.Points(geo,new THREE.PointsMaterial({color:0xeaf3ff,size:1.45,sizeAttenuation:false,transparent:true,opacity:0,depthWrite:false}));
    this.scene.add(this.stars);
  }

  createSeabirds() {
    this.seabirds=[];
    const feather=new THREE.MeshStandardMaterial({color:0xf0eee4,roughness:.94,side:THREE.DoubleSide});
    const wingShade=new THREE.MeshStandardMaterial({color:0x9aa6a8,roughness:.96,side:THREE.DoubleSide});
    const beakMat=new THREE.MeshStandardMaterial({color:0xc58a43,roughness:.82});
    for(let i=0;i<12;i++){
      const bird=new THREE.Group();
      const body=new THREE.Mesh(new THREE.CapsuleGeometry(.075,.34,4,8),feather);body.rotation.x=Math.PI/2;bird.add(body);
      const tail=new THREE.Mesh(new THREE.ConeGeometry(.075,.26,5),wingShade);tail.rotation.x=-Math.PI/2;tail.position.z=-.28;bird.add(tail);
      const beak=new THREE.Mesh(new THREE.ConeGeometry(.045,.17,5),beakMat);beak.rotation.x=Math.PI/2;beak.position.z=.24;bird.add(beak);
      const wings=[];
      for(const side of [-1,1]){
        const shape=new THREE.Shape();shape.moveTo(0,0);shape.quadraticCurveTo(side*.42,.24,side*1.12,.11);shape.quadraticCurveTo(side*.76,-.12,side*.12,-.055);shape.lineTo(0,0);
        const wing=new THREE.Group();wing.position.set(side*.035,.035,0);
        const mesh=new THREE.Mesh(new THREE.ShapeGeometry(shape,8),side===1?feather:wingShade);wing.add(mesh);bird.add(wing);wings.push({wing,side});
      }
      bird.userData={phase:Math.random()*Math.PI*2,radius:18+Math.random()*32,centerX:Math.random()*900-450,centerZ:Math.random()*1800-1200,altitude:68+Math.random()*38,speed:.12+Math.random()*.12,wings};
      bird.traverse(o=>{if(o.isMesh){o.castShadow=false;o.receiveShadow=false;}});
      this.scene.add(bird);this.seabirds.push(bird);
    }
  }

  createAmbientVessels() {
    this.ambientVessels=[];
    const routes=[[-115,-90,1.1], [145,115,-.8], [-310,60,.65], [285,-185,2.1], [-430,240,-1.2]];
    routes.forEach(([x,z,dir],i)=>{
      const boat=new THREE.Group();
      const hullMat=new THREE.MeshStandardMaterial({color:[0x76503a,0x594235,0x80563a,0x6c4b39,0x8b5a3c][i],roughness:.88});
      const deckMat=new THREE.MeshStandardMaterial({color:0xb38a59,roughness:.94});
      // A tapered V-shaped wooden hull, with a raised bow and open working deck.
      const stations=[[-4.9,.03],[-3.8,.82],[-1.7,1.35],[1.5,1.35],[3.6,1.02],[4.9,.04]];
      const verts=[],indices=[];
      stations.forEach(([zz,w])=>{verts.push(-w,2.02,zz,w,2.02,zz,0,.62,zz);});
      for(let j=0;j<stations.length-1;j++){
        const a=j*3,b=(j+1)*3;
        indices.push(a,b,a+2,a+2,b,b+2,a+1,b+1,a+2,a+2,b+1,b+2);
      }
      const hullGeo=new THREE.BufferGeometry();hullGeo.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));hullGeo.setIndex(indices);hullGeo.computeVertexNormals();
      const hull=new THREE.Mesh(hullGeo,hullMat);hull.material.side=THREE.DoubleSide;boat.add(hull);
      const deck=new THREE.Mesh(new THREE.BoxGeometry(2.55,.18,8.9),deckMat);deck.position.set(0,2.04,-.1);boat.add(deck);
      // Gunwales, benches, cargo and stern tiller.
      for(const side of [-1,1]){
        const rail=new THREE.Mesh(new THREE.BoxGeometry(.12,.34,7.7),hullMat);rail.position.set(side*1.28,2.28,-.2);boat.add(rail);
        for(let j=0;j<4;j++){
          const seat=new THREE.Mesh(new THREE.BoxGeometry(2.35,.13,.16),deckMat);seat.position.set(0,2.25,-2.6+j*1.45);boat.add(seat);
        }
      }
      const stern=new THREE.Mesh(new THREE.BoxGeometry(2.3,.35,.18),hullMat);stern.position.set(0,2.22,-4.45);boat.add(stern);
      const cargo=new THREE.Mesh(new THREE.BoxGeometry(.82,.72,.78),new THREE.MeshStandardMaterial({color:0x795333,roughness:1}));cargo.position.set(-.62,2.48,-2.4);boat.add(cargo);
      const mast=new THREE.Mesh(new THREE.CylinderGeometry(.10,.16,7.3,10),hullMat);mast.position.set(0,5.55,.15);boat.add(mast);
      // Slightly bowed cloth sail with canvas seams and a small pirate/trader pennant.
      const sailMat=new THREE.MeshStandardMaterial({color:i===1?0xe6dfcc:0xf0e6d1,side:THREE.DoubleSide,roughness:1});
      const sailGeo=new THREE.PlaneGeometry(4.0,3.75,8,8);const pa=sailGeo.attributes.position;
      for(let v=0;v<pa.count;v++){const xx=pa.getX(v),yy=pa.getY(v);pa.setZ(v,-.16*Math.sin((xx+2)*Math.PI/4)*Math.sin((yy+1.9)*Math.PI/3.8));}sailGeo.computeVertexNormals();
      const sail=new THREE.Mesh(sailGeo,sailMat);sail.position.set(0,6.2,.35);boat.add(sail);
      const yard=new THREE.Mesh(new THREE.CylinderGeometry(.055,.055,4.3,8),hullMat);yard.rotation.z=Math.PI/2;yard.position.set(0,7.95,.35);boat.add(yard);
      const pennant=new THREE.Mesh(new THREE.ConeGeometry(.22,.95,4),new THREE.MeshStandardMaterial({color:i%2?0x9e3731:0x263e58,side:THREE.DoubleSide}));pennant.rotation.z=-Math.PI/2;pennant.position.set(.55,9.1,.15);boat.add(pennant);
      // Rigging lines from mast to bow/stern.
      const ropeMat=new THREE.LineBasicMaterial({color:0x4c3b2b,transparent:true,opacity:.78});
      [[0,8.7,.15,-1.15,2.35,4.25],[0,8.7,.15,1.15,2.35,4.25],[0,8.7,.15,-1.1,2.35,-4.1],[0,8.7,.15,1.1,2.35,-4.1]].forEach(v=>{
        const line=new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(v[0],v[1],v[2]),new THREE.Vector3(v[3],v[4],v[5])]),ropeMat);boat.add(line);
      });
      const crewCount=i===0||i===3?1:2;
      for(let n=0;n<crewCount;n++){
        const sailor=createCharacterMesh(n===0?'sailor':(i===1?'merchant':'fisher'));
        sailor.scale.setScalar(.72);sailor.position.set(n?-.68:.68,2.18,n?-.9:.9);boat.add(sailor);
        sailor.userData.ambientSailor=true;boat.userData ||= {}; (boat.userData.crew ||= []).push(sailor);
      }
      boat.position.set(x,0,z);boat.rotation.y=dir;
      boat.userData={...boat.userData,baseX:x,baseZ:z,dir,phase:Math.random()*6.28,speed:1.05+i*.22};
      boat.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});
      this.scene.add(boat);this.ambientVessels.push(boat);
    });
  }

  damageNearbyWall(position,forward,damage=50) {
    if(!position||!forward||!this.buildingColliders?.length)return null;
    let best=null,bestDistance=4.2;
    for(const building of this.buildingColliders){
      const dx=position.x-building.x,dz=position.z-building.z,c=Math.cos(building.rotation||0),sn=Math.sin(building.rotation||0);
      const lx=c*dx-sn*dz,lz=sn*dx+c*dz;
      const fx=c*forward.x-sn*forward.z,fz=sn*forward.x+c*forward.z;
      const candidates=(building.wallMeshes||[]).filter(mesh=>mesh.visible&&mesh.userData.localBounds);
      for(const mesh of candidates){
        const b=mesh.userData.localBounds;
        const wx=building.x+c*b.x+sn*b.z,wz=building.z-sn*b.x+c*b.z;
        const vx=wx-position.x,vz=wz-position.z,distance=Math.hypot(vx,vz);
        if(distance>bestDistance||distance<.05)continue;
        const facing=(vx*forward.x+vz*forward.z)/distance;
        // Only damage the wall the player is actually facing, not the roof or a distant facade.
        const localFront=Math.abs(lz-building.depth/2)<4.4;
        const localBack=Math.abs(lz+building.depth/2)<4.4;
        const localRight=Math.abs(lx-building.width/2)<4.4;
        const localLeft=Math.abs(lx+building.width/2)<4.4;
        if(facing<.28||!(localFront||localBack||localRight||localLeft))continue;
        best={building,mesh,distance,bounds:b};bestDistance=distance;
      }
    }
    if(!best)return null;
    const mesh=best.mesh;mesh.userData.wallHealth=Math.max(0,mesh.userData.wallHealth-damage);
    const ratio=mesh.userData.wallHealth/mesh.userData.wallMaxHealth;
    if(mesh.material?.color&&mesh.userData.baseColor){mesh.material.color.copy(mesh.userData.baseColor).multiplyScalar(.68+.32*ratio);}
    if(mesh.userData.wallHealth<=0){
      mesh.visible=false;best.building.breaches.push({...best.bounds});
      return {hit:true,destroyed:true};
    }
    return {hit:true,destroyed:false,remaining:mesh.userData.wallHealth};
  }

  resolvePlayerCollision(position,radius=.48) {
    if(!position||!this.buildingColliders?.length)return;
    for(const b of this.buildingColliders){
      const dx=position.x-b.x,dz=position.z-b.z,c=Math.cos(b.rotation||0),sn=Math.sin(b.rotation||0);
      const lx=c*dx-sn*dz,lz=sn*dx+c*dz;
      const hx=b.width/2, hz=b.depth/2;
      if((b.breaches||[]).some(v=>Math.abs(lx-v.x)<v.width/2+radius&&Math.abs(lz-v.z)<v.depth/2+radius&&position.y<(b.baseY||0)+v.height+.4))continue;
      // Only collide with the perimeter walls. Doorways and jump-through windows remain usable.
      const inX=Math.abs(lx)<hx+radius,inZ=Math.abs(lz)<hz+radius;
      if(!inX||!inZ)continue;
      const nearFront=Math.abs(lz-hz)<radius+.16;
      const doorOpen=nearFront&&Math.abs(lx)<(b.doorWidth||1.5)/2-.04;
      const windowOpen=nearFront&&(b.windowOpenings||[]).some(w=>Math.abs(lx-w.x)<w.width/2-radius*.12&&position.y>(b.baseY||0)+w.bottom-.15&&position.y<(b.baseY||0)+w.top+.35);
      if(doorOpen||windowOpen)continue;
      let nx=lx,nz=lz,changed=false;
      if(nearFront&&Math.abs(lx)<hx){nz=hz+radius;changed=true;}
      else if(Math.abs(lz+hz)<radius+.16){nz=-hz-radius;changed=true;}
      else if(Math.abs(lx-hx)<radius+.16){nx=hx+radius;changed=true;}
      else if(Math.abs(lx+hx)<radius+.16){nx=-hx-radius;changed=true;}
      if(changed){
        const wx=c*nx+sn*nz,wz=-sn*nx+c*nz;
        position.x=b.x+wx;position.z=b.z+wz;
      }
    }
  }

  getIslandAt(pos) {
    if (!pos || !this.islands) return null;

    for (const island of this.islands) {
      if (island.polygon?.length) {
        let inside = false;
        const polygon = island.polygon;
        for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
          const [xi, zi] = polygon[i];
          const [xj, zj] = polygon[j];
          const crosses = ((zi > pos.z) !== (zj > pos.z)) &&
            (pos.x < (xj - xi) * (pos.z - zi) / ((zj - zi) || 0.000001) + xi);
          if (crosses) inside = !inside;
        }
        if (inside) return island;
      } else {
        const distance = Math.hypot(
          pos.x - island.center.x,
          pos.z - island.center.z
        );
        if (distance <= island.radius) return island;
      }
    }

    return null;
  }

  update(dt,camera=null) {
    if (!this.oceanMesh || !this.oceanMesh.geometry) {
      return;
    }

    this.waterTime += dt;

    // A gentle 4-minute day/night cycle with a readable dusk and dawn.
    const cycle = (this.waterTime / 240) * Math.PI * 2;
    const daylight = THREE.MathUtils.clamp((Math.sin(cycle - Math.PI / 2) + 0.18) / 1.18, 0, 1);
    const smoothDay = daylight * daylight * (3 - 2 * daylight);
    this.ambientLight.intensity = 0.42 + smoothDay * 1.58;
    this.sunLight.intensity = 0.12 + smoothDay * 2.88;
    this.sunLight.position.set(Math.cos(cycle) * 190, 35 + smoothDay * 190, Math.sin(cycle) * 150);
    this.moonLight.position.set(-this.sunLight.position.x,Math.max(70,this.sunLight.position.y*.72),-this.sunLight.position.z);
    if(this.sunDisc){
      const sunDirection=this.sunLight.position.clone().normalize();
      if(camera){this.skyDome.position.copy(camera.position);this.stars.position.copy(camera.position);}
      this.sunDisc.position.copy(camera?camera.position:new THREE.Vector3()).addScaledVector(sunDirection,900);
      this.sunDisc.visible=smoothDay>.08;
      this.sunDisc.scale.setScalar(.92+smoothDay*.08);
      this.moonDisc.position.copy(camera?camera.position:new THREE.Vector3()).addScaledVector(sunDirection,-860);
      this.moonDisc.visible=smoothDay<.68;
      this.stars.material.opacity=THREE.MathUtils.clamp((.58-smoothDay)*1.65,0,.9);
      this.stars.rotation.y=this.waterTime*.0018;
      if(this.oceanMaterial?.bumpMap){this.oceanMaterial.bumpMap.offset.x=this.waterTime*.0035;this.oceanMaterial.bumpMap.offset.y=-this.waterTime*.0021;}
    }
    this.scene.background.copy(this.nightSky).lerp(this.daySky, smoothDay);
    this.scene.fog.color.copy(this.nightFog).lerp(this.dayFog, smoothDay);
    this.moonLight.intensity=.035+(1-smoothDay)*.34;
    if(this.oceanMaterial){this.oceanMaterial.color.copy(this.nightWaterTint).lerp(this.dayWaterTint,smoothDay);this.oceanMaterial.envMapIntensity=.08+smoothDay*.58;}
    if(this.cloudMaterials){
      this.cloudMaterials.top.color.setRGB(.30+.68*smoothDay,.36+.62*smoothDay,.50+.48*smoothDay);
      this.cloudMaterials.top.opacity=.34+.60*smoothDay;
      this.cloudMaterials.shade.opacity=.18+.38*smoothDay;
      this.cloudMaterials.haze.opacity=.018+.055*smoothDay;
    }
    this.lanternLights?.forEach(({light,lantern})=>{const glow=1-smoothDay;light.intensity=.06+glow*1.35;lantern.material.emissiveIntensity=.16+glow*1.45;});
    if(this.skyUniforms){
      this.skyUniforms.topColor.value.copy(this.nightTop).lerp(this.dayTop,smoothDay);
      this.skyUniforms.horizonColor.value.copy(this.nightHorizon).lerp(this.dayHorizon,smoothDay);
      this.skyUniforms.lowerColor.value.copy(this.nightLower).lerp(this.dayLower,smoothDay);
    }

    // Animated ocean waves
    const positions =
      this.oceanMesh.geometry.attributes.position;

    for (let i = 0; i < positions.count; i++) {
      const x = this.waterPositions[i * 3];
      const z = this.waterPositions[i * 3 + 2];

      const wave =
        Math.sin(x * 0.018 + z * .009 + this.waterTime * 1.05) * .43 +
        Math.cos(z * 0.026 - x * .006 + this.waterTime * .78) * .27 +
        Math.sin((x + z) * .047 + this.waterTime * 1.7) * .11 +
        Math.cos((x - z) * .071 - this.waterTime * 1.3) * .055;

      positions.array[i * 3 + 1] =
        this.waterPositions[i * 3 + 1] + wave;
    }

    positions.needsUpdate = true;

    // Recalculate ocean normals less frequently
    if (Math.floor(this.waterTime * 10) !==
        Math.floor((this.waterTime - dt) * 10)) {
      this.oceanMesh.geometry.computeVertexNormals();
    }

    this.windFoliage?.forEach(item=>{item.object.rotation.z=Math.sin(this.waterTime*.8+item.phase)*item.amount;item.object.rotation.x=Math.cos(this.waterTime*.63+item.phase)*item.amount*.65;});
    this.foamRings?.forEach((ring,i)=>{ring.material.opacity=.13+.055*(.5+.5*Math.sin(this.waterTime*1.35+i));ring.rotation.z=Math.sin(this.waterTime*.22+i)*.012;});
    this.seabirds?.forEach(bird=>{
      const d=bird.userData;const phase=this.waterTime*d.speed+d.phase;
      bird.position.set(d.centerX+Math.cos(phase)*d.radius,d.altitude+Math.sin(phase*2.1)*2.1,d.centerZ+Math.sin(phase)*d.radius);
      bird.rotation.y=Math.atan2(-Math.sin(phase),Math.cos(phase));
      d.wings.forEach(({wing,side})=>{wing.rotation.z=side*Math.sin(this.waterTime*11+d.phase)*.48;});
      if(camera)bird.visible=bird.position.distanceTo(camera.position)<520;
    });

    // Moving clouds
    this.clouds.forEach(cloud => {
      if(camera)cloud.visible=cloud.position.distanceTo(camera.position)<1050;
      cloud.position.x += dt * (cloud.userData.speed || 2);
      cloud.position.z += Math.sin(this.waterTime*.12+(cloud.userData.phase||0))*dt*.42;
      cloud.rotation.y=Math.sin(this.waterTime*.08+(cloud.userData.phase||0))*.018;
      if (cloud.position.x > 920) cloud.position.x = -920;
    });
    this.ambientVessels?.forEach((boat,i)=>{
      if(camera)boat.visible=boat.position.distanceTo(camera.position)<620;
      const phase=this.waterTime*.22+boat.userData.phase;
      boat.position.x=boat.userData.baseX+Math.sin(phase)*20;
      boat.position.z=boat.userData.baseZ+Math.cos(phase*.72)*16;
      boat.position.y=.35+Math.sin(this.waterTime*1.6+i)*.12;
      boat.rotation.y=boat.userData.dir+Math.sin(phase)*.12;
      boat.rotation.z=Math.sin(this.waterTime*1.1+i)*.018;
      boat.userData.crew?.forEach((crew,j)=>crew.userData.animate?.(this.waterTime+j*.8,.04,'idle'));
    });
  }
}
