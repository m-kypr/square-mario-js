console.log("mario JS loaded");
var cnvs;
var mainDiv;
var roomId;
var roomIdDiv;
var triangleBottomLeft;
var ctx;
var gameInterval;
var player;
var walls;
var coins;
var controller;
var sounds;
var gravity;
var jumpSpeed;
var animations;
var animationQueue;
const spd = 2;
const jumpHeight = 20;
const jump = 8;
const tickRate = 1;
const maxGrav = 3;

class Sounds {
  constructor() {
    this.white = new Audio("/sound/white.mp3");
    this.landing = new Audio("/sound/landing.mp3");
  }
}

class Controller {
  constructor() {
    this.up = 0;
    this.down = 0;
    this.left = 0;
    this.right = 0;
    this.leftMouse = 0;
    this.mousePos = { x: 0, y: 0 };
  }
  keyPressed(ev) {
    if (ev.key === "ArrowUp" || ev.key === "w") {
      this.up = 1;
    }
    if (ev.key === "ArrowDown" || ev.key === "s") {
      this.down = 1;
    }
    if (ev.key === "ArrowLeft" || ev.key === "a") {
      this.left = 1;
    }
    if (ev.key === "ArrowRight" || ev.key === "d") {
      this.right = 1;
    }
  }

  keyReleased(ev) {
    if (ev.key === "ArrowUp" || ev.key === "w") {
      this.up = 0;
    }
    if (ev.key === "ArrowDown" || ev.key === "s") {
      this.down = 0;
    }
    if (ev.key === "ArrowLeft" || ev.key === "a") {
      this.left = 0;
    }
    if (ev.key === "ArrowRight" || ev.key === "d") {
      this.right = 0;
    }
  }
  mousePressed(ev) {
    if (ev.button === 0) {
      this.leftMouse = 1;
    }
    // if (ev.key === "ArrowDown" || ev.key === "s") {
    //   this.down = 1;
    // }
    // if (ev.key === "ArrowLeft" || ev.key === "a") {
    //   this.left = 1;
    // }
    // if (ev.key === "ArrowRight" || ev.key === "d") {
    //   this.right = 1;
    // }
  }
  mouseReleased(ev) {
    if (ev.button === 0) {
      this.leftMouse = 0;
    }
  }

  mouseMove(ev) {
    this.mousePos = { x: ev.pageX, y: ev.pageY };
  }
}

class Player {
  constructor(x, y, w, h, color) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.color = color;
  }
}

class Rect {
  constructor(x, y, w, h) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
  }
}

class Animations {
  constructor() {
    this.landingAnimation = {
      frames: [],
      frameCount: 59,
      name: "landing",
    };
  }
  construct() {
    let allAnims = [this.landingAnimation];
    for (let i = 0; i < allAnims.length; i++) {
      const anim = allAnims[i];
      for (let j = 0; j < anim.frameCount; j++) {
        let img = new Image();
        img.src = `/animation/${anim.name}2/${j}.png`;
        anim.frames.push(img);
      }
    }
  }
}

class Coin {
  constructor(x, y, v) {
    this.x = x;
    this.y = y;
    this.v = v;
    this.rect = new Rect(x, y, v * 6, v * 6);
  }
}

function collision(r1, r2) {
  if (
    r1.x + r1.w > r2.x &&
    r1.x < r2.x + r2.w &&
    r2.y + r2.h > r1.y &&
    r2.y < r1.y + r1.h
  ) {
    return true;
  } else {
    return false;
  }
}
function placeFree(xNew, yNew) {
  var temp = { x: xNew, y: yNew, w: player.w, h: player.h };
  for (let i = 0; i < walls.length; i++) {
    const w = walls[i];
    if (collision(w, temp)) {
      return false;
    }
  }
  return true;
}

function movePlayer() {
  if (controller.leftMouse) {
    if (contains(player, controller.mousePos.x, controller.mousePos.y)) {
      player.x = controller.mousePos.x - player.w / 2;
      player.y = controller.mousePos.y - player.h / 1.5;
      return;
    } else {
      let w = 100;
      let h = 30;
      let r = new Rect(
        controller.mousePos.x - w / 2,
        controller.mousePos.y - h / 2,
        w,
        h
      );

      if (!collision(player, r)) {
        let f = false;
        for (let i = 0; i < walls.length; i++) {
          const w = walls[i];
          if (collision(w, r)) {
            f = true;
            break;
          }
        }
        for (let i = 0; i < coins.length; i++) {
          const c = coins[i];
          if (collision(c.rect, r)) {
            f = true;
            break;
          }
        }
        if (!f) walls.push(r);
      }
    }
  }
  var dir = controller.right - controller.left;
  for (let s = spd; s > 0; s--) {
    if (placeFree(player.x + s * dir, player.y)) {
      player.x += s * dir;
      break;
    }
  }
  if (jumpSpeed > 0) {
    playerJump();
  } else {
    playerFall();
  }
  if (controller.up && !placeFree(player.x, player.y + 1)) {
    jumpSpeed = jumpHeight;
  }
  let collected = [];
  for (let i = 0; i < coins.length; i++) {
    const c = coins[i];
    if (collision(c.rect, player)) {
      collected.push(i);
    }
  }
  collected.forEach((i) => {
    coins.splice(i);
  });
}

function contains(rect, x, y) {
  return (
    rect.x <= x && x <= rect.x + rect.w && rect.y <= y && y <= rect.y + rect.h
  );
}

function playerFall() {
  if (placeFree(player.x, player.y + 1)) {
    gravity += 1;
  } else {
    if (gravity > 0) {
      animationQueue.push({
        a: animations.landingAnimation,
        x: player.x - player.w / 2,
        y: player.y + player.h / 2,
        w: player.w * 2,
        h: player.h * 1,
        f: animations.landingAnimation.frameCount - 1,
      });
      sounds.landing.play();
    }
    gravity = 0;
  }
  if (gravity > maxGrav) gravity = maxGrav;
  for (var i = gravity; i > 0; i--) {
    if (placeFree(player.x, player.y + i)) {
      player.y += i;
      break;
    }
  }
}

function playerJump() {
  for (let s = 0; s < jumpSpeed; s++) {
    if (!placeFree(player.x, player.y - s - jump)) {
      jumpSpeed = s;
      return;
    }
  }
  player.y -= jump;
  jumpSpeed--;
}

function loop() {
  movePlayer();
  ctx.fillStyle = "#808080";
  ctx.fillRect(0, 0, cnvs.width, cnvs.height);
  ctx.beginPath();
  ctx.fillStyle = "#000000";
  ctx.fillRect(player.x, player.y, player.w + 2, player.h);
  ctx.fillStyle = "#666666";
  ctx.fillRect(player.x, player.y, player.w + 1, player.h);
  ctx.fillStyle = player.color;
  ctx.fillRect(player.x, player.y, player.w, player.h);
  ctx.stroke();
  walls.forEach((wall) => {
    ctx.beginPath();
    ctx.fillStyle = "#000000";
    ctx.fillRect(wall.x, wall.y, wall.w + 2, wall.h + 2);
    ctx.fillStyle = "#666666";
    ctx.fillRect(wall.x, wall.y, wall.w + 1, wall.h + 1);
    ctx.fillStyle = "#6495ED";
    ctx.fillRect(wall.x, wall.y, wall.w, wall.h);
    ctx.stroke();
  });
  coins.forEach((c) => {
    ctx.beginPath();
    ctx.strokeStyle = "#000000";
    ctx.fillStyle = "#B8860B";
    ctx.arc(c.x, c.y, c.rect.w / 2, 0, Math.PI * 2, true);
    ctx.stroke();
    ctx.fill();
    ctx.beginPath();
    ctx.arc(c.x, c.y, c.rect.w / 2.2, 0, Math.PI * 2, true);
    ctx.fillStyle = "#FFBF00";
    // ctx.fillStyle = "#000000";s
    ctx.fill();
    ctx.stroke();
    // ctx.beginPath();
    // ctx.arc(c.x, c.y, c.rect.w / 2.2, 0, Math.PI * 2, true);
    // ctx.stroke();
    ctx.font = 3 * c.v + "px monospace";
    ctx.fillStyle = "#000000";
    ctx.beginPath();
    ctx.fillText(c.v, c.x - c.rect.w / 3, c.y + c.rect.h / 5, c.rect.w);
    // ctx.fillText();
  });
  let disposeAnim = [];
  for (let i = 0; i < animationQueue.length; i++) {
    const anim = animationQueue[i];
    if (anim.f > 0) {
      anim.f--;
      ctx.drawImage(anim.a.frames[anim.f], anim.x, anim.y, anim.w, anim.h);
    } else {
      disposeAnim.push(i);
    }
  }
  disposeAnim.forEach((i) => {
    animationQueue.splice(i);
  });
}

function requestUUID(callback) {
  var oReq = new XMLHttpRequest();
  oReq.onreadystatechange = function () {
    if (oReq.readyState == 4 && oReq.status == 200) {
      callback(oReq.responseText);
    }
  };
  oReq.open("GET", "/room");
  oReq.send();
}

function backgroundMusic() {
  let audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  let xhr = new XMLHttpRequest();
  xhr.open("GET", "http://192.168.178.126:4555/sound/white.mp3");
  xhr.responseType = "arraybuffer";
  xhr.addEventListener("load", () => {
    let playsound = (audioBuffer) => {
      let source = audioCtx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioCtx.destination);
      source.loop = false;
      source.start();
      setTimeout(function () {
        // let t = document.createElement("p");
        // t.appendChild(
        //   document.createTextNode(
        //     new Date().toLocaleString() + ": Sound played"
        //   )
        // );
        // document.querySelector(".output").appendChild(t);
        playsound(audioBuffer);
      }, 1000 + Math.random() * 2500);
    };

    audioCtx.decodeAudioData(xhr.response).then(playsound);
  });
  xhr.send();
}

function buildHtml() {
  mainDiv = document.createElement("div");
  cnvs = document.createElement("canvas");
  cnvs.setAttribute("tabindex", "0");
  cnvs.setAttribute("id", "mariocanvas");
  cnvs.style = "color:#483D8B";
  resize();
  roomIdDiv = document.createElement("div");
  roomIdDiv.style.position = "absolute";
  roomIdDiv.style.left = "0px";
  roomIdDiv.style.top = cnvs.height - 100 + "px";
  roomIdDiv.style.width = "200px";
  roomIdDiv.style.height = "100px";
  roomIdDiv.style.font = "40px monospace";
  roomIdDiv.style.verticalAlign = "bottom";
  roomIdDiv.style.display = "table-cell";
  roomIdDiv.addEventListener("mouseover", (ev) => {
    roomIdDiv.innerHTML = roomId;
  });
  roomIdDiv.addEventListener("mouseleave", (ev) => {
    roomIdDiv.innerHTML = "";
  });
  roomIdDiv.addEventListener("mousedown", (ev) => {
    var p = document.createElement("p");
    p.style.font = "20px monospace";
    p.style.position = "absolute";
    p.style.left = controller.mousePos.x;
    p.style.top = controller.mousePos.y - 20;
    if (roomId == undefined) {
      p.innerHTML = "No room id";
    } else {
      var range = document.createRange();
      range.selectNode(roomIdDiv);
      window.getSelection().addRange(range);
      var success = document.execCommand("copy");
      if (success) p.innerHTML = "Copied to clipboard";
      else p.innerHTML = "Copy failed!";
    }
    mainDiv.appendChild(p);
    setTimeout(() => {
      p.remove();
    }, 1000);
  });
  mainDiv.appendChild(roomIdDiv);
  mainDiv.appendChild(cnvs);
  mainDiv.style = "margin:0";
  document.body.appendChild(mainDiv);
  document.body.style = "margin:0";

  cnvs.addEventListener("keydown", (ev) => controller.keyPressed(ev));
  cnvs.addEventListener("keyup", (ev) => controller.keyReleased(ev));
  cnvs.addEventListener("mousedown", (ev) => controller.mousePressed(ev));
  cnvs.addEventListener("mouseup", (ev) => controller.mouseReleased(ev));
  cnvs.addEventListener("mousemove", (ev) => controller.mouseMove(ev));
}

function main() {
  // backgroundMusic();
  requestUUID((txt) => {
    roomId = JSON.parse(txt).uuid;
  });
  buildHtml();
  ctx = cnvs.getContext("2d");
  controller = new Controller();
  sounds = new Sounds();
  animations = new Animations();
  animations.construct();
  animationQueue = [];
  // spd = (cnvs.width / 2048) * tickRate;
  gravity = 0;
  jumpSpeed = 0;
  // var audio = document.createElement("audio");
  // audio.loop = true;
  // audio.autoplay = true;
  // audio.load();
  // audio.addEventListener(
  //   "load",
  //   function () {
  //     audio.play();
  //   },
  //   true
  // );
  // audio.src = "/sound/white.mp3";
  // audio.play();

  gameInterval = setInterval(loop, tickRate);
}

function resize() {
  cnvs.width = document.body.clientWidth;
  cnvs.height = document.body.clientHeight;
  player = new Player(50, 0, 33, 33, "#800000");
  walls = [
    new Rect(0, 0, 50, cnvs.height),
    new Rect(cnvs.width - 50, 0, 50, cnvs.height),
    new Rect(0, cnvs.height - 75, cnvs.width, 75),
    new Rect(cnvs.width - 200, cnvs.height - 200, 100, 50),
    new Rect(cnvs.width - 400, cnvs.height - 300, 100, 50),
    new Rect(50, cnvs.height - 300, 100, 50),
  ];
  coins = [new Coin(cnvs.width / 2, 50, 15)];
}

window.onload = main;
window.onresize = resize;
