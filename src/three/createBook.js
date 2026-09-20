import * as THREE from "three";

function createSolidMaterial(color, roughness = 0.9) {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness: 0 });
}

export function createBook({
  textureLoader,
  renderer,
  backTextureUrl,
  coverTextureUrl,
  spineTextureUrl,
  position,
  rotation,
  songId,
  scale = 0.7,
  edgeColor = 0x1b2f23,
}) {
  const loadTexture = (url) => {
    const texture = textureLoader.load(url);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
    return texture;
  };

  const book = new THREE.Group();
  book.name = `book-${songId}`;
  book.position.copy(position);
  book.rotation.copy(rotation);
  book.scale.setScalar(scale);

  const bookWidth = 1.05;
  const bookHeight = bookWidth * (790 / 569);
  const pageDepth = bookHeight * (306 / 1580);
  const boardDepth = 0.04;
  const totalDepth = pageDepth + boardDepth * 2;
  const backTexture = loadTexture(backTextureUrl);
  const coverTexture = loadTexture(coverTextureUrl);
  const spineTexture = loadTexture(spineTextureUrl);
  const baseMaterial = new THREE.MeshStandardMaterial({
    map: backTexture,
    roughness: 0.74,
    metalness: 0,
  });
  const overlayMaterial = (texture) =>
    new THREE.MeshPhysicalMaterial({
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
  const coverEdgeMaterial = createSolidMaterial(edgeColor, 0.82);
  const pageMaterial = createSolidMaterial(0xf2ead7);
  const pageEdgeMaterial = createSolidMaterial(0xd6ccb4);

  const pageBlock = new THREE.Mesh(
    new THREE.BoxGeometry(bookWidth - boardDepth * 1.7, bookHeight - 0.08, pageDepth),
    [
      pageMaterial,
      coverEdgeMaterial,
      pageEdgeMaterial,
      pageEdgeMaterial,
      pageMaterial,
      pageMaterial,
    ],
  );
  pageBlock.position.x = boardDepth * 0.35;
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
    ],
  );
  frontCover.position.z = pageDepth / 2 + boardDepth / 2;
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
    ],
  );
  backCover.position.z = -pageDepth / 2 - boardDepth / 2;
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
    ],
  );
  spine.position.x = -bookWidth / 2 + boardDepth / 2;
  book.add(spine);
  const frontOverlay = new THREE.Mesh(
    new THREE.PlaneGeometry(bookWidth, bookHeight),
    overlayMaterial(coverTexture),
  );
  frontOverlay.position.z = pageDepth / 2 + boardDepth + 0.006;
  book.add(frontOverlay);
  const spineOverlay = new THREE.Mesh(
    new THREE.PlaneGeometry(totalDepth, bookHeight),
    overlayMaterial(spineTexture),
  );
  spineOverlay.rotation.y = -Math.PI / 2;
  spineOverlay.position.x = -bookWidth / 2 - 0.006;
  book.add(spineOverlay);
  book.traverse((child) => {
    if (!child.isMesh) return;
    child.castShadow = true;
    child.receiveShadow = true;
    child.userData.songId = songId;
  });

  return book;
}
