"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import {
    Calculator,
    Calendar,
    ChevronDown,
    Compass,
    GitCompare,
    HelpCircle,
    LogIn,
    LogOut,
    Menu,
    Moon,
    Search,
    Shield,
    Sun,
    TrendingUp,
    User,
    UserPlus,
    X,
    Building2,
} from "lucide-react";

import { useTheme } from "@/components/providers/ThemeProvider";
import { useSession, signOut } from "@/lib/auth-client";
import LangSelector from "@/components/layout/LangSelector";

export default function Navbar() {
    const { theme, toggleTheme } = useTheme();
    const onToggleTheme = toggleTheme;
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [productsOpen, setProductsOpen] = useState(false);
    const [resourcesOpen, setResourcesOpen] = useState(false);
    const { data: session } = useSession();
    const userRole = (session?.user as { role?: string } | undefined)?.role;
    const dashboardHref =
        userRole === "admin" ? "/admin/dashboard" :
            userRole === "doctor" ? "/doctor/dashboard" :
                "/user/dashboard";

    // Delayed hide timers to avoid flicker on hover dropdowns
    const productsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const resourcesTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const handleProductsEnter = () => {
        if (productsTimeoutRef.current) clearTimeout(productsTimeoutRef.current);
        setProductsOpen(true);
        setResourcesOpen(false);
    };

    const handleProductsLeave = () => {
        productsTimeoutRef.current = setTimeout(() => setProductsOpen(false), 150);
    };

    const handleResourcesEnter = () => {
        if (resourcesTimeoutRef.current) clearTimeout(resourcesTimeoutRef.current);
        setResourcesOpen(true);
        setProductsOpen(false);
    };

    const handleResourcesLeave = () => {
        resourcesTimeoutRef.current = setTimeout(() => setResourcesOpen(false), 150);
    };

    const productsLinks = [
        { href: "/search", label: "Price Search", icon: Search },
        { href: "/insurance-checker", label: "Insurance Checker", icon: Shield },
        { href: "/price-estimator", label: "Price Estimator", icon: Calculator },
        { href: "/compare", label: "Compare Hospitals", icon: GitCompare },
        { href: "/near-me", label: "Near Me", icon: Compass },
        { href: "/book-appointment", label: "Book Appointment", icon: Calendar },
    ];

    const resourcesLinks = [
        { href: "/insights", label: "Market Insights", icon: TrendingUp },
        { href: "/faq", label: "Help Center", icon: HelpCircle },
        { href: "/providers/register", label: "For Providers", icon: Building2 },
    ];

    return (
        <>
            <nav className="navbar bg-base-100/95 shadow-sm px-4 md:px-8 z-50 sticky top-0 backdrop-blur-md border-b border-base-200">
                {/* Mobile menu button + Logo */}
                <div className="navbar-start">
                    <button
                        className="btn btn-ghost lg:hidden"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        aria-label="Toggle menu"
                    >
                        {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                    </button>
                    <Link
                        href="/"
                        className="btn btn-ghost text-2xl font-bold text-primary tracking-tight gap-1"
                    >
                        <Building2 className="w-7 h-7" />
                        MedMap
                    </Link>
                </div>

                {/* Desktop Navigation */}
                <div className="navbar-center hidden lg:flex">
                    <div className="flex items-center gap-1 font-medium">
                        {/* Products Dropdown */}
                        <div
                            className="relative"
                            onMouseEnter={handleProductsEnter}
                            onMouseLeave={handleProductsLeave}
                        >
                            <button className="btn btn-ghost btn-sm gap-1">
                                Products
                                <ChevronDown
                                    className={`w-4 h-4 transition-transform duration-200 ${productsOpen ? "rotate-180" : ""}`}
                                />
                            </button>
                            {productsOpen && (
                                <div className="absolute top-full left-0 pt-2 z-50">
                                    <ul className="menu bg-base-100 rounded-box w-56 shadow-xl border border-base-200 p-2">
                                        {productsLinks.map((link) => (
                                            <li key={link.href}>
                                                <Link
                                                    href={link.href}
                                                    className="flex items-center gap-3"
                                                    onClick={() => setProductsOpen(false)}
                                                >
                                                    <link.icon className="w-4 h-4 text-primary" />
                                                    {link.label}
                                                </Link>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>

                        {/* Resources Dropdown */}
                        <div
                            className="relative"
                            onMouseEnter={handleResourcesEnter}
                            onMouseLeave={handleResourcesLeave}
                        >
                            <button className="btn btn-ghost btn-sm gap-1">
                                Resources
                                <ChevronDown
                                    className={`w-4 h-4 transition-transform duration-200 ${resourcesOpen ? "rotate-180" : ""}`}
                                />
                            </button>
                            {resourcesOpen && (
                                <div className="absolute top-full left-0 pt-2 z-50">
                                    <ul className="menu bg-base-100 rounded-box w-56 shadow-xl border border-base-200 p-2">
                                        {resourcesLinks.map((link) => (
                                            <li key={link.href}>
                                                <Link
                                                    href={link.href}
                                                    className="flex items-center gap-3"
                                                    onClick={() => setResourcesOpen(false)}
                                                >
                                                    <link.icon className="w-4 h-4 text-primary" />
                                                    {link.label}
                                                </Link>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>

                        {/* Categories Link */}
                        <Link href="/categories" className="btn btn-ghost btn-sm">
                            Categories
                        </Link>
                    </div>
                </div>

                {/* Right side: Theme, Lang, Auth */}
                <div className="navbar-end gap-2">
                    <LangSelector />
                    <button
                        className="btn btn-ghost btn-circle"
                        onClick={onToggleTheme}
                        aria-label="Toggle theme"
                    >
                        {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                    </button>

                    {session?.user ? (
                        <>
                            <Link href={dashboardHref} className="btn btn-ghost btn-circle">
                                <User className="w-5 h-5" />
                            </Link>
                            <button
                                onClick={() => signOut().then(() => window.location.href = "/")}
                                className="btn btn-ghost btn-sm hidden md:flex gap-1"
                            >
                                <LogOut className="w-4 h-4" />
                                Sign Out
                            </button>
                        </>
                    ) : (
                        <>
                            <Link href="/auth/login" className="btn btn-ghost btn-sm hidden md:flex gap-1">
                                <LogIn className="w-4 h-4" />
                                Sign In
                            </Link>
                            <Link href="/auth/register" className="btn btn-primary btn-sm hidden md:flex">
                                Get Started
                            </Link>
                        </>
                    )}
                </div>
            </nav>

            {/* Mobile Menu Drawer placed outside nav to avoid clipping */}
            {mobileMenuOpen && (
                <div className="fixed inset-0 z-50 lg:hidden">
                    <div className="fixed inset-0 bg-black/50" onClick={() => setMobileMenuOpen(false)} />
                    <aside className="fixed inset-y-0 left-0 w-72 max-w-[18rem] h-full bg-base-100 shadow-xl overflow-y-auto flex flex-col">
                        <div className="p-4 border-b border-base-200 flex items-center justify-between sticky top-0 bg-base-100 z-10">
                            <span className="text-xl font-bold text-primary flex items-center gap-2">
                                <Building2 className="w-6 h-6" />
                                MedMap
                            </span>
                            <button
                                className="btn btn-ghost btn-circle btn-sm"
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <ul className="menu p-4 gap-1 flex-1">
                            <li className="menu-title">Products</li>
                            {productsLinks.map((link) => (
                                <li key={link.href}>
                                    <Link
                                        href={link.href}
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="flex items-center gap-3"
                                    >
                                        <link.icon className="w-4 h-4 text-primary" />
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                            <li className="menu-title mt-2">Resources</li>
                            {resourcesLinks.map((link) => (
                                <li key={link.href}>
                                    <Link
                                        href={link.href}
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="flex items-center gap-3"
                                    >
                                        <link.icon className="w-4 h-4 text-primary" />
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                            <li>
                                <Link
                                    href="/categories"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="flex items-center gap-3"
                                >
                                    <Compass className="w-4 h-4 text-primary" />
                                    Categories
                                </Link>
                            </li>
                        </ul>

                        <div className="px-4 pb-6 flex flex-col gap-2">
                            {session?.user ? (
                                <>
                                    <Link
                                        href={dashboardHref}
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="btn btn-ghost justify-start"
                                    >
                                        <User className="w-4 h-4" />
                                        {session.user.name || "Dashboard"}
                                    </Link>
                                    <button
                                        onClick={() => { setMobileMenuOpen(false); signOut().then(() => window.location.href = "/"); }}
                                        className="btn btn-outline justify-start text-error"
                                    >
                                        <LogOut className="w-4 h-4" />
                                        Sign Out
                                    </button>
                                </>
                            ) : (
                                <>
                                    <Link
                                        href="/auth/login"
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="btn btn-ghost justify-start"
                                    >
                                        <LogIn className="w-4 h-4" />
                                        Sign In
                                    </Link>
                                    <Link
                                        href="/auth/register"
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="btn btn-primary justify-start"
                                    >
                                        <UserPlus className="w-4 h-4" />
                                        Create Account
                                    </Link>
                                </>
                            )}
                            <Link
                                href="/providers/register"
                                onClick={() => setMobileMenuOpen(false)}
                                className="btn btn-outline justify-start"
                            >
                                <Building2 className="w-4 h-4" />
                                For Providers
                            </Link>
                        </div>
                    </aside>
                </div>
            )}
        </>
    );
}
