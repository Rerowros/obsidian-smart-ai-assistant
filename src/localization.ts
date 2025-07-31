export interface LocaleStrings {
	// Settings
	settingsTitle: string;
	apiKeyName: string;
	apiKeyDesc: string;
	modelName: string;
	modelDesc: string;
	temperatureName: string;
	temperatureDesc: string;
	maxTokensName: string;
	maxTokensDesc: string;
	searchInVaultName: string;
	searchInVaultDesc: string;
	includeFileContentName: string;
	includeFileContentDesc: string;
	contextLimitName: string;
	contextLimitDesc: string;
	smartSearchName: string;
	smartSearchDesc: string;
	useSemanticSearchName: string;
	useSemanticSearchDesc: string;
	streamingModeName: string;
	streamingModeDesc: string;
	showTokenUsageName: string;
	showTokenUsageDesc: string;
	autoSaveResultsName: string;
	autoSaveResultsDesc: string;
	searchHistoryName: string;
	searchHistoryDesc: string;
	maxHistorySizeName: string;
	maxHistorySizeDesc: string;
	useWebSearchName: string;
	useWebSearchDesc: string;
	useCodeExecutionName: string;
	useCodeExecutionDesc: string;
	saveToSearchFolderName: string;
	saveToSearchFolderDesc: string;
	searchFolderName: string;
	searchFolderDesc: string;
	languageName: string;
	languageDesc: string;

	// Search Modal
	searchModalTitle: string;
	searchTabTitle: string;
	historyTabTitle: string;
	statsTabTitle: string;
	queryInputName: string;
	queryInputDesc: string;
	queryPlaceholder: string;
	searchButtonText: string;
	clearButtonText: string;
	webSearchToggle: string;
	codeExecutionToggle: string;
	saveResultToggle: string;
	searchModeDropdown: string;
	searchModeBasic: string;
	searchModeAdvanced: string;
	searchModeSemantic: string;

	// Results
	searchResults: string;
	foundInFile: string;
	webSource: string;
	codeExecutionResult: string;
	tokenUsage: string;
	searchDuration: string;
	filesSearched: string;
	noResults: string;
	searching: string;
	
	// History
	searchHistoryTitle: string;
	bookmarkResult: string;
	deleteResult: string;
	clearHistory: string;
	
	// Stats
	totalSearches: string;
	totalTokensUsed: string;
	avgSearchTime: string;
	mostUsedModel: string;
	
	// Errors
	errorApiKey: string;
	errorNetwork: string;
	errorModel: string;
	errorGeneral: string;
	
	// Buttons
	save: string;
	cancel: string;
	delete: string;
	copy: string;
	export: string;
	
	// File operations
	createFolder: string;
	saveResult: string;
	openFile: string;
	
	// Advanced features
	advancedFeaturesTitle: string;
	vaultAnalysis: string;
	vaultAnalysisDesc: string;
	analyzeButton: string;
	connectionSuggestions: string;
	connectionSuggestionsDesc: string;
	findConnections: string;
	researchQuestions: string;
	researchQuestionsDesc: string;
	createQuestions: string;
	learningPlan: string;
	learningPlanDesc: string;
	createPlan: string;
	noteImprovement: string;
	noteImprovementDesc: string;
	improveNote: string;
	topicPlaceholder: string;
	learningTopicPlaceholder: string;
	oneWeek: string;
	twoWeeks: string;
	oneMonth: string;
	threeMonths: string;
	
	// Search options
	excludeSearchResults: string;
	excludeSearchResultsDesc: string;
	
	// Additional translations for advanced features
	topicSummaryTitle: string;
	topicSummaryDesc: string;
	createSummary: string;
	selectNote: string;
	selectNotePlaceholder: string;
	enterTopic: string;
	enterTopicForQuestions: string;
	enterTopicForSummary: string;
	enterTopicForPlan: string;
	selectNoteForImprovement: string;
	
	// Additional settings translations
	testApiConnection: string;
	testApiConnectionDesc: string;
	testConnection: string;
	testing: string;
	enterApiKeyFirst: string;
	connectionSuccessful: string;
	connectionFailed: string;
	thinkingModeTitle: string;
	enableThinkingMode: string;
	enableThinkingModeDesc: string;
	thinkingBudget: string;
	thinkingBudgetDesc: string;
	searchSettingsTitle: string;
	restartRequired: string;

	// Interface and History Settings
	interfaceSettingsTitle: string;
	historySettingsTitle: string;
	clearHistoryName: string;
	clearHistoryDesc: string;
	clearHistoryButton: string;
	historyClearedNotice: string;

	// API Information
	apiInfoTitle: string;
	apiInfoText1: string;
	apiInfoText2: string;
	apiInfoText3: string;

	// Helpful Links
	linksHeaderEn: string;
	linksHeaderRu: string;
	githubLinkText: string;
	telegramLinkText: string;

	// Advanced Features Section
	advancedFeaturesSection: string;
	advancedFeaturesDesc: string;
	
	// File Management Section
	fileManagementSection: string;
	fileManagementDesc: string;
	
	// API Information Section
	apiInformationSection: string;
	apiInformationDesc: string;
	
	// Quick Commands
	quickCommandsTitle: string;
	quickCommandWhatIHave: string;
	quickCommandFindConnections: string;
	quickCommandAnalyze: string;
	quickCommandIdeas: string;
	
	// Streaming related
	searchStreaming: string;
	streamingModeSearch: string;
	
	// Search progress
	webSearchProgress: string;
	codeExecutionProgress: string;
	
	// Notice messages
	historyCleared: string;
	enterSearchQuery: string;
	configureApiKey: string;
	resultSaved: string;
	savingError: string;
	resultCopied: string;
	resultSavedAs: string;
	resultSavedInRoot: string;
	savingErrorGeneral: string;
	
	// Error messages
	modelOverloaded: string;
	invalidApiKey: string;
	quotaExceeded: string;
	unknownSearchError: string;
	searchErrorTitle: string;
	
	// Troubleshooting
	possibleSolutions: string;
	checkApiKey: string;
	checkConnection: string;
	checkLimits: string;
}

export const LOCALE_EN: LocaleStrings = {
	// Settings
	settingsTitle: 'Google AI Smart Search Settings',
	apiKeyName: 'Google AI API Key',
	apiKeyDesc: 'Enter your Google AI API key from Google AI Studio',
	modelName: 'AI Model',
	modelDesc: 'Select the AI model to use for search and generation',
	temperatureName: 'Temperature',
	temperatureDesc: 'Controls randomness (0.0 = focused, 1.0 = creative)',
	maxTokensName: 'Max Output Tokens',
	maxTokensDesc: 'Maximum number of tokens in AI response',
	searchInVaultName: 'Search in Vault',
	searchInVaultDesc: 'Include vault content in search',
	includeFileContentName: 'Include File Content',
	includeFileContentDesc: 'Include full file content in search context',
	contextLimitName: 'Context Limit',
	contextLimitDesc: 'Maximum number of files to include in context',
	smartSearchName: 'Smart Search',
	smartSearchDesc: 'Use multi-stage intelligent search strategies',
	useSemanticSearchName: 'Semantic Search',
	useSemanticSearchDesc: 'Use AI-powered semantic similarity search',
	streamingModeName: 'Streaming Mode',
	streamingModeDesc: 'Stream AI responses in real-time',
	showTokenUsageName: 'Show Token Usage',
	showTokenUsageDesc: 'Display token consumption statistics',
	autoSaveResultsName: 'Auto-save Results',
	autoSaveResultsDesc: 'Automatically save search results to files',
	searchHistoryName: 'Search History',
	searchHistoryDesc: 'Keep history of search queries and results',
	maxHistorySizeName: 'Max History Size',
	maxHistorySizeDesc: 'Maximum number of search results to keep in history',
	useWebSearchName: 'Web Search (Google Grounding)',
	useWebSearchDesc: 'Enable web search capabilities using Google Grounding',
	useCodeExecutionName: 'Code Execution',
	useCodeExecutionDesc: 'Enable code execution capabilities',
	saveToSearchFolderName: 'Save to Search Folder',
	saveToSearchFolderDesc: 'Save search results to a dedicated search folder',
	searchFolderName: 'Search Folder Path',
	searchFolderDesc: 'Path where search results will be saved (default: "Search Results")',
	languageName: 'Interface Language',
	languageDesc: 'Select interface language',

	// Search Modal
	searchModalTitle: '🤖 AI Smart Search with Google AI',
	searchTabTitle: '🔍 Search',
	historyTabTitle: '📚 History',
	statsTabTitle: '📊 Statistics',
	queryInputName: '🔍 Search Query',
	queryInputDesc: 'Enter your question or search query for intelligent search',
	queryPlaceholder: 'e.g., Tell me about machine learning methods based on my notes...',
	searchButtonText: 'Search',
	clearButtonText: 'Clear',
	webSearchToggle: 'Web Search',
	codeExecutionToggle: 'Code Execution',
	saveResultToggle: 'Save Result',
	searchModeDropdown: 'Search Mode',
	searchModeBasic: 'Basic',
	searchModeAdvanced: 'Advanced',
	searchModeSemantic: 'Semantic',

	// Results
	searchResults: 'Search Results',
	foundInFile: 'Found in file',
	webSource: 'Web source',
	codeExecutionResult: 'Code execution result',
	tokenUsage: 'Token usage',
	searchDuration: 'Search duration',
	filesSearched: 'Files searched',
	noResults: 'No results found',
	searching: 'Searching...',
	
	// History
	searchHistoryTitle: 'Search History',
	bookmarkResult: 'Bookmark',
	deleteResult: 'Delete',
	clearHistory: 'Clear History',
	
	// Stats
	totalSearches: 'Total searches',
	totalTokensUsed: 'Total tokens used',
	avgSearchTime: 'Average search time',
	mostUsedModel: 'Most used model',
	
	// Errors
	errorApiKey: 'Please configure your Google AI API key in settings',
	errorNetwork: 'Network error. Please check your connection',
	errorModel: 'Model error. Please try a different model',
	errorGeneral: 'An error occurred during search',
	
	// Buttons
	save: 'Save',
	cancel: 'Cancel',
	delete: 'Delete',
	copy: 'Copy',
	export: 'Export',
	
	// File operations
	createFolder: 'Create Folder',
	saveResult: 'Save Result',
	openFile: 'Open File',
	
	// Advanced features
	advancedFeaturesTitle: '🚀 Advanced AI Features',
	vaultAnalysis: '📊 Vault Analysis',
	vaultAnalysisDesc: 'Analyze the structure and quality of knowledge organization',
	analyzeButton: 'Analyze',
	connectionSuggestions: '🔗 Connection Suggestions',
	connectionSuggestionsDesc: 'Find smart connections between notes',
	findConnections: 'Find Connections',
	researchQuestions: '❓ Research Questions',
	researchQuestionsDesc: 'Generate questions to deepen understanding of a topic',
	createQuestions: 'Generate Questions',
	learningPlan: '📚 Learning Plan',
	learningPlanDesc: 'Create a personalized learning plan for a topic',
	createPlan: 'Create Plan',
	noteImprovement: '✨ Note Improvement',
	noteImprovementDesc: 'Get suggestions to improve a note',
	improveNote: 'Improve Note',
	topicPlaceholder: 'Enter topic...',
	learningTopicPlaceholder: 'Topic to study...',
	oneWeek: '1 week',
	twoWeeks: '2 weeks',
	oneMonth: '1 month',
	threeMonths: '3 months',
	
	// Search options
	excludeSearchResults: 'Exclude Search Results Folder',
	excludeSearchResultsDesc: 'Do not include files from the search results folder in searches',
	
	// Additional translations for advanced features
	topicSummaryTitle: '📝 Topic Summary',
	topicSummaryDesc: 'Create comprehensive summary of all knowledge on a topic',
	createSummary: 'Create Summary',
	selectNote: 'Select Note',
	selectNotePlaceholder: 'Select a note...',
	enterTopic: 'Enter a topic for analysis',
	enterTopicForQuestions: 'Enter a topic for analysis',
	enterTopicForSummary: 'Enter a topic for creating summary',
	enterTopicForPlan: 'Enter a topic for creating plan',
	selectNoteForImprovement: 'Select a note for analysis',
	
	// Additional settings translations
	testApiConnection: 'Test API Connection',
	testApiConnectionDesc: 'Test your API key and connection',
	testConnection: 'Test Connection',
	testing: 'Testing...',
	enterApiKeyFirst: 'Please enter an API key first',
	connectionSuccessful: 'Connection successful! Found',
	connectionFailed: 'Connection failed:',
	thinkingModeTitle: '🧠 Thinking Mode (supported!)',
	enableThinkingMode: 'Enable Thinking Mode',
	enableThinkingModeDesc: 'Model will "think" before responding to improve reasoning quality (works with 2.5 models)',
	thinkingBudget: 'Thinking Budget',
	thinkingBudgetDesc: 'Number of tokens for "thinking" (-1 = auto, 0 = off, >0 = fixed limit)',
	searchSettingsTitle: '🔍 Search Settings',
	restartRequired: '(restart required)',

	// Interface and History Settings
	interfaceSettingsTitle: '🎨 Interface Settings',
	historySettingsTitle: '📚 History Settings',
	clearHistoryName: 'Clear History',
	clearHistoryDesc: 'Delete all saved search history',
	clearHistoryButton: '🗑️ Clear History',
	historyClearedNotice: 'Search history cleared',

	// API Information
	apiInfoTitle: 'API Information',
	apiInfoText1: 'Google AI API provides access to Gemini models for intelligent content generation and analysis.',
	apiInfoText2: 'Get your free API key at: <a href="https://aistudio.google.com/apikey">https://aistudio.google.com/apikey</a>',
	apiInfoText3: 'Check rate limits and pricing at Google AI documentation.',

	// Helpful Links
	linksHeaderEn: '🔗 Helpful links:',
	linksHeaderRu: '🔗 Полезные ссылки:',
	githubLinkText: 'GitHub: Rerowros',
	telegramLinkText: 'Telegram: @jerseyfc',

	// Advanced Features Section
	advancedFeaturesSection: 'Advanced Features',
	advancedFeaturesDesc: 'Advanced AI features for intelligent analysis and content generation',
	
	// File Management Section
	fileManagementSection: 'File Management',
	fileManagementDesc: 'Settings for managing search results and file operations',
	
	// API Information Section
	apiInformationSection: 'API Information',
	apiInformationDesc: 'Information about Google AI API usage and configuration',
	
	// Quick Commands
	quickCommandsTitle: '⚡ Quick Commands:',
	quickCommandWhatIHave: '📝 What I have about topic...',
	quickCommandFindConnections: '🔗 Find connections between...',
	quickCommandAnalyze: '📊 Analyze in detail...',
	quickCommandIdeas: '💡 Give ideas based on...',
	
	// Streaming related
	searchStreaming: 'Searching (streaming)...',
	streamingModeSearch: '⚡ Search (stream)',
	
	// Search progress
	webSearchProgress: '🌐 Performing web search...',
	codeExecutionProgress: '💻 Executing code...',
	
	// Notice messages
	historyCleared: 'Search history cleared',
	enterSearchQuery: 'Please enter a search query',
	configureApiKey: 'Please configure API key in plugin settings',
	resultSaved: 'Result saved:',
	savingError: 'Saving error:',
	resultCopied: 'Result copied to clipboard',
	resultSavedAs: '✅ Result saved as',
	resultSavedInRoot: '✅ Result saved as',
	savingErrorGeneral: '❌ Error saving note',
	
	// Error messages
	modelOverloaded: 'Model temporarily overloaded. Try again later or select another model in settings.',
	invalidApiKey: 'Invalid API key. Check the key in plugin settings.',
	quotaExceeded: 'API limit exceeded. Check quotas in Google AI Console.',
	unknownSearchError: 'Unknown search error',
	searchErrorTitle: '❌ Search Error',
	
	// Troubleshooting
	possibleSolutions: 'Possible solutions:',
	checkApiKey: 'Check your API key in settings',
	checkConnection: 'Make sure you have internet connection',
	checkLimits: 'Check your Google AI API limits',
};

export const LOCALE_RU: LocaleStrings = {
	// Settings
	settingsTitle: 'Настройки Google AI Smart Search',
	apiKeyName: 'API ключ Google AI',
	apiKeyDesc: 'Введите ваш API ключ Google AI из Google AI Studio',
	modelName: 'AI модель',
	modelDesc: 'Выберите AI модель для поиска и генерации',
	temperatureName: 'Температура',
	temperatureDesc: 'Управляет случайностью (0.0 = точно, 1.0 = креативно)',
	maxTokensName: 'Макс. токенов на выходе',
	maxTokensDesc: 'Максимальное количество токенов в ответе AI',
	searchInVaultName: 'Поиск в хранилище',
	searchInVaultDesc: 'Включить содержимое хранилища в поиск',
	includeFileContentName: 'Включить содержимое файлов',
	includeFileContentDesc: 'Включить полное содержимое файлов в контекст поиска',
	contextLimitName: 'Лимит контекста',
	contextLimitDesc: 'Максимальное количество файлов для включения в контекст',
	smartSearchName: 'Умный поиск',
	smartSearchDesc: 'Использовать многоэтапные интеллектуальные стратегии поиска',
	useSemanticSearchName: 'Семантический поиск',
	useSemanticSearchDesc: 'Использовать семантический поиск с помощью AI',
	streamingModeName: 'Потоковый режим',
	streamingModeDesc: 'Потоковая передача ответов AI в реальном времени',
	showTokenUsageName: 'Показывать использование токенов',
	showTokenUsageDesc: 'Отображать статистику потребления токенов',
	autoSaveResultsName: 'Автосохранение результатов',
	autoSaveResultsDesc: 'Автоматически сохранять результаты поиска в файлы',
	searchHistoryName: 'История поиска',
	searchHistoryDesc: 'Ведение истории поисковых запросов и результатов',
	maxHistorySizeName: 'Макс. размер истории',
	maxHistorySizeDesc: 'Максимальное количество результатов поиска в истории',
	useWebSearchName: 'Веб-поиск (Google Grounding)',
	useWebSearchDesc: 'Включить возможности веб-поиска с помощью Google Grounding',
	useCodeExecutionName: 'Выполнение кода',
	useCodeExecutionDesc: 'Включить возможности выполнения кода',
	saveToSearchFolderName: 'Сохранить в папку поиска',
	saveToSearchFolderDesc: 'Сохранять результаты поиска в выделенную папку поиска',
	searchFolderName: 'Путь к папке поиска',
	searchFolderDesc: 'Путь для сохранения результатов поиска (по умолчанию: "Результаты поиска")',
	languageName: 'Язык интерфейса',
	languageDesc: 'Выберите язык интерфейса',

	// Search Modal
	searchModalTitle: '🤖 Интеллектуальный поиск с Google AI',
	searchTabTitle: '🔍 Поиск',
	historyTabTitle: '📚 История',
	statsTabTitle: '📊 Статистика',
	queryInputName: '🔍 Поисковый запрос',
	queryInputDesc: 'Введите ваш вопрос или запрос для интеллектуального поиска',
	queryPlaceholder: 'Например: Расскажи о методах машинного обучения на основе моих заметок...',
	searchButtonText: 'Поиск',
	clearButtonText: 'Очистить',
	webSearchToggle: 'Веб-поиск',
	codeExecutionToggle: 'Выполнение кода',
	saveResultToggle: 'Сохранить результат',
	searchModeDropdown: 'Режим поиска',
	searchModeBasic: 'Базовый',
	searchModeAdvanced: 'Продвинутый',
	searchModeSemantic: 'Семантический',

	// Results
	searchResults: 'Результаты поиска',
	foundInFile: 'Найдено в файле',
	webSource: 'Веб-источник',
	codeExecutionResult: 'Результат выполнения кода',
	tokenUsage: 'Использование токенов',
	searchDuration: 'Длительность поиска',
	filesSearched: 'Файлов просмотрено',
	noResults: 'Результаты не найдены',
	searching: 'Поиск...',
	
	// History
	searchHistoryTitle: 'История поиска',
	bookmarkResult: 'В закладки',
	deleteResult: 'Удалить',
	clearHistory: 'Очистить историю',
	
	// Stats
	totalSearches: 'Всего поисков',
	totalTokensUsed: 'Всего токенов использовано',
	avgSearchTime: 'Среднее время поиска',
	mostUsedModel: 'Наиболее используемая модель',
	
	// Errors
	errorApiKey: 'Пожалуйста, настройте ваш API ключ Google AI в настройках',
	errorNetwork: 'Ошибка сети. Проверьте ваше соединение',
	errorModel: 'Ошибка модели. Попробуйте другую модель',
	errorGeneral: 'Произошла ошибка во время поиска',
	
	// Buttons
	save: 'Сохранить',
	cancel: 'Отмена',
	delete: 'Удалить',
	copy: 'Копировать',
	export: 'Экспорт',
	
	// File operations
	createFolder: 'Создать папку',
	saveResult: 'Сохранить результат',
	openFile: 'Открыть файл',
	
	// Advanced features
	advancedFeaturesTitle: '🚀 Расширенные возможности AI',
	vaultAnalysis: '📊 Анализ хранилища',
	vaultAnalysisDesc: 'Проанализировать структуру и качество организации знаний',
	analyzeButton: 'Анализировать',
	connectionSuggestions: '🔗 Предложения связей',
	connectionSuggestionsDesc: 'Найти умные связи между заметками',
	findConnections: 'Найти связи',
	researchQuestions: '❓ Исследовательские вопросы',
	researchQuestionsDesc: 'Создать вопросы для углубления в тему',
	createQuestions: 'Создать вопросы',
	learningPlan: '📚 План обучения',
	learningPlanDesc: 'Создать персонализированный план изучения темы',
	createPlan: 'Создать план',
	noteImprovement: '✨ Улучшение заметки',
	noteImprovementDesc: 'Получить предложения по улучшению заметки',
	improveNote: 'Улучшить заметку',
	topicPlaceholder: 'Введите тему...',
	learningTopicPlaceholder: 'Тема для изучения...',
	oneWeek: '1 неделя',
	twoWeeks: '2 недели',
	oneMonth: '1 месяц',
	threeMonths: '3 месяца',
	
	// Search options
	excludeSearchResults: 'Исключить папку с результатами поиска',
	excludeSearchResultsDesc: 'Не включать файлы из папки результатов поиска в поиск',
	
	// Additional translations for advanced features
	topicSummaryTitle: '📝 Резюме по теме',
	topicSummaryDesc: 'Создать comprehensive резюме всех знаний по теме',
	createSummary: 'Создать резюме',
	selectNote: 'Выберите заметку',
	selectNotePlaceholder: 'Выберите заметку...',
	enterTopic: 'Введите тему для анализа',
	enterTopicForQuestions: 'Введите тему для анализа',
	enterTopicForSummary: 'Введите тему для создания резюме',
	enterTopicForPlan: 'Введите тему для создания плана',
	selectNoteForImprovement: 'Выберите заметку для анализа',
	
	// Additional settings translations
	testApiConnection: 'Тест соединения с API',
	testApiConnectionDesc: 'Проверить ваш API ключ и соединение',
	testConnection: 'Тест соединения',
	testing: 'Проверка...',
	enterApiKeyFirst: 'Сначала введите API ключ',
	connectionSuccessful: 'Соединение успешно! Найдено',
	connectionFailed: 'Ошибка соединения:',
	thinkingModeTitle: '🧠 Thinking Mode (поддерживается!)',
	enableThinkingMode: 'Включить Thinking Mode',
	enableThinkingModeDesc: 'Модель будет "думать" перед ответом для улучшения качества рассуждений (работает с моделями 2.5)',
	thinkingBudget: 'Thinking Budget',
	thinkingBudgetDesc: 'Количество токенов для "размышлений" (-1 = автоматически, 0 = выкл, >0 = фиксированный лимит)',
	searchSettingsTitle: '🔍 Настройки поиска',
	restartRequired: '(требуется перезапуск)',

	// Interface and History Settings
	interfaceSettingsTitle: '🎨 Настройки интерфейса',
	historySettingsTitle: '📚 Настройки истории',
	clearHistoryName: 'Очистить историю',
	clearHistoryDesc: 'Удалить всю сохраненную историю поиска',
	clearHistoryButton: '🗑️ Очистить историю',
	historyClearedNotice: 'История поиска очищена',

	// API Information
	apiInfoTitle: 'Информация об API',
	apiInfoText1: 'Google AI API предоставляет доступ к моделям Gemini для интеллектуального создания и анализа контента.',
	apiInfoText2: 'Получите бесплатный API ключ: <a href="https://aistudio.google.com/apikey">https://aistudio.google.com/apikey</a>',
	apiInfoText3: 'Проверьте лимиты и цены в документации Google AI.',

	// Helpful Links
	linksHeaderEn: '🔗 Helpful links:',
	linksHeaderRu: '🔗 Полезные ссылки:',
	githubLinkText: 'GitHub: Rerowros',
	telegramLinkText: 'Telegram: @jerseyfc',

	// Advanced Features Section
	advancedFeaturesSection: 'Продвинутые функции',
	advancedFeaturesDesc: 'Продвинутые возможности AI для интеллектуального анализа и генерации контента',
	
	// File Management Section
	fileManagementSection: 'Управление файлами',
	fileManagementDesc: 'Настройки для управления результатами поиска и файловыми операциями',
	
	// API Information Section
	apiInformationSection: 'Информация об API',
	apiInformationDesc: 'Информация об использовании и настройке Google AI API',
	
	// Quick Commands
	quickCommandsTitle: '⚡ Быстрые команды:',
	quickCommandWhatIHave: '📝 Что у меня есть по теме...',
	quickCommandFindConnections: '🔗 Найди связи между...',
	quickCommandAnalyze: '📊 Сделай анализ...',
	quickCommandIdeas: '💡 Дай идеи на основе...',
	
	// Streaming related
	searchStreaming: 'Поиск (потоковый режим)...',
	streamingModeSearch: '⚡ Поиск (стрим)',
	
	// Search progress
	webSearchProgress: '🌐 Выполняется веб-поиск...',
	codeExecutionProgress: '💻 Выполняется код...',
	
	// Notice messages
	historyCleared: 'История поиска очищена',
	enterSearchQuery: 'Пожалуйста, введите поисковый запрос',
	configureApiKey: 'Пожалуйста, настройте API ключ в настройках плагина',
	resultSaved: 'Результат сохранен:',
	savingError: 'Ошибка сохранения:',
	resultCopied: 'Результат скопирован в буфер обмена',
	resultSavedAs: '✅ Результат сохранен как',
	resultSavedInRoot: '✅ Результат сохранен как',
	savingErrorGeneral: '❌ Ошибка при сохранении заметки',
	
	// Error messages
	modelOverloaded: 'Модель временно перегружена. Попробуйте позже или выберите другую модель в настройках.',
	invalidApiKey: 'Неверный API ключ. Проверьте ключ в настройках плагина.',
	quotaExceeded: 'Превышен лимит API. Проверьте квоты в Google AI Console.',
	unknownSearchError: 'Неизвестная ошибка поиска',
	searchErrorTitle: '❌ Ошибка поиска',
	
	// Troubleshooting
	possibleSolutions: 'Возможные решения:',
	checkApiKey: 'Проверьте ваш API ключ в настройках',
	checkConnection: 'Убедитесь, что у вас есть интернет соединение',
	checkLimits: 'Проверьте лимиты вашего Google AI API',
};

export function getLocale(language: 'en' | 'ru' = 'ru'): LocaleStrings {
	return language === 'en' ? LOCALE_EN : LOCALE_RU;
}
