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
        fetchSites();
    }, []);

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
                const userData = { ...response.data.user, site: selectedSite };
                localStorage.setItem('user', JSON.stringify(userData));
                navigate('/dashboard');
            }
        } catch (err) {
            setError('Invalid credentials');
        }
    };

    return (
        <div className="login-container">
            <div className="login-box">
                <h2 style={{ textAlign: 'center', marginBottom: '30px', color: '#0047AB' }}>
                    Roller Tracker
                </h2>

                {error && <p style={{ color: 'red', textAlign: 'center', marginBottom: '15px' }}>{error}</p>}

                {loading ? (
                    <p style={{ textAlign: 'center' }}>Loading sites...</p>
                ) : (
                    <form onSubmit={handleSubmit}>
                        {/* Step 1: Site Selection */}
                        <div className="form-group">
                            <label>Site / Customer</label>
                            <select
                                value={selectedSite}
                                onChange={(e) => setSelectedSite(e.target.value)}
                                required
                                style={{
                                    padding: '10px',
                                    fontSize: '1em',
                                    backgroundColor: selectedSite ? '#e8f4f8' : 'white'
                                }}
                            >
                                <option value="">-- Select Site --</option>
                                {sites.map((site, index) => (
                                    <option key={index} value={site.site_name}>
                                        {site.site_name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Step 2: Username & Password (only show after site selection) */}
                        {selectedSite && (
                            <>
                                <div className="form-group" style={{ marginTop: '20px' }}>
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
                                    style={{
                                        width: '100%',
                                        marginTop: '20px',
                                        padding: '12px',
                                        fontSize: '1.1em'
                                    }}
                                >
                                    Log in
                                </button>
                            </>
                        )}
                    </form>
                )}
            </div>
        </div>
    );
};

export default Login;
