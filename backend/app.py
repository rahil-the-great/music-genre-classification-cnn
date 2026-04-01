"""
Flask API — Music Genre Classification
POST /predict  →  accepts .mp3 / .wav, returns predicted genre + probabilities
Fixes applied:
  1. Force sr=22050 to match GTZAN training data
  2. Multi-segment voting (up to 5 segments spread across the song)
  3. Explicit CORS for all origins
  4. Full traceback logging on errors
"""

import io
import os
import tempfile
import traceback

import librosa
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import librosa.display
import numpy as np
from flask import Flask, jsonify, request
from flask_cors import CORS
import tensorflow as tf

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

MODEL_PATH       = "cnn_genre_model.h5"   # your model file
CLASSES_PATH     = "classes.txt"
IMG_SIZE         = (256, 256)                       # must match training
SEGMENT_DURATION = 30                               # seconds per segment
NUM_SEGMENTS     = 5                                # segments to average over
SAMPLE_RATE      = 22050                            # GTZAN standard sample rate

# ── Load model once at startup ────────────────────────────────
model, CLASS_NAMES = None, []

def load_resources():
    global model, CLASS_NAMES
    if not os.path.exists(MODEL_PATH):
        print(f"[ERROR] Model not found at: {os.path.abspath(MODEL_PATH)}")
        return
    if not os.path.exists(CLASSES_PATH):
        print(f"[ERROR] classes.txt not found at: {os.path.abspath(CLASSES_PATH)}")
        return
    model = tf.keras.models.load_model(MODEL_PATH, compile=False)
    with open(CLASSES_PATH) as f:
        CLASS_NAMES = [c.strip() for c in f if c.strip()]
    print(f"[INFO] Model loaded. Classes: {CLASS_NAMES}")
    print(f"[INFO] Model input shape: {model.input_shape}")

load_resources()


def segment_to_mel_array(segment: np.ndarray, sr: int) -> np.ndarray:
    """Convert a 1D audio segment → mel spectrogram → float32 image array."""
    mel    = librosa.feature.melspectrogram(
        y=segment,
        sr=sr,
        n_fft=2048,
        hop_length=512,
        n_mels=128
    )
    mel_db = librosa.power_to_db(mel, ref=np.max)

    fig, ax = plt.subplots(figsize=(3, 3))
    librosa.display.specshow(mel_db, sr=sr, ax=ax)
    ax.axis("off")
    fig.tight_layout(pad=0)

    buf = io.BytesIO()
    fig.savefig(buf, format="png", dpi=100, bbox_inches="tight", pad_inches=0)
    plt.close(fig)
    buf.seek(0)

    img = tf.keras.utils.load_img(buf, target_size=IMG_SIZE)
    return tf.keras.utils.img_to_array(img)   # float32, shape (H, W, 3)


def predict_from_audio_bytes(audio_bytes: bytes, suffix: str):
    """
    Load audio, slice into NUM_SEGMENTS evenly-spaced chunks,
    predict on each, and return averaged probabilities.
    """
    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
        tmp.write(audio_bytes)
        tmp_path = tmp.name

    try:
        y, sr = librosa.load(tmp_path, sr=SAMPLE_RATE, mono=True)
    finally:
        os.unlink(tmp_path)

    print(f"[INFO] Audio loaded — duration: {len(y)/sr:.1f}s, sr: {sr}")

    segment_samples = SEGMENT_DURATION * sr
    total_samples   = len(y)

    max_possible = total_samples // segment_samples
    n_segs       = max(1, min(NUM_SEGMENTS, max_possible))

    all_probs = []

    for i in range(n_segs):
        if n_segs == 1:
            start = max(0, (total_samples - segment_samples) // 2)
        else:
            start = int((i / (n_segs - 1)) * max(0, total_samples - segment_samples))

        segment = y[start : start + segment_samples]

        if len(segment) < segment_samples:
            segment = np.pad(segment, (0, segment_samples - len(segment)))

        img_array = segment_to_mel_array(segment, sr)
        batch     = np.expand_dims(img_array, axis=0)
        probs     = model.predict(batch, verbose=0)[0]
        all_probs.append(probs)
        print(f"[INFO] Segment {i+1}/{n_segs} → {CLASS_NAMES[np.argmax(probs)]} ({np.max(probs)*100:.1f}%)")

    avg_probs = np.mean(all_probs, axis=0)
    return avg_probs, n_segs


# ── Routes ────────────────────────────────────────────────────

@app.route("/health", methods=["GET"])
def health():
    return jsonify({
        "status":       "ok",
        "model_loaded": model is not None,
        "classes":      CLASS_NAMES,
        "input_shape":  str(model.input_shape) if model else None,
    })


@app.route("/predict", methods=["POST", "OPTIONS"])
def predict():
    if request.method == "OPTIONS":
        return jsonify({"status": "ok"}), 200

    if model is None:
        return jsonify({"error": "Model not loaded on server."}), 503

    if "file" not in request.files:
        return jsonify({"error": "No file provided. Send field named 'file'."}), 400

    file     = request.files["file"]
    filename = file.filename.lower()

    if not (filename.endswith(".wav") or filename.endswith(".mp3")):
        return jsonify({"error": "Only .wav and .mp3 files are supported."}), 400

    suffix = ".wav" if filename.endswith(".wav") else ".mp3"

    try:
        audio_bytes = file.read()
        print(f"[INFO] Received: {file.filename} ({len(audio_bytes):,} bytes)")

        avg_probs, n_segs = predict_from_audio_bytes(audio_bytes, suffix)
        idx = int(np.argmax(avg_probs))

        result = {
            "genre":             CLASS_NAMES[idx],
            "confidence":        round(float(avg_probs[idx]) * 100, 2),
            "all_scores":        {c: round(float(p) * 100, 2) for c, p in zip(CLASS_NAMES, avg_probs)},
            "segments_analysed": n_segs,
        }
        print(f"[INFO] Final: {result['genre']} ({result['confidence']}%) over {n_segs} segment(s)")
        return jsonify(result)

    except Exception as exc:
        traceback.print_exc()
        return jsonify({"error": str(exc)}), 500


if __name__ == "__main__":
    app.run(debug=True, port=5001, host="0.0.0.0")