// ---------------------------------------------------------------------------
// Shared analog touch-input singleton.
//
// The on-screen virtual joystick (components/game/ui/HUD.tsx) writes to this
// object on every pointer move; Player.tsx reads it inside its useFrame loop.
// Keeping it OUT of the zustand store is deliberate: thumbstick updates fire
// dozens of times per second and we never want them to trigger a React render.
// Mutating a plain module-level object is allocation-free and frame-cheap.
//
// Axis convention matches WASD / the camera framing:
//   x  → world +X  (screen right)
//   z  → world +Z  (screen down).  Screen "up" is -Z, i.e. "forward", exactly
//        like pressing W (which does tmpDir.z -= 1). Player normalizes (x,z),
//        so these only need to encode direction; `mag` carries the analog
//        throttle (0 = idle, 1 = full tilt) after a dead-zone is applied.
// ---------------------------------------------------------------------------

export interface TouchMoveState {
  x: number;
  z: number;
  mag: number;
  active: boolean;
  sprint: boolean;
}

export const touchMove: TouchMoveState = {
  x: 0,
  z: 0,
  mag: 0,
  active: false,
  sprint: false,
};

/** Joystick drag → analog move. `x`/`z` are raw (un-normalized) direction. */
export function setTouchMove(x: number, z: number, mag: number) {
  touchMove.x = x;
  touchMove.z = z;
  touchMove.mag = mag;
  touchMove.active = mag > 0.001;
}

/** Joystick released / disabled. */
export function clearTouchMove() {
  touchMove.x = 0;
  touchMove.z = 0;
  touchMove.mag = 0;
  touchMove.active = false;
}

/** Sprint button held / toggled. */
export function setTouchSprint(on: boolean) {
  touchMove.sprint = on;
}
