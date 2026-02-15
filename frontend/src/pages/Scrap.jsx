import React, { useState } from 'react';
import axios from 'axios';

const Scrap = () => {
    const [formData, setFormData] = useState({
        assetId: '',
        reason: 'End of Life',
        details: '',
        approvedBy: ''
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post('/api/assets', { ...formData, status: 'Scrapped', location: 'Scrap Yard', userId: JSON.parse(localStorage.getItem('user')).Username });
            await axios.post('/api/events', {
                assetId: formData.assetId,
                pageId: 'PG0010',
                eventType: 'Scrap',
                eventData: formData,
                userId: JSON.parse(localStorage.getItem('user')).Username
            });
            alert('Scrap recorded successfully!');
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div>
            <h1>🗑️ Scrap Management</h1>
            <div className="card">
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Asset ID</label>
                        <input name="assetId" value={formData.assetId} onChange={handleChange} required />
                    </div>
                    <div className="form-group">
                        <label>Reason</label>
                        <select name="reason" value={formData.reason} onChange={handleChange}>
                            <option value="End of Life">End of Life / Wearing</option>
                            <option value="Damage">Major Damage</option>
                            <option value="Quality">Quality Rejection</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Details</label>
                        <textarea name="details" value={formData.details} onChange={handleChange} />
                    </div>
                    <div className="form-group">
                        <label>Approved By</label>
                        <input name="approvedBy" value={formData.approvedBy} onChange={handleChange} />
                    </div>
                    <button type="submit" className="btn" style={{ backgroundColor: 'red' }}>Confirm Scrapping</button>
                </form>
            </div>
        </div>
    );
};

export default Scrap;
