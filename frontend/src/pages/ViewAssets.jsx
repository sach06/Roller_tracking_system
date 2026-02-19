import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './InsertProcessing.css'; // Reuse professional styles

const ViewAssets = () => {
    const [rollerType, setRollerType] = useState('');
    const [driveType, setDriveType] = useState('');
    const [tableData, setTableData] = useState([]);
    const [showTable, setShowTable] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleShowData = async () => {
        if (!rollerType || !driveType) return;
        setLoading(true);
        try {
            const response = await axios.get('/api/assets', {
                params: { rollerType, driveType }
            });
            if (response.data.success) {
                setTableData(response.data.data);
                setShowTable(true);
            }
        } catch (err) {
            console.error('Error fetching data:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="insert-processing">
            <h2 className="page-title">View Assets</h2>

            <div className="filter-section">
                <div className="filter-row">
                    <div className="filter-group">
                        <label className="filter-label pink">Roller Type</label>
                        <select
                            value={rollerType}
                            onChange={(e) => {
                                setRollerType(e.target.value);
                                setDriveType('');
                                setShowTable(false);
                            }}
                        >
                            <option value="">-- Select --</option>
                            <option value="Roller">Roller</option>
                            <option value="Sleeve">Sleeve</option>
                        </select>
                    </div>

                    {rollerType && (
                        <div className="filter-group">
                            <label className="filter-label white">Drive/Idle roll</label>
                            <select
                                value={driveType}
                                onChange={(e) => {
                                    setDriveType(e.target.value);
                                    setShowTable(false);
                                }}
                            >
                                <option value="">-- Select --</option>
                                {rollerType === 'Roller' ? (
                                    <>
                                        <option value="Drive">Drive roll</option>
                                        <option value="Idle">Idle roll</option>
                                    </>
                                ) : (
                                    <option value="Idle">Idle roll</option>
                                )}
                            </select>
                        </div>
                    )}

                    <div className="button-group">
                        <button
                            className="btn btn-show"
                            onClick={handleShowData}
                            disabled={!rollerType || !driveType || loading}
                        >
                            {loading ? 'Loading...' : 'Show'}
                        </button>
                    </div>
                </div>
            </div>

            {showTable && (
                <div className="table-section">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Asset ID</th>
                                <th>Serial Number</th>
                                <th>Status</th>
                                <th>Location</th>
                                <th>Manufacturer</th>
                            </tr>
                        </thead>
                        <tbody>
                            {tableData.length === 0 ? (
                                <tr>
                                    <td colSpan="5" style={{ textAlign: 'center' }}>No data found</td>
                                </tr>
                            ) : (
                                tableData.map((row, index) => (
                                    <tr key={index}>
                                        <td>{row.AssetID}</td>
                                        <td>{row.SerialNumber || 'N/A'}</td>
                                        <td>{row.CurrentStatus || 'N/A'}</td>
                                        <td>{row.CurrentLocation || 'N/A'}</td>
                                        <td>{row.Manufacturer || 'N/A'}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default ViewAssets;
