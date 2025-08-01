import { App, TFile, Notice, TFolder } from 'obsidian';
import { ClickableResult, SearchHistoryItem, WebSearchResult, CodeExecutionResult } from './types';

export class FileManager {
	private app: App;
	private searchFolderPath: string;

	constructor(app: App, searchFolderPath: string = 'Search Results') {
		this.app = app;
		this.searchFolderPath = searchFolderPath;
	}

	updateSearchFolderPath(path: string) {
		this.searchFolderPath = path;
	}

	async ensureSearchFolderExists(): Promise<TFolder> {
		const folder = this.app.vault.getAbstractFileByPath(this.searchFolderPath);
		
		if (folder && folder instanceof TFolder) {
			return folder;
		}

		try {
			return await this.app.vault.createFolder(this.searchFolderPath);
		} catch (error) {
			console.error('Failed to create search folder:', error);
			throw new Error(`Не удалось создать папку поиска: ${this.searchFolderPath}`);
		}
	}

	async saveSearchResult(
		historyItem: SearchHistoryItem, 
		includeMetadata: boolean = true
	): Promise<string> {
		await this.ensureSearchFolderExists();
		
		const timestamp = new Date(historyItem.timestamp);
		const dateStr = timestamp.toISOString().slice(0, 19).replace(/:/g, '-');
		const fileName = `Search-${dateStr}.md`;
		const filePath = `${this.searchFolderPath}/${fileName}`;

		let content = this.formatSearchResultContent(historyItem, includeMetadata);

		try {
			const file = await this.app.vault.create(filePath, content);
			new Notice(`Результат поиска сохранен: ${fileName}`);
			return file.path;
		} catch (error) {
			console.error('Failed to save search result:', error);
			throw new Error(`Ошибка сохранения файла: ${error.message}`);
		}
	}

	private formatSearchResultContent(item: SearchHistoryItem, includeMetadata: boolean): string {
		const timestamp = new Date(item.timestamp).toLocaleString('ru-RU');
		
		let content = '';
		
		if (includeMetadata) {
			content += `---\n`;
			content += `title: "Поиск: ${item.query}"\n`;
			content += `date: ${timestamp}\n`;
			content += `query: "${item.query}"\n`;
			content += `model: "${item.stats.strategy}"\n`;
			content += `duration: ${item.stats.duration}ms\n`;
			content += `files_searched: ${item.stats.filesSearched}\n`;
			content += `tokens_used: ${item.stats.tokensUsed.totalTokens}\n`;
			if (item.bookmarked) {
				content += `bookmarked: true\n`;
			}
			content += `---\n\n`;
		}

		content += `# 🔍 Результат поиска\n\n`;
		content += `**Запрос:** ${item.query}\n\n`;
		content += `**Дата:** ${timestamp}\n\n`;

		// Основной результат
		content += `## 📝 Ответ\n\n`;
		content += item.response + '\n\n';

		// Веб-результаты если есть
		if (item.webResults && item.webResults.length > 0) {
			content += `## 🌐 Источники из интернета\n\n`;
			item.webResults.forEach((result, index) => {
				content += `### ${index + 1}. ${result.title}\n`;
				content += `**URL:** [${result.url}](${result.url})\n`;
				content += `**Источник:** ${result.source}\n`;
				if (result.snippet) {
					content += `**Описание:** ${result.snippet}\n`;
				}
				content += '\n';
			});
		}

		// Результаты выполнения кода если есть
		if (item.codeExecutionResults && item.codeExecutionResults.length > 0) {
			content += `## 💻 Результаты выполнения кода\n\n`;
			item.codeExecutionResults.forEach((result, index) => {
				content += `### Код ${index + 1} (${result.language})\n\n`;
				content += `\`\`\`${result.language}\n${result.code}\n\`\`\`\n\n`;
				if (result.output) {
					content += `**Результат:**\n\`\`\`\n${result.output}\n\`\`\`\n\n`;
				}
				if (result.error) {
					content += `**Ошибка:**\n\`\`\`\n${result.error}\n\`\`\`\n\n`;
				}
				if (result.executionTime) {
					content += `**Время выполнения:** ${result.executionTime}ms\n\n`;
				}
			});
		}

		// Статистика
		if (includeMetadata) {
			content += `## 📊 Статистика поиска\n\n`;
			content += `- **Длительность:** ${item.stats.duration}ms\n`;
			content += `- **Файлов просмотрено:** ${item.stats.filesSearched}\n`;
			content += `- **Токенов использовано:** ${item.stats.tokensUsed.totalTokens}\n`;
			content += `  - Входные: ${item.stats.tokensUsed.inputTokens}\n`;
			content += `  - Выходные: ${item.stats.tokensUsed.outputTokens}\n`;
			content += `- **Стратегия поиска:** ${item.stats.strategy}\n`;
		}

		return content;
	}

	createClickableFileLink(filePath: string, displayText?: string): ClickableResult {
		return {
			type: 'file',
			text: displayText || filePath,
			action: () => {
				const file = this.app.vault.getAbstractFileByPath(filePath);
				if (file instanceof TFile) {
					this.app.workspace.getLeaf().openFile(file);
				} else {
					new Notice(`Файл не найден: ${filePath}`);
				}
			},
			tooltip: `Открыть файл: ${filePath}`
		};
	}

	createClickableWebLink(webResult: WebSearchResult): ClickableResult {
		return {
			type: 'web',
			text: webResult.title,
			action: () => {
				window.open(webResult.url, '_blank');
			},
			tooltip: `Открыть в браузере: ${webResult.url}`
		};
	}

	createClickableCodeResult(codeResult: CodeExecutionResult): ClickableResult {
		return {
			type: 'code',
			text: `Код (${codeResult.language})`,
			action: () => {
				navigator.clipboard.writeText(codeResult.code).then(() => {
					new Notice('Код скопирован в буфер обмена');
				});
			},
			tooltip: 'Копировать код в буфер обмена'
		};
	}

	async exportSearchHistory(history: SearchHistoryItem[]): Promise<void> {
		await this.ensureSearchFolderExists();
		
		const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
		const fileName = `Search-History-Export-${timestamp}.md`;
		const filePath = `${this.searchFolderPath}/${fileName}`;

		let content = `# 📚 Экспорт истории поиска\n\n`;
		content += `**Дата экспорта:** ${new Date().toLocaleString('ru-RU')}\n`;
		content += `**Всего записей:** ${history.length}\n\n`;

		content += `---\n\n`;

		history.forEach((item, index) => {
			const itemTimestamp = new Date(item.timestamp).toLocaleString('ru-RU');
			content += `## ${index + 1}. ${item.query}\n\n`;
			content += `**Дата:** ${itemTimestamp}\n`;
			if (item.bookmarked) {
				content += `**⭐ В закладках**\n`;
			}
			content += `**Длительность:** ${item.stats.duration}ms\n`;
			content += `**Токенов:** ${item.stats.tokensUsed.totalTokens}\n\n`;
			
			content += `### Ответ\n\n`;
			content += item.response + '\n\n';
			
			if (item.webResults && item.webResults.length > 0) {
				content += `### Веб-источники\n\n`;
				item.webResults.forEach(result => {
					content += `- [${result.title}](${result.url})\n`;
				});
				content += '\n';
			}
			
			content += `---\n\n`;
		});

		try {
			await this.app.vault.create(filePath, content);
			new Notice(`История поиска экспортирована: ${fileName}`);
		} catch (error) {
			console.error('Failed to export search history:', error);
			new Notice(`Ошибка экспорта истории: ${error.message}`);
		}
	}

	renderClickableElement(container: HTMLElement, result: ClickableResult): HTMLElement {
		const element = container.createEl('span', {
			cls: `clickable-result clickable-${result.type} file-manager-result ${result.type}`,
			text: result.text
		});

		// Стили теперь определены в CSS файле
		if (result.tooltip) {
			element.title = result.tooltip;
		}

		element.addEventListener('click', (e) => {
			e.preventDefault();
			e.stopPropagation();
			result.action();
		});

		return element;
	}
}
