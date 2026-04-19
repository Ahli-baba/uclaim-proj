import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    Moon,
    Sun,
    Type,
    Palette,
    Bell,
    Shield,
    Globe,
    Eye,
    Monitor,
    Lock,
    Trash2,
    Save,
    LogOut
} from "lucide-react";

function Settings() {
    const navigate = useNavigate();

    // User state
    const [user, setUser] = useState(() => {
        const saved = localStorage.getItem("user");
        return saved ? JSON.parse(saved) : null;
    });

    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isNotificationOpen, setIsNotificationOpen] = useState(false);
    const [saving, setSaving] = useState(false);

    // Settings state
    const [settings, setSettings] = useState(() => {
        const saved = localStorage.getItem("uclaim_settings");
        return saved ? JSON.parse(saved) : {
            // Appearance
            darkMode: false,
            dyslexiaFont: false,
            colorBlindMode: false,
            highContrast: false,
            fontSize: "medium", // small, medium, large

            // Notifications
            emailNotifications: true,
            pushNotifications: true,
            itemUpdates: true,
            claimAlerts: true,
            marketingEmails: false,

            // Privacy
            publicProfile: false,
            showContactInfo: false,

            // Language
            language: "en",

            // Accessibility
            reduceMotion: false,
            screenReaderOptimized: false
        };
    });

    const handleSettingChange = (key, value) => {
        const newSettings = { ...settings, [key]: value };
        setSettings(newSettings);
        localStorage.setItem("uclaim_settings", JSON.stringify(newSettings));
    };

    const handleSaveSettings = async () => {
        setSaving(true);
        await new Promise(resolve => setTimeout(resolve, 800));
        setSaving(false);
        alert("Settings saved successfully!");
    };

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login");
    };

    const handleLogoClick = () => navigate("/dashboard");
    const capitalizeRole = (role) => role ? role.charAt(0).toUpperCase() + role.slice(1) : "User";

    return (
        <div className="flex min-h-screen bg-gray-50 font-sans text-gray-900">
            {/* Sidebar */}
            <aside className="w-64 bg-white border-r border-gray-100 flex flex-col sticky top-0 h-screen">
                <div className="p-8 flex items-center gap-3">
                    <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center relative shadow-sm cursor-pointer hover:scale-105 transition-transform" onClick={handleLogoClick}>
                        <span className="text-white font-extrabold text-lg relative">
                            C<span className="absolute left-1 top-0 text-white font-extrabold text-sm">U</span>
                        </span>
                    </div>
                    <span className="text-2xl font-extrabold text-blue-700 tracking-tight cursor-pointer hover:opacity-80 transition-opacity" onClick={handleLogoClick}>
                        UClaim
                    </span>
                </div>

                <nav className="flex-1 px-4 space-y-1">
                    <NavItem icon="🏠" label="Dashboard" onClick={() => navigate("/dashboard")} />
                    <NavItem icon="🔍" label="Search Items" onClick={() => navigate("/search")} />
                    <NavItem icon="📄" label="Report Item" onClick={() => navigate("/report")} />
                    <NavItem icon="👤" label="My Profile" onClick={() => navigate("/profile")} />
                </nav>

                <div className="px-6 pb-6 pt-4 border-t border-gray-50">
                    <p className="text-[11px] text-gray-300 font-medium">UClaim © 2025</p>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1">
                {/* Header */}
                <header className="h-20 bg-white border-b border-gray-100 px-8 flex items-center justify-end relative">
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <button onClick={() => { setIsNotificationOpen(!isNotificationOpen); setIsProfileOpen(false); }} className={`w-10 h-10 flex items-center justify-center rounded-full transition relative ${isNotificationOpen ? 'bg-blue-50 text-blue-600' : 'bg-gray-50 text-gray-400 hover:text-blue-600'}`}>
                                <Bell size={20} />
                                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                            </button>
                        </div>

                        <div className="h-10 w-[1px] bg-gray-100 mx-2"></div>

                        <div className="relative">
                            <button onClick={() => { setIsProfileOpen(!isProfileOpen); setIsNotificationOpen(false); }} className={`flex items-center gap-3 p-1.5 rounded-2xl transition group ${isProfileOpen ? 'bg-gray-50' : 'hover:bg-gray-50'}`}>
                                <div className="text-right hidden sm:block">
                                    <p className="text-sm font-bold text-gray-900 leading-none group-hover:text-blue-600 transition">{user?.name}</p>
                                    <p className="text-[11px] text-gray-400 font-medium mt-1">{capitalizeRole(user?.role)} Account</p>
                                </div>
                                <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold border-2 border-transparent group-hover:border-blue-200 transition overflow-hidden">
                                    {user?.avatar ? (
                                        <img src={user.avatar} alt="Profile" className="w-full h-full object-cover" />
                                    ) : (
                                        user?.name?.charAt(0) || "U"
                                    )}
                                </div>
                            </button>

                            {isProfileOpen && (
                                <>
                                    <div className="fixed inset-0 z-10" onClick={() => setIsProfileOpen(false)}></div>
                                    <div className="absolute right-0 mt-3 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-20 overflow-hidden">
                                        <div className="px-4 py-3 border-b border-gray-50 mb-1 text-center">
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Signed in as</p>
                                            <p className="text-sm font-bold text-gray-900 truncate">{user?.email}</p>
                                        </div>
                                        <button onClick={() => { navigate("/profile"); setIsProfileOpen(false); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-600 hover:bg-blue-50 hover:text-blue-600 transition font-medium">
                                            <span>👤</span> My Profile
                                        </button>
                                        <button onClick={() => { setIsProfileOpen(false); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-blue-600 bg-blue-50 font-bold">
                                            <span>⚙️</span> Settings
                                        </button>
                                        <div className="h-[1px] bg-gray-50 my-1"></div>
                                        <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition font-bold">
                                            <LogOut size={16} /> Logout
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </header>

                {/* Settings Content */}
                <div className="p-10 max-w-4xl mx-auto w-full">
                    <div className="mb-10">
                        <h1 className="text-3xl font-extrabold text-gray-900">Settings</h1>
                        <p className="text-gray-500 mt-1 text-sm font-medium">Customize your experience and accessibility preferences</p>
                    </div>

                    <div className="space-y-8">
                        {/* Appearance Section */}
                        <SettingsSection icon={<Palette size={20} />} title="Appearance" description="Customize how UClaim looks for you">

                            {/* Dark Mode */}
                            <SettingToggle
                                icon={settings.darkMode ? <Sun size={20} /> : <Moon size={20} />}
                                title="Dark Mode"
                                description="Switch between light and dark themes for comfortable viewing"
                                checked={settings.darkMode}
                                onChange={(v) => handleSettingChange('darkMode', v)}
                            />

                            {/* Dyslexia Font */}
                            <SettingToggle
                                icon={<Type size={20} />}
                                title="Dyslexia-Friendly Font"
                                description="Use OpenDyslexic font for improved readability"
                                checked={settings.dyslexiaFont}
                                onChange={(v) => handleSettingChange('dyslexiaFont', v)}
                            />

                            {/* Color Blind Mode */}
                            <SettingToggle
                                icon={<Eye size={20} />}
                                title="Color Blind Friendly Mode"
                                description="Add patterns and textures to color-coded elements"
                                checked={settings.colorBlindMode}
                                onChange={(v) => handleSettingChange('colorBlindMode', v)}
                            />

                            {/* High Contrast */}
                            <SettingToggle
                                icon={<Monitor size={20} />}
                                title="High Contrast Mode"
                                description="Increase contrast for better visibility"
                                checked={settings.highContrast}
                                onChange={(v) => handleSettingChange('highContrast', v)}
                            />

                            {/* Font Size */}
                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm text-blue-500">
                                        <Type size={20} />
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-900">Font Size</p>
                                        <p className="text-xs text-gray-400 mt-0.5">Adjust text size for comfortable reading</p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    {['small', 'medium', 'large'].map((size) => (
                                        <button
                                            key={size}
                                            onClick={() => handleSettingChange('fontSize', size)}
                                            className={`px-4 py-2 rounded-xl font-bold text-sm capitalize transition ${settings.fontSize === size
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-white text-gray-600 border border-gray-200 hover:border-blue-300'
                                                }`}
                                        >
                                            {size}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Reduce Motion */}
                            <SettingToggle
                                icon={<Monitor size={20} />}
                                title="Reduce Motion"
                                description="Minimize animations for those sensitive to motion"
                                checked={settings.reduceMotion}
                                onChange={(v) => handleSettingChange('reduceMotion', v)}
                            />
                        </SettingsSection>

                        {/* Notifications Section */}
                        <SettingsSection icon={<Bell size={20} />} title="Notifications" description="Control what notifications you receive">
                            <SettingToggle
                                title="Email Notifications"
                                description="Receive updates via email"
                                checked={settings.emailNotifications}
                                onChange={(v) => handleSettingChange('emailNotifications', v)}
                            />
                            <SettingToggle
                                title="Item Status Updates"
                                description="Get notified when your items are found or claimed"
                                checked={settings.itemUpdates}
                                onChange={(v) => handleSettingChange('itemUpdates', v)}
                            />
                            <SettingToggle
                                title="Claim Alerts"
                                description="Notifications when someone claims your item"
                                checked={settings.claimAlerts}
                                onChange={(v) => handleSettingChange('claimAlerts', v)}
                            />
                            <SettingToggle
                                title="Marketing Emails"
                                description="Receive news and updates about UClaim"
                                checked={settings.marketingEmails}
                                onChange={(v) => handleSettingChange('marketingEmails', v)}
                            />
                        </SettingsSection>

                        {/* Privacy Section */}
                        <SettingsSection icon={<Shield size={20} />} title="Privacy" description="Manage your privacy settings">
                            <SettingToggle
                                title="Public Profile"
                                description="Allow others to see your profile information"
                                checked={settings.publicProfile}
                                onChange={(v) => handleSettingChange('publicProfile', v)}
                            />
                            <SettingToggle
                                title="Show Contact Information"
                                description="Display phone number on your listings"
                                checked={settings.showContactInfo}
                                onChange={(v) => handleSettingChange('showContactInfo', v)}
                            />
                        </SettingsSection>

                        {/* Language Section */}
                        <SettingsSection icon={<Globe size={20} />} title="Language & Region" description="Select your preferred language">
                            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest block mb-2">Language</label>
                                <select
                                    value={settings.language}
                                    onChange={(e) => handleSettingChange('language', e.target.value)}
                                    className="w-full bg-white border border-gray-200 p-3.5 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition"
                                >
                                    <option value="en">English</option>
                                    <option value="es">Español</option>
                                    <option value="fr">Français</option>
                                    <option value="de">Deutsch</option>
                                    <option value="zh">中文</option>
                                    <option value="ja">日本語</option>
                                </select>
                            </div>
                        </SettingsSection>

                        {/* Account Section */}
                        <SettingsSection icon={<Lock size={20} />} title="Account Security" description="Manage your account security">
                            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 mb-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-bold text-gray-900">Change Password</p>
                                        <p className="text-xs text-gray-400 mt-0.5">Update your password regularly for security</p>
                                    </div>
                                    <button className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl font-bold text-sm hover:bg-gray-50 transition">
                                        Change
                                    </button>
                                </div>
                            </div>

                            <div className="p-4 bg-red-50 rounded-2xl border border-red-100">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center text-red-600">
                                            <Trash2 size={20} />
                                        </div>
                                        <div>
                                            <p className="font-bold text-red-900">Delete Account</p>
                                            <p className="text-xs text-red-400 mt-0.5">Permanently remove your account and data</p>
                                        </div>
                                    </div>
                                    <button className="px-4 py-2 bg-red-600 text-white rounded-xl font-bold text-sm hover:bg-red-700 transition">
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </SettingsSection>

                        {/* Save Button */}
                        <div className="flex justify-end pt-6 border-t border-gray-100">
                            <button
                                onClick={handleSaveSettings}
                                disabled={saving}
                                className="px-8 py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-100 disabled:opacity-50 flex items-center gap-2"
                            >
                                {saving ? (
                                    <>
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Save size={20} />
                                        Save Settings
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

// Helper Components
function SettingsSection({ icon, title, description, children }) {
    return (
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
                        {icon}
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-gray-900">{title}</h2>
                        <p className="text-xs text-gray-400 mt-0.5">{description}</p>
                    </div>
                </div>
            </div>
            <div className="p-6 space-y-4">
                {children}
            </div>
        </div>
    );
}

function SettingToggle({ icon, title, description, checked, onChange }) {
    return (
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100 hover:border-blue-200 transition">
            <div className="flex items-center gap-4">
                {icon && (
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm text-blue-500">
                        {icon}
                    </div>
                )}
                <div>
                    <p className="font-bold text-gray-900">{title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{description}</p>
                </div>
            </div>
            <button
                onClick={() => onChange(!checked)}
                className={`w-14 h-8 rounded-full p-1 transition-colors duration-300 ${checked ? 'bg-blue-600' : 'bg-gray-300'}`}
            >
                <div className={`w-6 h-6 bg-white rounded-full shadow-md transform transition-transform duration-300 ${checked ? 'translate-x-6' : 'translate-x-0'}`}></div>
            </button>
        </div>
    );
}

function NavItem({ icon, label, active = false, onClick }) {
    return (
        <button onClick={onClick} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl font-bold text-sm transition ${active ? 'bg-blue-600 text-white shadow-md shadow-blue-100' : 'text-gray-400 hover:bg-gray-50 hover:text-gray-600'}`}>
            <span className="text-lg">{icon}</span> {label}
        </button>
    );
}

export default Settings;