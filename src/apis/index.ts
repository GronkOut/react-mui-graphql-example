export interface FetchError extends Error {
  status?: number;
  data?: unknown;
}

export async function fetchApi<T>(url: string, options?: RequestInit): Promise<T> {
  const { body, headers, ...restOptions } = options ?? {};
  const isFormData = typeof body === 'object' && body instanceof FormData;
  const response = await fetch(url, { ...restOptions, body, headers: isFormData ? undefined : headers });

  if (!response.ok) {
    let errorData: unknown;

    try {
      errorData = await response.json();
    } catch {
      errorData = { message: response.statusText || 'API 요청에 실패했습니다.' };
    }

    const message = typeof errorData === 'object' && errorData !== null && 'message' in errorData && typeof errorData.message === 'string' ? errorData.message : `HTTP error! status: ${response.status}`;
    const error = new Error(message) as FetchError;

    error.status = response.status;
    error.data = errorData;

    if (response.status === 401) {
      // 인증 실패
      window.location.href = '/intro';
    } else if (response.status === 403) {
      // 권한 없음
      window.location.href = '/forbidden';
    }

    throw error;
  }

  if (response.status === 204 || response.headers.get('content-length') === '0') {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}
