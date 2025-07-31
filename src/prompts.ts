export interface PromptTemplates {
	smartSearch: string;
	semanticSearch: string;
	contentAnalysis: string;
	queryExpansion: string;
	webSearch: string;
	codeExecution: string;
}

export const PROMPTS_EN: PromptTemplates = {
	smartSearch: `You are an intelligent search assistant for Obsidian notes. Analyze the provided context and user query to provide relevant and accurate answers.

Context: {context}

User Query: {query}

Instructions:
1. Focus on information from the provided context (user's notes)
2. If using web search results, clearly indicate external sources
3. Provide specific file references in Obsidian format [[filename]] where information was found
4. Structure your response clearly with headings and bullet points
5. If code execution results are available, integrate them naturally
6. IMPORTANT: All file links must be in [[filename]] or [[filename.md]] format, NOT [filename] or other formats

Please provide a comprehensive answer based on the available information.`,

	semanticSearch: `Analyze this query and generate related search terms, synonyms, and alternative phrasings that might help find relevant content:

Query: {query}

Generate:
1. Direct synonyms
2. Related terms and concepts
3. Alternative phrasings in both English and Russian
4. Technical terms if applicable
5. Broader and narrower concepts

Format as a comma-separated list of search terms.`,

	contentAnalysis: `Analyze the following content and extract key information relevant to the user's query:

Content: {content}
Query: {query}

Extract:
1. Main concepts and themes
2. Specific facts and data
3. Relationships between ideas
4. Relevant quotes or excerpts
5. Key file references

Provide a structured summary highlighting the most relevant information.`,

	queryExpansion: `You are a query expansion specialist. Given a user query, generate expanded search terms and related concepts:

Original Query: {query}

Generate:
1. Synonyms and alternative terms
2. Related concepts and themes
3. Technical terminology
4. Broader and narrower topics
5. Common misspellings or variations

Return as JSON: {"terms": ["term1", "term2", ...], "concepts": ["concept1", "concept2", ...]}`,

	webSearch: `You have access to web search results. Integrate this external information with the user's local notes to provide a comprehensive answer:

Local Context: {context}
Web Results: {webResults}
User Query: {query}

Instructions:
1. Prioritize information from local notes when available
2. Use web results to supplement and enhance the answer
3. Clearly distinguish between local and web sources
4. Provide citations for web sources
5. Maintain accuracy and relevance

Provide a well-structured answer combining both sources.`,

	codeExecution: `You have access to code execution capabilities. The following code was executed:

Code: {code}
Results: {results}
User Query: {query}

Instructions:
1. Interpret the code execution results in context of the user's query
2. Explain any calculations, data processing, or analysis performed
3. Highlight key findings or insights from the results
4. Suggest further analysis if relevant
5. Integrate with any available local content

Provide a comprehensive analysis of the results.`
};

export const PROMPTS_RU: PromptTemplates = {
	smartSearch: `Вы - интеллектуальный помощник поиска для заметок Obsidian. Проанализируйте предоставленный контекст и запрос пользователя, чтобы дать релевантные и точные ответы.

Контекст: {context}

Запрос пользователя: {query}

Инструкции:
1. Сосредоточьтесь на информации из предоставленного контекста (заметки пользователя)
2. Если используете результаты веб-поиска, четко указывайте внешние источники
3. Предоставляйте конкретные ссылки на файлы в формате [[название файла]] для Obsidian
4. Структурируйте ответ четко с заголовками и маркерами
5. Если доступны результаты выполнения кода, интегрируйте их естественно
6. ВАЖНО: Все ссылки на файлы должны быть в формате [[filename]] или [[filename.md]], НЕ используйте [filename] или другие форматы

Пожалуйста, предоставьте исчерпывающий ответ на основе доступной информации.`,

	semanticSearch: `Проанализируйте этот запрос и сгенерируйте связанные поисковые термины, синонимы и альтернативные формулировки:

Запрос: {query}

Сгенерируйте:
1. Прямые синонимы
2. Связанные термины и концепции
3. Альтернативные формулировки на русском и английском
4. Технические термины, если применимо
5. Более широкие и узкие концепции

Оформите как список поисковых терминов через запятую.`,

	contentAnalysis: `Проанализируйте следующий контент и извлеките ключевую информацию, относящуюся к запросу пользователя:

Контент: {content}
Запрос: {query}

Извлеките:
1. Основные концепции и темы
2. Конкретные факты и данные
3. Связи между идеями
4. Релевантные цитаты или отрывки
5. Ключевые ссылки на файлы

Предоставьте структурированное резюме, выделяющее наиболее релевантную информацию.`,

	queryExpansion: `Вы специалист по расширению запросов. Для данного пользовательского запроса сгенерируйте расширенные поисковые термины:

Исходный запрос: {query}

Сгенерируйте:
1. Синонимы и альтернативные термины
2. Связанные концепции и темы
3. Техническую терминологию
4. Более широкие и узкие темы
5. Распространенные опечатки или вариации

Верните как JSON: {"terms": ["термин1", "термин2", ...], "concepts": ["концепция1", "концепция2", ...]}`,

	webSearch: `У вас есть доступ к результатам веб-поиска. Интегрируйте эту внешнюю информацию с локальными заметками пользователя:

Локальный контекст: {context}
Веб-результаты: {webResults}
Запрос пользователя: {query}

Инструкции:
1. Приоритизируйте информацию из локальных заметок, когда доступна
2. Используйте веб-результаты для дополнения и улучшения ответа
3. Четко различайте локальные и веб-источники
4. Предоставляйте цитаты для веб-источников
5. Поддерживайте точность и релевантность

Предоставьте хорошо структурированный ответ, объединяющий оба источника.`,

	codeExecution: `У вас есть доступ к возможностям выполнения кода. Следующий код был выполнен:

Код: {code}
Результаты: {results}
Запрос пользователя: {query}

Инструкции:
1. Интерпретируйте результаты выполнения кода в контексте запроса пользователя
2. Объясните любые вычисления, обработку данных или анализ
3. Выделите ключевые находки или инсайты из результатов
4. Предложите дальнейший анализ, если релевантно
5. Интегрируйте с любым доступным локальным контентом

Предоставьте исчерпывающий анализ результатов.`
};

export function getPrompts(language: 'en' | 'ru' = 'ru'): PromptTemplates {
	return language === 'en' ? PROMPTS_EN : PROMPTS_RU;
}

export function formatPrompt(template: string, variables: Record<string, string>): string {
	let formatted = template;
	for (const [key, value] of Object.entries(variables)) {
		formatted = formatted.replace(new RegExp(`{${key}}`, 'g'), value);
	}
	return formatted;
}
