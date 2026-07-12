import DashboardLayout from "../../layouts/DashboardLayout";

/**
 * -------------------------------------------------------
 * File: pages/dashboard/Dashboard.jsx
 * Purpose: Dashboard page skeleton.
 * Module: Pages
 *
 * Description: Provides the dashboard page placeholder.
 *
 * TODO: Build the dashboard page interface.
 * -------------------------------------------------------
 */

function Dashboard() {
    const overviewItems = [
        { label: "Available", value: "128" },
        { label: "Allocated", value: "74" },
        { label: "Active Bookings", value: "16" },
        { label: "Pending Transfer", value: "9" },
        { label: "Upcoming Returns", value: "12" },
    ];

    const overdueAssets = [
        { asset: "Dell Latitude 5440", owner: "Finance Team", due: "2 days overdue" },
        { asset: "Conference Projector", owner: "Admin Office", due: "5 days overdue" },
        { asset: "Access Card Batch", owner: "Facilities", due: "1 day overdue" },
    ];

    const recentActivity = [
        "Allocation confirmed for MacBook Pro to Design Team",
        "Resource booking approved for Meeting Room A",
        "Maintenance ticket opened for Network Printer",
        "Transfer request submitted for asset AF-2048",
    ];

    return (
        <DashboardLayout activeItem="Dashboard">
                    <section className="overview-section" aria-labelledby="overview-heading">
                        <h1 id="overview-heading">Todays Overview</h1>
                        <div className="overview-grid">
                            {overviewItems.map((item) => (
                                <article className="overview-card" key={item.label}>
                                    <p>{item.label}</p>
                                    <strong>{item.value}</strong>
                                </article>
                            ))}
                        </div>
                    </section>

                    <section className="dashboard-section" aria-labelledby="overdue-heading">
                        <div className="section-heading-row">
                            <h2 id="overdue-heading">Overdue Assets</h2>
                            <span>Needs attention</span>
                        </div>

                        <div className="overdue-list">
                            {overdueAssets.map((item) => (
                                <article className="overdue-item" key={item.asset}>
                                    <div>
                                        <strong>{item.asset}</strong>
                                        <p>{item.owner}</p>
                                    </div>
                                    <span>{item.due}</span>
                                </article>
                            ))}
                        </div>
                    </section>

                    <section className="quick-actions" aria-label="Quick actions">
                        <button type="button">Register Asset</button>
                        <button type="button">Book Resources</button>
                        <button type="button">Raise Request</button>
                    </section>

                    <section className="dashboard-section" aria-labelledby="activity-heading">
                        <div className="section-heading-row">
                            <h2 id="activity-heading">Recent Activity</h2>
                            <span>Latest updates</span>
                        </div>

                        <div className="activity-list">
                            {recentActivity.map((activity) => (
                                <article className="activity-item" key={activity}>
                                    <span></span>
                                    <p>{activity}</p>
                                </article>
                            ))}
                        </div>
                    </section>
        </DashboardLayout>
    );
}

export default Dashboard;
