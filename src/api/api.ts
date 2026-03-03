import properties from '../config/properties';
import { getToken } from '../auth/auth-service';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

interface RequestOptions {
  method: HttpMethod;
  headers?: { [key: string]: string };
  body?: string;
  credentials?: RequestCredentials;
}

const statusError = (status: number): Error => new Error(`HTTP error! status: ${status}`);

export async function get<T>(path: string): Promise<T> {
  const { restBaseUrl } = properties();
  const requestOptions: RequestOptions = getRequestOptions('GET');

  const response = await fetch(restBaseUrl + path, requestOptions);

  if (!response.ok) {
    throw statusError(response.status);
  }

  const data = await response.json();

  return data;
}

export async function post<T>(path: string, data: T): Promise<T> {
  const { restBaseUrl } = properties();
  const requestOptions: RequestOptions = getRequestOptions('POST', data);

  const response = await fetch(restBaseUrl + path, requestOptions);

  if (!response.ok) {
    throw statusError(response.status);
  }

  return await response.json();
}

export async function put<T>(path: string, data: T): Promise<T> {
  const { restBaseUrl } = properties();
  const requestOptions: RequestOptions = getRequestOptions('PUT', data);

  const response = await fetch(restBaseUrl + path, requestOptions);

  if (!response.ok) {
    throw statusError(response.status);
  }

  return await response.json();
}

function getRequestOptions<T>(httpMethod: HttpMethod, data?: T): RequestOptions {
  const headers: { [key: string]: string } = {
    'Content-Type': 'application/json',
    Accept: 'application/json'
  };

  const token = getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return {
    method: httpMethod,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: 'include'
  };
}
