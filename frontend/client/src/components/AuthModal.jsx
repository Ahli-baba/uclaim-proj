import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSettings } from "../contexts/SettingsContext";

function AuthModal({ isOpen, onClose, defaultMode = "login" }) {
    const navigate = useNavigate();
    const { settings } = useSettings();
    const { siteName, siteDescription } = settings;

    const [mode, setMode] = useState(defaultMode);

    const [loginData, setLoginData] = useState({ email: "", password: "" });
    const [registerData, setRegisterData] = useState({
        name: "",
        email: "",
        role: "",
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
            alert(data.message);
        } catch (err) {
            alert("Failed to resend verification email");
        }
    };

    const handleLoginSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");

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
            navigate(data.user.role === "admin" ? "/admin" : "/dashboard");
        } catch (err) {
            setError("Server error. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleRegisterSubmit = async (e) => {
        e.preventDefault();

        if (!registerData.role) return setError("Please select a role");
        if (registerData.password !== registerData.confirmPassword) return setError("Passwords do not match");
        if (registerData.role === "admin") return setError("Invalid role selected");

        setLoading(true);
        setError("");

        try {
            const res = await fetch("https://uclaim-proj-production.up.railway.app/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: registerData.name,
                    email: registerData.email,
                    role: registerData.role,
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
                <div className="px-8 mb-6">
                    <div className="flex bg-[#EAEAEA] rounded-lg p-1">
                        <button
                            onClick={() => { setMode("login"); setError(""); }}
                            className={`flex-1 py-2.5 text-sm font-bold rounded-md transition-all duration-200 ${mode === "login"
                                ? "bg-white text-[#001F3F] shadow-sm"
                                : "text-gray-500 hover:text-gray-700"
                                }`}
                        >
                            Sign In
                        </button>
                        <button
                            onClick={() => { setMode("register"); setError(""); }}
                            className={`flex-1 py-2.5 text-sm font-bold rounded-md transition-all duration-200 ${mode === "register"
                                ? "bg-white text-[#001F3F] shadow-sm"
                                : "text-gray-500 hover:text-gray-700"
                                }`}
                        >
                            Sign Up
                        </button>
                    </div>
                </div>

                {/* Form Content */}
                <div className="px-8 pb-8">
                    {error && error !== "verification" && (
                        <div className="bg-red-50 text-red-600 text-sm p-3 rounded-xl mb-4 border border-red-100">
                            {error}
                        </div>
                    )}

                    {error === "verification" && (
                        <div className="bg-yellow-50 text-yellow-700 text-sm p-4 rounded-xl mb-4 border border-yellow-100 flex flex-col gap-2">
                            <p className="leading-relaxed">Please verify your email before logging in. Check your inbox or spam for the verification link.</p>
                            <button
                                onClick={() => resendVerification(loginData.email)}
                                className="text-[#00A8E8] underline font-medium text-left w-fit"
                            >
                                Resend verification email
                            </button>
                        </div>
                    )}

                    {mode === "login" ? (
                        <>
                            <div className="mb-6 text-center">
                                <h2 className="text-2xl font-bold text-[#001F3F]">Sign In</h2>
                                <p className="text-gray-500 text-sm mt-1">Enter your credentials to access your account</p>
                            </div>

                            <form onSubmit={handleLoginSubmit} className="space-y-5">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Email Address</label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={loginData.email}
                                        onChange={handleLoginChange}
                                        required
                                        placeholder="name@email.com"
                                        className="w-full border border-gray-200 bg-gray-50 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#00A8E8] focus:bg-white transition"
                                    />
                                </div>

                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <label className="text-sm font-bold text-gray-700">Password</label>
                                        <a href="#" className="text-xs font-semibold text-[#00A8E8] hover:underline">Forgot Password?</a>
                                    </div>
                                    <input
                                        type="password"
                                        name="password"
                                        value={loginData.password}
                                        onChange={handleLoginChange}
                                        required
                                        placeholder="•••••••••••"
                                        className="w-full border border-gray-200 bg-gray-50 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#00A8E8] focus:bg-white transition"
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
                    ) : (
                        <>
                            <div className="mb-6 text-center">
                                <h2 className="text-2xl font-bold text-[#001F3F]">Get Started</h2>
                                <p className="text-gray-500 text-sm mt-1">Join the community to help others</p>
                            </div>

                            <form onSubmit={handleRegisterSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1.5">Full Name</label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={registerData.name}
                                        onChange={handleRegisterChange}
                                        required
                                        placeholder="Your Name"
                                        className="w-full border border-gray-200 bg-gray-50 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#00A8E8] focus:bg-white transition"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1.5">Email Address</label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={registerData.email}
                                        onChange={handleRegisterChange}
                                        required
                                        placeholder="name@email.com"
                                        className="w-full border border-gray-200 bg-gray-50 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#00A8E8] focus:bg-white transition"
                                    />
                                </div>

                                <div className="relative">
                                    <label className="block text-sm font-bold text-gray-700 mb-1.5">Role</label>
                                    <div className="relative">
                                        <select
                                            name="role"
                                            value={registerData.role}
                                            onChange={handleRegisterChange}
                                            required
                                            className={`w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#00A8E8] transition appearance-none cursor-pointer pr-10
                ${!registerData.role ? "text-gray-400 bg-gray-50" : "text-gray-700 bg-white"}
            `}
                                        >
                                            <option value="" disabled hidden>Select Role</option>
                                            <option value="student">Student</option>
                                            <option value="faculty">Faculty</option>
                                            <option value="staff">Staff</option>
                                        </select>

                                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-400">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1.5">Password</label>
                                    <input
                                        type="password"
                                        name="password"
                                        value={registerData.password}
                                        onChange={handleRegisterChange}
                                        required
                                        placeholder="•••••••••••"
                                        className="w-full border border-gray-200 bg-gray-50 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#00A8E8] focus:bg-white transition"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1.5">Confirm Password</label>
                                    <input
                                        type="password"
                                        name="confirmPassword"
                                        value={registerData.confirmPassword}
                                        onChange={handleRegisterChange}
                                        required
                                        placeholder="•••••••••••"
                                        className="w-full border border-gray-200 bg-gray-50 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#00A8E8] focus:bg-white transition"
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
            `}</style>
        </div>
    );
}

export default AuthModal;