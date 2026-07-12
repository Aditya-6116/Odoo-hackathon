import DashboardLayout from "../../layouts/DashboardLayout";

function Audit() {
    const auditRows = [
        { asset: "Dell Latitude 5440", expectedLocation: "Finance Floor", verification: "Verified" },
        { asset: "Conference Projector", expectedLocation: "Meeting Room A", verification: "Pending" },
        { asset: "Network Printer", expectedLocation: "Finance Floor", verification: "Mismatch" },
        { asset: "Access Card Batch", expectedLocation: "Security Desk", verification: "Verified" },
    ];

    return (
        <DashboardLayout activeItem="Audit">
            <section className="audit-section" aria-labelledby="audit-heading">
                <div className="audit-header">
                    <div>
                        <h1 id="audit-heading">Audit</h1>
                        <p>Review expected asset locations and verification status.</p>
                    </div>
                    <div className="close-audit-box">
                        <strong>Close audit cycle</strong>
                        <button type="button">Close</button>
                    </div>
                </div>

                <div className="organization-table-wrap">
                    <table className="organization-table">
                        <thead>
                            <tr>
                                <th>Asset</th>
                                <th>Expected Location</th>
                                <th>Verification</th>
                            </tr>
                        </thead>
                        <tbody>
                            {auditRows.map((row) => (
                                <tr key={row.asset}>
                                    <td>{row.asset}</td>
                                    <td>{row.expectedLocation}</td>
                                    <td>
                                        <span className={row.verification === "Mismatch" ? "status-pill review" : "status-pill"}>
                                            {row.verification}
                                        </span>
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

export default Audit;
