import "./style.css";

document.title = "Sticker Sketchpad";

document.body.innerHTML = `

  <h1>Sticker Sketchpad</h1>
  <canvas id="canvas" class="canvas" width = 256 height = 256></canvas> 
  <button id="clearbutton" class="clearbutton"> Clear </button>
  <button id="undoButton" class="clearbutton"> Undo </button>
  <button id="redoButton" class="clearbutton"> Redo </button>
`;

const canvas = document.getElementById("canvas") as HTMLCanvasElement;
const clearButton = document.getElementById("clearbutton")!;
//const undoButton = document.getElementById("undoButton")!;
//const redoButton = document.getElementById("redoButton")!;

const ctx = canvas.getContext("2d");
if (!ctx) throw new Error("Failed to get canvas context");

// ✅ Define types
type Point = { x: number; y: number };
type Line = Point[];

// ✅ Define arrays with proper types
const lines: Line[] = [];
const redoLines: Line[] = [];

let currentLine: Line | null = null;

const cursor = { active: false, x: 0, y: 0 };

canvas.addEventListener("mousedown", (e) => {
  cursor.active = true;
  cursor.x = e.offsetX;
  cursor.y = e.offsetY;

  currentLine = [];
  lines.push(currentLine);
  redoLines.splice(0, redoLines.length);
  currentLine.push({ x: cursor.x, y: cursor.y });

  redraw();
});

canvas.addEventListener("mousemove", (e) => {
  if (!cursor.active || !currentLine) return;

  cursor.x = e.offsetX;
  cursor.y = e.offsetY;
  currentLine.push({ x: cursor.x, y: cursor.y });

  redraw();
});

canvas.addEventListener("mouseup", () => {
  cursor.active = false;
  currentLine = null;

  redraw();
});

function redraw() {
  ctx!.clearRect(0, 0, canvas.width, canvas.height);
  for (const line of lines) {
    if (line.length > 1) {
      ctx!.beginPath();
      const { x, y } = line[0];
      ctx!.moveTo(x, y);
      for (const { x, y } of line) {
        ctx!.lineTo(x, y);
      }
      ctx!.stroke();
    }
  }
}

clearButton.addEventListener("click", () => {
  lines.splice(0, lines.length);
  redraw();
});
