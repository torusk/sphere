// 魅惑的なクリスタルボールを実装するTHREE.jsコード

// シーンの初期化
let timerMesh; // タイマー表示用のメッシュ
let timerVisible = true; // タイマーの表示/非表示状態
let lastBlinkTime = 0; // 最後に点滅した時間
let countdownActive = false; // カウントダウン状態
let countdownSeconds = 15 * 60; // 15分 = 900秒
let lastCountdownUpdate = 0; // 最後にカウントダウンを更新した時間
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x000000, 0); // 背景を完全に透明に

document.body.appendChild(renderer.domElement);
renderer.domElement.id = 'sphere-canvas';

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
  const fogGeometry = new THREE.SphereGeometry(1.36, 24, 24); // 球体のを80%サイズに合わせて内部の霧も小さく調整 (1.7 * 0.8 = 1.36)
  const fogMaterial = new THREE.MeshStandardMaterial({
    color: 0xFFFFFF,     // 白色の内部発光
    transparent: true,
    opacity: 0.15,        // より透明に
    emissive: 0xFFFFFF,  // 白色の発光
    emissiveIntensity: 0.6, // 発光強度を上げる
    side: THREE.DoubleSide
  });
  
  const fog = new THREE.Mesh(fogGeometry, fogMaterial);
  scene.add(fog);
  return fog;
}

// クリスタルボールの作成
function createCrystalBall() {
  // 基本的なジオメトリとマテリアル
  const geometry = new THREE.SphereGeometry(1.6, 128, 128); // 球体のサイズを80%に縮小（2.0 * 0.8 = 1.6）
  
  // クリスタルボール風のマテリアル - メタリックシルバー
  const material = new THREE.MeshPhysicalMaterial({
    color: 0xC0C0C0,       // シルバーカラー
    metalness: 0.9,        // 高い金属感
    roughness: 0.05,       // 非常になめらかな表面
    transmission: 0.8,     // 透過率を調整
    transparent: true,     // 透過を有効化
    ior: 2.0,             // 高い屈折率
    thickness: 0.5,        // 厚み
    envMapIntensity: 2.0,  // 環境マップの強調を上げる
    clearcoat: 1.0,        // クリアコート効果
    clearcoatRoughness: 0.02, // より滑らかなクリアコート
    reflectivity: 1.0,     // 反射率を上げる
  });

  // 球体メッシュの作成
  const sphere = new THREE.Mesh(geometry, material);
  
  // 環境マップを設定する
  sphere.material.envMap = cubeRenderTarget.texture;
  
  scene.add(sphere);
  return sphere;
}

// 球体のインスタンス作成
const crystalBall = createCrystalBall();

// 内部の霧を作成
const innerFog = createFog();

// エッジライトを作成
function createEdgeLight() {
  // エッジライト用のリング形状
  const edgeGeometry = new THREE.TorusGeometry(1.61, 0.02, 30, 100);
  const edgeMaterial = new THREE.MeshBasicMaterial({ 
    color: 0xFFFFFF,
    transparent: true,
    opacity: 0.8
  });
  
  const edgeLight = new THREE.Mesh(edgeGeometry, edgeMaterial);
  scene.add(edgeLight);
  return edgeLight;
}

// エッジライトのインスタンス作成
const edgeLight = createEdgeLight();

// カメラ位置の設定
camera.position.z = 6;

// デジタル表示用テキストを作成する関数
function createTimerDisplay() {
  // Canvas要素の作成
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const context = canvas.getContext('2d');
  
  // 背景を透明に
  context.clearRect(0, 0, canvas.width, canvas.height);
  
  // デジタルな数字を描画する関数
  function drawDigitalNumber(x, y, width, height, segments) {
    const segmentWidth = width * 0.15;
    const segmentColor = 'rgba(255, 255, 255, 0.8)';
    
    // セグメント配置（電卓風の7セグメント）
    if (segments[0]) { // 上
      context.fillStyle = segmentColor;
      context.fillRect(x + segmentWidth, y, width - 2 * segmentWidth, segmentWidth);
    }
    if (segments[1]) { // 右上
      context.fillStyle = segmentColor;
      context.fillRect(x + width - segmentWidth, y, segmentWidth, height / 2);
    }
    if (segments[2]) { // 右下
      context.fillStyle = segmentColor;
      context.fillRect(x + width - segmentWidth, y + height / 2, segmentWidth, height / 2 - segmentWidth);
    }
    if (segments[3]) { // 下
      context.fillStyle = segmentColor;
      context.fillRect(x + segmentWidth, y + height - segmentWidth, width - 2 * segmentWidth, segmentWidth);
    }
    if (segments[4]) { // 左下
      context.fillStyle = segmentColor;
      context.fillRect(x, y + height / 2, segmentWidth, height / 2 - segmentWidth);
    }
    if (segments[5]) { // 左上
      context.fillStyle = segmentColor;
      context.fillRect(x, y, segmentWidth, height / 2);
    }
    if (segments[6]) { // 中央
      context.fillStyle = segmentColor;
      context.fillRect(x + segmentWidth, y + height / 2 - segmentWidth / 2, width - 2 * segmentWidth, segmentWidth);
    }
  }
  
  // 数字のセグメントパターン
  const digitPatterns = {
    '0': [true, true, true, true, true, true, false],
    '1': [false, true, true, false, false, false, false],
    '2': [true, true, false, true, true, false, true],
    '3': [true, true, true, true, false, false, true],
    '4': [false, true, true, false, false, true, true],
    '5': [true, false, true, true, false, true, true],
    '6': [true, false, true, true, true, true, true],
    '7': [true, true, true, false, false, false, false],
    '8': [true, true, true, true, true, true, true],
    '9': [true, true, true, true, false, true, true],
    ':': [false, false, false, false, false, false, false]
  };
  
  // デジタル時計の描画
  const timeString = '15:00';
  const digitWidth = 60;  // 50% 大きくした幅
  const digitHeight = 120; // 50% 大きくした高さ
  const spacing = 20;     // 数字間のスペース
  
  let currentX = (canvas.width - (digitWidth * 5 + spacing * 2)) / 2;
  
  // 各文字を描画
  for (let i = 0; i < timeString.length; i++) {
    const char = timeString[i];
    if (char === ':') {
      // コロンの代わりに2つの点を描画
      context.fillStyle = 'rgba(255, 255, 255, 0.8)';
      context.beginPath();
      context.arc(currentX + digitWidth / 2, canvas.height / 2 - digitHeight / 4, digitWidth / 6, 0, Math.PI * 2);
      context.fill();
      context.beginPath();
      context.arc(currentX + digitWidth / 2, canvas.height / 2 + digitHeight / 4, digitWidth / 6, 0, Math.PI * 2);
      context.fill();
      currentX += digitWidth;
    } else {
      drawDigitalNumber(currentX, (canvas.height - digitHeight) / 2, digitWidth, digitHeight, digitPatterns[char]);
      currentX += digitWidth + spacing;
    }
  }
  
  // テクスチャ作成
  const texture = new THREE.CanvasTexture(canvas);
  
  // マテリアル作成
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    side: THREE.DoubleSide
  });
  
  // 50%大きくしたサイズ
  const geometry = new THREE.PlaneGeometry(1.8, 0.9);
  const mesh = new THREE.Mesh(geometry, material);
  
  // 球体の表面に配置（球体の半径が1.6なので、表面は1.59付近に配置）
  mesh.position.z = 1.59;
  
  scene.add(mesh);
  return { mesh, canvas, context };
}

// デジタル表示の更新関数
function updateTimerDisplay(timeString) {
  const { context, canvas } = timerMesh;
  
  // キャンバスをクリア
  context.clearRect(0, 0, canvas.width, canvas.height);
  
  // デジタルな数字を描画する関数
  function drawDigitalNumber(x, y, width, height, segments) {
    const segmentWidth = width * 0.15;
    const segmentColor = 'rgba(255, 255, 255, 0.8)';
    
    // セグメント配置
    if (segments[0]) { // 上
      context.fillStyle = segmentColor;
      context.fillRect(x + segmentWidth, y, width - 2 * segmentWidth, segmentWidth);
    }
    if (segments[1]) { // 右上
      context.fillStyle = segmentColor;
      context.fillRect(x + width - segmentWidth, y, segmentWidth, height / 2);
    }
    if (segments[2]) { // 右下
      context.fillStyle = segmentColor;
      context.fillRect(x + width - segmentWidth, y + height / 2, segmentWidth, height / 2 - segmentWidth);
    }
    if (segments[3]) { // 下
      context.fillStyle = segmentColor;
      context.fillRect(x + segmentWidth, y + height - segmentWidth, width - 2 * segmentWidth, segmentWidth);
    }
    if (segments[4]) { // 左下
      context.fillStyle = segmentColor;
      context.fillRect(x, y + height / 2, segmentWidth, height / 2 - segmentWidth);
    }
    if (segments[5]) { // 左上
      context.fillStyle = segmentColor;
      context.fillRect(x, y, segmentWidth, height / 2);
    }
    if (segments[6]) { // 中央
      context.fillStyle = segmentColor;
      context.fillRect(x + segmentWidth, y + height / 2 - segmentWidth / 2, width - 2 * segmentWidth, segmentWidth);
    }
  }
  
  // 数字のセグメントパターン
  const digitPatterns = {
    '0': [true, true, true, true, true, true, false],
    '1': [false, true, true, false, false, false, false],
    '2': [true, true, false, true, true, false, true],
    '3': [true, true, true, true, false, false, true],
    '4': [false, true, true, false, false, true, true],
    '5': [true, false, true, true, false, true, true],
    '6': [true, false, true, true, true, true, true],
    '7': [true, true, true, false, false, false, false],
    '8': [true, true, true, true, true, true, true],
    '9': [true, true, true, true, false, true, true],
    ':': [false, false, false, false, false, false, false]
  };
  
  // デジタル時計の描画
  const digitWidth = 60;
  const digitHeight = 120;
  const spacing = 20;
  
  let currentX = (canvas.width - (digitWidth * 5 + spacing * 2)) / 2;
  
  // 各文字を描画
  for (let i = 0; i < timeString.length; i++) {
    const char = timeString[i];
    if (char === ':') {
      // コロンの代わりに2つの点を描画
      context.fillStyle = 'rgba(255, 255, 255, 0.8)';
      context.beginPath();
      context.arc(currentX + digitWidth / 2, canvas.height / 2 - digitHeight / 4, digitWidth / 6, 0, Math.PI * 2);
      context.fill();
      context.beginPath();
      context.arc(currentX + digitWidth / 2, canvas.height / 2 + digitHeight / 4, digitWidth / 6, 0, Math.PI * 2);
      context.fill();
      currentX += digitWidth;
    } else {
      drawDigitalNumber(currentX, (canvas.height - digitHeight) / 2, digitWidth, digitHeight, digitPatterns[char]);
      currentX += digitWidth + spacing;
    }
  }
  
  // テクスチャを更新
  timerMesh.mesh.material.map.needsUpdate = true;
}

// タイマーの点滅処理
function blinkTimer() {
  const currentTime = Date.now();
  
  // 500ミリ秒ごとに点滅
  if (currentTime - lastBlinkTime > 500) {
    timerVisible = !timerVisible;
    timerMesh.mesh.visible = timerVisible;
    lastBlinkTime = currentTime;
  }
}

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
  edgeLight.position.y = crystalBall.position.y; // エッジライトも一緒に動かす
  
  // エッジライトの色と不透明度を脱色させて点滅させる
  const pulseValue = (Math.sin(time * 2) + 1) / 2; // 0から1の値
  edgeLight.material.opacity = 0.5 + pulseValue * 0.5; // 0.5から1.0のあいだで変化
  edgeLight.material.color.setHSL(pulseValue * 0.1, 0.5, 0.7); // 色相を微妙に変化
  
  // エッジライトの回転を球体と同期させる
  edgeLight.rotation.x = crystalBall.rotation.x;
  edgeLight.rotation.y = crystalBall.rotation.y;
  edgeLight.rotation.z = crystalBall.rotation.z;
  
  // カウントダウン中なら点滅、そうでなければ通常表示
  if (countdownActive) {
    blinkTimer();
    updateCountdown();
  } else {
    timerMesh.mesh.visible = true;
  }
  
  // タイマーが球体と一緒に回転するように設定（球体表面に固定）
  if (timerMesh && timerMesh.mesh) {
    // 球体と同じ回転を適用
    timerMesh.mesh.rotation.x = crystalBall.rotation.x;
    timerMesh.mesh.rotation.y = crystalBall.rotation.y;
    timerMesh.mesh.rotation.z = crystalBall.rotation.z;
    
    // 球体が上下に動くと一緒に動く
    timerMesh.mesh.position.y = crystalBall.position.y;
  }
  
  // 各フレームごとにキューブカメラを更新
  // 球体を一時的に非表示にして環境マップをキャプチャ
  crystalBall.visible = false;
  innerFog.visible = false;
  cubeCamera.update(renderer, scene);
  crystalBall.visible = true;
  innerFog.visible = true;
  
  renderer.render(scene, camera);
}

// タイマー表示の作成
const timerObject = createTimerDisplay();
timerMesh = {
  mesh: timerObject.mesh,
  canvas: timerObject.canvas,
  context: timerObject.context
};

// タッチイベントの追加
renderer.domElement.addEventListener('click', function() {
  if (!countdownActive) {
    countdownActive = true;
    lastCountdownUpdate = Date.now();
    // 1秒間点滅させる
    let blinkCount = 0;
    const initialBlinkInterval = setInterval(() => {
      timerVisible = !timerVisible;
      timerMesh.mesh.visible = timerVisible;
      blinkCount++;
      if (blinkCount >= 4) { // 2回点滅 (4回切り替え)
        clearInterval(initialBlinkInterval);
        timerVisible = true;
        timerMesh.mesh.visible = true;
      }
    }, 250); // 250msで点滅
  }
});

// カウントダウン処理関数
function updateCountdown() {
  if (!countdownActive) return;
  
  const currentTime = Date.now();
  // 1秒ごとにカウントダウン更新
  if (currentTime - lastCountdownUpdate >= 1000) {
    countdownSeconds--;
    if (countdownSeconds <= 0) {
      countdownSeconds = 0;
      countdownActive = false;
    }
    
    // 時間表示を更新
    const minutes = Math.floor(countdownSeconds / 60);
    const seconds = countdownSeconds % 60;
    const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    updateTimerDisplay(timeString);
    
    lastCountdownUpdate = currentTime;
  }
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