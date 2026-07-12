import DashboardLayout from "../../layouts/DashboardLayout";

/**
 * -------------------------------------------------------
 * File: pages/maintenance/Maintenance.jsx
 * Purpose: Maintenance page skeleton.
 * Module: Pages
 *
 * Description: Provides the maintenance page placeholder.
 *
 * TODO: Build the maintenance page interface.
 * -------------------------------------------------------
 */

function Maintenance() {
    const maintenanceColumns = [
        {
            title: "Pending",
            items: ["Printer paper jam", "Projector bulb check"],
        },
        {
            title: "Accepted",
            items: ["Laptop battery replacement", "Access panel repair"],
        },
        {
            title: "Technologies Assigned",
            items: ["Network switch inspection", "Scanner calibration"],
        },
        {
            title: "In Progress",
            items: ["Conference display setup", "Server room UPS check"],
        },
        {
            title: "Resolved",
            items: ["Keyboard replacement", "Meeting room speaker fix"],
        },
    ];

    return (
        <DashboardLayout activeItem="Maintenance">
            <section className="maintenance-section" aria-labelledby="maintenance-heading">
                <div className="maintenance-header">
                    <h1 id="maintenance-heading">Maintenance</h1>
                    <p>Track asset service requests across each status.</p>
                </div>

                <div className="maintenance-board">
                    {maintenanceColumns.map((column) => (
                        <article className="maintenance-column" key={column.title}>
                            <h2>{column.title}</h2>
                            <div className="maintenance-card-list">
                                {column.items.map((item) => (
                                    <div className="maintenance-card" key={item}>
                                        {item}
                                    </div>
                                ))}
                            </div>
                        </article>
                    ))}
                </div>
            </section>
        </DashboardLayout>
    );
}

export default Maintenance;
