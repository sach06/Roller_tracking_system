import React, { useState } from 'react';
import axios from 'axios';

const Workshop = () => {
    const [formData, setFormData] = useState({
        assetId: '',
        status: 'Workshop',
        location: 'Workshop',
        customerName: '',
        deliveryDate: ''
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
                pageId: 'PG0007',
                eventType: 'Workshop',
                eventData: formData,
                userId: JSON.parse(localStorage.getItem('user')).Username
            });
            alert('Workshop data recorded!');
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div>
            <h1>🏢 Workshop Operations</h1>
            <div className="card">
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Asset ID</label>
                        <input name="assetId" value={formData.assetId} onChange={handleChange} required />
                    </div>
                    <div className="form-group">
                        <label>Status</label>
                        <select name="status" value={formData.status} onChange={handleChange}>
                            <option value="Workshop">In Workshop</option>
                            <option value="Outgoing">Outgoing / Delivery</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Customer Name</label>
                        <input name="customerName" value={formData.customerName} onChange={handleChange} />
                    </div>
                    <div className="form-group">
                        <label>Delivery Date</label>
                        <input type="date" name="deliveryDate" value={formData.deliveryDate} onChange={handleChange} />
                    </div>
                    <button type="submit" className="btn">Record Workshop Data</button>
                </form>
            </div>
        </div>
    );
};

export default Workshop;
