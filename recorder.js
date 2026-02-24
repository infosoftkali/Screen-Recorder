class ScreenRecorder {
    constructor() {
        this.mediaRecorder = null;
        this.recordedChunks = [];
        this.stream = null;
        this.webcamStream = null;
        this.screenStream = null;
        this.isRecording = false;
        this.isPaused = false;
        
        // Timer
        this.startTime = null;
        this.timerInterval = null;
        
        // Logo
        this.logoImage = null;
        this.logoAspectRatio = 1;
        
        // DOM Elements
        this.webcamVideo = document.getElementById('webcamVideo');
        this.screenVideo = document.getElementById('screenVideo');
        this.previewVideo = document.getElementById('preview');
        this.startBtn = document.getElementById('startBtn');
        this.stopBtn = document.getElementById('stopBtn');
        this.pauseBtn = document.getElementById('pauseBtn');
        this.resumeBtn = document.getElementById('resumeBtn');
        this.recordingIndicator = document.getElementById('recordingIndicator');
        this.timerDisplay = document.getElementById('timerDisplay');
        this.downloadSection = document.getElementById('downloadSection');
        this.downloadLink = document.getElementById('downloadLink');
        
        // Basic settings
        this.includeWebcam = document.getElementById('includeWebcam');
        this.includeMic = document.getElementById('includeMic');
        this.includeSystemAudio = document.getElementById('includeSystemAudio');
        this.qualitySetting = document.getElementById('qualitySetting');
        
        // Logo settings
        this.logoFile = document.getElementById('logoFile');
        this.logoPreview = document.getElementById('logoPreview');
        this.logoPosition = document.getElementById('logoPosition');
        this.logoSize = document.getElementById('logoSize');
        this.logoSizeValue = document.getElementById('logoSizeValue');
        
        // Webcam customization
        this.webcamPosition = document.getElementById('webcamPosition');
        this.webcamSize = document.getElementById('webcamSize');
        this.webcamSizeValue = document.getElementById('webcamSizeValue');
        this.webcamShape = document.getElementById('webcamShape');
        this.cornerRadius = document.getElementById('cornerRadius');
        this.cornerRadiusValue = document.getElementById('cornerRadiusValue');
        this.cornerRadiusRow = document.getElementById('cornerRadiusRow');
        
        // Bind events
        this.setupEventListeners();
        this.setupKeyboardShortcuts();
    }

    setupEventListeners() {
        // Logo upload
        this.logoFile.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    const img = new Image();
                    img.onload = () => {
                        this.logoImage = img;
                        this.logoAspectRatio = img.width / img.height;
                        this.logoPreview.src = event.target.result;
                        this.logoPreview.style.display = 'block';
                    };
                    img.src = event.target.result;
                };
                reader.readAsDataURL(file);
            } else {
                this.logoImage = null;
                this.logoPreview.style.display = 'none';
            }
        });

        // Logo size slider display
        this.logoSize.addEventListener('input', () => {
            this.logoSizeValue.textContent = this.logoSize.value + '%';
        });

        // Webcam size slider display
        this.webcamSize.addEventListener('input', () => {
            this.webcamSizeValue.textContent = this.webcamSize.value + '%';
        });

        // Webcam shape toggle corner radius row
        this.webcamShape.addEventListener('change', () => {
            this.cornerRadiusRow.style.display = 
                this.webcamShape.value === 'rounded' ? 'flex' : 'none';
        });

        // Corner radius slider display
        this.cornerRadius.addEventListener('input', () => {
            this.cornerRadiusValue.textContent = this.cornerRadius.value;
        });

        // Initial corner radius row visibility
        this.cornerRadiusRow.style.display = 
            this.webcamShape.value === 'rounded' ? 'flex' : 'none';
    }

    getQualitySettings() {
        const quality = this.qualitySetting.value;
        switch(quality) {
            case 'high':
                return { width: 1920, height: 1080, fps: 30, bitrate: 5000000 };
            case 'medium':
                return { width: 1280, height: 720, fps: 30, bitrate: 2500000 };
            case 'low':
                return { width: 854, height: 480, fps: 15, bitrate: 1000000 };
            default:
                return { width: 1280, height: 720, fps: 30, bitrate: 2500000 };
        }
    }

    startTimer() {
        this.startTime = Date.now();
        this.timerInterval = setInterval(() => {
            if (!this.isPaused) {
                const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
                const hours = Math.floor(elapsed / 3600);
                const minutes = Math.floor((elapsed % 3600) / 60);
                const seconds = elapsed % 60;
                this.timerDisplay.textContent = 
                    `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            }
        }, 1000);
    }

    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
        this.timerDisplay.textContent = '00:00:00';
    }

    setupKeyboardShortcuts() {
        window.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.shiftKey) {
                switch(e.key.toLowerCase()) {
                    case 'r':
                        e.preventDefault();
                        if (!this.isRecording) this.startRecording();
                        break;
                    case 's':
                        e.preventDefault();
                        if (this.isRecording) this.stopRecording();
                        break;
                    case 'p':
                        e.preventDefault();
                        if (this.isRecording) {
                            if (this.isPaused) this.resumeRecording();
                            else this.pauseRecording();
                        }
                        break;
                }
            }
        });
    }

    async startRecording() {
        try {
            this.recordedChunks = [];
            await this.getScreenStream();
            if (this.includeWebcam.checked) {
                await this.getWebcamStream();
            }
            await this.combineStreams();
            this.setupMediaRecorder();
            this.mediaRecorder.start(1000);
            this.startTimer();
            this.updateUIForRecording(true);
            this.setupPreview();
        } catch (error) {
            console.error('Error starting recording:', error);
            alert('Error: ' + error.message);
        }
    }

    async getScreenStream() {
        const constraints = {
            video: { cursor: "always", displaySurface: "monitor" },
            audio: this.includeSystemAudio.checked
        };
        try {
            this.screenStream = await navigator.mediaDevices.getDisplayMedia(constraints);
            this.screenVideo.srcObject = this.screenStream;
            this.screenStream.getVideoTracks()[0].onended = () => {
                if (this.isRecording) this.stopRecording();
            };
        } catch (error) {
            throw new Error('Screen capture failed: ' + error.message);
        }
    }

    async getWebcamStream() {
        try {
            this.webcamStream = await navigator.mediaDevices.getUserMedia({
                video: { width: { ideal: 320 }, height: { ideal: 240 }, facingMode: "user" },
                audio: false
            });
            this.webcamVideo.srcObject = this.webcamStream;
        } catch (error) {
            console.warn('Webcam not available');
            this.includeWebcam.checked = false;
        }
    }

    async getMicrophoneStream() {
        try {
            return await navigator.mediaDevices.getUserMedia({
                audio: { echoCancellation: true, noiseSuppression: true }
            });
        } catch (error) {
            console.warn('Microphone not available');
            this.includeMic.checked = false;
            return null;
        }
    }

    async combineStreams() {
        const quality = this.getQualitySettings();
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = quality.width;
        canvas.height = quality.height;
        
        const canvasStream = canvas.captureStream(quality.fps);
        
        const screenVideo = document.createElement('video');
        screenVideo.srcObject = this.screenStream;
        screenVideo.play();
        
        const webcamVideo = document.createElement('video');
        if (this.webcamStream) {
            webcamVideo.srcObject = this.webcamStream;
            webcamVideo.play();
        }
        
        // Drawing loop
        setInterval(() => {
            if (!this.isPaused) {
                // Draw screen
                ctx.drawImage(screenVideo, 0, 0, canvas.width, canvas.height);
                
                // Draw webcam if enabled
                if (this.webcamStream && this.includeWebcam.checked) {
                    this.drawWebcam(ctx, canvas.width, canvas.height, webcamVideo);
                }
                
                // Draw logo if uploaded
                if (this.logoImage) {
                    this.drawLogo(ctx, canvas.width, canvas.height);
                }
            }
        }, 1000 / quality.fps);
        
        // Audio tracks
        const audioTracks = [];
        if (this.screenStream.getAudioTracks().length > 0) {
            audioTracks.push(...this.screenStream.getAudioTracks());
        }
        if (this.includeMic.checked) {
            const micStream = await this.getMicrophoneStream();
            if (micStream) {
                audioTracks.push(...micStream.getAudioTracks());
            }
        }
        
        this.stream = new MediaStream([
            ...canvasStream.getVideoTracks(),
            ...audioTracks
        ]);
    }

    drawWebcam(ctx, canvasWidth, canvasHeight, webcamVideo) {
        const sizePercent = parseInt(this.webcamSize.value) / 100;
        const pipWidth = canvasWidth * sizePercent;
        const pipHeight = pipWidth * 3 / 4; // 4:3 aspect ratio
        
        // Position
        const margin = 20;
        let pipX, pipY;
        switch(this.webcamPosition.value) {
            case 'top-left':
                pipX = margin;
                pipY = margin;
                break;
            case 'top-right':
                pipX = canvasWidth - pipWidth - margin;
                pipY = margin;
                break;
            case 'bottom-left':
                pipX = margin;
                pipY = canvasHeight - pipHeight - margin;
                break;
            case 'bottom-right':
            default:
                pipX = canvasWidth - pipWidth - margin;
                pipY = canvasHeight - pipHeight - margin;
        }
        
        ctx.save();
        
        // Apply shape clipping
        const shape = this.webcamShape.value;
        if (shape === 'circle') {
            ctx.beginPath();
            const centerX = pipX + pipWidth / 2;
            const centerY = pipY + pipHeight / 2;
            const radius = Math.min(pipWidth, pipHeight) / 2;
            ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
            ctx.clip();
        } else if (shape === 'rounded') {
            const radius = parseInt(this.cornerRadius.value);
            ctx.beginPath();
            ctx.moveTo(pipX + radius, pipY);
            ctx.lineTo(pipX + pipWidth - radius, pipY);
            ctx.quadraticCurveTo(pipX + pipWidth, pipY, pipX + pipWidth, pipY + radius);
            ctx.lineTo(pipX + pipWidth, pipY + pipHeight - radius);
            ctx.quadraticCurveTo(pipX + pipWidth, pipY + pipHeight, pipX + pipWidth - radius, pipY + pipHeight);
            ctx.lineTo(pipX + radius, pipY + pipHeight);
            ctx.quadraticCurveTo(pipX, pipY + pipHeight, pipX, pipY + pipHeight - radius);
            ctx.lineTo(pipX, pipY + radius);
            ctx.quadraticCurveTo(pipX, pipY, pipX + radius, pipY);
            ctx.closePath();
            ctx.clip();
        }
        
        // Draw white border (only if not circle? we'll draw it for all shapes but clipped)
        ctx.fillStyle = 'white';
        ctx.fillRect(pipX - 2, pipY - 2, pipWidth + 4, pipHeight + 4);
        
        // Draw webcam
        ctx.drawImage(webcamVideo, pipX, pipY, pipWidth, pipHeight);
        
        ctx.restore();
    }

    drawLogo(ctx, canvasWidth, canvasHeight) {
        const sizePercent = parseInt(this.logoSize.value) / 100;
        const logoWidth = canvasWidth * sizePercent;
        const logoHeight = logoWidth / this.logoAspectRatio;
        
        const margin = 20;
        let logoX, logoY;
        switch(this.logoPosition.value) {
            case 'top-left':
                logoX = margin;
                logoY = margin;
                break;
            case 'top-right':
                logoX = canvasWidth - logoWidth - margin;
                logoY = margin;
                break;
            case 'bottom-left':
                logoX = margin;
                logoY = canvasHeight - logoHeight - margin;
                break;
            case 'bottom-right':
            default:
                logoX = canvasWidth - logoWidth - margin;
                logoY = canvasHeight - logoHeight - margin;
        }
        
        ctx.drawImage(this.logoImage, logoX, logoY, logoWidth, logoHeight);
    }

    setupMediaRecorder() {
        const quality = this.getQualitySettings();
        this.mediaRecorder = new MediaRecorder(this.stream, {
            mimeType: 'video/webm;codecs=vp9,opus',
            videoBitsPerSecond: quality.bitrate
        });
        
        this.mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) this.recordedChunks.push(event.data);
        };
        
        this.mediaRecorder.onstop = () => {
            this.stopTimer();
            this.saveRecording();
        };
        
        this.mediaRecorder.onpause = () => {
            this.isPaused = true;
            this.recordingIndicator.style.opacity = '0.5';
        };
        
        this.mediaRecorder.onresume = () => {
            this.isPaused = false;
            this.recordingIndicator.style.opacity = '1';
        };
    }

    setupPreview() {
        this.previewVideo.srcObject = this.stream;
    }

    stopRecording() {
        if (this.mediaRecorder && this.isRecording) {
            this.mediaRecorder.stop();
            this.isRecording = false;
            
            this.stream?.getTracks().forEach(t => t.stop());
            this.screenStream?.getTracks().forEach(t => t.stop());
            this.webcamStream?.getTracks().forEach(t => t.stop());
            
            this.updateUIForRecording(false);
            this.previewVideo.srcObject = null;
            this.screenVideo.srcObject = null;
            this.webcamVideo.srcObject = null;
        }
    }

    pauseRecording() {
        if (this.mediaRecorder && this.isRecording && !this.isPaused) {
            this.mediaRecorder.pause();
            this.updateUIForPause(true);
        }
    }

    resumeRecording() {
        if (this.mediaRecorder && this.isRecording && this.isPaused) {
            this.mediaRecorder.resume();
            this.updateUIForPause(false);
        }
    }

    saveRecording() {
        const blob = new Blob(this.recordedChunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        this.downloadLink.href = url;
        this.downloadLink.download = `recording-${new Date().toISOString()}.webm`;
        this.downloadSection.style.display = 'block';
        
        const fileSize = (blob.size / (1024 * 1024)).toFixed(2);
        this.downloadLink.textContent = `⬇️ Download Recording (${fileSize} MB)`;
    }

    updateUIForRecording(isRecording) {
        this.isRecording = isRecording;
        this.startBtn.disabled = isRecording;
        this.stopBtn.disabled = !isRecording;
        this.pauseBtn.disabled = !isRecording;
        this.resumeBtn.disabled = true;
        this.recordingIndicator.style.display = isRecording ? 'flex' : 'none';
        if (!isRecording) this.downloadSection.style.display = 'block';
    }

    updateUIForPause(isPaused) {
        this.isPaused = isPaused;
        this.pauseBtn.disabled = isPaused;
        this.resumeBtn.disabled = !isPaused;
        this.recordingIndicator.style.opacity = isPaused ? '0.5' : '1';
    }
}

// Initialize
const recorder = new ScreenRecorder();

// Global functions
function startRecording() { recorder.startRecording(); }
function stopRecording() { recorder.stopRecording(); }
function pauseRecording() { recorder.pauseRecording(); }
function resumeRecording() { recorder.resumeRecording(); }

// Compatibility check
document.addEventListener('DOMContentLoaded', () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
        alert('Your browser does not support screen recording.');
        document.getElementById('startBtn').disabled = true;
    }
});