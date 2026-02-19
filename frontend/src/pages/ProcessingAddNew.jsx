import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './InsertDisassembly.css'; // Reusing styles
import './ProcessingDetails.css'; // Reusing styles

const ProcessingAddNew = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);

    // --- State ---

    // Reference Data
    const [casterOptions, setCasterOptions] = useState([]);
    const [strandOptions, setStrandOptions] = useState([]);
    const [segmentPositionOptions, setSegmentPositionOptions] = useState([]);
    const [segmentIdOptions, setSegmentIdOptions] = useState([]);
    const [existingAxles, setExistingAxles] = useState([]);

    // Roller Info
    const [rollerType, setRollerType] = useState('Roller');
    const [driveType, setDriveType] = useState('');
    const [rollerId, setRollerId] = useState('');

    // Incoming Details
    const [casterId, setCasterId] = useState('');
    const [strandId, setStrandId] = useState('');
    const [segmentPosition, setSegmentPosition] = useState('');
    const [segmentId, setSegmentId] = useState('');
    const [incomingDate, setIncomingDate] = useState('');
    const [configuration, setConfiguration] = useState('');
    const [incomingRollerPosition, setIncomingRollerPosition] = useState('');
    const [hasBreakout, setHasBreakout] = useState('');
    const [segmentTonnage, setSegmentTonnage] = useState('');
    const [incomingDiameterA, setIncomingDiameterA] = useState('');
    const [incomingDiameterB, setIncomingDiameterB] = useState('');

    // Incoming Journal (Roller only)
    const [haveJournal, setHaveJournal] = useState('');
    const [journalDiameterA, setJournalDiameterA] = useState('');
    const [journalDiameterB, setJournalDiameterB] = useState('');

    // Processing Details
    const [skinPassCut, setSkinPassCut] = useState('');
    const [sleeveScrap, setSleeveScrap] = useState('');
    const [scrapReason, setScrapReason] = useState('');
    const [cladding, setCladding] = useState('');
    const [wiresUsed, setWiresUsed] = useState('');

    // Rotary Joints (Roller only)
    const [driveRotaryJointChange, setDriveRotaryJointChange] = useState('');
    const [idleRotaryJointChangeOp, setIdleRotaryJointChangeOp] = useState('');
    const [idleRotaryJointChangeDrive, setIdleRotaryJointChangeDrive] = useState('');

    // Outgoing Details
    const [outDiameterA, setOutDiameterA] = useState('');
    const [outDiameterB, setOutDiameterB] = useState('');
    const [outConfiguration, setOutConfiguration] = useState('');

    // Outgoing Journal (Roller only)
    const [outJournalDiameterA, setOutJournalDiameterA] = useState('');
    const [outJournalDiameterB, setOutJournalDiameterB] = useState('');

    // Axle (Sleeve only)
    const [axleId, setAxleId] = useState('');
    const [isNewAxle, setIsNewAxle] = useState(false);
    const [axleStraightening, setAxleStraightening] = useState('');

    const [errors, setErrors] = useState({});
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);

    // --- Effects ---

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
        fetchExistingAxles();
    }, []);

    useEffect(() => {
        if (user?.site) {
            fetchCasters(user.site);
        }
    }, [user]);

    useEffect(() => {
        if (casterId) fetchStrands(casterId);
    }, [casterId]);

    useEffect(() => {
        if (strandId) fetchSegmentPositions(strandId);
    }, [strandId]);

    useEffect(() => {
        if (segmentPosition) fetchSegmentIds(segmentPosition);
    }, [segmentPosition]);

    // --- Fetch Helpers ---

    const fetchCasters = async (siteName) => {
        try {
            const response = await axios.get('/api/casters', { params: { site: siteName } });
            if (response.data.success) setCasterOptions(response.data.casters);
        } catch (err) { console.error('Error fetching casters:', err); }
    };

    const fetchStrands = async (caster) => {
        try {
            const response = await axios.get('/api/strands', { params: { casterId: caster } });
            if (response.data.success) setStrandOptions(response.data.strands);
        } catch (err) { console.error('Error fetching strands:', err); }
    };

    const fetchSegmentPositions = async (strand) => {
        try {
            const response = await axios.get('/api/segment-positions', { params: { strandId: strand } });
            if (response.data.success) setSegmentPositionOptions(response.data.positions);
        } catch (err) { console.error('Error fetching positions:', err); }
    };

    const fetchSegmentIds = async (position) => {
        try {
            if (!strandId) return;
            const response = await axios.get('/api/segment-ids', { params: { strandId: strandId, positionNo: position } });
            if (response.data.success) setSegmentIdOptions(response.data.segments);
        } catch (err) { console.error('Error fetching segment IDs:', err); }
    };

    const fetchExistingAxles = async () => {
        try {
            const response = await axios.get('/api/axles/existing');
            if (response.data.success) setExistingAxles(response.data.axles);
        } catch (err) { console.error('Error fetching axles:', err); }
    };

    // --- Calculations ---

    const calculateDifference = (start, end) => {
        if (start && end) {
            return (parseFloat(start) - parseFloat(end)).toFixed(2);
        }
        return 'N/A';
    };

    const diffA = calculateDifference(incomingDiameterA, outDiameterA);
    const diffB = calculateDifference(incomingDiameterB, outDiameterB);

    // --- Validation ---

    const validateForm = () => {
        const newErrors = {};

        // Base Info
        if (!rollerId) newErrors.rollerId = 'Required';
        if (!driveType) newErrors.driveType = 'Required';

        // Incoming
        if (!casterId) newErrors.casterId = 'Required';
        if (!strandId) newErrors.strandId = 'Required';
        if (!segmentPosition) newErrors.segmentPosition = 'Required';
        if (!segmentId) newErrors.segmentId = 'Required';
        if (!incomingDate) newErrors.incomingDate = 'Required';
        if (!incomingDiameterA) newErrors.incomingDiameterA = 'Required';
        if (!incomingDiameterB) newErrors.incomingDiameterB = 'Required';
        if (!configuration) newErrors.configuration = 'Required';
        if (!incomingRollerPosition) newErrors.incomingRollerPosition = 'Required';
        if (!hasBreakout) newErrors.hasBreakout = 'Required';

        // Range Validation (95-200mm) for Incoming
        if (incomingDiameterA && (parseFloat(incomingDiameterA) < 95 || parseFloat(incomingDiameterA) > 200)) newErrors.incomingDiameterA = 'Must be 95-200mm';
        if (incomingDiameterB && (parseFloat(incomingDiameterB) < 95 || parseFloat(incomingDiameterB) > 200)) newErrors.incomingDiameterB = 'Must be 95-200mm';

        // Processing
        if (!skinPassCut) newErrors.skinPassCut = 'Required';
        if (skinPassCut === 'No') {
            if (!sleeveScrap) newErrors.sleeveScrap = 'Required';
            if (sleeveScrap === 'Yes') {
                if (!scrapReason) newErrors.scrapReason = 'Required';
            }
            if (sleeveScrap === 'No') {
                if (!cladding) newErrors.cladding = 'Required';
                if (cladding === 'Yes' && !wiresUsed) newErrors.wiresUsed = 'Required';
            }
        }

        // Outgoing (if not scrapped)
        if (sleeveScrap !== 'Yes') {
            if (!outDiameterA) newErrors.outDiameterA = 'Required';
            if (!outDiameterB) newErrors.outDiameterB = 'Required';
            if (!outConfiguration) newErrors.outConfiguration = 'Required';

            // Range Validation (95-200mm) for Outgoing
            if (outDiameterA && (parseFloat(outDiameterA) < 95 || parseFloat(outDiameterA) > 200)) newErrors.outDiameterA = 'Must be 95-200mm';
            if (outDiameterB && (parseFloat(outDiameterB) < 95 || parseFloat(outDiameterB) > 200)) newErrors.outDiameterB = 'Must be 95-200mm';
        }

        // Roller Specific
        if (rollerType === 'Roller') {
            if (!haveJournal) newErrors.haveJournal = 'Required';
            if (haveJournal === 'Yes') {
                // Incoming Journal
                if (!journalDiameterA) newErrors.journalDiameterA = 'Required';
                if (!journalDiameterB) newErrors.journalDiameterB = 'Required';

                // Outgoing Journal
                if (sleeveScrap !== 'Yes') {
                    if (!outJournalDiameterA) newErrors.outJournalDiameterA = 'Required';
                    if (!outJournalDiameterB) newErrors.outJournalDiameterB = 'Required';
                }
            }
        }

        // Sleeve Specific
        if (rollerType === 'Sleeve') {
            if (!axleId) newErrors.axleId = 'Required';
            if (!isNewAxle && !axleStraightening && sleeveScrap !== 'Yes') newErrors.axleStraightening = 'Required';
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
                driveType,
                siteId: user?.site_id,
                casterId,
                strandId,
                segmentPosition,
                segmentId,
                incomingDate,
                configuration,
                incomingRollerPosition,
                hasBreakout,
                segmentTonnage,
                incomingDiameterA,
                incomingDiameterB,
                userId: user?.user_id,

                // Process
                skin_pass_cut_yn: skinPassCut === 'Yes' ? 1 : 0,
                sleeve_scrap_yn: sleeveScrap === 'Yes' ? 1 : 0,
                scrap_reason: scrapReason,
                cladding_yn: cladding === 'Yes' ? 1 : 0,
                wires_used: wiresUsed ? parseInt(wiresUsed) : null,

                // Outgoing
                out_diameter_a: outDiameterA ? parseFloat(outDiameterA) : null,
                out_diameter_b: outDiameterB ? parseFloat(outDiameterB) : null,
                out_configuration: outConfiguration,
                diameter_a_reduce_mm: diffA !== 'N/A' ? parseFloat(diffA) : null,
                diameter_b_reduce_mm: diffB !== 'N/A' ? parseFloat(diffB) : null,

                // Roller Only
                have_journal_yn: haveJournal === 'Yes' ? 1 : 0,
                journalDiameterA: journalDiameterA ? parseFloat(journalDiameterA) : null,
                journalDiameterB: journalDiameterB ? parseFloat(journalDiameterB) : null,
                drive_rotary_joint_change_yn: driveRotaryJointChange === 'Yes' ? 1 : 0,
                idle_rotary_joint_change_op_yn: idleRotaryJointChangeOp === 'Yes' ? 1 : 0,
                idle_rotary_joint_change_drive_yn: idleRotaryJointChangeDrive === 'Yes' ? 1 : 0,
                out_journal_diameter_a: outJournalDiameterA ? parseFloat(outJournalDiameterA) : null,
                out_journal_diameter_b: outJournalDiameterB ? parseFloat(outJournalDiameterB) : null,

                // Sleeve Only
                axleId: axleId,
                is_new_axle_yn: isNewAxle ? 1 : 0,
                axle_straightening_yn: axleStraightening === 'Yes' ? 1 : 0
            };

            const response = await axios.post('/api/processing/add-new', formData);
            if (response.data.success) {
                alert('Success!');
                navigate('/processing');
            }
        } catch (err) {
            alert('Error: ' + err.message);
        }
        setShowConfirmDialog(false);
    };

    return (
        <div className="processing-details">
            <h2 className="page-title">Add New - Insert After Processing</h2>

            <div className="form-container">
                {/* --- Roller Info --- */}
                <div className="section-header">Roller Details</div>
                <div className="section-row">
                    <div className="field-group pink-field">
                        <label>Roller Type</label>
                        <select value={rollerType} onChange={(e) => setRollerType(e.target.value)}>
                            <option value="Roller">Roller</option>
                            <option value="Sleeve">Sleeve</option>
                        </select>
                    </div>
                    <div className="field-group pink-field">
                        <label>Function</label>
                        <select value={driveType} onChange={(e) => setDriveType(e.target.value)} className={errors.driveType ? 'error' : ''}>
                            <option value="">-- Select --</option>
                            {rollerType === 'Roller' && <option value="Drive">Drive roll</option>}
                            <option value="Idle">Idle roll</option>
                        </select>
                        {errors.driveType && <span className="error-text">Required</span>}
                    </div>
                    <div className="field-group red-field">
                        <label>Roller/Sleeve ID</label>
                        <input
                            type="text"
                            value={rollerId}
                            onChange={(e) => setRollerId(e.target.value)}
                            placeholder="Enter ID"
                            className={errors.rollerId ? 'error' : ''}
                        />
                        {errors.rollerId && <span className="error-text">Required</span>}
                    </div>
                </div>

                {/* --- Incoming Details --- */}
                <div className="section-header">Incoming Details</div>
                <div className="section-row">
                    <div className="field-group gray-field">
                        <label>Incoming Customer</label>
                        <div className="readonly-value">{user?.site || 'N/A'}</div>
                    </div>
                    <div className="field-group pink-field">
                        <label>Caster</label>
                        <select value={casterId} onChange={(e) => setCasterId(e.target.value)} className={errors.casterId ? 'error' : ''}>
                            <option value="">-- Select --</option>
                            {casterOptions.map(c => <option key={c.caster_id} value={c.caster_id}>{c.caster_name}</option>)}
                        </select>
                        {errors.casterId && <span className="error-text">Required</span>}
                    </div>
                    <div className="field-group pink-field">
                        <label>Strand</label>
                        <select value={strandId} onChange={(e) => setStrandId(e.target.value)} disabled={!casterId} className={errors.strandId ? 'error' : ''}>
                            <option value="">-- Select --</option>
                            {strandOptions.map(s => <option key={s.strand_id} value={s.strand_id}>{s.strand_no}</option>)}
                        </select>
                        {errors.strandId && <span className="error-text">Required</span>}
                    </div>
                </div>

                <div className="section-row">
                    <div className="field-group pink-field">
                        <label>Position</label>
                        <select value={segmentPosition} onChange={(e) => setSegmentPosition(e.target.value)} disabled={!strandId} className={errors.segmentPosition ? 'error' : ''}>
                            <option value="">-- Select --</option>
                            {segmentPositionOptions.map(p => <option key={p.position_id} value={p.position_no}>{p.position_no}</option>)}
                        </select>
                        {errors.segmentPosition && <span className="error-text">Required</span>}
                    </div>
                    <div className="field-group pink-field">
                        <label>Segment</label>
                        <select value={segmentId} onChange={(e) => setSegmentId(e.target.value)} disabled={!segmentPosition} className={errors.segmentId ? 'error' : ''}>
                            <option value="">-- Select --</option>
                            {segmentIdOptions.map(s => <option key={s.segment_id} value={s.segment_id}>{s.segment_no}</option>)}
                        </select>
                        {errors.segmentId && <span className="error-text">Required</span>}
                    </div>
                    <div className="field-group white-field">
                        <label>Incoming Date</label>
                        <input type="date" value={incomingDate} onChange={(e) => setIncomingDate(e.target.value)} className={errors.incomingDate ? 'error' : ''} />
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
                        <label>Tonnage</label>
                        <input type="number" step="0.01" value={segmentTonnage} onChange={(e) => setSegmentTonnage(e.target.value)} />
                    </div>
                    <div className="field-group pink-field">
                        <label>Breakout?</label>
                        <select value={hasBreakout} onChange={(e) => setHasBreakout(e.target.value)}>
                            <option value="">-- Select --</option>
                            <option value="Yes">Yes</option>
                            <option value="No">No</option>
                        </select>
                    </div>
                </div>

                <div className="section-row">
                    <div className="field-group white-field">
                        <label>Incoming Dia(A) (95-200)</label>
                        <input type="number" step="0.01" value={incomingDiameterA} onChange={(e) => setIncomingDiameterA(e.target.value)} className={errors.incomingDiameterA ? 'error' : ''} />
                        {errors.incomingDiameterA && <span className="error-text">{errors.incomingDiameterA}</span>}
                    </div>
                    <div className="field-group white-field">
                        <label>Incoming Dia(B) (95-200)</label>
                        <input type="number" step="0.01" value={incomingDiameterB} onChange={(e) => setIncomingDiameterB(e.target.value)} className={errors.incomingDiameterB ? 'error' : ''} />
                        {errors.incomingDiameterB && <span className="error-text">{errors.incomingDiameterB}</span>}
                    </div>
                    <div className="field-group pink-field">
                        <label>Inc. Roller Pos</label>
                        <select value={incomingRollerPosition} onChange={(e) => setIncomingRollerPosition(e.target.value)}>
                            <option value="">-- Select --</option>
                            {[...Array(14)].map((_, i) => <option key={i} value={i + 1}>{i + 1}</option>)}
                        </select>
                    </div>
                </div>

                {rollerType === 'Roller' && (
                    <div className="section-row">
                        <div className="field-group pink-field">
                            <label>Have Journal?</label>
                            <select value={haveJournal} onChange={(e) => setHaveJournal(e.target.value)} className={errors.haveJournal ? 'error' : ''}>
                                <option value="">-- Select --</option>
                                <option value="Yes">Yes</option>
                                <option value="No">No</option>
                            </select>
                            {errors.haveJournal && <span className="error-text">Required</span>}
                        </div>
                        {haveJournal === 'Yes' && (
                            <>
                                <div className="field-group white-field">
                                    <label>Journal Dia(A)</label>
                                    <input type="number" step="0.01" value={journalDiameterA} onChange={(e) => setJournalDiameterA(e.target.value)} className={errors.journalDiameterA ? 'error' : ''} />
                                </div>
                                <div className="field-group white-field">
                                    <label>Journal Dia(B)</label>
                                    <input type="number" step="0.01" value={journalDiameterB} onChange={(e) => setJournalDiameterB(e.target.value)} className={errors.journalDiameterB ? 'error' : ''} />
                                </div>
                            </>
                        )}
                    </div>
                )}

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
                            <label className="checkbox-label">
                                <input type="checkbox" checked={isNewAxle} onChange={(e) => setIsNewAxle(e.target.checked)} /> New?
                            </label>
                            {errors.axleId && <span className="error-text">Required</span>}
                        </div>
                    </div>
                )}

                {/* --- Processing Details --- */}
                <div className="section-header">Processing Details</div>
                <div className="section-row">
                    <div className="field-group pink-field">
                        <label>Skinpass Cut?</label>
                        <select value={skinPassCut} onChange={(e) => {
                            setSkinPassCut(e.target.value);
                            if (e.target.value === 'Yes') {
                                setSleeveScrap('');
                                setCladding('');
                            }
                        }} className={errors.skinPassCut ? 'error' : ''}>
                            <option value="">-- Select --</option>
                            <option value="Yes">Yes</option>
                            <option value="No">No</option>
                        </select>
                    </div>
                    {skinPassCut === 'No' && (
                        <div className="field-group pink-field">
                            <label>Scrap?</label>
                            <select value={sleeveScrap} onChange={(e) => setSleeveScrap(e.target.value)} className={errors.sleeveScrap ? 'error' : ''}>
                                <option value="">-- Select --</option>
                                <option value="Yes">Yes</option>
                                <option value="No">No</option>
                            </select>
                        </div>
                    )}
                    {sleeveScrap === 'Yes' && (
                        <div className="field-group pink-field">
                            <label>Reason</label>
                            <input type="text" value={scrapReason} onChange={(e) => setScrapReason(e.target.value)} className={errors.scrapReason ? 'error' : ''} />
                        </div>
                    )}
                </div>

                {sleeveScrap === 'No' && skinPassCut === 'No' && (
                    <div className="section-row">
                        <div className="field-group pink-field">
                            <label>Cladding?</label>
                            <select value={cladding} onChange={(e) => setCladding(e.target.value)} className={errors.cladding ? 'error' : ''}>
                                <option value="">-- Select --</option>
                                <option value="Yes">Yes</option>
                                <option value="No">No</option>
                            </select>
                        </div>
                        {cladding === 'Yes' && (
                            <div className="field-group pink-field">
                                <label>Wires Used</label>
                                <input type="number" value={wiresUsed} onChange={(e) => setWiresUsed(e.target.value)} className={errors.wiresUsed ? 'error' : ''} />
                            </div>
                        )}
                    </div>
                )}

                {rollerType === 'Roller' && sleeveScrap === 'No' && (
                    <div className="section-row">
                        <div className="field-group pink-field">
                            <label>Drive RJ Change</label>
                            <select value={driveRotaryJointChange} onChange={(e) => setDriveRotaryJointChange(e.target.value)}>
                                <option value="">-- Select --</option>
                                <option value="Yes">Yes</option>
                                <option value="No">No</option>
                            </select>
                        </div>
                        <div className="field-group pink-field">
                            <label>Idle RJ Change Op</label>
                            <select value={idleRotaryJointChangeOp} onChange={(e) => setIdleRotaryJointChangeOp(e.target.value)}>
                                <option value="">-- Select --</option>
                                <option value="Yes">Yes</option>
                                <option value="No">No</option>
                            </select>
                        </div>
                        <div className="field-group pink-field">
                            <label>Idle RJ Change Drv</label>
                            <select value={idleRotaryJointChangeDrive} onChange={(e) => setIdleRotaryJointChangeDrive(e.target.value)}>
                                <option value="">-- Select --</option>
                                <option value="Yes">Yes</option>
                                <option value="No">No</option>
                            </select>
                        </div>
                    </div>
                )}

                {/* --- Outgoing Details --- */}
                {sleeveScrap !== 'Yes' && (
                    <>
                        <div className="section-header">Outgoing Details</div>
                        <div className="section-row">
                            <div className="field-group white-field">
                                <label>Out Dia(A) (95-200)</label>
                                <input type="number" step="0.01" value={outDiameterA} onChange={(e) => setOutDiameterA(e.target.value)} className={errors.outDiameterA ? 'error' : ''} />
                                {errors.outDiameterA && <span className="error-text">{errors.outDiameterA}</span>}
                            </div>
                            <div className="field-group white-field">
                                <label>Out Dia(B) (95-200)</label>
                                <input type="number" step="0.01" value={outDiameterB} onChange={(e) => setOutDiameterB(e.target.value)} className={errors.outDiameterB ? 'error' : ''} />
                                {errors.outDiameterB && <span className="error-text">{errors.outDiameterB}</span>}
                            </div>
                        </div>
                        <div className="section-row">
                            <div className="field-group pink-field">
                                <label>Out Configuration</label>
                                <select value={outConfiguration} onChange={(e) => setOutConfiguration(e.target.value)}>
                                    <option value="">-- Select --</option>
                                    {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n}</option>)}
                                </select>
                            </div>
                        </div>

                        {rollerType === 'Roller' && haveJournal === 'Yes' && (
                            <div className="section-row">
                                <div className="field-group white-field">
                                    <label>Out Journal Dia(A)</label>
                                    <input type="number" step="0.01" value={outJournalDiameterA} onChange={(e) => setOutJournalDiameterA(e.target.value)} className={errors.outJournalDiameterA ? 'error' : ''} />
                                </div>
                                <div className="field-group white-field">
                                    <label>Out Journal Dia(B)</label>
                                    <input type="number" step="0.01" value={outJournalDiameterB} onChange={(e) => setOutJournalDiameterB(e.target.value)} className={errors.outJournalDiameterB ? 'error' : ''} />
                                </div>
                            </div>
                        )}

                        <div className="section-row">
                            <div className="field-group white-field">
                                <label>Dia(A) Diff</label>
                                <div className="readonly-value">{diffA}</div>
                            </div>
                            <div className="field-group white-field">
                                <label>Dia(B) Diff</label>
                                <div className="readonly-value">{diffB}</div>
                            </div>
                        </div>
                    </>
                )}

                <div className="action-buttons">
                    <button className="btn btn-back" onClick={() => navigate(-1)}>Back</button>
                    <button className="btn btn-cancel" onClick={() => navigate('/processing')}>Cancel</button>
                    <button className="btn btn-submit" onClick={handleSubmit}>Submit</button>
                </div>

                {showConfirmDialog && (
                    <div className="modal-overlay">
                        <div className="modal-dialog">
                            <p>Are you sure?</p>
                            <div className="modal-buttons">
                                <button onClick={() => setShowConfirmDialog(false)}>Cancel</button>
                                <button onClick={confirmSubmit}>Submit</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProcessingAddNew;
