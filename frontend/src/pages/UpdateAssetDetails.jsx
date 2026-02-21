import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import './ProcessingDetails.css';

const UpdateAssetDetails = () => {
    const navigate = useNavigate();
    const { rollerId, lifecycleId } = useParams();
    const [user, setUser] = useState(null);

    const [lifecycleData, setLifecycleData] = useState(null);
    const [loading, setLoading] = useState(true);

    // Dropdown options
    const [siteOptions, setSiteOptions] = useState([]);
    const [incomingCasterOptions, setIncomingCasterOptions] = useState([]);
    const [incomingStrandOptions, setIncomingStrandOptions] = useState([]);
    const [incomingPositionOptions, setIncomingPositionOptions] = useState([]);
    const [incomingSegmentOptions, setIncomingSegmentOptions] = useState([]);
    const [claddingWireOptions, setCladdingWireOptions] = useState([]);

    // Separate options for Dispatch
    const [dispatchCasterOptions, setDispatchCasterOptions] = useState([]);
    const [dispatchStrandOptions, setDispatchStrandOptions] = useState([]);
    const [dispatchPositionOptions, setDispatchPositionOptions] = useState([]);
    const [dispatchSegmentOptions, setDispatchSegmentOptions] = useState([]);

    // Form state - Incoming
    const [incoming, setIncoming] = useState({
        fromSiteId: '',
        fromCasterId: '',
        fromStrandId: '',
        fromPositionId: '',
        fromSegmentId: '',
        receivedAt: '',
        receivedConfig: '',
        fromRollerPosition: '',
        receivedDiameterA: '',
        receivedDiameterB: '',
        receivedJournalFlag: false,
        receivedJournalA: '',
        receivedJournalB: '',
        breakoutFlag: false,
        tonnage: '',
        receivedAxleId: ''
    });

    // Form state - Process
    const [process, setProcess] = useState({
        isSkinCut: '',
        isCladded: '',
        claddingWireId: '',
        rollerScrapFlag: '',
        rollerScrapReason: '',
        driveRotaryJointChangeFlag: '',
        idleRotaryJointChangeOFlag: '',
        idleRotaryJointChangeDFlag: ''
    });

    // Form state - Outgoing
    const [outgoing, setOutgoing] = useState({
        outDiaA: '',
        outDiaB: '',
        diffDiaA: '',
        diffDiaB: '',
        processedAt: ''
    });

    // Form state - Dispatch
    const [dispatch, setDispatch] = useState({
        toCasterId: '',
        toStrandId: '',
        toPositionId: '',
        toSegmentId: '',
        toRollerPosition: '',
        dispatchedConfig: '',
        dispatchedAxleId: '',
        dispatchedAxleStraightFlag: false,
        dispatchedJournalFlag: false,
        dispatchedJournalA: '',
        dispatchedJournalB: ''
    });

    const [showConfirmDialog, setShowConfirmDialog] = useState(false);

    useEffect(() => {
        const userData = JSON.parse(localStorage.getItem('user'));
        setUser(userData);
        if (userData) {
            fetchInitialData(userData);
            fetchLifecycleData(userData);
        }
    }, [rollerId, lifecycleId]);

    const fetchInitialData = async (userData) => {
        try {
            const [sites, wires, allCasters] = await Promise.all([
                axios.get('/api/sites'),
                axios.get('/api/cladding-wires'),
                axios.get('/api/casters', { params: { userId: userData.user_id } })
            ]);
            if (sites.data.success) setSiteOptions(sites.data.sites);
            if (wires.data.success) setCladdingWireOptions(wires.data.wires);
            if (allCasters.data.success) setDispatchCasterOptions(allCasters.data.casters);
        } catch (err) { console.error('Error fetching dropdowns:', err); }
    };

    const fetchLifecycleData = async (userData) => {
        try {
            const response = await axios.get(`/api/processing/lifecycle/${rollerId}/${lifecycleId}`);
            if (response.data.success) {
                const data = response.data.lifecycle;
                setLifecycleData(data);

                // Initialize Incoming
                setIncoming({
                    fromSiteId: data.from_site_id || '',
                    fromCasterId: data.from_caster_id || '',
                    fromStrandId: data.from_strand_id || '',
                    fromPositionId: data.from_position_id || '',
                    fromSegmentId: data.from_segment_id || '',
                    receivedAt: data.received_at ? new Date(data.received_at).toISOString().split('T')[0] : '',
                    receivedConfig: data.received_config || '',
                    fromRollerPosition: data.from_roller_position || '',
                    receivedDiameterA: data.received_diameter_a || '',
                    receivedDiameterB: data.received_diameter_b || '',
                    receivedJournalFlag: !!data.received_journal_flag,
                    receivedJournalA: data.received_journal_a || '',
                    receivedJournalB: data.received_journal_b || '',
                    breakoutFlag: !!data.breakout_flag,
                    tonnage: data.tonnage || '',
                    receivedAxleId: data.received_axle_id || ''
                });

                // Initialize Process
                setProcess({
                    isSkinCut: data.is_skin_cut ? 'Yes' : 'No',
                    isCladded: data.is_cladded ? 'Yes' : 'No',
                    claddingWireId: data.cladding_wire_id || '',
                    rollerScrapFlag: data.roller_scrap_flag ? 'Yes' : 'No',
                    rollerScrapReason: data.roller_scrap_reason || '',
                    driveRotaryJointChangeFlag: data.drive_rotary_joint_change_flag ? 'Yes' : 'No',
                    idleRotaryJointChangeOFlag: data.idle_rotary_joint_change_o_flag ? 'Yes' : 'No',
                    idleRotaryJointChangeDFlag: data.idle_rotary_joint_change_d_flag ? 'Yes' : 'No'
                });

                // Initialize Outgoing
                setOutgoing({
                    outDiaA: data.dispatched_diameter_a || '',
                    outDiaB: data.dispatched_diameter_b || '',
                    diffDiaA: data.diff_diameter_a || '',
                    diffDiaB: data.diff_diameter_b || '',
                    processedAt: data.processed_at ? new Date(data.processed_at).toISOString().split('T')[0] : ''
                });

                // Initialize Dispatch
                setDispatch({
                    toCasterId: data.to_caster_id || '',
                    toStrandId: data.to_strand_id || '',
                    toPositionId: data.to_position_id || '',
                    toSegmentId: data.to_segment_id || '',
                    toRollerPosition: data.to_roller_position || '',
                    dispatchedConfig: data.dispatched_config || '',
                    dispatchedAxleId: data.dispatched_axle_id || '',
                    dispatchedAxleStraightFlag: !!data.dispatched_axle_straight_flag,
                    dispatchedJournalFlag: !!data.dispatched_journal_flag,
                    dispatchedJournalA: data.dispatched_journal_a || '',
                    dispatchedJournalB: data.dispatched_journal_b || ''
                });

                // Trigger cascading fetches
                if (data.from_site_id) fetchIncomingCasters(data.from_site_id);
                if (data.from_caster_id) fetchIncomingStrands(data.from_caster_id);
                if (data.from_strand_id) fetchIncomingPositions(data.from_strand_id);
                if (data.from_position_id) fetchIncomingSegments(data.from_position_id);

                if (data.to_caster_id) fetchDispatchStrands(data.to_caster_id);
                if (data.to_strand_id) fetchDispatchPositions(data.to_strand_id);
                if (data.to_position_id) fetchDispatchSegments(data.to_position_id);
            }
            setLoading(false);
        } catch (err) {
            console.error('Error fetching lifecycle data:', err);
            setLoading(false);
        }
    };

    // --- FETCHERS ---
    const fetchIncomingCasters = async (siteId) => {
        try {
            const response = await axios.get('/api/casters', { params: { siteId } });
            if (response.data.success) setIncomingCasterOptions(response.data.casters);
        } catch (err) { console.error(err); }
    };

    const fetchIncomingStrands = async (casterId) => {
        try {
            const response = await axios.get('/api/strands', { params: { casterId } });
            if (response.data.success) setIncomingStrandOptions(response.data.strands);
        } catch (err) { console.error(err); }
    };

    const fetchIncomingPositions = async (strandId) => {
        try {
            const response = await axios.get('/api/segment-positions', { params: { strandId } });
            if (response.data.success) setIncomingPositionOptions(response.data.positions);
        } catch (err) { console.error(err); }
    };

    const fetchIncomingSegments = async (positionId) => {
        try {
            const response = await axios.get('/api/segment-ids', { params: { positionId } });
            if (response.data.success) setIncomingSegmentOptions(response.data.segments);
        } catch (err) { console.error(err); }
    };

    const fetchDispatchStrands = async (casterId) => {
        try {
            const response = await axios.get('/api/strands', { params: { casterId } });
            if (response.data.success) setDispatchStrandOptions(response.data.strands);
        } catch (err) { console.error(err); }
    };

    const fetchDispatchPositions = async (strandId) => {
        try {
            const response = await axios.get('/api/segment-positions', { params: { strandId } });
            if (response.data.success) setDispatchPositionOptions(response.data.positions);
        } catch (err) { console.error(err); }
    };

    const fetchDispatchSegments = async (positionId) => {
        try {
            const response = await axios.get('/api/segment-ids', { params: { positionId } });
            if (response.data.success) setDispatchSegmentOptions(response.data.segments);
        } catch (err) { console.error(err); }
    };

    // Auto-calculate differences
    useEffect(() => {
        const inA = parseFloat(incoming.receivedDiameterA);
        const outA = parseFloat(outgoing.outDiaA);
        const inB = parseFloat(incoming.receivedDiameterB);
        const outB = parseFloat(outgoing.outDiaB);

        setOutgoing(prev => ({
            ...prev,
            diffDiaA: (!isNaN(inA) && !isNaN(outA)) ? (inA - outA).toFixed(3) : '',
            diffDiaB: (!isNaN(inB) && !isNaN(outB)) ? (inB - outB).toFixed(3) : ''
        }));
    }, [incoming.receivedDiameterA, incoming.receivedDiameterB, outgoing.outDiaA, outgoing.outDiaB]);

    const handleSubmit = () => {
        setShowConfirmDialog(true);
    };

    const confirmSubmit = async () => {
        try {
            const payload = {
                lifecycleId,
                userId: user?.user_id
            };

            // Requirement: WS role updates dispatch & outgoing. REF role updates based on status.
            if (isWsRole) {
                payload.dispatchDetails = dispatch;
                payload.outgoingDetails = outgoing;
            } else if (isRefRole) {
                payload.incomingDetails = {
                    ...incoming,
                    receivedJournalFlag: incoming.receivedJournalFlag ? 1 : 0,
                    breakoutFlag: incoming.breakoutFlag ? 1 : 0
                };
                if (isProcessed) {
                    payload.processDetails = {
                        isSkinCut: process.isSkinCut === 'Yes' ? 1 : 0,
                        isCladded: process.isCladded === 'Yes' ? 1 : 0,
                        claddingWireId: process.claddingWireId,
                        rollerScrapFlag: process.rollerScrapFlag === 'Yes' ? 1 : 0,
                        rollerScrapReason: process.rollerScrapReason,
                        driveRotaryJointChangeFlag: process.driveRotaryJointChangeFlag === 'Yes' ? 1 : 0,
                        idleRotaryJointChangeOFlag: process.idleRotaryJointChangeOFlag === 'Yes' ? 1 : 0,
                        idleRotaryJointChangeDFlag: process.idleRotaryJointChangeDFlag === 'Yes' ? 1 : 0
                    };
                    payload.outgoingDetails = outgoing;
                    payload.dispatchDetails = {
                        ...dispatch,
                        dispatchedAxleStraightFlag: dispatch.dispatchedAxleStraightFlag ? 1 : 0,
                        dispatchedJournalFlag: dispatch.dispatchedJournalFlag ? 1 : 0
                    };
                }
            }

            const response = await axios.post('/api/admin/update-lifecycle', payload);
            if (response.data.success) {
                setShowConfirmDialog(false);
                alert('Update successful!');
                navigate(-1); // Go back to the list
            }
        } catch (err) {
            console.error('Update error:', err);
            setShowConfirmDialog(false);
            alert('Error updating: ' + (err.response?.data?.error || err.message));
        }
    };

    if (loading) return <div className="processing-details">Loading...</div>;
    if (!lifecycleData) return <div className="processing-details">No data found</div>;

    const isRefRole = user?.role_code === 'REF_OP' || user?.role_code === 'REF_ADMIN';
    const isWsRole = user?.role_code === 'WS_OP' || user?.role_code === 'WS_ADMIN';
    const currentStage = lifecycleData.process_stage;
    const isDispatched = currentStage === 'DISPATCHED';
    const isProcessed = currentStage === 'PROCESSED';
    const isReceived = currentStage === 'RECEIVED';
    const rollerType = lifecycleData.roller_type || 'Roller';

    // Role-based Editability Logic
    let refCanIncoming = false;
    let refCanProcess = false;
    let refCanOutgoing = false;
    let refCanDispatch = false;

    if (isRefRole) {
        if (currentStage === 'RECEIVED') {
            refCanIncoming = true;
        } else if (currentStage === 'PROCESSED') {
            refCanIncoming = true;
            refCanProcess = true;
            refCanOutgoing = true;
            refCanDispatch = true;
        }
    }

    const canEditIncoming_Final = isWsRole ? false : refCanIncoming;
    const canEditProcess_Final = isWsRole ? false : refCanProcess;
    const canEditOutgoing_Final = isWsRole ? true : refCanOutgoing;
    const canEditDispatch_Final = isWsRole ? true : refCanDispatch;

    // Show Dispatch section ONLY for Workshop roles, as per latest requirement
    const showDispatchSection = isWsRole;

    return (
        <div className="processing-details">
            <h2 className="page-title">Update Asset Details — {rollerId}</h2>

            <div className="form-container">
                {isRefRole && isDispatched && (
                    <div className="status-banner" style={{ backgroundColor: '#FEF2F2', color: '#991B1B', padding: '10px', borderRadius: '4px', marginBottom: '20px', textAlign: 'center', fontWeight: 'bold' }}>
                        This asset is already DISPATCHED and cannot be edited by REF roles.
                    </div>
                )}

                {/* Header Info */}
                <div className="header-row">
                    <div className="field-group pink-field">
                        <label>Roller Type: {rollerType}</label>
                    </div>
                    <div className="field-group white-field">
                        <label>{rollerType === 'Roller' ? 'Drive roll/Idle roll' : 'Idle roll'}</label>
                        <div className="readonly-value">{lifecycleData.roller_function || 'N/A'}</div>
                    </div>
                    <div className="field-group red-field">
                        <label>{rollerType} ID</label>
                        <div className="readonly-value">{rollerId}</div>
                    </div>
                    <div className="field-group gray-field">
                        <label>Current Status</label>
                        <div className="readonly-value" style={{ color: currentStage === 'RECEIVED' ? '#10B981' : currentStage === 'PROCESSED' ? '#3B82F6' : '#EF4444' }}>
                            {currentStage}
                        </div>
                    </div>
                </div>

                {/* 1. Incoming Details */}
                <div className="section-header">Incoming details</div>
                <div className="section-row">
                    <div className={`field-group ${canEditIncoming_Final ? 'pink-field' : 'gray-field'}`}>
                        <label>Incoming Customer</label>
                        <select
                            value={incoming.fromSiteId}
                            disabled={!canEditIncoming_Final}
                            onChange={(e) => {
                                const sid = e.target.value;
                                setIncoming({ ...incoming, fromSiteId: sid, fromCasterId: '', fromStrandId: '', fromPositionId: '', fromSegmentId: '' });
                                fetchIncomingCasters(sid);
                            }}
                        >
                            <option value="">-- Select --</option>
                            {siteOptions.map(s => <option key={s.site_id} value={s.site_id}>{s.site_name}</option>)}
                        </select>
                    </div>
                    <div className={`field-group ${canEditIncoming_Final ? 'pink-field' : 'gray-field'}`}>
                        <label>Caster ID</label>
                        <select
                            value={incoming.fromCasterId}
                            disabled={!canEditIncoming_Final || !incoming.fromSiteId}
                            onChange={(e) => {
                                const cid = e.target.value;
                                setIncoming({ ...incoming, fromCasterId: cid, fromStrandId: '', fromPositionId: '', fromSegmentId: '' });
                                fetchIncomingStrands(cid);
                            }}
                        >
                            <option value="">-- Select --</option>
                            {incomingCasterOptions.map(c => <option key={c.caster_id} value={c.caster_id}>{c.caster_name}</option>)}
                        </select>
                    </div>
                    <div className={`field-group ${canEditIncoming_Final ? 'pink-field' : 'gray-field'}`}>
                        <label>Strand ID</label>
                        <select
                            value={incoming.fromStrandId}
                            disabled={!canEditIncoming_Final || !incoming.fromCasterId}
                            onChange={(e) => {
                                const sid = e.target.value;
                                setIncoming({ ...incoming, fromStrandId: sid, fromPositionId: '', fromSegmentId: '' });
                                fetchIncomingPositions(sid);
                            }}
                        >
                            <option value="">-- Select --</option>
                            {incomingStrandOptions.map(s => <option key={s.strand_id} value={s.strand_id}>{s.strand_no}</option>)}
                        </select>
                    </div>
                </div>
                <div className="section-row">
                    <div className={`field-group ${canEditIncoming_Final ? 'pink-field' : 'gray-field'}`}>
                        <label>Segment Position</label>
                        <select
                            value={incoming.fromPositionId}
                            disabled={!canEditIncoming_Final || !incoming.fromStrandId}
                            onChange={(e) => {
                                const pid = e.target.value;
                                setIncoming({ ...incoming, fromPositionId: pid, fromSegmentId: '' });
                                fetchIncomingSegments(pid);
                            }}
                        >
                            <option value="">-- Select --</option>
                            {incomingPositionOptions.map(p => <option key={p.position_id} value={p.position_id}>{p.position_no}</option>)}
                        </select>
                    </div>
                    <div className={`field-group ${canEditIncoming_Final ? 'pink-field' : 'gray-field'}`}>
                        <label>Segment ID</label>
                        <select
                            value={incoming.fromSegmentId}
                            disabled={!canEditIncoming_Final || !incoming.fromPositionId}
                            onChange={(e) => setIncoming({ ...incoming, fromSegmentId: e.target.value })}
                        >
                            <option value="">-- Select --</option>
                            {incomingSegmentOptions.map(s => <option key={s.segment_id} value={s.segment_id}>{s.segment_no}</option>)}
                        </select>
                    </div>
                    <div className={`field-group ${canEditIncoming_Final ? 'pink-field' : 'gray-field'}`}>
                        <label>Incoming Date</label>
                        <input type="date" value={incoming.receivedAt} disabled={!canEditIncoming_Final} onChange={(e) => setIncoming({ ...incoming, receivedAt: e.target.value })} />
                    </div>
                </div>
                <div className="section-row">
                    <div className={`field-group ${canEditIncoming_Final ? 'white-field' : 'gray-field'}`}>
                        <label>Incoming Config</label>
                        <select value={incoming.receivedConfig} disabled={!canEditIncoming_Final} onChange={(e) => setIncoming({ ...incoming, receivedConfig: e.target.value })}>
                            <option value="">-- Select --</option>
                            {[1, 2, 3, 4, 5].map(v => <option key={v} value={v}>{v}</option>)}
                        </select>
                    </div>
                    <div className={`field-group ${canEditIncoming_Final ? 'white-field' : 'gray-field'}`}>
                        <label>Incoming Roll Pos</label>
                        <select value={incoming.fromRollerPosition} disabled={!canEditIncoming_Final} onChange={(e) => setIncoming({ ...incoming, fromRollerPosition: e.target.value })}>
                            <option value="">-- Select --</option>
                            {[...Array(14)].map((_, i) => <option key={i} value={i + 1}>{i + 1}</option>)}
                        </select>
                    </div>
                    <div className={`field-group ${canEditIncoming_Final ? 'white-field' : 'gray-field'}`}>
                        <label>Diameter(A)</label>
                        <input type="number" step="0.001" value={incoming.receivedDiameterA} disabled={!canEditIncoming_Final} onChange={(e) => setIncoming({ ...incoming, receivedDiameterA: e.target.value })} />
                    </div>
                    <div className={`field-group ${canEditIncoming_Final ? 'white-field' : 'gray-field'}`}>
                        <label>Diameter(B)</label>
                        <input type="number" step="0.001" value={incoming.receivedDiameterB} disabled={!canEditIncoming_Final} onChange={(e) => setIncoming({ ...incoming, receivedDiameterB: e.target.value })} />
                    </div>
                </div>
                {rollerType === 'Sleeve' && (
                    <div className="section-row">
                        <div className={`field-group ${canEditIncoming_Final ? 'pink-field' : 'gray-field'}`}>
                            <label>Axle ID</label>
                            <input
                                type="text"
                                value={incoming.receivedAxleId || ''}
                                disabled={!canEditIncoming_Final}
                                onChange={(e) => setIncoming({ ...incoming, receivedAxleId: e.target.value })}
                            />
                        </div>
                    </div>
                )}

                {/* Journal Section */}
                <div className="section-row">
                    <div className={`field-group ${canEditIncoming_Final ? 'pink-field' : 'gray-field'}`}>
                        <label className="checkbox-label">
                            <input
                                type="checkbox"
                                checked={incoming.receivedJournalFlag}
                                disabled={!canEditIncoming_Final}
                                onChange={(e) => setIncoming({ ...incoming, receivedJournalFlag: e.target.checked })}
                            />
                            Have Journal(Y/N)
                        </label>
                    </div>
                    {incoming.receivedJournalFlag && (
                        <>
                            <div className={`field-group ${canEditIncoming_Final ? 'white-field' : 'gray-field'}`}>
                                <label>Journal Diameter (A)</label>
                                <input
                                    type="number"
                                    step="0.001"
                                    value={incoming.receivedJournalA}
                                    disabled={!canEditIncoming_Final}
                                    onChange={(e) => setIncoming({ ...incoming, receivedJournalA: e.target.value })}
                                />
                            </div>
                            <div className={`field-group ${canEditIncoming_Final ? 'white-field' : 'gray-field'}`}>
                                <label>Journal Diameter (B)</label>
                                <input
                                    type="number"
                                    step="0.001"
                                    value={incoming.receivedJournalB}
                                    disabled={!canEditIncoming_Final}
                                    onChange={(e) => setIncoming({ ...incoming, receivedJournalB: e.target.value })}
                                />
                            </div>
                        </>
                    )}
                </div>

                {/* 2. Process Details */}
                <div className="section-header">Process details</div>
                <div className="section-row">
                    <div className={`field-group ${canEditProcess_Final ? 'pink-field' : 'gray-field'}`}>
                        <label>Skinpass cut (Y/N)</label>
                        <select
                            value={process.isSkinCut}
                            disabled={!canEditProcess_Final}
                            onChange={(e) => {
                                const val = e.target.value;
                                let newProcess = { ...process, isSkinCut: val };
                                if (val === 'Yes') {
                                    newProcess.rollerScrapFlag = 'No';
                                    newProcess.isCladded = 'No';
                                } else if (val === 'No' && process.rollerScrapFlag === 'No') {
                                    newProcess.isCladded = 'Yes';
                                }
                                setProcess(newProcess);
                            }}
                        >
                            <option value="">-- Select --</option>
                            <option value="Yes">Yes</option>
                            <option value="No">No</option>
                        </select>
                    </div>

                    {(process.isSkinCut === 'No' || process.isSkinCut === '') && (
                        <div className={`field-group ${canEditProcess_Final ? 'pink-field' : 'gray-field'}`}>
                            <label>Sleeve/Roller Scrap(Y/N)</label>
                            <select
                                value={process.rollerScrapFlag}
                                disabled={!canEditProcess_Final}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    let newProcess = { ...process, rollerScrapFlag: val };
                                    if (val === 'Yes') {
                                        newProcess.isCladded = 'No';
                                    } else if (val === 'No' && process.isSkinCut === 'No') {
                                        newProcess.isCladded = 'Yes';
                                    }
                                    setProcess(newProcess);
                                }}
                            >
                                <option value="">-- Select --</option>
                                <option value="Yes">Yes</option>
                                <option value="No">No</option>
                            </select>
                        </div>
                    )}

                    {process.rollerScrapFlag === 'Yes' && (
                        <div className={`field-group ${canEditProcess_Final ? 'pink-field' : 'gray-field'}`}>
                            <label>Scrap Reason</label>
                            <input
                                type="text"
                                value={process.rollerScrapReason}
                                disabled={!canEditProcess_Final}
                                onChange={(e) => setProcess({ ...process, rollerScrapReason: e.target.value })}
                                placeholder="Enter scrap reason"
                            />
                        </div>
                    )}
                </div>

                {process.rollerScrapFlag === 'No' && process.isSkinCut === 'No' && (
                    <div className="section-row">
                        <div className={`field-group ${canEditProcess_Final ? 'pink-field' : 'gray-field'}`}>
                            <label>Cladding (Y/N)</label>
                            <select
                                value={process.isCladded}
                                disabled={!canEditProcess_Final}
                                onChange={(e) => setProcess({ ...process, isCladded: e.target.value })}
                            >
                                <option value="">-- Select --</option>
                                <option value="Yes">Yes</option>
                                <option value="No">No</option>
                            </select>
                        </div>

                        {process.isCladded === 'Yes' && (
                            <div className={`field-group ${canEditProcess_Final ? 'pink-field' : 'gray-field'}`}>
                                <label>Wires used</label>
                                <select
                                    value={process.claddingWireId}
                                    disabled={!canEditProcess_Final}
                                    onChange={(e) => setProcess({ ...process, claddingWireId: e.target.value })}
                                >
                                    <option value="">-- Select --</option>
                                    {claddingWireOptions.map(w => (
                                        <option key={w.cladding_wire_id} value={w.cladding_wire_id}>{w.wire_name}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>
                )}

                {/* Rotary Joint Changes - Roller Only */}
                {rollerType === 'Roller' && process.rollerScrapFlag === 'No' && (
                    <div className="section-row">
                        <div className={`field-group ${canEditProcess_Final ? 'pink-field' : 'gray-field'}`}>
                            <label>drive roller: Rotary joint change (Y/N)</label>
                            <select
                                value={process.driveRotaryJointChangeFlag}
                                disabled={!canEditProcess_Final}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    let newProcess = { ...process, driveRotaryJointChangeFlag: val };
                                    if (val !== 'Yes') {
                                        newProcess.idleRotaryJointChangeOFlag = 'No';
                                        newProcess.idleRotaryJointChangeDFlag = 'No';
                                    }
                                    setProcess(newProcess);
                                }}
                            >
                                <option value="">-- Select --</option>
                                <option value="Yes">Yes</option>
                                <option value="No">No</option>
                            </select>
                        </div>
                        {process.driveRotaryJointChangeFlag === 'Yes' && (
                            <>
                                <div className={`field-group ${canEditProcess_Final ? 'pink-field' : 'gray-field'}`}>
                                    <label>Idle: Rotary joint change operator side (Y/N)</label>
                                    <select
                                        value={process.idleRotaryJointChangeOFlag}
                                        disabled={!canEditProcess_Final}
                                        onChange={(e) => setProcess({ ...process, idleRotaryJointChangeOFlag: e.target.value })}
                                    >
                                        <option value="">-- Select --</option>
                                        <option value="Yes">Yes</option>
                                        <option value="No">No</option>
                                    </select>
                                </div>
                                <div className={`field-group ${canEditProcess_Final ? 'pink-field' : 'gray-field'}`}>
                                    <label>Idle: Rotary joint change drive side (Y/N)</label>
                                    <select
                                        value={process.idleRotaryJointChangeDFlag}
                                        disabled={!canEditProcess_Final}
                                        onChange={(e) => setProcess({ ...process, idleRotaryJointChangeDFlag: e.target.value })}
                                    >
                                        <option value="">-- Select --</option>
                                        <option value="Yes">Yes</option>
                                        <option value="No">No</option>
                                    </select>
                                </div>
                            </>
                        )}
                    </div>
                )}

                {/* 3. Outgoing Details */}
                <div className="section-header">Outgoing details</div>
                <div className="section-row">
                    <div className={`field-group ${canEditOutgoing_Final ? 'pink-field' : 'gray-field'}`}>
                        <label>Processed Date</label>
                        <input type="date" value={outgoing.processedAt} disabled={!canEditOutgoing_Final} onChange={(e) => setOutgoing({ ...outgoing, processedAt: e.target.value })} />
                    </div>
                    <div className={`field-group ${canEditOutgoing_Final ? 'white-field' : 'gray-field'}`}>
                        <label>Final Diameter(A)</label>
                        <input type="number" step="0.001" value={outgoing.outDiaA} disabled={!canEditOutgoing_Final} onChange={(e) => setOutgoing({ ...outgoing, outDiaA: e.target.value })} />
                    </div>
                    <div className={`field-group ${canEditOutgoing_Final ? 'white-field' : 'gray-field'}`}>
                        <label>Final Diameter(B)</label>
                        <input type="number" step="0.001" value={outgoing.outDiaB} disabled={!canEditOutgoing_Final} onChange={(e) => setOutgoing({ ...outgoing, outDiaB: e.target.value })} />
                    </div>
                </div>
                <div className="section-row">
                    <div className="field-group gray-field">
                        <label>Diff Diameter(A)</label>
                        <div className="readonly-value">{outgoing.diffDiaA || '0.000'}</div>
                    </div>
                    <div className="field-group gray-field">
                        <label>Diff Diameter(B)</label>
                        <div className="readonly-value">{outgoing.diffDiaB || '0.000'}</div>
                    </div>
                </div>

                {/* 4. Dispatch Destination */}
                {showDispatchSection && (
                    <>
                        <div className="section-header">Dispatch destination</div>
                        <div className="section-row">
                            <div className={`field-group ${canEditDispatch_Final ? 'pink-field' : 'gray-field'}`}>
                                <label>To Caster ID</label>
                                <select
                                    value={dispatch.toCasterId}
                                    disabled={!canEditDispatch_Final}
                                    onChange={(e) => {
                                        const cid = e.target.value;
                                        setDispatch({ ...dispatch, toCasterId: cid, toStrandId: '', toPositionId: '', toSegmentId: '' });
                                        fetchDispatchStrands(cid);
                                    }}
                                >
                                    <option value="">-- Select --</option>
                                    {dispatchCasterOptions.map(c => <option key={c.caster_id} value={c.caster_id}>{c.caster_name}</option>)}
                                </select>
                            </div>
                            <div className={`field-group ${canEditDispatch_Final ? 'pink-field' : 'gray-field'}`}>
                                <label>To Strand ID</label>
                                <select
                                    value={dispatch.toStrandId}
                                    disabled={!canEditDispatch_Final || !dispatch.toCasterId}
                                    onChange={(e) => {
                                        const sid = e.target.value;
                                        setDispatch({ ...dispatch, toStrandId: sid, toPositionId: '', toSegmentId: '' });
                                        fetchDispatchPositions(sid);
                                    }}
                                >
                                    <option value="">-- Select --</option>
                                    {dispatchStrandOptions.map(s => <option key={s.strand_id} value={s.strand_id}>{s.strand_no}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="section-row">
                            <div className={`field-group ${canEditDispatch_Final ? 'pink-field' : 'gray-field'}`}>
                                <label>To Segment Position</label>
                                <select
                                    value={dispatch.toPositionId}
                                    disabled={!canEditDispatch_Final || !dispatch.toStrandId}
                                    onChange={(e) => {
                                        const pid = e.target.value;
                                        setDispatch({ ...dispatch, toPositionId: pid, toSegmentId: '' });
                                        fetchDispatchSegments(pid);
                                    }}
                                >
                                    <option value="">-- Select --</option>
                                    {dispatchPositionOptions.map(p => <option key={p.position_id} value={p.position_id}>{p.position_no}</option>)}
                                </select>
                            </div>
                            <div className={`field-group ${canEditDispatch_Final ? 'pink-field' : 'gray-field'}`}>
                                <label>To Segment ID</label>
                                <select
                                    value={dispatch.toSegmentId}
                                    disabled={!canEditDispatch_Final || !dispatch.toPositionId}
                                    onChange={(e) => setDispatch({ ...dispatch, toSegmentId: e.target.value })}
                                >
                                    <option value="">-- Select --</option>
                                    {dispatchSegmentOptions.map(s => <option key={s.segment_id} value={s.segment_id}>{s.segment_no}</option>)}
                                </select>
                            </div>
                            <div className={`field-group ${canEditDispatch_Final ? 'white-field' : 'gray-field'}`}>
                                <label>To Config</label>
                                <select value={dispatch.dispatchedConfig} disabled={!canEditDispatch_Final} onChange={(e) => setDispatch({ ...dispatch, dispatchedConfig: e.target.value })}>
                                    <option value="">-- Select --</option>
                                    {[1, 2, 3, 4, 5].map(v => <option key={v} value={v}>{v}</option>)}
                                </select>
                            </div>
                            <div className={`field-group ${canEditDispatch_Final ? 'white-field' : 'gray-field'}`}>
                                <label>To Roll Pos</label>
                                <select value={dispatch.toRollerPosition} disabled={!canEditDispatch_Final} onChange={(e) => setDispatch({ ...dispatch, toRollerPosition: e.target.value })}>
                                    <option value="">-- Select --</option>
                                    {[...Array(14)].map((_, i) => <option key={i} value={i + 1}>{i + 1}</option>)}
                                </select>
                            </div>
                        </div>

                        {rollerType === 'Roller' && (
                            <div className="section-row">
                                <div className={`field-group ${canEditDispatch_Final ? 'white-field' : 'gray-field'}`}>
                                    <label className="checkbox-label">
                                        <input type="checkbox" checked={dispatch.dispatchedJournalFlag} disabled={!canEditDispatch_Final} onChange={(e) => setDispatch({ ...dispatch, dispatchedJournalFlag: e.target.checked })} />
                                        Have Journal
                                    </label>
                                </div>
                                {dispatch.dispatchedJournalFlag && (
                                    <>
                                        <div className={`field-group ${canEditDispatch_Final ? 'white-field' : 'gray-field'}`}>
                                            <label>Journal Diameter (A)</label>
                                            <input type="number" step="0.001" value={dispatch.dispatchedJournalA} disabled={!canEditDispatch_Final} onChange={(e) => setDispatch({ ...dispatch, dispatchedJournalA: e.target.value })} />
                                        </div>
                                        <div className={`field-group ${canEditDispatch_Final ? 'white-field' : 'gray-field'}`}>
                                            <label>Journal Diameter (B)</label>
                                            <input type="number" step="0.001" value={dispatch.dispatchedJournalB} disabled={!canEditDispatch_Final} onChange={(e) => setDispatch({ ...dispatch, dispatchedJournalB: e.target.value })} />
                                        </div>
                                    </>
                                )}
                            </div>
                        )}

                        {rollerType === 'Sleeve' && (
                            <div className="section-row">
                                <div className={`field-group ${canEditDispatch_Final ? 'white-field' : 'gray-field'}`}>
                                    <label>Dispatched Axle ID</label>
                                    <input type="number" value={dispatch.dispatchedAxleId} disabled={!canEditDispatch_Final} onChange={(e) => setDispatch({ ...dispatch, dispatchedAxleId: e.target.value })} />
                                </div>
                                {dispatch.dispatchedAxleId && (
                                    <div className={`field-group ${canEditDispatch_Final ? 'white-field' : 'gray-field'}`}>
                                        <label className="checkbox-label">
                                            <input type="checkbox" checked={dispatch.dispatchedAxleStraightFlag} disabled={!canEditDispatch_Final} onChange={(e) => setDispatch({ ...dispatch, dispatchedAxleStraightFlag: e.target.checked })} />
                                            Axle Straightened?
                                        </label>
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}

                <div className="action-buttons">
                    <button className="btn btn-back" onClick={() => navigate(-1)}>Back</button>
                    {((isRefRole && !isDispatched) || isWsRole) && (
                        <button className="btn btn-submit" onClick={handleSubmit}>Update Changes</button>
                    )}
                </div>
            </div>

            {showConfirmDialog && (
                <div className="modal-overlay">
                    <div className="modal-dialog">
                        <p>Confirm update for asset <strong>{rollerId}</strong>?</p>
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

export default UpdateAssetDetails;
