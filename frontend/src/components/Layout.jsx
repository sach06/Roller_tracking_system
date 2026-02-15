import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';

const Layout = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (!storedUser) {
            navigate('/login');
        } else {
            setUser(JSON.parse(storedUser));
        }
    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem('user');
        navigate('/login');
    };

    if (!user) return null;

    const role = user.Role;

    return (
        <div className="container">
            <aside className="sidebar">
                <h2>Roller Tracker</h2>
                <nav>
                    <NavLink to="/dashboard" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
                        🏠 Dashboard
                    </NavLink>
                    {(role === 'REF_OP' || role === 'REF_ADMIN') && (
                        <>
                            <NavLink to="/disassembly" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
                                🔧 Disassembly
                            </NavLink>
                            <NavLink to="/processing" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
                                ⚙️ Processing
                            </NavLink>
                            <NavLink to="/scrap" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
                                🗑️ Scrap
                            </NavLink>
                        </>
                    )}
                    {(role === 'WS_OP' || role === 'WS_ADMIN') && (
                        <NavLink to="/workshop" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
                            🏢 Workshop
                        </NavLink>
                    )}
                </nav>
                <div style={{ marginTop: 'auto' }}>
                    <p style={{ fontSize: '0.9em', color: '#aaa' }}>Logged in as: {user.Username}</p>
                    <button onClick={handleLogout} className="btn" style={{ width: '100%', background: '#cc0000' }}>
                        Logout
                    </button>
                </div>
            </aside>
            <main className="content">
                <Outlet />
            </main>
        </div>
    );
};

export default Layout;
