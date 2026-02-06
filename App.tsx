
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  User, 
  UserRole, 
  Task, 
  TaskStatus, 
  Notification, 
  Language, 
  Theme,
  StatusOrder,
  SystemActivity 
} from './types';
import { MOCK_USERS, TRANSLATIONS, STATUS_COLORS, INITIAL_TASKS } from './constants';
import { getSmartNotification } from './services/geminiService';
import { setAuthToken, apiAuth, apiTasks, apiUsers, apiComments, apiAdminUsers, apiAdmin, apiAdminTasks, mapTaskFromAPI, mapUserFromAPI, mapCommentFromAPI } from './services/apiService';
import { logger } from './services/logger';
import { 
  LayoutDashboard, 
  CheckSquare, 
  Users, 
  LogOut, 
  Bell, 
  Plus, 
  Search, 
  Calendar, 
  CheckCircle2,
  X,
  Trash2,
  ChevronLeft,
  ArrowRight,
  Lock,
  ChevronLeftCircle,
  Workflow, 
  Sun,
  Moon,
  AlertTriangle,
  BarChart2,
  Check,
  Layers,
  ClipboardList,
  ShieldCheck,
  Mail,
  ArrowUpRight,
  Pencil,
  Menu,
  User as UserIcon,
  UserPlus
} from 'lucide-react';

// --- Shared UI Components ---
const Button = ({ children, onClick, variant = 'primary', className = '', type = 'button', disabled = false }: any) => {
  const variants: any = {
    primary: 'bg-[#10b981] hover:bg-[#059669] text-white shadow-xl shadow-emerald-500/20',
    secondary: 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50',
    outline: 'bg-transparent border-2 border-[#10b981] text-[#10b981] hover:bg-emerald-50',
    danger: 'bg-rose-500 hover:bg-rose-600 text-white',
    ghost: 'bg-transparent text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
  };
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`px-8 py-4 rounded-2xl font-bold text-[14px] transition-all flex items-center justify-center gap-3 disabled:opacity-50 ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
};

export default function App() {
  const [view, setView] = useState<'landing' | 'login' | 'app' | 'set-password' | 'force-password' | 'reset-password'>('login');
  const [user, setUser] = useState<User | null>(null);
  const [inviteToken, setInviteToken] = useState<string | null>(null);
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [lang, setLang] = useState<Language>('pt');
  const [theme, setTheme] = useState<Theme>('light');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [profilePassword, setProfilePassword] = useState('');
  const [profilePasswordConfirm, setProfilePasswordConfirm] = useState('');
  const [profilePasswordError, setProfilePasswordError] = useState<string | null>(null);
  const [profilePasswordSuccess, setProfilePasswordSuccess] = useState<string | null>(null);
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isNotificationsOpen, setNotificationsOpen] = useState(false);
  
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [systemActivities, setSystemActivities] = useState<SystemActivity[]>([]);
  const [taskFormDeliveryPreview, setTaskFormDeliveryPreview] = useState('');
  const [isAppSidebarOpen, setAppSidebarOpen] = useState(false);
  const [uploadingAvatarFor, setUploadingAvatarFor] = useState<string | null>(null);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [taskFormError, setTaskFormError] = useState<string | null>(null);
  const [userFormError, setUserFormError] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const t = TRANSLATIONS[lang];
  const setActiveTabSafe = (tab: string) => {
    if (user?.mustChangePassword && tab !== 'profile') {
      setActiveTab('profile');
      return;
    }
    setActiveTab(tab);
  };
  const visibleActivities = useMemo(() => {
    if (!user) return [];
    if (user.role === UserRole.ADMIN) return systemActivities;
    const myTaskIds = new Set(
      tasks
        .filter(t => t.responsibleId === user.id || t.intervenientes?.includes(user.id))
        .map(t => t.id)
    );
    return systemActivities.filter(a => myTaskIds.has(a.entityId));
  }, [systemActivities, tasks, user]);
  const lastNotificationRef = useRef<Map<string, number>>(new Map());
  const getAuthErrorMessage = (err: any) => {
    const msg = (err?.message || '').toLowerCase();
    if (
      msg.includes('bad credentials') ||
      msg.includes('unauthorized') ||
      msg.includes('forbidden') ||
      msg.includes('senha') ||
      msg.includes('password') ||
      msg.includes('credenciais')
    ) {
      return 'Email ou palavra-passe incorretos.';
    }
    return err?.message || 'Falha na autenticação com a API.';
  };

  useEffect(() => {
    // Inicializar com arrays vazios - dados vêm da API
    const savedTasks: Task[] = [];
    const savedUsers: User[] = [];
    const savedActivitiesRaw: SystemActivity[] = [];
    
    // Limpar localStorage de dados antigos
    localStorage.removeItem('gestora_tasks');
    localStorage.removeItem('gestora_users');
    
    const dedupeActivities = (list: SystemActivity[]) => {
      const seen = new Set<string>();
      return list.filter(a => {
        const key = `${a.userId}|${a.action}|${a.entityId}|${a.fromStatus || ''}|${a.toStatus || ''}|${a.timestamp || ''}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    };
    const savedActivities = dedupeActivities(savedActivitiesRaw);
    setTasks([]);
    setUsers([]);
    setSystemActivities([]);
    localStorage.setItem('gestora_activities', JSON.stringify(savedActivities));
    
    // Restaurar token de autenticação
    const savedToken = sessionStorage.getItem('gestora_api_token');
    if (savedToken) {
      setAuthToken(savedToken);
    } else {
      setAuthToken(null);
    }

    const invite = new URLSearchParams(window.location.search).get('invite');
    if (invite) {
      setInviteToken(invite);
      setUser(null);
      setView('set-password');
      return;
    }
    
    // Verificar token de reset de senha
    const reset = new URLSearchParams(window.location.search).get('token');
    if (reset) {
      setResetToken(reset);
      setUser(null);
      setView('reset-password');
      // Limpar a URL
      const cleanUrl = window.location.origin + window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);
      return;
    }

    if (savedToken) {
      (async () => {
        try {
          const apiUser = await apiAuth.getCurrentUser();
          if (!apiUser) {
            setAuthToken(null);
            setUser(null);
            setView('login');
            return;
          }
          const normalizedUser = {
            ...apiUser,
            id: apiUser?.id ?? apiUser?.userId,
            email: apiUser?.email,
            name: apiUser?.name ?? apiUser?.username,
            role: apiUser?.role ?? UserRole.EMPLOYEE
          };
          const mapped = mapUserFromAPI(normalizedUser);
          setUser(mapped);
          // Sempre carregar dados da API após login
          await loadDataFromAPI(mapped);
          
          if (mapped.mustChangePassword) {
            setView('app');
            setActiveTab('profile');
          } else {
            setView('app');
          }
        } catch (error) {
          setAuthToken(null);
          setUser(null);
          setView('login');
        }
      })();
      return;
    }

    // Sem token: ir para login
    setUser(null);
    setView('login');
  }, []);


  const filterTasksForUser = (list: Task[], u?: User | null) => {
    if (!u || u.role !== UserRole.EMPLOYEE) return list;
    return list.filter(t => t.responsibleId === u.id || t.intervenientes?.includes(u.id));
  };

  const loadDataFromAPI = async (currentUser?: User | null) => {
    try {
      // Carregar tarefas da API para todos os utilizadores
      const tasksResponse = await apiTasks.getAll();
      if (tasksResponse) {
        const tasksList = Array.isArray(tasksResponse) ? tasksResponse : (tasksResponse.data || tasksResponse.tasks || []);
        const mappedTasks = tasksList.map((t: any) => mapTaskFromAPI(t));
        if (mappedTasks.length > 0) {
          const filtered = filterTasksForUser(mappedTasks, currentUser ?? user);
          saveTasks(filtered);
          logger.debug('API', 'Tarefas carregadas da API com sucesso', mappedTasks.length);
        } else {
          saveTasks([]);
        }
      } else {
        saveTasks([]);
      }
    } catch (error) {
      logger.debug('API', 'Não foi possível carregar tarefas da API', error);
      saveTasks([]);
    }

    // Carregar utilizadores da API (somente admin)
    if ((currentUser ?? user)?.role === UserRole.ADMIN) {
      try {
        const usersResponse = await apiAdminUsers.getAll();
        if (usersResponse) {
          const usersList = Array.isArray(usersResponse) ? usersResponse : (usersResponse.data || usersResponse.users || []);
          const mappedUsers = usersList.map((u: any) => mapUserFromAPI(u));
          if (mappedUsers.length > 0) {
            saveUsers(mappedUsers);
            logger.debug('API', 'Utilizadores carregados da API com sucesso', mappedUsers.length);
          } else {
            saveUsers([]);
          }
        } else {
          saveUsers([]);
        }
      } catch (error) {
        logger.debug('API', 'Não foi possível carregar utilizadores da API', error);
        saveUsers([]);
      }
    }
  };

  useEffect(() => {
    if (theme === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [theme]);

  useEffect(() => {
    if (editingTaskId) {
      const t = tasks.find(x => x.id === editingTaskId);
      if (t) setTaskFormDeliveryPreview(new Date(t.deliveryDate).toLocaleString('pt-PT', { dateStyle: 'short', timeStyle: 'short' }));
    } else setTaskFormDeliveryPreview('');
  }, [editingTaskId, tasks]);

  const saveTasks = (newTasks: Task[]) => {
    setTasks(newTasks);
    localStorage.setItem('gestora_tasks', JSON.stringify(newTasks));
  };

  const saveUsers = (newUsers: User[]) => {
    setUsers(newUsers);
    localStorage.setItem('gestora_users', JSON.stringify(newUsers));
  };

  const isLocalTaskId = (id: string) => id.toUpperCase().startsWith('T-');

  const addComment = async (taskId: string, text: string) => {
    if (!user) return;
    
    try {
      // Tentar enviar para API
      const response = await apiComments.create(taskId, text);
      if (response && response.id) {
        // Mapear e atualizar localmente com resposta da API
        const mappedComment = mapCommentFromAPI(response);
        const updatedTasks = tasks.map(t => t.id === taskId ? { ...t, comments: [...(t.comments || []), mappedComment], updatedAt: new Date().toISOString() } : t);
        saveTasks(updatedTasks);
        logger.debug('Comment', 'Comentário criado na API com sucesso');
        addSystemActivity({ userId: user.id, userName: user.name, action: 'commented', entityType: 'task', entityId: taskId, entityTitle: tasks.find(x => x.id === taskId)?.title });
        return;
      }
    } catch (apiError) {
      logger.warn('Comment', 'API comentário falhou, salvando localmente...', apiError);
    }
    
    // Fallback: salvar localmente se API falhar
    const comment = { id: 'C-' + Math.random().toString(36).substr(2, 6).toUpperCase(), userId: user.id, userName: user.name, text, timestamp: new Date().toISOString() };
    const updatedTasks = tasks.map(t => t.id === taskId ? { ...t, comments: [...(t.comments || []), comment], updatedAt: new Date().toISOString() } : t);
    saveTasks(updatedTasks);
    addSystemActivity({ userId: user.id, userName: user.name, action: 'commented', entityType: 'task', entityId: taskId, entityTitle: tasks.find(x => x.id === taskId)?.title });
  };

  const handleDeleteTask = async (task: Task) => {
    if (!window.confirm(`Deseja eliminar a tarefa "${task.title}"? Esta ação não pode ser desfeita.`)) {
      return;
    }
    addSystemActivity({ userId: user!.id, userName: user!.name, action: 'deleted', entityType: 'task', entityId: task.id, entityTitle: task.title });
    
    try {
      // Tentar deletar na API apenas se não for tarefa local
      if (!isLocalTaskId(task.id)) {
        await apiTasks.delete(task.id);
      }
    } catch (apiError) {
      logger.warn('Task', 'Erro ao deletar na API, deletando localmente...', apiError);
      addNotification(user!.id, 'Não foi possível eliminar na API. Removida localmente.', 'error');
    }
    
    saveTasks(tasks.filter(t => t.id !== task.id));
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm('Tem certeza que deseja eliminar este utilizador? Esta ação não pode ser desfeita.')) {
      return;
    }
    
    const userToDelete = users.find(u => u.id === userId);
    if (!userToDelete) return;
    
    try {
      // Tentar deletar na API
      await apiAdminUsers.delete(userId);
      logger.debug('User', 'Utilizador eliminado na API', userId);
      addNotification(user!.id, `Utilizador ${userToDelete.name} eliminado com sucesso.`, 'success');
    } catch (apiError) {
      logger.warn('User', 'Erro ao eliminar na API, eliminando localmente...', apiError);
      addNotification(user!.id, `Não foi possível eliminar ${userToDelete.name} na API. Removido localmente.`, 'error');
    }
    
    // Sempre remove localmente também
    saveUsers(users.filter(u => u.id !== userId));
  };

  const recalcDelivery = (form: HTMLFormElement) => {
    const start = (form?.elements.namedItem('startDate') as HTMLInputElement)?.value;
    const val = (form?.elements.namedItem('deadlineValue') as HTMLInputElement)?.value;
    const type = (form?.elements.namedItem('deadlineType') as HTMLSelectElement)?.value;
    if (start && val && type) {
      const d = new Date(start);
      if (type === 'days') d.setDate(d.getDate() + Number(val));
      else d.setHours(d.getHours() + Number(val));
      setTaskFormDeliveryPreview(d.toLocaleString('pt-PT', { dateStyle: 'short', timeStyle: 'short' }));
    } else setTaskFormDeliveryPreview('');
  };

  const handleAdvanceStatus = async (task: Task) => {
    const currentIndex = StatusOrder.indexOf(task.status);
    const nextStatus = StatusOrder[currentIndex + 1];
    if (!nextStatus) return;
    const isTaskMember = task.responsibleId === user?.id || task.intervenientes?.includes(user?.id as string);
    if (user?.role === UserRole.EMPLOYEE && !isTaskMember) return;
    if (task.status === TaskStatus.TERMINADO && user?.role !== UserRole.ADMIN) return;

    const updatedTasks = tasks.map(tk => tk.id === task.id ? { 
      ...tk, 
      status: nextStatus, 
      updatedAt: new Date().toISOString(),
      closedAt: nextStatus === TaskStatus.FECHADO ? new Date().toISOString() : tk.closedAt
    } : tk);
    
    // Se é um empregado avançando estado, adiciona um comentário automático
    if (user?.role === UserRole.EMPLOYEE) {
      const comment = { 
        id: 'C-' + Math.random().toString(36).substr(2, 6).toUpperCase(), 
        userId: user.id, 
        userName: user.name, 
        text: `Avançou o estado para ${nextStatus}`, 
        timestamp: new Date().toISOString() 
      };
      const withComments = updatedTasks.map(tk => tk.id === task.id ? { ...tk, comments: [...(tk.comments || []), comment] } : tk);
      saveTasks(withComments);
    } else {
      saveTasks(updatedTasks);
    }
    
    try {
      const isLocalId = typeof task.id === 'string' && task.id.toUpperCase().startsWith('T-');
      if (!isLocalId) {
        await apiTasks.updateStatus(task.id, nextStatus);
      }
    } catch (error) {
      logger.warn('Task', 'Erro ao atualizar status na API, atualizado localmente...', error);
    }
    
    addSystemActivity({ userId: user!.id, userName: user!.name, action: 'status_changed', entityType: 'task', entityId: task.id, entityTitle: task.title, fromStatus: task.status, toStatus: nextStatus });
    const aiMsg = await getSmartNotification(task.title, nextStatus, false, false, lang);
    addNotification(task.responsibleId, aiMsg, nextStatus === TaskStatus.TERMINADO ? 'success' : 'info');
  };

  const addNotification = async (userId: string, message: string, type: 'info' | 'success' | 'error' = 'info') => {
    const now = Date.now();
    const key = `${userId}|${type}|${message}`;
    const lastAt = lastNotificationRef.current.get(key) || 0;
    if (now - lastAt < 5000) return;
    lastNotificationRef.current.set(key, now);
    const n: Notification = {
      id: Math.random().toString(36).substr(2, 9),
      userId,
      message,
      type,
      timestamp: new Date().toISOString(),
      isRead: false
    };
    setNotifications(prev => {
      const exists = prev.some(p => p.userId === userId && p.message === message && p.type === type && Math.abs(new Date(p.timestamp).getTime() - now) < 10000);
      if (exists) return prev;
      return [n, ...prev];
    });
  };

  const addSystemActivity = (a: Omit<SystemActivity, 'id' | 'timestamp'>) => {
    const full: SystemActivity = { ...a, id: 'A-' + Math.random().toString(36).substr(2, 9), timestamp: new Date().toISOString() };
    setSystemActivities(prev => {
      const exists = prev.some(p => p.userId === full.userId && p.action === full.action && p.entityId === full.entityId && p.fromStatus === full.fromStatus && p.toStatus === full.toStatus);
      if (exists) return prev;
      const next = [full, ...prev].slice(0, 200);
      localStorage.setItem('gestora_activities', JSON.stringify(next));
      return next;
    });

    const message = (() => {
      if (a.action === 'created') return `Criou tarefa: ${a.entityTitle || a.entityId}`;
      if (a.action === 'updated') return `Atualizou tarefa: ${a.entityTitle || a.entityId}`;
      if (a.action === 'deleted') return `Eliminou tarefa: ${a.entityTitle || a.entityId}`;
      if (a.action === 'status_changed') return `Mudou estado: ${a.entityTitle || a.entityId} (${a.fromStatus} → ${a.toStatus})`;
      if (a.action === 'commented') return `Comentou na tarefa: ${a.entityTitle || a.entityId}`;
      return `Atividade: ${a.entityTitle || a.entityId}`;
    })();
    users.filter(u => u.role === UserRole.ADMIN).forEach(u => {
      addNotification(u.id, message, 'info');
    });
  };

  const getUserName = (id: string) => users.find(u => u.id === id)?.name || id;

  const getAvatarUrl = (u: User) => {
    if (typeof localStorage === 'undefined') return null;
    return localStorage.getItem(`gestora_avatar_${u.id}`);
  };
  const saveAvatar = (userId: string, dataUrl: string) => {
    localStorage.setItem(`gestora_avatar_${userId}`, dataUrl);
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, avatar: dataUrl } : u));
  };

  const openAvatarUpload = (userId: string) => {
    setUploadingAvatarFor(userId);
    setTimeout(() => avatarInputRef.current?.click(), 0);
  };

  const filteredTasks = useMemo(() => {
    let result = tasks;
    if (searchQuery) result = result.filter(tk => tk.title.toLowerCase().includes(searchQuery.toLowerCase()));
    if (statusFilter !== 'all') result = result.filter(tk => tk.status === statusFilter);
    if (user?.role === UserRole.EMPLOYEE) {
      result = result.filter(tk => tk.responsibleId === user.id || tk.intervenientes?.includes(user.id));
    }
    return result;
  }, [tasks, searchQuery, statusFilter, user]);

  const stats = useMemo(() => ({
    active: tasks.filter(t => t.status !== TaskStatus.FECHADO).length,
    overdue: tasks.filter(t => t.status === TaskStatus.ATRASADA).length,
    completed: tasks.filter(t => t.status === TaskStatus.FECHADO).length
  }), [tasks]);

const LoginPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [forgotPasswordMessage, setForgotPasswordMessage] = useState<string | null>(null);
  const [registerData, setRegisterData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [registerError, setRegisterError] = useState<string | null>(null);
  const [registerSuccess, setRegisterSuccess] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Limpar erro quando o usuário começar a digitar
    if (errorMessage) setErrorMessage(null);
  };

  // Handler para "Lembrar-me"
  const handleRememberMeChange = () => {
    setRememberMe(!rememberMe);
    if (!rememberMe) {
      // Salvar email no localStorage quando ativar
      localStorage.setItem('gestora_remember_email', formData.email);
    } else {
      localStorage.removeItem('gestora_remember_email');
    }
  };

  // Handler para "Esqueceu a senha?"
  const handleForgotPassword = async () => {
    if (!forgotPasswordEmail) {
      setForgotPasswordMessage('Por favor, insira o seu email.');
      return;
    }
    
    setForgotPasswordMessage('A enviar email de recuperação...');
    
    try {
      await apiAuth.forgotPassword(forgotPasswordEmail);
      setForgotPasswordMessage(`Um email de recuperação foi enviado para ${forgotPasswordEmail}.\nVerifique a sua caixa de entrada.`);
      // Fechar após 5 segundos
      setTimeout(() => {
        setShowForgotPassword(false);
        setForgotPasswordEmail('');
        setForgotPasswordMessage(null);
      }, 5000);
    } catch (error: any) {
      setForgotPasswordMessage(error?.message || 'Erro ao enviar email de recuperação.');
    }
  };

  // Handler para registo de novo utilizador
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterError(null);
    
    // Validações
    if (!registerData.name.trim()) {
      setRegisterError('Por favor, preencha o nome.');
      return;
    }
    
    if (!registerData.email.trim()) {
      setRegisterError('Por favor, preencha o email.');
      return;
    }
    
    if (!registerData.password || registerData.password.length < 6) {
      setRegisterError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }
    
    if (registerData.password !== registerData.confirmPassword) {
      setRegisterError('As senhas não coincidem.');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Usar o endpoint de registo da API
      const response = await apiAuth.register(registerData.email, registerData.name, registerData.password);
      
      setRegisterSuccess(true);
      
      // Após registo, fazer login automaticamente
      setTimeout(async () => {
        try {
          const loginResponse = await apiAuth.login(registerData.email, registerData.password);
          const token = loginResponse.token || loginResponse.jwt;
          if (token) {
            setAuthToken(token);
            const apiUser = loginResponse.user || loginResponse;
            const normalizedUser = {
              ...apiUser,
              id: apiUser?.id ?? apiUser?.userId,
              email: apiUser?.email ?? registerData.email,
              name: apiUser?.name ?? apiUser?.username ?? registerData.name,
              role: apiUser?.role ?? UserRole.EMPLOYEE
            };
            const mappedUser = mapUserFromAPI(normalizedUser);
            setUser(mappedUser);
            setShowRegister(false);
            setView('app');
            await loadDataFromAPI(mappedUser);
          }
        } catch (loginError) {
          // Se falhar login automático, mostra mensagem de sucesso e pede para fazer login
          setRegisterSuccess(true);
          setRegisterError(null);
        }
      }, 2000);
      
    } catch (error: any) {
      setRegisterError(error.message || 'Erro ao criar conta. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handler para alterar dados do formulário de registo
  const handleRegisterInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setRegisterData(prev => ({ ...prev, [name]: value }));
    if (registerError) setRegisterError(null);
  };

  // Carregar email salvo ao iniciar (se remember-me estava ativo)
  useEffect(() => {
    const savedEmail = localStorage.getItem('gestora_remember_email');
    if (savedEmail) {
      setFormData(prev => ({ ...prev, email: savedEmail }));
      setRememberMe(true);
    }
  }, []);

  const validateForm = () => {
    if (!formData.email.trim()) {
      setErrorMessage('Por favor, preencha o campo de email.');
      return false;
    }
    
    if (!formData.password.trim()) {
      setErrorMessage('Por favor, preencha o campo de senha.');
      return false;
    }
    
    // Validação básica de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setErrorMessage('Por favor, insira um email válido.');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    
    // Validação do formulário
    if (!validateForm()) return;
    
    setIsLoading(true);
    
    try {
      // Login com a API
      const apiResponse = await apiAuth.login(formData.email, formData.password);
      const token = apiResponse.token || apiResponse.jwt;

      if (!token) {
        throw new Error('Resposta de login sem token.');
      }

      setAuthToken(token);
      const apiUser = apiResponse.user || apiResponse;
      const normalizedUser = {
        ...apiUser,
        id: apiUser?.id ?? apiUser?.userId,
        email: apiUser?.email ?? formData.email,
        name: apiUser?.name ?? apiUser?.username,
        role: apiUser?.role ?? UserRole.EMPLOYEE
      };
      const mappedUser = mapUserFromAPI(normalizedUser);
      setUser(mappedUser);
      
      // Sempre carregar dados da API após login
      await loadDataFromAPI(mappedUser);
      
      // Se for primeira senha, vai para o perfil e não pode sair enquanto não alterar
      if (mappedUser.mustChangePassword) {
        setView('app');
        setActiveTab('profile');
        // Não permite logout enquanto não mudar a senha
        localStorage.setItem('forcedPasswordChange', 'true');
      } else {
        setView('app');
      }
    } catch (apiError: any) {
      logger.error('Auth', 'Login na API falhou', apiError);
      setAuthToken(null);
      setUser(null);
      setErrorMessage(getAuthErrorMessage(apiError));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 sm:p-6 font-sans">
      <div className="w-full max-w-md">
        {/* Logo e título */}
        <div className="text-center mb-8 sm:mb-10">
          <div className="inline-flex p-3 sm:p-4 bg-emerald-500 rounded-2xl shadow-lg mb-4 sm:mb-6">
            <Workflow size={28} className="sm:w-9 sm:h-9 text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mb-2">GESTORA</h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">Professional Workflow Management</p>
        </div>

        {/* Card de login */}
        <div className="bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-lg border border-slate-200">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-2">Acesso ao Sistema</h2>
          <p className="text-slate-500 text-xs sm:text-sm mb-6 sm:mb-8">
            Entre com suas credenciais corporativas</p>
            <div className="text-[10px] text-slate-600 mt-2 space-y-1">
              <div className="flex items-center gap-1">
                <ShieldCheck size={12} className="text-emerald-600" />
                 <UserIcon size={12} className="text-blue-600" />
              </div>
            </div>
          

          {/* Mensagem de erro */}
          {errorMessage && (
            <div className="mb-6 p-3 bg-rose-50 border border-rose-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertTriangle className="text-rose-500 mt-0.5 flex-shrink-0" size={16} />
                <p className="text-rose-700 text-sm">{errorMessage}</p>
              </div>
            </div>
          )}

          <form className="space-y-4 sm:space-y-6" onSubmit={handleSubmit}>
            {/* Campo Email */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">
                Email Corporativo <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="nome@empresa.com"
                  className={`w-full pl-10 pr-4 py-2.5 sm:py-3 bg-white border ${
                    errorMessage && !formData.email 
                      ? 'border-rose-300 focus:border-rose-500' 
                      : 'border-slate-300 focus:border-emerald-500'
                  } rounded-xl focus:ring-2 focus:ring-emerald-500/20 text-slate-900 outline-none transition-all text-sm`}
                  disabled={isLoading}
                  required
                />
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              </div>
            </div>

            {/* Campo Senha */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">
                Senha <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Digite sua senha"
                  className={`w-full pl-10 pr-4 py-2.5 sm:py-3 bg-white border ${
                    errorMessage && !formData.password 
                      ? 'border-rose-300 focus:border-rose-500' 
                      : 'border-slate-300 focus:border-emerald-500'
                  } rounded-xl focus:ring-2 focus:ring-emerald-500/20 text-slate-900 outline-none transition-all text-sm`}
                  disabled={isLoading}
                  required
                />
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              </div>
            </div>

            {/* Opções de login */}
            <div className="flex items-center justify-between">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={rememberMe}
                  onChange={handleRememberMeChange}
                  className="w-4 h-4 text-emerald-500 rounded border-slate-300 focus:ring-emerald-500/20" 
                  disabled={isLoading}
                />
                <span className="text-sm text-slate-600">Lembrar-me</span>
              </label>
              <button 
                type="button" 
                onClick={() => setShowForgotPassword(true)}
                className="text-sm text-emerald-600 hover:text-emerald-700 font-medium disabled:text-slate-400"
                disabled={isLoading}
              >
                Esqueceu a senha?
              </button>
            </div>

            {/* Botão de login */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 sm:py-3.5 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-400 text-white font-bold rounded-xl transition-colors shadow-md hover:shadow-lg disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Autenticando...
                </>
              ) : (
                'Entrar no Sistema'
              )}
            </button>
          </form>

          {/* Link para registar */}
          <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-slate-100 text-center">
            <p className="text-sm text-slate-500">
              Não tem uma conta?
            </p>
            <button
              onClick={() => setShowRegister(true)}
              disabled={isLoading}
              className="text-sm text-emerald-600 hover:text-emerald-700 font-medium disabled:text-slate-400 transition-colors flex items-center justify-center gap-2 mx-auto mt-2"
            >
              <UserPlus size={16} />
              Criar conta
            </button>
          </div>

          {/* Link para voltar */}
          <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-slate-100 text-center">
            <button
              onClick={() => setView('landing')}
              disabled={isLoading}
              className="text-sm text-slate-500 hover:text-slate-700 disabled:text-slate-400 transition-colors flex items-center justify-center gap-2 mx-auto"
            >
              <ChevronLeft size={16} />
              Voltar para o início
            </button>
          </div>
        </div>

        {/* Rodapé */}
        <div className="mt-6 sm:mt-8 text-center">
          <p className="text-xs text-slate-400">
            © 2026 GESTORA • Sistema de Gestão de Tarefas
          </p>
          <p className="text-[10px] text-slate-400 mt-1">
            Suporte: suporte@gestora.com
          </p>
        </div>
      </div>

      {/* Modal de Recuperação de Senha */}
      {showForgotPassword && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-slate-900">Recuperar Senha</h3>
              <button 
                onClick={() => setShowForgotPassword(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={24} />
              </button>
            </div>
            
            <p className="text-sm text-slate-600 mb-6">
              Digite o seu email para receber um link de recuperação de senha.
            </p>
            
            {forgotPasswordMessage && (
              <div className={`mb-4 p-3 rounded-lg text-sm ${
                forgotPasswordMessage.includes('enviado') 
                  ? 'bg-emerald-50 text-emerald-700' 
                  : 'bg-rose-50 text-rose-700'
              }`}>
                {forgotPasswordMessage}
              </div>
            )}
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Email
                </label>
                <input
                  type="email"
                  value={forgotPasswordEmail}
                  onChange={(e) => setForgotPasswordEmail(e.target.value)}
                  placeholder="nome@empresa.com"
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                />
              </div>
              
              <button
                onClick={handleForgotPassword}
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl transition-colors"
              >
                Enviar Link de Recuperação
              </button>
              
              <button
                onClick={() => setShowForgotPassword(false)}
                className="w-full py-2 text-slate-500 hover:text-slate-700 text-sm"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Registo */}
      {showRegister && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-slate-900">Criar Nova Conta</h3>
              <button 
                onClick={() => { setShowRegister(false); setRegisterData({ name: '', email: '', password: '', confirmPassword: '' }); setRegisterError(null); }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={24} />
              </button>
            </div>
            
            {registerSuccess ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 size={32} className="text-emerald-600" />
                </div>
                <h4 className="text-lg font-bold text-slate-900 mb-2">Conta Criada!</h4>
                <p className="text-slate-600">A redirecionar para o sistema...</p>
              </div>
            ) : (
              <form onSubmit={handleRegister} className="space-y-4">
                {registerError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg">
                    <p className="text-rose-700 text-sm">{registerError}</p>
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Nome Completo <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={registerData.name}
                    onChange={handleRegisterInputChange}
                    placeholder="Seu nome completo"
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Email <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={registerData.email}
                    onChange={handleRegisterInputChange}
                    placeholder="nome@empresa.com"
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Senha <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={registerData.password}
                    onChange={handleRegisterInputChange}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                    required
                    minLength={6}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Confirmar Senha <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={registerData.confirmPassword}
                    onChange={handleRegisterInputChange}
                    placeholder="Confirme sua senha"
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                    required
                  />
                </div>
                
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-400 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      A criar conta...
                    </>
                  ) : (
                    'Criar Conta'
                  )}
                </button>
                
                <button
                  type="button"
                  onClick={() => { setShowRegister(false); setRegisterData({ name: '', email: '', password: '', confirmPassword: '' }); setRegisterError(null); }}
                  className="w-full py-2 text-slate-500 hover:text-slate-700 text-sm"
                >
                  Cancelar
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

  const SetPasswordPage = () => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setErrorMessage(null);
      setSuccessMessage(null);

      if (!inviteToken) {
        setErrorMessage('Link inválido ou expirado.');
        return;
      }

      if (!password.trim()) {
        setErrorMessage('Por favor, preencha a senha.');
        return;
      }

      if (password.trim().length < 6) {
        setErrorMessage('A senha deve ter pelo menos 6 caracteres.');
        return;
      }

      if (password !== confirmPassword) {
        setErrorMessage('As senhas não coincidem.');
        return;
      }

      setIsLoading(true);
      try {
        // Usar a API changeFirstPassword para alterar senha no primeiro login
        await apiAuth.changeFirstPassword('', password, confirmPassword);
        setSuccessMessage('Senha definida com sucesso!\n\nAgora pode fazer login.');
        setInviteToken(null);
        if (typeof window !== 'undefined') {
          const cleanUrl = window.location.origin + window.location.pathname;
          window.history.replaceState({}, document.title, cleanUrl);
        }
      } catch (error: any) {
        setErrorMessage(error?.message || 'Falha ao definir a senha.');
      } finally {
        setIsLoading(false);
      }
    };

    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 sm:p-6 font-sans">
        <div className="w-full max-w-md">
          <div className="text-center mb-8 sm:mb-10">
            <div className="inline-flex p-3 sm:p-4 bg-emerald-500 rounded-2xl shadow-lg mb-4 sm:mb-6">
              <Lock size={28} className="sm:w-9 sm:h-9 text-white" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mb-2">Definir Senha</h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">Configure sua palavra-passe de acesso</p>
          </div>

          <div className="bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-lg border border-slate-200">
            {errorMessage && (
              <div className="mb-6 p-3 bg-rose-50 border border-rose-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="text-rose-500 mt-0.5 flex-shrink-0" size={16} />
                  <p className="text-rose-700 text-sm">{errorMessage}</p>
                </div>
              </div>
            )}

            {successMessage ? (
              <div className="space-y-4">
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <p className="text-emerald-700 text-sm">{successMessage}</p>
                </div>
                <Button onClick={() => setView('login')} className="w-full">
                  Ir para login
                </Button>
              </div>
            ) : (
              <form className="space-y-4 sm:space-y-6" onSubmit={handleSubmit}>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">
                    Nova senha <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      name="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      className="w-full pl-10 pr-4 py-2.5 sm:py-3 bg-white border border-slate-300 focus:border-emerald-500 rounded-xl focus:ring-2 focus:ring-emerald-500/20 text-slate-900 outline-none transition-all text-sm"
                      disabled={isLoading}
                      required
                    />
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">
                    Confirmar senha <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      name="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repita a senha"
                      className="w-full pl-10 pr-4 py-2.5 sm:py-3 bg-white border border-slate-300 focus:border-emerald-500 rounded-xl focus:ring-2 focus:ring-emerald-500/20 text-slate-900 outline-none transition-all text-sm"
                      disabled={isLoading}
                      required
                    />
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 sm:py-3.5 rounded-xl transition-all shadow-lg shadow-emerald-500/25 disabled:opacity-50"
                >
                  {isLoading ? 'Definindo...' : 'Definir senha'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    );
  };

  // ==================== RESET PASSWORD PAGE ====================
  const ResetPasswordPage = () => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setErrorMessage(null);
      setSuccessMessage(null);

      if (!resetToken) {
        setErrorMessage('Token de recuperação inválido ou expirado.');
        return;
      }

      if (!password.trim()) {
        setErrorMessage('Por favor, preencha a nova senha.');
        return;
      }

      if (password.trim().length < 6) {
        setErrorMessage('A senha deve ter pelo menos 6 caracteres.');
        return;
      }

      if (password !== confirmPassword) {
        setErrorMessage('As senhas não coincidem.');
        return;
      }

      setIsLoading(true);
      try {
        await apiAuth.resetPassword(resetToken, password);
        setSuccessMessage('Senha redefinida com sucesso!\n\nPode fazer login com a nova senha.');
        setResetToken(null);
      } catch (error: any) {
        setErrorMessage(error?.message || 'Falha ao redefinir a senha. O token pode estar expirado.');
      } finally {
        setIsLoading(false);
      }
    };

    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 sm:p-6 font-sans">
        <div className="w-full max-w-md">
          <div className="text-center mb-8 sm:mb-10">
            <div className="inline-flex p-3 sm:p-4 bg-amber-500 rounded-2xl shadow-lg mb-4 sm:mb-6">
              <Lock size={28} className="sm:w-9 sm:h-9 text-white" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mb-2">Recuperação de Senha</h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">Digite sua nova palavra-passe</p>
          </div>

          <div className="bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-lg border border-slate-200">
            {errorMessage && (
              <div className="mb-6 p-3 bg-rose-50 border border-rose-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="text-rose-500 mt-0.5 flex-shrink-0" size={16} />
                  <p className="text-rose-700 text-sm">{errorMessage}</p>
                </div>
              </div>
            )}

            {successMessage ? (
              <div className="space-y-4">
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <p className="text-emerald-700 text-sm whitespace-pre-line">{successMessage}</p>
                </div>
                <Button onClick={() => { setView('login'); }} className="w-full">
                  Ir para Login
                </Button>
              </div>
            ) : (
              <form className="space-y-4 sm:space-y-6" onSubmit={handleSubmit}>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">
                    Nova senha <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      name="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      className="w-full pl-10 pr-4 py-2.5 sm:py-3 bg-white border border-slate-300 focus:border-amber-500 rounded-xl focus:ring-2 focus:ring-amber-500/20 text-slate-900 outline-none transition-all text-sm"
                      disabled={isLoading}
                      required
                    />
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">
                    Confirmar senha <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      name="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repita a nova senha"
                      className="w-full pl-10 pr-4 py-2.5 sm:py-3 bg-white border border-slate-300 focus:border-amber-500 rounded-xl focus:ring-2 focus:ring-amber-500/20 text-slate-900 outline-none transition-all text-sm"
                      disabled={isLoading}
                      required
                    />
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 sm:py-3.5 rounded-xl transition-all shadow-lg shadow-amber-500/25 disabled:opacity-50"
                >
                  {isLoading ? 'Redefinindo...' : 'Redefinir Senha'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    );
  };

  const LandingPage = () => (
    <div className="landing-multi-font min-h-screen bg-white flex flex-col">
      <nav className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-xl z-[100] border-b border-slate-200/60 h-16 sm:h-[72px]">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 h-full flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setView('landing')}>
            <div className="w-9 h-9 rounded-lg bg-slate-900 flex items-center justify-center">
              <Workflow className="text-white" size={18} />
            </div>
            <span className="text-[15px] sm:text-base font-semibold text-slate-900 tracking-tight">GESTORA</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <button onClick={() => setView('landing')} className="text-[13px] sm:text-sm font-medium text-slate-600 hover:text-slate-900 px-3 py-2 rounded-lg hover:bg-slate-100/80 transition-colors">
              Início
            </button>
            <button onClick={() => setView('login')} className="text-[13px] sm:text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg transition-colors shadow-sm">
              Entrar
            </button>
          </div>
        </div>
      </nav>

      <section className="pt-32 sm:pt-40 md:pt-48 lg:pt-64 pb-32 sm:pb-40 md:pb-56 px-4 sm:px-6 lg:px-8 text-center max-w-6xl mx-auto space-y-8 sm:space-y-12">
        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-slate-800 leading-[1.05] tracking-tight animate-in">
          {t.landingTitle.split(' simples e eficaz')[0]} <span className="text-[#10b981]">simples</span> e <span className="text-[#10b981]">eficaz</span>
        </h1>
        <p className="text-base sm:text-lg lg:text-[20px] text-slate-500 max-w-3xl mx-auto font-medium animate-in leading-relaxed px-2">
          {t.landingDesc}
        </p>
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-5 justify-center items-center pt-6 sm:pt-8 animate-in">
          {/* Design do antigo Ver Roadmap: borda, ícone seta, hover */}
          <button onClick={() => setView('login')} className="flex items-center justify-center gap-2 px-10 sm:px-14 py-4 sm:py-5 rounded-full border-2 border-[#10b981] text-[#10b981] font-bold hover:bg-[#10b981] hover:text-white transition-all text-base group w-full sm:w-auto">
            Começar Agora <ArrowUpRight size={20} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
          </button>
        </div>
      </section>

      <footer className="bg-slate-950 text-white py-14 px-8">
        <div className="max-w-6xl mx-auto flex flex-col items-center gap-5">
          <div className="flex items-center gap-2.5 text-slate-400">
            <Workflow size={18} />
            <span className="text-sm font-semibold tracking-tight">GESTORA</span>
          </div>
          <p className="text-slate-500 text-xs tracking-wide">
            © 2026 ILUNGI GESTORA
          </p>
        </div>
      </footer>
    </div>
  );

  if (view === 'landing') return <LandingPage />;
  if (view === 'login') return <LoginPage />;
  if (view === 'set-password') return <SetPasswordPage />;
  if (view === 'reset-password') return <ResetPasswordPage />;

  return (
    <div className="h-screen flex bg-[#f8fafc] dark:bg-slate-950 transition-all font-sans overflow-hidden">
      <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => {
        const f = e.target.files?.[0];
        if (f && uploadingAvatarFor) { const r = new FileReader(); r.onload = () => { saveAvatar(uploadingAvatarFor, r.result as string); setUploadingAvatarFor(null); }; r.readAsDataURL(f); }
        e.target.value = '';
      }} />
      
      {isAppSidebarOpen && <div className="fixed inset-0 bg-slate-900/40 z-[75] lg:hidden" onClick={() => setAppSidebarOpen(false)} aria-hidden="true" />}
      
      {/* Sidebar - altura total (toda a vertical); em mobile drawer */}
      <aside className={`fixed lg:relative left-0 top-0 h-screen flex flex-col z-[80] transition-all duration-300 ease-in-out
        bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800
        ${isAppSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        ${isSidebarCollapsed ? 'lg:w-[100px] w-[280px]' : 'w-[280px]'}`}>
        
        <div className="p-4 sm:p-6 lg:p-8 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setView('landing')}>
            <div className="bg-[#10b981] p-2 rounded-xl flex-shrink-0 shadow-lg shadow-emerald-500/20"><Workflow size={22} className="text-white" /></div>
            {!isSidebarCollapsed && <span className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">GESTORA</span>}
          </div>
          <button onClick={() => setAppSidebarOpen(false)} className="lg:hidden p-2 text-slate-400 hover:text-slate-600"><X size={20}/></button>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4 overflow-y-auto">
          <SidebarNavItem icon={<LayoutDashboard size={20}/>} label={t.dashboard} active={activeTab === 'dashboard'} collapsed={isSidebarCollapsed} onClick={() => { setActiveTabSafe('dashboard'); setAppSidebarOpen(false); }} />
          <SidebarNavItem icon={<CheckSquare size={20}/>} label={t.tasks} active={activeTab === 'tasks'} collapsed={isSidebarCollapsed} onClick={() => { setActiveTabSafe('tasks'); setAppSidebarOpen(false); }} />
          {user?.role === UserRole.ADMIN && (
            <>
              <SidebarNavItem icon={<Users size={20}/>} label={t.users} active={activeTab === 'users'} collapsed={isSidebarCollapsed} onClick={() => { setActiveTabSafe('users'); setAppSidebarOpen(false); }} />
              <SidebarNavItem icon={<BarChart2 size={20}/>} label={t.reports} active={activeTab === 'reports'} collapsed={isSidebarCollapsed} onClick={() => { setActiveTabSafe('reports'); setAppSidebarOpen(false); }} />
            </>
          )}
          <SidebarNavItem icon={<UserIcon size={20}/>} label={t.profile} active={activeTab === 'profile'} collapsed={isSidebarCollapsed} onClick={() => { setActiveTabSafe('profile'); setAppSidebarOpen(false); }} />
        </nav>

        <div className="p-4 lg:p-6 border-t border-slate-100 dark:border-slate-800">
          <button onClick={() => { setAuthToken(null); setUser(null); setView('login'); }} className="flex items-center gap-5 w-full px-5 py-4 text-slate-400 hover:text-rose-500 transition-all">
            <LogOut size={20} />
            {!isSidebarCollapsed && <span className="text-[11px] font-black uppercase tracking-widest">{t.logout}</span>}
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        <header className="h-20 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-10 flex items-center justify-between z-50">
           <div className="flex items-center gap-3 sm:gap-6">
              <button onClick={() => setAppSidebarOpen(true)} className="lg:hidden p-3 bg-emerald-50 dark:bg-emerald-900/20 text-[#10b981] rounded-xl"><Menu size={22}/></button>
              <button onClick={() => setSidebarCollapsed(!isSidebarCollapsed)} className="hidden lg:flex p-3 bg-emerald-50 dark:bg-emerald-900/20 text-[#10b981] rounded-xl">
                 <ChevronLeftCircle size={22} className={`transition-transform duration-500 ${isSidebarCollapsed ? 'rotate-180' : ''}`} />
              </button>
              <div>
                 <h2 className="text-lg font-black text-slate-900 dark:text-white leading-none capitalize tracking-tight">{t[activeTab as keyof typeof t] || activeTab}</h2>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Gestora Enterprise Workspace</p>
              </div>
           </div>

           <div className="flex items-center gap-6">
              <button onClick={() => setLang(lang === 'pt' ? 'en' : 'pt')} className="text-[10px] font-black p-2 bg-slate-50 dark:bg-slate-800 rounded-lg uppercase tracking-widest">{lang}</button>
              <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} className="p-3 text-slate-400">{theme === 'light' ? <Moon size={20}/> : <Sun size={20}/>}</button>
              <div className="relative">
                <button
                  onClick={() => setNotificationsOpen(!isNotificationsOpen)}
                  className="p-3 text-slate-400 relative"
                  aria-label="Notificações"
                >
                  <Bell size={20} />
                  {notifications.filter(n => n.userId === user?.id && !n.isRead).length > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 bg-rose-500 text-white text-[9px] font-bold rounded-full h-4 min-w-[16px] px-1 flex items-center justify-center">
                      {notifications.filter(n => n.userId === user?.id && !n.isRead).length}
                    </span>
                  )}
                </button>
                {isNotificationsOpen && (
                  <div className="absolute right-0 mt-2 w-80 max-h-[380px] overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-[120]">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                      <p className="text-xs font-black uppercase tracking-widest text-slate-500">Notificações</p>
                      <button
                        onClick={() => setNotifications(prev => prev.map(n => n.userId === user?.id ? { ...n, isRead: true } : n))}
                        className="text-[10px] font-bold text-emerald-600 hover:text-emerald-700"
                      >
                        Marcar todas
                      </button>
                    </div>
                    <div className="p-2 space-y-2">
                      {notifications.filter(n => n.userId === user?.id).length === 0 && (
                        <div className="p-4 text-xs text-slate-400 text-center">Sem notificações</div>
                      )}
                      {notifications.filter(n => n.userId === user?.id).map(n => (
                        <div key={n.id} className={`px-3 py-2 rounded-xl text-xs ${n.isRead ? 'bg-slate-50 dark:bg-slate-800 text-slate-500' : 'bg-emerald-50 dark:bg-emerald-900/20 text-slate-700'}`}>
                          <p className="font-semibold">{n.message}</p>
                          <p className="text-[10px] text-slate-400 mt-1">{new Date(n.timestamp).toLocaleString('pt-PT')}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-3 sm:gap-4 pl-4 sm:pl-6 border-l border-slate-100 dark:border-slate-800">
                 <div className="text-right hidden sm:block">
                    <p className="text-sm font-black text-slate-900 dark:text-white leading-none">{user!.name}</p>
                    <p className="text-[10px] font-bold text-[#10b981] uppercase tracking-widest mt-1.5">{user!.position}</p>
                 </div>
                 <button type="button" onClick={() => openAvatarUpload(user!.id)} className="flex-shrink-0 rounded-2xl border-2 border-white dark:border-slate-800 shadow-xl overflow-hidden w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center bg-slate-100 dark:bg-slate-800 ring-1 ring-slate-100">
                   {getAvatarUrl(user!) ? <img src={getAvatarUrl(user!)!} alt="" className="w-full h-full object-cover" /> : <UserIcon size={22} className="text-slate-400" />}
                 </button>
              </div>
           </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-10 bg-[#f8fafc] dark:bg-slate-950">
          
          {activeTab === 'dashboard' && (
            <div className="max-w-7xl mx-auto space-y-8 sm:space-y-12 animate-in">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
                 <StatCard icon={<Layers className="text-emerald-600" />} label={t.activeTasks} value={stats.active} color="emerald" />
                 <StatCard icon={<AlertTriangle className="text-rose-600" />} label={t.overdueTasks} value={stats.overdue} color="rose" />
                 <StatCard icon={<CheckCircle2 className="text-emerald-600" />} label={t.completedTasks} value={stats.completed} color="emerald" />
              </div>
              {/* Relatório breve: tarefas por estado */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-[3rem] p-6 sm:p-8 lg:p-10 border border-slate-100 dark:border-slate-800 shadow-sm">
                <h3 className="text-base sm:text-lg font-black mb-6 tracking-tight">Tarefas por Estado</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 sm:gap-4">
                  {Object.values(TaskStatus).map(s => (
                    <div key={s} className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 sm:p-4 text-center">
                      <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">{tasks.filter(t=>t.status===s).length}</p>
                      <p className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase mt-1 line-clamp-2">{s}</p>
                    </div>
                  ))}
                </div>
              </div>
              {/* Actividades recentes do sistema: quem alterou o quê */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-[3rem] p-6 sm:p-8 lg:p-12 border border-slate-100 dark:border-slate-800 shadow-sm">
                <h3 className="text-base sm:text-lg font-black mb-6 sm:mb-10 tracking-tight">{t.latestUpdates}</h3>
                <div className="space-y-4 sm:space-y-6 max-h-[420px] overflow-y-auto pr-2">
                  {visibleActivities.slice(0, 15).map(a => (
                    <div key={a.id} className="flex gap-3 sm:gap-6 items-start border-b border-slate-50 dark:border-slate-800 pb-4 last:border-0">
                      <div className="p-2.5 sm:p-4 rounded-xl shrink-0 bg-emerald-50 dark:bg-emerald-900/20 text-[#10b981]"><Bell size={18} className="sm:w-5 sm:h-5"/></div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-slate-700 dark:text-slate-300 text-sm sm:text-base">
                          {a.action === 'created' && <><span className="text-[#10b981]">{a.userName}</span> criou a tarefa «{a.entityTitle}»</>}
                          {a.action === 'updated' && <><span className="text-[#10b981]">{a.userName}</span> editou a tarefa «{a.entityTitle}»</>}
                          {a.action === 'deleted' && <><span className="text-rose-600">{a.userName}</span> eliminou a tarefa «{a.entityTitle}»</>}
                          {a.action === 'status_changed' && <><span className="text-[#10b981]">{a.userName}</span> alterou «{a.entityTitle}» de {a.fromStatus} → {a.toStatus}</>}
                          {a.action === 'commented' && <><span className="text-[#10b981]">{a.userName}</span> comentou em «{a.entityTitle}»</>}
                        </p>
                        <p className="text-[10px] font-black uppercase text-slate-400 mt-1">{new Date(a.timestamp).toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                  {visibleActivities.length === 0 && (
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-center py-10">Nenhuma actividade registada.</p>
                  )}
                </div>
              </div>

              {/* Log detalhado separado das notificações */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-[3rem] p-6 sm:p-8 lg:p-12 border border-slate-100 dark:border-slate-800 shadow-sm">
                <h3 className="text-base sm:text-lg font-black mb-6 sm:mb-10 tracking-tight">Log de Actividades</h3>
                <div className="space-y-3 max-h-[420px] overflow-y-auto pr-2">
                  {visibleActivities.map(a => (
                    <div key={`log-${a.id}`} className="px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-xs">
                      <span className="font-bold text-slate-700 dark:text-slate-300">{new Date(a.timestamp).toLocaleString('pt-PT')}</span>
                      <span className="mx-2 text-slate-400">•</span>
                      <span className="text-slate-600 dark:text-slate-300">{a.userName}</span>
                      <span className="mx-2 text-slate-400">•</span>
                      <span className="text-slate-500">{a.action}</span>
                      <span className="mx-2 text-slate-400">•</span>
                      <span className="text-slate-700 dark:text-slate-200">{a.entityTitle || a.entityId}</span>
                      {a.fromStatus && a.toStatus && (
                        <>
                          <span className="mx-2 text-slate-400">•</span>
                          <span className="text-slate-500">{a.fromStatus} → {a.toStatus}</span>
                        </>
                      )}
                    </div>
                  ))}
                  {visibleActivities.length === 0 && (
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-center py-10">Nenhuma actividade registada.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'tasks' && (
            <div className="max-w-7xl mx-auto space-y-10 animate-in">
              <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
                 <div className="flex gap-4 w-full lg:w-auto">
                    <div className="relative flex-1 lg:flex-initial">
                       <input 
                         placeholder={t.search} 
                         value={searchQuery}
                         onChange={e => setSearchQuery(e.target.value)}
                         className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 pl-12 pr-6 py-4 rounded-2xl outline-none focus:ring-4 focus:ring-emerald-500/5 transition-all w-full lg:min-w-[400px] font-bold text-sm shadow-sm"
                       />
                       <Search className="absolute left-4 top-4.5 text-slate-300" size={18} />
                    </div>
                    <select 
                      value={statusFilter}
                      onChange={e => setStatusFilter(e.target.value)}
                      className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 px-6 py-4 rounded-2xl font-bold text-[10px] uppercase tracking-widest text-slate-500 outline-none cursor-pointer shadow-sm"
                    >
                       <option value="all">{t.allStatuses}</option>
                       {Object.values(TaskStatus).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                 </div>
                 {user?.role === UserRole.ADMIN && (
                   <Button onClick={() => { setTaskFormError(null); setEditingTaskId(null); setIsTaskModalOpen(true); }} className="px-6 sm:px-10 py-4 sm:py-5 rounded-2xl shadow-xl shadow-emerald-500/20 bg-[#10b981]"><Plus size={18} className="sm:w-5 sm:h-5"/> {t.createTask}</Button>
                 )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
                {filteredTasks.length > 0 ? filteredTasks.map(tk => (
                  <TaskCard 
                    key={tk.id} 
                    task={tk} 
                    user={user!} 
                    users={users}
                    onAdvance={() => handleAdvanceStatus(tk)} 
                    onDelete={() => handleDeleteTask(tk)}
                    onEdit={user?.role === UserRole.ADMIN ? () => { setTaskFormError(null); setEditingTaskId(tk.id); setIsTaskModalOpen(true); } : undefined}
                    onAddComment={(text: string) => addComment(tk.id, text)}
                  />
                )) : (
                  <div className="col-span-full py-20 text-center space-y-6">
                    <ClipboardList size={100} className="mx-auto text-slate-100 dark:text-slate-800" />
                    <p className="text-slate-400 font-bold uppercase tracking-widest">{t.noTasks}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'users' && user?.role === UserRole.ADMIN && (
            <div className="max-w-7xl mx-auto space-y-6 sm:space-y-10 animate-in">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-black">Gestão de Utilizadores</h3>
                <Button onClick={() => { setUserFormError(null); setIsAddUserOpen(true); }} className="px-6 py-3"><Plus size={18}/> {t.addUser}</Button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {users.map(u => (
                  <div key={u.id} className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm flex gap-4">
                    <button type="button" onClick={() => openAvatarUpload(u.id)} className="flex-shrink-0 w-14 h-14 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden">
                      {getAvatarUrl(u) ? <img src={getAvatarUrl(u)!} alt="" className="w-full h-full object-cover" /> : <UserIcon size={28} className="text-slate-400" />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-slate-900 dark:text-white truncate">{u.name}</p>
                      <p className="text-xs text-slate-500 truncate">{u.email}</p>
                      <p className="text-[10px] font-bold text-[#10b981] uppercase mt-1">{u.position || u.role}</p>
                    </div>
                    <div className="flex flex-col gap-2">
                      <button onClick={() => { setUserFormError(null); setEditingUserId(u.id); }} className="p-2 rounded-lg text-slate-400 hover:bg-emerald-50 hover:text-[#10b981]"><Pencil size={16}/></button>
                      <button onClick={() => handleDeleteUser(u.id)} className="p-2 rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-500"><Trash2 size={16}/></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="max-w-2xl mx-auto space-y-8 animate-in">
              <h3 className="text-lg font-black">{t.myProfile}</h3>
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 border border-slate-100 dark:border-slate-800 shadow-sm">
                {user?.mustChangePassword && (
                  <div className="mb-6 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
                    Por segurança, altere sua senha para continuar.
                  </div>
                )}
                <form onSubmit={(e) => {
                  e.preventDefault();
                  const fd = new FormData(e.target as HTMLFormElement);
                  const patch: Partial<User> = { name: fd.get('name') as string, email: fd.get('email') as string };
                  if (user!.role === UserRole.ADMIN) {
                    patch.position = fd.get('position') as string;
                    patch.department = fd.get('department') as string;
                    patch.role = (fd.get('role') as UserRole) || user!.role;
                  }
                  const updated = { ...user!, ...patch };
                  saveUsers(users.map(u => u.id === user!.id ? updated : u));
                  setUser(updated);
                }}>
                  <div className="flex flex-col sm:flex-row gap-6 mb-8">
                    <button type="button" onClick={() => openAvatarUpload(user!.id)} className="flex-shrink-0 w-24 h-24 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden self-center sm:self-start">
                      {getAvatarUrl(user!) ? <img src={getAvatarUrl(user!)!} alt="" className="w-full h-full object-cover" /> : <UserIcon size={40} className="text-slate-400" />}
                    </button>
                    <div className="flex-1 space-y-4">
                      <div><label className="text-[10px] font-black uppercase text-slate-400 block mb-1">{t.name}</label><input name="name" defaultValue={user!.name} className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 font-bold" required /></div>
                      <div><label className="text-[10px] font-black uppercase text-slate-400 block mb-1">{t.email}</label><input name="email" type="email" defaultValue={user!.email} className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 font-bold" required /></div>
                      {user!.role === UserRole.ADMIN && (
                        <>
                          <div><label className="text-[10px] font-black uppercase text-slate-400 block mb-1">{t.position}</label><input name="position" defaultValue={user!.position} className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 font-bold" /></div>
                          <div><label className="text-[10px] font-black uppercase text-slate-400 block mb-1">{t.department}</label><input name="department" defaultValue={user!.department} className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 font-bold" /></div>
                          <div><label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Função</label><select name="role" defaultValue={user!.role} className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 font-bold"><option value={UserRole.EMPLOYEE}>Funcionário</option><option value={UserRole.ADMIN}>Administrador</option></select></div>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-3"><Button type="submit" className="flex-1">{t.save}</Button><Button type="button" variant="ghost" onClick={() => setActiveTab('dashboard')}>{t.cancel}</Button></div>
                </form>
              </div>
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 border border-slate-100 dark:border-slate-800 shadow-sm">
                <h4 className="text-base font-black mb-4">Alterar Senha</h4>
                {profilePasswordError && (
                  <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-lg text-sm text-rose-700">
                    {profilePasswordError}
                  </div>
                )}
                {profilePasswordSuccess && (
                  <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-700">
                    {profilePasswordSuccess}
                  </div>
                )}
                <form onSubmit={async (e) => {
                  e.preventDefault();
                  setProfilePasswordError(null);
                  setProfilePasswordSuccess(null);
                  if (!profilePassword.trim()) {
                    setProfilePasswordError('Preencha a nova senha.');
                    return;
                  }
                  if (profilePassword.trim().length < 6) {
                    setProfilePasswordError('A senha deve ter pelo menos 6 caracteres.');
                    return;
                  }
                  if (profilePassword !== profilePasswordConfirm) {
                    setProfilePasswordError('As senhas não coincidem.');
                    return;
                  }
                  try {
                    await apiUsers.changePassword(user!.id, profilePassword);
                    const updatedUser = { ...user!, mustChangePassword: false, localPassword: profilePassword };
                    setUser(updatedUser);
                    saveUsers(users.map(u => u.id === user!.id ? updatedUser : u));
                    setProfilePassword('');
                    setProfilePasswordConfirm('');
                    setProfilePasswordSuccess('Senha atualizada com sucesso.');
                    setActiveTabSafe('dashboard');
                  } catch (error) {
                    const updatedUser = { ...user!, mustChangePassword: false, localPassword: profilePassword };
                    saveUsers(users.map(u => u.id === user!.id ? updatedUser : u));
                    setUser(updatedUser);
                    setProfilePassword('');
                    setProfilePasswordConfirm('');
                    setProfilePasswordSuccess('Senha atualizada localmente com sucesso.');
                    setActiveTabSafe('dashboard');
                  }
                }}>
                  <div className="space-y-4">
                    <div>
                      <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Nova senha</label>
                      <input value={profilePassword} onChange={(e) => setProfilePassword(e.target.value)} type="password" className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 font-bold" />
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Confirmar senha</label>
                      <input value={profilePasswordConfirm} onChange={(e) => setProfilePasswordConfirm(e.target.value)} type="password" className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 font-bold" />
                    </div>
                  </div>
                  <div className="flex gap-3 mt-6">
                    <Button type="submit" className="flex-1">Atualizar senha</Button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {activeTab === 'reports' && user?.role === UserRole.ADMIN && (
            <div className="max-w-7xl mx-auto space-y-6 sm:space-y-10 animate-in">
              <h3 className="text-lg font-black">Relatório de Cumprimento das Tarefas por Funcionário</h3>
              <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-x-auto">
                <table className="w-full min-w-[540px] text-left">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800">
                      <th className="px-4 sm:px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Funcionário</th>
                      <th className="px-4 sm:px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest text-center">Total</th>
                      <th className="px-4 sm:px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest text-center">Concluídas</th>
                      <th className="px-4 sm:px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest text-center">Em atraso</th>
                      <th className="px-4 sm:px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest text-center">Taxa cumprimento</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.filter(u => u.role === UserRole.EMPLOYEE || u.role === UserRole.ADMIN).map(u => {
                      const myTasks = tasks.filter(t => t.responsibleId === u.id || t.intervenientes?.includes(u.id));
                      const total = myTasks.length;
                      const concl = myTasks.filter(t => t.status === TaskStatus.FECHADO).length;
                      const atraso = myTasks.filter(t => t.status === TaskStatus.ATRASADA).length;
                      const taxa = total ? Math.round((concl / total) * 100) : 0;
                      return (
                        <tr key={u.id} className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                          <td className="px-4 sm:px-6 py-4 font-bold text-slate-900 dark:text-white">{u.name}</td>
                          <td className="px-4 sm:px-6 py-4 text-center font-black">{total}</td>
                          <td className="px-4 sm:px-6 py-4 text-center text-[#10b981] font-bold">{concl}</td>
                          <td className="px-4 sm:px-6 py-4 text-center text-rose-500 font-bold">{atraso}</td>
                          <td className="px-4 sm:px-6 py-4 text-center font-black">{taxa}%</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Task Create/Edit Modal - em colunas, multi-responsáveis, data entrega auto */}
      {(isTaskModalOpen || editingTaskId) && (() => {
        const editTask = editingTaskId ? tasks.find(t => t.id === editingTaskId) : null;
        const respIds = editTask ? [editTask.responsibleId, ...(editTask.intervenientes || [])] : [];
        return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4 sm:p-6 overflow-y-auto py-8 animate-in">
           <div className="bg-white dark:bg-slate-900 w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl p-5 sm:p-6 border border-slate-100 dark:border-slate-800 shadow-2xl relative my-auto">
              <button onClick={() => { setIsTaskModalOpen(false); setEditingTaskId(null); setTaskFormDeliveryPreview(''); setTaskFormError(null); }} className="absolute top-3 right-3 sm:top-4 sm:right-4 p-2 text-slate-300 hover:text-rose-500 transition-colors z-10"><X size={18} className="sm:w-5 sm:h-5"/></button>
              <h2 className="text-lg sm:text-xl font-black tracking-tighter mb-4 uppercase text-slate-800 dark:text-white">{editTask ? 'Editar Tarefa' : 'Nova Actividade'}</h2>
              {taskFormError && (
                <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="text-rose-500 mt-0.5 flex-shrink-0" size={16} />
                    <p className="text-rose-700 text-sm">{taskFormError}</p>
                  </div>
                </div>
              )}
              <form id="taskForm" className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-3" onSubmit={async (e) => {
                e.preventDefault();
                const fd = new FormData(e.target as HTMLFormElement);
                const ids = fd.getAll('responsibleIds') as string[];
                if (!ids || ids.length === 0) { setTaskFormError('Selecione pelo menos um responsável.'); return; }
                setTaskFormError(null);
                const start = fd.get('startDate') as string;
                const val = Number(fd.get('deadlineValue'));
                const type = (fd.get('deadlineType') as 'days'|'hours') || 'days';
                const delivery = new Date(start);
                if (type === 'days') delivery.setDate(delivery.getDate() + val);
                else delivery.setHours(delivery.getHours() + val);

                if (editTask) {
                  const updated = tasks.map(t => t.id === editTask.id ? { ...t, title: fd.get('title') as string, description: fd.get('description') as string, startDate: start, deadlineValue: val, deadlineType: type, deliveryDate: delivery.toISOString(), responsibleId: ids[0], intervenientes: ids.slice(1), updatedAt: new Date().toISOString() } : t);
                  
                  try {
                    const taskToUpdate = updated.find(t => t.id === editTask.id)!;
                    if (!isLocalTaskId(editTask.id)) {
                      const apiResponse = await apiTasks.update(editTask.id, taskToUpdate);
                      if (apiResponse && apiResponse.id) {
                        // Se a API retornar dados atualizados, usar esses
                        const mappedTask = mapTaskFromAPI(apiResponse);
                        saveTasks(updated.map(t => t.id === editTask.id ? mappedTask : t));
                        logger.debug('Task', 'Tarefa atualizada na API com sucesso');
                      } else {
                        saveTasks(updated);
                      }
                    } else {
                      saveTasks(updated);
                    }
                    addNotification(user!.id, 'Tarefa atualizada com sucesso.', 'success');
                  } catch (error) {
                    logger.warn('Task', 'Erro ao atualizar na API, atualizando localmente...', error);
                    addNotification(user!.id, 'Não foi possível atualizar na API. Os dados foram salvos localmente.', 'error');
                    saveTasks(updated);
                  }
                  
                  addSystemActivity({ userId: user!.id, userName: user!.name, action: 'updated', entityType: 'task', entityId: editTask.id, entityTitle: fd.get('title') as string });
                  setEditingTaskId(null); setIsTaskModalOpen(false);
                } else {
                  const newTask: Task = { id: 'T-' + Math.random().toString(36).substr(2, 6).toUpperCase(), title: fd.get('title') as string, description: fd.get('description') as string, startDate: start, deadlineValue: val, deadlineType: type, deliveryDate: delivery.toISOString(), responsibleId: ids[0], intervenientes: ids.slice(1), status: TaskStatus.ABERTO, comments: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
                  
                  try {
                    // Tentar criar na API sem enviar o id local
                    const { id: _localId, ...payload } = newTask as any;
                    const apiResponse = await apiTasks.create(payload);
                    if (apiResponse && apiResponse.id) {
                      // Se a API retornar a tarefa criada, usar esses dados
                      const mappedTask = mapTaskFromAPI(apiResponse);
                      saveTasks([mappedTask, ...tasks]);
                      logger.debug('Task', 'Tarefa criada na API com sucesso');
                      addSystemActivity({ userId: user!.id, userName: user!.name, action: 'created', entityType: 'task', entityId: mappedTask.id, entityTitle: mappedTask.title });
                    } else {
                      saveTasks([newTask, ...tasks]);
                      addSystemActivity({ userId: user!.id, userName: user!.name, action: 'created', entityType: 'task', entityId: newTask.id, entityTitle: newTask.title });
                    }
                    addNotification(user!.id, 'Tarefa criada com sucesso.', 'success');
                  } catch (error) {
                    logger.warn('Task', 'Erro ao criar na API, criando localmente...', error);
                    addNotification(user!.id, 'Não foi possível criar na API. A tarefa foi criada localmente.', 'error');
                    saveTasks([newTask, ...tasks]);
                    addSystemActivity({ userId: user!.id, userName: user!.name, action: 'created', entityType: 'task', entityId: newTask.id, entityTitle: newTask.title });
                  }
                  
                  setIsTaskModalOpen(false);
                }
                setTaskFormDeliveryPreview('');
              }}>
                <div className="md:col-span-2 space-y-1">
                  <label className="text-[8px] font-black uppercase text-slate-400 tracking-widest ml-1">{t.title}</label>
                  <input name="title" defaultValue={editTask?.title} className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border-none rounded-lg outline-none focus:ring-2 focus:ring-emerald-500/30 font-bold text-xs" required />
                </div>
                <div className="md:col-span-2 space-y-1">
                  <label className="text-[8px] font-black uppercase text-slate-400 tracking-widest ml-1">{t.description}</label>
                  <textarea name="description" defaultValue={editTask?.description} rows={2} className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border-none rounded-lg outline-none focus:ring-2 focus:ring-emerald-500/30 font-medium resize-none text-xs" required />
                </div>
                <div className="space-y-1">
                  <label className="text-[8px] font-black uppercase text-slate-400 tracking-widest ml-1">{t.startDate}</label>
                  <input name="startDate" type="datetime-local" defaultValue={editTask?.startDate?.slice(0,16)} onInput={(e)=>recalcDelivery((e.target as HTMLInputElement).form!)} className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border-none rounded-lg outline-none focus:ring-2 focus:ring-emerald-500/30 font-bold text-xs" required />
                </div>
                <div className="space-y-1">
                  <label className="text-[8px] font-black uppercase text-slate-400 tracking-widest ml-1">Duração</label>
                  <div className="flex gap-1.5">
                    <input name="deadlineValue" type="number" defaultValue={editTask?.deadlineValue ?? 1} min={1} onInput={(e)=>recalcDelivery((e.target as HTMLInputElement).form!)} className="flex-1 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border-none rounded-lg outline-none focus:ring-2 focus:ring-emerald-500/30 font-bold text-xs" required />
                    <select name="deadlineType" defaultValue={editTask?.deadlineType} onChange={(e)=>recalcDelivery((e.target as HTMLSelectElement).form!)} className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border-none rounded-lg outline-none focus:ring-2 focus:ring-emerald-500/30 font-bold text-xs">
                      <option value="days">{t.days}</option>
                      <option value="hours">{t.hours}</option>
                    </select>
                  </div>
                </div>
                <div className="md:col-span-2 space-y-1">
                  <label className="text-[8px] font-black uppercase text-slate-400 tracking-widest ml-1">{t.deliveryDate} (calculada)</label>
                  <div className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg font-bold text-[#10b981] text-xs">{taskFormDeliveryPreview || (editTask ? new Date(editTask.deliveryDate).toLocaleString('pt-PT', { dateStyle: 'short', timeStyle: 'short' }) : '—')}</div>
                </div>
                <div className="md:col-span-2 space-y-1">
                  <label className="text-[8px] font-black uppercase text-slate-400 tracking-widest ml-1">{t.responsibles} (múltipla escolha)</label>
                  <div className="flex flex-wrap gap-1.5 p-2 bg-slate-50 dark:bg-slate-800 rounded-lg max-h-24 overflow-y-auto">
                    {users.map(u => (
                      <label key={u.id} className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white dark:bg-slate-700 cursor-pointer hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-xs">
                        <input type="checkbox" name="responsibleIds" value={u.id} defaultChecked={respIds.includes(u.id)} className="rounded" />
                        <span className="font-bold">{u.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="md:col-span-2 pt-1">
                  <Button type="submit" className="w-full py-2 rounded-lg bg-[#10b981] shadow-emerald-500/20 shadow-lg text-xs uppercase tracking-[0.1em]">{editTask ? 'Guardar' : 'Criar'}</Button>
                </div>
              </form>
           </div>
        </div>
        );
      })()}

      {/* Add User Modal */}
      {isAddUserOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl p-8 border border-slate-100 dark:border-slate-800 shadow-2xl">
            <h2 className="text-2xl font-black mb-6">Novo Utilizador</h2>
            {userFormError && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="text-rose-500 mt-0.5 flex-shrink-0" size={16} />
                  <p className="text-rose-700 text-sm">{userFormError}</p>
                </div>
              </div>
            )}
            <form onSubmit={async (e) => {
              e.preventDefault();
              setUserFormError(null);
              const fd = new FormData(e.target as HTMLFormElement);
              const newUser: User = { id: 'u-' + Math.random().toString(36).substr(2, 9), name: fd.get('name') as string, email: fd.get('email') as string, role: (fd.get('role') as UserRole) || UserRole.EMPLOYEE, position: (fd.get('position') as string) || '', mustChangePassword: true, localPassword: '' };
              let createdUser = newUser;

              try {
                // Verificar se o email já existe localmente
                const emailExistsLocally = users.some(u => u.email.toLowerCase() === newUser.email.toLowerCase());
                if (emailExistsLocally) {
                  setUserFormError('Este email já está cadastrado no sistema. Use um email diferente.');
                  return;
                }
                
                const apiResponse = await apiAdminUsers.create({
                  name: newUser.name,
                  email: newUser.email,
                  position: newUser.position,
                  role: newUser.role
                });

                if (apiResponse?.user) {
                  createdUser = mapUserFromAPI(apiResponse.user);
                } else if (apiResponse?.id) {
                  createdUser = mapUserFromAPI(apiResponse);
                }

                if (apiResponse?.inviteLink) {
                  logger.debug('User', 'Link de convite gerado', apiResponse.inviteLink);
                }
              } catch (error: any) {
                // Verificar se é erro de email duplicado (409)
                if (error.message?.includes('409') || error.message?.includes('Conflict') || error.message?.toLowerCase().includes('email') || error.message?.toLowerCase().includes('duplicate')) {
                  setUserFormError('Este email já está cadastrado no sistema. Use um email diferente.');
                  return;
                }
                logger.warn('User', 'Erro ao criar utilizador na API, criando localmente...', error);
                setUserFormError('Não foi possível criar na API. O utilizador foi criado localmente.');
              }
              
              saveUsers([...users, createdUser]);
              if (createdUser.localPassword) {
                addNotification(user!.id, `Credenciais temporárias de ${createdUser.email}: ${createdUser.localPassword}`, 'info');
              }
              users.filter(u => u.role === UserRole.ADMIN).forEach(u => {
                addNotification(u.id, `Novo utilizador criado: ${createdUser.name} (${createdUser.email})`, 'info');
              });
              setIsAddUserOpen(false);
            }}>
              <div className="space-y-4">
                <div><label className="text-[10px] font-black uppercase text-slate-400 block mb-1">{t.name}</label><input name="name" className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 font-bold" required /></div>
                <div><label className="text-[10px] font-black uppercase text-slate-400 block mb-1">{t.email}</label><input name="email" type="email" className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 font-bold" required /></div>
                <div><label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Cargo/Posição</label><input name="position" className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 font-bold" /></div>
                <div><label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Função</label><select name="role" className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 font-bold"><option value={UserRole.EMPLOYEE}>Funcionário</option><option value={UserRole.ADMIN}>Administrador</option></select></div>
                <p className="text-[10px] text-slate-400">Uma senha temporária será gerada automaticamente e enviada por email.</p>
              </div>
              <div className="flex gap-3 mt-6"><Button type="submit" className="flex-1">Adicionar</Button><Button type="button" variant="ghost" onClick={() => { setUserFormError(null); setIsAddUserOpen(false); }}>{t.cancel}</Button></div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editingUserId && (() => {
        const u = users.find(x => x.id === editingUserId);
        if (!u) return null;
        return (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl p-8 border border-slate-100 dark:border-slate-800 shadow-2xl">
              <h2 className="text-2xl font-black mb-6">{t.editUser}</h2>
              {userFormError && (
                <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="text-rose-500 mt-0.5 flex-shrink-0" size={16} />
                    <p className="text-rose-700 text-sm">{userFormError}</p>
                  </div>
                </div>
              )}
              <form onSubmit={async (e) => {
                e.preventDefault();
                setUserFormError(null);
                const fd = new FormData(e.target as HTMLFormElement);
                const updated = users.map(x => x.id !== editingUserId ? x : { ...x, name: fd.get('name') as string, email: fd.get('email') as string, position: fd.get('position') as string, role: (fd.get('role') as UserRole) || x.role });
                
                try {
                  await apiUsers.update(editingUserId, updated.find(x => x.id === editingUserId)!);
                } catch (error) {
                  logger.warn('User', 'Erro ao atualizar utilizador na API, atualizando localmente...');
                  setUserFormError('Não foi possível atualizar na API. Os dados foram salvos localmente.');
                }
                
                saveUsers(updated);
                users.filter(u => u.role === UserRole.ADMIN).forEach(u => {
                  const updatedUser = updated.find(x => x.id === editingUserId);
                  if (updatedUser) {
                    addNotification(u.id, `Utilizador atualizado: ${updatedUser.name} (${updatedUser.email})`, 'info');
                  }
                });
                setEditingUserId(null);
              }}>
                <div className="space-y-4">
                  <div><label className="text-[10px] font-black uppercase text-slate-400 block mb-1">{t.name}</label><input name="name" defaultValue={u.name} className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 font-bold" required /></div>
                  <div><label className="text-[10px] font-black uppercase text-slate-400 block mb-1">{t.email}</label><input name="email" type="email" defaultValue={u.email} className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 font-bold" required /></div>
                  <div><label className="text-[10px] font-black uppercase text-slate-400 block mb-1">{t.position}</label><input name="position" defaultValue={u.position} className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 font-bold" /></div>
                  <div><label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Função</label><select name="role" defaultValue={u.role} className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 font-bold"><option value={UserRole.EMPLOYEE}>Funcionário</option><option value={UserRole.ADMIN}>Administrador</option></select></div>
                </div>
                <div className="flex gap-3 mt-6"><Button type="submit" className="flex-1">{t.save}</Button><Button type="button" variant="ghost" onClick={() => { setUserFormError(null); setEditingUserId(null); }}>{t.cancel}</Button></div>
              </form>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

function SidebarNavItem({ icon, label, active, collapsed, onClick }: any) {
  return (
    <button onClick={onClick} className={`w-full flex items-center gap-5 px-6 py-4 rounded-2xl transition-all group relative 
      ${active ? 'bg-[#10b981] text-white shadow-xl shadow-emerald-500/20' : 'text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white'}`}>
      <div className={`transition-transform duration-300 ${active ? 'scale-110' : 'group-hover:scale-110'}`}>{icon}</div>
      {!collapsed && <span className="text-[11px] font-black uppercase tracking-widest animate-in font-bold">{label}</span>}
    </button>
  );
}

function StatCard({ icon, label, value, color }: any) {
  const bgColors: any = { emerald: 'bg-emerald-50 dark:bg-emerald-900/10', rose: 'bg-rose-50 dark:bg-rose-900/10' };
  return (
    <div className="bg-white dark:bg-slate-900 p-8 rounded-[3.5rem] border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-8 group hover:shadow-xl transition-all">
       <div className={`w-20 h-20 rounded-[2.2rem] flex items-center justify-center ${bgColors[color] || 'bg-slate-50'} group-hover:scale-110 transition-transform`}>
          {icon}
       </div>
       <div>
          <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{label}</p>
          <p className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter mt-1">{value}</p>
       </div>
    </div>
  );
}

function TaskCard({ task, user, users, onAdvance, onDelete, onEdit, onAddComment }: any) {
  const currentIndex = StatusOrder.indexOf(task.status);
  const nextStatus = StatusOrder[currentIndex + 1];
  const isFinished = task.status === TaskStatus.TERMINADO;
  const isClosed = task.status === TaskStatus.FECHADO;
  const isEmployee = user.role === UserRole.EMPLOYEE;
  const isMyTask = task.responsibleId === user.id;
  const respName = users?.find((u: User) => u.id === task.responsibleId)?.name;
  const extra = task.intervenientes?.length ? ` +${task.intervenientes.length}` : '';
  const [commentText, setCommentText] = useState('');
  const [showAllComments, setShowAllComments] = useState(false);
  const isAdmin = user.role === UserRole.ADMIN;
  const isTaskMember = task.responsibleId === user.id || task.intervenientes?.includes(user.id);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-[3.5rem] p-6 sm:p-10 border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-2xl transition-all group flex flex-col h-full relative overflow-hidden">
       {task.status === TaskStatus.ATRASADA && <div className="absolute top-0 right-0 w-24 sm:w-32 h-24 sm:h-32 bg-rose-500/10 rounded-full -mr-12 sm:-mr-16 -mt-12 sm:-mt-16 flex items-end justify-start p-4 sm:p-8"><AlertTriangle className="text-rose-500" size={20} /></div>}
       
       <div className="flex justify-between items-start mb-4 sm:mb-8">
          <span className={`px-3 sm:px-5 py-1.5 sm:py-2 rounded-full text-[8px] sm:text-[9px] font-black uppercase tracking-widest ${STATUS_COLORS[task.status]}`}>
             {task.status}
          </span>
          {user.role === UserRole.ADMIN && (
             <div className="flex gap-1">
               {onEdit && <button onClick={onEdit} className="p-2 text-slate-300 hover:text-[#10b981] transition-colors" title="Editar"><Pencil size={16}/></button>}
               <button onClick={onDelete} className="p-2 text-slate-300 hover:text-rose-500 transition-colors" title="Eliminar"><Trash2 size={16}/></button>
             </div>
          )}
       </div>
       
       <div className="flex-1 space-y-3 sm:space-y-4">
          <h3 className="text-lg sm:text-2xl font-black tracking-tight leading-tight group-hover:text-[#10b981] transition-colors">{task.title}</h3>
          <p className="text-xs sm:text-sm text-slate-400 font-medium leading-relaxed line-clamp-3">{task.description}</p>
          {respName && <p className="text-[10px] font-bold text-slate-500 uppercase">Responsável: {respName}{extra}</p>}

          {/* Seção de comentários */}
          {(isTaskMember || isAdmin) && (
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-bold text-slate-500">💬 Comentários ({task.comments?.length || 0})</p>
                {isAdmin && task.comments?.length > 0 && (
                  <button 
                    onClick={() => setShowAllComments(!showAllComments)}
                    className="text-[9px] font-bold text-[#10b981] hover:text-[#059669] transition-colors"
                  >
                    {showAllComments ? 'Ocultar tudo' : 'Ver tudo'}
                  </button>
                )}
              </div>
              
              {/* Mostrar comentários */}
              {(showAllComments || !isAdmin) && (
                <div className="space-y-2 mb-3 max-h-32 overflow-y-auto">
                  {(task.comments || []).map((c: any) => (
                    <div key={c.id} className="text-sm text-slate-600 bg-slate-50 dark:bg-slate-800 p-2 rounded-md">
                      <span className="font-bold text-slate-800 dark:text-white mr-2">{c.userName}:</span>
                      <span className="text-slate-600 dark:text-slate-300">{c.text}</span>
                      <div className="text-[9px] text-slate-400 mt-1">{new Date(c.timestamp).toLocaleString('pt-PT')}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Campo para adicionar comentário - apenas para membros da tarefa */}
              {isTaskMember && (
                <div className="flex gap-2">
                  <input 
                    value={commentText} 
                    onChange={e => setCommentText(e.target.value)}
                    onKeyPress={(e) => { if (e.key === 'Enter' && commentText.trim()) { onAddComment && onAddComment(commentText.trim()); setCommentText(''); } }}
                    placeholder="Adicionar comentário..." 
                    className="flex-1 px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 outline-none text-xs" 
                  />
                  <button 
                    onClick={() => { if (commentText.trim()) { onAddComment && onAddComment(commentText.trim()); setCommentText(''); } }} 
                    className="px-3 py-1.5 rounded-lg bg-[#10b981] text-white font-bold text-xs hover:bg-[#059669] transition-colors"
                  >
                    +
                  </button>
                </div>
              )}
            </div>
          )}
       </div>

       <div className="mt-6 sm:mt-10 pt-6 sm:pt-8 border-t border-slate-50 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-2 text-slate-400">
             <Calendar size={14}/>
             <span className="text-[10px] font-black uppercase tracking-widest">Prazo: {new Date(task.deliveryDate).toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
          </div>
          {!isClosed && nextStatus && (isMyTask || !isEmployee) && (
            <button 
              disabled={isFinished && isEmployee}
              onClick={onAdvance}
              className={`flex-1 sm:max-w-[140px] py-2.5 sm:py-3 rounded-xl sm:rounded-2xl text-[9px] font-black uppercase tracking-widest shadow-xl transition-all flex items-center justify-center gap-2
                ${isFinished ? 'bg-[#10b981] text-white shadow-emerald-500/20' : 'bg-slate-900 dark:bg-slate-700 text-white hover:bg-[#10b981]'}`}
            >
               {isFinished ? (user.role === UserRole.ADMIN ? <Check size={14}/> : <ShieldCheck size={14}/>) : <ArrowRight size={14}/>}
               {isFinished ? (user.role === UserRole.ADMIN ? 'Validar' : 'Finalizada') : 'Avançar'}
            </button>
          )}
          {isClosed && <div className="text-[#10b981] flex items-center gap-1 font-black text-[9px] uppercase tracking-widest"><CheckCircle2 size={16}/> Fechada</div>}
       </div>
    </div>
  );
}
