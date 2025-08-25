const API_BASE_URL = 'http://localhost:7000/api';

const getHeaders = (isFileUpload = false) => {
  const token = localStorage.getItem('access_token');
  const headers: HeadersInit = {};
  if (!isFileUpload) {
    headers['Content-Type'] = 'application/json';
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

export const login = async (credentials: { username: string; password: string }) => {
  console.log('api: Sending login request', credentials);
  const response = await fetch(`${API_BASE_URL}/token/`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(credentials),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error('api: Login failed:', response.status, errorData);
    throw new Error(errorData.detail || 'Login failed');
  }
  const data = await response.json();
  localStorage.setItem('access_token', data.access);
  localStorage.setItem('refresh_token', data.refresh);
  console.log('api: Login successful, tokens stored');
  return data;
};

export const refreshToken = async () => {
  const refresh = localStorage.getItem('refresh_token');
  if (!refresh) {
    console.error('api: No refresh token available');
    throw new Error('No refresh token available');
  }
  console.log('api: Sending refresh token request');
  const response = await fetch(`${API_BASE_URL}/token/refresh/`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ refresh }),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error('api: Token refresh failed:', response.status, errorData);
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    throw new Error('Token refresh failed');
  }
  const data = await response.json();
  localStorage.setItem('access_token', data.access);
  console.log('api: Token refreshed successfully');
  return data;
};

const fetchWithAuth = async (url: string, options: RequestInit) => {
  try {
    console.log(`fetchWithAuth: Requesting ${url}`);
    const response = await fetch(url, options);
    if (response.status === 401) {
      console.log('fetchWithAuth: 401 received, attempting token refresh');
      await refreshToken();
      const newOptions = {
        ...options,
        headers: getHeaders(options.body instanceof FormData),
      };
      const retryResponse = await fetch(url, newOptions);
      if (!retryResponse.ok) {
        const errorData = await retryResponse.json().catch(() => ({}));
        console.error('fetchWithAuth: Retry failed:', retryResponse.status, errorData);
        throw new Error(errorData.detail || 'Request failed after retry');
      }
      return retryResponse;
    }
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('fetchWithAuth: Request failed:', response.status, errorData);
      throw new Error(errorData.detail || 'Request failed');
    }
    return response;
  } catch (error: any) {
    console.error('fetchWithAuth error:', error.message);
    throw error;
  }
};

export const getFiles = async () => {
  const response = await fetchWithAuth(`${API_BASE_URL}/files/`, {
    method: 'GET',
    headers: getHeaders(),
  });
  return response.json();
};

export const getTrashFiles = async () => {
  const response = await fetchWithAuth(`${API_BASE_URL}/files/trash/`, {
    method: 'GET',
    headers: getHeaders(),
  });
  return response.json();
};

export const uploadFile = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('name', file.name);
  const response = await fetchWithAuth(`${API_BASE_URL}/files/`, {
    method: 'POST',
    headers: getHeaders(true), // Skip Content-Type for FormData
    body: formData,
  });
  return response.json();
};

export const previewFile = async (id: string) => {
  const response = await fetchWithAuth(`${API_BASE_URL}/files/${id}/preview/`, {
    method: 'GET',
    headers: getHeaders(),
  });
  return response.json();
};

export const downloadFile = async (id: string) => {
  const response = await fetchWithAuth(`${API_BASE_URL}/files/${id}/download/`, {
    method: 'GET',
    headers: getHeaders(),
  });
  return response.blob();
};

export const deleteFile = async (id: string) => {
  const response = await fetchWithAuth(`${API_BASE_URL}/files/${id}/`, {
    method: 'PATCH',
    headers: getHeaders(),
    body: JSON.stringify({ is_deleted: true }),
  });
  return response.json();
};

export const restoreFile = async (id: string) => {
  const response = await fetchWithAuth(`${API_BASE_URL}/files/${id}/restore/`, {
    method: 'PATCH',
    headers: getHeaders(),
  });
  return response.json();
};


export const permanentDeleteFile = async (id: string) => {
  const response = await fetchWithAuth(`${API_BASE_URL}/files/${id}/permanent_delete/`, {
    method: 'DELETE',
    headers: getHeaders(),
  });
  return response.json();
};

export const emptyTrash = async () => {
  const response = await fetchWithAuth(`${API_BASE_URL}/files/empty_trash/`, {
    method: 'DELETE',
    headers: getHeaders(),
  });
  return response.json();
};
