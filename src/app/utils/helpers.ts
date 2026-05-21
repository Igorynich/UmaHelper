export function findNestedArraysContainingArrays(obj: any, path: string = ''): Array<{path: string, value: any[]}> {
  const results: Array<{path: string, value: any[]}> = [];

  if (Array.isArray(obj)) {
    // Check if this array contains any other arrays
    if (obj.some(item => Array.isArray(item))) {
      results.push({ path: path || 'root', value: obj });
    }
  }

  if (obj && typeof obj === 'object') {
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const currentPath = path ? `${path}.${key}` : key;
        results.push(...findNestedArraysContainingArrays(obj[key], currentPath));
      }
    }
  }

  return results;
}

/**
 * Стрингифицирует вложенные массивы только для указанных ключей.
 * Если keyWhitelist не передан, работает по старой логике (проверяет все).
 */
export function cleanNestedArrays(obj: any, keyWhitelist?: string[]): any {
  if (Array.isArray(obj)) {
    const cleanedArray = obj.map(item => cleanNestedArrays(item, keyWhitelist));

    if (cleanedArray.some(item => Array.isArray(item))) {
      return cleanedArray.map(item => {
        if (Array.isArray(item)) {
          if (item.length === 0) return null;
          if (item.length === 1) return item[0];
          return JSON.stringify(item);
        }
        return item;
      }).filter(item => item !== null);
    }
    return cleanedArray;
  }

  if (obj && typeof obj === 'object') {
    const result: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        // Если есть whitelist и ключ в него не входит — копируем как есть (но рекурсивно проверяем вложенность)
        if (keyWhitelist && !keyWhitelist.includes(key)) {
          result[key] = obj[key];
        } else {
          result[key] = cleanNestedArrays(obj[key], keyWhitelist);
        }
      }
    }
    return result;
  }

  return obj;
}

/**
 * Рекурсивно восстанавливает вложенные структуры только для указанных ключей.
 */
export function restoreNestedArrays(obj: any, keyWhitelist?: string[]): any {
  if (obj === null || typeof obj !== 'object') {
    // Вне контекста объекта (например, элемент массива), парсим только если это JSON
    if (typeof obj === 'string' && (obj.startsWith('[') || obj.startsWith('{'))) {
      try {
        const parsed = JSON.parse(obj);
        return restoreNestedArrays(parsed, keyWhitelist);
      } catch (e) {
        return obj;
      }
    }
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => restoreNestedArrays(item, keyWhitelist));
  }

  const restored: any = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = obj[key];

      // Парсим только если ключ в белом списке ИЛИ если whitelist не задан
      const shouldParse = !keyWhitelist || keyWhitelist.includes(key);

      if (shouldParse && typeof value === 'string' && (value.startsWith('[') || value.startsWith('{'))) {
        try {
          const parsed = JSON.parse(value);
          restored[key] = restoreNestedArrays(parsed, keyWhitelist);
        } catch (e) {
          restored[key] = value;
        }
      } else if (typeof value === 'object') {
        restored[key] = restoreNestedArrays(value, keyWhitelist);
      } else {
        restored[key] = value;
      }
    }
  }
  return restored;
}
