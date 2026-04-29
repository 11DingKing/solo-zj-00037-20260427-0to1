import { Point, BoundingBox, CanvasElement, Transform } from "@/types";

export const screenToWorld = (
  screenX: number,
  screenY: number,
  offsetX: number,
  offsetY: number,
  zoom: number,
): Point => ({
  x: (screenX - offsetX) / zoom,
  y: (screenY - offsetY) / zoom,
});

export const worldToScreen = (
  worldX: number,
  worldY: number,
  offsetX: number,
  offsetY: number,
  zoom: number,
): Point => ({
  x: worldX * zoom + offsetX,
  y: worldY * zoom + offsetY,
});

export const getBoundingBox = (elements: CanvasElement[]): BoundingBox => {
  if (elements.length === 0) {
    return { x: 0, y: 0, width: 0, height: 0 };
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  elements.forEach((el) => {
    minX = Math.min(minX, el.x);
    minY = Math.min(minY, el.y);
    maxX = Math.max(maxX, el.x + el.width);
    maxY = Math.max(maxY, el.y + el.height);
  });

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
};

export const pointInRect = (
  point: Point,
  rect: { x: number; y: number; width: number; height: number },
): boolean => {
  return (
    point.x >= rect.x &&
    point.x <= rect.x + rect.width &&
    point.y >= rect.y &&
    point.y <= rect.y + rect.height
  );
};

export const rotatePoint = (
  point: Point,
  center: Point,
  angle: number,
): Point => {
  const rad = (angle * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);

  const dx = point.x - center.x;
  const dy = point.y - center.y;

  return {
    x: center.x + dx * cos - dy * sin,
    y: center.y + dx * sin + dy * cos,
  };
};

export const pointOnLine = (
  point: Point,
  line: { x1: number; y1: number; x2: number; y2: number },
  threshold: number = 5,
): boolean => {
  const { x1, y1, x2, y2 } = line;

  const A = point.x - x1;
  const B = point.y - y1;
  const C = x2 - x1;
  const D = y2 - y1;

  const dot = A * C + B * D;
  const lenSq = C * C + D * D;
  let param = -1;

  if (lenSq !== 0) param = dot / lenSq;

  let xx: number, yy: number;

  if (param < 0) {
    xx = x1;
    yy = y1;
  } else if (param > 1) {
    xx = x2;
    yy = y2;
  } else {
    xx = x1 + param * C;
    yy = y1 + param * D;
  }

  const dx = point.x - xx;
  const dy = point.y - yy;

  return Math.sqrt(dx * dx + dy * dy) < threshold;
};

export const rectsIntersect = (
  rect1: { x: number; y: number; width: number; height: number },
  rect2: { x: number; y: number; width: number; height: number },
): boolean => {
  return (
    rect1.x < rect2.x + rect2.width &&
    rect1.x + rect1.width > rect2.x &&
    rect1.y < rect2.y + rect2.height &&
    rect1.y + rect1.height > rect2.y
  );
};

export const normalizeSelectionRect = (
  start: Point,
  end: Point,
): { x: number; y: number; width: number; height: number } => {
  const x = Math.min(start.x, end.x);
  const y = Math.min(start.y, end.y);
  const width = Math.abs(end.x - start.x);
  const height = Math.abs(end.y - start.y);
  return { x, y, width, height };
};

export const alignLeft = (elements: CanvasElement[]): CanvasElement[] => {
  if (elements.length <= 1) return elements;

  const minX = Math.min(...elements.map((el) => el.x));
  return elements.map((el) => ({ ...el, x: minX, updatedAt: Date.now() }));
};

export const alignRight = (elements: CanvasElement[]): CanvasElement[] => {
  if (elements.length <= 1) return elements;

  const maxX = Math.max(...elements.map((el) => el.x + el.width));
  return elements.map((el) => ({
    ...el,
    x: maxX - el.width,
    updatedAt: Date.now(),
  }));
};

export const alignCenter = (elements: CanvasElement[]): CanvasElement[] => {
  if (elements.length <= 1) return elements;

  const bbox = getBoundingBox(elements);
  const centerX = bbox.x + bbox.width / 2;

  return elements.map((el) => ({
    ...el,
    x: centerX - el.width / 2,
    updatedAt: Date.now(),
  }));
};

export const alignTop = (elements: CanvasElement[]): CanvasElement[] => {
  if (elements.length <= 1) return elements;

  const minY = Math.min(...elements.map((el) => el.y));
  return elements.map((el) => ({ ...el, y: minY, updatedAt: Date.now() }));
};

export const alignBottom = (elements: CanvasElement[]): CanvasElement[] => {
  if (elements.length <= 1) return elements;

  const maxY = Math.max(...elements.map((el) => el.y + el.height));
  return elements.map((el) => ({
    ...el,
    y: maxY - el.height,
    updatedAt: Date.now(),
  }));
};

export const distributeHorizontal = (
  elements: CanvasElement[],
): CanvasElement[] => {
  if (elements.length <= 2) return elements;

  const sorted = [...elements].sort((a, b) => a.x - b.x);
  const totalWidth =
    sorted[sorted.length - 1].x + sorted[sorted.length - 1].width - sorted[0].x;
  const elementsWidth = sorted.reduce((sum, el) => sum + el.width, 0);
  const space = (totalWidth - elementsWidth) / (sorted.length - 1);

  let currentX = sorted[0].x;

  return sorted.map((el, _index) => {
    const newEl = { ...el, x: currentX, updatedAt: Date.now() };
    currentX += el.width + space;
    return newEl;
  });
};

export const distributeVertical = (
  elements: CanvasElement[],
): CanvasElement[] => {
  if (elements.length <= 2) return elements;

  const sorted = [...elements].sort((a, b) => a.y - b.y);
  const totalHeight =
    sorted[sorted.length - 1].y +
    sorted[sorted.length - 1].height -
    sorted[0].y;
  const elementsHeight = sorted.reduce((sum, el) => sum + el.height, 0);
  const space = (totalHeight - elementsHeight) / (sorted.length - 1);

  let currentY = sorted[0].y;

  return sorted.map((el, _index) => {
    const newEl = { ...el, y: currentY, updatedAt: Date.now() };
    currentY += el.height + space;
    return newEl;
  });
};
