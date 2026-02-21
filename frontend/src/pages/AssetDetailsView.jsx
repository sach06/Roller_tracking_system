import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import './ProcessingDetails.css';

const AssetDetailsView = () => {
    const navigate = useNavigate();
    const { rollerId, lifecycleId } = useParams();

    const [lifecycleData, setLifecycleData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchLifecycleData();
    }, [rollerId, lifecycleId]);

    const fetchLifecycleData = async () => {
        try {
            const response = await axios.get(`/api/processing/lifecycle/${rollerId}/${lifecycleId}`);
            if (response.data.success) {
                setLifecycleData(response.data.lifecycle);
            }
            setLoading(false);
        } catch (err) {
            console.error('Error fetching lifecycle data:', err);
            alert('Error loading data');
            setLoading(false);
        }
    };

    if (loading) return <div className="processing-details">Loading...</div>;
    if (!lifecycleData) return <div className="processing-details">No data found</div>;

    const rollerType = lifecycleData.roller_type || 'Roller';

    return (
        <div className="processing-details">
            <h2 className="page-title">Asset Details — {rollerId}</h2>

            <div className="form-container">
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

                {/* Status Section */}
                <div className="section-header">Current Status</div>
                <div className="readonly-section">
                    <div className="section-row">
                        <div className="field-group">
                            <label>Process Stage</label>
                            <div className="readonly-value" style={{ fontWeight: 'bold', color: '#005CA9' }}>
                                {lifecycleData.process_stage || 'N/A'}
                            </div>
                        </div>
                        <div className="field-group">
                            <label>Last Updated</label>
                            <div className="readonly-value">
                                {lifecycleData.updated_at ? new Date(lifecycleData.updated_at).toLocaleString() : (lifecycleData.created_at ? new Date(lifecycleData.created_at).toLocaleString() : 'N/A')}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Incoming Details */}
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
                        {rollerType === 'Sleeve' && (
                            <div className="field-group"><label>Axle ID</label><div className="readonly-value">{lifecycleData.received_axle_id || 'N/A'}</div></div>
                        )}
                        <div className="field-group"><label>Incoming Roller Position</label><div className="readonly-value">{lifecycleData.from_roller_position || 'N/A'}</div></div>
                        <div className="field-group"><label>Segment Tonnage</label><div className="readonly-value">{lifecycleData.tonnage || 'N/A'}</div></div>
                    </div>
                    <div className="section-row">
                        <div className="field-group"><label>Breakout (Y/N)</label><div className="readonly-value">{lifecycleData.breakout_flag ? 'Yes' : 'No'}</div></div>
                        <div className="field-group"><label>Incoming Diameter(A)</label><div className="readonly-value">{lifecycleData.received_diameter_a || 'N/A'}</div></div>
                        <div className="field-group"><label>Incoming Diameter(B)</label><div className="readonly-value">{lifecycleData.received_diameter_b || 'N/A'}</div></div>
                    </div>
                    {rollerType === 'Roller' && (
                        <div className="section-row">
                            <div className="field-group"><label>Have Journal(Y/N)</label><div className="readonly-value">{lifecycleData.received_journal_flag ? 'Yes' : 'No'}</div></div>
                            {lifecycleData.received_journal_flag && (
                                <>
                                    <div className="field-group"><label>Journal Diameter (A)</label><div className="readonly-value">{lifecycleData.received_journal_a || 'N/A'}</div></div>
                                    <div className="field-group"><label>Journal Diameter (B)</label><div className="readonly-value">{lifecycleData.received_journal_b || 'N/A'}</div></div>
                                </>
                            )}
                        </div>
                    )}
                </div>

                {/* Process Details */}
                {(lifecycleData.process_stage === 'PROCESSED' || lifecycleData.process_stage === 'DISPATCHED' || lifecycleData.process_stage === 'SCRAPPED') && (
                    <>
                        <div className="section-header">Process details</div>
                        <div className="readonly-section">
                            <div className="section-row">
                                <div className="field-group"><label>Skinpass cut</label><div className="readonly-value">{lifecycleData.is_skin_cut ? 'Yes' : 'No'}</div></div>
                                <div className="field-group"><label>Scrap</label><div className="readonly-value">{lifecycleData.roller_scrap_flag ? 'Yes' : 'No'}</div></div>
                                <div className="field-group"><label>Cladding</label><div className="readonly-value">{lifecycleData.is_cladded ? 'Yes' : 'No'}</div></div>
                                {lifecycleData.is_cladded && (
                                    <div className="field-group"><label>Cladding Wire</label><div className="readonly-value">{lifecycleData.cladding_wire_name || 'N/A'}</div></div>
                                )}
                            </div>
                            {rollerType === 'Roller' && (
                                <div className="section-row">
                                    <div className="field-group"><label>Drive Rotary Joint Change</label><div className="readonly-value">{lifecycleData.drive_rotary_joint_change_flag ? 'Yes' : 'No'}</div></div>
                                    <div className="field-group"><label>Idle Rotary Joint (Op)</label><div className="readonly-value">{lifecycleData.idle_rotary_joint_change_o_flag ? 'Yes' : 'No'}</div></div>
                                    <div className="field-group"><label>Idle Rotary Joint (Drive)</label><div className="readonly-value">{lifecycleData.idle_rotary_joint_change_d_flag ? 'Yes' : 'No'}</div></div>
                                </div>
                            )}
                            {lifecycleData.roller_scrap_flag && (
                                <div className="section-row">
                                    <div className="field-group"><label>Scrap Reason</label><div className="readonly-value">{lifecycleData.roller_scrap_reason || 'N/A'}</div></div>
                                </div>
                            )}
                        </div>
                    </>
                )}

                {/* Outgoing Details */}
                {(lifecycleData.process_stage === 'PROCESSED' || lifecycleData.process_stage === 'DISPATCHED') && (
                    <>
                        <div className="section-header">Outgoing details</div>
                        <div className="readonly-section">
                            <div className="section-row">
                                <div className="field-group"><label>Diameter(A)</label><div className="readonly-value">{lifecycleData.dispatched_diameter_a || 'N/A'}</div></div>
                                <div className="field-group"><label>Diameter(B)</label><div className="readonly-value">{lifecycleData.dispatched_diameter_b || 'N/A'}</div></div>
                                <div className="field-group"><label>Configuration</label><div className="readonly-value">{lifecycleData.dispatched_config || 'N/A'}</div></div>
                            </div>
                            {rollerType === 'Roller' && (
                                <div className="section-row">
                                    <div className="field-group"><label>Have Journal(Y/N)</label><div className="readonly-value">{lifecycleData.dispatched_journal_flag ? 'Yes' : 'No'}</div></div>
                                    {lifecycleData.dispatched_journal_flag && (
                                        <>
                                            <div className="field-group"><label>Journal Diameter(A)</label><div className="readonly-value">{lifecycleData.dispatched_journal_a || 'N/A'}</div></div>
                                            <div className="field-group"><label>Journal Diameter(B)</label><div className="readonly-value">{lifecycleData.dispatched_journal_b || 'N/A'}</div></div>
                                        </>
                                    )}
                                </div>
                            )}
                            <div className="section-row">
                                <div className="field-group"><label>Diameter(A) reduction (mm)</label><div className="readonly-value">{lifecycleData.diff_diameter_a || 'N/A'}</div></div>
                                <div className="field-group"><label>Diameter(B) reduction (mm)</label><div className="readonly-value">{lifecycleData.diff_diameter_b || 'N/A'}</div></div>
                            </div>
                        </div>
                    </>
                )}

                {/* Dispatch Destination */}
                {(lifecycleData.process_stage === 'DISPATCHED' || lifecycleData.to_caster_id) && (
                    <>
                        <div className="section-header">Dispatch destination</div>
                        <div className="readonly-section">
                            <div className="section-row">
                                <div className="field-group">
                                    <label>To Caster ID</label>
                                    <div className="readonly-value">{lifecycleData.to_caster_name || 'N/A'}</div>
                                </div>
                                <div className="field-group">
                                    <label>To Strand ID</label>
                                    <div className="readonly-value">{lifecycleData.to_strand_no || 'N/A'}</div>
                                </div>
                            </div>
                            <div className="section-row">
                                <div className="field-group">
                                    <label>To Segment Position</label>
                                    <div className="readonly-value">{lifecycleData.to_position_no || 'N/A'}</div>
                                </div>
                                <div className="field-group">
                                    <label>To Segment ID</label>
                                    <div className="readonly-value">{lifecycleData.to_segment_no || 'N/A'}</div>
                                </div>
                                <div className="field-group">
                                    <label>To Configuration</label>
                                    <div className="readonly-value">{lifecycleData.dispatched_config || 'N/A'}</div>
                                </div>
                            </div>
                            <div className="section-row">
                                <div className="field-group">
                                    <label>Outgoing Roller Position (1-14)</label>
                                    <div className="readonly-value">{lifecycleData.to_roller_position || 'N/A'}</div>
                                </div>
                            </div>
                        </div>
                    </>
                )}

                <div className="action-buttons">
                    <button className="btn btn-back" onClick={() => navigate(-1)}>
                        Back to List
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AssetDetailsView;
