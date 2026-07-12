import DashboardLayout from "../../layouts/DashboardLayout";

/**
 * -------------------------------------------------------
 * File: pages/assets/Assets.jsx
 * Purpose: Assets page skeleton.
 * Module: Pages
 *
 * Description: Provides the assets listing page placeholder.
 *
 * TODO: Build the assets page interface.
 * -------------------------------------------------------
 */

function Assets() {
    const assets = [
        { tag: "AF-LT-1024", name: "Dell Latitude 5440", category: "Laptop", status: "Available", location: "IT Store" },
        { tag: "AF-PR-2031", name: "Network Printer", category: "Printer", status: "Maintenance", location: "Finance Floor" },
        { tag: "AF-PJ-0188", name: "Conference Projector", category: "AV Equipment", status: "Allocated", location: "Meeting Room A" },
        { tag: "AF-KY-0412", name: "Access Card Batch", category: "Security", status: "Available", location: "Facilities Desk" },
    ];

    return (
        <DashboardLayout activeItem="Assets">
                    <section className="assets-section" aria-labelledby="assets-heading">
                        <div className="assets-header">
                            <h1 id="assets-heading">Assets</h1>
                        </div>

                        <div className="assets-toolbar">
                            <input
                                aria-label="Search assets"
                                placeholder="Search by tag, serial, or QR code..."
                                type="search"
                            />
                            <a href="/assets/register">+ Register Asset</a>
                        </div>

                        <div className="asset-filters" aria-label="Asset filters">
                            <button type="button">Category</button>
                            <button type="button">Status</button>
                            <button type="button">Department</button>
                        </div>

                        <div className="organization-table-wrap">
                            <table className="organization-table">
                                <thead>
                                    <tr>
                                        <th>Tag</th>
                                        <th>Name</th>
                                        <th>Category</th>
                                        <th>Status</th>
                                        <th>Location</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {assets.map((asset) => (
                                        <tr key={asset.tag}>
                                            <td>{asset.tag}</td>
                                            <td>{asset.name}</td>
                                            <td>{asset.category}</td>
                                            <td>
                                                <span className="status-pill">{asset.status}</span>
                                            </td>
                                            <td>{asset.location}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>
        </DashboardLayout>
    );
}

export default Assets;
