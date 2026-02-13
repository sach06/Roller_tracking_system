# Roller Tracking System

## Overview
The Roller Tracking System is a web application designed to support roller, sleeve, and axle tracking across disassembly, processing, workshop, and outgoing stages. It replaces manual and Excel-based tracking systems, providing a unified and efficient way to manage asset movement and status.

## Features
- **Disassembly Tracking**: Record details of rollers and sleeves after disassembly.
- **Processing Management**: Track assets through refurbishment and assembly.
- **Workshop Operations**: Manage workshop data and delivery to customers.
- **Scrap Management**: Efficiently log scrapped rollers, sleeves, and axles.
- **Role-Based Access**: Specialized views for Refurbishment and Workshop operators/administrators.

## Tech Stack
- **Frontend**: Streamlit
- **Backend/Storage**: DuckDB + Pandas
- **Language**: Python

## Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/sach06/Roller_tracking_system.git
   cd Roller_tracking_system
   ```
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Run the application:
   ```bash
   streamlit run app/main.py
   ```

## Project Structure
- `app/`: Main application code
  - `ui/`: Streamlit pages and UI components
  - `services/`: Business logic and data management
  - `core/`: Configuration and shared utilities
- `data/`: Local storage for DuckDB and exports
- `docs/`: Design specifications and documentation
- `scripts/`: Helper scripts
