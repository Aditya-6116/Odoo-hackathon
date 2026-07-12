import appNavigation from "../constants/navigation";

/**
 * -------------------------------------------------------
 * File: layouts/Sidebar.jsx
 * Purpose: Sidebar component skeleton.
 * Module: Layout Components
 *
 * Description: Provides a sidebar component placeholder.
 *
 * TODO: Build the sidebar layout component.
 * -------------------------------------------------------
 */

function Sidebar({ activeItem }) {
    return (
        <aside className="dashboard-sidebar" aria-label="Main navigation">
            <nav>
                {appNavigation.map((item) => (
                    <a
                        className={item.label === activeItem ? "dashboard-nav-link active" : "dashboard-nav-link"}
                        href={item.href}
                        key={item.label}
                    >
                        {item.label}
                    </a>
                ))}
            </nav>
        </aside>
    );
}

export default Sidebar;
