import { useNavigate } from "react-router-dom";
import { useSettings } from "../contexts/SettingsContext";
import { useEffect, useState } from "react";
import AuthModal from "../components/AuthModal";

function LandingPage({ authModalDefault = null }) {
    const navigate = useNavigate();
    const { settings } = useSettings();
    const [scrolled, setScrolled] = useState(false);
    const [activeSection, setActiveSection] = useState('');
    const [menuOpen, setMenuOpen] = useState(false);
    const [authModal, setAuthModal] = useState({
        open: !!authModalDefault,
        mode: authModalDefault || "login"
    });

    const { siteName, siteDescription, universityName, contactEmail } = settings;

    const useScrollReveal = () => {
        useEffect(() => {
            const observer = new IntersectionObserver(
                (entries) => {
                    entries.forEach((entry) => {
                        if (entry.isIntersecting) {
                            entry.target.classList.add('revealed');
                        }
                    });
                },
                { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
            );

            const elements = document.querySelectorAll('.scroll-reveal');
            elements.forEach((el) => observer.observe(el));

            return () => observer.disconnect();
        }, []);
    };

    useScrollReveal();

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 50);

            const sections = ['about', 'how-it-works', 'features', 'final-cta'];
            const scrollPosition = window.scrollY + 150;

            for (const section of sections) {
                const element = document.getElementById(section);
                if (element) {
                    const { offsetTop, offsetHeight } = element;
                    if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
                        setActiveSection(section);
                    }
                }
            }
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleLogoClick = () => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const scrollToSection = (id) => {
        setMenuOpen(false);
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    // BALANCED NAVIGATION - 3 key sections
    const navLinks = [
        { id: 'about', label: 'Mission' },
        { id: 'how-it-works', label: 'How it Works' },
        { id: 'features', label: 'Features' },
    ];

    return (
        <div className="min-h-screen bg-[#EAEAEA] flex flex-col font-sans selection:bg-[#00A8E8] selection:text-white overflow-x-hidden">

            {/* ===== ENHANCED NAVBAR ===== */}
            <nav className="fixed top-5 left-0 right-0 z-50 px-4 md:px-8">
                <div className={`max-w-6xl mx-auto bg-white rounded-2xl shadow-lg shadow-black/5 border border-gray-100 transition-all duration-500 ${scrolled ? 'shadow-xl shadow-black/10' : ''
                    }`}>
                    <div className="px-5 md:px-6 py-3.5 flex justify-between items-center">
                        {/* Logo - Bigger with gradient text */}
                        <div
                            className="flex items-center gap-3 group cursor-pointer"
                            onClick={handleLogoClick}
                        >
                            <div className="relative">
                                <div className="absolute -inset-2 bg-[#00A8E8]/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-all duration-500 blur-md" />
                                <img
                                    src="/UClaim Logo.png"
                                    alt="UClaim Logo"
                                    className="h-11 w-auto object-contain rounded-xl relative z-10 group-hover:scale-105 group-hover:rotate-1 transition-all duration-500"
                                />
                            </div>
                            <span className="text-[22px] font-black tracking-tight bg-gradient-to-r from-[#001F3F] to-[#00A8E8] bg-clip-text text-transparent">
                                {siteName}
                            </span>
                        </div>

                        {/* Desktop Navigation - Refined pills */}
                        <div className="hidden md:flex items-center bg-[#F8F9FA] rounded-full p-1">
                            {navLinks.map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => scrollToSection(item.id)}
                                    className={`relative px-5 py-2 rounded-full text-[13px] font-bold tracking-wide transition-all duration-300 ${activeSection === item.id
                                        ? 'text-[#001F3F]'
                                        : 'text-gray-500 hover:text-[#001F3F]'
                                        }`}
                                >
                                    {activeSection === item.id && (
                                        <span className="absolute inset-0 bg-white rounded-full shadow-sm shadow-black/5" />
                                    )}
                                    <span className="relative z-10">{item.label}</span>
                                </button>
                            ))}
                        </div>

                        {/* CTA Buttons - Enhanced */}
                        <div className="hidden md:flex gap-3 items-center">
                            <button
                                onClick={() => setAuthModal({ open: true, mode: "login" })}
                                className="px-5 py-2.5 rounded-full font-semibold text-[13px] text-gray-500 hover:text-[#001F3F] transition-all duration-300 hover:bg-gray-50"
                            >
                                Sign In
                            </button>
                            <button
                                onClick={() => setAuthModal({ open: true, mode: "register" })}
                                className="px-6 py-2.5 bg-[#00A8E8] text-white rounded-full font-bold text-[13px] tracking-wide transition-all duration-300 hover:bg-[#001F3F] hover:shadow-lg hover:shadow-[#00A8E8]/20 hover:-translate-y-0.5"
                            >
                                Sign Up
                            </button>
                        </div>

                        {/* Mobile Menu Toggle */}
                        <button
                            className="md:hidden text-[#001F3F] p-2"
                            onClick={() => setMenuOpen(!menuOpen)}
                        >
                            <div className="w-5 flex flex-col gap-1">
                                <span className={`block h-0.5 bg-current transition-all duration-300 ${menuOpen ? 'rotate-45 translate-y-1.5' : ''}`} />
                                <span className={`block h-0.5 bg-current transition-all duration-300 ${menuOpen ? 'opacity-0' : ''}`} />
                                <span className={`block h-0.5 bg-current transition-all duration-300 ${menuOpen ? '-rotate-45 -translate-y-1.5' : ''}`} />
                            </div>
                        </button>
                    </div>
                </div>

                {/* Mobile Menu */}
                <div className={`md:hidden transition-all duration-500 overflow-hidden ${menuOpen ? 'max-h-96 opacity-100 mt-3' : 'max-h-0 opacity-0'
                    }`}>
                    <div className="max-w-6xl mx-auto bg-white rounded-2xl shadow-lg shadow-black/5 border border-gray-100 p-5 space-y-2">
                        {navLinks.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => scrollToSection(item.id)}
                                className={`block w-full text-left font-semibold py-3 px-4 rounded-xl transition-all ${activeSection === item.id
                                    ? 'bg-[#00A8E8]/10 text-[#00A8E8]'
                                    : 'text-gray-500 hover:bg-gray-50 hover:text-[#001F3F]'
                                    }`}
                            >
                                {item.label}
                            </button>
                        ))}
                        <div className="pt-3 flex flex-col gap-2 border-t border-gray-100 mt-3">
                            <button
                                onClick={() => { setMenuOpen(false); setAuthModal({ open: true, mode: "login" }); }}
                                className="w-full py-3 rounded-xl border border-gray-200 text-[#001F3F] font-semibold hover:bg-gray-50 transition-colors"
                            >
                                Sign In
                            </button>
                            <button
                                onClick={() => { setMenuOpen(false); setAuthModal({ open: true, mode: "register" }); }}
                                className="w-full py-3 rounded-xl bg-[#00A8E8] text-white font-bold hover:bg-[#001F3F] transition-colors"
                            >
                                Sign Up
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* ===== HERO SECTION ===== */}
            <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#001F3F] pt-28">
                <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-[#00A8E8]/10 rounded-full animate-spin-slow" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] border border-[#00A8E8]/5 rounded-full animate-spin-reverse" />

                    <div className="absolute top-[15%] left-[10%] opacity-[0.07]">
                        <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#00A8E8" strokeWidth="1.2"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" /></svg>
                    </div>
                    <div className="absolute top-[20%] right-[15%] opacity-[0.07]">
                        <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="#00A8E8" strokeWidth="1.2"><rect x="5" y="2" width="14" height="20" rx="2" /><line x1="12" y1="18" x2="12.01" y2="18" /></svg>
                    </div>
                    <div className="absolute bottom-[28%] left-[14%] opacity-[0.07]">
                        <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="#00A8E8" strokeWidth="1.2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87m-4-12a4 4 0 0 1 0 7.75" /></svg>
                    </div>
                    <div className="absolute top-[58%] right-[10%] opacity-[0.07]">
                        <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="#00A8E8" strokeWidth="1.2"><rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8m-4-4v4" /></svg>
                    </div>
                    <div className="absolute bottom-[18%] right-[20%] opacity-[0.07]">
                        <svg width="50" height="50" viewBox="0 0 24 24" fill="none" stroke="#00A8E8" strokeWidth="1.2"><path d="M3 18v-6a9 9 0 0 1 18 0v6" /><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" /></svg>
                    </div>
                    <div className="absolute top-[42%] left-[5%] opacity-[0.07]">
                        <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#00A8E8" strokeWidth="1.2"><circle cx="12" cy="12" r="3" /><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" /></svg>
                    </div>

                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] bg-[#00A8E8] rounded-full mix-blend-screen filter blur-[160px] opacity-5" />
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(0,168,232,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,168,232,0.03)_1px,transparent_1px)] bg-[size:80px_80px]" />
                </div>

                <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
                    <div className="scroll-reveal inline-flex items-center gap-2 bg-[#00A8E8]/10 border border-[#00A8E8]/20 rounded-full px-5 py-2.5 mb-8 backdrop-blur-sm">
                        <span className="w-2 h-2 bg-[#00A8E8] rounded-full" />
                        <span className="text-[#00A8E8] text-sm font-bold tracking-widest uppercase">
                            {universityName}
                        </span>
                    </div>

                    <h1 className="text-5xl lg:text-7xl font-black text-white leading-[1.1] mb-8">
                        <span className="scroll-reveal block">A Smarter Way to</span>
                        <span className="scroll-reveal block text-transparent bg-clip-text bg-gradient-to-r from-[#00A8E8] to-[#EAEAEA] mt-2">
                            Find Lost Items.
                        </span>
                    </h1>

                    <p className="scroll-reveal text-[#EAEAEA]/70 text-lg lg:text-xl max-w-2xl mx-auto mb-12 leading-relaxed">
                        {siteName} makes finding lost items easy. Report items with photos, search campus-wide listings, and claim belongings with verified proof.
                    </p>

                    <div className="scroll-reveal flex flex-col sm:flex-row gap-4 justify-center">
                        <button
                            onClick={() => setAuthModal({ open: true, mode: "register" })}
                            className="group px-8 py-4 bg-[#00A8E8] text-white text-lg rounded-2xl font-bold hover:bg-[#001F3F] transition-all duration-500 shadow-[0_0_30px_rgba(0,168,232,0.3)] hover:shadow-[0_0_40px_rgba(0,168,232,0.5)] hover:-translate-y-1 flex items-center justify-center gap-2 border-2 border-transparent hover:border-[#00A8E8] relative overflow-hidden"
                        >
                            <span className="relative z-10">Report Lost Item</span>
                            <svg className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                            <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 skew-x-12" />
                        </button>
                        <button
                            onClick={() => setAuthModal({ open: true, mode: "login" })}
                            className="px-8 py-4 bg-white/5 backdrop-blur-sm border-2 border-white/10 text-white text-lg rounded-2xl font-semibold hover:bg-white/10 hover:border-[#00A8E8]/50 transition-all duration-500 hover:shadow-[0_0_20px_rgba(0,168,232,0.2)]"
                        >
                            Browse Found Items
                        </button>
                    </div>
                </div>

                <div className="absolute bottom-0 left-0 right-0">
                    <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
                        <path d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="#EAEAEA" />
                    </svg>
                </div>
            </section>

            {/* ===== ABOUT SECTION (STREAMLINED - No duplicate cards) ===== */}
            <section id="about" className="bg-[#EAEAEA] py-16 px-6">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-12">
                        <span className="scroll-reveal text-[#00A8E8] font-black tracking-widest uppercase text-xs">Our Mission</span>
                        <h2 className="scroll-reveal text-4xl lg:text-5xl font-black text-[#001F3F] mt-4 leading-tight">
                            Bridging the Gap Between
                            <span className="block text-[#00A8E8]">Lost and Found</span>
                        </h2>
                    </div>

                    <div className="max-w-3xl mx-auto text-center">
                        <p className="scroll-reveal text-[#001F3F]/70 text-lg leading-relaxed">
                            {siteName} replaces paper logbooks and word-of-mouth with a centralized digital system — giving the {universityName} campus one secure place to report, search, and claim lost items.
                        </p>
                    </div>
                </div>
            </section>

            {/* ===== HOW IT WORKS ===== */}
            <section id="how-it-works" className="bg-[#001F3F] py-16 px-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-[linear-gradient(rgba(0,168,232,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(0,168,232,0.05)_1px,transparent_1px)] bg-[size:40px_40px]" />

                <div className="max-w-6xl mx-auto relative z-10">
                    <div className="text-center mb-16">
                        <span className="scroll-reveal text-[#00A8E8] font-black tracking-widest uppercase text-xs">Process</span>
                        <h2 className="scroll-reveal text-4xl lg:text-5xl font-black text-white mt-4 mb-6">How {siteName} Works</h2>
                        <p className="scroll-reveal text-[#EAEAEA]/60 text-lg max-w-2xl mx-auto">Four straightforward steps to reunite you with your belongings.</p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {[
                            {
                                step: "01",
                                icon: (
                                    <svg className="w-10 h-10 text-[#00A8E8]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                                    </svg>
                                ),
                                title: "Report",
                                desc: "Describe your item, upload a photo, and tag the location."
                            },
                            {
                                step: "02",
                                icon: (
                                    <svg className="w-10 h-10 text-[#00A8E8]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803a7.5 7.5 0 0010.607 10.607z" />
                                    </svg>
                                ),
                                title: "Search",
                                desc: "Browse listings by category, location, or status."
                            },
                            {
                                step: "03",
                                icon: (
                                    <svg className="w-10 h-10 text-[#00A8E8]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                ),
                                title: "Verify",
                                desc: "Submit proof of ownership for admin review."
                            },
                            {
                                step: "04",
                                icon: (
                                    <svg className="w-10 h-10 text-[#00A8E8]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
                                    </svg>
                                ),
                                title: "Pickup",
                                desc: "Collect your item at the security office."
                            },
                        ].map((item, i) => (
                            <div key={i} className="scroll-reveal group relative">
                                <div className="bg-[#001F3F] border border-[#00A8E8]/20 rounded-3xl p-8 hover:border-[#00A8E8]/50 transition-all duration-500 hover:shadow-2xl hover:shadow-[#00A8E8]/10 relative z-10 h-full group-hover:-translate-y-2">
                                    <div className="absolute -top-6 left-1/2 -translate-x-1/2">
                                        <div className="w-12 h-12 bg-[#00A8E8] rounded-full flex items-center justify-center text-white font-black text-lg shadow-lg shadow-[#00A8E8]/30 group-hover:scale-110 transition-transform duration-500">
                                            {item.step}
                                        </div>
                                    </div>
                                    <div className="pt-6 text-center">
                                        <div className="flex justify-center mb-6 group-hover:scale-110 transition-all duration-500">
                                            {item.icon}
                                        </div>
                                        <h3 className="text-white font-bold text-lg mb-4">{item.title}</h3>
                                        <p className="text-[#EAEAEA]/60 text-sm leading-relaxed">{item.desc}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ===== FEATURES ===== */}
            <section id="features" className="bg-[#EAEAEA] py-16 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <span className="scroll-reveal text-[#00A8E8] font-black tracking-widest uppercase text-xs">Capabilities</span>
                        <h2 className="scroll-reveal text-4xl lg:text-5xl font-black text-[#001F3F] mt-4 mb-6">Key Features</h2>
                        <p className="scroll-reveal text-[#001F3F]/60 text-lg max-w-2xl mx-auto">Everything you need to recover lost items efficiently.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[
                            { icon: "📸", title: "Photo Uploads", desc: "Attach clear photos when reporting an item for faster identification." },
                            { icon: "🏷️", title: "Smart Filters", desc: "Filter by item type, status, date, or campus location quickly." },
                            { icon: "🔔", title: "Instant Alerts", desc: "Get notified via email or SMS when a match is found." },
                            { icon: "🔐", title: "Verified Claims", desc: "Admins review proof of ownership before any claim is approved." },
                            { icon: "📍", title: "Campus Locations", desc: "Items tagged to specific spots: Library, Gym, Cafeteria, and more." },
                            { icon: "🔄", title: "Live Tracking", desc: "Follow your item's status: Lost → Found → Claimed." },
                        ].map((f, i) => (
                            <div
                                key={i}
                                className="scroll-reveal group bg-white p-8 rounded-2xl border border-[#EAEAEA] hover:border-[#00A8E8]/30 hover:shadow-xl hover:-translate-y-2 transition-all duration-500 cursor-default"
                            >
                                <div className="w-14 h-14 bg-[#00A8E8]/10 rounded-2xl flex items-center justify-center text-3xl mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                                    {f.icon}
                                </div>
                                <h4 className="font-bold text-[#001F3F] text-lg mb-3 group-hover:text-[#00A8E8] transition-colors duration-300">{f.title}</h4>
                                <p className="text-[#001F3F]/60 text-sm leading-relaxed">{f.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ===== FINAL CTA SECTION (STREAMLINED - Merged) ===== */}
            <section id="final-cta" className="bg-[#001F3F] py-16 px-6 relative overflow-hidden">
                <div className="absolute inset-0">
                    <div className="absolute top-0 left-1/4 w-64 h-64 bg-[#00A8E8] rounded-full mix-blend-multiply filter blur-3xl opacity-10" />
                    <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-[#00A8E8] rounded-full mix-blend-multiply filter blur-3xl opacity-10" />
                </div>

                <div className="max-w-6xl mx-auto relative z-10">
                    <div className="text-center">
                        <h2 className="scroll-reveal text-4xl lg:text-5xl font-black text-white mb-6">
                            Ready to Find What You Lost?
                        </h2>
                        <p className="scroll-reveal text-[#EAEAEA]/60 text-lg max-w-3xl mx-auto mb-10">
                            Built for the entire {universityName} campus — students, faculty, staff, and security personnel. Start reporting lost items in seconds.
                        </p>

                        {/* Strong, single CTA */}
                        <div className="scroll-reveal">
                            <button
                                onClick={() => setAuthModal({ open: true, mode: "register" })}
                                className="group px-10 py-5 bg-[#00A8E8] text-white text-lg rounded-2xl font-bold hover:bg-[#00A8E8]/90 transition-all duration-500 shadow-[0_0_30px_rgba(0,168,232,0.3)] hover:shadow-[0_0_50px_rgba(0,168,232,0.5)] hover:-translate-y-1 inline-flex items-center gap-3 relative overflow-hidden"
                            >
                                <span className="relative z-10">Create Free Account</span>
                                <svg className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                </svg>
                                <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 skew-x-12" />
                            </button>
                            <p className="text-[#EAEAEA]/40 text-sm mt-4">For registered {universityName} users only.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* ===== FOOTER ===== */}
            <footer className="bg-[#001F3F] border-t border-[#00A8E8]/10 text-[#EAEAEA]/60 py-16 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 mb-12">
                        <div>
                            <div className="flex items-center gap-3 mb-5 cursor-pointer group" onClick={handleLogoClick}>
                                <img
                                    src="/UClaim Logo.png"
                                    alt="UClaim Logo"
                                    className="h-8 w-auto object-contain rounded-lg group-hover:scale-105 transition-transform"
                                />
                                <span className="text-white font-bold text-xl group-hover:text-[#00A8E8] transition-colors">
                                    {siteName}
                                </span>
                            </div>
                            <p className="text-sm leading-relaxed">
                                A web-based Lost & Found Management System built for the {universityName} campus community.
                            </p>
                        </div>

                        <div>
                            <h4 className="text-white font-bold mb-6">Platform</h4>
                            <ul className="space-y-4">
                                <li><button onClick={() => scrollToSection('about')} className="hover:text-[#00A8E8] transition-colors text-left">About Us</button></li>
                                <li><button onClick={() => scrollToSection('how-it-works')} className="hover:text-[#00A8E8] transition-colors text-left">How it Works</button></li>
                                <li><button onClick={() => scrollToSection('features')} className="hover:text-[#00A8E8] transition-colors text-left">Features</button></li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="text-white font-bold mb-6">Contact & Support</h4>
                            <ul className="space-y-4 text-sm">
                                <li className="flex items-start gap-3">
                                    <span className="text-[#00A8E8] mt-0.5">🎓</span>
                                    <span>{universityName}</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="text-[#00A8E8] mt-0.5">📧</span>
                                    <a href={`mailto:${contactEmail}`} className="hover:text-[#00A8E8] transition-colors break-all">
                                        {contactEmail}
                                    </a>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="text-[#00A8E8] mt-0.5">ℹ️</span>
                                    <span>For item concerns, contact your campus admin or the security office directly.</span>
                                </li>
                            </ul>
                        </div>
                    </div>

                    <div className="border-t border-[#00A8E8]/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
                        <p className="text-sm">© {new Date().getFullYear()} {siteName}. All rights reserved.</p>
                        <p className="text-sm text-[#EAEAEA]/40">Made for the {universityName} campus community</p>
                    </div>
                </div>
            </footer>

            {/* ===== CSS ANIMATIONS ===== */}
            <style>{`
                @keyframes spin-slow {
                    from { transform: translate(-50%, -50%) rotate(0deg); }
                    to { transform: translate(-50%, -50%) rotate(360deg); }
                }
                @keyframes spin-reverse {
                    from { transform: translate(-50%, -50%) rotate(360deg); }
                    to { transform: translate(-50%, -50%) rotate(0deg); }
                }

                .animate-spin-slow { animation: spin-slow 20s linear infinite; }
                .animate-spin-reverse { animation: spin-reverse 25s linear infinite; }

                .scroll-reveal {
                    opacity: 0;
                    transform: translateY(40px);
                    transition: all 0.8s cubic-bezier(0.16, 1, 0.3, 1);
                }
                .scroll-reveal.revealed {
                    opacity: 1;
                    transform: translateY(0);
                }

                .scroll-reveal:nth-child(1) { transition-delay: 0.1s; }
                .scroll-reveal:nth-child(2) { transition-delay: 0.2s; }
                .scroll-reveal:nth-child(3) { transition-delay: 0.3s; }
                .scroll-reveal:nth-child(4) { transition-delay: 0.4s; }
                .scroll-reveal:nth-child(5) { transition-delay: 0.5s; }
                .scroll-reveal:nth-child(6) { transition-delay: 0.6s; }
            `}</style>

            {/* ===== AUTH MODAL ===== */}
            <AuthModal
                isOpen={authModal.open}
                onClose={() => setAuthModal({ ...authModal, open: false })}
                defaultMode={authModal.mode}
            />
        </div>
    );
}

export default LandingPage;
