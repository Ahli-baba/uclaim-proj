import { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useSettings } from "../../contexts/SettingsContext";
import { api } from "../../services/api";

function Login() {
    const navigate = useNavigate();
    const location = useLocation();
    const { settings } = useSettings();
    const redirectTo = location.state?.from || null;
    const { siteName, siteDescription } = settings;

    const [formData, setFormData] = useState({ email: "", password: "" });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const [showForgotModal, setShowForgotModal] = useState(false);
    const [forgotEmail, setForgotEmail] = useState("");
    const [forgotLoading, setForgotLoading] = useState(false);
    const [forgotSent, setForgotSent] = useState(false);
    const [forgotError, setForgotError] = useState("");

    const handleForgotSubmit = async (e) => {
        e.preventDefault();
        setForgotError("");
        try {
            setForgotLoading(true);
            await api.forgotPassword(forgotEmail);
            setForgotSent(true);
        } catch (err) {
            setForgotError(err.message || "Failed to send reset email. Please try again.");
        } finally {
            setForgotLoading(false);
        }
    };

    const handleCloseForgot = () => {
        setShowForgotModal(false);
        setForgotEmail("");
        setForgotSent(false);
        setForgotError("");
    };

    useEffect(() => {
        const token = localStorage.getItem("token");
        const user = JSON.parse(localStorage.getItem("user") || "{}");
        if (token) {
            navigate(user.role === "admin" ? "/admin" : "/dashboard");
        }
    }, [navigate]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const res = await fetch("https://uclaim-proj-production.up.railway.app/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            const data = await res.json();

            if (!res.ok) {
                if (data.needsVerification) {
                    setError(
                        <div>
                            <p>{data.message}</p>
                            <button onClick={() => resendVerification(data.email)} className="text-blue-600 underline mt-2">
                                Resend verification email
                            </button>
                        </div>
                    );
                } else {
                    setError(data.message || "Login failed");
                }
                setLoading(false);
                return;
            }

            localStorage.setItem("token", data.token);
            localStorage.setItem("user", JSON.stringify(data.user));
            if (redirectTo && data.user.role !== "admin") {
                navigate(redirectTo);
            } else {
                navigate(data.user.role === "admin" ? "/admin" : "/dashboard");
            }
        } catch (err) {
            setError("Server error. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4 relative">
            <button
                onClick={() => navigate("/")}
                className="absolute top-8 left-8 flex items-center gap-2 text-gray-500 hover:text-blue-600 transition font-medium text-sm"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Home
            </button>

            {/* Logo & Branding — uses siteName from settings */}
            <div className="flex flex-col items-center mb-8">
                <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg relative">
                    <span className="text-white font-extrabold text-3xl relative">
                        C
                        <span className="absolute left-1.5 top-0 text-white font-extrabold text-lg">U</span>
                    </span>
                </div>
                <h1 className="text-3xl font-extrabold text-blue-700 tracking-tight">{siteName}</h1>
                <p className="text-gray-500 font-medium text-center max-w-xs">{siteDescription}</p>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 w-full max-w-md p-10">
                <div className="mb-8 text-center">
                    <h2 className="text-2xl font-bold text-gray-900">Sign In</h2>
                    <p className="text-gray-500 text-sm mt-1">Enter your credentials to access your account</p>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-600 text-sm p-4 rounded-xl mb-6 border border-red-100 flex items-center gap-3">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Email Address</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            placeholder="name@university.edu"
                            className="w-full border border-gray-200 bg-gray-50 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                        />
                    </div>

                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className="text-sm font-bold text-gray-700">Password</label>
                            <button type="button" onClick={() => setShowForgotModal(true)} className="text-xs font-semibold text-blue-600 hover:underline">Forgot Password?</button>
                        </div>
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                            placeholder="••••••••"
                            className="w-full border border-gray-200 bg-gray-50 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl transition shadow-md hover:shadow-lg disabled:opacity-50 active:scale-[0.98]"
                    >
                        {loading ? "Verifying..." : "Sign In"}
                    </button>
                </form>

                <p className="text-sm text-center text-gray-500 mt-8">
                    Don't have an account?{" "}
                    <Link to="/register" className="text-blue-600 font-bold hover:underline">Create account</Link>
                </p>
            </div>

            <p className="text-gray-400 text-xs mt-12">© {new Date().getFullYear()} {siteName}. Built for Students & Faculty.</p>

            {/* ── Forgot Password Modal ── */}
            {showForgotModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl p-8">
                        {forgotSent ? (
                            <div className="text-center">
                                <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                    <svg className="w-7 h-7 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 mb-2">Check your inbox</h3>
                                <p className="text-sm text-gray-500 mb-6">If that email is registered, a password reset link has been sent. Check your spam folder too.</p>
                                <button onClick={handleCloseForgot}
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition text-sm">
                                    Done
                                </button>
                            </div>
                        ) : (
                            <>
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-lg font-bold text-gray-900">Forgot Password?</h3>
                                    <button onClick={handleCloseForgot} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-100 transition text-gray-400">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                                <p className="text-sm text-gray-500 mb-5">Enter your email and we'll send you a link to reset your password.</p>
                                {forgotError && (
                                    <div className="bg-red-50 text-red-600 text-sm p-3 rounded-xl mb-4 border border-red-100">{forgotError}</div>
                                )}
                                <form onSubmit={handleForgotSubmit} className="space-y-4">
                                    <input type="email" required value={forgotEmail} onChange={e => setForgotEmail(e.target.value)}
                                        placeholder="name@university.edu"
                                        className="w-full border border-gray-200 bg-gray-50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition" />
                                    <button type="submit" disabled={forgotLoading}
                                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl transition text-sm disabled:opacity-50">
                                        {forgotLoading ? "Sending…" : "Send Reset Link"}
                                    </button>
                                </form>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default Login;
