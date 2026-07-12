import DashboardLayout from "../../layouts/DashboardLayout";

/**
 * -------------------------------------------------------
 * File: pages/notifications/Notifications.jsx
 * Purpose: Notifications page skeleton.
 * Module: Pages
 *
 * Description: Provides the notifications page placeholder.
 *
 * TODO: Build the notifications page interface.
 * -------------------------------------------------------
 */

function Notifications() {
    const notifications = [
        { title: "Transfer request pending approval", type: "Approval", time: "09:15 AM" },
        { title: "Network Printer maintenance is overdue", type: "Alert", time: "10:05 AM" },
        { title: "Meeting Room A booking confirmed", type: "Booking", time: "11:30 AM" },
        { title: "Asset AF-LT-1024 allocated to Finance Team", type: "Approval", time: "01:20 PM" },
        { title: "Conference Projector return due today", type: "Alert", time: "03:45 PM" },
    ];

    return (
        <DashboardLayout activeItem="Notifications">
            <section className="notifications-section" aria-labelledby="notifications-heading">
                <div className="notifications-header">
                    <h1 id="notifications-heading">Notifications</h1>
                    <p>Review alerts, approvals, and booking updates.</p>
                </div>

                <div className="notification-filters" aria-label="Notification filters">
                    <button className="active" type="button">All</button>
                    <button type="button">Alerts and Approvals</button>
                    <button type="button">Bookings</button>
                </div>

                <div className="notification-list" aria-label="All notifications">
                    {notifications.map((notification) => (
                        <article className="notification-item" key={`${notification.title}-${notification.time}`}>
                            <div>
                                <strong>{notification.title}</strong>
                                <p>{notification.type}</p>
                            </div>
                            <time>{notification.time}</time>
                        </article>
                    ))}
                </div>
            </section>
        </DashboardLayout>
    );
}

export default Notifications;
