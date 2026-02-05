// geminiService.ts
import { GoogleGenerativeAI } from "@google/generative-ai";

type Lang = "pt" | "en";

/**
 * Suporte a Vite e CRA:
 * - Vite:  import.meta.env.VITE_GEMINI_API_KEY
 * - CRA:   process.env.REACT_APP_GEMINI_API_KEY
 *
 * Nota: usar key no frontend expõe a chave.
 */
const API_KEY =
  (typeof import.meta !== "undefined" &&
    (import.meta as any).env &&
    ((import.meta as any).env.VITE_GEMINI_API_KEY as string)) ||
  (typeof process !== "undefined" &&
    (process as any).env &&
    (((process as any).env.REACT_APP_GEMINI_API_KEY as string) ||
      ((process as any).env.GEMINI_API_KEY as string) ||
      ((process as any).env.API_KEY as string))) ||
  "";

/**
 * Inicializa Gemini apenas se houver chave.
 * A API do SDK é:
 *   const genAI = new GoogleGenerativeAI(API_KEY)
 *   const model = genAI.getGenerativeModel({ model: "..." })
 *   const result = await model.generateContent(prompt)
 *   const text = result.response.text()
 */
const genAI = API_KEY ? new GoogleGenerativeAI(API_KEY) : null;

// Escolha um modelo estável (troca se você tiver certeza do nome do modelo no teu projeto)
const DEFAULT_MODEL = "gemini-2.0-flash";

export async function getSmartNotification(
  taskTitle: string,
  status: string,
  isOverdue: boolean,
  isNearDeadline: boolean,
  language: Lang
): Promise<string> {
  try {
    // Fallback local se não houver chave
    if (!genAI) {
      return getLocalNotification(taskTitle, status, isOverdue, isNearDeadline, language);
    }

    const prompt = buildPrompt(taskTitle, status, isOverdue, isNearDeadline, language);

    const model = genAI.getGenerativeModel({
      model: DEFAULT_MODEL,
      generationConfig: {
        temperature: 0.6,
        maxOutputTokens: 80,
      },
    });

    const result = await model.generateContent(prompt);
    const text = result?.response?.text?.() || "";

    const cleaned = text.trim();
    return cleaned || getLocalNotification(taskTitle, status, isOverdue, isNearDeadline, language);
  } catch (error) {
    console.error("Gemini Error:", error);
    return getLocalNotification(taskTitle, status, isOverdue, isNearDeadline, language);
  }
}

function buildPrompt(
  taskTitle: string,
  status: string,
  isOverdue: boolean,
  isNearDeadline: boolean,
  language: Lang
) {
  // Prompt curto e determinístico, evitando multiline desnecessário
  return [
    `Task: "${taskTitle}"`,
    `Current Status: ${status}`,
    `Is Overdue: ${isOverdue}`,
    `Is Near Deadline: ${isNearDeadline}`,
    `Language: ${language}`,
    ``,
    `Act as a task management assistant.`,
    `Generate a single-sentence notification message.`,
    `If overdue: firm but professional tone (urgent).`,
    `If near deadline: motivating tone.`,
    `Otherwise: informative tone about status change.`,
    `Return ONLY the message text, no quotes, no extra symbols.`,
  ].join("\n");
}

// ================== Fallback Local ==================
function getLocalNotification(
  taskTitle: string,
  status: string,
  isOverdue: boolean,
  isNearDeadline: boolean,
  language: Lang
): string {
  if (language === "pt") {
    if (isOverdue) return `🚨 ATENÇÃO: A tarefa "${taskTitle}" está ATRASADA! Por favor, conclua urgentemente.`;
    if (isNearDeadline) return `⏰ PRAZO PRÓXIMO: A tarefa "${taskTitle}" está perto do prazo. Mantenha o foco!`;
    if (status === "FECHADO") return `✅ CONCLUÍDO: A tarefa "${taskTitle}" foi finalizada com sucesso.`;
    if (status === "TERMINADO") return `🎯 AGUARDANDO VALIDAÇÃO: "${taskTitle}" está pronta para revisão do administrador.`;
    if (status === "EM_ANDAMENTO") return `🚀 EM ANDAMENTO: A tarefa "${taskTitle}" está sendo executada.`;
    if (status === "ABERTO") return `📋 ABERTA: A tarefa "${taskTitle}" foi iniciada.`;
    return `📝 ATUALIZAÇÃO: O estado da tarefa "${taskTitle}" mudou para ${status}.`;
  }

  // en
  if (isOverdue) return `🚨 ATTENTION: Task "${taskTitle}" is OVERDUE! Please complete urgently.`;
  if (isNearDeadline) return `⏰ DEADLINE APPROACHING: Task "${taskTitle}" is near deadline. Stay focused!`;
  if (status === "FECHADO") return `✅ COMPLETED: Task "${taskTitle}" has been successfully finished.`;
  if (status === "TERMINADO") return `🎯 AWAITING VALIDATION: "${taskTitle}" is ready for admin review.`;
  if (status === "EM_ANDAMENTO") return `🚀 IN PROGRESS: Task "${taskTitle}" is being executed.`;
  if (status === "ABERTO") return `📋 OPENED: Task "${taskTitle}" has been started.`;
  return `📝 UPDATE: Task "${taskTitle}" status changed to ${status}.`;
}
