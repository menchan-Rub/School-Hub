import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

export interface ApiError {
  message: string;
  code: string;
  status: number;
}

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: 'http://localhost:3000/api',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          window.location.href = '/login';
        }
        return Promise.reject(this.handleError(error));
      }
    );
  }

  private handleError(error: any): ApiError {
    if (axios.isAxiosError(error)) {
      return {
        message: error.response?.data?.message || error.message,
        code: error.response?.data?.code || 'UNKNOWN_ERROR',
        status: error.response?.status || 500,
      };
    }
    return {
      message: error.message || 'An unknown error occurred',
      code: 'UNKNOWN_ERROR',
      status: 500,
    };
  }

  async request<T>(config: AxiosRequestConfig): Promise<T> {
    try {
      const response = await this.client.request<T>(config);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async get<T>(url: string, config?: Omit<AxiosRequestConfig, 'method' | 'url'>): Promise<T> {
    return this.request<T>({ ...config, method: 'GET', url });
  }

  async post<T>(url: string, data?: any, config?: Omit<AxiosRequestConfig, 'method' | 'url' | 'data'>): Promise<T> {
    return this.request<T>({ ...config, method: 'POST', url, data });
  }

  async put<T>(url: string, data?: any, config?: Omit<AxiosRequestConfig, 'method' | 'url' | 'data'>): Promise<T> {
    return this.request<T>({ ...config, method: 'PUT', url, data });
  }

  async delete<T>(url: string, config?: Omit<AxiosRequestConfig, 'method' | 'url'>): Promise<T> {
    return this.request<T>({ ...config, method: 'DELETE', url });
  }
}

export const api = new ApiClient(); 