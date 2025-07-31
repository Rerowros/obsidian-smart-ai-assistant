import { Plugin, Notice } from 'obsidian';
import { GoogleAISettings, DEFAULT_SETTINGS } from './src/types';
import { GoogleAISettingTab } from './src/settings';
import { SmartSearchModal } from './src/search-modal';
import { AdvancedFeaturesModal } from './src/advanced-features-modal';
import { GoogleAIService } from './src/googleai-service';
import { SmartSearchService } from './src/smart-search';
import { FileManager } from './src/file-manager';
import { getLocale } from './src/localization';

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
			},
			hotkeys: [{ modifiers: ['Mod', 'Shift'], key: 'f' }]
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

		console.log('Google AI Smart Search plugin loaded');
	}

	onunload() {
		console.log('Google AI Smart Search plugin unloaded');
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
		const fileName = `AI Search - ${query.slice(0, 50).replace(/[/\\?%*:|"<>]/g, '-')} - ${timestamp}.md`;
		
		const content = `# AI Search Results

## Query
${query}

## Response
${response}

---
*Generated by Google AI Smart Search on ${new Date().toLocaleString()}*
`;

		await this.app.vault.create(fileName, content);
	}
}
