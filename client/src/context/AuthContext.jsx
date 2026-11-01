import { useState, useEffect } from "react";
import { AuthContext } from "./AuthStore";
import api, { setAccessToken } from "../api/axios";



export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [accessToken, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  const updateAccessToken = (token) => {
    setToken(token);
    setAccessToken(token);
  };

const login = async (email, password) => {
  const response = await api.post("/auth/login", {
    email,
    password,
  });

  updateAccessToken(response.data.accessToken);

  const profileResponse = await api.get("/users/profile");

  setUser(profileResponse.data.user);

  return response.data;
};

  const logout = async () => {
    try {
      const csrfResponse = await api.get("/auth/csrf-token");

      await api.post(
        "/auth/logout",
        {},
        {
          headers: {
            "x-csrf-token": csrfResponse.data.csrfToken,
          },
        }
      );
    } finally {
      updateAccessToken(null);
      setUser(null);
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const csrfResponse = await api.get("/auth/csrf-token");

        const refreshResponse = await api.post(
          "/auth/refresh",
          {},
          {
            headers: {
              "x-csrf-token": csrfResponse.data.csrfToken,
            },
          }
        );

        updateAccessToken(refreshResponse.data.accessToken);

        const profileResponse = await api.get("/users/profile");

        setUser(profileResponse.data.user);
      } catch {
        updateAccessToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        accessToken,
        loading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

