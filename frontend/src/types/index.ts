export type ToolType =
  | "select"
  | "pen"
  | "line"
  | "rectangle"
  | "circle"
  | "text"
  | "sticky"
  | "arrow"
  | "eraser";

export interface Point {
  x: number;
  y: number;
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Transform {
  x: number;
  y: number;
  scaleX: number;
  scaleY: number;
  rotation: number;
}

export type ElementType =
  | "pen"
  | "line"
  | "rectangle"
  | "circle"
  | "text"
  | "sticky"
  | "arrow"
  | "group";

export interface BaseElement {
  id: string;
  type: ElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  locked: boolean;
  visible: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface PenElement extends BaseElement {
  type: "pen";
  points: Point[];
  color: string;
  strokeWidth: number;
}

export interface LineElement extends BaseElement {
  type: "line";
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color: string;
  strokeWidth: number;
}

export interface RectangleElement extends BaseElement {
  type: "rectangle";
  fill: string;
  stroke: string;
  strokeWidth: number;
  borderRadius: number;
}

export interface CircleElement extends BaseElement {
  type: "circle";
  fill: string;
  stroke: string;
  strokeWidth: number;
}

export interface TextElement extends BaseElement {
  type: "text";
  content: string;
  fontSize: number;
  color: string;
  fontFamily: string;
  textAlign: "left" | "center" | "right";
}

export interface StickyElement extends BaseElement {
  type: "sticky";
  content: string;
  backgroundColor: string;
  fontSize: number;
}

export interface ArrowElement extends BaseElement {
  type: "arrow";
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color: string;
  strokeWidth: number;
  startArrow: boolean;
  endArrow: boolean;
  connectedToStart?: string;
  connectedToEnd?: string;
}

export interface GroupElement extends BaseElement {
  type: "group";
  children: string[];
}

export type CanvasElement =
  | PenElement
  | LineElement
  | RectangleElement
  | CircleElement
  | TextElement
  | StickyElement
  | ArrowElement
  | GroupElement;

export interface CanvasState {
  offsetX: number;
  offsetY: number;
  zoom: number;
}

export interface CursorPosition {
  userId: string;
  username: string;
  color: string;
  x: number;
  y: number;
}

export interface OnlineUser {
  userId: string;
  username: string;
  avatarColor: string;
  isOnline: boolean;
}

export interface User {
  id: string;
  username: string;
  email: string;
  avatarColor: string;
}

export interface Board {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  inviteCode?: string;
  thumbnailUrl?: string;
  createdAt: string;
  updatedAt: string;
  participantCount: number;
  owner: User;
}

export interface BoardListItem {
  id: string;
  name: string;
  description?: string;
  thumbnailUrl?: string;
  createdAt: string;
  updatedAt: string;
  participantCount: number;
  isOwner: boolean;
}

export type WsMessageType =
  | "Join"
  | "Leave"
  | "CursorMove"
  | "ElementCreate"
  | "ElementUpdate"
  | "ElementDelete"
  | "BatchOperation"
  | "SelectionUpdate"
  | "UserList"
  | "Error";

export interface WsMessage<T> {
  type: WsMessageType;
  payload: T;
  timestamp: number;
  userId?: string;
}

export interface ToolState {
  type: ToolType;
  color: string;
  strokeWidth: number;
  fillColor: string;
  fontSize: number;
  stickyColor: string;
}

export interface SelectionState {
  selectedIds: string[];
  isSelecting: boolean;
  selectionStart?: Point;
  selectionEnd?: Point;
}

export interface HistoryState {
  past: CanvasElement[][];
  present: CanvasElement[];
  future: CanvasElement[][];
  maxSteps: number;
}
