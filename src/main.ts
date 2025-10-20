import "./style.css";

document.title = "Sticker Sketchpad";

document.body.innerHTML = `

  <h1>Sticker Sketchpad</h1>
   <div style="display:flex; flex-direction:column; align-items:center; gap:8px;">
    <canvas id="canvas" class="canvas" width="256" height="256"></canvas> 
    <div>
      <button id="thinButton" class="toolbutton selectedTool">Thin</button>
      <button id="thickButton" class="toolbutton">Thick</button>
    </div>
    <div>
      <button id="smileButton" class="toolbutton">😄</button>
      <button id="buildingButton" class="toolbutton">🏢</button>
      <button id="planeButton" class="toolbutton">✈️</button>
    </div>
    <div>
      <button id="clearButton" class="clearbutton">Clear</button>
      <button id="undoButton" class="clearbutton">Undo</button>
      <button id="redoButton" class="clearbutton">Redo</button>
    </div>
  </div>
`;

const canvas = document.getElementById("canvas") as HTMLCanvasElement;
const ctx = canvas.getContext("2d");
if (!ctx) throw new Error("Failed to get canvas context");

const thinButton = document.getElementById("thinButton")!;
const thickButton = document.getElementById("thickButton")!;
const smileButton = document.getElementById("smileButton")!;
const buildingButton = document.getElementById("buildingButton")!;
const planeButton = document.getElementById("planeButton")!;
const clearButton = document.getElementById("clearButton")!;
const undoButton = document.getElementById("undoButton")!;
const redoButton = document.getElementById("redoButton")!;

type ToolType = "thin" | "thick" | "sticker";
type StickerType = "😄" | "🏢" | "✈️";

let currentTool: ToolType = "thin";
let currentThickness = 2;
let currentSticker: StickerType | null = null;

interface Command {
  display(ctx: CanvasRenderingContext2D): void;
  drag?(x: number, y: number): void;
}

// class for markers
class MarkerLine implements Command {
  points: { x: number; y: number }[] = [];
  thickness: number;

  constructor(startX: number, startY: number, thickness: number) {
    this.points.push({ x: startX, y: startY });
    this.thickness = thickness;
  }

  drag(x: number, y: number) {
    this.points.push({ x, y });
  }

  display(ctx: CanvasRenderingContext2D) {
    if (this.points.length < 2) return;
    ctx.beginPath();
    ctx.lineWidth = this.thickness;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.moveTo(this.points[0].x, this.points[0].y);
    for (const p of this.points) {
      ctx.lineTo(p.x, p.y);
    }
    ctx.stroke();
  }
}

class Sticker implements Command {
  x: number;
  y: number;
  emoji: StickerType;

  constructor(x: number, y: number, emoji: StickerType) {
    this.x = x;
    this.y = y;
    this.emoji = emoji;
  }

  drag(x: number, y: number) {
    // Just move the sticker instead of recording path
    this.x = x;
    this.y = y;
  }

  display(ctx: CanvasRenderingContext2D) {
    ctx.font = "24px serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(this.emoji, this.x, this.y);
  }
}

// class for mouse hover
class ToolPreview implements Command {
  x: number;
  y: number;
  tool: ToolType;
  thickness: number;
  emoji?: StickerType | null;

  constructor(
    x: number,
    y: number,
    tool: ToolType,
    thickness: number,
    emoji?: StickerType | null,
  ) {
    this.x = x;
    this.y = y;
    this.tool = tool;
    this.thickness = thickness;
    this.emoji = emoji ?? null;
  }

  update(
    x: number,
    y: number,
    tool: ToolType,
    thickness: number,
    emoji?: StickerType | null,
  ) {
    this.x = x;
    this.y = y;
    this.tool = tool;
    this.thickness = thickness;
    this.emoji = emoji ?? null;
  }

  display(ctx: CanvasRenderingContext2D) {
    ctx.save();
    if (this.tool === "sticker" && this.emoji) {
      ctx.font = "24px serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.globalAlpha = 0.5;
      ctx.fillText(this.emoji, this.x, this.y);
    } else {
      ctx.beginPath();
      ctx.lineWidth = 1;
      ctx.strokeStyle = "rgba(0,0,0,0.5)";
      ctx.arc(this.x, this.y, this.thickness / 2, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }
}

// refactored commands
const lines: Command[] = [];
const redoLines: Command[] = [];
let currentCommand: Command | null = null;
let toolPreview: ToolPreview | null = null;
let mouseDown = false;

// when mouse pressed down, start draw, handle tool/stickers
canvas.addEventListener("mousedown", (e) => {
  mouseDown = true;
  const point = { x: e.offsetX, y: e.offsetY };

  if (currentTool === "thin" || currentTool === "thick") {
    currentCommand = new MarkerLine(point.x, point.y, currentThickness);
  } else if (currentTool === "sticker" && currentSticker) {
    currentCommand = new Sticker(point.x, point.y, currentSticker);
  }

  if (currentCommand) {
    lines.push(currentCommand);
    redoLines.length = 0;
  }
  redraw();
});

// handle mouse movement while down, draw lines, create stickers
canvas.addEventListener("mousemove", (e) => {
  const { offsetX, offsetY } = e;
  const point = { x: offsetX, y: offsetY };

  // Fire tool-moved event (preview)
  if (!toolPreview) {
    toolPreview = new ToolPreview(
      offsetX,
      offsetY,
      currentTool,
      currentThickness,
      currentSticker,
    );
  } else {
    toolPreview.update(
      offsetX,
      offsetY,
      currentTool,
      currentThickness,
      currentSticker,
    );
  }

  if (mouseDown && currentCommand && currentCommand.drag) {
    currentCommand.drag(point.x, point.y);
  }

  redraw();
});

canvas.addEventListener("mouseup", () => {
  mouseDown = false;
  currentCommand = null;
  redraw();
});

canvas.addEventListener("mouseleave", () => {
  toolPreview = null;
  redraw();
});

canvas.addEventListener("mouseenter", (e) => {
  toolPreview = new ToolPreview(
    e.offsetX,
    e.offsetY,
    currentTool,
    currentThickness,
    currentSticker,
  );
  redraw();
});

// Rendering
function redraw() {
  ctx!.clearRect(0, 0, canvas.width, canvas.height);
  for (const cmd of lines) cmd.display(ctx!);
  if (!mouseDown && toolPreview) toolPreview.display(ctx!);
}

// tool selection functions for marker and sticker
function selectMarkerTool(thickness: number, button: HTMLElement) {
  currentTool = thickness === 2 ? "thin" : "thick";
  currentThickness = thickness;
  currentSticker = null;
  updateButtonStates(button);
  redraw();
}

function selectStickerTool(sticker: StickerType, button: HTMLElement) {
  currentTool = "sticker";
  currentSticker = sticker;
  updateButtonStates(button);
  redraw();
}

function updateButtonStates(activeButton: HTMLElement) {
  const buttons = document.querySelectorAll(".toolbutton");
  buttons.forEach((b) => b.classList.remove("selectedTool"));
  activeButton.classList.add("selectedTool");
}

thinButton.addEventListener("click", () => selectMarkerTool(2, thinButton));
thickButton.addEventListener("click", () => selectMarkerTool(8, thickButton));

smileButton.addEventListener(
  "click",
  () => selectStickerTool("😄", smileButton),
);
buildingButton.addEventListener(
  "click",
  () => selectStickerTool("🏢", buildingButton),
);
planeButton.addEventListener(
  "click",
  () => selectStickerTool("✈️", planeButton),
);

clearButton.addEventListener("click", () => {
  lines.length = 0;
  redoLines.length = 0;
  redraw();
});

undoButton.addEventListener("click", () => {
  if (lines.length > 0) redoLines.push(lines.pop()!);
  redraw();
});

redoButton.addEventListener("click", () => {
  if (redoLines.length > 0) lines.push(redoLines.pop()!);
  redraw();
});
