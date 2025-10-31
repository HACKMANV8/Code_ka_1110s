"""
FastAPI Endpoint for AI Focus Monitoring System
Real-time video analysis for focus detection, gaze tracking, and cheating detection
"""

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.responses import StreamingResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import cv2
import numpy as np
import base64
import binascii
import json
import time
import logging
from typing import Dict, List
import asyncio
from starlette.websockets import WebSocketState

# Initialize FastAPI app
app = FastAPI(
    title="AI Focus Monitoring API",
    description="Real-time focus and attention monitoring with cheating detection",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class FocusMonitor:
    """Simplified focus monitoring without external model dependencies"""
    
    def __init__(self):
        self.face_cascade = cv2.CascadeClassifier(
            cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
        )
        self.eye_cascade = cv2.CascadeClassifier(
            cv2.data.haarcascades + 'haarcascade_eye.xml'
        )
        self.profile_cascade = cv2.CascadeClassifier(
            cv2.data.haarcascades + 'haarcascade_profileface.xml'
        )
        
        self.focus_score = 100.0
        self.current_state = "focused"
        self.away_timer = 0.0
        self.away_start_time = None
        self.last_status_text = ""
        
        logger.info("FocusMonitor initialized successfully")

    def _detect_handheld_devices(self, gray_frame: np.ndarray) -> bool:
        """Detect handheld electronic devices (phones/tablets) even when tilted."""
        lower_start = gray_frame.shape[0] // 2
        lower_gray = gray_frame[lower_start:, :]

        blurred = cv2.GaussianBlur(lower_gray, (7, 7), 0)
        edges = cv2.Canny(blurred, 40, 120)
        kernel = np.ones((3, 3), np.uint8)
        edges = cv2.dilate(edges, kernel, iterations=1)
        edges = cv2.morphologyEx(edges, cv2.MORPH_CLOSE, kernel, iterations=2)

        contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

        for contour in contours:
            area = cv2.contourArea(contour)
            if area < 900:
                continue

            rect = cv2.minAreaRect(contour)
            (_, _), (w, h), _ = rect

            if w < 28 or h < 28:
                continue

            long_side = max(w, h)
            short_side = min(w, h)
            if short_side == 0:
                continue

            aspect_ratio = long_side / short_side
            if aspect_ratio > 5.0:
                continue

            rect_area = w * h
            if rect_area <= 0:
                continue

            solidity = area / rect_area
            if solidity < 0.55:
                continue

            return True

        return False
    
    def analyze_frame(self, frame: np.ndarray) -> Dict:
        """Analyze a single frame and return focus metrics - EXACT LOGIC FROM WORKING main.py"""
        
        if frame is None or frame.size == 0:
            return self._error_response("Invalid frame")
        
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        device_detected = self._detect_handheld_devices(gray)
        
        # Detect faces (EXACT parameters from main.py)
        faces = self.face_cascade.detectMultiScale(
            gray, scaleFactor=1.1, minNeighbors=5, minSize=(80, 80)
        )
        
        # Detect profiles (right)
        profile_faces_right = self.profile_cascade.detectMultiScale(
            gray, scaleFactor=1.1, minNeighbors=5, minSize=(80, 80)
        )
        
        # Detect profiles (left) - flip image
        gray_flipped = cv2.flip(gray, 1)
        profile_faces_left = self.profile_cascade.detectMultiScale(
            gray_flipped, scaleFactor=1.1, minNeighbors=5, minSize=(80, 80)
        )
        
        # Adjust left profile coordinates
        profile_faces_left_adjusted = []
        for (x, y, w, h) in profile_faces_left:
            x_adjusted = frame.shape[1] - x - w
            profile_faces_left_adjusted.append((x_adjusted, y, w, h))
        
        # Calculate focus score
        frame_score = 0.0
        status_text = "Unknown"
        new_state = "unknown"
        alerts = []
        
        if len(faces) > 0:
            # Frontal face detected - EXACT LOGIC FROM main.py
            face = faces[0]
            x, y, w, h = face
            frame_score = 60.0  # Base score - face visible and frontal
            
            roi_gray = gray[y:y+h, x:x+w]
            
            # Initialize eyes variable to prevent UnboundLocalError
            eyes = []
            
            # Check if face is too high FIRST (BEFORE any scoring)
            frame_center_y = frame.shape[0] // 2
            frame_top_15_percent = frame.shape[0] * 0.15
            face_center_y = y + h//2
            
            # PRIORITY 1: Face in top 15% of frame = LOOKING WAY ABOVE CAMERA
            if y < frame_top_15_percent:
                frame_score = 10.0  # Extremely low - OVERRIDES everything
                status_text = "<!> LOOKING ABOVE CAMERA - COPYING?"
                new_state = "away"
                alerts.append("above_camera_copying")
            
            # PRIORITY 2: Face significantly above center (looking up moderately)
            elif face_center_y < frame_center_y - 80:
                frame_score = 25.0  # Low score - OVERRIDES base
                status_text = "<!> HEAD TILTED UP (SUSPICIOUS)"
                new_state = "away"
                alerts.append("head_tilted_up")
            
            # NORMAL PROCESSING: Only if NOT looking above
            else:
                # Detect eyes (EXACT parameters from main.py)
                eyes = self.eye_cascade.detectMultiScale(
                    roi_gray,
                    scaleFactor=1.05,  # More sensitive
                    minNeighbors=3,    # Lower threshold
                    minSize=(10, 10)   # Smaller minimum size
                )
                
                # Score based on eye detection (EXACT scoring from main.py)
                if len(eyes) >= 2:
                    frame_score += 30.0  # Both eyes visible = +30
                    status_text = "Both Eyes Visible"
                    
                    # Eye position analysis (EXACT from main.py)
                    avg_eye_y = sum([ey + eh//2 for (ex, ey, ew, eh) in eyes[:2]]) / min(2, len(eyes))
                    
                    # LOOKING UP detection (eyes in upper 25% of face)
                    if avg_eye_y < h * 0.25:
                        frame_score = 15.0  # Very low - looking up (COPYING?)
                        status_text = "<!> LOOKING UP - COPYING?"
                        new_state = "away"
                        alerts.append("looking_up_copying")
                    
                    # Good eye position (25-55% of face height)
                    elif avg_eye_y < h * 0.55:
                        frame_score += 15.0  # Good eye position = +15
                        status_text = ">> FOCUSED ON SCREEN"
                        new_state = "focused"
                    
                    # LOOKING DOWN (eyes in lower 45% of face)
                    else:
                        status_text = "Looking Down"
                        frame_score -= 15.0  # Penalty for looking down
                        new_state = "looking_down"
                        alerts.append("looking_down")
                        
                elif len(eyes) == 1:
                    frame_score += 15.0  # One eye = probably side angle
                    status_text = "Side Angle - One Eye"
                    new_state = "focused"
                else:
                    # No eyes detected
                    frame_score += 10.0  # Small bonus for frontal face
                    status_text = "Eyes Not Detected"
                    new_state = "unknown"
                
                # DIAGONAL DETECTION (EXACT from main.py)
                face_center_x = x + w//2
                frame_center_x = frame.shape[1] // 2
                
                x_offset = abs(face_center_x - frame_center_x)
                y_offset = abs(face_center_y - frame_center_y)
                
                corner_threshold_x = frame.shape[1] * 0.3
                corner_threshold_y = frame.shape[0] * 0.3
                
                if x_offset > corner_threshold_x and y_offset > corner_threshold_y:
                    frame_score = min(frame_score, 20.0)  # Cap at 20%
                    status_text = "<!> LOOKING DIAGONAL (AWAY)"
                    new_state = "away"
                    alerts.append("diagonal_viewing")
                
                # Face size bonus (EXACT from main.py)
                face_area = w * h
                frame_area = frame.shape[0] * frame.shape[1]
                face_ratio = face_area / frame_area
                
                if face_ratio > 0.02:
                    size_bonus = min(15.0, face_ratio * 300)
                    frame_score += size_bonus
                elif face_ratio < 0.01:
                    frame_score -= 15.0
                    if "LOOKING" not in status_text:
                        status_text += " (Too Far)"
            
        elif len(profile_faces_right) > 0 or len(profile_faces_left_adjusted) > 0:
            # Profile detected - away from screen (EXACT from main.py)
            frame_score = 10.0  # Very low score
            new_state = "away"
            
            if len(profile_faces_right) > 0:
                status_text = "<!> LOOKING RIGHT (AWAY)"
                alerts.append("looking_right")
            else:
                status_text = "<!> LOOKING LEFT (AWAY)"
                alerts.append("looking_left")
        
        else:
            # No face detected (EXACT from main.py)
            frame_score = 0.0
            status_text = "NO FACE DETECTED"
            new_state = "away"
            alerts.append("no_face")
        
        if device_detected:
            frame_score = max(frame_score - 35.0, 0.0)
            status_text = "⚠ DEVICE DETECTED"
            new_state = "away"
            if "device_detected" not in alerts:
                alerts.append("device_detected")
        
        frame_score = max(0.0, min(100.0, frame_score))
        
        # Update away timer (EXACT logic from main.py)
        current_time = time.time()
        if new_state == "away":
            if self.away_start_time is None:
                self.away_start_time = current_time
            self.away_timer = current_time - self.away_start_time
            
            if self.away_timer >= 5.0:
                alerts.append("away_5_seconds")
        else:
            self.away_start_time = None
            self.away_timer = 0.0
        
        # Update focus score with smoothing (EXACT from main.py - 70% new, 30% old)
        self.focus_score = 0.7 * frame_score + 0.3 * self.focus_score
        self.current_state = new_state
        self.last_status_text = status_text
        
        return {
            "success": True,
            "focus_score": round(self.focus_score, 2),
            "raw_frame_score": round(frame_score, 2),
            "status": status_text,
            "state": new_state,
            "away_timer": round(self.away_timer, 2),
            "alerts": alerts,
            "faces_detected": len(faces),
            "eyes_detected": len(eyes) if len(faces) > 0 and 'eyes' in locals() else 0,
            "timestamp": time.time()
        }
    
    def _error_response(self, message: str) -> Dict:
        return {
            "success": False,
            "error": message,
            "focus_score": 0.0,
            "status": "ERROR",
            "state": "unknown",
            "timestamp": time.time()
        }


# Global monitor instance
monitor = FocusMonitor()


def _decode_base64_frame(frame_payload: str) -> np.ndarray:
    """
    Decode a base64 encoded frame string into an OpenCV BGR image.
    Raises ValueError with a clear message when decoding fails.
    """
    if frame_payload is None:
        raise ValueError("Missing frame data")
    
    base64_part = frame_payload.split(",")[-1].strip()
    if not base64_part:
        raise ValueError("Empty frame data")
    
    try:
        frame_bytes = base64.b64decode(base64_part, validate=True)
    except (binascii.Error, ValueError) as exc:
        raise ValueError("Invalid base64 frame data") from exc
    
    if not frame_bytes:
        raise ValueError("Decoded frame is empty")
    
    nparr = np.frombuffer(frame_bytes, np.uint8)
    if nparr.size == 0:
        raise ValueError("Decoded frame buffer is empty")
    
    frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if frame is None:
        raise ValueError("Failed to decode frame as image")
    
    return frame


@app.get("/")
async def root():
    """API root endpoint"""
    return {
        "message": "AI Focus Monitoring API",
        "version": "1.0.0",
        "endpoints": {
            "health": "/health",
            "analyze": "/analyze (WebSocket)",
            "webcam": "/webcam/stream"
        }
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "monitor_initialized": True,
        "timestamp": time.time()
    }


@app.websocket("/analyze")
async def websocket_analyze(websocket: WebSocket):
    """
    WebSocket endpoint for real-time frame analysis
    
    Client sends: {"frame": "base64_encoded_image"}
    Server responds: {"focus_score": float, "status": str, ...}
    """
    await websocket.accept()
    logger.info("WebSocket connection established")
    
    async def send_json_safe(payload: Dict) -> bool:
        if websocket.client_state != WebSocketState.CONNECTED:
            return False
        try:
            await websocket.send_json(payload)
            return True
        except RuntimeError:
            logger.info("WebSocket closed before message could be sent")
            return False
        except WebSocketDisconnect:
            logger.info("WebSocket disconnected during send")
            return False
    
    try:
        while True:
            # Receive frame from client
            data = await websocket.receive_text()
            
            try:
                message = json.loads(data)
                
                frame_field = message.get("frame")
                if frame_field is None:
                    if not await send_json_safe({
                        "success": False,
                        "error": "No frame data provided"
                    }):
                        break
                    continue
                
                try:
                    frame = _decode_base64_frame(frame_field)
                except ValueError as decode_error:
                    if not await send_json_safe({
                        "success": False,
                        "error": str(decode_error)
                    }):
                        break
                    continue
                
                # Analyze frame
                result = monitor.analyze_frame(frame)
                
                # Send result back
                if not await send_json_safe(result):
                    break
                
            except json.JSONDecodeError:
                if not await send_json_safe({
                    "success": False,
                    "error": "Invalid JSON format"
                }):
                    break
            except Exception as e:
                logger.error(f"Error processing frame: {str(e)}")
                if not await send_json_safe({
                    "success": False,
                    "error": f"Processing error: {str(e)}"
                }):
                    break
    
    except WebSocketDisconnect:
        logger.info("WebSocket connection closed")


def generate_webcam_frames():
    """Generator for webcam video stream with proper cleanup"""
    camera = None
    try:
        camera = cv2.VideoCapture(0, cv2.CAP_DSHOW)  # Use DirectShow on Windows
        camera.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
        camera.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
        camera.set(cv2.CAP_PROP_FPS, 30)
        
        if not camera.isOpened():
            logger.error("Failed to open camera")
            return
        
        logger.info("Webcam stream started")
        frame_count = 0
        
        while True:
            success, frame = camera.read()
            if not success:
                logger.warning("Failed to read frame")
                break
            
            frame_count += 1
            
            # Analyze frame every frame (no skipping)
            result = monitor.analyze_frame(frame)
            
            # Draw overlay (EXACT from main.py)
            height, width = frame.shape[:2]
            
            # Determine color based on score
            score = result["focus_score"]
            if score >= 85:
                color = (0, 255, 0)  # Green
            elif score >= 70:
                color = (0, 255, 255)  # Yellow
            elif score >= 50:
                color = (0, 165, 255)  # Orange
            else:
                color = (0, 0, 255)  # Red
            
            # Draw score
            cv2.putText(frame, f"FOCUS: {score:.0f}%", (10, 40),
                       cv2.FONT_HERSHEY_SIMPLEX, 1.2, color, 3)
            
            # Draw status
            cv2.putText(frame, result["status"], (10, 80),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.7, color, 2)
            
            # Draw state
            cv2.putText(frame, f"State: {result['state'].upper()}", (10, 110),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
            
            # Draw away timer if active
            if result["away_timer"] > 0:
                timer_color = (0, 165, 255) if result["away_timer"] < 5.0 else (0, 0, 255)
                cv2.putText(frame, f"Away: {result['away_timer']:.1f}s / 5.0s", 
                           (10, height - 20), cv2.FONT_HERSHEY_SIMPLEX, 0.7, timer_color, 2)
                
                # Warning if >= 5 seconds
                if result["away_timer"] >= 5.0:
                    cv2.putText(frame, "!!! WARNING: LOOK AT SCREEN !!!", 
                               (width//2 - 300, height//2),
                               cv2.FONT_HERSHEY_SIMPLEX, 1.2, (0, 0, 255), 3)
            
            # Encode frame to JPEG
            ret, buffer = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 85])
            if not ret:
                continue
                
            frame_bytes = buffer.tobytes()
            
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')
    
    except Exception as e:
        logger.error(f"Error in webcam stream: {e}")
    finally:
        if camera is not None:
            camera.release()
            logger.info("Webcam stream stopped and camera released")


@app.get("/webcam/stream")
async def webcam_stream():
    """Stream webcam with focus analysis overlay"""
    return StreamingResponse(
        generate_webcam_frames(),
        media_type="multipart/x-mixed-replace; boundary=frame"
    )


@app.post("/analyze-frame")
async def analyze_frame(request: dict):
    """
    POST endpoint for single frame analysis (for Next.js API integration)
    
    Request: {"frame": "base64_encoded_image"}
    Response: {"success": true, "focus_score": 85.5, ...}
    """
    try:
        frame_field = request.get("frame")
        if frame_field is None:
            return JSONResponse(
                status_code=400,
                content={"success": False, "error": "No frame data provided"}
            )
        
        try:
            frame = _decode_base64_frame(frame_field)
        except ValueError as decode_error:
            return JSONResponse(
                status_code=400,
                content={"success": False, "error": str(decode_error)}
            )
        
        # Analyze frame
        result = monitor.analyze_frame(frame)
        
        return result
        
    except Exception as e:
        logger.error(f"Error analyzing frame: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={"success": False, "error": f"Processing error: {str(e)}"}
        )


@app.get("/stats")
async def get_stats():
    """Get current monitoring statistics"""
    return {
        "current_score": round(monitor.focus_score, 2),
        "current_state": monitor.current_state,
        "away_timer": round(monitor.away_timer, 2),
        "last_status": monitor.last_status_text,
        "timestamp": time.time()
    }


if __name__ == "__main__":
    import uvicorn
    
    logger.info("Starting FastAPI server (HTTP mode - no SSL)")
    logger.info(f"Server will be available at http://0.0.0.0:8000")
    
    try:
        # Run without SSL for now to test basic functionality
        uvicorn.run(
            app,
            host="0.0.0.0",
            port=8000,
            log_level="info"
        )
    except Exception as e:
        logger.error(f"Failed to start server: {e}", exc_info=True)
        import sys
        sys.exit(1)

