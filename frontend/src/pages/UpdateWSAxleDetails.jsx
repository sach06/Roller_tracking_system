import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import './ProcessingDetails.css';

const UpdateWSAxleDetails = () => {
    const navigate = useNavigate();
    const { axleId } = useParams();

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
    }, [axleId]);

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
            const response = await axios.get(`/api/update/axle-details/${axleId}`);
            if (response.data.success) {
                const data = response.data.details;
                setLifecycleData(data);

                // Pre-fill destination fields
                setToCasterId(data.to_caster_id || '');
                if (data.to_caster_id) await fetchStrands(data.to_caster_id);
                setToStrandId(data.to_strand_id || '');
                if (data.to_strand_id) await fetchSegmentPositions(data.to_strand_id);
                setToPositionId(data.to_position_id || '');
                if (data.to_position_id) await fetchSegmentIds(data.to_position_id);
                setToSegmentId(data.to_segment_id || '');
                setToRollerPosition(data.to_roller_position || '');
                setToConfiguration(data.dispatched_config || '');
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
            const response = await axios.post('/api/update/axle-dispatch', {
                axleId,
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
                alert('Sleeve/Axle update successfully saved!');
                navigate(-1); // Redirect back to list
            }
        } catch (err) {
            alert('Error: ' + (err.response?.data?.error || err.message));
        }
        setShowConfirmDialog(false);
    };

    const handleCancel = () => {
        if (window.confirm('Discard changes and return?')) {
            navigate(-1);
        }
    };

    if (loading) return <div className="processing-details">Loading...</div>;
    if (!lifecycleData) return <div className="processing-details">No data found</div>;

    return (
        <div className="processing-details">
            <h2 className="page-title">Update Dispatched Axle</h2>

            <div className="form-container">
                {/* Header */}
                <div className="header-row">
                    <div className="field-group pink-field">
                        <label>Roller Type: Sleeve</label>
                    </div>
                    <div className="field-group white-field">
                        <label>Drive roll/Idle roll</label>
                        <div className="readonly-value">{lifecycleData.roller_function || 'Idle'}</div>
                    </div>
                    <div className="field-group red-field">
                        <label>Axle ID</label>
                        <div className="readonly-value">{axleId}</div>
                    </div>
                </div>

                {/* Outgoing Details — Read Only */}
                <div className="section-header">Outgoing details</div>
                <div className="readonly-section">
                    <div className="section-row">
                        <div className="field-group"><label>Max Diameter(A)</label><div className="readonly-value">{lifecycleData.dispatched_diameter_a || 'N/A'}</div></div>
                        <div className="field-group"><label>Max Diameter(B)</label><div className="readonly-value">{lifecycleData.dispatched_diameter_b || 'N/A'}</div></div>
                        <div className="field-group"><label>Configuration</label><div className="readonly-value">{lifecycleData.dispatched_config || 'N/A'}</div></div>
                    </div>
                </div>

                {/* Associated Sleeves */}
                <div className="section-header">Associated Sleeves</div>
                <div className="readonly-section">
                    <div className="section-row">
                        <div className="field-group" style={{ width: '100%' }}>
                            <label>Sleeve IDs</label>
                            <div className="readonly-value">
                                {lifecycleData.sleeve_ids && lifecycleData.sleeve_ids.length > 0
                                    ? lifecycleData.sleeve_ids.join(', ')
                                    : 'N/A'}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Dispatch Destination — EDITABLE (pink) */}
                <div className="section-header">Dispatch destination (Update)</div>
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
                            {strandOptions.map((s, i) => <option key={s.strand_id}>{s.strand_no}</option>)}
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
                        <label>To Roller Position (1-14)</label>
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
                    <button className="btn btn-submit" onClick={handleSubmit}>Update</button>
                </div>
            </div>

            {showConfirmDialog && (
                <div className="modal-overlay">
                    <div className="modal-dialog">
                        <p>Confirm updating dispatch location for axle <strong>{axleId}</strong>?</p>
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

export default UpdateWSAxleDetails;
