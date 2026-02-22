import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './InsertDisassembly.css';

const ScrapRoller = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);

    // Form state
    const [rollerType, setRollerType] = useState('Roller');
    const [driveType, setDriveType] = useState('');
    const [rollerId, setRollerId] = useState('');
    const [scrapReason, setScrapReason] = useState('');
    const [scrapDate, setScrapDate] = useState(new Date().toISOString().split('T')[0]);
    const [existingRollers, setExistingRollers] = useState([]);
    const [existingAxles, setExistingAxles] = useState([]);

    // Incoming details - Dropdowns
    const [casterOptions, setCasterOptions] = useState([]);
    const [strandOptions, setStrandOptions] = useState([]);
    const [segmentPositionOptions, setSegmentPositionOptions] = useState([]);
    const [segmentIdOptions, setSegmentIdOptions] = useState([]);

    const [casterId, setCasterId] = useState('');
    const [strandId, setStrandId] = useState('');
    const [segmentPosition, setSegmentPosition] = useState('');
    const [segmentId, setSegmentId] = useState('');
    const [incomingDate, setIncomingDate] = useState('');
    const [configuration, setConfiguration] = useState('');
    const [incomingRollerPosition, setIncomingRollerPosition] = useState('');
    const [hasBreakout, setHasBreakout] = useState('');
    const [haveJournal, setHaveJournal] = useState('');

    // Input fields
    const [journalDiameterA, setJournalDiameterA] = useState('');
    const [journalDiameterB, setJournalDiameterB] = useState('');
    const [segmentTonnage, setSegmentTonnage] = useState('');
    const [incomingDiameterA, setIncomingDiameterA] = useState('');
    const [incomingDiameterB, setIncomingDiameterB] = useState('');
    const [axleId, setAxleId] = useState('');

    // Validation
    const [errors, setErrors] = useState({});
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
        fetchExistingRollers();
        fetchAxles();
    }, []);

    useEffect(() => {
        if (user?.user_id) {
            fetchCasters(user.user_id);
        }
    }, [user]);

    useEffect(() => {
        if (casterId) {
            fetchStrands(casterId);
        }
    }, [casterId]);

    useEffect(() => {
        if (strandId) {
            fetchSegmentPositions(strandId);
        }
    }, [strandId]);

    useEffect(() => {
        if (segmentPosition) {
            fetchSegmentIds(segmentPosition);
        }
    }, [segmentPosition]);

    const fetchExistingRollers = async () => {
        try {
            const response = await axios.get('/api/rollers/existing');
            if (response.data.success) {
                setExistingRollers(response.data.rollers);
            }
        } catch (err) {
            console.error('Error fetching rollers:', err);
        }
    };

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

    const fetchCasters = async (userId) => {
        try {
            const response = await axios.get('/api/casters', { params: { userId } });
            if (response.data.success) {
                setCasterOptions(response.data.casters);
            }
        } catch (err) {
            console.error('Error fetching casters:', err);
        }
    };

    const fetchStrands = async (caster) => {
        try {
            const response = await axios.get('/api/strands', { params: { casterId: caster } });
            if (response.data.success) {
                setStrandOptions(response.data.strands);
            }
        } catch (err) {
            console.error('Error fetching strands:', err);
        }
    };

    const fetchSegmentPositions = async (strand) => {
        try {
            const response = await axios.get('/api/segment-positions', { params: { strandId: strand } });
            if (response.data.success) {
                setSegmentPositionOptions(response.data.positions);
            }
        } catch (err) {
            console.error('Error fetching positions:', err);
        }
    };

    const fetchSegmentIds = async (positionId) => {
        try {
            if (!strandId) return;
            const response = await axios.get('/api/segment-ids', {
                params: {
                    strandId: strandId,
                    positionId: positionId
                }
            });
            if (response.data.success) {
                setSegmentIdOptions(response.data.segments);
            }
        } catch (err) {
            console.error('Error fetching segment IDs:', err);
        }
    };

    const resetForm = () => {
        setDriveType(rollerType === 'Sleeve' ? 'Idle' : '');
        setRollerId('');
        setScrapReason('');
        setScrapDate(new Date().toISOString().split('T')[0]);
        setCasterId('');
        setStrandId('');
        setSegmentPosition('');
        setSegmentId('');
        setIncomingDate('');
        setConfiguration('');
        setIncomingRollerPosition('');
        setHasBreakout('');
        setHaveJournal('');
        setJournalDiameterA('');
        setJournalDiameterB('');
        setSegmentTonnage('');
        setIncomingDiameterA('');
        setIncomingDiameterB('');
        setAxleId('');
        setErrors({});
    };

    const validateForm = () => {
        const newErrors = {};

        if (!driveType) newErrors.driveType = 'Required';
        if (!rollerId) newErrors.rollerId = 'Required';
        if (!scrapReason) newErrors.scrapReason = 'Required';
        if (!scrapDate) newErrors.scrapDate = 'Required';

        if (!casterId) newErrors.casterId = 'Required';
        if (!strandId) newErrors.strandId = 'Required';
        if (!segmentPosition) newErrors.segmentPosition = 'Required';
        if (!segmentId) newErrors.segmentId = 'Required';
        if (!incomingDate) newErrors.incomingDate = 'Required';
        if (!configuration) newErrors.configuration = 'Required';
        if (!incomingRollerPosition) newErrors.incomingRollerPosition = 'Required';
        if (!hasBreakout) newErrors.hasBreakout = 'Required';
        if (rollerType === 'Roller' && !haveJournal) newErrors.haveJournal = 'Required';

        if (incomingDiameterA && (parseFloat(incomingDiameterA) < 95 || parseFloat(incomingDiameterA) > 200)) {
            newErrors.incomingDiameterA = 'Must be 95-200mm';
        }
        if (incomingDiameterB && (parseFloat(incomingDiameterB) < 95 || parseFloat(incomingDiameterB) > 200)) {
            newErrors.incomingDiameterB = 'Must be 95-200mm';
        }

        if (rollerType === 'Roller' && haveJournal === 'Yes') {
            if (!journalDiameterA) newErrors.journalDiameterA = 'Required';
            if (!journalDiameterB) newErrors.journalDiameterB = 'Required';
        }

        if (rollerType === 'Sleeve' && !axleId) {
            newErrors.axleId = 'Required';
        }

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
            const formData = {
                rollerType,
                driveType,
                rollerId,
                scrapReason,
                scrapDate,
                siteId: user?.site_id,
                casterId,
                strandId,
                segmentPosition,
                segmentId,
                incomingDate,
                configuration,
                incomingRollerPosition,
                hasBreakout,
                haveJournal,
                journalDiameterA: haveJournal === 'Yes' ? journalDiameterA : null,
                journalDiameterB: haveJournal === 'Yes' ? journalDiameterB : null,
                segmentTonnage,
                incomingDiameterA,
                incomingDiameterB,
                axleId: rollerType === 'Sleeve' ? axleId : null,
                userId: user?.user_id
            };

            const response = await axios.post('/api/scrap/roller-sleeve', formData);
            if (response.data.success) {
                alert('Roller/Sleeve scrapped successfully!');
                resetForm();
            }
        } catch (err) {
            alert('Error scrapping: ' + err.message);
        }
        setShowConfirmDialog(false);
    };

    return (
        <div className="insert-disassembly">
            <h2 className="page-title">Insert scrap: {rollerType}</h2>

            <div className="form-container">
                <div className="section-row">
                    <div className="field-group pink-field">
                        <label>Roller Type: {rollerType}</label>
                        <select value={rollerType} onChange={(e) => {
                            const val = e.target.value;
                            setRollerType(val);
                            if (val === 'Sleeve') {
                                setDriveType('Idle');
                            } else {
                                setDriveType('');
                            }
                            setRollerId('');
                        }}>
                            <option value="Roller">Roller</option>
                            <option value="Sleeve">Sleeve</option>
                        </select>
                    </div>

                    <div className="field-group pink-field">
                        <label>{rollerType === 'Roller' ? 'Drive roll/Idle roll' : 'Idle roll'}</label>
                        <select
                            value={driveType}
                            onChange={(e) => { setDriveType(e.target.value); setRollerId(''); }}
                            className={errors.driveType ? 'error' : ''}
                            disabled={rollerType === 'Sleeve'}
                        >
                            <option value="">-- Select --</option>
                            {rollerType === 'Roller' && <option value="Drive">Drive roll</option>}
                            <option value="Idle">Idle roll</option>
                        </select>
                    </div>

                    <div className="field-group red-field">
                        <label>{rollerType} ID</label>
                        <select
                            value={rollerId}
                            onChange={(e) => setRollerId(e.target.value)}
                            className={errors.rollerId ? 'error' : ''}
                            disabled={!driveType}
                        >
                            <option value="">-- Select --</option>
                            {existingRollers
                                .filter(r =>
                                    r.roller_type === rollerType &&
                                    r.roller_function === driveType
                                )
                                .map((roller, idx) => (
                                    <option key={idx} value={roller.roller_sleeve_id}>
                                        {roller.roller_sleeve_id}
                                    </option>
                                ))}
                        </select>
                        {!driveType && <span className="hint-text">Select a roll type first</span>}
                        {errors.rollerId && <span className="error-text">{errors.rollerId}</span>}
                    </div>
                </div>

                <div className="section-row">
                    <div className="field-group pink-field">
                        <label>Scrap reason</label>
                        <input
                            type="text"
                            value={scrapReason}
                            onChange={(e) => setScrapReason(e.target.value)}
                            className={errors.scrapReason ? 'error' : ''}
                            placeholder="Enter reason"
                        />
                    </div>
                    <div className="field-group white-field">
                        <label>Scraping Date</label>
                        <input
                            type="date"
                            value={scrapDate}
                            onChange={(e) => setScrapDate(e.target.value)}
                            className={errors.scrapDate ? 'error' : ''}
                        />
                    </div>
                </div>

                <div className="section-header">Incoming details</div>

                <div className="section-row">
                    <div className="field-group gray-field">
                        <label>Incoming Customer</label>
                        <div className="readonly-field">{user?.site || 'N/A'}</div>
                    </div>
                    <div className="field-group pink-field">
                        <label>Caster ID</label>
                        <select
                            value={casterId}
                            onChange={(e) => setCasterId(e.target.value)}
                            className={errors.casterId ? 'error' : ''}
                        >
                            <option value="">-- Select --</option>
                            {casterOptions.map((caster, idx) => (
                                <option key={idx} value={caster.caster_id}>
                                    {caster.caster_name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="field-group pink-field">
                        <label>Strand ID</label>
                        <select
                            value={strandId}
                            onChange={(e) => setStrandId(e.target.value)}
                            className={errors.strandId ? 'error' : ''}
                            disabled={!casterId}
                        >
                            <option value="">-- Select --</option>
                            {strandOptions.map((strand, idx) => (
                                <option key={idx} value={strand.strand_no}>
                                    {strand.strand_no}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="section-row">
                    <div className="field-group pink-field">
                        <label>Segment Position</label>
                        <select
                            value={segmentPosition}
                            onChange={(e) => setSegmentPosition(e.target.value)}
                            className={errors.segmentPosition ? 'error' : ''}
                            disabled={!strandId}
                        >
                            <option value="">-- Select --</option>
                            {segmentPositionOptions.map((pos, idx) => (
                                <option key={idx} value={pos.position_id}>
                                    {pos.position_no}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="field-group pink-field">
                        <label>Segment ID</label>
                        <select
                            value={segmentId}
                            onChange={(e) => setSegmentId(e.target.value)}
                            className={errors.segmentId ? 'error' : ''}
                            disabled={!segmentPosition}
                        >
                            <option value="">-- Select --</option>
                            {segmentIdOptions.map((seg, idx) => (
                                <option key={idx} value={seg.segment_id}>
                                    {seg.segment_no}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="field-group white-field">
                        <label>Incoming Date</label>
                        <input
                            type="date"
                            value={incomingDate}
                            onChange={(e) => setIncomingDate(e.target.value)}
                            className={errors.incomingDate ? 'error' : ''}
                        />
                    </div>
                </div>

                <div className="section-row">
                    <div className="field-group pink-field">
                        <label>Configuration</label>
                        <select value={configuration} onChange={(e) => setConfiguration(e.target.value)}>
                            <option value="">-- Select --</option>
                            {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n}</option>)}
                        </select>
                    </div>
                    <div className="field-group white-field">
                        <label>{rollerType === 'Roller' ? 'Incoming Roller Position' : 'Axle ID'}</label>
                        {rollerType === 'Roller' ? (
                            <select value={incomingRollerPosition} onChange={(e) => setIncomingRollerPosition(e.target.value)}>
                                <option value="">-- Select --</option>
                                {[...Array(14)].map((_, i) => <option key={i} value={i + 1}>{i + 1}</option>)}
                            </select>
                        ) : (
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
                        )}
                        {rollerType === 'Sleeve' && errors.axleId && <span className="error-text">{errors.axleId}</span>}
                    </div>
                    <div className="field-group pink-field">
                        <label>Breakout (Y/N)</label>
                        <select value={hasBreakout} onChange={(e) => setHasBreakout(e.target.value)}>
                            <option value="">-- Select --</option>
                            <option value="Yes">Yes</option>
                            <option value="No">No</option>
                        </select>
                    </div>
                </div>

                <div className="section-row">
                    <div className="field-group white-field">
                        <label>Incoming Diameter(A)</label>
                        <input type="number" step="0.01" value={incomingDiameterA} onChange={(e) => setIncomingDiameterA(e.target.value)} />
                    </div>
                    <div className="field-group white-field">
                        <label>Incoming Diameter(B)</label>
                        <input type="number" step="0.01" value={incomingDiameterB} onChange={(e) => setIncomingDiameterB(e.target.value)} />
                    </div>
                    <div className="field-group white-field">
                        <label>Segment Tonnage</label>
                        <input type="number" step="0.01" value={segmentTonnage} onChange={(e) => setSegmentTonnage(e.target.value)} />
                    </div>
                </div>

                {rollerType === 'Roller' && (
                    <div className="section-row">
                        <div className="field-group pink-field">
                            <label>Have Journal (Y/N)</label>
                            <select value={haveJournal} onChange={(e) => setHaveJournal(e.target.value)}>
                                <option value="">-- Select --</option>
                                <option value="Yes">Yes</option>
                                <option value="No">No</option>
                            </select>
                        </div>
                        {haveJournal === 'Yes' && (
                            <>
                                <div className="field-group white-field">
                                    <label>Journal Diameter (A)</label>
                                    <input type="number" step="0.01" value={journalDiameterA} onChange={(e) => setJournalDiameterA(e.target.value)} />
                                </div>
                                <div className="field-group white-field">
                                    <label>Journal Diameter (B)</label>
                                    <input type="number" step="0.01" value={journalDiameterB} onChange={(e) => setJournalDiameterB(e.target.value)} />
                                </div>
                            </>
                        )}
                    </div>
                )}

                <div className="action-buttons">
                    <button className="btn btn-back" onClick={() => navigate(-1)}>Back</button>
                    <button className="btn btn-cancel" onClick={resetForm}>Cancel</button>
                    <button className="btn btn-submit" onClick={handleSubmit}>Submit</button>
                </div>
            </div>

            {showConfirmDialog && (
                <div className="modal-overlay">
                    <div className="modal-dialog">
                        <p>Are you sure to scrap this {rollerType.toLowerCase()}?</p>
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

export default ScrapRoller;
