import streamlit as st
import datetime

def show_scrap():
    st.title("🗑️ Scrap Management")
    st.write("Record tracking data for scrapped rollers, sleeves, and axles.")

    db = st.session_state.db
    user = st.session_state.user

    search_id = st.text_input("Enter Asset ID to Scrap")
    
    if search_id:
        asset_info = db.query("SELECT * FROM assets WHERE asset_id = ?", (search_id,))
        
        if asset_info.empty:
            st.warning(f"No asset found with ID {search_id}")
        else:
            asset = asset_info.iloc[0]
            st.warning(f"Preparing to Scrap: {asset['type']} | Serial: {asset['serial_number']}")
            
            with st.form("scrap_form"):
                scrap_date = st.date_input("Scrap Date", datetime.date.today())
                reason = st.selectbox("Scrap Reason", [
                    "End of Life / Wearing",
                    "Major Damage - Non Repairable",
                    "Safety Concern",
                    "Quality Rejection",
                    "Other"
                ])
                
                details = st.text_area("Detailed Reason & Scrapping Certificate Reference")
                approved_by = st.text_input("Approved By", user['full_name'])

                submitted = st.form_submit_button("Confirm Scrapping")
                
                if submitted:
                    try:
                        db.update_asset_status(search_id, "Scrapped", "Scrap Yard / Disposed")
                        
                        s_data = {
                            "scrap_date": str(scrap_date),
                            "reason": reason,
                            "details": details,
                            "approved_by": approved_by
                        }
                        
                        db.log_tracking(search_id, "Scrap", "Scrapped", s_data, user['username'])
                        st.success(f"Asset {search_id} has been marked as Scrapped.")
                    except Exception as e:
                        st.error(f"Error: {e}")

    st.divider()
    st.subheader("Recently Scrapped Assets")
    scrapped = db.query("SELECT * FROM assets WHERE status = 'Scrapped' ORDER BY last_updated DESC LIMIT 10")
    if not scrapped.empty:
        st.dataframe(scrapped, use_container_width=True)
    else:
        st.info("No scrapped assets recorded.")
