import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './InsertProcessing.css';

const InsertProcessing = () => {
    const navigate = useNavigate();
    const [rollerType, setRollerType] = useState('Roller');
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
            const response = await axios.get('/api/processing/rollers', {
                params: {
                    rollerType: rollerType,
                    rollerFunction: driveType
                }
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

    const handleRowClick = (rollerId, lifecycleId) => {
        navigate(`/processing-details/${rollerId}/${lifecycleId}`);
    };


    return (
        <div className="insert-processing">
            <h2 className="page-title">Insert after Processing</h2>

            <div className="filter-section">
                <div className="filter-row">
                    <div className="filter-group">
                        <label className="filter-label pink">Roller Type: {rollerType}</label>
                        <select
                            value={rollerType}
                            onChange={(e) => {
                                const val = e.target.value;
                                setRollerType(val);
                                if (val === 'Sleeve') {
                                    setDriveType('Idle');
                                } else {
                                    setDriveType('');
                                }
                                setShowTable(false);
                            }}
                        >
                            <option value="Roller">Roller</option>
                            <option value="Sleeve">Sleeve</option>
                        </select>
                    </div>

                    <div className="filter-group">
                        <label className="filter-label white">
                            {rollerType === 'Roller' ? 'Drive roll/Idle roll' : 'Idle roll'}
                        </label>
                        <select
                            value={driveType}
                            onChange={(e) => setDriveType(e.target.value)}
                            disabled={rollerType === 'Sleeve'}
                        >
                            <option value="">-- Select --</option>
                            {rollerType === 'Roller' && <option value="Drive">Drive roll</option>}
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
                                <th>{rollerType === 'Roller' ? 'Roll id link' : 'Sleeve id link'}</th>
                                <th>Caster ID</th>
                                <th>Strand ID</th>
                                <th>Incoming Customer</th>
                                <th>Received At</th>
                                <th>Skinpass Count</th>
                                <th>Cladding Count</th>
                            </tr>
                        </thead>
                        <tbody>
                            {tableData.length === 0 ? (
                                <tr>
                                    <td colSpan="7" style={{ textAlign: 'center' }}>No data found</td>
                                </tr>
                            ) : (
                                tableData.map((row, index) => (
                                    <tr key={index}>
                                        <td>
                                            <a
                                                href="#"
                                                className="roller-link"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    handleRowClick(row.roller_sleeve_id, row.lifecycle_id);
                                                }}
                                            >
                                                {row.roller_sleeve_id}
                                            </a>
                                        </td>
                                        <td>{row.caster_name || 'N/A'}</td>
                                        <td>{row.strand_no || 'N/A'}</td>
                                        <td>{row.site_name || 'N/A'}</td>
                                        <td>{row.received_at ? new Date(row.received_at).toLocaleDateString() : 'N/A'}</td>
                                        <td>{row.skin_cut_count || 0}</td>
                                        <td>{row.cladded_count || 0}</td>
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

export default InsertProcessing;
