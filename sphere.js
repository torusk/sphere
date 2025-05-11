// 魅惑的なクリスタルボールを実装するTHREE.jsコード

// シーンの初期化 (★グローバルスコープの先頭近くに配置)
const scene = new THREE.Scene();

// タイマー関連変数
let timerMesh; // タイマー表示用のメッシュ (THREE.MeshオブジェクトとCanvas情報を含むオブジェクト)
let timerVisible = true; // タイマーの表示/非表示状態
let lastBlinkTime = 0; // 最後に点滅した時間

// ポモドーロ設定と状態管理 (★重要部分)
let countdownActive = false; // タイマーが動作中か
let workDuration = 25 * 60; // 25分 (秒単位)
let breakDuration = 5 * 60; // 5分 (秒単位)
let countdownSeconds = workDuration; // 現在の残り時間 (初期値は作業時間)
let isWorkTime = true; // 現在が作業時間か (true:作業, false:休憩)
let lastCountdownUpdate = Date.now(); // 最後にカウントダウンを更新した時刻 (Date.now()で初期化)
let hasPlayedSound = false; // アラーム音の再生管理

// Three.js カメラ、レンダラー
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x000000, 0); // 背景を完全に透明に

document.body.appendChild(renderer.domElement);
renderer.domElement.id = "sphere-canvas"; // CSSで z-index を設定するため

// 環境マップの生成
const cubeRenderTarget = new THREE.WebGLCubeRenderTarget(256);
cubeRenderTarget.texture.type = THREE.HalfFloatType;
const cubeCamera = new THREE.CubeCamera(0.1, 100, cubeRenderTarget);
scene.add(cubeCamera);

// ライト設定
const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
directionalLight.position.set(1, 1, 1);
scene.add(directionalLight);

const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x404040, 1.0);
scene.add(hemisphereLight);

const frontLight = new THREE.DirectionalLight(0xffffff, 2.0);
frontLight.position.set(0, 0, 5);
scene.add(frontLight);

const spotLight1 = new THREE.SpotLight(0xffffff, 1.0);
spotLight1.position.set(-5, 5, 2);
spotLight1.angle = Math.PI / 6;
scene.add(spotLight1);

const spotLight2 = new THREE.SpotLight(0xffffff, 1.0);
spotLight2.position.set(5, 5, 2);
spotLight2.angle = Math.PI / 6;
scene.add(spotLight2);

// クリスタルボールの内部に霧/綿を追加
function createFog() {
  const fogGeometry = new THREE.SphereGeometry(1.36, 24, 24);
  const fogMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.2,
    emissive: 0xffffff,
    emissiveIntensity: 0.8,
    side: THREE.DoubleSide,
  });
  const fog = new THREE.Mesh(fogGeometry, fogMaterial);
  scene.add(fog);
  return fog;
}

// クリスタルボールの作成
function createCrystalBall() {
  const geometry = new THREE.SphereGeometry(1.6, 128, 128);
  const material = new THREE.MeshPhysicalMaterial({
    color: 0xe0e0e0,
    metalness: 0.8,
    roughness: 0.1,
    transmission: 0.2,
    transparent: true,
    ior: 1.8,
    thickness: 0.5,
    envMapIntensity: 3.0,
    clearcoat: 1.0,
    clearcoatRoughness: 0.03,
    reflectivity: 1.0,
    emissive: 0x333333,
    emissiveIntensity: 0.2,
    envMap: cubeRenderTarget.texture, // 環境マップを設定
  });
  const sphere = new THREE.Mesh(geometry, material);
  scene.add(sphere);
  return sphere;
}

// エッジライトを作成
function createEdgeLight() {
  const edgeGeometry = new THREE.TorusGeometry(1.61, 0.03, 30, 100);
  const edgeMaterial = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.9,
  });
  const edgeLight = new THREE.Mesh(edgeGeometry, edgeMaterial);

  const glowGeometry = new THREE.TorusGeometry(1.61, 0.08, 30, 100);
  const glowMaterial = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.5,
  });
  const glowRing = new THREE.Mesh(glowGeometry, glowMaterial);
  edgeLight.add(glowRing);
  scene.add(edgeLight);
  return edgeLight;
}

// 球体、霧、エッジライトのインスタンス作成
const crystalBall = createCrystalBall();
const innerFog = createFog();
const edgeLight = createEdgeLight();

camera.position.z = 6;

// 数字のセグメントパターン (グローバルスコープまたは createTimerDisplay/updateTimerDisplay 内でアクセス可能に)
const digitPatterns = {
  0: [true, true, true, true, true, true, false],
  1: [false, true, true, false, false, false, false],
  2: [true, true, false, true, true, false, true],
  3: [true, true, true, true, false, false, true],
  4: [false, true, true, false, false, true, true],
  5: [true, false, true, true, false, true, true],
  6: [true, false, true, true, true, true, true],
  7: [true, true, true, false, false, false, false],
  8: [true, true, true, true, true, true, true],
  9: [true, true, true, true, false, true, true],
  ":": [false, false, false, false, false, false, false], // コロンは特別扱い
};

// デジタルな数字を描画する共通関数
function drawDigitalTime(context, canvas, timeString) {
  context.clearRect(0, 0, canvas.width, canvas.height); // 描画前にクリア

  const digitWidth = 60;
  const digitHeight = 120;
  const spacing = 20;
  // MM:SS形式 (5文字) を前提とした中央揃え計算
  let currentX =
    (canvas.width -
      (digitWidth * 5 + spacing * (2 - 1) + digitWidth * 0.5)) /*コロン分*/ /
    2;
  // より正確な中央揃え (文字数とコロンの数で動的に計算する場合)
  let totalWidth = 0;
  for (let i = 0; i < timeString.length; i++) {
    if (timeString[i] === ":")
      totalWidth += digitWidth * 0.5; // コロンは半分の幅と仮定
    else totalWidth += digitWidth;
    if (i < timeString.length - 1) totalWidth += spacing;
  }
  currentX = (canvas.width - totalWidth) / 2;

  for (let i = 0; i < timeString.length; i++) {
    const char = timeString[i];
    if (char === ":") {
      context.fillStyle = "rgba(255, 255, 255, 0.8)";
      context.beginPath();
      context.arc(
        currentX + (digitWidth * 0.5) / 2,
        canvas.height / 2 - digitHeight / 4,
        digitWidth / 6,
        0,
        Math.PI * 2
      );
      context.fill();
      context.beginPath();
      context.arc(
        currentX + (digitWidth * 0.5) / 2,
        canvas.height / 2 + digitHeight / 4,
        digitWidth / 6,
        0,
        Math.PI * 2
      );
      context.fill();
      currentX += digitWidth * 0.5 + spacing; // コロンの幅とスペーシング
    } else {
      drawSingleDigitalNumber(
        context,
        currentX,
        (canvas.height - digitHeight) / 2,
        digitWidth,
        digitHeight,
        digitPatterns[char]
      );
      currentX += digitWidth + spacing;
    }
  }
}

// 1つのデジタル数字を描画するヘルパー関数
function drawSingleDigitalNumber(context, x, y, width, height, segments) {
  const segmentWidth = width * 0.15;
  const segmentColor = "rgba(255, 255, 255, 0.8)";
  if (segments[0])
    context.fillRect(
      x + segmentWidth,
      y,
      width - 2 * segmentWidth,
      segmentWidth
    ); // Top
  if (segments[1])
    context.fillRect(x + width - segmentWidth, y, segmentWidth, height / 2); // TopRight
  if (segments[2])
    context.fillRect(
      x + width - segmentWidth,
      y + height / 2,
      segmentWidth,
      height / 2 - segmentWidth
    ); // BottomRight ( adjusted to avoid overlap with bottom segment)
  if (segments[3])
    context.fillRect(
      x + segmentWidth,
      y + height - segmentWidth,
      width - 2 * segmentWidth,
      segmentWidth
    ); // Bottom
  if (segments[4])
    context.fillRect(
      x,
      y + height / 2,
      segmentWidth,
      height / 2 - segmentWidth
    ); // BottomLeft (adjusted)
  if (segments[5]) context.fillRect(x, y, segmentWidth, height / 2); // TopLeft
  if (segments[6])
    context.fillRect(
      x + segmentWidth,
      y + height / 2 - segmentWidth / 2,
      width - 2 * segmentWidth,
      segmentWidth
    ); // Middle
}

// デジタル表示用テキストを最初に作成する関数 (★初期表示を "25:00" または workDuration から動的に)
function createTimerDisplay() {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 256;
  const context = canvas.getContext("2d");

  const initialMinutes = Math.floor(workDuration / 60);
  const initialSeconds = workDuration % 60;
  const timeString = `${initialMinutes
    .toString()
    .padStart(2, "0")}:${initialSeconds.toString().padStart(2, "0")}`;
  // または const timeString = "25:00";

  drawDigitalTime(context, canvas, timeString); // 共通描画関数を使用

  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    side: THREE.DoubleSide,
  });
  const geometry = new THREE.PlaneGeometry(1.8, 0.9); // サイズは適宜調整
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.z = 1.59; // 球体の表面に配置
  scene.add(mesh);
  return { mesh, canvas, context }; // context と canvas も返す
}

// デジタル表示の更新関数
function updateTimerDisplay(timeString) {
  if (!timerMesh || !timerMesh.context || !timerMesh.canvas) return;
  drawDigitalTime(timerMesh.context, timerMesh.canvas, timeString); // 共通描画関数を使用
  timerMesh.mesh.material.map.needsUpdate = true;
}

// タイマー表示の作成とグローバル変数への代入
const timerDisplayObject = createTimerDisplay();
timerMesh = {
  // timerMeshを正しくオブジェクトとして初期化
  mesh: timerDisplayObject.mesh,
  canvas: timerDisplayObject.canvas,
  context: timerDisplayObject.context,
};

// タイマーの点滅処理
function blinkTimer() {
  const currentTime = Date.now();
  if (currentTime - lastBlinkTime > 500) {
    // 500ミリ秒ごとに点滅
    timerVisible = !timerVisible;
    if (timerMesh && timerMesh.mesh) {
      timerMesh.mesh.visible = timerVisible;
    }
    lastBlinkTime = currentTime;
  }
}

// アニメーションループ (★updateCountdownの呼び出し確認)
function animate() {
  requestAnimationFrame(animate);

  crystalBall.rotation.y += 0.003;
  crystalBall.rotation.x += 0.001;
  crystalBall.rotation.z += 0.0005;
  innerFog.rotation.y += 0.001;

  const time = Date.now() * 0.001;
  crystalBall.position.y = Math.sin(time * 0.3) * 0.3;
  innerFog.position.y = crystalBall.position.y;
  edgeLight.position.y = crystalBall.position.y;

  const pulseValue = (Math.sin(time * 2) + 1) / 2;
  edgeLight.material.opacity = 0.5 + pulseValue * 0.5;
  edgeLight.material.color.setHSL(pulseValue * 0.1, 0.5, 0.7);
  edgeLight.rotation.x = crystalBall.rotation.x;
  edgeLight.rotation.y = crystalBall.rotation.y;
  edgeLight.rotation.z = crystalBall.rotation.z;

  if (countdownActive) {
    blinkTimer();
    updateCountdown(); // ★カウントダウンロジックを呼び出す
  } else {
    if (timerMesh && timerMesh.mesh) {
      timerMesh.mesh.visible = true; // 非アクティブ時は常に表示
    }
  }

  if (timerMesh && timerMesh.mesh) {
    timerMesh.mesh.rotation.x = crystalBall.rotation.x;
    timerMesh.mesh.rotation.y = crystalBall.rotation.y;
    timerMesh.mesh.rotation.z = crystalBall.rotation.z;
    timerMesh.mesh.position.y = crystalBall.position.y;
  }

  crystalBall.visible = false;
  innerFog.visible = false;
  cubeCamera.update(renderer, scene);
  crystalBall.visible = true;
  innerFog.visible = true;

  renderer.render(scene, camera);
}

// (音声関連、スリープ防止関連の関数は変更なしと仮定。前回のコードを参照)
// タイマー音声の準備
let timerAudio = null;
let audioInitialized = false;
// hasPlayedSound はグローバルで宣言済み

// Androidスリープ防止用変数
let wakeLock = null;
let isWakeLockSupported = false;

// スリープ防止機能の確認と初期化
function checkWakeLockSupport() {
  if ("wakeLock" in navigator) {
    isWakeLockSupported = true;
    console.log("スリープ防止機能がサポートされています");
  } else {
    isWakeLockSupported = false;
    console.log(
      "スリープ防止機能はサポートされていません。代替手段を使用します。"
    );
  }
}

// スリープ防止機能を有効化
async function acquireWakeLock() {
  if (isWakeLockSupported) {
    try {
      if (wakeLock) {
        // 既存のWakeLockがあれば解放
        await wakeLock.release(); // await を追加
        wakeLock = null;
      }
      wakeLock = await navigator.wakeLock.request("screen");
      console.log("スリープ防止が有効化されました");
      wakeLock.addEventListener("release", () => {
        console.log("スリープ防止が解除されました (イベント)");
        // countdownActive の状態に応じて再取得を試みる
        if (countdownActive) {
          console.log("タイマー作動中のため、スリープ防止を再取得します。");
          acquireWakeLock();
        }
      });
      return true;
    } catch (error) {
      console.error(
        "スリープ防止の取得に失敗しました:",
        error.name,
        error.message
      );
      return false;
    }
  } else {
    startNoSleepAnimation(); // 代替手段
    return true;
  }
}

// スリープ防止を解除
async function releaseWakeLock() {
  if (isWakeLockSupported && wakeLock) {
    try {
      await wakeLock.release();
      wakeLock = null;
      console.log("スリープ防止が明示的に解除されました");
      return true;
    } catch (error) {
      console.error(
        "スリープ防止の解除に失敗しました:",
        error.name,
        error.message
      );
      return false;
    }
  } else {
    stopNoSleepAnimation(); // 代替手段の停止
    return true;
  }
}

// WakeLock APIが利用できない場合の代替手段 (NoSleep.jsのような動作)
let noSleepTimerInterval = null;
let noSleepVideoElement = null;

function startNoSleepAnimation() {
  if (noSleepVideoElement) return; // 既に開始されていれば何もしない
  try {
    noSleepVideoElement = document.createElement("video");
    noSleepVideoElement.setAttribute("playsinline", "");
    noSleepVideoElement.setAttribute("muted", "");
    noSleepVideoElement.setAttribute("loop", "");
    noSleepVideoElement.style.cssText =
      "position:absolute;left:-10000px;top:-10000px;width:1px;height:1px;opacity:0.01;";
    // 小さなインラインビデオデータ (再生可能であれば何でも良い)
    noSleepVideoElement.src =
      "data:video/mp4;base64,AAAAHGZ0eXBtcDQyAAAAAG1wNDJpc29tYXZjMQAAAzRtb292AAAAbG12aGQAAAAAzaNzzM2jc8wAAH0AAANcAAEAAAEAAAAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgAAAnh0cmFrAAAAXHRraGQAAAAA8AAAADNVOAAAAAEAAAAAAANcAAAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAQAAAAAAIAAAACAAAAAABsW1kaWEAAAAgbWRoZAAAAADNVOczNVOc0AAH0AAANcAFXEAAAAAAAQoaGRscgAAAAAAAAAAdmlkZQAAAAAAAAAAAAAAAApWaWRlb0hhbmRsZXIAAAACNm1pbmYAAAAUdm1oZAAAAAEAAAAAAAAAAAAAACRkaW5mAAAAHGRyZWYAAAAAAAAAAQAAAAx1cmwgAAAAAQAAASpzdGJsAAAAZHN0c2QAAAAAAAAAAQAAAGZhdmMxQRhIGEAAAAAAAgACABYAAAAAACAAIAAAAAAAACAAAAAAAAAAAAAAAAAAAADAAAAAAAAAAAAAAAAAAAAAAAAGF2Y0MBTMAH//gAGNmNmMNAKNAL8//AAAABGJTUkGAAGIAAAAYgAADAEAAAAAAAGAEGAEGAEGAAEAAAAAAgAAAAAADAEAAAAAAAAAIgBmdGFzAAAAAAAABAAAAAFhQEFDAAAAFHN0dHMAAAAAAAAAAgAAAAIAAQAAAAEAAAMkY29fZwAAAEhkYXRhAAAAAQAAAAYAAANkAQAAAPgAAAEuAAAAAQAAAAYAAANkAQAAAPgAAAEuAAAAc3RzcwAAAAAAAAABAAAAAQAAABRzdHNjAAAAAAAAAAEAAAABAAAAAgAAAAEAAABMc3RzegAAAAAAAAAAAAAAAQAAAAYAAANkAQAAAPgAAAEuAAAAAQAAGHN0Y28AAAAAAAAAAQAAACYAAABIdWR0YQAAACxtZXRhAAAAAAAAACFoZGxyAAAAAAAAAABtZGlyYXBwbAAAAAAAAAAAAAAAAC1pbHN0AAAAJal0b28AAAAdZGF0YQAAAAEAAAAATGF2ZjU3LjQxLjEwMA==";

    document.body.appendChild(noSleepVideoElement);
    const playPromise = noSleepVideoElement.play();
    if (playPromise !== undefined) {
      playPromise.catch((error) =>
        console.warn("NoSleepビデオ再生失敗(無視可能):", error)
      );
    }
    console.log("スリープ防止代替手段 (ビデオ) 開始");
  } catch (e) {
    console.error("NoSleepビデオ作成エラー:", e);
  }
}

function stopNoSleepAnimation() {
  if (noSleepVideoElement) {
    noSleepVideoElement.pause();
    if (noSleepVideoElement.parentNode) {
      noSleepVideoElement.parentNode.removeChild(noSleepVideoElement);
    }
    noSleepVideoElement = null;
    console.log("スリープ防止代替手段 (ビデオ) 停止");
  }
  if (noSleepTimerInterval) {
    clearInterval(noSleepTimerInterval);
    noSleepTimerInterval = null;
  }
}

// ページが表示状態に戻ったときにスリープ防止を再取得
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible" && countdownActive) {
    if (isWakeLockSupported && !wakeLock) {
      // wakeLockがサポートされていて、現在アクティブでない場合
      acquireWakeLock();
    } else if (!isWakeLockSupported && !noSleepVideoElement) {
      // サポートされておらず、代替手段も動いていない場合
      startNoSleepAnimation();
    }
  }
});

// オーディオの初期化
function initAudio() {
  if (audioInitialized) return true;
  try {
    timerAudio = document.getElementById("timerSound");
    if (!timerAudio) {
      timerAudio = new Audio("timer10.mp3"); // fallback
    }
    timerAudio.volume = 0.0001; // ほぼ無音で初期再生
    const playPromise = timerAudio.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          timerAudio.pause();
          timerAudio.currentTime = 0;
          timerAudio.volume = 1.0; // 音量を元に戻す
          audioInitialized = true;
          console.log("オーディオシステムが正常に初期化されました");
        })
        .catch((error) => {
          console.warn(
            "オーディオの初期化再生に失敗(ユーザー操作待ち):",
            error
          );
          timerAudio.volume = 1.0; // 失敗しても音量は戻しておく
        });
    } else {
      // Promiseを返さない古いブラウザ向け
      audioInitialized = true; // とりあえず初期化済みとする
    }
    return true;
  } catch (error) {
    console.error("オーディオ初期化中にエラー:", error);
    return false;
  }
}

// アラーム音の再生
function playAlarmSound() {
  return new Promise((resolve) => {
    if (!timerAudio || !audioInitialized) {
      console.warn(
        "オーディオ未初期化または利用不可のためアラーム再生スキップ"
      );
      if (!initAudio()) {
        // 再度初期化を試みる
        resolve(false);
        return;
      }
    }
    try {
      timerAudio.currentTime = 0;
      timerAudio.volume = 1.0;
      const playPromise = timerAudio.play();
      if (playPromise !== undefined) {
        playPromise.then(() => resolve(true)).catch(() => resolve(false));
      } else {
        resolve(true); // Promiseを返さない場合は成功したとみなす
      }
    } catch (error) {
      console.error("アラーム音再生エラー:", error);
      resolve(false);
    }
  });
}

// ★時間をフォーマットするヘルパー関数
function formatTime(totalSeconds) {
  const minutes = Math.floor(Math.max(0, totalSeconds) / 60);
  const seconds = Math.max(0, totalSeconds) % 60;
  return `${minutes.toString().padStart(2, "0")}:${seconds
    .toString()
    .padStart(2, "0")}`;
}

// クリックイベント (★タイマー開始の主要ロジック)
renderer.domElement.addEventListener("click", function () {
  if (!countdownActive) {
    // タイマーが非アクティブの場合のみ開始
    if (!audioInitialized) initAudio(); // オーディオが初期化されていなければ試みる
    acquireWakeLock();

    isWorkTime = true; // 作業時間から開始
    countdownSeconds = workDuration; // 25分をセット

    updateTimerDisplay(formatTime(countdownSeconds)); // ★表示を即時更新

    countdownActive = true; // タイマーをアクティブにする
    lastCountdownUpdate = Date.now(); // 最後の更新時刻を現在に設定
    hasPlayedSound = false; // アラーム音再生フラグをリセット
    console.log("タイマー開始: " + formatTime(countdownSeconds));

    // 開始時の点滅アニメーション
    let blinkCount = 0;
    const initialBlinkInterval = setInterval(() => {
      timerVisible = !timerVisible;
      if (timerMesh && timerMesh.mesh) {
        timerMesh.mesh.visible = timerVisible;
      }
      blinkCount++;
      if (blinkCount >= 4) {
        // 2回点滅 (0.25秒 * 4 = 1秒)
        clearInterval(initialBlinkInterval);
        timerVisible = true;
        if (timerMesh && timerMesh.mesh) {
          timerMesh.mesh.visible = true;
        }
      }
    }, 250);
  }
});

// カウントダウン処理関数 (★ポモドーロロジックの中心)
function updateCountdown() {
  if (!countdownActive) return; // アクティブでなければ何もしない

  const currentTime = Date.now();
  if (currentTime - lastCountdownUpdate >= 1000) {
    // 1秒経過したか
    countdownSeconds--;
    lastCountdownUpdate = currentTime; // 最終更新時刻を更新 (秒が減った直後に更新)

    if (countdownSeconds < 0) {
      // 0秒未満になったら (次のセッションへ)
      if (!hasPlayedSound) {
        // まだこのセッションの音を鳴らしていなければ
        playAlarmSound().then((success) => {
          if (success) console.log("タイマーアラーム再生成功");
          else console.warn("タイマーアラーム再生失敗");
          hasPlayedSound = true; // このセッションの音は鳴らした
        });
      }

      if (isWorkTime) {
        console.log("作業終了、休憩開始");
        isWorkTime = false;
        countdownSeconds = breakDuration; // 5分
      } else {
        console.log("休憩終了、作業開始");
        isWorkTime = true;
        countdownSeconds = workDuration; // 25分
      }
      hasPlayedSound = false; // 次のセッションのためにリセット
      // countdownActive は true のまま継続
    }
    // 時間表示を更新 (countdownSeconds が負になる場合も00:00と表示するように formatTime で制御)
    updateTimerDisplay(formatTime(countdownSeconds));
  }
}

// レンダリング開始
animate();

// ウィンドウサイズが変更されたときの処理
window.addEventListener("resize", function () {
  const width = window.innerWidth;
  const height = window.innerHeight;
  renderer.setSize(width, height);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
});

// ページ読み込み時の初期化処理
document.addEventListener("DOMContentLoaded", function () {
  initAudio(); // オーディオ初期化試行
  checkWakeLockSupport(); // スリープ防止機能の確認
});
