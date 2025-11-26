/* =========================================
   game.js - Versão Final HD (Com A/D corrigidos)
   ========================================= */

// --- CONSTANTES E VARIÁVEIS GLOBAIS ---
const TARGET_FLOWERS = 10;
const GAME_TIME_SEC = 60;
const INITIAL_LIVES = 3;

const menuCanvas = document.getElementById('menuCanvas');
const menuCtx = menuCanvas.getContext('2d');
const btnStart = document.getElementById('btnStart');
const gameCanvas = document.getElementById('gameCanvas');
const ctx = gameCanvas.getContext('2d');

// Tamanho HD (1080x720)
const W = gameCanvas.width;
const H = gameCanvas.height;

let running = false;
let inMenu = true;
let flowersCollected = 0;
let timeLeft = GAME_TIME_SEC;
let lives = INITIAL_LIVES;

// Variáveis de Tempo
let lastTime = 0;
let timeAccumulator = 0;

// Objeto de teclas
const keys = {
  ArrowLeft: false, 
  ArrowRight: false,
  a: false, 
  d: false
};

// --- ÁUDIO ---
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

class Som {
  constructor(type = 'sine') { this.type = type; }
  play(freq = 440, duration = 0.12, gainVal = 0.1) {
    if (audioCtx.state === 'suspended') audioCtx.resume().catch(e=>console.error(e));
    try {
      const o = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      o.type = this.type;
      o.frequency.value = freq;
      g.gain.value = gainVal;
      o.connect(g);
      g.connect(audioCtx.destination);
      o.start();
      o.stop(audioCtx.currentTime + duration);
    } catch (e) { console.error(e); }
  }
}

const somFlor = new Som('sine');
const somColisao = new Som('square');
const somGameOver = new Som('sawtooth');
const somVictory = new Som('triangle');

// --- CARREGAMENTO DE IMAGENS ---
const assets = { bee:[], spider:[], flower:[], bg:null, start:null, gameover:null, youwin:null };
let assetsToLoad = 0;

function loadImage(path, callback){
  assetsToLoad++;
  const img = new Image();
  img.onload = ()=>{ assetsToLoad--; if(callback) callback(img); };
  img.onerror = ()=>{ console.error("Erro img: " + path); assetsToLoad--; };
  img.src = path;
  return img;
}

for(let i=1; i<=4; i++){
  assets.bee.push(loadImage('img/bee'+i+'.png'));
  assets.spider.push(loadImage('img/spider'+i+'.png'));
}
assets.flower.push(loadImage('img/flower1.png'));
assets.flower.push(loadImage('img/flower2.png'));
assets.bg = loadImage('img/bg.png');
assets.start = loadImage('img/start.png');
assets.gameover = loadImage('img/gameover.png'); 
assets.youwin = loadImage('img/youwin.png');

// --- CLASSES DO JOGO ---

class Background {
  constructor(){ }
  update(){ }
  draw(ctx){
    if(assets.bg && assets.bg.width > 0){
      ctx.drawImage(assets.bg, 0, 0, W, H);
    } else {
      ctx.fillStyle = '#bfe6ff';
      ctx.fillRect(0, 0, W, H);
    }
  }
}

class Player {
  constructor(){
    this.w = 70; 
    this.h = 60;
    this.x = W/2 - this.w/2; 
    this.y = H - 100; 
    this.speed = 500; 
    this.frameIndex = 0;
    this.frameTimer = 0;
  }
  update(dt){
    let dx = 0;
    
    // VERIFICAÇÃO DE TECLAS (Seta ou A/D)
    if(keys.ArrowLeft || keys.a)  dx = -1;
    if(keys.ArrowRight || keys.d) dx = 1;

    this.x += dx * this.speed * dt;

    if(this.x < 0) this.x = 0;
    if(this.x + this.w > W) this.x = W - this.w;

    this.frameTimer += dt;
    if(this.frameTimer > 0.1){
      this.frameTimer = 0;
      this.frameIndex = (this.frameIndex + 1) % assets.bee.length;
    }
  }
  draw(ctx){
    let img = assets.bee[this.frameIndex];
    if(img && img.complete && img.width > 0){
      ctx.drawImage(img, this.x, this.y, this.w, this.h);
    } else {
      ctx.fillStyle = 'yellow';
      ctx.fillRect(this.x, this.y, this.w, this.h);
    }
  }
}

class Enemy {
  constructor(){
    this.w = 55; this.h = 55;
    this.reset(true);
  }
  reset(initial = false){
    this.x = Math.random() * (W - this.w);
    if(initial) this.y = -Math.random() * H; 
    else this.y = -Math.random() * 200 - 50;
    this.speed = 300 + Math.random() * 300; 
    this.frameIndex = 0;
    this.frameTimer = 0;
  }
  update(dt){
    this.y += this.speed * dt;
    if(this.y > H) this.reset();
    this.frameTimer += dt;
    if(this.frameTimer > 0.15){
      this.frameTimer = 0;
      this.frameIndex = (this.frameIndex + 1) % assets.spider.length;
    }
  }
  draw(ctx){
    let img = assets.spider[this.frameIndex];
    if(img && img.complete && img.width > 0){
      ctx.drawImage(img, this.x, this.y, this.w, this.h);
    } else {
      ctx.fillStyle = 'black';
      ctx.fillRect(this.x, this.y, this.w, this.h);
    }
  }
}

class Item {
  constructor(){
    this.w = 40; this.h = 40;
    this.reset();
  }
  reset(){
    this.x = Math.random() * (W - this.w);
    this.y = -Math.random() * 500 - 50; 
    this.speed = 250 + Math.random() * 200;
    this.type = Math.floor(Math.random()*2);
  }
  update(dt){
    this.y += this.speed * dt;
    if(this.y > H) this.reset();
  }
  draw(ctx){
    let img = assets.flower[this.type];
    if(img && img.complete && img.width > 0){
      ctx.drawImage(img, this.x, this.y, this.w, this.h);
    } else {
      ctx.fillStyle = 'pink';
      ctx.fillRect(this.x, this.y, this.w, this.h);
    }
  }
}

// --- INSTÂNCIAS ---
const bg = new Background();
const player = new Player();
const enemies = [new Enemy(), new Enemy(), new Enemy(), new Enemy(), new Enemy()]; 
const flower = new Item();

// --- FUNÇÕES DE CONTROLE ---

function resetGame(){
  lives = INITIAL_LIVES;
  flowersCollected = 0;
  timeLeft = GAME_TIME_SEC;
  
  player.x = W/2 - player.w/2;
  player.y = H - 100;
  
  enemies.forEach(e => e.reset(true));
  flower.reset();
  
  running = true;
  inMenu = false;
  lastTime = 0;
  timeAccumulator = 0;

  gameCanvas.style.display = 'block';
  menuCanvas.style.display = 'none';
  btnStart.style.display = 'none';
  
  requestAnimationFrame(loop);
}

function gameOver(win){
  running = false;
  inMenu = true;
  if(win) somVictory.play(500, 0.4, 0.1);
  else somGameOver.play(150, 0.4, 0.1);

  setTimeout(()=>{
    gameCanvas.style.display = 'none';
    menuCanvas.style.display = 'block';
    btnStart.style.display = 'inline-block';
    btnStart.textContent = "Jogar Novamente";
    drawMenu(win ? "WIN" : "LOSE"); 
  }, 100);
}

function checkCollisions(){
  for(let e of enemies){
    if(rectIntersect(player.x, player.y, player.w, player.h, e.x, e.y, e.w, e.h)){
      somColisao.play(150, 0.1);
      lives--;
      e.reset(); 
      if(lives <= 0) gameOver(false);
    }
  }
  if(rectIntersect(player.x, player.y, player.w, player.h, flower.x, flower.y, flower.w, flower.h)){
    somFlor.play(600, 0.1);
    flowersCollected++;
    flower.reset(); 
    if(flowersCollected >= TARGET_FLOWERS) gameOver(true);
  }
}

function rectIntersect(x1, y1, w1, h1, x2, y2, w2, h2) {
    let padding = 10;
    return x2 < x1 + w1 - padding && x2 + w2 > x1 + padding && 
           y2 < y1 + h1 - padding && y2 + h2 > y1 + padding;
}

function update(dt){
  timeAccumulator += dt;
  if(timeAccumulator >= 1){
    timeLeft--;
    timeAccumulator = 0;
    if(timeLeft <= 0) gameOver(false);
  }
  bg.update();
  player.update(dt);
  enemies.forEach(e => e.update(dt));
  flower.update(dt);
  checkCollisions();
}

function draw(){
  ctx.clearRect(0, 0, W, H);
  bg.draw(ctx);
  player.draw(ctx);
  enemies.forEach(e => e.draw(ctx));
  flower.draw(ctx);

  ctx.fillStyle = 'white';
  ctx.font = 'bold 28px sans-serif';
  ctx.strokeStyle = 'black';
  ctx.lineWidth = 4;
  
  let txtVidas = "Vidas: " + lives;
  ctx.strokeText(txtVidas, 20, 40);
  ctx.fillText(txtVidas, 20, 40);

  let txtFlores = "Flores: " + flowersCollected + "/" + TARGET_FLOWERS;
  ctx.strokeText(txtFlores, 20, 80);
  ctx.fillText(txtFlores, 20, 80);

  let txtTempo = "Tempo: " + timeLeft;
  ctx.strokeText(txtTempo, W - 180, 40);
  ctx.fillText(txtTempo, W - 180, 40);
}

function loop(ts){
  if(!running) return;
  if(!lastTime) lastTime = ts;
  const dt = (ts - lastTime) / 1000;
  lastTime = ts;
  if(dt > 0 && dt < 0.1) update(dt);
  draw();
  requestAnimationFrame(loop);
}

function drawMenu(status = null){
  menuCtx.clearRect(0, 0, W, H);
  
  const drawCenteredImage = (img) => { menuCtx.drawImage(img, 0, 0, W, H); };
  const drawCenteredText = (text, color) => {
    menuCtx.fillStyle = color;
    menuCtx.font = 'bold 60px sans-serif';
    menuCtx.textAlign = 'center';
    menuCtx.fillText(text, W/2, H/2);
    menuCtx.textAlign = 'left';
  };

  if(status === "WIN"){
    if(assets.youwin && assets.youwin.complete && assets.youwin.width > 0) drawCenteredImage(assets.youwin);
    else {
        menuCtx.fillStyle = '#4caf50';
        menuCtx.fillRect(0,0, W, H);
        drawCenteredText("VITÓRIA!", "white");
    }
    return;
  }
  if(status === "LOSE"){
    if(assets.gameover && assets.gameover.complete && assets.gameover.width > 0) drawCenteredImage(assets.gameover);
    else {
        menuCtx.fillStyle = '#f44336';
        menuCtx.fillRect(0,0, W, H);
        drawCenteredText("GAME OVER", "white");
    }
    return;
  }
  if(assets.start && assets.start.complete && assets.start.width > 0) drawCenteredImage(assets.start);
  else {
     menuCtx.fillStyle = '#bfe6ff';
     menuCtx.fillRect(0,0, W, H);
     menuCtx.fillStyle = '#123';
     menuCtx.font = 'bold 50px sans-serif';
     menuCtx.textAlign = 'center';
     menuCtx.fillText("Jogo da Abelha", W/2, H/2);
     menuCtx.textAlign = 'left';
  }
  if(assetsToLoad > 0){
      menuCtx.fillStyle = 'black';
      menuCtx.font = '24px sans-serif';
      menuCtx.textAlign = 'center';
      menuCtx.fillText("Carregando...", W/2, H - 50);
  }
}

// Inicialização
btnStart.addEventListener('click', () => {
  if (audioCtx.state === 'suspended') audioCtx.resume();
  resetGame();
});

// --- CONTROLES ATUALIZADOS PARA ACEITAR MAIÚSCULAS/MINÚSCULAS ---

window.addEventListener('keydown', e => {
  const key = e.key;
  if(key === 'ArrowLeft') keys.ArrowLeft = true;
  if(key === 'ArrowRight') keys.ArrowRight = true;
  // Aceita 'a' ou 'A'
  if(key === 'a' || key === 'A') keys.a = true;
  // Aceita 'd' ou 'D'
  if(key === 'd' || key === 'D') keys.d = true;
});

window.addEventListener('keyup', e => {
  const key = e.key;
  if(key === 'ArrowLeft') keys.ArrowLeft = false;
  if(key === 'ArrowRight') keys.ArrowRight = false;
  if(key === 'a' || key === 'A') keys.a = false;
  if(key === 'd' || key === 'D') keys.d = false;
});

gameCanvas.addEventListener('touchmove', e => {
    e.preventDefault();
    const touch = e.touches[0];
    const rect = gameCanvas.getBoundingClientRect();
    const touchX = touch.clientX - rect.left;
    player.x = touchX - player.w/2;
}, {passive: false});

setTimeout(drawMenu, 100);