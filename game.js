// Device detection using userAgent
function isMobileDevice() {
  return /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

// --- Get DOM elements ---
const player = document.getElementById("player");
const gameArea = document.getElementById("gameArea");
const joystickContainer = document.getElementById("joystickContainer");
const joystickBase = document.getElementById("joystickBase");
const joystickStick = document.getElementById("joystickStick");
const scoreDisplay = document.getElementById("scoreDisplay");

// --- Music Setup ---
const music = new Audio("audio/Cloud Dancer.mp3"); // Ensure this path is correct
music.loop = true;
music.volume = 0.5;

// Create a button to control music (play/pause)
const musicButton = document.createElement("button");
musicButton.id = "musicButton";
musicButton.innerHTML = "🔊"; // Default icon for music playing
musicButton.style.position = "fixed";
musicButton.style.bottom = "20px";
musicButton.style.right = "20px";
musicButton.style.backgroundColor = "transparent";
musicButton.style.border = "none";
musicButton.style.fontSize = "30px";
musicButton.style.cursor = "pointer";
musicButton.style.zIndex = "10";
document.body.appendChild(musicButton);

let isMusicPlaying = false;
function toggleMusic() {
  if (isMusicPlaying) {
    music.pause();
    musicButton.innerHTML = "🔇"; // Mute icon
  } else {
    music.play();
    musicButton.innerHTML = "🔈"; // Unmute icon
  }
  isMusicPlaying = !isMusicPlaying;
}
musicButton.addEventListener("click", toggleMusic);

// --- Start Screen Logic ---
const startScreen = document.getElementById("startScreen");
const startButton = document.getElementById("startButton");
startButton.addEventListener("click", startGame);

function startGame() {
  startScreen.style.display = "none";
  gameArea.style.display = "block";
  gameArea.style.opacity = "1"; 
  player.style.display = "block";
  // Start music on game start
  music.play().catch((error) => console.log("Autoplay blocked:", error));
  isMusicPlaying = true;
  updatePlayerPosition();
  requestAnimationFrame(gameLoop);
}

// --- Game Logic and Joystick Controls ---
const maxRadius = 50;
let joystickCenter = { x: 0, y: 0 };
let joystickOutput = { x: 0, y: 0 };

let playerPos = { x: gameArea.clientWidth / 2, y: gameArea.clientHeight / 2 };
const playerSpeed = 4;
let score = 0;

function updatePlayerPosition() {
  playerPos.x = gameArea.clientWidth / 2 - player.clientWidth / 2;
  playerPos.y = gameArea.clientHeight / 2 - player.clientHeight / 2;
  player.style.left = playerPos.x + "px";
  player.style.top = playerPos.y + "px";
}

function updateJoystickCenter() {
  const rect = joystickBase.getBoundingClientRect();
  joystickCenter = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
}

function resetJoystick() {
  joystickStick.style.left = "50%";
  joystickStick.style.top = "50%";
  joystickOutput = { x: 0, y: 0 };
}

function updatePlayer() {
  playerPos.x += joystickOutput.x * playerSpeed;
  playerPos.y += joystickOutput.y * playerSpeed;
  
  const areaWidth = gameArea.clientWidth;
  const areaHeight = gameArea.clientHeight;
  playerPos.x = Math.max(0, Math.min(areaWidth - player.clientWidth, playerPos.x));
  playerPos.y = Math.max(0, Math.min(areaHeight - player.clientHeight, playerPos.y));
  
  player.style.left = playerPos.x + "px";
  player.style.top = playerPos.y + "px";
}

function gameLoop() {
  updatePlayer();
  checkCollisions();
  requestAnimationFrame(gameLoop);
}
requestAnimationFrame(gameLoop);

// --- Enemy Spawning ---
let enemyCount = 0;
const maxEnemies = 50;

function spawnEnemy() {
  if (enemyCount < maxEnemies) {
    const randomChance = Math.random();
    let enemyType = "enemy";
    let points = 1;
    let size = 40;
    
    // Determine enemy type based on random chance:
    if (randomChance < 1 / 30) {
      enemyType = "epicEnemy"; // 4th Cube: Crimson Red Cube
      points = 80;
      size = 80;
    } else if (randomChance < 1 / 15) {
      enemyType = "rareEnemy"; // 3rd Cube: Rare enemy
      points = 30;
      size = 65;
    } else if (randomChance < 1 / 4) {
      enemyType = "uncommonEnemy"; // 2nd Cube: Bonus enemy
      points = 8;
      size = 50;
    }
    
    const enemy = document.createElement("div");
    enemy.classList.add(enemyType);
    // Set size and position; CSS classes will control the visuals (animation, glow, etc.)
    enemy.style.width = `${size}px`;
    enemy.style.height = `${size}px`;
    enemy.style.position = "absolute";
    enemy.style.left = `${Math.random() * (gameArea.clientWidth - size)}px`;
    enemy.style.top = `${Math.random() * (gameArea.clientHeight - size)}px`;
    
    gameArea.appendChild(enemy);
    enemyCount++;
  }
}

setInterval(spawnEnemy, 250);

// --- Collision Detection ---
function checkCollisions() {
  const playerRect = player.getBoundingClientRect();
  const enemies = document.querySelectorAll(".enemy, .uncommonEnemy, .rareEnemy, .epicEnemy");
  
  enemies.forEach((enemy) => {
    const enemyRect = enemy.getBoundingClientRect();
    if (
      playerRect.left < enemyRect.right &&
      playerRect.right > enemyRect.left &&
      playerRect.top < enemyRect.bottom &&
      playerRect.bottom > enemyRect.top
    ) {
      // Update score based on enemy type
      if (enemy.classList.contains("uncommonEnemy")) {
        score += 8;
      } else if (enemy.classList.contains("rareEnemy")) {
        score += 30;
      } else if (enemy.classList.contains("epicEnemy")) {
        score += 80;
      } else {
        score += 1; // Default enemy gives 1 point
      }

      // Update the score display
      scoreDisplay.textContent = `Score: ${score}`;
      
      // Remove the enemy immediately after collision
      enemy.remove();
      enemyCount--;
    }
  });
}

// --- Joystick Pointer Events ---
let activePointerId = null;

function onPointerDown(e) {
  if (activePointerId === null) {
    activePointerId = e.pointerId;
    updateJoystickCenter();
    onPointerMove(e);
    joystickStick.setPointerCapture(activePointerId);
  }
}

function onPointerMove(e) {
  if (e.pointerId !== activePointerId) return;
  
  const dx = e.clientX - joystickCenter.x;
  const dy = e.clientY - joystickCenter.y;
  const distance = Math.min(Math.sqrt(dx * dx + dy * dy), maxRadius);
  const angle = Math.atan2(dy, dx);
  
  const offsetX = Math.cos(angle) * distance;
  const offsetY = Math.sin(angle) * distance;
  
  joystickStick.style.left = `calc(50% + ${offsetX}px)`;
  joystickStick.style.top = `calc(50% + ${offsetY}px)`;
  
  joystickOutput = { x: offsetX / maxRadius, y: offsetY / maxRadius };
}

function onPointerUp(e) {
  if (e.pointerId === activePointerId) {
    resetJoystick();
    activePointerId = null;
    joystickStick.releasePointerCapture(e.pointerId);
  }
}
 
joystickStick.addEventListener("pointerdown", onPointerDown);
joystickStick.addEventListener("pointermove", onPointerMove);
joystickStick.addEventListener("pointerup", onPointerUp);
joystickStick.addEventListener("pointercancel", onPointerUp);

// 1. Disable Right-Click
document.addEventListener("contextmenu", (e) => e.preventDefault());

// 2. Block DevTools Shortcuts
document.onkeydown = function (e) {
    if (
        e.keyCode == 123 || // F12
        (e.ctrlKey && e.shiftKey && (e.keyCode == 73 || e.keyCode == 74)) || // Ctrl + Shift + I or J
        (e.ctrlKey && e.keyCode == 85) // Ctrl + U (View Source)
    ) {
        e.preventDefault();
    }
};

// 3. Detect DevTools Open and Redirect
setInterval(function () {
    if (window.outerHeight - window.innerHeight > 100 || window.outerWidth - window.innerWidth > 100) {
        alert("Developer Tools Detected!");
        window.location.href = "about:blank"; // Redirect user
    }
}, 1000);