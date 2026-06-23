# Full Fever Triage System

This project contains a Python FastAPI backend for AI-based fever triage and a React (Vite) frontend.

## Prerequisites
- Node.js & npm (for frontend)
- Python 3.8+ (for backend)
- MongoDB (optional, if you want to store triage reports)

## Environment Setup
Create a `.env` file in the root directory (you can copy `.env.example`):
```bash
cp .env.example .env
```
Ensure you have added your API keys to the `.env` file.

## Running the Backend
1. Activate the virtual environment:
   - Windows: `.\venv\Scripts\activate`
   - Mac/Linux: `source venv/bin/activate`
2. Install dependencies (if not already installed):
   ```bash
   pip install -r requirements.txt
   ```
3. Start the FastAPI server:
   ```bash
   uvicorn nidan_api:app --reload --port 8000
   ```
The backend API will be available at http://localhost:8000. You can view the API documentation at http://localhost:8000/docs.

## Running the Frontend
1. Navigate to the `frontend` folder:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
The frontend will be available at http://localhost:5173 (or the port specified by Vite).
