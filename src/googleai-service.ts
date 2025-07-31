import { GoogleGenAI } from '@google/genai';
import { GoogleAIModel, GoogleAISettings, TokenUsage, WebSearchResult, CodeExecutionResult } from './types';
import { getPrompts, formatPrompt } from './prompts';

export class GoogleAIService {
	private genAI: GoogleGenAI | null = null;
	private settings: GoogleAISettings;
	private tokenUsage: TokenUsage = { inputTokens: 0, outputTokens: 0, totalTokens: 0 };

	constructor(settings: GoogleAISettings) {
		this.settings = settings;
		this.initializeAPI();
	}

	private initializeAPI() {
		if (!this.settings.apiKey) {
			return;
		}

		try {
			this.genAI = new GoogleGenAI({ apiKey: this.settings.apiKey });
			console.log(`Инициализирован Google Gen AI с API ключом`);
		} catch (error) {
			console.error('Failed to initialize Google Gen AI:', error);
			this.genAI = null;
		}
	}

	private isThinkingModel(modelName: string): boolean {
		// Thinking mode поддерживается в моделях 2.5 серии
		return modelName.includes('2.5');
	}

	updateSettings(settings: GoogleAISettings) {
		this.settings = settings;
		this.initializeAPI();
	}

	async listModels(): Promise<GoogleAIModel[]> {
		if (!this.genAI) {
			throw new Error('Google AI API not initialized');
		}

		try {
			// В текущей версии API нет метода listModels, возвращаем список по умолчанию
			return this.getDefaultModels();
		} catch (error) {
			console.error('Failed to fetch models:', error);
			// Возвращаем список моделей по умолчанию если API недоступен
			return this.getDefaultModels();
		}
	}

	private getDefaultModels(): GoogleAIModel[] {
		return [
			{
				name: 'gemini-2.5-flash',
				displayName: 'Gemini 2.5 Flash ⚡',
				description: 'Быстрый и эффективный AI с поддержкой thinking mode',
				inputTokenLimit: 1000000,
				outputTokenLimit: 32768
			},
			{
				name: 'gemini-2.5-pro',
				displayName: 'Gemini 2.5 Pro �',
				description: 'Мощная модель для сложных задач с максимальным thinking',
				inputTokenLimit: 2000000,
				outputTokenLimit: 32768
			},
			{
				name: 'gemini-2.5-flash-lite',
				displayName: 'Gemini 2.5 Flash Lite 🪶',
				description: 'Облегченная версия для быстрых ответов',
				inputTokenLimit: 1000000,
				outputTokenLimit: 32768
			},
			{
				name: 'gemini-2.0-flash',
				displayName: 'Gemini 2.0 Flash ⭐',
				description: 'Стабильная версия с хорошей производительностью',
				inputTokenLimit: 1000000,
				outputTokenLimit: 32768
			}
		];
	}

	async generateResponse(prompt: string, context?: string): Promise<string> {
		if (!this.genAI) {
			throw new Error('Google Gen AI not initialized. Please check your API key and settings.');
		}

		try {
			const prompts = getPrompts(this.settings.language);
			let fullPrompt = formatPrompt(prompts.smartSearch, {
				context: context || '',
				query: prompt
			});

			// Подсчет входных токенов (приблизительная оценка)
			const inputTokens = this.estimateTokens(fullPrompt);
			
			// Конфигурация для нового API
			const config: any = {
				model: this.settings.selectedModel,
				contents: fullPrompt,
				config: {
					generationConfig: {
						temperature: this.settings.temperature,
						maxOutputTokens: this.settings.maxTokens,
					}
				}
			};

			// Добавляем thinking config если включен
			if (this.settings.thinkingMode && this.isThinkingModel(this.settings.selectedModel)) {
				config.config.thinkingConfig = {
					thinkingBudget: this.settings.thinkingBudget,
					includeThoughts: true
				};
			}

			const result = await this.genAI.models.generateContent(config);
			const text = result.text || '';
			
			// Подсчет выходных токенов
			const outputTokens = this.estimateTokens(text);
			
			// Обновляем статистику токенов
			this.tokenUsage.inputTokens += inputTokens;
			this.tokenUsage.outputTokens += outputTokens;
			this.tokenUsage.totalTokens = this.tokenUsage.inputTokens + this.tokenUsage.outputTokens;
			
			return text;
		} catch (error) {
			console.error('Failed to generate response:', error);
			
			// Улучшенная обработка ошибок
			if (error.message?.includes('is not found for API version')) {
				throw new Error(`❌ Модель "${this.settings.selectedModel}" не доступна. Попробуйте использовать "gemini-2.5-flash" или "gemini-2.5-pro".
				
Возможные решения:
• Проверьте ваш API ключ в настройках
• Убедитесь, что у вас есть интернет соединение  
• Проверьте лимиты вашего Google AI API
• Попробуйте другую модель`);
			}
			
			throw error;
		}
	}

	async generateStreamResponse(prompt: string, context?: string, onChunk?: (chunk: string) => void): Promise<string> {
		if (!this.genAI) {
			throw new Error('Google Gen AI not initialized. Please check your API key and settings.');
		}

		try {
			const prompts = getPrompts(this.settings.language);
			let fullPrompt = formatPrompt(prompts.smartSearch, {
				context: context || '',
				query: prompt
			});

			const inputTokens = this.estimateTokens(fullPrompt);
			
			// Конфигурация для стриминга
			const config: any = {
				model: this.settings.selectedModel,
				contents: fullPrompt,
				config: {
					generationConfig: {
						temperature: this.settings.temperature,
						maxOutputTokens: this.settings.maxTokens,
					}
				}
			};

			// Добавляем thinking config если включен
			if (this.settings.thinkingMode && this.isThinkingModel(this.settings.selectedModel)) {
				config.config.thinkingConfig = {
					thinkingBudget: this.settings.thinkingBudget,
					includeThoughts: true
				};
			}

			const result = await this.genAI.models.generateContentStream(config);
			let fullText = '';

			for await (const chunk of result) {
				const chunkText = chunk.text || '';
				fullText += chunkText;
				onChunk?.(chunkText);
			}

			const outputTokens = this.estimateTokens(fullText);
			this.tokenUsage.inputTokens += inputTokens;
			this.tokenUsage.outputTokens += outputTokens;
			this.tokenUsage.totalTokens = this.tokenUsage.inputTokens + this.tokenUsage.outputTokens;

			return fullText;
		} catch (error) {
			console.error('Failed to generate stream response:', error);
			
			// Улучшенная обработка ошибок для стриминга
			if (error.message?.includes('is not found for API version')) {
				throw new Error(`❌ Модель "${this.settings.selectedModel}" не доступна для стриминга. Попробуйте использовать "gemini-2.5-flash" или "gemini-2.5-pro".
				
Возможные решения:
• Проверьте ваш API ключ в настройках
• Убедитесь, что у вас есть интернет соединение  
• Проверьте лимиты вашего Google AI API
• Попробуйте другую модель`);
			}
			
			throw error;
		}
	}

	private estimateTokens(text: string): number {
		// Приблизительная оценка: 1 токен ≈ 4 символа для латиницы, 2-3 для кириллицы
		const avgCharsPerToken = 3.5;
		return Math.ceil(text.length / avgCharsPerToken);
	}

	getTokenUsage(): TokenUsage {
		return { ...this.tokenUsage };
	}

	resetTokenUsage(): void {
		this.tokenUsage = { inputTokens: 0, outputTokens: 0, totalTokens: 0 };
	}

	async performWebSearch(query: string): Promise<WebSearchResult[]> {
		if (!this.settings.useWebSearch) {
			return [];
		}

		try {
			// Используем Google Search grounding через функцию или инструменты модели
			// Примечание: для реального веб-поиска нужно использовать Google Search grounding
			const groundingPrompt = `Найди информацию в интернете по запросу: "${query}"
			
Пожалуйста, предоставь:
1. Релевантные источники и ссылки
2. Ключевую информацию и цитаты
3. URL источников когда доступно

Отформатируй ответ как структурированную информацию.`;

			const response = await this.generateResponse(groundingPrompt);
			
			// В реальной реализации здесь будет использование Google Search grounding
			return this.parseWebSearchResults(response);
		} catch (error) {
			console.error('Web search failed:', error);
			return [];
		}
	}

	private parseWebSearchResults(response: string): WebSearchResult[] {
		// Базовая имплементация парсинга результатов
		// В реальной версии будет использоваться API Google Grounding
		const results: WebSearchResult[] = [];
		
		// Простой парсер для демонстрации
		const lines = response.split('\n');
		let currentResult: Partial<WebSearchResult> = {};
		
		for (const line of lines) {
			if (line.includes('http')) {
				if (currentResult.title) {
					results.push(currentResult as WebSearchResult);
					currentResult = {};
				}
				currentResult.url = line.trim();
			} else if (line.trim() && !currentResult.title) {
				currentResult.title = line.trim();
			} else if (line.trim() && currentResult.title && !currentResult.snippet) {
				currentResult.snippet = line.trim();
				currentResult.source = 'Web Search';
			}
		}
		
		if (currentResult.title) {
			results.push(currentResult as WebSearchResult);
		}
		
		return results.slice(0, 5); // Ограничиваем количество результатов
	}

	async executeCode(code: string, language: string = 'python'): Promise<CodeExecutionResult> {
		if (!this.settings.useCodeExecution) {
			throw new Error('Code execution is disabled');
		}

		try {
			const prompts = getPrompts(this.settings.language);
			const executionPrompt = `Проанализируй и объясни следующий код на ${language}:

\`\`\`${language}
${code}
\`\`\`

Пожалуйста:
1. Объясни что делает этот код
2. Покажи ожидаемый результат выполнения
3. Укажи на возможные проблемы или улучшения
4. Предложи альтернативные подходы если есть

Примечание: Реальное выполнение кода требует Code Execution API.`;

			const startTime = Date.now();
			const response = await this.generateResponse(executionPrompt);
			const executionTime = Date.now() - startTime;

			// Возвращаем анализ кода вместо реального выполнения
			const result: CodeExecutionResult = {
				code,
				language,
				output: response,
				executionTime
			};

			return result;
		} catch (error) {
			return {
				code,
				language,
				output: '',
				error: `Ошибка анализа кода: ${error.message}`,
				executionTime: 0
			};
		}
	}

	async intelligentSearch(query: string, vaultContent: string[]): Promise<string> {
		if (!this.genAI) {
			throw new Error('Google Gen AI not initialized');
		}

		const contextContent = vaultContent.slice(0, this.settings.contextLimit).join('\n\n---\n\n');
		
		const prompts = getPrompts(this.settings.language);
		const searchPrompt = formatPrompt(prompts.smartSearch, {
			context: contextContent,
			query: query
		});

		return await this.generateResponse(searchPrompt);
	}

	isConfigured(): boolean {
		return !!this.settings.apiKey && !!this.genAI;
	}
}
