export interface GoogleAISettings {
	apiKey: string;
	selectedModel: string;
	temperature: number;
	maxTokens: number;
	searchInVault: boolean;
	includeFileContent: boolean;
	contextLimit: number;
	smartSearch: boolean;
	useSemanticSearch: boolean;
	streamingMode: boolean;
	showTokenUsage: boolean;
	autoSaveResults: boolean;
	searchHistory: boolean;
	maxHistorySize: number;
	useWebSearch: boolean;
	useCodeExecution: boolean;
	saveToSearchFolder: boolean;
	searchFolderPath: string;
	excludeSearchResults: boolean;
	language: 'en' | 'ru';
	thinkingMode: boolean;
	thinkingBudget: number; // -1 = dynamic, 0 = off, > 0 = fixed budget
}

export const DEFAULT_SETTINGS: GoogleAISettings = {
	apiKey: '',
	selectedModel: 'gemini-2.5-flash',
	temperature: 0.7,
	maxTokens: 32768,
	searchInVault: true,
	includeFileContent: true,
	contextLimit: 15,
	smartSearch: true,
	useSemanticSearch: true,
	streamingMode: true,
	showTokenUsage: true,
	autoSaveResults: false,
	searchHistory: true,
	maxHistorySize: 50,
	useWebSearch: false,
	useCodeExecution: false,
	saveToSearchFolder: false,
	searchFolderPath: 'Search Results',
	excludeSearchResults: true,
	language: 'ru',
	thinkingMode: true, // Включен по умолчанию с новой библиотекой
	thinkingBudget: -1 // Динамический thinking режим
};

export interface GoogleAIModel {
	name: string;
	displayName: string;
	description?: string;
	version?: string;
	inputTokenLimit?: number;
	outputTokenLimit?: number;
	supportedGenerationMethods?: string[];
}

export interface SearchResult {
	file: string;
	content: string;
	relevance: number;
	summary?: string;
	tokenCount?: number;
	snippet?: string;
	searchTime?: number;
}

export interface TokenUsage {
	inputTokens: number;
	outputTokens: number;
	totalTokens: number;
	cost?: number;
}

export interface SearchStats {
	query: string;
	duration: number;
	filesSearched: number;
	tokensUsed: TokenUsage;
	strategy: string;
	timestamp: number;
}

export interface SearchHistoryItem {
	id: string;
	query: string;
	response: string;
	timestamp: number;
	stats: SearchStats;
	bookmarked?: boolean;
	savedFilePath?: string;
	webResults?: WebSearchResult[];
	codeExecutionResults?: CodeExecutionResult[];
}

export interface WebSearchResult {
	title: string;
	url: string;
	snippet: string;
	source: string;
	relevance?: number;
}

export interface CodeExecutionResult {
	code: string;
	output: string;
	error?: string;
	language: string;
	executionTime?: number;
}

export interface ClickableResult {
	type: 'file' | 'web' | 'code';
	text: string;
	action: () => void;
	tooltip?: string;
}
