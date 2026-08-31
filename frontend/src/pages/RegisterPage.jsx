import { useState } from 'react';
import { Link } from 'react-router-dom';
import { registerUser } from '../services/authService';

export default function RegisterPage() {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('viewer');
    const [showPassword, setShowPassword] = useState(false);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleRegister = async (e) => {
        e.preventDefault();

        setError('');
        setSuccess('');
        setLoading(true);

        try {
            await registerUser({
                username,
                email,
                password,
                role,
            });

            setSuccess(
                'Account created successfully! Redirecting you to sign in...'
            );

            setTimeout(() => {
                window.location.href = '/login';
            }, 1500);
        } catch (err) {
            setError(
                typeof err === 'string'
                    ? err
                    : err?.message ||
                          'Unable to create your account. Please try again.'
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-3 sm:p-5 lg:p-8">

            {/* Main Container */}
            <div className="w-full max-w-6xl min-h-175 lg:min-h-190 overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 shadow-2xl flex flex-col lg:flex-row">

                {/* =====================================================
                    LEFT / BRAND PANEL
                ====================================================== */}
                <div className="relative hidden lg:flex lg:w-[48%] overflow-hidden bg-linear-to-br from-emerald-950 via-slate-900 to-slate-950 p-10 xl:p-14 flex-col justify-between">

                    {/* Decorative blobs */}
                    <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-emerald-500/10 blur-3xl" />
                    <div className="absolute -bottom-32 -left-20 w-96 h-96 rounded-full bg-blue-500/10 blur-3xl" />

                    {/* Grid */}
                    <div className="absolute inset-0 opacity-[0.035]">
                        <div
                            className="absolute inset-0"
                            style={{
                                backgroundImage:
                                    'linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)',
                                backgroundSize: '40px 40px',
                            }}
                        />
                    </div>

                    <div className="relative z-10">

                        {/* Logo */}
                        <div className="flex items-center gap-3">
                            <div className="h-12 w-12 rounded-2xl bg-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-600/25">
                                <svg
                                    className="w-6 h-6"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="1.8"
                                        d="M20 7.5L12 3 4 7.5m16 0v9L12 21l-8-4.5v-9m16 0L12 12 4 7.5M12 12v9"
                                    />
                                </svg>
                            </div>

                            <div>
                                <h1 className="text-lg font-bold tracking-tight">
                                    Warehouse<span className="text-emerald-400">OS</span>
                                </h1>
                                <p className="text-[11px] text-slate-500 uppercase tracking-[0.2em]">
                                    Management System
                                </p>
                            </div>
                        </div>

                        {/* Hero */}
                        <div className="mt-20 xl:mt-24 max-w-lg">

                            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-300 mb-6">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                New Team Member
                            </div>

                            <h2 className="text-4xl xl:text-5xl font-bold leading-[1.08] tracking-tight">
                                Build a better
                                <span className="block text-emerald-400">
                                    warehouse operation.
                                </span>
                            </h2>

                            <p className="mt-6 text-sm xl:text-base leading-7 text-slate-400 max-w-md">
                                Create your warehouse portal account and get
                                access to the tools your role needs to manage
                                inventory operations efficiently.
                            </p>
                        </div>

                        {/* Feature list */}
                        <div className="mt-12 space-y-4 max-w-md">

                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/10 flex items-center justify-center">
                                    <svg
                                        className="w-4 h-4 text-emerald-400"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeWidth="1.8"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M5 13l4 4L19 7"
                                        />
                                    </svg>
                                </div>

                                <span className="text-sm text-slate-400">
                                    Centralized inventory management
                                </span>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/10 flex items-center justify-center">
                                    <svg
                                        className="w-4 h-4 text-emerald-400"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeWidth="1.8"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z"
                                        />
                                    </svg>
                                </div>

                                <span className="text-sm text-slate-400">
                                    Role-based secure access
                                </span>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/10 flex items-center justify-center">
                                    <svg
                                        className="w-4 h-4 text-emerald-400"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeWidth="1.8"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M4 19V5m0 14h16M8 16v-5m4 5V8m4 8v-9"
                                        />
                                    </svg>
                                </div>

                                <span className="text-sm text-slate-400">
                                    Operational visibility and reporting
                                </span>
                            </div>

                        </div>
                    </div>

                    {/* Bottom */}
                    <div className="relative z-10 flex items-center justify-between text-xs text-slate-600">
                        <span>Warehouse Operations Suite</span>
                        <span>v1.0</span>
                    </div>
                </div>

                {/* =====================================================
                    RIGHT / REGISTER FORM
                ====================================================== */}
                <div className="w-full lg:w-[52%] flex items-center justify-center bg-slate-900/95 p-5 sm:p-8 md:p-12 xl:p-16">

                    <div className="w-full max-w-md">

                        {/* Mobile logo */}
                        <div className="flex lg:hidden items-center justify-center gap-3 mb-8">
                            <div className="h-11 w-11 rounded-2xl bg-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-600/25">
                                <svg
                                    className="w-5 h-5"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="1.8"
                                        d="M20 7.5L12 3 4 7.5m16 0v9L12 21l-8-4.5v-9m16 0L12 12 4 7.5M12 12v9"
                                    />
                                </svg>
                            </div>

                            <div>
                                <h1 className="text-lg font-bold">
                                    Warehouse<span className="text-emerald-400">OS</span>
                                </h1>

                                <p className="text-[10px] text-slate-500 uppercase tracking-widest">
                                    Management System
                                </p>
                            </div>
                        </div>

                        {/* Heading */}
                        <div className="mb-7">
                            <div className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 mb-5">
                                <svg
                                    className="w-5 h-5 text-emerald-400"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeWidth="1.8"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M18 8a6 6 0 10-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9zM10 21h4"
                                    />
                                </svg>
                            </div>

                            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
                                Create account
                            </h2>

                            <p className="mt-2 text-sm leading-6 text-slate-400">
                                Set up your profile to access the warehouse
                                management portal.
                            </p>
                        </div>

                        {/* Error */}
                        {error && (
                            <div
                                role="alert"
                                className="mb-5 flex gap-3 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300"
                            >
                                <svg
                                    className="w-5 h-5 shrink-0 text-red-400"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M12 8v4m0 4h.01M10.3 3.9l-7.2 12.5A2 2 0 004.8 19h14.4a2 2 0 001.7-2.6L13.7 3.9a2 2 0 00-3.4 0z"
                                    />
                                </svg>

                                <span>{error}</span>
                            </div>
                        )}

                        {/* Success */}
                        {success && (
                            <div
                                role="status"
                                className="mb-5 flex gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-300"
                            >
                                <svg
                                    className="w-5 h-5 shrink-0 text-emerald-400"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M5 13l4 4L19 7"
                                    />
                                </svg>

                                <span>{success}</span>
                            </div>
                        )}

                        {/* Form */}
                        <form onSubmit={handleRegister} className="space-y-4">

                            {/* Username */}
                            <div>
                                <label
                                    htmlFor="username"
                                    className="block text-sm font-medium text-slate-300 mb-2"
                                >
                                    Username
                                </label>

                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <svg
                                            className="w-5 h-5 text-slate-500"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeWidth="1.8"
                                                strokeLinecap="round"
                                                d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2m8-8a4 4 0 100-8 4 4 0 000 8z"
                                            />
                                        </svg>
                                    </div>

                                    <input
                                        id="username"
                                        type="text"
                                        value={username}
                                        onChange={(e) =>
                                            setUsername(e.target.value)
                                        }
                                        required
                                        autoComplete="username"
                                        placeholder="e.g. john_doe"
                                        className="w-full rounded-xl border border-slate-700 bg-slate-950/60 py-3.5 pl-12 pr-4 text-sm text-white placeholder-slate-600 outline-none transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                                    />
                                </div>
                            </div>

                            {/* Email */}
                            <div>
                                <label
                                    htmlFor="email"
                                    className="block text-sm font-medium text-slate-300 mb-2"
                                >
                                    Email address
                                </label>

                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <svg
                                            className="w-5 h-5 text-slate-500"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeWidth="1.8"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="M3 7l9 6 9-6M5 5h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2z"
                                            />
                                        </svg>
                                    </div>

                                    <input
                                        id="email"
                                        type="email"
                                        value={email}
                                        onChange={(e) =>
                                            setEmail(e.target.value)
                                        }
                                        required
                                        autoComplete="email"
                                        placeholder="you@company.com"
                                        className="w-full rounded-xl border border-slate-700 bg-slate-950/60 py-3.5 pl-12 pr-4 text-sm text-white placeholder-slate-600 outline-none transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                                    />
                                </div>
                            </div>

                            {/* Password */}
                            <div>
                                <label
                                    htmlFor="register-password"
                                    className="block text-sm font-medium text-slate-300 mb-2"
                                >
                                    Password
                                </label>

                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <svg
                                            className="w-5 h-5 text-slate-500"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeWidth="1.8"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                                            />
                                        </svg>
                                    </div>

                                    <input
                                        id="register-password"
                                        type={
                                            showPassword
                                                ? 'text'
                                                : 'password'
                                        }
                                        value={password}
                                        onChange={(e) =>
                                            setPassword(e.target.value)
                                        }
                                        required
                                        autoComplete="new-password"
                                        placeholder="Create a strong password"
                                        className="w-full rounded-xl border border-slate-700 bg-slate-950/60 py-3.5 pl-12 pr-12 text-sm text-white placeholder-slate-600 outline-none transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                                    />

                                    <button
                                        type="button"
                                        onClick={() =>
                                            setShowPassword(!showPassword)
                                        }
                                        aria-label={
                                            showPassword
                                                ? 'Hide password'
                                                : 'Show password'
                                        }
                                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
                                    >
                                        {showPassword ? (
                                            <svg
                                                className="w-5 h-5"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeWidth="1.8"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    d="M3 3l18 18M10.6 10.6a2 2 0 102.8 2.8M9.9 4.2A10.9 10.9 0 0012 4c5.2 0 9.2 4.2 10 8-.3 1.5-1 2.9-2 4.1M6.2 6.2C4.5 7.4 3.3 9.1 2 12c1.1 3.8 5.2 8 10 8 1.2 0 2.4-.2 3.5-.7"
                                                />
                                            </svg>
                                        ) : (
                                            <svg
                                                className="w-5 h-5"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeWidth="1.8"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"
                                                />
                                                <circle
                                                    cx="12"
                                                    cy="12"
                                                    r="2.5"
                                                />
                                            </svg>
                                        )}
                                    </button>
                                </div>

                                <p className="mt-2 text-[11px] text-slate-600">
                                    Use at least 8 characters with a mix of
                                    letters and numbers.
                                </p>
                            </div>

                            {/* Role */}
                            <div>
                                <label
                                    htmlFor="role"
                                    className="block text-sm font-medium text-slate-300 mb-2"
                                >
                                    System role
                                </label>

                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                                        <svg
                                            className="w-5 h-5 text-slate-500"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeWidth="1.8"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="M17 20h5v-2a4 4 0 00-5-3.87M9 20H4v-2a4 4 0 015-3.87M16 3.13a4 4 0 010 7.75M8 3.13a4 4 0 000 7.75"
                                            />
                                        </svg>
                                    </div>

                                    <select
                                        id="role"
                                        value={role}
                                        onChange={(e) =>
                                            setRole(e.target.value)
                                        }
                                        className="appearance-none w-full rounded-xl border border-slate-700 bg-slate-950/60 py-3.5 pl-12 pr-10 text-sm text-white outline-none transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 cursor-pointer"
                                    >
                                        <option
                                            value="viewer"
                                            className="bg-slate-900"
                                        >
                                            Viewer — Read-only access
                                        </option>

                                        <option
                                            value="staff"
                                            className="bg-slate-900"
                                        >
                                            Staff — Operations access
                                        </option>

                                        <option
                                            value="manager"
                                            className="bg-slate-900"
                                        >
                                            Manager — Approval access
                                        </option>

                                        <option
                                            value="admin"
                                            className="bg-slate-900"
                                        >
                                            Admin — Full system access
                                        </option>
                                    </select>

                                    <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                                        <svg
                                            className="w-4 h-4 text-slate-500"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeWidth="2"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="M19 9l-7 7-7-7"
                                            />
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            {/* Terms */}
                            <div className="flex items-start gap-3 pt-1">
                                <input
                                    id="terms"
                                    type="checkbox"
                                    required
                                    className="mt-0.5 h-4 w-4 rounded border-slate-700 bg-slate-950 text-emerald-600 focus:ring-emerald-500 focus:ring-offset-slate-900"
                                />

                                <label
                                    htmlFor="terms"
                                    className="text-xs leading-5 text-slate-500 cursor-pointer"
                                >
                                    I understand that access permissions are
                                    determined by my assigned system role.
                                </label>
                            </div>

                            {/* Submit */}
                            <button
                                type="submit"
                                disabled={loading}
                                className="group w-full rounded-xl bg-emerald-600 py-3.5 px-4 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 transition-all hover:bg-emerald-500 hover:shadow-emerald-500/25 focus:outline-none focus:ring-4 focus:ring-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                <span className="flex items-center justify-center gap-2">
                                    {loading ? (
                                        <>
                                            <svg
                                                className="w-5 h-5 animate-spin"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                            >
                                                <circle
                                                    className="opacity-25"
                                                    cx="12"
                                                    cy="12"
                                                    r="10"
                                                    stroke="currentColor"
                                                    strokeWidth="4"
                                                />
                                                <path
                                                    className="opacity-75"
                                                    fill="currentColor"
                                                    d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                                                />
                                            </svg>

                                            Creating account...
                                        </>
                                    ) : (
                                        <>
                                            Create warehouse account
                                            <svg
                                                className="w-4 h-4 transition-transform group-hover:translate-x-0.5"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth="2"
                                                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                                                />
                                            </svg>
                                        </>
                                    )}
                                </span>
                            </button>
                        </form>

                        {/* Login */}
                        <div className="mt-7 pt-6 border-t border-slate-800 text-center">
                            <p className="text-sm text-slate-500">
                                Already have an account?{' '}
                                <Link
                                    to="/login"
                                    className="font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
                                >
                                    Sign in
                                </Link>
                            </p>
                        </div>

                        {/* Security */}
                        <div className="mt-5 flex items-center justify-center gap-2 text-[11px] text-slate-600">
                            <svg
                                className="w-3.5 h-3.5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeWidth="1.8"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M12 3l7 4v5c0 4.5-3 7.7-7 9-4-1.3-7-4.5-7-9V7l7-4z"
                                />
                            </svg>

                            Protected warehouse access
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}