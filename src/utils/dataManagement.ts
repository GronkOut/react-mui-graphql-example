import type { Node } from '@/types/treeView';

// 문자열 JSON 데이터를 Node 배열로 파싱
export function parseTemplateData(dataString: string | null | undefined): Node[] {
  if (!dataString) return [];

  try {
    const parsedData = JSON.parse(dataString);

    if (Array.isArray(parsedData)) {
      return parsedData as Node[];
    } else {
      console.error('파싱된 데이터가 배열이 아닙니다.');

      return [];
    }
  } catch (error) {
    console.error('JSON 파싱 실패', error);

    return [];
  }
}

// __typename 제거
export function removeTypename<T>(obj: T): T {
  if (Array.isArray(obj)) return obj.map(removeTypename) as T;

  if (obj && typeof obj === 'object') {
    const result = {} as Record<string, unknown>;

    for (const key in obj) {
      if (key !== '__typename') {
        const typedObj = obj as Record<string, unknown>;

        result[key] = removeTypename(typedObj[key]);
      }
    }

    return result as T;
  }

  return obj;
}
