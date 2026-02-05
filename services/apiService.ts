/**
 * API Service para comunicação com o backend
 * Base URL: https://b44f-2c0f-f888-a180-946c-8939-147d-5111-65ca.ngrok-free.app/
 */

// Base URL configurable via Vite env `VITE_API_BASE_URL`.
// Default points to current ngrok; backend does NOT include `/api` prefix.
const RAW_BASE = (typeof process !== 'undefined' && (process as any).env && (process as any).env.VITE_API_BASE_URL) || (typeof window !== 'undefined' && (window as any).VITE_API_BASE_URL) || 'https://b44f-2c0f-f888-a180-946c-8939-147d-5111-65ca.ngrok-free.app';
const API_BASE = RAW_BASE.replace(/\/$/, '');

// Tipo para armazenar token de autenticação
let authToken: string | null = null;

export const setAuthToken = (token: string | null) => {
  authToken = token;
  if (token) {
    sessionStorage.setItem('gestora_api_token', token);
  } else {
    sessionStorage.removeItem('gestora_api_token');
  }
};

export const getAuthToken = () => {
  if (!authToken) {
    authToken = sessionStorage.getItem('gestora_api_token');
  }
  return authToken;
};

const getHeaders = () => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  const token = getAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

const handleResponse = async (response: Response) => {
  let data: any;
  try {
    data = await response.json();
  } catch (e) {
    // Se não conseguir fazer parse do JSON
    if (!response.ok) {
      throw new Error(`Erro HTTP ${response.status}`);
    }
    return { success: true, status: response.status };
  }

  if (!response.ok) {
    throw new Error(data.message || data.error || `Erro HTTP ${response.status}`);
  }
  return data;
};

// ============ AUTENTICAÇÃO ============
export const apiAuth = {
  login: async (email: string, password?: string) => {
    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password: password || '' }),
      });
      const data = await handleResponse(response);
      // A API pode retornar 'token' ou 'jwt'
      if (data.token) {
        setAuthToken(data.token);
      } else if (data.jwt) {
        setAuthToken(data.jwt);
      }
      return data;
    } catch (error: any) {
      throw new Error(error.message || 'Erro ao fazer login');
    }
  },

  logout: async () => {
    setAuthToken(null);
    return { success: true };
  },

  register: async (email: string, name: string, password?: string) => {
    try {
      const response = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, name, password: password || '' }),
      });
      const data = await handleResponse(response);
      if (data.token) {
        setAuthToken(data.token);
      } else if (data.jwt) {
        setAuthToken(data.jwt);
      }
      return data;
    } catch (error: any) {
      throw new Error(error.message || 'Erro ao registrar');
    }
  },

  setPassword: async (token: string, password: string) => {
    try {
      const response = await fetch(`${API_BASE}/auth/set-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, password }),
      });
      return await handleResponse(response);
    } catch (error: any) {
      throw new Error(error.message || 'Erro ao definir senha');
    }
  },

  getCurrentUser: async () => {
    const response = await fetch(`${API_BASE}/auth/eu`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return handleResponse(response);
  },
};

// ============ TAREFAS ============
export const apiTasks = {
  getAll: async () => {
    const response = await fetch(`${API_BASE}/tasks`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  getById: async (id: string) => {
    const response = await fetch(`${API_BASE}/tasks/${id}`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  create: async (taskData: any) => {
    const response = await fetch(`${API_BASE}/tasks`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(taskData),
    });
    return handleResponse(response);
  },

  update: async (id: string, taskData: any) => {
    const response = await fetch(`${API_BASE}/tasks/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(taskData),
    });
    return handleResponse(response);
  },

  delete: async (id: string) => {
    const response = await fetch(`${API_BASE}/tasks/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  updateStatus: async (id: string, status: string) => {
    const response = await fetch(`${API_BASE}/tasks/${id}/status`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ status }),
    });
    return handleResponse(response);
  },
};

// ============ UTILIZADORES ============
export const apiUsers = {
  getAll: async () => {
    const response = await fetch(`${API_BASE}/admin/users`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  getById: async (id: string) => {
    const response = await fetch(`${API_BASE}/admin/users/${id}`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  create: async (userData: any) => {
    const response = await fetch(`${API_BASE}/admin/users`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(userData),
    });
    return handleResponse(response);
  },

  update: async (id: string, userData: any) => {
    const response = await fetch(`${API_BASE}/admin/users/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(userData),
    });
    return handleResponse(response);
  },

  delete: async (id: string) => {
    const response = await fetch(`${API_BASE}/admin/users/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  updateAvatar: async (id: string, avatarData: string) => {
    const response = await fetch(`${API_BASE}/users/${id}/profile`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ avatar: avatarData }),
    });
    return handleResponse(response);
  },
};

// ============ COMENTÁRIOS ============
export const apiComments = {
  getByTaskId: async (taskId: string) => {
    const response = await fetch(`${API_BASE}/tasks/${taskId}/comments`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  create: async (taskId: string, text: string) => {
    const response = await fetch(`${API_BASE}/tasks/${taskId}/comments`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ text }),
    });
    return handleResponse(response);
  },

  delete: async (taskId: string, commentId: string) => {
    const response = await fetch(`${API_BASE}/tasks/${taskId}/comments/${commentId}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return handleResponse(response);
  },
};

// ============ ATIVIDADES DO SISTEMA ============
export const apiActivities = {
  getAll: async () => {
    const response = await fetch(`${API_BASE}/activities`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  getByTaskId: async (taskId: string) => {
    const response = await fetch(`${API_BASE}/activities/task/${taskId}`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return handleResponse(response);
  },
};

// ============ NOTIFICAÇÕES ============
export const apiNotifications = {
  getAll: async () => {
    const response = await fetch(`${API_BASE}/notifications`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  markAsRead: async (notificationId: string) => {
    const response = await fetch(`${API_BASE}/notifications/${notificationId}/read`, {
      method: 'PATCH',
      headers: getHeaders(),
    });
    return handleResponse(response);
  },
};

// ============ DASHBOARD / RELATÓRIOS ============
export const apiReports = {
  getStats: async () => {
    const response = await fetch(`${API_BASE}/reports/stats`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  getUserPerformance: async () => {
    const response = await fetch(`${API_BASE}/reports/user-performance`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  getTaskStats: async () => {
    const response = await fetch(`${API_BASE}/reports/task-stats`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return handleResponse(response);
  },
};

// ============ HEALTH / PING ============
export const apiHealth = {
  ping: async () => {
    const response = await fetch(`${API_BASE}/actuator/health`, {
      method: 'GET',
      headers: getHeaders(),
    });
    // actuator may return non-JSON text on some setups — guard with try/catch
    try {
      return await handleResponse(response);
    } catch (e) {
      // if actuator returns non-JSON but 200, return status text
      if (response.ok) return { status: 'UP' };
      throw e;
    }
  },
  pingSimple: async () => {
    const response = await fetch(`${API_BASE}/ping`, { method: 'GET', headers: getHeaders() });
    if (!response.ok) throw new Error(`Ping failed ${response.status}`);
    return response.text();
  },
};
// ============ MAPPERS / TRANSFORMADORES ============
/**
 * Mapear resposta de utilizador da API para o formato da aplicação
 */
export const mapUserFromAPI = (apiUser: any) => {
  return {
    id: String(apiUser.id),
    email: apiUser.email || '',
    name: apiUser.name || apiUser.username || 'Utilizador',
    role: apiUser.role || 'EMPLOYEE',
    avatar: apiUser.avatar || null,
    lastLogin: apiUser.lastLogin || null,
    createdAt: apiUser.createdAt || new Date().toISOString(),
    updatedAt: apiUser.updatedAt || new Date().toISOString(),
  };
};

/**
 * Mapear resposta de tarefa da API para o formato da aplicação
 */
export const mapTaskFromAPI = (apiTask: any) => {
  return {
    id: String(apiTask.id),
    title: apiTask.title || '',
    description: apiTask.description || '',
    status: apiTask.status || 'PENDENTE',
    priority: apiTask.priority || 'MEDIA',
    responsibleId: String(apiTask.responsibleId || apiTask.userId || ''),
    responsibleName: apiTask.responsibleName || apiTask.userName || '',
    deliveryDate: apiTask.deliveryDate || new Date().toISOString(),
    startDate: apiTask.startDate || new Date().toISOString(),
    intervenientes: Array.isArray(apiTask.intervenientes) ? apiTask.intervenientes.map(String) : [],
    comments: Array.isArray(apiTask.comments) ? apiTask.comments : [],
    attachments: Array.isArray(apiTask.attachments) ? apiTask.attachments : [],
    createdAt: apiTask.createdAt || new Date().toISOString(),
    updatedAt: apiTask.updatedAt || new Date().toISOString(),
    closedAt: apiTask.closedAt || null,
  };
};

/**
 * Mapear resposta de comentário da API para o formato da aplicação
 */
export const mapCommentFromAPI = (apiComment: any) => {
  return {
    id: String(apiComment.id),
    userId: String(apiComment.userId || ''),
    userName: apiComment.userName || 'Utilizador',
    text: apiComment.text || '',
    timestamp: apiComment.timestamp || apiComment.createdAt || new Date().toISOString(),
  };
};
