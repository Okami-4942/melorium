
//インポートから始まるのは全部ここ
import * as THREE from "three";
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { PointerLockControls } from "three/addons/controls/PointerLockControls.js";
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
// import { texture } from "three/src/nodes/accessors/TextureNode.js";
// import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

console.log(`piano.js loaded`)

// モデルとテクスチャの実際の読み込み状況をローディング画面へ反映する
THREE.DefaultLoadingManager.onStart = () => {
  window.setLoadingProgress?.(0);
};

THREE.DefaultLoadingManager.onProgress = (_url, loaded, total) => {
  window.setLoadingProgress?.(total > 0 ? loaded / total : 0);
};

THREE.DefaultLoadingManager.onLoad = () => {
  window.setLoadingProgress?.(1);

  // 読み込み済みのシーンが一度描画されてからフェードアウトする
  requestAnimationFrame(() => {
    requestAnimationFrame(() => window.hideLoadingScreen?.());
  });
};

const yAxis = new THREE.Vector3(0, 1, 0);
const showColliderHelpers = false; //アシスト線

//シーンを作る
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xA2B3AA);

//カメラを作る
const camera = new THREE.PerspectiveCamera(
  60, window.innerWidth / window.innerHeight, 0.1, 1000
);
camera.position.set(0, 2.6, 0);

//レンダラー(プロジェクターとスクリーン)
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

//レンダラーを整える
renderer.outputColorSpace = THREE.SRGBColorSpace;  // three r152+ の場合
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
renderer.physicallyCorrectLights = true;          // 物理ベースライティング


//影をつける
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

//床の作成
const floor_geometry = new THREE.CylinderGeometry(
  6.2,    // 上の半径
  6.2,    // 下の半径（同じ＝円柱）
  0.3,  // 厚み（高さ）
  64     // 円のなめらかさ（多いほど丸い）
);

const floor_material = new THREE.MeshStandardMaterial({
  color: 0xa1eda1,
  roughness: 1,
  metalness: 0
});

const plate = new THREE.Mesh(floor_geometry, floor_material);
plate.position.y = 0.009; // 厚みの半分だけ上に
scene.add(plate);

//床に影を落す
plate.receiveShadow = true;
plate.castShadow = false;
scene.add(plate);

//クロスヘア

//1.クロスヘアを設置
const size = 0.02;  // crosshair の長さを調整
const crossfair_material = new THREE.LineBasicMaterial({ color: 0xffffff });

const crosshairGeometry = new THREE.BufferGeometry();
const vertices = new Float32Array([
  -size, 0, -1, size, 0, -1,   // 横線
  0, -size, -1, 0, size, -1    // 縦線
]);
crosshairGeometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));

// 2. LineSegments で十字を描く
const crosshair = new THREE.LineSegments(crosshairGeometry, crossfair_material);

// 3. カメラに add して、シーンにも camera を add
camera.add(crosshair);

// ---------- GLB の読み込み ----------
const loader = new GLTFLoader()

function applyModelShadow(model) {
  model.receiveShadow = true;

  model.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });
}

function createLocalBounds(object, padding = 0) {
  object.updateMatrixWorld(true);

  const rootInverseMatrix = object.matrixWorld.clone().invert();
  const localBounds = new THREE.Box3();
  const meshCorner = new THREE.Vector3();

  object.traverse((child) => {
    if (!child.isMesh || !child.geometry) {
      return;
    }

    if (!child.geometry.boundingBox) {
      child.geometry.computeBoundingBox();
    }

    const box = child.geometry.boundingBox;
    const corners = [
      [box.min.x, box.min.y, box.min.z],
      [box.min.x, box.min.y, box.max.z],
      [box.min.x, box.max.y, box.min.z],
      [box.min.x, box.max.y, box.max.z],
      [box.max.x, box.min.y, box.min.z],
      [box.max.x, box.min.y, box.max.z],
      [box.max.x, box.max.y, box.min.z],
      [box.max.x, box.max.y, box.max.z],
    ];

    for (const corner of corners) {
      meshCorner
        .set(corner[0], corner[1], corner[2])
        .applyMatrix4(child.matrixWorld)
        .applyMatrix4(rootInverseMatrix);
      localBounds.expandByPoint(meshCorner);
    }
  });

  if (padding > 0) {
    localBounds.expandByScalar(padding);
  }

  return localBounds;
}

function loadGLBObject({
  path,
  name,
  texture,
  scale,
  rotation,
  position,
  colliderPadding = 0,
  collider = null
}) {
  loader.load(path, (gltf) => {
    const model = gltf.scene;

    model.name = name;
    model.scale.copy(scale);
    model.rotation.set(rotation.x, rotation.y, rotation.z);
    model.position.copy(position);

    // テクスチャを読み込む
    let doorTexture = null;

    if (texture) {
      doorTexture = textureLoader.load(texture);
      doorTexture.colorSpace = THREE.SRGBColorSpace;
      doorTexture.flipY = false;

      // 繰り返し・位置調整を使うため
      doorTexture.wrapS = THREE.RepeatWrapping;
      doorTexture.wrapT = THREE.RepeatWrapping;

      // 回転の中心を画像の中央にする
      doorTexture.center.set(0.5, 0.5);

      // テクスチャを回転
      doorTexture.rotation = Math.PI / 2; // 90度回転

      // テクスチャの拡大・縮小
      doorTexture.repeat.set(8, 8);

      // テクスチャの位置ずらし
      doorTexture.offset.set(0, 0);

      doorTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();
    }

    model.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;

        if (doorTexture) {
          // 元のGLBのマテリアルをできるだけ残して、画像だけ差し替える
          if (Array.isArray(child.material)) {
            child.material = child.material.map((mat) => {
              const clonedMat = mat.clone();
              clonedMat.map = doorTexture;
              clonedMat.needsUpdate = true;
              return clonedMat;
            });
          } else {
            child.material = child.material.clone();
            child.material.map = doorTexture;
            child.material.needsUpdate = true;
          }
        }
      }
    });

    scene.add(model);

    colliders.addObjectLocalBounds({
      name,
      object: model,
      padding: colliderPadding,
      center: collider?.center,
      size: collider?.size,
    });

    console.log(`${name}が正常に読み込まれました`);
  });
}

// ---------- 本の作成 ----------
const textureLoader = new THREE.TextureLoader();

function loadBookTexture(path) {
  const texture = textureLoader.load(path);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
  return texture;
}

function createSolidMaterial(color, roughness = 0.9) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness,
    metalness: 0,
  });
}

function createOverlayMaterial(texture) {
  return new THREE.MeshPhysicalMaterial({
    map: texture,
    transparent: true,
    alphaTest: 0.04,
    depthWrite: false,
    roughness: 0.28,
    metalness: 0.18,
    clearcoat: 0.55,
    clearcoatRoughness: 0.18,
    side: THREE.FrontSide,
  });
}

function createBook(coverTexturePath, spineTexturePath, position, rotation) {
  const baseTexture = loadBookTexture('./images/green-ura.jpg');
  const coverTexture = loadBookTexture(coverTexturePath);
  const spineTexture = loadBookTexture(spineTexturePath);

  const book = new THREE.Group();
  book.name = 'hidamari-book';
  book.position.copy(position);
  book.rotation.copy(rotation);

  const bookWidth = 1.05;
  const bookHeight = bookWidth * (790 / 569);
  const pageDepth = bookHeight * (306 / 1580);
  const boardDepth = 0.04;
  const totalDepth = pageDepth + boardDepth * 2;
  const coverOffset = 0.006;

  const baseMaterial = new THREE.MeshStandardMaterial({
    map: baseTexture,
    roughness: 0.74,
    metalness: 0,
  });
  const coverOverlayMaterial = createOverlayMaterial(coverTexture);
  const spineOverlayMaterial = createOverlayMaterial(spineTexture);
  const coverEdgeMaterial = createSolidMaterial(0x1B2F23, 0.82);
  const pageMaterial = createSolidMaterial(0xf2ead7); //小口染めのところ
  const topBottomMaterial = createSolidMaterial(0xd6ccb4); //紙の上下

  const pageBlock = new THREE.Mesh(
    new THREE.BoxGeometry(bookWidth - boardDepth * 1.7, bookHeight - 0.08, pageDepth),
    [
      pageMaterial,
      coverEdgeMaterial,
      topBottomMaterial,
      topBottomMaterial,
      pageMaterial,
      pageMaterial,
    ]
  );
  pageBlock.position.x = boardDepth * 0.35;
  pageBlock.castShadow = true;
  pageBlock.receiveShadow = true;
  book.add(pageBlock);

  const frontCover = new THREE.Mesh(
    new THREE.BoxGeometry(bookWidth, bookHeight, boardDepth),
    [
      coverEdgeMaterial,
      coverEdgeMaterial,
      coverEdgeMaterial,
      coverEdgeMaterial,
      baseMaterial,
      coverEdgeMaterial,
    ]
  );
  frontCover.position.z = pageDepth / 2 + boardDepth / 2;
  frontCover.castShadow = true;
  frontCover.receiveShadow = true;
  book.add(frontCover);

  const backCover = new THREE.Mesh(
    new THREE.BoxGeometry(bookWidth, bookHeight, boardDepth),
    [
      coverEdgeMaterial,
      coverEdgeMaterial,
      coverEdgeMaterial,
      coverEdgeMaterial,
      coverEdgeMaterial,
      baseMaterial,
    ]
  );
  backCover.position.z = -pageDepth / 2 - boardDepth / 2;
  backCover.castShadow = true;
  backCover.receiveShadow = true;
  book.add(backCover);

  const spine = new THREE.Mesh(
    new THREE.BoxGeometry(boardDepth, bookHeight, totalDepth),
    [
      coverEdgeMaterial,
      baseMaterial,
      coverEdgeMaterial,
      coverEdgeMaterial,
      coverEdgeMaterial,
      coverEdgeMaterial,
    ]
  );
  spine.position.x = -bookWidth / 2 + boardDepth / 2;
  spine.castShadow = true;
  spine.receiveShadow = true;
  book.add(spine);

  const frontOverlay = new THREE.Mesh(
    new THREE.PlaneGeometry(bookWidth, bookHeight),
    coverOverlayMaterial
  );
  frontOverlay.position.z = pageDepth / 2 + boardDepth + coverOffset;
  frontOverlay.castShadow = false;
  frontOverlay.receiveShadow = true;
  book.add(frontOverlay);

  const spineOverlay = new THREE.Mesh(
    new THREE.PlaneGeometry(totalDepth, bookHeight),
    spineOverlayMaterial
  );
  spineOverlay.rotation.y = -Math.PI / 2;
  spineOverlay.position.x = -bookWidth / 2 - coverOffset;
  spineOverlay.castShadow = false;
  spineOverlay.receiveShadow = true;
  book.add(spineOverlay);

  const pageLineMaterial = new THREE.LineBasicMaterial({
    color: 0xc4b99f,
    transparent: true,
    opacity: 0.72,
  });
  const pageLines = new THREE.Group();
  const pageSideX = bookWidth / 2 - 0.025;
  const lineCount = 24;
  for (let i = 0; i < lineCount; i++) {
    const y = -bookHeight * 0.43 + (bookHeight * 0.86 * i) / (lineCount - 1);
    const points = [
      new THREE.Vector3(pageSideX, y, -pageDepth / 2 + 0.012),
      new THREE.Vector3(pageSideX, y + Math.sin(i * 1.7) * 0.003, pageDepth / 2 - 0.012),
    ];
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    pageLines.add(new THREE.Line(geometry, pageLineMaterial));
  }
  book.add(pageLines);
  book.scale.set(0.7, 0.7, 0.7);
  scene.add(book);

  colliders.addObjectBox({
    name: 'hidamari-book',
    object: book,
    halfSize: new THREE.Vector3(bookWidth / 2, bookHeight / 2, totalDepth / 2),
  });

  return book;
}

// ---------- 本ここまで ----------

//光  

//環境光
const ambientLight = new THREE.AmbientLight(0xffffff, 1); // 色、強度
scene.add(ambientLight);
ambientLight.castShadow = false;

//ライトの調整
const sun = new THREE.DirectionalLight(0xffffff, 3.0);
sun.position.set(5, 10, 7.5);
sun.castShadow = true;//影を落とす
scene.add(sun);
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.normalBias = 0.02;
sun.shadow.bias = -0.0001;
sun.shadow.camera.near = 1;
sun.shadow.camera.far = 50;

const fill = new THREE.HemisphereLight(0xffffff, 0x444444, 0.5);
scene.add(fill);

//fps設定

// カメラをマウスで操作できるようにする
const controls = new PointerLockControls(camera, document.body);
scene.add(controls.getObject());

document.addEventListener("click", () => {
  controls.lock()
})

// キーボードのキーが押されたかチェックする
const keys = {};
document.addEventListener('keydown', (e) => keys[e.code] = true);
document.addEventListener('keyup', (e) => keys[e.code] = false);

// 動く方向と速さのデータ
const direction = new THREE.Vector3();
const velocity = new THREE.Vector3();

//透明の壁とオブジェクト当たり判定
class CollisionSystem {
  constructor(playerRadius, playerHeight) {
    this.playerRadius = playerRadius;
    this.playerHeight = playerHeight;
    this.boundaries = [];
    this.boxes = [];
  }

  addCircleBoundary({ center, radius }) {
    this.boundaries.push({ center: center.clone(), radius });
  }

  addBox({ name, center, halfSize, rotationY = 0 }) {
    this.boxes.push({
      type: 'box',
      name,
      center: center.clone(),
      halfSize: halfSize.clone(),
      rotationY,
      object: null,
    });
  }

  addObjectBox({ name, object, halfSize }) {
    this.boxes.push({
      type: 'objectBox',
      name,
      center: object.position.clone(),
      halfSize: halfSize.clone(),
      rotationY: object.rotation.y,
      object,
    });
  }

  addObjectBounds({ name, object, padding = 0 }) {
    this.boxes.push({
      type: 'objectBounds',
      name,
      object,
      padding,
      bounds: new THREE.Box3(),
    });
  }

  addObjectLocalBounds({ name, object, padding = 0, center = null, size = null }) {
    const localBounds = center && size
      ? new THREE.Box3().setFromCenterAndSize(center, size)
      : createLocalBounds(object, padding);

    if (center && size && padding > 0) {
      localBounds.expandByScalar(padding);
    }
    const helperSize = localBounds.getSize(new THREE.Vector3());
    const helperCenter = localBounds.getCenter(new THREE.Vector3());

    const collider = {
      type: 'objectLocalBounds',
      name,
      object,
      localBounds,
      center: helperCenter,
      size: helperSize,
      worldScale: new THREE.Vector3(),
      localPosition: new THREE.Vector3(),
      localResolvedPosition: new THREE.Vector3(),
      worldResolvedPosition: new THREE.Vector3(),
    };

    if (showColliderHelpers) {
      const helperMaterial = new THREE.MeshBasicMaterial({
        color: 0x00ff66,
        wireframe: true,
        transparent: true,
        opacity: 0.85,
        depthTest: false,
      });
      const helper = new THREE.Mesh(
        new THREE.BoxGeometry(helperSize.x, helperSize.y, helperSize.z),
        helperMaterial
      );
      helper.name = `${name}-collider-helper`;
      helper.position.copy(helperCenter);
      helper.renderOrder = 999;
      object.add(helper);
      collider.helper = helper;
    }

    this.boxes.push(collider);
  }

  resolvePlayerPosition(position) {
    this.resolveCircleBoundaries(position);
    this.resolveBoxes(position);
  }

  resolveCircleBoundaries(position) {
    for (const boundary of this.boundaries) {
      const playerOffset = new THREE.Vector3(
        position.x - boundary.center.x,
        0,
        position.z - boundary.center.z
      );
      const distance = playerOffset.length();
      const allowedDistance = boundary.radius - this.playerRadius;

      if (distance > allowedDistance) {
        playerOffset.normalize().multiplyScalar(allowedDistance);
        position.x = boundary.center.x + playerOffset.x;
        position.z = boundary.center.z + playerOffset.z;
      }
    }
  }

  resolveBoxes(position) {
    for (const box of this.boxes) {
      if (box.type === 'objectBounds') {
        box.object.updateMatrixWorld(true);
        box.bounds.setFromObject(box.object);

        if (box.padding > 0) {
          box.bounds.expandByScalar(box.padding);
        }

        this.resolveAxisAlignedBox(position, box.bounds);
        continue;
      }

      if (box.type === 'objectLocalBounds') {
        this.resolveObjectLocalBounds(position, box);
        continue;
      }

      this.resolveOrientedBox(position, box);
    }
  }

  resolveAxisAlignedBox(position, box) {
    const playerBottom = position.y - this.playerHeight;
    const playerTop = position.y;

    if (playerTop < box.min.y || playerBottom > box.max.y) {
      return;
    }

    const closestX = THREE.MathUtils.clamp(position.x, box.min.x, box.max.x);
    const closestZ = THREE.MathUtils.clamp(position.z, box.min.z, box.max.z);
    const deltaX = position.x - closestX;
    const deltaZ = position.z - closestZ;
    const distanceSq = deltaX * deltaX + deltaZ * deltaZ;

    if (distanceSq > this.playerRadius * this.playerRadius) {
      return;
    }

    if (distanceSq === 0) {
      const pushLeft = Math.abs(position.x - box.min.x);
      const pushRight = Math.abs(box.max.x - position.x);
      const pushBack = Math.abs(position.z - box.min.z);
      const pushFront = Math.abs(box.max.z - position.z);
      const minPush = Math.min(pushLeft, pushRight, pushBack, pushFront);

      if (minPush === pushLeft) {
        position.x = box.min.x - this.playerRadius;
      } else if (minPush === pushRight) {
        position.x = box.max.x + this.playerRadius;
      } else if (minPush === pushBack) {
        position.z = box.min.z - this.playerRadius;
      } else {
        position.z = box.max.z + this.playerRadius;
      }

      return;
    }

    const distance = Math.sqrt(distanceSq);
    const pushDistance = this.playerRadius - distance;
    position.x += (deltaX / distance) * pushDistance;
    position.z += (deltaZ / distance) * pushDistance;
  }

  resolveObjectLocalBounds(position, box) {
    box.object.getWorldScale(box.worldScale);

    const radiusX = this.playerRadius / Math.abs(box.worldScale.x || 1);
    const radiusZ = this.playerRadius / Math.abs(box.worldScale.z || 1);
    const playerBottom = (position.y - this.playerHeight - box.object.position.y) / Math.abs(box.worldScale.y || 1);
    const playerTop = (position.y - box.object.position.y) / Math.abs(box.worldScale.y || 1);

    if (playerTop < box.localBounds.min.y || playerBottom > box.localBounds.max.y) {
      return;
    }

    box.localPosition.copy(position);
    box.object.worldToLocal(box.localPosition);

    const closestX = THREE.MathUtils.clamp(box.localPosition.x, box.localBounds.min.x, box.localBounds.max.x);
    const closestZ = THREE.MathUtils.clamp(box.localPosition.z, box.localBounds.min.z, box.localBounds.max.z);
    const deltaX = box.localPosition.x - closestX;
    const deltaZ = box.localPosition.z - closestZ;
    const normalizedDistanceSq =
      (deltaX * deltaX) / (radiusX * radiusX) +
      (deltaZ * deltaZ) / (radiusZ * radiusZ);

    if (normalizedDistanceSq > 1) {
      return;
    }

    box.localResolvedPosition.copy(box.localPosition);

    if (normalizedDistanceSq === 0) {
      const pushLeft = Math.abs(box.localPosition.x - box.localBounds.min.x) / radiusX;
      const pushRight = Math.abs(box.localBounds.max.x - box.localPosition.x) / radiusX;
      const pushBack = Math.abs(box.localPosition.z - box.localBounds.min.z) / radiusZ;
      const pushFront = Math.abs(box.localBounds.max.z - box.localPosition.z) / radiusZ;
      const minPush = Math.min(pushLeft, pushRight, pushBack, pushFront);

      if (minPush === pushLeft) {
        box.localResolvedPosition.x = box.localBounds.min.x - radiusX;
      } else if (minPush === pushRight) {
        box.localResolvedPosition.x = box.localBounds.max.x + radiusX;
      } else if (minPush === pushBack) {
        box.localResolvedPosition.z = box.localBounds.min.z - radiusZ;
      } else {
        box.localResolvedPosition.z = box.localBounds.max.z + radiusZ;
      }
    } else {
      const normalizedDistance = Math.sqrt(normalizedDistanceSq);
      box.localResolvedPosition.x = closestX + deltaX / normalizedDistance;
      box.localResolvedPosition.z = closestZ + deltaZ / normalizedDistance;
    }

    box.worldResolvedPosition.copy(box.localResolvedPosition);
    box.object.localToWorld(box.worldResolvedPosition);
    position.x = box.worldResolvedPosition.x;
    position.z = box.worldResolvedPosition.z;
  }

  resolveOrientedBox(position, box) {
    const playerBottom = position.y - this.playerHeight;
    const playerTop = position.y;
    const center = box.object ? box.object.getWorldPosition(new THREE.Vector3()) : box.center;
    const rotationY = box.object ? box.object.rotation.y : box.rotationY;
    const boxBottom = center.y - box.halfSize.y;
    const boxTop = center.y + box.halfSize.y;

    if (playerTop < boxBottom || playerBottom > boxTop) {
      return;
    }

    const localPosition = new THREE.Vector3(
      position.x - center.x,
      0,
      position.z - center.z
    ).applyAxisAngle(yAxis, -rotationY);

    const closestX = THREE.MathUtils.clamp(localPosition.x, -box.halfSize.x, box.halfSize.x);
    const closestZ = THREE.MathUtils.clamp(localPosition.z, -box.halfSize.z, box.halfSize.z);
    const deltaX = localPosition.x - closestX;
    const deltaZ = localPosition.z - closestZ;
    const distanceSq = deltaX * deltaX + deltaZ * deltaZ;

    if (distanceSq > this.playerRadius * this.playerRadius) {
      return;
    }

    if (distanceSq === 0) {
      const pushLeft = Math.abs(localPosition.x + box.halfSize.x);
      const pushRight = Math.abs(box.halfSize.x - localPosition.x);
      const pushBack = Math.abs(localPosition.z + box.halfSize.z);
      const pushFront = Math.abs(box.halfSize.z - localPosition.z);
      const minPush = Math.min(pushLeft, pushRight, pushBack, pushFront);

      if (minPush === pushLeft) {
        localPosition.x = -box.halfSize.x - this.playerRadius;
      } else if (minPush === pushRight) {
        localPosition.x = box.halfSize.x + this.playerRadius;
      } else if (minPush === pushBack) {
        localPosition.z = -box.halfSize.z - this.playerRadius;
      } else {
        localPosition.z = box.halfSize.z + this.playerRadius;
      }
    } else {
      const distance = Math.sqrt(distanceSq);
      const pushDistance = this.playerRadius - distance;
      localPosition.x += (deltaX / distance) * pushDistance;
      localPosition.z += (deltaZ / distance) * pushDistance;
    }

    const resolvedPosition = localPosition.applyAxisAngle(yAxis, rotationY);
    position.x = center.x + resolvedPosition.x;
    position.z = center.z + resolvedPosition.z;
  }
}

const colliders = new CollisionSystem(0.25, 2.6);
colliders.addCircleBoundary({
  center: new THREE.Vector3(0, 0, 0),
  radius: 6.2,
});

// GLB追加時はここに1件足す。判定が合わない時は colliderPadding または collider.center/size で調整する。
const glbObjects = [
  {
    path: './models/door.glb',
    name: 'pdoor',
    texture: './images/pdoorm.png',
    scale: new THREE.Vector3(0.5, 0.5, 0.5),
    rotation: new THREE.Euler(0, Math.PI, 0),
    position: new THREE.Vector3(5.8, 1.95, 0),
  },
  {
    path: './models/door.glb',
    name: 'fdoor',
    texture: './images/fdoorm.png',
    scale: new THREE.Vector3(0.5, 0.5, 0.5),
    rotation: new THREE.Euler(0, Math.PI / 3, 0),
    position: new THREE.Vector3(-2.9, 1.95, 5.023),
  },
  {
    path: './models/door.glb',
    name: 'ldoor',
    texture: './images/ldoorm.png',
    scale: new THREE.Vector3(0.5, 0.5, 0.5),
    rotation: new THREE.Euler(0, Math.PI * -1 / 3, 0),
    position: new THREE.Vector3(-2.9, 1.95, -5.023),
  },
];

//本を複製する

glbObjects.forEach(loadGLBObject);
const book1 = createBook("./images/プラネテス.png", "./images/プラネテス1背.png", new THREE.Vector3(-1.5, 2, 1.5), new THREE.Euler(-Math.PI / 2, 0, -Math.PI / 4));
const book2 = createBook("./images/メアリー・スーの憂鬱.png", "./images/メアリー・スーの憂鬱3背.png", new THREE.Vector3(1.5, 2, -1.5), new THREE.Euler(-Math.PI / 2, 0, Math.PI * 3 / 4));

//机をつくるなど

//マテリアルを追加する

const material = new THREE.MeshPhysicalMaterial({
  color: 0xffffff,

  transmission: 1.0,
  thickness: 0,

  roughness: 0.15,
  metalness: 0,

  ior: 1.52,

  attenuationDistance: 2.0,
  attenuationColor: new THREE.Color(0xe8f8ff),

  clearcoat: 0,
  iridescence: 0,
  sheen: 0,

  transparent: true,
  opacity: 1,
});

function loadTableTexture(path) {
  const texture = textureLoader.load(path);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.flipY = false;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1, 3);
  texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
  return texture;
}

const TableTextureMaterial = new THREE.MeshStandardMaterial({
  map: loadTableTexture('./images/ldoorm.png'),
  roughness: 0.68,
  metalness: 0,
});

//マテリアルここまで

let modelSet = false;
let GlassObject;

function setupTableMaterial(model) {
  model.traverse((object) => {
    if (!object.isMesh) return;

    // material がないメッシュ対策
    if (object.material && object.material.name === "ガラス") {
      object.material = material.clone();
    } else {
      object.material = TableTextureMaterial.clone();
    }

    object.castShadow = true;
    object.receiveShadow = true;
  });
}

function cloneGlassObject(position, rotationY = 0) {
  if (!GlassObject) {
    console.warn("GlassObject はまだ読み込まれていません");
    return null;
  }

  const clonedObject = GlassObject.clone(true);

  clonedObject.position.copy(position);
  clonedObject.rotation.y = rotationY;

  // clone後、materialも個別にcloneする
  clonedObject.traverse((child) => {
    if (!child.isMesh) return;

    child.castShadow = true;
    child.receiveShadow = true;

    if (Array.isArray(child.material)) {
      child.material = child.material.map((mat) => {
        return mat ? mat.clone() : new THREE.MeshStandardMaterial();
      });
    } else if (child.material) {
      child.material = child.material.clone();
    } else {
      child.material = new THREE.MeshStandardMaterial();
    }
  });

  scene.add(clonedObject);

  return clonedObject;
}

loader.load('models/table.glb', function (gltf) {
  const model = gltf.scene;

  setupTableMaterial(model);

  GlassObject = model;
  GlassObject.scale.set(0.3, 0.3, 0.3);
  GlassObject.position.set(1.5, 0.4, 1.5);

  scene.add(GlassObject);
  modelSet = true;

  // ここなら読み込み完了後なので clone できる
  cloneGlassObject(new THREE.Vector3(1.5, 0.4, -1.5));
  cloneGlassObject(new THREE.Vector3(-1.5, 0.4, 1.5));
  cloneGlassObject(new THREE.Vector3(-1.5, 0.4, -1.5));
});


// colliders.addObjectLocalBounds({
//   name: 'ptable',
//   object: GlassObject,
//   padding: 0.05,
// });

modelSet = true;

const bookHighlight = new THREE.PointLight(0xffe1a3, 1.2, 5);
bookHighlight.position.set(0.2, 2.3, -1.4);
scene.add(bookHighlight);

//机ここまで

//机を増やす

//   const Dec = GlassObject.clone();
//   Dec.position.set( 3.5, 0.4,  0);

//   const Aquarium = ptable.clone(true);
//   table2.position.set( 0, 0.4,  3.5);

//   const Angel = ptable.clone(true);
//   table3.position.set(-3.5, 0.4,  0);

//   const Sleep = ptable.clone(true);
//   table4.position.set( 0, 0.4, -3.5);

//   scene.add(Dec);
//   scene.add(Aquarium);
//   scene.add(Angel);
//   scene.add(Sleep);

// 毎フレーム（60回/秒）動かす関数
function animate() {
  requestAnimationFrame(animate);

  if (controls.isLocked) {
    direction.set(0, 0, 0); // 方向を初期化

    // 押されたキーに応じて方向を設定
    if (keys['KeyS']) direction.z -= 0.5;
    if (keys['KeyW']) direction.z += 0.5;
    if (keys['KeyA']) direction.x -= 0.5;
    if (keys['KeyD']) direction.x += 0.5;

    direction.normalize(); // 斜めでも速さを一定に

    velocity.copy(direction).multiplyScalar(0.04); // 移動の速さを調整

    // 実際にカメラを動かす
    controls.moveRight(velocity.x);
    controls.moveForward(velocity.z);

    const player = controls.getObject();
    colliders.resolvePlayerPosition(player.position);
  }

  renderer.render(scene, camera);

}

animate()

// ---------- リサイズ対応 ----------
window.addEventListener('resize', () => {
  const { innerWidth, innerHeight } = window;
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});
