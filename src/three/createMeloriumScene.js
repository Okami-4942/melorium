import * as THREE from "three";
import { PointerLockControls } from "three/addons/controls/PointerLockControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { assets } from "../assets.js";
import CollisionSystem from "./CollisionSystem.js";
import { createBook } from "./createBook.js";

/*
 * このファイルはThree.jsの3D空間全体を作る中心です。
 * React固有のuseStateやJSXは使わず、Reactから渡されたコールバックだけを呼びます。
 * こうすることで「画面の状態はReact」「3D描画はThree.js」という境界を守っています。
 */

// 3D空間の調整値を名前付き定数にし、コード中の数字が何を表すか分かるようにしています。
const ROOM_RADIUS = 6.2;
const PLAYER_HEIGHT = 2.6;
const WALK_SPEED = 2.4;
const INTERACTION_DISTANCE = 3;
// const MAIN_BACKGROUND_COLOR = 0xadadad;
// const MAIN_FLOOR_COLOR = 0x7d7d7d;

// 旧main.jsではテーブルがコメントアウトされていたため、初期部屋では読み込みません。
// const SHOW_TABLES = false;

// カメラとドアの中心がこの距離以下になったら移動します。
const DOOR_TRIGGER_DISTANCE = 1.6;

/*
 * 旧main.jsにあったForte・Mezzo・Pianoの三つのドアを再現します。
 * 同じドアモデルを三回読み込む代わりに、違う値だけを配列へまとめます。
 * positionは[x, y, z]、rotationYはY軸まわりの回転角度（ラジアン）です。
 */
// const doorSettings = [
//   {
//     name: "forte-door",
//     textureUrl: assets.textures.forteDoor,
//     position: [5.8, 1.95, 0],
//     rotationY: Math.PI,
//   },
//   {
//     name: "mezzo-door",
//     textureUrl: assets.textures.mezzoDoor,
//     position: [-2.9, 1.95, 5.023],
//     rotationY: Math.PI / 3,
//   },
//   {
//     name: "piano-door",
//     textureUrl: assets.textures.pianoDoor,
//     position: [-2.9, 1.95, -5.023],
//     rotationY: -Math.PI / 3,
//   },
// ];

/*
 * 旧main.jsでは「陽だまりのセツナ」が中央奥に一冊置かれていました。
 * scaleとedgeColorも設定へ含め、当時の大きさと赤い表紙の縁を再現します。
 */
// const bookSettings = [
//   {
//     songId: "hidamari",
//     backTextureUrl: assets.textures.mainBookBack,
//     coverTextureUrl: assets.textures.hidamariCover,
//     spineTextureUrl: assets.textures.hidamariSpine,
//     position: new THREE.Vector3(0, (1.05 * (790 / 569)) / 2 + 0.16, -2.6),
//     rotation: new THREE.Euler(0, 0, 0),
//     scale: 1,
//     edgeColor: 0x7a1f20,
//   },
// ];

/*
 * Three.jsのGeometry・Material・TextureはGPU側にもデータを持ちます。
 * JavaScriptの変数を消すだけではGPUメモリが解放されないため、明示的にdispose()します。
 */

const scene = new THREE.Scene();
scene.background = new THREE.Color(roomConfig.backgroundColor);

const camera = new THREE.PerspectiveCamera(
  roomConfig.cameraFov,
  1,
  0.1,
  1000,
);


function disposeObject(object) {
  object.traverse((child) => {
    child.geometry?.dispose();

    const materials = Array.isArray(child.material)
      ? child.material
      : [child.material];
    materials.filter(Boolean).forEach((material) => {
      Object.values(material).forEach((value) => {
        if (value?.isTexture) value.dispose();
      });
      material.dispose();
    });
  });
}

// カメラの正面へ白い十字線を付け、本へ照準を合わせる目印にします。
function addCrosshair(camera) {
  const size = 0.02;
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.BufferAttribute(
      new Float32Array([
        -size,
        0,
        -1,
        size,
        0,
        -1,
        0,
        -size,
        -1,
        0,
        size,
        -1,
      ]),
      3,
    ),
  );
  camera.add(
    new THREE.LineSegments(
      geometry,
      new THREE.LineBasicMaterial({ color: 0xffffff }),
    ),
  );
}

/*
 * 環境光・太陽光・空と地面からの光・本の近くの光を組み合わせます。
 * 一つの関数へまとめ、シーン本体の初期化手順を短く読みやすくしています。
 */
function addLights(scene) {
  scene.add(new THREE.AmbientLight(0xffffff, 1));

  const sun = new THREE.DirectionalLight(0xffffff, 3);
  sun.position.set(5, 10, 7.5);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.normalBias = 0.02;
  sun.shadow.bias = -0.0001;
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = 50;
  scene.add(sun);

  scene.add(new THREE.HemisphereLight(0xffffff, 0x444444, 0.5));

  const bookHighlight = new THREE.PointLight(0xffe1a3, 1.2, 5);
  bookHighlight.position.set(0.2, 2.3, -1.4);
  scene.add(bookHighlight);
}

// 円柱の上面を床として使います。CylinderGeometryの高さ0.3が床の厚みです。
function addFloor(scene, floorColor) {
  const floor = new THREE.Mesh(
    new THREE.CylinderGeometry(ROOM_RADIUS, ROOM_RADIUS, 0.3, 64),
    new THREE.MeshStandardMaterial({
      color: floorColor,
      roughness: 1,
      metalness: 0,
    }),
  );

  floor.position.y = 0.009;
  floor.receiveShadow = true;
  scene.add(floor);
}

// 一度移動を始めたあと、次フレームで同じ処理を繰り返さないための印です。
let isTransitioning = false;

// 移動に使うドア本体と移動先を保存します。
const transitionDoors = [];

// 距離計算で同じVector3を再利用します。
const doorWorldPosition = new THREE.Vector3();



export function createMeloriumScene({
  container,
  roomConfig,
  onReady,
  // Fキーで選んだ曲IDをReactへ伝えるため、関数を受け取ります。
  onSelectSong,
  // 本へ照準が合った・外れた変化をReactへ伝える関数です。
  onInteractionChange,
  onChangeRoom,
}) {
  /*
   * Reactから受け取る値:
   * - container: canvasを追加するdiv
   * - onReady: 全素材を読み終えたことをReactへ伝える関数
   */

 const scene = new THREE.Scene();
scene.background = new THREE.Color(roomConfig.backgroundColor);

const camera = new THREE.PerspectiveCamera(
  roomConfig.cameraFov,
  1,
  0.1,
  1000,
);

  // dispose後に遅れて読み込みが完了しても、古いシーンへ追加しないための印です。
  let isDisposed = false;

  // モーダル表示中はtrueになり、移動・照準判定・Pointer Lockを止めます。
  let isPaused = false;

  // requestAnimationFrameをcleanup時に止めるため、予約番号を保存します。
  let animationFrameId;

  // 現在照準が合っている曲IDです。本を見ていなければnullです。
  let focusedSongId = null;

  // 同時押しを扱えるよう、現在押されているキーコードをSetへ保存します。
  const pressedKeys = new Set();

  // Raycasterの判定対象を本のMeshだけに絞り、不要な机や床との交差計算を避けます。
  const interactableMeshes = [];

  /*
   * 専用LoadingManagerをTextureLoaderとGLTFLoaderの両方へ渡します。
   * これにより、このシーンが要求した画像とモデルを一括して監視できます。
   */
  const loadingManager = new THREE.LoadingManager();
  const textureLoader = new THREE.TextureLoader(loadingManager);
  const gltfLoader = new GLTFLoader(loadingManager);

  loadingManager.onError = (url) => {
    console.error(`素材を読み込めませんでした: ${url}`);
  };
  loadingManager.onLoad = () => {
    /*
     * ファイル取得直後にローディング画面を消すと、まだcanvasへ反映されていない場合があります。
     * 二回のrequestAnimationFrameを待ち、読み込み済みシーンが描画されてからReactへ完了を伝えます。
     */
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (!isDisposed) onReady();
      });
    });
  };

  // WebGLRendererがThree.jsのSceneをcanvasへ描画します。
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    powerPreference: "high-performance",
  });
  // 色・明るさ・影・解像度を設定し、端末の画素密度は重すぎないよう最大2倍に制限します。
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  // renderer.domElementがcanvasです。Reactから受け取った専用divの中だけへ追加します。
  container.appendChild(renderer.domElement);

  // PointerLockControlsは、クリック後のマウス移動を一人称視点の回転へ変換します。
  const controls = new PointerLockControls(camera, renderer.domElement);
  const collisions = new CollisionSystem({
    playerRadius: 0.25,
    playerHeight: PLAYER_HEIGHT,
    roomRadius: ROOM_RADIUS,
  });
  // Raycasterは画面中央から伸ばす見えない線、Clockは前フレームからの経過時間を扱います。
  const raycaster = new THREE.Raycaster();
  const clock = new THREE.Clock();
  const movement = new THREE.Vector3();

  // 基本となる静的な床とライトを先にシーンへ追加します。
  addFloor(scene, roomConfig.floorColor);
  addLights(scene);

  /*
   * 本の違いはbookSettingsへまとめています。
   * 展開構文...settingで、その本の設定をcreateBookの引数へ追加しています。
   */
  roomConfig.books.forEach((setting) => {
    const book = createBook({
      textureLoader,
      renderer,
      backTextureUrl: roomConfig.bookBackTextureUrl,
      coverTextureUrl: setting.coverTextureUrl,
      spineTextureUrl: setting.spineTextureUrl,
      position: new THREE.Vector3(...setting.position),
      rotation: new THREE.Euler(...setting.rotation),
      songId: setting.songId,
      scale: setting.scale,
      edgeColor: roomConfig.bookEdgeColor,
    });

    scene.add(book);
    collisions.add(book);

    book.traverse((child) => {
      if (child.isMesh) interactableMeshes.push(child);
    });
  });


  /*
   * GLB内の各Meshへ指定画像を貼る関数です。
   * cloneしたモデル同士でMaterialを共有すると、一つの変更が全ドアへ反映されてしまいます。
   * そのためchild.material.clone()でドアごとに独立したMaterialを作ります。
   */
  const applyDoorTexture = (model, textureUrl) => {
    const texture = textureLoader.load(textureUrl);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.flipY = false;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.center.set(0.5, 0.5);
    texture.rotation = Math.PI / 2;
    texture.repeat.set(8, 8);
    texture.anisotropy = renderer.capabilities.getMaxAnisotropy();

    model.traverse((child) => {
      if (!child.isMesh) return;
      child.material = child.material.clone();
      child.material.map = texture;
      child.material.needsUpdate = true;
      child.castShadow = true;
      child.receiveShadow = true;
    });
  };

  /*
   * ドアのGLBは一度だけ読み込み、完了後に三つcloneします。
   * ネットワーク読み込みを重複させず、各cloneへ異なるテクスチャと位置を設定します。
   */
  gltfLoader.load(
    assets.models.door,
    (gltf) => {
      // React側ですでにcleanupされた場合、読み込んだモデルは表示せず直ちに解放します。
      if (isDisposed) {
        disposeObject(gltf.scene);
        return;
      }

      roomConfig.doors.forEach((setting) => {
        const door = gltf.scene.clone(true);
        door.name = setting.name;
        door.scale.setScalar(0.5);
        door.position.fromArray(setting.position);
        door.rotation.y = setting.rotationY;
        applyDoorTexture(door, setting.textureUrl);

        scene.add(door);
        collisions.add(door);

        transitionDoors.push({
          object: door,
          destinationRoomId: setting.destinationRoomId,
        });
      });

    },
    undefined,
    (error) => console.error("ドアモデルを読み込めませんでした。", error),
  );

  // サブ部屋用のテーブル生成処理は残し、旧main.jsと同じ初期表示では実行しません。
  if (roomConfig.showTables) {
    gltfLoader.load(
      assets.models.table,
      (gltf) => {
        if (isDisposed) {
          disposeObject(gltf.scene);
          return;
        }

        // 旧実装と同じ画像をテーブルの不透明部分へ貼ります。
        const tableTexture = textureLoader.load(assets.textures.largoDoor);
        tableTexture.colorSpace = THREE.SRGBColorSpace;
        tableTexture.flipY = false;
        tableTexture.wrapS = THREE.RepeatWrapping;
        tableTexture.wrapT = THREE.RepeatWrapping;
        tableTexture.repeat.set(1, 3);

        // 配置だけを配列へまとめ、同じclone処理をforEachで再利用します。
        const positions = [
          [1.5, 0.4, 1.5],
          [1.5, 0.4, -1.5],
          [-1.5, 0.4, 1.5],
          [-1.5, 0.4, -1.5],
        ];

        positions.forEach((position) => {
          const table = gltf.scene.clone(true);
          table.scale.setScalar(0.3);
          table.position.fromArray(position);
          /*
           * GLB内のMaterial名が「ガラス」なら透過材質、それ以外なら画像付き材質へ差し替えます。
           * optional chainingの?.により、Materialが無いMeshでもエラーになりません。
           */
          table.traverse((child) => {
            if (!child.isMesh) return;
            child.material =
              child.material?.name === "ガラス"
                ? new THREE.MeshPhysicalMaterial({
                  color: 0xffffff,
                  transmission: 1,
                  roughness: 0.15,
                  ior: 1.52,
                  transparent: true,
                })
                : new THREE.MeshStandardMaterial({
                  map: tableTexture,
                  roughness: 0.68,
                });
            child.castShadow = true;
            child.receiveShadow = true;
          });
          scene.add(table);
          collisions.add(table);
        });
      },
      undefined,
      (error) => console.error("テーブルモデルを読み込めませんでした。", error),
    );
  }

  const resize = () => {
    /*
     * canvasを入れているdivの大きさに描画サイズを合わせます。
     * カメラのaspectも同時に変えないと、画面比率によって3D空間が横長・縦長に歪みます。
     */
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
  };


  const updateFocusedBook = () => {
    /*
     * 毎フレーム、画面中央の照準が本へ当たっているかを調べます。
     * nextSongIdは今回の判定結果、focusedSongIdは前回の判定結果です。
     */
    let nextSongId = null;

    if (controls.isLocked && !isPaused) {
      // (0, 0)は画面中央です。ここからカメラの向きへRayを伸ばします。
      raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);

      // 交差結果は近い順なので、配列の先頭[0]だけを調べれば最も手前の本が分かります。
      const hit = raycaster.intersectObjects(interactableMeshes, false)[0];

      // 遠くから本を開けないよう、交差した距離にも上限を設けています。
      if (hit && hit.distance <= INTERACTION_DISTANCE) {
        nextSongId = hit.object.userData.songId;
      }
    }

    if (focusedSongId === nextSongId) return;
    focusedSongId = nextSongId;
    onInteractionChange(nextSongId ? "Fキーで開く" : "");
  };

  const checkDoorTransition = () => {
  // モーダル中、移動開始後、Pointer Lock前は判定しません。
  if (isPaused || isTransitioning || !controls.isLocked) return;

  for (const door of transitionDoors) {
    // ドアのシーン全体での位置を取得します。
    door.object.getWorldPosition(doorWorldPosition);

    // 高さYを無視し、床と同じXZ平面での距離を計算します。
    const distance = Math.hypot(
      camera.position.x - doorWorldPosition.x,
      camera.position.z - doorWorldPosition.z,
    );

    if (distance <= DOOR_TRIGGER_DISTANCE) {
      // Reactのstate更新より先に印を付け、連続実行を防ぎます。
      isTransitioning = true;
      pressedKeys.clear();
      controls.unlock();
      onChangeRoom(door.destinationRoomId);
      return;
    }
  }
};


  const renderFrame = () => {
    // 次のブラウザ描画タイミングでも同じ関数を呼び、アニメーションループを作ります。
    animationFrameId = requestAnimationFrame(renderFrame);

    /*
     * 前フレームからの経過秒数を取得します。
     * タブ復帰時などの大きすぎる値は0.05秒までに制限し、急に遠くへ移動するのを防ぎます。
     */
    const deltaSeconds = Math.min(clock.getDelta(), 0.05);

    if (controls.isLocked && !isPaused) {
      // 毎フレーム最初に移動方向をゼロへ戻し、現在押されているキーから作り直します。
      movement.set(0, 0, 0);
      if (pressedKeys.has("KeyW")) movement.z += 1;
      if (pressedKeys.has("KeyS")) movement.z -= 1;
      if (pressedKeys.has("KeyA")) movement.x -= 1;
      if (pressedKeys.has("KeyD")) movement.x += 1;
      /*
       * normalize()で斜め移動も長さ1にそろえます。
       * その後「1秒あたりの速度 × 経過秒数」を掛け、端末のFPSに依存しない距離にします。
       */
      movement.normalize().multiplyScalar(WALK_SPEED * deltaSeconds);

      // PointerLockControlsを使うと、カメラが向いている方向を基準に前後左右へ移動できます。
      controls.moveRight(movement.x);
      controls.moveForward(movement.z);
      // 移動後の位置が床の外や物体の中なら、安全な位置へ押し戻します。
      collisions.resolve(camera.position);
    }

    // 照準判定を更新したあと、現在のSceneをカメラから見た画像としてcanvasへ描きます。
    checkDoorTransition();
    updateFocusedBook();
    renderer.render(scene, camera);
  };

  const handlePointerDown = () => {
    // canvasを押したときだけPointer Lockを開始します。モーダル中は開始しません。
    if (!isPaused && !controls.isLocked) controls.lock();
  };
  const handleKeyDown = (event) => {
    pressedKeys.add(event.code);

    if (event.code === "KeyF" && !event.repeat && focusedSongId && !isPaused) {
      // 曲画面と操作案内が重ならないよう、先に空文字へ戻します。
      onInteractionChange("");
      controls.unlock();
      onSelectSong(focusedSongId);
    }
  };
  // キーを離したらSetから削除し、次フレーム以降の移動を止めます。
  const handleKeyUp = (event) => pressedKeys.delete(event.code);

  // 別タブへ移動したときにkeyupを受け取れない場合があるため、全キーを解除します。
  const handleWindowBlur = () => pressedKeys.clear();

  // 初期化時に必要なブラウザイベントを登録します。dispose()で同じ組み合わせを解除します。
  renderer.domElement.addEventListener("pointerdown", handlePointerDown);
  window.addEventListener("keydown", handleKeyDown);
  window.addEventListener("keyup", handleKeyUp);
  window.addEventListener("blur", handleWindowBlur);
  window.addEventListener("resize", resize);
  resize();
  renderFrame();

  /*
   * React側へ公開する操作を、必要最小限の二つに限定します。
   * Reactは内部のcameraやrendererを直接触らず、このAPIを通して一時停止と後片付けを行います。
   */
  return {
    setPaused(nextIsPaused) {
      isPaused = nextIsPaused;
      if (isPaused) {
        // モーダルを開いた瞬間に移動が残らないよう、キー状態とPointer Lockを解除します。
        pressedKeys.clear();
        controls.unlock();
      }
    },
    dispose() {
      /*
       * Reactのcleanupから呼ばれます。
       * アニメーション、Controls、イベント、GPU資源、canvasの順に全て片付けます。
       */
      isDisposed = true;
      cancelAnimationFrame(animationFrameId);
      controls.disconnect();
      renderer.domElement.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("blur", handleWindowBlur);
      window.removeEventListener("resize", resize);
      disposeObject(scene);
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}
