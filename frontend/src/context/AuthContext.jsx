import { createContext, useContext, useState, useEffect } from "react";
import { authService } from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("bloggin_token"));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function verifyUser() {
      const storedToken = localStorage.getItem("bloggin_token");
      if (!storedToken) {
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        const response = await authService.getMe();
        setUser(response.data);
      } catch (err) {
        console.error("Session verification failed:", err);
        localStorage.removeItem("bloggin_token");
        localStorage.removeItem("bloggin_user");
        setUser(null);
        setToken(null);
      } finally {
        setLoading(false);
      }
    }

    verifyUser();
  }, []);

  async function login(username, password) {
    const response = await authService.login({ username, password });
    const { token: newToken, user: userData } = response.data;
    localStorage.setItem("bloggin_token", newToken);
    localStorage.setItem("bloggin_user", JSON.stringify(userData));
    setToken(newToken);
    setUser(userData);
    return response.data;
  }

  async function register(username, email, password) {
    const response = await authService.register({ username, email, password });
    const { token: newToken, user: userData } = response.data;
    localStorage.setItem("bloggin_token", newToken);
    localStorage.setItem("bloggin_user", JSON.stringify(userData));
    setToken(newToken);
    setUser(userData);
    return response.data;
  }

  async function logout() {
    try {
      if (token) {
        await authService.logout();
      }
    } catch (err) {
      console.warn("Logout error:", err);
    } finally {
      localStorage.removeItem("bloggin_token");
      localStorage.removeItem("bloggin_user");
      setToken(null);
      setUser(null);
    }
  }

  const value = {
    user,
    token,
    isAuthenticated: !!token && !!user,
    loading,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
