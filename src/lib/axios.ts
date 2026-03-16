// lib/axios.ts
import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

type RetryConfig = InternalAxiosRequestConfig & { _retry?: boolean };

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
});

/** Attach access token automatically */
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers = config.headers ?? {};
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

/** Refresh token helper */
async function refreshAccessToken() {
  const refreshToken =
    typeof window !== "undefined" ? localStorage.getItem("refreshToken") : null;

  if (!refreshToken) throw new Error("No refresh token");

  const res = await axios.post(
    `${process.env.NEXT_PUBLIC_API_URL}/auth/refresh-token`,
    { refreshToken },
    { headers: { "Content-Type": "application/json" } },
  );

  const newAccessToken = (res.data as { accessToken: string }).accessToken;
  localStorage.setItem("accessToken", newAccessToken);
  return newAccessToken;
}

/** Handle expired / invalid tokens globally */
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (typeof window === "undefined") return Promise.reject(error);

    const originalRequest = error.config as RetryConfig;

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;

      try {
        const newAccessToken = await refreshAccessToken();

        originalRequest.headers = originalRequest.headers ?? {};
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

        return api(originalRequest);
      } catch {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("temp_token");
        window.location.href = "/";
      }
    }

    return Promise.reject(error);
  },
);

export default api;
