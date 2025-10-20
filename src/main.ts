import "./style.css";

document.title = "Sticker Sketchpad";

document.body.innerHTML = `

  <h1>Sticker Sketchpad</h1>
  <canvas id="canvas" class="canvas" width = 256 height = 256></canvas> 
  <button id="clearbutton" class="clearbutton"> Clear </button>

`;

const canvas = document.getElementById("canvas") as HTMLCanvasElement;
const button = document.getElementById("clearbutton")!;
const ctx = canvas.getContext("2d");
if (!ctx) throw new Error("Failed to get canvas context");
const cursor = { active: false, x: 0, y: 0 };

button.addEventListener("click", () => {
  console.log("button pressed");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
});

canvas.addEventListener("mousedown", (e) => {
  cursor.active = true;
  cursor.x = e.offsetX;
  cursor.y = e.offsetY;
});

canvas.addEventListener("mousemove", (e) => {
  if (cursor.active) {
    ctx.beginPath();
    ctx.moveTo(cursor.x, cursor.y);
    ctx.lineTo(e.offsetX, e.offsetY);
    ctx.stroke();
    cursor.x = e.offsetX;
    cursor.y = e.offsetY;
  }
});

canvas.addEventListener("mouseup", () => {
  cursor.active = false;
});
