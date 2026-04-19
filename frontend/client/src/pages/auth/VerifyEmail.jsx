import { useEffect, useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";

export default function VerifyEmail() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState("verifying"); // verifying | success | error
    const [message, setMessage] = useState("");

    useEffect(() => {
        const token = searchParams.get("token");

        if (!token) {
            setStatus("error");
            setMessage("No verification token found. Please check your email link.");
            return;
        }

        const verify = async () => {
            try {
                const res = await fetch("http://localhost:5001/api/auth/verify-email", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ token }),
                });

                const data = await res.json();

                if (res.ok) {
                    setStatus("success");
                    setMessage(data.message || "Email verified successfully!");
                    // Redirect to login after 3 seconds
                    setTimeout(() => navigate("/login"), 3000);
                } else {
                    setStatus("error");
                    setMessage(data.message || "Verification failed. The link may have expired.");
                }
            } catch (err) {
                setStatus("error");
                setMessage("Could not connect to server. Please try again.");
            }
        };

        verify();
    }, [searchParams, navigate]);

    return (
        <div style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#f9fafb",
            fontFamily: "Arial, sans-serif"
        }}>
            <div style={{
                background: "white",
                borderRadius: "12px",
                padding: "48px 40px",
                boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
                maxWidth: "440px",
                width: "100%",
                textAlign: "center"
            }}>
                {/* Logo */}
                <div style={{
                    width: "56px", height: "56px",
                    background: "#4f46e5",
                    borderRadius: "12px",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    margin: "0 auto 16px",
                    fontSize: "24px", color: "white", fontWeight: "bold"
                }}>
                    e
                </div>
                <h1 style={{ color: "#4f46e5", margin: "0 0 4px", fontSize: "24px" }}>UClaim</h1>
                <p style={{ color: "#6b7280", margin: "0 0 32px", fontSize: "14px" }}>Lost & Found Management</p>

                {/* Verifying State */}
                {status === "verifying" && (
                    <>
                        <div style={{
                            width: "48px", height: "48px",
                            border: "4px solid #e5e7eb",
                            borderTop: "4px solid #4f46e5",
                            borderRadius: "50%",
                            animation: "spin 1s linear infinite",
                            margin: "0 auto 20px"
                        }} />
                        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                        <h2 style={{ color: "#111827", marginBottom: "8px" }}>Verifying your email...</h2>
                        <p style={{ color: "#6b7280" }}>Please wait a moment.</p>
                    </>
                )}

                {/* Success State */}
                {status === "success" && (
                    <>
                        <div style={{
                            width: "64px", height: "64px",
                            background: "#d1fae5",
                            borderRadius: "50%",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            margin: "0 auto 20px",
                            fontSize: "32px"
                        }}>
                            ✅
                        </div>
                        <h2 style={{ color: "#111827", marginBottom: "8px" }}>Email Verified!</h2>
                        <p style={{ color: "#6b7280", marginBottom: "24px" }}>{message}</p>
                        <p style={{ color: "#9ca3af", fontSize: "14px", marginBottom: "20px" }}>
                            Redirecting you to login in 3 seconds...
                        </p>
                        <Link to="/login" style={{
                            display: "inline-block",
                            background: "#4f46e5", color: "white",
                            padding: "12px 28px", borderRadius: "8px",
                            textDecoration: "none", fontWeight: "bold"
                        }}>
                            Go to Login
                        </Link>
                    </>
                )}

                {/* Error State */}
                {status === "error" && (
                    <>
                        <div style={{
                            width: "64px", height: "64px",
                            background: "#fee2e2",
                            borderRadius: "50%",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            margin: "0 auto 20px",
                            fontSize: "32px"
                        }}>
                            ❌
                        </div>
                        <h2 style={{ color: "#111827", marginBottom: "8px" }}>Verification Failed</h2>
                        <p style={{ color: "#6b7280", marginBottom: "24px" }}>{message}</p>
                        <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
                            <Link to="/login" style={{
                                display: "inline-block",
                                background: "#4f46e5", color: "white",
                                padding: "12px 24px", borderRadius: "8px",
                                textDecoration: "none", fontWeight: "bold"
                            }}>
                                Back to Login
                            </Link>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
