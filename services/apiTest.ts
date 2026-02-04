/**
 * Teste de integração com a API
 * Execute isto para validar a conexão e funcionalidade
 */

import {
  apiAuth,
  apiTasks,
  apiUsers,
  apiComments,
  apiActivities,
  apiNotifications,
  apiReports,
  apiHealth,
  setAuthToken,
  getAuthToken,
  mapUserFromAPI,
  mapTaskFromAPI,
  mapCommentFromAPI
} from './apiService';
import { logger } from './logger';

interface TestResult {
  name: string;
  passed: boolean;
  message: string;
  duration: number;
}

class APITester {
  private results: TestResult[] = [];
  private token: string | null = null;

  async runAllTests(): Promise<TestResult[]> {
    console.log('🧪 Iniciando testes da API...\n');

    await this.testHealthCheck();
    await this.testLogin();
    
    if (this.token) {
      await this.testGetTasks();
      await this.testGetUsers();
      await this.testGetCurrentUser();
    } else {
      console.warn('⚠️  Skipping authenticated tests - login failed');
    }

    this.printResults();
    return this.results;
  }

  private async testHealthCheck(): Promise<void> {
    const start = performance.now();
    try {
      const result = await apiHealth.ping();
      const duration = performance.now() - start;
      this.results.push({
        name: 'Health Check',
        passed: true,
        message: `API is UP. Status: ${result.status}`,
        duration
      });
      console.log('✅ Health Check');
    } catch (error: any) {
      const duration = performance.now() - start;
      this.results.push({
        name: 'Health Check',
        passed: false,
        message: error.message,
        duration
      });
      console.log('❌ Health Check:', error.message);
    }
  }

  private async testLogin(): Promise<void> {
    const start = performance.now();
    try {
      // Credenciais de teste - você pode alterar isso
      const response = await apiAuth.login('admin@example.com', 'admin123');
      const duration = performance.now() - start;

      if (response.token || response.jwt) {
        this.token = response.token || response.jwt;
        setAuthToken(this.token);
        
        this.results.push({
          name: 'Login',
          passed: true,
          message: `Login bem-sucedido. User: ${response.user?.name || response.name || 'Unknown'}`,
          duration
        });
        console.log('✅ Login bem-sucedido');
      } else {
        this.results.push({
          name: 'Login',
          passed: false,
          message: 'Resposta de login sem token',
          duration
        });
        console.log('❌ Login: Sem token na resposta');
      }
    } catch (error: any) {
      const duration = performance.now() - start;
      this.results.push({
        name: 'Login',
        passed: false,
        message: error.message,
        duration
      });
      console.log('❌ Login:', error.message);
    }
  }

  private async testGetTasks(): Promise<void> {
    const start = performance.now();
    try {
      const response = await apiTasks.getAll();
      const duration = performance.now() - start;

      // Handle different response formats
      let tasks = Array.isArray(response) ? response : (response.data || response.tasks || []);
      const taskCount = tasks.length;

      // Test mapping
      if (tasks.length > 0) {
        const mappedTask = mapTaskFromAPI(tasks[0]);
        this.results.push({
          name: 'Get Tasks',
          passed: true,
          message: `Carregadas ${taskCount} tarefas. Mapeamento funcionando.`,
          duration
        });
        console.log(`✅ Get Tasks: ${taskCount} tarefas carregadas`);
      } else {
        this.results.push({
          name: 'Get Tasks',
          passed: true,
          message: 'Nenhuma tarefa encontrada (esperado)',
          duration
        });
        console.log('✅ Get Tasks: Sem tarefas (normal)');
      }
    } catch (error: any) {
      const duration = performance.now() - start;
      this.results.push({
        name: 'Get Tasks',
        passed: false,
        message: error.message,
        duration
      });
      console.log('❌ Get Tasks:', error.message);
    }
  }

  private async testGetUsers(): Promise<void> {
    const start = performance.now();
    try {
      const response = await apiUsers.getAll();
      const duration = performance.now() - start;

      let users = Array.isArray(response) ? response : (response.data || response.users || []);
      const userCount = users.length;

      if (users.length > 0) {
        const mappedUser = mapUserFromAPI(users[0]);
        this.results.push({
          name: 'Get Users',
          passed: true,
          message: `Carregados ${userCount} utilizadores. Mapeamento funcionando.`,
          duration
        });
        console.log(`✅ Get Users: ${userCount} utilizadores carregados`);
      } else {
        this.results.push({
          name: 'Get Users',
          passed: true,
          message: 'Nenhum utilizador encontrado',
          duration
        });
        console.log('✅ Get Users: Sem utilizadores (normal)');
      }
    } catch (error: any) {
      const duration = performance.now() - start;
      this.results.push({
        name: 'Get Users',
        passed: false,
        message: error.message,
        duration
      });
      console.log('❌ Get Users:', error.message);
    }
  }

  private async testGetCurrentUser(): Promise<void> {
    const start = performance.now();
    try {
      const user = await apiAuth.getCurrentUser();
      const duration = performance.now() - start;

      this.results.push({
        name: 'Get Current User',
        passed: true,
        message: `Utilizador atual: ${user.name || user.email}`,
        duration
      });
      console.log('✅ Get Current User:', user.name || user.email);
    } catch (error: any) {
      const duration = performance.now() - start;
      this.results.push({
        name: 'Get Current User',
        passed: false,
        message: error.message,
        duration
      });
      console.log('❌ Get Current User:', error.message);
    }
  }

  private printResults(): void {
    console.log('\n' + '='.repeat(60));
    console.log('📊 RESUMO DOS TESTES');
    console.log('='.repeat(60));

    const passed = this.results.filter(r => r.passed).length;
    const failed = this.results.filter(r => !r.passed).length;
    const totalDuration = this.results.reduce((sum, r) => sum + r.duration, 0);

    this.results.forEach(result => {
      const icon = result.passed ? '✅' : '❌';
      const time = `${result.duration.toFixed(0)}ms`;
      console.log(`${icon} ${result.name.padEnd(20)} - ${result.message} (${time})`);
    });

    console.log('\n' + '-'.repeat(60));
    console.log(`Total: ${passed} ✅ | ${failed} ❌ | Tempo total: ${totalDuration.toFixed(0)}ms`);
    console.log('='.repeat(60) + '\n');
  }
}

// Export para uso em desenvolvimento
export const runAPITests = async () => {
  const tester = new APITester();
  return tester.runAllTests();
};

// Para executar no console do navegador:
// runAPITests().then(results => console.log(results));
