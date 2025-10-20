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

const lines: MarkerLine[] = [];
const redoLines: MarkerLine[] = [];

let currentLine: MarkerLine | null = null;

const cursor = { active: false, x: 0, y: 0 };

canvas.addEventListener("mousedown", (e) => {
  cursor.active = true;
  cursor.x = e.offsetX;
  cursor.y = e.offsetY;

  currentLine = new MarkerLine(cursor.x, cursor.y, currentThickness);
  lines.push(currentLine);
  redoLines.splice(0, redoLines.length);

  redraw();
});

canvas.addEventListener("mousemove", (e) => {
  if (!cursor.active || !currentLine) return;

  cursor.x = e.offsetX;
  cursor.y = e.offsetY;
  currentLine.drag(cursor.x, cursor.y);

  redraw();
});

canvas.addEventListener("mouseup", () => {
  cursor.active = false;
  currentLine = null;

  redraw();
});

// Rendering
function redraw() {
  if (ctx != null) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const line of lines) {
      line.display(ctx);
    }
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
}

thinButton.addEventListener("click", () => selectTool(2, thinButton));
thickButton.addEventListener("click", () => selectTool(8, thickButton));
