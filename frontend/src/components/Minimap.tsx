import React, { useRef, useEffect } from "react";
import { useCanvasStore, useElementStore } from "@/store";
import { getBoundingBox } from "@/utils/geometry";

const Minimap: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { offsetX, offsetY, zoom } = useCanvasStore();
  const { elements } = useElementStore();

  const MINIMAP_SIZE = 200;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || elements.length === 0) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // 计算所有元素的边界框
    const bbox = getBoundingBox(elements);

    // 添加一些边距
    const margin = 50;
    const contentWidth = bbox.width + margin * 2;
    const contentHeight = bbox.height + margin * 2;

    // 计算缩放比例以适应小地图
    const scaleX = MINIMAP_SIZE / contentWidth;
    const scaleY = MINIMAP_SIZE / contentHeight;
    const scale = Math.min(scaleX, scaleY, 1);

    const contentOffsetX =
      (MINIMAP_SIZE - contentWidth * scale) / 2 - (bbox.x - margin) * scale;
    const contentOffsetY =
      (MINIMAP_SIZE - contentHeight * scale) / 2 - (bbox.y - margin) * scale;

    // 清除画布
    ctx.clearRect(0, 0, MINIMAP_SIZE, MINIMAP_SIZE);

    // 绘制背景
    ctx.fillStyle = "#f9fafb";
    ctx.fillRect(0, 0, MINIMAP_SIZE, MINIMAP_SIZE);

    // 绘制元素
    ctx.save();
    ctx.translate(contentOffsetX, contentOffsetY);
    ctx.scale(scale, scale);

    elements.forEach((element) => {
      if (!element.visible) return;

      ctx.globalAlpha = element.opacity * 0.8;
      ctx.fillStyle = "#6B7280";
      ctx.strokeStyle = "#9CA3AF";
      ctx.lineWidth = 1 / scale;

      switch (element.type) {
        case "rectangle":
        case "circle":
          ctx.fillRect(element.x, element.y, element.width, element.height);
          break;
        case "line":
        case "arrow":
        case "pen":
          ctx.strokeRect(element.x, element.y, element.width, element.height);
          break;
        case "text":
          ctx.fillRect(element.x, element.y, element.width, element.height);
          break;
        case "sticky":
          ctx.fillRect(element.x, element.y, element.width, element.height);
          break;
        default:
          ctx.fillRect(element.x, element.y, element.width, element.height);
      }
    });

    ctx.restore();

    // 绘制当前视口指示器
    const canvas = document.querySelector("canvas:not(#minimap)");
    if (canvas) {
      const viewportWidth = canvas.clientWidth;
      const viewportHeight = canvas.clientHeight;

      // 计算视口在世界坐标中的位置
      const vpLeft = -offsetX / zoom;
      const vpTop = -offsetY / zoom;
      const vpRight = vpLeft + viewportWidth / zoom;
      const vpBottom = vpTop + viewportHeight / zoom;

      ctx.save();
      ctx.translate(contentOffsetX, contentOffsetY);
      ctx.scale(scale, scale);

      ctx.strokeStyle = "#3B82F6";
      ctx.lineWidth = 2 / scale;
      ctx.globalAlpha = 1;
      ctx.strokeRect(vpLeft, vpTop, vpRight - vpLeft, vpBottom - vpTop);

      ctx.fillStyle = "rgba(59, 130, 246, 0.1)";
      ctx.fillRect(vpLeft, vpTop, vpRight - vpLeft, vpBottom - vpTop);

      ctx.restore();
    }
  }, [elements, offsetX, offsetY, zoom]);

  const handleMinimapClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // 计算所有元素的边界框
    const bbox = getBoundingBox(elements);
    const margin = 50;
    const contentWidth = bbox.width + margin * 2;
    const contentHeight = bbox.height + margin * 2;

    const scaleX = MINIMAP_SIZE / contentWidth;
    const scaleY = MINIMAP_SIZE / contentHeight;
    const scale = Math.min(scaleX, scaleY, 1);

    const contentOffsetX =
      (MINIMAP_SIZE - contentWidth * scale) / 2 - (bbox.x - margin) * scale;
    const contentOffsetY =
      (MINIMAP_SIZE - contentHeight * scale) / 2 - (bbox.y - margin) * scale;

    // 将点击位置转换为世界坐标
    const worldX = (clickX - contentOffsetX) / scale;
    const worldY = (clickY - contentOffsetY) / scale;

    // 计算视口中心
    const mainCanvas = document.querySelector("canvas:not(#minimap)");
    if (mainCanvas) {
      const viewportWidth = mainCanvas.clientWidth;
      const viewportHeight = mainCanvas.clientHeight;

      const newOffsetX = -worldX * zoom + viewportWidth / 2;
      const newOffsetY = -worldY * zoom + viewportHeight / 2;

      useCanvasStore.getState().setOffset(newOffsetX, newOffsetY);
    }
  };

  if (elements.length === 0) return null;

  return (
    <div className="absolute bottom-4 right-4 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
      <div className="bg-gray-50 px-3 py-2 border-b border-gray-200">
        <span className="text-xs font-medium text-gray-500">小地图</span>
      </div>
      <canvas
        ref={canvasRef}
        id="minimap"
        width={MINIMAP_SIZE}
        height={MINIMAP_SIZE}
        onClick={handleMinimapClick}
        className="cursor-crosshair"
      />
    </div>
  );
};

export default Minimap;
