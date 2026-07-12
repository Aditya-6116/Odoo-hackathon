import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./contexts/auth-context";
import ProtectedRoute from "./layouts/ProtectedRoute";

import Splash from "./pages/Splash";
import Login from "./pages/auth/Login";
import Signup from "./pages/auth/Signup";
import ForgotPassword from "./pages/auth/ForgotPassword";
import Dashboard from "./pages/dashboard/Dashboard";
import Organization from "./pages/organization/Organization";
import Assets from "./pages/assets/Assets";
import AssetDetails from "./pages/assets/AssetDetails";
import RegisterAsset from "./pages/assets/RegisterAsset";
import Allocation from "./pages/allocation/Allocation";
import Booking from "./pages/booking/Booking";
import Maintenance from "./pages/maintenance/Maintenance";
import Audit from "./pages/audit/Audit";
import Reports from "./pages/reports/Reports";
import Notifications from "./pages/notifications/Notifications";
import Profile from "./pages/profile/Profile";
import NotFound from "./pages/NotFound";

function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Routes>
                    {/* Public Routes */}
                    <Route path="/" element={<Login />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/signup" element={<Signup />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />

                    {/* Protected Routes */}
                    <Route element={<ProtectedRoute />}>
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/organization" element={<Organization />} />
                        <Route path="/assets" element={<Assets />} />
                        <Route path="/assets/:assetId" element={<AssetDetails />} />
                        <Route path="/assets/register" element={<RegisterAsset />} />
                        <Route path="/allocation" element={<Allocation />} />
                        <Route path="/booking" element={<Booking />} />
                        <Route path="/maintenance" element={<Maintenance />} />
                        <Route path="/audit" element={<Audit />} />
                        <Route path="/reports" element={<Reports />} />
                        <Route path="/notifications" element={<Notifications />} />
                        <Route path="/profile" element={<Profile />} />
                    </Route>

                    {/* Fallback Route */}
                    <Route path="*" element={<NotFound />} />
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    );
}

export default App;

