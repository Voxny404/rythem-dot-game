let isAPressed = false, isSPressed = false, isDPressed = false, isFPressed = false, isGPressed = false;

// -------------------- KEYBOARD & GAMEPAD --------------------
document.addEventListener("keydown", e => {
    if (e.key === "a") { isAPressed = true; game.checkHit(0); }
    if (e.key === "s") { isSPressed = true; game.checkHit(1); }
    if (e.key === "d") { isDPressed = true; game.checkHit(2); }
    if (e.key === "f") { isFPressed = true; game.checkHit(3); }
    if (e.key === "g") { isGPressed = true; game.checkHit(4); }
});

document.addEventListener("keyup", e => {
    if (e.key === "a") isAPressed = false;
    if (e.key === "s") isSPressed = false;
    if (e.key === "d") isDPressed = false;
    if (e.key === "f") isFPressed = false;
    if (e.key === "g") isGPressed = false;
});

function updateGamepadState() {
    const gps = navigator.getGamepads?.();
    if (!gps) return;
    const gp = gps[0];
    if (!gp) return;

    isAPressed = gp.buttons[6]?.pressed;
    isSPressed = gp.buttons[4]?.pressed;
    isDPressed = gp.buttons[3]?.pressed;
    isFPressed = gp.buttons[5]?.pressed;
    isGPressed = gp.buttons[7]?.pressed;

    if (isAPressed) game.checkHit(0);
    if (isSPressed) game.checkHit(1);
    if (isDPressed) game.checkHit(2);
    if (isFPressed) game.checkHit(3);
    if (isGPressed) game.checkHit(4);
}
