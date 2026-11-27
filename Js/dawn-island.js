
import * as THREE from 'three';

const mat = (color, roughness = 0.9) =>
  new THREE.MeshStandardMaterial({ color, roughness });

function addTree(scene, x, z, scale = 1) {
  const g = new THREE.Group();
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(.35, .55, 5, 8), mat(0x76502e));
  trunk.position.y = 2.5;
  g.add(trunk);
  for (let i = 0; i < 6; i++) {
    const leaf = new THREE.Mesh(new THREE.SphereGeometry(2.1, 9, 7), mat([0x286c35,0x347e3d,0x438d45][i%3]));
    const a = i * Math.PI / 3;
    leaf.position.set(Math.cos(a)*1.2, 5.2 + (i%2)*.45, Math.sin(a)*1.2);
    leaf.scale.set(1.1,.75,1);
    g.add(leaf);
  }
  g.position.set(x, 2, z);
  g.scale.setScalar(scale);
  g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  scene.add(g);
}

function addHouse(scene, x, z, width, height, color, roofColor) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(width,height,width*.8), mat(color));
  body.position.y = height/2;
  const roof = new THREE.Mesh(new THREE.ConeGeometry(width*.78, height*.65, 4), mat(roofColor));
  roof.position.y = height + height*.28;
  roof.rotation.y = Math.PI/4;
  const door = new THREE.Mesh(new THREE.BoxGeometry(width*.18,height*.52,.16), mat(0x49301f));
  door.position.set(0,height*.26,width*.405);
  g.add(body,roof,door);
  g.position.set(x,2.2,z);
  g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  scene.add(g);
}

function addLabel(scene, text, x, z, color = 0xffe08a) {
  const canvas = document.createElement('canvas');
  canvas.width = 512; canvas.height = 96;
  const c = canvas.getContext('2d');
  c.fillStyle = 'rgba(12,24,35,.72)';
  c.roundRect(4,4,504,88,18); c.fill();
  c.font = 'bold 42px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
  c.fillStyle = `#${color.toString(16).padStart(6,'0')}`;
  c.fillText(text,256,48);
  const tex = new THREE.CanvasTexture(canvas);
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({map:tex, transparent:true, depthTest:false}));
  sprite.position.set(x, 15, z);
  sprite.scale.set(34,6.4,1);
  scene.add(sprite);
}

export function buildDawnIsland(scene, world) {
  // Broad connected mainland around Foosha: the earlier prototype's small islands remain playable.
  // The old shoreline was too tight around the northern districts: Mount
  // Colubo's ridge and the eastern walls/palace of Goa were visibly floating.
  // This wider, north-reaching outline encloses every Dawn Island landmark.
  const outline = new THREE.Shape();
  outline.moveTo(-190,-130);
  outline.bezierCurveTo(-230,-60,-230,170,-150,250);
  outline.bezierCurveTo(-70,310,70,315,155,260);
  outline.bezierCurveTo(225,215,245,130,235,50);
  outline.bezierCurveTo(230,-40,215,-115,165,-140);
  outline.bezierCurveTo(90,-135,-80,-135,-190,-130);
  const geo = new THREE.ShapeGeometry(outline, 48);
  geo.rotateX(-Math.PI/2);
  const land = new THREE.Mesh(geo, mat(0x568d45));
  land.position.set(0,1.95,-75);
  land.receiveShadow = true;
  scene.add(land);
  world.islands.push({
    id:'dawn-mainland', name:'Dawn Island',
    center:new THREE.Vector3(0,0,-75), radius:330, groundY:2.0,
    polygon:[[-190,55],[-230,-15],[-230,-245],[-150,-325],[0,-390],[155,-335],[235,-125],[165,65]]
  });

  // Mount Colubo ridgeline and wooded foothills
  const ridgeMat = mat(0x65745a);
  for (let i=0;i<9;i++) {
    const peak = new THREE.Mesh(new THREE.ConeGeometry(17 + (i%3)*5, 42 + (i%4)*9, 7), ridgeMat);
    peak.position.set(-65 + i*19, 20 + (i%3)*3, -250 + Math.sin(i*.7)*13);
    peak.castShadow = true; scene.add(peak);
  }
  for (let i=0;i<62;i++) {
    const a = i*2.399, r = 28 + (i%9)*8;
    addTree(scene, 30 + Math.cos(a)*r, -174 + Math.sin(a)*r, .75 + (i%4)*.12);
  }
  addLabel(scene,'MOUNT COLUBO',30,-178,0xc5d8a0);

  // Gray Terminal: dense, rough shanty settlement
  for (let i=0;i<24;i++) {
    const x = -135 + (i%6)*12 + Math.sin(i*2)*3;
    const z = -108 + Math.floor(i/6)*13 + Math.cos(i)*3;
    addHouse(scene,x,z,6 + (i%3),3.5 + (i%2),[0x76604a,0x8a7358,0x6b6257][i%3],0x4b4037);
  }
  for (let i=0;i<26;i++) {
    const a=i*2.4, r=8+(i%6)*5;
    addTree(scene,-132+Math.cos(a)*r,-105+Math.sin(a)*r,.55);
  }
  addLabel(scene,'GRAY TERMINAL',-130,-112,0xf0c58c);

  // Goa Kingdom: walled town, gate and palace silhouette
  const wallMat = mat(0xd8c8a3);
  for (const [x,z,rot] of [[94,-140,0],[164,-140,0],[129,-177,Math.PI/2],[129,-103,Math.PI/2]]) {
    const wall = new THREE.Mesh(new THREE.BoxGeometry(3,10,38),wallMat);
    wall.position.set(x,7,z); wall.rotation.y=rot; wall.castShadow=true; scene.add(wall);
  }
  addHouse(scene,116,-130,12,9,0xe6d5b3,0x9d8d79);
  addHouse(scene,145,-130,12,9,0xe0cba5,0x8b806f);
  const palace = new THREE.Group();
  const base = new THREE.Mesh(new THREE.BoxGeometry(42,20,28),mat(0xe8dcc4));
  base.position.y=12;
  const roof = new THREE.Mesh(new THREE.ConeGeometry(25,14,4),mat(0x7e7771));
  roof.position.y=29; roof.rotation.y=Math.PI/4;
  palace.add(base,roof); palace.position.set(130,2,-205);
  palace.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});
  scene.add(palace);
  addLabel(scene,'GOA KINGDOM',130,-210,0xffe6ae);

  // Trail markers and scattered wilderness trees make the route readable.
  for(let i=0;i<48;i++){
    const t=i/47;
    addTree(scene,-8 + t*118, -35 - t*86 + Math.sin(t*12)*8,.65+(i%3)*.12);
  }
  addLabel(scene,'FOOSHA VILLAGE',0,7,0xffe08a);
}
