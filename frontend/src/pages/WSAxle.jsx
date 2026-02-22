import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './InsertProcessing.css';

const WSAxle = () => {
    const navigate = useNavigate();
    const [driveType, setDriveType] = useState('Idle');
    const [tableData, setTableData] = useState([]);
    const [showTable, setShowTable] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleShow = async () => {
        setLoading(true);
        try {
            const response = await axios.get('/api/ws/sleeves');
            if (response.data.success) {
                setTableData(response.data.sleeves);
                setShowTable(true);
            }
        } catch (err) {
            console.error('Error fetching sleeves:', err);
            alert('Error loading data');
        } finally {
            setLoading(false);
        }
    };

    const handleRowClick = (lifecycleId, axleId) => {
        navigate(`/ws-axle-details/${lifecycleId}/${axleId}`);
    };

    return (
        <div className="insert-processing">
            <h2 className="page-title">Sleeve at Workshop</h2>

            <div className="filter-section">
                <div className="filter-row">
                    <div className="filter-group">
                        <label className="filter-label pink">Roller Type: Sleeve</label>
                        <select value="Sleeve" disabled>
                            <option value="Sleeve">Sleeve</option>
                        </select>
                    </div>

                    <div className="filter-group">
                        <label className="filter-label white">Idle roll</label>
                        <select value={driveType} disabled>
                            <option value="Idle">Idle roll</option>
                        </select>
                    </div>

                    <div className="button-group">
                        <button className="btn btn-show" onClick={handleShow} disabled={loading}>
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
                                <th>Axle ID link</th>
                                <th>Caster ID</th>
                                <th>Strand ID</th>
                                <th>Incoming Customer</th>
                                <th>Processed At</th>
                            </tr>
                        </thead>
                        <tbody>
                            {tableData.length === 0 ? (
                                <tr><td colSpan="5" style={{ textAlign: 'center' }}>No processed sleeves found</td></tr>
                            ) : (
                                tableData.map((row, index) => (
                                    <tr key={index}>
                                        <td>
                                            <a href="#" className="roller-link"
                                                onClick={(e) => { e.preventDefault(); handleRowClick(row.lifecycle_id, row.received_axle_id); }}>
                                                {row.received_axle_id}
                                            </a>
                                        </td>
                                        <td>{row.caster_name || 'N/A'}</td>
                                        <td>{row.strand_no || 'N/A'}</td>
                                        <td>{row.site_name || 'N/A'}</td>
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

export default WSAxle;
