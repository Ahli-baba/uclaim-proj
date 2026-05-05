import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { SettingsProvider } from "./contexts/SettingsContext";
import MaintenanceGuard from "./components/MaintenanceGuard";
import UserLayout from "./components/UserLayout";
import LandingPage from "./pages/LandingPage";
import VerifyEmail from "./pages/auth/VerifyEmail";
import ResetPassword from "./pages/auth/ResetPassword";
import Dashboard from "./pages/user/Dashboard";
import SearchItemsPage from "./pages/user/SearchItemsPage";
import ReportItemsPage from "./pages/user/ReportItemsPage";
import ItemDetail from "./pages/user/ItemDetail";
import MyProfile from "./pages/user/MyProfile";
import Settings from "./pages/user/Settings";

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
      fontSize: "medium"
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
    const html = document.documentElement;
    const body = document.body;

    // Dyslexia Font — apply to html so it cascades everywhere
    if (settings.dyslexiaFont) {
      html.classList.add('dyslexia-font');
      body.style.fontFamily = "'OpenDyslexic', 'Comic Sans MS', 'Arial', sans-serif";
    } else {
      html.classList.remove('dyslexia-font');
      body.style.fontFamily = "";
    }

    // High Contrast
    if (settings.highContrast) html.classList.add('high-contrast');
    else html.classList.remove('high-contrast');

    // Color Blind Mode — apply filter to body
    if (settings.colorBlindMode) {
      html.classList.add('color-blind-mode');
      body.style.filter = 'grayscale(0.3) contrast(1.1)';
    } else {
      html.classList.remove('color-blind-mode');
      body.style.filter = '';
    }

    // Font Size
    html.classList.remove('text-small', 'text-medium', 'text-large');
    html.classList.add(`text-${settings.fontSize}`);

    // Dark Mode — use CSS variables approach instead of invert filter
    if (settings.darkMode) html.classList.add('dark-mode');
    else html.classList.remove('dark-mode');

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
          font-weight: normal;
          font-style: normal;
          font-display: swap;
        }
        @font-face {
          font-family: 'OpenDyslexic';
          src: url('https://cdn.jsdelivr.net/npm/open-dyslexic@1.0.3/ttf/OpenDyslexic-Bold.ttf') format('truetype');
          font-weight: bold;
          font-style: normal;
          font-display: swap;
        }
        
        /* Dyslexia font cascade */
        .dyslexia-font, .dyslexia-font * {
          font-family: 'OpenDyslexic', 'Comic Sans MS', 'Arial', sans-serif !important;
          letter-spacing: 0.05em;
          line-height: 1.6;
          word-spacing: 0.1em;
        }
        
        /* High contrast */
        .high-contrast, .high-contrast * {
          filter: contrast(1.3) !important;
        }
        .high-contrast img, .high-contrast video {
          filter: contrast(1.1) !important;
        }
        
        /* Color blind friendly patterns */
        .color-blind-mode .status-lost,
        .color-blind-mode .type-lost {
          background-image: repeating-linear-gradient(45deg, transparent, transparent 5px, rgba(0,0,0,0.05) 5px, rgba(0,0,0,0.05) 10px) !important;
        }
        .color-blind-mode .status-found,
        .color-blind-mode .type-found {
          background-image: repeating-linear-gradient(-45deg, transparent, transparent 5px, rgba(0,0,0,0.05) 5px, rgba(0,0,0,0.05) 10px) !important;
        }
        .color-blind-mode .status-claimed,
        .color-blind-mode .type-claimed {
          background-image: radial-gradient(circle, rgba(0,0,0,0.05) 1px, transparent 1px) !important;
          background-size: 8px 8px !important;
        }
        
        /* Font size */
        .text-small { font-size: 14px !important; }
        .text-small h1 { font-size: 1.5rem !important; }
        .text-small h2 { font-size: 1.25rem !important; }
        .text-small h3 { font-size: 1.1rem !important; }
        
        .text-medium { font-size: 16px !important; }
        .text-medium h1 { font-size: 1.75rem !important; }
        .text-medium h2 { font-size: 1.5rem !important; }
        .text-medium h3 { font-size: 1.25rem !important; }
        
        .text-large { font-size: 18px !important; }
        .text-large h1 { font-size: 2rem !important; }
        .text-large h2 { font-size: 1.75rem !important; }
        .text-large h3 { font-size: 1.5rem !important; }
        
        /* Dark mode — proper dark theme */
        .dark-mode {
          color-scheme: dark;
        }
        .dark-mode body {
          background-color: #0f172a;
          color: #e2e8f0;
        }
        .dark-mode .bg-white,
        .dark-mode [class*="bg-white"] {
          background-color: #1e293b !important;
        }
        .dark-mode [class*="bg-[#F5F6F8]"],
        .dark-mode [class*="bg-gray-50"] {
          background-color: #0f172a !important;
        }
        .dark-mode [class*="text-[#001F3F]"],
        .dark-mode [class*="text-gray-900"] {
          color: #f1f5f9 !important;
        }
        .dark-mode [class*="text-gray-400"],
        .dark-mode [class*="text-gray-500"] {
          color: #94a3b8 !important;
        }
        .dark-mode [class*="border-gray-100"],
        .dark-mode [class*="border-gray-200"] {
          border-color: #334155 !important;
        }
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
            <Route path="/login" element={<Navigate to="/" />} />
            <Route path="/register" element={<Navigate to="/" />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* ===== USER ROUTES - ALL WRAPPED WITH USERLAYOUT ===== */}
            <Route path="/dashboard" element={<ProtectedRoute><UserLayout activeNav="dashboard"><Dashboard /></UserLayout></ProtectedRoute>} />
            <Route path="/search" element={<ProtectedRoute><UserLayout activeNav="search"><SearchItemsPage /></UserLayout></ProtectedRoute>} />
            <Route path="/report" element={<ProtectedRoute><UserLayout activeNav="report"><ReportItemsPage /></UserLayout></ProtectedRoute>} />
            <Route path="/item/:id" element={<ProtectedRoute><UserLayout activeNav="item"><ItemDetail /></UserLayout></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><UserLayout activeNav="profile"><MyProfile /></UserLayout></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><UserLayout activeNav="settings"><Settings /></UserLayout></ProtectedRoute>} />

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