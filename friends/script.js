const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const scoreText = document.getElementById("scoreText");
const livesText = document.getElementById("livesText");
const timeText = document.getElementById("timeText");

const startBtn = document.getElementById("startBtn");
const restartBtn = document.getElementById("restartBtn");
const messageBox = document.getElementById("messageBox");
const messageTitle = document.getElementById("messageTitle");
const messageText = document.getElementById("messageText");

const targetScore = 8;
const gameDurationSeconds = 60;

const images = {
  background: loadImage("assets/beach-background.svg"),
  player: loadImage("assets/girl-player.svg"),
  friend: loadImage("assets/girl-friend.svg"),
  shell: loadImage("assets/shell.svg"),
  wave: loadImage("assets/wave.svg"),
  umbrella: loadImage("assets/umbrella.svg"),
  heart: loadImage("assets/heart.svg"),
  fans: loadImage("assets/fans.svg")
};

const keys = {
  up: false,
  down: false,
  left: false,
  right: false
};

let player;
let friend;
let shells;
let waves;
let score;
let lives;
let timeLeft;
let gameRunning;
let lastFrameTime;
let timerId;
let friendBonusReady;
let fanCheerTime;

function loadImage(src) {
  const image = new Image();
  image.src = src;
  return image;
}

function resetGame() {
  player = {
    x: 84,
    y: 350,
    width: 72,
    height: 104,
    speed: 260,
    invincibleTime: 0
  };

  friend = {
    x: 800,
    y: 345,
    width: 76,
    height: 108
  };

  shells = [
    { x: 190, y: 375, size: 34, collected: false },
    { x: 275, y: 290, size: 34, collected: false },
    { x: 380, y: 410, size: 34, collected: false },
    { x: 470, y: 310, size: 34, collected: false },
    { x: 560, y: 430, size: 34, collected: false },
    { x: 650, y: 275, size: 34, collected: false },
    { x: 745, y: 420, size: 34, collected: false },
    { x: 855, y: 300, size: 34, collected: false }
  ];

  waves = [
    { x: 240, y: 205, width: 102, height: 44, speed: 90, direction: 1 },
    { x: 455, y: 230, width: 110, height: 48, speed: 115, direction: -1 },
    { x: 690, y: 200, width: 112, height: 48, speed: 95, direction: 1 }
  ];

  score = 0;
  lives = 3;
  timeLeft = gameDurationSeconds;
  gameRunning = false;
  friendBonusReady = true;
  fanCheerTime = 0;
  lastFrameTime = performance.now();
  updateHud();
  drawScene(0);
}

function startGame() {
  resetGame();
  hideMessage();
  gameRunning = true;
  lastFrameTime = performance.now();

  clearInterval(timerId);
  timerId = setInterval(() => {
    if (!gameRunning) {
      return;
    }

    timeLeft -= 1;
    updateHud();

    if (timeLeft <= 0) {
      endGame(false, "הזמן נגמר", "נסי שוב לאסוף את כל הצדפים ולהגיע לחברה הכי טובה.");
    }
  }, 1000);

  requestAnimationFrame(gameLoop);
}

function gameLoop(timestamp) {
  const delta = Math.min((timestamp - lastFrameTime) / 1000, 0.04);
  lastFrameTime = timestamp;

  update(delta);
  drawScene(delta);

  if (gameRunning) {
    requestAnimationFrame(gameLoop);
  }
}

function update(delta) {
  movePlayer(delta);
  moveWaves(delta);

  if (player.invincibleTime > 0) {
    player.invincibleTime -= delta;
  }

  if (fanCheerTime > 0) {
    fanCheerTime -= delta;
  }

  collectShells();
  checkWaveHits();
  checkFriendBonus();

  if (score >= targetScore) {
    endGame(true, "ניצחתן", "אספת את כל הצדפים והגעת לחברה הכי טובה ליד השמשייה.");
  }
}

function movePlayer(delta) {
  let dx = 0;
  let dy = 0;

  if (keys.left) dx -= 1;
  if (keys.right) dx += 1;
  if (keys.up) dy -= 1;
  if (keys.down) dy += 1;

  if (dx !== 0 && dy !== 0) {
    dx *= 0.707;
    dy *= 0.707;
  }

  player.x += dx * player.speed * delta;
  player.y += dy * player.speed * delta;

  player.x = clamp(player.x, 10, canvas.width - player.width - 10);
  player.y = clamp(player.y, 135, canvas.height - player.height - 12);
}

function moveWaves(delta) {
  for (const wave of waves) {
    wave.x += wave.speed * wave.direction * delta;

    if (wave.x < 80 || wave.x + wave.width > canvas.width - 80) {
      wave.direction *= -1;
    }
  }
}

function collectShells() {
  for (const shell of shells) {
    if (!shell.collected && overlaps(player, shellRect(shell))) {
      shell.collected = true;
      score += 1;
      fanCheerTime = 0.9;
      showFloatingText("המעריצים מריעים לכן", shell.x + 18, shell.y - 10);
      updateHud();
    }
  }
}

function checkWaveHits() {
  if (player.invincibleTime > 0) {
    return;
  }

  for (const wave of waves) {
    if (overlaps(player, wave)) {
      lives -= 1;
      player.invincibleTime = 1.3;
      player.x = Math.max(20, player.x - 58);
      player.y = Math.min(canvas.height - player.height - 10, player.y + 30);
      updateHud();

      if (lives <= 0) {
        endGame(false, "הגלים הרטיבו אותנו", "לא נורא. מתחילות שוב ואוספות צדפים בזהירות.");
      }

      break;
    }
  }
}

function checkFriendBonus() {
  if (!friendBonusReady) {
    return;
  }

  if (score > 0 && score < targetScore && overlaps(player, friend)) {
    friendBonusReady = false;
    timeLeft = Math.min(gameDurationSeconds, timeLeft + 8);
    updateHud();
    showFloatingText("בונוס חברות: עוד זמן", friend.x - 45, friend.y - 16);
  }
}

let floatingTexts = [];

function showFloatingText(text, x, y) {
  floatingTexts.push({ text, x, y, life: 1.4 });
}

function updateFloatingTexts(delta) {
  floatingTexts = floatingTexts
    .map(item => ({ ...item, y: item.y - 22 * delta, life: item.life - delta }))
    .filter(item => item.life > 0);
}

function drawFloatingTexts(delta) {
  updateFloatingTexts(delta);

  for (const item of floatingTexts) {
    ctx.save();
    ctx.globalAlpha = Math.max(item.life / 1.4, 0);
    ctx.font = "bold 22px Arial";
    ctx.textAlign = "center";
    ctx.fillStyle = "#1c6b88";
    ctx.fillText(item.text, item.x, item.y);
    ctx.restore();
  }
}

function drawScene(delta) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  drawImageOrFallback(images.background, 0, 0, canvas.width, canvas.height, () => drawFallbackBackground());
  drawDecorations();
  drawFans();

  for (const shell of shells) {
    if (!shell.collected) {
      drawImageOrFallback(images.shell, shell.x, shell.y, shell.size, shell.size, () => {
        drawCircle(shell.x + shell.size / 2, shell.y + shell.size / 2, shell.size / 2, "#f9a66c");
      });
    }
  }

  for (const wave of waves) {
    drawImageOrFallback(images.wave, wave.x, wave.y, wave.width, wave.height, () => {
      drawRoundedRect(wave.x, wave.y, wave.width, wave.height, 18, "#5bc7e8");
    });
  }

  drawImageOrFallback(images.umbrella, 772, 292, 132, 110, () => {});
  drawImageOrFallback(images.friend, friend.x, friend.y, friend.width, friend.height, () => {
    drawRoundedRect(friend.x, friend.y, friend.width, friend.height, 20, "#ff8ab3");
  });

  const shouldBlink = player.invincibleTime > 0 && Math.floor(performance.now() / 110) % 2 === 0;
  if (!shouldBlink) {
    drawImageOrFallback(images.player, player.x, player.y, player.width, player.height, () => {
      drawRoundedRect(player.x, player.y, player.width, player.height, 20, "#8b6bff");
    });
  }

  drawHearts();
  drawFloatingTexts(delta);
}


function drawFans() {
  const bounce = fanCheerTime > 0 ? Math.sin(performance.now() / 90) * 5 : 0;

  drawImageOrFallback(images.fans, 360, 318 + bounce, 230, 120, () => {
    drawRoundedRect(376, 340 + bounce, 198, 82, 20, "#ffffff");
    ctx.save();
    ctx.font = "bold 18px Arial";
    ctx.textAlign = "center";
    ctx.fillStyle = "#1c6b88";
    ctx.fillText("מעריצים", 475, 385 + bounce);
    ctx.restore();
  });

  if (fanCheerTime > 0) {
    ctx.save();
    ctx.font = "bold 24px Arial";
    ctx.textAlign = "center";
    ctx.fillStyle = "#ff6f91";
    ctx.fillText("איזה חברות אלופות", 475, 305 + bounce);
    ctx.restore();
  }
}

function drawDecorations() {
  ctx.save();

  ctx.globalAlpha = 0.55;
  drawCircle(84, 78, 38, "#fff4ad");
  drawCircle(145, 96, 12, "#ffffff");
  drawCircle(190, 75, 17, "#ffffff");
  drawCircle(750, 84, 15, "#ffffff");
  drawCircle(792, 82, 24, "#ffffff");
  drawCircle(825, 87, 15, "#ffffff");

  ctx.globalAlpha = 1;
  ctx.fillStyle = "rgba(255, 255, 255, 0.45)";
  for (let i = 0; i < 9; i += 1) {
    const x = 30 + i * 115;
    ctx.beginPath();
    ctx.ellipse(x, 165 + Math.sin(i) * 10, 42, 9, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function drawHearts() {
  for (let i = 0; i < lives; i += 1) {
    drawImageOrFallback(images.heart, 24 + i * 33, 24, 25, 25, () => {
      drawCircle(36 + i * 33, 36, 11, "#ff6f91");
    });
  }
}

function drawFallbackBackground() {
  const sky = ctx.createLinearGradient(0, 0, 0, canvas.height);
  sky.addColorStop(0, "#9ee8ff");
  sky.addColorStop(0.46, "#dff7ff");
  sky.addColorStop(0.47, "#f9d99a");
  sky.addColorStop(1, "#f8c879");

  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawImageOrFallback(image, x, y, width, height, fallback) {
  if (image.complete && image.naturalWidth > 0) {
    ctx.drawImage(image, x, y, width, height);
  } else {
    fallback();
  }
}

function drawCircle(x, y, radius, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
}

function drawRoundedRect(x, y, width, height, radius, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, radius);
  ctx.fill();
}

function updateHud() {
  scoreText.textContent = `${score} / ${targetScore}`;
  livesText.textContent = String(lives);
  timeText.textContent = String(Math.max(timeLeft, 0));
}

function shellRect(shell) {
  return {
    x: shell.x,
    y: shell.y,
    width: shell.size,
    height: shell.size
  };
}

function overlaps(a, b) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(value, max));
}

function endGame(won, title, text) {
  gameRunning = false;
  clearInterval(timerId);
  showMessage(title, text, won ? "שחקי שוב" : "נסי שוב");
}

function showMessage(title, text, buttonText) {
  messageTitle.textContent = title;
  messageText.textContent = text;
  startBtn.textContent = buttonText;
  messageBox.classList.add("is-visible");
}

function hideMessage() {
  messageBox.classList.remove("is-visible");
}

function setDirection(direction, isPressed) {
  if (direction === "up") keys.up = isPressed;
  if (direction === "down") keys.down = isPressed;
  if (direction === "left") keys.left = isPressed;
  if (direction === "right") keys.right = isPressed;
}

window.addEventListener("keydown", event => {
  const key = event.key.toLowerCase();

  if (key === "arrowup" || key === "w") setDirection("up", true);
  if (key === "arrowdown" || key === "s") setDirection("down", true);
  if (key === "arrowleft" || key === "a") setDirection("left", true);
  if (key === "arrowright" || key === "d") setDirection("right", true);
});

window.addEventListener("keyup", event => {
  const key = event.key.toLowerCase();

  if (key === "arrowup" || key === "w") setDirection("up", false);
  if (key === "arrowdown" || key === "s") setDirection("down", false);
  if (key === "arrowleft" || key === "a") setDirection("left", false);
  if (key === "arrowright" || key === "d") setDirection("right", false);
});

document.querySelectorAll(".move-button").forEach(button => {
  const direction = button.dataset.dir;

  button.addEventListener("pointerdown", event => {
    event.preventDefault();
    setDirection(direction, true);
  });

  button.addEventListener("pointerup", () => setDirection(direction, false));
  button.addEventListener("pointerleave", () => setDirection(direction, false));
  button.addEventListener("pointercancel", () => setDirection(direction, false));
});

startBtn.addEventListener("click", startGame);
restartBtn.addEventListener("click", startGame);

Object.values(images).forEach(image => {
  image.addEventListener("load", () => drawScene(0));
});

resetGame();
