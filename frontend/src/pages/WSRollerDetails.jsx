import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import './ProcessingDetails.css';

const WSRollerDetails = () => {
    const navigate = useNavigate();
    const { lifecycleId, rollerId } = useParams();

    const [lifecycleData, setLifecycleData] = useState(null);
    const [loading, setLoading] = useState(true);

    // Destination dropdowns
    const [casterOptions, setCasterOptions] = useState([]);
    const [strandOptions, setStrandOptions] = useState([]);
    const [segmentPositionOptions, setSegmentPositionOptions] = useState([]);
    const [segmentIdOptions, setSegmentIdOptions] = useState([]);

    // Destination values (pink = editable)
    const [toCasterId, setToCasterId] = useState('');
    const [toStrandId, setToStrandId] = useState('');
    const [toPositionId, setToPositionId] = useState('');
    const [toSegmentId, setToSegmentId] = useState('');
    const [toRollerPosition, setToRollerPosition] = useState('');
    const [toConfiguration, setToConfiguration] = useState('');

    const [errors, setErrors] = useState({});
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('user'));
        fetchLifecycleData();
        fetchCasters(user?.user_id);
    }, [lifecycleId, rollerId]);

    useEffect(() => {
        if (toCasterId) fetchStrands(toCasterId);
        else { setStrandOptions([]); setToStrandId(''); }
    }, [toCasterId]);

    useEffect(() => {
        if (toStrandId) fetchSegmentPositions(toStrandId);
        else { setSegmentPositionOptions([]); setToPositionId(''); }
    }, [toStrandId]);

    useEffect(() => {
        if (toPositionId) fetchSegmentIds(toPositionId);
        else { setSegmentIdOptions([]); setToSegmentId(''); }
    }, [toPositionId]);

    const fetchLifecycleData = async () => {
        try {
            const response = await axios.get(`/api/processing/lifecycle/${rollerId}/${lifecycleId}`);
            if (response.data.success) {
                setLifecycleData(response.data.lifecycle);
            }
            setLoading(false);
        } catch (err) {
            console.error('Error loading lifecycle:', err);
            setLoading(false);
        }
    };

    const fetchCasters = async (userId) => {
        try {
            const response = await axios.get('/api/casters', { params: { userId } });
            if (response.data.success) setCasterOptions(response.data.casters);
        } catch (err) { console.error(err); }
    };

    const fetchStrands = async (casterId) => {
        try {
            const response = await axios.get('/api/strands', { params: { casterId } });
            if (response.data.success) setStrandOptions(response.data.strands);
        } catch (err) { console.error(err); }
    };

    const fetchSegmentPositions = async (strandId) => {
        try {
            const response = await axios.get('/api/segment-positions', { params: { strandId } });
            if (response.data.success) setSegmentPositionOptions(response.data.positions);
        } catch (err) { console.error(err); }
    };

    const fetchSegmentIds = async (positionId) => {
        try {
            const response = await axios.get('/api/segment-ids', { params: { positionId } });
            if (response.data.success) setSegmentIdOptions(response.data.segments);
        } catch (err) { console.error(err); }
    };

    const validateForm = () => {
        const newErrors = {};
        if (!toCasterId) newErrors.toCasterId = 'Required';
        if (!toStrandId) newErrors.toStrandId = 'Required';
        if (!toPositionId) newErrors.toPositionId = 'Required';
        if (!toSegmentId) newErrors.toSegmentId = 'Required';
        if (!toRollerPosition) newErrors.toRollerPosition = 'Required';
        if (!toConfiguration) newErrors.toConfiguration = 'Required';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = () => {
        if (validateForm()) setShowConfirmDialog(true);
    };

    const confirmSubmit = async () => {
        try {
            const user = JSON.parse(localStorage.getItem('user'));
            const siteRow = casterOptions.find(c => String(c.caster_id) === String(toCasterId));
            const response = await axios.post('/api/ws/dispatch', {
                lifecycleId,
                toCasterId,
                toStrandId,
                toPositionId,
                toSegmentId,
                toRollerPosition,
                toConfiguration,
                toSiteId: siteRow?.site_id || null,
                userId: user?.user_id
            });
            if (response.data.success) {
                alert('Roller dispatched successfully!');
                resetDestinationFields(); // Silent reset
                navigate('/ws-roller'); // Redirect to workshop list
            }
        } catch (err) {
            alert('Error: ' + (err.response?.data?.error || err.message));
        }
        setShowConfirmDialog(false);
    };

    const resetDestinationFields = () => {
        setToCasterId('');
        setToStrandId('');
        setToPositionId('');
        setToSegmentId('');
        setToRollerPosition('');
        setToConfiguration('');
        setErrors({});
    };

    const handleCancel = () => {
        if (window.confirm('Clear dispatch destination?')) {
            resetDestinationFields();
        }
    };

    if (loading) return <div className="processing-details">Loading...</div>;
    if (!lifecycleData) return <div className="processing-details">No data found</div>;

    return (
        <div className="processing-details">
            <h2 className="page-title">Roller at Workshop — Dispatch</h2>

            <div className="form-container">
                {/* Header */}
                <div className="header-row">
                    <div className="field-group pink-field">
                        <label>Roller Type: Roller</label>
                    </div>
                    <div className="field-group white-field">
                        <label>Drive roll/Idle roll</label>
                        <div className="readonly-value">{lifecycleData.roller_function || 'N/A'}</div>
                    </div>
                    <div className="field-group red-field">
                        <label>Roller ID</label>
                        <div className="readonly-value">{rollerId}</div>
                    </div>
                </div>
                {/* Counts */}
                <div className="counts-row">
                    <div className="count-box">
                        <label>Skin pass count</label>
                        <div className="count-value">{lifecycleData.total_skin_cut_count || 0}</div>
                    </div>
                    <div className="count-box">
                        <label>Cladding count</label>
                        <div className="count-value">{lifecycleData.total_cladded_count || 0}</div>
                    </div>
                </div>

                {/* Incoming Details — Read Only */}
                <div className="section-header">Incoming details</div>
                <div className="readonly-section">
                    <div className="section-row">
                        <div className="field-group"><label>Incoming Customer</label><div className="readonly-value">{lifecycleData.site_name || 'N/A'}</div></div>
                        <div className="field-group"><label>Caster ID</label><div className="readonly-value">{lifecycleData.caster_name || 'N/A'}</div></div>
                        <div className="field-group"><label>Strand ID</label><div className="readonly-value">{lifecycleData.strand_no || 'N/A'}</div></div>
                    </div>
                    <div className="section-row">
                        <div className="field-group"><label>Segment Position</label><div className="readonly-value">{lifecycleData.position_no || 'N/A'}</div></div>
                        <div className="field-group"><label>Segment ID</label><div className="readonly-value">{lifecycleData.segment_no || 'N/A'}</div></div>
                        <div className="field-group"><label>Incoming Date</label><div className="readonly-value">{lifecycleData.received_at ? new Date(lifecycleData.received_at).toLocaleDateString() : 'N/A'}</div></div>
                    </div>
                    <div className="section-row">
                        <div className="field-group"><label>Configuration</label><div className="readonly-value">{lifecycleData.received_config || 'N/A'}</div></div>
                        <div className="field-group"><label>Incoming Roller Position</label><div className="readonly-value">{lifecycleData.from_roller_position || 'N/A'}</div></div>
                        <div className="field-group"><label>Segment Tonnage</label><div className="readonly-value">{lifecycleData.tonnage || 'N/A'}</div></div>
                    </div>
                    <div className="section-row">
                        <div className="field-group"><label>Breakout (Y/N)</label><div className="readonly-value">{lifecycleData.breakout_flag ? 'Yes' : 'No'}</div></div>
                        <div className="field-group"><label>Incoming Diameter(A)</label><div className="readonly-value">{lifecycleData.received_diameter_a || 'N/A'}</div></div>
                        <div className="field-group"><label>Incoming Diameter(B)</label><div className="readonly-value">{lifecycleData.received_diameter_b || 'N/A'}</div></div>
                    </div>
                    <div className="section-row">
                        <div className="field-group"><label>Have Journal(Y/N)</label><div className="readonly-value">{lifecycleData.received_journal_flag ? 'Yes' : 'No'}</div></div>
                        {lifecycleData.received_journal_flag && <>
                            <div className="field-group"><label>Journal Diameter (A)</label><div className="readonly-value">{lifecycleData.received_journal_a || 'N/A'}</div></div>
                            <div className="field-group"><label>Journal Diameter (B)</label><div className="readonly-value">{lifecycleData.received_journal_b || 'N/A'}</div></div>
                        </>}
                    </div>
                </div>

                {/* Process Details — Read Only */}
                <div className="section-header">Process details</div>
                <div className="readonly-section">
                    <div className="section-row">
                        <div className="field-group"><label>Skinpass cut</label><div className="readonly-value">{lifecycleData.is_skin_cut ? 'Yes' : 'No'}</div></div>
                        <div className="field-group"><label>Scrap</label><div className="readonly-value">{lifecycleData.roller_scrap_flag ? 'Yes' : 'No'}</div></div>
                        <div className="field-group"><label>Cladding</label><div className="readonly-value">{lifecycleData.is_cladded ? 'Yes' : 'No'}</div></div>
                        {lifecycleData.is_cladded && (
                            <div className="field-group"><label>Cladding Wire Name</label><div className="readonly-value">{lifecycleData.cladding_wire_name || 'N/A'}</div></div>
                        )}
                    </div>
                    <div className="section-row">
                        <div className="field-group"><label>Drive Rotary Joint Change</label><div className="readonly-value">{lifecycleData.drive_rotary_joint_change_flag ? 'Yes' : 'No'}</div></div>
                        <div className="field-group"><label>Idle Rotary Joint (Op. side)</label><div className="readonly-value">{lifecycleData.idle_rotary_joint_change_o_flag ? 'Yes' : 'No'}</div></div>
                        <div className="field-group"><label>Idle Rotary Joint (Drive side)</label><div className="readonly-value">{lifecycleData.idle_rotary_joint_change_d_flag ? 'Yes' : 'No'}</div></div>
                    </div>
                </div>

                {/* Outgoing Details — Read Only */}
                <div className="section-header">Outgoing details</div>
                <div className="readonly-section">
                    <div className="section-row">
                        <div className="field-group"><label>Diameter(A)</label><div className="readonly-value">{lifecycleData.dispatched_diameter_a || 'N/A'}</div></div>
                        <div className="field-group"><label>Diameter(B)</label><div className="readonly-value">{lifecycleData.dispatched_diameter_b || 'N/A'}</div></div>
                        <div className="field-group"><label>Configuration</label><div className="readonly-value">{lifecycleData.dispatched_config || 'N/A'}</div></div>
                    </div>
                    <div className="section-row">
                        <div className="field-group"><label>Have Journal(Y/N)</label><div className="readonly-value">{lifecycleData.dispatched_journal_flag ? 'Yes' : 'No'}</div></div>
                        {lifecycleData.dispatched_journal_flag && <>
                            <div className="field-group"><label>Journal Diameter(A)</label><div className="readonly-value">{lifecycleData.dispatched_journal_a || 'N/A'}</div></div>
                            <div className="field-group"><label>Journal Diameter(B)</label><div className="readonly-value">{lifecycleData.dispatched_journal_b || 'N/A'}</div></div>
                        </>}
                    </div>
                    <div className="section-row">
                        <div className="field-group"><label>Diameter(A) reduce (mm)</label><div className="readonly-value">{lifecycleData.diff_diameter_a || 'N/A'}</div></div>
                        <div className="field-group"><label>Diameter(B) reduce (mm)</label><div className="readonly-value">{lifecycleData.diff_diameter_b || 'N/A'}</div></div>
                    </div>
                </div>

                {/* Dispatch Destination — EDITABLE (pink) */}
                <div className="section-header">Dispatch destination</div>
                <div className="section-row">
                    <div className="field-group pink-field">
                        <label>To Caster ID</label>
                        <select value={toCasterId} onChange={(e) => setToCasterId(e.target.value)} className={errors.toCasterId ? 'error' : ''}>
                            <option value="">-- Select --</option>
                            {casterOptions.map((c, i) => <option key={i} value={c.caster_id}>{c.caster_name}</option>)}
                        </select>
                        {errors.toCasterId && <span className="error-text">{errors.toCasterId}</span>}
                    </div>
                    <div className="field-group pink-field">
                        <label>To Strand ID</label>
                        <select value={toStrandId} onChange={(e) => setToStrandId(e.target.value)} disabled={!toCasterId} className={errors.toStrandId ? 'error' : ''}>
                            <option value="">-- Select --</option>
                            {strandOptions.map((s, i) => <option key={i} value={s.strand_id}>{s.strand_no}</option>)}
                        </select>
                        {errors.toStrandId && <span className="error-text">{errors.toStrandId}</span>}
                    </div>
                </div>

                <div className="section-row">
                    <div className="field-group pink-field">
                        <label>To Segment Position</label>
                        <select value={toPositionId} onChange={(e) => setToPositionId(e.target.value)} disabled={!toStrandId} className={errors.toPositionId ? 'error' : ''}>
                            <option value="">-- Select --</option>
                            {segmentPositionOptions.map((p, i) => <option key={i} value={p.position_id}>{p.position_no}</option>)}
                        </select>
                        {errors.toPositionId && <span className="error-text">{errors.toPositionId}</span>}
                    </div>
                    <div className="field-group pink-field">
                        <label>To Segment ID</label>
                        <select value={toSegmentId} onChange={(e) => setToSegmentId(e.target.value)} disabled={!toPositionId} className={errors.toSegmentId ? 'error' : ''}>
                            <option value="">-- Select --</option>
                            {segmentIdOptions.map((s, i) => <option key={i} value={s.segment_id}>{s.segment_no}</option>)}
                        </select>
                        {errors.toSegmentId && <span className="error-text">{errors.toSegmentId}</span>}
                    </div>
                    <div className="field-group pink-field">
                        <label>To Configuration</label>
                        <select value={toConfiguration} onChange={(e) => setToConfiguration(e.target.value)} className={errors.toConfiguration ? 'error' : ''}>
                            <option value="">-- Select --</option>
                            {[1, 2, 3, 4, 5].map(v => <option key={v} value={v}>{v}</option>)}
                        </select>
                        {errors.toConfiguration && <span className="error-text">{errors.toConfiguration}</span>}
                    </div>
                </div>

                <div className="section-row">
                    <div className="field-group pink-field">
                        <label>Outgoing Roller Position (1-14)</label>
                        <select value={toRollerPosition} onChange={(e) => setToRollerPosition(e.target.value)} className={errors.toRollerPosition ? 'error' : ''}>
                            <option value="">-- Select --</option>
                            {[...Array(14)].map((_, i) => <option key={i} value={i + 1}>{i + 1}</option>)}
                        </select>
                        {errors.toRollerPosition && <span className="error-text">{errors.toRollerPosition}</span>}
                    </div>
                </div>

                {/* Buttons */}
                <div className="action-buttons">
                    <button className="btn btn-back" onClick={() => navigate(-1)}>Back</button>
                    <button className="btn btn-cancel" onClick={handleCancel}>Cancel</button>
                    <button className="btn btn-submit" onClick={handleSubmit}>Submit</button>
                </div>
            </div>

            {showConfirmDialog && (
                <div className="modal-overlay">
                    <div className="modal-dialog">
                        <p>Confirm dispatch of roller <strong>{rollerId}</strong>?</p>
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

export default WSRollerDetails;
