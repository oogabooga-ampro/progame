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
    musicButton.innerHTML = "🔊"; // Unmute icon
  }
  isMusicPlaying = !isMusicPlaying;
}
musicButton.addEventListener("click", toggleMusic);

// --- Start Screen Logic ---
// (Assumes your HTML includes a start screen with id="startScreen" and a button with id="startButton")
const startScreen = document.getElementById("startScreen");
const startButton = document.getElementById("startButton");
startButton.addEventListener("click", startGame);

function startGame() {
  // Hide the start screen
  startScreen.style.display = "none";
  // Show game area and player
  gameArea.style.display = "block";
  gameArea.style.opacity = "1"; // Make the game area visible
  player.style.display = "block";
  // Start music on game start
  music.play().catch((error) => console.log("Autoplay blocked:", error));
  isMusicPlaying = true;
  // Center the player now that the game area is visible
  updatePlayerPosition();
  // Start the game loop
  requestAnimationFrame(gameLoop);
}

// --- Game Logic and Joystick Controls ---
const maxRadius = 50; // Maximum displacement from center
let joystickCenter = { x: 0, y: 0 };
let joystickOutput = { x: 0, y: 0 };

let playerPos = { x: gameArea.clientWidth / 2, y: gameArea.clientHeight / 2 };
const playerSpeed = 4; // Adjust for desired speed
let score = 0;

function updatePlayerPosition() {
  // Center the player in the game area
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

// --- Joystick Pointer Events ---
let activePointerId = null;

function onPointerDown(e) {
  if (activePointerId === null) {
    activePointerId = e.pointerId;
    updateJoystickCenter();
    onPointerMove(e); // Update immediately
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

joystickContainer.addEventListener("touchmove", function(e) {
  e.preventDefault();
}, { passive: false });

// --- Keyboard Controls for Desktop ---
function onKeyDown(e) {
  let dx = 0, dy = 0;
  if (e.key === "ArrowLeft" || e.key.toLowerCase() === "a") dx = -1;
  else if (e.key === "ArrowRight" || e.key.toLowerCase() === "d") dx = 1;
  
  if (e.key === "ArrowUp" || e.key.toLowerCase() === "w") dy = -1;
  else if (e.key === "ArrowDown" || e.key.toLowerCase() === "s") dy = 1;
  
  playerPos.x += dx * playerSpeed * 5;
  playerPos.y += dy * playerSpeed * 5;
  
  const areaWidth = gameArea.clientWidth;
  const areaHeight = gameArea.clientHeight;
  playerPos.x = Math.max(0, Math.min(areaWidth - player.clientWidth, playerPos.x));
  playerPos.y = Math.max(0, Math.min(areaHeight - player.clientHeight, playerPos.y));
  
  player.style.left = playerPos.x + "px";
  player.style.top = playerPos.y + "px";
}

if (!isMobileDevice()) {
  joystickContainer.style.display = "none";
  document.addEventListener("keydown", onKeyDown);
}

// --- Enemy Spawning ---
let enemyCount = 0;
const maxEnemies = 15;

function spawnEnemy() {
  if (enemyCount < maxEnemies) {
    const isBonus = Math.random() < 0.25;
    const enemy = document.createElement("div");
    if (isBonus) {
      enemy.classList.add("bonusEnemy");
      enemy.style.width = "50px";
      enemy.style.height = "50px";
    } else {
      enemy.classList.add("enemy");
      enemy.style.width = "40px";
      enemy.style.height = "40px";
    }
    enemy.style.position = "absolute";
    enemy.style.left = `${Math.random() * (gameArea.clientWidth - 50)}px`;
    enemy.style.top = `${Math.random() * (gameArea.clientHeight - 50)}px`;
    gameArea.appendChild(enemy);
    enemyCount++;
    enemy.addEventListener("click", () => {
      enemy.remove();
      score += isBonus ? 5 : 1;
      scoreDisplay.textContent = `Score: ${score}`;
      enemyCount--;
    });
  }
}

setInterval(spawnEnemy, 1200);

// --- Collision Detection ---
function checkCollisions() {
  const playerRect = player.getBoundingClientRect();
  const enemies = document.querySelectorAll(".enemy, .bonusEnemy");
  enemies.forEach((enemy) => {
    const enemyRect = enemy.getBoundingClientRect();
    if (
      playerRect.left < enemyRect.right &&
      playerRect.right > enemyRect.left &&
      playerRect.top < enemyRect.bottom &&
      playerRect.bottom > enemyRect.top
    ) {
      enemy.remove();
      score += enemy.classList.contains("bonusEnemy") ? 5 : 1;
      scoreDisplay.textContent = `Score: ${score}`;
      enemyCount--;
    }
  });
}

// --- Start Music Automatically ---
// This line will attempt to start music if the game is started via the start screen.
music.play().catch((error) => console.log("Autoplay blocked:", error));
isMusicPlaying = true;