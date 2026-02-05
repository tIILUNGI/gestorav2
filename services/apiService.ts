 // apiService.ts

/**
 * API Service para comunicação com o backend ILUNGI GESTORA API
 * Base URL: https://ilungi-gestora-api-oox9.onrender.com
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

  const base = viteBase || winBase || "https://ilungi-gestora-api-oox9.onrender.com";
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
function generateTempPassword(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$!';
  let password = '';
  const randomValues = new Uint32Array(12);
  window.crypto.getRandomValues(randomValues);
  for (let i = 0; i < 12; i++) {
    password += chars[randomValues[i] % chars.length];
  }
  return password;
}

async function handleResponse(res: Response) {
  const contentType = res.headers.get("content-type") || "";
  const raw = await res.text();

  let data: any = raw;
  if (raw && (contentType.includes("application/json") || raw.startsWith("{"))) {
    try {
      data = JSON.parse(raw);
    } catch {
      data = raw;
    }
  } else {
    try {
      data = raw ? JSON.parse(raw) : null;
    } catch {
      data = raw || null;
    }
  }

  if (!res.ok) {
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

  register: async (email: string, name: string, password?: string, phone?: string) => {
    const response = await fetch(`${API_BASE}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        email, 
        name, 
        password: password || "",
        phone: phone || ""
      }),
    });

    const data = await handleResponse(response);

    if (data?.token) setAuthToken(data.token);
    else if (data?.jwt) setAuthToken(data.jwt);

    return data;
  },

  getCurrentUser: async () => {
    const res = await fetch(`${API_BASE}/auth/me`, { method: "GET", headers: getHeaders() });
    if (res.status === 404 || res.status === 401) return null;
    return handleResponse(res);
  },
};

// =================== TASKS (USER) ===================
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

  // Minhas tarefas
  getMyTasks: async () => {
    const res = await fetch(`${API_BASE}/tasks/my-tasks`, { method: "GET", headers: getHeaders() });
    return handleResponse(res);
  },

  // Minhas estatísticas
  getMyStats: async () => {
    const res = await fetch(`${API_BASE}/tasks/my-stats`, { method: "GET", headers: getHeaders() });
    return handleResponse(res);
  },
};

// =================== ADMIN TASKS ===================
export const apiAdminTasks = {
  getAll: async () => {
    const res = await fetch(`${API_BASE}/admin/tasks`, { method: "GET", headers: getHeaders() });
    return handleResponse(res);
  },

  getByUserId: async (userId: string) => {
    const res = await fetch(`${API_BASE}/admin/tasks/user/${userId}`, { method: "GET", headers: getHeaders() });
    return handleResponse(res);
  },

  assignUser: async (taskId: string, userId: string) => {
    const res = await fetch(`${API_BASE}/admin/tasks/${taskId}/assign/${userId}`, { 
      method: "PATCH", 
      headers: getHeaders() 
    });
    return handleResponse(res);
  },
};

// =================== ADMIN USERS ===================
export const apiAdminUsers = {
  getAll: async () => {
    const res = await fetch(`${API_BASE}/admin/users`, { method: "GET", headers: getHeaders() });
    return handleResponse(res);
  },

  getById: async (id: string) => {
    const res = await fetch(`${API_BASE}/admin/users/${id}`, { method: "GET", headers: getHeaders() });
    return handleResponse(res);
  },

  getByRole: async (role: string) => {
    const res = await fetch(`${API_BASE}/admin/users/by-role/${role}`, { method: "GET", headers: getHeaders() });
    return handleResponse(res);
  },

  create: async (data: { name: string; email: string; phone?: string; role?: string; tempPassword?: string }) => {
    // O backend gera a senha automaticamente, não precisamos enviar
    // Mas podemos enviar phone e role
    const response = await fetch(`${API_BASE}/admin/users`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({
        name: data.name,
        email: data.email,
        phone: data.phone || "",
        role: data.role || "USER"
      }),
    });
    return handleResponse(response);
  },

  update: async (id: string, data: { name?: string; phone?: string; role?: string }) => {
    const response = await fetch(`${API_BASE}/admin/users/${id}`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  delete: async (id: string) => {
    const res = await fetch(`${API_BASE}/admin/users/${id}`, { method: "DELETE", headers: getHeaders() });
    return handleResponse(res);
  },

  changeRole: async (id: string, role: string) => {
    const res = await fetch(`${API_BASE}/admin/users/${id}/role`, { 
      method: "PATCH", 
      headers: getHeaders(),
      body: JSON.stringify({ role }),
    });
    return handleResponse(res);
  },
};

// =================== ADMIN STATS & DASHBOARD ===================
export const apiAdmin = {
  getStats: async () => {
    const res = await fetch(`${API_BASE}/admin/stats`, { method: "GET", headers: getHeaders() });
    return handleResponse(res);
  },

  getDashboard: async () => {
    const res = await fetch(`${API_BASE}/admin/dashboard`, { method: "GET", headers: getHeaders() });
    return handleResponse(res);
  },
};

// =================== USER SELF-SERVICE ===================
export const apiUsers = {
  update: async (id: string, data: { name?: string; phone?: string; email?: string }) => {
    const res = await fetch(`${API_BASE}/users/${id}`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  delete: async (id: string) => {
    const res = await fetch(`${API_BASE}/users/${id}`, { method: "DELETE", headers: getHeaders() });
    return handleResponse(res);
  },

  changeRole: async (id: string, role: string) => {
    const res = await fetch(`${API_BASE}/users/${id}/role`, { 
      method: "PATCH", 
      headers: getHeaders(),
      body: JSON.stringify({ role }),
    });
    return handleResponse(res);
  },

  updateProfile: async (id: string, data: { name?: string; phone?: string }) => {
    const res = await fetch(`${API_BASE}/users/${id}/profile`, {
      method: "PATCH",
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  changePassword: async (id: string, password: string, oldPassword?: string) => {
    const res = await fetch(`${API_BASE}/users/${id}/password`, {
      method: "PATCH",
      headers: getHeaders(),
      body: JSON.stringify({ password, oldPassword }),
    });
    return handleResponse(res);
  },

  getByRole: async (role: string) => {
    const res = await fetch(`${API_BASE}/users/by-role/${role}`, { method: "GET", headers: getHeaders() });
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

// =================== MAPPERS ===================
export const mapUserFromAPI = (apiUser: any) => {
  return {
    id: String(apiUser.id),
    email: apiUser.email || "",
    name: apiUser.name || apiUser.username || "Utilizador",
    phone: apiUser.phone || null,
    role: apiUser.role || "USER",
    avatar: apiUser.avatar || null,
    mustChangePassword: apiUser.mustChangePassword ?? false,
    createdAt: apiUser.createdAt || new Date().toISOString(),
    updatedAt: apiUser.updatedAt || new Date().toISOString(),
  };
};

export const mapTaskFromAPI = (apiTask: any) => {
  return {
    id: String(apiTask.id),
    title: apiTask.title || "",
    description: apiTask.description || "",
    status: apiTask.status || "PENDING",
    priority: apiTask.priority || "MEDIUM",
    responsibleId: String(apiTask.responsibleId || apiTask.userId || ""),
    responsibleName: apiTask.responsibleName || apiTask.userName || "",
    deliveryDate: apiTask.deliveryDate || apiTask.dueDate || new Date().toISOString(),
    startDate: apiTask.startDate || new Date().toISOString(),
    intervenientes: Array.isArray(apiTask.intervenientes) ? apiTask.intervenientes : [],
    comments: Array.isArray(apiTask.comments) ? apiTask.comments : [],
    createdAt: apiTask.createdAt || new Date().toISOString(),
    updatedAt: apiTask.updatedAt || new Date().toISOString(),
  };
};

export const mapCommentFromAPI = (apiComment: any) => {
  return {
    id: String(apiComment.id),
    userId: String(apiComment.userId || ""),
    userName: apiComment.userName || "Utilizador",
    text: apiComment.text || apiComment.content || "",
    timestamp: apiComment.timestamp || apiComment.createdAt || new Date().toISOString(),
  };
};

// =================== DEFAULT EXPORT ===================
export default {
  apiAuth,
  apiTasks,
  apiUsers,
  apiComments,
  apiAdminUsers,
  apiAdminTasks,
  apiAdmin,
};
