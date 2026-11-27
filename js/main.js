
import * as THREE from 'three';
import { World } from './world.js';
import { PlayerController } from './player.js';
import { PirateShip } from './ship.js';
import { spawnWorldEntities, Enemy } from './entities.js';
import { QuestManager } from './quests.js';

class OnePieceGame {
  constructor() {
    this.keys = {};
    this.isSailing = false;
    this.dlg = null;
    this.running = false;
    this.lastError = null;
    this.rewardedEnemies = new Set();

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

      this.renderer.outputColorSpace = THREE.SRGBColorSpace;
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
      this.renderer.toneMappingExposure = 1.12;
      this.renderer.info.autoReset = true;

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
      // The title card is an arrival moment, not a permanent gameplay overlay.
      window.setTimeout(() => {
        document.getElementById('world-brand')?.classList.add('intro-dismissed');
        document.getElementById('bottom-compass')?.classList.add('intro-dismissed');
      }, 5000);
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
      if (!this.isSailing && event.code === 'KeyV') {
        const mode=this.player.cycleMovementMode();
        this.showBanner(`Movement: ${mode.toUpperCase()}`);
      }
      if (!this.isSailing && ['KeyZ','KeyX','KeyB'].includes(event.code)) {
        const mode = event.code === 'KeyZ' ? 'walk' : event.code === 'KeyX' ? 'jog' : 'sprint';
        this.player.movementMode = mode;
        this.showBanner(`Movement: ${mode.toUpperCase()}`);
      }

      if (event.code === 'F6') this.saveGame();
      if (event.code === 'F9') this.loadGame();

      if (!this.isSailing && event.code === 'KeyC') {
        this.player.dodge(this.keys);
      }

      if (!this.isSailing && event.code === 'KeyQ') {
        const wallHit=this.player.useGomuPistol(this.enemies,this.world); if(wallHit?.destroyed)this.showBanner('WALL BREACHED!');
      }

      if (!this.isSailing && event.code === 'KeyE') {
        const wallHit=this.player.useGomuGatling(this.enemies,this.world); if(wallHit?.destroyed)this.showBanner('WALL BREACHED!');
      }
      if (!this.isSailing && event.code === 'KeyT') {
        if(this.player.useGashingImpact(this.enemies,this.world)){this.showBanner(this.player.lastWallDamage?.destroyed?'WALL BREACHED!':'GASHING IMPACT!');}
      }

      if (!this.isSailing && event.code === 'KeyR') {
        const now = Date.now();
        if (this.qm.crew.length > 1 && now - this.lastCrewAssist > 4200) {
          const target = this.enemies
            .filter(enemy => enemy && !enemy.dead)
            .map(enemy => ({ enemy, distance: this.player.mesh.position.distanceTo(enemy.mesh.position) }))
            .filter(item => item.distance < 20)
            .sort((a,b) => a.distance - b.distance)[0]?.enemy;
          if (target) {
            const damage = this.qm.crew.includes('Zoro') ? 48 : 34;
            target.takeDamage(damage, new THREE.Vector3(0,0.15,1));
            this.lastCrewAssist = now;
            this.showBanner(`${this.qm.crew.slice(1).join(' & ')} crew assist!`);
          } else {
            this.showBanner('No enemy close enough for a crew assist.');
          }
        } else if (this.qm.crew.length <= 1) {
          this.showBanner('Recruit a crewmate before calling a crew assist.');
        }
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

  saveGame() {
    try {
      const data = {
        version: 2,
        player: { position: this.player.mesh.position.toArray(), rotation: this.player.mesh.rotation.y, hp: this.player.hp, maxHp: this.player.maxHp, stamina: this.player.stamina, maxStamina: this.player.maxStamina, berries: this.player.berries, level: this.player.level, xp: this.player.xp, xpToNext: this.player.xpToNext },
        quest: { step: this.qm.step, crates: this.qm.crates, crew: this.qm.crew, spawnedBandits: this.qm.spawnedBandits, spawnedKrieg: this.qm.spawnedKrieg, spawnedBuggy: this.qm.spawnedBuggy, bounty: this.qm.bounty },
        openedCaches: this.world.treasureCaches.filter(c => c.userData.opened).map(c => c.userData.name),
        collectedCrates: this.world.supplyCrates.filter(c => c.userData.collected).map(c => c.userData.id),
        enemies: this.enemies.map(e => ({ id: e.id, name: e.name, modelType: e.modelType || 'pirate', hp: e.hp, maxHp: e.maxHp, damage: e.damage, speed: e.speed, reward: e.reward, xpReward: e.xpReward, isBoss: !!e.isBoss, position: e.mesh.position.toArray(), dead: !!e.dead })),
        sailing: this.isSailing,
        ship: { position: this.ship.mesh.position.toArray(), rotation: this.ship.mesh.rotation.y },
        timestamp: Date.now()
      };
      localStorage.setItem('onePieceDawnSaveV2', JSON.stringify(data));
      this.showBanner('Adventure saved!');
    } catch (error) {
      console.warn('Save failed', error);
      this.showBanner('Could not save in this browser.');
    }
  }

  loadGame() {
    try {
      const raw = localStorage.getItem('onePieceDawnSaveV2');
      if (!raw) { this.showBanner('No saved adventure found.'); return; }
      const data = JSON.parse(raw);
      if (data.version !== 2 || !data.player || !Array.isArray(data.player.position)) throw new Error('Unsupported save');
      const p = data.player;
      this.player.mesh.position.fromArray(p.position);
      this.player.mesh.rotation.y = p.rotation || 0;
      for (const key of ['hp','maxHp','stamina','maxStamina','berries','level','xp','xpToNext']) if (Number.isFinite(p[key])) this.player[key] = p[key];
      this.player.lastSafePosition.copy(this.player.mesh.position);
      this.player.velocity.set(0, 0, 0);
      if (data.ship?.position) this.ship.mesh.position.fromArray(data.ship.position);
      if (Number.isFinite(data.ship?.rotation)) this.ship.mesh.rotation.y = data.ship.rotation;
      this.isSailing = !!data.sailing;
      this.ship.isControlled = this.isSailing;
      this.qm.step = Math.max(0, Math.min(this.qm.quests.length - 1, data.quest?.step || 0));
      this.qm.crates = data.quest?.crates || 0;
      this.qm.crew = Array.isArray(data.quest?.crew) ? data.quest.crew : ['Luffy'];
      this.qm.spawnedBandits = !!data.quest?.spawnedBandits;
      this.qm.spawnedKrieg = !!data.quest?.spawnedKrieg;
      this.qm.spawnedBuggy = !!data.quest?.spawnedBuggy;
      if (Number.isFinite(data.quest?.bounty)) this.qm.bounty = data.quest.bounty;
      (data.openedCaches || []).forEach(name => { const c = this.world.treasureCaches.find(x => x.userData.name === name); if (c) { c.userData.opened = true; c.userData.lidPivot.rotation.x = -Math.PI / 1.9; } });
      (data.collectedCrates || []).forEach(id => { const c = this.world.supplyCrates.find(x => x.userData.id === id); if (c) { c.userData.collected = true; c.visible = false; } });
      (data.enemies || []).forEach(saved => {
        let e = this.enemies.find(x => x.id === saved.id);
        if (!e) {
          e = new Enemy(this.scene, { ...saved, position: new THREE.Vector3(...saved.position) });
          this.enemies.push(e);
        }
        if (Array.isArray(saved.position)) e.mesh.position.fromArray(saved.position);
        if (Number.isFinite(saved.hp)) e.hp = saved.hp;
        if (Number.isFinite(saved.maxHp)) e.maxHp = saved.maxHp;
        if (saved.dead) { e.dead = true; this.scene.remove(e.mesh); }
      });
      this.npcs.forEach(n => { n.recruited = this.qm.crew.includes(n.name === 'Roronoa Zoro' ? 'Zoro' : n.name === 'Sanji' ? 'Sanji' : '__none'); });
      this.qm.updateUI();
      this.showBanner('Saved adventure loaded!');
    } catch (error) {
      console.warn('Load failed', error);
      this.showBanner('Save could not be loaded.');
    }
  }

  drawMinimap() {
    const canvas=document.getElementById('minimap-canvas');
    if(!canvas||!this.player)return;
    const ctx=canvas.getContext('2d');if(!ctx)return;
    const w=canvas.width,h=canvas.height,cx=w/2,cy=h/2,range=245,pad=7;
    const pos=this.player.mesh.position,island=this.world.getIslandAt?.(pos);
    const label=document.getElementById('island-label');
    if(label)label.textContent=island?.name||(this.isSailing?'OPEN SEA':'EAST BLUE');
    ctx.clearRect(0,0,w,h);
    // Deep-water chart base with subtle bathymetric shading.
    const ocean=ctx.createLinearGradient(0,0,w,h);
    ocean.addColorStop(0,'#174f64');ocean.addColorStop(.48,'#0b3d55');ocean.addColorStop(1,'#082d43');
    ctx.fillStyle=ocean;ctx.fillRect(0,0,w,h);
    ctx.save();
    const rr=10;ctx.beginPath();ctx.moveTo(rr,0);ctx.lineTo(w-rr,0);ctx.quadraticCurveTo(w,0,w,rr);ctx.lineTo(w,h-rr);ctx.quadraticCurveTo(w,h,w-rr,h);ctx.lineTo(rr,h);ctx.quadraticCurveTo(0,h,0,h-rr);ctx.lineTo(0,rr);ctx.quadraticCurveTo(0,0,rr,0);ctx.closePath();ctx.clip();
    // Rotating navigation chart: player heading remains pointed toward the top edge.
    const yaw=this.player.mesh.rotation.y;
    const map=(x,z)=>{const dx=x-pos.x,dz=z-pos.z;const rx=dx*Math.cos(yaw)-dz*Math.sin(yaw);const rz=dx*Math.sin(yaw)+dz*Math.cos(yaw);return{x:cx+rx/range*(w-2*pad),y:cy-rz/range*(h-2*pad)};};
    // Range rings and cartographic grid.
    for(let r=34;r<Math.max(w,h);r+=34){ctx.strokeStyle='rgba(159,207,206,.095)';ctx.lineWidth=.65;ctx.beginPath();ctx.ellipse(cx,cy,r,r*.72,0,0,Math.PI*2);ctx.stroke();}
    ctx.strokeStyle='rgba(202,224,213,.085)';ctx.lineWidth=.65;
    for(let x=-w;x<w*2;x+=24){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,h);ctx.stroke();}
    for(let y=-h;y<h*2;y+=24){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w,y);ctx.stroke();}
    // Island coastlines, interior elevation contours and shallow-water halo.
    (this.world.islands||[]).forEach(item=>{
      const points=item.polygon?.length?item.polygon:null;
      const c=map(item.center.x,item.center.z),r=Math.max(3,item.radius/range*(w-2*pad));
      ctx.beginPath();
      if(points){points.forEach(([x,z],idx)=>{const q=map(x,z);idx?ctx.lineTo(q.x,q.y):ctx.moveTo(q.x,q.y);});ctx.closePath();}
      else ctx.ellipse(c.x,c.y,r,r*.78,0,0,Math.PI*2);
      ctx.fillStyle='#6f8064';ctx.shadowColor='rgba(4,18,22,.55)';ctx.shadowBlur=5;ctx.fill();ctx.shadowBlur=0;
      ctx.strokeStyle='rgba(228,205,151,.92)';ctx.lineWidth=2.2;ctx.stroke();
      ctx.strokeStyle='rgba(38,66,49,.62)';ctx.lineWidth=.9;ctx.beginPath();ctx.ellipse(c.x,c.y,r*.68,r*.51,0,0,Math.PI*2);ctx.stroke();
      ctx.strokeStyle='rgba(226,211,166,.23)';ctx.lineWidth=.65;ctx.beginPath();ctx.ellipse(c.x,c.y,r*.83,r*.64,0,0,Math.PI*2);ctx.stroke();
    });
    const dot=(x,z,color,r=2.4,outline='rgba(5,22,31,.85)')=>{const q=map(x,z);if(q.x<pad||q.x>w-pad||q.y<pad||q.y>h-pad)return;ctx.fillStyle=color;ctx.strokeStyle=outline;ctx.lineWidth=1;ctx.beginPath();ctx.arc(q.x,q.y,r,0,Math.PI*2);ctx.fill();ctx.stroke();};
    this.world.treasureCaches?.filter(c=>!c.userData.opened).forEach(c=>dot(c.position.x,c.position.z,'#f5ca68',3));
    this.npcs.filter(n=>!n.recruited).forEach(n=>dot(n.mesh.position.x,n.mesh.position.z,n.ambient?'#80d5c2':'#70c9ef',n.ambient?1.8:2.7));
    this.enemies.filter(e=>!e.dead).forEach(e=>dot(e.mesh.position.x,e.mesh.position.z,'#ef625e',2.9));
    const quest=this.qm.quests[this.qm.step];if(quest){const q=map(quest.waypoint.x,quest.waypoint.z);ctx.strokeStyle='#fff0bd';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(q.x,q.y,5,0,Math.PI*2);ctx.stroke();ctx.fillStyle='#fff0bd';ctx.beginPath();ctx.arc(q.x,q.y,1.7,0,Math.PI*2);ctx.fill();}
    // Player heading marker with soft halo.
    ctx.save();ctx.translate(cx,cy);ctx.fillStyle='rgba(255,238,188,.24)';ctx.beginPath();ctx.arc(0,0,9,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#fff6d9';ctx.strokeStyle='#173744';ctx.lineWidth=1.7;ctx.beginPath();ctx.moveTo(0,-9);ctx.lineTo(6,6);ctx.lineTo(0,3);ctx.lineTo(-6,6);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();
    // Compass heading and map edge.
    ctx.fillStyle='rgba(255,239,201,.9)';ctx.font='800 8px Inter, sans-serif';ctx.textAlign='center';ctx.fillText('N',w-13,13);
    ctx.restore();
    ctx.strokeStyle='rgba(229,209,169,.62)';ctx.lineWidth=1;ctx.strokeRect(.5,.5,w-1,h-1);
  }

  showBanner(message) {
    const banner = document.getElementById('banner-alert');
    if (!banner) return;
    banner.textContent = message;
    banner.classList.remove('hidden');
    window.clearTimeout(this.bannerTimer);
    this.bannerTimer = window.setTimeout(() => banner.classList.add('hidden'), 2600);
  }

  updateInteractionPrompt() {
    const prompt = document.getElementById('interact-prompt');
    if (!prompt || !this.player || this.isSailing || this.dlg) {
      prompt?.classList.add('hidden');
      return;
    }

    const position = this.player.mesh.position;
    const cache = this.world.getNearbyTreasure?.(position);
    const npc = this.npcs.find(n => n?.mesh && position.distanceTo(n.mesh.position) < 5);
    const canBoard = this.ship?.canBoard?.(position);
    let message = '';
    if (cache) message = `Press [F] to open ${cache.userData.name}`;
    else if (npc) message = `Press [F] to talk to ${npc.name}`;
    else if (canBoard) message = 'Press [F] to board your ship';

    if (message) {
      prompt.textContent = message;
      prompt.classList.remove('hidden');
    } else {
      prompt.classList.add('hidden');
    }
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

    // Nearby doors are interactive; F toggles the closest door.
    const doorState=this.world.toggleNearbyDoor?.(this.player.mesh.position);
    if(doorState!==null&&doorState!==undefined){this.showBanner(doorState?'Door opened':'Door closed');return;}

    // Open a nearby treasure cache before talking to NPCs.
    const cache = this.world.getNearbyTreasure?.(this.player.mesh.position);
    if (cache) {
      cache.userData.opened = true;
      cache.userData.lidPivot.rotation.x = -Math.PI / 1.9;
      this.player.berries += cache.userData.reward;
      this.showBanner(`${cache.userData.name} opened! +${cache.userData.reward} Berries`);
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

    this.setWidth('hp-bar', (player.hp / player.maxHp) * 100);
    this.setWidth('stamina-bar', (player.stamina / player.maxStamina) * 100);

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
      `B ${Math.floor(player.berries).toLocaleString()}`
    );
    this.setText('level-text', `LV ${player.level} · ${player.xp} / ${player.xpToNext} XP`);
    this.setText('bounty-text', `B ${this.qm?.bounty?.toLocaleString?.() || '300,000'}`);
    this.setWidth('xp-bar', (player.xp / player.xpToNext) * 100);

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
    this.setHeight('cd-t',(player.cdGashing / 8.5) * 100);
  }

  animate() {
    if (!this.running) return;

    requestAnimationFrame(() => this.animate());

    try {
      const dt = Math.min(this.clock.getDelta(), 0.05);

      this.world.update(dt,this.camera);

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
      if(!this.isSailing) this.world.resolvePlayerCollision?.(this.player.mesh.position);

      // Nearby residents run their daily routines; distant island populations are culled.
      const followers = this.npcs.filter(n => n.recruited);
      const playerPosition=this.player.mesh.position;
      this.npcs.forEach(npc=>{
        if(!npc?.mesh)return;
        const nearby=playerPosition.distanceToSquared(npc.mesh.position)<260*260||npc.recruited;
        npc.mesh.visible=nearby;
        if(nearby)npc.update?.(dt,playerPosition,followers.indexOf(npc),this.world);
      });

      if (!this.isSailing && !this.dlg) {
        this.enemies.forEach(enemy => {
          if(!enemy?.mesh)return;
          const nearby=playerPosition.distanceToSquared(enemy.mesh.position)<320*320;
          enemy.mesh.visible=nearby&&!enemy.dead;
          if (nearby&&enemy.update) enemy.update(dt, this.player, this.world);
          if (enemy?.dead && !this.rewardedEnemies.has(enemy.id)) {
            this.rewardedEnemies.add(enemy.id);
            const reward = enemy.reward ?? (enemy.isBoss ? 1000 : 100);
            this.player.berries += reward;
            if (enemy.modelType === 'marine' || String(enemy.id).includes('marine')) {
              this.qm.bounty += 50000;
              this.showBanner(`Marine defeated! Wanted bounty increased to B ${this.qm.bounty.toLocaleString()}.`);
            }
            const levels = this.player.gainXP(enemy.xpReward ?? 55);
            this.showBanner(`${enemy.name || 'Enemy'} defeated! +${reward} Berries · +${enemy.xpReward ?? 55} XP${levels ? ` · Level ${this.player.level}!` : ''}`);
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
      this.updateInteractionPrompt();
      this.drawMinimap();

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
