
import * as THREE from 'three';
import { createCharacterMesh } from './models.js';

export class PlayerController {
  constructor(scene, camera) {
    if (!scene || !camera) {
      throw new Error('PlayerController requires a scene and camera');
    }

    this.scene = scene;
    this.camera = camera;

    // Character
    this.mesh = createCharacterMesh('luffy');

    if (!this.mesh) {
      throw new Error('Failed to create Luffy character model');
    }

    this.mesh.position.set(0, 2.3, 18);
    this.scene.add(this.mesh);

    // Health
    this.hp = 100;
    this.maxHp = 100;

    // Stamina
    this.stamina = 100;
    this.maxStamina = 100;
    this.staminaRegenDelay = 0;

    // Currency
    this.berries = 500;
    this.level = 1;
    this.xp = 0;
    this.xpToNext = 250;

    // Physics
    this.velocity = new THREE.Vector3();
    this.isGrounded = true;
    this.gravity = 45;
    this.jumpForce = 18;
    this.jumpWasDown = false;

    // Movement
    this.walkSpeed = 4.8;
    this.jogSpeed = 10.2;
    this.sprintSpeed = 17.0;
    this.movementMode = 'jog';
    this.backwardSpeed = 0.72;
    this.turnSpeed = 3.4;

    // Safe ground position
    this.lastSafePosition = new THREE.Vector3(0, 2.3, 18);

    // Camera
    this.camYaw = Math.PI;
    this.camPitch = 0.32;
    this.cameraDistance = 11;
    this.cameraSmoothness = 10;

    // Combat
    this.attackTimer = 0;
    this.cdPistol = 0;
    this.cdGatling = 0;
    this.cdGashing = 0;
    this.gashingTimer = 0;
    this.gashingAnimTimer = 0;
    this.createCombatEffects();
    this.pistolFxTimer=0; this.gatlingFxTimer=0;

    // Dodge
    this.dodgeTimer = 0;
    this.dodgeDuration = 0.42;
    this.cdDodge = 0;
    this.dodgeDirection = new THREE.Vector3();

    // Animation
    this.animationTime = 0;
    this.animationSpeed = 0;
    this.animationState = 'idle';

    this.pistolAnimTimer = 0;
    this.pistolAnimDuration = 0.42;

    this.gatlingAnimTimer = 0;
    this.gatlingAnimDuration = 0.75;

    // Reusable vectors
    this.forward = new THREE.Vector3();
    this.right = new THREE.Vector3();
    this.cameraTarget = new THREE.Vector3();
    this.cameraPosition = new THREE.Vector3();
    this.shipOffset = new THREE.Vector3(0, 2.25, -2.5);
  }

  createCombatEffects() {
    const makeMat=(color,opacity)=>new THREE.MeshBasicMaterial({color,transparent:true,opacity,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide});
    this.pistolEffect=new THREE.Group();
    const pistolArc=new THREE.Mesh(new THREE.TorusGeometry(1.1,.09,7,36,Math.PI*1.35),makeMat(0xffe7a2,.86));
    pistolArc.position.set(0,1.15,3.2);this.pistolEffect.add(pistolArc);
    const pistolCore=new THREE.Mesh(new THREE.CylinderGeometry(.09,.38,3.6,12,1,true),makeMat(0xffbd73,.36));
    pistolCore.rotation.x=Math.PI/2;pistolCore.position.set(0,1.12,3.6);this.pistolEffect.add(pistolCore);
    this.pistolEffect.visible=false;this.scene.add(this.pistolEffect);

    this.gatlingEffect=new THREE.Group();
    for(let i=0;i<5;i++){
      const streak=new THREE.Mesh(new THREE.TorusGeometry(1.05+i*.13,.045,5,28,Math.PI*1.2),makeMat(i%2?0xffd18b:0xf8f2d5,.72));
      streak.rotation.z=(i-2)*.19;streak.position.set((i-2)*.28,1.18,2.6+i*.24);this.gatlingEffect.add(streak);
    }
    this.gatlingEffect.visible=false;this.scene.add(this.gatlingEffect);

    this.gashingEffect=new THREE.Group();
    const impactColors=[0xffe6b0,0xffa65e,0xe95c43];
    for(let i=0;i<3;i++){
      const ring=new THREE.Mesh(new THREE.TorusGeometry(2.5+i*.72,.11-i*.018,7,42),makeMat(impactColors[i],.86-i*.12));
      ring.rotation.x=Math.PI/2;ring.position.set(0,.25+i*.2,4.7+i*.28);this.gashingEffect.add(ring);
    }
    const core=new THREE.Mesh(new THREE.ConeGeometry(1.45,5.6,9,1,true),makeMat(0xffd49a,.27));
    core.rotation.x=Math.PI/2;core.position.set(0,1.15,5.6);this.gashingEffect.add(core);
    for(let i=0;i<9;i++){
      const shard=new THREE.Mesh(new THREE.ConeGeometry(.11,.85,5),makeMat(i%2?0xffdca0:0xff764f,.82));
      const a=i/9*Math.PI*2;shard.position.set(Math.cos(a)*1.8,1.05+Math.sin(a)*.55,4.6+Math.sin(a)*.8);shard.rotation.z=Math.cos(a)*.8;shard.rotation.x=Math.sin(a)*.7;this.gashingEffect.add(shard);
    }
    this.gashingEffect.visible=false;this.scene.add(this.gashingEffect);
    this.combatEffects=[
      {mesh:this.pistolEffect,key:'pistolFxTimer',duration:.28},
      {mesh:this.gatlingEffect,key:'gatlingFxTimer',duration:.78},
      {mesh:this.gashingEffect,key:'gashingTimer',duration:.52}
    ];
  }

  triggerCombatEffect(mesh,key,duration) {
    this[key]=duration;mesh.visible=true;mesh.position.copy(this.mesh.position);mesh.rotation.y=this.mesh.rotation.y;mesh.scale.setScalar(.72);
    mesh.traverse(o=>{if(o.material){o.material.opacity=o.userData.baseOpacity??o.material.opacity;o.userData.baseOpacity=o.material.opacity;}});
  }

  getForward() {
    return this.forward.set(
      Math.sin(this.mesh.rotation.y),
      0,
      Math.cos(this.mesh.rotation.y)
    ).normalize();
  }

  gainXP(amount) {
    if (!Number.isFinite(amount) || amount <= 0) return 0;
    this.xp += amount;
    let levels = 0;
    while (this.xp >= this.xpToNext) {
      this.xp -= this.xpToNext;
      this.level += 1;
      levels += 1;
      this.xpToNext = Math.round(this.xpToNext * 1.32);
      this.maxHp += 8;
      this.maxStamina += 5;
      this.hp = this.maxHp;
      this.stamina = this.maxStamina;
    }
    return levels;
  }

  healFull() {
    this.hp = this.maxHp;
    this.stamina = this.maxStamina;
    this.velocity.set(0, 0, 0);
    this.staminaRegenDelay = 0;
  }

  takeDamage(amount) {
    if (
      !Number.isFinite(amount) ||
      amount <= 0 ||
      this.dodgeTimer > 0 ||
      this.hp <= 0
    ) {
      return;
    }

    this.hp = THREE.MathUtils.clamp(
      this.hp - amount,
      0,
      this.maxHp
    );

    if (this.hp <= 0) {
      this.respawn();
    }
  }

  respawn() {
    this.healFull();

    this.mesh.position.set(0, 2.3, 18);
    this.mesh.rotation.y = Math.PI;

    this.lastSafePosition.set(0, 2.3, 18);

    this.isGrounded = true;
    this.dodgeTimer = 0;
    this.attackTimer = 0;

    this.cdPistol = 0;
    this.cdGatling = 0;
    this.cdGashing = 0;
    this.gashingTimer = 0;
    this.gashingAnimTimer = 0;
    this.combatEffects?.forEach(effect=>{effect.mesh.visible=false;});
    this.pistolFxTimer=0;this.gatlingFxTimer=0;
    this.cdDodge = 0;

    this.pistolAnimTimer = 0;
    this.gatlingAnimTimer = 0;

    this.animationState = 'idle';
    this.animationSpeed = 0;
  }

  canHitEnemy(enemy, range, minDot = -0.1) {
    if (
      !enemy ||
      enemy.dead ||
      !enemy.mesh ||
      !enemy.mesh.position
    ) {
      return false;
    }

    const offset = new THREE.Vector3().subVectors(
      enemy.mesh.position,
      this.mesh.position
    );

    const distance = offset.length();

    if (distance > range || distance < 0.001) {
      return false;
    }

    offset.y = 0;

    if (offset.lengthSq() < 0.001) {
      return true;
    }

    offset.normalize();

    return this.getForward().dot(offset) >= minDot;
  }

  performMeleeCombo(enemies = []) {
    if (
      this.attackTimer > 0 ||
      this.dodgeTimer > 0 ||
      this.pistolAnimTimer > 0 ||
      this.gatlingAnimTimer > 0
    ) {
      return;
    }

    this.attackTimer = 0.28;

    const forward = this.getForward().clone();

    enemies.forEach(enemy => {
      if (this.canHitEnemy(enemy, 4, 0.15)) {
        enemy.takeDamage(22 + (this.level - 1) * 2, forward);
      }
    });
  }

  dodge(keys = {}) {
    if (
      this.cdDodge > 0 ||
      this.stamina < 22 ||
      this.dodgeTimer > 0
    ) {
      return;
    }

    const forward = this.getForward().clone();

    const right = new THREE.Vector3(
      forward.z,
      0,
      -forward.x
    );

    const direction = new THREE.Vector3();

    if (keys['KeyW'] || keys['ArrowUp']) {
      direction.add(forward);
    }

    if (keys['KeyS'] || keys['ArrowDown']) {
      direction.addScaledVector(forward, -1);
    }

    if (keys['KeyA'] || keys['ArrowLeft']) {
      direction.add(right);
    }

    if (keys['KeyD'] || keys['ArrowRight']) {
      direction.addScaledVector(right, -1);
    }

    if (direction.lengthSq() === 0) {
      direction.copy(forward).negate();
    }

    this.dodgeDirection.copy(direction.normalize());

    this.dodgeTimer = this.dodgeDuration;
    this.cdDodge = 1.15;

    this.stamina = Math.max(0, this.stamina - 22);
    this.staminaRegenDelay = 0.8;
  }

  useGomuPistol(enemies = [], world = null) {
    if (
      this.cdPistol > 0 ||
      this.stamina < 20 ||
      this.dodgeTimer > 0 ||
      this.gatlingAnimTimer > 0
    ) {
      return;
    }

    this.stamina -= 20;
    this.staminaRegenDelay = 0.8;

    this.cdPistol = 2.5;
    this.pistolAnimTimer = this.pistolAnimDuration;
    this.gatlingAnimTimer = 0;
    this.triggerCombatEffect(this.pistolEffect,'pistolFxTimer',.28);

    const forward = this.getForward().clone();

    enemies.forEach(enemy => {
      if (this.canHitEnemy(enemy, 18, 0.25)) {
        enemy.takeDamage(45 + (this.level - 1) * 3, forward);
      }
    });
    return world?.damageNearbyWall?.(this.mesh.position,forward,55)||null;
  }

  useGomuGatling(enemies = [], world = null) {
    if (
      this.cdGatling > 0 ||
      this.stamina < 35 ||
      this.dodgeTimer > 0 ||
      this.pistolAnimTimer > 0
    ) {
      return;
    }

    this.stamina -= 35;
    this.staminaRegenDelay = 0.8;

    this.cdGatling = 5;
    this.gatlingAnimTimer = this.gatlingAnimDuration;
    this.pistolAnimTimer = 0;
    this.triggerCombatEffect(this.gatlingEffect,'gatlingFxTimer',.78);

    const forward = this.getForward().clone();

    enemies.forEach(enemy => {
      if (this.canHitEnemy(enemy, 14, 0.1)) {
        enemy.takeDamage(70 + (this.level - 1) * 4, forward);
      }
    });
    return world?.damageNearbyWall?.(this.mesh.position,forward,90)||null;
  }

  useGashingImpact(enemies = [], world = null) {
    if(this.cdGashing>0 || this.stamina<42 || this.dodgeTimer>0 || this.pistolAnimTimer>0 || this.gatlingAnimTimer>0) return false;
    this.stamina-=42; this.staminaRegenDelay=.9; this.cdGashing=8.5; this.gashingTimer=.52; this.gashingAnimTimer=.52;
    const forward=this.getForward().clone();
    enemies.forEach(enemy=>{if(this.canHitEnemy(enemy,20,.48)) enemy.takeDamage(105+(this.level-1)*5,forward.clone().multiplyScalar(1.25));});
    this.lastWallDamage=world?.damageNearbyWall?.(this.mesh.position,forward,190)||null;
    this.triggerCombatEffect(this.gashingEffect,'gashingTimer',.52);
    return true;
  }

  updateCooldowns(dt) {
    this.cdPistol = Math.max(0, this.cdPistol - dt);
    this.cdGatling = Math.max(0, this.cdGatling - dt);
    this.cdGashing = Math.max(0, this.cdGashing - dt);
    this.gashingAnimTimer = Math.max(0,this.gashingAnimTimer-dt);
    for(const effect of this.combatEffects||[]){
      const key=effect.key;this[key]=Math.max(0,(this[key]||0)-dt);
      const remaining=this[key];
      if(remaining<=0){effect.mesh.visible=false;continue;}
      effect.mesh.position.copy(this.mesh.position);effect.mesh.rotation.y=this.mesh.rotation.y;
      const t=1-remaining/effect.duration;effect.mesh.scale.setScalar(.72+t*1.18);
      effect.mesh.children.forEach((child,i)=>{if(child.material){const base=child.userData.baseOpacity??child.material.opacity;child.material.opacity=base*(1-t)*(.8+.2*Math.sin(t*Math.PI));}});
    }
    this.cdDodge = Math.max(0, this.cdDodge - dt);

    this.dodgeTimer = Math.max(0, this.dodgeTimer - dt);
    this.attackTimer = Math.max(0, this.attackTimer - dt);

    this.pistolAnimTimer = Math.max(
      0,
      this.pistolAnimTimer - dt
    );

    this.gatlingAnimTimer = Math.max(
      0,
      this.gatlingAnimTimer - dt
    );
  }

  cycleMovementMode() {
    const modes = ['walk', 'jog', 'sprint'];
    this.movementMode = modes[(modes.indexOf(this.movementMode) + 1) % modes.length];
    return this.movementMode;
  }

  updateStamina(dt, sprinting) {
    if (sprinting && this.stamina > 0) {
      this.stamina = Math.max(
        0,
        this.stamina - 24 * dt
      );

      this.staminaRegenDelay = 0.8;
      return;
    }

    this.staminaRegenDelay = Math.max(
      0,
      this.staminaRegenDelay - dt
    );

    if (this.staminaRegenDelay <= 0) {
      this.stamina = Math.min(
        this.maxStamina,
        this.stamina + 18 * dt
      );
    }
  }

  updateGround(world) {
    if (!world || typeof world.getIslandAt !== 'function') {
      return;
    }

    const island = world.getIslandAt(this.mesh.position);

    // Let the player leave the shoreline naturally. If they fall into the
    // ocean, recover at the last safe shoreline instead of snapping sideways.
    if (!island) {
      this.isGrounded = false;
      if (this.mesh.position.y < -12) {
        this.mesh.position.copy(this.lastSafePosition);
        this.velocity.set(0, 0, 0);
        this.isGrounded = true;
      }
      return;
    }

    const floorY = island.groundY;

    if (this.mesh.position.y <= floorY) {
      this.mesh.position.y = floorY;
      this.velocity.y = 0;
      this.isGrounded = true;

      this.lastSafePosition.set(
        this.mesh.position.x,
        floorY,
        this.mesh.position.z
      );
    } else {
      this.isGrounded = false;
    }
  }

  update(dt, keys = {}, world, isSailing = false, ship) {
    dt = THREE.MathUtils.clamp(dt || 0, 0, 0.05);

    this.animationTime += dt;
    this.updateCooldowns(dt);

    // Sailing
    if (isSailing) {
      if (!ship || !ship.mesh) {
        return;
      }

      this.mesh.position
        .copy(ship.mesh.position)
        .add(this.shipOffset);

      this.mesh.rotation.y = ship.mesh.rotation.y;

      const targetYaw = ship.mesh.rotation.y + Math.PI;

      const yawDifference = Math.atan2(
        Math.sin(targetYaw - this.camYaw),
        Math.cos(targetYaw - this.camYaw)
      );

      this.camYaw += yawDifference * (
        1 - Math.exp(-7 * dt)
      );

      this.animationState = 'idle';
      this.animationSpeed = 0;

      this.updateAnimation();

      this.updateCamera(
        ship.mesh.position,
        22,
        dt
      );

      return;
    }

    // Jump input only triggers once per key press.
    const jumpDown = !!keys['Space'];
    const jumpPressed = jumpDown && !this.jumpWasDown;

    this.jumpWasDown = jumpDown;

    // Movement input
    const movingForward =
      keys['KeyW'] || keys['ArrowUp'];

    const movingBackward =
      keys['KeyS'] || keys['ArrowDown'];

    const moving = movingForward || movingBackward;

    let sprinting = false;

    // Dodge movement
    if (this.dodgeTimer > 0) {
      this.mesh.position.addScaledVector(
        this.dodgeDirection,
        18 * dt
      );

      this.animationState = 'dodge';
      this.animationSpeed = 0;
    } else {
      // Turning
      if (keys['KeyA'] || keys['ArrowLeft']) {
        this.mesh.rotation.y += this.turnSpeed * dt;
      }

      if (keys['KeyD'] || keys['ArrowRight']) {
        this.mesh.rotation.y -= this.turnSpeed * dt;
      }

      const forward = this.getForward();

      const actionLocked =
        this.attackTimer > 0 ||
        this.pistolAnimTimer > 0 ||
        this.gatlingAnimTimer > 0 ||
        this.gashingAnimTimer > 0;

      let activeMode = this.movementMode;
      if (!actionLocked) {
        const temporarySprint = (keys['ShiftLeft'] || keys['ShiftRight']) && movingForward && this.stamina > 0;
        sprinting = temporarySprint || (this.movementMode === 'sprint' && movingForward && this.stamina > 0);
        activeMode = sprinting ? 'sprint' : (this.movementMode === 'sprint' ? 'jog' : this.movementMode);
        const speed = activeMode === 'walk' ? this.walkSpeed : activeMode === 'sprint' ? this.sprintSpeed : this.jogSpeed;

        if (movingForward) {
          this.mesh.position.addScaledVector(
            forward,
            speed * dt
          );
        }

        if (movingBackward) {
          this.mesh.position.addScaledVector(
            forward,
            -speed * this.backwardSpeed * dt
          );
        }
      }

      if (actionLocked) {
        this.animationSpeed = 0;
        this.animationState = 'idle';
      } else if (moving) {
        this.animationState = activeMode === 'walk' ? 'walk' : 'run';
        this.animationSpeed = activeMode === 'walk' ? 0.38 : activeMode === 'sprint' ? 1.18 : 0.78;
      } else {
        this.animationState = 'idle';
        this.animationSpeed = 0;
      }
    }

    // Stamina
    this.updateStamina(dt, sprinting);

    // Camera rotation follows the player.
    const targetYaw = this.mesh.rotation.y;

    const yawDifference = Math.atan2(
      Math.sin(targetYaw - this.camYaw),
      Math.cos(targetYaw - this.camYaw)
    );

    this.camYaw += yawDifference * (
      1 - Math.exp(-7 * dt)
    );

    // Jump
    if (jumpPressed && this.isGrounded && this.dodgeTimer <= 0) {
      this.velocity.y = this.jumpForce;
      this.isGrounded = false;
    }

    // Gravity
    this.velocity.y -= this.gravity * dt;
    this.mesh.position.y += this.velocity.y * dt;

    // Resolve building collisions inside the controller as well as the
    // main loop, so movement cannot step through compact terminal houses.
    if (!isSailing) world?.resolvePlayerCollision?.(this.mesh.position, 0.72);

    // Ground and island collision
    this.updateGround(world);
    if (!isSailing) world?.resolvePlayerCollision?.(this.mesh.position, 0.72);

    // Animation priorities
    if (this.dodgeTimer > 0) {
      this.animationState = 'dodge';
    } else if (!this.isGrounded) {
      this.animationState = 'jump';
    } else if (this.gatlingAnimTimer > 0) {
      this.animationState = 'gatling';
    } else if (this.pistolAnimTimer > 0) {
      this.animationState = 'pistol';
    } else if (this.gashingAnimTimer > 0) {
      this.animationState = 'gashing';
    }

    this.updateAnimation();

    this.updateCamera(
      this.mesh.position,
      this.cameraDistance,
      dt
    );
  }

  updateAnimation() {
    if (
      !this.mesh ||
      !this.mesh.userData ||
      typeof this.mesh.userData.animate !== 'function'
    ) {
      return;
    }

    let progress = 0;

    if (this.animationState === 'dodge') {
      progress = 1 - (
        this.dodgeTimer / this.dodgeDuration
      );
    } else if (this.animationState === 'pistol') {
      progress = 1 - (
        this.pistolAnimTimer / this.pistolAnimDuration
      );
    } else if (this.animationState === 'gatling') {
      progress = 1 - (
        this.gatlingAnimTimer / this.gatlingAnimDuration
      );
    } else if (this.animationState === 'gashing') {
      progress = 1 - (this.gashingAnimTimer / .52);
    }

    this.mesh.userData.animate(
      this.animationTime,
      this.animationSpeed,
      this.animationState,
      THREE.MathUtils.clamp(progress, 0, 1)
    );
  }

  updateCamera(target, distance, dt = 0.016) {
    if (!target || !this.camera) {
      return;
    }

    const cosPitch = Math.cos(this.camPitch);
    const sinPitch = Math.sin(this.camPitch);

    this.cameraPosition.set(
      target.x -
        Math.sin(this.camYaw) * cosPitch * distance,

      target.y +
        sinPitch * distance + 2.5,

      target.z -
        Math.cos(this.camYaw) * cosPitch * distance
    );

    const smoothing =
      1 - Math.exp(-this.cameraSmoothness * dt);

    this.camera.position.lerp(
      this.cameraPosition,
      smoothing
    );

    this.cameraTarget.set(
      target.x,
      target.y + 2.2,
      target.z
    );

    this.camera.lookAt(this.cameraTarget);
  }
}
