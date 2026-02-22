import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Login = () => {
    const [sites, setSites] = useState([]);
    const [selectedSite, setSelectedSite] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const user = localStorage.getItem('user');
        if (user) {
            navigate('/');
        }
        fetchSites();
    }, [navigate]);

    const fetchSites = async () => {
        try {
            const response = await axios.get('/api/sites');
            if (response.data.success) {
                setSites(response.data.sites);
            }
        } catch (err) {
            setError('Failed to load sites');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post('/api/login', { username, password });
            if (response.data.success) {
                const selectedSiteObj = sites.find(s => s.site_name === selectedSite);
                const userData = {
                    ...response.data.user,
                    site: selectedSite,
                    site_id: selectedSiteObj?.site_id
                };
                localStorage.setItem('user', JSON.stringify(userData));
                navigate('/');
            }
        } catch (err) {
            setError('Invalid credentials');
        }
    };

    return (
        <div className="login-container">
            {/* Left branding panel */}
            <div className="login-brand-panel">
                <h1 className="login-brand-title">Roller Tracking System</h1>
                <p className="login-brand-subtitle">Workshop Management &amp; Quality Control</p>
            </div>

            {/* Right login form */}
            <div className="login-form-panel">
                <div className="login-box">
                    <h2 className="login-heading">Sign In</h2>
                    <p className="login-subheading">Please select your site and enter your credentials</p>

                    {error && (
                        <div className="login-error">
                            <span>⚠</span> {error}
                        </div>
                    )}

                    {loading ? (
                        <p style={{ textAlign: 'center', color: '#6B7280' }}>Loading sites…</p>
                    ) : (
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>Site / Customer</label>
                                <select
                                    value={selectedSite}
                                    onChange={(e) => setSelectedSite(e.target.value)}
                                    required
                                >
                                    <option value="">— Select Site —</option>
                                    {sites.map((site, index) => (
                                        <option key={index} value={site.site_name}>
                                            {site.site_name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {selectedSite && (
                                <>
                                    <div className="form-group" style={{ marginTop: '18px' }}>
                                        <label>User ID</label>
                                        <input
                                            type="text"
                                            value={username}
                                            onChange={(e) => setUsername(e.target.value)}
                                            placeholder="Enter your username"
                                            required
                                            autoFocus
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Password</label>
                                        <input
                                            type="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="Enter your password"
                                            required
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        className="btn"
                                        style={{ width: '100%', marginTop: '24px', padding: '13px', fontSize: '1em', letterSpacing: '0.03em' }}
                                    >
                                        Sign In
                                    </button>
                                </>
                            )}
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Login;
