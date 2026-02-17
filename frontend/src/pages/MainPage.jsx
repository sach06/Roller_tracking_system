import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './MainPage.css';

const MainPage = () => {
    const [activeTab, setActiveTab] = useState('');
    const [rollerType, setRollerType] = useState('');
    const [driveType, setDriveType] = useState('');
    const [tableData, setTableData] = useState([]);
    const [showTable, setShowTable] = useState(false);
    const [user, setUser] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
    }, []);

    const handleTabClick = (tab) => {
        setActiveTab(tab);
        setShowTable(false);
        setRollerType('');
        setDriveType('');
    };

    const handleShowData = async () => {
        try {
            // Fetch data based on filters
            const response = await axios.get('/api/assets', {
                params: { rollerType, driveType }
            });
            if (response.data.success) {
                setTableData(response.data.data);
                setShowTable(true);
            }
        } catch (err) {
            console.error('Error fetching data:', err);
        }
    };

    const handleRowClick = (assetId) => {
        navigate(`/asset-details/${assetId}`);
    };

    const renderInsertContent = () => (
        <div className="tab-content">
            <button
                className="action-btn"
                onClick={() => navigate('/insert-disassembly')}
            >
                Insert at disassembly
            </button>
            <button
                className="action-btn"
                onClick={() => navigate('/processing')}
            >
                Insert after processing
            </button>
        </div>
    );

    const renderUpdateContent = () => (
        <div className="tab-content">
            <div className="filter-row">
                <div className="filter-group">
                    <label className="filter-label">Roller Type: Roller/Sleeve</label>
                    <select
                        className="filter-dropdown"
                        value={rollerType}
                        onChange={(e) => {
                            setRollerType(e.target.value);
                            setDriveType('');
                        }}
                    >
                        <option value="">-- Select --</option>
                        <option value="Roller">Roller</option>
                        <option value="Sleeve">Sleeve</option>
                    </select>
                </div>

                {rollerType && (
                    <div className="filter-group">
                        <label className="filter-label">Drive roll/Idle roll</label>
                        <select
                            className="filter-dropdown"
                            value={driveType}
                            onChange={(e) => setDriveType(e.target.value)}
                        >
                            <option value="">-- Select --</option>
                            {rollerType === 'Roller' ? (
                                <>
                                    <option value="Drive">Drive roll</option>
                                    <option value="Idle">Idle roll</option>
                                </>
                            ) : (
                                <option value="Idle">Idle</option>
                            )}
                        </select>
                    </div>
                )}

                <button
                    className="show-btn"
                    onClick={handleShowData}
                    disabled={!rollerType || !driveType}
                >
                    Show
                </button>
            </div>

            {showTable && (
                <div className="data-section">
                    <p className="instruction-text">Click on link to update data</p>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Roller/Sl_caster ID link</th>
                                <th>starand ID</th>
                                <th>......</th>
                            </tr>
                        </thead>
                        <tbody>
                            {tableData.map((row, index) => (
                                <tr key={index}>
                                    <td>
                                        <a
                                            href="#"
                                            className="asset-link"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                handleRowClick(row.AssetID);
                                            }}
                                        >
                                            {row.AssetID}
                                        </a>
                                    </td>
                                    <td>{row.SerialNumber}</td>
                                    <td>...</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );

    const renderViewDataContent = () => (
        <div className="tab-content">
            <div className="filter-row">
                <div className="filter-group">
                    <label className="filter-label">Roller Type: Roller/Sleeve</label>
                    <select
                        className="filter-dropdown"
                        value={rollerType}
                        onChange={(e) => {
                            setRollerType(e.target.value);
                            setDriveType('');
                        }}
                    >
                        <option value="">-- Select --</option>
                        <option value="Roller">Roller</option>
                        <option value="Sleeve">Sleeve</option>
                    </select>
                </div>

                {rollerType && (
                    <div className="filter-group">
                        <label className="filter-label">Drive roll/Idle roll</label>
                        <select
                            className="filter-dropdown"
                            value={driveType}
                            onChange={(e) => setDriveType(e.target.value)}
                        >
                            <option value="">-- Select --</option>
                            {rollerType === 'Roller' ? (
                                <>
                                    <option value="Drive">Drive roll</option>
                                    <option value="Idle">Idle roll</option>
                                </>
                            ) : (
                                <option value="Idle">Idle</option>
                            )}
                        </select>
                    </div>
                )}

                <button
                    className="show-btn"
                    onClick={handleShowData}
                    disabled={!rollerType || !driveType}
                >
                    Show
                </button>
            </div>

            {showTable && (
                <div className="data-section">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Roller/Sl_caster ID link</th>
                                <th>starand ID</th>
                                <th>......</th>
                            </tr>
                        </thead>
                        <tbody>
                            {tableData.map((row, index) => (
                                <tr key={index}>
                                    <td>
                                        <a
                                            href="#"
                                            className="asset-link"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                handleRowClick(row.AssetID);
                                            }}
                                        >
                                            {row.AssetID}
                                        </a>
                                    </td>
                                    <td>{row.SerialNumber}</td>
                                    <td>...</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );

    const renderScrapContent = () => (
        <div className="tab-content">
            <button
                className="action-btn"
                onClick={() => navigate('/scrap-roller')}
            >
                Scrap Roller/Sleeve
            </button>
            <button
                className="action-btn"
                onClick={() => navigate('/scrap-axle')}
            >
                Scrap Axle
            </button>
        </div>
    );

    return (
        <div className="main-page">
            <div className="page-header">
                <h2>Main Page</h2>
                {user?.site && (
                    <div className="customer-badge">
                        Customer Name: {user.site}
                    </div>
                )}
            </div>

            <div className="tabs-container">
                <button
                    className={`tab ${activeTab === 'insert' ? 'active' : ''}`}
                    onClick={() => handleTabClick('insert')}
                >
                    Insert
                </button>
                <button
                    className={`tab ${activeTab === 'update' ? 'active' : ''}`}
                    onClick={() => handleTabClick('update')}
                >
                    Update
                </button>
                <button
                    className={`tab ${activeTab === 'view' ? 'active' : ''}`}
                    onClick={() => handleTabClick('view')}
                >
                    View data
                </button>
                <button
                    className={`tab ${activeTab === 'scrap' ? 'active' : ''}`}
                    onClick={() => handleTabClick('scrap')}
                >
                    Scrap
                </button>
            </div>

            <div className="content-area">
                {activeTab === 'insert' && renderInsertContent()}
                {activeTab === 'update' && renderUpdateContent()}
                {activeTab === 'view' && renderViewDataContent()}
                {activeTab === 'scrap' && renderScrapContent()}
                {!activeTab && (
                    <div className="placeholder-text">
                        Please select a tab above to get started
                    </div>
                )}
            </div>
        </div>
    );
};

export default MainPage;
