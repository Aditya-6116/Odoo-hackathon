import { useNavigate } from "react-router-dom";

/**
 * -------------------------------------------------------
 * File: pages/auth/Signup.jsx
 * Purpose: Signup page skeleton.
 * Module: Pages
 *
 * Description: Provides the signup page placeholder.
 *
 * TODO: Build the signup page interface.
 * -------------------------------------------------------
 */

function Signup() {
    const navigate = useNavigate();

    function handleSubmit(event) {
        event.preventDefault();
        navigate("/dashboard");
    }

    return (
        <div className="login-page-shell">
            <main className="auth-page">
                <section className="login-card" aria-label="Create account">
                    <div className="login-panel">
                        <div className="login-header">
                            <h1>ActivoTrack - Create Account</h1>
                            <p className="login-eyebrow">Join ActivoTrack</p>
                        </div>

                        <form className="login-form" onSubmit={handleSubmit}>
                            <label>
                                Name
                                <input type="text" name="name" placeholder="Enter your full name" required />
                            </label>

                            <label>
                                Date of Birth
                                <input type="date" name="dateOfBirth" required />
                            </label>

                            <label>
                                Email
                                <input type="email" name="email" placeholder="you@example.com" required />
                            </label>

                            <label>
                                Password
                                <input type="password" name="password" placeholder="Create a password" required />
                            </label>

                            <button type="submit">Create Account</button>
                        </form>

                        <div className="login-divider">
                            <span></span>
                            <p>Already registered?</p>
                            <span></span>
                        </div>

                        <a className="create-account-link" href="/login">
                            Back to Login
                        </a>
                    </div>
                </section>
            </main>
        </div>
    );
}

export default Signup;
