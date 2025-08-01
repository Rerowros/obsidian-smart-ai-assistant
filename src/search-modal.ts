import { App, Modal, Setting, TextAreaComponent, ButtonComponent, Notice, DropdownComponent, ToggleComponent, MarkdownRenderer } from 'obsidian';
import GoogleAIPlugin from '../main';
import { GoogleAIService } from './googleai-service';
import { SmartSearchService } from './smart-search';
import { SearchHistoryItem, SearchStats, WebSearchResult, CodeExecutionResult } from './types';
import { FileManager } from './file-manager';
import { getLocale, LocaleStrings } from './localization';

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
	private locale: LocaleStrings;

	constructor(app: App, plugin: GoogleAIPlugin) {
		super(app);
		this.plugin = plugin;
		this.aiService = new GoogleAIService(plugin.settings);
		this.smartSearchService = new SmartSearchService(app.vault, this.aiService, plugin.settings);
		this.fileManager = new FileManager(app, plugin.settings.searchFolderPath);
		this.locale = getLocale(this.plugin.settings.language);
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

		contentEl.createEl('h2', { text: this.locale.searchModalTitle });
		
		const tabContainer = contentEl.createDiv({ cls: 'search-tabs' });
		const searchTab = tabContainer.createEl('button', { text: this.locale.searchTabTitle, cls: 'search-tab active' });
		const historyTab = tabContainer.createEl('button', { text: this.locale.historyTabTitle, cls: 'search-tab' });

		const searchSection = contentEl.createDiv({ cls: 'search-section active' });
		const historySection = contentEl.createDiv({ cls: 'search-section hidden' });

		searchTab.onclick = () => this.switchTab(searchTab, searchSection, [historyTab], [historySection]);
		historyTab.onclick = () => this.switchTab(historyTab, historySection, [searchTab], [searchSection]);

		this.buildSearchSection(searchSection);
		this.buildHistorySection(historySection);
	}

	private switchTab(activeTab: HTMLElement, activeSection: HTMLElement, otherTabs: HTMLElement[], otherSections: HTMLElement[]) {
		otherTabs.forEach(tab => tab.removeClass('active'));
		otherSections.forEach(section => {
			section.removeClass('active');
			section.addClass('hidden');
		});
		
		activeTab.addClass('active');
		activeSection.addClass('active');
		activeSection.removeClass('hidden');
	}

	private buildSearchSection(container: HTMLElement) {
		const searchInputContainer = container.createDiv();
		
		searchInputContainer.createEl('h3', { text: this.locale.queryInputName });
		searchInputContainer.createEl('p', { text: this.locale.queryInputDesc });
		
		const textareaContainer = searchInputContainer.createDiv({ cls: 'textarea-container' });
		const textarea = textareaContainer.createEl('textarea', {
			placeholder: this.locale.queryPlaceholder,
			cls: 'search-textarea'
		});
		
		this.queryInput = {
			getValue: () => textarea.value,
			setValue: (value: string) => { textarea.value = value; },
			inputEl: textarea
		} as TextAreaComponent;
		
		textarea.rows = 6;
		textarea.addEventListener('keydown', (e) => {
			if (e.ctrlKey && e.key === 'Enter') {
				this.performSearch();
			}
		});

		const quickCommands = container.createDiv({ cls: 'quick-commands' });
		quickCommands.createEl('h4', { text: this.locale.quickCommandsTitle });
		const commandsGrid = quickCommands.createDiv({ cls: 'commands-grid' });
		
		const commands = [
			{ text: this.locale.quickCommandSearchByTopic, template: this.locale.quickCommandSearchByTopicTemplate },
			{ text: this.locale.quickCommandImproveWriting, template: this.locale.quickCommandImproveWritingTemplate },
			{ text: this.locale.quickCommandFindConnections, template: this.locale.quickCommandFindConnectionsTemplate },
			{ text: this.locale.quickCommandBrainstorm, template: this.locale.quickCommandBrainstormTemplate },
			{ text: this.locale.quickCommandSummarize, template: this.locale.quickCommandSummarizeTemplate },
		];

		commands.forEach(cmd => {
			const btn = commandsGrid.createEl('button', { text: cmd.text, cls: 'quick-command-btn' });
			btn.onclick = () => {
				this.queryInput.setValue(cmd.template);
				this.queryInput.inputEl.focus();
			};
		});

		const buttonContainer = container.createDiv({ cls: 'modal-button-container' });
		
		const searchBtn = buttonContainer.createEl('button', { 
			text: this.plugin.settings.streamingMode ? this.locale.searchStreaming : this.locale.searchButtonText,
			cls: 'search-btn-primary'
		});
		
		const clearBtn = buttonContainer.createEl('button', { 
			text: this.locale.clearButtonText,
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

		const advancedContainer = container.createDiv({ cls: 'advanced-options' });
		
		new Setting(advancedContainer)
			.setName(this.locale.searchModeDropdown)
			.addDropdown(dropdown => {
				this.searchModeDropdown = dropdown;
				dropdown.addOption('basic', this.locale.searchModeBasic)
					.addOption('advanced', this.locale.searchModeAdvanced)
					.addOption('semantic', this.locale.searchModeSemantic)
					.setValue('advanced');
			});

		if (this.plugin.settings.useWebSearch) {
			new Setting(advancedContainer)
				.setName(this.locale.webSearchToggle)
				.addToggle(toggle => {
					this.webSearchToggle = toggle;
					toggle.setValue(false);
				});
		}

		if (this.plugin.settings.useCodeExecution) {
			new Setting(advancedContainer)
				.setName(this.locale.codeExecutionToggle)
				.addToggle(toggle => {
					this.codeExecutionToggle = toggle;
					toggle.setValue(false);
				});
		}

		if (this.plugin.settings.saveToSearchFolder) {
			new Setting(advancedContainer)
				.setName(this.locale.saveResultToggle)
				.addToggle(toggle => {
					this.saveResultToggle = toggle;
					toggle.setValue(false);
				});
		}

		new Setting(advancedContainer)
			.setName(this.locale.excludeSearchResults)
			.setDesc(this.locale.excludeSearchResultsDesc)
			.addToggle(toggle => {
				this.excludeSearchResultsToggle = toggle;
				toggle.setValue(this.plugin.settings.excludeSearchResults);
			});

		this.resultArea = container.createDiv({ cls: 'search-results' });
	}

	private buildHistorySection(container: HTMLElement) {
		this.historyArea = container;
		this.updateHistoryDisplay();
	}

	private updateHistoryDisplay() {
		this.historyArea.empty();
		
		if (this.searchHistory.length === 0) {
			this.historyArea.createEl('p', { 
				text: this.locale.historyEmpty,
				cls: 'text-muted'
			});
			return;
		}

		this.historyArea.createEl('h3', { text: this.locale.searchHistoryHeader });
		
		const sortedHistory = [...this.searchHistory].sort((a, b) => b.timestamp - a.timestamp);
		
		sortedHistory.forEach(item => {
			const historyItem = this.historyArea.createDiv({ cls: 'history-item' });
			
			historyItem.createDiv({ cls: 'history-query', text: item.query });
			historyItem.createDiv({ 
				cls: 'history-preview', 
				text: item.response.substring(0, 150) + (item.response.length > 150 ? '...' : '')
			});
			
			const meta = historyItem.createDiv({ cls: 'history-meta' });
			const date = new Date(item.timestamp).toLocaleString(this.plugin.settings.language);
			meta.createSpan({ text: `${date} • ${item.stats.duration}ms • ${item.stats.tokensUsed.totalTokens} ${this.locale.tokens}` });
			
			const actions = meta.createDiv();
			const rerunBtn = actions.createEl('button', { text: '🔄', title: this.locale.rerunQueryTooltip });
			rerunBtn.onclick = () => {
				this.queryInput.setValue(item.query);
				const searchTab = this.contentEl.querySelector('.search-tab') as HTMLElement;
				const searchSection = this.contentEl.querySelector('.search-section') as HTMLElement;
				const historyTab = this.contentEl.querySelectorAll('.search-tab')[1] as HTMLElement;
				const historySection = this.contentEl.querySelectorAll('.search-section')[1] as HTMLElement;
				this.switchTab(searchTab, searchSection, [historyTab], [historySection]);
			};
		});
		
		const clearBtn = this.historyArea.createEl('button', { text: this.locale.clearHistoryButton, cls: 'mod-warning' });
		clearBtn.onclick = () => {
			this.searchHistory = [];
			this.saveSearchHistory();
			this.updateHistoryDisplay();
			new Notice(this.locale.historyCleared);
		};
	}

	private async performSearch() {
		const query = this.queryInput.getValue().trim();
		
		if (!query) {
			new Notice(this.locale.enterSearchQuery);
			return;
		}

		if (!this.aiService.isConfigured()) {
			new Notice(this.locale.configureApiKey);
			return;
		}

		const startTime = Date.now();
		this.isStreaming = this.plugin.settings.streamingMode;
		
		this.searchButton.setButtonText(this.isStreaming ? this.locale.searchStreaming : this.locale.searching);
		this.searchButton.setDisabled(true);
		
		this.resultArea.empty();
		this.resultArea.addClass('loading');
		if (this.isStreaming) {
			this.resultArea.addClass('streaming');
		}
		
		const loadingEl = this.resultArea.createEl('p', { text: this.locale.searching });

		try {
			this.smartSearchService.updateSettings(this.plugin.settings);
			
			let response: string;
			let responseEl: HTMLElement;
			let webResults: WebSearchResult[] = [];
			let codeResults: CodeExecutionResult[] = [];

			if (this.webSearchToggle?.getValue() && this.plugin.settings.useWebSearch) {
				loadingEl.textContent = this.locale.webSearchProgress;
				webResults = await this.aiService.performWebSearch(query);
			}

			if (this.codeExecutionToggle?.getValue() && this.plugin.settings.useCodeExecution) {
				loadingEl.textContent = this.locale.codeExecutionProgress;
				const sampleCode = this.extractCodeFromQuery(query);
				if (sampleCode) {
					const codeResult = await this.aiService.executeCode(sampleCode.code, sampleCode.language);
					codeResults.push(codeResult);
				}
			}
			
			const searchMode = this.searchModeDropdown.getValue() as 'basic' | 'advanced' | 'semantic';
			const excludeSearchResults = this.excludeSearchResultsToggle?.getValue() ?? true;

			if (this.isStreaming) {
				loadingEl.textContent = this.locale.streamingResponse;
				responseEl = this.resultArea.createEl('div', { cls: 'search-response' });
				
				response = await this.smartSearchService.performSmartSearchStream(query, (chunk: string) => {
					responseEl.createSpan({ cls: 'stream-chunk', text: chunk });
					this.resultArea.scrollTop = this.resultArea.scrollHeight;
				}, excludeSearchResults, webResults, searchMode);
			} else {
				response = await this.smartSearchService.performSmartSearch(query, excludeSearchResults, webResults, searchMode);
			}
			
			const endTime = Date.now();
			const duration = endTime - startTime;
			
			const tokenUsage = this.aiService.getTokenUsage();
			const searchStats: SearchStats = {
				query,
				duration,
				filesSearched: this.app.vault.getMarkdownFiles().length,
				tokensUsed: { ...tokenUsage },
				strategy: searchMode,
				timestamp: Date.now()
			};
			
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

				if (this.saveResultToggle?.getValue() && this.plugin.settings.saveToSearchFolder) {
					try {
						const savedPath = await this.fileManager.saveSearchResult(historyItem);
					historyItem.savedFilePath = savedPath;
						new Notice(`${this.locale.resultSaved} ${savedPath}`);
					} catch (error) {
						console.error('Failed to save search result:', error);
						new Notice(`${this.locale.savingError} ${error.message}`);
					}
				}
			}
			
			this.displayResults(query, response, searchStats, webResults, codeResults);
			
		} catch (error) {
			console.error('Search error:', error);
			this.displayError(this.getErrorMessage(error));
		} finally {
			this.searchButton.setButtonText(this.plugin.settings.streamingMode ? this.locale.searchStreaming : this.locale.searchButtonText);
			this.searchButton.setDisabled(false);
			this.resultArea.removeClass('loading', 'streaming');
		}
	}

	private getErrorMessage(error: any): string {
		if (error.message?.includes('overloaded') || error.message?.includes('503')) {
			return this.locale.modelOverloaded;
		}
		if (error.message?.includes('API_KEY_INVALID')) {
			return this.locale.invalidApiKey;
		}
		if (error.message?.includes('QUOTA_EXCEEDED')) {
			return this.locale.quotaExceeded;
		}
		return error.message || this.locale.unknownSearchError;
	}

	private extractCodeFromQuery(query: string): { code: string, language: string } | null {
		const codeBlockMatch = query.match(/```(\w+)?\n([\s\S]*?)\n```/);
		if (codeBlockMatch) {
			return {
				language: codeBlockMatch[1] || 'python',
				code: codeBlockMatch[2]
			};
		}

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
		
		if (!this.isStreaming) {
			this.resultArea.createEl('div', { cls: 'search-query', text: ` ${this.locale.queryInputName}: ${query}` });
			
			const responseEl = this.resultArea.createEl('div', { cls: 'search-response' });
			MarkdownRenderer.render(this.app, response, responseEl, '', this.plugin);
		}

		if (webResults && webResults.length > 0) {
			const webSection = this.resultArea.createDiv({ cls: 'web-results-section' });
			webSection.createEl('h4', { text: '🌐 ' + this.locale.webSource });
			
			webResults.forEach((result) => {
				const resultEl = webSection.createDiv({ cls: 'web-result-item' });
				const linkEl = this.fileManager.renderClickableElement(resultEl, 
					this.fileManager.createClickableWebLink(result));
				resultEl.createEl('p', { text: result.snippet, cls: 'web-snippet' });
			});
		}

		if (codeResults && codeResults.length > 0) {
			const codeSection = this.resultArea.createDiv({ cls: 'code-results-section' });
			codeSection.createEl('h4', { text: '💻 ' + this.locale.codeExecutionResult });
			
			codeResults.forEach((result, index) => {
				const resultEl = codeSection.createDiv({ cls: 'code-result-item' });
				resultEl.createEl('h5', { text: `Code ${index + 1} (${result.language})` });
				
				const codeEl = resultEl.createEl('pre');
				codeEl.createEl('code', { text: result.code, cls: `language-${result.language}` });
				
				if (result.output) {
					resultEl.createEl('h6', { text: 'Result:' });
					resultEl.createEl('pre', { text: result.output, cls: 'code-output' });
				}
				
				if (result.error) {
					resultEl.createEl('h6', { text: 'Error:', cls: 'error' });
					resultEl.createEl('pre', { text: result.error, cls: 'code-error' });
				}

				this.fileManager.renderClickableElement(resultEl,
					this.fileManager.createClickableCodeResult(result));
			});
		}
		
		const actionsContainer = this.resultArea.createDiv({ cls: 'result-actions' });
		
		const copyButton = actionsContainer.createEl('button', { 
			text: '📋 ' + this.locale.copy,
			cls: 'mod-cta'
		});
		
		copyButton.addEventListener('click', () => {
			navigator.clipboard.writeText(response).then(() => {
				new Notice(this.locale.resultCopied);
			});
		});
		
		const saveButton = actionsContainer.createEl('button', { 
			text: '💾 ' + this.locale.saveResult,
			cls: 'mod-secondary'
		});
		
		saveButton.addEventListener('click', () => {
			this.saveResultAsNote(query, response);
		});
	}
	
	private async saveResultAsNote(query: string, response: string) {
		const sanitizedQuery = query.substring(0, 50).replace(/[\/\\:*?"<>|]/g, '-');
		const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
		const fileName = `AI Search - ${sanitizedQuery} - ${timestamp}.md`;
		
		let folderPath = this.plugin.settings.saveToSearchFolder ? this.plugin.settings.searchFolderPath : '';
		if (folderPath && !folderPath.endsWith('/')) {
			folderPath += '/';
		}
		
		const fullPath = folderPath + fileName;
		const content = `# ${query}\n\n**Date:** ${new Date().toLocaleString(this.plugin.settings.language)}\n**Model:** ${this.plugin.settings.selectedModel}\n\n## Query:\n${query}\n\n## Result:\n\n${response}`;
		
		try {
			if (folderPath) {
				const folderExists = await this.app.vault.adapter.exists(folderPath.slice(0, -1));
				if (!folderExists) {
					await this.app.vault.createFolder(folderPath.slice(0, -1));
				}
			}
			
			await this.app.vault.create(fullPath, content);
			new Notice(`${this.locale.resultSavedAs} ${fullPath}`);
		} catch (error) {
			try {
				await this.app.vault.create(fileName, content);
				new Notice(`${this.locale.resultSavedInRoot} ${fileName}`);
			} catch (rootError) {
				new Notice(this.locale.savingErrorGeneral);
				console.error('Failed to save note:', error, rootError);
			}
		}
	}

	private displayError(error: string) {
		this.resultArea.empty();
		this.resultArea.addClass('error');
		
		this.resultArea.createEl('h3', { text: this.locale.searchErrorTitle });
		this.resultArea.createEl('p', { text: error });
		
		const troubleshootEl = this.resultArea.createEl('div');
		troubleshootEl.createEl('p', { text: this.locale.possibleSolutions });
		const listEl = troubleshootEl.createEl('ul');
		listEl.createEl('li', { text: this.locale.checkApiKey });
		listEl.createEl('li', { text: this.locale.checkConnection });
		listEl.createEl('li', { text: this.locale.checkLimits });
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}