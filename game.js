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

// Joystick configuration
const maxRadius = 50; // Maximum displacement from center
let joystickCenter = { x: 0, y: 0 };
let joystickOutput = { x: 0, y: 0 };

// Player position and speed
let playerPos = {
  x: gameArea.clientWidth / 2,
  y: gameArea.clientHeight / 2
};
const playerSpeed = 4; // Adjust for desired speed

// Score variable
let score = 0;

// Update joystick center (using joystickBase's bounding rect)
function updateJoystickCenter() {
  const rect = joystickBase.getBoundingClientRect();
  joystickCenter = {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2,
  };
}

// Reset joystick stick to center position
function resetJoystick() {
  joystickStick.style.left = "50%";
  joystickStick.style.top = "50%";
  joystickOutput = { x: 0, y: 0 };
}

// Update player position based on joystickOutput
function updatePlayer() {
  playerPos.x += joystickOutput.x * playerSpeed;
  playerPos.y += joystickOutput.y * playerSpeed;
  
  // Clamp player position to game area
  const areaWidth = gameArea.clientWidth;
  const areaHeight = gameArea.clientHeight;
  playerPos.x = Math.max(0, Math.min(areaWidth - player.clientWidth, playerPos.x));
  playerPos.y = Math.max(0, Math.min(areaHeight - player.clientHeight, playerPos.y));
  
  player.style.left = playerPos.x + "px";
  player.style.top = playerPos.y + "px";
}

// Main game loop (only updates player and checks collisions)
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
  
  // Update joystick stick position using CSS calc()
  joystickStick.style.left = `calc(50% + ${offsetX}px)`;
  joystickStick.style.top = `calc(50% + ${offsetY}px)`;
  
  // Normalize the joystick output
  joystickOutput = {
    x: offsetX / maxRadius,
    y: offsetY / maxRadius
  };
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

// Prevent default touchmove on joystick container
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

// For desktop, hide joystick and use keyboard
if (!isMobileDevice()) {
  joystickContainer.style.display = "none";
  document.addEventListener("keydown", onKeyDown);
}

// --- Enemy Spawning ---
let enemyCount = 0;
const maxEnemies = 15; // Maximum number of enemies on screen

function spawnEnemy() {
  if (enemyCount < maxEnemies) {
    const enemy = document.createElement("div");
    enemy.classList.add("enemy");
    enemy.style.width = "40px";
    enemy.style.height = "40px";
    enemy.style.backgroundColor = "red";
    enemy.style.position = "absolute";
    enemy.style.left = `${Math.random() * (gameArea.clientWidth - 50)}px`;
    enemy.style.top = `${Math.random() * (gameArea.clientHeight - 50)}px`;
    gameArea.appendChild(enemy);
    enemyCount++;

    // Click on enemy to remove and add score
    enemy.addEventListener("click", () => {
      enemy.remove();
      score++;
      scoreDisplay.textContent = `Score: ${score}`;
      enemyCount--;
    });
  }
}
// Spawn enemy every 2 seconds
setInterval(spawnEnemy, 1000);

// --- Collision Detection ---
function checkCollisions() {
  const playerRect = player.getBoundingClientRect();
  const enemies = document.querySelectorAll(".enemy");
  
  enemies.forEach((enemy) => {
    const enemyRect = enemy.getBoundingClientRect();
    if (
      playerRect.left < enemyRect.right &&
      playerRect.right > enemyRect.left &&
      playerRect.top < enemyRect.bottom &&
      playerRect.bottom > enemyRect.top
    ) {
      enemy.remove();
      score++;
      scoreDisplay.textContent = `Score: ${score}`;
      enemyCount--;
    }
  });
}