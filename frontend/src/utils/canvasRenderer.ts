import {
  CanvasElement,
  PenElement,
  LineElement,
  RectangleElement,
  CircleElement,
  TextElement,
  StickyElement,
  ArrowElement,
} from "@/types";

export class CanvasRenderer {
  private ctx: CanvasRenderingContext2D;

  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx;
  }

  clear(width: number, height: number): void {
    this.ctx.clearRect(0, 0, width, height);
  }

  drawBackground(color: string = "#ffffff"): void {
    const prevFill = this.ctx.fillStyle;
    this.ctx.fillStyle = color;
    this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    this.ctx.fillStyle = prevFill;
  }

  drawGrid(offsetX: number, offsetY: number, zoom: number): void {
    const gridSize = 20 * zoom;
    const startX = Math.floor(-offsetX / gridSize) * gridSize + offsetX;
    const startY = Math.floor(-offsetY / gridSize) * gridSize + offsetY;

    this.ctx.save();
    this.ctx.globalAlpha = 0.3;
    this.ctx.strokeStyle = "#e0e0e0";
    this.ctx.lineWidth = 1;

    for (let x = startX; x < this.ctx.canvas.width; x += gridSize) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, this.ctx.canvas.height);
      this.ctx.stroke();
    }

    for (let y = startY; y < this.ctx.canvas.height; y += gridSize) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(this.ctx.canvas.width, y);
      this.ctx.stroke();
    }

    this.ctx.restore();
  }

  drawElement(
    element: CanvasElement,
    offsetX: number,
    offsetY: number,
    zoom: number,
  ): void {
    if (!element.visible) return;

    const x = element.x * zoom + offsetX;
    const y = element.y * zoom + offsetY;
    const w = element.width * zoom;
    const h = element.height * zoom;

    this.ctx.save();
    this.ctx.globalAlpha = element.opacity;

    if (element.rotation !== 0) {
      const cx = x + w / 2;
      const cy = y + h / 2;
      this.ctx.translate(cx, cy);
      this.ctx.rotate((element.rotation * Math.PI) / 180);
      this.ctx.translate(-cx, -cy);
    }

    switch (element.type) {
      case "pen":
        this.drawPen(element as PenElement, x, y, zoom);
        break;
      case "line":
        this.drawLine(element as LineElement, x, y, zoom);
        break;
      case "rectangle":
        this.drawRectangle(element as RectangleElement, x, y, w, h);
        break;
      case "circle":
        this.drawCircle(element as CircleElement, x, y, w, h);
        break;
      case "text":
        this.drawText(element as TextElement, x, y, zoom);
        break;
      case "sticky":
        this.drawSticky(element as StickyElement, x, y, w, h);
        break;
      case "arrow":
        this.drawArrow(element as ArrowElement, x, y, zoom);
        break;
    }

    this.ctx.restore();
  }

  private drawPen(
    element: PenElement,
    x: number,
    y: number,
    zoom: number,
  ): void {
    if (element.points.length < 2) return;

    this.ctx.beginPath();
    this.ctx.strokeStyle = element.color;
    this.ctx.lineWidth = element.strokeWidth * zoom;
    this.ctx.lineCap = "round";
    this.ctx.lineJoin = "round";

    this.ctx.moveTo(
      x + element.points[0].x * zoom,
      y + element.points[0].y * zoom,
    );

    for (let i = 1; i < element.points.length; i++) {
      this.ctx.lineTo(
        x + element.points[i].x * zoom,
        y + element.points[i].y * zoom,
      );
    }

    this.ctx.stroke();
  }

  private drawLine(
    element: LineElement,
    x: number,
    y: number,
    zoom: number,
  ): void {
    this.ctx.beginPath();
    this.ctx.strokeStyle = element.color;
    this.ctx.lineWidth = element.strokeWidth * zoom;
    this.ctx.lineCap = "round";

    this.ctx.moveTo(x + element.x1 * zoom, y + element.y1 * zoom);
    this.ctx.lineTo(x + element.x2 * zoom, y + element.y2 * zoom);
    this.ctx.stroke();
  }

  private drawRectangle(
    element: RectangleElement,
    x: number,
    y: number,
    w: number,
    h: number,
  ): void {
    this.ctx.beginPath();
    this.ctx.lineWidth = element.strokeWidth;

    if (element.fill !== "transparent" && element.fill) {
      this.ctx.fillStyle = element.fill;
      if (element.borderRadius > 0) {
        this.roundRect(x, y, w, h, element.borderRadius);
        this.ctx.fill();
      } else {
        this.ctx.fillRect(x, y, w, h);
      }
    }

    if (
      element.stroke !== "transparent" &&
      element.stroke &&
      element.strokeWidth > 0
    ) {
      this.ctx.strokeStyle = element.stroke;
      if (element.borderRadius > 0) {
        this.roundRect(x, y, w, h, element.borderRadius);
        this.ctx.stroke();
      } else {
        this.ctx.strokeRect(x, y, w, h);
      }
    }
  }

  private drawCircle(
    element: CircleElement,
    x: number,
    y: number,
    w: number,
    h: number,
  ): void {
    const rx = w / 2;
    const ry = h / 2;
    const cx = x + rx;
    const cy = y + ry;

    this.ctx.beginPath();
    this.ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);

    if (element.fill !== "transparent" && element.fill) {
      this.ctx.fillStyle = element.fill;
      this.ctx.fill();
    }

    if (
      element.stroke !== "transparent" &&
      element.stroke &&
      element.strokeWidth > 0
    ) {
      this.ctx.strokeStyle = element.stroke;
      this.ctx.lineWidth = element.strokeWidth;
      this.ctx.stroke();
    }
  }

  private drawText(
    element: TextElement,
    x: number,
    y: number,
    zoom: number,
  ): void {
    if (!element.content) {
      this.ctx.fillStyle = "#999";
      this.ctx.font = `${element.fontSize * zoom}px ${element.fontFamily}`;
      this.ctx.fillText("Text", x, y + element.fontSize * zoom);
      return;
    }

    this.ctx.fillStyle = element.color;
    this.ctx.font = `${element.fontSize * zoom}px ${element.fontFamily}`;

    let textX = x;
    const textY = y + element.fontSize * zoom;

    if (element.textAlign === "center") {
      const metrics = this.ctx.measureText(element.content);
      textX = x + (element.width * zoom - metrics.width) / 2;
    } else if (element.textAlign === "right") {
      const metrics = this.ctx.measureText(element.content);
      textX = x + element.width * zoom - metrics.width;
    }

    this.ctx.fillText(element.content, textX, textY);
  }

  private drawSticky(
    element: StickyElement,
    x: number,
    y: number,
    w: number,
    h: number,
  ): void {
    this.ctx.fillStyle = element.backgroundColor;
    this.ctx.fillRect(x, y, w, h);

    this.ctx.strokeStyle = "rgba(0, 0, 0, 0.1)";
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(x, y, w, h);

    if (element.content) {
      this.ctx.fillStyle = "#333";
      this.ctx.font = `${element.fontSize}px Arial, sans-serif`;
      this.ctx.textBaseline = "top";

      const words = element.content.split(" ");
      let line = "";
      let lineY = y + 10;
      const maxWidth = w - 20;

      for (let i = 0; i < words.length; i++) {
        const testLine = line + words[i] + " ";
        const metrics = this.ctx.measureText(testLine);

        if (metrics.width > maxWidth && i > 0) {
          this.ctx.fillText(line, x + 10, lineY);
          line = words[i] + " ";
          lineY += element.fontSize * 1.5;
        } else {
          line = testLine;
        }
      }
      this.ctx.fillText(line, x + 10, lineY);
    }
  }

  private drawArrow(
    element: ArrowElement,
    x: number,
    y: number,
    zoom: number,
  ): void {
    const x1 = x + element.x1 * zoom;
    const y1 = y + element.y1 * zoom;
    const x2 = x + element.x2 * zoom;
    const y2 = y + element.y2 * zoom;

    this.ctx.beginPath();
    this.ctx.strokeStyle = element.color;
    this.ctx.lineWidth = element.strokeWidth * zoom;
    this.ctx.lineCap = "round";

    this.ctx.moveTo(x1, y1);
    this.ctx.lineTo(x2, y2);
    this.ctx.stroke();

    const arrowSize = 10 * zoom;
    const angle = Math.atan2(y2 - y1, x2 - x1);

    if (element.endArrow) {
      this.ctx.beginPath();
      this.ctx.fillStyle = element.color;
      this.ctx.moveTo(x2, y2);
      this.ctx.lineTo(
        x2 - arrowSize * Math.cos(angle - Math.PI / 6),
        y2 - arrowSize * Math.sin(angle - Math.PI / 6),
      );
      this.ctx.lineTo(
        x2 - arrowSize * Math.cos(angle + Math.PI / 6),
        y2 - arrowSize * Math.sin(angle + Math.PI / 6),
      );
      this.ctx.closePath();
      this.ctx.fill();
    }

    if (element.startArrow) {
      this.ctx.beginPath();
      this.ctx.fillStyle = element.color;
      this.ctx.moveTo(x1, y1);
      this.ctx.lineTo(
        x1 + arrowSize * Math.cos(angle - Math.PI / 6),
        y1 + arrowSize * Math.sin(angle - Math.PI / 6),
      );
      this.ctx.lineTo(
        x1 + arrowSize * Math.cos(angle + Math.PI / 6),
        y1 + arrowSize * Math.sin(angle + Math.PI / 6),
      );
      this.ctx.closePath();
      this.ctx.fill();
    }
  }

  private roundRect(
    x: number,
    y: number,
    w: number,
    h: number,
    r: number,
  ): void {
    const radius = Math.min(r, w / 2, h / 2);
    this.ctx.beginPath();
    this.ctx.moveTo(x + radius, y);
    this.ctx.lineTo(x + w - radius, y);
    this.ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
    this.ctx.lineTo(x + w, y + h - radius);
    this.ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
    this.ctx.lineTo(x + radius, y + h);
    this.ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
    this.ctx.lineTo(x, y + radius);
    this.ctx.quadraticCurveTo(x, y, x + radius, y);
    this.ctx.closePath();
  }

  drawSelectionBox(
    x: number,
    y: number,
    w: number,
    h: number,
    offsetX: number,
    offsetY: number,
    zoom: number,
  ): void {
    const sx = x * zoom + offsetX;
    const sy = y * zoom + offsetY;
    const sw = w * zoom;
    const sh = h * zoom;

    this.ctx.save();
    this.ctx.strokeStyle = "#2196F3";
    this.ctx.lineWidth = 2;
    this.ctx.setLineDash([5, 5]);
    this.ctx.strokeRect(sx, sy, sw, sh);
    this.ctx.restore();
  }

  drawElementHandles(
    element: CanvasElement,
    offsetX: number,
    offsetY: number,
    zoom: number,
  ): void {
    const x = element.x * zoom + offsetX;
    const y = element.y * zoom + offsetY;
    const w = element.width * zoom;
    const h = element.height * zoom;

    this.ctx.save();
    this.ctx.strokeStyle = "#2196F3";
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(x, y, w, h);

    this.ctx.fillStyle = "#ffffff";
    this.ctx.strokeStyle = "#2196F3";
    this.ctx.lineWidth = 1.5;

    const handleSize = 8;
    const handles = [
      { x: x - handleSize / 2, y: y - handleSize / 2 },
      { x: x + w / 2 - handleSize / 2, y: y - handleSize / 2 },
      { x: x + w - handleSize / 2, y: y - handleSize / 2 },
      { x: x + w - handleSize / 2, y: y + h / 2 - handleSize / 2 },
      { x: x + w - handleSize / 2, y: y + h - handleSize / 2 },
      { x: x + w / 2 - handleSize / 2, y: y + h - handleSize / 2 },
      { x: x - handleSize / 2, y: y + h - handleSize / 2 },
      { x: x - handleSize / 2, y: y + h / 2 - handleSize / 2 },
    ];

    handles.forEach((handle) => {
      this.ctx.fillRect(handle.x, handle.y, handleSize, handleSize);
      this.ctx.strokeRect(handle.x, handle.y, handleSize, handleSize);
    });

    const rotationHandleY = y - 25;
    this.ctx.beginPath();
    this.ctx.moveTo(x + w / 2, rotationHandleY - 8);
    this.ctx.lineTo(x + w / 2, y);
    this.ctx.stroke();

    this.ctx.beginPath();
    this.ctx.arc(x + w / 2, rotationHandleY - 8, 6, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.stroke();

    this.ctx.restore();
  }

  drawCursor(
    x: number,
    y: number,
    color: string,
    username: string,
    offsetX: number,
    offsetY: number,
    zoom: number,
  ): void {
    const sx = x * zoom + offsetX;
    const sy = y * zoom + offsetY;

    this.ctx.save();

    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.moveTo(sx, sy);
    this.ctx.lineTo(sx + 12, sy + 16);
    this.ctx.lineTo(sx + 4, sy + 12);
    this.ctx.closePath();
    this.ctx.fillStyle = color;
    this.ctx.fill();
    this.ctx.stroke();

    this.ctx.font = "12px Arial, sans-serif";
    const metrics = this.ctx.measureText(username);
    const labelWidth = metrics.width + 10;
    const labelHeight = 20;

    this.ctx.fillStyle = color;
    this.ctx.fillRect(sx + 16, sy, labelWidth, labelHeight);

    this.ctx.fillStyle = "#ffffff";
    this.ctx.textBaseline = "middle";
    this.ctx.fillText(username, sx + 16 + 5, sy + labelHeight / 2);

    this.ctx.restore();
  }
}
