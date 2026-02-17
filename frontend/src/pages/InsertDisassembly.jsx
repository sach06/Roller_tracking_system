import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './InsertDisassembly.css';

const InsertDisassembly = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);

    // Form state
    const [rollerType, setRollerType] = useState('Roller');
    const [driveType, setDriveType] = useState('');
    const [rollerId, setRollerId] = useState('');
    const [isNewRoller, setIsNewRoller] = useState(false);
    const [existingRollers, setExistingRollers] = useState([]);

    // Counts
    const [skinPassCount, setSkinPassCount] = useState(0);
    const [claddingCount, setCladdingCount] = useState(0);

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
    }, []);

    useEffect(() => {
        if (rollerId && !isNewRoller) {
            fetchRollerCounts(rollerId);
        }
    }, [rollerId, isNewRoller]);

    useEffect(() => {
        if (user?.site) {
            fetchCasters(user.site);
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

    const fetchRollerCounts = async (id) => {
        try {
            const response = await axios.get(`/api/rollers/${id}/counts`);
            if (response.data.success) {
                setSkinPassCount(response.data.skinPassCount || 0);
                setCladdingCount(response.data.claddingCount || 0);
            }
        } catch (err) {
            console.error('Error fetching counts:', err);
        }
    };

    const fetchCasters = async (siteName) => {
        try {
            const response = await axios.get('/api/casters', { params: { site: siteName } });
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

    const fetchSegmentIds = async (position) => {
        try {
            const response = await axios.get('/api/segment-ids', { params: { positionId: position } });
            if (response.data.success) {
                setSegmentIdOptions(response.data.segments);
            }
        } catch (err) {
            console.error('Error fetching segment IDs:', err);
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!driveType) newErrors.driveType = 'Required';
        if (!rollerId) newErrors.rollerId = 'Required';
        if (!casterId) newErrors.casterId = 'Required';
        if (!strandId) newErrors.strandId = 'Required';
        if (!segmentPosition) newErrors.segmentPosition = 'Required';
        if (!segmentId) newErrors.segmentId = 'Required';
        if (!incomingDate) newErrors.incomingDate = 'Required';
        if (!configuration) newErrors.configuration = 'Required';
        if (!incomingRollerPosition) newErrors.incomingRollerPosition = 'Required';
        if (!hasBreakout) newErrors.hasBreakout = 'Required';
        if (!haveJournal) newErrors.haveJournal = 'Required';

        // Validate diameter range
        if (incomingDiameterA && (parseFloat(incomingDiameterA) < 95 || parseFloat(incomingDiameterA) > 200)) {
            newErrors.incomingDiameterA = 'Must be between 95-200 mm';
        }
        if (incomingDiameterB && (parseFloat(incomingDiameterB) < 95 || parseFloat(incomingDiameterB) > 200)) {
            newErrors.incomingDiameterB = 'Must be between 95-200 mm';
        }

        // Journal fields required if haveJournal is Yes
        if (haveJournal === 'Yes') {
            if (!journalDiameterA) newErrors.journalDiameterA = 'Required when journal is Yes';
            if (!journalDiameterB) newErrors.journalDiameterB = 'Required when journal is Yes';
        }

        // Axle ID required for Sleeve
        if (rollerType === 'Sleeve' && !axleId) {
            newErrors.axleId = 'Required for Sleeve';
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
                isNewRoller,
                skinPassCount,
                claddingCount,
                incomingCustomer: user?.site,
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
                userId: user?.username
            };

            const response = await axios.post('/api/insert-disassembly', formData);
            if (response.data.success) {
                alert('Data submitted successfully!');
                navigate('/main');
            }
        } catch (err) {
            alert('Error submitting data: ' + err.message);
        }
        setShowConfirmDialog(false);
    };

    const handleCancel = () => {
        if (window.confirm('Are you sure you want to clear the form?')) {
            // Reset all fields
            setDriveType('');
            setRollerId('');
            setIsNewRoller(false);
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
        }
    };

    return (
        <div className="insert-disassembly">
            <h2 className="page-title">Insert at Disassembly</h2>

            <div className="form-container">
                {/* Roller Type Selection */}
                <div className="section-row">
                    <div className="field-group pink-field">
                        <label>Roller Type: {rollerType}</label>
                        <select value={rollerType} onChange={(e) => {
                            setRollerType(e.target.value);
                            setDriveType('');
                        }}>
                            <option value="Roller">Roller</option>
                            <option value="Sleeve">Sleeve</option>
                        </select>
                    </div>

                    <div className="field-group pink-field">
                        <label>{rollerType === 'Roller' ? 'Drive roll/Idle roll' : 'Idle roll'}</label>
                        <select
                            value={driveType}
                            onChange={(e) => setDriveType(e.target.value)}
                            className={errors.driveType ? 'error' : ''}
                        >
                            <option value="">-- Select --</option>
                            {rollerType === 'Roller' && <option value="Drive">Drive roll</option>}
                            <option value="Idle">Idle roll</option>
                        </select>
                        {errors.driveType && <span className="error-text">{errors.driveType}</span>}
                    </div>

                    <div className="field-group red-field">
                        <label>Roller ID</label>
                        {isNewRoller ? (
                            <input
                                type="text"
                                value={rollerId}
                                onChange={(e) => setRollerId(e.target.value)}
                                placeholder="Enter new Roller ID"
                                className={errors.rollerId ? 'error' : ''}
                            />
                        ) : (
                            <select
                                value={rollerId}
                                onChange={(e) => setRollerId(e.target.value)}
                                className={errors.rollerId ? 'error' : ''}
                            >
                                <option value="">-- Select existing --</option>
                                {existingRollers.map((roller, idx) => (
                                    <option key={idx} value={roller.roller_sleeve_id}>
                                        {roller.roller_sleeve_id}
                                    </option>
                                ))}
                            </select>
                        )}
                        <label className="checkbox-label">
                            <input
                                type="checkbox"
                                checked={isNewRoller}
                                onChange={(e) => {
                                    setIsNewRoller(e.target.checked);
                                    setRollerId('');
                                }}
                            />
                            New Roller
                        </label>
                        {errors.rollerId && <span className="error-text">{errors.rollerId}</span>}
                    </div>
                </div>

                {/* Counts Display */}
                <div className="section-row">
                    <div className="field-group gray-field">
                        <label>Skin pass count</label>
                        <div className="count-display">{skinPassCount}</div>
                    </div>
                    <div className="field-group gray-field">
                        <label>Cladding count</label>
                        <div className="count-display">{claddingCount}</div>
                    </div>
                </div>

                {/* Incoming Details Section */}
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
                                <option key={idx} value={caster.caster_name}>
                                    {caster.caster_name}
                                </option>
                            ))}
                        </select>
                        {errors.casterId && <span className="error-text">{errors.casterId}</span>}
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
                        {errors.strandId && <span className="error-text">{errors.strandId}</span>}
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
                                <option key={idx} value={pos.position_no}>
                                    {pos.position_no}
                                </option>
                            ))}
                        </select>
                        {errors.segmentPosition && <span className="error-text">{errors.segmentPosition}</span>}
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
                                <option key={idx} value={seg.s_segment_no}>
                                    {seg.s_segment_no}
                                </option>
                            ))}
                        </select>
                        {errors.segmentId && <span className="error-text">{errors.segmentId}</span>}
                    </div>
                    <div className="field-group white-field">
                        <label>Incoming Date</label>
                        <input
                            type="date"
                            value={incomingDate}
                            onChange={(e) => setIncomingDate(e.target.value)}
                            className={errors.incomingDate ? 'error' : ''}
                        />
                        {errors.incomingDate && <span className="error-text">{errors.incomingDate}</span>}
                    </div>
                </div>

                <div className="section-row">
                    <div className="field-group pink-field">
                        <label>Configuration</label>
                        <select
                            value={configuration}
                            onChange={(e) => setConfiguration(e.target.value)}
                            className={errors.configuration ? 'error' : ''}
                        >
                            <option value="">-- Select --</option>
                            <option value="1">1</option>
                            <option value="2">2</option>
                            <option value="3">3</option>
                            <option value="4">4</option>
                            <option value="5">5</option>
                        </select>
                        {errors.configuration && <span className="error-text">{errors.configuration}</span>}
                    </div>
                    <div className="field-group white-field">
                        <label>Segment Tonnage</label>
                        <input
                            type="number"
                            step="0.01"
                            value={segmentTonnage}
                            onChange={(e) => setSegmentTonnage(e.target.value)}
                            placeholder="Enter tonnage"
                        />
                    </div>
                    <div className="field-group pink-field">
                        <label>Breakout (Y/N)</label>
                        <select
                            value={hasBreakout}
                            onChange={(e) => setHasBreakout(e.target.value)}
                            className={errors.hasBreakout ? 'error' : ''}
                        >
                            <option value="">-- Select --</option>
                            <option value="Yes">Yes</option>
                            <option value="No">No</option>
                        </select>
                        {errors.hasBreakout && <span className="error-text">{errors.hasBreakout}</span>}
                    </div>
                </div>

                <div className="section-row">
                    <div className="field-group pink-field">
                        <label>Incoming Roller Position (1-14)</label>
                        <select
                            value={incomingRollerPosition}
                            onChange={(e) => setIncomingRollerPosition(e.target.value)}
                            className={errors.incomingRollerPosition ? 'error' : ''}
                        >
                            <option value="">-- Select --</option>
                            {[...Array(14)].map((_, i) => (
                                <option key={i} value={i + 1}>{i + 1}</option>
                            ))}
                        </select>
                        {errors.incomingRollerPosition && <span className="error-text">{errors.incomingRollerPosition}</span>}
                    </div>
                    <div className="field-group white-field">
                        <label>Incoming Diameter(A) (95-200mm)</label>
                        <input
                            type="number"
                            step="0.01"
                            value={incomingDiameterA}
                            onChange={(e) => setIncomingDiameterA(e.target.value)}
                            placeholder="95-200"
                            className={errors.incomingDiameterA ? 'error' : ''}
                        />
                        {errors.incomingDiameterA && <span className="error-text">{errors.incomingDiameterA}</span>}
                    </div>
                    <div className="field-group white-field">
                        <label>Incoming Diameter(B) (95-200mm)</label>
                        <input
                            type="number"
                            step="0.01"
                            value={incomingDiameterB}
                            onChange={(e) => setIncomingDiameterB(e.target.value)}
                            placeholder="95-200"
                            className={errors.incomingDiameterB ? 'error' : ''}
                        />
                        {errors.incomingDiameterB && <span className="error-text">{errors.incomingDiameterB}</span>}
                    </div>
                </div>

                <div className="section-row">
                    <div className="field-group pink-field">
                        <label>Have Journal (Y/N)</label>
                        <select
                            value={haveJournal}
                            onChange={(e) => setHaveJournal(e.target.value)}
                            className={errors.haveJournal ? 'error' : ''}
                        >
                            <option value="">-- Select --</option>
                            <option value="Yes">Yes</option>
                            <option value="No">No</option>
                        </select>
                        {errors.haveJournal && <span className="error-text">{errors.haveJournal}</span>}
                    </div>
                    {haveJournal === 'Yes' && (
                        <>
                            <div className="field-group white-field">
                                <label>Journal Diameter (A)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={journalDiameterA}
                                    onChange={(e) => setJournalDiameterA(e.target.value)}
                                    placeholder="Enter diameter"
                                    className={errors.journalDiameterA ? 'error' : ''}
                                />
                                {errors.journalDiameterA && <span className="error-text">{errors.journalDiameterA}</span>}
                            </div>
                            <div className="field-group white-field">
                                <label>Journal Diameter (B)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={journalDiameterB}
                                    onChange={(e) => setJournalDiameterB(e.target.value)}
                                    placeholder="Enter diameter"
                                    className={errors.journalDiameterB ? 'error' : ''}
                                />
                                {errors.journalDiameterB && <span className="error-text">{errors.journalDiameterB}</span>}
                            </div>
                        </>
                    )}
                </div>

                {/* Axle ID for Sleeve */}
                {rollerType === 'Sleeve' && (
                    <div className="section-row">
                        <div className="field-group white-field">
                            <label>Axle ID</label>
                            <input
                                type="text"
                                value={axleId}
                                onChange={(e) => setAxleId(e.target.value)}
                                placeholder="Enter Axle ID"
                                className={errors.axleId ? 'error' : ''}
                            />
                            {errors.axleId && <span className="error-text">{errors.axleId}</span>}
                        </div>
                    </div>
                )}

                {/* Action Buttons */}
                <div className="action-buttons">
                    <button className="btn btn-back" onClick={() => navigate(-1)}>
                        Back
                    </button>
                    <button className="btn btn-cancel" onClick={handleCancel}>
                        Cancel
                    </button>
                    <button className="btn btn-submit" onClick={handleSubmit}>
                        Submit
                    </button>
                </div>
            </div>

            {/* Confirmation Dialog */}
            {showConfirmDialog && (
                <div className="modal-overlay">
                    <div className="modal-dialog">
                        <p>Are you sure to submit data?</p>
                        <div className="modal-buttons">
                            <button className="btn btn-cancel" onClick={() => setShowConfirmDialog(false)}>
                                Cancel
                            </button>
                            <button className="btn btn-submit" onClick={confirmSubmit}>
                                Submit
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InsertDisassembly;
