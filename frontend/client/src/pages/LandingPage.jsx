import { useNavigate } from "react-router-dom";
import { useSettings } from "../contexts/SettingsContext";

function LandingPage() {
    const navigate = useNavigate();
    const { settings } = useSettings();

    const { siteName, siteDescription, universityName, contactEmail } = settings;

    const handleLogoClick = () => {
        if (window.scrollY === 0) {
            navigate(0);
        } else {
            window.scrollTo({ top: 0, behavior: "smooth" });
        }
    };

    return (
        <div className="min-h-screen bg-white flex flex-col font-sans">

            {/* Navbar */}
            <nav className="bg-white border-b border-gray-100 px-8 py-4 flex justify-between items-center sticky top-0 z-50 shadow-sm">
                <div className="flex items-center gap-2 group cursor-pointer" onClick={handleLogoClick}>
                    <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center shadow relative group-hover:scale-105 transition-transform">
                        <span className="text-white font-extrabold text-lg relative">
                            C
                            <span className="absolute left-1 top-0 text-white font-extrabold text-sm">U</span>
                        </span>
                    </div>
                    <span className="text-2xl font-extrabold text-blue-700 tracking-tight group-hover:text-blue-800 transition-colors">
                        {siteName}
                    </span>
                </div>

                <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-500">
                    <a href="#stats" className="hover:text-blue-600 transition">About</a>
                    <a href="#how-it-works" className="hover:text-blue-600 transition">How it Works</a>
                    <a href="#features" className="hover:text-blue-600 transition">Features</a>
                </div>

                <div className="flex gap-3">
                    <button onClick={() => navigate("/login")} className="px-5 py-2 text-blue-600 border border-blue-600 rounded-lg font-medium hover:bg-blue-50 transition text-sm">Sign In</button>
                    <button onClick={() => navigate("/register")} className="px-5 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition text-sm shadow">Sign Up</button>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900 text-white py-24 px-6 text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-72 h-72 bg-blue-500 opacity-20 rounded-full -translate-x-1/2 -translate-y-1/2"></div>
                <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-400 opacity-10 rounded-full translate-x-1/3 translate-y-1/3"></div>

                <div className="relative z-10 max-w-3xl mx-auto">
                    <span className="inline-block bg-white bg-opacity-20 text-white text-xs font-semibold px-4 py-1.5 rounded-full mb-6 tracking-wide uppercase">
                        🎓 {universityName}
                    </span>
                    <h1 className="text-5xl md:text-6xl font-extrabold leading-tight mb-6">
                        Lost Something? <br />
                        <span className="text-yellow-300">We'll Help You Claim It.</span>
                    </h1>
                    <p className="text-blue-100 text-lg md:text-xl max-w-2xl mx-auto mb-10">
                        {siteDescription}
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <button onClick={() => navigate("/register")} className="px-10 py-4 bg-yellow-400 text-gray-900 text-lg rounded-xl font-bold hover:bg-yellow-300 transition shadow-lg hover:-translate-y-1 transform">Get Started</button>
                        <button onClick={() => navigate("/login")} className="px-10 py-4 bg-white bg-opacity-10 border border-white text-white text-lg rounded-xl font-semibold hover:bg-opacity-20 transition">Sign In</button>
                    </div>
                </div>
            </section>

            {/* About Section */}
            <section id="stats" className="bg-white py-24 px-6">
                <div className="max-w-6xl mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                        <div>
                            <span className="text-blue-600 font-bold tracking-widest uppercase text-xs">Our Mission</span>
                            <h2 className="text-4xl font-extrabold text-gray-900 mt-3 mb-6 leading-tight">Bridging the Gap Between <br /><span className="text-blue-600">Lost and Found</span></h2>
                            <p className="text-gray-600 text-lg leading-relaxed mb-6">{siteName} was born out of a simple observation: thousands of valuable items go unclaimed in university halls every year because traditional methods are hard to track.</p>
                            <p className="text-gray-600 text-lg leading-relaxed mb-8">Our platform digitizes this process, providing a transparent, searchable, and secure database that empowers the campus community to look out for one another.</p>
                            <div className="grid grid-cols-2 gap-6">
                                <div className="border-l-4 border-blue-600 pl-4">
                                    <h4 className="text-2xl font-black text-gray-900">95%</h4>
                                    <p className="text-sm text-gray-500 font-medium">Matching Accuracy</p>
                                </div>
                                <div className="border-l-4 border-yellow-400 pl-4">
                                    <h4 className="text-2xl font-black text-gray-900">24h</h4>
                                    <p className="text-sm text-gray-500 font-medium">Avg. Recovery Time</p>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div className="bg-blue-50 p-8 rounded-3xl shadow-sm border border-blue-100 flex flex-col justify-between">
                                <div>
                                    <div className="text-3xl mb-4 text-blue-600">🛡️</div>
                                    <h4 className="font-bold text-gray-900 mb-2">Verified Claims</h4>
                                    <p className="text-sm text-gray-600 leading-relaxed">Every claim requires proof of ownership and admin verification to ensure security.</p>
                                </div>
                            </div>
                            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 mt-0 sm:mt-12 flex flex-col justify-between">
                                <div>
                                    <div className="text-3xl mb-4 text-yellow-500">🤝</div>
                                    <h4 className="font-bold text-gray-900 mb-2">Campus Trust</h4>
                                    <p className="text-sm text-gray-600 leading-relaxed">Fostering a culture of honesty and integrity specifically for the university ecosystem.</p>
                                </div>
                            </div>
                            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col justify-between">
                                <div>
                                    <div className="text-3xl mb-4 text-red-500">📍</div>
                                    <h4 className="font-bold text-gray-900 mb-2">Campus Locations</h4>
                                    <p className="text-sm text-gray-600 leading-relaxed">Precisely track items across the Library, Gym, Cafeteria, and more.</p>
                                </div>
                            </div>
                            <div className="bg-blue-50 p-8 rounded-3xl shadow-sm border border-blue-100 mt-0 sm:mt-12 flex flex-col justify-between">
                                <div>
                                    <div className="text-3xl mb-4 text-blue-600">📊</div>
                                    <h4 className="font-bold text-gray-900 mb-2">Real-Time Status</h4>
                                    <p className="text-sm text-gray-600 leading-relaxed">Monitor lost or found items as they transition through Active and Claimed statuses.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* How It Works */}
            <section id="how-it-works" className="bg-gray-50 py-24 px-6">
                <div className="max-w-5xl mx-auto text-center mb-16">
                    <h2 className="text-3xl font-extrabold text-gray-800 mb-3">How {siteName} Works</h2>
                    <p className="text-gray-500 text-base max-w-xl mx-auto">Three simple steps to reunite you with your belongings.</p>
                </div>
                <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 relative">
                    {[
                        { step: "01", icon: "📝", title: "Report an Item", desc: "Fill out a quick form describing your lost or found item with photos." },
                        { step: "02", icon: "🔍", title: "Search & Match", desc: "The system helps match lost and found listings automatically." },
                        { step: "03", icon: "✅", title: "Claim & Verify", desc: "Submit proof of ownership and retrieve your item safely." },
                    ].map((item, i) => (
                        <div key={i} className="group bg-white rounded-2xl shadow-sm p-8 text-center hover:shadow-xl hover:-translate-y-2 transition-all duration-300 relative">
                            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full">Step {item.step}</div>
                            <div className="text-5xl mb-4 mt-4 group-hover:scale-110 transition-transform">{item.icon}</div>
                            <h3 className="text-gray-800 font-bold text-lg mb-2">{item.title}</h3>
                            <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Features */}
            <section id="features" className="bg-white py-24 px-6">
                <div className="max-w-5xl mx-auto text-center mb-16">
                    <h2 className="text-3xl font-extrabold text-gray-800 mb-3">Everything You Need</h2>
                    <p className="text-gray-500 text-base max-w-xl mx-auto">A complete system built to manage lost and found items efficiently.</p>
                </div>
                <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[
                        { icon: "🔔", title: "Smart Notifications", desc: "Get instant alerts when a matching item is found." },
                        { icon: "📸", title: "Photo Uploads", desc: "Upload clear photos to make identification faster." },
                        { icon: "🏷️", title: "Category Filters", desc: "Filter by status or date to quickly find what you need." },
                        { icon: "🔐", title: "Secure Claims", desc: "Admins verify ownership before approval." },
                        { icon: "📊", title: "Admin Dashboard", desc: "Full control over claims, reports, and management." },
                        { icon: "📱", title: "Responsive Design", desc: `Access ${siteName} from any device — mobile or desktop.` },
                    ].map((f, i) => (
                        <div key={i} className="flex gap-4 p-6 bg-gray-50 rounded-2xl hover:bg-blue-50 transition group cursor-default shadow-sm">
                            <div className="text-3xl group-hover:scale-110 transition-transform">{f.icon}</div>
                            <div>
                                <h4 className="font-bold text-gray-800 mb-1 group-hover:text-blue-600 transition">{f.title}</h4>
                                <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* CTA */}
            <section className="bg-gradient-to-r from-blue-600 to-blue-800 py-20 px-6 text-center text-white">
                <h2 className="text-4xl font-extrabold mb-4">Ready to Find What You Lost?</h2>
                <button onClick={() => navigate("/register")} className="px-10 py-4 bg-yellow-400 text-gray-900 text-lg rounded-xl font-bold hover:bg-yellow-300 transition shadow-lg hover:scale-105 transform">Create Your Free Account</button>
            </section>

            {/* Footer */}
            <footer className="bg-gray-900 text-gray-400 text-sm py-16 px-6">
                <div className="max-w-6xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
                        <div className="col-span-1 md:col-span-1">
                            <div className="flex items-center gap-2 cursor-pointer group mb-6" onClick={handleLogoClick}>
                                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center relative group-hover:bg-blue-500 transition-colors">
                                    <span className="text-white font-extrabold text-base relative">
                                        C<span className="absolute left-0.5 top-0 text-white font-extrabold text-[10px]">U</span>
                                    </span>
                                </div>
                                <span className="text-white font-bold text-lg group-hover:text-blue-400 transition-colors">
                                    {siteName}
                                </span>
                            </div>
                            <p className="leading-relaxed">{siteDescription}</p>
                        </div>

                        <div>
                            <h4 className="text-white font-bold mb-6">Platform</h4>
                            <ul className="space-y-4">
                                <li><a href="#stats" className="hover:text-blue-400 transition">About Us</a></li>
                                <li><a href="#how-it-works" className="hover:text-blue-400 transition">How it Works</a></li>
                                <li><a href="#features" className="hover:text-blue-400 transition">Features</a></li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="text-white font-bold mb-6">Support</h4>
                            <ul className="space-y-4">
                                <li><a href="#" className="hover:text-white transition">Help Center</a></li>
                                <li><a href="#" className="hover:text-white transition">Privacy Policy</a></li>
                                <li><a href="#" className="hover:text-white transition">Terms of Use</a></li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="text-white font-bold mb-6">Contact</h4>
                            <ul className="space-y-4 text-xs">
                                <li className="flex items-center gap-3">
                                    <span>🎓</span>
                                    {universityName}
                                </li>
                                {/* contactEmail is a mailto link — admin sets it in General Configuration */}
                                <li className="flex items-center gap-3">
                                    <span>📧</span>
                                    <a
                                        href={`mailto:${contactEmail}`}
                                        className="hover:text-blue-400 transition break-all"
                                    >
                                        {contactEmail}
                                    </a>
                                </li>
                            </ul>
                        </div>
                    </div>

                    <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
                        <p>© {new Date().getFullYear()} {siteName}. All rights reserved.</p>
                        <div className="flex gap-6 text-xl">
                            <a href="#" className="hover:text-white transition">🌐</a>
                            <a href="#" className="hover:text-white transition">📱</a>
                            <a href="#" className="hover:text-white transition">💬</a>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}

export default LandingPage;
