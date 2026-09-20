import * as THREE from "three";

export default class CollisionSystem {
  constructor({ playerRadius, playerHeight, roomRadius }) {
    this.playerRadius = playerRadius;
    this.playerHeight = playerHeight;
    this.roomRadius = roomRadius;
    this.objects = [];
    this.box = new THREE.Box3();
  }

  add(object) {
    this.objects.push(object);
  }

  resolve(position) {
    this.#keepInsideRoom(position);
    this.objects.forEach((object) => this.#pushOutsideObject(position, object));
  }

  #keepInsideRoom(position) {
    const distance = Math.hypot(position.x, position.z);
    const limit = this.roomRadius - this.playerRadius;

    if (distance <= limit) return;
    position.x = (position.x / distance) * limit;
    position.z = (position.z / distance) * limit;
  }

  #pushOutsideObject(position, object) {
    object.updateMatrixWorld(true);
    this.box.setFromObject(object);

    const playerBottom = position.y - this.playerHeight;
    if (position.y < this.box.min.y || playerBottom > this.box.max.y) return;

    const closestX = THREE.MathUtils.clamp(position.x, this.box.min.x, this.box.max.x);
    const closestZ = THREE.MathUtils.clamp(position.z, this.box.min.z, this.box.max.z);
    const differenceX = position.x - closestX;
    const differenceZ = position.z - closestZ;
    const distanceSquared = differenceX ** 2 + differenceZ ** 2;

    if (distanceSquared > this.playerRadius ** 2) return;

    if (distanceSquared === 0) {
      const distances = [
        { value: Math.abs(position.x - this.box.min.x), axis: "left" },
        { value: Math.abs(this.box.max.x - position.x), axis: "right" },
        { value: Math.abs(position.z - this.box.min.z), axis: "back" },
        { value: Math.abs(this.box.max.z - position.z), axis: "front" },
      ];
      const nearest = distances.sort((a, b) => a.value - b.value)[0].axis;

      if (nearest === "left") position.x = this.box.min.x - this.playerRadius;
      if (nearest === "right") position.x = this.box.max.x + this.playerRadius;
      if (nearest === "back") position.z = this.box.min.z - this.playerRadius;
      if (nearest === "front") position.z = this.box.max.z + this.playerRadius;
      return;
    }

    const distance = Math.sqrt(distanceSquared);
    const pushDistance = this.playerRadius - distance;
    position.x += (differenceX / distance) * pushDistance;
    position.z += (differenceZ / distance) * pushDistance;
  }
}
