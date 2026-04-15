const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const menuScreen = document.getElementById("menuScreen");
const gameUI = document.getElementById("gameUI");
const overlay = document.getElementById("overlay");

const player1Options = document.getElementById("player1Options");
const player2Options = document.getElementById("player2Options");
const player1Info = document.getElementById("player1Info");
const player2Info = document.getElementById("player2Info");
const startBtn = document.getElementById("startBtn");

const hpFill1 = document.getElementById("hpFill1");
const hpFill2 = document.getElementById("hpFill2");
const hpText1 = document.getElementById("hpText1");
const hpText2 = document.getElementById("hpText2");
const hudP1Robot = document.getElementById("hudP1Robot");
const hudP2Robot = document.getElementById("hudP2Robot");

const winnerText = document.getElementById("winnerText");
const winnerSubtext = document.getElementById("winnerSubtext");

const restartBtn = document.getElementById("restartBtn");
const backToMenuBtn = document.getElementById("backToMenuBtn");
const playAgainBtn = document.getElementById("playAgainBtn");
const menuBtn = document.getElementById("menuBtn");

const keys = {};
const bullets = [];
const particles = [];

const gravity = 900;
let lastTime = 0;
let gameStarted = false;
let gameOver = false;

let player1 = null;
let player2 = null;
let selectedRobot1 = null;
let selectedRobot2 = null;

const robotTypes = [
  {
    id: "tank",
    name: "TANK-X",
    role: "Těžký robot",
    description: "Vydrží hodně zásahů, je pomalejší a dává silnější damage.",
    maxHp: 160,
    speed: 185,
    jumpForce: 390,
    cooldown: 0.45,
    bulletSpeed: 480,
    bulletDamage: 18,
    bulletCount: 1,
    spread: 0,
    bodyColor: "#7cff4d"
  },
  {
    id: "scout",
    name: "SCOUT-Z",
    role: "Lehký robot",
    description: "Je rychlý, skáče vysoko, ale má méně životů.",
    maxHp: 85,
    speed: 300,
    jumpForce: 520,
    cooldown: 0.22,
    bulletSpeed: 560,
    bulletDamage: 10,
    bulletCount: 1,
    spread: 0,
    bodyColor: "#00f6ff"
  },
  {
    id: "sniper",
    name: "SNIPER-V",
    role: "Dálkový robot",
    description: "Má rychlé projektily a velký zásah, ale střílí pomaleji.",
    maxHp: 95,
    speed: 235,
    jumpForce: 430,
    cooldown: 0.7,
    bulletSpeed: 880,
    bulletDamage: 28,
    bulletCount: 1,
    spread: 0,
    bodyColor: "#b47cff"
  },
  {
    id: "blaster",
    name: "BLASTER-Q",
    role: "Rozptylový robot",
    description: "Střílí tři projektily najednou a je nebezpečný na blízko.",
    maxHp: 110,
    speed: 245,
    jumpForce: 440,
    cooldown: 0.52,
    bulletSpeed: 520,
    bulletDamage: 9,
    bulletCount: 3,
    spread: 0.18,
    bodyColor: "#ff5bd2"
  }
];

/*
  OPRAVA MAPY:
  - Každá další úroveň je jen cca o 50–60 px výš
  - I Tank s nejnižším skokem se dostane nahoru
  - Mapu jde projít zleva doprava i zprava doleva
*/
const platforms = [
  { x: 0, y: 570, width: 1100, height: 50 },

  { x: 40, y: 510, width: 140, height: 18 },
  { x: 220, y: 460, width: 140, height: 18 },
  { x: 400, y: 510, width: 140, height: 18 },
  { x: 580, y: 460, width: 140, height: 18 },
  { x: 760, y: 510, width: 140, height: 18 },
  { x: 920, y: 460, width: 140, height: 18 },

  { x: 120, y: 400, width: 140, height: 18 },
  { x: 300, y: 350, width: 140, height: 18 },
  { x: 480, y: 400, width: 140, height: 18 },
  { x: 660, y: 350, width: 140, height: 18 },
  { x: 840, y: 400, width: 140, height: 18 },

  { x: 210, y: 290, width: 140, height: 18 },
  { x: 390, y: 240, width: 140, height: 18 },
  { x: 570, y: 290, width: 140, height: 18 },
  { x: 750, y: 240, width: 140, height: 18 },

  { x: 300, y: 180, width: 140, height: 18 },
  { x: 480, y: 130, width: 140, height: 18 },
  { x: 660, y: 180, width: 140, height: 18 }
];

class Robot {
  constructor(x, y, config, controls, facing, playerNumber) {
    this.x = x;
    this.y = y;
    this.width = 44;
    this.height = 54;
    this.controls = controls;
    this.playerNumber = playerNumber;
    this.spawnX = x;
    this.spawnY = y;

    this.typeId = config.id;
    this.name = config.name;
    this.role = config.role;
    this.description = config.description;

    this.maxHp = config.maxHp;
    this.hp = config.maxHp;
    this.speed = config.speed;
    this.jumpForce = config.jumpForce;
    this.cooldownTime = config.cooldown;
    this.bulletSpeed = config.bulletSpeed;
    this.bulletDamage = config.bulletDamage;
    this.bulletCount = config.bulletCount;
    this.spread = config.spread;
    this.bodyColor = config.bodyColor;

    this.vx = 0;
    this.vy = 0;
    this.dir = facing;
    this.onGround = false;
    this.cooldown = 0;
  }

  update(dt) {
    if (this.hp <= 0) return;

    this.vx = 0;

    if (keys[this.controls.left]) {
      this.vx = -this.speed;
      this.dir = -1;
    }

    if (keys[this.controls.right]) {
      this.vx = this.speed;
      this.dir = 1;
    }

    if (keys[this.controls.jump] && this.onGround) {
      this.vy = -this.jumpForce;
      this.onGround = false;
    }

    this.vy += gravity * dt;

    const prevY = this.y;

    this.x += this.vx * dt;
    this.y += this.vy * dt;

    this.x = Math.max(0, Math.min(canvas.width - this.width, this.x));

    this.onGround = false;

    for (const p of platforms) {
      const wasAbove = prevY + this.height <= p.y + 4;

      if (
        this.x + this.width > p.x &&
        this.x < p.x + p.width &&
        this.y + this.height >= p.y &&
        this.y + this.height <= p.y + p.height + 18 &&
        this.vy >= 0 &&
        wasAbove
      ) {
        this.y = p.y - this.height;
        this.vy = 0;
        this.onGround = true;
      }
    }

    if (this.y > canvas.height + 250) {
      this.respawn();
    }

    if (this.cooldown > 0) {
      this.cooldown -= dt;
    }
  }

  respawn() {
    this.hp = Math.max(0, this.hp - 15);
    this.x = this.spawnX;
    this.y = this.spawnY;
    this.vx = 0;
    this.vy = 0;
    this.dir = this.playerNumber === 1 ? 1 : -1;
    updateHud();

    if (this.hp <= 0 && !gameOver) {
      endGame(this.playerNumber === 1 ? 2 : 1);
    }
  }

  shoot() {
    if (!gameStarted || gameOver || this.hp <= 0 || this.cooldown > 0) return;

    if (this.bulletCount === 1) {
      bullets.push(this.createBullet(0));
    } else {
      bullets.push(this.createBullet(-this.spread));
      bullets.push(this.createBullet(0));
      bullets.push(this.createBullet(this.spread));
    }

    this.cooldown = this.cooldownTime;
  }

  createBullet(angleOffset) {
    return {
      x: this.dir === 1 ? this.x + this.width + 4 : this.x - 12,
      y: this.y + this.height / 2,
      vx: this.dir * this.bulletSpeed,
      vy: angleOffset * this.bulletSpeed,
      width: 12,
      height: 4,
      owner: this,
      damage: this.bulletDamage,
      color: this.bodyColor
    };
  }

  draw() {
    if (this.hp <= 0) return;

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.shadowBlur = 22;
    ctx.shadowColor = this.bodyColor;

    if (this.typeId === "tank") {
      ctx.fillStyle = this.bodyColor;
      ctx.fillRect(4, 16, 36, 28);

      ctx.fillStyle = "#dffbff";
      ctx.fillRect(10, 4, 24, 14);

      ctx.fillStyle = "#ffffff";
      ctx.fillRect(14, 8, 4, 4);
      ctx.fillRect(26, 8, 4, 4);

      ctx.fillStyle = "#9befff";
      if (this.dir === 1) {
        ctx.fillRect(40, 24, 16, 8);
      } else {
        ctx.fillRect(-16, 24, 16, 8);
      }

      ctx.fillStyle = "rgba(255,255,255,0.18)";
      ctx.fillRect(6, 46, 8, 4);
      ctx.fillRect(18, 46, 8, 4);
      ctx.fillRect(30, 46, 8, 4);
    } else if (this.typeId === "scout") {
      ctx.fillStyle = this.bodyColor;
      ctx.beginPath();
      ctx.moveTo(22, 6);
      ctx.lineTo(38, 18);
      ctx.lineTo(33, 44);
      ctx.lineTo(11, 44);
      ctx.lineTo(6, 18);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = "#dffbff";
      ctx.beginPath();
      ctx.arc(22, 20, 8, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#ffffff";
      ctx.fillRect(18, 18, 3, 3);
      ctx.fillRect(23, 18, 3, 3);

      ctx.fillStyle = "#9befff";
      if (this.dir === 1) {
        ctx.fillRect(36, 23, 12, 5);
      } else {
        ctx.fillRect(-4, 23, 12, 5);
      }

      ctx.fillRect(12, 44, 5, 9);
      ctx.fillRect(27, 44, 5, 9);
    } else if (this.typeId === "sniper") {
      ctx.fillStyle = this.bodyColor;
      ctx.fillRect(10, 12, 24, 34);

      ctx.fillStyle = "#dffbff";
      ctx.fillRect(12, 2, 20, 12);

      ctx.fillStyle = "#ffffff";
      ctx.fillRect(16, 6, 4, 4);
      ctx.fillRect(24, 6, 4, 4);

      ctx.fillStyle = "#9befff";
      if (this.dir === 1) {
        ctx.fillRect(34, 20, 22, 4);
      } else {
        ctx.fillRect(-22, 20, 22, 4);
      }

      ctx.fillStyle = this.bodyColor;
      ctx.fillRect(8, 46, 6, 8);
      ctx.fillRect(30, 46, 6, 8);
    } else if (this.typeId === "blaster") {
      ctx.fillStyle = this.bodyColor;
      ctx.fillRect(10, 12, 24, 32);
      ctx.fillRect(8, 14, 28, 28);

      ctx.fillStyle = "#dffbff";
      ctx.fillRect(10, 4, 24, 14);

      ctx.fillStyle = "#ffffff";
      ctx.fillRect(14, 8, 4, 4);
      ctx.fillRect(26, 8, 4, 4);

      ctx.fillStyle = "#9befff";
      if (this.dir === 1) {
        ctx.fillRect(36, 18, 10, 4);
        ctx.fillRect(36, 25, 14, 5);
        ctx.fillRect(36, 33, 10, 4);
      } else {
        ctx.fillRect(-10, 18, 10, 4);
        ctx.fillRect(-14, 25, 14, 5);
        ctx.fillRect(-10, 33, 10, 4);
      }

      ctx.fillRect(11, 46, 7, 8);
      ctx.fillRect(26, 46, 7, 8);
    }

    ctx.restore();
  }
}

function createRobotCards() {
  player1Options.innerHTML = "";
  player2Options.innerHTML = "";

  robotTypes.forEach((robot) => {
    player1Options.appendChild(buildRobotCard(robot, 1));
    player2Options.appendChild(buildRobotCard(robot, 2));
  });
}

function buildRobotCard(robot, playerNumber) {
  const card = document.createElement("div");
  card.className = "robot-card";
  card.dataset.robotId = robot.id;

  card.innerHTML = `
    <div class="robot-name">${robot.name}</div>
    <div class="robot-type">${robot.role}</div>
    <div class="robot-desc">${robot.description}</div>
    <div class="stats-mini">
      HP: ${robot.maxHp}<br>
      Rychlost: ${robot.speed}<br>
      Skok: ${robot.jumpForce}<br>
      Damage: ${robot.bulletDamage}
    </div>
  `;

  card.addEventListener("click", () => {
    selectRobot(playerNumber, robot.id);
  });

  return card;
}

function selectRobot(playerNumber, robotId) {
  const robot = robotTypes.find((r) => r.id === robotId);
  if (!robot) return;

  if (playerNumber === 1) {
    selectedRobot1 = robot;
    document.querySelectorAll("#player1Options .robot-card").forEach((c) => {
      c.classList.remove("selected-green");
      if (c.dataset.robotId === robotId) c.classList.add("selected-green");
    });

    player1Info.innerHTML = `
      <h3>Hráč 1 robot</h3>
      <p><strong>${robot.name}</strong> — ${robot.role}</p>
      <p>${robot.description}</p>
      <p>HP: ${robot.maxHp} | Rychlost: ${robot.speed} | Skok: ${robot.jumpForce} | Damage: ${robot.bulletDamage}</p>
    `;
  } else {
    selectedRobot2 = robot;
    document.querySelectorAll("#player2Options .robot-card").forEach((c) => {
      c.classList.remove("selected-red");
      if (c.dataset.robotId === robotId) c.classList.add("selected-red");
    });

    player2Info.innerHTML = `
      <h3>Hráč 2 robot</h3>
      <p><strong>${robot.name}</strong> — ${robot.role}</p>
      <p>${robot.description}</p>
      <p>HP: ${robot.maxHp} | Rychlost: ${robot.speed} | Skok: ${robot.jumpForce} | Damage: ${robot.bulletDamage}</p>
    `;
  }

  startBtn.disabled = !(selectedRobot1 && selectedRobot2);
}

function startGame() {
  if (!selectedRobot1 || !selectedRobot2) return;

  player1 = new Robot(
    90,
    400,
    selectedRobot1,
    { left: "a", right: "d", jump: "w" },
    1,
    1
  );

  player2 = new Robot(
    970,
    400,
    selectedRobot2,
    { left: "arrowleft", right: "arrowright", jump: "arrowup" },
    -1,
    2
  );

  bullets.length = 0;
  particles.length = 0;
  gameOver = false;
  gameStarted = true;

  overlay.classList.add("hidden");
  menuScreen.classList.add("hidden");
  gameUI.classList.remove("hidden");

  hudP1Robot.textContent = `${player1.name} • ${player1.role}`;
  hudP2Robot.textContent = `${player2.name} • ${player2.role}`;

  updateHud();
}

function backToMenu() {
  gameStarted = false;
  gameOver = false;
  overlay.classList.add("hidden");
  gameUI.classList.add("hidden");
  menuScreen.classList.remove("hidden");
}

function updateHud() {
  if (!player1 || !player2) return;

  hpFill1.style.width = `${Math.max(0, (player1.hp / player1.maxHp) * 100)}%`;
  hpFill2.style.width = `${Math.max(0, (player2.hp / player2.maxHp) * 100)}%`;

  hpText1.textContent = `${Math.max(0, Math.round(player1.hp))} / ${player1.maxHp}`;
  hpText2.textContent = `${Math.max(0, Math.round(player2.hp))} / ${player2.maxHp}`;
}

function rectsOverlap(a, b) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

function spawnHitParticles(x, y, color) {
  for (let i = 0; i < 10; i++) {
    particles.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 240,
      vy: (Math.random() - 0.5) * 240,
      life: 0.45 + Math.random() * 0.25,
      size: 2 + Math.random() * 3,
      color
    });
  }
}

function updateParticles(dt) {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.life -= dt;
    p.vx *= 0.96;
    p.vy *= 0.96;

    if (p.life <= 0) particles.splice(i, 1);
  }
}

function updateBullets(dt) {
  for (let i = bullets.length - 1; i >= 0; i--) {
    const b = bullets[i];
    b.x += b.vx * dt;
    b.y += b.vy * dt;

    const target = b.owner === player1 ? player2 : player1;

    if (target && target.hp > 0 && rectsOverlap(b, target)) {
      target.hp = Math.max(0, target.hp - b.damage);
      spawnHitParticles(b.x, b.y, b.color);
      bullets.splice(i, 1);
      updateHud();

      if (target.hp <= 0) {
        endGame(target === player1 ? 2 : 1);
      }
      continue;
    }

    let hitPlatform = false;
    for (const p of platforms) {
      if (rectsOverlap(b, p)) {
        hitPlatform = true;
        spawnHitParticles(b.x, b.y, b.color);
        break;
      }
    }

    if (
      hitPlatform ||
      b.x < -40 ||
      b.x > canvas.width + 40 ||
      b.y < -40 ||
      b.y > canvas.height + 40
    ) {
      bullets.splice(i, 1);
    }
  }
}

function endGame(winnerPlayerNumber) {
  gameOver = true;
  winnerText.textContent = `Vyhrál Hráč ${winnerPlayerNumber}!`;
  winnerSubtext.textContent =
    winnerPlayerNumber === 1
      ? `${player1.name} ovládl arénu.`
      : `${player2.name} ovládl arénu.`;
  overlay.classList.remove("hidden");
}

function drawBackground() {
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, "#071126");
  gradient.addColorStop(1, "#030612");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.save();
  ctx.globalAlpha = 0.22;
  for (let i = 0; i < 22; i++) {
    const x = (i * 73) % canvas.width;
    const y = (i * 41) % canvas.height;
    ctx.fillStyle = i % 2 === 0 ? "#00f6ff" : "#ff2bd6";
    ctx.fillRect(x, y, 2, 2);
  }
  ctx.restore();
}

function drawGrid() {
  ctx.save();
  ctx.strokeStyle = "rgba(0,246,255,0.08)";
  ctx.lineWidth = 1;

  for (let x = 0; x <= canvas.width; x += 50) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }

  for (let y = 0; y <= canvas.height; y += 50) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }

  ctx.restore();
}

function drawPlatforms() {
  for (const p of platforms) {
    ctx.save();
    ctx.shadowBlur = 16;
    ctx.shadowColor = p.y > 560 ? "#00f6ff" : "#ff2bd6";

    ctx.fillStyle = p.y > 560 ? "#102641" : "#1a1f49";
    ctx.fillRect(p.x, p.y, p.width, p.height);

    ctx.fillStyle = p.y > 560 ? "#00f6ff" : "#ff2bd6";
    ctx.fillRect(p.x, p.y, p.width, 4);

    ctx.restore();
  }
}

function drawBullets() {
  for (const b of bullets) {
    ctx.save();
    ctx.shadowBlur = 18;
    ctx.shadowColor = b.color;
    ctx.fillStyle = b.color;
    ctx.fillRect(b.x, b.y, b.width, b.height);
    ctx.restore();
  }
}

function drawParticles() {
  for (const p of particles) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, p.life);
    ctx.shadowBlur = 12;
    ctx.shadowColor = p.color;
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x, p.y, p.size, p.size);
    ctx.restore();
  }
}

function gameLoop(timestamp) {
  const dt = Math.min((timestamp - lastTime) / 1000, 0.033);
  lastTime = timestamp;

  if (gameStarted && !gameOver) {
    player1.update(dt);
    player2.update(dt);
    updateBullets(dt);
    updateHud();
  }

  updateParticles(dt);

  if (gameStarted) {
    drawBackground();
    drawGrid();
    drawPlatforms();
    drawParticles();
    drawBullets();
    player1.draw();
    player2.draw();
  }

  requestAnimationFrame(gameLoop);
}

window.addEventListener("keydown", (e) => {
  if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(e.code)) {
    e.preventDefault();
  }

  const key = e.key.toLowerCase();
  keys[key] = true;

  if (!gameStarted || gameOver) return;

  if (key === "q") {
    player1.shoot();
  }

  if (e.code === "Space") {
    player2.shoot();
  }
});

window.addEventListener("keyup", (e) => {
  keys[e.key.toLowerCase()] = false;
});

startBtn.addEventListener("click", startGame);
restartBtn.addEventListener("click", startGame);
playAgainBtn.addEventListener("click", startGame);
backToMenuBtn.addEventListener("click", backToMenu);
menuBtn.addEventListener("click", backToMenu);

createRobotCards();

requestAnimationFrame((t) => {
  lastTime = t;
  gameLoop(t);
});