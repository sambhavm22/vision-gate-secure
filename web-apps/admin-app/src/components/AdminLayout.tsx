import { supabase } from "@vision-gate/supabase/client";
import { Button, cn } from "@vision-gate/ui";
import {
    AlertCircle,
    CalendarDays,
    ChevronRight,
    CreditCard,
    FileText,
    LayoutDashboard,
    LogOut,
    Settings,
    ShieldEllipsis,
    UserRound,
    Users
} from "lucide-react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";

const navItems = [
    { label: "Dashboard", href: "/", icon: LayoutDashboard },
    { label: "Bookings", href: "/bookings", icon: CalendarDays },
    { label: "Workers", href: "/workers", icon: UserRound },
    { label: "Users", href: "/users", icon: Users },
    { label: "Payments", href: "/payments", icon: CreditCard },
    { label: "Reports", href: "/reports", icon: FileText },
    { label: "Issues", href: "/issues", icon: AlertCircle },
    { label: "Audit Logs", href: "/audit-logs", icon: ShieldEllipsis },
    { label: "Settings", href: "/settings", icon: Settings },
];

export default function AdminLayout() {
    const location = useLocation();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate("/login");
    };

    return (
        <div className="flex min-h-screen bg-background text-foreground">
            {/* Sidebar */}
            <aside className="w-64 border-r bg-muted/20 flex flex-col shrink-0">
                <div className="p-6">
                    <h1 className="text-xl font-black text-primary flex items-center gap-2">
                        HelperHub <span className="text-[10px] bg-primary/10 px-1.5 py-0.5 rounded text-primary uppercase">Admin</span>
                    </h1>
                </div>

                <nav className="flex-1 px-4 space-y-1">
                    {navItems.map((item) => (
                        <Link
                            key={item.href}
                            to={item.href}
                            className={cn(
                                "flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-muted group",
                                location.pathname === item.href ? "bg-primary text-primary-foreground hover:bg-primary/90" : "text-muted-foreground"
                            )}
                        >
                            <div className="flex items-center gap-3">
                                <item.icon className="h-4 w-4" />
                                {item.label}
                            </div>
                            <ChevronRight className={cn("h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity", location.pathname === item.href && "opacity-0")} />
                        </Link>
                    ))}
                </nav>

                <div className="p-4 border-t">
                    <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:text-destructive" onClick={handleLogout}>
                        <LogOut className="h-4 w-4 mr-3" />
                        Logout
                    </Button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto p-8">
                <Outlet />
            </main>
        </div>
    );
}
