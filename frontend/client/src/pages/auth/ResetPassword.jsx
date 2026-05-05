import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useSettings } from "../../contexts/SettingsContext";
import { api } from "../../services/api";

function ResetPassword() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { settings } = useSettings();
    const { siteName } = settings;
    const token = searchParams.get("token");

    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        if (!token) navigate("/login");
    }, [token, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        if (newPassword !== confirmPassword) return setError("Passwords do not match");
        if (newPassword.length < 8) return setError("Password must be at least 8 characters");
        try {
            setLoading(true);
            await api.resetPassword(token, newPassword);
            setSuccess(true);
        } catch (err) {
            setError(err.message || "Failed to reset password. The link may have expired.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4 relative">
            <div className="flex flex-col items-center mb-8">
                <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg relative">
                    <span className="text-white font-extrabold text-3xl relative">
                        C
                        <span className="absolute left-1.5 top-0 text-white font-extrabold text-lg">U</span>
                    </span>
                </div>
                <h1 className="text-3xl font-extrabold text-blue-700 tracking-tight">{siteName}</h1>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 w-full max-w-md p-10">
                {success ? (
                    <div className="text-center">
                        <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Password Reset!</h2>
                        <p className="text-gray-500 text-sm mb-6">Your password has been updated successfully. You can now sign in.</p>
                        <button onClick={() => navigate("/login")}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl transition">
                            Go to Sign In
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="mb-8 text-center">
                            <h2 className="text-2xl font-bold text-gray-900">Set New Password</h2>
                            <p className="text-gray-500 text-sm mt-1">Enter a new password for your account</p>
                        </div>

                        {error && (
                            <div className="bg-red-50 text-red-600 text-sm p-4 rounded-xl mb-6 border border-red-100">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">New Password</label>
                                <input type="password" required value={newPassword} onChange={e => setNewPassword(e.target.value)}
                                    placeholder="••••••••" minLength={8}
                                    className="w-full border border-gray-200 bg-gray-50 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Confirm New Password</label>
                                <input type="password" required value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                                    placeholder="••••••••" minLength={8}
                                    className="w-full border border-gray-200 bg-gray-50 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition" />
                            </div>
                            <button type="submit" disabled={loading}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl transition shadow-md disabled:opacity-50 active:scale-[0.98]">
                                {loading ? "Resetting…" : "Reset Password"}
                            </button>
                        </form>

                        <p className="text-sm text-center text-gray-500 mt-6">
                            <Link to="/login" className="text-blue-600 font-bold hover:underline">Back to Sign In</Link>
                        </p>
                    </>
                )}
            </div>
        </div>
    );
}

export default ResetPassword;