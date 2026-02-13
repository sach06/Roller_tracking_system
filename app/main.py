import streamlit as st
import pandas as pd
from app.core.config import APP_TITLE, APP_ICON, ROLES
from app.services.database import DatabaseService

# Page Configuration
st.set_page_config(
    page_title=APP_TITLE,
    page_icon=APP_ICON,
    layout="wide",
    initial_sidebar_state="expanded"
)

# Initialize Database
if 'db' not in st.session_state:
    st.session_state.db = DatabaseService()

# Session State for Auth
if 'authenticated' not in st.session_state:
    st.session_state.authenticated = False
if 'user' not in st.session_state:
    st.session_state.user = None

def login_page():
    st.markdown(f"<h1 style='text-align: center;'>{APP_TITLE}</h1>", unsafe_allow_html=True)
    
    col1, col2, col3 = st.columns([1, 2, 1])
    with col2:
        with st.form("login_form"):
            st.subheader("Login")
            username = st.text_input("Username")
            password = st.text_input("Password", type="password")
            submitted = st.form_submit_button("Log In", use_container_width=True)
            
            if submitted:
                user = st.session_state.db.get_user(username)
                if user and user['password'] == password:
                    st.session_state.authenticated = True
                    st.session_state.user = user
                    st.rerun()
                else:
                    st.error("Invalid username or password")

def main_app():
    user = st.session_state.user
    role = user['role']
    
    # Sidebar Navigation
    st.sidebar.title(f"Welcome, {user['full_name']}")
    st.sidebar.info(f"Role: {ROLES.get(role, role)}")
    
    if st.sidebar.button("Logout"):
        st.session_state.authenticated = False
        st.session_state.user = None
        st.rerun()

    st.sidebar.divider()
    
    # Define navigation based on role
    pages = ["🏠 Dashboard"]
    
    if role in ['REF_OP', 'REF_ADMIN']:
        pages.extend(["🔧 Disassembly", "⚙️ Processing", "🗑️ Scrap Management"])
    
    if role in ['WS_OP', 'WS_ADMIN']:
        pages.extend(["🏢 Workshop"])
    
    if role == 'REF_ADMIN' or role == 'WS_ADMIN':
        pages.append("📊 Reports")

    selection = st.sidebar.radio("Navigation", pages)

    # Route to pages
    if selection == "🏠 Dashboard":
        show_dashboard()
    elif selection == "🔧 Disassembly":
        from app.ui.disassembly import show_disassembly
        show_disassembly()
    elif selection == "⚙️ Processing":
        from app.ui.processing import show_processing
        show_processing()
    elif selection == "🗑️ Scrap Management":
        from app.ui.scrap import show_scrap
        show_scrap()
    elif selection == "🏢 Workshop":
        from app.ui.workshop import show_workshop
        show_workshop()
    elif selection == "📊 Reports":
        st.title("Reports & Analytics")
        st.write("Report generation coming soon...")

def show_dashboard():
    st.title("Asset Tracking Dashboard")
    
    # KPIs
    assets = st.session_state.db.query("SELECT * FROM assets")
    
    col1, col2, col3, col4 = st.columns(4)
    col1.metric("Total Assets", len(assets))
    col2.metric("In Disassembly", len(assets[assets['status'] == 'Disassembled']))
    col3.metric("In Workshop", len(assets[assets['status'] == 'Workshop']))
    col4.metric("Scrapped", len(assets[assets['status'] == 'Scrapped']))
    
    st.divider()
    
    st.subheader("Recent Asset Status")
    if not assets.empty:
        st.dataframe(assets, use_container_width=True)
    else:
        st.info("No assets tracked yet.")

# App Logic
if not st.session_state.authenticated:
    login_page()
else:
    main_app()
