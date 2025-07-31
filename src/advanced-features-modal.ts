import { App, Modal, Setting, ButtonComponent, Notice, DropdownComponent, TextComponent } from 'obsidian';
import GoogleAIPlugin from '../main';
import { GoogleAIService } from './googleai-service';
import { AdvancedAIFeatures } from './advanced-ai-features';
import { getLocale } from './localization';

export class AdvancedFeaturesModal extends Modal {
	plugin: GoogleAIPlugin;
	private aiService: GoogleAIService;
	private advancedFeatures: AdvancedAIFeatures;
	private resultArea: HTMLElement;
	private loadingArea: HTMLElement;
	private allFeatureButtons: ButtonComponent[] = [];

	constructor(app: App, plugin: GoogleAIPlugin) {
		super(app);
		this.plugin = plugin;
		this.aiService = new GoogleAIService(plugin.settings);
		this.advancedFeatures = new AdvancedAIFeatures(app.vault, this.aiService, plugin.settings);
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();
		
		// Добавляем CSS класс для правильного стилизации
		contentEl.addClass('advanced-features-modal');

		const locale = getLocale(this.plugin.settings.language);
		contentEl.createEl('h2', { text: locale.advancedFeaturesTitle });

		// Feature selection
		const featureContainer = contentEl.createDiv({ cls: 'feature-selection' });
		
		// Vault analysis
		const vaultSection = featureContainer.createDiv({ cls: 'feature-section' });
		vaultSection.createEl('h3', { text: locale.vaultAnalysis });
		vaultSection.createEl('p', { text: locale.vaultAnalysisDesc, cls: 'feature-description' });
		vaultSection.createEl('hr');
		// Vault analysis
		const vaultButtonContainer = vaultSection.createDiv({ cls: 'feature-buttons' });
		new Setting(vaultButtonContainer)
			.addButton(button => {
				button.setButtonText(locale.analyzeButton)
					.setCta()
					.onClick(() => this.analyzeVault());
				this.allFeatureButtons.push(button);
			});

		// Connection suggestions
		const connectionSection = featureContainer.createDiv({ cls: 'feature-section' });
		connectionSection.createEl('h3', { text: locale.connectionSuggestions });
		connectionSection.createEl('p', { text: locale.connectionSuggestionsDesc, cls: 'feature-description' });
		connectionSection.createEl('hr');
		const connectionButtonContainer = connectionSection.createDiv({ cls: 'feature-buttons' });
		new Setting(connectionButtonContainer)
			.addButton(button => {
				button.setButtonText(locale.findConnections)
					.onClick(() => this.suggestConnections());
				this.allFeatureButtons.push(button);
			});
		// Topic questions
		const questionsSection = featureContainer.createDiv({ cls: 'feature-section' });
		questionsSection.createEl('h3', { text: locale.researchQuestions });
		questionsSection.createEl('p', { text: locale.researchQuestionsDesc, cls: 'feature-description' });
		
		let topicInput: TextComponent;
		const topicInputContainer = questionsSection.createDiv({ cls: 'feature-input' });
		new Setting(topicInputContainer)
			.addText(text => {
				topicInput = text;
				text.setPlaceholder(locale.topicPlaceholder);
			});
		
		questionsSection.createEl('hr');
		const questionsButtonContainer = questionsSection.createDiv({ cls: 'feature-buttons' });
		new Setting(questionsButtonContainer)
			.addButton(button => {
				button.setButtonText(locale.createQuestions)
					.setCta()
					.onClick(() => {
						const topic = topicInput.getValue().trim();
						if (!topic) {
							new Notice(locale.enterTopicForQuestions);
							return;
						}
						this.generateQuestions(topic);
					});
				this.allFeatureButtons.push(button);
			});

		// Learning plan
		const learningSection = featureContainer.createDiv({ cls: 'feature-section' });
		learningSection.createEl('h3', { text: locale.learningPlan });
		learningSection.createEl('p', { text: locale.learningPlanDesc, cls: 'feature-description' });
		
		let learningTopicInput: TextComponent;
		let timeframeInput: DropdownComponent;
		
		const learningInputContainer = learningSection.createDiv({ cls: 'feature-input' });
		new Setting(learningInputContainer)
			.addText(text => {
				learningTopicInput = text;
				text.setPlaceholder(locale.learningTopicPlaceholder);
			})
			.addDropdown(dropdown => {
				timeframeInput = dropdown;
				dropdown.addOption('1 неделя', locale.oneWeek);
				dropdown.addOption('2 недели', locale.twoWeeks);
				dropdown.addOption('1 месяц', locale.oneMonth);
				dropdown.addOption('3 месяца', locale.threeMonths);
				dropdown.setValue('1 месяц');
			});
		
		learningSection.createEl('hr');
		const learningButtonContainer = learningSection.createDiv({ cls: 'feature-buttons' });
		new Setting(learningButtonContainer)
			.addButton(button => {
				button.setButtonText(locale.createPlan)
					.setCta()
					.onClick(() => {
						const topic = learningTopicInput.getValue().trim();
						if (!topic) {
							new Notice(locale.enterTopicForPlan);
							return;
						}
						this.createLearningPlan(topic, timeframeInput.getValue());
					});
				this.allFeatureButtons.push(button);
			});

		// Note improvement
		const improvementSection = featureContainer.createDiv({ cls: 'feature-section' });
		improvementSection.createEl('h3', { text: locale.noteImprovement });
		improvementSection.createEl('p', { text: locale.noteImprovementDesc, cls: 'feature-description' });
		
		let noteDropdown: DropdownComponent;
		const noteInputContainer = improvementSection.createDiv({ cls: 'feature-input' });
		new Setting(noteInputContainer)
			.addDropdown(dropdown => {
				noteDropdown = dropdown;
				const files = this.app.vault.getMarkdownFiles();
				dropdown.addOption('', locale.selectNotePlaceholder);
				files.slice(0, 50).forEach(file => { // Ограничиваем количество для производительности
					dropdown.addOption(file.path, file.basename);
				});
			});
		
		improvementSection.createEl('hr');
		const improvementButtonContainer = improvementSection.createDiv({ cls: 'feature-buttons' });
		new Setting(improvementButtonContainer)
			.addButton(button => {
				button.setButtonText(locale.improveNote)
					.setCta()
					.onClick(() => {
						const filePath = noteDropdown.getValue();
						if (!filePath) {
							new Notice(locale.selectNoteForImprovement);
							return;
						}
						this.improveNote(filePath);
					});
				this.allFeatureButtons.push(button);
			});

		// Topic summary
		const topicSummaryContainer = featureContainer.createDiv({ cls: 'feature-section' });
		topicSummaryContainer.createEl('h3', { text: locale.topicSummaryTitle });
		topicSummaryContainer.createEl('p', { text: locale.topicSummaryDesc, cls: 'feature-description' });
		
		let summaryTopicInput: TextComponent;
		const summaryInputContainer = topicSummaryContainer.createDiv({ cls: 'feature-input' });
		new Setting(summaryInputContainer)
			.addText(text => {
				summaryTopicInput = text;
				text.setPlaceholder(locale.topicPlaceholder);
				text.inputEl.style.width = '100%';
			});
		
		topicSummaryContainer.createEl('hr');
		const summaryButtonContainer = topicSummaryContainer.createDiv({ cls: 'feature-buttons' });
		new Setting(summaryButtonContainer)
			.addButton(button => {
				button.setButtonText(locale.createSummary)
					.setCta()
					.onClick(() => {
						const topic = summaryTopicInput.getValue().trim();
						if (!topic) {
							new Notice(locale.enterTopicForSummary);
							return;
						}
						this.createTopicSummary(topic);
					});
				this.allFeatureButtons.push(button);
			});

		// Loading area
		this.loadingArea = contentEl.createDiv({ cls: 'loading-area hidden' });
		
		// Result area
		this.resultArea = contentEl.createDiv({ cls: 'advanced-results' });
	}

	private setButtonsDisabled(disabled: boolean) {
		this.allFeatureButtons.forEach(btn => btn.setDisabled(disabled));
	}

	private scrollToResult() {
		if (this.resultArea) {
			this.resultArea.scrollIntoView({ behavior: 'smooth', block: 'start' });
		}
	}

	private showLoading(message: string) {
		this.setButtonsDisabled(true);
		this.loadingArea.removeClass('hidden');
		this.loadingArea.textContent = `🤖 ${message}...`;
		this.resultArea.empty();
	}

	private hideLoading() {
		this.setButtonsDisabled(false);
		this.loadingArea.addClass('hidden');
	}

	private showResult(result: string) {
		this.hideLoading();
		this.resultArea.textContent = result;
		
		// Add copy button
		const copyButton = this.resultArea.createEl('button', { 
			text: '📋 Копировать результат',
			cls: 'copy-result-btn'
		});
		copyButton.style.cssText = 'margin-top: 15px; padding: 8px 16px;';
		
		copyButton.addEventListener('click', () => {
			navigator.clipboard.writeText(result).then(() => {
				new Notice('Результат скопирован в буфер обмена');
			});
		});
		this.scrollToResult();
	}

	private showError(error: string) {
		this.hideLoading();
		this.resultArea.innerHTML = `
			<div style="color: var(--text-error); padding: 15px; background: var(--background-modifier-error); border-radius: 6px;">
				<h3>❌ Ошибка</h3>
				<p>${error}</p>
			</div>
		`;
		this.scrollToResult();
	}

	private async analyzeVault() {
		if (!this.aiService.isConfigured()) {
			new Notice('Пожалуйста, настройте API ключ в настройках плагина');
			return;
		}

		this.showLoading('Анализирую структуру хранилища');
		
		try {
			const result = await this.advancedFeatures.analyzeVaultStructure();
			this.showResult(result);
		} catch (error) {
			console.error('Vault analysis error:', error);
			this.showError(error.message || 'Неизвестная ошибка анализа');
		}
	}

	private async suggestConnections() {
		if (!this.aiService.isConfigured()) {
			new Notice('Пожалуйста, настройте API ключ в настройках плагина');
			return;
		}

		this.showLoading('Ищу интеллектуальные связи между заметками');
		
		try {
			const result = await this.advancedFeatures.suggestConnections();
			this.showResult(result);
		} catch (error) {
			console.error('Connection suggestions error:', error);
			this.showError(error.message || 'Ошибка при поиске связей');
		}
	}

	private async generateQuestions(topic: string) {
		if (!this.aiService.isConfigured()) {
			new Notice('Пожалуйста, настройте API ключ в настройках плагина');
			return;
		}

		this.showLoading(`Создаю исследовательские вопросы по теме "${topic}"`);
		
		try {
			const result = await this.advancedFeatures.generateExploratorQuestions(topic);
			this.showResult(result);
		} catch (error) {
			console.error('Question generation error:', error);
			this.showError(error.message || 'Ошибка при создании вопросов');
		}
	}

	private async createLearningPlan(topic: string, timeframe: string) {
		if (!this.aiService.isConfigured()) {
			new Notice('Пожалуйста, настройте API ключ в настройках плагина');
			return;
		}

		this.showLoading(`Создаю план обучения по теме "${topic}" на ${timeframe}`);
		
		try {
			const result = await this.advancedFeatures.createLearningPlan(topic, timeframe);
			this.showResult(result);
		} catch (error) {
			console.error('Learning plan error:', error);
			this.showError(error.message || 'Ошибка при создании плана обучения');
		}
	}

	private async improveNote(filePath: string) {
		if (!this.aiService.isConfigured()) {
			new Notice('Пожалуйста, настройте API ключ в настройках плагина');
			return;
		}

		const fileName = filePath.split('/').pop() || filePath;
		this.showLoading(`Анализирую заметку "${fileName}"`);
		
		try {
			const result = await this.advancedFeatures.improveNote(filePath);
			this.showResult(result);
		} catch (error) {
			console.error('Note improvement error:', error);
			this.showError(error.message || 'Ошибка при анализе заметки');
		}
	}

	private async createTopicSummary(topic: string) {
		if (!this.aiService.isConfigured()) {
			new Notice('Пожалуйста, настройте API ключ в настройках плагина');
			return;
		}

		this.showLoading(`Создаю резюме по теме "${topic}"`);
		
		try {
			const result = await this.advancedFeatures.createTopicSummary(topic);
			this.showResult(result);
		} catch (error) {
			console.error('Topic summary error:', error);
			this.showError(error.message || 'Ошибка при создании резюме');
		}
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}
