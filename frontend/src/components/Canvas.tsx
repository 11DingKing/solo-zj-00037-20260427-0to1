import React, { useRef, useEffect, useState, useCallback } from "react";
import { CanvasRenderer } from "@/utils/canvasRenderer";
import {
  screenToWorld,
  worldToScreen,
  pointInRect,
  normalizeSelectionRect,
  pointOnLine,
} from "@/utils/geometry";
import {
  createPenElement,
  createLineElement,
  createRectangleElement,
  createCircleElement,
  createTextElement,
  createStickyElement,
  createArrowElement,
} from "@/utils/elementFactory";
import { webSocketService } from "@/services/websocket";
import {
  useCanvasStore,
  useElementStore,
  useToolStore,
  useSelectionStore,
  useHistoryStore,
  useCollaborationStore,
  useAuthStore,
} from "@/store";
import {
  CanvasElement,
  Point,
  ToolType,
  PenElement,
  LineElement,
  RectangleElement,
  CircleElement,
  TextElement,
  StickyElement,
  ArrowElement,
} from "@/types";

interface CanvasProps {
  boardId: string;
}

const Canvas: React.FC<CanvasProps> = ({ boardId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<CanvasRenderer | null>(null);
  const animationFrameRef = useRef<number>(0);

  // 状态
  const { offsetX, offsetY, zoom, translate, zoomAt } = useCanvasStore();
  const { elements, addElement, updateElement, getElementById } =
    useElementStore();
  const {
    type: currentTool,
    color,
    strokeWidth,
    fillColor,
    fontSize,
    stickyColor,
  } = useToolStore();
  const {
    selectedIds,
    select,
    selectMultiple,
    deselectAll,
    startSelection,
    updateSelection,
    endSelection,
    isSelecting,
    selectionStart,
    selectionEnd,
  } = useSelectionStore();
  const { pushHistory } = useHistoryStore();
  const { cursorPositions } = useCollaborationStore();
  const { user } = useAuthStore();

  // 绘制状态
  const [isDrawing, setIsDrawing] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [spacePressed, setSpacePressed] = useState(false);
  const [drawPoints, setDrawPoints] = useState<Point[]>([]);
  const [drawStart, setDrawStart] = useState<Point | null>(null);
  const [dragStart, setDragStart] = useState<Point | null>(null);
  const [elementsBeforeDrag, setElementsBeforeDrag] = useState<CanvasElement[]>(
    [],
  );
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [lastCursorPos, setLastCursorPos] = useState<Point>({ x: 0, y: 0 });

  // 初始化画布
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    rendererRef.current = new CanvasRenderer(ctx);

    const resizeCanvas = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = container.clientWidth * dpr;
      canvas.height = container.clientHeight * dpr;
      canvas.style.width = `${container.clientWidth}px`;
      canvas.style.height = `${container.clientHeight}px`;
      ctx.scale(dpr, dpr);
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    return () => {
      window.removeEventListener("resize", resizeCanvas);
    };
  }, []);

  // 渲染循环
  useEffect(() => {
    const render = () => {
      const canvas = canvasRef.current;
      const renderer = rendererRef.current;
      if (!canvas || !renderer) {
        animationFrameRef.current = requestAnimationFrame(render);
        return;
      }

      const width = canvas.clientWidth;
      const height = canvas.clientHeight;

      renderer.clear(width, height);
      renderer.drawBackground("#ffffff");
      renderer.drawGrid(offsetX, offsetY, zoom);

      // 绘制所有元素
      elements.forEach((element) => {
        renderer.drawElement(element, offsetX, offsetY, zoom);
      });

      // 绘制选中元素的手柄
      selectedIds.forEach((id) => {
        const element = elements.find((e) => e.id === id);
        if (element) {
          renderer.drawElementHandles(element, offsetX, offsetY, zoom);
        }
      });

      // 绘制选择框
      if (isSelecting && selectionStart && selectionEnd) {
        const rect = normalizeSelectionRect(selectionStart, selectionEnd);
        renderer.drawSelectionRect(
          rect.x,
          rect.y,
          rect.width,
          rect.height,
          offsetX,
          offsetY,
          zoom,
        );
      }

      // 绘制其他用户的光标
      cursorPositions.forEach((cursor) => {
        if (cursor.userId !== user?.id) {
          renderer.drawCursor(
            cursor.x,
            cursor.y,
            cursor.color,
            cursor.username,
            offsetX,
            offsetY,
            zoom,
          );
        }
      });

      animationFrameRef.current = requestAnimationFrame(render);
    };

    animationFrameRef.current = requestAnimationFrame(render);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [
    elements,
    selectedIds,
    offsetX,
    offsetY,
    zoom,
    isSelecting,
    selectionStart,
    selectionEnd,
    cursorPositions,
    user,
  ]);

  // 键盘事件
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" && !e.repeat) {
        e.preventDefault();
        setSpacePressed(true);
        canvasRef.current?.style.setProperty("cursor", "grab");
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        setSpacePressed(false);
        if (!isPanning) {
          canvasRef.current?.style.setProperty("cursor", getCursor());
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [isPanning, spacePressed]);

  const getCursor = (): string => {
    if (spacePressed || isPanning) return "grab";
    switch (currentTool) {
      case "select":
        return "default";
      case "pen":
        return "crosshair";
      case "line":
      case "arrow":
        return "crosshair";
      case "rectangle":
      case "circle":
        return "crosshair";
      case "text":
        return "text";
      case "sticky":
        return "pointer";
      default:
        return "default";
    }
  };

  const getCanvasPoint = (e: React.MouseEvent): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    return screenToWorld(x, y, offsetX, offsetY, zoom);
  };

  const findElementAtPoint = (point: Point): CanvasElement | undefined => {
    return [...elements].reverse().find((element) => {
      if (element.locked || !element.visible) return false;

      // 不同类型的元素需要不同的碰撞检测
      switch (element.type) {
        case "line":
        case "arrow":
          const lineEl = element as LineElement | ArrowElement;
          return pointOnLine(
            point,
            {
              x1: element.x + lineEl.x1,
              y1: element.y + lineEl.y1,
              x2: element.x + lineEl.x2,
              y2: element.y + lineEl.y2,
            },
            10 / zoom,
          );
        case "pen":
          return pointInRect(point, element);
        default:
          return pointInRect(point, element);
      }
    });
  };

  // 鼠标事件处理
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;

    const point = getCanvasPoint(e);

    // 空格键按下时开始平移
    if (spacePressed || e.altKey) {
      setIsPanning(true);
      setDragStart({ x: e.clientX, y: e.clientY });
      canvasRef.current?.style.setProperty("cursor", "grabbing");
      return;
    }

    // 选择模式
    if (currentTool === "select") {
      const element = findElementAtPoint(point);

      if (element) {
        // 点击到元素
        const addToSelection = e.shiftKey;

        if (!selectedIds.includes(element.id)) {
          select(element.id, addToSelection);
        } else if (addToSelection) {
          select(element.id, true);
        }

        // 开始拖动
        setIsDragging(true);
        setDragStart(point);
        setElementsBeforeDrag(
          selectedIds
            .map((id) => getElementById(id))
            .filter(Boolean) as CanvasElement[],
        );
      } else if (!e.shiftKey) {
        // 点击空白处开始框选
        startSelection(point);
        deselectAll();
      }
      return;
    }

    // 绘图模式
    setIsDrawing(true);
    setDrawStart(point);

    switch (currentTool) {
      case "pen":
        setDrawPoints([point]);
        break;
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const point = getCanvasPoint(e);
    const screenX = e.clientX;
    const screenY = e.clientY;

    // 发送光标位置到协作服务
    if (lastCursorPos.x !== screenX || lastCursorPos.y !== screenY) {
      setLastCursorPos({ x: screenX, y: screenY });
      if (user && !isPanning) {
        webSocketService.sendCursorPosition(point.x, point.y, user.avatarColor);
      }
    }

    // 平移
    if (isPanning && dragStart) {
      const dx = screenX - dragStart.x;
      const dy = screenY - dragStart.y;
      translate(dx, dy);
      setDragStart({ x: screenX, y: screenY });
      return;
    }

    // 拖动元素
    if (isDragging && dragStart) {
      const dx = point.x - dragStart.x;
      const dy = point.y - dragStart.y;

      selectedIds.forEach((id) => {
        const element = getElementById(id);
        if (element) {
          updateElement(id, {
            x: element.x + dx,
            y: element.y + dy,
          });
        }
      });

      setDragStart(point);
      return;
    }

    // 框选
    if (isSelecting) {
      updateSelection(point);

      // 找出选择框内的元素
      const selectionRect = normalizeSelectionRect(selectionStart!, point);

      const intersectingIds = elements
        .filter((el) => {
          if (el.locked || !el.visible) return false;
          return pointInRect(
            { x: el.x + el.width / 2, y: el.y + el.height / 2 },
            selectionRect,
          );
        })
        .map((el) => el.id);

      if (intersectingIds.length > 0) {
        selectMultiple(intersectingIds);
      }
      return;
    }

    // 绘图
    if (!isDrawing) return;

    switch (currentTool) {
      case "pen":
        setDrawPoints((prev) => [...prev, point]);
        break;
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    const point = getCanvasPoint(e);

    // 结束平移
    if (isPanning) {
      setIsPanning(false);
      setDragStart(null);
      canvasRef.current?.style.setProperty("cursor", getCursor());
      return;
    }

    // 结束拖动
    if (isDragging) {
      setIsDragging(false);
      setDragStart(null);

      // 保存到历史
      if (elementsBeforeDrag.length > 0) {
        pushHistory(elementsBeforeDrag);

        // 同步到其他用户
        selectedIds.forEach((id) => {
          const element = getElementById(id);
          if (element) {
            webSocketService.sendElementUpdate(id, element);
          }
        });
      }
      return;
    }

    // 结束框选
    if (isSelecting) {
      endSelection();
      return;
    }

    // 结束绘图
    if (!isDrawing) return;
    setIsDrawing(false);

    if (!drawStart) return;

    let newElement: CanvasElement | null = null;

    switch (currentTool) {
      case "pen":
        if (drawPoints.length >= 2) {
          newElement = createPenElement(drawPoints, color, strokeWidth);
        }
        setDrawPoints([]);
        break;

      case "line":
        newElement = createLineElement(
          drawStart.x,
          drawStart.y,
          point.x,
          point.y,
          color,
          strokeWidth,
        );
        break;

      case "rectangle":
        newElement = createRectangleElement(
          drawStart.x,
          drawStart.y,
          point.x - drawStart.x,
          point.y - drawStart.y,
          fillColor,
          color,
          strokeWidth,
        );
        break;

      case "circle":
        const rx = Math.abs(point.x - drawStart.x) / 2;
        const ry = Math.abs(point.y - drawStart.y) / 2;
        const cx = Math.min(drawStart.x, point.x) + rx;
        const cy = Math.min(drawStart.y, point.y) + ry;
        newElement = createCircleElement(
          cx,
          cy,
          rx,
          ry,
          fillColor,
          color,
          strokeWidth,
        );
        break;

      case "text":
        newElement = createTextElement(
          drawStart.x,
          drawStart.y,
          "",
          fontSize,
          color,
        );
        setEditingTextId(newElement.id);
        break;

      case "sticky":
        newElement = createStickyElement(
          drawStart.x,
          drawStart.y,
          stickyColor,
          fontSize,
        );
        break;

      case "arrow":
        newElement = createArrowElement(
          drawStart.x,
          drawStart.y,
          point.x,
          point.y,
          color,
          strokeWidth,
          false,
          true,
        );
        break;
    }

    if (newElement) {
      pushHistory(elements);
      addElement(newElement);
      webSocketService.sendElementCreate(newElement);
      select(newElement.id, false);
    }

    setDrawStart(null);
  };

  const handleMouseLeave = () => {
    if (isPanning) {
      setIsPanning(false);
      setDragStart(null);
    }
    if (isDragging) {
      setIsDragging(false);
      setDragStart(null);
    }
    if (isSelecting) {
      endSelection();
    }
    setIsDrawing(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    zoomAt(delta, mouseX, mouseY);
  };

  return (
    <div
      ref={containerRef}
      className="w-full h-full relative overflow-hidden bg-gray-200"
      style={{ cursor: getCursor() }}
    >
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onWheel={handleWheel}
        className="absolute inset-0"
      />
    </div>
  );
};

export default Canvas;
