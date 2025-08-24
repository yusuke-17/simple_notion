export interface User {
  id: number;
  email: string;
  name: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
}

export interface Document {
  id: number;
  title: string;
  content: string;
  parentId: number | null;
  userId: number;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  treePath?: string;
  level?: number;
  sortOrder?: number;
  isDeleted?: boolean;
}

export interface Block {
  id: number;
  type: string;
  content: string;
  documentId: number;
  position: number; // Changed from 'order' to match backend
  createdAt: string;
  updatedAt?: string;
}

// Rich text content types for TipTap
export interface TipTapDocument {
  type: 'doc';
  content?: TipTapNode[];
}

export interface TipTapNode {
  type: string;
  content?: TipTapNode[];
  marks?: TipTapMark[];
  text?: string;
  attrs?: Record<string, unknown>;
}

export interface TipTapMark {
  type: string;
  attrs?: Record<string, unknown>;
}

// Block content format types
export type BlockContentFormat = 'plain' | 'rich';

export interface RichBlock extends Omit<Block, 'content'> {
  content: string; // JSON string for rich text, plain string for legacy
  format?: BlockContentFormat;
}
