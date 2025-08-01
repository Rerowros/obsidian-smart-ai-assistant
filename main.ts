import { Plugin, Notice } from 'obsidian';
import { GoogleAISettings, DEFAULT_SETTINGS } from './src/types';
import { GoogleAISettingTab } from './src/settings';
import { SmartSearchModal } from './src/search-modal';
import { AdvancedFeaturesModal } from './src/advanced-features-modal';
import { GoogleAIService } from './src/googleai-service';
import { SmartSearchService } from './src/smart-search';
import { FileManager } from './src/file-manager';
import { getLocale } from './src/localization';
import { getQuickCommandPrompt } from './src/prompts';

export default class GoogleAIPlugin extends Plugin {
	settings: GoogleAISettings;
	private aiService: GoogleAIService;
	private smartSearchService: SmartSearchService;
	private fileManager: FileManager;

	async onload() {
		await this.loadSettings();

		// Initialize services
		this.aiService = new GoogleAIService(this.settings);
		this.smartSearchService = new SmartSearchService(this.app.vault, this.aiService, this.settings);
		this.fileManager = new FileManager(this.app, this.settings.searchFolderPath);

		// Update FileManager when settings change
		this.fileManager.updateSearchFolderPath(this.settings.searchFolderPath);

		// Add settings tab
		this.addSettingTab(new GoogleAISettingTab(this.app, this));

		// Add command for smart search
		this.addCommand({
			id: 'open-smart-search',
			name: this.settings.language === 'en' ? '🔍 Open Smart Search' : '🔍 Открыть интеллектуальный поиск',
			callback: () => {
				if (!this.aiService.isConfigured()) {
					const locale = getLocale(this.settings.language);
					new Notice(locale.errorApiKey);
					return;
				}
				new SmartSearchModal(this.app, this).open();
			}
		});

		// Add command for advanced features
		this.addCommand({
			id: 'open-advanced-features',
			name: this.settings.language === 'en' ? '🚀 Advanced AI Features' : '🚀 Расширенные возможности AI',
			callback: () => {
				if (!this.aiService.isConfigured()) {
					const locale = getLocale(this.settings.language);
					new Notice(locale.errorApiKey);
					return;
				}
				new AdvancedFeaturesModal(this.app, this).open();
			}
		});

		// Add command for quick search from selection
        this.addCommand({
            id: 'search-selection',
            name: this.settings.language === 'en' ? '⚡ Search Selected Text' : '⚡ Поиск выделенного текста',
            editorCallback: (editor) => {
                const selection = editor.getSelection();
                if (!selection) {
                    const locale = getLocale(this.settings.language);
                    const message = this.settings.language === 'en' ? 'Select text to search' : 'Выделите текст для поиска';
                    new Notice(message);
                    return;
                }

                if (!this.aiService.isConfigured()) {
                    const locale = getLocale(this.settings.language);
                    new Notice(locale.errorApiKey);
                    return;
                }

                this.performQuickSearch(selection);
            }
        });

        // Add command for improve writing
        this.addCommand({
            id: 'improve-writing',
            name: this.settings.language === 'en' ? '✨ Improve Writing Style' : '✨ Улучшить стиль письма',
            editorCallback: (editor) => {
                const selection = editor.getSelection();
                if (!selection) {
                    new Notice('Select text to improve.');
                    return;
                }
                if (!this.aiService.isConfigured()) {
                    const locale = getLocale(this.settings.language);
                    new Notice(locale.errorApiKey);
                    return;
                }
                this.performQuickCommand(getLocale(this.settings.language).quickCommandImproveWriting, selection);
            }
        });

        // Add command for find connections
        this.addCommand({
            id: 'find-connections',
            name: this.settings.language === 'en' ? '🔗 Find Connections' : '🔗 Найти связи',
            editorCallback: (editor) => {
                const selection = editor.getSelection();
                if (!selection) {
                    new Notice('Select text to find connections.');
                    return;
                }
                if (!this.aiService.isConfigured()) {
                    const locale = getLocale(this.settings.language);
                    new Notice(locale.errorApiKey);
                    return;
                }
                this.performQuickCommand(getLocale(this.settings.language).quickCommandFindConnections, selection);
            }
        });

        // Add command for brainstorm ideas
        this.addCommand({
            id: 'brainstorm-ideas',
            name: this.settings.language === 'en' ? '💡 Brainstorm Ideas' : '💡 Мозговой штурм',
            editorCallback: (editor) => {
                const selection = editor.getSelection();
                if (!selection) {
                    new Notice('Select text to brainstorm ideas.');
                    return;
                }
                if (!this.aiService.isConfigured()) {
                    const locale = getLocale(this.settings.language);
                    new Notice(locale.errorApiKey);
                    return;
                }
                this.performQuickCommand(getLocale(this.settings.language).quickCommandBrainstorm, selection);
            }
        });

        // Add command for summarize
        this.addCommand({
            id: 'summarize-selection',
            name: this.settings.language === 'en' ? '📝 Summarize' : '📝 Суммаризировать',
            editorCallback: (editor) => {
                const selection = editor.getSelection();
                if (!selection) {
                    new Notice('Select text to summarize.');
                    return;
                }
                if (!this.aiService.isConfigured()) {
                    const locale = getLocale(this.settings.language);
                    new Notice(locale.errorApiKey);
                    return;
                }
                this.performQuickCommand(getLocale(this.settings.language).quickCommandSummarize, selection);
            }
        });

        // Add ribbon icon for search
        const searchRibbonText = this.settings.language === 'en' ? 'Google AI Smart Search' : 'Интеллектуальный поиск Google AI';
        this.addRibbonIcon('search', searchRibbonText, () => {
            if (!this.aiService.isConfigured()) {
                const locale = getLocale(this.settings.language);
                new Notice(locale.errorApiKey);
                return;
            }
            new SmartSearchModal(this.app, this).open();
        });

        // Add ribbon icon for advanced features
        const advancedRibbonText = this.settings.language === 'en' ? 'Advanced AI Features' : 'Расширенные AI функции';
        this.addRibbonIcon('brain-circuit', advancedRibbonText, () => {
            if (!this.aiService.isConfigured()) {
                const locale = getLocale(this.settings.language);
                new Notice(locale.errorApiKey);
                return;
            }
            new AdvancedFeaturesModal(this.app, this).open();
        });

        // Debug: removed console.log for production
    }

    onunload() {
        // Debug: removed console.log for production
    }

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
        if (this.aiService) {
            this.aiService.updateSettings(this.settings);
        }
        if (this.smartSearchService) {
            this.smartSearchService.updateSettings(this.settings);
        }
        if (this.fileManager) {
            this.fileManager.updateSearchFolderPath(this.settings.searchFolderPath);
        }
    }

    private async performQuickCommand(command: string, context: string) {
		const notice = new Notice('Thinking...', 0);
		try {
			const response = await this.aiService.generateResponse(getQuickCommandPrompt(this.settings.language, command, context));
			
			// Create a new note with results
			await this.createSearchResultNote(command, response);
			
			notice.hide();
			new Notice('Результаты поиска сохранены в новой заметке');
			
		} catch (error) {
			notice.hide();
			console.error('Quick command error:', error);
			new Notice(`Error: ${error.message}`);
		}
	}

    private async performQuickSearch(query: string) {
        const notice = new Notice('Выполняется поиск...', 0);
        
        try {
            // Используем умный поиск
            this.smartSearchService.updateSettings(this.settings);
            const response = await this.smartSearchService.performSmartSearch(query);
            
            // Create a new note with results
            await this.createSearchResultNote(query, response);
            
            notice.hide();
            new Notice('Результаты поиска сохранены в новой заметке');
            
        } catch (error) {
            notice.hide();
            console.error('Quick search error:', error);
            
            if (error.message?.includes('overloaded') || error.message?.includes('503')) {
                new Notice('Модель временно перегружена. Попробуйте позже.');
            } else {
                new Notice(`Ошибка поиска: ${error.message}`);
            }
        }
    }

    private async createSearchResultNote(query: string, response: string) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const fileName = `AI Search - ${query.slice(0, 50).replace(/[/\]?%*:|"<>]/g, '-')!} - ${timestamp}.md`;
        
        const content = `# AI Search Results\n\n## Query\n${query}\n\n## Response\n${response}\n\n---\n*Generated by Google AI Smart Search on ${new Date().toLocaleString()}*\n`;

        await this.app.vault.create(fileName, content);
    }
}
