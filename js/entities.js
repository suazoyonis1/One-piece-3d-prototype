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
  }

  update(dt, playerPosition, followIndex = 0) {
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
    this.mesh.userData.animate?.(this.clock, moving ? 0.48 : 0, moving ? 'walk' : 'idle');
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

  update(dt, p) {
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
      })
    ],
    enemies: [
      new Enemy(scene, { id: 'm1', name: 'Marine', modelType: 'marine', hp: 50, damage: 8, speed: 7, position: new THREE.Vector3(226, 2.25, 202) }),
      new Enemy(scene, { id: 'morgan', name: 'Captain Morgan', modelType: 'morgan', isBoss: true, hp: 160, damage: 16, speed: 8.5, position: new THREE.Vector3(240, 2.25, 198) })
    ]
  };
}
