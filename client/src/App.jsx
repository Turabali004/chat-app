import "./App.css";
import { useState, useEffect } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

// components
import { Button } from "./components/ui/button";

// pages
import Auth from "./pages/Auth";
import Chat from "./pages/Chat";
import Profile from "./pages/Profile";

// Zustand store
import { useAppStore } from "./store";

// API client
import { apiClient } from "../lib/api-client";
import { GET_USER_INFO } from "../utils/constants";

const App = () => {
  const { userInfo, setUserInfo } = useAppStore();  
  const [loading, setLoading] = useState(true);  
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Try to fetch user data using cookies (no need for token in sessionStorage)
        const response = await apiClient.post(GET_USER_INFO);

        if (response.status === 200 && response.data.id) {
          setUserInfo(response.data);  // Update userInfo if successful
        }
      } catch (error) {
        console.error("Failed to fetch user data", error);
        setUserInfo(null);  // If error, reset userInfo
      }

      setLoading(false);  // Stop loading after checking authentication
    };

    checkAuth();  // Call the authentication check
  }, [setUserInfo]);  

  if (loading) {
    return <div>Loading....</div>;  // Display loading message while checking authentication
  }

  const isAuthenticated = !!userInfo;
  console.log("userInfo: ", userInfo)

  return (
    <BrowserRouter>
      <Routes>
        {/* Auth route (for unauthenticated users only) */}
        <Route
          path="/auth"
          // element={isAuthenticated ? <Navigate to="/chat" /> : <Auth />}
          element={<Auth />}
        />

        {/* Chat route (only for authenticated users) */}
        <Route
          path="/chat"
          // element={isAuthenticated ? <Chat /> : <Navigate to="/auth" />}
          element={ <Chat/>}
        />

        {/* Profile route (only for authenticated users) */}
        <Route
          path="/profile"
          // element={isAuthenticated ? <Profile /> : <Navigate to="/auth" />}
          element={<Profile />}
        />

        {/* Fallback route for any unmatched path */}
        <Route path="*" element={<Navigate to="/auth" />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
