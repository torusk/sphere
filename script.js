// 蛍の背景エフェクト

// キャンバス要素を作成
const fireflyCanvas = document.createElement('canvas');
fireflyCanvas.id = 'firefly-canvas';
document.body.insertBefore(fireflyCanvas, document.body.firstChild);

const canvas = fireflyCanvas;
const ctx = canvas.getContext("2d");

// Canvas サイズの設定とリサイズ関数
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resizeCanvas();

// アニメーションフレーム
let animationId;

// アニメーションタイマー
let animationTime = 0;
let lastUpdateTime = Date.now();

// 粒子の配列
const particles = [];

// 蛍クラス
class Firefly {
  constructor() {
    this.reset();
  }

  reset() {
    // 位置をランダムに設定
    this.x = Math.random() * canvas.width;
    this.y = Math.random() * canvas.height;

    // サイズをランダムに設定
    this.size = 1.5 + Math.random() * 2;

    // 移動速度をランダムに設定
    this.speedX = -0.5 + Math.random() * 1;
    this.speedY = -0.5 + Math.random() * 1;

    // 加速度（飛行中の方向変化用）
    this.accelX = 0;
    this.accelY = 0;

    // 蛍の明るさ（明滅用）
    this.baseAlpha = 0.3 + Math.random() * 0.4;
    this.alpha = this.baseAlpha;
    
    // 光の大きさ
    this.glowSize = this.size * (3 + Math.random() * 3);
    
    // 明滅のパラメータ
    this.pulseSpeed = 0.02 + Math.random() * 0.04;
    this.pulseOffset = Math.random() * Math.PI * 2;
    
    // 蛍の色（少し黄色みがかった緑〜青白色）
    this.color = this.getFireflyColor();

    // 寿命
    this.lifespan = 100 + Math.random() * 200;
    this.age = 0;
    
    // 停止時間（蛍が一時的に静止する時間）
    this.pauseTime = 0;
    this.maxPauseTime = 50 + Math.random() * 100;
    
    // 蛍の飛行特性
    this.changeDirectionInterval = 50 + Math.random() * 100;
    this.lastDirectionChange = 0;
  }

  // 蛍の色を生成
  getFireflyColor() {
    // 蛍の色の種類
    const colorTypes = [
      // 黄緑系（一般的な蛍）
      [179, 255, 0],
      [150, 255, 20],
      // 青白系（幻想的な蛍）
      [120, 220, 255],
      [160, 240, 230]
    ];
    
    return colorTypes[Math.floor(Math.random() * colorTypes.length)];
  }

  // 蛍の更新処理
  update(time) {
    // 年齢を更新
    this.age++;
    
    // 寿命が来たらリセット
    if (this.age > this.lifespan) {
      this.reset();
      return;
    }
    
    // 一時停止の処理
    if (this.pauseTime > 0) {
      this.pauseTime--;
      
      // 停止中は明滅だけ行う
      this.updateGlow(time);
      return;
    }
    
    // 方向を不定期に変更
    if (this.age - this.lastDirectionChange > this.changeDirectionInterval) {
      this.accelX = -0.05 + Math.random() * 0.1;
      this.accelY = -0.05 + Math.random() * 0.1;
      this.lastDirectionChange = this.age;
      
      // 一定確率で一時停止
      if (Math.random() < 0.3) {
        this.pauseTime = this.maxPauseTime * Math.random();
        return;
      }
    }
    
    // 速度に加速度を適用
    this.speedX += this.accelX;
    this.speedY += this.accelY;
    
    // 速度の制限
    const maxSpeed = 1.5;
    const currentSpeed = Math.sqrt(this.speedX * this.speedX + this.speedY * this.speedY);
    if (currentSpeed > maxSpeed) {
      this.speedX = (this.speedX / currentSpeed) * maxSpeed;
      this.speedY = (this.speedY / currentSpeed) * maxSpeed;
    }
    
    // 位置を更新
    this.x += this.speedX;
    this.y += this.speedY;
    
    // 光の明滅を更新
    this.updateGlow(time);
    
    // 画面外に出たら反対側から再登場
    this.handleBoundaries();
  }
  
  // 光の明滅処理
  updateGlow(time) {
    // サインカーブで明滅を表現
    const pulseValue = Math.sin(time * this.pulseSpeed + this.pulseOffset);
    this.alpha = this.baseAlpha + (pulseValue + 1) * 0.3; // 0.3〜0.9 + ベース値の範囲で明滅
  }
  
  // 画面端の処理
  handleBoundaries() {
    const margin = 50;
    
    // 画面外に出たら反対側から再登場
    if (this.x < -margin) {
      this.x = canvas.width + margin;
    } else if (this.x > canvas.width + margin) {
      this.x = -margin;
    }
    
    if (this.y < -margin) {
      this.y = canvas.height + margin;
    } else if (this.y > canvas.height + margin) {
      this.y = -margin;
    }
  }

  // 蛍の描画処理
  draw() {
    const [r, g, b] = this.color;
    
    // グローエフェクト（光の拡散）
    const gradient = ctx.createRadialGradient(
      this.x, this.y, 0,
      this.x, this.y, this.glowSize
    );
    
    gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${this.alpha})`);
    gradient.addColorStop(0.4, `rgba(${r}, ${g}, ${b}, ${this.alpha * 0.6})`);
    gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
    
    ctx.beginPath();
    ctx.fillStyle = gradient;
    ctx.arc(this.x, this.y, this.glowSize, 0, Math.PI * 2);
    ctx.fill();
    
    // 蛍の本体（小さな点）
    ctx.beginPath();
    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${this.alpha + 0.2})`;
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
  }
}

// 粒子を初期化する関数
function initFireflies() {
  // 粒子配列をクリア
  particles.length = 0;
  
  // 新しい粒子を生成
  for (let i = 0; i < 80; i++) {
    particles.push(new Firefly());
  }
}

// アニメーションの更新関数
function update() {
  const now = Date.now();
  const dt = (now - lastUpdateTime) / 1000;
  lastUpdateTime = now;

  animationTime += dt;

  // キャンバスをクリア
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // 背景を描画
  ctx.fillStyle = "rgba(0, 20, 38, 0.2)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 全ての粒子を更新して描画
  particles.forEach((particle) => {
    particle.update(animationTime);
    particle.draw();
  });

  // 次のフレームを要求
  animationId = requestAnimationFrame(update);
}

// ウィンドウリサイズイベント
window.addEventListener("resize", () => {
  resizeCanvas();
});

// 初期化
initFireflies();
update();
