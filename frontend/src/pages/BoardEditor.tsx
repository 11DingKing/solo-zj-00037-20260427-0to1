import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Share2,
  Download,
  Undo2,
  Redo2,
  MousePointer2,
  Pencil,
  Minus,
  Square,
  Circle,
  Type,
  StickyNote,
  ArrowRight,
  Trash2,
  Group,
  Ungroup,
  AlignLeft,
  AlignCenter,
  AlignRight,
  MoreVertical,
} from "lucide-react";
import Canvas from "@/components/Canvas";
import Toolbar from "@/components/Toolbar";
import PropertiesPanel from "@/components/PropertiesPanel";
import Minimap from "@/components/Minimap";
import OnlineUsers from "@/components/OnlineUsers";
import { boardApi } from "@/services/api";
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
import { ToolType, Point } from "@/types";

const BoardEditor: React.FC = () => {
  const { id: boardId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [boardName, setBoardName] = useState("");
  const [loading, setLoading] = useState(true);
  const [showShareModal, setShowShareModal] = useState(false);
  const [inviteCode, setInviteCode] = useState("");
  const [showTools, setShowTools] = useState(true);
  const [showProperties, setShowProperties] = useState(true);

  const { type: currentTool, setTool } = useToolStore();
  const { elements, setElements } = useElementStore();
  const { selectedIds, selectMultiple } = useSelectionStore();
  const { past, present, future, pushHistory, undo, redo, canUndo, canRedo } =
    useHistoryStore();
  const { user } = useAuthStore();

  // 加载白板数据
  useEffect(() => {
    const loadBoard = async () => {
      if (!boardId) return;

      try {
        const [boardResponse, elementsResponse] = await Promise.all([
          boardApi.getBoard(boardId),
          boardApi.getBoardElements(boardId),
        ]);

        setBoardName(boardResponse.data.name);
        setInviteCode(boardResponse.data.inviteCode || "");

        // 解析元素数据
        const parsedElements = elementsResponse.data
          .map((el: any) => {
            try {
              return JSON.parse(el.data);
            } catch {
              return null;
            }
          })
          .filter(Boolean);

        setElements(parsedElements);
      } catch (error) {
        console.error("Failed to load board:", error);
      } finally {
        setLoading(false);
      }
    };

    loadBoard();
  }, [boardId, setElements]);

  // 连接 WebSocket
  useEffect(() => {
    if (boardId) {
      webSocketService.connect(boardId);

      return () => {
        webSocketService.disconnect();
      };
    }
  }, [boardId]);

  // 键盘快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === "z" && !e.shiftKey) {
          e.preventDefault();
          handleUndo();
        } else if ((e.key === "z" && e.shiftKey) || e.key === "y") {
          e.preventDefault();
          handleRedo();
        }
      }

      if (e.key === "Delete" || e.key === "Backspace") {
        if (selectedIds.length > 0) {
          handleDelete();
        }
      }

      // 工具快捷键
      switch (e.key.toLowerCase()) {
        case "v":
          setTool("select");
          break;
        case "p":
          setTool("pen");
          break;
        case "l":
          setTool("line");
          break;
        case "r":
          setTool("rectangle");
          break;
        case "c":
          setTool("circle");
          break;
        case "t":
          setTool("text");
          break;
        case "s":
          setTool("sticky");
          break;
        case "a":
          setTool("arrow");
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedIds, setTool]);

  const handleUndo = () => {
    const prevElements = undo();
    if (prevElements) {
      setElements(prevElements);
      selectMultiple([]);
    }
  };

  const handleRedo = () => {
    const nextElements = redo();
    if (nextElements) {
      setElements(nextElements);
      selectMultiple([]);
    }
  };

  const handleDelete = () => {
    if (selectedIds.length === 0) return;

    pushHistory(elements);
    useElementStore.getState().deleteElements(selectedIds);
    webSocketService.send("BatchOperation", {
      deleteElementIds: selectedIds,
    });
    selectMultiple([]);
  };

  const handleGroup = () => {
    // 编组功能 - 在实际项目中需要更复杂的实现
  };

  const handleUngroup = () => {
    // 解组功能
  };

  const handleExport = async () => {
    // 导出功能 - 在实际项目中实现
  };

  const handleShare = async () => {
    if (!boardId) return;

    try {
      const response = await boardApi.generateInviteLink(boardId);
      setInviteCode(response.data.inviteCode);
      setShowShareModal(true);
    } catch (error) {
      console.error("Failed to generate invite link:", error);
    }
  };

  const copyInviteLink = () => {
    const link = `${window.location.origin}/join/${inviteCode}`;
    navigator.clipboard.writeText(link);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">加载白板中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-100 overflow-hidden">
      {/* Header */}
      <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate("/")}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} className="text-gray-600" />
          </button>
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">W</span>
            </div>
            <h1 className="text-lg font-semibold text-gray-800">{boardName}</h1>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* 撤销/重做 */}
          <div className="flex items-center space-x-1 mr-4">
            <button
              onClick={handleUndo}
              disabled={!canUndo}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              title="撤销 (Ctrl+Z)"
            >
              <Undo2 size={18} className="text-gray-600" />
            </button>
            <button
              onClick={handleRedo}
              disabled={!canRedo}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              title="重做 (Ctrl+Shift+Z)"
            >
              <Redo2 size={18} className="text-gray-600" />
            </button>
          </div>

          <button
            onClick={handleShare}
            className="flex items-center space-x-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <Share2 size={16} />
            <span className="text-sm">分享</span>
          </button>

          <button
            onClick={handleExport}
            className="flex items-center space-x-2 px-3 py-2 border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <Download size={16} />
            <span className="text-sm">导出</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Toolbar */}
        {showTools && (
          <div className="w-14 bg-white border-r border-gray-200 flex flex-col items-center py-4 space-y-1 shrink-0">
            <Toolbar />
          </div>
        )}

        {/* Canvas Area */}
        <div className="flex-1 relative overflow-hidden">
          <Canvas boardId={boardId || ""} />

          {/* Minimap */}
          <Minimap />

          {/* Online Users */}
          <OnlineUsers />

          {/* Zoom Controls */}
          <div className="absolute bottom-4 left-4 flex items-center space-x-2 bg-white rounded-lg shadow-lg p-1">
            <button
              onClick={() => {
                const { zoom, setZoom } = useCanvasStore.getState();
                setZoom(zoom - 0.1);
              }}
              className="p-2 hover:bg-gray-100 rounded"
            >
              <Minus size={16} />
            </button>
            <span className="text-sm font-medium px-2 min-w-[50px] text-center">
              {Math.round(useCanvasStore.getState().zoom * 100)}%
            </span>
            <button
              onClick={() => {
                const { zoom, setZoom } = useCanvasStore.getState();
                setZoom(zoom + 0.1);
              }}
              className="p-2 hover:bg-gray-100 rounded"
            >
              <Plus size={16} />
            </button>
            <button
              onClick={() => useCanvasStore.getState().reset()}
              className="p-2 hover:bg-gray-100 rounded"
            >
              <MoreVertical size={16} />
            </button>
          </div>
        </div>

        {/* Right Properties Panel */}
        {showProperties && selectedIds.length > 0 && (
          <div className="w-64 bg-white border-l border-gray-200 shrink-0">
            <PropertiesPanel />
          </div>
        )}
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">分享白板</h2>
              <p className="text-gray-600 mb-4">
                将此链接分享给其他人，他们可以通过链接加入协作：
              </p>
              <div className="flex items-center space-x-2 mb-6">
                <input
                  type="text"
                  readOnly
                  value={`${window.location.origin}/join/${inviteCode}`}
                  className="flex-1 px-4 py-2 bg-gray-100 border border-gray-200 rounded-lg text-sm"
                />
                <button
                  onClick={copyInviteLink}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors"
                >
                  复制
                </button>
              </div>
              <div className="flex justify-end">
                <button
                  onClick={() => setShowShareModal(false)}
                  className="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                >
                  关闭
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BoardEditor;
