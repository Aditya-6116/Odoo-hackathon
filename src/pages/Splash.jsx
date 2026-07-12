/**
 * -------------------------------------------------------
 * File: pages/Splash.jsx
 * Purpose: Splash page skeleton.
 * Module: Pages
 *
 * Description: Provides the initial splash page placeholder.
 *
 * TODO: Build the splash page interface.
 * -------------------------------------------------------
 */

function Splash() {
    return (
        <div style={{
            minHeight: "100vh",
            display: "grid",
            placeItems: "center",
            padding: "32px",
        }}>
            <main style={{
                width: "min(920px, 100%)",
                background: "#ffffff",
                border: "1px solid #e3e8f2",
                borderRadius: "8px",
                padding: "40px",
                boxShadow: "0 18px 50px rgba(23, 32, 51, 0.08)",
            }}>
                <p style={{
                    margin: "0 0 12px",
                    color: "#4f6f52",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    fontSize: "13px",
                }}>
                    Odoo Hackathon
                </p>
                <h1 style={{
                    margin: "0 0 16px",
                    fontSize: "clamp(36px, 6vw, 64px)",
                    lineHeight: 1,
                }}>
                    ActivoTrack
                </h1>
                <p style={{
                    margin: "0 0 28px",
                    maxWidth: "680px",
                    color: "#536070",
                    fontSize: "18px",
                    lineHeight: 1.6,
                }}>
                    A workspace for tracking organizational assets, allocations, bookings,
                    maintenance requests, reports, and notifications.
                </p>
                <div style={{
                    display: "flex",
                    gap: "12px",
                    flexWrap: "wrap",
                }}>
                    <a href="/dashboard" style={buttonStyle}>
                        Open Dashboard
                    </a>
                    <a href="/assets" style={secondaryButtonStyle}>
                        View Assets
                    </a>
                </div>
            </main>
        </div>
    );
}

const buttonStyle = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "44px",
    padding: "0 18px",
    borderRadius: "6px",
    background: "#284b63",
    color: "#ffffff",
    textDecoration: "none",
    fontWeight: 700,
};

const secondaryButtonStyle = {
    ...buttonStyle,
    background: "#eef3f1",
    color: "#284b63",
};

export default Splash;
