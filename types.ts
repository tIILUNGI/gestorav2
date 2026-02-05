
export enum UserRole {
  ADMIN = 'ADMIN',
  EMPLOYEE = 'EMPLOYEE'
}

export enum TaskStatus {
  ABERTO = 'Aberto',
  POR_INICIAR = 'Para começar',
  EM_PROGRESSO = 'Em Progresso',
  TERMINADO = 'Finalizado',
  FECHADO = 'Fechado',
  ATRASADA = 'Entrega Atrasada'
}

export const StatusOrder = [
  TaskStatus.ABERTO,
  TaskStatus.POR_INICIAR,
  TaskStatus.EM_PROGRESSO,
  TaskStatus.TERMINADO,
  TaskStatus.FECHADO
];

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  position?: string;
  department?: string;
  mustChangePassword?: boolean;
  localPassword?: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  startDate: string;
  deadlineValue: number;
  deadlineType: 'days' | 'hours';
  deliveryDate: string;
  responsibleId: string;
  intervenientes: string[];
  status: TaskStatus;
  createdAt: string;
  updatedAt: string;
  closedAt?: string;
  validatedAt?: string;
  reopenedAt?: string;
  comments?: Comment[];
}

export interface Notification {
  id: string;
  userId: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  timestamp: string;
  isRead: boolean;
  taskId?: string;
}

export interface TaskValidation {
  taskId: string;
  validatedBy: string;
  validatedAt: string;
  feedback?: string;
}

export interface UserProfile extends User {
  createdAt?: string;
  isActive?: boolean;
  lastLogin?: string;
}

export interface TaskStatistics {
  totalTasks: number;
  activeTasks: number;
  completedTasks: number;
  overdueTasks: number;
  tasksByStatus: Record<TaskStatus, number>;
  tasksByUser: Record<string, number>;
  averageCompletionTime: number;
  delayRate: number;
}

export interface UserPerformance {
  userId: string;
  userName: string;
  completedTasks: number;
  activeTasks: number;
  overdueTasks: number;
  averageDelay: number;
  completionRate: number;
}

export interface SystemActivity {
  id: string;
  userId: string;
  userName: string;
  action: 'created' | 'updated' | 'deleted' | 'status_changed' | 'commented';
  entityType: 'task';
  entityId: string;
  entityTitle?: string;
  fromStatus?: string;
  toStatus?: string;
  timestamp: string;
}

export interface Comment {
  id: string;
  userId: string;
  userName: string;
  text: string;
  timestamp: string;
}

export type Language = 'pt' | 'en';
export type Theme = 'light' | 'dark';
