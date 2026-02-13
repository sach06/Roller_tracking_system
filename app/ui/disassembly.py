import streamlit as st
import datetime

def show_disassembly():
    st.title("🔧 Insert at Disassembly")
    st.write("Record tracking data after the roller or sleeve is disassembled.")

    db = st.session_state.db
    user = st.session_state.user

    # Selection: Roller or Sleeve
    asset_type = st.radio("Asset Type", ["Roller", "Sleeve"])
    
    with st.form("disassembly_form"):
        col1, col2 = st.columns(2)
        
        with col1:
            asset_id = st.text_input("Asset ID (e.g., R-123, S-456)")
            serial_number = st.text_input("Serial Number")
        
        with col2:
            disassembly_date = st.date_input("Disassembly Date", datetime.date.today())
            condition = st.selectbox("Condition", ["Good", "Repairable", "Critical", "Scrap"])

        # Dynamic fields based on type
        if asset_type == "Roller":
            roller_diameter = st.number_input("Roller Diameter (mm)", min_value=0.0)
            bearing_condition = st.text_area("Bearing Condition")
            additional_notes = st.text_area("Additional Notes (Roller)")
        else:
            sleeve_thickness = st.number_input("Sleeve Thickness (mm)", min_value=0.0)
            surface_quality = st.selectbox("Surface Quality", ["Smooth", "Worn", "Pitted", "Scratched"])
            additional_notes = st.text_area("Additional Notes (Sleeve)")

        submitted = st.form_submit_button("Submit Disassembly Data")
        
        if submitted:
            if not asset_id or not serial_number:
                st.error("Asset ID and Serial Number are required.")
            else:
                # Check if asset exists, if not create it
                existing_asset = db.query("SELECT * FROM assets WHERE asset_id = ?", (asset_id,))
                
                try:
                    if existing_asset.empty:
                        db.add_asset(asset_id, asset_type, serial_number, "Disassembled", "Disassembly Area")
                    else:
                        db.update_asset_status(asset_id, "Disassembled", "Disassembly Area")
                    
                    # Log tracking data
                    tracking_data = {
                        "disassembly_date": str(disassembly_date),
                        "condition": condition,
                        "additional_notes": additional_notes
                    }
                    if asset_type == "Roller":
                        tracking_data["roller_diameter"] = roller_diameter
                        tracking_data["bearing_condition"] = bearing_condition
                    else:
                        tracking_data["sleeve_thickness"] = sleeve_thickness
                        tracking_data["surface_quality"] = surface_quality

                    db.log_tracking(asset_id, "Disassembly", "Insert", tracking_data, user['username'])
                    
                    st.success(f"Disassembly data for {asset_type} {asset_id} recorded successfully!")
                except Exception as e:
                    st.error(f"Error saving data: {e}")

    st.divider()
    st.subheader("Recent Disassembly Activity")
    recent = db.query("SELECT * FROM tracking_data WHERE stage = 'Disassembly' ORDER BY timestamp DESC LIMIT 5")
    if not recent.empty:
        st.dataframe(recent, use_container_width=True)
