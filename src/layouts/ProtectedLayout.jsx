import Navbar from "./Navbar";
import Sidebar from "./Sidebar";

/**
 * -------------------------------------------------------
 * File: layouts/ProtectedLayout.jsx
 * Purpose: Protected layout component skeleton.
 * Module: Layout Components
 *
 * Description: Provides a layout placeholder for authenticated app sections.
 *
 * TODO: Build the protected layout component.
 * -------------------------------------------------------
 */

function ProtectedLayout({ activeItem, children }) {
    return (
        <div className="dashboard-shell">
            <Navbar />

            <div className="dashboard-layout">
                <Sidebar activeItem={activeItem} />
                <main className="dashboard-main">{children}</main>
            </div>
        </div>
    );
}

export default ProtectedLayout;
