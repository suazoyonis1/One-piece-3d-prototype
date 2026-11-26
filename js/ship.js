
import * as THREE from 'three';
import { createGoingMerryMesh } from './models.js';

export class PirateShip {
  constructor(scene) {
    this.mesh = createGoingMerryMesh();
    this.mesh.position.set(0, 0, 74);
    scene.add(this.mesh);

    this.speed = 0;
    this.maxSpeed = 42;
    this.reverseSpeed = 14;
    this.acceleration = 20;
    this.braking = 28;

    this.chartBonus = 0;
    this.isControlled = false;
    this.turnSpeed = 1.15;

    this.waterTime = 0;
    this.baseY = 0;
  }

  canBoard(position) {
    const dx = position.x - this.mesh.position.x;
    const dz = position.z - this.mesh.position.z;

    return Math.sqrt(dx * dx + dz * dz) < 15;
  }

  update(dt, keys = {}, world) {
    dt = Math.min(dt, 0.05);
    this.waterTime += dt;

    if (!this.isControlled) {
      this.speed *= Math.exp(-1.8 * dt);
    } else {
      if (keys['KeyW']) {
        this.speed = Math.min(
          this.maxSpeed + this.chartBonus,
          this.speed + this.acceleration * dt
        );
      } else if (keys['KeyS']) {
        this.speed = Math.max(
          -this.reverseSpeed,
          this.speed - this.braking * dt
        );
      } else {
        this.speed *= Math.exp(-0.65 * dt);
      }

      if (Math.abs(this.speed) > 0.05) {
        const direction = this.speed >= 0 ? 1 : -1;

        if (keys['KeyA']) {
          this.mesh.rotation.y += this.turnSpeed * dt * direction;
        }

        if (keys['KeyD']) {
          this.mesh.rotation.y -= this.turnSpeed * dt * direction;
        }
      }
    }

    const forward = new THREE.Vector3(
      Math.sin(this.mesh.rotation.y),
      0,
      Math.cos(this.mesh.rotation.y)
    );

    this.mesh.position.addScaledVector(forward, this.speed * dt);

    // gentle movement on the water
    this.mesh.position.y =
      this.baseY + Math.sin(this.waterTime * 1.5) * 0.12;

    this.mesh.rotation.z = Math.sin(this.waterTime * 0.9) * 0.018;
    this.mesh.rotation.x = Math.sin(this.waterTime * 1.2) * 0.012;
  }
}
