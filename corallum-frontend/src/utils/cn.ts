import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * 🎯 Утилита для объединения CSS классов
 * Объединяет clsx и tailwind-merge для оптимальной работы с Tailwind CSS
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// 🚀 Дополнительные утилиты для производительности
export const optimizedCn = (...inputs: ClassValue[]) => {
  // Кэширование результатов для частых вызовов
  const cache = new Map<string, string>();
  const key = inputs.join(' ');
  
  if (cache.has(key)) {
    return cache.get(key)!;
  }
  
  const result = twMerge(clsx(inputs));
  cache.set(key, result);
  
  return result;
};

export default cn;
