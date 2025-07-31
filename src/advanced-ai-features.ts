import { TFile, Vault, Notice } from 'obsidian';
import { GoogleAIService } from './googleai-service';
import { GoogleAISettings } from './types';

export class AdvancedAIFeatures {
	private vault: Vault;
	private aiService: GoogleAIService;
	private settings: GoogleAISettings;

	constructor(vault: Vault, aiService: GoogleAIService, settings: GoogleAISettings) {
		this.vault = vault;
		this.aiService = aiService;
		this.settings = settings;
	}

	/**
	 * Анализирует структуру и качество заметок в хранилище
	 */
	async analyzeVaultStructure(): Promise<string> {
		const files = this.vault.getMarkdownFiles();
		const analysis = {
			totalFiles: files.length,
			categories: new Map<string, number>(),
			averageLength: 0,
			orphanFiles: 0,
			duplicateTopics: new Set<string>(),
			suggestions: []
		};

		let totalLength = 0;
		const topics = new Set<string>();
		const connections = new Map<string, Set<string>>();

		for (const file of files) {
			try {
				const content = await this.vault.read(file);
				totalLength += content.length;

				// Анализ категорий по папкам
				const folder = file.parent?.name || 'root';
				analysis.categories.set(folder, (analysis.categories.get(folder) || 0) + 1);

				// Поиск дублирующихся тем
				const title = file.basename.toLowerCase();
				if (topics.has(title)) {
					analysis.duplicateTopics.add(title);
				}
				topics.add(title);

				// Анализ связей
				const links = content.match(/\[\[([^\]]+)\]\]/g) || [];
				const fileConnections = new Set<string>();
				links.forEach(link => {
					const linkedFile = link.replace(/\[\[|\]\]/g, '');
					fileConnections.add(linkedFile);
				});
				connections.set(file.basename, fileConnections);

			} catch (error) {
				console.error(`Failed to analyze file ${file.path}:`, error);
			}
		}

		analysis.averageLength = Math.round(totalLength / files.length);
		analysis.orphanFiles = Array.from(connections.entries())
			.filter(([_, links]) => links.size === 0).length;

		const prompt = `
Проанализируй структуру персонального хранилища знаний и дай рекомендации:

СТАТИСТИКА:
- Всего файлов: ${analysis.totalFiles}
- Средняя длина файла: ${analysis.averageLength} символов
- Файлов без связей: ${analysis.orphanFiles}
- Дублирующихся тем: ${analysis.duplicateTopics.size}

КАТЕГОРИИ:
${Array.from(analysis.categories.entries()).map(([cat, count]) => `- ${cat}: ${count} файлов`).join('\n')}

ЗАДАЧА:
1. Оцени организацию информации (структуру папок, связность)
2. Выяви проблемы (изолированные заметки, дубликаты, плохая категоризация)
3. Предложи конкретные улучшения структуры
4. Дай рекомендации по развитию системы знаний

Ответ должен быть практичным и применимым.
		`;

		return await this.aiService.generateResponse(prompt);
	}

	/**
	 * Создает интеллектуальные связи между заметками
	 */
	async suggestConnections(fileName?: string): Promise<string> {
		const files = this.vault.getMarkdownFiles();
		let targetFiles: TFile[];

		if (fileName) {
			const targetFile = files.find(f => f.basename === fileName);
			if (!targetFile) {
				throw new Error(`Файл "${fileName}" не найден`);
			}
			targetFiles = [targetFile];
		} else {
			// Анализируем случайные 5 файлов для демонстрации
			targetFiles = files.sort(() => 0.5 - Math.random()).slice(0, 5);
		}

		const connections: string[] = [];

		for (const file of targetFiles) {
			try {
				const content = await this.vault.read(file);
				
				// Собираем контекст других файлов
				const otherFiles = files
					.filter(f => f.path !== file.path)
					.slice(0, 10) // Ограничиваем для экономии токенов
					.map(f => f.basename);

				const prompt = `
Проанализируй заметку и предложи связи с другими файлами:

ЗАМЕТКА: ${file.basename}
СОДЕРЖАНИЕ:
${content.substring(0, 1500)} ${content.length > 1500 ? '...' : ''}

ДОСТУПНЫЕ ФАЙЛЫ:
${otherFiles.join(', ')}

ЗАДАЧА:
1. Найди 3-5 наиболее релевантных файлов для создания связей
2. Объясни почему эти связи логичны
3. Предложи конкретные способы связать темы

Формат ответа:
- **Файл**: причина связи и способ соединения
				`;

				const response = await this.aiService.generateResponse(prompt);
				connections.push(`\n## ${file.basename}\n${response}`);

			} catch (error) {
				console.error(`Failed to analyze connections for ${file.path}:`, error);
			}
		}

		return `# 🔗 Рекомендации по связям между заметками\n\n${connections.join('\n')}`;
	}

	/**
	 * Генерирует персонализированные вопросы для развития темы
	 */
	async generateExploratorQuestions(topic: string): Promise<string> {
		const files = this.vault.getMarkdownFiles();
		const relevantContent: string[] = [];

		// Ищем релевантные файлы
		for (const file of files) {
			try {
				const content = await this.vault.read(file);
				if (content.toLowerCase().includes(topic.toLowerCase()) || 
					file.basename.toLowerCase().includes(topic.toLowerCase())) {
					relevantContent.push(`${file.basename}: ${content.substring(0, 500)}`);
				}
			} catch (error) {
				console.error(`Failed to read file ${file.path}:`, error);
			}
		}

		const prompt = `
На основе содержимого персонального хранилища знаний создай исследовательские вопросы по теме "${topic}".

РЕЛЕВАНТНЫЙ КОНТЕНТ:
${relevantContent.slice(0, 5).join('\n\n---\n\n')}

ЗАДАЧА:
Создай 15-20 вопросов разных типов:

1. **Углубляющие вопросы** (5 вопросов) - для более глубокого понимания существующих знаний
2. **Связующие вопросы** (5 вопросов) - для установления связей с другими темами  
3. **Практические вопросы** (5 вопросов) - для применения знаний на практике
4. **Перспективные вопросы** (5 вопросов) - для исследования новых направлений

Вопросы должны:
- Стимулировать критическое мышление
- Учитывать имеющиеся знания
- Предлагать новые направления исследования
- Быть конкретными и действенными
		`;

		return await this.aiService.generateResponse(prompt);
	}

	/**
	 * Создает план развития темы на основе существующих знаний
	 */
	async createLearningPlan(topic: string, timeframe: string = '1 месяц'): Promise<string> {
		const files = this.vault.getMarkdownFiles();
		const relevantFiles: { file: TFile, content: string }[] = [];

		// Собираем релевантную информацию
		for (const file of files) {
			try {
				const content = await this.vault.read(file);
				if (content.toLowerCase().includes(topic.toLowerCase()) || 
					file.basename.toLowerCase().includes(topic.toLowerCase())) {
					relevantFiles.push({ file, content: content.substring(0, 800) });
				}
			} catch (error) {
				console.error(`Failed to read file ${file.path}:`, error);
			}
		}

		const currentKnowledge = relevantFiles.map(rf => 
			`**${rf.file.basename}**: ${rf.content}`
		).join('\n\n');

		const prompt = `
Создай персонализированный план изучения темы "${topic}" на период "${timeframe}".

ТЕКУЩИЕ ЗНАНИЯ:
${currentKnowledge || 'Нет конкретной информации по теме в хранилище'}

ЗАДАЧА:
Создай структурированный план обучения, который включает:

1. **Анализ текущего состояния**
   - Что уже изучено
   - Пробелы в знаниях
   - Сильные стороны

2. **Цели обучения** (SMART цели на указанный период)

3. **Еженедельный план** с конкретными задачами:
   - Что изучать
   - Какие практические задания выполнять
   - Как измерять прогресс

4. **Ресурсы для изучения**
   - Книги и статьи
   - Онлайн курсы
   - Практические проекты

5. **Метод отслеживания прогресса**

6. **Рекомендации по ведению заметок** в Obsidian

План должен быть реалистичным и учитывать имеющуюся базу знаний.
		`;

		return await this.aiService.generateResponse(prompt);
	}

	/**
	 * Анализирует и улучшает качество конкретной заметки
	 */
	async improveNote(filePath: string): Promise<string> {
		const file = this.vault.getAbstractFileByPath(filePath);
		if (!file || !(file instanceof TFile)) {
			throw new Error(`Файл ${filePath} не найден`);
		}

		const content = await this.vault.read(file);
		const otherFiles = this.vault.getMarkdownFiles()
			.filter(f => f.path !== file.path)
			.slice(0, 10)
			.map(f => f.basename);

		const prompt = `
Проанализируй заметку и предложи улучшения:

ЗАМЕТКА: ${file.basename}
СОДЕРЖАНИЕ:
${content}

ДРУГИЕ ФАЙЛЫ В ХРАНИЛИЩЕ:
${otherFiles.join(', ')}

ЗАДАЧА:
1. **Анализ качества**:
   - Структура и организация
   - Полнота информации
   - Ясность изложения

2. **Предложения по улучшению**:
   - Дополнительные разделы
   - Недостающая информация
   - Улучшение структуры

3. **Рекомендации по связям**:
   - Связи с другими заметками
   - Теги для добавления
   - Внутренние ссылки

4. **Конкретные действия**:
   - Что добавить
   - Что переработать
   - Как лучше структурировать

Дай практичные и применимые рекомендации.
		`;

		return await this.aiService.generateResponse(prompt);
	}

	/**
	 * Создает краткое резюме всех знаний по теме
	 */
	async createTopicSummary(topic: string): Promise<string> {
		const files = this.vault.getMarkdownFiles();
		const relevantContent: string[] = [];

		for (const file of files) {
			try {
				const content = await this.vault.read(file);
				if (content.toLowerCase().includes(topic.toLowerCase()) || 
					file.basename.toLowerCase().includes(topic.toLowerCase())) {
					relevantContent.push(`# ${file.basename}\n${content}`);
				}
			} catch (error) {
				console.error(`Failed to read file ${file.path}:`, error);
			}
		}

		if (relevantContent.length === 0) {
			return `По теме "${topic}" в вашем хранилище не найдено релевантной информации.`;
		}

		const prompt = `
Создай всеобъемлющее резюме знаний по теме "${topic}" на основе содержимого персонального хранилища.

СОДЕРЖИМОЕ:
${relevantContent.join('\n\n---\n\n')}

ЗАДАЧА:
Создай структурированное резюме:

1. **Основные концепции** - ключевые идеи и определения
2. **Детальный анализ** - углубленная информация по подтемам  
3. **Практические применения** - примеры и случаи использования
4. **Связи с другими темами** - как тема связана с другими областями знаний
5. **Ключевые выводы** - самые важные инсайты
6. **Области для дальнейшего изучения** - что стоит изучить дополнительно

Резюме должно быть:
- Структурированным и логичным
- Полным но лаконичным
- Основанным только на предоставленной информации
- Готовым для использования как справочный материал
		`;

		return await this.aiService.generateResponse(prompt);
	}
}
