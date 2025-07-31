/**
 * Утилиты для плагина Google AI Smart Search
 */

export class TextUtils {
    /**
     * Обрезает текст до указанной длины, сохраняя целостность слов
     */
    static truncateText(text: string, maxLength: number): string {
        if (text.length <= maxLength) {
            return text;
        }
        
        const truncated = text.substring(0, maxLength);
        const lastSpace = truncated.lastIndexOf(' ');
        
        if (lastSpace > 0) {
            return truncated.substring(0, lastSpace) + '...';
        }
        
        return truncated + '...';
    }

    /**
     * Подсчитывает приблизительное количество токенов в тексте
     */
    static estimateTokens(text: string): number {
        // Приблизительная оценка: 1 токен ≈ 4 символа для английского текста
        // Для русского текста коэффициент может быть выше
        const avgCharsPerToken = 3.5;
        return Math.ceil(text.length / avgCharsPerToken);
    }

    /**
     * Очищает текст от лишних символов для лучшего поиска
     */
    static cleanTextForSearch(text: string): string {
        return text
            .replace(/\[{2}([^\]]+)\]{2}/g, '$1') // Убираем двойные квадратные скобки Obsidian
            .replace(/#{1,6}\s+/g, '') // Убираем заголовки markdown
            .replace(/\*{1,2}([^*]+)\*{1,2}/g, '$1') // Убираем выделение
            .replace(/`([^`]+)`/g, '$1') // Убираем инлайн код
            .replace(/```[\s\S]*?```/g, '') // Убираем блоки кода
            .replace(/\n{3,}/g, '\n\n') // Убираем лишние переносы строк
            .trim();
    }

    /**
     * Извлекает ключевые слова из текста
     */
    static extractKeywords(text: string, maxKeywords: number = 10): string[] {
        const stopWords = new Set([
            'и', 'в', 'на', 'с', 'по', 'для', 'не', 'от', 'до', 'при', 'за', 'под', 'над',
            'что', 'это', 'как', 'где', 'когда', 'почему', 'который', 'которая', 'которое',
            'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
            'by', 'from', 'up', 'about', 'into', 'through', 'during', 'before', 'after',
            'above', 'below', 'between', 'among', 'under', 'over', 'is', 'are', 'was', 'were',
            'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
            'could', 'should', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those'
        ]);

        const words = text
            .toLowerCase()
            .replace(/[^\w\s]/g, ' ')
            .split(/\s+/)
            .filter(word => word.length > 2 && !stopWords.has(word));

        const wordCount = new Map<string, number>();
        words.forEach(word => {
            wordCount.set(word, (wordCount.get(word) || 0) + 1);
        });

        return Array.from(wordCount.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, maxKeywords)
            .map(([word]) => word);
    }
}

export class FileUtils {
    /**
     * Проверяет, является ли файл подходящим для поиска
     */
    static isSearchableFile(fileName: string): boolean {
        const searchableExtensions = ['.md', '.txt', '.json'];
        return searchableExtensions.some(ext => fileName.toLowerCase().endsWith(ext));
    }

    /**
     * Получает относительный путь файла
     */
    static getRelativePath(fullPath: string, basePath: string): string {
        if (fullPath.startsWith(basePath)) {
            return fullPath.substring(basePath.length + 1);
        }
        return fullPath;
    }

    /**
     * Создает безопасное имя файла
     */
    static createSafeFileName(name: string): string {
        return name
            .replace(/[/\\?%*:|"<>]/g, '-')
            .replace(/\s+/g, ' ')
            .trim()
            .substring(0, 100);
    }
}

export class DateUtils {
    /**
     * Форматирует дату для имени файла
     */
    static formatDateForFileName(): string {
        const now = new Date();
        return now.toISOString()
            .replace(/[:.]/g, '-')
            .substring(0, 19);
    }

    /**
     * Форматирует дату для отображения
     */
    static formatDateForDisplay(): string {
        return new Date().toLocaleString('ru-RU', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
}

export class APIUtils {
    /**
     * Обрабатывает ошибки API
     */
    static handleAPIError(error: any): string {
        if (error.message?.includes('API_KEY_INVALID')) {
            return 'Неверный API ключ. Проверьте ключ в настройках плагина.';
        }
        
        if (error.message?.includes('QUOTA_EXCEEDED')) {
            return 'Превышен лимит API. Проверьте квоты в Google AI Console.';
        }
        
        if (error.message?.includes('MODEL_NOT_FOUND')) {
            return 'Модель не найдена. Проверьте название модели в настройках.';
        }
        
        if (error.message?.includes('RATE_LIMIT_EXCEEDED')) {
            return 'Превышен лимит запросов. Попробуйте позже.';
        }
        
        if (error.message?.includes('SAFETY')) {
            return 'Запрос заблокирован системой безопасности. Попробуйте перефразировать.';
        }
        
        return `Ошибка API: ${error.message || 'Неизвестная ошибка'}`;
    }

    /**
     * Проверяет валидность API ключа
     */
    static isValidAPIKey(apiKey: string): boolean {
        return !!(apiKey && 
               apiKey.length > 10 && 
               apiKey.startsWith('AIza') &&
               /^[A-Za-z0-9_-]+$/.test(apiKey));
    }
}

export class SearchUtils {
    /**
     * Создает поисковый промпт с контекстом
     */
    static createSearchPrompt(query: string, context: string[], includeInstructions: boolean = true): string {
        const contextText = context.join('\n\n---\n\n');
        
        let prompt = '';
        
        if (includeInstructions) {
            prompt += `Ты - помощник для интеллектуального поиска информации. На основе предоставленного контекста дай подробный и точный ответ на вопрос пользователя.

`;
        }
        
        if (contextText) {
            prompt += `КОНТЕКСТ:\n${contextText}\n\n`;
        }
        
        prompt += `ВОПРОС: ${query}\n\n`;
        
        if (includeInstructions) {
            prompt += `Пожалуйста, ответь на вопрос, используя информацию из контекста. Если информации недостаточно, укажи, что дополнительно может быть полезно.`;
        }
        
        return prompt;
    }

    /**
     * Ранжирует файлы по релевантности
     */
    static rankFilesByRelevance(files: string[], query: string): string[] {
        const queryWords = query.toLowerCase().split(/\s+/);
        
        return files
            .map(file => ({
                file,
                score: this.calculateRelevanceScore(file, queryWords)
            }))
            .sort((a, b) => b.score - a.score)
            .map(item => item.file);
    }

    private static calculateRelevanceScore(text: string, queryWords: string[]): number {
        const lowerText = text.toLowerCase();
        let score = 0;
        
        queryWords.forEach(word => {
            const wordCount = (lowerText.match(new RegExp(word, 'g')) || []).length;
            score += wordCount;
        });
        
        return score;
    }
}

export class ConfigUtils {
    /**
     * Валидирует настройки плагина
     */
    static validateSettings(settings: any): string[] {
        const errors: string[] = [];
        
        if (!settings.apiKey) {
            errors.push('API ключ не задан');
        } else if (!APIUtils.isValidAPIKey(settings.apiKey)) {
            errors.push('Неверный формат API ключа');
        }
        
        if (settings.temperature < 0 || settings.temperature > 1) {
            errors.push('Температура должна быть между 0 и 1');
        }
        
        if (settings.maxTokens < 1 || settings.maxTokens > 4000) {
            errors.push('Количество токенов должно быть между 1 и 4000');
        }
        
        if (settings.contextLimit < 1 || settings.contextLimit > 50) {
            errors.push('Лимит контекста должен быть между 1 и 50');
        }
        
        return errors;
    }
}
