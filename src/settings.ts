import { App, PluginSettingTab, Setting, Notice } from 'obsidian';
import GoogleAIPlugin from '../main';
import { GoogleAIService } from './googleai-service';
import { getLocale } from './localization';

export class GoogleAISettingTab extends PluginSettingTab {
	plugin: GoogleAIPlugin;
	private aiService: GoogleAIService;

	constructor(app: App, plugin: GoogleAIPlugin) {
		super(app, plugin);
		this.plugin = plugin;
		this.aiService = new GoogleAIService(plugin.settings);
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		const locale = getLocale(this.plugin.settings.language);
		containerEl.createEl('h2', { text: locale.settingsTitle });

		// Language setting (first)
		new Setting(containerEl)
			.setName(locale.languageName)
			.setDesc(locale.languageDesc + ' ' + locale.restartRequired)
			.addDropdown(dropdown => dropdown
				.addOption('ru', 'Русский')
				.addOption('en', 'English')
				.setValue(this.plugin.settings.language)
				.onChange(async (value: 'en' | 'ru') => {
					this.plugin.settings.language = value;
					await this.plugin.saveSettings();
					this.display(); // Refresh display with new language
				}));

		// API Key setting
		new Setting(containerEl)
			.setName(locale.apiKeyName)
			.setDesc(locale.apiKeyDesc)
			.addText(text => text
				.setPlaceholder('Enter your API key')
				.setValue(this.plugin.settings.apiKey)
				.onChange(async (value) => {
					this.plugin.settings.apiKey = value;
					await this.plugin.saveSettings();
					this.aiService.updateSettings(this.plugin.settings);
				}));

		// Test API connection
		new Setting(containerEl)
			.setName(locale.testApiConnection)
			.setDesc(locale.testApiConnectionDesc)
			.addButton(button => button
				.setButtonText(locale.testConnection)
				.onClick(async () => {
					try {
						button.setButtonText(locale.testing);
						button.setDisabled(true);
						
						if (!this.plugin.settings.apiKey) {
							new Notice(locale.enterApiKeyFirst);
							return;
						}

						const models = await this.aiService.listModels();
						new Notice(`✅ ${locale.connectionSuccessful} ${models.length} models.`);
						this.refreshModelList();
					} catch (error) {
						new Notice(`❌ ${locale.connectionFailed} ${error.message}`);
					} finally {
						button.setButtonText(locale.testConnection);
						button.setDisabled(false);
					}
				}));

		// Model selection
		this.createModelSetting(containerEl);

		// Temperature setting
		new Setting(containerEl)
			.setName(locale.temperatureName)
			.setDesc(locale.temperatureDesc)
			.addSlider(slider => slider
				.setLimits(0, 1, 0.1)
				.setValue(this.plugin.settings.temperature)
				.setDynamicTooltip()
				.onChange(async (value) => {
					this.plugin.settings.temperature = value;
					await this.plugin.saveSettings();
					this.aiService.updateSettings(this.plugin.settings);
				}));

		// Max tokens setting
		new Setting(containerEl)
			.setName(locale.maxTokensName)
			.setDesc(locale.maxTokensDesc)
			.addSlider(slider => slider
				.setLimits(100, 32768, 100)
				.setValue(this.plugin.settings.maxTokens)
				.setDynamicTooltip()
				.onChange(async (value) => {
					this.plugin.settings.maxTokens = value;
					await this.plugin.saveSettings();
					this.aiService.updateSettings(this.plugin.settings);
				}));

		// Thinking mode settings
		containerEl.createEl('h3', { text: locale.thinkingModeTitle });

		new Setting(containerEl)
			.setName(locale.enableThinkingMode)
			.setDesc(locale.enableThinkingModeDesc)
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.thinkingMode)
				.onChange(async (value) => {
					this.plugin.settings.thinkingMode = value;
					await this.plugin.saveSettings();
					this.aiService.updateSettings(this.plugin.settings);
				}));

		new Setting(containerEl)
			.setName(locale.thinkingBudget)
			.setDesc(locale.thinkingBudgetDesc)
			.addSlider(slider => slider
				.setLimits(-1, 8192, 128)
				.setValue(this.plugin.settings.thinkingBudget)
				.setDynamicTooltip()
				.onChange(async (value) => {
					this.plugin.settings.thinkingBudget = value;
					await this.plugin.saveSettings();
					this.aiService.updateSettings(this.plugin.settings);
				}));

		// Search settings
		containerEl.createEl('h3', { text: locale.searchSettingsTitle });

		new Setting(containerEl)
			.setName(locale.searchInVaultName)
			.setDesc(locale.searchInVaultDesc)
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.searchInVault)
				.onChange(async (value) => {
					this.plugin.settings.searchInVault = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName(locale.includeFileContentName)
			.setDesc(locale.includeFileContentDesc)
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.includeFileContent)
				.onChange(async (value) => {
					this.plugin.settings.includeFileContent = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName(locale.contextLimitName)
			.setDesc(locale.contextLimitDesc)
			.addSlider(slider => slider
				.setLimits(5, 50, 5)
				.setValue(this.plugin.settings.contextLimit)
				.setDynamicTooltip()
				.onChange(async (value) => {
					this.plugin.settings.contextLimit = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName(locale.smartSearchName)
			.setDesc(locale.smartSearchDesc)
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.smartSearch)
				.onChange(async (value) => {
					this.plugin.settings.smartSearch = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName(locale.useSemanticSearchName)
			.setDesc(locale.useSemanticSearchDesc)
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.useSemanticSearch)
				.onChange(async (value) => {
					this.plugin.settings.useSemanticSearch = value;
					await this.plugin.saveSettings();
				}));

		// Advanced features
		containerEl.createEl('h3', { text: locale.advancedFeaturesSection });
		containerEl.createEl('small', { text: locale.advancedFeaturesDesc, cls: 'setting-item-description section-description' });

		new Setting(containerEl)
			.setName(locale.useWebSearchName)
			.setDesc(locale.useWebSearchDesc + ' ⚠️ Примечание: Web Search и Code Execution нельзя использовать одновременно.')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.useWebSearch)
				.onChange(async (value) => {
					this.plugin.settings.useWebSearch = value;
					if (value) {
						this.plugin.settings.useCodeExecution = false; // Отключаем Code Execution
					}
					await this.plugin.saveSettings();
					this.display(); // Обновляем интерфейс
				}));

		new Setting(containerEl)
			.setName(locale.useCodeExecutionName)
			.setDesc(locale.useCodeExecutionDesc + ' ⚠️ Примечание: Web Search и Code Execution нельзя использовать одновременно.')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.useCodeExecution)
				.onChange(async (value) => {
					this.plugin.settings.useCodeExecution = value;
					if (value) {
						this.plugin.settings.useWebSearch = false; // Отключаем Web Search
					}
					await this.plugin.saveSettings();
					this.display(); // Обновляем интерфейс
				}));

		// File management settings
		containerEl.createEl('h3', { text: locale.fileManagementSection });
		containerEl.createEl('small', { text: locale.fileManagementDesc, cls: 'setting-item-description section-description' });

		new Setting(containerEl)
			.setName(locale.saveToSearchFolderName)
			.setDesc(locale.saveToSearchFolderDesc)
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.saveToSearchFolder)
				.onChange(async (value) => {
					this.plugin.settings.saveToSearchFolder = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName(locale.searchFolderName)
			.setDesc(locale.searchFolderDesc)
			.addText(text => text
				.setPlaceholder('Search Results')
				.setValue(this.plugin.settings.searchFolderPath)
				.onChange(async (value) => {
					this.plugin.settings.searchFolderPath = value || 'Search Results';
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName(locale.excludeSearchResults)
			.setDesc(locale.excludeSearchResultsDesc)
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.excludeSearchResults)
				.onChange(async (value) => {
					this.plugin.settings.excludeSearchResults = value;
					await this.plugin.saveSettings();
				}));

		// Interface settings
		containerEl.createEl('h3', { text: locale.interfaceSettingsTitle });

		new Setting(containerEl)
			.setName(locale.streamingModeName)
			.setDesc(locale.streamingModeDesc)
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.streamingMode)
				.onChange(async (value) => {
					this.plugin.settings.streamingMode = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName(locale.showTokenUsageName)
			.setDesc(locale.showTokenUsageDesc)
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.showTokenUsage)
				.onChange(async (value) => {
					this.plugin.settings.showTokenUsage = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName(locale.autoSaveResultsName)
			.setDesc(locale.autoSaveResultsDesc)
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.autoSaveResults)
				.onChange(async (value) => {
					this.plugin.settings.autoSaveResults = value;
					await this.plugin.saveSettings();
				}));

		// History settings
		containerEl.createEl('h3', { text: locale.historySettingsTitle });

		new Setting(containerEl)
			.setName(locale.searchHistoryName)
			.setDesc(locale.searchHistoryDesc)
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.searchHistory)
				.onChange(async (value) => {
					this.plugin.settings.searchHistory = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName(locale.maxHistorySizeName)
			.setDesc(locale.maxHistorySizeDesc)
			.addSlider(slider => slider
				.setLimits(10, 200, 10)
				.setValue(this.plugin.settings.maxHistorySize)
				.setDynamicTooltip()
				.onChange(async (value) => {
					this.plugin.settings.maxHistorySize = value;
					await this.plugin.saveSettings();
				}));

		// Clear history button
		new Setting(containerEl)
			.setName(locale.clearHistoryName)
			.setDesc(locale.clearHistoryDesc)
			.addButton(button => button
				.setButtonText(locale.clearHistoryButton)
				.setWarning()
				.onClick(() => {
					localStorage.removeItem('google-ai-search-history');
					new Notice(locale.historyClearedNotice);
				}));

		// API Information
		containerEl.createEl('h3', { text: locale.apiInformationSection });
		containerEl.createEl('small', { text: locale.apiInformationDesc, cls: 'setting-item-description section-description' });
		
		const infoEl = containerEl.createEl('div', { cls: 'google-ai-info' });
		infoEl.createEl('p', { text: locale.apiInfoText1 });
		infoEl.createEl('p').innerHTML = locale.apiInfoText2;
		infoEl.createEl('p', { text: locale.apiInfoText3 });

		const linksContainer = containerEl.createDiv({ cls: 'api-links-container' });
		linksContainer.createEl('div', { 
			text: this.plugin.settings.language === 'en' ? locale.linksHeaderEn : locale.linksHeaderRu,
			cls: 'links-header'
		});
		
		const linksList = linksContainer.createEl('div', { cls: 'links-list' });
		
		linksList.createEl('span', { text: ' • ' });
		
		const githubLink = linksList.createEl('a', {
			text: locale.githubLinkText,
			href: 'https://github.com/Rerowros',
			cls: 'external-link'
		});
		githubLink.setAttribute('target', '_blank');
		
		linksList.createEl('span', { text: ' • ' });
		
		const telegramLink = linksList.createEl('a', {
			text: locale.telegramLinkText,
			href: 'https://t.me/jerseyfc',
			cls: 'external-link'
		});
		telegramLink.setAttribute('target', '_blank');

		// Add some CSS styles for the links
		const style = document.createElement('style');
		style.textContent = `
			.section-description {
				display: block;
				margin: -10px 0 15px 0;
				padding: 0;
				color: var(--text-muted);
				font-style: italic;
			}
			
			.api-links-container {
				margin-top: 10px;
				padding: 10px;
				background: var(--background-secondary);
				border-radius: 5px;
				font-size: 0.9em;
			}
			
			.links-header {
				margin-bottom: 5px;
				font-weight: 500;
			}
			
			.links-list {
				display: flex;
				flex-wrap: wrap;
				align-items: center;
			}
			
			.external-link {
				color: var(--text-accent);
				text-decoration: none;
			}
			
			.external-link:hover {
				text-decoration: underline;
			}
		`;
		document.head.appendChild(style);
	}

	private createModelSetting(containerEl: HTMLElement): void {
		const modelSetting = new Setting(containerEl)
			.setName('AI Model')
			.setDesc('Select the Google AI model to use');

		this.updateModelDropdown(modelSetting);
	}

	private async updateModelDropdown(setting: Setting): Promise<void> {
		try {
			const models = await this.aiService.listModels();
			
			setting.addDropdown(dropdown => {
				// Add default options first
				models.forEach(model => {
					dropdown.addOption(model.name, model.displayName);
				});

				dropdown.setValue(this.plugin.settings.selectedModel);
				dropdown.onChange(async (value) => {
					this.plugin.settings.selectedModel = value;
					await this.plugin.saveSettings();
					this.aiService.updateSettings(this.plugin.settings);
				});
			});

		} catch (error) {
			console.error('Failed to load models:', error);
			// Fallback to basic dropdown
			setting.addDropdown(dropdown => {				
				dropdown.setValue(this.plugin.settings.selectedModel);
				dropdown.onChange(async (value) => {
					this.plugin.settings.selectedModel = value;
					await this.plugin.saveSettings();
					this.aiService.updateSettings(this.plugin.settings);
				});
			});
		}
	}

	private async refreshModelList(): Promise<void> {
		this.display(); // Refresh the entire settings page
	}
}
