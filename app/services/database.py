import duckdb
import pandas as pd
import os
from app.core.config import DB_PATH

class DatabaseService:
    def __init__(self):
        self.db_path = DB_PATH
        self._init_db()

    def _get_connection(self):
        return duckdb.connect(self.db_path)

    def _init_db(self):
        with self._get_connection() as conn:
            # Users Table
            conn.execute("""
                CREATE TABLE IF NOT EXISTS users (
                    username VARCHAR PRIMARY KEY,
                    password VARCHAR,
                    role VARCHAR,
                    full_name VARCHAR
                )
            """)
            
            # Assets Table
            conn.execute("""
                CREATE TABLE IF NOT EXISTS assets (
                    asset_id VARCHAR PRIMARY KEY,
                    type VARCHAR,
                    serial_number VARCHAR,
                    status VARCHAR,
                    current_location VARCHAR,
                    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            
            # Detailed Tracking Table
            conn.execute("""
                CREATE TABLE IF NOT EXISTS tracking_data (
                    id INTEGER PRIMARY KEY DEFAULT nextval('tracking_seq'),
                    asset_id VARCHAR,
                    stage VARCHAR,
                    action_type VARCHAR,
                    data JSON,
                    user_id VARCHAR,
                    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            
            # Sequence for tracking_data
            try:
                conn.execute("CREATE SEQUENCE tracking_seq")
            except:
                pass

            # Seed initial users if empty
            user_count = conn.execute("SELECT COUNT(*) FROM users").fetchone()[0]
            if user_count == 0:
                conn.execute("INSERT INTO users VALUES ('admin', 'admin123', 'REF_ADMIN', 'System Admin')")
                conn.execute("INSERT INTO users VALUES ('ref_op', 'pass123', 'REF_OP', 'Refurbishment Op')")
                conn.execute("INSERT INTO users VALUES ('ws_op', 'pass123', 'WS_OP', 'Workshop Op')")

    def query(self, sql, params=None):
        with self._get_connection() as conn:
            if params:
                return conn.execute(sql, params).df()
            return conn.execute(sql).df()

    def execute(self, sql, params=None):
        with self._get_connection() as conn:
            if params:
                conn.execute(sql, params)
            else:
                conn.execute(sql)

    def get_user(self, username):
        df = self.query("SELECT * FROM users WHERE username = ?", (username,))
        return df.to_dict('records')[0] if not df.empty else None

    def add_asset(self, asset_id, asset_type, serial_number, status, location):
        sql = "INSERT INTO assets (asset_id, type, serial_number, status, current_location) VALUES (?, ?, ?, ?, ?)"
        self.execute(sql, (asset_id, asset_type, serial_number, status, location))

    def update_asset_status(self, asset_id, status, location):
        sql = "UPDATE assets SET status = ?, current_location = ?, last_updated = CURRENT_TIMESTAMP WHERE asset_id = ?"
        self.execute(sql, (status, location, asset_id))

    def log_tracking(self, asset_id, stage, action_type, data_dict, user_id):
        import json
        sql = "INSERT INTO tracking_data (asset_id, stage, action_type, data, user_id) VALUES (?, ?, ?, ?, ?)"
        self.execute(sql, (asset_id, stage, action_type, json.dumps(data_dict), user_id))
