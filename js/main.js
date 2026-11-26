
import * as THREE from 'three';
import { World } from './world.js';
import { PlayerController } from './player.js';
import { PirateShip } from './ship.js';
import { spawnWorldEntities } from './entities.js';
import { QuestManager } from './quests.js';

class OnePieceGame {
  constructor() {
    this.keys = {};
    this.isSailing = false;
    this.dlg = null;
    this.running = false;
    this.lastError = null;

    this.init();
  }

  init() {
    try {
      // Check that the game canvas exists
      const canvas = document.getElementById('game-canvas');

      if (!canvas) {
        throw new Error('Missing HTML element: #game-canvas');
      }

      // Renderer
      this.renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        powerPreference: 'high-performance'
      });

      this.renderer.setPixelRatio(
        Math.min(window.devicePixelRatio || 1, 1.75)
      );

      this.renderer.setSize(
        window.innerWidth,
        window.innerHeight
      );

      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
      this.renderer.toneMappingExposure = 1.15;

      // Scene
      this.scene = new THREE.Scene();

      // Camera
      this.camera = new THREE.PerspectiveCamera(
        60,
        window.innerWidth / window.innerHeight,
        0.1,
        1200
      );

      // Game systems
      this.world = new World(this.scene);
      this.player = new PlayerController(
        this.scene,
        this.camera
      );

      this.ship = new PirateShip(this.scene);

      const entities = spawnWorldEntities(this.scene);

      this.npcs = entities?.npcs || [];
      this.enemies = entities?.enemies || [];

      this.qm = new QuestManager(
        this.scene,
        this.world,
        this.player,
        this.ship,
        this.npcs,
        this.enemies
      );

      // Validate important game objects
      if (!this.player?.mesh) {
        throw new Error('Player failed to load');
      }

      if (!this.ship?.mesh) {
        throw new Error('Ship failed to load');
      }

      if (!this.world?.update) {
        throw new Error('World update function is missing');
      }

      // Clock
      this.clock = new THREE.Clock();

      // Start game
      this.bindEvents();
      this.running = true;
      this.animate();

      console.log('One Piece game initialized successfully');

    } catch (error) {
      this.showError('Game initialization failed', error);
    }
  }

  // Display errors directly on the game screen
  showError(message, error) {
    console.error(message, error);

    this.running = false;

    let panel = document.getElementById('game-error');

    if (!panel) {
      panel = document.createElement('div');
      panel.id = 'game-error';

      Object.assign(panel.style, {
        position: 'fixed',
        inset: '0',
        zIndex: '99999',
        background: '#101827',
        color: 'white',
        padding: '30px',
        fontFamily: 'monospace',
        overflow: 'auto'
      });

      document.body.appendChild(panel);
    }

    panel.replaceChildren();

    const heading = document.createElement('h2');
    heading.textContent = message;

    const details = document.createElement('pre');
    details.style.whiteSpace = 'pre-wrap';
    details.textContent =
      error?.stack || error?.message || String(error);

    panel.append(heading, details);
  }

  // Safely update an HTML element if it exists
  setText(id, value) {
    const element = document.getElementById(id);

    if (element) {
      element.textContent = value;
    }
  }

  setWidth(id, value) {
    const element = document.getElementById(id);

    if (element) {
      element.style.width = `${value}%`;
    }
  }

  setHeight(id, value) {
    const element = document.getElementById(id);

    if (element) {
      element.style.height = `${value}%`;
    }
  }

  bindEvents() {
    window.addEventListener('resize', () => {
      if (!this.camera || !this.renderer) return;

      this.camera.aspect =
        window.innerWidth / window.innerHeight;

      this.camera.updateProjectionMatrix();

      this.renderer.setSize(
        window.innerWidth,
        window.innerHeight
      );
    });

    // Clear stuck keys when the player changes tabs
    window.addEventListener('blur', () => {
      this.keys = {};
    });

    window.addEventListener('keydown', event => {
      this.keys[event.code] = true;

      // Prevent browser scrolling during gameplay
      if (
        ['Space', 'ArrowUp', 'ArrowDown',
         'ArrowLeft', 'ArrowRight'].includes(event.code)
      ) {
        event.preventDefault();
      }

      // Avoid repeating actions while holding a key
      if (event.repeat) return;

      if (this.dlg) {
        if (
          event.code === 'KeyF' ||
          event.code === 'Space'
        ) {
          this.closeDialogue();
        }

        return;
      }

      if (event.code === 'KeyF') {
        this.interact();
      }

      if (!this.isSailing && event.code === 'KeyC') {
        this.player.dodge(this.keys);
      }

      if (!this.isSailing && event.code === 'KeyQ') {
        this.player.useGomuPistol(this.enemies);
      }

      if (!this.isSailing && event.code === 'KeyE') {
        this.player.useGomuGatling(this.enemies);
      }
    });

    window.addEventListener('keyup', event => {
      this.keys[event.code] = false;
    });

    window.addEventListener('mousedown', event => {
      if (
        event.button === 0 &&
        !this.dlg &&
        !this.isSailing &&
        this.player
      ) {
        this.player.performMeleeCombo(this.enemies);
      }
    });
  }

  closeDialogue() {
    const npc = this.dlg;

    if (!npc) return;

    this.dlg = null;

    const box = document.getElementById('dialogue-box');

    if (box) {
      box.classList.add('hidden');
    }

    if (this.qm?.onTalkToNPC) {
      this.qm.onTalkToNPC(npc);
    }
  }

  interact() {
    if (!this.player || !this.world) return;

    // Disembark from ship
    if (this.isSailing) {
      const islands = this.world.islands || [];

      const island = islands.find(i => {
        if (!i?.center || typeof i.radius !== 'number') {
          return false;
        }

        const distance = Math.hypot(
          this.ship.mesh.position.x - i.center.x,
          this.ship.mesh.position.z - i.center.z
        );

        return distance <= i.radius + 28;
      });

      if (island) {
        this.isSailing = false;
        this.ship.isControlled = false;

        this.player.mesh.position.set(
          island.center.x,
          island.groundY ?? 0.2,
          island.center.z + island.radius - 8
        );

        this.player.velocity?.set(0, 0, 0);
      }

      return;
    }

    // Talk to nearby NPC
    const npc = this.npcs.find(n =>
      n?.mesh &&
      this.player.mesh.position.distanceTo(n.mesh.position) < 5
    );

    if (npc) {
      this.dlg = npc;

      this.setText('dialogue-speaker', npc.name || 'Unknown');
      this.setText('dialogue-role', npc.role || '');

      this.setText(
        'dialogue-text',
        Array.isArray(npc.dialogue)
          ? npc.dialogue.join(' ')
          : npc.dialogue || ''
      );

      const box = document.getElementById('dialogue-box');

      if (box) {
        box.classList.remove('hidden');
      }

      return;
    }

    // Board ship
    if (
      this.ship?.canBoard &&
      this.ship.canBoard(this.player.mesh.position)
    ) {
      this.isSailing = true;
      this.ship.isControlled = true;
    }
  }

  updateUI() {
    const player = this.player;

    if (!player) return;

    this.setWidth('hp-bar', player.hp);
    this.setWidth('stamina-bar', player.stamina);

    this.setText(
      'hp-text',
      `${Math.ceil(player.hp)} / ${player.maxHp}`
    );

    this.setText(
      'stamina-text',
      `${Math.ceil(player.stamina)} / ${player.maxStamina}`
    );

    this.setText(
      'berries-text',
      `B ${player.berries}`
    );

    this.setHeight(
      'cd-c',
      (player.cdDodge / 1.15) * 100
    );

    this.setHeight(
      'cd-q',
      (player.cdPistol / 2.5) * 100
    );

    this.setHeight(
      'cd-e',
      (player.cdGatling / 5) * 100
    );
  }

  animate() {
    if (!this.running) return;

    requestAnimationFrame(() => this.animate());

    try {
      const dt = Math.min(this.clock.getDelta(), 0.05);

      this.world.update(dt);

      this.ship.update(
        dt,
        this.keys,
        this.world
      );

      this.player.update(
        dt,
        this.keys,
        this.world,
        this.isSailing,
        this.ship
      );

      if (!this.isSailing && !this.dlg) {
        this.enemies.forEach(enemy => {
          if (enemy && enemy.update) {
            enemy.update(dt, this.player);
          }
        });
      }

      if (this.qm?.update) {
        this.qm.update(
          this.player.mesh.position,
          this.isSailing
        );
      }

      this.updateUI();

      this.renderer.render(
        this.scene,
        this.camera
      );

    } catch (error) {
      this.showError('Game crashed during gameplay', error);
    }
  }
}

// Start after the HTML has loaded
function startGame() {
  if (window.onePieceGame) return;

  window.onePieceGame = new OnePieceGame();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startGame, {
    once: true
  });
} else {
  startGame();
}
