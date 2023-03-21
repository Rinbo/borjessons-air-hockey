import properties from '../config/properties';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

interface RequestOptions {
  method: HttpMethod;
  headers?: { [key: string]: string };
  body?: string;
}

export async function post<T>(path: string, data: T): Promise<T> {
  const { restBaseUrl } = properties();
  const requestOptions: RequestOptions = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  };

  const response = await fetch(restBaseUrl + path, requestOptions);

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return await response.json();
}
