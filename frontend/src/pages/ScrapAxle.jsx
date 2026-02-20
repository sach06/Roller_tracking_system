import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './InsertDisassembly.css';

const ScrapAxle = () => {
    const navigate = useNavigate();
    const [axleId, setAxleId] = useState('');
    const [scrapReason, setScrapReason] = useState('');
    const [scrapDate, setScrapDate] = useState(new Date().toISOString().split('T')[0]);
    const [existingAxles, setExistingAxles] = useState([]);
    const [errors, setErrors] = useState({});
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);

    useEffect(() => {
        fetchAxles();
    }, []);

    const fetchAxles = async () => {
        try {
            const response = await axios.get('/api/axles/existing');
            if (response.data.success) {
                setExistingAxles(response.data.axles);
            }
        } catch (err) {
            console.error('Error fetching axles:', err);
        }
    };

    const validateForm = () => {
        const newErrors = {};
        if (!axleId) newErrors.axleId = 'Required';
        if (!scrapReason) newErrors.scrapReason = 'Required';
        if (!scrapDate) newErrors.scrapDate = 'Required';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = () => {
        if (validateForm()) {
            setShowConfirmDialog(true);
        }
    };

    const confirmSubmit = async () => {
        try {
            const response = await axios.post('/api/scrap/axle', {
                axleId,
                scrapReason,
                scrapDate
            });
            if (response.data.success) {
                alert('Axle scrapped successfully!');
                navigate('/');
            }
        } catch (err) {
            alert('Error scrapping axle: ' + err.message);
        }
        setShowConfirmDialog(false);
    };

    return (
        <div className="insert-disassembly">
            <h2 className="page-title">Insert scrap: Axle</h2>

            <div className="form-container">
                <div className="section-row">
                    <div className="field-group red-field">
                        <label>Axle ID</label>
                        <select
                            value={axleId}
                            onChange={(e) => setAxleId(e.target.value)}
                            className={errors.axleId ? 'error' : ''}
                        >
                            <option value="">-- Select --</option>
                            {existingAxles.map((axle, idx) => (
                                <option key={idx} value={axle.axle_id}>
                                    {axle.axle_id}
                                </option>
                            ))}
                        </select>
                        {errors.axleId && <span className="error-text">{errors.axleId}</span>}
                    </div>

                    <div className="field-group red-field">
                        <label>Scrap reason</label>
                        <input
                            type="text"
                            value={scrapReason}
                            onChange={(e) => setScrapReason(e.target.value)}
                            className={errors.scrapReason ? 'error' : ''}
                            placeholder="Enter reason"
                        />
                        {errors.scrapReason && <span className="error-text">{errors.scrapReason}</span>}
                    </div>

                    <div className="field-group white-field">
                        <label>Scraping Date</label>
                        <input
                            type="date"
                            value={scrapDate}
                            onChange={(e) => setScrapDate(e.target.value)}
                            className={errors.scrapDate ? 'error' : ''}
                        />
                        {errors.scrapDate && <span className="error-text">{errors.scrapDate}</span>}
                    </div>
                </div>

                <div className="action-buttons">
                    <button className="btn btn-back" onClick={() => navigate(-1)}>Back</button>
                    <button className="btn btn-cancel" onClick={() => navigate('/')}>Cancel</button>
                    <button className="btn btn-submit" onClick={handleSubmit}>Submit</button>
                </div>
            </div>

            {showConfirmDialog && (
                <div className="modal-overlay">
                    <div className="modal-dialog">
                        <p>Are you sure to scrap this axle?</p>
                        <div className="modal-buttons">
                            <button className="btn btn-cancel" onClick={() => setShowConfirmDialog(false)}>Cancel</button>
                            <button className="btn btn-submit" onClick={confirmSubmit}>Confirm</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ScrapAxle;
