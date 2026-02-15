import React, { useState } from 'react';
import axios from 'axios';

const Disassembly = () => {
    const [formData, setFormData] = useState({
        assetId: '',
        assetType: 'Roller',
        serialNumber: '',
        condition: 'Good',
        location: 'Disassembly Area',
        manufacturer: '',
        notes: ''
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post('/api/assets', { ...formData, status: 'Disassembled', userId: JSON.parse(localStorage.getItem('user')).Username });
            await axios.post('/api/events', {
                assetId: formData.assetId,
                pageId: 'PG0003',
                eventType: 'Disassembly',
                eventData: formData,
                userId: JSON.parse(localStorage.getItem('user')).Username
            });
            alert('Disassembly recorded successfully!');
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div>
            <h1>🔧 Disassembly</h1>
            <div className="card">
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Asset Type</label>
                        <select name="assetType" value={formData.assetType} onChange={handleChange}>
                            <option value="Roller">Roller</option>
                            <option value="Sleeve">Sleeve</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Asset ID</label>
                        <input name="assetId" value={formData.assetId} onChange={handleChange} required />
                    </div>
                    <div className="form-group">
                        <label>Serial Number</label>
                        <input name="serialNumber" value={formData.serialNumber} onChange={handleChange} required />
                    </div>
                    <div className="form-group">
                        <label>Condition</label>
                        <select name="condition" value={formData.condition} onChange={handleChange}>
                            <option value="Good">Good</option>
                            <option value="Repairable">Repairable</option>
                            <option value="Critical">Critical</option>
                            <option value="Scrap">Scrap</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Notes</label>
                        <textarea name="notes" value={formData.notes} onChange={handleChange} />
                    </div>
                    <button type="submit" className="btn">Record Disassembly</button>
                </form>
            </div>
        </div>
    );
};

export default Disassembly;
