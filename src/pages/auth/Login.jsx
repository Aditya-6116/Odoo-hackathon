/**
 * -------------------------------------------------------
 * File: pages/auth/Login.jsx
 * Purpose: Login page skeleton.
 * Module: Pages
 *
 * Description: Provides the login page placeholder.
 *
 * TODO: Build the login page interface.
 * -------------------------------------------------------
 */

function Login() {
    return (
        <div className="login-page-shell">
            <main className="auth-page">
                <section className="login-card" aria-label="Login">
                    <div className="login-panel">
                        <div className="login-header">
                            <h1>AssetFlow - Login</h1>
                            <p className="login-eyebrow">Welcome back</p>
                        </div>

                        <form className="login-form">
                            <label>
                                Email
                                <input type="email" name="email" placeholder="you@example.com" />
                            </label>

                            <label>
                                Password
                                <input type="password" name="password" placeholder="Enter your password" />
                            </label>

                            <div className="login-actions-row">
                                <a href="/forgot-password">Forgot password?</a>
                            </div>

                            <button type="submit">Login</button>
                        </form>

                        <div className="login-divider">
                            <span></span>
                            <p>New here?</p>
                            <span></span>
                        </div>

                        <a className="create-account-link" href="/signup">
                            Create Account
                        </a>
                    </div>
                </section>
            </main>
        </div>
    );
}

export default Login;
