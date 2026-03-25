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

export function cleanNestedArrays(obj: any): any {
  if (Array.isArray(obj)) {
    // First, recursively clean all items in the array
    const cleanedArray = obj.map(item => cleanNestedArrays(item));

    // Then check if the cleaned array still contains arrays
    if (cleanedArray.some(item => Array.isArray(item))) {
      return cleanedArray.map(item => {
        if (Array.isArray(item)) {
          // If empty array, remove it
          if (item.length === 0) return null;
          // If single item array, extract the item
          if (item.length === 1) return item[0];
          // Otherwise stringify
          return JSON.stringify(item);
        }
        return item;
      }).filter(item => item !== null); // Remove nulls
    }
    return cleanedArray;
  }

  if (obj && typeof obj === 'object') {
    const result: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        result[key] = cleanNestedArrays(obj[key]);
      }
    }
    return result;
  }

  return obj;
}
