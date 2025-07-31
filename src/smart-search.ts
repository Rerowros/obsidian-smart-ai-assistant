import { TFile, Vault } from 'obsidian';
import { GoogleAIService } from './googleai-service';
import { GoogleAISettings } from './types';
import { TextUtils, SearchUtils } from './utils';

export interface SearchResult {
	file: TFile;
	content: string;
	relevance: number;
	snippet: string;
}

export class SmartSearchService {
	private vault: Vault;
	private aiService: GoogleAIService;
	private settings: GoogleAISettings;

	constructor(vault: Vault, aiService: GoogleAIService, settings: GoogleAISettings) {
		this.vault = vault;
		this.aiService = aiService;
		this.settings = settings;
	}

	updateSettings(settings: GoogleAISettings) {
		this.settings = settings;
	}

	/**
	 * Выполняет умный поиск с несколькими стратегиями
	 */
	async performSmartSearch(query: string, excludeSearchResults: boolean = true): Promise<string> {
		try {
			console.log('Starting smart search for:', query);

			if (!this.settings.smartSearch) {
				return this.performBasicAISearch(query, excludeSearchResults);
			}

			// Этап 1: Простой текстовый поиск
			const directResults = await this.performTextSearch(query, excludeSearchResults);
			console.log('Direct search results:', directResults.length);

			if (directResults.length > 0) {
				// Найдены прямые совпадения - используем их
				return this.generateResponseFromFiles(query, directResults);
			}

			// Этап 2: Поиск синонимов и переводов
			const expandedQuery = await this.expandQuery(query);
			console.log('Expanded query:', expandedQuery);

			if (expandedQuery !== query) {
				const synonymResults = await this.performTextSearch(expandedQuery, excludeSearchResults);
				console.log('Synonym search results:', synonymResults.length);

				if (synonymResults.length > 0) {
					return this.generateResponseFromFiles(query, synonymResults);
				}
			}

			// Этап 3: Семантический поиск по всем файлам
			console.log('Performing semantic search across all files');
			return this.performSemanticSearch(query, excludeSearchResults);

		} catch (error) {
			console.error('Smart search error:', error);
			throw error;
		}
	}

	/**
	 * Выполняет умный поиск с несколькими стратегиями в стриминговом режиме
	 */
	async performSmartSearchStream(query: string, onChunk?: (chunk: string) => void, excludeSearchResults: boolean = true): Promise<string> {
		try {
			console.log('Starting smart search stream for:', query);

			if (!this.settings.smartSearch) {
				return this.performBasicAISearchStream(query, onChunk, excludeSearchResults);
			}

			// Этап 1: Простой текстовый поиск
			const directResults = await this.performTextSearch(query, excludeSearchResults);
			console.log('Direct search results:', directResults.length);

			if (directResults.length > 0) {
				// Найдены прямые совпадения - используем их
				return this.generateStreamResponseFromFiles(query, directResults, onChunk);
			}

			// Этап 2: Поиск синонимов и переводов
			const expandedQuery = await this.expandQuery(query);
			console.log('Expanded query:', expandedQuery);

			if (expandedQuery !== query) {
				const synonymResults = await this.performTextSearch(expandedQuery, excludeSearchResults);
				console.log('Synonym search results:', synonymResults.length);

				if (synonymResults.length > 0) {
					return this.generateStreamResponseFromFiles(query, synonymResults, onChunk);
				}
			}

			// Этап 3: Семантический поиск по всем файлам
			console.log('Performing semantic search across all files');
			return this.performSemanticSearchStream(query, onChunk, excludeSearchResults);

		} catch (error) {
			console.error('Smart search stream error:', error);
			throw error;
		}
	}

	/**
	 * Выполняет простой текстовый поиск по содержимому файлов
	 */
	private async performTextSearch(query: string, excludeSearchResults: boolean = true): Promise<SearchResult[]> {
		const files = this.vault.getMarkdownFiles();
		const results: SearchResult[] = [];
		const queryWords = query.toLowerCase().split(/\s+/);

		for (const file of files) {
			// Исключаем файлы из папки результатов поиска если опция включена
			if (excludeSearchResults && file.path.startsWith(this.settings.searchFolderPath + '/')) {
				continue;
			}
			
			try {
				const content = await this.vault.read(file);
				const cleanContent = TextUtils.cleanTextForSearch(content);
				const relevance = this.calculateTextRelevance(cleanContent, queryWords);

				if (relevance > 0) {
					const snippet = this.extractRelevantSnippet(cleanContent, queryWords);
					results.push({
						file,
						content: cleanContent,
						relevance,
						snippet
					});
				}
			} catch (error) {
				console.error(`Failed to read file ${file.path}:`, error);
			}
		}

		return results
			.sort((a, b) => b.relevance - a.relevance)
			.slice(0, this.settings.contextLimit);
	}

	/**
	 * Расширяет запрос с помощью синонимов и переводов
	 */
	private async expandQuery(query: string): Promise<string> {
		try {
			const expandPrompt = `
Проанализируй поисковый запрос и предоставь:
1. Ключевые синонимы на русском языке
2. Английский перевод ключевых терминов
3. Связанные технические термины

Запрос: "${query}"

Предоставь только расширенные поисковые термины, разделенные пробелами, без объяснений.
Сосредоточься на наиболее важных концепциях, которые помогут найти релевантную информацию.
`;

			const expansion = await this.aiService.generateResponse(expandPrompt);
			const expandedTerms = expansion
				.split(/[,\n]/)
				.map(term => term.trim())
				.filter(term => term.length > 2)
				.join(' ');

			return `${query} ${expandedTerms}`;
		} catch (error) {
			console.error('Query expansion failed:', error);
			return query;
		}
	}

	/**
	 * Выполняет семантический поиск по всем файлам
	 */
	private async performSemanticSearch(query: string, excludeSearchResults: boolean = true): Promise<string> {
		const files = this.vault.getMarkdownFiles()
			.filter(file => !excludeSearchResults || !file.path.startsWith(this.settings.searchFolderPath + '/'));
		const allContent: string[] = [];

		// Загружаем файлы батчами для оптимизации
		const batchSize = 5;
		for (let i = 0; i < files.length; i += batchSize) {
			const batch = files.slice(i, i + batchSize);
			const batchPromises = batch.map(async (file) => {
				try {
					const content = await this.vault.read(file);
					return `# ${file.name}\n${TextUtils.cleanTextForSearch(content)}`;
				} catch (error) {
					console.error(`Failed to read file ${file.path}:`, error);
					return '';
				}
			});

			const batchResults = await Promise.all(batchPromises);
			allContent.push(...batchResults.filter(content => content.length > 0));

			// Ограничиваем общий размер контекста
			if (allContent.length >= this.settings.contextLimit) {
				break;
			}
		}

		return this.aiService.intelligentSearch(query, allContent);
	}

	/**
	 * Выполняет семантический поиск в стриминговом режиме
	 */
	private async performSemanticSearchStream(query: string, onChunk?: (chunk: string) => void, excludeSearchResults: boolean = true): Promise<string> {
		const files = this.vault.getMarkdownFiles()
			.filter(file => !excludeSearchResults || !file.path.startsWith(this.settings.searchFolderPath + '/'));
		const allContent: string[] = [];

		// Загружаем файлы батчами
		const batchSize = 5;
		for (let i = 0; i < files.length; i += batchSize) {
			const batch = files.slice(i, i + batchSize);
			const batchPromises = batch.map(async (file) => {
				try {
					const content = await this.vault.read(file);
					return `# ${file.name}\n${TextUtils.cleanTextForSearch(content)}`;
				} catch (error) {
					console.error(`Failed to read file ${file.path}:`, error);
					return '';
				}
			});

			const batchResults = await Promise.all(batchPromises);
			allContent.push(...batchResults.filter(content => content.length > 0));

			if (allContent.length >= this.settings.contextLimit) {
				break;
			}
		}

		const contextContent = allContent.join('\n\n---\n\n');
		
		const searchPrompt = `
На основе следующего содержимого из моего хранилища знаний, предоставь подробный ответ на мой вопрос.

Содержимое хранилища:
${contextContent}

Вопрос: ${query}

Предоставь детальный ответ на основе доступной информации. Если информации недостаточно, укажи, какой дополнительный контекст мог бы помочь.
		`;

		return this.aiService.generateStreamResponse(searchPrompt, undefined, onChunk);
	}

	/**
	 * Генерирует ответ на основе найденных файлов
	 */
	private async generateResponseFromFiles(query: string, results: SearchResult[]): Promise<string> {
		const contextFiles = results.map(result => 
			`# ${result.file.basename}\n${result.content}`
		);

		const smartPrompt = this.createSmartPrompt(query, results);
		
		try {
			return await this.aiService.generateResponse(smartPrompt, contextFiles.join('\n\n---\n\n'));
		} catch (error) {
			if (error.message.includes('overloaded') || error.message.includes('503')) {
				// Если модель перегружена, попробуем с более легкой моделью
				console.log('Model overloaded, trying with lighter model...');
				await this.switchToLighterModel();
				return await this.aiService.generateResponse(smartPrompt, contextFiles.join('\n\n---\n\n'));
			}
			throw error;
		}
	}

	/**
	 * Генерирует ответ в стриминговом режиме на основе найденных файлов
	 */
	private async generateStreamResponseFromFiles(query: string, results: SearchResult[], onChunk?: (chunk: string) => void): Promise<string> {
		const contextFiles = results.map(result => 
			`# ${result.file.basename}\n${result.content}`
		);

		const smartPrompt = this.createSmartPrompt(query, results);
		
		try {
			return await this.aiService.generateStreamResponse(smartPrompt, contextFiles.join('\n\n---\n\n'), onChunk);
		} catch (error) {
			if (error.message.includes('overloaded') || error.message.includes('503')) {
				console.log('Model overloaded, trying with lighter model...');
				await this.switchToLighterModel();
				return await this.aiService.generateStreamResponse(smartPrompt, contextFiles.join('\n\n---\n\n'), onChunk);
			}
			throw error;
		}
	}

	/**
	 * Создает умный промпт с учетом контекста поиска
	 */
	private createSmartPrompt(query: string, results: SearchResult[]): string {
		const fileNames = results.map(r => r.file.basename).join(', ');
		
		return `
Ты - эксперт-аналитик, который помогает находить и анализировать информацию в персональном хранилище знаний.

КОНТЕКСТ ПОИСКА:
- Найдено ${results.length} релевантных файлов: ${fileNames}
- Каждый файл имеет релевантность от ${Math.min(...results.map(r => r.relevance))} до ${Math.max(...results.map(r => r.relevance))}

ЗАДАЧА:
Проанализируй представленную информацию и дай подробный, структурированный ответ на вопрос пользователя.

ТРЕБОВАНИЯ К ОТВЕТУ:
1. Используй только информацию из предоставленных файлов
2. Структурируй ответ логически с использованием заголовков и списков
3. Укажи источники информации (названия файлов) 
4. Если информации недостаточно, четко укажи, что именно отсутствует
5. Предоставь практические выводы и рекомендации если возможно

ВОПРОС ПОЛЬЗОВАТЕЛЯ: ${query}

Предоставь детальный ответ:`;
	}

	/**
	 * Переключается на более легкую модель при перегрузке
	 */
	private async switchToLighterModel() {
		const currentModel = this.settings.selectedModel;
		
		if (currentModel === 'gemini-2.5-flash') {
			this.settings.selectedModel = 'gemini-2.5-flash-lite';
		}
		
		this.aiService.updateSettings(this.settings);
		console.log(`Switched to lighter model: ${this.settings.selectedModel}`);
	}

	/**
	 * Выполняет базовый AI поиск без умных стратегий
	 */
	private async performBasicAISearch(query: string, excludeSearchResults: boolean = true): Promise<string> {
		const files = this.vault.getMarkdownFiles();
		const content: string[] = [];
		
		const filesToProcess = files
			.filter(file => !excludeSearchResults || !file.path.startsWith(this.settings.searchFolderPath + '/'))
			.slice(0, this.settings.contextLimit);
		
		for (const file of filesToProcess) {
			try {
				const fileContent = await this.vault.read(file);
				content.push(`# ${file.name}\n${fileContent}`);
			} catch (error) {
				console.error(`Failed to read file ${file.path}:`, error);
			}
		}
		
		return this.aiService.intelligentSearch(query, content);
	}

	/**
	 * Выполняет базовый AI поиск в стриминговом режиме
	 */
	private async performBasicAISearchStream(query: string, onChunk?: (chunk: string) => void, excludeSearchResults: boolean = true): Promise<string> {
		const files = this.vault.getMarkdownFiles();
		const content: string[] = [];
		
		const filesToProcess = files
			.filter(file => !excludeSearchResults || !file.path.startsWith(this.settings.searchFolderPath + '/'))
			.slice(0, this.settings.contextLimit);
		
		for (const file of filesToProcess) {
			try {
				const fileContent = await this.vault.read(file);
				content.push(`# ${file.name}\n${fileContent}`);
			} catch (error) {
				console.error(`Failed to read file ${file.path}:`, error);
			}
		}
		
		const contextContent = content.join('\n\n---\n\n');
		const searchPrompt = `
На основе следующего содержимого из моего хранилища знаний, предоставь подробный ответ на мой вопрос.

Содержимое хранилища:
${contextContent}

Вопрос: ${query}

Предоставь подробный ответ на основе доступной информации.
		`;

		return this.aiService.generateStreamResponse(searchPrompt, undefined, onChunk);
	}

	/**
	 * Вычисляет релевантность текста для поискового запроса
	 */
	private calculateTextRelevance(text: string, queryWords: string[]): number {
		const lowerText = text.toLowerCase();
		let score = 0;
		
		queryWords.forEach(word => {
			if (word.length < 3) return; // Игнорируем короткие слова
			
			const wordRegex = new RegExp(`\\b${word}\\b`, 'gi');
			const matches = lowerText.match(wordRegex) || [];
			score += matches.length * word.length; // Вес зависит от длины слова
		});
		
		// Бонус за точное совпадение фразы
		const exactMatch = queryWords.join(' ');
		if (lowerText.includes(exactMatch.toLowerCase())) {
			score += exactMatch.length * 2;
		}
		
		return score;
	}

	/**
	 * Извлекает релевантный фрагмент текста
	 */
	private extractRelevantSnippet(text: string, queryWords: string[], maxLength: number = 200): string {
		const sentences = text.split(/[.!?]+/);
		let bestSentence = '';
		let bestScore = 0;

		for (const sentence of sentences) {
			const score = this.calculateTextRelevance(sentence, queryWords);
			if (score > bestScore) {
				bestScore = score;
				bestSentence = sentence.trim();
			}
		}

		return TextUtils.truncateText(bestSentence || text, maxLength);
	}
}
