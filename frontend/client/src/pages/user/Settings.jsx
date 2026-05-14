import { useState } from "react";
import Swal from "sweetalert2";
import api from "../../services/api";
import {
    Moon, Sun, Type, Palette, Eye, Monitor, Lock, AlertTriangle
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
    // eslint-disable-next-line no-unused-vars

    // Password change modal states
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [passwordForm, setPasswordForm] = useState({ current: "", new: "", confirm: "" });
    const [passwordError, setPasswordError] = useState("");
    const [changingPassword, setChangingPassword] = useState(false);

    const [settings, setSettings] = useState(() => {
        const s = localStorage.getItem("uclaim_settings");
        return s ? JSON.parse(s) : {
            darkMode: false,
            dyslexiaFont: false,
            colorBlindMode: false,
            highContrast: false,
            fontSize: "medium"
        };
    });

    const set = (key, value) => {
        const next = { ...settings, [key]: value };
        setSettings(next);
        localStorage.setItem("uclaim_settings", JSON.stringify(next));
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        setPasswordError("");

        if (passwordForm.new.length < 6) {
            setPasswordError("New password must be at least 6 characters");
            return;
        }
        if (passwordForm.new !== passwordForm.confirm) {
            setPasswordError("Passwords do not match");
            return;
        }

        try {
            setChangingPassword(true);
            await api.changePassword({
                currentPassword: passwordForm.current,
                newPassword: passwordForm.new
            });

            setShowPasswordModal(false);
            setPasswordForm({ current: "", new: "", confirm: "" });
            await Swal.fire({
                icon: "success",
                title: "Password Changed!",
                text: "Your password has been updated successfully.",
                confirmButtonColor: "#00A8E8",
                borderRadius: "1rem",
                customClass: {
                    popup: "rounded-2xl",
                    confirmButton: "rounded-xl font-bold"
                }
            });
        } catch (err) {
            setPasswordError(err.message || "Failed to change password");
        } finally {
            setChangingPassword(false);
        }
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
                </Section>

                {/* Account Security */}
                <Section icon={<Lock size={18} />} title="Account Security" description="Manage your account security">
                    <div className="flex items-center justify-between p-4 bg-[#F5F6F8] rounded-xl border border-gray-100">
                        <div>
                            <p className="font-semibold text-[#001F3F] text-sm">Change Password</p>
                            <p className="text-xs text-gray-400 mt-0.5">Update your password regularly for security</p>
                        </div>
                        <button
                            onClick={() => setShowPasswordModal(true)}
                            className="px-4 py-2 bg-white border border-gray-200 text-[#001F3F] rounded-xl font-bold text-xs hover:border-[#00A8E8]/40 hover:text-[#00A8E8] transition"
                        >
                            Change
                        </button>
                    </div>

                </Section>

            </div>

            {/* ─── Change Password Modal ─────────────────────────────────────── */}
            {showPasswordModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowPasswordModal(false)} />
                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                        <div className="px-6 py-5 border-b border-gray-100">
                            <h3 className="text-lg font-black text-[#001F3F]">Change Password</h3>
                            <p className="text-xs text-gray-400 mt-1">Enter your current password and a new one</p>
                        </div>
                        <form onSubmit={handleChangePassword} className="p-6 space-y-4">
                            {passwordError && (
                                <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-xs font-semibold text-red-600 flex items-center gap-2">
                                    <AlertTriangle size={14} />
                                    {passwordError}
                                </div>
                            )}
                            <div>
                                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">Current Password</label>
                                <input
                                    type="password"
                                    value={passwordForm.current}
                                    onChange={e => setPasswordForm({ ...passwordForm, current: e.target.value })}
                                    required
                                    className="w-full bg-[#F5F6F8] border border-gray-200 px-4 py-2.5 rounded-xl text-sm font-medium text-[#001F3F] focus:outline-none focus:ring-2 focus:ring-[#00A8E8]/20 focus:border-[#00A8E8] transition-all"
                                />
                            </div>
                            <div>
                                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">New Password</label>
                                <input
                                    type="password"
                                    value={passwordForm.new}
                                    onChange={e => setPasswordForm({ ...passwordForm, new: e.target.value })}
                                    required
                                    minLength={6}
                                    className="w-full bg-[#F5F6F8] border border-gray-200 px-4 py-2.5 rounded-xl text-sm font-medium text-[#001F3F] focus:outline-none focus:ring-2 focus:ring-[#00A8E8]/20 focus:border-[#00A8E8] transition-all"
                                />
                            </div>
                            <div>
                                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">Confirm New Password</label>
                                <input
                                    type="password"
                                    value={passwordForm.confirm}
                                    onChange={e => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
                                    required
                                    className="w-full bg-[#F5F6F8] border border-gray-200 px-4 py-2.5 rounded-xl text-sm font-medium text-[#001F3F] focus:outline-none focus:ring-2 focus:ring-[#00A8E8]/20 focus:border-[#00A8E8] transition-all"
                                />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button
                                    type="submit"
                                    disabled={changingPassword}
                                    className="flex-1 bg-[#00A8E8] text-white py-3 rounded-xl font-bold text-sm hover:bg-[#001F3F] transition-all disabled:opacity-50"
                                >
                                    {changingPassword ? "Changing…" : "Change Password"}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowPasswordModal(false)}
                                    className="flex-1 bg-[#F5F6F8] text-gray-500 py-3 rounded-xl font-bold text-sm hover:bg-gray-200 transition-all"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
}