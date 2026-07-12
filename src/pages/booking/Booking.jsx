import DashboardLayout from "../../layouts/DashboardLayout";

/**
 * -------------------------------------------------------
 * File: pages/booking/Booking.jsx
 * Purpose: Booking page skeleton.
 * Module: Pages
 *
 * Description: Provides the booking page placeholder.
 *
 * TODO: Build the booking page interface.
 * -------------------------------------------------------
 */

function Booking() {
    const bookedSlots = [
        { person: "Meera Nair", resource: "Meeting Room A", time: "09:00 AM - 10:00 AM" },
        { person: "Rahul Menon", resource: "Conference Projector", time: "11:30 AM - 12:30 PM" },
        { person: "Ananya Rao", resource: "Training Lab", time: "02:00 PM - 04:00 PM" },
        { person: "Vikram Das", resource: "Meeting Room B", time: "04:30 PM - 05:30 PM" },
    ];

    return (
        <DashboardLayout activeItem="Resource Booking">
                    <section className="booking-section" aria-labelledby="booking-heading">
                        <div className="booking-header">
                            <div>
                                <h1 id="booking-heading">Resource</h1>
                                <p>See who has booked shared resources today.</p>
                            </div>
                            <button type="button">Book a Slot for Yourself</button>
                        </div>

                        <div className="booking-slots" aria-label="Booked time slots">
                            {bookedSlots.map((slot) => (
                                <article className="booking-slot" key={`${slot.person}-${slot.time}`}>
                                    <div>
                                        <strong>{slot.time}</strong>
                                        <p>{slot.resource}</p>
                                    </div>
                                    <span>{slot.person}</span>
                                </article>
                            ))}
                        </div>
                    </section>
        </DashboardLayout>
    );
}

export default Booking;
