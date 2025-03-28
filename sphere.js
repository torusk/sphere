// 魅惑的なクリスタルボールを実装するTHREE.jsコード

// シーンの初期化
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0xffffff); // 白い背景色

// 影の設定は無効化
document.body.appendChild(renderer.domElement);

// 環境マップの生成
// HDキュビック環境マップの生成
const cubeRenderTarget = new THREE.WebGLCubeRenderTarget(256);
cubeRenderTarget.texture.type = THREE.HalfFloatType;
const cubeCamera = new THREE.CubeCamera(0.1, 100, cubeRenderTarget);
scene.add(cubeCamera);

// 単一の指向性ライト
// 光源が少ない方が回転したときに立体感がわかりやすい
const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
directionalLight.position.set(1, 1, 1);

// 影の設定を削除

scene.add(directionalLight);

// 弱い環境光
const ambientLight = new THREE.AmbientLight(0x404040, 0.3);
scene.add(ambientLight);

// 背面からの光源を追加して、回転時に輪郭が見えるようにする
const backLight = new THREE.DirectionalLight(0xffffff, 0.7);
backLight.position.set(-1, 0.5, -2);
scene.add(backLight);

// クリスタルボールの内部に霧/綿を追加
function createFog() {
  const fogGeometry = new THREE.SphereGeometry(1.7, 24, 24);
  const fogMaterial = new THREE.MeshStandardMaterial({
    color: 0x5b37a9,     // 紫の霧
    transparent: true,
    opacity: 0.3,
    emissive: 0x5b37a9,  // 微妙な発光
    emissiveIntensity: 0.2,
    side: THREE.DoubleSide
  });
  
  const fog = new THREE.Mesh(fogGeometry, fogMaterial);
  scene.add(fog);
  return fog;
}

// クリスタルボールの作成
function createCrystalBall() {
  // 基本的なジオメトリとマテリアル
  const geometry = new THREE.SphereGeometry(2, 128, 128); // 非常に高いポリゴン数で完璧な球体を表現
  
  // 占い師のクリスタルボール風のマテリアル
  const material = new THREE.MeshPhysicalMaterial({
    color: 0x3a2f5b,       // 神秘的な紫紗色のベース
    metalness: 0.3,        // 金属感を適度に
    roughness: 0.2,        // なめらかな表面
    transmission: 0.95,    // 透過率が高い
    transparent: true,     // 透過を有効化
    ior: 1.5,             // 屈折率
    thickness: 1.0,        // 厚み
    envMapIntensity: 1.5,  // 環境マップの強調
    clearcoat: 1.0,        // クリアコート効果
    clearcoatRoughness: 0.1 // クリアコートの滑らかさ
  });

  // 球体メッシュの作成
  const sphere = new THREE.Mesh(geometry, material);
  
  // 環境マップを設定する
  sphere.material.envMap = cubeRenderTarget.texture;
  
  // 影の設定を削除
  
  scene.add(sphere);
  return sphere;
}

// 球体のインスタンス作成
const crystalBall = createCrystalBall();

// 内部の霧を作成
const innerFog = createFog();

// カメラ位置の設定
camera.position.z = 6;

// 座布団を削除

// アニメーションループ
function animate() {
  requestAnimationFrame(animate);
  
  // クリスタルボールをゆっくり回転させる – すべての軸で回転させて立体感を最大化
  crystalBall.rotation.y += 0.003;
  crystalBall.rotation.x += 0.001;
  crystalBall.rotation.z += 0.0005;
  
  // 内部の霧も少しだけ回転させる（球体より遅く）
  innerFog.rotation.y += 0.001;
  
  // 浮遊感を演出する上下の動き
  const time = Date.now() * 0.001; // 現在時刻を秒単位で取得
  crystalBall.position.y = Math.sin(time * 0.3) * 0.3; // よりゆっくりと大きく上下に浮遊
  innerFog.position.y = crystalBall.position.y; // 内部の霧も一緒に動かす
  
  // 各フレームごとにキューブカメラを更新
  // 球体を一時的に非表示にして環境マップをキャプチャ
  crystalBall.visible = false;
  innerFog.visible = false;
  cubeCamera.update(renderer, scene);
  crystalBall.visible = true;
  innerFog.visible = true;
  
  renderer.render(scene, camera);
}

// レンダリング開始
animate();

// ウィンドウサイズが変更されたときの処理
window.addEventListener('resize', function() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  renderer.setSize(width, height);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
});