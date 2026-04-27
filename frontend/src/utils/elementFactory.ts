import { v4 as uuidv4 } from "uuid";
import {
  CanvasElement,
  PenElement,
  LineElement,
  RectangleElement,
  CircleElement,
  TextElement,
  StickyElement,
  ArrowElement,
  Point,
} from "@/types";

export const createPenElement = (
  points: Point[],
  color: string,
  strokeWidth: number,
): PenElement => {
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  return {
    id: uuidv4(),
    type: "pen",
    x: minX,
    y: minY,
    width: maxX - minX || strokeWidth,
    height: maxY - minY || strokeWidth,
    rotation: 0,
    opacity: 1,
    locked: false,
    visible: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    points: points.map((p) => ({ x: p.x - minX, y: p.y - minY })),
    color,
    strokeWidth,
  };
};

export const createLineElement = (
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string,
  strokeWidth: number,
): LineElement => {
  const minX = Math.min(x1, x2);
  const maxX = Math.max(x1, x2);
  const minY = Math.min(y1, y2);
  const maxY = Math.max(y1, y2);

  return {
    id: uuidv4(),
    type: "line",
    x: minX,
    y: minY,
    width: maxX - minX || strokeWidth,
    height: maxY - minY || strokeWidth,
    rotation: 0,
    opacity: 1,
    locked: false,
    visible: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    x1: x1 - minX,
    y1: y1 - minY,
    x2: x2 - minX,
    y2: y2 - minY,
    color,
    strokeWidth,
  };
};

export const createRectangleElement = (
  x: number,
  y: number,
  width: number,
  height: number,
  fill: string,
  stroke: string,
  strokeWidth: number,
  borderRadius: number = 0,
): RectangleElement => {
  return {
    id: uuidv4(),
    type: "rectangle",
    x: width >= 0 ? x : x + width,
    y: height >= 0 ? y : y + height,
    width: Math.abs(width) || strokeWidth,
    height: Math.abs(height) || strokeWidth,
    rotation: 0,
    opacity: 1,
    locked: false,
    visible: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    fill,
    stroke,
    strokeWidth,
    borderRadius,
  };
};

export const createCircleElement = (
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  fill: string,
  stroke: string,
  strokeWidth: number,
): CircleElement => {
  const x = cx - Math.abs(rx);
  const y = cy - Math.abs(ry);
  const width = Math.abs(rx) * 2;
  const height = Math.abs(ry) * 2;

  return {
    id: uuidv4(),
    type: "circle",
    x,
    y,
    width: width || strokeWidth,
    height: height || strokeWidth,
    rotation: 0,
    opacity: 1,
    locked: false,
    visible: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    fill,
    stroke,
    strokeWidth,
  };
};

export const createTextElement = (
  x: number,
  y: number,
  content: string,
  fontSize: number,
  color: string,
  fontFamily: string = "Arial, sans-serif",
): TextElement => {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  let width = 100;
  let height = fontSize * 1.5;

  if (ctx) {
    ctx.font = `${fontSize}px ${fontFamily}`;
    const metrics = ctx.measureText(content || "Text");
    width = metrics.width || 100;
    height = fontSize * 1.5;
  }

  return {
    id: uuidv4(),
    type: "text",
    x,
    y,
    width,
    height,
    rotation: 0,
    opacity: 1,
    locked: false,
    visible: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    content: content || "",
    fontSize,
    color,
    fontFamily,
    textAlign: "left",
  };
};

export const createStickyElement = (
  x: number,
  y: number,
  backgroundColor: string,
  fontSize: number = 14,
): StickyElement => {
  return {
    id: uuidv4(),
    type: "sticky",
    x,
    y,
    width: 200,
    height: 200,
    rotation: 0,
    opacity: 1,
    locked: false,
    visible: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    content: "",
    backgroundColor,
    fontSize,
  };
};

export const createArrowElement = (
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string,
  strokeWidth: number,
  startArrow: boolean = false,
  endArrow: boolean = true,
): ArrowElement => {
  const minX = Math.min(x1, x2);
  const maxX = Math.max(x1, x2);
  const minY = Math.min(y1, y2);
  const maxY = Math.max(y1, y2);

  return {
    id: uuidv4(),
    type: "arrow",
    x: minX,
    y: minY,
    width: maxX - minX || strokeWidth,
    height: maxY - minY || strokeWidth,
    rotation: 0,
    opacity: 1,
    locked: false,
    visible: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    x1: x1 - minX,
    y1: y1 - minY,
    x2: x2 - minX,
    y2: y2 - minY,
    color,
    strokeWidth,
    startArrow,
    endArrow,
  };
};

export const cloneElement = (element: CanvasElement): CanvasElement => {
  const cloned = JSON.parse(JSON.stringify(element));
  cloned.id = uuidv4();
  cloned.createdAt = Date.now();
  cloned.updatedAt = Date.now();
  return cloned;
};

export const moveElement = (
  element: CanvasElement,
  dx: number,
  dy: number,
): CanvasElement => {
  return {
    ...element,
    x: element.x + dx,
    y: element.y + dy,
    updatedAt: Date.now(),
  };
};
