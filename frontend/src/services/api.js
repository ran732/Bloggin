import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000/api/v1/";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000,
});

// Request interceptor: Attach auth token if available in localStorage
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("bloggin_token");
    if (token) {
      config.headers.Authorization = `Token ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: Gracefully handle 401 unauthorized
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // If token is invalid or deleted on server, clear stale local token
      const currentToken = localStorage.getItem("bloggin_token");
      if (currentToken && !error.config.url.includes("auth/login")) {
        localStorage.removeItem("bloggin_token");
        localStorage.removeItem("bloggin_user");
      }
    }
    return Promise.reject(error);
  }
);

// Blog & Medium Features Service
export const blogService = {
  getBlogs: (params) => api.get("blogs/", { params }),
  getBlog: (id) => api.get(`blogs/${id}/`),
  createBlog: (data) => api.post("blogs/", data),
  updateBlog: (id, data) => api.patch(`blogs/${id}/`, data),
  deleteBlog: (id) => api.delete(`blogs/${id}/`),
  likeBlog: (id) => api.post(`blogs/${id}/like/`),
  clapBlog: (id, count = 1) => api.post(`blogs/${id}/clap/`, { count }),
  addComment: (id, data) => api.post(`blogs/${id}/comments/`, data),
  getMyBlogs: () => api.get("blogs/my-blogs/"),

  // Medium reading list / bookmarks
  toggleBookmark: (id) => api.post(`blogs/${id}/bookmark/`),
  getBookmarks: () => api.get("blogs/bookmarks/"),

  // Medium following feed & author profiles
  getFollowingFeed: () => api.get("blogs/following/"),
  getAuthorProfile: (username) => api.get(`blogs/authors/${username}/`),
  toggleFollow: (username) => api.post(`blogs/authors/${username}/follow/`),
};

// Authentication & Mailer / Password Reset Service
export const authService = {
  login: (credentials) =>
    api.post("auth/login/", credentials).catch((err) => {
      if (err.response?.status === 404) {
        return api.post("blogs/auth/login/", credentials);
      }
      return Promise.reject(err);
    }),

  register: (data) =>
    api.post("auth/register/", data).catch((err) => {
      if (err.response?.status === 404) {
        return api.post("blogs/auth/register/", data);
      }
      return Promise.reject(err);
    }),

  getMe: () =>
    api.get("auth/me/").catch((err) => {
      if (err.response?.status === 404) {
        return api.get("blogs/auth/me/");
      }
      return Promise.reject(err);
    }),

  logout: () =>
    api.post("auth/logout/").catch((err) => {
      if (err.response?.status === 404) {
        return api.post("blogs/auth/logout/");
      }
      return Promise.reject(err);
    }),

  updateProfile: (data) =>
    api.patch("auth/profile/", data).catch((err) => {
      if (err.response?.status === 404) {
        return api.patch("blogs/auth/profile/", data);
      }
      return Promise.reject(err);
    }),

  // Mailer Password Reset
  requestPasswordReset: (email) =>
    api.post("auth/password-reset/", { email }).catch((err) => {
      if (err.response?.status === 404) {
        return api.post("blogs/auth/password-reset/", { email });
      }
      return Promise.reject(err);
    }),

  verifyPasswordResetToken: (token) =>
    api.get("auth/password-reset/verify/", { params: { token } }).catch((err) => {
      if (err.response?.status === 404) {
        return api.get("blogs/auth/password-reset/verify/", { params: { token } });
      }
      return Promise.reject(err);
    }),

  confirmPasswordReset: (token, new_password) =>
    api.post("auth/password-reset/confirm/", { token, new_password }).catch((err) => {
      if (err.response?.status === 404) {
        return api.post("blogs/auth/password-reset/confirm/", { token, new_password });
      }
      return Promise.reject(err);
    }),
};

export default api;