import streamlit as st
import datetime

def show_workshop():
    st.title("🏢 Workshop Operations")
    st.write("Manage asset data in the workshop and track delivery to customers.")

    db = st.session_state.db
    user = st.session_state.user

    # Filter for assets in Workshop status or ready for it
    st.subheader("Asset Delivery & Outgoing Check")
    
    # Simple search
    search_id = st.text_input("Enter Asset ID for Workshop Tracking")
    
    if search_id:
        asset_info = db.query("SELECT * FROM assets WHERE asset_id = ?", (search_id,))
        
        if asset_info.empty:
            st.warning(f"No asset found with ID {search_id}")
        else:
            asset = asset_info.iloc[0]
            st.info(f"Asset: {asset['type']} | Serial: {asset['serial_number']} | Current Status: {asset['status']}")
            
            with st.form("workshop_form"):
                col1, col2 = st.columns(2)
                with col1:
                    arrival_date = st.date_input("Arrival in Workshop", datetime.date.today())
                    delivery_date = st.date_input("Delivery Date to Customer", datetime.date.today() + datetime.timedelta(days=7))
                
                with col2:
                    customer_name = st.text_input("Customer Name")
                    project_number = st.text_input("Project Number")

                st.divider()
                st.write("Inspection Checklist")
                visual_check = st.checkbox("Final Visual Inspection Passed")
                test_run = st.checkbox("Test Run Completed (if applicable)")
                packaging_check = st.checkbox("Properly Packaged for Delivery")

                additional_details = st.text_area("Workshop Notes / Special Instructions")

                submitted = st.form_submit_button("Record Workshop & Delivery Data")
                
                if submitted:
                    if not customer_name:
                        st.error("Customer Name is required for delivery.")
                    else:
                        try:
                            db.update_asset_status(search_id, "Outgoing", f"Delivered to {customer_name}")
                            
                            w_data = {
                                "arrival_date": str(arrival_date),
                                "delivery_date": str(delivery_date),
                                "customer_name": customer_name,
                                "project_number": project_number,
                                "visual_check": visual_check,
                                "test_run": test_run,
                                "packaging_check": packaging_check,
                                "notes": additional_details
                            }
                            
                            db.log_tracking(search_id, "Workshop", "Delivery", w_data, user['username'])
                            st.success(f"Asset {search_id} marked as Outgoing to {customer_name}!")
                        except Exception as e:
                            st.error(f"Error: {e}")

    st.divider()
    st.subheader("Assets Currently in Workshop Stage")
    workshop_assets = db.query("SELECT * FROM assets WHERE status IN ('Workshop', 'Assembled', 'Ready for Workshop')")
    if not workshop_assets.empty:
        st.dataframe(workshop_assets, use_container_width=True)
    else:
        st.info("No assets currently awaiting workshop processing.")
