// DOM Elements
const video = document.getElementById('video');
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const statusIndicator = document.getElementById('statusIndicator');
const statusText = statusIndicator.querySelector('.status-text');
const alertBanner = document.getElementById('alertBanner');
const intervalInput = document.getElementById('intervalInput');
const soundEnabled = document.getElementById('soundEnabled');
const lastCheckEl = document.getElementById('lastCheck');
const currentStatusEl = document.getElementById('currentStatus');
const violationCountEl = document.getElementById('violationCount');

// State
let stream = null;
let checkInterval = null;
let violationCount = 0;
let isMonitoring = false;

// Audio context for alerts
let audioContext = null;
let alertSound = null;

// Initialize audio context
function initAudio() {
    try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
        console.warn('Audio context not supported:', e);
    }
}

// Play alert sound (alarm pattern)
function playAlertSound() {
    if (!soundEnabled.checked || !audioContext) return;

    try {
        const duration = 0.3; // Duration of each tone
        const pause = 0.1; // Pause between tones
        const cycles = 3; // Number of alarm cycles

        let currentTime = audioContext.currentTime;

        for (let cycle = 0; cycle < cycles; cycle++) {
            // First tone (higher frequency)
            const osc1 = audioContext.createOscillator();
            const gain1 = audioContext.createGain();

            osc1.connect(gain1);
            gain1.connect(audioContext.destination);

            osc1.frequency.value = 1000;
            osc1.type = 'sine';

            gain1.gain.setValueAtTime(0, currentTime);
            gain1.gain.linearRampToValueAtTime(0.4, currentTime + 0.05);
            gain1.gain.linearRampToValueAtTime(0, currentTime + duration);

            osc1.start(currentTime);
            osc1.stop(currentTime + duration);

            currentTime += duration + pause;

            // Second tone (lower frequency)
            const osc2 = audioContext.createOscillator();
            const gain2 = audioContext.createGain();

            osc2.connect(gain2);
            gain2.connect(audioContext.destination);

            osc2.frequency.value = 800;
            osc2.type = 'sine';

            gain2.gain.setValueAtTime(0, currentTime);
            gain2.gain.linearRampToValueAtTime(0.4, currentTime + 0.05);
            gain2.gain.linearRampToValueAtTime(0, currentTime + duration);

            osc2.start(currentTime);
            osc2.stop(currentTime + duration);

            currentTime += duration + pause * 2;
        }
    } catch (e) {
        console.warn('Could not play alert sound:', e);
    }
}

// Request camera access
async function startCamera() {
    try {
        stream = await navigator.mediaDevices.getUserMedia({
            video: {
                width: { ideal: 1280 },
                height: { ideal: 720 },
                facingMode: 'user'
            }
        });
        video.srcObject = stream;
        return true;
    } catch (error) {
        console.error('Error accessing camera:', error);
        alert('Failed to access camera. Please ensure you have granted camera permissions.');
        return false;
    }
}

// Stop camera
function stopCamera() {
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
        stream = null;
        video.srcObject = null;
    }
}

// Capture frame from video and resize
function captureFrame() {
    const canvas = document.createElement('canvas');

    // Calculate new dimensions (max width 800px)
    const MAX_WIDTH = 800;
    let width = video.videoWidth;
    let height = video.videoHeight;

    if (width > MAX_WIDTH) {
        height = Math.round(height * (MAX_WIDTH / width));
        width = MAX_WIDTH;
    }

    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, width, height);

    // Use lower quality for faster transmission (0.7)
    return canvas.toDataURL('image/jpeg', 0.7);
}

// Update status indicator
function updateStatus(status, text) {
    statusIndicator.className = 'status-indicator';
    statusIndicator.classList.add(status);
    statusText.textContent = text;
}

// Show alert banner
function showAlert() {
    alertBanner.classList.add('show');
    playAlertSound();

    // Hide alert after 5 seconds
    setTimeout(() => {
        alertBanner.classList.remove('show');
    }, 5000);
}

// Check safety glasses via API
async function checkSafetyGlasses() {
    if (!video.videoWidth || !video.videoHeight) {
        console.warn('Video not ready');
        return;
    }

    updateStatus('checking', 'Checking...');
    lastCheckEl.textContent = new Date().toLocaleTimeString();

    try {
        const imageData = captureFrame();

        const response = await fetch('/api/check-safety-glasses', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ image: imageData }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'API request failed');
        }

        if (data.wearingGlasses) {
            updateStatus('compliant', '✓ Compliant');
            currentStatusEl.textContent = 'Compliant';
            currentStatusEl.style.color = '#22c55e';
        } else {
            updateStatus('violation', '✗ Violation');
            currentStatusEl.textContent = 'Violation Detected';
            currentStatusEl.style.color = '#ef4444';
            violationCount++;
            violationCountEl.textContent = violationCount;
            showAlert();
        }

        lastCheckEl.textContent = new Date().toLocaleTimeString();
    } catch (error) {
        console.error('Error checking safety glasses:', error);
        updateStatus('violation', 'Error');
        currentStatusEl.textContent = 'Error: ' + error.message;
        currentStatusEl.style.color = '#ef4444';
    }
}

// Start monitoring
async function startMonitoring() {
    const cameraStarted = await startCamera();
    if (!cameraStarted) {
        return;
    }

    isMonitoring = true;
    startBtn.disabled = true;
    stopBtn.disabled = false;
    intervalInput.disabled = true;
    currentStatusEl.textContent = 'Monitoring';
    currentStatusEl.style.color = '#fbbf24';

    // Initialize audio if needed
    if (soundEnabled.checked) {
        initAudio();
    }

    // Initial check after 2 seconds
    setTimeout(checkSafetyGlasses, 2000);

    // Set up periodic checks
    const interval = parseInt(intervalInput.value) * 1000;
    checkInterval = setInterval(checkSafetyGlasses, interval);
}

// Stop monitoring
function stopMonitoring() {
    isMonitoring = false;
    stopCamera();
    startBtn.disabled = false;
    stopBtn.disabled = true;
    intervalInput.disabled = false;
    currentStatusEl.textContent = 'Not Monitoring';
    currentStatusEl.style.color = '#6b7280';

    if (checkInterval) {
        clearInterval(checkInterval);
        checkInterval = null;
    }

    updateStatus('', 'Ready');
}

// Event listeners
startBtn.addEventListener('click', startMonitoring);
stopBtn.addEventListener('click', stopMonitoring);

// Update interval if changed while monitoring
intervalInput.addEventListener('change', () => {
    if (isMonitoring && checkInterval) {
        clearInterval(checkInterval);
        const interval = parseInt(intervalInput.value) * 1000;
        checkInterval = setInterval(checkSafetyGlasses, interval);
    }
});

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    updateStatus('', 'Ready');
    console.log('Safety Glasses Monitor initialized');
});

