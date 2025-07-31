import { App, Modal, Setting, TextAreaComponent, ButtonComponent, Notice, DropdownComponent, ToggleComponent } from 'obsidian';
import GoogleAIPlugin from '../main';
import { GoogleAIService } from './googleai-service';
import { SmartSearchService } from './smart-search';
import { SearchHistoryItem, SearchStats, WebSearchResult, CodeExecutionResult } from './types';
import { FileManager } from './file-manager';
import { getLocale } from './localization';

export class SmartSearchModal extends Modal {
	plugin: GoogleAIPlugin;
	private aiService: GoogleAIService;
	private smartSearchService: SmartSearchService;
	private fileManager: FileManager;
	private queryInput: TextAreaComponent;
	private resultArea: HTMLElement;
	private searchButton: ButtonComponent;
	private historyArea: HTMLElement;
	private searchHistory: SearchHistoryItem[] = [];
	private isStreaming = false;
	private webSearchToggle: ToggleComponent;
	private codeExecutionToggle: ToggleComponent;
	private saveResultToggle: ToggleComponent;
	private excludeSearchResultsToggle: ToggleComponent;
	private searchModeDropdown: DropdownComponent;

	constructor(app: App, plugin: GoogleAIPlugin) {
		super(app);
		this.plugin = plugin;
		this.aiService = new GoogleAIService(plugin.settings);
		this.smartSearchService = new SmartSearchService(app.vault, this.aiService, plugin.settings);
		this.fileManager = new FileManager(app, plugin.settings.searchFolderPath);
		this.loadSearchHistory();
	}

	private loadSearchHistory() {
		if (this.plugin.settings.searchHistory) {
			const saved = localStorage.getItem('google-ai-search-history');
			if (saved) {
				try {
					this.searchHistory = JSON.parse(saved).slice(0, this.plugin.settings.maxHistorySize);
				} catch (e) {
					console.error('Failed to load search history:', e);
				}
			}
		}
	}

	private saveSearchHistory() {
		if (this.plugin.settings.searchHistory) {
			localStorage.setItem('google-ai-search-history', JSON.stringify(this.searchHistory));
		}
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();

		const locale = getLocale(this.plugin.settings.language);
		contentEl.createEl('h2', { text: locale.searchModalTitle });
		
		// Создаем табы для разных секций
		const tabContainer = contentEl.createDiv({ cls: 'search-tabs' });
		const searchTab = tabContainer.createEl('button', { text: locale.searchTabTitle, cls: 'search-tab active' });
		const historyTab = tabContainer.createEl('button', { text: locale.historyTabTitle, cls: 'search-tab' });

		// Контейнеры для разных секций
		const searchSection = contentEl.createDiv({ cls: 'search-section active' });
		const historySection = contentEl.createDiv({ cls: 'search-section hidden' });

		// Обработчики табов
		searchTab.onclick = () => this.switchTab(searchTab, searchSection, [historyTab], [historySection]);
		historyTab.onclick = () => this.switchTab(historyTab, historySection, [searchTab], [searchSection]);

		this.buildSearchSection(searchSection, locale);
		this.buildHistorySection(historySection, locale);
		
		this.addStyles();
	}

	private switchTab(activeTab: HTMLElement, activeSection: HTMLElement, otherTabs: HTMLElement[], otherSections: HTMLElement[]) {
		// Убираем активность с других табов
		otherTabs.forEach(tab => tab.removeClass('active'));
		otherSections.forEach(section => {
			section.removeClass('active');
			section.addClass('hidden');
		});
		
		// Активируем выбранный таб
		activeTab.addClass('active');
		activeSection.addClass('active');
		activeSection.removeClass('hidden');
	}

	private buildSearchSection(container: HTMLElement, locale: any) {
		// Search input with improved layout
		const searchInputContainer = container.createDiv({ cls: 'search-input-container' });
		
		// Создаем заголовок отдельно
		const inputLabel = searchInputContainer.createEl('h3', { 
			text: locale.queryInputName,
			cls: 'search-input-label'
		});
		
		const inputDesc = searchInputContainer.createEl('p', { 
			text: locale.queryInputDesc,
			cls: 'search-input-desc'
		});
		
		// Создаем контейнер для textarea без Setting
		const textareaContainer = searchInputContainer.createDiv({ cls: 'textarea-container' });
		const textarea = textareaContainer.createEl('textarea', {
			placeholder: locale.queryPlaceholder,
			cls: 'search-textarea'
		});
		
		this.queryInput = {
			getValue: () => textarea.value,
			setValue: (value: string) => { textarea.value = value; },
			inputEl: textarea
		} as TextAreaComponent;
		
		// Настраиваем textarea
		textarea.rows = 6;
		textarea.addEventListener('keydown', (e) => {
			if (e.ctrlKey && e.key === 'Enter') {
				this.performSearch();
			}
		});

		// Быстрые команды
		const quickCommands = container.createDiv({ cls: 'quick-commands' });
		quickCommands.createEl('h4', { text: locale.quickCommandsTitle });
		const commandsGrid = quickCommands.createDiv({ cls: 'commands-grid' });
		
		const commands = [
			{ text: locale.quickCommandWhatIHave, template: 'Что у меня есть по теме: ' },
			{ text: locale.quickCommandFindConnections, template: 'Найди связи и закономерности между: ' },
			{ text: locale.quickCommandAnalyze, template: 'Сделай подробный анализ: ' },
			{ text: locale.quickCommandIdeas, template: 'Дай идеи и рекомендации на основе: ' },
		];

		commands.forEach(cmd => {
			const btn = commandsGrid.createEl('button', { text: cmd.text, cls: 'quick-command-btn' });
			btn.onclick = () => {
				this.queryInput.setValue(cmd.template);
				this.queryInput.inputEl.focus();
			};
		});

		// Search button
		const buttonContainer = container.createDiv({ cls: 'modal-button-container' });
		
		const searchBtn = buttonContainer.createEl('button', { 
			text: this.plugin.settings.streamingMode ? locale.streamingModeSearch : locale.searchButtonText,
			cls: 'search-btn-primary'
		});
		
		const clearBtn = buttonContainer.createEl('button', { 
			text: locale.clearButtonText,
			cls: 'search-btn-secondary'
		});
		
		this.searchButton = {
			setButtonText: (text: string) => { searchBtn.textContent = text; },
			setDisabled: (disabled: boolean) => { searchBtn.disabled = disabled; },
			setCta: () => { return this.searchButton; },
			onClick: (callback: () => void) => { 
				searchBtn.onclick = callback;
				return this.searchButton;
			}
		} as ButtonComponent;
		
		searchBtn.onclick = () => this.performSearch();
		clearBtn.onclick = () => {
			this.queryInput.setValue('');
			this.resultArea.empty();
		};

		// Advanced options
		const advancedContainer = container.createDiv({ cls: 'advanced-options' });
		
		// Search mode dropdown
		new Setting(advancedContainer)
			.setName(locale.searchModeDropdown)
			.addDropdown(dropdown => {
				this.searchModeDropdown = dropdown;
				dropdown.addOption('basic', locale.searchModeBasic)
					.addOption('advanced', locale.searchModeAdvanced)
					.addOption('semantic', locale.searchModeSemantic)
					.setValue('advanced');
			});

		// Web search toggle
		if (this.plugin.settings.useWebSearch) {
			new Setting(advancedContainer)
				.setName(locale.webSearchToggle)
				.addToggle(toggle => {
					this.webSearchToggle = toggle;
					toggle.setValue(false);
				});
		}

		// Code execution toggle
		if (this.plugin.settings.useCodeExecution) {
			new Setting(advancedContainer)
				.setName(locale.codeExecutionToggle)
				.addToggle(toggle => {
					this.codeExecutionToggle = toggle;
					toggle.setValue(false);
				});
		}

		// Save result toggle
		if (this.plugin.settings.saveToSearchFolder) {
			new Setting(advancedContainer)
				.setName(locale.saveResultToggle)
				.addToggle(toggle => {
					this.saveResultToggle = toggle;
					toggle.setValue(false);
				});
		}

		// Exclude search results folder toggle
		new Setting(advancedContainer)
			.setName(locale.excludeSearchResults)
			.setDesc(locale.excludeSearchResultsDesc)
			.addToggle(toggle => {
				this.excludeSearchResultsToggle = toggle;
				toggle.setValue(this.plugin.settings.excludeSearchResults); // Используем настройку из конфига
			});

		// Result area
		this.resultArea = container.createDiv({ cls: 'search-results' });
	}

	private buildHistorySection(container: HTMLElement, locale: any) {
		this.historyArea = container;
		this.updateHistoryDisplay();
	}

	private addStyles() {
		const style = document.createElement('style');
		style.textContent = `
			.search-input-container {
				margin-bottom: 30px;
			}
			
			.search-input-label {
				margin: 0 0 8px 0;
				color: var(--text-accent);
				font-size: 18px;
				font-weight: 600;
			}
			
			.search-input-desc {
				margin: 0 0 15px 0;
				color: var(--text-muted);
				font-size: 14px;
				line-height: 1.4;
			}
			
			.textarea-container {
				width: 100%;
				position: relative;
			}
			
			.search-textarea {
				width: 100% !important;
				min-height: 140px !important;
				max-height: 300px !important;
				font-family: var(--font-interface);
				font-size: 15px;
				line-height: 1.6;
				padding: 16px;
				border: 2px solid var(--background-modifier-border);
				border-radius: 12px;
				background: var(--background-primary);
				color: var(--text-normal);
				resize: vertical;
				transition: all 0.2s ease;
				box-sizing: border-box;
			}
			
			.search-textarea:focus {
				border-color: var(--text-accent);
				outline: none;
				box-shadow: 0 0 12px rgba(var(--text-accent-rgb), 0.25);
				background: var(--background-primary-alt);
			}
			
			.search-textarea::placeholder {
				color: var(--text-faint);
				font-style: italic;
			}
			
			.search-tabs {
				display: flex;
				margin-bottom: 25px;
				border-bottom: 2px solid var(--background-modifier-border);
				border-radius: 8px 8px 0 0;
				background: var(--background-secondary);
				overflow: hidden;
			}
			
			.search-tab {
				flex: 1;
				padding: 12px 20px;
				border: none;
				background: transparent;
				color: var(--text-muted);
				cursor: pointer;
				font-size: 15px;
				font-weight: 500;
				transition: all 0.2s ease;
				position: relative;
			}
			
			.search-tab:hover {
				color: var(--text-normal);
				background: var(--background-modifier-hover);
			}
			
			.search-tab.active {
				color: var(--text-accent);
				background: var(--background-primary);
			}
			
			.search-tab.active::after {
				content: '';
				position: absolute;
				bottom: 0;
				left: 0;
				right: 0;
				height: 3px;
				background: var(--text-accent);
			}
			
			.search-section {
				display: block;
			}
			
			.search-section.hidden {
				display: none;
			}
			
			.quick-commands {
				margin: 25px 0;
				padding: 24px;
				background: var(--background-secondary);
				border-radius: 16px;
				border: 1px solid var(--background-modifier-border);
				box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
			}
			
			.quick-commands h4 {
				margin: 0 0 18px 0;
				color: var(--text-accent);
				font-size: 17px;
				font-weight: 600;
				display: flex;
				align-items: center;
				gap: 8px;
			}
			
			.quick-commands h4::before {
				content: '⚡';
				font-size: 18px;
			}
			
			.commands-grid {
				display: grid;
				grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
				gap: 14px;
				margin-top: 18px;
			}
			
			.quick-command-btn {
				padding: 16px 20px;
				border: 1px solid var(--background-modifier-border);
				background: var(--background-primary);
				color: var(--text-normal);
				border-radius: 12px;
				cursor: pointer;
				font-size: 14px;
				font-weight: 500;
				text-align: left;
				transition: all 0.2s ease;
				box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
				position: relative;
				overflow: hidden;
			}
			
			.quick-command-btn:hover {
				background: var(--background-modifier-hover);
				border-color: var(--text-accent);
				transform: translateY(-2px);
				box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);
			}
			
			.quick-command-btn:active {
				transform: translateY(0);
			}
			
			.modal-button-container {
				display: flex;
				gap: 12px;
				margin: 25px 0;
				justify-content: flex-start;
				flex-wrap: wrap;
			}
			
			.search-btn-primary {
				padding: 14px 28px;
				border: none;
				background: linear-gradient(135deg, var(--text-accent), var(--text-accent-hover));
				color: var(--text-on-accent);
				border-radius: 12px;
				cursor: pointer;
				font-size: 15px;
				font-weight: 600;
				transition: all 0.2s ease;
				box-shadow: 0 4px 12px rgba(var(--text-accent-rgb), 0.3);
				position: relative;
				overflow: hidden;
			}
			
			.search-btn-primary:hover:not(:disabled) {
				transform: translateY(-1px);
				box-shadow: 0 6px 20px rgba(var(--text-accent-rgb), 0.4);
			}
			
			.search-btn-primary:active:not(:disabled) {
				transform: translateY(0);
			}
			
			.search-btn-primary:disabled {
				opacity: 0.6;
				cursor: not-allowed;
				transform: none;
				box-shadow: 0 2px 6px rgba(var(--text-accent-rgb), 0.2);
			}
			
			.search-btn-secondary {
				padding: 14px 24px;
				border: 2px solid var(--background-modifier-border);
				background: var(--background-primary);
				color: var(--text-normal);
				border-radius: 12px;
				cursor: pointer;
				font-size: 15px;
				font-weight: 500;
				transition: all 0.2s ease;
			}
			
			.search-btn-secondary:hover {
				border-color: var(--text-muted);
				background: var(--background-modifier-hover);
			}
			
			.advanced-options {
				margin-top: 25px;
				padding: 24px;
				background: var(--background-secondary);
				border-radius: 16px;
				border: 1px solid var(--background-modifier-border);
				box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
			}
			
			.search-results {
				margin-top: 25px;
				padding: 24px;
				border: 2px solid var(--background-modifier-border);
				border-radius: 16px;
				background-color: var(--background-secondary);
				max-height: 600px;
				overflow-y: auto;
				font-family: var(--font-text);
				box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
			}
			
			.search-results.loading {
				text-align: center;
				color: var(--text-muted);
				font-style: italic;
				background: linear-gradient(45deg, var(--background-secondary), var(--background-primary));
				animation: loading-shimmer 2s infinite;
			}
			
			@keyframes loading-shimmer {
				0%, 100% { background-position: -200% 0; }
				50% { background-position: 200% 0; }
			}
			
			.search-results.streaming {
				border-color: var(--text-accent);
				box-shadow: 0 0 20px rgba(var(--text-accent-rgb), 0.4);
				animation: pulse-border 2s infinite;
			}
			
			@keyframes pulse-border {
				0%, 100% { 
					border-color: var(--text-accent);
					box-shadow: 0 0 20px rgba(var(--text-accent-rgb), 0.4);
				}
				50% { 
					border-color: var(--text-accent-hover);
					box-shadow: 0 0 30px rgba(var(--text-accent-rgb), 0.6);
				}
			}
			
			.search-results.error {
				background-color: var(--background-modifier-error-rgb);
				border-color: var(--text-error);
				box-shadow: 0 4px 16px rgba(var(--text-error-rgb), 0.2);
			}
			
			.search-stats {
				margin-top: 15px;
				padding: 16px;
				background: var(--background-primary);
				border-radius: 10px;
				font-size: 13px;
				display: flex;
				justify-content: space-between;
				align-items: center;
				border: 1px solid var(--background-modifier-border);
			}
			
			.stats-grid {
				display: grid;
				grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
				gap: 18px;
				margin: 25px 0;
			}
			
			.stat-item {
				padding: 20px;
				background: var(--background-primary);
				border-radius: 12px;
				text-align: center;
				border: 1px solid var(--background-modifier-border);
				box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
			}
			
			.stat-label {
				color: var(--text-muted);
				font-size: 13px;
				margin-bottom: 8px;
				font-weight: 500;
			}
			
			.stat-value {
				color: var(--text-accent);
				font-size: 24px;
				font-weight: bold;
			}
			
			.history-item {
				padding: 18px;
				margin: 12px 0;
				background: var(--background-primary);
				border-radius: 12px;
				border-left: 4px solid var(--text-accent);
				box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
				transition: all 0.2s ease;
			}
			
			.history-item:hover {
				transform: translateY(-1px);
				box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
			}
			
			.history-query {
				font-weight: 600;
				color: var(--text-accent);
				margin-bottom: 8px;
				font-size: 15px;
			}
			
			.history-preview {
				color: var(--text-muted);
				font-size: 14px;
				margin-bottom: 12px;
				line-height: 1.4;
			}
			
			.history-meta {
				display: flex;
				justify-content: space-between;
				align-items: center;
				font-size: 12px;
				color: var(--text-faint);
			}
			
			.search-query {
				font-weight: 600;
				margin-bottom: 15px;
				color: var(--text-accent);
				font-size: 16px;
				padding: 12px;
				background: var(--background-primary);
				border-radius: 8px;
				border-left: 4px solid var(--text-accent);
			}
			
			.search-response {
				line-height: 1.7;
				white-space: pre-wrap;
				font-size: 15px;
			}
			
			.token-info {
				color: var(--text-muted);
				font-size: 12px;
			}
			
			.stream-chunk {
				animation: fadeIn 0.4s ease-in;
			}
			
			@keyframes fadeIn {
				from { opacity: 0; transform: translateY(10px); }
				to { opacity: 1; transform: translateY(0); }
			}
			
			.result-actions {
				margin-top: 20px;
				display: flex;
				gap: 12px;
				flex-wrap: wrap;
				padding-top: 15px;
				border-top: 1px solid var(--background-modifier-border);
			}
			
			.result-actions button {
				padding: 10px 16px;
				border-radius: 8px;
				border: 1px solid var(--background-modifier-border);
				background: var(--background-primary);
				color: var(--text-normal);
				cursor: pointer;
				font-size: 13px;
				font-weight: 500;
				transition: all 0.2s ease;
			}
			
			.result-actions button:hover {
				background: var(--background-modifier-hover);
				border-color: var(--text-accent);
				transform: translateY(-1px);
			}
		`;
		document.head.appendChild(style);
	}

	private updateHistoryDisplay() {
		this.historyArea.empty();
		
		if (this.searchHistory.length === 0) {
			this.historyArea.createEl('p', { 
				text: '📝 История поиска пуста. Выполните несколько запросов, чтобы увидеть их здесь.',
				cls: 'text-muted'
			});
			return;
		}

		this.historyArea.createEl('h3', { text: '📚 История поиска' });
		
		// Сортируем по времени (новые сначала)
		const sortedHistory = [...this.searchHistory].sort((a, b) => b.timestamp - a.timestamp);
		
		sortedHistory.forEach(item => {
			const historyItem = this.historyArea.createDiv({ cls: 'history-item' });
			
			historyItem.createDiv({ cls: 'history-query', text: item.query });
			historyItem.createDiv({ 
				cls: 'history-preview', 
				text: item.response.substring(0, 150) + (item.response.length > 150 ? '...' : '')
			});
			
			const meta = historyItem.createDiv({ cls: 'history-meta' });
			const date = new Date(item.timestamp).toLocaleString('ru-RU');
			meta.createSpan({ text: `${date} • ${item.stats.duration}ms • ${item.stats.tokensUsed.totalTokens} токенов` });
			
			const actions = meta.createDiv();
			const rerunBtn = actions.createEl('button', { text: '🔄', title: 'Повторить запрос' });
			rerunBtn.onclick = () => {
				this.queryInput.setValue(item.query);
				this.switchTab(
					this.contentEl.querySelector('.search-tab') as HTMLElement,
					this.contentEl.querySelector('.search-section') as HTMLElement,
					Array.from(this.contentEl.querySelectorAll('.search-tab')).slice(1) as HTMLElement[],
					Array.from(this.contentEl.querySelectorAll('.search-section')).slice(1) as HTMLElement[]
				);
			};
		});
		
		// Кнопка очистки истории
		const locale = getLocale(this.plugin.settings.language);
		const clearBtn = this.historyArea.createEl('button', { text: '🗑️ ' + locale.clearHistory, cls: 'mod-warning' });
		clearBtn.onclick = () => {
			this.searchHistory = [];
			this.saveSearchHistory();
			this.updateHistoryDisplay();
			new Notice(locale.historyCleared);
		};
	}

	private async performSearch() {
		const query = this.queryInput.getValue().trim();
		const locale = getLocale(this.plugin.settings.language);
		
		if (!query) {
			new Notice(locale.enterSearchQuery);
			return;
		}

		if (!this.aiService.isConfigured()) {
			new Notice(locale.configureApiKey);
			return;
		}

		const startTime = Date.now();
		this.isStreaming = this.plugin.settings.streamingMode;
		
		this.searchButton.setButtonText(this.isStreaming ? locale.searchStreaming : locale.searching);
		this.searchButton.setDisabled(true);
		
		this.resultArea.empty();
		this.resultArea.addClass('loading');
		if (this.isStreaming) {
			this.resultArea.addClass('streaming');
		}
		
		const loadingEl = this.resultArea.createEl('p', { text: locale.searching });

		try {
			this.smartSearchService.updateSettings(this.plugin.settings);
			
			let response: string;
			let responseEl: HTMLElement;
			let webResults: WebSearchResult[] = [];
			let codeResults: CodeExecutionResult[] = [];

			// Выполняем веб-поиск если включен
			if (this.webSearchToggle?.getValue() && this.plugin.settings.useWebSearch) {
				loadingEl.textContent = locale.webSearchProgress;
				webResults = await this.aiService.performWebSearch(query);
			}

			// Выполняем код если включен
			if (this.codeExecutionToggle?.getValue() && this.plugin.settings.useCodeExecution) {
				loadingEl.textContent = locale.codeExecutionProgress;
				// Пример кода для демонстрации
				const sampleCode = this.extractCodeFromQuery(query);
				if (sampleCode) {
					const codeResult = await this.aiService.executeCode(sampleCode.code, sampleCode.language);
					codeResults.push(codeResult);
				}
			}
			
			if (this.isStreaming) {
				loadingEl.textContent = '📡 Получение ответа в реальном времени...';
				responseEl = this.resultArea.createEl('div', { cls: 'search-response' });
				
				const excludeSearchResults = this.excludeSearchResultsToggle?.getValue() ?? true;
				response = await this.smartSearchService.performSmartSearchStream(query, (chunk: string) => {
					const chunkEl = responseEl.createEl('span', { cls: 'stream-chunk', text: chunk });
					this.resultArea.scrollTop = this.resultArea.scrollHeight;
				}, excludeSearchResults);
			} else {
				const excludeSearchResults = this.excludeSearchResultsToggle?.getValue() ?? true;
				response = await this.smartSearchService.performSmartSearch(query, excludeSearchResults);
			}
			
			const endTime = Date.now();
			const duration = endTime - startTime;
			
			// Создаем статистику поиска
			const tokenUsage = this.aiService.getTokenUsage();
			const searchStats: SearchStats = {
				query,
				duration,
				filesSearched: this.app.vault.getMarkdownFiles().length,
				tokensUsed: { ...tokenUsage },
				strategy: this.plugin.settings.smartSearch ? 'smart' : 'basic',
				timestamp: Date.now()
			};
			
			// Сохраняем в историю
			if (this.plugin.settings.searchHistory) {
				const historyItem: SearchHistoryItem = {
					id: `search_${Date.now()}`,
					query,
					response,
					timestamp: Date.now(),
					stats: searchStats,
					webResults: webResults.length > 0 ? webResults : undefined,
					codeExecutionResults: codeResults.length > 0 ? codeResults : undefined
				};
				
				this.searchHistory.unshift(historyItem);
				if (this.searchHistory.length > this.plugin.settings.maxHistorySize) {
					this.searchHistory = this.searchHistory.slice(0, this.plugin.settings.maxHistorySize);
				}
				this.saveSearchHistory();

				// Автосохранение результата если включено
				if (this.saveResultToggle?.getValue() && this.plugin.settings.saveToSearchFolder) {
					try {
						const savedPath = await this.fileManager.saveSearchResult(historyItem);
						historyItem.savedFilePath = savedPath;
						new Notice(`${locale.resultSaved} ${savedPath}`);
					} catch (error) {
						console.error('Failed to save search result:', error);
						new Notice(`${locale.savingError} ${error.message}`);
					}
				}
			}
			
			this.displayResults(query, response, searchStats, webResults, codeResults);
			
		} catch (error) {
			console.error('Search error:', error);
			this.displayError(this.getErrorMessage(error));
		} finally {
			this.searchButton.setButtonText(this.plugin.settings.streamingMode ? locale.streamingModeSearch : locale.searchButtonText);
			this.searchButton.setDisabled(false);
			this.resultArea.removeClass('loading', 'streaming');
		}
	}

	private getErrorMessage(error: any): string {
		const locale = getLocale(this.plugin.settings.language);
		if (error.message?.includes('overloaded') || error.message?.includes('503')) {
			return locale.modelOverloaded;
		}
		if (error.message?.includes('API_KEY_INVALID')) {
			return locale.invalidApiKey;
		}
		if (error.message?.includes('QUOTA_EXCEEDED')) {
			return locale.quotaExceeded;
		}
		return error.message || locale.unknownSearchError;
	}

	private async getVaultContent(): Promise<string[]> {
		const files = this.app.vault.getMarkdownFiles();
		const content: string[] = [];
		
		const filesToProcess = files.slice(0, this.plugin.settings.contextLimit);
		
		for (const file of filesToProcess) {
			try {
				if (this.plugin.settings.includeFileContent) {
					const fileContent = await this.app.vault.read(file);
					content.push(`# ${file.name}\n${fileContent}`);
				} else {
					content.push(`# ${file.name}\n${file.path}`);
				}
			} catch (error) {
				console.error(`Failed to read file ${file.path}:`, error);
			}
		}
		
		return content;
	}

	private extractCodeFromQuery(query: string): { code: string, language: string } | null {
		// Простая проверка на наличие кода в запросе
		const codeBlockMatch = query.match(/```(\w+)?\n([\s\S]*?)\n```/);
		if (codeBlockMatch) {
			return {
				language: codeBlockMatch[1] || 'python',
				code: codeBlockMatch[2]
			};
		}

		// Проверка на Python код
		if (query.includes('print(') || query.includes('import ') || query.includes('def ')) {
			return {
				language: 'python',
				code: query
			};
		}

		return null;
	}

	private displayResults(
		query: string, 
		response: string, 
		stats?: SearchStats, 
		webResults?: WebSearchResult[], 
		codeResults?: CodeExecutionResult[]
	) {
		if (!this.isStreaming) {
			this.resultArea.empty();
		}
		this.resultArea.removeClass('error');
		const locale = getLocale(this.plugin.settings.language);
		
		if (!this.isStreaming) {
			this.resultArea.createEl('div', { cls: 'search-query', text: `🔍 ${locale.queryInputName}: ${query}` });
			
			const responseEl = this.resultArea.createEl('div', { cls: 'search-response' });
			this.renderResponseWithClickableLinks(responseEl, response);
		}

		// Отображаем веб-результаты если есть
		if (webResults && webResults.length > 0) {
			const webSection = this.resultArea.createDiv({ cls: 'web-results-section' });
			webSection.createEl('h4', { text: '🌐 ' + locale.webSource });
			
			webResults.forEach((result, index) => {
				const resultEl = webSection.createDiv({ cls: 'web-result-item' });
				const linkEl = this.fileManager.renderClickableElement(resultEl, 
					this.fileManager.createClickableWebLink(result));
				resultEl.createEl('p', { text: result.snippet, cls: 'web-snippet' });
			});
		}

		// Отображаем результаты выполнения кода если есть
		if (codeResults && codeResults.length > 0) {
			const codeSection = this.resultArea.createDiv({ cls: 'code-results-section' });
			codeSection.createEl('h4', { text: '💻 ' + locale.codeExecutionResult });
			
			codeResults.forEach((result, index) => {
				const resultEl = codeSection.createDiv({ cls: 'code-result-item' });
				resultEl.createEl('h5', { text: `Код ${index + 1} (${result.language})` });
				
				const codeEl = resultEl.createEl('pre');
				codeEl.createEl('code', { text: result.code, cls: `language-${result.language}` });
				
				if (result.output) {
					resultEl.createEl('h6', { text: 'Результат:' });
					resultEl.createEl('pre', { text: result.output, cls: 'code-output' });
				}
				
				if (result.error) {
					resultEl.createEl('h6', { text: 'Ошибка:', cls: 'error' });
					resultEl.createEl('pre', { text: result.error, cls: 'code-error' });
				}

				const copyCodeBtn = this.fileManager.renderClickableElement(resultEl,
					this.fileManager.createClickableCodeResult(result));
			});
		}
		
		// Add action buttons
		const actionsContainer = this.resultArea.createDiv({ cls: 'result-actions' });
		
		const copyButton = actionsContainer.createEl('button', { 
			text: '📋 ' + locale.copy,
			cls: 'mod-cta'
		});
		
		copyButton.addEventListener('click', () => {
			navigator.clipboard.writeText(response).then(() => {
				new Notice(locale.resultCopied);
			});
		});
		
		// Всегда показываем кнопку сохранения
		const saveButton = actionsContainer.createEl('button', { 
			text: '💾 ' + locale.saveResult,
			cls: 'mod-secondary'
		});
		
		saveButton.addEventListener('click', () => {
			this.saveResultAsNote(query, response);
		});
	}

	private renderResponseWithClickableLinks(container: HTMLElement, response: string) {
		// Обрабатываем весь ответ сразу, используя div для HTML разметки
		const responseDiv = container.createEl('div');
		
		// Заменяем различные паттерны на кликабельные ссылки
		let processedResponse = response;
		
		// 1. Обрабатываем паттерн вида "(`filename.md`)" - файлы в скобках
		processedResponse = processedResponse.replace(/\(`([^`]+\.(md|ts|js|py|txt|json))`\)/g, (match, filename) => {
			return `(<span class="clickable-file-link" data-file="${filename}">${filename}</span>)`;
		});
		
		// 2. Обрабатываем Obsidian wikilinks [[filename]]
		processedResponse = processedResponse.replace(/\[\[([^\]]+)\]\]/g, (match, filename) => {
			return `<span class="clickable-file-link" data-file="${filename}">[[${filename}]]</span>`;
		});
		
		// 3. ИСПРАВЛЯЕМ неправильные ссылки [filename] в [[filename]]
		processedResponse = processedResponse.replace(/(?<!\[)\[([А-Яа-яA-Za-z0-9\s\-_.]+)\](?!\(|])/g, (match, filename) => {
			// Проверяем, что это не markdown ссылка и не часть другой конструкции
			return `<span class="clickable-file-link" data-file="${filename}">[[${filename}]]</span>`;
		});
		
		// 4. Обрабатываем пути к файлам вида src/filename.ext или ./filename.ext
		processedResponse = processedResponse.replace(/(?:^|\s)((?:src\/|\.\/)?[a-zA-Z0-9_\-\.\/]+\.(md|ts|js|py|txt|json))(?=\s|$|[.,;:!?])/g, (match, filepath) => {
			return match.replace(filepath, `<span class="clickable-file-link" data-file="${filepath}">${filepath}</span>`);
		});
		
		// Устанавливаем HTML с сохранением форматирования
		responseDiv.innerHTML = processedResponse.replace(/\n/g, '<br>');
		
		// Добавляем обработчики кликов для всех кликабельных ссылок
		const clickableLinks = responseDiv.querySelectorAll('.clickable-file-link');
		clickableLinks.forEach(link => {
			const filename = link.getAttribute('data-file');
			if (filename) {
				link.addEventListener('click', () => {
					const clickableResult = this.fileManager.createClickableFileLink(filename);
					// Вызываем действие напрямую, без создания дополнительного элемента
					if (clickableResult.action) {
						clickableResult.action();
					}
				});
				
				// Добавляем CSS стили для визуального оформления
				(link as HTMLElement).style.cursor = 'pointer';
				(link as HTMLElement).style.color = 'var(--text-accent)';
				(link as HTMLElement).style.textDecoration = 'underline';
				(link as HTMLElement).style.fontWeight = 'bold';
				
				// Добавляем hover эффект
				link.addEventListener('mouseenter', () => {
					(link as HTMLElement).style.backgroundColor = 'var(--background-modifier-hover)';
				});
				link.addEventListener('mouseleave', () => {
					(link as HTMLElement).style.backgroundColor = 'transparent';
				});
			}
		});
	}
	
	private async saveResultAsNote(query: string, response: string) {
		const locale = getLocale(this.plugin.settings.language);
		const sanitizedQuery = query.substring(0, 50).replace(/[\/\\:*?"<>|]/g, '-');
		const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
		const fileName = `AI Search - ${sanitizedQuery} - ${timestamp}.md`;
		
		// Определяем путь для сохранения
		let folderPath = this.plugin.settings.saveToSearchFolder ? this.plugin.settings.searchFolderPath : '';
		if (folderPath && !folderPath.endsWith('/')) {
			folderPath += '/';
		}
		
		const fullPath = folderPath + fileName;
		const content = `# ${query}\n\n**Дата поиска:** ${new Date().toLocaleString('ru-RU')}\n**Модель:** ${this.plugin.settings.selectedModel}\n\n## Запрос:\n${query}\n\n## Результат:\n\n${response}`;
		
		try {
			// Создаем папку если не существует
			if (folderPath) {
				const folderExists = await this.app.vault.adapter.exists(folderPath.slice(0, -1));
				if (!folderExists) {
					await this.app.vault.createFolder(folderPath.slice(0, -1));
				}
			}
			
			await this.app.vault.create(fullPath, content);
			new Notice(`${locale.resultSavedAs} ${fullPath}`);
		} catch (error) {
			// Если не удалось сохранить в указанную папку, сохраняем в корень
			try {
				await this.app.vault.create(fileName, content);
				new Notice(`${locale.resultSavedInRoot} ${fileName} (в корневой папке)`);
			} catch (rootError) {
				new Notice(locale.savingErrorGeneral);
				console.error('Failed to save note:', error, rootError);
			}
		}
	}

	private displayError(error: string) {
		const locale = getLocale(this.plugin.settings.language);
		this.resultArea.empty();
		this.resultArea.addClass('error');
		
		this.resultArea.createEl('h3', { text: locale.searchErrorTitle });
		this.resultArea.createEl('p', { text: error });
		
		const troubleshootEl = this.resultArea.createEl('div');
		troubleshootEl.createEl('p', { text: locale.possibleSolutions });
		const listEl = troubleshootEl.createEl('ul');
		listEl.createEl('li', { text: locale.checkApiKey });
		listEl.createEl('li', { text: locale.checkConnection });
		listEl.createEl('li', { text: locale.checkLimits });
	}

	private clearResults() {
		this.queryInput.setValue('');
		this.resultArea.empty();
		this.resultArea.removeClass('error', 'loading');
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}
