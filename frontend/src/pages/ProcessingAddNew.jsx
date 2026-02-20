import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './InsertDisassembly.css'; // Reusing professional styles
import './ProcessingDetails.css'; // Reusing professional styles

const ProcessingAddNew = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);

    // Form State - Basic
    const [rollerId, setRollerId] = useState('');
    const [rollerType, setRollerType] = useState('Roller');
    const [rollerFunction, setRollerFunction] = useState('');

    // Outgoing details
    const [outDiameterA, setOutDiameterA] = useState('');
    const [outDiameterB, setOutDiameterB] = useState('');
    const [outConfiguration, setOutConfiguration] = useState('');

    // Roller Specific
    const [haveJournal, setHaveJournal] = useState('');
    const [outJournalDiameterA, setOutJournalDiameterA] = useState('');
    const [outJournalDiameterB, setOutJournalDiameterB] = useState('');

    // Sleeve Specific
    const [axleId, setAxleId] = useState('');
    const [isNewAxle, setIsNewAxle] = useState(false);
    const [axleStraightening, setAxleStraightening] = useState('');
    const [existingAxles, setExistingAxles] = useState([]);

    const [errors, setErrors] = useState({});
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
        fetchExistingAxles();
    }, []);

    const fetchExistingAxles = async () => {
        try {
            const response = await axios.get('/api/axles/existing');
            if (response.data.success) setExistingAxles(response.data.axles);
        } catch (err) { console.error('Error fetching axles:', err); }
    };

    const validateForm = () => {
        const newErrors = {};
        if (!rollerId) newErrors.rollerId = 'Required';
        if (!rollerFunction) newErrors.rollerFunction = 'Required';

        // Outgoing validation
        if (!outDiameterA) newErrors.outDiameterA = 'Required';
        if (!outDiameterB) newErrors.outDiameterB = 'Required';
        if (!outConfiguration) newErrors.outConfiguration = 'Required';

        if (outDiameterA && (parseFloat(outDiameterA) < 95 || parseFloat(outDiameterA) > 200)) newErrors.outDiameterA = 'Must be 95-200mm';
        if (outDiameterB && (parseFloat(outDiameterB) < 95 || parseFloat(outDiameterB) > 200)) newErrors.outDiameterB = 'Must be 95-200mm';

        if (rollerType === 'Roller') {
            if (!haveJournal) newErrors.haveJournal = 'Required';
            if (haveJournal === 'Yes') {
                if (!outJournalDiameterA) newErrors.outJournalDiameterA = 'Required';
                if (!outJournalDiameterB) newErrors.outJournalDiameterB = 'Required';
            }
        } else {
            if (!axleId) newErrors.axleId = 'Required';
            if (!isNewAxle && !axleStraightening) newErrors.axleStraightening = 'Required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = () => {
        if (validateForm()) setShowConfirmDialog(true);
    };

    const confirmSubmit = async () => {
        try {
            const formData = {
                rollerId,
                rollerType,
                rollerFunction,
                siteId: user?.site_id,
                userId: user?.user_id,
                isNewAxle,

                // Outgoing
                out_diameter_a: parseFloat(outDiameterA),
                out_diameter_b: parseFloat(outDiameterB),
                out_configuration: parseInt(outConfiguration),

                // Roller
                have_journal_yn: haveJournal === 'Yes' ? 1 : 0,
                out_journal_diameter_a: outJournalDiameterA ? parseFloat(outJournalDiameterA) : null,
                out_journal_diameter_b: outJournalDiameterB ? parseFloat(outJournalDiameterB) : null,

                // Sleeve
                axle_id: axleId,
                axle_straight_flag: axleStraightening === 'Yes' ? 1 : 0
            };

            const response = await axios.post('/api/rollers/register', formData);
            if (response.data.success) {
                alert('New Entity Registered Successfully!');
                navigate('/insert-processing');
            }
        } catch (err) {
            console.error('Registration Error:', err);
            const msg = err.response?.data?.error || err.message || 'Unknown error';
            alert('Error: ' + msg);
        }
        setShowConfirmDialog(false);
    };

    return (
        <div className="processing-details">
            <h2 className="page-title">Insert new entry: {rollerType}</h2>

            <div className="form-container">
                {/* --- Main Section --- */}
                <div className="section-header">Insert</div>
                <div className="section-row">
                    <div className="field-group pink-field">
                        <label>Roller Type: {rollerType}</label>
                        <select value={rollerType} onChange={(e) => {
                            setRollerType(e.target.value);
                            setRollerFunction('');
                            setErrors({});
                        }}>
                            <option value="Roller">Roller</option>
                            <option value="Sleeve">Sleeve</option>
                        </select>
                    </div>

                    <div className="field-group pink-field">
                        <label>{rollerType === 'Roller' ? 'Drive roll/Idle roll' : 'Idle roll'}</label>
                        <select
                            value={rollerFunction}
                            onChange={(e) => setRollerFunction(e.target.value)}
                            className={errors.rollerFunction ? 'error' : ''}
                        >
                            <option value="">-- Select --</option>
                            {rollerType === 'Roller' && <option value="Drive">Drive roll</option>}
                            <option value="Idle">Idle roll</option>
                        </select>
                        {errors.rollerFunction && <span className="error-text">Required</span>}
                    </div>

                    <div className="field-group white-field">
                        <label>{rollerType} ID</label>
                        <input
                            type="text"
                            value={rollerId}
                            onChange={(e) => setRollerId(e.target.value)}
                            placeholder={`Enter ${rollerType} ID`}
                            className={errors.rollerId ? 'error' : ''}
                        />
                        {errors.rollerId && <span className="error-text">Required</span>}
                    </div>
                </div>

                {/* --- Outgoing Details Box --- */}
                <div className="outgoing-details-box" style={{
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                    padding: '20px',
                    marginTop: '20px',
                    backgroundColor: '#FAFAFA'
                }}>
                    <div className="section-header" style={{ marginBottom: '15px', color: '#6B7280', fontSize: '1rem' }}>Outgoing details</div>

                    {rollerType === 'Sleeve' && (
                        <div className="section-row">
                            <div className="field-group white-field">
                                <label>Axle ID</label>
                                {isNewAxle ? (
                                    <input type="text" value={axleId} onChange={(e) => setAxleId(e.target.value)} placeholder="New Axle ID" className={errors.axleId ? 'error' : ''} />
                                ) : (
                                    <select value={axleId} onChange={(e) => setAxleId(e.target.value)} className={errors.axleId ? 'error' : ''}>
                                        <option value="">-- Select --</option>
                                        {existingAxles.map(a => <option key={a.axle_id} value={a.axle_id}>{a.axle_id}</option>)}
                                    </select>
                                )}
                                <label className="checkbox-label" style={{ fontSize: '0.8rem', marginTop: '5px' }}>
                                    <input type="checkbox" checked={isNewAxle} onChange={(e) => {
                                        setIsNewAxle(e.target.checked);
                                        if (e.target.checked) setAxleStraightening('No');
                                    }} /> New?
                                </label>
                            </div>
                            <div className="field-group pink-field">
                                <label>Axle Straightening (Y/N)</label>
                                <select
                                    value={axleStraightening}
                                    onChange={(e) => setAxleStraightening(e.target.value)}
                                    className={errors.axleStraightening ? 'error' : ''}
                                    disabled={isNewAxle}
                                >
                                    <option value="">-- Select --</option>
                                    <option value="Yes">Yes</option>
                                    <option value="No">No</option>
                                </select>
                                {isNewAxle && <span style={{ fontSize: '0.7em', color: '#6B7280' }}>Not required for new axle</span>}
                            </div>
                        </div>
                    )}

                    <div className="section-row">
                        <div className="field-group white-field">
                            <label>Diameter (A)</label>
                            <input
                                type="number"
                                step="0.01"
                                value={outDiameterA}
                                onChange={(e) => setOutDiameterA(e.target.value)}
                                placeholder="95-200mm"
                                className={errors.outDiameterA ? 'error' : ''}
                            />
                            {errors.outDiameterA && <span className="error-text">{errors.outDiameterA}</span>}
                        </div>
                        <div className="field-group white-field">
                            <label>Diameter (B)</label>
                            <input
                                type="number"
                                step="0.01"
                                value={outDiameterB}
                                onChange={(e) => setOutDiameterB(e.target.value)}
                                placeholder="95-200mm"
                                className={errors.outDiameterB ? 'error' : ''}
                            />
                            {errors.outDiameterB && <span className="error-text">{errors.outDiameterB}</span>}
                        </div>
                    </div>

                    {rollerType === 'Roller' && (
                        <div className="section-row">
                            <div className="field-group pink-field">
                                <label>Have Journal (Y/N)</label>
                                <select value={haveJournal} onChange={(e) => setHaveJournal(e.target.value)} className={errors.haveJournal ? 'error' : ''}>
                                    <option value="">-- Select --</option>
                                    <option value="Yes">Yes</option>
                                    <option value="No">No</option>
                                </select>
                            </div>
                            <div className="field-group white-field">
                                <label>Journal Diameter (A)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={outJournalDiameterA}
                                    onChange={(e) => setOutJournalDiameterA(e.target.value)}
                                    disabled={haveJournal !== 'Yes'}
                                    className={errors.outJournalDiameterA ? 'error' : ''}
                                />
                            </div>
                            <div className="field-group white-field">
                                <label>Journal Diameter (B)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={outJournalDiameterB}
                                    onChange={(e) => setOutJournalDiameterB(e.target.value)}
                                    disabled={haveJournal !== 'Yes'}
                                    className={errors.outJournalDiameterB ? 'error' : ''}
                                />
                            </div>
                        </div>
                    )}

                    <div className="section-row">
                        <div className="field-group pink-field" style={{ maxWidth: '200px' }}>
                            <label>Configuration</label>
                            <select value={outConfiguration} onChange={(e) => setOutConfiguration(e.target.value)} className={errors.outConfiguration ? 'error' : ''}>
                                <option value="">-- Select --</option>
                                {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n}</option>)}
                            </select>
                        </div>
                    </div>
                </div>

                <div className="action-buttons" style={{ marginTop: '40px' }}>
                    <button className="btn btn-back" onClick={() => navigate(-1)}>Back</button>
                    <button className="btn btn-cancel" onClick={() => navigate('/insert-processing')}>Cancel</button>
                    <button className="btn btn-submit" onClick={handleSubmit}>Submit</button>
                </div>

                {showConfirmDialog && (
                    <div className="modal-overlay">
                        <div className="modal-dialog">
                            <p>Are you sure you want to insert this new entry?</p>
                            <div className="modal-buttons">
                                <button className="btn btn-cancel" onClick={() => setShowConfirmDialog(false)}>Cancel</button>
                                <button className="btn btn-submit" onClick={confirmSubmit}>Confirm</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProcessingAddNew;
