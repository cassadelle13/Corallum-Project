import { useState, useEffect, useMemo, useCallback } from 'react';

interface SearchItem {
  id: string;
  title: string;
  description?: string;
  type?: string;
  tags?: string[];
  [key: string]: any;
}

interface SearchOptions {
  fields: string[];
  threshold?: number;
  includeScore?: boolean;
  keys?: string[];
}

/**
 * 🔍 Оптимизированный поиск с индексацией и debounce
 */
export const useOptimizedSearch = <T extends SearchItem>(
  items: T[],
  options: SearchOptions = { fields: ['title', 'description'] }
) => {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  
  // 🚀 Создаем поисковый индекс для быстрого доступа
  const searchIndex = useMemo(() => {
    const index = new Map<string, T[]>();
    
    items.forEach(item => {
      // Индекс по первым буквам
      options.fields.forEach(field => {
        const value = String(item[field] || '').toLowerCase();
        for (let i = 0; i < Math.min(3, value.length); i++) {
          const key = value.substring(0, i + 1);
          if (!index.has(key)) {
            index.set(key, []);
          }
          index.get(key)!.push(item);
        }
      });
      
      // Индекс по тегам
      if (item.tags) {
        item.tags.forEach(tag => {
          const key = tag.toLowerCase();
          if (!index.has(key)) {
            index.set(key, []);
          }
          index.get(key)!.push(item);
        });
      }
    });
    
    return index;
  }, [items, options.fields]);

  // 🎯 Функция поиска с оптимизацией
  const search = useCallback((searchQuery: string): T[] => {
    if (!searchQuery.trim()) {
      return items;
    }

    const query = searchQuery.toLowerCase().trim();
    const results = new Set<T>();
    
    // Быстрый поиск по индексу
    for (let i = 0; i < Math.min(query.length, 3); i++) {
      const key = query.substring(0, i + 1);
      const indexedItems = searchIndex.get(key) || [];
      indexedItems.forEach(item => results.add(item));
    }
    
    // Точная фильтрация результатов
    return Array.from(results).filter(item => {
      return options.fields.some(field => {
        const value = String(item[field] || '').toLowerCase();
        return value.includes(query);
      }) || item.tags?.some(tag => 
        tag.toLowerCase().includes(query)
      );
    });
  }, [items, searchIndex, options.fields]);

  // ⚡ Debounced поиск
  const debouncedResults = useMemo(() => {
    setIsSearching(true);
    
    // Эмуляция задержки для UI
    const timer = setTimeout(() => {
      setIsSearching(false);
    }, 100);
    
    const results = search(query);
    
    return () => {
      clearTimeout(timer);
      return results;
    };
  }, [query, search]);

  const results = debouncedResults();

  // 📊 Статистика поиска
  const stats = useMemo(() => ({
    total: items.length,
    results: results.length,
    query: query,
    isSearching
  }), [items.length, results.length, query, isSearching]);

  return {
    query,
    setQuery,
    results,
    isSearching,
    stats,
    // 🚀 Дополнительные методы
    clearSearch: () => setQuery(''),
    hasResults: results.length > 0,
    isEmpty: query.length === 0
  };
};

/**
 * 🎯 Fuzzy поиск для более точных результатов
 */
export const useFuzzySearch = <T extends SearchItem>(
  items: T[],
  options: SearchOptions = { fields: ['title', 'description'], threshold: 0.6 }
) => {
  const [query, setQuery] = useState('');
  
  const results = useMemo(() => {
    if (!query.trim()) {
      return items;
    }

    const queryLower = query.toLowerCase();
    const threshold = options.threshold || 0.6;
    
    return items
      .map(item => {
        let score = 0;
        let matches = 0;
        
        options.fields.forEach(field => {
          const value = String(item[field] || '').toLowerCase();
          
          // Точное совпадение
          if (value === queryLower) {
            score += 1;
            matches++;
          }
          // Начинается с query
          else if (value.startsWith(queryLower)) {
            score += 0.8;
            matches++;
          }
          // Содержит query
          else if (value.includes(queryLower)) {
            score += 0.6;
            matches++;
          }
          // Частичное совпадение
          else {
            const similarity = calculateSimilarity(queryLower, value);
            if (similarity >= threshold) {
              score += similarity;
              matches++;
            }
          }
        });
        
        // Проверяем теги
        if (item.tags) {
          item.tags.forEach(tag => {
            if (tag.toLowerCase().includes(queryLower)) {
              score += 0.4;
              matches++;
            }
          });
        }
        
        return {
          item,
          score: score / Math.max(matches, 1),
          matches
        };
      })
      .filter(result => result.score >= threshold)
      .sort((a, b) => b.score - a.score)
      .map(result => result.item);
  }, [items, query, options]);

  return {
    query,
    setQuery,
    results,
    hasResults: results.length > 0,
    clearSearch: () => setQuery('')
  };
};

/**
 * 🔧 Вспомогательная функция для расчета схожести строк
 */
function calculateSimilarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) {
    return 1.0;
  }
  
  const editDistance = levenshteinDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

function levenshteinDistance(str1: string, str2: string): number {
  const matrix = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
}

export default useOptimizedSearch;
