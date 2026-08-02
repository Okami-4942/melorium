import * as THREE from "three";

// 色だけを使う単純な材質を作る小さな補助関数です。紙や表紙の端で再利用します。
function createSolidMaterial(color, roughness = 0.9) {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness: 0 });
}

/*
 * 複数のMeshを組み合わせ、一冊の本を表すTHREE.Groupを作ります。
 *
 * この関数はsceneへ直接追加しません。完成したbookをreturnし、
 * 呼び出し元が「表示する」「当たり判定へ登録する」など次の処理を決めます。
 * 引数をオブジェクトで受け取ることで、値の順番ではなく名前を見ながら指定できます。
 */
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
  // 全ての本用テクスチャに共通する色空間・繰り返し・鮮明さの設定です。
  const loadTexture = (url) => {
    const texture = textureLoader.load(url);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
    return texture;
  };

  /*
   * Groupは複数の3Dオブジェクトを一つとして扱う入れ物です。
   * Groupを動かすだけで、ページ・表紙・背表紙をまとめて移動できます。
   */
  const book = new THREE.Group();
  book.name = `book-${songId}`;
  book.position.copy(position);
  book.rotation.copy(rotation);
  // 部屋ごとに本の大きさを再現できるよう、呼び出し側からscaleを受け取ります。
  book.scale.setScalar(scale);

  // 表紙画像の縦横比と背表紙画像の比率から、本の各寸法を計算します。
  const bookWidth = 1.05;
  const bookHeight = bookWidth * (790 / 569);
  const pageDepth = bookHeight * (306 / 1580);
  const boardDepth = 0.04;
  const totalDepth = pageDepth + boardDepth * 2;

  // 同じ形状でも画像を差し替えられるため、曲ごとに別の本を作れます。
  const backTexture = loadTexture(backTextureUrl);
  const coverTexture = loadTexture(coverTextureUrl);
  const spineTexture = loadTexture(spineTextureUrl);
  const baseMaterial = new THREE.MeshStandardMaterial({
    map: backTexture,
    roughness: 0.74,
    metalness: 0,
  });
  /*
   * 表紙デザインはベース色の少し手前へ透明Planeとして重ねます。
   * depthWriteをfalseにし、ほぼ同じ位置の面同士がちらつく現象を抑えています。
   */
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
  // 表紙の縁色も部屋ごとのテーマカラーに合わせて変更できます。
  const coverEdgeMaterial = createSolidMaterial(edgeColor, 0.82);
  const pageMaterial = createSolidMaterial(0xf2ead7);
  const pageEdgeMaterial = createSolidMaterial(0xd6ccb4);

  // 本文ページのかたまりです。BoxGeometryの六面へ別々のMaterialを指定しています。
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

  // 表紙と裏表紙は薄い箱にして、正面以外には表紙端の色を使います。
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

  // 背表紙は本の左側へ置く細い箱です。
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

  // 表紙画像を貼るPlaneを、表紙の表面より0.006だけ手前へ配置します。
  const frontOverlay = new THREE.Mesh(
    new THREE.PlaneGeometry(bookWidth, bookHeight),
    overlayMaterial(coverTexture),
  );
  frontOverlay.position.z = pageDepth / 2 + boardDepth + 0.006;
  book.add(frontOverlay);

  // 背表紙画像はPlaneを90度回し、本の左側面へ合わせます。
  const spineOverlay = new THREE.Mesh(
    new THREE.PlaneGeometry(totalDepth, bookHeight),
    overlayMaterial(spineTexture),
  );
  spineOverlay.rotation.y = -Math.PI / 2;
  spineOverlay.position.x = -bookWidth / 2 - 0.006;
  book.add(spineOverlay);

  /*
   * Groupそのものではなく、Raycasterが実際に当たるのは子のMeshです。
   * そのため全Meshへ曲IDを付け、表紙・ページ・背表紙のどこを見ても同じ曲を取得できるようにします。
   */
  book.traverse((child) => {
    if (!child.isMesh) return;
    child.castShadow = true;
    child.receiveShadow = true;
    child.userData.songId = songId;
  });

  return book;
}
