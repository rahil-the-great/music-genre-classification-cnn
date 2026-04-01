# SoundLabel — Music Genre Classifier

A full-stack web app: React.js frontend + Flask API backend for CNN-based music genre classification using the GTZAN dataset.

---

## Folder Structure

```
genre-classifier/
├── backend/
│   ├── app.py                  ← Flask REST API
│   ├── requirements.txt        ← Python dependencies
│   ├── cnn_genre_model.keras   ← your trained model (place here)
│   └── classes.txt             ← genre labels (place here)
│
└── frontend/
    ├── index.html
    ├── package.json
    ├── vite.config.js
    └── src/
        ├── main.jsx
        ├── App.jsx
        ├── index.css
        ├── context/
        │   └── ThemeContext.jsx
        ├── components/
        │   ├── Navbar.jsx
        │   └── Navbar.module.css
        └── pages/
            ├── Landing.jsx
            ├── Landing.module.css
            ├── Predict.jsx
            └── Predict.module.css
```

---

## Step-by-Step Setup

### Step 1 — Place your model files

Copy your trained files into `backend/`:

```
backend/cnn_genre_model.keras   ← rename from .h5 if needed (see note below)
backend/classes.txt             ← one genre label per line, e.g.:
                                     blues
                                     classical
                                     country
                                     ...
```

> **Note on .h5 vs .keras:**  
> If your file is `cnn_genre_classification.h5`, you can either:
> - Rename it to `cnn_genre_model.keras` and update `MODEL_PATH` in `app.py`, **or**
> - Open `backend/app.py` and change `MODEL_PATH = "cnn_genre_model.keras"` to `MODEL_PATH = "cnn_genre_classification.h5"`

---

### Step 2 — Backend (Flask)

```bash
cd backend

# Create and activate a virtual environment (recommended)
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start the Flask server
python app.py
```

Flask will start on **http://localhost:5000**. You should see:
```
[INFO] Model loaded. Classes: ['blues', 'classical', ...]
 * Running on http://127.0.0.1:5000
```

---

### Step 3 — Frontend (React + Vite)

Open a **new terminal** (keep Flask running):

```bash
cd frontend

# Install Node dependencies
npm install

# Start the dev server
npm run dev
```

The app will be available at **http://localhost:5173**

---

### Step 4 — Use the app

1. Open http://localhost:5173
2. **Landing page** — read about the GTZAN dataset, methodology, and model comparison results
3. Click **Classify** in the navbar (or the "Try the classifier" button)
4. **Predict page** — drag & drop or browse for a `.mp3` or `.wav` file
5. The app sends the file to Flask → Flask generates a mel spectrogram → CNN predicts → result displayed with confidence scores

---

## API Reference

### `GET /health`
Check if the model is loaded.
```json
{ "status": "ok", "model_loaded": true, "classes": ["blues", "classical", ...] }
```

### `POST /predict`
Upload an audio file for genre prediction.

**Request:** `multipart/form-data` with field `file` (.mp3 or .wav)

**Response:**
```json
{
  "genre": "jazz",
  "confidence": 84.32,
  "all_scores": {
    "blues": 2.1,
    "classical": 0.5,
    "jazz": 84.32,
    ...
  }
}
```

---

## Features

- **Dark / Light mode** — toggle in the top-right corner; preference saved to localStorage
- **Smooth animations** — scroll-triggered reveals on the landing page via Framer Motion
- **Drag & drop upload** — with visual feedback and file type validation
- **Animated waveform** — shown while the model is processing
- **Confidence chart** — all genre scores displayed as animated horizontal bars
- **Responsive** — works on mobile and desktop

---

## Production Build

```bash
# Build optimised frontend
cd frontend
npm run build
# Output in frontend/dist/ — serve with any static host

# Flask for production — use gunicorn
cd backend
pip install gunicorn
gunicorn -w 2 -b 0.0.0.0:5000 app:app
```
