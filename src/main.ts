import "./style.css";

document.title = "Sticker Sketchpad";

document.body.innerHTML = `

  <h1>Sticker Sketchpad</h1>
    <div style="display:flex; flex-direction:column; align-items:center; gap:8px;">
    <div class="toolbar" style="text-align:center; margin-bottom:10px;"></div>
    <canvas id="canvas" class="canvas" width="256" height="256"></canvas> 
    <div>
      <button id="clearButton" class="clearbutton">Clear</button>
      <button id="undoButton" class="clearbutton">Undo</button>
      <button id="redoButton" class="clearbutton">Redo</button>
    </div>
    <button id="exportButton" class="clearbutton">Export PNG</button>
  </div>
`;

const toolbar = document.querySelector(".toolbar")! as HTMLDivElement;
const canvas = document.getElementById("canvas") as HTMLCanvasElement;
const ctx = canvas.getContext("2d")!;
if (!ctx) throw new Error("Failed to get canvas context");

//----------------------------------------------
// Data-driven tool definitions
//----------------------------------------------
type ToolType = "thin" | "thick" | "sticker";
type StickerData = { label: string; emoji: string };

const stickers: StickerData[] = [
  { label: "Smile", emoji: "😊" },
  { label: "Building", emoji: "🏢" },
  { label: "Plane", emoji: "✈️" },
];

let currentTool: ToolType = "thin";
let currentSticker: string | null = null;

//----------------------------------------------
// Helper: create a tool button
//----------------------------------------------
function createButton(
  label: string,
  onClick: () => void,
  cssClass = "toolButton",
) {
  const btn = document.createElement("button");
  btn.textContent = label;
  btn.className = cssClass;
  btn.addEventListener("click", onClick);
  toolbar.appendChild(btn);
  return btn;
}

//----------------------------------------------
// Create tool buttons
//----------------------------------------------
const thinButton = createButton("Thin", () => selectTool("thin"));
const thickButton = createButton("Thick", () => selectTool("thick"));

// Sticker buttons (created dynamically)
function refreshStickerButtons() {
  // Remove existing sticker buttons
  const oldStickerButtons = toolbar.querySelectorAll(".stickerButton");
  oldStickerButtons.forEach((b) => b.remove());

  for (const sticker of stickers) {
    const _btn = createButton(
      sticker.emoji,
      () => selectSticker(sticker.emoji),
      "stickerButton",
    );
  }

  // Add "Custom Sticker" button
  createButton("Add Custom", addCustomSticker, "stickerButton");
}
refreshStickerButtons();

function addCustomSticker() {
  const newEmoji = prompt("Enter a new sticker (e.g. emoji character):", "🌟");
  if (newEmoji && newEmoji.trim() !== "") {
    stickers.push({ label: "Custom", emoji: newEmoji.trim() });
    refreshStickerButtons();
  }
}

//----------------------------------------------
// Tool selection logic
//----------------------------------------------
function selectTool(tool: ToolType) {
  currentTool = tool;
  currentSticker = null;
  updateSelectedButton();
}

function selectSticker(emoji: string) {
  currentTool = "sticker";
  currentSticker = emoji;

  updateSelectedButton();
}

function updateSelectedButton() {
  const allButtons = toolbar.querySelectorAll("button");
  allButtons.forEach((b) => b.classList.remove("selectedTool"));

  if (currentTool === "thin") thinButton.classList.add("selectedTool");
  else if (currentTool === "thick") thickButton.classList.add("selectedTool");
  else {
    const stickerButtons = toolbar.querySelectorAll(".stickerButton");
    stickerButtons.forEach((b) => {
      if (b.textContent === currentSticker) b.classList.add("selectedTool");
    });
  }
}

interface Command {
  display(ctx: CanvasRenderingContext2D): void;
  drag?(x: number, y: number): void;
}

// class for markers
class MarkerLine implements Command {
  points: { x: number; y: number }[] = [];
  thickness: number;
  markerColor: string;
  rotation: number;

  constructor(thickness: number, _rotation: number, _color: string) {
    this.thickness = thickness;
    this.rotation = _rotation;
    this.markerColor = randomColor();
  }

  drag(x: number, y: number) {
    this.points.push({ x, y });
  }

  getColor() {
    return this.markerColor;
  }

  getRotation() {
    return this.rotation;
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
  emoji: string;
  emojiRotation: number;
  throwAwayColor: string;

  constructor(x: number, y: number, emoji: string) {
    this.x = x;
    this.y = y;
    this.emoji = emoji;
    this.emojiRotation = randomRotation();
    this.throwAwayColor = "black";
  }

  getRotation() {
    return this.emojiRotation;
  }

  getColor() {
    return this.throwAwayColor;
  }

  drag(x: number, y: number) {
    // Just move the sticker instead of recording path
    this.x = x;
    this.y = y;
  }

  display(ctx: CanvasRenderingContext2D) {
    ctx.font = "24px serif";
    ctx.fillText(this.emoji, this.x - 12, this.y + 12);
    ctx.rotate(this.emojiRotation);
  }
}

class ToolPreview implements Command {
  x: number;
  y: number;
  emojiRotation: number;
  markerColor: string;

  constructor(x: number, y: number, eR: number, color: string) {
    this.x = x;
    this.y = y;
    this.emojiRotation = eR;
    this.markerColor = color;
  }

  display(ctx: CanvasRenderingContext2D) {
    if (currentTool === "sticker" && currentSticker) {
      ctx.font = "24px serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(currentSticker, this.x, this.y);
    } else {
      ctx.beginPath();
      const radius = currentTool === "thin" ? 2 : 4;
      ctx.arc(this.x, this.y, radius * 2, 0, Math.PI * 2);
      ctx.strokeStyle = this.markerColor;
      ctx.stroke();
    }
  }
}

// Outside-of-class functions
function randomColor() {
  const colors = ["red", "blue", "green", "orange", "purple", "pink"];
  return colors[Math.floor(Math.random() * colors.length)];
}

function randomRotation() {
  return (Math.random() * 360 - 180) * (Math.PI / 180); // between -179 degrees and 180 degrees
}

//----------------------------------------------
// Undo/redo logic and interaction
//----------------------------------------------
const lines: (MarkerLine | Sticker)[] = [];
const exportLines: (MarkerLine | Sticker)[] = [];
const redoStack: (MarkerLine | Sticker)[] = [];
let currentCommand: MarkerLine | Sticker | null = null;
let previousCommand: MarkerLine | Sticker | null = null;
let preview: ToolPreview | null = null;

canvas.addEventListener("mousedown", (e) => {
  const x = e.offsetX;
  const y = e.offsetY;

  // Hide preview while drawing
  preview = null;

  if (currentTool === "sticker" && currentSticker) {
    currentCommand = new Sticker(x, y, currentSticker);
  } else {
    const thickness = currentTool === "thin" ? 2 : 8;
    currentCommand = new MarkerLine(thickness, 0, "black");
    currentCommand.drag(x, y);
  }

  lines.push(currentCommand);
  exportLines.push(currentCommand);
  redoStack.length = 0;
  redraw();
});

canvas.addEventListener("mousemove", (e) => {
  const x = e.offsetX;
  const y = e.offsetY;

  if (currentCommand && currentTool !== "sticker") {
    currentCommand.drag(x, y);
  } else if (!currentCommand && previousCommand) {
    // Only show preview when not drawing
    preview = new ToolPreview(
      x,
      y,
      previousCommand.getRotation(),
      previousCommand.getColor(),
    );
  }
  redraw();
});

canvas.addEventListener("mouseup", () => {
  previousCommand = currentCommand;
  currentCommand = null;
  redraw();
});

// Hide preview when leaving canvas
canvas.addEventListener("mouseleave", () => {
  preview = null;
  redraw();
});

//----------------------------------------------
// Redraw function
//----------------------------------------------
function redraw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (const cmd of lines) cmd.display(ctx);
  if (preview) preview.display(ctx);
}

//----------------------------------------------
// Undo/redo/clear buttons
//----------------------------------------------
(document.getElementById("clearButton") as HTMLButtonElement).onclick = () => {
  lines.length = 0;
  exportLines.length = 0;
  redoStack.length = 0;
  redraw();
};

(document.getElementById("undoButton") as HTMLButtonElement).onclick = () => {
  if (lines.length > 0) redoStack.push(lines.pop()!);
  if (exportLines.length > 0) redoStack.push(exportLines.pop()!);
  redraw();
};

(document.getElementById("redoButton") as HTMLButtonElement).onclick = () => {
  if (redoStack.length > 0) lines.push(redoStack.pop()!);
  if (redoStack.length > 0) exportLines.push(redoStack.pop()!);
  redraw();
};

const exportButton = document.getElementById("exportButton")!;
document.body.appendChild(exportButton);

exportButton.innerHTML = "Export PNG";
exportButton.addEventListener("click", () => {
  document.body.className += " disabled";
  const tempCanvas: HTMLCanvasElement = document.createElement("canvas");
  tempCanvas.width = canvas.height * 4;
  tempCanvas.height = canvas.width * 4;
  canvas.replaceWith(tempCanvas);
  const tempCTX: CanvasRenderingContext2D | null = tempCanvas.getContext("2d");
  if (tempCTX) {
    tempCTX.scale(4, 4);
    tempCTX.fillStyle = "white";
    tempCTX.fillRect(0, 0, tempCanvas.height, tempCanvas.width);
    tempCTX.lineCap = "round";
    for (let i: number = 0; i < lines.length; ++i) {
      lines[i].display(
        tempCTX,
      );
    }
    const anchor = document.createElement("a");
    anchor.href = tempCanvas.toDataURL("image/png");
    anchor.download = "sketchpad.png";
    anchor.click();
  }
  tempCanvas.replaceWith(canvas);
  document.body.className = "";
});
