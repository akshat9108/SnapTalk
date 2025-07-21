// SnapTalk JavaScript - Frontend Functionality

class SnapTalk {
    constructor() {
        this.selectedFile = null;
        this.capturedImage = null;
        this.camera = null;
        this.speechSynthesis = window.speechSynthesis;
        this.isReading = false;

        this.initializeEventListeners();
        this.checkBrowserSupport();
    }

    // Initialize all event listeners
    initializeEventListeners() {
        // File upload events
        const uploadArea = document.getElementById('uploadArea');
        const fileInput = document.getElementById('fileInput');

        uploadArea.addEventListener('click', () => fileInput.click());
        uploadArea.addEventListener('dragover', this.handleDragOver.bind(this));
        uploadArea.addEventListener('dragleave', this.handleDragLeave.bind(this));
        uploadArea.addEventListener('drop', this.handleDrop.bind(this));
        fileInput.addEventListener('change', this.handleFileSelect.bind(this));

        // Camera events
        document.getElementById('cameraBtn').addEventListener('click', this.openCamera.bind(this));
        document.getElementById('captureBtn').addEventListener('click', this.captureImage.bind(this));
        document.getElementById('closeCameraBtn').addEventListener('click', this.closeCamera.bind(this));

        // Process button
        document.getElementById('processBtn').addEventListener('click', this.processImage.bind(this));

        // Results actions
        document.getElementById('readAloudBtn').addEventListener('click', this.readAloud.bind(this));
        document.getElementById('copyBtn').addEventListener('click', this.copyText.bind(this));
        document.getElementById('clearBtn').addEventListener('click', this.clearResults.bind(this));

        // Text area events for stats
        document.getElementById('extractedText').addEventListener('input', this.updateStats.bind(this));
    }

    // Check browser support for required features
    checkBrowserSupport() {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            console.warn('Camera not supported in this browser');
            this.showToast('Camera not supported in this browser', 'warning');
        }

        if (!window.speechSynthesis) {
            console.warn('Text-to-Speech not supported in this browser');
            this.showToast('Text-to-Speech not supported in this browser', 'warning');
        }
    }

    // File drag and drop handlers
    handleDragOver(e) {
        e.preventDefault();
        document.getElementById('uploadArea').classList.add('dragover');
    }

    handleDragLeave(e) {
        e.preventDefault();
        document.getElementById('uploadArea').classList.remove('dragover');
    }

    handleDrop(e) {
        e.preventDefault();
        document.getElementById('uploadArea').classList.remove('dragover');

        const files = e.dataTransfer.files;
        if (files.length > 0) {
            this.handleFile(files[0]);
        }
    }

    // File selection handler
    handleFileSelect(e) {
        const file = e.target.files[0];
        if (file) {
            this.handleFile(file);
        }
    }

    // Handle selected file
    handleFile(file) {
        // Validate file type
        if (!file.type.startsWith('image/')) {
            this.showToast('Please select an image file', 'error');
            return;
        }

        // Validate file size (10MB limit)
        if (file.size > 10 * 1024 * 1024) {
            this.showToast('File size must be less than 10MB', 'error');
            return;
        }

        this.selectedFile = file;
        this.capturedImage = null; // Clear camera image
        this.enableProcessButton();
        this.showToast(`Selected: ${file.name}`, 'success');

        // Show preview
        this.showImagePreview(file);
    }

    // Show image preview
    showImagePreview(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const uploadArea = document.getElementById('uploadArea');
            uploadArea.innerHTML = `
                <img src="${e.target.result}" alt="Preview" style="max-width: 100%; max-height: 150px; border-radius: 10px;">
                <p style="margin-top: 10px; color: #667eea; font-weight: 500;">Ready to process!</p>
            `;
        };
        reader.readAsDataURL(file);
    }

    // Camera functionality
    async openCamera() {
        try {
            this.camera = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' } // Use back camera on mobile
            });

            const video = document.getElementById('video');
            video.srcObject = this.camera;

            document.getElementById('cameraPreview').style.display = 'block';
            this.showToast('Camera opened successfully', 'success');

        } catch (error) {
            console.error('Error accessing camera:', error);
            this.showToast('Could not access camera. Please check permissions.', 'error');
        }
    }

    // Capture image from camera
    captureImage() {
        const video = document.getElementById('video');
        const canvas = document.getElementById('canvas');
        const ctx = canvas.getContext('2d');

        // Set canvas size to video size
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        // Draw video frame to canvas
        ctx.drawImage(video, 0, 0);

        // Convert to base64
        this.capturedImage = canvas.toDataURL('image/jpeg', 0.8);
        this.selectedFile = null; // Clear file selection

        this.closeCamera();
        this.enableProcessButton();
        this.showToast('Image captured successfully!', 'success');

        // Show captured image preview
        const cameraArea = document.getElementById('cameraArea');
        cameraArea.innerHTML = `
            <img src="${this.capturedImage}" alt="Captured" style="max-width: 100%; max-height: 150px; border-radius: 10px;">
            <p style="margin-top: 10px; color: #667eea; font-weight: 500;">Ready to process!</p>
        `;
    }

    // Close camera
    closeCamera() {
        if (this.camera) {
            this.camera.getTracks().forEach(track => track.stop());
            this.camera = null;
        }
        document.getElementById('cameraPreview').style.display = 'none';
    }

    // Enable process button
    enableProcessButton() {
        document.getElementById('processBtn').disabled = false;
    }

    // Process image (OCR)
    async processImage() {
        if (!this.selectedFile && !this.capturedImage) {
            this.showToast('Please select an image or capture one with camera', 'error');
            return;
        }

        this.showLoading(true);
        const startTime = Date.now();

        try {
            let response;

            if (this.selectedFile) {
                // Process uploaded file
                response = await this.processUploadedFile();
            } else {
                // Process captured image
                response = await this.processCapturedImage();
            }

            const endTime = Date.now();
            const processingTime = ((endTime - startTime) / 1000).toFixed(2);

            if (response.success) {
                this.displayResults(response.extractedText, processingTime);
                this.showToast('Text extracted successfully!', 'success');
            } else {
                throw new Error(response.message || 'Failed to extract text');
            }

        } catch (error) {
            console.error('Error processing image:', error);
            this.showToast('Error processing image: ' + error.message, 'error');
        } finally {
            this.showLoading(false);
        }
    }

    // Process uploaded file
    async processUploadedFile() {
        const formData = new FormData();
        formData.append('image', this.selectedFile);

        const response = await fetch('/api/extract-text', {
            method: 'POST',
            body: formData
        });

        return await response.json();
    }

    // Process captured image
    async processCapturedImage() {
        const response = await fetch('/api/extract-text-camera', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                image: this.capturedImage
            })
        });

        return await response.json();
    }

    // Display extraction results
    displayResults(text, processingTime) {
        document.getElementById('extractedText').value = text;
        document.getElementById('processingTime').textContent = `Processed in ${processingTime}s`;
        document.getElementById('resultsSection').style.display = 'block';

        this.updateStats();

        // Scroll to results
        document.getElementById('resultsSection').scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }

    // Update character and word count
    updateStats() {
        const text = document.getElementById('extractedText').value;
        const charCount = text.length;
        const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;

        document.getElementById('charCount').textContent = `${charCount} characters`;
        document.getElementById('wordCount').textContent = `${wordCount} words`;
    }

    // Text-to-Speech functionality
    readAloud() {
        const text = document.getElementById('extractedText').value.trim();

        if (!text) {
            this.showToast('No text to read', 'warning');
            return;
        }

        if (!this.speechSynthesis) {
            this.showToast('Text-to-Speech not supported', 'error');
            return;
        }

        if (this.isReading) {
            // Stop reading
            this.speechSynthesis.cancel();
            this.isReading = false;
            document.getElementById('readAloudBtn').innerHTML =
                '<i class="fas fa-volume-up"></i> Read Aloud';
            return;
        }

        // Start reading
        const utterance = new SpeechSynthesisUtterance(text);

        // Configure speech settings
        utterance.rate = 0.9;
        utterance.pitch = 1;
        utterance.volume = 1;

        // Event handlers
        utterance.onstart = () => {
            this.isReading = true;
            document.getElementById('readAloudBtn').innerHTML =
                '<i class="fas fa-stop"></i> Stop Reading';
            this.showToast('Reading text aloud...', 'success');
        };

        utterance.onend = () => {
            this.isReading = false;
            document.getElementById('readAloudBtn').innerHTML =
                '<i class="fas fa-volume-up"></i> Read Aloud';
        };

        utterance.onerror = (error) => {
            console.error('Speech synthesis error:', error);
            this.isReading = false;
            document.getElementById('readAloudBtn').innerHTML =
                '<i class="fas fa-volume-up"></i> Read Aloud';
            this.showToast('Error reading text aloud', 'error');
        };

        this.speechSynthesis.speak(utterance);
    }

    // Copy text to clipboard
    async copyText() {
        const text = document.getElementById('extractedText').value.trim();

        if (!text) {
            this.showToast('No text to copy', 'warning');
            return;
        }

        try {
            await navigator.clipboard.writeText(text);
            this.showToast('Text copied to clipboard!', 'success');
        } catch (error) {
            // Fallback for older browsers
            const textArea = document.getElementById('extractedText');
            textArea.select();
            document.execCommand('copy');
            this.showToast('Text copied to clipboard!', 'success');
        }
    }

    // Clear all results and reset form
    clearResults() {
        // Reset file inputs
        this.selectedFile = null;
        this.capturedImage = null;
        document.getElementById('fileInput').value = '';

        // Reset UI elements
        document.getElementById('uploadArea').innerHTML = `
            <i class="fas fa-cloud-upload-alt"></i>
            <h3>Upload Image</h3>
            <p>Click to select or drag and drop</p>
        `;

        document.getElementById('cameraArea').innerHTML = `
            <i class="fas fa-camera"></i>
            <h3>Use Camera</h3>
            <p>Take a photo directly</p>
            <button id="cameraBtn" class="btn btn-camera">
                <i class="fas fa-camera"></i> Open Camera
            </button>
        `;

        // Re-attach camera button event
        document.getElementById('cameraBtn').addEventListener('click', this.openCamera.bind(this));

        // Clear results
        document.getElementById('resultsSection').style.display = 'none';
        document.getElementById('extractedText').value = '';
        document.getElementById('processBtn').disabled = true;

        // Stop any ongoing speech
        if (this.isReading) {
            this.speechSynthesis.cancel();
            this.isReading = false;
        }

        this.showToast('Cleared successfully', 'success');
    }

    // Show/hide loading animation
    showLoading(show) {
        document.getElementById('loading').style.display = show ? 'block' : 'none';
    }

    // Show toast notification
    showToast(message, type = 'success') {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.className = `toast ${type}`;
        toast.classList.add('show');

        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }
}

// Initialize SnapTalk when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new SnapTalk();
    console.log('SnapTalk initialized successfully!');
});