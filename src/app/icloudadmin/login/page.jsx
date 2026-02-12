'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLogin() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const router = useRouter();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await fetch('/api/admin/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Login failed');
            }

            localStorage.setItem('adminToken', data.token);
            router.push('/icloudadmin/panel');

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] p-4">
            <div className="max-w-md w-full">
                {/* Logo/Header */}
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-semibold text-white mb-2">iCloud Panel</h1>
                    <p className="text-sm text-gray-400">Admin Authentication</p>
                </div>

                {/* Login Card */}
                <div className="bg-[#1C1C1E] border border-[#2C2C2E] rounded p-6">
                    <form className="space-y-4" onSubmit={handleLogin}>
                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded text-sm font-medium">
                                {error}
                            </div>
                        )}

                        <div>
                            <label htmlFor="username" className="block text-xs font-medium text-gray-400 mb-2">
                                Username
                            </label>
                            <input
                                id="username"
                                name="username"
                                type="text"
                                required
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full px-3 py-2.5 bg-[#0a0a0a] border border-[#2C2C2E] rounded text-sm text-gray-300 placeholder-gray-500 focus:outline-none focus:border-[#f0b100] focus:ring-1 focus:ring-[#f0b100]"
                                placeholder="Enter your username"
                            />
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-xs font-medium text-gray-400 mb-2">
                                Password
                            </label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-3 py-2.5 bg-[#0a0a0a] border border-[#2C2C2E] rounded text-sm text-gray-300 placeholder-gray-500 focus:outline-none focus:border-[#f0b100] focus:ring-1 focus:ring-[#f0b100]"
                                placeholder="Enter your password"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-2.5 bg-[#f0b100] hover:bg-[#d99a00] text-black font-semibold rounded text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-6"
                        >
                            {loading ? 'Signing in...' : 'Sign In'}
                        </button>
                    </form>
                </div>

                {/* Footer */}
                <div className="text-center mt-6">
                    <p className="text-xs text-gray-500">
                        Protected by enterprise security
                    </p>
                </div>
            </div>
        </div>
    );
}