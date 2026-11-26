import * as THREE from 'three';
import { Enemy } from './entities.js';

export class QuestManager {
  constructor(scene, world, player, ship, npcs, enemies) {
    Object.assign(this, {
      scene, world, player, ship, npcs, enemies,
      step: 0, crates: 0, crew: ['Luffy'], spawnedBandits: false,
      spawnedKrieg: false, spawnedBuggy: false, bounty: 300000
    });

    this.quests = [
      { title: 'Dawn Island: The Promise', objective: 'Find Red-Haired Shanks near Foosha’s southern dock.', waypoint: new THREE.Vector3(10, 2.3, -24) },
      { title: 'Dawn Island: Foosha Village', objective: 'Talk to Mayor Woop Slap in the village.', waypoint: new THREE.Vector3(6, 2.3, 12) },
      { title: 'Dawn Island: Village Supplies', objective: 'Collect the 3 supply crates around Foosha Village.', waypoint: new THREE.Vector3(14, 2.8, 6) },
      { title: 'Dawn Island: The Grandfather', objective: 'Find Monkey D. Garp near the eastern village path.', waypoint: new THREE.Vector3(34, 2.3, 28) },
      { title: 'Dawn Island: Mount Colubo', objective: 'Find Curly Dadan at her mountain hideout.', waypoint: new THREE.Vector3(34, 2, -150) },
      { title: 'Dawn Island: Gray Terminal', objective: 'Defeat the 3 bandits threatening the settlement.', waypoint: new THREE.Vector3(-132, 2, -105) },
      { title: 'Dawn Island: Brothers', objective: 'Find Ace in the Mount Colubo forest.', waypoint: new THREE.Vector3(12, 2, -185) },
      { title: 'Dawn Island: A Promise of Freedom', objective: 'Find Sabo and talk about the brothers’ dream.', waypoint: new THREE.Vector3(52, 2, -194) },
      { title: 'East Blue: Ten Years Later', objective: 'Return to Foosha and board your ship at the southern dock [F].', waypoint: new THREE.Vector3(5, 1, 70) },
      { title: 'East Blue: Shells Town', objective: 'Sail southeast and defeat Captain Morgan!', waypoint: new THREE.Vector3(240, 2.25, 198) },
      { title: 'East Blue: Recruit Zoro', objective: 'Talk to Roronoa Zoro [F].', waypoint: new THREE.Vector3(228, 2.25, 217) },
      { title: 'East Blue: Baratie', objective: 'Sail southwest to Baratie and speak to Sanji.', waypoint: new THREE.Vector3(-230, 4, 244) },
      { title: 'East Blue: Defend Baratie', objective: 'Defeat the invading Krieg Pirates!', waypoint: new THREE.Vector3(-230, 4, 270) },
      { title: 'East Blue Complete!', objective: 'Sail north to Loguetown and begin the Grand Line chapter.', waypoint: new THREE.Vector3(0, 2.6, -650) },
      { title: 'Grand Line: Loguetown', objective: 'Reach Loguetown, the town where the Pirate King was executed.', waypoint: new THREE.Vector3(0, 2.6, -650) },
      { title: 'Grand Line: The Marine Captain', objective: 'Find Smoker near the Marine headquarters.', waypoint: new THREE.Vector3(25, 2.6, -650) },
      { title: 'Grand Line: Buggy’s Ambush', objective: 'Defeat Buggy’s crew in the Loguetown plaza.', waypoint: new THREE.Vector3(-34, 2.6, -680) },
      { title: 'Grand Line: Reverse Mountain', objective: 'Sail to Reverse Mountain and reach the Grand Line entrance.', waypoint: new THREE.Vector3(0, 5.5, -1050) },
      { title: 'Grand Line Entered!', objective: 'You have crossed Reverse Mountain. The Grand Line awaits!', waypoint: new THREE.Vector3(0, 5.5, -1050) }
    ];
    this.updateUI();
  }

  showBanner(message) {
    const banner = document.getElementById('banner-alert');
    if (!banner) return;
    banner.textContent = message;
    banner.classList.remove('hidden');
    setTimeout(() => banner.classList.add('hidden'), 3000);
  }

  advance(message) {
    this.step = Math.min(this.step + 1, this.quests.length - 1);
    const reward = 75 + this.step * 25;
    this.player.berries += reward;
    const levels = this.player.gainXP(90 + this.step * 20);
    this.showBanner(`${message || 'Quest complete!'} +${reward} Berries · +${90 + this.step * 20} XP${levels ? ` · Level ${this.player.level}!` : ''}`);
    this.updateUI();
  }

  onTalkToNPC(npc) {
    if (npc.id === 'shanks' && this.step === 0) {
      this.advance('A promise made in Foosha will shape Luffy’s future.');
    } else if (npc.id === 'mayor' && this.step === 1) {
      this.advance();
    } else if (npc.id === 'garp' && this.step === 3) {
      this.advance('Garp sent you toward Mount Colubo.');
    } else if (npc.id === 'dadan' && this.step === 4) {
      this.step = 5;
      if (!this.spawnedBandits) {
        this.spawnedBandits = true;
        [[-132, 2, -105], [-122, 2, -111], [-143, 2, -97]].forEach((position, i) => {
          this.enemies.push(new Enemy(this.scene, {
            id: `gray_bandit_${i}`, name: `Gray Terminal Bandit ${i + 1}`,
            modelType: 'pirate', hp: 55, damage: 8, speed: 6.5,
            position: new THREE.Vector3(...position)
          }));
        });
      }
      this.showBanner('Gray Terminal bandits have appeared!');
      this.updateUI();
    } else if (npc.id === 'ace' && this.step === 6) {
      this.advance('Ace told you to find Sabo.');
    } else if (npc.id === 'sabo' && this.step === 7) {
      this.advance('The brothers’ promise is made. Your adventure is waiting.');
    } else if (npc.id === 'smoker' && this.step === 14) {
      this.advance('Smoker has warned you: the Marines are watching Loguetown.');
    } else if (npc.id === 'buggy' && this.step === 15) {
      if (!this.spawnedBuggy) {
        this.spawnedBuggy = true;
        this.step = 16;
        [[-47,2.6,-681],[-25,2.6,-688],[-42,2.6,-699]].forEach((position,i) => {
          this.enemies.push(new Enemy(this.scene, {
            id: `buggy_crew_${i}`, name: `Buggy Pirate ${i+1}`,
            modelType: 'pirate', hp: 72, damage: 11, speed: 7.2,
            position: new THREE.Vector3(...position)
          }));
        });
        this.enemies.push(new Enemy(this.scene, {
          id: 'buggy_boss', name: 'Buggy the Clown', modelType: 'pirate',
          isBoss: true, hp: 210, damage: 17, speed: 8.4,
          position: new THREE.Vector3(-34,2.6,-680)
        }));
      }
      this.showBanner('Buggy’s crew has ambushed the plaza!');
      this.updateUI();
    } else if (npc.id === 'nami') {
      this.ship.chartBonus = 18;
      this.showBanner('Ship speed upgraded!');
    } else if (npc.id === 'zoro' && this.step === 10) {
      this.crew.push('Zoro');
      const zoro = this.npcs.find(n => n.id === 'zoro');
      if (zoro) zoro.recruited = true;
      this.player.berries += 1500;
      this.advance('Zoro joined your crew!');
    } else if (npc.id === 'sanji') {
      this.player.healFull();
      this.showBanner('HP and stamina restored!');
      if (this.step === 11 && !this.spawnedKrieg) {
        this.spawnedKrieg = true;
        this.step = 12;
        [-10, 10, 0].forEach((x, i) => {
          this.enemies.push(new Enemy(this.scene, {
            id: `pirate_${i}`, name: 'Krieg Pirate', modelType: 'pirate',
            hp: 70, damage: 10, speed: 8,
            position: new THREE.Vector3(-230 + x, 4, 270 + (i === 2 ? 8 : 0))
          }));
        });
        this.updateUI();
      }
    }
  }

  update(playerPosition, isSailing) {
    const island = this.world.getIslandAt?.(playerPosition);
    if (this.step === 13 && island?.id === 'logue') {
      this.advance('Loguetown reached — the Grand Line chapter begins!');
    }
    if (this.step === 17 && island?.id === 'reverse-mountain') {
      this.advance('You conquered the currents of Reverse Mountain!');
    }

    if (this.step === 2) {
      this.world.supplyCrates.forEach(crate => {
        if (!crate.userData.collected && playerPosition.distanceTo(crate.position) < 3.5) {
          crate.userData.collected = true;
          crate.visible = false;
          this.crates++;
          if (this.crates >= 3) {
            this.advance('Supplies collected — find Garp near the village path.');
          }
        }
      });
    }

    if (this.step === 5 && this.enemies.filter(e => e.id.startsWith('gray_bandit_')).length === 3 &&
        this.enemies.filter(e => e.id.startsWith('gray_bandit_')).every(e => e.dead)) {
      this.advance('Gray Terminal is safe. Find Ace in the forest.');
    }

    if (this.step === 8 && isSailing) {
      this.advance('Ten years later — Luffy sets out to become King of the Pirates!');
    }

    if (this.step === 9 && this.enemies.find(e => e.id === 'morgan')?.dead) {
      this.advance('Captain Morgan is defeated. Find Zoro!');
    }

    if (this.step === 16 && this.enemies.filter(e => e.id.startsWith('buggy_')).length === 4 &&
        this.enemies.filter(e => e.id.startsWith('buggy_')).every(e => e.dead)) {
      this.advance('Buggy’s ambush is over. Set course for Reverse Mountain!');
    }

    if (this.step === 12 && this.enemies.filter(e => e.id.startsWith('pirate_')).length === 3 &&
        this.enemies.filter(e => e.id.startsWith('pirate_')).every(e => e.dead)) {
      if (!this.crew.includes('Sanji')) this.crew.push('Sanji');
      const sanji = this.npcs.find(n => n.id === 'sanji');
      if (sanji) sanji.recruited = true;
      this.advance('Sanji joined your crew! East Blue chapter complete.');
    }

    const quest = this.quests[this.step];
    const distance = document.getElementById('quest-distance');
    if (distance && quest) {
      distance.textContent = `Waypoint: ${Math.round(playerPosition.distanceTo(quest.waypoint))} m`;
    }
    const crew = document.getElementById('crew-text');
    if (crew) crew.textContent = this.crew.join(', ');
  }

  updateUI() {
    const quest = this.quests[this.step];
    const title = document.getElementById('quest-title');
    const objective = document.getElementById('quest-objective');
    if (title && quest) title.textContent = quest.title;
    if (objective && quest) objective.textContent = quest.objective;
    const tag = document.querySelector('.quest-tag');
    if (tag) tag.textContent = this.step >= 13 ? 'GRAND LINE STORY' : this.step >= 8 ? 'EAST BLUE STORY' : 'DAWN ISLAND STORY';
  }
}
