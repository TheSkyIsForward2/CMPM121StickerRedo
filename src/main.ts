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
const clearButton = document.getElementById("clearButton")!;
const undoButton = document.getElementById("undoButton")!;
const redoButton = document.getElementById("redoButton")!;

let currentThickness = 2;

class MarkerLine {
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

class ToolPreview {
  x: number;
  y: number;
  thickness: number;

  constructor(x: number, y: number, thickness: number) {
    this.x = x;
    this.y = y;
    this.thickness = thickness;
  }

  updatePosition(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  updateThickness(thickness: number) {
    this.thickness = thickness;
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.beginPath();
    ctx.lineWidth = 1;
    ctx.strokeStyle = "rgb(0,0,0)";
    ctx.arc(this.x, this.y, this.thickness / 2, 0, Math.PI * 2);
    ctx.stroke();
  }
}

const lines: MarkerLine[] = [];
const redoLines: MarkerLine[] = [];

let currentLine: MarkerLine | null = null;
let toolPreview: ToolPreview | null = null;
let mouseDown = false;

canvas.addEventListener("mousedown", (e) => {
  mouseDown = true;
  const start = { x: e.offsetX, y: e.offsetY };
  currentLine = new MarkerLine(start.x, start.y, currentThickness);
  lines.push(currentLine);
  redoLines.splice(0, redoLines.length);
  redraw();
});

canvas.addEventListener("mousemove", (e) => {
  const { offsetX, offsetY } = e;

  // Update tool preview position & size
  if (!toolPreview) {
    toolPreview = new ToolPreview(offsetX, offsetY, currentThickness);
  } else {
    toolPreview.updatePosition(offsetX, offsetY);
    toolPreview.updateThickness(currentThickness);
  }

  if (mouseDown && currentLine) {
    currentLine.drag(offsetX, offsetY);
  }

  redraw();
});

canvas.addEventListener("mouseup", () => {
  mouseDown = false;
  currentLine = null;
  redraw();
});

canvas.addEventListener("mouseleave", () => {
  toolPreview = null;
  redraw();
});

canvas.addEventListener("mouseenter", (e) => {
  toolPreview = new ToolPreview(e.offsetX, e.offsetY, currentThickness);
  redraw();
});

// Rendering
function redraw() {
  ctx!.clearRect(0, 0, canvas.width, canvas.height);

  for (const line of lines) {
    line.display(ctx!);
  }

  // Only draw the preview if mouse is not pressed
  if (!mouseDown && toolPreview) {
    toolPreview.draw(ctx!);
  }
}

clearButton.addEventListener("click", () => {
  lines.splice(0, lines.length);
  redraw();
});

undoButton.addEventListener("click", () => {
  if (lines.length > 0) {
    redoLines.push(lines.pop()!);
    redraw();
  }
});

redoButton.addEventListener("click", () => {
  if (redoLines.length > 0) {
    lines.push(redoLines.pop()!);
    redraw();
  }
});

function selectTool(thickness: number, button: HTMLElement) {
  currentThickness = thickness;
  thinButton.classList.remove("selectedTool");
  thickButton.classList.remove("selectedTool");
  button.classList.add("selectedTool");
  if (toolPreview) toolPreview.updateThickness(thickness);
  redraw();
}

thinButton.addEventListener("click", () => selectTool(2, thinButton));
thickButton.addEventListener("click", () => selectTool(8, thickButton));
