import * as THREE from "three";
import { PointerLockControls } from "three/addons/controls/PointerLockControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { assets } from "../assets.js";
import CollisionSystem from "./CollisionSystem.js";
import { createBook } from "./createBook.js";

const ROOM_RADIUS = 6.2;
const PLAYER_HEIGHT = 2.6;
const WALK_SPEED = 2.4;
const INTERACTION_DISTANCE = 3;
const DOOR_TRIGGER_DISTANCE = 1.6;




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





export function createMeloriumScene({
  container,
  roomConfig,
  onReady,
  onSelectSong,
  onInteractionChange,
  onChangeRoom,
}) {
  let isTransitioning = false;
  const transitionDoors = [];

  const doorWorldPosition = new THREE.Vector3();

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(roomConfig.backgroundColor);

  const camera = new THREE.PerspectiveCamera(
    roomConfig.cameraFov,
    1,
    0.1,
    1000,
  );

  camera.position.set(0, PLAYER_HEIGHT, 0);
  addCrosshair(camera);
  scene.add(camera);

  let isDisposed = false;

 let isPaused = false;

  let animationFrameId;

  let focusedSongId = null;

  const pressedKeys = new Set();

  const interactableMeshes = [];

  const loadingManager = new THREE.LoadingManager();
  const textureLoader = new THREE.TextureLoader(loadingManager);
  const gltfLoader = new GLTFLoader(loadingManager);

  loadingManager.onError = (url) => {
    console.error(`素材を読み込めませんでした: ${url}`);
  };
  loadingManager.onLoad = () => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (!isDisposed) onReady();
      });
    });
  };

  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    powerPreference: "high-performance",
  });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  container.appendChild(renderer.domElement);

  const controls = new PointerLockControls(camera, renderer.domElement);
  const collisions = new CollisionSystem({
    playerRadius: 0.25,
    playerHeight: PLAYER_HEIGHT,
    roomRadius: ROOM_RADIUS,
  });
  const raycaster = new THREE.Raycaster();
  const clock = new THREE.Clock();
  const movement = new THREE.Vector3();

  addFloor(scene, roomConfig.floorColor);
  addLights(scene);

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

  gltfLoader.load(
    assets.models.door,
    (gltf) => {
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
  if (roomConfig.showTables) {
    gltfLoader.load(
      assets.models.table,
      (gltf) => {
        if (isDisposed) {
          disposeObject(gltf.scene);
          return;
        }

        const tableTexture = textureLoader.load(assets.textures.largoDoor);
        tableTexture.colorSpace = THREE.SRGBColorSpace;
        tableTexture.flipY = false;
        tableTexture.wrapS = THREE.RepeatWrapping;
        tableTexture.wrapT = THREE.RepeatWrapping;
        tableTexture.repeat.set(1, 3);

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
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
  };


  const updateFocusedBook = () => {
    let nextSongId = null;

    if (controls.isLocked && !isPaused) {
      raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);

      const hit = raycaster.intersectObjects(interactableMeshes, false)[0];

      if (hit && hit.distance <= INTERACTION_DISTANCE) {
        nextSongId = hit.object.userData.songId;
      }
    }

    if (focusedSongId === nextSongId) return;
    focusedSongId = nextSongId;
    onInteractionChange(nextSongId ? "Fキーで開く" : "");
  };

  const checkDoorTransition = () => {
    if (isPaused || isTransitioning || !controls.isLocked) return;

    for (const door of transitionDoors) {
      door.object.getWorldPosition(doorWorldPosition);
      const distance = Math.hypot(
        camera.position.x - doorWorldPosition.x,
        camera.position.z - doorWorldPosition.z,
      );

      if (distance <= DOOR_TRIGGER_DISTANCE) {
        isTransitioning = true;
        pressedKeys.clear();
        controls.unlock();
        onChangeRoom(door.destinationRoomId);
        return;
      }
    }
  };


  const renderFrame = () => {
    animationFrameId = requestAnimationFrame(renderFrame);

    const deltaSeconds = Math.min(clock.getDelta(), 0.05);

    if (controls.isLocked && !isPaused) {
      movement.set(0, 0, 0);
      if (pressedKeys.has("KeyW")) movement.z += 1;
      if (pressedKeys.has("KeyS")) movement.z -= 1;
      if (pressedKeys.has("KeyA")) movement.x -= 1;
      if (pressedKeys.has("KeyD")) movement.x += 1;
      movement.normalize().multiplyScalar(WALK_SPEED * deltaSeconds);
      controls.moveRight(movement.x);
      controls.moveForward(movement.z);
      collisions.resolve(camera.position);
    }

    checkDoorTransition();
    updateFocusedBook();
    renderer.render(scene, camera);
  };

  const handlePointerDown = () => {
    if (!isPaused && !controls.isLocked) controls.lock();
  };
  const handleKeyDown = (event) => {
    pressedKeys.add(event.code);

    if (event.code === "KeyF" && !event.repeat && focusedSongId && !isPaused) {
      onInteractionChange("");
      controls.unlock();
      onSelectSong(focusedSongId);
    }
  };
  const handleKeyUp = (event) => pressedKeys.delete(event.code);
  const handleWindowBlur = () => pressedKeys.clear();

  renderer.domElement.addEventListener("pointerdown", handlePointerDown);
  window.addEventListener("keydown", handleKeyDown);
  window.addEventListener("keyup", handleKeyUp);
  window.addEventListener("blur", handleWindowBlur);
  window.addEventListener("resize", resize);
  resize();
  renderFrame();

  return {
    setPaused(nextIsPaused) {
      isPaused = nextIsPaused;
      if (isPaused) {
        pressedKeys.clear();
        controls.unlock();
      }
    },
    dispose() {
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
