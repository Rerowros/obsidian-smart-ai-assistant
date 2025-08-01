import { TFile, Vault } from 'obsidian';
import { GoogleAIService } from './googleai-service';
import { GoogleAISettings, WebSearchResult } from './types';
import { TextUtils } from './utils';
import { getPrompts, formatPrompt } from './prompts';

export interface SearchResult {
	file: TFile;
	content: string;
	relevance: number;
	snippet: string;
}

export class SmartSearchService {
	private vault: Vault;
	private aiService: GoogleAIService;
	private settings: GoogleAISettings;

	constructor(vault: Vault, aiService: GoogleAIService, settings: GoogleAISettings) {
		this.vault = vault;
		this.aiService = aiService;
		this.settings = settings;
	}

	updateSettings(settings: GoogleAISettings) {
		this.settings = settings;
		this.aiService.updateSettings(settings);
	}

	async performSmartSearch(
		query: string, 
		excludeSearchResults: boolean = true, 
		webResults?: WebSearchResult[], 
		searchMode: 'basic' | 'advanced' | 'semantic' = 'advanced'
	): Promise<string> {
		const prompts = getPrompts(this.settings.language);

		switch (searchMode) {
			case 'basic':
				return this.performBasicAISearch(query, excludeSearchResults, webResults);
			case 'semantic':
				return this.performSemanticSearch(query, excludeSearchResults, webResults);
			case 'advanced':
				return this.performAdvancedSearch(query, excludeSearchResults, webResults);
			default:
				return this.performAdvancedSearch(query, excludeSearchResults, webResults);
		}
	}

	async performSmartSearchStream(
		query: string, 
		onChunk: (chunk: string) => void,
		excludeSearchResults: boolean = true, 
		webResults?: WebSearchResult[], 
		searchMode: 'basic' | 'advanced' | 'semantic' = 'advanced'
	): Promise<string> {
		const prompts = getPrompts(this.settings.language);

		switch (searchMode) {
			case 'basic':
				return this.performBasicAISearchStream(query, onChunk, excludeSearchResults, webResults);
			case 'semantic':
				return this.performSemanticSearchStream(query, onChunk, excludeSearchResults, webResults);
			case 'advanced':
				return this.performAdvancedSearchStream(query, onChunk, excludeSearchResults, webResults);
			default:
				return this.performAdvancedSearchStream(query, onChunk, excludeSearchResults, webResults);
		}
	}

	private async performAdvancedSearch(query: string, excludeSearchResults: boolean, webResults?: WebSearchResult[]): Promise<string> {
		const searchResults = await this.performTextSearch(query, excludeSearchResults);
		if (searchResults.length > 0) {
			return this.generateResponseFromFiles(query, searchResults, webResults);
		}
		return this.performSemanticSearch(query, excludeSearchResults, webResults);
	}

	private async performAdvancedSearchStream(query: string, onChunk: (chunk: string) => void, excludeSearchResults: boolean, webResults?: WebSearchResult[]): Promise<string> {
		const searchResults = await this.performTextSearch(query, excludeSearchResults);
		if (searchResults.length > 0) {
			return this.generateStreamResponseFromFiles(query, searchResults, onChunk, webResults);
		}
		return this.performSemanticSearchStream(query, onChunk, excludeSearchResults, webResults);
	}

	private async performTextSearch(query: string, excludeSearchResults: boolean = true): Promise<SearchResult[]> {
		const files = this.vault.getMarkdownFiles();
		const results: SearchResult[] = [];
		const queryWords = query.toLowerCase().split(/\s+/);

		for (const file of files) {
			if (excludeSearchResults && file.path.startsWith(this.settings.searchFolderPath + '/')) {
				continue;
			}
			
			try {
				const content = await this.vault.read(file);
				const cleanContent = TextUtils.cleanTextForSearch(content);
				const relevance = this.calculateTextRelevance(cleanContent, queryWords);

				if (relevance > 0) {
					const snippet = this.extractRelevantSnippet(cleanContent, queryWords);
					results.push({
						file,
						content: cleanContent,
						relevance,
						snippet
					});
				}
			} catch (error) {
				console.error(`Failed to read file ${file.path}:`, error);
			}
		}

		return results
			.sort((a, b) => b.relevance - a.relevance)
			.slice(0, this.settings.contextLimit);
	}

	private async performSemanticSearch(query: string, excludeSearchResults: boolean = true, webResults?: WebSearchResult[]): Promise<string> {
		const context = await this.getVaultContent(excludeSearchResults);
		const prompts = getPrompts(this.settings.language);
		const prompt = formatPrompt(prompts.smartSearch, {
			context: context.join('\n\n---\n\n'),
			query,
		});
		return this.aiService.generateResponse(prompt);
	}

	private async performSemanticSearchStream(query: string, onChunk: (chunk: string) => void, excludeSearchResults: boolean = true, webResults?: WebSearchResult[]): Promise<string> {
		const context = await this.getVaultContent(excludeSearchResults);
		const prompts = getPrompts(this.settings.language);
		const prompt = formatPrompt(prompts.smartSearch, {
			context: context.join('\n\n---\n\n'),
			query,
		});
		return this.aiService.generateStreamResponse(prompt, undefined, onChunk);
	}

	private async generateResponseFromFiles(query: string, results: SearchResult[], webResults?: WebSearchResult[]): Promise<string> {
		const context = results.map(result => `# ${result.file.basename}\n${result.content}`);
		const prompts = getPrompts(this.settings.language);
		const prompt = formatPrompt(prompts.smartSearch, {
			context: context.join('\n\n---\n\n'),
			query,
		});
		return this.aiService.generateResponse(prompt);
	}

	private async generateStreamResponseFromFiles(query: string, results: SearchResult[], onChunk: (chunk: string) => void, webResults?: WebSearchResult[]): Promise<string> {
		const context = results.map(result => `# ${result.file.basename}\n${result.content}`);
		const prompts = getPrompts(this.settings.language);
		const prompt = formatPrompt(prompts.smartSearch, {
			context: context.join('\n\n---\n\n'),
			query,
		});
		return this.aiService.generateStreamResponse(prompt, undefined, onChunk);
	}

	private async performBasicAISearch(query: string, excludeSearchResults: boolean = true, webResults?: WebSearchResult[]): Promise<string> {
		const context = await this.getVaultContent(excludeSearchResults);
		const prompts = getPrompts(this.settings.language);
		const prompt = formatPrompt(prompts.quickCommand, {
			query,
		});
		return this.aiService.generateResponse(prompt, context.join('\n\n---\n\n'));
	}

	private async performBasicAISearchStream(query: string, onChunk: (chunk: string) => void, excludeSearchResults: boolean = true, webResults?: WebSearchResult[]): Promise<string> {
		const context = await this.getVaultContent(excludeSearchResults);
		const prompts = getPrompts(this.settings.language);
		const prompt = formatPrompt(prompts.quickCommand, {
			query,
		});
		return this.aiService.generateStreamResponse(prompt, context.join('\n\n---\n\n'), onChunk);
	}

	private async getVaultContent(excludeSearchResults: boolean): Promise<string[]> {
		const files = this.vault.getMarkdownFiles();
		const content: string[] = [];
		
		const filesToProcess = files
			.filter(file => !excludeSearchResults || !file.path.startsWith(this.settings.searchFolderPath + '/'))
			.slice(0, this.settings.contextLimit);
		
		for (const file of filesToProcess) {
			try {
				const fileContent = await this.vault.read(file);
				content.push(`# ${file.name}\n${fileContent}`);
			} catch (error) {
				console.error(`Failed to read file ${file.path}:`, error);
			}
		}
		return content;
	}

	private calculateTextRelevance(text: string, queryWords: string[]): number {
		const lowerText = text.toLowerCase();
		let score = 0;
		
		queryWords.forEach(word => {
			if (word.length < 3) return;
			
			const wordRegex = new RegExp(`\\b${word}\\b`, 'gi');
			const matches = lowerText.match(wordRegex) || [];
			score += matches.length * word.length;
		});
		
		const exactMatch = queryWords.join(' ');
		if (lowerText.includes(exactMatch.toLowerCase())) {
			score += exactMatch.length * 2;
		}
		
		return score;
	}

	private extractRelevantSnippet(text: string, queryWords: string[], maxLength: number = 200): string {
		const sentences = text.split(/[.!?]+/);
		let bestSentence = '';
		let bestScore = 0;

		for (const sentence of sentences) {
			const score = this.calculateTextRelevance(sentence, queryWords);
			if (score > bestScore) {
				bestScore = score;
				bestSentence = sentence.trim();
			}
		}

		return TextUtils.truncateText(bestSentence || text, maxLength);
	}
}