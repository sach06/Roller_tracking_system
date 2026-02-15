import React, { useEffect, useState } from 'react';
import axios from 'axios';

const Dashboard = () => {
    const [stats, setStats] = useState({ total: 0, disassembled: 0, processing: 0, workshop: 0, scrapped: 0 });
    const [recentAssets, setRecentAssets] = useState([]);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const res = await axios.get('/api/assets');
            if (res.data.success) {
                const assets = res.data.data;
                const total = assets.length;
                const disassembled = assets.filter(a => a.CurrentStatus === 'Disassembled').length;
                const processing = assets.filter(a => a.CurrentStatus === 'Processing').length;
                const workshop = assets.filter(a => a.CurrentStatus === 'Workshop' || a.CurrentStatus.includes('Ready')).length;
                const scrapped = assets.filter(a => a.CurrentStatus === 'Scrapped').length;

                setStats({ total, disassembled, processing, workshop, scrapped });
                setRecentAssets(assets.sort((a, b) => new Date(b.UpdatedAt) - new Date(a.UpdatedAt)).slice(0, 5));
            }
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div>
            <h1>Dashboard</h1>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '20px', marginBottom: '30px' }}>
                <div className="card">
                    <h3>Total Assets</h3>
                    <p style={{ fontSize: '2em', fontWeight: 'bold' }}>{stats.total}</p>
                </div>
                <div className="card">
                    <h3>Disassembled</h3>
                    <p style={{ fontSize: '2em', fontWeight: 'bold' }}>{stats.disassembled}</p>
                </div>
                <div className="card">
                    <h3>Processing</h3>
                    <p style={{ fontSize: '2em', fontWeight: 'bold' }}>{stats.processing}</p>
                </div>
                <div className="card">
                    <h3>Workshop</h3>
                    <p style={{ fontSize: '2em', fontWeight: 'bold' }}>{stats.workshop}</p>
                </div>
                <div className="card">
                    <h3>Scrapped</h3>
                    <p style={{ fontSize: '2em', fontWeight: 'bold', color: 'red' }}>{stats.scrapped}</p>
                </div>
            </div>

            <div className="card">
                <h2>Recent Activity</h2>
                <table>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Type</th>
                            <th>Status</th>
                            <th>Location</th>
                            <th>Updated At</th>
                        </tr>
                    </thead>
                    <tbody>
                        {recentAssets.map(asset => (
                            <tr key={asset.AssetID}>
                                <td>{asset.AssetID}</td>
                                <td>{asset.AssetType}</td>
                                <td>{asset.CurrentStatus}</td>
                                <td>{asset.CurrentLocation}</td>
                                <td>{new Date(asset.UpdatedAt).toLocaleDateString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Dashboard;
