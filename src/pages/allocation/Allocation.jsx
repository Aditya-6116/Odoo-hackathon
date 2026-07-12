import DashboardLayout from "../../layouts/DashboardLayout";

/**
 * -------------------------------------------------------
 * File: pages/allocation/Allocation.jsx
 * Purpose: Allocation page skeleton.
 * Module: Pages
 *
 * Description: Provides the allocation page placeholder.
 *
 * TODO: Build the allocation page interface.
 * -------------------------------------------------------
 */

function Allocation() {
    const history = [
        { asset: "Dell Latitude 5440", from: "IT Store", to: "Finance Team", status: "Allocated" },
        { asset: "Conference Projector", from: "Admin Office", to: "Meeting Room A", status: "Confirmed" },
        { asset: "Network Printer", from: "Finance Floor", to: "Maintenance Desk", status: "Maintenance" },
        { asset: "Access Card Batch", from: "Facilities", to: "Security Desk", status: "Transferred" },
    ];

    return (
        <DashboardLayout activeItem="Allocation & Transfer">
                    <section className="allocation-section" aria-labelledby="allocation-heading">
                        <div className="allocation-header">
                            <h1 id="allocation-heading">Allocation & Transfer</h1>
                            <p>Create a transfer request and review recent allocation activity.</p>
                        </div>

                        <form className="transfer-form">
                            <label className="field-full">
                                Asset
                                <input type="text" placeholder="Search or enter asset tag" />
                            </label>

                            <label>
                                From
                                <input type="text" placeholder="Current department or location" />
                            </label>

                            <label>
                                To
                                <input type="text" placeholder="Target department or location" />
                            </label>

                            <label className="field-full">
                                Reason
                                <textarea placeholder="Enter reason for transfer"></textarea>
                            </label>

                            <button type="button">Submit Transfer Request</button>
                        </form>
                    </section>

                    <section className="allocation-section" aria-labelledby="history-heading">
                        <div className="section-heading-row">
                            <h2 id="history-heading">Allocation History</h2>
                            <span>Recent records</span>
                        </div>

                        <div className="organization-table-wrap">
                            <table className="organization-table">
                                <thead>
                                    <tr>
                                        <th>Asset</th>
                                        <th>From</th>
                                        <th>To</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {history.map((item) => (
                                        <tr key={`${item.asset}-${item.to}`}>
                                            <td>{item.asset}</td>
                                            <td>{item.from}</td>
                                            <td>{item.to}</td>
                                            <td>
                                                <span className="status-pill">{item.status}</span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>
        </DashboardLayout>
    );
}

export default Allocation;
