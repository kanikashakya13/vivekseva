/**
 * VivekSeva - Accessibility Suite
 * Comprehensive inclusive accessibility controls:
 * - Text-To-Speech (Web Speech API)
 * - High Contrast Mode
 * - Font Size Scaling (Normal, Large, Extra Large)
 * - Dyslexia-Friendly Typography
 * - Simplified Language Mode (Step-by-step plain words)
 * - Screen Reader ARIA Live Region announcements
 */

class VivekAccessibilityManager {
  constructor() {
    this.speechSynth = window.speechSynthesis || null;
    this.currentUtterance = null;
    this.isSpeaking = false;
    
    // State defaults
    this.state = {
      highContrast: false,
      fontSize: "normal", // "normal", "large", "xlarge"
      dyslexicFont: false,
      simpleLanguage: false,
      soundAnnounce: true
    };

    this.init();
  }

  init() {
    // Load persisted preferences
    try {
      const saved = localStorage.getItem("vivekseva_a11y");
      if (saved) {
        this.state = Object.assign(this.state, JSON.parse(saved));
      }
    } catch (e) {
      console.warn("Could not load a11y preferences:", e);
    }

    this.applyState();
    this.setupLiveRegion();
  }

  save() {
    try {
      localStorage.setItem("vivekseva_a11y", JSON.stringify(this.state));
    } catch (e) {}
  }

  setupLiveRegion() {
    if (!document.getElementById("a11y-live-region")) {
      const liveRegion = document.createElement("div");
      liveRegion.id = "a11y-live-region";
      liveRegion.setAttribute("aria-live", "polite");
      liveRegion.setAttribute("aria-atomic", "true");
      liveRegion.className = "sr-only";
      document.body.appendChild(liveRegion);
    }
  }

  announce(message) {
    const region = document.getElementById("a11y-live-region");
    if (region) {
      region.textContent = "";
      setTimeout(() => {
        region.textContent = message;
      }, 50);
    }
  }

  applyState() {
    const body = document.body;
    if (!body) return;

    // High Contrast
    if (this.state.highContrast) {
      body.classList.add("high-contrast");
    } else {
      body.classList.remove("high-contrast");
    }

    // Font Scaling
    body.classList.remove("font-size-large", "font-size-xlarge");
    if (this.state.fontSize === "large") {
      body.classList.add("font-size-large");
    } else if (this.state.fontSize === "xlarge") {
      body.classList.add("font-size-xlarge");
    }

    // Dyslexic Font
    if (this.state.dyslexicFont) {
      body.classList.add("dyslexic-mode");
    } else {
      body.classList.remove("dyslexic-mode");
    }

    // Simplified Language
    if (this.state.simpleLanguage) {
      body.classList.add("simple-language-mode");
    } else {
      body.classList.remove("simple-language-mode");
    }

    this.updateControlsUI();
  }

  toggleHighContrast() {
    this.state.highContrast = !this.state.highContrast;
    this.applyState();
    this.save();
    this.announce(this.state.highContrast ? "High Contrast Mode enabled" : "High Contrast Mode disabled");
    return this.state.highContrast;
  }

  setFontSize(size) {
    this.state.fontSize = size;
    this.applyState();
    this.save();
    this.announce(`Text size set to ${size}`);
  }

  toggleDyslexicFont() {
    this.state.dyslexicFont = !this.state.dyslexicFont;
    this.applyState();
    this.save();
    this.announce(this.state.dyslexicFont ? "Readable dyslexia-friendly font enabled" : "Standard font enabled");
    return this.state.dyslexicFont;
  }

  toggleSimpleLanguage() {
    this.state.simpleLanguage = !this.state.simpleLanguage;
    this.applyState();
    this.save();
    this.announce(this.state.simpleLanguage ? "Simplified explanation mode enabled" : "Standard detailed mode enabled");
    return this.state.simpleLanguage;
  }

  speak(text) {
    if (!this.speechSynth) {
      alert("Text-to-speech is not supported in this browser.");
      return;
    }

    if (this.isSpeaking) {
      this.speechSynth.cancel();
      this.isSpeaking = false;
    }

    if (!text || text.trim() === "") return;

    this.currentUtterance = new SpeechSynthesisUtterance(text);
    this.currentUtterance.rate = 0.95; // Slightly slower for clarity
    this.currentUtterance.pitch = 1.0;

    this.currentUtterance.onstart = () => {
      this.isSpeaking = true;
      this.updateTTSButton(true);
    };

    this.currentUtterance.onend = () => {
      this.isSpeaking = false;
      this.updateTTSButton(false);
    };

    this.currentUtterance.onerror = () => {
      this.isSpeaking = false;
      this.updateTTSButton(false);
    };

    this.speechSynth.speak(this.currentUtterance);
  }

  stopSpeech() {
    if (this.speechSynth && this.isSpeaking) {
      this.speechSynth.cancel();
      this.isSpeaking = false;
      this.updateTTSButton(false);
    }
  }

  updateTTSButton(isSpeaking) {
    const btn = document.getElementById("tts-global-btn");
    if (btn) {
      if (isSpeaking) {
        btn.innerHTML = '<i class="fas fa-volume-mute mr-1.5 text-rose-500"></i> Stop Reading';
        btn.classList.add("bg-rose-50", "text-rose-700");
      } else {
        btn.innerHTML = '<i class="fas fa-volume-up mr-1.5 text-amber-600"></i> Read Aloud';
        btn.classList.remove("bg-rose-50", "text-rose-700");
      }
    }
  }

  updateControlsUI() {
    const contrastBtn = document.getElementById("btn-toggle-contrast");
    if (contrastBtn) {
      contrastBtn.setAttribute("aria-pressed", this.state.highContrast.toString());
      if (this.state.highContrast) {
        contrastBtn.classList.add("ring-2", "ring-amber-500");
      } else {
        contrastBtn.classList.remove("ring-2", "ring-amber-500");
      }
    }

    const simpleBtn = document.getElementById("btn-toggle-simple");
    if (simpleBtn) {
      simpleBtn.setAttribute("aria-pressed", this.state.simpleLanguage.toString());
      if (this.state.simpleLanguage) {
        simpleBtn.classList.add("bg-amber-100", "font-bold");
      } else {
        simpleBtn.classList.remove("bg-amber-100", "font-bold");
      }
    }
  }
}

// Global instance
if (typeof window !== "undefined") {
  window.vivekAccessibility = new VivekAccessibilityManager();
}
