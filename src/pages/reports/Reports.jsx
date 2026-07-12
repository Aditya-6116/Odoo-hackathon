import DashboardLayout from "../../layouts/DashboardLayout";

/**
 * -------------------------------------------------------
 * File: pages/reports/Reports.jsx
 * Purpose: Reports page skeleton.
 * Module: Pages
 *
 * Description: Provides the reports page placeholder.
 *
 * TODO: Build the reports page interface.
 * -------------------------------------------------------
 */

function Reports() {
    const reports = [
        {
            title: "Most Used Assets",
            items: ["Meeting Room A", "Dell Latitude 5440", "Conference Projector"],
        },
        {
            title: "Idle Assets",
            items: ["Training Lab Desktops", "Spare Barcode Scanner", "Backup Router"],
        },
        {
            title: "Assets Due for Maintenance / Nearing Retirement",
            items: ["Network Printer", "Legacy Access Cards", "Old UPS Unit"],
        },
    ];

    return (
        <DashboardLayout activeItem="Reports">
            <section className="reports-section" aria-labelledby="reports-heading">
                <div className="reports-header">
                    <div>
                        <h1 id="reports-heading">Reports</h1>
                        <p>Monitor usage, idle inventory, and assets needing attention.</p>
                    </div>
                    <button type="button">Export report</button>
                </div>

                <div className="reports-grid">
                    {reports.map((report) => (
                        <article className="report-card" key={report.title}>
                            <h2>{report.title}</h2>
                            <ul>
                                {report.items.map((item) => (
                                    <li key={item}>{item}</li>
                                ))}
                            </ul>
                        </article>
                    ))}
                </div>
            </section>
        </DashboardLayout>
    );
}

export default Reports;
