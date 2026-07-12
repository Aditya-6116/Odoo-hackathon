import DashboardLayout from "../../layouts/DashboardLayout";

/**
 * -------------------------------------------------------
 * File: pages/organization/Organization.jsx
 * Purpose: Organization page skeleton.
 * Module: Pages
 *
 * Description: Provides the organization page placeholder.
 *
 * TODO: Build the organization page interface.
 * -------------------------------------------------------
 */

function Organization() {
    const departments = [
        { department: "Finance", head: "Meera Nair", parent: "Corporate", status: "Active" },
        { department: "Facilities", head: "Rahul Menon", parent: "Operations", status: "Active" },
        { department: "IT Support", head: "Ananya Rao", parent: "Technology", status: "Active" },
        { department: "Procurement", head: "Vikram Das", parent: "Operations", status: "Review" },
    ];

    return (
        <DashboardLayout activeItem="Organization Setup">
                    <section className="organization-section" aria-labelledby="organization-heading">
                        <div className="organization-header">
                            <div>
                                <h1 id="organization-heading">Organization Setup</h1>
                                <p>Manage departments, categories, and employees.</p>
                            </div>
                            <button type="button">+ Add</button>
                        </div>

                        <div className="organization-tabs" aria-label="Organization setup sections">
                            <button className="active" type="button">Departments</button>
                            <button type="button">Categories</button>
                            <button type="button">Employee</button>
                        </div>

                        <div className="organization-table-wrap">
                            <table className="organization-table">
                                <thead>
                                    <tr>
                                        <th>Department</th>
                                        <th>Head</th>
                                        <th>Parent Dept</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {departments.map((item) => (
                                        <tr key={item.department}>
                                            <td>{item.department}</td>
                                            <td>{item.head}</td>
                                            <td>{item.parent}</td>
                                            <td>
                                                <span className={item.status === "Active" ? "status-pill" : "status-pill review"}>
                                                    {item.status}
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

export default Organization;
