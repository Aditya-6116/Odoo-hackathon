/**
 * -------------------------------------------------------
 * File: contexts/auth-context.jsx
 * Purpose: Authentication context skeleton.
 * Module: Contexts
 *
 * Description: Provides a future context boundary for authentication data.
 *
 * TODO: Add authentication context values and provider behavior.
 * -------------------------------------------------------
 */

import { createContext } from "react";

const AuthContext = createContext(null);

function AuthProvider({ children }) {
    const value = {
        user: null,
        isAuthenticated: false,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export { AuthContext, AuthProvider };
