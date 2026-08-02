import * as THREE from "three";

/*
 * プレイヤーが円形の部屋から出たり、3Dオブジェクトを通り抜けたりするのを防ぐクラスです。
 *
 * Three.jsの見た目を作る処理から計算だけを分離するため、専用クラスにしています。
 * 現在は理解しやすさを優先し、各オブジェクトをBox3という「軸に平行な箱」で囲んで判定します。
 * 斜めの物体では見た目より箱が少し大きくなる点に注意してください。
 */
export default class CollisionSystem {
  constructor({ playerRadius, playerHeight, roomRadius }) {
    // プレイヤーを上から見た円として扱うときの半径です。
    this.playerRadius = playerRadius;

    // カメラ位置を頭の高さと考え、足元のY座標を計算するために使います。
    this.playerHeight = playerHeight;

    // 円形の床から外へ出ないようにするための半径です。
    this.roomRadius = roomRadius;

    // 衝突対象として登録された本、机、ドアを保存します。
    this.objects = [];

    // 毎フレームnew Box3()を作らず、同じ箱を使い回して不要なメモリ生成を減らします。
    this.box = new THREE.Box3();
  }

  add(object) {
    // シーンへ追加したObject3Dを、当たり判定の対象にも登録します。
    this.objects.push(object);
  }

  resolve(position) {
    /*
     * positionはカメラの位置Vector3です。
     * この関数は位置のコピーを返さず、受け取ったVector3を直接安全な位置へ修正します。
     */
    this.#keepInsideRoom(position);
    this.objects.forEach((object) => this.#pushOutsideObject(position, object));
  }

  #keepInsideRoom(position) {
    // 高さYは無視し、床と同じXZ平面上で中心からの距離を測ります。
    const distance = Math.hypot(position.x, position.z);
    const limit = this.roomRadius - this.playerRadius;

    if (distance <= limit) return;

    // 中心から見た方向は保ったまま、円周の内側まで位置を戻します。
    position.x = (position.x / distance) * limit;
    position.z = (position.z / distance) * limit;
  }

  #pushOutsideObject(position, object) {
    // scale・rotation・positionを反映した最新のワールド座標から、物体を囲む箱を計算します。
    object.updateMatrixWorld(true);
    this.box.setFromObject(object);

    // プレイヤーと箱の高さが重なっていなければ、XZ平面の判定は不要です。
    const playerBottom = position.y - this.playerHeight;
    if (position.y < this.box.min.y || playerBottom > this.box.max.y) return;

    /*
     * 箱の中でプレイヤーに最も近い点を求めます。
     * clampは、値をmin〜maxの範囲へ収める関数です。
     */
    const closestX = THREE.MathUtils.clamp(position.x, this.box.min.x, this.box.max.x);
    const closestZ = THREE.MathUtils.clamp(position.z, this.box.min.z, this.box.max.z);
    const differenceX = position.x - closestX;
    const differenceZ = position.z - closestZ;
    const distanceSquared = differenceX ** 2 + differenceZ ** 2;

    // 平方根を毎回計算せず、距離の二乗同士を比較して衝突しているか調べます。
    if (distanceSquared > this.playerRadius ** 2) return;

    /*
     * differenceが両方0なら、プレイヤーの中心が箱の内側にあります。
     * この場合は押し出す方向を距離だけでは決められないため、最も近い四辺を探します。
     */
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

    // 箱の外側から円が少しだけ重なった場合は、重なった長さの分だけ外へ押します。
    const distance = Math.sqrt(distanceSquared);
    const pushDistance = this.playerRadius - distance;
    position.x += (differenceX / distance) * pushDistance;
    position.z += (differenceZ / distance) * pushDistance;
  }
}
