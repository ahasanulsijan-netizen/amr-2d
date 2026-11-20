"use strict";

(() => {
  const WIDTH = 960;
  const HEIGHT = 600;
  const FPS = 60;
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
    landscape: "LITTLE WORLD · DAYLIGHT"
  };
  const state = {
    scene: "rocket",
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
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(WIDTH * ratio);
    canvas.height = Math.round(HEIGHT * ratio);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
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
    const sky = context.createLinearGradient(0, 0, 0, HEIGHT);
    if (state.scene === "rocket") {
      sky.addColorStop(0, "#18182f");
      sky.addColorStop(1, "#37345a");
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

  function render(time) {
    context.clearRect(0, 0, WIDTH, HEIGHT);
    drawBackground(time);
    if (state.scene === "rocket") drawRocket(time);
    else if (state.scene === "cat") drawCat(time);
    else if (state.scene === "flower") drawFlower(time);
    else if (state.scene === "bird") drawBird(time);
    else if (state.scene === "ball") drawBall(time);
    else drawLandscape(time);
    timeline.value = String(time);
    timecode.textContent = formatTime(time);
  }

  function selectScene(prompt) {
    const normalized = prompt.toLowerCase();
    const matches = [
      ["rocket", /\b(rocket|spaceship|space ship|astronaut|spacecraft)\b/],
      ["cat", /\b(cat|kitten|kitty|feline)\b/],
      ["flower", /\b(flower|daisy|tulip|blossom|rose)\b/],
      ["bird", /\b(bird|sparrow|parrot|owl|duck)\b/],
      ["ball", /\b(ball|bouncing|bounce|football|basketball)\b/]
    ];
    const match = matches.find(([, pattern]) => pattern.test(normalized));
    return match ? match[0] : "landscape";
  }

  function updatePrompt() {
    const value = promptInput.value.trim();
    characterCount.textContent = `${promptInput.value.length} / 240`;
    statusMessage.textContent = "";
    if (!value) {
      promptInput.setCustomValidity("Add a short scene description before generating.");
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
    state.title = prompt;
    state.time = 0;
    title.textContent = prompt;
    sceneLabel.textContent = sceneNames[state.scene];
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
  videoLength.addEventListener("change", updateTimelineDuration);

  function escapeXml(value) {
    return value.replace(/[<>&'"]/g, (character) => ({
      "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", "\"": "&quot;"
    })[character]);
  }

  function exportSvg() {
    const titleText = escapeXml(state.title);
    const scenery = state.scene === "rocket"
      ? `<circle cx="780" cy="95" r="36" fill="#f5e8bd"/><circle cx="765" cy="84" r="36" fill="#252544"/>${Array.from({ length: 38 }, (_, i) => `<circle cx="${(i * 193 + 37) % WIDTH}" cy="${(i * 97 + 23) % 440}" r="${i % 9 === 0 ? 2.2 : 1}" fill="#fff3d4" opacity=".8"/>`).join("")}`
      : `<circle cx="781" cy="105" r="41" fill="#ffe8a3"/><path d="M0 446 Q194 340 396 432 T960 390 V600 H0Z" fill="#8cbd9c"/><path d="M0 501 Q267 418 503 505 T960 461 V600 H0Z" fill="#668e88"/><g fill="#fff" opacity=".65"><ellipse cx="145" cy="156" rx="43" ry="15"/><ellipse cx="515" cy="112" rx="43" ry="15"/><ellipse cx="813" cy="209" rx="43" ry="15"/></g>`;

    let subject = "";
    if (state.scene === "rocket") {
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

    const animationCss = ".float{animation:float 4s ease-in-out infinite}.bob{animation:bob 2s ease-in-out infinite}.sway{transform-box:fill-box;transform-origin:bottom center;animation:sway 4s ease-in-out infinite}.wing{transform-box:fill-box;transform-origin:top right;animation:flap .45s ease-in-out infinite alternate}.bounce{animation:bounce 2s cubic-bezier(.45,0,.55,1) infinite}.spin{transform-box:fill-box;transform-origin:center;animation:spin 3.2s linear infinite}@keyframes float{50%{transform:translate(0,-25px) rotate(-5deg)}}@keyframes bob{50%{transform:translateY(-18px)}}@keyframes sway{50%{transform:rotate(9deg)}}@keyframes flap{to{transform:rotate(-65deg)}}@keyframes bounce{0%,100%{transform:translateY(400px) scale(1,.92)}50%{transform:translateY(220px) scale(1,1)}}@keyframes spin{to{transform:rotate(360deg)}}";
    const svg = `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="960" height="600" viewBox="0 0 960 600" role="img" aria-labelledby="title desc"><title id="title">${titleText}</title><desc id="desc">Locally generated, animated procedural vector scene. Open this SVG in a browser to play.</desc><style>${animationCss}</style><defs><linearGradient id="sky" x2="0" y2="1"><stop stop-color="${state.scene === "rocket" ? "#18182f" : "#a9d8e6"}"/><stop offset="1" stop-color="${state.scene === "rocket" ? "#37345a" : "#e5d4cb"}"/></linearGradient></defs><rect width="960" height="600" fill="url(#sky)"/>${scenery}${subject}</svg>`;
    const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `${state.scene}-animation.svg`;
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
      downloadVideoButton.download = `${state.scene}-${duration / 60}min.webm`;
      downloadVideoButton.textContent = `Download ${duration / 60}-minute video`;
      downloadVideoButton.hidden = false;
      setPlayback(previousPlayback);
      statusMessage.textContent = `${durationLabel} video is ready to download.`;
    };

    activeRecording = { recorder, cancelled: false, stopTimer: null, progressTimer: null };
    generateVideoButton.disabled = true;
    videoLength.disabled = true;
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
