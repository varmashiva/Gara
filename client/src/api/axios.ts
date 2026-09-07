import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '/api/v1',
  withCredentials: true,
});

let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

let refreshPromise: Promise<string | null> | null = null;

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    // The refresh call itself goes through this same instance — if it 401s,
    // it must never re-enter this retry logic (it would end up awaiting the
    // very refreshPromise it's a part of and deadlock forever).
    const isRefreshCall = originalRequest?.url?.includes('/auth/refresh');

    if (error.response?.status === 401 && !originalRequest._retry && !isRefreshCall) {
      originalRequest._retry = true;
      try {
        if (!refreshPromise) {
          refreshPromise = api
            .post('/auth/refresh')
            .then((res) => {
              const token = res.data.data.accessToken as string;
              setAccessToken(token);
              return token;
            })
            .catch(() => {
              setAccessToken(null);
              return null;
            })
            .finally(() => {
              refreshPromise = null;
            });
        }
        const newToken = await refreshPromise;
        if (newToken) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return api(originalRequest);
        }
      } catch {
        // fall through to reject below
      }
    }
    return Promise.reject(error);
  }
);
