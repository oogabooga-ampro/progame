// Device detection using userAgent
function isMobileDevice() {
  return /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

// --- Existing Code ---
// Get DOM elements
const player = document.getElementById("player");
const gameArea = document.getElementById("gameArea");
const joystickContainer = document.getElementById("joystickContainer");
const joystickBase = document.getElementById("joystickBase");
const joystickStick = document.getElementById("joystickStick");

// Joystick configuration
const maxRadius = 50; // maximum displacement of the stick from center

// Joystick center coordinates (will be computed)
let joystickCenter = { x: 0, y: 0 };

// Current joystick output (normalized vector)
let joystickOutput = { x: 0, y: 0 };

// Player position and speed
let playerPos = { x: gameArea.clientWidth / 2, y: gameArea.clientHeight / 2 };
const playerSpeed = 2; // Adjust for desired speed

// Setup joystick center (based on the base element's position)
function updateJoystickCenter() {
  const rect = joystickBase.getBoundingClientRect();
  joystickCenter = {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2,
  };
}

// Reset joystick stick to center
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

// Game loop
function gameLoop() {
  updatePlayer();
  requestAnimationFrame(gameLoop);
}
requestAnimationFrame(gameLoop);

// Joystick interaction using pointer events
let activePointerId = null;

function onPointerDown(e) {
  if (activePointerId === null) {
    activePointerId = e.pointerId;
    updateJoystickCenter();
    onPointerMove(e); // Update position immediately
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

joystickContainer.addEventListener("touchmove", function(e) {
  e.preventDefault();
}, { passive: false });

// --- Keyboard Controls for Desktop ---
function onKeyDown(e) {
  let dx = 0;
  let dy = 0;
  
  if (e.key === "ArrowLeft" || e.key.toLowerCase() === "a") {
    dx = -1;
  } else if (e.key === "ArrowRight" || e.key.toLowerCase() === "d") {
    dx = 1;
  }
  
  if (e.key === "ArrowUp" || e.key.toLowerCase() === "w") {
    dy = -1;
  } else if (e.key === "ArrowDown" || e.key.toLowerCase() === "s") {
    dy = 1;
  }
  
  playerPos.x += dx * playerSpeed * 5;
  playerPos.y += dy * playerSpeed * 5;
  
  const areaWidth = gameArea.clientWidth;
  const areaHeight = gameArea.clientHeight;
  playerPos.x = Math.max(0, Math.min(areaWidth - player.clientWidth, playerPos.x));
  playerPos.y = Math.max(0, Math.min(areaHeight - player.clientHeight, playerPos.y));
  
  player.style.left = playerPos.x + "px";
  player.style.top = playerPos.y + "px";
}

// Use the userAgent check to decide:
if (!isMobileDevice()) {
  joystickContainer.style.display = "none";
  document.addEventListener("keydown", onKeyDown);
}