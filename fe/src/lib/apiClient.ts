import { DashboardStats } from "@/types/DashboardStats";
import { Venture } from "@/types/Venture";

// Backend API configuration
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8880";

class ApiClient {
  private baseURL: string;
  private token: string | null = null;
  private isRefreshing = false;
  private refreshSubscribers: Array<() => void> = [];

  constructor(baseURL = `${API_BASE_URL}/api/v1`) {
    this.baseURL = baseURL;
    // HYDRATE TOKEN ON STARTUP
    this.token = localStorage.getItem("vp_token"); 
  }

  // ---------------- Token Management ----------------
  setToken(token: string) {
    this.token = token;
    localStorage.setItem("vp_token", token);
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem("vp_token");
  }

  private subscribeTokenRefresh(cb: () => void) {
    this.refreshSubscribers.push(cb);
  }

  private onRefreshed() {
    this.refreshSubscribers.forEach((cb) => cb());
    this.refreshSubscribers = [];
  }

  private async refreshToken() {
    if (!this.isRefreshing) {
      this.isRefreshing = true;
      try {
        const res = await fetch(`${this.baseURL}/auth/refresh`, {
          method: "POST",
          credentials: "include",
        });
        if (!res.ok) throw new Error("Refresh failed");

        const data = await res.json();
        if (data.token) this.setToken(data.token);

        this.onRefreshed();
      } catch (err) {
        this.clearToken();
        window.location.href = `/auth?from=${encodeURIComponent(
          localStorage.getItem("redirect_after_login") || "/"
        )}`;
      } finally {
        this.isRefreshing = false;
      }
    }
  }

  // ---------------- Request Wrapper ----------------
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = endpoint.startsWith("http")
      ? endpoint
      : `${this.baseURL}${endpoint}`;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    };

    if (this.token) headers.Authorization = `Bearer ${this.token}`;

    let response = await fetch(url, {
      ...options,
      headers,
      credentials: "include",
    });

    if (response.status === 401) {
      // Save the current page before redirecting
      let currentPath = window.location.pathname + window.location.search;
      // If path is root "/", replace with "/projects"
      if (currentPath === "/auth") {
        currentPath = "/";
      }
      localStorage.setItem("redirect_after_login", "/");

      if (url.includes("/auth/me")) {
        // just throw an error — don't refresh or redirect
        throw new Error("Unauthorized");
      }

      // otherwise try refresh flow
      return new Promise((resolve, reject) => {
        this.subscribeTokenRefresh(async () => {
          try {
            const retryResponse = await fetch(url, {
              ...options,
              headers,
              credentials: "include",
            });
            if (!retryResponse.ok) {
              reject(new Error(`API Error: ${retryResponse.status}`));
              return;
            }
            resolve(await retryResponse.json());
          } catch (err) {
            reject(err);
          }
        });
        this.refreshToken();
      });
    }

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  // ---------------- Auth ----------------
  register(email: string, password: string, name: string) {
    return this.request<{ token: string; user: any }>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password, name }),
    });
  }

  login(email: string, password: string) {
    return this.request<{ token: string; user: any }>("/auth/login", {
      method: "POST",
      credentials: "include",
      body: JSON.stringify({ email, password }),
    });
  }

  getMe() {
    return this.request<any>("/auth/me", { method: "GET" });
  }

  logout() {
    return this.request<void>("/auth/logout", { method: "POST" });
  }

  // ---------------- Venture ----------------
  getVentures() {
    return this.request<Venture[]>("/ventures", { method: "GET" });
  }
  
  getDashboardStats() {
    return this.request<DashboardStats>("/dashboard-stats", { method: "GET" });
  }
  
  // ---------------- AI filter agent ----------------
  async queryAgent(msg: string) {
    return this.request<{
      answer: string;
      data: { ventures: Venture[]; venture_ids: string[];  };
    }>('/query', { 
      method: "POST",
      body: JSON.stringify({ msg }),
    });
  }

  clearSession(sessionId: string) {
    return this.request<{
      status: string;
      session_id: string;
    }>('/session/clear', {
      method: "POST",
      body: JSON.stringify({ session_id: sessionId }),
    });
  }

}

export const apiClient = new ApiClient();
export default apiClient;