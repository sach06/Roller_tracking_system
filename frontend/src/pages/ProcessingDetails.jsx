import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import './ProcessingDetails.css';

const ProcessingDetails = () => {
    const navigate = useNavigate();
    const { rollerId, lifecycleId } = useParams();

    // Lifecycle data
    const [lifecycleData, setLifecycleData] = useState(null);
    const [rollerType, setRollerType] = useState('');
    const [loading, setLoading] = useState(true);

    // Process Details
    const [skinPassCut, setSkinPassCut] = useState('');
    const [sleeveScrap, setSleeveScrap] = useState('');
    const [scrapReason, setScrapReason] = useState('');
    const [cladding, setCladding] = useState('');
    const [claddingWireId, setCladdingWireId] = useState('');
    const [claddingWires, setCladdingWires] = useState([]);

    // Roller-specific (rotary joints)
    const [driveRotaryJointChange, setDriveRotaryJointChange] = useState('');
    const [idleRotaryJointChangeOp, setIdleRotaryJointChangeOp] = useState('');
    const [idleRotaryJointChangeDrive, setIdleRotaryJointChangeDrive] = useState('');

    // Outgoing Details
    const [outDiameterA, setOutDiameterA] = useState('');
    const [outDiameterB, setOutDiameterB] = useState('');
    const [haveJournal, setHaveJournal] = useState('');
    const [outJournalDiameterA, setOutJournalDiameterA] = useState('');
    const [outJournalDiameterB, setOutJournalDiameterB] = useState('');
    const [outConfiguration, setOutConfiguration] = useState('');

    // Sleeve-specific
    const [axleId, setAxleId] = useState('');
    const [isNewAxle, setIsNewAxle] = useState(false);
    const [axleStraightening, setAxleStraightening] = useState('');
    const [existingAxles, setExistingAxles] = useState([]);

    const [errors, setErrors] = useState({});
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);

    useEffect(() => {
        fetchLifecycleData();
        fetchCladdingWires();
        if (rollerType === 'Sleeve') {
            fetchExistingAxles();
        }
    }, [rollerId, lifecycleId, rollerType]);

    const fetchCladdingWires = async () => {
        try {
            const response = await axios.get('/api/cladding-wires');
            if (response.data.success) {
                setCladdingWires(response.data.wires);
            }
        } catch (err) {
            console.error('Error fetching cladding wires:', err);
        }
    };

    const fetchLifecycleData = async () => {
        try {
            const response = await axios.get(`/api/processing/lifecycle/${rollerId}/${lifecycleId}`);
            if (response.data.success) {
                const data = response.data.lifecycle;
                setLifecycleData(data);
                setRollerType(data.roller_type || 'Roller');
                setLoading(false);
            }
        } catch (err) {
            console.error('Error fetching lifecycle data:', err);
            alert('Error loading data');
            setLoading(false);
        }
    };

    const fetchExistingAxles = async () => {
        try {
            const response = await axios.get('/api/axles/existing');
            if (response.data.success) {
                setExistingAxles(response.data.axles);
            }
        } catch (err) {
            console.error('Error fetching axles:', err);
        }
    };

    // Calculate diameter difference
    const calculateDiameterDiff = (incoming, outgoing) => {
        if (incoming && outgoing) {
            return (parseFloat(incoming) - parseFloat(outgoing)).toFixed(2);
        }
        return '';
    };

    const diameterADiff = calculateDiameterDiff(lifecycleData?.received_diameter_a, outDiameterA);
    const diameterBDiff = calculateDiameterDiff(lifecycleData?.received_diameter_b, outDiameterB);

    // Visibility logic
    const showProcessDetails = skinPassCut !== '';
    const showScrapFields = skinPassCut === 'No';
    const showCladdingField = skinPassCut === 'No' && sleeveScrap === 'No';
    const showWiresUsed = cladding === 'Yes';
    const showOutgoingDetails = sleeveScrap === 'No' || sleeveScrap === '';
    const showJournalFields = rollerType === 'Roller' && haveJournal === 'Yes';

    const validateForm = () => {
        const newErrors = {};

        if (!skinPassCut) newErrors.skinPassCut = 'Required';

        if (skinPassCut === 'No') {
            if (!sleeveScrap) newErrors.sleeveScrap = 'Required';

            if (sleeveScrap === 'Yes') {
                if (!scrapReason) newErrors.scrapReason = 'Required when scrapped';
            }

            if (sleeveScrap === 'No') {
                if (!cladding) newErrors.cladding = 'Required';
                if (cladding === 'Yes' && !claddingWireId) newErrors.claddingWireId = 'Required when cladding';
            }
        }

        // Outgoing details validation (only if not scrapped)
        if (sleeveScrap !== 'Yes') {
            if (!outDiameterA) newErrors.outDiameterA = 'Required';
            if (!outDiameterB) newErrors.outDiameterB = 'Required';
            if (!outConfiguration) newErrors.outConfiguration = 'Required';

            if (rollerType === 'Roller') {
                if (!haveJournal) newErrors.haveJournal = 'Required';
                if (haveJournal === 'Yes') {
                    if (!outJournalDiameterA) newErrors.outJournalDiameterA = 'Required';
                    if (!outJournalDiameterB) newErrors.outJournalDiameterB = 'Required';
                }
            }

            if (rollerType === 'Sleeve') {
                if (!axleId) newErrors.axleId = 'Required';
                if (!isNewAxle && !axleStraightening) newErrors.axleStraightening = 'Required for existing axle';
            }

            // Validate Outgoing Diameter Range (95-200mm)
            if (outDiameterA && (parseFloat(outDiameterA) < 95 || parseFloat(outDiameterA) > 200)) {
                newErrors.outDiameterA = 'Must be between 95-200 mm';
            }
            if (outDiameterB && (parseFloat(outDiameterB) < 95 || parseFloat(outDiameterB) > 200)) {
                newErrors.outDiameterB = 'Must be between 95-200 mm';
            }
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
            const user = JSON.parse(localStorage.getItem('user'));
            const formData = {
                lifecycle_id: lifecycleId,
                updated_by_user_id: user?.user_id,

                // Process Details
                skin_pass_cut_yn: skinPassCut === 'Yes' ? 1 : 0,
                sleeve_scrap_yn: sleeveScrap === 'Yes' ? 1 : 0,
                scrap_reason: scrapReason || null,
                cladding_yn: cladding === 'Yes' ? 1 : 0,
                cladding_wire_id: claddingWireId ? parseInt(claddingWireId) : null,

                // Outgoing Details
                out_diameter_a: outDiameterA ? parseFloat(outDiameterA) : null,
                out_diameter_b: outDiameterB ? parseFloat(outDiameterB) : null,
                out_configuration: outConfiguration ? parseInt(outConfiguration) : null,
                diameter_a_reduce_mm: diameterADiff ? parseFloat(diameterADiff) : null,
                diameter_b_reduce_mm: diameterBDiff ? parseFloat(diameterBDiff) : null,
            };

            if (rollerType === 'Roller') {
                formData.drive_rotary_joint_change_yn = driveRotaryJointChange === 'Yes' ? 1 : 0;
                formData.idle_rotary_joint_change_op_yn = idleRotaryJointChangeOp === 'Yes' ? 1 : 0;
                formData.idle_rotary_joint_change_drive_yn = idleRotaryJointChangeDrive === 'Yes' ? 1 : 0;
                formData.have_journal_yn = haveJournal === 'Yes' ? 1 : 0;
                formData.out_journal_diameter_a = outJournalDiameterA ? parseFloat(outJournalDiameterA) : null;
                formData.out_journal_diameter_b = outJournalDiameterB ? parseFloat(outJournalDiameterB) : null;
            } else {
                formData.axle_id = axleId;
                formData.is_new_axle_yn = isNewAxle ? 1 : 0;
                formData.axle_straightening_yn = axleStraightening === 'Yes' ? 1 : 0;
            }

            const response = await axios.post('/api/processing/update', formData);
            if (response.data.success) {
                alert('Processing data submitted successfully!');
                navigate('/processing');
            }
        } catch (err) {
            console.error('Submit Error:', err);
            const msg = err.response?.data?.error || err.message || 'Unknown error occurred';
            alert('Error submitting data: ' + msg);
        }
        setShowConfirmDialog(false);
    };

    const handleCancel = () => {
        if (window.confirm('Are you sure you want to clear the form?')) {
            // Reset process fields
            setSkinPassCut('');
            setSleeveScrap('');
            setScrapReason('');
            setCladding('');
            setCladdingWireId('');
            setDriveRotaryJointChange('');
            setIdleRotaryJointChangeOp('');
            setIdleRotaryJointChangeDrive('');
            setOutDiameterA('');
            setOutDiameterB('');
            setHaveJournal('');
            setOutJournalDiameterA('');
            setOutJournalDiameterB('');
            setOutConfiguration('');
            setAxleId('');
            setIsNewAxle(false);
            setAxleStraightening('');
            setErrors({});
        }
    };

    if (loading) {
        return <div className="processing-details">Loading...</div>;
    }

    if (!lifecycleData) {
        return <div className="processing-details">No data found</div>;
    }

    return (
        <div className="processing-details">
            <h2 className="page-title">Insert after Processing - {rollerType}</h2>

            <div className="form-container">
                {/* Header Info */}
                <div className="header-row">
                    <div className="field-group pink-field">
                        <label>Roller Type: {rollerType}</label>
                    </div>
                    <div className="field-group white-field">
                        <label>{rollerType === 'Roller' ? 'Drive roll/Idle roll' : 'Idle roll'}</label>
                        <div className="readonly-value">{lifecycleData.roller_function}</div>
                    </div>
                    <div className="field-group red-field">
                        <label>{rollerType} ID</label>
                        <div className="readonly-value">{rollerId}</div>
                    </div>
                </div>

                {/* Counts */}
                <div className="counts-row">
                    <div className="count-box">
                        <label>Skin pass count</label>
                        <div className="count-value">{lifecycleData.skin_cut_count || 0}</div>
                    </div>
                    <div className="count-box">
                        <label>Cladding count</label>
                        <div className="count-value">{lifecycleData.cladded_count || 0}</div>
                    </div>
                </div>

                {/* Incoming Details - Read Only */}
                <div className="section-header">Incoming details</div>
                <div className="readonly-section">
                    <div className="section-row">
                        <div className="field-group">
                            <label>Incoming Customer</label>
                            <div className="readonly-value">{lifecycleData.site_name || 'N/A'}</div>
                        </div>
                        <div className="field-group">
                            <label>Caster ID</label>
                            <div className="readonly-value">{lifecycleData.caster_name || 'N/A'}</div>
                        </div>
                        <div className="field-group">
                            <label>Strand ID</label>
                            <div className="readonly-value">{lifecycleData.strand_no || 'N/A'}</div>
                        </div>
                    </div>
                    <div className="section-row">
                        <div className="field-group">
                            <label>Segment Position</label>
                            <div className="readonly-value">{lifecycleData.position_no || 'N/A'}</div>
                        </div>
                        <div className="field-group">
                            <label>Segment ID</label>
                            <div className="readonly-value">{lifecycleData.segment_no || 'N/A'}</div>
                        </div>
                        <div className="field-group">
                            <label>Incoming Date</label>
                            <div className="readonly-value">
                                {lifecycleData.received_at ? new Date(lifecycleData.received_at).toLocaleDateString() : 'N/A'}
                            </div>
                        </div>
                    </div>
                    <div className="section-row">
                        <div className="field-group">
                            <label>Configuration</label>
                            <div className="readonly-value">{lifecycleData.received_config || 'N/A'}</div>
                        </div>
                        {rollerType === 'Sleeve' && (
                            <div className="field-group">
                                <label>Axle ID</label>
                                <div className="readonly-value">{lifecycleData.received_axle_id || 'N/A'}</div>
                            </div>
                        )}
                        <div className="field-group">
                            <label>Incoming Roller Position</label>
                            <div className="readonly-value">{lifecycleData.from_roller_position || 'N/A'}</div>
                        </div>
                    </div>
                    <div className="section-row">
                        <div className="field-group">
                            <label>Segment Tonnage</label>
                            <div className="readonly-value">{lifecycleData.tonnage || 'N/A'}</div>
                        </div>
                        <div className="field-group">
                            <label>Breakout (Y/N)</label>
                            <div className="readonly-value">{lifecycleData.breakout_flag ? 'Yes' : 'No'}</div>
                        </div>
                    </div>
                    <div className="section-row">
                        <div className="field-group">
                            <label>Incoming Diameter(A)</label>
                            <div className="readonly-value">{lifecycleData.received_diameter_a || 'N/A'}</div>
                        </div>
                        <div className="field-group">
                            <label>Incoming Diameter(B)</label>
                            <div className="readonly-value">{lifecycleData.received_diameter_b || 'N/A'}</div>
                        </div>
                    </div>
                    {rollerType === 'Roller' && (
                        <>
                            <div className="section-row">
                                <div className="field-group">
                                    <label>Have Journal(Y/N)</label>
                                    <div className="readonly-value">{lifecycleData.received_journal_flag ? 'Yes' : 'No'}</div>
                                </div>
                                {lifecycleData.received_journal_flag && (
                                    <>
                                        <div className="field-group">
                                            <label>Journal Diameter (A)</label>
                                            <div className="readonly-value">{lifecycleData.received_journal_a || 'N/A'}</div>
                                        </div>
                                        <div className="field-group">
                                            <label>Journal Diameter (B)</label>
                                            <div className="readonly-value">{lifecycleData.received_journal_b || 'N/A'}</div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </>
                    )}
                </div>

                {/* Process Details */}
                <div className="section-header">Process details</div>
                <div className="section-row">
                    <div className="field-group pink-field">
                        <label>Skinpass cut (Y/N)</label>
                        <select
                            value={skinPassCut}
                            onChange={(e) => {
                                setSkinPassCut(e.target.value);
                                if (e.target.value === 'Yes') {
                                    setSleeveScrap('');
                                    setCladding('');
                                }
                            }}
                            className={errors.skinPassCut ? 'error' : ''}
                        >
                            <option value="">-- Select --</option>
                            <option value="Yes">Yes</option>
                            <option value="No">No</option>
                        </select>
                        {errors.skinPassCut && <span className="error-text">{errors.skinPassCut}</span>}
                    </div>

                    {showScrapFields && (
                        <div className="field-group pink-field">
                            <label>Sleeve/Roller Scrap(Y/N)</label>
                            <select
                                value={sleeveScrap}
                                onChange={(e) => setSleeveScrap(e.target.value)}
                                className={errors.sleeveScrap ? 'error' : ''}
                            >
                                <option value="">-- Select --</option>
                                <option value="Yes">Yes</option>
                                <option value="No">No</option>
                            </select>
                            {errors.sleeveScrap && <span className="error-text">{errors.sleeveScrap}</span>}
                        </div>
                    )}

                    {sleeveScrap === 'Yes' && (
                        <div className="field-group pink-field">
                            <label>Scrap reason</label>
                            <input
                                type="text"
                                value={scrapReason}
                                onChange={(e) => setScrapReason(e.target.value)}
                                placeholder="Enter scrap reason"
                                className={errors.scrapReason ? 'error' : ''}
                            />
                            {errors.scrapReason && <span className="error-text">{errors.scrapReason}</span>}
                        </div>
                    )}
                </div>

                {showCladdingField && (
                    <div className="section-row">
                        <div className="field-group pink-field">
                            <label>Cladding (Y/N)</label>
                            <select
                                value={cladding}
                                onChange={(e) => setCladding(e.target.value)}
                                className={errors.cladding ? 'error' : ''}
                            >
                                <option value="">-- Select --</option>
                                <option value="Yes">Yes</option>
                                <option value="No">No</option>
                            </select>
                            {errors.cladding && <span className="error-text">{errors.cladding}</span>}
                        </div>

                        {showWiresUsed && (
                            <div className="field-group pink-field">
                                <label>Wires used</label>
                                <select
                                    value={claddingWireId}
                                    onChange={(e) => setCladdingWireId(e.target.value)}
                                    className={errors.claddingWireId ? 'error' : ''}
                                >
                                    <option value="">-- Select wire --</option>
                                    {claddingWires.map((wire) => (
                                        <option key={wire.cladding_wire_id} value={wire.cladding_wire_id}>
                                            {wire.wire_name}
                                        </option>
                                    ))}
                                </select>
                                {errors.claddingWireId && <span className="error-text">{errors.claddingWireId}</span>}
                            </div>
                        )}
                    </div>
                )}

                {/* Rotary Joint Changes - Roller Only */}
                {rollerType === 'Roller' && showCladdingField && (
                    <div className="section-row">
                        <div className="field-group pink-field">
                            <label>drive roller: Rotary joint change (Y/N)</label>
                            <select
                                value={driveRotaryJointChange}
                                onChange={(e) => setDriveRotaryJointChange(e.target.value)}
                            >
                                <option value="">-- Select --</option>
                                <option value="Yes">Yes</option>
                                <option value="No">No</option>
                            </select>
                        </div>
                        <div className="field-group pink-field">
                            <label>Idle: Rotary joint change operator side (Y/N)</label>
                            <select
                                value={idleRotaryJointChangeOp}
                                onChange={(e) => setIdleRotaryJointChangeOp(e.target.value)}
                            >
                                <option value="">-- Select --</option>
                                <option value="Yes">Yes</option>
                                <option value="No">No</option>
                            </select>
                        </div>
                        <div className="field-group pink-field">
                            <label>Idle: Rotary joint change drive side (Y/N)</label>
                            <select
                                value={idleRotaryJointChangeDrive}
                                onChange={(e) => setIdleRotaryJointChangeDrive(e.target.value)}
                            >
                                <option value="">-- Select --</option>
                                <option value="Yes">Yes</option>
                                <option value="No">No</option>
                            </select>
                        </div>
                    </div>
                )}

                {/* Outgoing Details - Only if not scrapped */}
                {showOutgoingDetails && sleeveScrap !== 'Yes' && (
                    <>
                        <div className="section-header">Outgoing details</div>

                        {/* Sleeve-specific Axle fields */}
                        {rollerType === 'Sleeve' && (
                            <div className="section-row">
                                <div className="field-group white-field">
                                    <label>Axle ID</label>
                                    {isNewAxle ? (
                                        <input
                                            type="text"
                                            value={axleId}
                                            onChange={(e) => setAxleId(e.target.value)}
                                            placeholder="Enter new Axle ID"
                                            className={errors.axleId ? 'error' : ''}
                                        />
                                    ) : (
                                        <select
                                            value={axleId}
                                            onChange={(e) => setAxleId(e.target.value)}
                                            className={errors.axleId ? 'error' : ''}
                                        >
                                            <option value="">-- Select existing --</option>
                                            {existingAxles.map((axle, idx) => (
                                                <option key={idx} value={axle.axle_id}>
                                                    {axle.axle_id}
                                                </option>
                                            ))}
                                        </select>
                                    )}
                                    <label className="checkbox-label">
                                        <input
                                            type="checkbox"
                                            checked={isNewAxle}
                                            onChange={(e) => {
                                                setIsNewAxle(e.target.checked);
                                                setAxleId('');
                                            }}
                                        />
                                        New/Existing Axle?
                                    </label>
                                    {errors.axleId && <span className="error-text">{errors.axleId}</span>}
                                </div>

                                {!isNewAxle && axleId && (
                                    <div className="field-group pink-field">
                                        <label>Axle Straightening (Y/N)</label>
                                        <select
                                            value={axleStraightening}
                                            onChange={(e) => setAxleStraightening(e.target.value)}
                                            className={errors.axleStraightening ? 'error' : ''}
                                        >
                                            <option value="">-- Select --</option>
                                            <option value="Yes">Yes</option>
                                            <option value="No">No</option>
                                        </select>
                                        {errors.axleStraightening && <span className="error-text">{errors.axleStraightening}</span>}
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="section-row">
                            <div className="field-group white-field">
                                <label>Diameter(A)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={outDiameterA}
                                    onChange={(e) => setOutDiameterA(e.target.value)}
                                    placeholder="Enter diameter"
                                    className={errors.outDiameterA ? 'error' : ''}
                                />
                                {errors.outDiameterA && <span className="error-text">{errors.outDiameterA}</span>}
                            </div>
                            <div className="field-group white-field">
                                <label>Diameter(B)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={outDiameterB}
                                    onChange={(e) => setOutDiameterB(e.target.value)}
                                    placeholder="Enter diameter"
                                    className={errors.outDiameterB ? 'error' : ''}
                                />
                                {errors.outDiameterB && <span className="error-text">{errors.outDiameterB}</span>}
                            </div>
                        </div>

                        {/* Roller-specific Journal fields */}
                        {rollerType === 'Roller' && (
                            <div className="section-row">
                                <div className="field-group pink-field">
                                    <label>Have Journal(Y/N)</label>
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

                                {showJournalFields && (
                                    <>
                                        <div className="field-group white-field">
                                            <label>Journal Diameter (A)</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={outJournalDiameterA}
                                                onChange={(e) => setOutJournalDiameterA(e.target.value)}
                                                placeholder="Enter diameter"
                                                className={errors.outJournalDiameterA ? 'error' : ''}
                                            />
                                            {errors.outJournalDiameterA && <span className="error-text">{errors.outJournalDiameterA}</span>}
                                        </div>
                                        <div className="field-group white-field">
                                            <label>Journal Diameter (B)</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={outJournalDiameterB}
                                                onChange={(e) => setOutJournalDiameterB(e.target.value)}
                                                placeholder="Enter diameter"
                                                className={errors.outJournalDiameterB ? 'error' : ''}
                                            />
                                            {errors.outJournalDiameterB && <span className="error-text">{errors.outJournalDiameterB}</span>}
                                        </div>
                                    </>
                                )}
                            </div>
                        )}

                        <div className="section-row">
                            <div className="field-group pink-field">
                                <label>Configuration</label>
                                <select
                                    value={outConfiguration}
                                    onChange={(e) => setOutConfiguration(e.target.value)}
                                    className={errors.outConfiguration ? 'error' : ''}
                                >
                                    <option value="">-- Select --</option>
                                    <option value="1">1</option>
                                    <option value="2">2</option>
                                    <option value="3">3</option>
                                    <option value="4">4</option>
                                    <option value="5">5</option>
                                </select>
                                {errors.outConfiguration && <span className="error-text">{errors.outConfiguration}</span>}
                            </div>
                        </div>

                        {/* Diameter Difference - Calculated */}
                        <div className="section-row">
                            <div className="field-group white-field">
                                <label>Diameter(A) difference (mm)</label>
                                <div className="readonly-value">{diameterADiff || 'N/A'}</div>
                            </div>
                            <div className="field-group white-field">
                                <label>Diameter(B) difference (mm)</label>
                                <div className="readonly-value">{diameterBDiff || 'N/A'}</div>
                            </div>
                        </div>
                    </>
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

export default ProcessingDetails;
