// apiService.ts

/**
 * API Service para comunicação com o backend
 * Base URL via Vite env:
 *   VITE_API_BASE_URL="https://seu-backend.com"
 */

type Json = Record<string, any>;

function getApiBase(): string {
  const viteBase =
    (typeof import.meta !== "undefined" &&
      (import.meta as any).env &&
      ((import.meta as any).env.VITE_API_BASE_URL as string)) ||
    "";

  const winBase =
    (typeof window !== "undefined" && (window as any).VITE_API_BASE_URL) || "";

  const base = viteBase || winBase || "https://b44f-2c0f-f888-a180-946c-8939-147d-5111-65ca.ngrok-free.app";
  return String(base).replace(/\/$/, "");
}

const API_BASE = getApiBase();

// =================== AUTH TOKEN ===================
let authToken: string | null = null;

export const setAuthToken = (token: string | null) => {
  authToken = token;
  if (token) sessionStorage.setItem("gestora_api_token", token);
  else sessionStorage.removeItem("gestora_api_token");
};

export const getAuthToken = () => {
  if (!authToken) authToken = sessionStorage.getItem("gestora_api_token");
  return authToken;
};

const getHeaders = (): HeadersInit => {
  const headers: HeadersInit = { "Content-Type": "application/json" };
  const token = getAuthToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
};

// =================== RESPONSE HANDLER ===================
async function handleResponse(res: Response) {
  const contentType = res.headers.get("content-type") || "";
  const raw = await res.text();

  let data: any = raw;
  if (raw && contentType.includes("application/json")) {
    try {
      data = JSON.parse(raw);
    } catch {
      data = raw; // JSON inválido
    }
  } else {
    // tenta parse mesmo se vier JSON com content-type errado
    try {
      data = raw ? JSON.parse(raw) : null;
    } catch {
      data = raw || null;
    }
  }

  if (!res.ok) {
    // tenta extrair mensagem padrão
    const msg =
      (data && (data.message || data.error || data.detail)) ||
      (typeof data === "string" ? data : "") ||
      res.statusText ||
      `HTTP ${res.status}`;

    console.error("API error", {
      url: res.url,
      status: res.status,
      body: data,
    });

    throw new Error(msg);
  }

  return data;
}

// =================== AUTH ===================
export const apiAuth = {
  login: async (email: string, password?: string) => {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: password || "" }),
    });

    const data = await handleResponse(response);

    if (data?.token) setAuthToken(data.token);
    else if (data?.jwt) setAuthToken(data.jwt);

    return data;
  },

  logout: async () => {
    setAuthToken(null);
    return { success: true };
  },

  register: async (email: string, name: string, password?: string) => {
    const response = await fetch(`${API_BASE}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, name, password: password || "" }),
    });

    const data = await handleResponse(response);

    if (data?.token) setAuthToken(data.token);
    else if (data?.jwt) setAuthToken(data.jwt);

    return data;
  },

  setPassword: async (token: string, password: string) => {
    const response = await fetch(`${API_BASE}/auth/set-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });
    return handleResponse(response);
  },

  getCurrentUser: async () => {
    const tryFetch = async (path: string) => {
      const res = await fetch(`${API_BASE}${path}`, { method: "GET", headers: getHeaders() });
      if (res.status === 404) return null;
      return handleResponse(res);
    };

    return (await tryFetch("/auth/eu")) || (await tryFetch("/auth/me"));
  },
};

// =================== TASKS ===================
export const apiTasks = {
  getAll: async () => {
    const res = await fetch(`${API_BASE}/tasks`, { method: "GET", headers: getHeaders() });
    return handleResponse(res);
  },

  getById: async (id: string) => {
    const res = await fetch(`${API_BASE}/tasks/${id}`, { method: "GET", headers: getHeaders() });
    return handleResponse(res);
  },

  create: async (taskData: any) => {
    const res = await fetch(`${API_BASE}/tasks`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(taskData),
    });
    return handleResponse(res);
  },

  update: async (id: string, taskData: any) => {
    const res = await fetch(`${API_BASE}/tasks/${id}`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify(taskData),
    });
    return handleResponse(res);
  },

  delete: async (id: string) => {
    const res = await fetch(`${API_BASE}/tasks/${id}`, { method: "DELETE", headers: getHeaders() });
    return handleResponse(res);
  },

  updateStatus: async (id: string, status: string) => {
    const res = await fetch(`${API_BASE}/tasks/${id}/status`, {
      method: "PATCH",
      headers: getHeaders(),
      body: JSON.stringify({ status }),
    });
    return handleResponse(res);
  },
};

// =================== USERS ===================
export const apiUsers = {
  getAll: async () => {
    const res = await fetch(`${API_BASE}/admin/users`, { method: "GET", headers: getHeaders() });
    return handleResponse(res);
  },

  getById: async (id: string) => {
    const res = await fetch(`${API_BASE}/admin/users/${id}`, { method: "GET", headers: getHeaders() });
    return handleResponse(res);
  },

  create: async (userData: any) => {
    const res = await fetch(`${API_BASE}/admin/users`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(userData),
    });
    return handleResponse(res);
  },

  update: async (id: string, userData: any) => {
    const res = await fetch(`${API_BASE}/admin/users/${id}`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify(userData),
    });
    return handleResponse(res);
  },

  delete: async (id: string) => {
    const res = await fetch(`${API_BASE}/admin/users/${id}`, { method: "DELETE", headers: getHeaders() });
    return handleResponse(res);
  },

  updateAvatar: async (id: string, avatarData: string) => {
    const res = await fetch(`${API_BASE}/users/${id}/profile`, {
      method: "PATCH",
      headers: getHeaders(),
      body: JSON.stringify({ avatar: avatarData }),
    });
    return handleResponse(res);
  },

  changePassword: async (id: string, password: string) => {
    const res = await fetch(`${API_BASE}/users/${id}/senha`, {
      method: "PATCH",
      headers: getHeaders(),
      body: JSON.stringify({ password }),
    });
    return handleResponse(res);
  },
};

// =================== COMMENTS ===================
export const apiComments = {
  getByTaskId: async (taskId: string) => {
    const res = await fetch(`${API_BASE}/tasks/${taskId}/comments`, { method: "GET", headers: getHeaders() });
    return handleResponse(res);
  },

  create: async (taskId: string, text: string) => {
    const res = await fetch(`${API_BASE}/tasks/${taskId}/comments`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ text }),
    });
    return handleResponse(res);
  },

  delete: async (taskId: string, commentId: string) => {
    const res = await fetch(`${API_BASE}/tasks/${taskId}/comments/${commentId}`, {
      method: "DELETE",
      headers: getHeaders(),
    });
    return handleResponse(res);
  },
};

// =================== ACTIVITIES ===================
export const apiActivities = {
  getAll: async () => {
    const res = await fetch(`${API_BASE}/activities`, { method: "GET", headers: getHeaders() });
    return handleResponse(res);
  },

  getByTaskId: async (taskId: string) => {
    const res = await fetch(`${API_BASE}/activities/task/${taskId}`, { method: "GET", headers: getHeaders() });
    return handleResponse(res);
  },
};

// =================== NOTIFICATIONS ===================
export const apiNotifications = {
  getAll: async () => {
    const res = await fetch(`${API_BASE}/notifications`, { method: "GET", headers: getHeaders() });
    return handleResponse(res);
  },

  markAsRead: async (notificationId: string) => {
    const res = await fetch(`${API_BASE}/notifications/${notificationId}/read`, {
      method: "PATCH",
      headers: getHeaders(),
    });
    return handleResponse(res);
  },
};

// =================== REPORTS ===================
export const apiReports = {
  getStats: async () => {
    const res = await fetch(`${API_BASE}/reports/stats`, { method: "GET", headers: getHeaders() });
    return handleResponse(res);
  },

  getUserPerformance: async () => {
    const res = await fetch(`${API_BASE}/reports/user-performance`, { method: "GET", headers: getHeaders() });
    return handleResponse(res);
  },

  getTaskStats: async () => {
    const res = await fetch(`${API_BASE}/reports/task-stats`, { method: "GET", headers: getHeaders() });
    return handleResponse(res);
  },
};

// =================== HEALTH ===================
export const apiHealth = {
  ping: async () => {
    const res = await fetch(`${API_BASE}/actuator/health`, { method: "GET", headers: getHeaders() });

    // pode vir JSON, texto, etc
    if (!res.ok) throw new Error(`Health failed ${res.status}`);
    const txt = await res.text();
    try {
      return txt ? JSON.parse(txt) : { status: "UP" };
    } catch {
      return { status: "UP", raw: txt };
    }
  },

  pingSimple: async () => {
    const res = await fetch(`${API_BASE}/ping`, { method: "GET", headers: getHeaders() });
    if (!res.ok) throw new Error(`Ping failed ${res.status}`);
    return res.text();
  },
};

// =================== MAPPERS ===================
export const mapUserFromAPI = (apiUser: any) => {
  return {
    id: String(apiUser.id),
    email: apiUser.email || "",
    name: apiUser.name || apiUser.username || "Utilizador",
    role: apiUser.role || "EMPLOYEE",
    avatar: apiUser.avatar || null,
    mustChangePassword: apiUser.mustChangePassword ?? apiUser.must_change_password ?? false,
    lastLogin: apiUser.lastLogin || null,
    createdAt: apiUser.createdAt || new Date().toISOString(),
    updatedAt: apiUser.updatedAt || new Date().toISOString(),
  };
};

export const mapTaskFromAPI = (apiTask: any) => {
  return {
    id: String(apiTask.id),
    title: apiTask.title || "",
    description: apiTask.description || "",
    status: apiTask.status || "PENDENTE",
    priority: apiTask.priority || "MEDIA",
    responsibleId: String(apiTask.responsibleId || apiTask.userId || ""),
    responsibleName: apiTask.responsibleName || apiTask.userName || "",
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

export const mapCommentFromAPI = (apiComment: any) => {
  return {
    id: String(apiComment.id),
    userId: String(apiComment.userId || ""),
    userName: apiComment.userName || "Utilizador",
    text: apiComment.text || "",
    timestamp: apiComment.timestamp || apiComment.createdAt || new Date().toISOString(),
  };
};
