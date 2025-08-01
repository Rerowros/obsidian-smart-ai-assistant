import { App, Modal, Setting, ButtonComponent, Notice, DropdownComponent, TextComponent, Platform } from 'obsidian';
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
		
		// Добавляем платформо-специфичные классы
		if (Platform.isIosApp) {
			contentEl.addClass('advanced-features-ios');
		}
		if (Platform.isAndroidApp) {
			contentEl.addClass('advanced-features-android');
		}
		if (Platform.isMobile) {
			contentEl.addClass('advanced-features-mobile');
		}

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
				this.setupMobileButton(button);
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
				this.setupMobileButton(button);
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
				this.setupMobileButton(button);
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
				this.setupMobileButton(button);
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
				this.setupMobileButton(button);
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
				text.inputEl.addClass('advanced-text-input');
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
				this.setupMobileButton(button);
				this.allFeatureButtons.push(button);
			});

		// Single file discussion
		const singleFileContainer = featureContainer.createDiv({ cls: 'feature-section single-file-discussion' });
		singleFileContainer.createEl('h3', { text: locale.singleFileDiscussion });
		singleFileContainer.createEl('p', { text: locale.singleFileDiscussionDesc, cls: 'feature-description' });
		
		let fileDiscussionDropdown: DropdownComponent;
		let discussionQueryInput: TextComponent;
		
		const fileDiscussionInputContainer = singleFileContainer.createDiv({ cls: 'feature-input' });
		new Setting(fileDiscussionInputContainer)
			.addDropdown(dropdown => {
				fileDiscussionDropdown = dropdown;
				const files = this.app.vault.getMarkdownFiles();
				dropdown.addOption('', locale.selectFileForDiscussion);
				files.slice(0, 100).forEach(file => { // Увеличиваем лимит для одного файла
					dropdown.addOption(file.path, file.basename);
				});
			});
		
		const discussionInputContainer = singleFileContainer.createDiv({ cls: 'file-discussion-input' });
		new Setting(discussionInputContainer)
			.addTextArea(textarea => {
				discussionQueryInput = textarea as any as TextComponent;
				textarea.setPlaceholder(locale.discussionQueryPlaceholder);
				textarea.inputEl.addClass('file-discussion-textarea');
			});
		
		singleFileContainer.createEl('hr');
		const fileDiscussionButtonContainer = singleFileContainer.createDiv({ cls: 'feature-buttons' });
		new Setting(fileDiscussionButtonContainer)
			.addButton(button => {
				button.setButtonText(locale.discussWithFile)
					.setCta()
					.onClick(() => {
						const filePath = fileDiscussionDropdown.getValue();
						const query = discussionQueryInput.getValue().trim();
						if (!filePath) {
							new Notice(locale.selectFileForDiscussion);
							return;
						}
						if (!query) {
							new Notice(locale.enterDiscussionQuery);
							return;
						}
						this.discussFile(filePath, query);
					});
				this.setupMobileButton(button);
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

	private setupMobileButton(button: ButtonComponent) {
		if (Platform.isMobile) {
			// Add mobile-friendly classes
			button.buttonEl.addClass('mobile-touch-friendly');
			
			// Add platform-specific styling
			if (Platform.isIosApp) {
				button.buttonEl.addClass('ios-button-style');
			}
			if (Platform.isAndroidApp) {
				button.buttonEl.addClass('android-button-style');
			}
			
			// Add touch event handlers for better feedback
			button.buttonEl.addEventListener('touchstart', (e) => {
				button.buttonEl.addClass('touch-active');
				// Add haptic feedback if available
				if ('vibrate' in navigator) {
					navigator.vibrate(10); // Very short vibration
				}
			});
			
			button.buttonEl.addEventListener('touchend', (e) => {
				setTimeout(() => {
					button.buttonEl.removeClass('touch-active');
				}, 150);
			});
			
			button.buttonEl.addEventListener('touchcancel', (e) => {
				button.buttonEl.removeClass('touch-active');
			});
		}
	}

	private scrollToResult() {
		if (this.resultArea) {
			// For mobile devices, use different scroll behavior
			if (Platform.isMobile) {
				setTimeout(() => {
					this.resultArea.scrollIntoView({ 
						behavior: 'smooth', 
						block: 'nearest',
						inline: 'nearest'
					});
				}, 100); // Small delay to ensure DOM is updated
			} else {
				this.resultArea.scrollIntoView({ behavior: 'smooth', block: 'start' });
			}
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
		
		// Add copy button with mobile-friendly styling
		const copyButton = this.resultArea.createEl('button', { 
			text: '📋 Копировать результат',
			cls: 'copy-result-btn ai-copy-button'
		});
		
		// Add mobile-specific classes for better touch experience
		if (Platform.isMobile) {
			copyButton.addClass('mobile-touch-friendly');
		}
		if (Platform.isIosApp) {
			copyButton.addClass('ios-button-style');
		}
		if (Platform.isAndroidApp) {
			copyButton.addClass('android-button-style');
		}
		
		copyButton.addEventListener('click', () => {
			// Add haptic feedback for mobile devices if available
			if (Platform.isMobile && 'vibrate' in navigator) {
				navigator.vibrate(50); // Short vibration feedback
			}
			
			navigator.clipboard.writeText(result).then(() => {
				new Notice('Результат скопирован в буфер обмена');
				
				// Visual feedback for successful copy
				copyButton.setText('✅ Скопировано!');
				setTimeout(() => {
					copyButton.setText('📋 Копировать результат');
				}, 2000);
			}).catch(() => {
				// Fallback for older browsers or restricted contexts
				const textArea = document.createElement('textarea');
				textArea.value = result;
				document.body.appendChild(textArea);
				textArea.select();
				document.execCommand('copy');
				document.body.removeChild(textArea);
				new Notice('Результат скопирован в буфер обмена');
			});
		});
		this.scrollToResult();
	}

	private showError(error: string) {
		this.hideLoading();
		
		// Создаем элемент ошибки безопасно без innerHTML
		const errorDiv = document.createElement('div');
		errorDiv.addClass('ai-error-container');
		
		const title = document.createElement('h3');
		title.textContent = '❌ Ошибка';
		errorDiv.appendChild(title);
		
		const message = document.createElement('p');
		message.textContent = error;
		errorDiv.appendChild(message);
		
		this.resultArea.empty();
		this.resultArea.appendChild(errorDiv);
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

	private async discussFile(filePath: string, query: string) {
		if (!this.aiService.isConfigured()) {
			new Notice('Пожалуйста, настройте API ключ в настройках плагина');
			return;
		}

		const fileName = filePath.split('/').pop() || filePath;
		this.showLoading(`Обсуждаю файл "${fileName}"`);
		
		try {
			const result = await this.advancedFeatures.discussFile(filePath, query);
			this.showResult(result);
		} catch (error) {
			console.error('File discussion error:', error);
			this.showError(error.message || 'Ошибка при обсуждении файла');
		}
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}
