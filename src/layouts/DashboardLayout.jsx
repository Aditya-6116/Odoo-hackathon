import ProtectedLayout from "./ProtectedLayout";

function DashboardLayout({ activeItem, children }) {
    return <ProtectedLayout activeItem={activeItem}>{children}</ProtectedLayout>;
}

export default DashboardLayout;
