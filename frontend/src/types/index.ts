export interface User {
  _id: string;
  username: string;
  email: string;
  avatar?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface Group {
  _id: string;
  title: string;
  description?: string;
  members: GroupMember[];
  tasks: Task[];
  createdAt: string;
  updatedAt: string;
}

export interface GroupMember {
  user: User;
  role: 'creator' | 'admin' | 'member';
}

export interface Task {
  _id: string;
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  assignedTo?: User;
  group: string;
  attachments?: string[];
  createdAt: string;
  updatedAt: string;
}
