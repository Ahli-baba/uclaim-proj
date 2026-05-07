import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { SettingsProvider } from "./contexts/SettingsContext";
import MaintenanceGuard from "./components/MaintenanceGuard";
import UserLayout from "./components/UserLayout";
import LandingPage from "./pages/LandingPage";
import VerifyEmail from "./pages/auth/VerifyEmail";
import Dashboard from "./pages/user/Dashboard";
import SearchItemsPage from "./pages/user/SearchItemsPage";
import ReportItemsPage from "./pages/user/ReportItemsPage";
import ItemDetail from "./pages/user/ItemDetail";
import MyProfile from "./pages/user/MyProfile";
import Settings from "./pages/user/Settings";

// Admin Imports
import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminReports from "./pages/admin/AdminReports";
import AdminSettings from "./pages/admin/AdminSettings";

// Staff Imports
import StaffLayout from "./pages/staff/StaffLayout";
import StaffDashboard from "./pages/staff/StaffDashboard";
import StaffItems from "./pages/staff/StaffItems";
import StaffClaims from "./pages/staff/StaffClaims";
import StaffSettings from "./pages/staff/StaffSettings";

// ResetPassword standalone page no longer needed - handled by modal
const ResetPasswordRedirect = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  return <Navigate to={token ? `/?token=${token}` : "/"} replace />;
};

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
const isStaff = () => getUser().role === "staff";

// Protected Route for Users
const ProtectedRoute = ({ children }) => {
  const location = useLocation();
  if (!isAuthenticated()) {
    sessionStorage.setItem("redirectAfterLogin", location.pathname + location.search);
    return <Navigate to="/" replace />;
  }
  if (isAdmin()) {
    return <Navigate to="/admin" replace />;
  }
  if (isStaff()) {
    return <Navigate to="/staff" replace />;
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

// Protected Route for Staff
const StaffRoute = ({ children }) => {
  const location = useLocation();
  if (!isAuthenticated()) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }
  if (!isStaff()) {
    if (isAdmin()) return <Navigate to="/admin" replace />;
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

// Only apply appearance settings on user routes
const USER_ROUTES = ['/dashboard', '/search', '/report', '/item', '/profile', '/settings'];

const GlobalStyles = () => {
  const location = useLocation();
  const isUserRoute = USER_ROUTES.some(r => location.pathname.startsWith(r));

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

    // If NOT on a user route, strip everything and return
    if (!isUserRoute) {
      html.classList.remove('dyslexia-font', 'high-contrast', 'color-blind-mode', 'dark-mode');
      html.classList.remove('text-small', 'text-medium', 'text-large');
      body.style.fontFamily = "";
      body.style.filter = "";
      return;
    }

    // Dyslexia Font
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

    // Color Blind Mode
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

    // Dark Mode
    if (settings.darkMode) html.classList.add('dark-mode');
    else html.classList.remove('dark-mode');

  }, [settings, isUserRoute]);

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
        .dyslexia-font, .dyslexia-font * {
          font-family: 'OpenDyslexic', 'Comic Sans MS', 'Arial', sans-serif !important;
          letter-spacing: 0.05em;
          line-height: 1.6;
          word-spacing: 0.1em;
        }
        .high-contrast, .high-contrast * {
          filter: contrast(1.3) !important;
        }
        .high-contrast img, .high-contrast video {
          filter: contrast(1.1) !important;
        }
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
        .text-small { font-size: 14px !important; }
        .text-medium { font-size: 16px !important; }
        .text-large { font-size: 18px !important; }
        .dark-mode { color-scheme: dark; }
        .dark-mode body { background-color: #0f172a; color: #e2e8f0; }
        .dark-mode .bg-white,
        .dark-mode [class*="bg-white"] { background-color: #1e293b !important; }
        .dark-mode [class*="bg-[#F5F6F8]"],
        .dark-mode [class*="bg-gray-50"] { background-color: #0f172a !important; }
        .dark-mode [class*="text-[#001F3F]"],
        .dark-mode [class*="text-gray-900"] { color: #f1f5f9 !important; }
        .dark-mode [class*="text-gray-400"],
        .dark-mode [class*="text-gray-500"] { color: #94a3b8 !important; }
        .dark-mode [class*="border-gray-100"],
        .dark-mode [class*="border-gray-200"] { border-color: #334155 !important; }
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
            <Route path="/reset-password" element={<ResetPasswordRedirect />} />

            {/* User Routes */}
            <Route path="/dashboard" element={<ProtectedRoute><UserLayout activeNav="dashboard"><Dashboard /></UserLayout></ProtectedRoute>} />
            <Route path="/search" element={<ProtectedRoute><UserLayout activeNav="search"><SearchItemsPage /></UserLayout></ProtectedRoute>} />
            <Route path="/report" element={<ProtectedRoute><UserLayout activeNav="report"><ReportItemsPage /></UserLayout></ProtectedRoute>} />
            <Route path="/item/:id" element={<ProtectedRoute><UserLayout activeNav="item"><ItemDetail /></UserLayout></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><UserLayout activeNav="profile"><MyProfile /></UserLayout></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><UserLayout activeNav="settings"><Settings /></UserLayout></ProtectedRoute>} />

            {/* Admin Routes */}
            <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
              <Route index element={<AdminDashboard />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="reports" element={<AdminReports />} />
              <Route path="settings" element={<AdminSettings />} />
            </Route>

            {/* Staff Routes */}
            <Route path="/staff" element={<StaffRoute><StaffLayout /></StaffRoute>}>
              <Route index element={<StaffDashboard />} />
              <Route path="items" element={<StaffItems />} />
              <Route path="claims" element={<StaffClaims />} />
              <Route path="settings" element={<StaffSettings />} />
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