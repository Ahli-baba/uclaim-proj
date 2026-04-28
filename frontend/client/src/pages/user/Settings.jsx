import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSettings } from "../../contexts/SettingsContext";
import {
    Moon, Sun, Type, Palette, Bell, Shield,
    Globe, Eye, Monitor, Lock, Trash2, Save, LogOut
} from "lucide-react";

/* ─── Section wrapper ────────────────────────────────────────────────────────── */
const Section = ({ icon, title, description, children }) => (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100 bg-[#F5F6F8]">
            <div className="w-9 h-9 bg-[#001F3F]/10 text-[#001F3F] rounded-xl flex items-center justify-center flex-shrink-0">
                {icon}
            </div>
            <div>
                <h2 className="font-black text-[#001F3F] text-sm">{title}</h2>
                <p className="text-xs text-gray-400 mt-0.5">{description}</p>
            </div>
        </div>
        <div className="p-5 space-y-3">{children}</div>
    </div>
);

/* ─── Toggle row ─────────────────────────────────────────────────────────────── */
const Toggle = ({ icon, title, description, checked, onChange }) => (
    <div className="flex items-center justify-between p-4 bg-[#F5F6F8] rounded-xl border border-gray-100 hover:border-[#00A8E8]/30 transition-colors group">
        <div className="flex items-center gap-3">
            {icon && (
                <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm text-[#00A8E8] border border-gray-100 flex-shrink-0">
                    {icon}
                </div>
            )}
            <div>
                <p className="font-semibold text-[#001F3F] text-sm">{title}</p>
                <p className="text-xs text-gray-400 mt-0.5">{description}</p>
            </div>
        </div>
        <button
            onClick={() => onChange(!checked)}
            className={`relative w-12 h-6 rounded-full transition-colors duration-300 flex-shrink-0 ${checked ? "bg-[#00A8E8]" : "bg-gray-200"}`}
        >
            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all duration-300 ${checked ? "left-7" : "left-1"}`} />
        </button>
    </div>
);

/* ─── Main ───────────────────────────────────────────────────────────────────── */
export default function Settings() {
    const navigate = useNavigate();
    const { settings: ctxSettings } = useSettings();
    const siteName = ctxSettings?.siteName || "UClaim";

    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    const [settings, setSettings] = useState(() => {
        const s = localStorage.getItem("uclaim_settings");
        return s ? JSON.parse(s) : {
            darkMode: false, dyslexiaFont: false, colorBlindMode: false,
            highContrast: false, fontSize: "medium", reduceMotion: false,
            emailNotifications: true, itemUpdates: true, claimAlerts: true, marketingEmails: false,
            publicProfile: false, showContactInfo: false, language: "en",
        };
    });

    const set = (key, value) => {
        const next = { ...settings, [key]: value };
        setSettings(next);
        localStorage.setItem("uclaim_settings", JSON.stringify(next));
    };

    const handleSave = async () => {
        setSaving(true);
        await new Promise(r => setTimeout(r, 700));
        setSaving(false);
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
    };

    return (
        <div className="p-6 lg:p-8 max-w-3xl mx-auto">

            {/* Page title */}
            <div className="mb-7">
                <h1 className="text-2xl font-black text-[#001F3F]">Settings</h1>
                <p className="text-sm text-gray-400 mt-1">Customize your experience and accessibility preferences</p>
            </div>

            <div className="space-y-5">

                {/* Appearance */}
                <Section icon={<Palette size={18} />} title="Appearance" description="Customize how UClaim looks for you">
                    <Toggle
                        icon={settings.darkMode ? <Sun size={15} /> : <Moon size={15} />}
                        title="Dark Mode"
                        description="Switch between light and dark themes"
                        checked={settings.darkMode}
                        onChange={v => set("darkMode", v)}
                    />
                    <Toggle
                        icon={<Type size={15} />}
                        title="Dyslexia-Friendly Font"
                        description="Use OpenDyslexic font for improved readability"
                        checked={settings.dyslexiaFont}
                        onChange={v => set("dyslexiaFont", v)}
                    />
                    <Toggle
                        icon={<Eye size={15} />}
                        title="Color Blind Friendly Mode"
                        description="Add patterns and textures to color-coded elements"
                        checked={settings.colorBlindMode}
                        onChange={v => set("colorBlindMode", v)}
                    />
                    <Toggle
                        icon={<Monitor size={15} />}
                        title="High Contrast Mode"
                        description="Increase contrast for better visibility"
                        checked={settings.highContrast}
                        onChange={v => set("highContrast", v)}
                    />

                    {/* Font size */}
                    <div className="flex items-center justify-between p-4 bg-[#F5F6F8] rounded-xl border border-gray-100">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm text-[#00A8E8] border border-gray-100 flex-shrink-0">
                                <Type size={15} />
                            </div>
                            <div>
                                <p className="font-semibold text-[#001F3F] text-sm">Font Size</p>
                                <p className="text-xs text-gray-400 mt-0.5">Adjust text size for comfortable reading</p>
                            </div>
                        </div>
                        <div className="flex gap-1.5">
                            {["small", "medium", "large"].map(size => (
                                <button
                                    key={size}
                                    onClick={() => set("fontSize", size)}
                                    className={`px-3 py-1.5 rounded-lg font-bold text-xs capitalize transition-all duration-200 ${settings.fontSize === size
                                        ? "bg-[#001F3F] text-white shadow-sm"
                                        : "bg-white text-gray-500 border border-gray-200 hover:border-[#00A8E8]/40"
                                        }`}
                                >
                                    {size}
                                </button>
                            ))}
                        </div>
                    </div>

                    <Toggle
                        icon={<Monitor size={15} />}
                        title="Reduce Motion"
                        description="Minimize animations for those sensitive to motion"
                        checked={settings.reduceMotion}
                        onChange={v => set("reduceMotion", v)}
                    />
                </Section>

                {/* Notifications */}
                <Section icon={<Bell size={18} />} title="Notifications" description="Control what notifications you receive">
                    <Toggle title="Email Notifications" description="Receive updates via email" checked={settings.emailNotifications} onChange={v => set("emailNotifications", v)} />
                    <Toggle title="Item Status Updates" description="Get notified when your items are found or claimed" checked={settings.itemUpdates} onChange={v => set("itemUpdates", v)} />
                    <Toggle title="Claim Alerts" description="Notifications when someone claims your item" checked={settings.claimAlerts} onChange={v => set("claimAlerts", v)} />
                    <Toggle title="Marketing Emails" description="Receive news and updates about UClaim" checked={settings.marketingEmails} onChange={v => set("marketingEmails", v)} />
                </Section>

                {/* Privacy */}
                <Section icon={<Shield size={18} />} title="Privacy" description="Manage your privacy settings">
                    <Toggle title="Public Profile" description="Allow others to see your profile information" checked={settings.publicProfile} onChange={v => set("publicProfile", v)} />
                    <Toggle title="Show Contact Information" description="Display phone number on your listings" checked={settings.showContactInfo} onChange={v => set("showContactInfo", v)} />
                </Section>

                {/* Language */}
                <Section icon={<Globe size={18} />} title="Language & Region" description="Select your preferred language">
                    <div className="p-4 bg-[#F5F6F8] rounded-xl border border-gray-100">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2.5">Language</label>
                        <select
                            value={settings.language}
                            onChange={e => set("language", e.target.value)}
                            className="w-full bg-white border border-gray-200 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00A8E8]/30 focus:border-[#00A8E8] transition text-sm font-medium text-[#001F3F]"
                        >
                            <option value="en">English</option>
                            <option value="es">Español</option>
                            <option value="fr">Français</option>
                            <option value="de">Deutsch</option>
                            <option value="zh">中文</option>
                            <option value="ja">日本語</option>
                        </select>
                    </div>
                </Section>

                {/* Account Security */}
                <Section icon={<Lock size={18} />} title="Account Security" description="Manage your account security">
                    <div className="flex items-center justify-between p-4 bg-[#F5F6F8] rounded-xl border border-gray-100">
                        <div>
                            <p className="font-semibold text-[#001F3F] text-sm">Change Password</p>
                            <p className="text-xs text-gray-400 mt-0.5">Update your password regularly for security</p>
                        </div>
                        <button className="px-4 py-2 bg-white border border-gray-200 text-[#001F3F] rounded-xl font-bold text-xs hover:border-[#00A8E8]/40 hover:text-[#00A8E8] transition">
                            Change
                        </button>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-red-50 rounded-xl border border-red-100">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center text-red-500 flex-shrink-0">
                                <Trash2 size={15} />
                            </div>
                            <div>
                                <p className="font-semibold text-red-700 text-sm">Delete Account</p>
                                <p className="text-xs text-red-400 mt-0.5">Permanently remove your account and data</p>
                            </div>
                        </div>
                        <button className="px-4 py-2 bg-red-500 text-white rounded-xl font-bold text-xs hover:bg-red-600 transition">
                            Delete
                        </button>
                    </div>
                </Section>

                {/* Save */}
                <div className="flex justify-end pt-2 pb-6">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className={`flex items-center gap-2 px-7 py-3 rounded-xl font-black text-sm uppercase tracking-wide transition-all duration-200 shadow-lg disabled:opacity-60 ${saved
                            ? "bg-emerald-500 text-white shadow-emerald-200"
                            : "bg-[#00A8E8] text-white hover:bg-[#0096d1] shadow-[#00A8E8]/25 hover:-translate-y-0.5"
                            }`}
                    >
                        {saving ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                                Saving…
                            </>
                        ) : saved ? (
                            <>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                                Saved!
                            </>
                        ) : (
                            <>
                                <Save size={16} />
                                Save Settings
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
