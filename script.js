const canvas =
  document.getElementById("decorCanvas");

const ctx =
  canvas.getContext("2d");


let currentTool = "round";
let decorationMode = null;

let frostingColor = "#fff1e7";
let brushSize = 14;

let cakeFlavor = "vanilla";
let fillingColor = "#fff4e8";
let fillingName = "Vanilla cream";

let drawing = false;

let lastPoint = null;

let history = [];

let candleData = [];


/* =====================================
   HELPERS
===================================== */

function getPosition(event) {

  const rect =
    canvas.getBoundingClientRect();

  return {
    x:
      (event.clientX - rect.left)
      * canvas.width
      / rect.width,

    y:
      (event.clientY - rect.top)
      * canvas.height
      / rect.height
  };

}


function hexToRGB(hex) {

  const value =
    hex.replace("#", "");

  const number =
    parseInt(value, 16);

  return {
    r: (number >> 16) & 255,
    g: (number >> 8) & 255,
    b: number & 255
  };

}


function adjustColor(
  hex,
  amount
) {

  const rgb =
    hexToRGB(hex);

  const r =
    Math.max(
      0,
      Math.min(
        255,
        rgb.r + amount
      )
    );

  const g =
    Math.max(
      0,
      Math.min(
        255,
        rgb.g + amount
      )
    );

  const b =
    Math.max(
      0,
      Math.min(
        255,
        rgb.b + amount
      )
    );

  return `rgb(${r},${g},${b})`;

}


/* =====================================
   HISTORY
===================================== */

function saveState() {

  history.push(
    ctx.getImageData(
      0,
      0,
      canvas.width,
      canvas.height
    )
  );

  if (history.length > 30) {
    history.shift();
  }

}


/* =====================================
   SELECT PIPING TOOL
===================================== */

document
  .querySelectorAll(".tool")
  .forEach(button => {

    button.addEventListener(
      "click",
      () => {

        document
          .querySelectorAll(".tool")
          .forEach(item =>
            item.classList.remove("active")
          );

        document
          .querySelectorAll(".decoration")
          .forEach(item =>
            item.classList.remove("active")
          );

        button.classList.add("active");

        currentTool =
          button.dataset.tool;

        decorationMode = null;

      }
    );

  });


/* =====================================
   COLOR
===================================== */

document
  .querySelectorAll(".color")
  .forEach(button => {

    button.addEventListener(
      "click",
      () => {

        document
          .querySelectorAll(".color")
          .forEach(item =>
            item.classList.remove("active")
          );

        button.classList.add("active");

        frostingColor =
          button.dataset.color;

      }
    );

  });


document
  .getElementById("sizeSlider")
  .addEventListener(
    "input",
    event => {

      brushSize =
        Number(event.target.value);

    }
  );


/* =====================================
   DECORATION SELECTION
===================================== */

document
  .querySelectorAll(".decoration")
  .forEach(button => {

    button.addEventListener(
      "click",
      () => {

        document
          .querySelectorAll(".decoration")
          .forEach(item =>
            item.classList.remove("active")
          );

        button.classList.add("active");

        decorationMode =
          button.dataset.decoration;

      }
    );

  });


/* =====================================
   CAKE SURFACE LIMIT
===================================== */

function isOnCake(x, y) {

  /*
    Canvas = 1000 x 700.

    Top ellipse approximately:
    center 500,170
    rx 500
    ry 170

    Side:
    x 0-1000
    y 150-680
  */

  const dx =
    (x - 500) / 500;

  const dy =
    (y - 170) / 170;

  const onTop =
    dx * dx +
    dy * dy <= 1;

  const onSide =
    x >= 0 &&
    x <= 1000 &&
    y >= 155 &&
    y <= 680;

  return onTop || onSide;

}


/* =====================================
   DRAW EVENTS
===================================== */

canvas.addEventListener(
  "mousedown",
  event => {

    const p =
      getPosition(event);

    if (!isOnCake(p.x, p.y)) {
      return;
    }

    saveState();


    if (decorationMode) {

      placeDecoration(
        decorationMode,
        p.x,
        p.y
      );

      return;

    }


    /*
      Rosettes work better as
      individual piped flowers.
    */

    if (currentTool === "rosette") {

      drawRosette(
        p.x,
        p.y
      );

      return;

    }


    drawing = true;

    lastPoint = p;


    if (currentTool === "star") {

      drawStarDollop(
        p.x,
        p.y
      );

    } else {

      drawSmoothPiping(
        p,
        p
      );

    }

  }
);


canvas.addEventListener(
  "mousemove",
  event => {

    if (!drawing) {
      return;
    }

    const p =
      getPosition(event);

    if (!isOnCake(p.x, p.y)) {
      return;
    }


    if (currentTool === "star") {

      drawStarLine(
        lastPoint,
        p
      );

    }

    else if (
      currentTool === "ruffle"
    ) {

      drawRuffleLine(
        lastPoint,
        p
      );

    }

    else {

      drawSmoothPiping(
        lastPoint,
        p
      );

    }


    lastPoint = p;

  }
);


window.addEventListener(
  "mouseup",
  () => {

    drawing = false;
    lastPoint = null;

  }
);


/* =====================================
   ROUND PIPING

   Smooth stroke instead of circles.
===================================== */

function drawSmoothPiping(
  from,
  to
) {

  ctx.save();

  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  /*
    Shadow underneath frosting.
  */

  ctx.strokeStyle =
    adjustColor(
      frostingColor,
      -25
    );

  ctx.globalAlpha = .28;

  ctx.lineWidth =
    brushSize * 2.25;

  ctx.shadowColor =
    "rgba(70,30,20,.22)";

  ctx.shadowBlur =
    brushSize * .55;

  ctx.beginPath();

  ctx.moveTo(
    from.x,
    from.y + 3
  );

  ctx.lineTo(
    to.x,
    to.y + 3
  );

  ctx.stroke();


  /*
    Main frosting.
  */

  ctx.globalAlpha = 1;

  ctx.shadowBlur = 0;

  ctx.strokeStyle =
    frostingColor;

  ctx.lineWidth =
    brushSize * 2;

  ctx.beginPath();

  ctx.moveTo(
    from.x,
    from.y
  );

  ctx.lineTo(
    to.x,
    to.y
  );

  ctx.stroke();


  /*
    Gloss highlight.
  */

  ctx.strokeStyle =
    "rgba(255,255,255,.28)";

  ctx.lineWidth =
    Math.max(
      2,
      brushSize * .35
    );

  ctx.beginPath();

  ctx.moveTo(
    from.x - brushSize * .25,
    from.y - brushSize * .25
  );

  ctx.lineTo(
    to.x - brushSize * .25,
    to.y - brushSize * .25
  );

  ctx.stroke();

  ctx.restore();

}


/* =====================================
   STAR PIPING

   Connected shell piping.
===================================== */

function drawStarLine(
  from,
  to
) {

  const distance =
    Math.hypot(
      to.x - from.x,
      to.y - from.y
    );

  const spacing =
    brushSize * 1.1;

  const count =
    Math.max(
      1,
      Math.floor(
        distance / spacing
      )
    );


  for (
    let i = 0;
    i <= count;
    i++
  ) {

    const t =
      i / count;

    const x =
      from.x +
      (to.x - from.x) * t;

    const y =
      from.y +
      (to.y - from.y) * t;

    drawStarDollop(
      x,
      y
    );

  }

}


function drawStarDollop(
  x,
  y
) {

  ctx.save();

  ctx.translate(x, y);

  ctx.shadowColor =
    "rgba(75,35,25,.18)";

  ctx.shadowBlur =
    brushSize * .45;


  const petals = 8;


  for (
    let i = 0;
    i < petals;
    i++
  ) {

    ctx.save();

    ctx.rotate(
      i *
      Math.PI *
      2 /
      petals
    );


    const gradient =
      ctx.createLinearGradient(
        0,
        0,
        brushSize * 1.5,
        0
      );


    gradient.addColorStop(
      0,
      adjustColor(
        frostingColor,
        -18
      )
    );

    gradient.addColorStop(
      .55,
      frostingColor
    );

    gradient.addColorStop(
      1,
      adjustColor(
        frostingColor,
        25
      )
    );


    ctx.fillStyle =
      gradient;


    ctx.beginPath();

    ctx.ellipse(
      brushSize * .55,
      0,
      brushSize,
      brushSize * .38,
      0,
      0,
      Math.PI * 2
    );

    ctx.fill();

    ctx.restore();

  }


  ctx.shadowBlur = 0;

  ctx.fillStyle =
    adjustColor(
      frostingColor,
      10
    );

  ctx.beginPath();

  ctx.arc(
    0,
    0,
    brushSize * .55,
    0,
    Math.PI * 2
  );

  ctx.fill();


  ctx.fillStyle =
    "rgba(255,255,255,.25)";

  ctx.beginPath();

  ctx.arc(
    -brushSize * .18,
    -brushSize * .18,
    brushSize * .18,
    0,
    Math.PI * 2
  );

  ctx.fill();

  ctx.restore();

}


/* =====================================
   RUFFLE
===================================== */

function drawRuffleLine(
  from,
  to
) {

  const dx =
    to.x - from.x;

  const dy =
    to.y - from.y;

  const distance =
    Math.hypot(dx, dy);

  if (distance < 1) {
    return;
  }


  const nx =
    -dy / distance;

  const ny =
    dx / distance;


  ctx.save();

  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  ctx.strokeStyle =
    adjustColor(
      frostingColor,
      -20
    );

  ctx.globalAlpha = .25;

  ctx.lineWidth =
    brushSize * 1.8;


  ctx.beginPath();


  const steps = 12;


  for (
    let i = 0;
    i <= steps;
    i++
  ) {

    const t =
      i / steps;

    const baseX =
      from.x + dx * t;

    const baseY =
      from.y + dy * t;

    const wave =
      Math.sin(
        t *
        Math.PI *
        4
      )
      * brushSize *
      .65;

    const x =
      baseX +
      nx * wave;

    const y =
      baseY +
      ny * wave +
      3;


    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }

  }


  ctx.stroke();


  ctx.globalAlpha = 1;

  ctx.strokeStyle =
    frostingColor;

  ctx.lineWidth =
    brushSize * 1.45;


  ctx.beginPath();


  for (
    let i = 0;
    i <= steps;
    i++
  ) {

    const t =
      i / steps;

    const baseX =
      from.x + dx * t;

    const baseY =
      from.y + dy * t;

    const wave =
      Math.sin(
        t *
        Math.PI *
        4
      )
      * brushSize *
      .65;

    const x =
      baseX +
      nx * wave;

    const y =
      baseY +
      ny * wave;


    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }

  }


  ctx.stroke();

  ctx.restore();

}


/* =====================================
   ROSETTE
===================================== */

function drawRosette(
  x,
  y
) {

  ctx.save();

  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  ctx.shadowColor =
    "rgba(80,35,25,.2)";

  ctx.shadowBlur =
    brushSize * .5;


  /*
    Dark under-layer
  */

  ctx.strokeStyle =
    adjustColor(
      frostingColor,
      -22
    );

  ctx.lineWidth =
    brushSize * .7;


  ctx.beginPath();


  for (
    let angle = 0;
    angle < Math.PI * 5;
    angle += .12
  ) {

    const radius =
      2 +
      angle *
      brushSize *
      .12;

    const px =
      x +
      Math.cos(angle)
      * radius;

    const py =
      y +
      Math.sin(angle)
      * radius;


    if (angle === 0) {
      ctx.moveTo(px, py);
    } else {
      ctx.lineTo(px, py);
    }

  }


  ctx.stroke();


  /*
    Main cream
  */

  ctx.shadowBlur = 0;

  ctx.strokeStyle =
    frostingColor;

  ctx.lineWidth =
    brushSize * .52;


  ctx.beginPath();


  for (
    let angle = 0;
    angle < Math.PI * 5;
    angle += .12
  ) {

    const radius =
      2 +
      angle *
      brushSize *
      .12;

    const px =
      x +
      Math.cos(angle)
      * radius;

    const py =
      y +
      Math.sin(angle)
      * radius;


    if (angle === 0) {
      ctx.moveTo(px, py);
    } else {
      ctx.lineTo(px, py);
    }

  }


  ctx.stroke();


  ctx.fillStyle =
    adjustColor(
      frostingColor,
      18
    );

  ctx.beginPath();

  ctx.arc(
    x,
    y,
    brushSize * .35,
    0,
    Math.PI * 2
  );

  ctx.fill();

  ctx.restore();

}


/* =====================================
   DECORATIONS
===================================== */

function placeDecoration(
  type,
  x,
  y
) {

  switch (type) {

    case "strawberry":
      drawStrawberry(x, y);
      break;

    case "cherry":
      drawCherry(x, y);
      break;

    case "blueberry":
      drawBlueberry(x, y);
      break;

    case "flower":
      drawFlower(x, y);
      break;

    case "heart":
      drawHeart(x, y);
      break;

    case "pearl":
      drawPearl(x, y);
      break;

    case "sprinkles":
      drawSprinkles(x, y);
      break;

    case "candle":
      createCandle(x, y);
      break;

  }

}


/* STRAWBERRY */

function drawStrawberry(
  x,
  y
) {

  ctx.save();

  ctx.translate(x, y);

  ctx.shadowColor =
    "rgba(70,20,20,.2)";

  ctx.shadowBlur = 8;


  const gradient =
    ctx.createRadialGradient(
      -8,
      -10,
      3,
      0,
      0,
      34
    );

  gradient.addColorStop(
    0,
    "#ff7780"
  );

  gradient.addColorStop(
    .45,
    "#ef3e51"
  );

  gradient.addColorStop(
    1,
    "#b81931"
  );


  ctx.fillStyle =
    gradient;


  ctx.beginPath();

  ctx.moveTo(0, 31);

  ctx.bezierCurveTo(
    -31,
    8,
    -29,
    -23,
    0,
    -24
  );

  ctx.bezierCurveTo(
    29,
    -23,
    31,
    8,
    0,
    31
  );

  ctx.fill();


  ctx.shadowBlur = 0;

  ctx.fillStyle =
    "#4c8a49";


  for (
    let i = 0;
    i < 5;
    i++
  ) {

    ctx.save();

    ctx.rotate(
      i *
      Math.PI *
      2 /
      5
    );

    ctx.beginPath();

    ctx.ellipse(
      0,
      -25,
      5,
      14,
      0,
      0,
      Math.PI * 2
    );

    ctx.fill();

    ctx.restore();

  }


  ctx.fillStyle =
    "#ffe2a2";


  const seeds = [
    [-12,-7],
    [0,-11],
    [12,-5],
    [-15,7],
    [0,4],
    [15,8],
    [-8,17],
    [8,18]
  ];


  seeds.forEach(
    ([sx, sy]) => {

      ctx.beginPath();

      ctx.ellipse(
        sx,
        sy,
        2,
        3,
        0,
        0,
        Math.PI * 2
      );

      ctx.fill();

    }
  );


  ctx.restore();

}


/* CHERRY */

function drawCherry(
  x,
  y
) {

  ctx.save();

  ctx.shadowColor =
    "rgba(70,20,20,.2)";

  ctx.shadowBlur = 7;


  const gradient =
    ctx.createRadialGradient(
      x - 7,
      y - 8,
      3,
      x,
      y,
      24
    );

  gradient.addColorStop(
    0,
    "#ff6977"
  );

  gradient.addColorStop(
    .5,
    "#c9263d"
  );

  gradient.addColorStop(
    1,
    "#8c1328"
  );


  ctx.fillStyle =
    gradient;


  ctx.beginPath();

  ctx.arc(
    x,
    y,
    22,
    0,
    Math.PI * 2
  );

  ctx.fill();


  ctx.shadowBlur = 0;

  ctx.strokeStyle =
    "#497b42";

  ctx.lineWidth = 5;


  ctx.beginPath();

  ctx.moveTo(
    x,
    y - 19
  );

  ctx.quadraticCurveTo(
    x + 8,
    y - 55,
    x + 30,
    y - 60
  );

  ctx.stroke();

  ctx.restore();

}


/* BLUEBERRY */

function drawBlueberry(
  x,
  y
) {

  ctx.save();

  ctx.shadowColor =
    "rgba(20,20,60,.2)";

  ctx.shadowBlur = 6;


  const gradient =
    ctx.createRadialGradient(
      x - 5,
      y - 7,
      2,
      x,
      y,
      19
    );

  gradient.addColorStop(
    0,
    "#8798d1"
  );

  gradient.addColorStop(
    .4,
    "#4d629e"
  );

  gradient.addColorStop(
    1,
    "#26376e"
  );


  ctx.fillStyle =
    gradient;


  ctx.beginPath();

  ctx.arc(
    x,
    y,
    18,
    0,
    Math.PI * 2
  );

  ctx.fill();


  ctx.shadowBlur = 0;

  ctx.fillStyle =
    "#1f2e60";

  ctx.font =
    "14px Georgia";

  ctx.textAlign =
    "center";

  ctx.textBaseline =
    "middle";

  ctx.fillText(
    "✦",
    x,
    y - 3
  );

  ctx.restore();

}


/* FLOWER */

function drawFlower(
  x,
  y
) {

  ctx.save();

  ctx.translate(x, y);

  ctx.shadowColor =
    "rgba(80,40,20,.15)";

  ctx.shadowBlur = 5;


  for (
    let i = 0;
    i < 6;
    i++
  ) {

    ctx.save();

    ctx.rotate(
      i *
      Math.PI /
      3
    );

    ctx.fillStyle =
      "#fffaf4";

    ctx.beginPath();

    ctx.ellipse(
      0,
      -15,
      8,
      15,
      0,
      0,
      Math.PI * 2
    );

    ctx.fill();

    ctx.restore();

  }


  ctx.shadowBlur = 0;

  ctx.fillStyle =
    "#f2bd43";

  ctx.beginPath();

  ctx.arc(
    0,
    0,
    8,
    0,
    Math.PI * 2
  );

  ctx.fill();

  ctx.restore();

}


/* HEART */

function drawHeart(
  x,
  y
) {

  ctx.save();

  ctx.translate(x, y);

  ctx.shadowColor =
    "rgba(90,30,40,.18)";

  ctx.shadowBlur = 6;

  ctx.fillStyle =
    frostingColor;


  ctx.beginPath();

  ctx.moveTo(
    0,
    26
  );

  ctx.bezierCurveTo(
    -40,
    1,
    -28,
    -29,
    0,
    -11
  );

  ctx.bezierCurveTo(
    28,
    -29,
    40,
    1,
    0,
    26
  );

  ctx.fill();

  ctx.restore();

}


/* PEARL */

function drawPearl(
  x,
  y
) {

  const gradient =
    ctx.createRadialGradient(
      x - 5,
      y - 6,
      2,
      x,
      y,
      15
    );

  gradient.addColorStop(
    0,
    "#ffffff"
  );

  gradient.addColorStop(
    .45,
    "#fff9f3"
  );

  gradient.addColorStop(
    1,
    "#c9bdb7"
  );


  ctx.save();

  ctx.shadowColor =
    "rgba(50,30,20,.2)";

  ctx.shadowBlur = 5;

  ctx.fillStyle =
    gradient;


  ctx.beginPath();

  ctx.arc(
    x,
    y,
    14,
    0,
    Math.PI * 2
  );

  ctx.fill();

  ctx.restore();

}


/* SPRINKLES */

function drawSprinkles(
  x,
  y
) {

  const colors = [
    "#ff6381",
    "#ffc857",
    "#65c88a",
    "#62a6f5",
    "#b889e8",
    "#ff9c62"
  ];


  for (
    let i = 0;
    i < 22;
    i++
  ) {

    const sx =
      x +
      (Math.random() - .5)
      * 90;

    const sy =
      y +
      (Math.random() - .5)
      * 70;


    if (!isOnCake(sx, sy)) {
      continue;
    }


    ctx.save();

    ctx.translate(
      sx,
      sy
    );

    ctx.rotate(
      Math.random()
      * Math.PI
    );


    ctx.fillStyle =
      colors[
        Math.floor(
          Math.random()
          * colors.length
        )
      ];


    ctx.beginPath();

    ctx.roundRect(
      -3,
      -9,
      6,
      18,
      3
    );

    ctx.fill();

    ctx.restore();

  }

}


/* =====================================
   CANDLES
===================================== */

function createCandle(
  canvasX,
  canvasY
) {

  const xPercent =
    canvasX /
    canvas.width;

  const yPercent =
    canvasY /
    canvas.height;


  candleData.push({
    x: xPercent,
    y: yPercent
  });


  renderEditorCandles();

}


function renderEditorCandles() {

  const layer =
    document.getElementById(
      "candleLayer"
    );

  layer.innerHTML = "";


  candleData.forEach(
    candle => {

      const element =
        document.createElement(
          "div"
        );

      element.className =
        "candle";


      element.style.left =
        `${
          candle.x * 520 - 5
        }px`;


      element.style.top =
        `${
          candle.y * 360 - 58
        }px`;


      const flame =
        document.createElement(
          "div"
        );

      flame.className =
        "flame";


      element.appendChild(
        flame
      );


      layer.appendChild(
        element
      );

    }
  );

}


/* =====================================
   FLAVOR
===================================== */

const flavorSettings = {

  vanilla: {
    side1: "#efc39d",
    side2: "#ffe3c9",
    top1: "#fff5e9",
    top2: "#edc29c",
    sponge1: "#e8b67f",
    sponge2: "#f7d2a5",
    name: "Vanilla"
  },

  chocolate: {
    side1: "#694033",
    side2: "#9c6b56",
    top1: "#a97863",
    top2: "#674033",
    sponge1: "#724434",
    sponge2: "#9b6550",
    name: "Chocolate"
  },

  strawberry: {
    side1: "#df8f9b",
    side2: "#f6bbc3",
    top1: "#ffd4da",
    top2: "#e99ba6",
    sponge1: "#e59aa4",
    sponge2: "#f4bdc4",
    name: "Strawberry"
  },

  matcha: {
    side1: "#89a873",
    side2: "#bad1a7",
    top1: "#d5e5c8",
    top2: "#91ae7a",
    sponge1: "#8fab78",
    sponge2: "#bed2ac",
    name: "Matcha"
  },

  redvelvet: {
    side1: "#7f2631",
    side2: "#bb4854",
    top1: "#d45c67",
    top2: "#862b36",
    sponge1: "#8d2633",
    sponge2: "#bd4854",
    name: "Red Velvet"
  }

};


document
  .querySelectorAll(".flavor")
  .forEach(button => {

    button.addEventListener(
      "click",
      () => {

        document
          .querySelectorAll(".flavor")
          .forEach(item =>
            item.classList.remove("active")
          );

        button.classList.add("active");

        cakeFlavor =
          button.dataset.flavor;

        updateCakeFlavor();

      }
    );

  });


function updateCakeFlavor() {

  const settings =
    flavorSettings[cakeFlavor];


  document
    .querySelector(".cake-side")
    .style.background =
      `linear-gradient(
        90deg,
        ${settings.side1},
        ${settings.side2} 28%,
        ${settings.side2} 50%,
        ${settings.side2} 72%,
        ${settings.side1}
      )`;


  document
    .querySelector(".cake-top")
    .style.background =
      `radial-gradient(
        ellipse at 50% 35%,
        ${settings.top1},
        ${settings.side2} 58%,
        ${settings.top2}
      )`;


  document
    .querySelectorAll(
      ".slice-sponge"
    )
    .forEach(layer => {

      layer.style.background =
        `repeating-linear-gradient(
          0deg,
          rgba(80,40,20,.05) 0px,
          rgba(80,40,20,.05) 2px,
          transparent 2px,
          transparent 7px
        ),
        linear-gradient(
          90deg,
          ${settings.sponge1},
          ${settings.sponge2},
          ${settings.sponge1}
        )`;

    });


  [
    "layerFlavor1",
    "layerFlavor2",
    "layerFlavor3"
  ]
  .forEach(id => {

    document
      .getElementById(id)
      .textContent =
        `${settings.name} sponge`;

  });

}


/* =====================================
   FILLING
===================================== */

document
  .querySelectorAll(".filling")
  .forEach(button => {

    button.addEventListener(
      "click",
      () => {

        document
          .querySelectorAll(".filling")
          .forEach(item =>
            item.classList.remove("active")
          );

        button.classList.add("active");


        fillingColor =
          button.dataset.color;

        fillingName =
          button.textContent.trim();


        document
          .querySelectorAll(
            ".slice-filling"
          )
          .forEach(layer => {

            layer.style.background =
              fillingColor;

          });


        document
          .getElementById(
            "layerFilling1"
          )
          .textContent =
            fillingName;


        document
          .getElementById(
            "layerFilling2"
          )
          .textContent =
            fillingName;

      }
    );

  });


/* =====================================
   WHOLE / INSIDE VIEW
===================================== */

const wholeCakeButton =
  document.getElementById(
    "wholeCakeButton"
  );

const insideButton =
  document.getElementById(
    "insideButton"
  );

const wholeCakeView =
  document.getElementById(
    "wholeCakeView"
  );

const insideView =
  document.getElementById(
    "insideView"
  );


wholeCakeButton.addEventListener(
  "click",
  () => {

    wholeCakeButton
      .classList
      .add("active");

    insideButton
      .classList
      .remove("active");

    wholeCakeView
      .classList
      .remove("hidden-view");

    insideView
      .classList
      .add("hidden-view");

  }
);


insideButton.addEventListener(
  "click",
  () => {

    insideButton
      .classList
      .add("active");

    wholeCakeButton
      .classList
      .remove("active");

    insideView
      .classList
      .remove("hidden-view");

    wholeCakeView
      .classList
      .add("hidden-view");

  }
);


/* =====================================
   UNDO
===================================== */

document
  .getElementById("undo")
  .addEventListener(
    "click",
    () => {

      if (!history.length) {
        return;
      }


      const previous =
        history.pop();


      ctx.putImageData(
        previous,
        0,
        0
      );

    }
  );


/* =====================================
   CLEAR
===================================== */

document
  .getElementById("clear")
  .addEventListener(
    "click",
    () => {

      saveState();


      ctx.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
      );


      candleData = [];

      renderEditorCandles();

    }
  );


/* =====================================
   CREATE SNAPSHOT OF ACTUAL CAKE

   This redraws the cake and decoration
   canvas into a single image.

   Therefore Celebrate uses YOUR cake.
===================================== */

function createCakeSnapshot() {

  const snapshot =
    document.createElement(
      "canvas"
    );


  snapshot.width = 900;
  snapshot.height = 650;


  const sctx =
    snapshot.getContext("2d");


  /*
    Transparent background
  */

  sctx.clearRect(
    0,
    0,
    snapshot.width,
    snapshot.height
  );


  /*
    Stand
  */

  sctx.save();

  sctx.fillStyle =
    "rgba(50,20,10,.15)";

  sctx.filter =
    "blur(12px)";

  sctx.beginPath();

  sctx.ellipse(
    450,
    570,
    300,
    35,
    0,
    0,
    Math.PI * 2
  );

  sctx.fill();

  sctx.restore();


  const standGradient =
    sctx.createLinearGradient(
      0,
      480,
      0,
      600
    );

  standGradient.addColorStop(
    0,
    "#ffffff"
  );

  standGradient.addColorStop(
    1,
    "#ded8d4"
  );


  sctx.fillStyle =
    standGradient;

  sctx.beginPath();

  sctx.ellipse(
    450,
    505,
    350,
    62,
    0,
    0,
    Math.PI * 2
  );

  sctx.fill();


  sctx.fillRect(
    380,
    500,
    140,
    90
  );


  /*
    Cake side
  */

  const settings =
    flavorSettings[
      cakeFlavor
    ];


  const sideGradient =
    sctx.createLinearGradient(
      180,
      0,
      720,
      0
    );

  sideGradient.addColorStop(
    0,
    settings.side1
  );

  sideGradient.addColorStop(
    .3,
    settings.side2
  );

  sideGradient.addColorStop(
    .7,
    settings.side2
  );

  sideGradient.addColorStop(
    1,
    settings.side1
  );


  sctx.fillStyle =
    sideGradient;


  sctx.beginPath();

  sctx.moveTo(
    190,
    250
  );

  sctx.lineTo(
    710,
    250
  );

  sctx.lineTo(
    710,
    470
  );

  sctx.bezierCurveTo(
    710,
    520,
    190,
    520,
    190,
    470
  );

  sctx.closePath();

  sctx.fill();


  /*
    Cake top
  */

  const topGradient =
    sctx.createRadialGradient(
      450,
      210,
      30,
      450,
      250,
      300
    );

  topGradient.addColorStop(
    0,
    settings.top1
  );

  topGradient.addColorStop(
    .7,
    settings.side2
  );

  topGradient.addColorStop(
    1,
    settings.top2
  );


  sctx.fillStyle =
    topGradient;

  sctx.beginPath();

  sctx.ellipse(
    450,
    250,
    260,
    95,
    0,
    0,
    Math.PI * 2
  );

  sctx.fill();


  /*
    Actual user's decorations.

    Editor canvas is 1000x700.
    Cake snapshot area is 520x360.

    We map it onto cake.
  */

  sctx.drawImage(
    canvas,
    0,
    0,
    canvas.width,
    canvas.height,

    190,
    155,
    520,
    360
  );


  return snapshot.toDataURL(
    "image/png"
  );

}


/* =====================================
   CELEBRATION
===================================== */

const celebration =
  document.getElementById(
    "celebration"
  );


document
  .getElementById(
    "celebrateBtn"
  )
  .addEventListener(
    "click",
    () => {

      /*
        Make sure user sees whole cake
        before snapshot.
      */

      wholeCakeButton.click();


      const image =
        createCakeSnapshot();


      document
        .getElementById(
          "cakeSnapshot"
        )
        .src = image;


      celebration
        .classList
        .remove(
          "hidden-celebration"
        );


      buildCelebrationCandles();

    }
  );


document
  .getElementById(
    "closeCelebrate"
  )
  .addEventListener(
    "click",
    () => {

      celebration
        .classList
        .add(
          "hidden-celebration"
        );

    }
  );


/* =====================================
   CELEBRATION CANDLES

   Uses candles the user placed.

   If user placed none, it gives
   them five birthday candles.
===================================== */

function buildCelebrationCandles() {

  const container =
    document.getElementById(
      "celebrationCandles"
    );


  container.innerHTML = "";


  let positions = [];


  if (candleData.length) {

    positions =
      candleData.map(
        candle => ({
          x:
            Math.max(
              .1,
              Math.min(
                .9,
                candle.x
              )
            ),

          y:
            Math.max(
              .15,
              Math.min(
                .75,
                candle.y
              )
            )
        })
      );

  }

  else {

    positions = [
      {x:.22,y:.55},
      {x:.37,y:.35},
      {x:.50,y:.55},
      {x:.63,y:.35},
      {x:.78,y:.55}
    ];

  }


  positions.forEach(
    position => {

      const candle =
        document.createElement(
          "div"
        );


      candle.className =
        "candle";


      candle.style.left =
        `${
          position.x * 360
        }px`;


      /*
        Celebration candles should
        visually sit on the cake top.
      */

      candle.style.top =
        `${
          70 +
          position.y * 45
        }px`;


      const flame =
        document.createElement(
          "div"
        );

      flame.className =
        "flame";


      candle.appendChild(
        flame
      );


      container.appendChild(
        candle
      );

    }
  );

}


/* =====================================
   MICROPHONE BLOWING
===================================== */

document
  .getElementById(
    "microphoneButton"
  )
  .addEventListener(
    "click",
    startMicrophone
  );


async function startMicrophone() {

  const button =
    document.getElementById(
      "microphoneButton"
    );


  try {

    const stream =
      await navigator
        .mediaDevices
        .getUserMedia({
          audio: true
        });


    const AudioContextClass =
      window.AudioContext ||
      window.webkitAudioContext;


    const audioContext =
      new AudioContextClass();


    await audioContext.resume();


    const source =
      audioContext
        .createMediaStreamSource(
          stream
        );


    const analyser =
      audioContext
        .createAnalyser();


    analyser.fftSize = 512;

    analyser.smoothingTimeConstant =
      .35;


    source.connect(
      analyser
    );


    const data =
      new Uint8Array(
        analyser.fftSize
      );


    button.textContent =
      "🎤 Listening...";


    let blowScore = 0;


    function listen() {

      analyser
        .getByteTimeDomainData(
          data
        );


      let sum = 0;


      for (
        let i = 0;
        i < data.length;
        i++
      ) {

        const sample =
          (
            data[i] - 128
          ) / 128;

        sum +=
          sample * sample;

      }


      const rms =
        Math.sqrt(
          sum /
          data.length
        );


      const level =
        Math.min(
          100,
          rms * 500
        );


      document
        .getElementById(
          "blowLevel"
        )
        .style.width =
          `${level}%`;


      /*
        Sustained air/noise required.
      */

      if (rms > .075) {

        blowScore += 2;

      } else {

        blowScore =
          Math.max(
            0,
            blowScore - 1
          );

      }


      if (blowScore > 24) {

        blowOutCandles();


        stream
          .getTracks()
          .forEach(
            track =>
              track.stop()
          );


        audioContext.close();

        return;

      }


      requestAnimationFrame(
        listen
      );

    }


    listen();

  }

  catch (error) {

    button.textContent =
      "Microphone unavailable";


    document
      .getElementById(
        "blowText"
      )
      .textContent =
        "Please allow microphone access, then try again.";

  }

}


/* =====================================
   BLOW OUT
===================================== */

function blowOutCandles() {

  const flames =
    document.querySelectorAll(
      "#celebrationCandles .flame"
    );


  flames.forEach(
    (flame, index) => {

      setTimeout(
        () => {

          flame
            .classList
            .add("out");

        },

        index * 120
      );

    }
  );


  document
    .getElementById(
      "blowText"
    )
    .textContent =
      "♡ Your wish has been made ♡";


  document
    .getElementById(
      "microphoneButton"
    )
    .textContent =
      "Candles blown out ✨";


  document
    .getElementById(
      "blowLevel"
    )
    .style.width =
      "100%";

}


/* =====================================
   INITIALIZE
===================================== */

updateCakeFlavor();