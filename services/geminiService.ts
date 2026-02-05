import { GoogleGenerativeAI } from "@google/generative-ai";

// Verifique se a API_KEY está disponível
const API_KEY = process.env.REACT_APP_GEMINI_API_KEY || process.env.API_KEY;

// Inicialize apenas se tiver API key
const ai = API_KEY ? new GoogleGenerativeAI({ apiKey: API_KEY }) : null;

export const getSmartNotification = async (
  taskTitle: string, 
  status: string, 
  isOverdue: boolean,
  isNearDeadline: boolean,
  language: 'pt' | 'en'
): Promise<string> => {
  try {
    // Se não tiver API key, use mensagens locais
    if (!ai) {
      return getLocalNotification(taskTitle, status, isOverdue, isNearDeadline, language);
    }

    const prompt = `
      Task: "${taskTitle}"
      Current Status: ${status}
      Is Overdue: ${isOverdue}
      Is Near Deadline: ${isNearDeadline}
      Language: ${language}

      Act as a task management assistant. Generate a single-sentence notification message.
      If it's overdue, use a firm but professional tone (urgent).
      If it's near deadline, use a motivating tone.
      If it's just a status change, use an informative tone.
      Return ONLY the message text.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    return response.text?.trim() || getLocalNotification(taskTitle, status, isOverdue, isNearDeadline, language);
  } catch (error) {
    console.error("Gemini Error:", error);
    return getLocalNotification(taskTitle, status, isOverdue, isNearDeadline, language);
  }
};

// Função local para fallback
const getLocalNotification = (
  taskTitle: string, 
  status: string, 
  isOverdue: boolean,
  isNearDeadline: boolean,
  language: 'pt' | 'en'
): string => {
  if (language === 'pt') {
    if (isOverdue) return `🚨 ATENÇÃO: A tarefa "${taskTitle}" está ATRASADA! Por favor, conclua urgentemente.`;
    if (isNearDeadline) return `⏰ PRAZO PRÓXIMO: A tarefa "${taskTitle}" está perto do prazo. Mantenha o foco!`;
    if (status === 'FECHADO') return `✅ CONCLUÍDO: A tarefa "${taskTitle}" foi finalizada com sucesso.`;
    if (status === 'TERMINADO') return `🎯 AGUARDANDO VALIDAÇÃO: "${taskTitle}" está pronta para revisão do administrador.`;
    if (status === 'EM_ANDAMENTO') return `🚀 EM ANDAMENTO: A tarefa "${taskTitle}" está sendo executada.`;
    if (status === 'ABERTO') return `📋 ABERTA: A tarefa "${taskTitle}" foi iniciada.`;
    return `📝 ATUALIZAÇÃO: O estado da tarefa "${taskTitle}" mudou para ${status}.`;
  } else {
    if (isOverdue) return `🚨 ATTENTION: Task "${taskTitle}" is OVERDUE! Please complete urgently.`;
    if (isNearDeadline) return `⏰ DEADLINE APPROACHING: Task "${taskTitle}" is near deadline. Stay focused!`;
    if (status === 'FECHADO') return `✅ COMPLETED: Task "${taskTitle}" has been successfully finished.`;
    if (status === 'TERMINADO') return `🎯 AWAITING VALIDATION: "${taskTitle}" is ready for admin review.`;
    if (status === 'EM_ANDAMENTO') return `🚀 IN PROGRESS: Task "${taskTitle}" is being executed.`;
    if (status === 'ABERTO') return `📋 OPENED: Task "${taskTitle}" has been started.`;
    return `📝 UPDATE: Task "${taskTitle}" status changed to ${status}.`;
  }
};