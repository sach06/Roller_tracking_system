import streamlit as st
import datetime

def show_processing():
    st.title("⚙️ Roller/Sleeve Processing")
    st.write("Track asset data after refurbishment, assembly, or processing.")

    db = st.session_state.db
    user = st.session_state.user

    mode = st.radio("Processing Mode", ["Insert New Asset", "Update Existing Asset"], horizontal=True)

    if mode == "Insert New Asset":
        show_insert_new(db, user)
    else:
        show_update_existing(db, user)

def show_insert_new(db, user):
    st.subheader("Add New Asset to System")
    with st.form("new_asset_form"):
        asset_type = st.selectbox("Type", ["Roller", "Sleeve", "Axle"])
        asset_id = st.text_input("New Asset ID")
        serial_number = st.text_input("Serial Number")
        
        col1, col2 = st.columns(2)
        with col1:
            manufacturer = st.text_input("Manufacturer")
            manufacturing_date = st.date_input("Manufacturing Date")
        with col2:
            initial_condition = st.selectbox("Initial Condition", ["New", "Used", "Refurbished"])
            initial_location = st.text_input("Incoming Location", "Refurbishment Unit")

        submitted = st.form_submit_button("Initialize Asset")
        
        if submitted:
            if not asset_id or not serial_number:
                st.error("Asset ID and Serial Number are required.")
            else:
                try:
                    db.add_asset(asset_id, asset_type, serial_number, "Processing", initial_location)
                    db.log_tracking(asset_id, "Processing", "New Asset Initialization", {
                        "manufacturer": manufacturer,
                        "manufacturing_date": str(manufacturing_date),
                        "initial_condition": initial_condition
                    }, user['username'])
                    st.success(f"Asset {asset_id} initialized and set to 'Processing'.")
                except Exception as e:
                    st.error(f"Error: {e}")

def show_update_existing(db, user):
    st.subheader("Update Processed Asset")
    
    # Search for asset
    search_id = st.text_input("Enter Asset ID to Update")
    
    if search_id:
        asset_info = db.query("SELECT * FROM assets WHERE asset_id = ?", (search_id,))
        
        if asset_info.empty:
            st.warning(f"No asset found with ID {search_id}")
        else:
            asset = asset_info.iloc[0]
            st.info(f"Asset: {asset['type']} | Serial: {asset['serial_number']} | Current Status: {asset['status']}")
            
            with st.form("update_processing_form"):
                col1, col2 = st.columns(2)
                with col1:
                    processing_completion_date = st.date_input("Processing Completion Date", datetime.date.today())
                    processed_by = st.text_input("Processed By", user['full_name'])
                
                with col2:
                    new_status = st.selectbox("New Status", ["Assembled", "Ready for Workshop", "Outgoing"])
                    next_location = st.text_input("Next Location", "Workshop")

                # Type specific fields
                if asset['type'] == "Roller":
                    hardness = st.number_input("Hardness (HRC)", min_value=0.0)
                    dimensions_check = st.checkbox("Dimensions Checked and Within Tolerance")
                elif asset['type'] == "Sleeve":
                    surface_finish = st.text_input("Surface Finish (Ra)")
                    coating_type = st.text_input("Coating Type")

                comments = st.text_area("Processing Comments")
                
                submitted = st.form_submit_button("Save Processing Data")
                
                if submitted:
                    try:
                        db.update_asset_status(search_id, new_status, next_location)
                        
                        p_data = {
                            "completion_date": str(processing_completion_date),
                            "processed_by": processed_by,
                            "comments": comments
                        }
                        if asset['type'] == "Roller":
                            p_data["hardness"] = hardness
                            p_data["dimensions_check"] = dimensions_check
                        elif asset['type'] == "Sleeve":
                            p_data["surface_finish"] = surface_finish
                            p_data["coating_type"] = coating_type

                        db.log_tracking(search_id, "Processing", "Update Existing", p_data, user['username'])
                        st.success(f"Asset {search_id} updated successfully!")
                    except Exception as e:
                        st.error(f"Error: {e}")
