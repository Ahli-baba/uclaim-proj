import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useSettings } from "../../contexts/SettingsContext";

function Register() {
    const navigate = useNavigate();
    const { settings } = useSettings();
    const { siteName, siteDescription } = settings;

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        role: "student",
        password: "",
        confirmPassword: "",
    });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.role) return setError("Please select a role");
        if (formData.password !== formData.confirmPassword) return setError("Passwords do not match");
        if (formData.role === "admin") return setError("Invalid role selected");

        setLoading(true);
        setError("");

        try {
            const res = await fetch("https://uclaim-proj-production.up.railway.app/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: formData.name,
                    email: formData.email,
                    role: formData.role,
                    password: formData.password,
                }),
            });

            const data = await res.json();
            if (!res.ok) {
                setError(data.message || "Registration failed");
            } else {
                navigate("/login");
            }
        } catch (err) {
            setError("Server error. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4 py-12 relative">
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
                    <h2 className="text-2xl font-bold text-gray-900">Get Started</h2>
                    <p className="text-gray-500 text-sm mt-1">Join the community to help others</p>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-600 text-sm p-4 rounded-xl mb-6 border border-red-100">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1.5">Full Name</label>
                        <input type="text" name="name" value={formData.name} onChange={handleChange} required placeholder="Your Name"
                            className="w-full border border-gray-200 bg-gray-50 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition" />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1.5">Email Address</label>
                        <input type="email" name="email" value={formData.email} onChange={handleChange} required placeholder="name@email.com"
                            className="w-full border border-gray-200 bg-gray-50 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition" />
                    </div>

                    <div className="relative">
                        <label className="block text-sm font-bold text-gray-700 mb-1.5">Role</label>
                        <div className="relative">
                            <select name="role" value={formData.role} onChange={handleChange} required
                                className="w-full border border-gray-200 bg-gray-50 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition appearance-none cursor-pointer pr-10">
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
                        <input type="password" name="password" value={formData.password} onChange={handleChange} required placeholder="••••••••••••"
                            className="w-full border border-gray-200 bg-gray-50 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition" />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1.5">Confirm Password</label>
                        <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} required placeholder="••••••••••••"
                            className="w-full border border-gray-200 bg-gray-50 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition" />
                    </div>

                    <button type="submit" disabled={loading}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl transition shadow-md hover:shadow-lg disabled:opacity-50 active:scale-[0.98] mt-4">
                        {loading ? "Creating Account..." : "Create Account"}
                    </button>
                </form>

                <p className="text-sm text-center text-gray-500 mt-8">
                    Already have an account?{" "}
                    <Link to="/login" className="text-blue-600 font-bold hover:underline">Sign In</Link>
                </p>
            </div>

            <p className="text-gray-400 text-xs mt-12">© {new Date().getFullYear()} {siteName}. For the university community.</p>
        </div>
    );
}

export default Register;
