import {
  WsMessage,
  WsMessageType,
  OnlineUser,
  CanvasElement,
} from "@/types";
import { useCollaborationStore, useElementStore, useAuthStore } from "@/store";

class WebSocketService {
  private ws: WebSocket | null = null;
  private boardId: string | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private messageHandlers: Map<string, ((message: any) => void)[]> = new Map();

  connect(boardId: string): void {
    if (this.ws?.readyState === WebSocket.OPEN && this.boardId === boardId) {
      return;
    }

    this.boardId = boardId;
    const token = useAuthStore.getState().token;
    const wsUrl = `/ws/${boardId}?access_token=${token}`;

    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      console.log("WebSocket connected");
      useCollaborationStore.getState().setConnected(true);
      this.reconnectAttempts = 0;
    };

    this.ws.onclose = (event) => {
      console.log("WebSocket closed", event);
      useCollaborationStore.getState().setConnected(false);
      this.handleReconnect();
    };

    this.ws.onerror = (error) => {
      console.error("WebSocket error", error);
    };

    this.ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        this.handleMessage(message);
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    };
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.boardId = null;
    useCollaborationStore.getState().clearCollaboration();
  }

  private handleReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts && this.boardId) {
      this.reconnectAttempts++;
      console.log(`Reconnecting... attempt ${this.reconnectAttempts}`);
      setTimeout(() => {
        if (this.boardId) {
          this.connect(this.boardId);
        }
      }, this.reconnectDelay * this.reconnectAttempts);
    }
  }

  private handleMessage(message: WsMessage<any>): void {
    const handlers = this.messageHandlers.get(message.type) || [];
    handlers.forEach((handler) => handler(message));

    const { userId, payload } = message;
    const collaborationStore = useCollaborationStore.getState();

    switch (message.type) {
      case "Join":
        if (userId) {
          collaborationStore.addOnlineUser({
            userId: payload.userId || userId,
            username: payload.username || "Unknown",
            avatarColor: payload.avatarColor || "#4ECDC4",
            isOnline: true,
          });
        }
        break;

      case "Leave":
        if (typeof payload === "string") {
          collaborationStore.removeOnlineUser(payload);
          collaborationStore.removeCursorPosition(payload);
        }
        break;

      case "CursorMove":
        if (userId) {
          collaborationStore.updateCursorPosition(userId, {
            userId,
            username: "",
            color: payload.color || "#4ECDC4",
            x: payload.x,
            y: payload.y,
          });
        }
        break;

      case "UserList":
        if (Array.isArray(payload)) {
          collaborationStore.setOnlineUsers(payload as OnlineUser[]);
        }
        break;

      case "ElementCreate":
        if (payload) {
          const element = this.parseElement(payload);
          if (element) {
            useElementStore.getState().addElement(element);
          }
        }
        break;

      case "ElementUpdate":
        if (payload && payload.elementId) {
          const updates = this.parseElementData(payload.data);
          if (updates) {
            useElementStore
              .getState()
              .updateElement(payload.elementId, updates);
          }
        }
        break;

      case "ElementDelete":
        if (payload && payload.elementId) {
          useElementStore.getState().deleteElement(payload.elementId);
        }
        break;

      case "BatchOperation":
        if (payload) {
          const { createElements, deleteElementIds, updateElements } = payload;
          const elementStore = useElementStore.getState();

          if (Array.isArray(createElements)) {
            createElements.forEach((el: any) => {
              const element = this.parseElement(el);
              if (element) elementStore.addElement(element);
            });
          }

          if (Array.isArray(deleteElementIds)) {
            elementStore.deleteElements(deleteElementIds);
          }

          if (Array.isArray(updateElements)) {
            updateElements.forEach((el: any) => {
              const updates = this.parseElementData(el.data);
              if (updates) elementStore.updateElement(el.elementId, updates);
            });
          }
        }
        break;
    }
  }

  private parseElement(payload: any): CanvasElement | null {
    try {
      if (typeof payload.data === "string") {
        return JSON.parse(payload.data);
      }
      return payload.data;
    } catch {
      return null;
    }
  }

  private parseElementData(
    data: string | object,
  ): Partial<CanvasElement> | null {
    try {
      if (typeof data === "string") {
        return JSON.parse(data);
      }
      return data as Partial<CanvasElement>;
    } catch {
      return null;
    }
  }

  send<T>(type: WsMessageType, payload: T): void {
    if (this.ws?.readyState !== WebSocket.OPEN) {
      console.warn("WebSocket not connected");
      return;
    }

    const message: WsMessage<T> = {
      type,
      payload,
      timestamp: Date.now(),
    };

    this.ws.send(JSON.stringify(message));
  }

  sendCursorPosition(x: number, y: number, color: string): void {
    this.send("CursorMove", { x, y, color });
  }

  sendElementCreate(element: CanvasElement): void {
    this.send("ElementCreate", {
      elementId: element.id,
      elementType: element.type,
      data: JSON.stringify(element),
    });
  }

  sendElementUpdate(elementId: string, updates: Partial<CanvasElement>): void {
    this.send("ElementUpdate", {
      elementId,
      data: JSON.stringify(updates),
    });
  }

  sendElementDelete(elementId: string): void {
    this.send("ElementDelete", { elementId });
  }

  onMessage<T>(
    type: WsMessageType,
    handler: (message: WsMessage<T>) => void,
  ): () => void {
    if (!this.messageHandlers.has(type)) {
      this.messageHandlers.set(type, []);
    }
    const handlers = this.messageHandlers.get(type)!;
    handlers.push(handler as (message: any) => void);

    return () => {
      const handlers = this.messageHandlers.get(type);
      if (handlers) {
        const index = handlers.indexOf(handler as (message: any) => void);
        if (index > -1) {
          handlers.splice(index, 1);
        }
      }
    };
  }
}

export const webSocketService = new WebSocketService();
