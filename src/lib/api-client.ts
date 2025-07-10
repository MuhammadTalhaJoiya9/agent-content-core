// API Client for backend communication
// Backend URL: Your Node.js server (update this URL when you deploy your backend)
const API_BASE_URL = 'http://localhost:3001/api'; // Update this to your backend URL

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  avatar_url?: string;
  subscription_plan: 'free' | 'pro' | 'enterprise';
  subscription_status: 'active' | 'cancelled' | 'expired';
  subscription_expires_at?: string;
}

export interface Project {
  id: string;
  workspace_id: string;
  title: string;
  content_type: 'article' | 'social_post' | 'video_script' | 'email' | 'seo_content';
  content: string;
  word_count: number;
  status: 'draft' | 'in_progress' | 'completed';
  metadata?: any;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Workspace {
  id: string;
  name: string;
  owner_id: string;
  plan_type: 'personal' | 'team' | 'enterprise';
  created_at: string;
  updated_at: string;
}

export interface UsageStats {
  words_generated: number;
  words_limit: number;
  image_tokens: number;
  image_limit: number;
  video_minutes: number;
  video_limit: number;
}

class APIClient {
  private baseURL = API_BASE_URL;
  private token: string | null = null;

  constructor() {
    // Load token from localStorage on init
    this.token = localStorage.getItem('auth_token');
  }

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('auth_token', token);
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('auth_token');
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(this.token && { Authorization: `Bearer ${this.token}` }),
      ...options.headers,
    };

    try {
      const response = await fetch(url, { ...options, headers });
      
      if (!response.ok) {
        if (response.status === 401) {
          this.clearToken();
          window.location.href = '/login';
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `API Error: ${response.statusText}`);
      }
      
      return response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Authentication
  async login(email: string, password: string) {
    const response = await this.request<{ token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.setToken(response.token);
    return response;
  }

  async register(data: { email: string; password: string; first_name: string; last_name: string }) {
    const response = await this.request<{ token: string; user: User }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    this.setToken(response.token);
    return response;
  }

  async logout() {
    await this.request('/auth/logout', { method: 'POST' });
    this.clearToken();
  }

  async getCurrentUser(): Promise<User> {
    return this.request<User>('/auth/me');
  }

  // Projects
  async getProjects(workspaceId?: string): Promise<Project[]> {
    const query = workspaceId ? `?workspace=${workspaceId}` : '';
    return this.request<Project[]>(`/projects${query}`);
  }

  async getProject(id: string): Promise<Project> {
    return this.request<Project>(`/projects/${id}`);
  }

  async createProject(data: Partial<Project>): Promise<Project> {
    return this.request<Project>('/projects', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateProject(id: string, data: Partial<Project>): Promise<Project> {
    return this.request<Project>(`/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteProject(id: string): Promise<void> {
    return this.request<void>(`/projects/${id}`, { method: 'DELETE' });
  }

  // Workspaces
  async getWorkspaces(): Promise<Workspace[]> {
    return this.request<Workspace[]>('/workspaces');
  }

  async createWorkspace(data: { name: string; plan_type: string }): Promise<Workspace> {
    return this.request<Workspace>('/workspaces', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Usage & Analytics
  async getUsageStats(): Promise<UsageStats> {
    return this.request<UsageStats>('/usage/current');
  }

  async logUsage(data: { resource_type: string; amount_used: number; project_id?: string }) {
    return this.request('/usage/log', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Content Generation (will be connected to AI later)
  async generateContent(data: { 
    type: string; 
    prompt: string; 
    project_id?: string;
    params?: any;
  }) {
    return this.request('/content/generate-text', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async generateImage(data: { 
    prompt: string; 
    style?: string;
    project_id?: string;
  }) {
    return this.request('/content/generate-image', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
}

export const apiClient = new APIClient();