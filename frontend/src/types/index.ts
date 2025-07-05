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
}

export interface Block {
  id: number;
  type: string;
  content: string;
  documentId: number;
  order: number;
  createdAt: string;
  updatedAt: string;
}
