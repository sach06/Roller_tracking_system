import os
import streamlit as st

# Application Constants
APP_TITLE = "Roller Tracking System"
APP_ICON = "🚜"

# Path Configuration
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DATA_DIR = os.path.join(BASE_DIR, "data")
DB_PATH = os.path.join(DATA_DIR, "roller_tracking.db")

# Ensure data directory exists
os.makedirs(DATA_DIR, exist_ok=True)

# User Roles
ROLES = {
    "REF_OP": "Refurbishment Operator",
    "REF_ADMIN": "Refurbishment Admin",
    "WS_OP": "Workshop Operator",
    "WS_ADMIN": "Workshop Admin"
}

# Asset Types
ASSET_TYPES = ["Roller", "Sleeve", "Axle"]

# Statuses
STATUSES = ["Disassembled", "Processing", "Assembled", "Workshop", "Outgoing", "Scrapped"]
