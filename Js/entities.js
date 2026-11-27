import * as THREE from 'three';
import { createCharacterMesh } from './models.js';

export class NPC {
  constructor(scene, c) {
    Object.assign(this, c);
    this.mesh = createCharacterMesh(c.modelType || 'pirate');
    this.mesh.position.copy(c.position);
    scene.add(this.mesh);
    this.scene = scene;
    this.clock = Math.random() * Math.PI * 2;
    this.patrolIndex = 0;
    this.patrolWait = 0;
    this.home = c.position.clone();
    this.patrolPoints = (c.patrol || []).map(p => p.isVector3 ? p.clone() : new THREE.Vector3(...p));
    this.walkSpeed = c.walkSpeed || 2.1;
    this.idleTimer = 1.5 + Math.random() * 4;
    this.idleTurn = 0;
    this.homeFacing = this.ambient ? Math.random()*Math.PI*2 : this.mesh.rotation.y;
    if(this.ambient){this.mesh.rotation.y=this.homeFacing;this.mesh.position.x+=(Math.random()-.5)*1.1;this.mesh.position.z+=(Math.random()-.5)*1.1;this.patrolIndex=Math.floor(Math.random()*Math.max(1,this.patrolPoints.length));}
    this.gestureTimer = 2 + Math.random() * 5;
    this.gestureState = 'idle';
  }

  update(dt, playerPosition, followIndex = 0, world = null) {
    this.clock += dt;
    if (this.recruited && playerPosition) {
      const angle = Math.PI + followIndex * 0.72;
      const targetX = playerPosition.x + Math.sin(angle) * (3.2 + followIndex * 0.35);
      const targetZ = playerPosition.z + Math.cos(angle) * (3.2 + followIndex * 0.35);
      const dx = targetX - this.mesh.position.x;
      const dz = targetZ - this.mesh.position.z;
      const distance = Math.hypot(dx, dz);
      if (distance > 1.7) {
        const step = Math.min(distance, this.walkSpeed * 1.45 * dt);
        this.mesh.position.x += dx / distance * step;
        this.mesh.position.z += dz / distance * step;
        this.mesh.rotation.y = Math.atan2(dx, dz);
      }
      world?.resolvePlayerCollision?.(this.mesh.position,.42);
      this.mesh.userData.animate?.(this.clock, distance > 2 ? 0.62 : 0, distance > 2 ? 'walk' : 'idle');
      return;
    }
    if (this.patrolPoints.length && playerPosition && playerPosition.distanceTo(this.mesh.position) > 6) {
      if (this.patrolWait > 0) this.patrolWait = Math.max(0, this.patrolWait - dt);
      else {
        const target = this.patrolPoints[this.patrolIndex];
        const dx = target.x - this.mesh.position.x;
        const dz = target.z - this.mesh.position.z;
        const distance = Math.hypot(dx, dz);
        if (distance < 1.4) {
          this.patrolIndex = (this.patrolIndex + 1) % this.patrolPoints.length;
          this.patrolWait = 1.8;
        } else {
          this.mesh.position.x += dx / distance * this.walkSpeed * dt;
          this.mesh.position.z += dz / distance * this.walkSpeed * dt;
          this.mesh.rotation.y = Math.atan2(dx, dz);
        }
      }
    }
    const moving = this.patrolPoints.length > 0 && this.patrolWait <= 0 && playerPosition && playerPosition.distanceTo(this.mesh.position) > 6;
    if (this.ambient && !moving && !this.recruited) {
      this.idleTimer -= dt;
      this.gestureTimer -= dt;
      if (this.idleTimer <= 0) {
        this.idleTurn = (Math.random() - .5) * 1.5;
        this.idleTimer = 2.5 + Math.random() * 5.5;
      }
      if (this.gestureTimer <= 0) {
        const role=String(this.modelType||'').toLowerCase();
        const actions=role==='fisher'?['idle','fish','lookout','inspect']:
          role==='cook'?['idle','inspect','carry','talk']:
          role==='carpenter'?['idle','sweep','inspect','carry']:
          role==='guard'||role==='marine'?['idle','point','lookout','stretch']:
          role==='merchant'||role==='noble'?['idle','talk','wave','carry']:
          ['idle','idle','wave','talk','stretch','inspect','point'];
        this.gestureState = actions[Math.floor(Math.random() * actions.length)];
        this.gestureTimer = this.gestureState === 'idle' ? 2 + Math.random()*3 : 1.1 + Math.random()*1.2;
      }
      this.mesh.rotation.y += (this.homeFacing + this.idleTurn - this.mesh.rotation.y) * Math.min(1, dt * 1.6);
    }
    world?.resolvePlayerCollision?.(this.mesh.position,.42);
    const ambientPose = this.ambient && !moving && !this.recruited ? this.gestureState : 'idle';
    this.mesh.userData.animate?.(this.clock, moving ? 0.48 : 0, moving ? 'walk' : ambientPose);
  }
}

export class Enemy {
  constructor(scene, c) {
    Object.assign(this, c);
    this.scene = scene;
    this.dead = false;
    this.maxHp = c.hp || 50;
    this.reward = Number.isFinite(c.reward) ? c.reward : (c.isBoss ? 1000 : 100);
    this.xpReward = Number.isFinite(c.xpReward) ? c.xpReward : (c.isBoss ? 220 : 55);
    this.cd = 0;
    this.state = 'patrol';
    this.stateTimer = 0;
    this.clock = Math.random() * Math.PI * 2;
    this.home = c.position.clone();
    this.patrolPhase = Math.random() * Math.PI * 2;
    this.mesh = createCharacterMesh(c.modelType || 'pirate');
    this.mesh.position.copy(c.position);
    scene.add(this.mesh);
  }

  takeDamage(amt, kb) {
    if (this.dead) return;
    this.hp -= amt;
    if (kb) this.mesh.position.addScaledVector(kb, 1.5);
    this.state = 'chase';
    if (this.hp <= 0) {
      this.dead = true;
      this.mesh.rotation.x = -Math.PI / 2;
      setTimeout(() => this.scene.remove(this.mesh), 2000);
    }
  }

  update(dt, p, world = null) {
    if (this.dead || !p?.mesh) return;
    this.clock += dt;
    this.cd = Math.max(0, this.cd - dt);
    this.stateTimer = Math.max(0, this.stateTimer - dt);

    const position = this.mesh.position;
    const playerPosition = p.mesh.position;
    const toPlayer = playerPosition.clone().sub(position);
    toPlayer.y = 0;
    const distance = toPlayer.length();
    const homeDistance = Math.hypot(position.x - this.home.x, position.z - this.home.z);
    const alertRange = this.isBoss ? 42 : 30;
    const leashRange = this.isBoss ? 62 : 43;
    const attackRange = this.isBoss ? 3.8 : 2.8;

    if (this.state === 'patrol' && distance < alertRange) this.state = 'chase';
    if (this.state !== 'patrol' && (distance > leashRange || homeDistance > leashRange + 8)) {
      this.state = 'return';
      this.stateTimer = 0;
    }

    if (this.state === 'patrol') {
      const orbit = this.clock * 0.42 + this.patrolPhase;
      const tx = this.home.x + Math.cos(orbit) * 2.8;
      const tz = this.home.z + Math.sin(orbit) * 2.8;
      const dx = tx - position.x;
      const dz = tz - position.z;
      const len = Math.hypot(dx, dz) || 1;
      position.x += dx / len * this.speed * 0.22 * dt;
      position.z += dz / len * this.speed * 0.22 * dt;
      if (Math.hypot(dx, dz) > 0.2) this.mesh.rotation.y = Math.atan2(dx, dz);
    } else if (this.state === 'return') {
      const dx = this.home.x - position.x;
      const dz = this.home.z - position.z;
      const len = Math.hypot(dx, dz);
      if (len < 1.2) this.state = 'patrol';
      else {
        position.x += dx / len * this.speed * dt;
        position.z += dz / len * this.speed * dt;
        this.mesh.rotation.y = Math.atan2(dx, dz);
      }
    } else if (this.state === 'chase') {
      if (distance > attackRange) {
        toPlayer.normalize();
        position.addScaledVector(toPlayer, this.speed * dt);
        this.mesh.rotation.y = Math.atan2(toPlayer.x, toPlayer.z);
      } else if (this.cd <= 0) {
        this.state = 'windup';
        this.stateTimer = this.isBoss ? 0.72 : 0.52;
        this.mesh.rotation.y = Math.atan2(toPlayer.x, toPlayer.z);
      }
    } else if (this.state === 'windup' && this.stateTimer <= 0) {
      const currentDistance = Math.hypot(playerPosition.x - position.x, playerPosition.z - position.z);
      if (currentDistance <= attackRange + 0.9) p.takeDamage(this.damage);
      this.state = 'recover';
      this.stateTimer = 0.48;
      this.cd = this.isBoss ? 1.65 : 1.35;
    } else if (this.state === 'recover' && this.stateTimer <= 0) {
      this.state = distance < leashRange ? 'chase' : 'return';
    }

    world?.resolvePlayerCollision?.(position,.46);
    const moving = this.state === 'patrol' || this.state === 'return' || this.state === 'chase';
    const animState = this.state === 'windup' ? 'pistol' : moving ? 'walk' : 'idle';
    this.mesh.userData.animate?.(this.clock, moving ? 0.7 : 0, animState, this.state === 'windup' ? 0.5 : 0);
  }
}

export function spawnWorldEntities(scene) {
  return {
    npcs: [
      new NPC(scene, {
        id: 'shanks', name: 'Red-Haired Shanks', role: 'Captain of the Red-Haired Pirates',
        modelType: 'shanks', position: new THREE.Vector3(10, 2.3, -24),
        dialogue: ['A pirate should be free to follow his own dream, Luffy. Keep that promise we made—and take good care of that hat.']
      }),
      new NPC(scene, {
        id: 'mayor', name: 'Mayor Woop Slap', role: 'Mayor of Foosha Village',
        modelType: 'mayor', position: new THREE.Vector3(6, 2.3, 12),
        patrol: [[6, 2.3, 12], [13, 2.3, 12], [13, 2.3, 5], [5, 2.3, 5]], walkSpeed: 1.45,
        dialogue: ['Luffy! Before you head out, help the village gather its supplies. Then find your grandfather near the eastern path.']
      }),
      new NPC(scene, {
        id: 'garp', name: 'Monkey D. Garp', role: 'Marine Vice Admiral',
        modelType: 'garp', position: new THREE.Vector3(34, 2.3, 28),
        dialogue: ['A pirate, are you? Hah! If you want to survive out there, you will need more than a big mouth. Go find Dadan in the mountains.']
      }),
      new NPC(scene, {
        id: 'dadan', name: 'Curly Dadan', role: 'Bandit Chief', modelType: 'pirate',
        position: new THREE.Vector3(34, 2, -150),
        dialogue: ['Garp dumped another problem on my doorstep. The Gray Terminal bandits have been stealing food. Deal with them, then go find those two troublemakers in the forest.']
      }),
      new NPC(scene, {
        id: 'ace', name: 'Portgas D. Ace', role: 'Luffy’s Brother', modelType: 'ace',
        position: new THREE.Vector3(12, 2, -185),
        dialogue: ['I used to think I would be better off alone. You and Sabo changed that. Don’t let the sea take your spirit, Luffy.']
      }),
      new NPC(scene, {
        id: 'sabo', name: 'Sabo', role: 'Luffy’s Brother', modelType: 'sabo',
        position: new THREE.Vector3(52, 2, -194),
        dialogue: ['The three of us made a promise: we would each sail out and live freely. One day, we’ll meet again on the sea!']
      }),
      new NPC(scene, {
        id: 'nami', name: 'Nami', role: 'Navigator', modelType: 'nami',
        position: new THREE.Vector3(16, 2.3, 30),
        dialogue: ['I upgraded your sea charts! Your ship sails faster now!']
      }),
      new NPC(scene, {
        id: 'zoro', name: 'Roronoa Zoro', role: 'Swordsman', modelType: 'zoro',
        position: new THREE.Vector3(228, 2.25, 217),
        dialogue: ['You beat Captain Morgan! Count me in your crew, Luffy!']
      }),
      new NPC(scene, {
        id: 'sanji', name: 'Sanji', role: 'Chef', modelType: 'sanji',
        position: new THREE.Vector3(-230, 4, 244),
        dialogue: ['Eat up! Full HP restored. Those pirates are threatening my restaurant—help me drive them off!']
      }),
      new NPC(scene, {
        id: 'smoker', name: 'Smoker', role: 'Marine Captain of Loguetown', modelType: 'marine',
        position: new THREE.Vector3(25, 2.6, -650),
        dialogue: ['You made it all the way to Loguetown, Straw Hat. This town is watched by the Marines. Keep your crew out of trouble.']
      }),
      new NPC(scene, {
        id: 'buggy', name: 'Buggy the Clown', role: 'Pirate Captain', modelType: 'pirate',
        position: new THREE.Vector3(-34, 2.6, -680),
        dialogue: ['Well, well! The rubber rookie thinks he can stroll through my town? Crew, get him!']
      }),
      new NPC(scene, {
        id: 'logue_marine', name: 'Loguetown Marine', role: 'Marine Patrol', modelType: 'marine',
        position: new THREE.Vector3(86, 2.6, -642),
        patrol: [[86,2.6,-642],[104,2.6,-642],[104,2.6,-665],[86,2.6,-665]], walkSpeed: 2.2,
        dialogue: ['Move along. The Marine headquarters is not a tourist attraction.']
      }),
      ...[
        {name:'Dockworker',role:'Harbor Worker',type:'sailor',pos:[-18,2.3,18],route:[[-18,2.3,18],[-7,2.3,18],[-7,2.3,27],[-18,2.3,27]]},
        {name:'Market Trader',role:'Fruit Seller',type:'merchant',pos:[20,2.3,8],route:[[20,2.3,8],[27,2.3,8],[27,2.3,15],[20,2.3,15]]},
        {name:'Village Guard',role:'Village Watch',type:'guard',pos:[-28,2.3,-2],route:[[-28,2.3,-2],[-22,2.3,-2],[-22,2.3,9],[-28,2.3,9]]},
        {name:'Traveling Cook',role:'Wandering Cook',type:'civilian',pos:[-4,2.3,-15],route:[[-4,2.3,-15],[5,2.3,-15],[5,2.3,-7],[-4,2.3,-7]]},
        {name:'Harbor Sailor',role:'Sailor',type:'sailor',pos:[-42,2.3,5],route:[[-42,2.3,5],[-35,2.3,5],[-35,2.3,15],[-42,2.3,15]]},
        {name:'Loguetown Merchant',role:'Street Vendor',type:'merchant',pos:[-62,2.6,-638],route:[[-62,2.6,-638],[-48,2.6,-638],[-48,2.6,-650],[-62,2.6,-650]]},
        {name:'Town Resident',role:'Local Resident',type:'civilian',pos:[58,2.6,-700],route:[[58,2.6,-700],[68,2.6,-700],[68,2.6,-690],[58,2.6,-690]]},
        {name:'Marine Recruit',role:'Marine Recruit',type:'guard',pos:[-92,2.6,-670],route:[[-92,2.6,-670],[-82,2.6,-670],[-82,2.6,-658],[-92,2.6,-658]]},
        {name:'Old Fisherman',role:'Fisherman',type:'fisher',pos:[-34,2.3,31],route:[[-34,2.3,31],[-25,2.3,34],[-18,2.3,29],[-28,2.3,25]]},
        {name:'Tavern Cook',role:'Cook',type:'cook',pos:[-3,2.3,-31],route:[[-3,2.3,-31],[7,2.3,-31],[8,2.3,-24],[-2,2.3,-24]]},
        {name:'Wandering Swordsman',role:'Swordsman',type:'swordsman',pos:[-53,2.3,-10],route:[[-53,2.3,-10],[-43,2.3,-8],[-44,2.3,2],[-54,2.3,1]]},
        {name:'Traveling Merchant',role:'Traveling Merchant',type:'traveler',pos:[-76,2.6,-690],route:[[-76,2.6,-690],[-66,2.6,-690],[-66,2.6,-680],[-76,2.6,-680]]},
        {name:'Loguetown Innkeeper',role:'Innkeeper',type:'innkeeper',pos:[40,2.6,-720],route:[[40,2.6,-720],[51,2.6,-720],[51,2.6,-709],[40,2.6,-709]]},
        {name:'Noble Visitor',role:'Island Visitor',type:'noble',pos:[68,2.6,-625],route:[[68,2.6,-625],[77,2.6,-625],[77,2.6,-615],[68,2.6,-615]]},
        {name:'Dock Carpenter',role:'Shipwright',type:'carpenter',pos:[-18,2.3,42],route:[[-18,2.3,42],[-8,2.3,42],[-8,2.3,49],[-18,2.3,49]]},
        {name:'Traveling Doctor',role:'Doctor',type:'doctor',pos:[92,2.6,-710],route:[[92,2.6,-710],[101,2.6,-710],[101,2.6,-700],[92,2.6,-700]]},
        {name:'Market Porter',role:'Porter',type:'porter',pos:[-40,2.6,-620],route:[[-40,2.6,-620],[-30,2.6,-620],[-30,2.6,-610],[-40,2.6,-610]]},
        {name:'Bandit Drifter',role:'Drifter',type:'bandit',pos:[34,2.3,-168],route:[[34,2.3,-168],[42,2.3,-168],[42,2.3,-158],[34,2.3,-158]]},
        {name:'Navigator Apprentice',role:'Apprentice Navigator',type:'navigator',pos:[-12,2.3,34],route:[[-12,2.3,34],[-5,2.3,34],[-5,2.3,41],[-12,2.3,41]]},
        {name:'Loguetown Fish Seller',role:'Fish Seller',type:'fisher',pos:[-111,2.6,-652],route:[[-111,2.6,-652],[-101,2.6,-652],[-101,2.6,-642],[-111,2.6,-642]]},
        {name:'Marine Quartermaster',role:'Quartermaster',type:'guard',pos:[260,2.25,226],route:[[260,2.25,226],[270,2.25,226],[270,2.25,236],[260,2.25,236]]},
        {name:'Marine Patrolman',role:'Marine Patrol',type:'marine',pos:[220,2.25,190],route:[[220,2.25,190],[230,2.25,190],[230,2.25,200],[220,2.25,200]]},
        {name:'Captured Bandit',role:'Prisoner',type:'bandit',pos:[250,2.25,240],route:[[250,2.25,240],[255,2.25,240],[255,2.25,244],[250,2.25,244]]},
        {name:'Base Cook',role:'Cook',type:'cook',pos:[215,2.25,235],route:[[215,2.25,235],[224,2.25,235],[224,2.25,242],[215,2.25,242]]},
        {name:'Harbor Trader',role:'Merchant',type:'merchant',pos:[265,2.25,190],route:[[265,2.25,190],[275,2.25,190],[275,2.25,198],[265,2.25,198]]},
        {name:'Dock Fisher',role:'Fisherman',type:'fisher',pos:[205,2.25,215],route:[[205,2.25,215],[213,2.25,215],[213,2.25,223],[205,2.25,223]]},
        {name:'Marine Officer',role:'Officer',type:'morgan',pos:[243,2.25,204],route:[[243,2.25,204],[252,2.25,204],[252,2.25,212],[243,2.25,212]]},
        {name:'Base Resident',role:'Civilian',type:'civilian',pos:[230,2.25,230],route:[[230,2.25,230],[238,2.25,230],[238,2.25,238],[230,2.25,238]]},
        {name:'Baratie Assistant Chef',role:'Assistant Chef',type:'cook',pos:[-218,4,250],route:[[-218,4,250],[-211,4,250],[-211,4,258],[-218,4,258]]},
        {name:'Baratie Fishmonger',role:'Fishmonger',type:'fisher',pos:[-242,4,260],route:[[-242,4,260],[-234,4,260],[-234,4,268],[-242,4,268]]}
      ].map((c,i)=>new NPC(scene,{
        id:`ambient_${i}`,name:c.name,role:c.role,modelType:c.type,ambient:true,
        position:new THREE.Vector3(...c.pos),patrol:c.route,walkSpeed:1.1+Math.random()*.65,
        dialogue:['Just enjoying the day. The sea has a way of bringing all kinds of people to these islands.']
      }))
    ],
    enemies: [
      new Enemy(scene, { id: 'm1', name: 'Marine', modelType: 'marine', hp: 50, damage: 8, speed: 7, position: new THREE.Vector3(226, 2.25, 202) }),
      new Enemy(scene, { id: 'morgan', name: 'Captain Morgan', modelType: 'morgan', isBoss: true, hp: 160, damage: 16, speed: 8.5, position: new THREE.Vector3(240, 2.25, 198) }),
      new Enemy(scene, { id: 'logue_marine_1', name: 'Loguetown Marine', modelType: 'marine', hp: 62, damage: 10, speed: 6.8, position: new THREE.Vector3(91, 2.6, -663) }),
      new Enemy(scene, { id: 'logue_marine_2', name: 'Loguetown Marine Officer', modelType: 'marine', hp: 82, damage: 12, speed: 7.1, position: new THREE.Vector3(108, 2.6, -685) })
    ]
  };
}
