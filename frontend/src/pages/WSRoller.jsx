import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './InsertProcessing.css';

const WSRoller = () => {
    const navigate = useNavigate();
    const [driveType, setDriveType] = useState('');
    const [tableData, setTableData] = useState([]);
    const [showTable, setShowTable] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleShow = async () => {
        if (!driveType) {
            alert('Please select Drive/Idle roll type');
            return;
        }
        setLoading(true);
        try {
            const response = await axios.get('/api/ws/rollers', {
                params: { rollerFunction: driveType }
            });
            if (response.data.success) {
                setTableData(response.data.rollers);
                setShowTable(true);
            }
        } catch (err) {
            console.error('Error fetching rollers:', err);
            alert('Error loading data');
        } finally {
            setLoading(false);
        }
    };

    const handleRowClick = (lifecycleId, rollerId) => {
        navigate(`/ws-roller-details/${lifecycleId}/${rollerId}`);
    };

    return (
        <div className="insert-processing">
            <h2 className="page-title">Roller at Workshop</h2>

            <div className="filter-section">
                <div className="filter-row">
                    <div className="filter-group">
                        <label className="filter-label pink">Roller Type: Roller</label>
                        <select value="Roller" disabled>
                            <option value="Roller">Roller</option>
                        </select>
                    </div>

                    <div className="filter-group">
                        <label className="filter-label white">Drive roll/Idle roll</label>
                        <select value={driveType} onChange={(e) => { setDriveType(e.target.value); setShowTable(false); }}>
                            <option value="">-- Select --</option>
                            <option value="Drive">Drive roll</option>
                            <option value="Idle">Idle roll</option>
                        </select>
                    </div>

                    <div className="button-group">
                        <button className="btn btn-show" onClick={handleShow} disabled={!driveType || loading}>
                            {loading ? 'Loading...' : 'Show'}
                        </button>
                    </div>
                </div>
            </div>

            {showTable && (
                <div className="table-section">
                    <p className="instruction-text">Click on link to insert data</p>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Roll ID link</th>
                                <th>Caster ID</th>
                                <th>Strand ID</th>
                                <th>Incoming Customer</th>
                                <th>Received At</th>
                                <th>Processed At</th>
                            </tr>
                        </thead>
                        <tbody>
                            {tableData.length === 0 ? (
                                <tr><td colSpan="6" style={{ textAlign: 'center' }}>No processed rollers found</td></tr>
                            ) : (
                                tableData.map((row, index) => (
                                    <tr key={index}>
                                        <td>
                                            <a href="#" className="roller-link"
                                                onClick={(e) => { e.preventDefault(); handleRowClick(row.lifecycle_id, row.roller_sleeve_id); }}>
                                                {row.roller_sleeve_id}
                                            </a>
                                        </td>
                                        <td>{row.caster_name || 'N/A'}</td>
                                        <td>{row.strand_no || 'N/A'}</td>
                                        <td>{row.site_name || 'N/A'}</td>
                                        <td>{row.received_at ? new Date(row.received_at).toLocaleDateString() : 'N/A'}</td>
                                        <td>{row.processed_at ? new Date(row.processed_at).toLocaleDateString() : 'N/A'}</td>
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

export default WSRoller;
