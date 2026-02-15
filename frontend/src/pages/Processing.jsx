import React, { useState } from 'react';
import axios from 'axios';

const Processing = () => {
    const [formData, setFormData] = useState({
        assetId: '',
        status: 'Processing',
        location: 'Processing Unit',
        notes: ''
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post('/api/assets', { ...formData, userId: JSON.parse(localStorage.getItem('user')).Username });
            await axios.post('/api/events', {
                assetId: formData.assetId,
                pageId: 'PG0006',
                eventType: 'Processing',
                eventData: formData,
                userId: JSON.parse(localStorage.getItem('user')).Username
            });
            alert('Processing data recorded!');
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div>
            <h1>⚙️ Processing</h1>
            <div className="card">
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Asset ID</label>
                        <input name="assetId" value={formData.assetId} onChange={handleChange} required />
                    </div>
                    <div className="form-group">
                        <label>Status</label>
                        <select name="status" value={formData.status} onChange={handleChange}>
                            <option value="Processing">Processing</option>
                            <option value="Assembled">Assembled</option>
                            <option value="Ready for Workshop">Ready for Workshop</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Location</label>
                        <input name="location" value={formData.location} onChange={handleChange} />
                    </div>
                    <button type="submit" className="btn">Record Processing</button>
                </form>
            </div>
        </div>
    );
};

export default Processing;
