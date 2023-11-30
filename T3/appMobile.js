/**
 * Andressa Augusta Ferrugini de Oliveira - 201665251C
 * Camila Correa Vieira - 201735006
 * Rosa Maria Ottoni Fernandes Maciel - 202025506
 */

// Importação das bibliotecas e funções necessárias
import * as THREE from "three";
import { initRenderer, setDefaultMaterial, initDefaultBasicLight, SecondaryBox, getMaxSize } from "../libs/util/util.js";
import { CSG } from '../libs/other/CSGMesh.js'
import { OrbitControls } from '../build/jsm/controls/OrbitControls.js';
import {OBJLoader} from '../build/jsm/loaders/OBJLoader.js';
import {MTLLoader} from '../build/jsm/loaders/MTLLoader.js';

// Inicialização de variáveis importantes
let scene, renderer, light, cameraPerspective, startTime, currentTime; // Variáveis iniciais
//let loadingMessage = new SecondaryBox("Loading..."); //mensagem de carregamento da espaco nave
let assetManager = {
  // Properties
  spaceship: null,
  allLoaded: false, 
  // Functions 
  checkLoaded : function() {
     if(!this.allLoaded)
     {
        if(this.spaceship){
            this.allLoaded = true;
            //loadingMessage.hide(); 
        }
     }
  },   
  hideAll : function() {
     this.spaceship.visible = false;
  }
}

const textureLoader = new THREE.CubeTextureLoader();
const skyboxTexture = textureLoader.load([
  'skybox/Daylight Box_Right.bmp',
  'skybox/Daylight Box_Left.bmp',
  'skybox/Daylight Box_Top.bmp',
  'skybox/Daylight Box_Bottom.bmp',
  'skybox/Daylight Box_Front.bmp',
  'skybox/Daylight Box_Back.bmp'
]);

//textura
var textureLoader2 = new THREE.TextureLoader();
var tile = textureLoader2.load('tijolo.jpg');
var orange = textureLoader2.load('texture_orange.jpeg');

scene = new THREE.Scene(); // Cria a cena principal
// Configure a cena para usar a textura da skybox como fundo
scene.background = skyboxTexture;
renderer = initRenderer(); // Inicializa o renderizador (função em util/utils)
light = initDefaultBasicLight(scene); // Cria uma luz básica para iluminar a cena

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5); // Cor branca, intensidade 0.5
directionalLight.position.set(0, -20, 20); // Defina a posição da luz
directionalLight.castShadow = true;
scene.add(directionalLight); // Adicione a luz à cena

// Definição de variáveis para o jogo
var initialVelocity = 0.1;
var timeToDoubleSpeed = 15000; // Tempo (em milissegundos) para dobrar a velocidade
var velocity = initialVelocity;

//audio
const listener = new THREE.AudioListener();
const audioLoader = new THREE.AudioLoader();
const collisionSound = new THREE.Audio(listener);
const collision2Sound = new THREE.Audio(listener);
const hitterCollisionSound = new THREE.Audio(listener);
audioLoader.load('../assets/sounds/bloco1.mp3', function (buffer) {
  collisionSound.setBuffer(buffer);
});
audioLoader.load('../assets/sounds/bloco2.mp3', function (buffer) {
  collision2Sound.setBuffer(buffer);
});
audioLoader.load('../assets/sounds/rebatedor.mp3', function (buffer) {
  hitterCollisionSound.setBuffer(buffer);
});

var fov = 33; // Ângulo de visão (FOV)
var w = window.innerWidth;
var h = window.innerHeight;
cameraPerspective = new THREE.PerspectiveCamera(
  fov,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
cameraPerspective.position.set(0, -20, 20);
cameraPerspective.lookAt(0, 0, 0);

function onWindowResize(camera, renderer) {
  var w = window.innerWidth;
  var h = window.innerHeight;
  renderer.setSize(w, h);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();

  // Para preencher sempre a altura máxima da janela
  camera.fov = (h / window.innerHeight) * fov;
}
var raycaster = new THREE.Raycaster();
raycaster.layers.enable(0);
cameraPerspective.layers.enable(0);

// Definição de variáveis para o jogo
var
  spacing = 0.05,
  field_w = 16.7,
  field_h = 33.4,
  ball_radius = 0.15,
  hitter_w = 2.5,
  ball_pos_y = -6.8,
  rows = 6,
  columns = 11,
  cont = rows * columns,
  running = false,
  isPaused = false,
  isFullscreen = false,
  remove = false,
  nivel = 1,
  ball,
  hitter,
  bbBall,
  bbHitter,
  bricksGeometry,
  bricksMaterial,
  bricks,
  canCollideWithHitter = true,
  can2CollideWithHitter = true,
  secondBall,
  bbSecondBall,
  space,
  powerUp,
  powerGeometry,
  powerMaterial,
  vidas = 5;

//vidas
let msgVidas = new SecondaryBox();
msgVidas.changeMessage("Vidas: " + vidas);

let blocksRemoved = 0;
let blocksRemoved2 = 0;

var bricksInfo = new Array(rows);

for (var i = 0; i < rows; i++) {
  bricksInfo[i] = new Array(columns);
}

// Criação de uma lista de objetos de plano
let object = [];
let isOrbiting = false;
let controls;
let plane, planeGeometry, planeMaterial;

planeGeometry = new THREE.PlaneGeometry(w, h, 1, 1);
planeMaterial = setDefaultMaterial();
planeMaterial.side = THREE.DoubleSide;
planeMaterial.transparent = true;
planeMaterial.opacity = 0.0;
plane = new THREE.Mesh(planeGeometry, planeMaterial);
scene.add(plane);
object.push(plane);

function updateObject(mesh) {
  mesh.matrixAutoUpdate = false;
  mesh.updateMatrix();
}

// Função para iniciar o movimento da bola
function startBallMovement() {
  ball.$directionAngle = THREE.MathUtils.degToRad(90);
  ball.$velocity = {
    x: Math.cos(ball.$directionAngle) * velocity,
    y: Math.sin(ball.$directionAngle) * velocity
  };
  ball.$stopped = false;
}

function updateBallVelocity(normal) {
  var inner = ball.$velocity.x * normal.x + ball.$velocity.y * normal.y;
  ball.$velocity.x = -2 * inner * normal.x + ball.$velocity.x;
  ball.$velocity.y = -2 * inner * normal.y + ball.$velocity.y;

}
function update2BallVelocity(normal) {
  if (secondBall) {
    var inner = secondBall.$velocity.x * normal.x + secondBall.$velocity.y * normal.y;
    secondBall.$velocity.x = -2 * inner * normal.x + secondBall.$velocity.x;
    secondBall.$velocity.y = -2 * inner * normal.y + secondBall.$velocity.y;
  }
}

// Função para processar o movimento da bola
function processBallMovement() {
  currentTime = Date.now(); // Obtém o tempo atual
  // Verifica se todos os tijolos foram destruídos
  if (cont == 0 && nivel == 1) {
    nivel = 2;
    rows = 14;
    columns = 9;
    cont = rows * columns;
    bricksInfo = new Array(rows);

    for (var i = 0; i < rows; i++) {
      bricksInfo[i] = new Array(columns);
    }
    //fim de jogo

    isPaused = true;
    restartGame();
  }
  else if (cont == 0 && nivel == 2) {
    isPaused = true;
    //finalizarJogo();
  }
  // Se a bola não estiver em movimento, inicia o movimento
  if (!ball.$velocity) {
    startBallMovement();
  }
  // Se a bola estiver parada, retorna
  if (ball.$stopped) {
    return;
  }

  updateBallPosition();

  // Verifica colisão nas laterais
  if (isSideCollision()) {
    ball.$velocity.x *= -1;
  }
  if (isSide2Collision()) {
    secondBall.$velocity.x *= -1;
  }

  // Verifica colisão no topo
  if (isTopCollision()) {
    ball.$velocity.y *= -1;
  }
  if (isTop2Collision()) {
    secondBall.$velocity.y *= -1;
  }

  if (canCollideWithHitter && isHitterGSCCollision()) { //normal calculada pela diferença da posição da colisão e o centro do cilindro
    var normal = new THREE.Vector2(ball.position.x - hitter.position.x, ball.position.y + 10.5)
    var norm = Math.sqrt(normal.x * normal.x + normal.y * normal.y);//na normal sai um vetor que não tem norma 1, com isso vc usa a normalização
    //vira a normal pra valer
    normal.x /= norm;
    normal.y /= norm;
    updateBallVelocity(normal);
    canCollideWithHitter = false;
    setTimeout(() => {
      canCollideWithHitter = true;
    }, 100);
    playHitterCollisionSound();
  }

  if (secondBall) {
    if (can2CollideWithHitter && isHitter2GSCCollision()) {
      var normal = new THREE.Vector2(secondBall.position.x - hitter.position.x, secondBall.position.y + 10.5);
      var norm = Math.sqrt(normal.x * normal.x + normal.y * normal.y);
      normal.x /= norm;
      normal.y /= norm;
      update2BallVelocity(normal);
      can2CollideWithHitter = false;
      setTimeout(() => {
        can2CollideWithHitter = true;
      }, 100);
      playHitterCollisionSound();
    }
  }

  // sons
  function playCollisionSound() {
    collisionSound.play();
  }
  function playCollision2Sound() {
    collision2Sound.play();
  }

  function playHitterCollisionSound() {
    hitterCollisionSound.play();
  }


  // Verifica se a bola passou pelo rebatedor
  if (isPastHitter()) {
    if (!secondBall) {
      ball.position.set(hitter.position.x, ball_pos_y, 0.2);
      ball.$velocity = null;
      scene.remove(powerUp);
      powerUp = null;
      vidas--;
      msgVidas.changeMessage("Vidas: " + vidas);
      // caso nao ter vida signifique que a bolinha ao passar do rebatedor o tabuleiro reinicia
      if (vidas === 0) { vidas = 5; msgVidas.changeMessage("Vidas: " + vidas); restartGame(); }

      running = false;
    }
  }
  if (is2PastHitter()) {
    scene.remove(secondBall);
    secondBall = null;
    blocksRemoved = 0;
  }
  if (isPowerPastHitter()) {
    scene.remove(powerUp);
    powerUp = null;
    blocksRemoved = 0;
  }

  //Verifica se pegou o PowerUp
  if (isPowerHitterCollision()) {
    if (!secondBall) {
      scene.remove(powerUp);
      powerUp = null;
      blocksRemoved = 0;
      createSecondBallWithDifferentDirection();
    }

  }

  // Verifica colisões em intervalos menores ao longo do caminho da bola
  var canCollideWithBrick = true;

  for (var i = 0; i < rows; i++) {
    for (var j = 0; j < columns; j++) {
      if (bricks[i][j] && canCollideWithBrick) {
        if (bricksInfo[i][j].processed) {
          continue; // Pula este tijolo se já tiver sido processado
        }
        if (ball) {
          if (isBrickCollision(bricks[i][j])) {
            if (isBottonTopBrickCollision(bricks[i][j])) {
              canCollideWithBrick = false;
              ball.$velocity.y *= -1;// Inverte a direção da bola ao colidir com um tijolo
              setTimeout(() => {
                canCollideWithBrick = true;
              }, 100);
            } else {
              if (isSideBrickCollision(bricks[i][j])) {
                canCollideWithBrick = false;
                ball.$velocity.x *= -1;// Inverta a direção da bola ao colidir com um tijolo
                setTimeout(() => {
                  canCollideWithBrick = true;
                }, 100);
              }
            }

            //som 2
            if (bricksInfo[i][j].hits === 1) { playCollision2Sound(); }
            if (remove) {
              // Remove o tijolo da cena
              cont--;
              scene.remove(bricks[i][j]);
              //som
              playCollisionSound();
              bricks[i][j] = null; // Marca o tijolo como removido
              remove = false;

            }
          }
        }
        if (secondBall) {
          if (is2BrickCollision(bricks[i][j])) {
            if (is2BottonTopBrickCollision(bricks[i][j])) {
              canCollideWithBrick = false;
              secondBall.$velocity.y *= -1;// Inverte a direção da bola ao colidir com um tijolo
              setTimeout(() => {
                canCollideWithBrick = true;
              }, 100);
            } else {
              if (is2SideBrickCollision(bricks[i][j])) {
                canCollideWithBrick = false;
                secondBall.$velocity.x *= -1;// Inverta a direção da bola ao colidir com um tijolo
                setTimeout(() => {
                  canCollideWithBrick = true;
                }, 100);
              }
            }

            //som 2
            if (bricksInfo[i][j].hits === 1) { playCollision2Sound(); }
            if (remove) {
              // Remove o tijolo da cena
              cont--;
              scene.remove(bricks[i][j]);
              //som
              playCollisionSound();
              bricks[i][j] = null; // Marca o tijolo como removido
              remove = false;
            }
          }
        }
      }
      bricksInfo[i][j].processed = false;
    }
  }

}

function createSecondBallWithDifferentDirection() {
  const secondBallGeometry = new THREE.SphereGeometry(ball_radius, 16, 16);
  const secondBallMaterial = new THREE.MeshPhongMaterial({
    color: "rgb(0, 250, 255)",
    shininess: "200",
    specular: "rgb(255, 255, 255)",
  });
  secondBall = new THREE.Mesh(secondBallGeometry, secondBallMaterial);
  secondBall.castShadow = true;
  secondBall.position.set(ball.position.x, ball.position.y, 0.2); // Posicione a segunda bola na posição da primeira
  bbSecondBall = new THREE.Box3().setFromObject(secondBall);
  scene.add(secondBall);

  // Ajuste a direção da segunda bola

  const directionAngle = THREE.MathUtils.degToRad(120); // Ângulo de direção diferente
  const velocityX = Math.cos(directionAngle) * velocity;
  const velocityY = Math.sin(directionAngle) * velocity;

  secondBall.$directionAngle = directionAngle;
  secondBall.$velocity = {
    x: velocityX,
    y: velocityY,
  };
  secondBall.$stopped = false;
}

//função que atualiza a função da bola
function updateBallPosition() {
  if (ball) {
    var ballPos = ball.position;
    ballPos.x += ball.$velocity.x;
    ballPos.y += ball.$velocity.y;
    bbBall.setFromObject(ball);
  }
  if (secondBall) {
    var secondBallPos = secondBall.position;
    secondBallPos.x += secondBall.$velocity.x;
    secondBallPos.y += secondBall.$velocity.y;
    bbSecondBall.setFromObject(secondBall);
  }
  if (powerUp) {
    var powerUpPos = powerUp.position;
    powerUpPos.y -= powerUp.$velocity.y;
  }
}

//função que verifica a colisão na lateral
function isSideCollision() {
  if (ball) {
    var ballX = ball.position.x,
      halfFieldWidth = field_w / 2;
    //verifica se a borda da bola passou pela lateral do campo
    return ballX - ball_radius < -halfFieldWidth || ballX + ball_radius > halfFieldWidth;
  }
}
function isSide2Collision() {
  if (secondBall) {
    var secondBallX = secondBall.position.x,
      halfFieldWidth = field_w / 2;
    //verifica se a borda da bola passou pela lateral do campo
    return secondBallX - ball_radius < -halfFieldWidth || secondBallX + ball_radius > halfFieldWidth;
  }
}

//função que verifica a colisão no topo
function isTopCollision() {
  if (ball) {
    var ballY = ball.position.y,
      halfFieldLength = field_h / 2;
    //verifica se a borda da bola passou pelo topo do campo
    return ballY + ball_radius > halfFieldLength;
  }
}
function isTop2Collision() {
  if (secondBall) {
    var secondBallY = secondBall.position.y,
      halfFieldLength = field_h / 2;
    //verifica se a borda da bola passou pelo topo do campo
    return secondBallY + ball_radius > halfFieldLength;
  }
}

function isHitterGSCCollision() {
  return bbBall.intersectsBox(bbHitter);
}

function isHitter2GSCCollision() {
  return bbSecondBall.intersectsBox(bbHitter);
}

function isPowerAlignedWithPaddle() {
  var halfPaddleWidth = hitter_w / 2,
    paddleX = hitter.position.x,
    ballX = powerUp.position.x;
  return ballX > paddleX - halfPaddleWidth && ballX < paddleX + halfPaddleWidth;
}
function isPowerHitterCollision() {
  if (powerUp) {
    return (
      powerUp.position.y - ball_radius <= hitter.position.y &&
      powerUp.position.y - ball_radius >= hitter.position.y - 0.2 &&
      isPowerAlignedWithPaddle()
    );
  }
}

// Função para verificar se a bola passou pelo rebatedor
function isPastHitter() {
  if (ball) {
    //velocity = initialVelocity // Volta a velocidade
    return ball.position.y < hitter.position.y - 0.4;
  }
}

function is2PastHitter() {
  if (secondBall) {
    return secondBall.position.y < hitter.position.y - 0.4;
  }
}

function isPowerPastHitter() {
  if (powerUp) {
    return powerUp.position.y < hitter.position.y - 0.4;
  }
}

// Função para verificar colisão com um tijolo
function isBrickCollision(brick) {
  if (blocksRemoved >= 10) {
    // Função para criar PowerUp.
    createPowerUp();
    // Reinicie a contagem de blocos removidos.
    blocksRemoved = 0;
  }
  var ballX = ball.position.x;
  var ballY = ball.position.y;
  var brickX = brick.position.x;
  var brickY = brick.position.y;

  var halfBrickWidth = brick.geometry.parameters.width / 2;
  var halfBrickHeight = brick.geometry.parameters.height / 2;

  for (var i = 0; i < rows; i++) {
    for (var j = 0; j < columns; j++) {
      if (bricks[i][j] === brick) {
        var brickInfo = bricksInfo[i][j];
        if (bricksInfo.processed) {
          return true;
        }
        if (ballX + ball_radius > brickX - halfBrickWidth &&
          ballX - ball_radius < brickX + halfBrickWidth &&
          ballY + ball_radius > brickY - halfBrickHeight &&
          ballY - ball_radius < brickY + halfBrickHeight) {
          if (bricksInfo[i][j].hits === 0 && bricksInfo[i][j].color === 12369084) {
            // Primeiro acerto - muda de cor
            brickInfo.hits = 1;
            brickInfo.color = 0x000000; // Define a nova cor (preto)
            brickInfo.processed = true;
            bricks[i][j].material.color.setHex(0x000000); // Atualiza a cor do material
            remove = false;
            if (!secondBall) {
              blocksRemoved++;
            }
            return true;
          }
          else if (bricksInfo[i][j].hits === 1 && bricksInfo[i][j].color === 0) {
            // Segundo acerto - remove o bloco
            brickInfo.hits = 2;
            brickInfo.processed = true;
            remove = true;
            if (!secondBall) {
              blocksRemoved++;
            }
            return true;
          }
          else if (bricksInfo[i][j].color === 16554040 && nivel === 3) {
            remove = false;
            return true;
          }
          else {
            remove = true;
            brickInfo.processed = true;
            if (!secondBall) {
              blocksRemoved++;
            }
            return true;
          }
        }
        else {
          remove = false;
          return false;
        }
      }
    }
  }
}
function is2BrickCollision(brick) {
  if (blocksRemoved2 >= 10 && !ball) {
    // Função para criar uma segunda bola.
    createPowerUp();
    // Reinicie a contagem de blocos removidos.
    blocksRemoved2 = 0;
  }
  var ballX = secondBall.position.x;
  var ballY = secondBall.position.y;
  var brickX = brick.position.x;
  var brickY = brick.position.y;

  var halfBrickWidth = brick.geometry.parameters.width / 2;
  var halfBrickHeight = brick.geometry.parameters.height / 2;

  for (var i = 0; i < rows; i++) {
    for (var j = 0; j < columns; j++) {
      if (bricks[i][j] === brick) {
        var brickInfo = bricksInfo[i][j];
        if (bricksInfo.processed) {
          return true;
        }
        if (ballX + ball_radius > brickX - halfBrickWidth &&
          ballX - ball_radius < brickX + halfBrickWidth &&
          ballY + ball_radius > brickY - halfBrickHeight &&
          ballY - ball_radius < brickY + halfBrickHeight) {
          if (bricksInfo[i][j].hits === 0 && bricksInfo[i][j].color === 12369084) {
            // Primeiro acerto - muda de cor
            brickInfo.hits = 1;
            brickInfo.color = 0x000000; // Define a nova cor (preto)
            brickInfo.processed = true;
            bricks[i][j].material.color.setHex(0x000000); // Atualiza a cor do material
            remove = false;
            blocksRemoved2++;

            return true;
          }
          else if (bricksInfo[i][j].hits === 1 && bricksInfo[i][j].color === 0) {
            // Segundo acerto - remove o bloco
            brickInfo.hits = 2;
            brickInfo.processed = true;
            remove = true;
            blocksRemoved2++;

            return true;
          }
          else if (bricksInfo[i][j].color === 16554040 && nivel === 3) {
            remove = false;
            return true;
          }
          else {
            remove = true;
            brickInfo.processed = true;
            blocksRemoved2++;
            return true;
          }
        }
        else {
          remove = false;
          return false;
        }
      }
    }
  }
}

// Função para verificar colisão com a parte superior ou inferior do tijolo
function isBottonTopBrickCollision(brick) {
  var ballX = ball.position.x;
  var ballY = ball.position.y;
  var brickX = brick.position.x;
  var brickY = brick.position.y;

  var halfBrickWidth = brick.geometry.parameters.width / 2;
  var halfBrickHeight = brick.geometry.parameters.height / 2;

  if (
    ballX + ball_radius > brickX - halfBrickWidth &&
    ballX - ball_radius < brickX + halfBrickWidth &&
    ballY + ball_radius > brickY - halfBrickHeight &&
    ballY - ball_radius < brickY + halfBrickHeight
  ) {
    var topLeft = new THREE.Vector2(brickX - halfBrickWidth, brickY - halfBrickHeight);
    var topRight = new THREE.Vector2(brickX + halfBrickWidth, brickY - halfBrickHeight);
    var bottonLeft = new THREE.Vector2(brickX - halfBrickWidth, brickY + halfBrickHeight);
    var bottonRight = new THREE.Vector2(brickX + halfBrickWidth, brickY + halfBrickHeight);
    var distanceBotton = distancePointLine(bottonLeft, bottonRight, ball.position);
    var distanceTop = distancePointLine(topLeft, topRight, ball.position);
    var distanceLeft = distancePointLine(bottonLeft, topLeft, ball.position);
    var distanceRight = distancePointLine(bottonRight, topRight, ball.position);
    if (
      (distanceBotton < distanceLeft && distanceBotton < distanceRight) ||
      (distanceTop < distanceLeft && distanceTop < distanceRight)
    ) {
      return true; // Colisão detectada
    }
  }

  return false;
}

function is2BottonTopBrickCollision(brick) {
  var ballX = secondBall.position.x;
  var ballY = secondBall.position.y;
  var brickX = brick.position.x;
  var brickY = brick.position.y;

  var halfBrickWidth = brick.geometry.parameters.width / 2;
  var halfBrickHeight = brick.geometry.parameters.height / 2;

  if (
    ballX + ball_radius > brickX - halfBrickWidth &&
    ballX - ball_radius < brickX + halfBrickWidth &&
    ballY + ball_radius > brickY - halfBrickHeight &&
    ballY - ball_radius < brickY + halfBrickHeight
  ) {
    var topLeft = new THREE.Vector2(brickX - halfBrickWidth, brickY - halfBrickHeight);
    var topRight = new THREE.Vector2(brickX + halfBrickWidth, brickY - halfBrickHeight);
    var bottonLeft = new THREE.Vector2(brickX - halfBrickWidth, brickY + halfBrickHeight);
    var bottonRight = new THREE.Vector2(brickX + halfBrickWidth, brickY + halfBrickHeight);
    var distanceBotton = distancePointLine(bottonLeft, bottonRight, secondBall.position);
    var distanceTop = distancePointLine(topLeft, topRight, secondBall.position);
    var distanceLeft = distancePointLine(bottonLeft, topLeft, secondBall.position);
    var distanceRight = distancePointLine(bottonRight, topRight, secondBall.position);
    if (
      (distanceBotton < distanceLeft && distanceBotton < distanceRight) ||
      (distanceTop < distanceLeft && distanceTop < distanceRight)
    ) {
      return true; // Colisão detectada
    }
  }

  return false;
}


// Função para verificar colisão com a parte lateral do tijolo
function isSideBrickCollision(brick) {
  var ballX = ball.position.x;
  var ballY = ball.position.y;
  var brickX = brick.position.x;
  var brickY = brick.position.y;

  var halfBrickWidth = brick.geometry.parameters.width / 2;
  var halfBrickHeight = brick.geometry.parameters.height / 2;

  if (
    ballX + ball_radius > brickX - halfBrickWidth &&
    ballX - ball_radius < brickX + halfBrickWidth &&
    ballY + ball_radius > brickY - halfBrickHeight &&
    ballY - ball_radius < brickY + halfBrickHeight
  ) {
    var topLeft = new THREE.Vector2(brickX - halfBrickWidth, brickY - halfBrickHeight);
    var topRight = new THREE.Vector2(brickX + halfBrickWidth, brickY - halfBrickHeight);
    var bottonLeft = new THREE.Vector2(brickX - halfBrickWidth, brickY + halfBrickHeight);
    var bottonRight = new THREE.Vector2(brickX + halfBrickWidth, brickY + halfBrickHeight);
    var distanceBotton = distancePointLine(bottonLeft, bottonRight, ball.position);
    var distanceTop = distancePointLine(topLeft, topRight, ball.position);
    var distanceLeft = distancePointLine(bottonLeft, topLeft, ball.position);
    var distanceRight = distancePointLine(bottonRight, topRight, ball.position);
    if (
      (distanceLeft < distanceTop && distanceLeft < distanceBotton) ||
      (distanceRight < distanceTop && distanceRight < distanceBotton)
    ) {
      return true; // Colisão detectada
    }
  }

  return false;
}
function is2SideBrickCollision(brick) {
  var ballX = secondBall.position.x;
  var ballY = secondBall.position.y;
  var brickX = brick.position.x;
  var brickY = brick.position.y;

  var halfBrickWidth = brick.geometry.parameters.width / 2;
  var halfBrickHeight = brick.geometry.parameters.height / 2;

  if (
    ballX + ball_radius > brickX - halfBrickWidth &&
    ballX - ball_radius < brickX + halfBrickWidth &&
    ballY + ball_radius > brickY - halfBrickHeight &&
    ballY - ball_radius < brickY + halfBrickHeight
  ) {
    var topLeft = new THREE.Vector2(brickX - halfBrickWidth, brickY - halfBrickHeight);
    var topRight = new THREE.Vector2(brickX + halfBrickWidth, brickY - halfBrickHeight);
    var bottonLeft = new THREE.Vector2(brickX - halfBrickWidth, brickY + halfBrickHeight);
    var bottonRight = new THREE.Vector2(brickX + halfBrickWidth, brickY + halfBrickHeight);
    var distanceBotton = distancePointLine(bottonLeft, bottonRight, secondBall.position);
    var distanceTop = distancePointLine(topLeft, topRight, secondBall.position);
    var distanceLeft = distancePointLine(bottonLeft, topLeft, secondBall.position);
    var distanceRight = distancePointLine(bottonRight, topRight, secondBall.position);
    if (
      (distanceLeft < distanceTop && distanceLeft < distanceBotton) ||
      (distanceRight < distanceTop && distanceRight < distanceBotton)
    ) {
      return true; // Colisão detectada
    }
  }

  return false;
}

//tela fim jogo
function finalizarJogo() {
  window.location.href = "fim.html";
}


// Função para criar os objetos da cena
createSceneObjects();
// Event listeners para o mouse, clique do mouse e teclado
window.addEventListener("mousemove", onMouseMove);
renderer.domElement.addEventListener("mousedown", onClick, false);
document.addEventListener("keydown", onKeyDown, false);

// Event listener para redimensionar a janela
window.addEventListener(
  "resize",
  function () {
    onWindowResize(cameraPerspective, renderer);
  },
  false
);

renderer.domElement.style.cursor = "none";
render();

// Função de renderização
function render() {
  // Verifica se já passaram os primeiros 15 segundos
  //if (currentTime - startTime >= timeToDoubleSpeed ) {
  // velocity = initialVelocity * 2; // Dobra a velocidade
  //}
  if (isPaused) {
    return;
  }

  requestAnimationFrame(render); // Solicita animação de quadro

  if (running) {
    processBallMovement();
  }
  renderer.render(scene, cameraPerspective); // Render scene
}

//Criacao do PowerUp
function createPowerUp() {
  if (!powerUp) {
    powerGeometry = new THREE.OctahedronGeometry(0.2, 0);
    powerMaterial = new THREE.MeshPhongMaterial({
      color: ("rgb(255,255,0)"),
      shininess: "200",
      specular: ("rgb(255,255,255)")
    })
    powerUp = new THREE.Mesh(powerGeometry, powerMaterial);
    powerUp.castShadow = true;
    powerUp.position.set(ball.position.x, ball.position.y, 0.2);
    powerUp.castShadow = true;
    scene.add(powerUp);
    // Ajuste a direção da segunda bola
    const directionAngle = THREE.MathUtils.degToRad(120); // Ângulo de direção diferente
    //const velocityX = Math.cos(directionAngle) * velocity;
    const velocityY = Math.sin(directionAngle) * velocity;
    powerUp.$directionAngle = directionAngle;
    powerUp.$velocity = {
      y: velocityY,
    };
    powerUp.$stopped = false;
  }
}

//Criação da bola
function createBall() {
  let ballMaterial = new THREE.MeshPhongMaterial({
    color: ("rgb(255,0,0)"),
    shininess: "200",
    specular: ("rgb(255,255,255)")
  })
  ball = new THREE.Mesh(new THREE.SphereGeometry(ball_radius, 16, 16), ballMaterial);
  ball.position.set(0, ball_pos_y, 0.2);
  bbBall = new THREE.Box3().setFromObject(ball);
  ball.castShadow = true;
  scene.add(ball);
}

//Criação do campo
function createField() {
  const fieldMaterial = new THREE.MeshLambertMaterial({ color: 0x000080, transparent: true, opacity: 0.0 });

  // Geometria do campo
  const fieldGeometry = new THREE.BoxGeometry(field_w, field_h, 0.1);

  // Mesh do campo
  const field = new THREE.Mesh(fieldGeometry, fieldMaterial);

  // Adiciona o campo à cena
  scene.add(field);

  // Criação da geometria de borda
  const edges = new THREE.EdgesGeometry(fieldGeometry);
  const lineMaterial = new THREE.LineBasicMaterial({ color: 0xffffff });

  // Criação do objeto de linha (borda)
  const line = new THREE.LineSegments(edges, lineMaterial);

  // Adiciona a linha (borda) à cena
  scene.add(line);
}

//Criação do rebatedor
function createHitter() {
  let auxMat = new THREE.Matrix4();
  let boxMesh = new THREE.Mesh(new THREE.BoxGeometry(5.2, 5, 1.5))
  let cylinderMesh = new THREE.CylinderGeometry(2.5, 2.5, 0.2, 40)
  const material = new THREE.MeshLambertMaterial({ color: ("rgb(255,240,250)") });
  const cylinder = new THREE.Mesh(cylinderMesh, material);
  cylinder.rotateX(Math.PI / 2);

  // CSG holders
  let csgObject, boxCSG, cylinderCSG

  cylinder.position.set(0, -2, 0.2)
  boxMesh.position.set(0, -2.3, 0.2)

  // Object - Cube SUBTRACT Cylinder
  updateObject(boxMesh) // update internal coords
  updateObject(cylinder)
  cylinderCSG = CSG.fromMesh(cylinder)
  boxCSG = CSG.fromMesh(boxMesh)
  csgObject = cylinderCSG.subtract(boxCSG) // Execute subtraction
  hitter = CSG.toMesh(csgObject, auxMat)
  hitter.material = new THREE.MeshLambertMaterial({ color: ("rgb(255,240,250)") });
  hitter.position.set(0, -7.45, 0.2)
  bbHitter = new THREE.Box3().setFromObject(hitter)
  hitter.castShadow = true;
  hitter.material.map = orange;
  scene.add(hitter)
}

//Criação dos tijolos nivel 1
function createBricks() {
  if (nivel == 1) {
    var halfFieldWidth = field_w / 2,
      brickWidth = field_w / columns - 0.05,
      halfBrickWidth = brickWidth / 2;

    var colors = [0x80D010, 0xFC74B4, 0xFC9838, 0x0070EC, 0xD42700, 0xBCBCBC];

    bricks = new Array(rows);

    for (var i = 0; i < rows; i++) {
      bricks[i] = new Array(columns);
    }
    bricksGeometry = new THREE.BoxGeometry(brickWidth, 0.4, 0.1);

    for (var i = 0; i < rows; i++) {
      for (var j = 0; j < columns; j++) {
        var color = colors[i % colors.length];
        bricksInfo[i][j] = {
          color: color,
          hits: 0,
          processed: false
        };
        bricksMaterial = new THREE.MeshLambertMaterial(setDefaultMaterial(color));

        //textura no ultimo bloco
        if(i == rows - 1){
          bricksMaterial.map = tile;
        }

        bricks[i][j] = new THREE.Mesh(bricksGeometry, bricksMaterial);
        bricks[i][j].position.set(-halfFieldWidth + halfBrickWidth + j * (brickWidth + 0.05), 3 + i * 0.45, 0.2);
        bricks[i][j].castShadow = true;
        scene.add(bricks[i][j]);
      }
    }
  }
  if (nivel == 2) {
    var brickWidth = (field_w - 2 * spacing) / columns;
    var halfBrickWidth = brickWidth / 2;
    const matriz_colors = [
      [0xBCBCBC, 0xBCBCBC],
      [0x0070EC, 0xFC9838],
      [0x80D010, 0x80D010],
      [0xFC74B4, 0xFC9838],
      [0xD42700, 0xD42700],
      [0xFC74B4, 0xFC9838],
      [0x80D010, 0x80D010],
      [0x0070EC, 0xFC9838],
      [0xBCBCBC, 0xBCBCBC],
      [0xFC9838, 0x0070EC],
      [0x80D010, 0x80D010],
      [0xFC74B4, 0xFC9838],
      [0xD42700, 0xD42700],
      [0xFC9838, 0xFC74B4],
      [0x80D010, 0x80D010],
      [0xFC9838, 0x0070EC],
      [0xBCBCBC, 0xBCBCBC],
      [0xFC9838, 0x0070EC],
      [0x80D010, 0x80D010],
      [0xFC9838, 0xFC74B4],
      [0xD42700, 0xD42700],
      [0xFC9838, 0xFC74B4]
    ];
    var spaceWidth = spacing; // Largura do espaço entre os blocos
    var x = 0;
    bricks = new Array(rows);

    for (var i = 0; i < rows; i++) {
      bricks[i] = new Array(columns);
    }
    for (var k = 0; k < 22; k++) {
      for (var i = 0; i < rows; i++) {
        for (var j = 0; j < columns; j++) {

          if (k === i + j) {
            var color = matriz_colors[k][x];
            x = (x + 1) % 2;

            bricksInfo[i][j] = {
              color: color,
              hits: 0
            };
            if (j < 4) {
              // Primeiro bloco à esquerda
              bricksMaterial= new THREE.MeshLambertMaterial(setDefaultMaterial(color));
              //textura
              if(color == 0xBCBCBC){
                bricksMaterial.map = tile;
              }
              bricks[i][j] = new THREE.Mesh(new THREE.BoxGeometry(brickWidth, 0.4, 0.1), bricksMaterial);
              var topPosition = 1 + (rows - 1) * 0.45; // Posição vertical do bloco superior
              bricks[i][j].position.set((j * (brickWidth + spaceWidth)) - (field_w / 2) + halfBrickWidth, topPosition - i * 0.45, 0.2);
            } else if (j == 4) {
              // Espaço no meio
              continue; // Pula a posição 4
            } else {
              // Segundo bloco à direita
              var rightBlockColumn = j - 5;
              bricksMaterial= new THREE.MeshLambertMaterial(setDefaultMaterial(color));
               //textura
              if(color == 0xBCBCBC){
                bricksMaterial.map = tile;
              }
              bricks[i][j] = new THREE.Mesh(new THREE.BoxGeometry(brickWidth, 0.4, 0.1), bricksMaterial);
              var topPosition = 1 + (rows - 1) * 0.45; // Posição vertical do bloco superior
              bricks[i][j].position.set(((rightBlockColumn + 0.3) * (brickWidth + spaceWidth)) + halfBrickWidth + spaceWidth, topPosition - i * 0.45, 0.2);
            }
            bricks[i][j].castShadow = true;
            scene.add(bricks[i][j]);
          }

        }
      }
    }
  }
  if (nivel == 3) {
    var halfFieldWidth = field_w / 2,
      brickWidth = field_w / columns - 0.05,
      halfBrickWidth = brickWidth / 2;

    var colors = [0x80D010, 0xFC74B4, 0xFC9838, 0x0070EC, 0xD42700, 0xBCBCBC];
    bricks = new Array(rows);

    for (var i = 0; i < rows; i++) {
      bricks[i] = new Array(columns);
    }
    bricksGeometry = new THREE.BoxGeometry(brickWidth, 0.4, 0.1);

    for (var i = 0; i < rows; i++) {
      for (var j = 0; j < columns; j++) {
        if (j === 0 && i != 1 || j == 10 && i != 1) {
          var color = colors[3]
        }
        else if (j === 0 && i === 1 || j == 10 && i === 1) {
          var color = colors[1]
        }
        else if (j % 2 != 0 && j != 1 && j != 10 && i === 7) {
          var color = colors[1]
        }
        else if (j === 2 && i != 1 && i != 7 || j == 8 && i != 1 && i != 7) {
          var color = colors[4]
        }
        else if (j % 2 === 0 && j > 1 && j < 9 && (i === 1 || i === 7)) {
          var color = colors[2]
        }
        else {
          var color = colors[0]
        }
        bricksInfo[i][j] = {
          color: color,
          hits: 0,
          processed: false
        };
        bricksMaterial = new THREE.MeshLambertMaterial(setDefaultMaterial(color));

        if (j % 2 === 0) {
          bricks[i][j] = new THREE.Mesh(bricksGeometry, bricksMaterial);
          bricks[i][j].position.set(-halfFieldWidth + halfBrickWidth + j * (brickWidth + 0.05), 3 + i * 0.45, 0.2);
          bricks[i][j].castShadow = true;
          scene.add(bricks[i][j]);
        }
        else if (j % 2 != 0 && j != 1 && j != 9 && i === 7) {
          bricks[i][j] = new THREE.Mesh(bricksGeometry, bricksMaterial);
          bricks[i][j].position.set(-halfFieldWidth + halfBrickWidth + j * (brickWidth + 0.05), 3 + i * 0.45, 0.2);
          bricks[i][j].castShadow = true;
          scene.add(bricks[i][j]);
        }
        else {
          // Espaço no meio
          continue;
        }
      }
    }
  }
}

//Criação dos objetos na cena
function createSceneObjects() {
  createField();
  createHitter();
  createBall();
  createBricks();
  //Espaco nave
  loadOBJFile('./', 'spaceship', true, 1.5);
}

// Função para remover todos os objetos da cena
function clearScene() {
  // Remova a bola
  if (ball) {
    scene.remove(ball);
    ball = null;
  }
  if (secondBall) {
    scene.remove(secondBall);
    secondBall = null;
  }
  if (powerUp) {
    scene.remove(powerUp);
    powerUp = null;
  }
  // Remova o rebatedor
  if (hitter) {
    scene.remove(hitter);
    hitter = null;
  }
  // Remove a espaconave
  if(space){
    scene.remove(space);
    space = null;
  }

  // Remova os tijolos
  if (bricks) {
    for (var i = 0; i < bricks.length; i++) {
      if (bricks[i]) {
        for (var j = 0; j < bricks[i].length; j++) {
          if (bricks[i][j]) {
            scene.remove(bricks[i][j]);
            bricks[i][j] = null;
          }
        }
      }
    }
  }
}

function onMouseMove(event) {
  let pointer = new THREE.Vector2();
  pointer.x = (event.clientX / w) * 2 - 1;
  pointer.y = -(event.clientY / h) * 2 + 1;

  raycaster.setFromCamera(pointer, cameraPerspective);

  let intersects = raycaster.intersectObjects(object);

  if (intersects.length > 0) {
    let point = intersects[0].point; // Pick the point where interception occurrs
    if (point.x >= -(field_w / 2) + hitter_w / 2 && point.x <= field_w / 2 - hitter_w / 2) {
      hitter.position.set(point.x, -7.45, 0.2);
      space.position.set(point.x, -8.0, 0.2);
      if (!running) {
        ball.position.set(point.x, ball_pos_y, 0.2);
      }
    } else {
      if (point.x < -(field_w / 2) + hitter_w / 2) {
        hitter.position.set(-field_w / 2 + hitter_w / 2, -7.45, 0.2);
        space.position.set(-field_w / 2 + hitter_w / 2, -8.0, 0.2);
        if (!running) {
          ball.position.set(-field_w / 2 + hitter_w / 2, ball_pos_y, 0.2);
        }
      } else {
        if (point.x > field_w / 2 - hitter_w / 2) {
          hitter.position.set(field_w / 2 - hitter_w / 2, -7.45, 0.2);
          space.position.set(field_w / 2 - hitter_w / 2, -8.0, 0.2);
          if (!running) {
            ball.position.set(field_w / 2 - hitter_w / 2, ball_pos_y, 0.2);
          }
        }
      }
    }
  }
  bbHitter.setFromObject(hitter);
}

function onClick(event) {

  // if (event.button === 0 && isOrbiting===true) {
  //   console.log("Entrou")
  //   isPaused = true;
  // }
  // else
  if (event.button === 0 && running === false) {
    startTime = Date.now(); // Registra o tempo inicial
    running = true;
    canCollideWithHitter = false;
    setTimeout(() => {
      canCollideWithHitter = true;
    }, 100);
  }
}



function onKeyDown(event) {
  switch (event.key) {
    case "R":
    case "r":
      nivel = 1;
      rows = 6;
      columns = 11;
      cont = rows * columns;
      bricksInfo = new Array(rows);

      for (var i = 0; i < rows; i++) {
        bricksInfo[i] = new Array(columns);
      }
      isPaused = true;
      restartGame();
      break;
    case "O":
    case "o":
      if (!isOrbiting) {
        // Pausa o jogo
        //

        // Inicializa o OrbitControls apenas uma vez
        controls = new OrbitControls(cameraPerspective, renderer.domElement);
        controls.enableKeys = false; // Desativa as teclas padrão do OrbitControls

        // Atualiza o estado de órbita
        isOrbiting = true;
        isPaused = true;
      } else {
        // Retorna à posição inicial
        cameraPerspective.position.set(0, 0, 30);
        cameraPerspective.lookAt(new THREE.Vector3(0, 0, 0));

        // Reseta a órbita
        controls.reset();

        // Remove o controle de órbita
        controls.dispose();

        // Atualiza o estado de órbita
        isOrbiting = false;

        // Retoma o jogo
        isPaused = false;
        render();
      }
      break;
    case "G":
    case "g":
      nivel = 2;
      rows = 14;
      columns = 9;
      cont = rows * columns;
      bricksInfo = new Array(rows);

      for (var i = 0; i < rows; i++) {
        bricksInfo[i] = new Array(columns);
      }
      isPaused = true;
      restartGame();
      break;
    case "T":
    case "t":
      nivel = 3;
      rows = 11;
      columns = 11;
      cont = rows * columns;
      bricksInfo = new Array(rows);

      for (var i = 0; i < rows; i++) {
        bricksInfo[i] = new Array(columns);
      }
      isPaused = true;
      restartGame();
      break;
    case " ":
      isPaused = !isPaused;
      if (!isPaused) {
        render();
        renderer.domElement.style.cursor = "none"; // Ocultar o cursor do mouse
      } else {
        renderer.domElement.style.cursor = "auto"; // Mostrar o cursor do mouse
      }
      break;
    case "Enter":
      fullScreen();
      break;
  }
}

function restartGame() {
  clearScene();
  createSceneObjects();
  running = false;
  velocity = initialVelocity;
  if (isPaused) {
    isPaused = false;
    render();
  }
}

// Função para alternar entre tela cheia e janela
function fullScreen() {
  if (isFullscreen) {
    // Sair do modo fullscreen
    if (document.exitFullscreen) {
      document.exitFullscreen();
    }
  } else {
    // Entrar no modo fullscreen
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen();
    }
  }
  isFullscreen = !isFullscreen;
}

// Função para calcular a distância entre um ponto e uma linha
function distancePointLine(pointA, pointB, pointC) {
  var distance =
    Math.abs((pointB.x - pointA.x) * (pointC.y - pointA.y) - (pointB.y - pointA.y) * (pointC.x - pointA.x)) /
    Math.sqrt((pointB.x - pointA.x) * (pointB.x - pointA.x) + (pointB.y - pointA.y) * (pointB.y - pointA.y));
  return distance;
}
function loadOBJFile(modelPath, modelName, visibility, desiredScale)
{
  var mtlLoader = new MTLLoader( );
  mtlLoader.setPath( modelPath );
  mtlLoader.load( modelName + '.mtl', function ( materials ) {
      materials.preload();

      var objLoader = new OBJLoader( );
      objLoader.setMaterials(materials);
      objLoader.setPath(modelPath);
      objLoader.load( modelName + ".obj", function ( obj ) {
         obj.name = modelName;
         obj.visible = visibility;
         obj.traverse( function (child)
         {
            if( child.isMesh ) child.castShadow = true;
            if( child.material ) child.material.side = THREE.DoubleSide; 
         });

         var obj = normalizeAndRescale(obj, desiredScale);
         var obj = fixPosition(obj);

         space = obj;

         scene.add ( space );
         assetManager[modelName] = obj;
      });
  });

}

// Normalize scale and multiple by the newScale
function normalizeAndRescale(obj, newScale)
{
  var scale = getMaxSize(obj); 
  obj.scale.set(newScale * (2.0/scale),
                newScale * (1.0/scale),
                newScale * (1.0/scale));
  return obj;
}

function fixPosition(obj)
{
  // Fix position of the object over the ground plane
  var box = new THREE.Box3().setFromObject( obj );
  obj.rotateX(Math.PI/2);
  obj.rotateY(Math.PI);
  obj.position.set(0, -8.0, 0.2)
  if(box.min.y > 0)
    obj.translateY(-box.min.y);
  else
    obj.translateY(-1*box.min.y);
  return obj;
}