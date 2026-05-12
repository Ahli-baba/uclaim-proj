import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSettings } from "../contexts/SettingsContext";
import Swal from "sweetalert2";

function ResetPasswordForm({ token, onClose }) {
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (!newPassword.trim() && !confirmPassword.trim()) {
            setError("Please enter your new password and confirm it.");
            return;
        }
        if (!newPassword.trim()) {
            setError("Please enter your new password.");
            return;
        }
        if (!confirmPassword.trim()) {
            setError("Please confirm your new password.");
            return;
        }
        if (newPassword !== confirmPassword) return setError("Passwords do not match.");
        if (newPassword.length < 8) return setError("Password must be at least 8 characters.");

        try {
            setLoading(true);
            const res = await fetch("https://uclaim-proj-production.up.railway.app/api/auth/reset-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token, newPassword }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Failed to reset password");
            setSuccess(true);
        } catch (err) {
            setError(err.message || "Failed to reset password. The link may have expired.");
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="text-center py-4">
                <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
                <h2 className="text-2xl font-bold text-[#001F3F] mb-2">Password Reset!</h2>
                <p className="text-gray-500 text-sm mb-6">Your password has been updated. You can now sign in.</p>
                <button onClick={onClose}
                    className="w-full bg-[#00A8E8] hover:bg-[#0090c9] text-white font-bold py-4 rounded-xl transition shadow-md">
                    Go to Sign In
                </button>
            </div>
        );
    }

    return (
        <>
            <div className="mb-8 text-center">
                <h2 className="text-2xl font-bold text-[#001F3F]">Set New Password</h2>
                <p className="text-gray-500 text-sm mt-2">Enter a new password for your account</p>
            </div>
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3.5 mb-5 flex items-start gap-3 animate-fade-in">
                    <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <svg className="w-3 h-3 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                        </svg>
                    </div>
                    <div className="flex-1">
                        <p className="text-sm font-semibold text-red-700 leading-snug">{error}</p>
                    </div>
                    <button
                        onClick={() => setError("")}
                        className="text-red-400 hover:text-red-600 transition-colors flex-shrink-0"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">New Password</label>
                    <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)}
                        placeholder="Enter your new password"
                        className={`w-full border bg-gray-50 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#00A8E8] focus:bg-white transition ${error && !newPassword.trim() ? "border-red-300 bg-red-50" : "border-gray-200"}`} />
                </div>
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Confirm New Password</label>
                    <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                        placeholder="Enter your new password again to confirm"
                        className={`w-full border bg-gray-50 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#00A8E8] focus:bg-white transition ${error && !confirmPassword.trim() ? "border-red-300 bg-red-50" : "border-gray-200"}`} />
                </div>
                <button type="submit" disabled={loading}
                    className="w-full bg-[#00A8E8] hover:bg-[#0090c9] text-white font-bold py-4 rounded-xl transition shadow-md disabled:opacity-50 active:scale-[0.98]">
                    {loading ? "Resetting…" : "Reset Password"}
                </button>
            </form>
        </>
    );
}

function ForgotPasswordForm({ setMode }) {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (!email.trim()) {
            setError("Please enter your registered email address.");
            return;
        }

        setLoading(true);
        try {
            const res = await fetch("https://uclaim-proj-production.up.railway.app/api/auth/forgot-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Failed to send reset email");
            setSent(true);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <div className="mb-8 text-center">
                <h2 className="text-2xl font-bold text-[#001F3F]">Forgot Password?</h2>
                <p className="text-gray-500 text-sm mt-2">Enter your email and we'll send you a reset link</p>
            </div>

            {sent ? (
                <div className="text-center">
                    <div className="bg-blue-50 text-[#00A8E8] text-sm p-4 rounded-xl border border-blue-100 text-center">
                        📩 A password recovery link has been sent. Please check your inbox and spam folder.
                    </div>
                    <p className="text-gray-400 text-xs mt-4">
                        Didn't receive it?{" "}
                        <button
                            type="button"
                            onClick={() => { setSent(false); setEmail(""); }}
                            className="text-[#00A8E8] underline underline-offset-2 hover:text-[#0090c9] transition"
                        >
                            Send again
                        </button>
                    </p>
                </div>
            ) : (
                <>
                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-xl p-3.5 mb-5 flex items-start gap-3 animate-fade-in">
                            <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <svg className="w-3 h-3 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                                </svg>
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-semibold text-red-700 leading-snug">{error}</p>
                            </div>
                            <button
                                onClick={() => setError("")}
                                className="text-red-400 hover:text-red-600 transition-colors flex-shrink-0"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    )}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Email Address</label>
                            <input
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                placeholder="Enter your registered email address"
                                className={`w-full border bg-gray-50 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#00A8E8] focus:bg-white transition ${error && !email.trim() ? "border-red-300 bg-red-50" : "border-gray-200"}`}
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-[#00A8E8] hover:bg-[#0090c9] text-white font-bold py-4 rounded-xl transition shadow-md disabled:opacity-50"
                        >
                            {loading ? "Sending..." : "Reset Password"}
                        </button>
                    </form>
                </>
            )}

        </>
    );
}
function AuthModal({ isOpen, onClose, defaultMode = "login", resetToken = null }) {
    const navigate = useNavigate();
    const { settings } = useSettings();
    const { siteName, siteDescription } = settings;

    const [mode, setMode] = useState(defaultMode);

    const [loginData, setLoginData] = useState({ email: "", password: "" });
    const [registerData, setRegisterData] = useState({
        name: "",
        email: "",
        role: "student",
        password: "",
        confirmPassword: "",
    });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setMode(defaultMode);
            setError("");
            setLoading(false);
        }
    }, [isOpen, defaultMode]);

    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === "Escape") onClose();
        };
        if (isOpen) {
            document.addEventListener("keydown", handleEscape);
            document.body.style.overflow = "hidden";
        }
        return () => {
            document.removeEventListener("keydown", handleEscape);
            document.body.style.overflow = "unset";
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const handleLoginChange = (e) => {
        setLoginData({ ...loginData, [e.target.name]: e.target.value });
    };

    const handleRegisterChange = (e) => {
        setRegisterData({ ...registerData, [e.target.name]: e.target.value });
    };

    const resendVerification = async (email) => {
        try {
            const res = await fetch("https://uclaim-proj-production.up.railway.app/api/auth/resend-verification", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });
            const data = await res.json();
            Swal.fire({
                icon: "success",
                title: "Email Sent",
                text: data.message,
                confirmButtonColor: "#00A8E8",
                borderRadius: "1rem",
            });
        } catch (err) {
            Swal.fire({
                icon: "error",
                title: "Failed",
                text: "Failed to resend verification email. Please try again.",
                confirmButtonColor: "#00A8E8",
            });
        }
    };

    const handleLoginSubmit = async (e) => {
        e.preventDefault();
        setError("");

        // Custom validation
        if (!loginData.email.trim() && !loginData.password.trim()) {
            setError("Please enter your email address and password.");
            return;
        }
        if (!loginData.email.trim()) {
            setError("Please enter your email address.");
            return;
        }
        if (!loginData.password.trim()) {
            setError("Please enter your password.");
            return;
        }

        setLoading(true);

        try {
            const res = await fetch("https://uclaim-proj-production.up.railway.app/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(loginData),
            });

            const data = await res.json();

            if (!res.ok) {
                if (data.needsVerification) {
                    setError("verification");
                } else {
                    setError(data.message || "Login failed");
                }
                setLoading(false);
                return;
            }

            localStorage.setItem("token", data.token);
            localStorage.setItem("user", JSON.stringify(data.user));
            onClose();
            const redirect = sessionStorage.getItem("redirectAfterLogin");
            sessionStorage.removeItem("redirectAfterLogin");
            navigate(redirect || (data.user.role === "admin" ? "/admin" : "/dashboard"));
        } catch (err) {
            setError("Server error. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleRegisterSubmit = async (e) => {
        e.preventDefault();
        setError("");

        // Field-by-field validation
        const missingFields = [];
        if (!registerData.name.trim()) missingFields.push("Full Name");
        if (!registerData.email.trim()) missingFields.push("Email Address");
        if (!registerData.password) missingFields.push("Password");
        if (!registerData.confirmPassword) missingFields.push("Confirm Password");

        if (missingFields.length > 0) {
            if (missingFields.length === 1) {
                setError(`Please enter your ${missingFields[0]}.`);
            } else if (missingFields.length === 2) {
                setError(`Please enter your ${missingFields.join(" and ")}.`);
            } else {
                const last = missingFields.pop();
                setError(`Please enter your ${missingFields.join(", ")} and ${last}.`);
            }
            return;
        }

        if (registerData.password !== registerData.confirmPassword) return setError("Passwords do not match.");
        if (registerData.password.length < 8) return setError("Password must be at least 8 characters.");

        setLoading(true);

        try {
            const res = await fetch("https://uclaim-proj-production.up.railway.app/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: registerData.name,
                    email: registerData.email,
                    role: "student",
                    password: registerData.password,
                }),
            });

            const data = await res.json();
            if (!res.ok) {
                setError(data.message || "Registration failed");
            } else {
                setMode("login");
                setError("");
                setLoginData({ ...loginData, email: registerData.email });
                Swal.fire({
                    icon: "success",
                    title: "Account Created!",
                    text: "Please check your email to verify your account before signing in.",
                    confirmButtonColor: "#00A8E8",
                    confirmButtonText: "Got it",
                });
            }
        } catch (err) {
            setError("Server error. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-[#001F3F]/60 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md mx-4 overflow-hidden animate-modal-in max-h-[90vh] overflow-y-auto">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors z-10"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                {/* Logo Header - Using UClaim Logo.png */}
                <div className="pt-8 pb-2 px-8 text-center">
                    <div className="flex justify-center mb-3">
                        <img
                            src="/UClaim Logo.png"
                            alt="UClaim"
                            className="h-14 w-auto object-contain"
                        />
                    </div>
                    <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-[#001F3F] to-[#00A8E8] bg-clip-text text-transparent">
                        {siteName}
                    </h1>
                    <p className="text-gray-500 font-medium text-center text-sm mt-1 max-w-xs mx-auto">
                        {siteDescription}
                    </p>
                </div>

                {/* Sign In / Sign Up Tabs */}
                {mode !== "reset" && <div className="px-8 mb-6">
                    <div className="flex bg-[#EAEAEA] rounded-lg p-1">
                        <button
                            onClick={() => { setMode("login"); setError(""); setLoginData({ email: "", password: "" }); }}
                            className={`flex-1 py-2.5 text-sm font-bold rounded-md transition-all duration-200 ${mode === "login"
                                ? "bg-white text-[#001F3F] shadow-sm"
                                : "text-gray-500 hover:text-gray-700"
                                }`}
                        >
                            Sign In
                        </button>
                        <button
                            onClick={() => { setMode("register"); setError(""); setRegisterData({ name: "", email: "", role: "", password: "", confirmPassword: "" }); }}
                            className={`flex-1 py-2.5 text-sm font-bold rounded-md transition-all duration-200 ${mode === "register"
                                ? "bg-white text-[#001F3F] shadow-sm"
                                : "text-gray-500 hover:text-gray-700"
                                }`}
                        >
                            Sign Up
                        </button>
                    </div>
                </div>}

                {/* Form Content */}
                <div className="px-8 pb-8">
                    {error === "verification" && (
                        <div className="bg-yellow-50 text-yellow-700 text-sm p-4 rounded-xl mb-4 border border-yellow-100 flex flex-col gap-2">
                            <p className="leading-relaxed">Please verify your email before logging in. Check your inbox or spam for the verification link.</p>
                            <button
                                onClick={() => resendVerification(loginData.email)}
                                className="text-[#00A8E8] underline font-medium text-center w-full"
                            >
                                Resend verification email
                            </button>
                        </div>
                    )}

                    {mode === "reset" ? (
                        <ResetPasswordForm token={resetToken} onClose={onClose} />
                    ) : mode === "login" ? (
                        <>
                            <div className="mb-6 text-center">
                                <h2 className="text-2xl font-bold text-[#001F3F]">Sign In</h2>
                                <p className="text-gray-500 text-sm mt-1">Enter your credentials to access your account</p>
                            </div>

                            {error && error !== "verification" && (
                                <div className="bg-red-50 border border-red-200 rounded-xl p-3.5 mb-5 flex items-start gap-3 animate-fade-in">
                                    <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <svg className="w-3 h-3 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                                        </svg>
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-semibold text-red-700 leading-snug">{error}</p>
                                    </div>
                                    <button
                                        onClick={() => setError("")}
                                        className="text-red-400 hover:text-red-600 transition-colors flex-shrink-0"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                            )}

                            <form onSubmit={handleLoginSubmit} className="space-y-5">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Email Address</label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={loginData.email}
                                        onChange={handleLoginChange}
                                        placeholder="Enter your email address"
                                        className={`w-full border bg-gray-50 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#00A8E8] focus:bg-white transition ${error && !loginData.email.trim() ? "border-red-300 bg-red-50" : "border-gray-200"}`}
                                    />
                                </div>

                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <label className="text-sm font-bold text-gray-700">Password</label>
                                        <button type="button" onClick={() => { setMode("forgot"); setError(""); }} className="text-xs font-semibold text-[#00A8E8] hover:underline">Forgot Password?</button>
                                    </div>
                                    <input
                                        type="password"
                                        name="password"
                                        value={loginData.password}
                                        onChange={handleLoginChange}
                                        placeholder="Enter your password"
                                        className={`w-full border bg-gray-50 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#00A8E8] focus:bg-white transition ${error && !loginData.password.trim() ? "border-red-300 bg-red-50" : "border-gray-200"}`}
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-[#00A8E8] hover:bg-[#0090c9] text-white font-bold py-4 rounded-xl transition shadow-md hover:shadow-lg disabled:opacity-50 active:scale-[0.98]"
                                >
                                    {loading ? "Verifying..." : "Sign In"}
                                </button>
                            </form>

                            <p className="text-sm text-center text-gray-500 mt-6">
                                Don't have an account?{" "}
                                <button
                                    onClick={() => { setMode("register"); setError(""); }}
                                    className="text-[#00A8E8] font-bold hover:underline"
                                >
                                    Create account
                                </button>
                            </p>
                        </>
                    ) : mode === "forgot" ? (
                        <ForgotPasswordForm setMode={setMode} />
                    ) : (
                        <>
                            <div className="mb-6 text-center">
                                <h2 className="text-2xl font-bold text-[#001F3F]">Get Started</h2>
                                <p className="text-gray-500 text-sm mt-1">Join the community to help others</p>
                            </div>

                            {error && (
                                <div className="bg-red-50 border border-red-200 rounded-xl p-3.5 mb-5 flex items-start gap-3 animate-fade-in">
                                    <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <svg className="w-3 h-3 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                                        </svg>
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-semibold text-red-700 leading-snug">{error}</p>
                                    </div>
                                    <button
                                        onClick={() => setError("")}
                                        className="text-red-400 hover:text-red-600 transition-colors flex-shrink-0"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                            )}

                            <form onSubmit={handleRegisterSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1.5">Full Name</label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={registerData.name}
                                        onChange={handleRegisterChange}
                                        placeholder="Enter your full name"
                                        className={`w-full border bg-gray-50 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#00A8E8] focus:bg-white transition ${error && !registerData.name.trim() ? "border-red-300 bg-red-50" : "border-gray-200"}`}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1.5">Email Address</label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={registerData.email}
                                        onChange={handleRegisterChange}
                                        placeholder="Enter your email address"
                                        className={`w-full border bg-gray-50 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#00A8E8] focus:bg-white transition ${error && !registerData.email.trim() ? "border-red-300 bg-red-50" : "border-gray-200"}`}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1.5">Password</label>
                                    <input
                                        type="password"
                                        name="password"
                                        value={registerData.password}
                                        onChange={handleRegisterChange}
                                        placeholder="Enter your password (min. 8 characters)"
                                        className={`w-full border bg-gray-50 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#00A8E8] focus:bg-white transition ${error && !registerData.password ? "border-red-300 bg-red-50" : "border-gray-200"}`}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1.5">Confirm Password</label>
                                    <input
                                        type="password"
                                        name="confirmPassword"
                                        value={registerData.confirmPassword}
                                        onChange={handleRegisterChange}
                                        placeholder="Enter your password again to confirm"
                                        className={`w-full border bg-gray-50 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#00A8E8] focus:bg-white transition ${error && !registerData.confirmPassword ? "border-red-300 bg-red-50" : "border-gray-200"}`}
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-[#00A8E8] hover:bg-[#0090c9] text-white font-bold py-3.5 rounded-xl transition shadow-md hover:shadow-lg disabled:opacity-50 active:scale-[0.98] mt-2"
                                >
                                    {loading ? "Creating Account..." : "Create Account"}
                                </button>
                            </form>

                            <p className="text-sm text-center text-gray-500 mt-6">
                                Already have an account?{" "}
                                <button
                                    onClick={() => { setMode("login"); setError(""); }}
                                    className="text-[#00A8E8] font-bold hover:underline"
                                >
                                    Sign In
                                </button>
                            </p>
                        </>
                    )}
                </div>
            </div>

            <style>{`
                @keyframes modal-in {
                    from {
                        opacity: 0;
                        transform: scale(0.95) translateY(10px);
                    }
                    to {
                        opacity: 1;
                        transform: scale(1) translateY(0);
                    }
                }
                .animate-modal-in {
                    animation: modal-in 0.3s ease-out forwards;
                }
                @keyframes fade-in {
                    from { opacity: 0; transform: translateY(-4px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in {
                    animation: fade-in 0.2s ease-out forwards;
                }
            `}</style>
        </div>
    );
}

export default AuthModal;