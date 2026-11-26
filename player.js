
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

    // Physics
    this.velocity = new THREE.Vector3();
    this.isGrounded = true;
    this.gravity = 45;
    this.jumpForce = 18;
    this.jumpWasDown = false;

    // Movement
    this.walkSpeed = 14;
    this.sprintSpeed = 24;
    this.backwardSpeed = 0.65;
    this.turnSpeed = 2.8;

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

  getForward() {
    return this.forward.set(
      Math.sin(this.mesh.rotation.y),
      0,
      Math.cos(this.mesh.rotation.y)
    ).normalize();
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
        enemy.takeDamage(22, forward);
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

  useGomuPistol(enemies = []) {
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

    const forward = this.getForward().clone();

    enemies.forEach(enemy => {
      if (this.canHitEnemy(enemy, 18, 0.25)) {
        enemy.takeDamage(45, forward);
      }
    });
  }

  useGomuGatling(enemies = []) {
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

    const forward = this.getForward().clone();

    enemies.forEach(enemy => {
      if (this.canHitEnemy(enemy, 14, 0.1)) {
        enemy.takeDamage(70, forward);
      }
    });
  }

  updateCooldowns(dt) {
    this.cdPistol = Math.max(0, this.cdPistol - dt);
    this.cdGatling = Math.max(0, this.cdGatling - dt);
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

    // Prevent walking or falling off an island into the ocean.
    if (!island) {
      this.mesh.position.x = this.lastSafePosition.x;
      this.mesh.position.z = this.lastSafePosition.z;

      if (this.mesh.position.y < this.lastSafePosition.y) {
        this.mesh.position.y = this.lastSafePosition.y;
        this.velocity.y = 0;
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
        this.gatlingAnimTimer > 0;

      if (!actionLocked) {
        sprinting =
          (keys['ShiftLeft'] || keys['ShiftRight']) &&
          movingForward &&
          this.stamina > 0;

        const speed = sprinting
          ? this.sprintSpeed
          : this.walkSpeed;

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
        this.animationState = sprinting ? 'run' : 'walk';
        this.animationSpeed = sprinting ? 1 : 0.58;
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

    // Ground and island collision
    this.updateGround(world);

    // Animation priorities
    if (this.dodgeTimer > 0) {
      this.animationState = 'dodge';
    } else if (!this.isGrounded) {
      this.animationState = 'jump';
    } else if (this.gatlingAnimTimer > 0) {
      this.animationState = 'gatling';
    } else if (this.pistolAnimTimer > 0) {
      this.animationState = 'pistol';
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
