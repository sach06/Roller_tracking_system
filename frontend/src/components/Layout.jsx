import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';

const Layout = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [user, setUser] = useState(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [openGroup, setOpenGroup] = useState(null); // 'insert' | 'scrap' | null

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (!storedUser) {
            navigate('/login');
        } else {
            setUser(JSON.parse(storedUser));
        }
    }, [navigate]);

    // Auto-expand based on current route
    useEffect(() => {
        if (location.pathname.startsWith('/insert') || location.pathname.startsWith('/processing-add-new')) {
            setOpenGroup('insert');
        } else if (location.pathname.startsWith('/scrap')) {
            setOpenGroup('scrap');
        }
    }, [location.pathname]);

    const handleLogout = () => {
        localStorage.removeItem('user');
        navigate('/login');
    };

    const toggleGroup = (group) => {
        setOpenGroup(prev => prev === group ? null : group);
    };

    if (!user) return null;

    const isInsertActive = location.pathname.startsWith('/insert') || location.pathname === '/processing-add-new';
    const isScrapActive = location.pathname.startsWith('/scrap');

    return (
        <div className="container">
            <aside className={`sidebar${!isSidebarOpen ? ' hidden' : ''}`}>
                {/* Brand / Logo */}
                <div className="sidebar-brand">
                    <img src="/SMS_Logo.jpg" alt="SMS group" className="sidebar-logo" />
                    <span className="sidebar-title">Roller Tracker</span>
                </div>

                <nav className="sidebar-nav">
                    {/* ---- INSERT (collapsible) ---- */}
                    <button
                        className={`nav-group-btn${isInsertActive ? ' active' : ''}`}
                        onClick={() => toggleGroup('insert')}
                    >
                        <span className="nav-icon">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                            </svg>
                        </span>
                        Insert
                        <span className={`chevron${openGroup === 'insert' ? ' open' : ''}`}>›</span>
                    </button>
                    {openGroup === 'insert' && (
                        <div className="nav-sub">
                            <NavLink to="/processing-add-new" className={({ isActive }) => 'nav-sub-link' + (isActive ? ' active' : '')}>
                                New Entry
                            </NavLink>
                            <NavLink to="/insert-disassembly" className={({ isActive }) => 'nav-sub-link' + (isActive ? ' active' : '')}>
                                At Disassembly
                            </NavLink>
                            <NavLink to="/insert-processing" className={({ isActive }) => 'nav-sub-link' + (isActive ? ' active' : '')}>
                                After Processing
                            </NavLink>
                        </div>
                    )}

                    {/* ---- UPDATE ---- */}
                    <NavLink to="/update" className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}>
                        <span className="nav-icon">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                        </span>
                        Update
                    </NavLink>

                    {/* ---- VIEW ---- */}
                    <NavLink to="/view" className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}>
                        <span className="nav-icon">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                <circle cx="12" cy="12" r="3" />
                            </svg>
                        </span>
                        View
                    </NavLink>

                    {/* ---- SCRAP (collapsible) ---- */}
                    <button
                        className={`nav-group-btn${isScrapActive ? ' active' : ''}`}
                        onClick={() => toggleGroup('scrap')}
                    >
                        <span className="nav-icon">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" />
                                <path d="M10 11v6" /><path d="M14 11v6" />
                                <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                            </svg>
                        </span>
                        Scrap
                        <span className={`chevron${openGroup === 'scrap' ? ' open' : ''}`}>›</span>
                    </button>
                    {openGroup === 'scrap' && (
                        <div className="nav-sub">
                            <NavLink to="/scrap-roller" className={({ isActive }) => 'nav-sub-link' + (isActive ? ' active' : '')}>
                                Roller / Sleeve
                            </NavLink>
                            <NavLink to="/scrap-axle" className={({ isActive }) => 'nav-sub-link' + (isActive ? ' active' : '')}>
                                Axle
                            </NavLink>
                        </div>
                    )}
                </nav>

                {/* Footer */}
                <div className="sidebar-footer">
                    <div className="sidebar-user-info">
                        <div className="sidebar-user-name">{user.username}</div>
                        {user.site && <div className="sidebar-user-site">{user.site}</div>}
                    </div>
                    <button onClick={handleLogout} className="btn-logout">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                            <polyline points="16 17 21 12 16 7" />
                            <line x1="21" y1="12" x2="9" y2="12" />
                        </svg>
                        Logout
                    </button>
                </div>
            </aside>

            <main className="content" style={{ display: 'flex', flexDirection: 'column' }}>
                <header className="topbar">
                    <button
                        className="topbar-toggle"
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        title="Toggle sidebar"
                    >
                        ☰
                    </button>
                    <div className="topbar-brand">
                        <img src="/SMS_Logo.jpg" alt="SMS group" className="topbar-logo" />
                        <span className="topbar-title">Roller Tracking System</span>
                    </div>
                    <div className="topbar-right">
                        <span className="topbar-user">{user.site} — {user.username}</span>
                    </div>
                </header>
                <div style={{ flex: 1, overflowY: 'auto' }}>
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default Layout;
