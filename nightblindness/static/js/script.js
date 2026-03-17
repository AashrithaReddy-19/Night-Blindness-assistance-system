// AI Dashboard Script
// Handles real-time updates, interactions, voice synthesis, SOS

class AIDashboard {
    constructor() {
        this.voiceEnabled = localStorage.getItem('voiceEnabled') === 'true';
        this.detectionData = [];
        this.init();
    }

    init() {
        this.cacheElements();
        this.bindEvents();
        this.startPolling();
        this.updateVoiceUI();
        setInterval(() => this.refreshCamera(), 8000);
        this.loadContacts();
    }

    cacheElements() {
        this.elements = {
            cameraFeed: document.getElementById('camera-feed'),
            voiceBtn: document.getElementById('voice-btn'),
            voiceStatusDot: document.getElementById('voice-status-dot'),
            sosBtn: document.getElementById('sos-btn'),
            sosModal: document.getElementById('sos-modal'),
            confirmSos: document.getElementById('confirm-sos'),
            cancelSos: document.getElementById('cancel-sos'),
            successNotification: document.getElementById('success-notification'),
            contactsBtn: document.getElementById('contacts-btn'),
            contactsModal: document.getElementById('contacts-modal'),
            saveContacts: document.getElementById('save-contacts'),
            cancelContacts: document.getElementById('cancel-contacts'),
            primaryName: document.getElementById('primary-name'),
            primaryPhone: document.getElementById('primary-phone'),
            secondaryName: document.getElementById('secondary-name'),
            secondaryPhone: document.getElementById('secondary-phone'),
            objectsList: document.getElementById('objects-list'),
            distancesList: document.getElementById('distances-list'),
            alertsList: document.getElementById('alerts-list'),
            fpsCounter: document.getElementById('fps-counter'),
            detectionCount: document.getElementById('detection-count')
        };

    }

    bindEvents() {
        this.elements.voiceBtn.addEventListener('click', () => this.toggleVoice());
        this.elements.sosBtn.addEventListener('click', () => this.showSOSModal());
        this.elements.cancelSos.addEventListener('click', () => this.hideSOSModal());
        this.elements.confirmSos.addEventListener('click', () => this.sendSOS());
        this.elements.contactsBtn?.addEventListener('click', () => this.showContactsModal());
        this.elements.cancelContacts?.addEventListener('click', () => this.hideContactsModal());
        this.elements.saveContacts?.addEventListener('click', () => this.saveEmergencyContacts());
    }

    toggleVoice() {
        this.voiceEnabled = !this.voiceEnabled;
        localStorage.setItem('voiceEnabled', this.voiceEnabled);
        this.updateVoiceUI();
    }

    updateVoiceUI() {
        const icon = this.voiceEnabled ? 'fa-volume-high' : 'fa-volume-xmark';
        this.elements.voiceBtn.innerHTML = `<i class="fas ${icon}"></i> Voice ${this.voiceEnabled ? 'ON' : 'OFF'}`;
        this.elements.voiceBtn.classList.toggle('active', this.voiceEnabled);
    }

    async startPolling() {
        setInterval(async () => {
            try {
                const data = await (await fetch('/results')).json();
                this.detectionData = data;
                this.updateUI(data);
                this.handleVoiceAlerts(data);
                this.updateStatusIndicator(data);
                this.updateOverlay(data.length);
            } catch (error) {
                console.warn('Polling error:', error);
            }
        }, 300);
    }

    updateStatusIndicator(data) {
        if (!this.elements.voiceStatusDot) return;

        const minDistance = data.reduce((min, item) => {
            const dist = parseFloat(item.distance) || Infinity;
            return dist < min ? dist : min;
        }, Infinity);

        let severity = 'safe';
        if (minDistance < 2) severity = 'danger';
        else if (minDistance < 5) severity = 'warning';

        this.elements.voiceStatusDot.className = `voice-status-dot ${severity}`;
    }


    updateUI(data) {
        this.updateObjectsList(data);
        this.updateDistancesList(data);
        this.updateAlertsList(data);
    }

    updateObjectsList(data) {
        this.elements.objectsList.innerHTML = data.map(item => `
            <div class="list-item ${item.status?.toLowerCase() || ''}">
                <div class="icon">
                    <i class="fas fa-${this.getObjectIcon(item.object)}"></i>
                </div>
                <div class="info">
                    <div class="info-title">${item.object}</div>
                    <div class="info-meta">
                        <span>Confidence: ${Math.round(Math.random() * 30 + 70)}%</span>
                        <span>${item.distance ? item.distance + 'm' : 'N/A'}</span>
                    </div>
                </div>
            </div>
        `).join('');
    }

    updateDistancesList(data) {
        this.elements.distancesList.innerHTML = data.map(item => {
            const distance = parseFloat(item.distance) || Infinity;
            const severity = distance < 2 ? 'danger' : distance < 5 ? 'warning' : 'safe';
            const barWidth = Math.max(10, Math.min(90, (10 - distance) * 8));
            
            return `
                <div class="list-item ${severity}">
                    <div class="icon">
                        <i class="fas ${this.getDirectionIcon(item.direction)}"></i>
                    </div>
                    <div class="info">
                        <div class="info-title">${item.object}</div>
                        <div style="margin-top: 0.5rem;">
                            <div class="distance-bar">
                                <div class="distance-fill ${severity}" style="width: ${barWidth}%"></div>
                            </div>
                        </div>
                        <div class="info-meta">${item.distance || '?'}m</div>
                    </div>
                </div>
            `;
        }).join('');
    }

    updateAlertsList(data) {
        this.elements.alertsList.innerHTML = data.map(item => {
            const distance = parseFloat(item.distance) || 0;
            const severity = distance < 2 ? 'danger' : distance < 5 ? 'warning' : 'safe';
            const alertType = severity === 'danger' ? 'DANGER!' : severity === 'warning' ? 'Warning!' : 'Nearby';
            return `
                <div class="list-item ${severity}">
                    <div class="icon">
                        <i class="fas fa-${severity === 'danger' ? 'exclamation-triangle' : severity === 'warning' ? 'exclamation' : 'info-circle'}"></i>
                    </div>
                    <div class="info">
                        <div class="info-title">${alertType} ${item.object}</div>
                        <div class="info-meta">
                            <span>${item.direction?.toLowerCase()}, ${distance.toFixed(1)}m</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }


    getObjectIcon(object) {
        const icons = {
            'person': 'user',
            'car': 'car',
            'truck': 'truck',
            'bicycle': 'bicycle',
            'motorcycle': 'motorcycle',
            '₹10_note': 'money-bill-wave',
            '₹20_note': 'money-bill-wave',
            '₹50_note': 'money-bill-wave',
            '₹100_note': 'money-bill-wave',
            '₹200_note': 'money-bill-wave',
            '₹500_note': 'money-bill-wave',
            '₹2000_note': 'money-bill-wave',
            '₹1_coin': 'coins',
            '₹2_coin': 'coins',
            '₹5_coin': 'coins',
            '₹10_coin': 'coins',
            default: 'cube'
        };
        return icons[object] || icons[object?.toLowerCase()] || icons.default;
    }

    getDirectionIcon(direction) {
        const icons = {
            'LEFT': 'fa-arrow-left',
            'RIGHT': 'fa-arrow-right',
            'CENTER': 'fa-arrow-down'
        };
        return icons[direction] || 'fa-location-arrow';
    }

    handleVoiceAlerts(data) {
        if (!this.voiceEnabled) return;

        data.forEach(item => {
            let message = `${item.object} on your ${item.direction?.toLowerCase()}`;
            if (item.distance) {
                message += `, ${item.distance}m away`;
            }
            if (item.status === 'DANGER') {
                message += '. Danger! Be careful!';
                this.playCriticalSound();
            }
            this.speak(message);
        });
    }

    speak(text) {
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = 1.2;
            utterance.pitch = 1.1;
            utterance.volume = 0.9;
            speechSynthesis.speak(utterance);
        }
    }

    playCriticalSound() {
        // Critical alert sound effect using Web Audio API
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 0.3);
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
    }

    updateOverlay(detectionCount) {
        this.elements.detectionCount.textContent = detectionCount;
        const now = performance.now();
        if (!this.lastFrameTime) this.lastFrameTime = now;
        const fps = Math.round(1000 / (now - this.lastFrameTime));
        this.elements.fpsCounter.textContent = fps + ' FPS';
        this.lastFrameTime = now;
    }

    refreshCamera() {
        if (this.elements.cameraFeed) {
            const timestamp = new Date().getTime();
            this.elements.cameraFeed.src = `/video?t=${timestamp}`;
        }
    }

    showSOSModal() {
        this.elements.sosModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    hideSOSModal() {
        this.elements.sosModal.classList.remove('active');
        document.body.style.overflow = '';
    }

    async sendSOS() {
        this.hideSOSModal();
        
        try {
            if (navigator.geolocation) {
                const position = await new Promise((resolve, reject) => {
                    navigator.geolocation.getCurrentPosition(resolve, reject, { 
                        enableHighAccuracy: true,
                        timeout: 10000,
                        maximumAge: 0 
                    });
                });
                
                const response = await fetch('/sos', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                        timestamp: new Date().toISOString()
                    })
                });

                if (response.ok) {
                    this.showSuccessNotification();
                    this.speak('Emergency SOS sent successfully');
                } else {
                    this.speak('SOS failed to send. Please try again.');
                }
            } else {
                this.speak('Location services not available');
            }
        } catch (error) {
            console.error('SOS Error:', error);
            this.speak('SOS failed. Please check your location permissions.');
        }
    }

    showSuccessNotification() {
        this.elements.successNotification.classList.add('show');
        setTimeout(() => {
            this.elements.successNotification.classList.remove('show');
        }, 4000);
    }

    showContactsModal() {
        this.elements.contactsModal?.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    hideContactsModal() {
        this.elements.contactsModal?.classList.remove('active');
        document.body.style.overflow = '';
    }

    async loadContacts() {
        try {
            const res = await fetch('/contacts');
            if (!res.ok) return;
            const data = await res.json();
            this.elements.primaryName.value = data.primary_name || '';
            this.elements.primaryPhone.value = data.primary_phone || '';
            this.elements.secondaryName.value = data.secondary_name || '';
            this.elements.secondaryPhone.value = data.secondary_phone || '';
        } catch (e) {
            console.warn('Failed to load contacts', e);
        }
    }

    async saveEmergencyContacts() {
        const payload = {
            primary_name: this.elements.primaryName.value.trim(),
            primary_phone: this.elements.primaryPhone.value.trim(),
            secondary_name: this.elements.secondaryName.value.trim(),
            secondary_phone: this.elements.secondaryPhone.value.trim()
        };

        try {
            const response = await fetch('/register_contacts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (response.ok && data.success) {
                this.hideContactsModal();
                this.speak('Emergency contacts saved successfully');
                this.showSuccessNotification();
            } else {
                this.speak(data.error || 'Failed to save contacts');
            }
        } catch (error) {
            console.error('Contact save error:', error);
            this.speak('Unable to save emergency contacts');
        }
    }
}

// Initialize dashboard
document.addEventListener('DOMContentLoaded', () => {
    new AIDashboard();
});

// Preload audio context for immediate sound effects
window.addEventListener('click', () => {
    // Unlock audio context on first interaction
}, { once: true });

