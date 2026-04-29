import { CanvasElement } from "@/types";
import { getBoundingBox } from "./geometry";

export const exportToPNG = (
  elements: CanvasElement[],
  scale: number = 2,
  margin: number = 50,
): string => {
  if (elements.length === 0) {
    const canvas = document.createElement("canvas");
    canvas.width = 800;
    canvas.height = 600;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    return canvas.toDataURL("image/png");
  }

  const bbox = getBoundingBox(elements);
  const width = (bbox.width + margin * 2) * scale;
  const height = (bbox.height + margin * 2) * scale;

  const canvas = document.createElement("canvas");
  canvas.width = Math.max(width, 1);
  canvas.height = Math.max(height, 1);

  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  // 填充白色背景
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 应用缩放和偏移
  ctx.scale(scale, scale);
  ctx.translate(margin - bbox.x, margin - bbox.y);

  // 绘制所有元素
  elements.forEach((element) => {
    if (!element.visible) return;

    ctx.save();
    ctx.globalAlpha = element.opacity;

    if (element.rotation !== 0) {
      const cx = element.x + element.width / 2;
      const cy = element.y + element.height / 2;
      ctx.translate(cx, cy);
      ctx.rotate((element.rotation * Math.PI) / 180);
      ctx.translate(-cx, -cy);
    }

    drawElement(ctx, element);

    ctx.restore();
  });

  return canvas.toDataURL("image/png");
};

const drawElement = (ctx: CanvasRenderingContext2D, element: CanvasElement) => {
  switch (element.type) {
    case "pen":
      drawPen(ctx, element);
      break;
    case "line":
      drawLine(ctx, element);
      break;
    case "rectangle":
      drawRectangle(ctx, element);
      break;
    case "circle":
      drawCircle(ctx, element);
      break;
    case "text":
      drawText(ctx, element);
      break;
    case "sticky":
      drawSticky(ctx, element);
      break;
    case "arrow":
      drawArrow(ctx, element);
      break;
  }
};

const drawPen = (ctx: CanvasRenderingContext2D, element: any) => {
  if (element.points.length < 2) return;

  ctx.beginPath();
  ctx.strokeStyle = element.color;
  ctx.lineWidth = element.strokeWidth;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  ctx.moveTo(element.x + element.points[0].x, element.y + element.points[0].y);

  for (let i = 1; i < element.points.length; i++) {
    ctx.lineTo(
      element.x + element.points[i].x,
      element.y + element.points[i].y,
    );
  }

  ctx.stroke();
};

const drawLine = (ctx: CanvasRenderingContext2D, element: any) => {
  ctx.beginPath();
  ctx.strokeStyle = element.color;
  ctx.lineWidth = element.strokeWidth;
  ctx.lineCap = "round";

  ctx.moveTo(element.x + element.x1, element.y + element.y1);
  ctx.lineTo(element.x + element.x2, element.y + element.y2);
  ctx.stroke();
};

const drawRectangle = (ctx: CanvasRenderingContext2D, element: any) => {
  ctx.beginPath();
  ctx.lineWidth = element.strokeWidth;

  const drawRoundedRect = () => {
    const { x, y, width, height, borderRadius } = element;
    const r = Math.min(borderRadius, width / 2, height / 2);

    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + width - r, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + r);
    ctx.lineTo(x + width, y + height - r);
    ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
    ctx.lineTo(x + r, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  };

  if (element.fill !== "transparent" && element.fill) {
    ctx.fillStyle = element.fill;
    if (element.borderRadius > 0) {
      drawRoundedRect();
      ctx.fill();
    } else {
      ctx.fillRect(element.x, element.y, element.width, element.height);
    }
  }

  if (
    element.stroke !== "transparent" &&
    element.stroke &&
    element.strokeWidth > 0
  ) {
    ctx.strokeStyle = element.stroke;
    if (element.borderRadius > 0) {
      drawRoundedRect();
      ctx.stroke();
    } else {
      ctx.strokeRect(element.x, element.y, element.width, element.height);
    }
  }
};

const drawCircle = (ctx: CanvasRenderingContext2D, element: any) => {
  const rx = element.width / 2;
  const ry = element.height / 2;
  const cx = element.x + rx;
  const cy = element.y + ry;

  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);

  if (element.fill !== "transparent" && element.fill) {
    ctx.fillStyle = element.fill;
    ctx.fill();
  }

  if (
    element.stroke !== "transparent" &&
    element.stroke &&
    element.strokeWidth > 0
  ) {
    ctx.strokeStyle = element.stroke;
    ctx.lineWidth = element.strokeWidth;
    ctx.stroke();
  }
};

const drawText = (ctx: CanvasRenderingContext2D, element: any) => {
  if (!element.content) {
    ctx.fillStyle = "#999";
    ctx.font = `${element.fontSize}px ${element.fontFamily}`;
    ctx.fillText("Text", element.x, element.y + element.fontSize);
    return;
  }

  ctx.fillStyle = element.color;
  ctx.font = `${element.fontSize}px ${element.fontFamily}`;

  let textX = element.x;
  const textY = element.y + element.fontSize;

  if (element.textAlign === "center") {
    const metrics = ctx.measureText(element.content);
    textX = element.x + (element.width - metrics.width) / 2;
  } else if (element.textAlign === "right") {
    const metrics = ctx.measureText(element.content);
    textX = element.x + element.width - metrics.width;
  }

  ctx.fillText(element.content, textX, textY);
};

const drawSticky = (ctx: CanvasRenderingContext2D, element: any) => {
  ctx.fillStyle = element.backgroundColor;
  ctx.fillRect(element.x, element.y, element.width, element.height);

  ctx.strokeStyle = "rgba(0, 0, 0, 0.1)";
  ctx.lineWidth = 1;
  ctx.strokeRect(element.x, element.y, element.width, element.height);

  if (element.content) {
    ctx.fillStyle = "#333";
    ctx.font = `${element.fontSize}px Arial, sans-serif`;
    ctx.textBaseline = "top";

    const words = element.content.split(" ");
    let line = "";
    let lineY = element.y + 10;
    const maxWidth = element.width - 20;

    for (let i = 0; i < words.length; i++) {
      const testLine = line + words[i] + " ";
      const metrics = ctx.measureText(testLine);

      if (metrics.width > maxWidth && i > 0) {
        ctx.fillText(line, element.x + 10, lineY);
        line = words[i] + " ";
        lineY += element.fontSize * 1.5;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, element.x + 10, lineY);
  }
};

const drawArrow = (ctx: CanvasRenderingContext2D, element: any) => {
  const x1 = element.x + element.x1;
  const y1 = element.y + element.y1;
  const x2 = element.x + element.x2;
  const y2 = element.y + element.y2;

  ctx.beginPath();
  ctx.strokeStyle = element.color;
  ctx.lineWidth = element.strokeWidth;
  ctx.lineCap = "round";

  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();

  const arrowSize = 10;
  const angle = Math.atan2(y2 - y1, x2 - x1);

  if (element.endArrow) {
    ctx.beginPath();
    ctx.fillStyle = element.color;
    ctx.moveTo(x2, y2);
    ctx.lineTo(
      x2 - arrowSize * Math.cos(angle - Math.PI / 6),
      y2 - arrowSize * Math.sin(angle - Math.PI / 6),
    );
    ctx.lineTo(
      x2 - arrowSize * Math.cos(angle + Math.PI / 6),
      y2 - arrowSize * Math.sin(angle + Math.PI / 6),
    );
    ctx.closePath();
    ctx.fill();
  }

  if (element.startArrow) {
    ctx.beginPath();
    ctx.fillStyle = element.color;
    ctx.moveTo(x1, y1);
    ctx.lineTo(
      x1 + arrowSize * Math.cos(angle - Math.PI / 6),
      y1 + arrowSize * Math.sin(angle - Math.PI / 6),
    );
    ctx.lineTo(
      x1 + arrowSize * Math.cos(angle + Math.PI / 6),
      y1 + arrowSize * Math.sin(angle + Math.PI / 6),
    );
    ctx.closePath();
    ctx.fill();
  }
};

export const downloadPNG = (
  dataUrl: string,
  filename: string = "whiteboard.png",
) => {
  const link = document.createElement("a");
  link.download = filename;
  link.href = dataUrl;
  link.click();
};
