"use strict";

(() => {
  const WIDTH = 960;
  const HEIGHT = 600;
  const FPS = 60;
  const FRAME_FORMATS = {
    youtube: { width: 1920, height: 1080 },
    tiktok: { width: 1080, height: 1920 },
    shorts: { width: 1080, height: 1920 },
    instagram: { width: 1080, height: 1350 },
    reels: { width: 1080, height: 1920 },
    facebook: { width: 1920, height: 1080 }
  };
  const PROMPT_SUBJECTS = [
    { type: "person", name: "person", pattern: /\b(person|people|woman|man|girl|boy|hero|heroine|princess|prince|wizard|witch|knight|astronaut|fairy|swordswoman|swordsman|warrior)\b/ },
    { type: "dragon", name: "dragon", pattern: /\b(dragon|wyvern)\b/ },
    { type: "rocket", name: "rocket", pattern: /\b(rocket|spaceship|space ship|spacecraft)\b/ },
    { type: "robot", name: "robot", pattern: /\b(robot|android|mech|cyborg)\b/ },
    { type: "monster", name: "monster", pattern: /\b(monster|demon|alien|ghost|vampire|creature)\b/ },
    { type: "cat", name: "cat", pattern: /\b(cat|kitten|kitty|feline)\b/ },
    { type: "dog", name: "dog", pattern: /\b(dog|puppy|wolf|fox)\b/ },
    { type: "horse", name: "horse", pattern: /\b(horse|pony|unicorn|deer|lion|tiger|bear|rabbit|bunny|mouse)\b/ },
    { type: "bird", name: "bird", pattern: /\b(bird|sparrow|parrot|owl|duck|eagle)\b/ },
    { type: "fish", name: "sea creature", pattern: /\b(fish|whale|shark|dolphin|octopus|jellyfish)\b/ },
    { type: "vehicle", name: "vehicle", pattern: /\b(car|truck|bus|motorcycle|motorbike|train|plane|airplane|aircraft|helicopter|boat|ship)\b/ },
    { type: "plant", name: "plant", pattern: /\b(tree|flower|plant|mushroom|rose|tulip|daisy)\b/ },
    { type: "building", name: "building", pattern: /\b(castle|house|cottage|tower|building|temple)\b/ },
    { type: "planet", name: "planet", pattern: /\b(planet|moon|comet|meteor|stars?)\b/ },
    { type: "food", name: "food", pattern: /\b(pizza|cake|cupcake|apple|orange|fruit|ice cream)\b/ },
    { type: "ball", name: "ball", pattern: /\b(ball|football|basketball)\b/ }
  ];
  const canvas = document.querySelector("#animation-canvas");
  const context = canvas.getContext("2d");
  const promptInput = document.querySelector("#prompt-input");
  const promptForm = document.querySelector("#prompt-form");
  const frameInput = document.querySelector("#frame-input");
  const referenceFramesContainer = document.querySelector("#reference-frames");
  const playButton = document.querySelector("#play-button");
  const playIcon = document.querySelector("#play-icon");
  const timeline = document.querySelector("#timeline");
  const title = document.querySelector("#scene-title");
  const sceneLabel = document.querySelector("#scene-label");
  const statusMessage = document.querySelector("#status-message");
  const characterCount = document.querySelector("#character-count");
  const exportButton = document.querySelector("#export-button");
  const videoFormat = document.querySelector("#video-format");
  const frameSize = document.querySelector("#frame-size");
  const videoLength = document.querySelector("#video-length");
  const generateVideoButton = document.querySelector("#generate-video-button");
  const cancelVideoButton = document.querySelector("#cancel-video-button");
  const downloadVideoButton = document.querySelector("#download-video-button");
  const timecode = document.querySelector("#timecode");
  const timeEnd = document.querySelector("#time-end");

  const sceneNames = {
    rocket: "ROCKET · NIGHT SKY",
    cat: "CAT · PLAYFUL DAY",
    flower: "FLOWER · GARDEN",
    bird: "BIRD · OPEN SKY",
    ball: "BALL · BOUNCE STUDY",
    landscape: "LITTLE WORLD · DAYLIGHT",
    duel: "SWORD FIGHT · RUINED BRIDGE"
  };
  const state = {
    scene: "rocket",
    generatedScene: null,
    title: promptInput.value.trim(),
    playing: true,
    time: 0,
    lastDraw: 0,
    lastClock: 0
  };
  const referenceFrames = [];
  let activeRecording = null;
  let generatedVideoUrl = null;

  function formatTime(seconds) {
    const total = Math.floor(seconds);
    const minutes = Math.floor(total / 60);
    return `${String(minutes).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
  }

  function updateTimelineDuration() {
    const duration = Number(videoLength.value);
    timeline.max = String(duration);
    state.time = Math.min(state.time, duration);
    timeEnd.textContent = formatTime(duration);
    render(state.time);
  }

  function resizeCanvas() {
    const { width, height } = FRAME_FORMATS[videoFormat.value];
    const scale = Math.max(width / WIDTH, height / HEIGHT);
    canvas.width = width;
    canvas.height = height;
    canvas.style.aspectRatio = `${width} / ${height}`;
    context.setTransform(scale, 0, 0, scale, (width - WIDTH * scale) / 2, (height - HEIGHT * scale) / 2);
    frameSize.textContent = `${width} × ${height}`;
    render(state.time);
  }

  function roundedRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.roundRect(x, y, width, height, radius);
  }

  function ellipse(ctx, x, y, rx, ry, color) {
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
  }

  function line(ctx, color, width, draw) {
    ctx.beginPath();
    draw();
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();
  }

  function drawBackground(t) {
    if (state.scene === "generated") {
      drawGeneratedBackground(t, state.generatedScene);
      return;
    }

    const sky = context.createLinearGradient(0, 0, 0, HEIGHT);
    if (state.scene === "rocket") {
      sky.addColorStop(0, "#18182f");
      sky.addColorStop(1, "#37345a");
    } else if (state.scene === "duel") {
      sky.addColorStop(0, "#29203f");
      sky.addColorStop(.58, "#a94e5a");
      sky.addColorStop(1, "#ef9a63");
    } else {
      sky.addColorStop(0, "#a9d8e6");
      sky.addColorStop(1, "#e5d4cb");
    }
    context.fillStyle = sky;
    context.fillRect(0, 0, WIDTH, HEIGHT);

    if (state.scene === "rocket") {
      for (let i = 0; i < 50; i += 1) {
        const x = (i * 193 + 37) % WIDTH;
        const y = (i * 97 + 23) % 440;
        const radius = i % 9 === 0 ? 2.2 : (i % 3 === 0 ? 1.35 : .8);
        const twinkle = .48 + .45 * Math.sin(t * (1.7 + (i % 4) * .3) + i * 2.1);
        ellipse(context, x, y, radius, radius, `rgba(255, 247, 220, ${Math.max(.15, twinkle)})`);
      }
      ellipse(context, 779, 94, 36, 36, "#f5e8bd");
      ellipse(context, 765, 84, 36, 36, "#252544");
      context.fillStyle = "rgba(167, 146, 242, .16)";
      context.beginPath();
      context.ellipse(485, 510, 420, 73, 0, Math.PI, Math.PI * 2);
      context.fill();
      return;
    }

    if (state.scene === "duel") {
      ellipse(context, 744, 190, 62, 62, "#ffd49a");
      context.fillStyle = "#342438";
      context.beginPath();
      context.moveTo(0, 340);
      context.lineTo(130, 300);
      context.lineTo(235, 337);
      context.lineTo(378, 284);
      context.lineTo(510, 338);
      context.lineTo(710, 292);
      context.lineTo(840, 334);
      context.lineTo(960, 296);
      context.lineTo(960, 600);
      context.lineTo(0, 600);
      context.closePath();
      context.fill();
      context.fillStyle = "#241f30";
      context.fillRect(60, 270, 56, 122);
      context.fillRect(48, 260, 80, 18);
      context.fillRect(76, 222, 22, 38);
      context.fillRect(829, 248, 58, 140);
      context.fillRect(818, 237, 80, 18);
      context.fillRect(846, 195, 24, 42);
      context.fillStyle = "#55404a";
      context.beginPath();
      context.moveTo(0, 440);
      context.lineTo(960, 440);
      context.lineTo(960, 600);
      context.lineTo(0, 600);
      context.closePath();
      context.fill();
      context.fillStyle = "#6b4c52";
      for (let row = 0; row < 3; row += 1) {
        const y = 470 + row * 42;
        context.fillRect(0, y, 960, 2);
        for (let column = 0; column < 10; column += 1) {
          const x = column * 112 + (row % 2) * 55;
          context.fillRect(x, y - 25, 2, 25);
        }
      }
      for (let i = 0; i < 16; i += 1) {
        const x = (i * 181 + t * (12 + i % 4) + WIDTH) % WIDTH;
        const y = 270 + ((i * 73 + t * 9) % 160);
        ellipse(context, x, y, 1.5 + (i % 3), 1.5 + (i % 3), `rgba(255, 164, 112, ${.28 + .2 * Math.sin(t + i)})`);
      }
      return;
    }

    ellipse(context, 781, 105, 41, 41, "#ffe8a3");
    context.fillStyle = "#8cbd9c";
    context.beginPath();
    context.moveTo(0, 446);
    context.quadraticCurveTo(194, 340, 396, 432);
    context.quadraticCurveTo(641, 538, 960, 390);
    context.lineTo(960, 600);
    context.lineTo(0, 600);
    context.closePath();
    context.fill();
    context.fillStyle = "#668e88";
    context.beginPath();
    context.moveTo(0, 501);
    context.quadraticCurveTo(267, 418, 503, 505);
    context.quadraticCurveTo(725, 575, 960, 461);
    context.lineTo(960, 600);
    context.lineTo(0, 600);
    context.closePath();
    context.fill();
    for (let i = 0; i < 7; i += 1) {
      drawCloud((i * 173 + 22 + Math.sin(t * .22 + i) * 7) % (WIDTH + 100) - 40, 100 + (i % 3) * 51, .48 + (i % 2) * .2);
    }
  }

  function drawCloud(x, y, scale) {
    context.save();
    context.translate(x, y);
    context.scale(scale, scale);
    ellipse(context, 0, 9, 38, 13, "rgba(255,255,255,.65)");
    ellipse(context, -14, 2, 17, 15, "rgba(255,255,255,.65)");
    ellipse(context, 4, -5, 20, 20, "rgba(255,255,255,.65)");
    ellipse(context, 23, 3, 15, 13, "rgba(255,255,255,.65)");
    context.restore();
  }

  function drawRocket(t) {
    const x = 485 + Math.sin(t * Math.PI / 4) * 90;
    const y = 294 + Math.sin(t * Math.PI / 2) * 28;
    context.save();
    context.translate(x, y);
    context.rotate(-.16 + Math.sin(t * .9) * .035);
    const flameLength = 42 + Math.sin(t * 15) * 9;
    context.beginPath();
    context.moveTo(-28, 69);
    context.quadraticCurveTo(-52, 69 + flameLength * .45, -28, 69 + flameLength);
    context.quadraticCurveTo(-2, 68 + flameLength * .52, -14, 67);
    context.closePath();
    context.fillStyle = "#ff865c";
    context.fill();
    context.beginPath();
    context.moveTo(-23, 68);
    context.quadraticCurveTo(-34, 79 + flameLength * .38, -25, 68 + flameLength * .7);
    context.quadraticCurveTo(-13, 75 + flameLength * .35, -18, 67);
    context.closePath();
    context.fillStyle = "#ffd26e";
    context.fill();

    context.fillStyle = "#f4effb";
    context.beginPath();
    context.moveTo(-39, 38);
    context.lineTo(-67, 68);
    context.quadraticCurveTo(-69, 73, -60, 72);
    context.lineTo(-30, 65);
    context.fill();
    context.beginPath();
    context.moveTo(28, 38);
    context.lineTo(61, 68);
    context.quadraticCurveTo(65, 73, 54, 72);
    context.lineTo(24, 65);
    context.fill();
    roundedRect(context, -37, -67, 74, 139, 34);
    context.fillStyle = "#f4effb";
    context.fill();
    context.beginPath();
    context.moveTo(-32, -40);
    context.quadraticCurveTo(0, -89, 32, -40);
    context.closePath();
    context.fillStyle = "#f5a1a8";
    context.fill();
    ellipse(context, 0, -2, 18, 18, "#8cc9df");
    ellipse(context, 0, -2, 12, 12, "#314b73");
    ellipse(context, -5, -8, 4, 4, "rgba(255,255,255,.8)");
    roundedRect(context, -18, 38, 36, 7, 3);
    context.fillStyle = "#d4c9e8";
    context.fill();
    context.restore();
  }

  function drawCat(t) {
    const x = 480 + Math.sin(t * Math.PI / 4) * 28;
    const y = 425 + Math.abs(Math.sin(t * Math.PI / 2)) * -28;
    context.save();
    context.translate(x, y);
    const tailSwing = Math.sin(t * 4) * .42;
    line(context, "#d08b67", 13, () => {
      context.moveTo(43, -30);
      context.bezierCurveTo(84, -25, 76 + tailSwing * 25, -84, 115 + tailSwing * 25, -69);
    });
    ellipse(context, 0, -27, 55, 39, "#e8ac81");
    ellipse(context, -5, -94, 45, 42, "#efb98e");
    context.fillStyle = "#efb98e";
    context.beginPath();
    context.moveTo(-42, -116);
    context.lineTo(-31, -157);
    context.lineTo(-4, -127);
    context.closePath();
    context.fill();
    context.beginPath();
    context.moveTo(6, -127);
    context.lineTo(37, -154);
    context.lineTo(42, -111);
    context.closePath();
    context.fill();
    context.fillStyle = "#d78787";
    context.beginPath();
    context.moveTo(-34, -128);
    context.lineTo(-29, -145);
    context.lineTo(-17, -130);
    context.closePath();
    context.fill();
    context.beginPath();
    context.moveTo(20, -130);
    context.lineTo(34, -142);
    context.lineTo(35, -124);
    context.closePath();
    context.fill();
    const blink = Math.sin(t * 1.25) > .94;
    if (blink) {
      line(context, "#493b44", 3, () => { context.moveTo(-23, -96); context.lineTo(-13, -96); });
      line(context, "#493b44", 3, () => { context.moveTo(13, -96); context.lineTo(23, -96); });
    } else {
      ellipse(context, -18, -96, 4, 6, "#493b44");
      ellipse(context, 18, -96, 4, 6, "#493b44");
      ellipse(context, -19, -98, 1.4, 2, "#fff");
      ellipse(context, 17, -98, 1.4, 2, "#fff");
    }
    ellipse(context, 0, -82, 4, 3, "#bd6f78");
    line(context, "#70525a", 1.5, () => { context.moveTo(0, -79); context.quadraticCurveTo(-2, -74, -7, -76); });
    line(context, "#70525a", 1.5, () => { context.moveTo(0, -79); context.quadraticCurveTo(2, -74, 7, -76); });
    line(context, "#fff0df", 1.4, () => { context.moveTo(-30, -81); context.lineTo(-58, -87); });
    line(context, "#fff0df", 1.4, () => { context.moveTo(-30, -76); context.lineTo(-58, -75); });
    line(context, "#fff0df", 1.4, () => { context.moveTo(30, -81); context.lineTo(58, -87); });
    line(context, "#fff0df", 1.4, () => { context.moveTo(30, -76); context.lineTo(58, -75); });
    const legOffset = Math.sin(t * Math.PI * 2) * 3;
    ellipse(context, -27, 6 + legOffset, 11, 24, "#d99872");
    ellipse(context, 27, 6 - legOffset, 11, 24, "#d99872");
    context.restore();
  }

  function drawFlower(t) {
    const sway = Math.sin(t * Math.PI / 4) * .12;
    context.save();
    context.translate(480, 399);
    context.rotate(sway);
    line(context, "#4f9a6e", 13, () => { context.moveTo(0, 0); context.quadraticCurveTo(5, -94, -4, -177); });
    ellipse(context, -20, -84, 27, 12, "#72bd83");
    context.save();
    context.translate(-20, -84);
    context.rotate(-.38);
    ellipse(context, 0, 0, 23, 10, "#72bd83");
    context.restore();
    ellipse(context, 21, -126, 28, 12, "#72bd83");
    context.save();
    context.translate(21, -126);
    context.rotate(.36);
    ellipse(context, 0, 0, 23, 10, "#72bd83");
    context.restore();
    context.fillStyle = "#cb7e5d";
    context.beginPath();
    context.moveTo(-72, -4);
    context.lineTo(72, -4);
    context.lineTo(55, 77);
    context.quadraticCurveTo(0, 103, -55, 77);
    context.closePath();
    context.fill();
    context.fillStyle = "#e49b77";
    context.fillRect(-76, -9, 152, 13);
    context.save();
    context.translate(-4, -179);
    context.rotate(Math.sin(t * Math.PI / 4) * .15);
    for (let i = 0; i < 8; i += 1) {
      context.rotate(Math.PI / 4);
      ellipse(context, 0, -39, 19, 34, i % 2 ? "#f5a8bd" : "#ffbad0");
    }
    ellipse(context, 0, 0, 22, 22, "#f8d36d");
    ellipse(context, -7, -4, 2.5, 2.5, "#a86d4d");
    ellipse(context, 7, -4, 2.5, 2.5, "#a86d4d");
    line(context, "#a86d4d", 2, () => { context.moveTo(-5, 6); context.quadraticCurveTo(0, 12, 5, 6); });
    context.restore();
    context.restore();
  }

  function drawBird(t) {
    const x = 480 + Math.sin(t * Math.PI / 4) * 87;
    const y = 294 + Math.sin(t * Math.PI / 2) * 34;
    context.save();
    context.translate(x, y);
    context.rotate(Math.sin(t * Math.PI / 4) * .055);
    ellipse(context, 0, 0, 70, 47, "#5879ce");
    ellipse(context, -34, -5, 37, 39, "#7596e2");
    context.save();
    context.translate(-8, -14);
    context.rotate(Math.sin(t * Math.PI * 2) * .62);
    ellipse(context, -9, 21, 28, 43, "#3f5eae");
    context.restore();
    ellipse(context, 39, -18, 5, 6, "#22273d");
    ellipse(context, 40, -20, 1.7, 2, "#fff");
    context.fillStyle = "#f1ad6e";
    context.beginPath();
    context.moveTo(66, -4);
    context.lineTo(101, 2);
    context.lineTo(66, 11);
    context.closePath();
    context.fill();
    line(context, "#e5a56d", 4, () => { context.moveTo(-13, 37); context.lineTo(-17, 55); context.lineTo(-29, 57); });
    line(context, "#e5a56d", 4, () => { context.moveTo(10, 38); context.lineTo(12, 54); context.lineTo(24, 56); });
    context.restore();
  }

  function drawBall(t) {
    const bounce = Math.abs(Math.sin(t * Math.PI / 2));
    const y = 415 - bounce * 190;
    const scale = 1 - bounce * .08;
    ellipse(context, 480, 451, 82 + bounce * 30, 12 + bounce * 3, `rgba(28, 48, 47, ${.24 - bounce * .1})`);
    context.save();
    context.translate(480, y);
    context.rotate(t * 2.5);
    context.scale(scale, scale);
    ellipse(context, 0, 0, 66, 66, "#f4a35e");
    context.save();
    context.beginPath();
    context.arc(0, 0, 66, 0, Math.PI * 2);
    context.clip();
    context.fillStyle = "#f7d66e";
    context.beginPath();
    context.moveTo(-66, -30); context.lineTo(0, -66); context.lineTo(66, -28); context.lineTo(44, 13); context.lineTo(-44, 13); context.closePath(); context.fill();
    context.fillStyle = "#5ba6a2";
    context.beginPath();
    context.moveTo(-66, 28); context.lineTo(-44, 13); context.lineTo(44, 13); context.lineTo(66, 30); context.lineTo(0, 66); context.closePath(); context.fill();
    line(context, "rgba(255,255,255,.8)", 4, () => { context.arc(0, 0, 65, 0, Math.PI * 2); });
    context.restore();
    context.restore();
  }

  function drawLandscape(t) {
    drawCloud((390 + Math.sin(t * .8) * 100 + WIDTH) % WIDTH, 300, .8);
    ellipse(context, 480, 468, 65, 12, "rgba(32,56,51,.2)");
    ellipse(context, 480, 393 + Math.sin(t * Math.PI / 4) * 16, 29, 41, "#f2ae83");
    ellipse(context, 480, 342 + Math.sin(t * Math.PI / 4) * 16, 32, 32, "#f4cba3");
    ellipse(context, 469, 339 + Math.sin(t * Math.PI / 4) * 16, 3, 4, "#53413d");
    ellipse(context, 491, 339 + Math.sin(t * Math.PI / 4) * 16, 3, 4, "#53413d");
    context.fillStyle = "#563f49";
    context.beginPath();
    context.arc(480, 339 + Math.sin(t * Math.PI / 4) * 16, 33, Math.PI, Math.PI * 2);
    context.fill();
    line(context, "#e79877", 11, () => { context.moveTo(458, 407); context.lineTo(443, 447 + Math.sin(t * 2) * 8); });
    line(context, "#e79877", 11, () => { context.moveTo(501, 407); context.lineTo(517, 447 - Math.sin(t * 2) * 8); });
  }

  function drawDuel(t) {
    const cloakWave = Math.sin(t * 3) * 13;
    const swordSwing = Math.sin(t * 2.8) * .16;
    const demonBreath = Math.sin(t * 1.8) * 5;

    ellipse(context, 390, 433, 58, 12, "rgba(15,14,25,.35)");
    ellipse(context, 594, 435, 80, 15, "rgba(15,14,25,.4)");

    context.save();
    context.translate(390, 420);
    context.fillStyle = "#a52649";
    context.beginPath();
    context.moveTo(-12, -95);
    context.lineTo(-45, -72);
    context.lineTo(-76, -14 + cloakWave);
    context.lineTo(-31, -30);
    context.lineTo(12, -52);
    context.closePath();
    context.fill();
    context.fillStyle = "#29263b";
    context.beginPath();
    context.moveTo(-17, -88);
    context.lineTo(16, -88);
    context.lineTo(31, -27);
    context.lineTo(-26, -27);
    context.closePath();
    context.fill();
    line(context, "#29263b", 13, () => { context.moveTo(-13, -32); context.lineTo(-28, 4); context.lineTo(-51, 16); });
    line(context, "#29263b", 13, () => { context.moveTo(14, -31); context.lineTo(37, 2); context.lineTo(58, 6); });
    line(context, "#d99177", 10, () => { context.moveTo(14, -76); context.lineTo(37, -67); context.lineTo(52, -80); });
    ellipse(context, 0, -112, 21, 24, "#e9b08f");
    context.fillStyle = "#272336";
    context.beginPath();
    context.moveTo(-20, -116);
    context.quadraticCurveTo(-15, -152, 15, -137);
    context.lineTo(25, -108);
    context.lineTo(7, -119);
    context.lineTo(-8, -112);
    context.closePath();
    context.fill();
    context.fillStyle = "#f4d0b4";
    context.fillRect(6, -113, 3, 3);

    context.save();
    context.translate(51, -80);
    context.rotate(swordSwing);
    line(context, "#553946", 8, () => { context.moveTo(-2, 0); context.lineTo(13, -10); });
    context.shadowColor = "#51eaff";
    context.shadowBlur = 18;
    line(context, "rgba(50, 222, 255, .45)", 14, () => { context.moveTo(10, -9); context.lineTo(148, -83); });
    line(context, "#8af7ff", 5, () => { context.moveTo(10, -9); context.lineTo(148, -83); });
    context.shadowBlur = 0;
    context.fillStyle = "#ecfcff";
    context.beginPath();
    context.arc(112, -62, 9 + Math.sin(t * 12) * 2, 0, Math.PI * 2);
    context.fill();
    context.restore();
    context.restore();

    context.save();
    context.translate(594, 426);
    context.fillStyle = "#211d31";
    context.beginPath();
    context.ellipse(0, -58 + demonBreath, 50, 82, 0, 0, Math.PI * 2);
    context.fill();
    context.beginPath();
    context.moveTo(-31, -116);
    context.lineTo(-46, -157);
    context.lineTo(-10, -132);
    context.lineTo(7, -137);
    context.lineTo(39, -164);
    context.lineTo(32, -119);
    context.closePath();
    context.fill();
    line(context, "#211d31", 20, () => { context.moveTo(-26, -91); context.lineTo(-77, -115); context.lineTo(-103, -90); });
    line(context, "#211d31", 20, () => { context.moveTo(27, -91); context.lineTo(63, -118); context.lineTo(81, -102); });
    line(context, "#211d31", 10, () => { context.moveTo(-22, 2); context.lineTo(-32, 32); });
    line(context, "#211d31", 10, () => { context.moveTo(23, 3); context.lineTo(37, 30); });
    line(context, "#211d31", 8, () => {
      context.moveTo(39, -35);
      context.quadraticCurveTo(112, -20, 86 + Math.sin(t * 2) * 8, 24);
    });
    ellipse(context, -14, -103, 5, 3, "#ff686e");
    ellipse(context, 15, -103, 5, 3, "#ff686e");
    line(context, "#ff686e", 3, () => { context.moveTo(-6, -82); context.lineTo(7, -78); });
    context.restore();

    context.save();
    context.globalCompositeOperation = "lighter";
    context.shadowColor = "#71f4ff";
    context.shadowBlur = 20;
    for (let i = 0; i < 7; i += 1) {
      const angle = (i / 7) * Math.PI * 2 + t * 3;
      ellipse(context, 548 + Math.cos(angle) * (12 + (i % 2) * 4), 340 + Math.sin(angle) * (12 + (i % 3) * 3), 2, 2, "#8af7ff");
    }
    context.restore();
  }

  function drawGeneratedBackground(t, scene) {
    const gradient = context.createLinearGradient(0, 0, 0, HEIGHT);
    if (scene.background === "space" || scene.background === "night") {
      gradient.addColorStop(0, "#17182e");
      gradient.addColorStop(1, scene.palette.dark);
    } else if (scene.background === "sunset" || scene.background === "desert") {
      gradient.addColorStop(0, "#765071");
      gradient.addColorStop(1, "#f0a36d");
    } else if (scene.background === "ocean") {
      gradient.addColorStop(0, "#66b6d2");
      gradient.addColorStop(1, "#19799c");
    } else if (scene.background === "snow") {
      gradient.addColorStop(0, "#94c5de");
      gradient.addColorStop(1, "#e5f0f3");
    } else if (scene.background === "city") {
      gradient.addColorStop(0, "#302d58");
      gradient.addColorStop(1, "#e37977");
    } else {
      gradient.addColorStop(0, "#9bd1db");
      gradient.addColorStop(1, scene.background === "forest" ? "#b5d09c" : "#f1d5aa");
    }
    context.fillStyle = gradient;
    context.fillRect(0, 0, WIDTH, HEIGHT);

    if (scene.background === "space" || scene.background === "night") {
      for (let i = 0; i < 54; i += 1) {
        const x = (i * 193 + scene.seed * 7) % WIDTH;
        const y = (i * 97 + scene.seed * 3) % 440;
        const twinkle = .4 + .5 * Math.sin(t * (1.4 + (i % 3) * .4) + i);
        ellipse(context, x, y, i % 8 === 0 ? 2 : 1, i % 8 === 0 ? 2 : 1, `rgba(255,255,235,${twinkle})`);
      }
      ellipse(context, 778, 112, 42, 42, scene.palette.accent);
    } else if (scene.background === "ocean") {
      context.fillStyle = "rgba(255,255,255,.25)";
      context.fillRect(0, 300, WIDTH, 300);
      for (let i = 0; i < 9; i += 1) {
        const y = 335 + i * 31;
        line(context, i % 2 ? "rgba(214,248,255,.4)" : "rgba(17,92,126,.38)", 3, () => {
          context.moveTo(0, y);
          context.quadraticCurveTo(240, y + Math.sin(t + i) * 10, 480, y);
          context.quadraticCurveTo(720, y - Math.sin(t + i) * 10, WIDTH, y);
        });
      }
    } else if (scene.background === "city") {
      context.fillStyle = "#29263e";
      for (let i = 0; i < 9; i += 1) {
        const x = i * 112;
        const height = 100 + ((i * 47 + scene.seed) % 150);
        context.fillRect(x, 420 - height, 88, height + 180);
        for (let row = 0; row < 4; row += 1) {
          context.fillStyle = (i + row) % 2 ? "#f5c46e" : "#9deaff";
          context.fillRect(x + 14 + (row % 2) * 25, 440 - height + row * 28, 8, 12);
          context.fillRect(x + 47, 440 - height + row * 28, 8, 12);
        }
        context.fillStyle = "#29263e";
      }
    } else if (scene.background === "forest") {
      context.fillStyle = "#527a65";
      context.beginPath();
      context.moveTo(0, 360);
      context.quadraticCurveTo(240, 260, 460, 365);
      context.quadraticCurveTo(720, 470, WIDTH, 330);
      context.lineTo(WIDTH, HEIGHT);
      context.lineTo(0, HEIGHT);
      context.closePath();
      context.fill();
      for (let i = 0; i < 8; i += 1) {
        const x = i * 137 + 20;
        context.fillStyle = "#5b413b";
        context.fillRect(x, 245 + (i % 3) * 28, 18, 230);
        ellipse(context, x + 8, 252 + (i % 3) * 28, 54, 72, i % 2 ? "#47785b" : "#598661");
      }
    } else if (scene.background === "desert") {
      context.fillStyle = "#d88763";
      context.beginPath();
      context.moveTo(0, 410);
      context.quadraticCurveTo(250, 300, 490, 412);
      context.quadraticCurveTo(710, 510, WIDTH, 375);
      context.lineTo(WIDTH, HEIGHT);
      context.lineTo(0, HEIGHT);
      context.closePath();
      context.fill();
      context.fillStyle = "#bb6f5c";
      context.beginPath();
      context.moveTo(0, 492);
      context.quadraticCurveTo(300, 415, 620, 492);
      context.quadraticCurveTo(790, 535, WIDTH, 468);
      context.lineTo(WIDTH, HEIGHT);
      context.lineTo(0, HEIGHT);
      context.closePath();
      context.fill();
    } else if (scene.background === "snow") {
      context.fillStyle = "#d8edf0";
      context.beginPath();
      context.moveTo(0, 428);
      context.lineTo(190, 250);
      context.lineTo(365, 430);
      context.lineTo(560, 220);
      context.lineTo(790, 438);
      context.lineTo(960, 270);
      context.lineTo(960, 600);
      context.lineTo(0, 600);
      context.closePath();
      context.fill();
      context.fillStyle = "#f4fbfc";
      context.fillRect(0, 442, WIDTH, 158);
      for (let i = 0; i < 22; i += 1) {
        const x = (i * 173 + t * (8 + i % 3)) % WIDTH;
        const y = (i * 71 + t * 13) % 430;
        ellipse(context, x, y, 2, 2, "rgba(255,255,255,.8)");
      }
    } else {
      ellipse(context, 778, 112, 42, 42, scene.palette.accent);
      context.fillStyle = scene.background === "sunset" ? "#ae786b" : "#83b78a";
      context.beginPath();
      context.moveTo(0, 430);
      context.quadraticCurveTo(230, 325, 455, 430);
      context.quadraticCurveTo(710, 535, WIDTH, 390);
      context.lineTo(WIDTH, HEIGHT);
      context.lineTo(0, HEIGHT);
      context.closePath();
      context.fill();
      context.fillStyle = scene.palette.dark;
      context.beginPath();
      context.moveTo(0, 505);
      context.quadraticCurveTo(260, 410, 500, 504);
      context.quadraticCurveTo(750, 590, WIDTH, 464);
      context.lineTo(WIDTH, HEIGHT);
      context.lineTo(0, HEIGHT);
      context.closePath();
      context.fill();
      for (let i = 0; i < 5; i += 1) {
        drawCloud((i * 211 + Math.sin(t * .2 + i) * 8) % (WIDTH + 90) - 40, 105 + (i % 3) * 55, .45 + (i % 2) * .2);
      }
    }
  }

  function drawGeneratedEntity(entity, x, y, scale, t, action) {
    const speed = action === "run" || action === "dance" ? 5 : 2;
    const lift = action === "jump" ? Math.abs(Math.sin(t * 2.4)) * 40 : Math.sin(t * speed) * (action === "fly" || action === "swim" ? 17 : 6);
    const tilt = action === "spin" ? t * .8 : (action === "dance" ? Math.sin(t * speed) * .12 : 0);
    const legSwing = Math.sin(t * speed) * 12;
    context.save();
    context.translate(x, y + lift);
    context.rotate(tilt);
    context.scale(scale, scale);
    ellipse(context, 0, 40 - lift, 72, 12, "rgba(24,28,38,.22)");

    if (entity.type === "rocket") {
      context.save();
      context.rotate(-.08 + Math.sin(t * 1.2) * .05);
      context.fillStyle = entity.color;
      context.beginPath();
      context.moveTo(0, -170);
      context.quadraticCurveTo(58, -119, 43, -30);
      context.lineTo(32, 7);
      context.lineTo(-32, 7);
      context.lineTo(-43, -30);
      context.quadraticCurveTo(-58, -119, 0, -170);
      context.fill();
      context.fillStyle = entity.accent;
      context.beginPath();
      context.moveTo(-31, -41); context.lineTo(-72, 10); context.lineTo(-28, -1);
      context.moveTo(31, -41); context.lineTo(72, 10); context.lineTo(28, -1);
      context.closePath();
      context.fill();
      ellipse(context, 0, -95, 22, 22, entity.dark);
      ellipse(context, 0, -95, 14, 14, entity.light);
      context.fillStyle = entity.accent;
      context.beginPath();
      context.moveTo(-20, 2);
      context.quadraticCurveTo(0, 65 + Math.sin(t * 8) * 14, 20, 2);
      context.closePath();
      context.fill();
      context.restore();
    } else if (entity.type === "robot") {
      line(context, entity.dark, 12, () => { context.moveTo(-20, 4); context.lineTo(-29, 42 + legSwing); });
      line(context, entity.dark, 12, () => { context.moveTo(20, 4); context.lineTo(30, 42 - legSwing); });
      roundedRect(context, -43, -78, 86, 88, 18);
      context.fillStyle = entity.color;
      context.fill();
      roundedRect(context, -34, -139, 68, 52, 14);
      context.fillStyle = entity.light;
      context.fill();
      line(context, entity.dark, 5, () => { context.moveTo(0, -139); context.lineTo(0, -160); });
      ellipse(context, 0, -165, 7, 7, entity.accent);
      ellipse(context, -14, -113, 6, 8, entity.dark);
      ellipse(context, 14, -113, 6, 8, entity.dark);
      line(context, entity.dark, 11, () => { context.moveTo(-40, -55); context.lineTo(-67, -35 + legSwing); });
      line(context, entity.dark, 11, () => { context.moveTo(40, -55); context.lineTo(65, -72 - legSwing); });
      roundedRect(context, -20, -54, 40, 28, 7);
      context.fillStyle = entity.accent;
      context.fill();
    } else if (entity.type === "dragon" || entity.type === "monster") {
      ellipse(context, 0, -34, 57, 48, entity.color);
      ellipse(context, 39, -83, 39, 34, entity.color);
      context.fillStyle = entity.dark;
      context.beginPath();
      context.moveTo(-18, -55);
      context.lineTo(-83, -116 + Math.sin(t * 4) * 16);
      context.lineTo(-52, -45);
      context.closePath();
      context.fill();
      context.beginPath();
      context.moveTo(-5, -53);
      context.lineTo(52, -124 - Math.sin(t * 4) * 16);
      context.lineTo(42, -38);
      context.closePath();
      context.fill();
      line(context, entity.dark, 12, () => {
        context.moveTo(-48, -12);
        context.quadraticCurveTo(-108, 16, -99 + Math.sin(t * 2) * 10, -20);
      });
      line(context, entity.color, 16, () => { context.moveTo(-18, -7); context.lineTo(-28, 23 + legSwing); });
      line(context, entity.color, 16, () => { context.moveTo(22, -7); context.lineTo(31, 23 - legSwing); });
      ellipse(context, 52, -88, 5, 6, entity.accent);
      line(context, entity.accent, 4, () => { context.moveTo(70, -68); context.lineTo(83, -65); });
    } else if (entity.type === "person") {
      context.fillStyle = entity.color;
      context.beginPath();
      context.moveTo(-24, -77);
      context.lineTo(24, -77);
      context.lineTo(38, -11);
      context.lineTo(-36, -11);
      context.closePath();
      context.fill();
      if (entity.cloak) {
        context.fillStyle = entity.accent;
        context.beginPath();
        context.moveTo(-17, -73);
        context.lineTo(-43, -50);
        context.lineTo(-72, -3 + Math.sin(t * 3) * 10);
        context.lineTo(-28, -25);
        context.closePath();
        context.fill();
      }
      ellipse(context, 0, -105, 23, 27, entity.light);
      context.fillStyle = entity.dark;
      context.beginPath();
      context.arc(0, -111, 23, Math.PI, 0);
      context.lineTo(18, -92);
      context.lineTo(-17, -105);
      context.closePath();
      context.fill();
      ellipse(context, 8, -105, 2, 2, entity.dark);
      line(context, entity.dark, 12, () => { context.moveTo(-22, -3); context.lineTo(-31, 36 + legSwing); });
      line(context, entity.dark, 12, () => { context.moveTo(21, -3); context.lineTo(33, 36 - legSwing); });
      line(context, entity.light, 10, () => { context.moveTo(-18, -65); context.lineTo(-44, -33 - legSwing); });
      line(context, entity.light, 10, () => { context.moveTo(18, -65); context.lineTo(43, -42 + legSwing); });
      if (entity.weapon) {
        context.shadowColor = entity.accent;
        context.shadowBlur = 16;
        line(context, entity.accent, 5, () => { context.moveTo(43, -42); context.lineTo(110, -104); });
        context.shadowBlur = 0;
      }
    } else if (entity.type === "bird") {
      ellipse(context, 0, -64, 55, 39, entity.color);
      context.save();
      context.translate(-5, -63);
      context.rotate(Math.sin(t * 8) * .7);
      ellipse(context, -5, -27, 24, 39, entity.accent);
      context.restore();
      ellipse(context, 36, -94, 29, 28, entity.color);
      ellipse(context, 43, -97, 4, 5, entity.dark);
      context.fillStyle = entity.accent;
      context.beginPath();
      context.moveTo(63, -87); context.lineTo(94, -77); context.lineTo(63, -72);
      context.closePath();
      context.fill();
    } else if (entity.type === "ball") {
      context.save();
      context.translate(0, -65);
      context.rotate(t * 1.3);
      ellipse(context, 0, 0, 57, 57, entity.color);
      line(context, entity.accent, 8, () => {
        context.moveTo(-47, -19); context.quadraticCurveTo(0, 35, 47, -19);
        context.moveTo(-47, 19); context.quadraticCurveTo(0, -35, 47, 19);
      });
      context.restore();
    } else if (entity.type === "fish") {
      ellipse(context, 0, -50, 64, 42, entity.color);
      context.fillStyle = entity.accent;
      context.beginPath();
      context.moveTo(-53, -50);
      context.lineTo(-96, -83 + Math.sin(t * 5) * 8);
      context.lineTo(-96, -17 + Math.sin(t * 5) * 8);
      context.closePath();
      context.fill();
      context.beginPath();
      context.moveTo(-7, -78);
      context.lineTo(22, -113);
      context.lineTo(38, -69);
      context.closePath();
      context.fill();
      ellipse(context, 41, -58, 5, 5, entity.dark);
    } else if (entity.type === "vehicle") {
      if (entity.aircraft) {
        context.fillStyle = entity.color;
        context.beginPath();
        context.moveTo(-92, -44);
        context.lineTo(47, -58);
        context.lineTo(95, -43);
        context.lineTo(47, -31);
        context.lineTo(-92, -34);
        context.closePath();
        context.fill();
        context.beginPath();
        context.moveTo(-10, -42);
        context.lineTo(-51, -82);
        context.lineTo(21, -47);
        context.closePath();
        context.fill();
        line(context, entity.dark, 5, () => { context.moveTo(65, -43); context.lineTo(78, -65); });
      } else {
        roundedRect(context, -82, -89, 164, 64, 22);
        context.fillStyle = entity.color;
        context.fill();
        roundedRect(context, -45, -127, 83, 52, 16);
        context.fillStyle = entity.light;
        context.fill();
        ellipse(context, -48, -18, 22, 22, entity.dark);
        ellipse(context, 51, -18, 22, 22, entity.dark);
        ellipse(context, -48, -18, 8, 8, entity.accent);
        ellipse(context, 51, -18, 8, 8, entity.accent);
      }
    } else if (entity.type === "cat" || entity.type === "dog" || entity.type === "horse") {
      ellipse(context, 0, -49, entity.type === "horse" ? 57 : 48, 34, entity.color);
      ellipse(context, 34, -88, 30, 30, entity.color);
      if (entity.type === "cat") {
        context.fillStyle = entity.color;
        context.beginPath();
        context.moveTo(13, -105); context.lineTo(15, -140); context.lineTo(37, -113);
        context.moveTo(37, -113); context.lineTo(57, -139); context.lineTo(58, -103);
        context.fill();
      } else {
        ellipse(context, 55, -78, 16, 10, entity.light);
        if (entity.type === "dog") {
          ellipse(context, 9, -91, 13, 23, entity.dark);
          ellipse(context, 54, -91, 5, 5, entity.dark);
          ellipse(context, 67, -78, 9, 7, entity.dark);
        } else {
          ellipse(context, 12, -112, 10, 25, entity.dark);
          line(context, entity.dark, 8, () => { context.moveTo(-31, -59); context.quadraticCurveTo(-68, -77, -72, -111); });
        }
      }
      ellipse(context, 40, -94, 4, 5, entity.dark);
      line(context, entity.dark, 10, () => { context.moveTo(-20, -24); context.lineTo(-24, 8 + legSwing); });
      line(context, entity.dark, 10, () => { context.moveTo(15, -22); context.lineTo(18, 8 - legSwing); });
      line(context, entity.dark, 10, () => { context.moveTo(-53, -49); context.lineTo(-76, -36 + legSwing); });
    } else if (entity.type === "abstract") {
      context.save();
      context.rotate(Math.sin(t * 1.4) * .1);
      context.fillStyle = entity.color;
      context.beginPath();
      context.moveTo(0, -164);
      context.bezierCurveTo(87, -146, 97, -79, 45, -32);
      context.bezierCurveTo(65, 36, -52, 50, -49, -28);
      context.bezierCurveTo(-108, -84, -72, -151, 0, -164);
      context.fill();
      ellipse(context, -18, -103, 7, 9, entity.dark);
      ellipse(context, 17, -103, 7, 9, entity.dark);
      line(context, entity.accent, 5, () => { context.moveTo(-13, -76); context.quadraticCurveTo(0, -65, 14, -76); });
      ellipse(context, -72, -51, 15, 23, entity.accent);
      ellipse(context, 72, -51, 15, 23, entity.accent);
      context.restore();
    } else if (entity.type === "plant") {
      line(context, entity.dark, 13, () => { context.moveTo(0, 0); context.lineTo(0, -135); });
      ellipse(context, -28, -83, 31, 12, entity.color);
      ellipse(context, 29, -110, 31, 12, entity.accent);
      for (let i = 0; i < 8; i += 1) {
        const angle = (i / 8) * Math.PI * 2 + t * .3;
        ellipse(context, Math.cos(angle) * 28, -159 + Math.sin(angle) * 28, 13, 21, i % 2 ? entity.accent : entity.color);
      }
      ellipse(context, 0, -159, 19, 19, "#ffd46e");
      roundedRect(context, -51, 2, 102, 52, 12);
      context.fillStyle = "#b66e5c";
      context.fill();
    } else if (entity.type === "building") {
      roundedRect(context, -69, -123, 138, 139, 9);
      context.fillStyle = entity.color;
      context.fill();
      context.fillStyle = entity.dark;
      context.beginPath();
      context.moveTo(-79, -118);
      context.lineTo(0, -181);
      context.lineTo(79, -118);
      context.closePath();
      context.fill();
      for (let i = -1; i <= 1; i += 1) {
        roundedRect(context, i * 38 - 9, -91, 18, 24, 8);
        context.fillStyle = entity.accent;
        context.fill();
      }
      roundedRect(context, -17, -42, 34, 58, 12);
      context.fillStyle = entity.dark;
      context.fill();
    } else if (entity.type === "planet") {
      context.save();
      context.rotate(-.25);
      context.strokeStyle = entity.accent;
      context.lineWidth = 12;
      context.beginPath();
      context.ellipse(0, -70, 91, 28, 0, 0, Math.PI * 2);
      context.stroke();
      context.restore();
      ellipse(context, 0, -70, 58, 58, entity.color);
      ellipse(context, -20, -90, 14, 8, entity.light);
      ellipse(context, 22, -51, 9, 6, entity.dark);
    } else if (entity.type === "food") {
      context.fillStyle = entity.color;
      context.beginPath();
      context.arc(0, -57, 61, Math.PI, 0);
      context.lineTo(52, -9);
      context.quadraticCurveTo(0, 14, -52, -9);
      context.closePath();
      context.fill();
      context.fillStyle = entity.accent;
      for (let i = 0; i < 8; i += 1) ellipse(context, Math.sin(i * 7) * 36, -51 + i * 5, 5, 5, entity.accent);
      ellipse(context, 0, -7, 47, 8, entity.dark);
    } else {
      ellipse(context, 0, -54, 55, 59, entity.color);
      ellipse(context, 0, -112, 35, 38, entity.color);
      ellipse(context, -13, -117, 5, 6, entity.dark);
      ellipse(context, 13, -117, 5, 6, entity.dark);
      line(context, entity.dark, 12, () => { context.moveTo(-27, -58); context.lineTo(-52, -34 + legSwing); });
      line(context, entity.dark, 12, () => { context.moveTo(27, -58); context.lineTo(52, -34 - legSwing); });
      line(context, entity.accent, 5, () => { context.moveTo(-10, -95); context.lineTo(0, -89); context.lineTo(10, -95); });
    }
    context.restore();
  }

  function render(time) {
    context.clearRect(0, 0, WIDTH, HEIGHT);
    drawBackground(time);
    if (state.scene === "rocket") drawRocket(time);
    else if (state.scene === "cat") drawCat(time);
    else if (state.scene === "flower") drawFlower(time);
    else if (state.scene === "bird") drawBird(time);
    else if (state.scene === "ball") drawBall(time);
    else if (state.scene === "duel") drawDuel(time);
    else if (state.scene === "generated") {
      const count = state.generatedScene.entities.length;
      const portrait = FRAME_FORMATS[videoFormat.value].height > FRAME_FORMATS[videoFormat.value].width;
      const positions = count === 1 ? [480]
        : count === 2 ? (portrait ? [390, 570] : [350, 610])
          : (portrait ? [360, 480, 600] : [270, 480, 690]);
      const scale = count === 1 ? 1 : (count === 2 ? (portrait ? .66 : .82) : (portrait ? .52 : .65));
      state.generatedScene.entities.forEach((entity, index) => {
        drawGeneratedEntity(entity, positions[index], entity.y, scale, time, state.generatedScene.action);
      });
    }
    else drawLandscape(time);
    timeline.value = String(time);
    timecode.textContent = formatTime(time);
  }

  function selectScene(prompt) {
    const normalized = prompt.toLowerCase();
    if (/\b(sword|swordswoman|swordsman|samurai|fight|fighting|battle|combat|duel)\b/.test(normalized)) return "duel";
    const subjects = PROMPT_SUBJECTS.filter((subject) => subject.pattern.test(normalized));
    const hasModifiers = /\b(space|galaxy|starry|stars?|planet|moon|cosmic|ocean|sea|underwater|beach|island|snow|winter|ice|frost|arctic|city|street|neon|building|skyscraper|urban|forest|woods|woodland|jungle|desert|dune|canyon|sunset|dusk|dawn|evening|night|dark|midnight|red|orange|yellow|green|blue|purple|pink|black|white|gold|silver|cyan|run|running|race|racing|chase|chasing|jump|jumping|leap|leaping|fly|flying|soar|soaring|swim|swimming|dance|dancing|spin|spinning|rotate|rotating)\b/.test(normalized);
    if (subjects.length <= 1 && !hasModifiers) {
      if (/\b(rocket|spaceship|space ship|spacecraft)\b/.test(normalized)) return "rocket";
      if (/\b(cat|kitten|kitty|feline)\b/.test(normalized)) return "cat";
      if (/\b(flower|daisy|tulip|blossom|rose)\b/.test(normalized)) return "flower";
      if (/\b(bird|sparrow|parrot|owl|duck)\b/.test(normalized)) return "bird";
      if (/\b(ball|bouncing|bounce|football|basketball)\b/.test(normalized)) return "ball";
    }
    return "generated";
  }

  function hashPrompt(prompt) {
    let hash = 2166136261;
    for (let i = 0; i < prompt.length; i += 1) {
      hash ^= prompt.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
  }

  function createGeneratedScene(prompt) {
    const normalized = prompt.toLowerCase();
    const seed = hashPrompt(normalized);
    const palettes = [
      { color: "#e87858", accent: "#ffd166", dark: "#3d344e", light: "#f4c7a1" },
      { color: "#4b8fc2", accent: "#84e3d3", dark: "#273b5b", light: "#d7f0e9" },
      { color: "#7c66b1", accent: "#f3a6c8", dark: "#302945", light: "#f6d5bd" },
      { color: "#5b9b68", accent: "#f0d26c", dark: "#344d43", light: "#f5dfbd" },
      { color: "#d06b73", accent: "#82d8ea", dark: "#423248", light: "#f4c5a6" },
      { color: "#d9904a", accent: "#f4df8a", dark: "#55404a", light: "#f5d6ae" }
    ];
    const namedColors = {
      red: "#e85e58", orange: "#e98a45", yellow: "#f2cd56", green: "#55a875",
      blue: "#4c8ed1", purple: "#8768ba", pink: "#df83ae", black: "#3b3848",
      white: "#eee9df", gold: "#d8aa4f", silver: "#9da8b0", cyan: "#45c8d7"
    };
    const palette = palettes[seed % palettes.length];
    let subjectColor = palette.color;
    Object.keys(namedColors).some((color) => {
      if (!new RegExp(`\\b${color}\\b`).test(normalized)) return false;
      subjectColor = namedColors[color];
      return true;
    });

    const backgrounds = [
      { pattern: /\b(space|galaxy|starry|stars?|planet|moon|cosmic)\b/, value: "space" },
      { pattern: /\b(ocean|sea|underwater|beach|island|ship|boat)\b/, value: "ocean" },
      { pattern: /\b(snow|winter|ice|frost|arctic)\b/, value: "snow" },
      { pattern: /\b(city|street|neon|building|skyscraper|urban)\b/, value: "city" },
      { pattern: /\b(forest|woods|woodland|jungle)\b/, value: "forest" },
      { pattern: /\b(desert|dune|canyon)\b/, value: "desert" },
      { pattern: /\b(sunset|dusk|dawn|evening)\b/, value: "sunset" },
      { pattern: /\b(night|dark|midnight)\b/, value: "night" }
    ];
    const background = (backgrounds.find((entry) => entry.pattern.test(normalized)) || { value: "meadow" }).value;
    const action = /\b(run|running|race|racing|chase|chasing)\b/.test(normalized) ? "run"
      : /\b(jump|jumping|leap|leaping)\b/.test(normalized) ? "jump"
        : /\b(fly|flying|soar|soaring)\b/.test(normalized) ? "fly"
          : /\b(swim|swimming|underwater)\b/.test(normalized) ? "swim"
            : /\b(dance|dancing)\b/.test(normalized) ? "dance"
              : /\b(spin|spinning|rotate|rotating)\b/.test(normalized) ? "spin" : "float";

    const matchedSubjects = PROMPT_SUBJECTS.filter((subject) => subject.pattern.test(normalized)).slice(0, 3);
    const entities = (matchedSubjects.length ? matchedSubjects : [{ type: "abstract", name: "imaginative character" }])
      .map((subject, index) => {
        const variation = palettes[(seed + index * 3) % palettes.length];
        const colorMatch = index === 0 ? subjectColor : variation.color;
        return {
          type: subject.type,
          name: subject.name,
          color: colorMatch,
          accent: variation.accent,
          dark: variation.dark,
          light: variation.light,
          y: background === "ocean" && subject.type === "fish" ? 390 : (action === "fly" ? 350 : 420),
          cloak: /\b(cloak|cape|hooded)\b/.test(normalized) && subject.type === "person",
          weapon: /\b(sword|blade|wand|staff|spear)\b/.test(normalized) && subject.type === "person",
          aircraft: /\b(plane|airplane|aircraft|helicopter)\b/.test(normalized)
        };
      });
    return { seed, palette, background, action, entities };
  }

  function updatePrompt() {
    characterCount.textContent = `${promptInput.value.length} chars · no limit`;
    promptInput.style.height = "auto";
    promptInput.style.height = `${promptInput.scrollHeight}px`;
    statusMessage.textContent = "";
    if (!promptInput.value.trim()) {
      promptInput.setCustomValidity("Add a scene description before generating.");
    } else {
      promptInput.setCustomValidity("");
    }
  }

  function renderReferenceFrames() {
    referenceFramesContainer.replaceChildren();
    referenceFrames.forEach((frame, index) => {
      const chip = document.createElement("div");
      chip.className = "frame-chip";
      const image = document.createElement("img");
      image.src = frame.url;
      image.alt = frame.file.name;
      const removeButton = document.createElement("button");
      removeButton.type = "button";
      removeButton.className = "remove-frame-button";
      removeButton.textContent = "×";
      removeButton.setAttribute("aria-label", `Remove reference frame ${frame.file.name}`);
      removeButton.addEventListener("click", () => {
        URL.revokeObjectURL(frame.url);
        referenceFrames.splice(index, 1);
        renderReferenceFrames();
      });
      chip.append(image, removeButton);
      referenceFramesContainer.append(chip);
    });
  }

  frameInput.addEventListener("change", () => {
    const files = Array.from(frameInput.files || []);
    const imageFiles = files.filter((file) => file.type.startsWith("image/"));
    files.filter((file) => !file.type.startsWith("image/")).forEach(() => {
      statusMessage.textContent = "Only image files can be added as reference frames.";
    });
    imageFiles.forEach((file) => referenceFrames.push({ file, url: URL.createObjectURL(file) }));
    renderReferenceFrames();
    if (imageFiles.length) {
      statusMessage.textContent = `${imageFiles.length} reference frame${imageFiles.length === 1 ? "" : "s"} added locally.`;
    }
    frameInput.value = "";
  });

  promptInput.addEventListener("input", updatePrompt);
  promptForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const prompt = promptInput.value.trim();
    if (!prompt) {
      promptInput.reportValidity();
      return;
    }
    if (activeRecording) return;
    state.scene = selectScene(prompt);
    state.generatedScene = state.scene === "generated" ? createGeneratedScene(prompt) : null;
    state.title = prompt;
    state.time = 0;
    title.textContent = prompt;
    sceneLabel.textContent = state.scene === "generated"
      ? `${state.generatedScene.entities.map((entity) => entity.name.toUpperCase()).join(" + ")} · ${state.generatedScene.background.toUpperCase()}`
      : sceneNames[state.scene];
    state.playing = true;
    playButton.setAttribute("aria-label", "Pause animation");
    playIcon.textContent = "Ⅱ";
    statusMessage.textContent = "Preparing your video…";
    render(0);
    startVideoRecording();
  });

  playButton.addEventListener("click", () => {
    state.playing = !state.playing;
    playButton.setAttribute("aria-label", state.playing ? "Pause animation" : "Play animation");
    playIcon.textContent = state.playing ? "Ⅱ" : "▶";
    state.lastClock = 0;
  });

  timeline.addEventListener("input", () => {
    state.time = Number(timeline.value);
    state.lastClock = 0;
    render(state.time);
  });
  videoFormat.addEventListener("change", resizeCanvas);
  videoLength.addEventListener("change", updateTimelineDuration);

  function escapeXml(value) {
    return value.replace(/[<>&'"]/g, (character) => ({
      "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", "\"": "&quot;"
    })[character]);
  }

  function generatedSvgEntity(entity, x, scale, action) {
    let subject;
    if (entity.type === "rocket") {
      subject = `<path d="M0-170q58 51 43 140l-11 37h-64l-11-37q-15-89 43-140Z" fill="${entity.color}"/><path d="m-31-41-41 51 44-11m59-40 41 51-44-11" fill="${entity.accent}"/><circle cy="-95" r="22" fill="${entity.dark}"/><circle cy="-95" r="14" fill="${entity.light}"/><path d="M-20 2Q0 68 20 2Z" fill="${entity.accent}"/>`;
    } else if (entity.type === "robot") {
      subject = `<rect x="-43" y="-78" width="86" height="88" rx="18" fill="${entity.color}"/><rect x="-34" y="-139" width="68" height="52" rx="14" fill="${entity.light}"/><path d="M-40-55-67-35m107-20 25-17M-20 4l-9 38M20 4l10 38" fill="none" stroke="${entity.dark}" stroke-width="12" stroke-linecap="round"/><circle cx="-14" cy="-113" r="6" fill="${entity.dark}"/><circle cx="14" cy="-113" r="6" fill="${entity.dark}"/><rect x="-20" y="-54" width="40" height="28" rx="7" fill="${entity.accent}"/>`;
    } else if (entity.type === "dragon" || entity.type === "monster") {
      subject = `<path d="m-18-55-65-61 31 71m47-10 57-69-10 86" fill="${entity.dark}"/><path d="M-48-12q-60 28-51-8M-18-7l-10 30m32-30 9 30" fill="none" stroke="${entity.dark}" stroke-width="12" stroke-linecap="round"/><ellipse cy="-34" rx="57" ry="48" fill="${entity.color}"/><circle cx="39" cy="-83" r="34" fill="${entity.color}"/><circle cx="52" cy="-88" r="5" fill="${entity.accent}"/>`;
    } else if (entity.type === "person") {
      subject = `<path d="m-24-77 48 0 14 66h-74Z" fill="${entity.color}"/><circle cy="-105" r="23" fill="${entity.light}"/><path d="M-23-111q3-33 33-21l13 27-19-11-15 7Z" fill="${entity.dark}"/><path d="m-22-3-9 39m52-39 12 39M-18-65l-26 32m62-32 25 23" fill="none" stroke="${entity.dark}" stroke-width="12" stroke-linecap="round"/>${entity.cloak ? `<path d="m-17-73-26 23-29 47 44-22Z" fill="${entity.accent}"/>` : ""}${entity.weapon ? `<path d="m43-42 67-62" stroke="${entity.accent}" stroke-width="6" stroke-linecap="round"/>` : ""}`;
    } else if (entity.type === "cat" || entity.type === "dog" || entity.type === "horse") {
      subject = `<ellipse cy="-49" rx="48" ry="34" fill="${entity.color}"/><circle cx="34" cy="-88" r="30" fill="${entity.color}"/><path d="M13-105 15-140 37-113m0 0 20-26 1 36" fill="${entity.color}"/><circle cx="40" cy="-94" r="4" fill="${entity.dark}"/><path d="m-20-24-4 32m39-32 3 32m-71-57-23 13" stroke="${entity.dark}" stroke-width="9" stroke-linecap="round"/>`;
    } else if (entity.type === "bird") {
      subject = `<ellipse cy="-64" rx="55" ry="39" fill="${entity.color}"/><ellipse cx="-5" cy="-90" rx="24" ry="39" fill="${entity.accent}"><animateTransform attributeName="transform" type="rotate" values="0 -5 -63;-55 -5 -63;0 -5 -63" dur=".7s" repeatCount="indefinite"/></ellipse><circle cx="36" cy="-94" r="29" fill="${entity.color}"/><path d="m63-87 31 10-31 5Z" fill="${entity.accent}"/>`;
    } else if (entity.type === "fish") {
      subject = `<ellipse cy="-50" rx="64" ry="42" fill="${entity.color}"/><path d="m-53-50-43-33v66Z" fill="${entity.accent}"/><circle cx="41" cy="-58" r="5" fill="${entity.dark}"/>`;
    } else if (entity.type === "vehicle") {
      subject = entity.aircraft
        ? `<path d="m-92-44 139-14 48 15-48 12-139-3Z M-10-42l-41-40 72 35Z" fill="${entity.color}"/>`
        : `<rect x="-82" y="-89" width="164" height="64" rx="22" fill="${entity.color}"/><rect x="-45" y="-127" width="83" height="52" rx="16" fill="${entity.light}"/><circle cx="-48" cy="-18" r="22" fill="${entity.dark}"/><circle cx="51" cy="-18" r="22" fill="${entity.dark}"/>`;
    } else if (entity.type === "plant") {
      subject = `<path d="M0 0V-135" stroke="${entity.dark}" stroke-width="13"/><ellipse cx="-28" cy="-83" rx="31" ry="12" fill="${entity.color}"/><ellipse cx="29" cy="-110" rx="31" ry="12" fill="${entity.accent}"/><g transform="translate(0 -159)">${Array.from({ length: 8 }, (_, i) => `<ellipse cy="-29" rx="13" ry="21" fill="${i % 2 ? entity.accent : entity.color}" transform="rotate(${i * 45})"/>`).join("")}<circle r="19" fill="#ffd46e"/></g><rect x="-51" y="2" width="102" height="52" rx="12" fill="#b66e5c"/>`;
    } else if (entity.type === "building") {
      subject = `<path d="M-69 16v-139h138V16Zm-10-134 79-63 79 63Z" fill="${entity.color}"/><path d="M-79-118 0-181 79-118Z" fill="${entity.dark}"/><rect x="-17" y="-42" width="34" height="58" rx="12" fill="${entity.dark}"/>`;
    } else if (entity.type === "planet") {
      subject = `<ellipse cy="-70" rx="91" ry="28" fill="none" stroke="${entity.accent}" stroke-width="12"/><circle cy="-70" r="58" fill="${entity.color}"/><ellipse cx="-20" cy="-90" rx="14" ry="8" fill="${entity.light}"/>`;
    } else if (entity.type === "food") {
      subject = `<path d="M-61-57a61 61 0 0 1 122 0v48q-61 32-122 0Z" fill="${entity.color}"/><path d="M-47-51h94" stroke="${entity.accent}" stroke-width="8"/>`;
    } else if (entity.type === "ball") {
      subject = `<circle cy="-65" r="57" fill="${entity.color}"/><path d="M-47-84q47 54 94 0m-94 38q47-54 94 0" fill="none" stroke="${entity.accent}" stroke-width="8"/>`;
    } else {
      subject = `<path d="M0-164c87 18 97 85 45 132 20 68-97 82-94 4-59-56-23-123 49-136Z" fill="${entity.color}"/><circle cx="-18" cy="-103" r="7" fill="${entity.dark}"/><circle cx="17" cy="-103" r="7" fill="${entity.dark}"/><path d="M-13-76q13 11 27 0" fill="none" stroke="${entity.accent}" stroke-width="5"/>`;
    }
    const y = entity.y;
    return `<g transform="translate(${x} ${y}) scale(${scale})"><animateTransform attributeName="transform" additive="sum" type="translate" values="0 0;0 -16;0 0" dur="${action === "fly" ? "2s" : "3s"}" repeatCount="indefinite"/>${subject}</g>`;
  }

  function downloadSvg(svg, filename) {
    const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.append(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function exportSvg() {
    const titleText = escapeXml(state.title);
    const { width, height } = FRAME_FORMATS[videoFormat.value];
    const scale = Math.max(width / WIDTH, height / HEIGHT);
    const viewWidth = width / scale;
    const viewHeight = height / scale;
    const viewX = (WIDTH - viewWidth) / 2;
    const viewY = (HEIGHT - viewHeight) / 2;
    if (state.scene === "generated") {
      const scene = state.generatedScene;
      const background = scene.background === "space"
        ? `<circle cx="778" cy="112" r="42" fill="${scene.palette.accent}"/>${Array.from({ length: 54 }, (_, i) => `<circle cx="${(i * 193 + scene.seed * 7) % WIDTH}" cy="${(i * 97 + scene.seed * 3) % 440}" r="${i % 8 === 0 ? 2 : 1}" fill="#fff" opacity=".8"/>`).join("")}`
        : scene.background === "ocean"
          ? `<path d="M0 300h960v300H0Z" fill="#2388a4"/><path d="M0 360q120-20 240 0t240 0 240 0 240 0M0 430q120-20 240 0t240 0 240 0 240 0" fill="none" stroke="#bce9ed" stroke-width="5" opacity=".55"/>`
          : scene.background === "city"
            ? Array.from({ length: 9 }, (_, i) => {
              const x = i * 112;
              const h = 100 + ((i * 47 + scene.seed) % 150);
              return `<rect x="${x}" y="${420 - h}" width="88" height="${h + 180}" fill="#29263e"/><rect x="${x + 14}" y="${440 - h}" width="8" height="12" fill="#f5c46e"/><rect x="${x + 47}" y="${468 - h}" width="8" height="12" fill="#9deaff"/>`;
            }).join("")
            : scene.background === "snow"
              ? `<path d="m0 428 190-178 175 180 195-210 230 218 170-168v330H0Z" fill="#d8edf0"/><path d="M0 442h960v158H0Z" fill="#f4fbfc"/>`
              : scene.background === "forest"
                ? `<path d="M0 360q240-100 460 5t500-35v270H0Z" fill="#527a65"/>${Array.from({ length: 7 }, (_, i) => `<rect x="${i * 137 + 20}" y="245" width="18" height="230" fill="#5b413b"/><circle cx="${i * 137 + 28}" cy="252" r="54" fill="${i % 2 ? "#47785b" : "#598661"}"/>`).join("")}`
                : `<path d="M0 430q230-105 455 0t505-40v210H0Z" fill="${scene.background === "desert" ? "#d88763" : "#83b78a"}"/><path d="M0 505q260-95 500 0t460-40v135H0Z" fill="${scene.palette.dark}"/>`;
      const entities = scene.entities.map((entity, index) => {
        const count = scene.entities.length;
        const portrait = height > width;
        const positions = count === 1 ? [480]
          : count === 2 ? (portrait ? [390, 570] : [350, 610])
            : (portrait ? [360, 480, 600] : [270, 480, 690]);
        const entityScale = count === 1 ? 1 : (count === 2 ? (portrait ? .66 : .82) : (portrait ? .52 : .65));
        const x = positions[index];
        return generatedSvgEntity(entity, x, entityScale, scene.action);
      }).join("");
      const svg = `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="${viewX} ${viewY} ${viewWidth} ${viewHeight}" role="img" aria-labelledby="title desc"><title id="title">${titleText}</title><desc id="desc">Locally generated, animated procedural vector scene. Open this SVG in a browser to play.</desc><defs><linearGradient id="sky" x2="0" y2="1"><stop stop-color="${scene.background === "space" || scene.background === "night" ? "#17182e" : "#9bd1db"}"/><stop offset="1" stop-color="${scene.palette.dark}"/></linearGradient></defs><rect width="960" height="600" fill="url(#sky)"/>${background}${entities}</svg>`;
      downloadSvg(svg, `generated-${videoFormat.value}-animation.svg`);
      statusMessage.textContent = "Animated SVG downloaded — open it in your browser to play.";
      return;
    }
    const scenery = state.scene === "rocket"
      ? `<circle cx="780" cy="95" r="36" fill="#f5e8bd"/><circle cx="765" cy="84" r="36" fill="#252544"/>${Array.from({ length: 38 }, (_, i) => `<circle cx="${(i * 193 + 37) % WIDTH}" cy="${(i * 97 + 23) % 440}" r="${i % 9 === 0 ? 2.2 : 1}" fill="#fff3d4" opacity=".8"/>`).join("")}`
      : state.scene === "duel"
        ? `<circle cx="744" cy="190" r="62" fill="#ffd49a"/><path d="M0 340 130 300 235 337 378 284 510 338 710 292 840 334 960 296V600H0Z" fill="#342438"/><path d="M60 392V270h56v122M48 278v-18h80v18m-52-18v-38h22v38M829 392V248h58v144m-69-137v-18h80v18m-52-18v-42h24v42" fill="#241f30"/><path d="M0 440h960v160H0Z" fill="#55404a"/><g stroke="#6b4c52" stroke-width="2"><path d="M0 470h960M0 512h960M0 554h960"/><path d="M55 445v25m112 0v42m112-67v25m112 0v42m112-67v25m112 0v42m112-67v25m112 0v42m-840 0v42m112-42v42m112-42v42m112-42v42m112-42v42m112-42v42m112-42v42"/></g>`
        : `<circle cx="781" cy="105" r="41" fill="#ffe8a3"/><path d="M0 446 Q194 340 396 432 T960 390 V600 H0Z" fill="#8cbd9c"/><path d="M0 501 Q267 418 503 505 T960 461 V600 H0Z" fill="#668e88"/><g fill="#fff" opacity=".65"><ellipse cx="145" cy="156" rx="43" ry="15"/><ellipse cx="515" cy="112" rx="43" ry="15"/><ellipse cx="813" cy="209" rx="43" ry="15"/></g>`;

    let subject = "";
    if (state.scene === "duel") {
      subject = `<g transform="translate(390 420)"><path d="M-12 -95 -45 -72 -76 -14 -31 -30 12 -52Z" fill="#a52649"><animateTransform attributeName="transform" type="skewX" values="0;-3;0" dur="2.8s" repeatCount="indefinite"/></path><path d="m-17-88 33 0 15 61h-57Z" fill="#29263b"/><path d="m-13-32-38 48m65-47 44 43" fill="none" stroke="#29263b" stroke-width="13" stroke-linecap="round"/><circle cy="-112" r="21" fill="#e9b08f"/><path d="M-20-116q5-36 35-21l10 29-18-11-15 7Z" fill="#272336"/><circle cx="8" cy="-113" r="2" fill="#f4d0b4"/><g class="duel-blade"><path d="m48-79 149-79" fill="none" stroke="#35dfff" stroke-width="13" opacity=".4"/><path d="m48-79 149-79" fill="none" stroke="#8af7ff" stroke-width="4"/><path d="m42-75 13-9" stroke="#553946" stroke-width="8" stroke-linecap="round"/></g></g><g transform="translate(594 426)" class="duel-demon"><ellipse cy="-58" rx="50" ry="82" fill="#211d31"/><path d="m-31-116-15-41 36 25 17-5 32-27-7 45Z" fill="#211d31"/><path d="m-26-91-77-24m130 24 36-27" fill="none" stroke="#211d31" stroke-width="20" stroke-linecap="round"/><path d="m-22 2-10 30m55-29 14 27m25-62q73 15 47 59" fill="none" stroke="#211d31" stroke-width="10" stroke-linecap="round"/><ellipse cx="-14" cy="-103" rx="5" ry="3" fill="#ff686e"/><ellipse cx="15" cy="-103" rx="5" ry="3" fill="#ff686e"/><path d="m-6-82 13 4" stroke="#ff686e" stroke-width="3"/></g><g class="duel-spark" fill="#8af7ff"><circle cx="536" cy="340" r="4"/><circle cx="551" cy="330" r="3"/><circle cx="558" cy="349" r="3"/></g>`;
    } else if (state.scene === "rocket") {
      subject = `<g transform="translate(485 296) rotate(-9)"><g class="float"><path d="M-23 67 Q-46 117 -26 112 Q-5 110 -12 66Z" fill="#ff865c"/><path d="M-36 37 -66 68 -30 62M28 37 61 68 27 62" fill="#f4effb"/><path d="M-37 -32 Q-37 -67 0 -70 Q37 -67 37 -32 V43 Q37 70 0 70 Q-37 70 -37 43Z" fill="#f4effb"/><path d="M-32 -40 Q0 -88 32 -40Z" fill="#f5a1a8"/><circle cy="-2" r="18" fill="#8cc9df"/><circle cy="-2" r="12" fill="#314b73"/><circle cx="-5" cy="-8" r="4" fill="white"/></g></g>`;
    } else if (state.scene === "cat") {
      subject = `<g transform="translate(480 425)"><g class="bob"><path d="M43 -30 Q90 -30 75 -80 Q73 -98 109 -82" fill="none" stroke="#d08b67" stroke-width="13" stroke-linecap="round"/><ellipse cy="-27" rx="55" ry="39" fill="#e8ac81"/><circle cy="-94" r="45" fill="#efb98e"/><path d="M-42 -116 -31 -157 -4 -127 M6 -127 37 -154 42 -111" fill="#efb98e"/><path d="M-22 -96v2m40-2v2" stroke="#493b44" stroke-width="5" stroke-linecap="round"/><path d="M-27 -80q27 12 54 0" fill="none" stroke="#bd6f78" stroke-width="3"/><ellipse cx="-27" cy="6" rx="11" ry="24" fill="#d99872"/><ellipse cx="27" cy="6" rx="11" ry="24" fill="#d99872"/></g></g>`;
    } else if (state.scene === "flower") {
      const petals = Array.from({ length: 8 }, (_, i) => `<ellipse cy="-39" rx="19" ry="34" fill="${i % 2 ? "#f5a8bd" : "#ffbad0"}" transform="rotate(${i * 45})"/>`).join("");
      subject = `<g transform="translate(480 399)"><path d="M0 0 Q5 -94 -4 -177" fill="none" stroke="#4f9a6e" stroke-width="13" stroke-linecap="round"/><ellipse cx="-20" cy="-84" rx="27" ry="12" fill="#72bd83" transform="rotate(-25 -20 -84)"/><path d="M-72 -4h144l-17 81q-55 26-110 0Z" fill="#cb7e5d"/><path d="M-76 -9h152v13H-76Z" fill="#e49b77"/><g transform="translate(-4 -179)"><g class="sway">${petals}<circle r="22" fill="#f8d36d"/><circle cx="-7" cy="-4" r="2.5" fill="#a86d4d"/><circle cx="7" cy="-4" r="2.5" fill="#a86d4d"/></g></g></g>`;
    } else if (state.scene === "bird") {
      subject = `<g transform="translate(480 295)"><g class="float"><ellipse rx="70" ry="47" fill="#5879ce"/><ellipse cx="-34" cy="-5" rx="37" ry="39" fill="#7596e2"/><g class="wing"><ellipse cx="-17" cy="12" rx="28" ry="43" fill="#3f5eae"/></g><circle cx="39" cy="-18" r="5" fill="#22273d"/><path d="m66 -4 35 6-35 9Z" fill="#f1ad6e"/></g></g>`;
    } else if (state.scene === "ball") {
      subject = `<ellipse cx="480" cy="451" rx="95" ry="15" fill="#293d38" opacity=".2"/><g class="bounce"><g class="spin"><circle cx="480" cy="0" r="66" fill="#f4a35e"/><path d="M415 -30 480 -66 545 -28 524 13h-88Z" fill="#f7d66e"/><path d="m414 28 22-15h88l21 17-65 36Z" fill="#5ba6a2"/></g></g>`;
    } else {
      subject = `<g class="bob"><ellipse cx="480" cy="393" rx="29" ry="41" fill="#f2ae83"/><circle cx="480" cy="342" r="32" fill="#f4cba3"/><path d="M448 339a32 32 0 0 1 64 0" fill="#563f49"/><circle cx="469" cy="339" r="3" fill="#53413d"/><circle cx="491" cy="339" r="3" fill="#53413d"/><path d="m458 407-15 40m58-40 16 40" stroke="#e79877" stroke-width="11" stroke-linecap="round"/></g>`;
    }

    const animationCss = ".float{animation:float 4s ease-in-out infinite}.bob{animation:bob 2s ease-in-out infinite}.sway{transform-box:fill-box;transform-origin:bottom center;animation:sway 4s ease-in-out infinite}.wing{transform-box:fill-box;transform-origin:top right;animation:flap .45s ease-in-out infinite alternate}.bounce{animation:bounce 2s cubic-bezier(.45,0,.55,1) infinite}.spin{transform-box:fill-box;transform-origin:center;animation:spin 3.2s linear infinite}.duel-blade{transform-origin:48px -79px;animation:blade .8s ease-in-out infinite alternate}.duel-demon{animation:demon 2s ease-in-out infinite alternate}.duel-spark{animation:spark .28s ease-in-out infinite alternate}@keyframes float{50%{transform:translate(0,-25px) rotate(-5deg)}}@keyframes bob{50%{transform:translateY(-18px)}}@keyframes sway{50%{transform:rotate(9deg)}}@keyframes flap{to{transform:rotate(-65deg)}}@keyframes bounce{0%,100%{transform:translateY(400px) scale(1,.92)}50%{transform:translateY(220px) scale(1,1)}}@keyframes spin{to{transform:rotate(360deg)}}@keyframes blade{to{transform:rotate(5deg)}}@keyframes demon{to{transform:translateY(4px)}}@keyframes spark{to{opacity:.3;transform:scale(.7)}}";
    const skyTop = state.scene === "rocket" ? "#18182f" : (state.scene === "duel" ? "#29203f" : "#a9d8e6");
    const skyBottom = state.scene === "rocket" ? "#37345a" : (state.scene === "duel" ? "#ef9a63" : "#e5d4cb");
    const svg = `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="${viewX} ${viewY} ${viewWidth} ${viewHeight}" role="img" aria-labelledby="title desc"><title id="title">${titleText}</title><desc id="desc">Locally generated, animated procedural vector scene. Open this SVG in a browser to play.</desc><style>${animationCss}</style><defs><linearGradient id="sky" x2="0" y2="1"><stop stop-color="${skyTop}"/><stop offset="1" stop-color="${skyBottom}"/></linearGradient></defs><rect width="960" height="600" fill="url(#sky)"/>${scenery}${subject}</svg>`;
    const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `${state.scene}-${videoFormat.value}-animation.svg`;
    document.body.append(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    statusMessage.textContent = "Animated SVG downloaded — open it in your browser to play.";
  }

  exportButton.addEventListener("click", exportSvg);

  function setPlayback(playing) {
    state.playing = playing;
    playButton.setAttribute("aria-label", playing ? "Pause animation" : "Play animation");
    playIcon.textContent = playing ? "Ⅱ" : "▶";
    state.lastClock = 0;
  }

  function stopRecording(cancelled) {
    if (!activeRecording) return;
    activeRecording.cancelled = cancelled;
    window.clearTimeout(activeRecording.stopTimer);
    window.clearInterval(activeRecording.progressTimer);
    if (activeRecording.recorder.state !== "inactive") activeRecording.recorder.stop();
  }

  function startVideoRecording() {
    if (!window.MediaRecorder || typeof canvas.captureStream !== "function") {
      statusMessage.textContent = "Video recording is not supported by this browser. You can still export an animated SVG.";
      return;
    }

    const duration = Number(videoLength.value);
    let stream;
    let mimeType;
    let recorder;
    try {
      stream = canvas.captureStream(FPS);
      mimeType = ["video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm"]
        .find((type) => MediaRecorder.isTypeSupported(type));
    } catch (error) {
      if (stream) stream.getTracks().forEach((track) => track.stop());
      statusMessage.textContent = `Could not prepare video recording: ${error.message}`;
      return;
    }
    if (!mimeType) {
      stream.getTracks().forEach((track) => track.stop());
      statusMessage.textContent = "This browser cannot encode WebM video. You can still export an animated SVG.";
      return;
    }

    try {
      recorder = new MediaRecorder(stream, { mimeType });
    } catch (error) {
      stream.getTracks().forEach((track) => track.stop());
      statusMessage.textContent = `Could not start video recording: ${error.message}`;
      return;
    }

    const chunks = [];
    const previousPlayback = state.playing;
    const startedAt = Date.now();
    const durationLabel = `${duration / 60}-minute`;
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunks.push(event.data);
    };
    recorder.onerror = (event) => {
      const message = event.error ? event.error.message : "The browser reported a recording error.";
      statusMessage.textContent = `Video recording failed: ${message}`;
      stopRecording(true);
    };
    recorder.onstop = () => {
      const recording = activeRecording;
      activeRecording = null;
      stream.getTracks().forEach((track) => track.stop());
      generateVideoButton.disabled = false;
      videoLength.disabled = false;
      videoFormat.disabled = false;
      generateVideoButton.innerHTML = '<span aria-hidden="true">✦</span> Generate video <span class="button-arrow" aria-hidden="true">↗</span>';
      cancelVideoButton.hidden = true;
      if (!recording || recording.cancelled) {
        setPlayback(previousPlayback);
        statusMessage.textContent = "Video generation cancelled.";
        return;
      }
      const blob = new Blob(chunks, { type: mimeType });
      if (generatedVideoUrl) URL.revokeObjectURL(generatedVideoUrl);
      generatedVideoUrl = URL.createObjectURL(blob);
      downloadVideoButton.href = generatedVideoUrl;
      const sceneFileName = state.scene === "generated"
        ? state.generatedScene.entities.map((entity) => entity.name.replace(/\s+/g, "-")).join("-")
        : state.scene;
      downloadVideoButton.download = `${sceneFileName}-${videoFormat.value}-${duration / 60}min.webm`;
      downloadVideoButton.textContent = `Download ${duration / 60}-minute video`;
      downloadVideoButton.hidden = false;
      setPlayback(previousPlayback);
      statusMessage.textContent = `${durationLabel} video is ready to download.`;
    };

    activeRecording = { recorder, cancelled: false, stopTimer: null, progressTimer: null };
    generateVideoButton.disabled = true;
    videoLength.disabled = true;
    videoFormat.disabled = true;
    generateVideoButton.textContent = "Generating video…";
    cancelVideoButton.hidden = false;
    setPlayback(true);
    statusMessage.textContent = `Generating ${durationLabel} video locally. Keep this tab open.`;
    try {
      recorder.start(1000);
    } catch (error) {
      activeRecording = null;
      stream.getTracks().forEach((track) => track.stop());
      generateVideoButton.disabled = false;
      videoLength.disabled = false;
      videoFormat.disabled = false;
      generateVideoButton.innerHTML = '<span aria-hidden="true">✦</span> Generate video <span class="button-arrow" aria-hidden="true">↗</span>';
      cancelVideoButton.hidden = true;
      setPlayback(previousPlayback);
      statusMessage.textContent = `Could not start video recording: ${error.message}`;
      return;
    }
    if (generatedVideoUrl) URL.revokeObjectURL(generatedVideoUrl);
    generatedVideoUrl = null;
    downloadVideoButton.removeAttribute("href");
    downloadVideoButton.hidden = true;
    activeRecording.stopTimer = window.setTimeout(() => stopRecording(false), duration * 1000);
    activeRecording.progressTimer = window.setInterval(() => {
      const elapsed = Math.floor((Date.now() - startedAt) / 1000);
      const minutes = Math.floor(elapsed / 60);
      const seconds = String(elapsed % 60).padStart(2, "0");
      statusMessage.textContent = `Generating ${durationLabel} video… ${minutes}:${seconds} elapsed.`;
    }, 1000);
  }

  cancelVideoButton.addEventListener("click", () => stopRecording(true));

  function animate(timestamp) {
    if (state.playing && timestamp - state.lastDraw >= 1000 / FPS) {
      if (state.lastClock) {
        state.time += Math.min((timestamp - state.lastClock) / 1000, .1);
        const duration = Number(videoLength.value);
        if (state.time >= duration) state.time %= duration;
      }
      state.lastClock = timestamp;
      state.lastDraw = timestamp;
      render(state.time);
    }
    requestAnimationFrame(animate);
  }

  updatePrompt();
  updateTimelineDuration();
  resizeCanvas();
  requestAnimationFrame(animate);
  window.addEventListener("resize", resizeCanvas);
  window.addEventListener("pagehide", () => {
    referenceFrames.forEach((frame) => URL.revokeObjectURL(frame.url));
    if (generatedVideoUrl) URL.revokeObjectURL(generatedVideoUrl);
  });
})();
