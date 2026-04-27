import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { SettingsProvider } from "./contexts/SettingsContext";
import MaintenanceGuard from "./components/MaintenanceGuard";
import LandingPage from "./pages/LandingPage";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import VerifyEmail from "./pages/auth/VerifyEmail";
import Dashboard from "./pages/user/Dashboard";
import SearchItemsPage from "./pages/user/SearchItemsPage";
import ReportItemsPage from "./pages/user/ReportItemsPage";
import ItemDetail from "./pages/user/ItemDetail";
import MyProfile from "./pages/user/MyProfile";
import Settings from "./pages/user/Settings";
import AuthModal from "./components/AuthModal";

// Admin Imports
import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminItems from "./pages/admin/AdminItems";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminClaims from "./pages/admin/AdminClaims";
import AdminReports from "./pages/admin/AdminReports";
import AdminSettings from "./pages/admin/AdminSettings";

// Check auth helper
const getUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user") || "{}");
  } catch {
    return {};
  }
};

const isAuthenticated = () => !!localStorage.getItem("token");
const isAdmin = () => getUser().role === "admin";

// Protected Route for Users
const ProtectedRoute = ({ children }) => {
  const location = useLocation();
  if (!isAuthenticated()) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  // If admin tries to access user routes, redirect to admin
  if (isAdmin()) {
    return <Navigate to="/admin" replace />;
  }
  return children;
};

// Protected Route for Admin
const AdminRoute = ({ children }) => {
  const location = useLocation();
  if (!isAuthenticated()) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  if (!isAdmin()) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

// Global Settings Component
const GlobalStyles = () => {
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem("uclaim_settings");
    return saved ? JSON.parse(saved) : {
      darkMode: false,
      dyslexiaFont: false,
      colorBlindMode: false,
      highContrast: false,
      fontSize: "medium",
      reduceMotion: false
    };
  });

  useEffect(() => {
    const handleStorageChange = () => {
      const saved = localStorage.getItem("uclaim_settings");
      if (saved) setSettings(JSON.parse(saved));
    };
    window.addEventListener('storage', handleStorageChange);
    const interval = setInterval(handleStorageChange, 100);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    const body = document.body;
    const html = document.documentElement;

    if (settings.darkMode) html.classList.add('dark-mode');
    else html.classList.remove('dark-mode');

    if (settings.dyslexiaFont) {
      html.classList.add('dyslexia-font');
      body.style.fontFamily = "'OpenDyslexic', 'Comic Sans MS', sans-serif";
    } else {
      html.classList.remove('dyslexia-font');
      body.style.fontFamily = "";
    }

    if (settings.highContrast) html.classList.add('high-contrast');
    else html.classList.remove('high-contrast');

    if (settings.colorBlindMode) html.classList.add('color-blind-mode');
    else html.classList.remove('color-blind-mode');

    html.classList.remove('text-small', 'text-medium', 'text-large');
    html.classList.add(`text-${settings.fontSize}`);

    if (settings.reduceMotion) html.classList.add('reduce-motion');
    else html.classList.remove('reduce-motion');
  }, [settings]);

  useEffect(() => {
    const styleId = 'accessibility-styles';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
                @font-face {
                    font-family: 'OpenDyslexic';
                    src: url('https://cdn.jsdelivr.net/npm/open-dyslexic@1.0.3/ttf/OpenDyslexic-Regular.ttf') format('truetype');
                }
                .dark-mode { filter: invert(1) hue-rotate(180deg); }
                .dark-mode img, .dark-mode video { filter: invert(1) hue-rotate(180deg); }
                .high-contrast { filter: contrast(1.4); }
                .text-small { font-size: 14px !important; }
                .text-medium { font-size: 16px !important; }
                .text-large { font-size: 18px !important; }
                .reduce-motion * { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
            `;
      document.head.appendChild(style);
    }
  }, []);

  return null;
};

function App() {
  return (
    <SettingsProvider>
      <Router>
        <GlobalStyles />
        <MaintenanceGuard>
          <Routes>
            {/* Public */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LandingPage authModalDefault="login" />} />
            <Route path="/register" element={<LandingPage authModalDefault="register" />} />
            <Route path="/verify-email" element={<VerifyEmail />} />

            {/* User Routes - Protected */}
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/search" element={<ProtectedRoute><SearchItemsPage /></ProtectedRoute>} />
            <Route path="/report" element={<ProtectedRoute><ReportItemsPage /></ProtectedRoute>} />
            <Route path="/item/:id" element={<ProtectedRoute><ItemDetail /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><MyProfile /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />

            {/* Admin Routes - Protected */}
            <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
              <Route index element={<AdminDashboard />} />
              <Route path="items" element={<AdminItems />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="claims" element={<AdminClaims />} />
              <Route path="reports" element={<AdminReports />} />
              <Route path="settings" element={<AdminSettings />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </MaintenanceGuard>
      </Router>
    </SettingsProvider>
  );
}

export default App;