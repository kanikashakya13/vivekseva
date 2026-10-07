/**
 * VivekSeva - Master Application Controller & Router
 * Inspired by Swami Vivekananda:
 * "Serve. Connect. Grow."
 * "Not your rank. Your growth."
 */

/**
 * VivekSeva - SafeStorage Helper
 * Handles localStorage with in-memory fallback for private browsing,
 * iframes, sandboxes, and CDN hosting environments like Netlify.
 */
class SafeStorage {
  constructor() {
    this.memoryStore = {};
    this.isAvailable = this.checkAvailability();
  }

  checkAvailability() {
    try {
      if (typeof window === "undefined" || !window.localStorage) return false;
      const testKey = "__vivek_storage_test__";
      window.localStorage.setItem(testKey, "1");
      window.localStorage.removeItem(testKey);
      return true;
    } catch (e) {
      return false;
    }
  }

  getItem(key) {
    if (this.isAvailable) {
      try {
        return window.localStorage.getItem(key);
      } catch (e) {
        // Fallback to memoryStore
      }
    }
    return Object.prototype.hasOwnProperty.call(this.memoryStore, key) ? this.memoryStore[key] : null;
  }

  setItem(key, value) {
    const strVal = String(value);
    if (this.isAvailable) {
      try {
        window.localStorage.setItem(key, strVal);
        return;
      } catch (e) {
        // Fallback to memoryStore
      }
    }
    this.memoryStore[key] = strVal;
  }

  removeItem(key) {
    if (this.isAvailable) {
      try {
        window.localStorage.removeItem(key);
      } catch (e) {
        // Fallback
      }
    }
    delete this.memoryStore[key];
  }
}

class VivekSevaApp {
  constructor() {
    this.storage = new SafeStorage();
    this.currentView = "landing";
    this.currentUser = null;
    this.currentActiveRole = "guest"; // 'helper', 'needer', or 'guest'
    this.db = null;
    this.activeModalHelperId = null;
    
    // Active UI interaction states
    this.activeChatRequestId = null;
    this.activeCallTimer = null;
    this.activeCallSeconds = 0;
    this.activeCallMuted = false;
    this.activeCallSpeaker = false;
    this.currentSelectedNeedCategory = "education";
    this.lastMatchResults = [];
    this.pendingCompletionRequestId = null;
    this.feedbackStarValue = 5;

    this.init();
  }

  init() {
    this.loadDatabase();
    this.initializeSession();
    this.setupGlobalHandlers();

    // Browser back/forward History API listener
    window.addEventListener("popstate", (event) => {
      if (event.state && event.state.view) {
        this.navigateTo(event.state.view, null, false);
      } else {
        this.handleRouteFromLocation(false);
      }
    });

    // Handle initial route from address bar or hash
    this.handleRouteFromLocation(false);
  }

  /* ========================================================
     DATABASE & STATE PERSISTENCE (SafeStorage / localStorage)
     ======================================================== */
  loadDatabase() {
    let saved = this.storage.getItem("vivekseva_db_v2");
    if (saved) {
      try {
        this.db = JSON.parse(saved);
      } catch (e) {
        console.error("Error parsing saved DB, resetting to defaults:", e);
        this.resetDatabase();
      }
    } else {
      this.resetDatabase();
    }
  }

  resetDatabase() {
    const defaultData = (typeof window !== "undefined" && window.VIVEK_DATA)
      ? window.VIVEK_DATA
      : ((typeof VIVEK_INITIAL_DATA !== "undefined") ? VIVEK_INITIAL_DATA : null);

    if (defaultData) {
      this.db = JSON.parse(JSON.stringify(defaultData));
      this.saveDatabase();
    } else {
      console.warn("VIVEK_DATA not available yet during resetDatabase");
    }
  }

  saveDatabase() {
    if (this.db) {
      this.storage.setItem("vivekseva_db_v2", JSON.stringify(this.db));
    }
  }


  /* ========================================================
     SESSION & USER MANAGEMENT
     ======================================================== */
  initializeSession() {
    const savedUserId = this.storage.getItem("vivekseva_session_user");
    if (savedUserId && this.db && this.db.users) {
      const user = this.db.users.find(u => u.id === savedUserId);
      if (user) {
        this.currentUser = user;
        this.currentActiveRole = user.currentActiveRole || user.roles[0];
        return;
      }
    }
    // Default demo session: Arjun Sharma (Helper)
    if (this.db && this.db.users && this.db.users.length > 0) {
      this.currentUser = this.db.users.find(u => u.id === "usr_helper_arjun") || this.db.users[0];
      this.currentActiveRole = this.currentUser.currentActiveRole || "helper";
      this.storage.setItem("vivekseva_session_user", this.currentUser.id);
    }
  }

  quickLogin(userId) {
    const user = this.db.users.find(u => u.id === userId);
    if (user) {
      this.currentUser = user;
      this.currentActiveRole = user.currentActiveRole || user.roles[0];
      this.storage.setItem("vivekseva_session_user", user.id);
      this.renderNavigation();
      this.navigateToHomeDashboard();
      this.showToast(`Switched active user to ${user.name} (${this.currentActiveRole.toUpperCase()})`, "success");
    }
  }

  switchActiveRole() {
    if (!this.currentUser || !this.currentUser.roles.includes("helper") || !this.currentUser.roles.includes("needer")) {
      this.showToast("This profile only has one assigned role.", "info");
      return;
    }

    // Toggle role
    this.currentActiveRole = (this.currentActiveRole === "helper") ? "needer" : "helper";
    this.currentUser.currentActiveRole = this.currentActiveRole;
    this.saveDatabase();

    this.renderNavigation();
    this.navigateToHomeDashboard();
    this.showToast(`Switched active view to ${this.currentActiveRole.toUpperCase()} mode`, "info");
  }

  logout(silent = false) {
    this.currentUser = null;
    this.currentActiveRole = "guest";
    this.storage.removeItem("vivekseva_session_user");
    this.renderNavigation();
    this.navigateTo("landing");
    if (!silent) {
      this.showToast("You have been safely logged out.", "info");
    }
  }

  navigateToHomeDashboard() {
    if (!this.currentUser) {
      this.navigateTo("landing");
    } else if (this.currentActiveRole === "helper") {
      this.navigateTo("helper-dashboard");
    } else {
      this.navigateTo("needer-dashboard");
    }
  }

  navigateToRequests() {
    if (!this.currentUser) {
      this.navigateTo("landing");
    } else if (this.currentActiveRole === "helper") {
      this.navigateTo("helper-requests");
    } else {
      this.navigateTo("needer-my-requests");
    }
  }

  /* ========================================================
     NAVIGATION & ROUTING (History API & SPA Router)
     ======================================================== */
  viewToPath(viewId) {
    const map = {
      "landing": "/home",
      "home": "/home",
      "seva-categories": "/seva-categories",
      "about": "/about",
      "ngos": "/communities-ngos",
      "help-support": "/help-support",
      "helper-dashboard": "/helper-dashboard",
      "needer-dashboard": "/needer-dashboard",
      "what-changes-in-you": "/what-changes-in-you",
      "helper-availability": "/helper-availability",
      "helper-requests": "/helper-requests",
      "helper-my-seva": "/helper-my-seva",
      "needer-find-help": "/find-help",
      "ai-matching-results": "/ai-matching",
      "needer-my-requests": "/my-requests",
      "service-history": "/service-history",
      "profile": "/profile",
      "achievements": "/achievements",
      "certificates": "/certificates"
    };
    return map[viewId] || `/${viewId}`;
  }

  pathToView(pathname) {
    if (!pathname) return "landing";
    // Normalize path
    const clean = pathname.toLowerCase().replace(/\/index\.html$/, '').replace(/\/+$/, '') || '/';
    const map = {
      "/": "landing",
      "/home": "landing",
      "/landing": "landing",
      "/seva-categories": "seva-categories",
      "/categories": "seva-categories",
      "/about": "about",
      "/communities-ngos": "ngos",
      "/ngos": "ngos",
      "/help-support": "help-support",
      "/support": "help-support",
      "/helper-dashboard": "helper-dashboard",
      "/needer-dashboard": "needer-dashboard",
      "/what-changes-in-you": "what-changes-in-you",
      "/growth": "what-changes-in-you",
      "/helper-availability": "helper-availability",
      "/helper-requests": "helper-requests",
      "/helper-my-seva": "helper-my-seva",
      "/find-help": "needer-find-help",
      "/needer-find-help": "needer-find-help",
      "/ai-matching": "ai-matching-results",
      "/ai-matching-results": "ai-matching-results",
      "/my-requests": "needer-my-requests",
      "/needer-my-requests": "needer-my-requests",
      "/service-history": "service-history",
      "/profile": "profile",
      "/achievements": "achievements",
      "/certificates": "certificates"
    };
    return map[clean] || null;
  }

  handleRouteFromLocation(pushState = false) {
    let targetView = this.pathToView(window.location.pathname);
    
    // Hash fallback support (e.g. #/about, #about, #seva-categories)
    if (!targetView && window.location.hash) {
      const hash = window.location.hash.replace(/^#\/?/, '').toLowerCase();
      targetView = this.pathToView(`/${hash}`) || (document.getElementById(`view-${hash}`) ? hash : null);
    }

    if (targetView && document.getElementById(`view-${targetView}`)) {
      this.navigateTo(targetView, null, pushState);
    } else {
      this.navigateTo("landing", null, pushState);
    }
  }

  navigateTo(viewId, params = null, pushState = true) {
    // Normalize aliases
    if (viewId === "home") viewId = "landing";
    if (viewId === "categories") viewId = "seva-categories";
    if (viewId === "communities-ngos") viewId = "ngos";

    this.currentView = viewId;
    window.scrollTo({ top: 0, behavior: "smooth" });

    // Update browser URL via History API
    if (pushState && typeof window !== "undefined" && window.history && window.history.pushState) {
      try {
        if (window.location.protocol !== "file:") {
          const targetPath = this.viewToPath(viewId);
          if (window.location.pathname !== targetPath) {
            window.history.pushState({ view: viewId }, "", targetPath);
          }
        }
      } catch (e) {
        console.warn("Could not pushState:", e);
      }
    }

    // Hide all view panels
    document.querySelectorAll(".view-panel").forEach(panel => {
      panel.classList.add("hidden");
    });

    // Show target view panel
    const targetPanel = document.getElementById(`view-${viewId}`);
    if (targetPanel) {
      targetPanel.classList.remove("hidden");
    } else {
      console.warn(`View panel #view-${viewId} not found, falling back to landing.`);
      document.getElementById("view-landing")?.classList.remove("hidden");
    }

    // Close mobile drawers
    document.getElementById("mobile-drawer")?.classList.add("hidden");
    document.getElementById("notifications-drawer")?.classList.add("hidden");

    this.renderNavigation();
    this.renderCurrentView(params);
  }

  renderNavigation() {
    const desktopNav = document.getElementById("desktop-nav-links");
    const mobileNav = document.getElementById("mobile-nav-links");
    const roleContainer = document.getElementById("nav-role-container");
    const notifContainer = document.getElementById("nav-notification-container");
    const authContainer = document.getElementById("nav-auth-container");

    if (!desktopNav || !mobileNav) return;

    let desktopHtml = "";
    let mobileHtml = "";

    // 1. GUEST PUBLIC NAVIGATION
    if (!this.currentUser) {
      if (roleContainer) roleContainer.innerHTML = "";
      if (notifContainer) notifContainer.classList.add("hidden");

      desktopHtml = `
        <button onclick="window.app.navigateTo('landing')" class="px-3 py-2 rounded-lg hover:text-saffron-700 ${this.currentView === 'landing' ? 'text-saffron-700 font-bold border-b-2 border-saffron-600' : ''}">Home</button>
        <button onclick="window.app.navigateTo('seva-categories')" class="px-3 py-2 rounded-lg hover:text-saffron-700 ${this.currentView === 'seva-categories' ? 'text-saffron-700 font-bold border-b-2 border-saffron-600' : ''}">Seva Categories</button>
        <button onclick="window.app.navigateTo('about')" class="px-3 py-2 rounded-lg hover:text-saffron-700 ${this.currentView === 'about' ? 'text-saffron-700 font-bold border-b-2 border-saffron-600' : ''}">About</button>
        <button onclick="window.app.navigateTo('ngos')" class="px-3 py-2 rounded-lg hover:text-saffron-700 ${this.currentView === 'ngos' ? 'text-saffron-700 font-bold border-b-2 border-saffron-600' : ''}">Communities &amp; NGOs</button>
        <button onclick="window.app.navigateTo('help-support')" class="px-3 py-2 rounded-lg hover:text-saffron-700 ${this.currentView === 'help-support' ? 'text-saffron-700 font-bold border-b-2 border-saffron-600' : ''}">Help &amp; Support</button>
      `;

      mobileHtml = `
        <button onclick="window.app.navigateTo('landing')" class="block w-full text-left py-2 px-3 rounded-lg hover:bg-amber-50">Home</button>
        <button onclick="window.app.navigateTo('seva-categories')" class="block w-full text-left py-2 px-3 rounded-lg hover:bg-amber-50">Seva Categories</button>
        <button onclick="window.app.navigateTo('about')" class="block w-full text-left py-2 px-3 rounded-lg hover:bg-amber-50">About VivekSeva</button>
        <button onclick="window.app.navigateTo('ngos')" class="block w-full text-left py-2 px-3 rounded-lg hover:bg-amber-50">Communities &amp; NGOs</button>
        <button onclick="window.app.navigateTo('help-support')" class="block w-full text-left py-2 px-3 rounded-lg hover:bg-amber-50">Help &amp; Support</button>
      `;

      if (authContainer) {
        authContainer.innerHTML = `
          <button onclick="window.app.openLoginModal()" class="px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors">
            Login
          </button>
          <button onclick="window.app.openSignUpModal()" class="px-3.5 py-1.5 rounded-xl bg-saffron-600 hover:bg-saffron-700 text-white text-xs font-bold transition-all shadow-xs">
            Sign Up
          </button>
        `;
      }
    } 
    // 2. HELPER NAVIGATION (Section 5)
    else if (this.currentActiveRole === "helper") {
      if (notifContainer) notifContainer.classList.remove("hidden");

      // Role switcher badge for dual-role users
      if (roleContainer) {
        const isDual = this.currentUser.roles.length > 1;
        roleContainer.innerHTML = `
          <span class="px-2.5 py-1 rounded-full bg-saffron-100 text-saffron-800 text-[11px] font-bold border border-saffron-300">
            <i class="fas fa-hand-holding-heart mr-1"></i> Helper
          </span>
          ${isDual ? `
            <button onclick="window.app.switchActiveRole()" class="px-2.5 py-1 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 text-[11px] font-bold border border-purple-200 transition-colors flex items-center" title="Switch to Needer Role">
              <i class="fas fa-repeat mr-1"></i> Switch to Needer
            </button>
          ` : ''}
        `;
      }

      desktopHtml = `
        <button onclick="window.app.navigateTo('helper-dashboard')" class="px-2.5 py-2 rounded-lg hover:text-saffron-700 ${this.currentView === 'helper-dashboard' ? 'text-saffron-700 font-bold border-b-2 border-saffron-600' : ''}">Dashboard</button>
        <button onclick="window.app.navigateTo('helper-availability')" class="px-2.5 py-2 rounded-lg hover:text-saffron-700 ${this.currentView === 'helper-availability' ? 'text-saffron-700 font-bold border-b-2 border-saffron-600' : ''}">My Availability</button>
        <button onclick="window.app.navigateTo('helper-requests')" class="px-2.5 py-2 rounded-lg hover:text-saffron-700 ${this.currentView === 'helper-requests' ? 'text-saffron-700 font-bold border-b-2 border-saffron-600' : ''}">Requests</button>
        <button onclick="window.app.navigateTo('helper-my-seva')" class="px-2.5 py-2 rounded-lg hover:text-saffron-700 ${this.currentView === 'helper-my-seva' ? 'text-saffron-700 font-bold border-b-2 border-saffron-600' : ''}">My Seva</button>
        <button onclick="window.app.navigateTo('what-changes-in-you')" class="px-2.5 py-2 rounded-lg text-saffron-800 bg-amber-50/80 hover:bg-amber-100 font-bold ${this.currentView === 'what-changes-in-you' ? 'border-b-2 border-saffron-600' : ''}">What Changes in You</button>
        <button onclick="window.app.navigateTo('seva-categories')" class="px-2 py-2 rounded-lg hover:text-saffron-700 ${this.currentView === 'seva-categories' ? 'text-saffron-700 font-bold border-b-2 border-saffron-600' : ''}">Categories</button>
        <button onclick="window.app.navigateTo('ngos')" class="px-2 py-2 rounded-lg hover:text-saffron-700 ${this.currentView === 'ngos' ? 'text-saffron-700 font-bold border-b-2 border-saffron-600' : ''}">NGOs</button>
        <button onclick="window.app.navigateTo('help-support')" class="px-2 py-2 rounded-lg hover:text-saffron-700 ${this.currentView === 'help-support' ? 'text-saffron-700 font-bold border-b-2 border-saffron-600' : ''}">Help</button>
      `;

      mobileHtml = `
        <button onclick="window.app.navigateTo('helper-dashboard')" class="block w-full text-left py-2 px-3 rounded-lg hover:bg-amber-50">Dashboard</button>
        <button onclick="window.app.navigateTo('helper-availability')" class="block w-full text-left py-2 px-3 rounded-lg hover:bg-amber-50">My Availability</button>
        <button onclick="window.app.navigateTo('helper-requests')" class="block w-full text-left py-2 px-3 rounded-lg hover:bg-amber-50">Requests</button>
        <button onclick="window.app.navigateTo('helper-my-seva')" class="block w-full text-left py-2 px-3 rounded-lg hover:bg-amber-50">My Seva Sessions</button>
        <button onclick="window.app.navigateTo('what-changes-in-you')" class="block w-full text-left py-2 px-3 rounded-lg bg-amber-50 text-saffron-800 font-bold">What Changes in You</button>
        <button onclick="window.app.navigateTo('seva-categories')" class="block w-full text-left py-2 px-3 rounded-lg hover:bg-amber-50">Seva Categories</button>
        <button onclick="window.app.navigateTo('ngos')" class="block w-full text-left py-2 px-3 rounded-lg hover:bg-amber-50">Communities &amp; NGOs</button>
        <button onclick="window.app.navigateTo('achievements')" class="block w-full text-left py-2 px-3 rounded-lg hover:bg-amber-50">Achievements</button>
        <button onclick="window.app.navigateTo('certificates')" class="block w-full text-left py-2 px-3 rounded-lg hover:bg-amber-50">Certificates</button>
        <button onclick="window.app.navigateTo('profile')" class="block w-full text-left py-2 px-3 rounded-lg hover:bg-amber-50">My Profile</button>
        <button onclick="window.app.navigateTo('service-history')" class="block w-full text-left py-2 px-3 rounded-lg hover:bg-amber-50">Service History</button>
        <button onclick="window.app.navigateTo('help-support')" class="block w-full text-left py-2 px-3 rounded-lg hover:bg-amber-50">Help &amp; Support</button>
        ${this.currentUser.roles.length > 1 ? `<button onclick="window.app.switchActiveRole()" class="block w-full text-left py-2 px-3 rounded-lg text-purple-700 font-bold"><i class="fas fa-repeat mr-1"></i> Switch to Needer Role</button>` : ''}
        <button onclick="window.app.logout()" class="block w-full text-left py-2 px-3 rounded-lg text-rose-700 font-bold">Logout</button>
      `;

      if (authContainer) {
        authContainer.innerHTML = `
          <div class="flex items-center space-x-2">
            <button onclick="window.app.navigateTo('profile')" class="flex items-center space-x-1.5 p-1 rounded-xl hover:bg-slate-100 transition-colors" title="My Profile">
              <img src="${this.currentUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'}" class="w-8 h-8 rounded-full object-cover border border-amber-300" alt="${this.currentUser.name}">
              <span class="text-xs font-bold text-navy-900 hidden sm:inline">${this.currentUser.name.split(' ')[0]}</span>
            </button>
            <button onclick="window.app.logout()" class="p-2 text-slate-500 hover:text-rose-600 transition-colors" title="Logout">
              <i class="fas fa-arrow-right-from-bracket"></i>
            </button>
          </div>
        `;
      }
    }
    // 3. NEEDER NAVIGATION (Section 5)
    else if (this.currentActiveRole === "needer") {
      if (notifContainer) notifContainer.classList.remove("hidden");

      if (roleContainer) {
        const isDual = this.currentUser.roles.length > 1;
        roleContainer.innerHTML = `
          <span class="px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 text-[11px] font-bold border border-blue-300">
            <i class="fas fa-hands-praying mr-1"></i> Needer
          </span>
          ${isDual ? `
            <button onclick="window.app.switchActiveRole()" class="px-2.5 py-1 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 text-[11px] font-bold border border-purple-200 transition-colors flex items-center" title="Switch to Helper Role">
              <i class="fas fa-repeat mr-1"></i> Switch to Helper
            </button>
          ` : ''}
        `;
      }

      desktopHtml = `
        <button onclick="window.app.navigateTo('needer-dashboard')" class="px-2.5 py-2 rounded-lg hover:text-saffron-700 ${this.currentView === 'needer-dashboard' ? 'text-saffron-700 font-bold border-b-2 border-saffron-600' : ''}">Dashboard</button>
        <button onclick="window.app.navigateTo('needer-my-requests')" class="px-2.5 py-2 rounded-lg hover:text-saffron-700 ${this.currentView === 'needer-my-requests' ? 'text-saffron-700 font-bold border-b-2 border-saffron-600' : ''}">My Requests</button>
        <button onclick="window.app.navigateTo('needer-find-help')" class="px-3 py-1.5 rounded-xl bg-saffron-600 hover:bg-saffron-700 text-white font-bold transition-all shadow-xs">
          <i class="fas fa-plus mr-1"></i> Find Help
        </button>
        <button onclick="window.app.navigateTo('seva-categories')" class="px-2 py-2 rounded-lg hover:text-saffron-700 ${this.currentView === 'seva-categories' ? 'text-saffron-700 font-bold border-b-2 border-saffron-600' : ''}">Categories</button>
        <button onclick="window.app.navigateTo('ngos')" class="px-2 py-2 rounded-lg hover:text-saffron-700 ${this.currentView === 'ngos' ? 'text-saffron-700 font-bold border-b-2 border-saffron-600' : ''}">NGOs</button>
        <button onclick="window.app.navigateTo('service-history')" class="px-2.5 py-2 rounded-lg hover:text-saffron-700 ${this.currentView === 'service-history' ? 'text-saffron-700 font-bold border-b-2 border-saffron-600' : ''}">History</button>
        <button onclick="window.app.navigateTo('help-support')" class="px-2.5 py-2 rounded-lg hover:text-saffron-700 ${this.currentView === 'help-support' ? 'text-saffron-700 font-bold border-b-2 border-saffron-600' : ''}">Help</button>
      `;

      mobileHtml = `
        <button onclick="window.app.navigateTo('needer-dashboard')" class="block w-full text-left py-2 px-3 rounded-lg hover:bg-amber-50">Dashboard</button>
        <button onclick="window.app.navigateTo('needer-find-help')" class="block w-full text-left py-2 px-3 rounded-lg bg-saffron-50 text-saffron-800 font-bold">+ Find Help</button>
        <button onclick="window.app.navigateTo('needer-my-requests')" class="block w-full text-left py-2 px-3 rounded-lg hover:bg-amber-50">My Requests</button>
        <button onclick="window.app.navigateTo('seva-categories')" class="block w-full text-left py-2 px-3 rounded-lg hover:bg-amber-50">Seva Categories</button>
        <button onclick="window.app.navigateTo('ngos')" class="block w-full text-left py-2 px-3 rounded-lg hover:bg-amber-50">Communities &amp; NGOs</button>
        <button onclick="window.app.navigateTo('service-history')" class="block w-full text-left py-2 px-3 rounded-lg hover:bg-amber-50">Service History</button>
        <button onclick="window.app.navigateTo('profile')" class="block w-full text-left py-2 px-3 rounded-lg hover:bg-amber-50">My Profile</button>
        <button onclick="window.app.navigateTo('help-support')" class="block w-full text-left py-2 px-3 rounded-lg hover:bg-amber-50">Help &amp; Support</button>
        ${this.currentUser.roles.length > 1 ? `<button onclick="window.app.switchActiveRole()" class="block w-full text-left py-2 px-3 rounded-lg text-purple-700 font-bold"><i class="fas fa-repeat mr-1"></i> Switch to Helper Role</button>` : ''}
        <button onclick="window.app.logout()" class="block w-full text-left py-2 px-3 rounded-lg text-rose-700 font-bold">Logout</button>
      `;

      if (authContainer) {
        authContainer.innerHTML = `
          <div class="flex items-center space-x-2">
            <button onclick="window.app.navigateTo('profile')" class="flex items-center space-x-1.5 p-1 rounded-xl hover:bg-slate-100 transition-colors" title="My Profile">
              <img src="${this.currentUser.avatar || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=100&q=80'}" class="w-8 h-8 rounded-full object-cover border border-blue-300" alt="${this.currentUser.name}">
              <span class="text-xs font-bold text-navy-900 hidden sm:inline">${this.currentUser.name.split(' ')[0]}</span>
            </button>
            <button onclick="window.app.logout()" class="p-2 text-slate-500 hover:text-rose-600 transition-colors" title="Logout">
              <i class="fas fa-arrow-right-from-bracket"></i>
            </button>
          </div>
        `;
      }
    }

    desktopNav.innerHTML = desktopHtml;
    mobileNav.innerHTML = mobileHtml;
    this.updateNotificationBadge();
  }

  /* ========================================================
     VIEW RENDERING ROUTER
     ======================================================== */
  renderCurrentView(params = null) {
    switch (this.currentView) {
      case "landing":
        this.renderLandingView();
        break;
      case "seva-categories":
        this.renderSevaCategoriesView();
        break;
      case "about":
        this.renderAboutView();
        break;
      case "helper-dashboard":
        this.renderHelperDashboard();
        break;
      case "needer-dashboard":
        this.renderNeederDashboard();
        break;
      case "helper-availability":
        this.renderHelperAvailability();
        break;
      case "helper-requests":
        this.renderHelperRequests();
        break;
      case "helper-my-seva":
        this.renderHelperMySeva();
        break;
      case "what-changes-in-you":
        this.renderWhatChangesInYou();
        break;
      case "achievements":
        this.renderAchievements();
        break;
      case "certificates":
        this.renderCertificates();
        break;
      case "needer-find-help":
        this.renderNeederFindHelp();
        break;
      case "ai-matching-results":
        this.renderAiMatchingResults();
        break;
      case "needer-my-requests":
        this.renderNeederMyRequests();
        break;
      case "service-history":
        this.renderServiceHistory();
        break;
      case "ngos":
        this.renderNgos();
        break;
      case "help-support":
        this.renderHelpSupport();
        break;
      case "profile":
        this.renderProfile();
        break;
      default:
        this.renderLandingView();
    }
  }

  /* ========================================================
     1. LANDING & SEVA CATEGORIES VIEWS
     ======================================================== */
  renderLandingView() {
    // 1. Render the 4 exact categories as SHORT preview cards
    const categoriesGrid = document.getElementById("landing-categories-cards-grid");
    if (categoriesGrid) {
      categoriesGrid.innerHTML = Object.values(this.db.categories).map(cat => `
        <div class="vs-card p-6 category-${cat.id} flex flex-col justify-between hover:border-saffron-400 transition-all bg-white shadow-xs">
          <div>
            <div class="w-12 h-12 rounded-2xl bg-${cat.color}-100 text-${cat.color}-700 flex items-center justify-center text-xl mb-4 shadow-inner">
              <i class="fas ${cat.icon}"></i>
            </div>
            <h3 class="text-lg font-bold text-navy-900">${cat.name}</h3>
            <p class="text-xs font-bold text-saffron-700 italic mt-0.5">“${cat.tagline}”</p>
            <p class="text-xs text-slate-600 mt-2.5 leading-relaxed line-clamp-3">${cat.description}</p>
          </div>

          <div class="mt-6 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <button onclick="window.app.navigateTo('seva-categories')" class="font-bold text-saffron-700 hover:text-saffron-900 flex items-center">
              <span>Explore Category</span>
              <i class="fas fa-arrow-right text-[10px] ml-1"></i>
            </button>
            <button onclick="window.app.startNeedRequestForCategory('${cat.id}')" class="font-bold text-navy-800 hover:text-navy-950">
              Request Help →
            </button>
          </div>
        </div>
      `).join('');
    }
  }

  renderSevaCategoriesView() {
    const container = document.getElementById("full-seva-categories-list");
    if (!container) return;

    const catDetails = {
      food: {
        examples: [
          "Nutritious cooked meal assistance for families in need",
          "Food grain & dry ration kit distribution",
          "Volunteering at community kitchens and temple food drives",
          "Connecting surplus food with local shelters"
        ],
        helperRoles: [
          "Food preparation & meal cooking",
          "Food collection & packaging",
          "Community distribution volunteering",
          "Transportation & ration delivery"
        ],
        neederGuidance: "Needers or community elders can request fresh meal packets or monthly grain kits. All requests are handled with absolute dignity and zero public exposure.",
        helperGuidance: "Helpers can volunteer individual hours, participate in weekend food distribution drives, or assist partner community kitchens.",
        quote: "They alone live who live for others, the rest are more dead than alive.",
        quoteSource: "Swami Vivekananda (Complete Works, Vol. 4)"
      },
      education: {
        examples: [
          "One-on-one school tutoring in Mathematics & Science",
          "Homework guidance & board exam preparation",
          "Foundational literacy & English reading for underprivileged children",
          "Basic computer learning and educational mentoring"
        ],
        helperRoles: [
          "Mathematics & Science tutoring",
          "Language & literacy coaching",
          "Academic guidance & doubt clearing",
          "School subject homework support"
        ],
        neederGuidance: "Students or parents can request free academic support in specific school subjects. Sessions are conducted either online or in person at safe community centers.",
        helperGuidance: "Educators, college students, and professionals can share knowledge for 1–3 hours weekly, empowering young minds toward self-reliance.",
        quote: "Education is the manifestation of the perfection already in man.",
        quoteSource: "Swami Vivekananda (Complete Works, Vol. 4)"
      },
      elderly: {
        examples: [
          "Respectful companionship, friendly conversation & storytelling",
          "Assistance with reading newspapers, letters, and holy texts",
          "Simple digital guidance (smartphone use, video calls with family, online bills)",
          "Gentle walking accompaniment & presence"
        ],
        helperRoles: [
          "Empathetic listening & compassionate companionship",
          "Reading aloud & writing assistance",
          "Basic daily non-medical assistance",
          "Patient digital assistance for simple tasks"
        ],
        neederGuidance: "Elderly citizens or family caregivers can request respectful human companionship. Note: VivekSeva provides social companionship, not professional medical care.",
        helperGuidance: "Offer the gift of your unhurried presence. Bring warmth, respect, and dignity into the life of an elderly community member.",
        quote: "They alone live who live for others, the rest are more dead than alive.",
        quoteSource: "Swami Vivekananda (Complete Works, Vol. 4)"
      },
      spiritual: {
        examples: [
          "Guided meditation & mindful breathing for inner calm",
          "Uplifting spiritual and philosophical discussions (universal Vedanta)",
          "Compassionate listening & positive companionship",
          "Motivational Speech in College / Educational Institution (youth motivation, character building, leadership, discipline, overcoming stress, living with purpose)",
          "Connecting seekers with suitable spiritual libraries & community sessions"
        ],
        helperRoles: [
          "College Motivational Speech & Youth Mentorship",
          "Character Building Workshop facilitation",
          "Student Stress Management & Positive Mindset",
          "Guided meditation & mindful well-being sessions",
          "Philosophical discussion & supportive companionship"
        ],
        neederGuidance: "Individuals can request calming meditation or spiritual discussion. Colleges, schools, and youth groups can request inspiring motivational sessions on purpose, character, and mental strength.",
        helperGuidance: "Philosophers, mentors, and inspirational speakers can guide sessions grounded in universal moral strength and Swami Vivekananda's message to the youth.",
        quote: "Purity, patience, and perseverance are the three essentials to success and, above all, love.",
        quoteSource: "Swami Vivekananda (Complete Works, Vol. 5)"
      }
    };

    container.innerHTML = Object.values(this.db.categories).map(cat => {
      const details = catDetails[cat.id] || {};
      const isSpiritual = cat.id === "spiritual";

      return `
        <div class="vs-card p-6 sm:p-8 bg-white border border-amber-200/90 rounded-3xl shadow-sm hover:border-saffron-400 transition-all flex flex-col justify-between">
          <div class="space-y-6">
            <!-- Header -->
            <div class="flex items-start justify-between gap-4">
              <div class="flex items-center space-x-4">
                <div class="w-14 h-14 rounded-2xl bg-${cat.color}-100 text-${cat.color}-700 flex items-center justify-center text-2xl shadow-inner">
                  <i class="fas ${cat.icon}"></i>
                </div>
                <div>
                  <h3 class="text-xl sm:text-2xl font-extrabold text-navy-900">${cat.name}</h3>
                  <p class="text-xs font-bold text-saffron-700 italic">“${cat.tagline}”</p>
                </div>
              </div>
            </div>

            <!-- Purpose -->
            <div class="space-y-1.5">
              <span class="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Purpose</span>
              <p class="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">${cat.description}</p>
            </div>

            ${isSpiritual ? `
              <!-- Special Highlight for Motivational Speech in College -->
              <div class="p-4 rounded-2xl bg-purple-50/80 border border-purple-200 space-y-2">
                <div class="flex items-center space-x-2 text-purple-900 font-bold text-xs uppercase tracking-wide">
                  <i class="fas fa-graduation-cap text-base text-purple-700"></i>
                  <span>Special Service: Motivational Speech in College / Youth Session</span>
                </div>
                <p class="text-xs text-purple-900 leading-relaxed">
                  Colleges and youth institutions can request verified speakers for sessions on <strong>youth motivation, character development, discipline, positive mindset, overcoming stress, and self-belief</strong> inspired by Swami Vivekananda's universal message to youth (non-religious).
                </p>
              </div>
            ` : ''}

            <!-- Example Ways to Serve -->
            <div class="space-y-2">
              <span class="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Example Ways to Serve &amp; Support:</span>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600">
                ${(details.examples || []).map(ex => `
                  <div class="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-start space-x-2">
                    <i class="fas fa-check text-saffron-600 text-[10px] mt-1 shrink-0"></i>
                    <span>${ex}</span>
                  </div>
                `).join('')}
              </div>
            </div>

            <!-- How Needer Requests & How Helper Serves -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div class="p-3.5 rounded-2xl bg-blue-50/50 border border-blue-100 space-y-1">
                <span class="text-[10px] font-bold text-blue-900 uppercase tracking-wider block">
                  <i class="fas fa-hands-praying mr-1"></i> For Needers
                </span>
                <p class="text-[11px] text-slate-600 leading-relaxed">${details.neederGuidance || ''}</p>
              </div>
              <div class="p-3.5 rounded-2xl bg-amber-50/50 border border-amber-100 space-y-1">
                <span class="text-[10px] font-bold text-amber-900 uppercase tracking-wider block">
                  <i class="fas fa-hand-holding-heart mr-1"></i> For Helpers
                </span>
                <p class="text-[11px] text-slate-600 leading-relaxed">${details.helperGuidance || ''}</p>
              </div>
            </div>

            <!-- Distributed Quote -->
            <div class="quote-card p-4 text-xs">
              <p class="font-serif-accent text-navy-900 italic leading-relaxed">“${details.quote}”</p>
              <p class="text-[10px] font-bold text-saffron-700 mt-1 text-right">— ${details.quoteSource}</p>
            </div>
          </div>

          <!-- Direct Category Actions -->
          <div class="pt-6 mt-6 border-t border-slate-100 flex flex-wrap gap-3">
            <button onclick="window.app.startNeedRequestForCategory('${cat.id}')" class="flex-1 min-w-[140px] py-2.5 rounded-xl bg-navy-900 hover:bg-navy-800 text-white font-bold text-xs transition-colors flex items-center justify-center space-x-1.5 shadow-xs">
              <i class="fas fa-hands-praying text-amber-400"></i>
              <span>${isSpiritual ? 'Request Spiritual / College Session' : `Request ${cat.name}`}</span>
            </button>
            <button onclick="window.app.quickOfferHelp('${cat.id}')" class="flex-1 min-w-[140px] py-2.5 rounded-xl bg-saffron-600 hover:bg-saffron-700 text-white font-bold text-xs transition-colors flex items-center justify-center space-x-1.5 shadow-xs">
              <i class="fas fa-hand-holding-heart"></i>
              <span>Offer Service in ${cat.name}</span>
            </button>
          </div>
        </div>
      `;
    }).join('');
  }

  quickOfferHelp(catId) {
    if (!this.currentUser) {
      this.openSignUpModal('helper');
      return;
    }
    if (!this.currentUser.roles.includes('helper')) {
      this.currentUser.roles.push('helper');
      this.currentActiveRole = 'helper';
      this.currentUser.currentActiveRole = 'helper';
    } else {
      this.currentActiveRole = 'helper';
      this.currentUser.currentActiveRole = 'helper';
    }
    if (!this.currentUser.categories) this.currentUser.categories = [];
    if (!this.currentUser.categories.includes(catId)) {
      this.currentUser.categories.push(catId);
    }
    this.saveDatabase();
    this.renderNavigation();
    this.navigateTo('helper-availability');
    this.showToast(`Category "${this.db.categories[catId]?.name || catId}" added to your helper profile!`, 'success');
  }

  quickRequestCategory(catId) {
    this.startNeedRequestForCategory(catId);
  }

  renderAboutView() {
    // About page content is cleanly pre-rendered in HTML with ethical charter,
    // core pillars, technology as pure connection, and verified inspiration.
  }

  /* ========================================================
     2. HELPER DASHBOARD & "WHAT CHANGES IN YOU"
     ======================================================== */
  renderHelperDashboard() {
    if (!this.currentUser) return;

    // Welcome title & Status
    const titleEl = document.getElementById("helper-welcome-title");
    if (titleEl) titleEl.textContent = `Welcome, ${this.currentUser.name}`;

    const statusBadge = document.getElementById("helper-status-badge");
    if (statusBadge) {
      const status = this.currentUser.availability?.status || "AVAILABLE NOW";
      statusBadge.textContent = status;
      statusBadge.className = `px-3 py-1 rounded-full text-xs font-bold ${
        status === "AVAILABLE NOW" ? "badge-available-now" :
        status === "AVAILABLE LATER" ? "badge-available-later" : "badge-not-available"
      }`;
    }

    // SIGNATURE SECTION: WHAT CHANGES IN YOU
    const growth = this.currentUser.growth || {
      level: 1, levelName: "Seva Beginner", points: 0, pointsToNextLevel: 250,
      servicesCompleted: 0, serviceHours: 0, peopleSupported: 0, consistencyWeeks: 1
    };

    document.getElementById("helper-growth-level-name").textContent = `LEVEL ${growth.level} — ${growth.levelName}`;
    document.getElementById("helper-growth-points").textContent = `${growth.points} POINTS`;
    document.getElementById("helper-points-needed-label").textContent = `${growth.pointsToNextLevel} points to Level ${growth.level + 1}`;

    // Level progress percentage
    const curLevelConfig = this.db.levels.find(l => l.level === growth.level) || this.db.levels[0];
    const nextLevelConfig = this.db.levels.find(l => l.level === growth.level + 1) || { minPoints: curLevelConfig.maxPoints };
    const levelRange = (nextLevelConfig.minPoints - curLevelConfig.minPoints) || 200;
    const progressInLevel = Math.max(0, growth.points - curLevelConfig.minPoints);
    const progressPercent = Math.min(100, Math.round((progressInLevel / levelRange) * 100));

    const progressBar = document.getElementById("helper-level-progress-bar");
    if (progressBar) progressBar.style.width = `${progressPercent}%`;

    const startLabel = document.getElementById("helper-progress-start-label");
    const endLabel = document.getElementById("helper-progress-end-label");
    if (startLabel) startLabel.textContent = `Level ${growth.level} (${curLevelConfig.minPoints} pts)`;
    if (endLabel) endLabel.textContent = `Level ${growth.level + 1} (${nextLevelConfig.minPoints} pts)`;

    // Personal Impact Statistics (Never compared to others!)
    const statsGrid = document.getElementById("helper-stats-grid");
    if (statsGrid) {
      statsGrid.innerHTML = `
        <div class="p-3 bg-white rounded-xl border border-slate-200">
          <span class="text-lg sm:text-xl font-extrabold text-navy-900 block">${growth.servicesCompleted}</span>
          <span class="text-[10px] font-bold text-slate-500 uppercase">Services</span>
        </div>
        <div class="p-3 bg-white rounded-xl border border-slate-200">
          <span class="text-lg sm:text-xl font-extrabold text-navy-900 block">${growth.serviceHours}</span>
          <span class="text-[10px] font-bold text-slate-500 uppercase">Hours</span>
        </div>
        <div class="p-3 bg-white rounded-xl border border-slate-200">
          <span class="text-lg sm:text-xl font-extrabold text-navy-900 block">${growth.peopleSupported}</span>
          <span class="text-[10px] font-bold text-slate-500 uppercase">People Supported</span>
        </div>
        <div class="p-3 bg-white rounded-xl border border-slate-200">
          <span class="text-lg sm:text-xl font-extrabold text-saffron-600 block">${growth.consistencyWeeks} Wks</span>
          <span class="text-[10px] font-bold text-slate-500 uppercase">Consistency</span>
        </div>
        <div class="p-3 bg-white rounded-xl border border-slate-200">
          <span class="text-lg sm:text-xl font-extrabold text-amber-600 block">${(this.currentUser.unlockedAchievements || []).length}</span>
          <span class="text-[10px] font-bold text-slate-500 uppercase">Achievements</span>
        </div>
        <div class="p-3 bg-white rounded-xl border border-slate-200">
          <span class="text-lg sm:text-xl font-extrabold text-emerald-600 block">${(this.currentUser.certificates || []).length}</span>
          <span class="text-[10px] font-bold text-slate-500 uppercase">Certificates</span>
        </div>
      `;
    }

    // Incoming requests for this helper
    this.renderHelperIncomingRequestsList();
    // Active ongoing sessions
    this.renderHelperActiveSessionsList();
  }

  renderHelperIncomingRequestsList() {
    const listEl = document.getElementById("helper-incoming-requests-list");
    if (!listEl) return;

    const incoming = this.db.requests.filter(r => 
      (r.assignedHelperId === this.currentUser.id || this.currentUser.categories?.includes(r.category)) &&
      (r.status === "REQUESTED")
    );

    if (incoming.length === 0) {
      listEl.innerHTML = `
        <div class="vs-card p-6 text-center text-xs text-slate-500 bg-white">
          <i class="fas fa-inbox text-2xl text-slate-300 block mb-2"></i>
          No new incoming requests right now. Your availability status is active and you will be notified when matched.
        </div>
      `;
      return;
    }

    listEl.innerHTML = incoming.map(req => {
      const cat = this.db.categories[req.category] || { name: req.category, color: "orange", icon: "fa-hand-holding" };
      return `
        <div class="vs-card p-5 bg-white border border-amber-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div class="space-y-1.5 flex-1">
            <div class="flex items-center space-x-2">
              <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-${cat.color}-100 text-${cat.color}-800">
                <i class="fas ${cat.icon} mr-1"></i> ${cat.name}
              </span>
              <span class="text-[10px] font-bold text-slate-400">Match: ${req.matchScore || 92}%</span>
            </div>
            <h4 class="text-sm font-bold text-navy-900">${req.title}</h4>
            <p class="text-xs text-slate-600 line-clamp-2">${req.description}</p>
            <div class="flex flex-wrap gap-3 text-[11px] text-slate-500 pt-1">
              <span><i class="fas fa-user mr-1 text-slate-400"></i> Requester: <strong>${req.neederName}</strong></span>
              <span><i class="fas fa-calendar mr-1 text-slate-400"></i> ${req.preferredDate} (${req.preferredTime})</span>
              <span><i class="fas fa-clock mr-1 text-slate-400"></i> ${req.duration}</span>
              <span><i class="fas fa-location-dot mr-1 text-slate-400"></i> ${req.approxLocation} (${req.serviceMode})</span>
            </div>
          </div>

          <div class="flex sm:flex-col gap-2 shrink-0 w-full sm:w-auto">
            <button onclick="window.app.handleAcceptRequest('${req.id}')" class="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-saffron-600 hover:bg-saffron-700 text-white text-xs font-bold shadow-xs">
              ACCEPT REQUEST
            </button>
            <button onclick="window.app.handleDeclineRequest('${req.id}')" class="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold">
              DECLINE
            </button>
          </div>
        </div>
      `;
    }).join('');
  }

  renderHelperActiveSessionsList() {
    const listEl = document.getElementById("helper-active-sessions-list");
    if (!listEl) return;

    const active = this.db.requests.filter(r => 
      r.assignedHelperId === this.currentUser.id &&
      (r.status === "ACCEPTED" || r.status === "SCHEDULED" || r.status === "IN PROGRESS")
    );

    if (active.length === 0) {
      listEl.innerHTML = `
        <div class="col-span-full vs-card p-6 text-center text-xs text-slate-500 bg-white">
          No ongoing service sessions currently in progress.
        </div>
      `;
      return;
    }

    listEl.innerHTML = active.map(req => {
      const cat = this.db.categories[req.category] || { name: req.category, color: "orange" };
      return `
        <div class="vs-card p-5 bg-white border border-amber-200 space-y-3">
          <div class="flex justify-between items-start">
            <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-${cat.color}-100 text-${cat.color}-800">
              ${cat.name}
            </span>
            <span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${req.status === 'IN PROGRESS' ? 'bg-emerald-100 text-emerald-800 animate-pulse' : 'bg-blue-100 text-blue-800'}">
              ${req.status}
            </span>
          </div>

          <h4 class="text-xs font-bold text-navy-900">${req.title}</h4>
          <p class="text-[11px] text-slate-600">Serving: <strong>${req.neederName}</strong> (${req.serviceMode})</p>
          <p class="text-[11px] text-slate-500"><i class="fas fa-calendar mr-1"></i> ${req.preferredDate} @ ${req.preferredTime}</p>

          <!-- Action Controls -->
          <div class="pt-3 border-t border-slate-100 flex flex-wrap gap-2">
            <button onclick="window.app.openChatModal('${req.id}')" class="px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-saffron-800 text-xs font-bold flex items-center space-x-1">
              <i class="fas fa-comment"></i> <span>Chat</span>
            </button>
            <button onclick="window.app.startPrivateCall('${req.id}')" class="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center space-x-1">
              <i class="fas fa-phone"></i> <span>Private Call</span>
            </button>
            <button onclick="window.app.openServiceCompletionModal('${req.id}')" class="ml-auto px-3 py-1.5 rounded-lg bg-saffron-600 hover:bg-saffron-700 text-white text-xs font-bold">
              Mark Complete
            </button>
          </div>
        </div>
      `;
    }).join('');
  }

  /* ========================================================
     3. HELPER AVAILABILITY PAGE (Section 10)
     ======================================================== */
  renderHelperAvailability() {
    if (!this.currentUser) return;
    const avail = this.currentUser.availability || { isAvailableNow: true, availableToday: true, isPaused: false, weeklySchedule: {} };

    const toggleNow = document.getElementById("toggle-avail-now");
    const toggleToday = document.getElementById("toggle-avail-today");
    const togglePause = document.getElementById("toggle-avail-pause");

    if (toggleNow) toggleNow.checked = !!avail.isAvailableNow;
    if (toggleToday) toggleToday.checked = !!avail.availableToday;
    if (togglePause) togglePause.checked = !!avail.isPaused;

    // Render Slots Container
    const slotsContainer = document.getElementById("availability-slots-container");
    if (!slotsContainer) return;

    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    const schedule = avail.weeklySchedule || {};

    slotsContainer.innerHTML = days.map(day => {
      const slots = schedule[day] || [];
      return `
        <div class="p-3.5 rounded-xl border border-slate-200 bg-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div class="w-28 font-bold text-xs text-navy-900">${day}</div>
          <div class="flex-1 flex flex-wrap gap-2">
            ${slots.length > 0 ? slots.map((s, index) => `
              <span class="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-amber-50 text-saffron-800 border border-amber-200 text-xs font-semibold">
                <i class="fas fa-clock mr-1 text-[10px]"></i> ${s.start} – ${s.end}
                <button onclick="window.app.deleteAvailabilitySlot('${day}', ${index})" class="ml-1.5 text-slate-400 hover:text-rose-600">×</button>
              </span>
            `).join('') : '<span class="text-xs text-slate-400 italic">No slots scheduled</span>'}
          </div>
          <button onclick="window.app.openAddSlotModal('${day}')" class="text-xs font-bold text-saffron-700 hover:underline">
            + Add Slot
          </button>
        </div>
      `;
    }).join('');
  }

  toggleHelperAvailability(type, isChecked) {
    if (!this.currentUser) return;
    if (!this.currentUser.availability) this.currentUser.availability = {};

    if (type === "now") {
      this.currentUser.availability.isAvailableNow = isChecked;
    } else if (type === "today") {
      this.currentUser.availability.availableToday = isChecked;
    } else if (type === "pause") {
      this.currentUser.availability.isPaused = isChecked;
    }

    // Determine status badge
    if (this.currentUser.availability.isPaused) {
      this.currentUser.availability.status = "NOT AVAILABLE";
    } else if (this.currentUser.availability.isAvailableNow) {
      this.currentUser.availability.status = "AVAILABLE NOW";
    } else if (this.currentUser.availability.availableToday) {
      this.currentUser.availability.status = "AVAILABLE LATER";
    } else {
      this.currentUser.availability.status = "NOT AVAILABLE";
    }

    this.saveDatabase();
    this.showToast(`Availability updated: ${this.currentUser.availability.status}`, "success");
    if (this.currentView === "helper-dashboard") this.renderHelperDashboard();
  }

  openAddSlotModal(defaultDay = "Monday") {
    const daySelect = document.getElementById("slot-day");
    if (daySelect && defaultDay) daySelect.value = defaultDay;
    this.openModal("modal-add-slot");
  }

  handleSaveSlot(e) {
    e.preventDefault();
    const day = document.getElementById("slot-day").value;
    const start = document.getElementById("slot-start").value;
    const end = document.getElementById("slot-end").value;

    if (!this.currentUser.availability.weeklySchedule) {
      this.currentUser.availability.weeklySchedule = {};
    }
    if (!this.currentUser.availability.weeklySchedule[day]) {
      this.currentUser.availability.weeklySchedule[day] = [];
    }

    this.currentUser.availability.weeklySchedule[day].push({ start, end });
    this.saveDatabase();
    this.closeModal("modal-add-slot");
    this.showToast(`Added ${day} time slot: ${start} – ${end}`, "success");
    this.renderHelperAvailability();
  }

  deleteAvailabilitySlot(day, index) {
    if (this.currentUser.availability?.weeklySchedule?.[day]) {
      this.currentUser.availability.weeklySchedule[day].splice(index, 1);
      this.saveDatabase();
      this.showToast(`Slot deleted for ${day}`, "info");
      this.renderHelperAvailability();
    }
  }

  /* ========================================================
     4. HELPER REQUESTS & LIFECYCLE
     ======================================================== */
  renderHelperRequests() {
    const listEl = document.getElementById("helper-requests-full-list");
    if (!listEl) return;

    const filter = this.helperRequestCurrentFilter || "all";
    let requests = this.db.requests.filter(r => 
      r.assignedHelperId === this.currentUser.id || this.currentUser.categories?.includes(r.category)
    );

    if (filter !== "all") {
      requests = requests.filter(r => r.status === filter);
    }

    if (requests.length === 0) {
      listEl.innerHTML = `<div class="vs-card p-8 text-center text-xs text-slate-500 bg-white">No requests found under '${filter}'.</div>`;
      return;
    }

    listEl.innerHTML = requests.map(req => {
      const cat = this.db.categories[req.category] || { name: req.category, color: "orange", icon: "fa-hands" };
      return `
        <div class="vs-card p-6 bg-white border border-amber-200 space-y-3">
          <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div class="flex items-center space-x-2">
              <span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-${cat.color}-100 text-${cat.color}-800">
                <i class="fas ${cat.icon} mr-1"></i> ${cat.name}
              </span>
              <span class="text-xs text-slate-400 font-mono">ID: ${req.id}</span>
            </div>
            <span class="px-2.5 py-0.5 rounded-full text-xs font-bold ${
              req.status === 'REQUESTED' ? 'bg-amber-100 text-amber-800' :
              req.status === 'ACCEPTED' || req.status === 'SCHEDULED' ? 'bg-blue-100 text-blue-800' :
              req.status === 'IN PROGRESS' ? 'bg-purple-100 text-purple-800 animate-pulse' :
              req.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
            }">${req.status}</span>
          </div>

          <h3 class="text-base font-bold text-navy-900">${req.title}</h3>
          <p class="text-xs text-slate-600 leading-relaxed">${req.description}</p>

          <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-slate-600 p-3 bg-slate-50 rounded-xl border border-slate-100">
            <div><span class="text-slate-400 block">Requester:</span> <strong>${req.neederName}</strong></div>
            <div><span class="text-slate-400 block">Preferred Date:</span> <strong>${req.preferredDate}</strong></div>
            <div><span class="text-slate-400 block">Timing:</span> <strong>${req.preferredTime}</strong></div>
            <div><span class="text-slate-400 block">Mode &amp; Area:</span> <strong>${req.serviceMode} (${req.approxLocation})</strong></div>
          </div>

          <!-- Action buttons based on status -->
          <div class="pt-2 flex flex-wrap gap-2">
            ${req.status === 'REQUESTED' ? `
              <button onclick="window.app.handleAcceptRequest('${req.id}')" class="px-4 py-2 rounded-xl bg-saffron-600 hover:bg-saffron-700 text-white text-xs font-bold shadow-xs">
                ACCEPT REQUEST
              </button>
              <button onclick="window.app.handleDeclineRequest('${req.id}')" class="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold">
                DECLINE
              </button>
            ` : req.status === 'COMPLETED' ? `
              <span class="text-xs text-emerald-700 font-bold flex items-center">
                <i class="fas fa-check-circle mr-1"></i> Completed (+${req.pointsAwarded || 120} points earned)
              </span>
            ` : `
              <button onclick="window.app.openChatModal('${req.id}')" class="px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-saffron-800 text-xs font-bold flex items-center space-x-1">
                <i class="fas fa-comment"></i> <span>Chat</span>
              </button>
              <button onclick="window.app.startPrivateCall('${req.id}')" class="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center space-x-1">
                <i class="fas fa-phone"></i> <span>Private Call</span>
              </button>
              <button onclick="window.app.openServiceCompletionModal('${req.id}')" class="px-4 py-1.5 rounded-lg bg-saffron-600 hover:bg-saffron-700 text-white text-xs font-bold">
                Mark Complete
              </button>
            `}
          </div>
        </div>
      `;
    }).join('');
  }

  filterHelperRequests(status) {
    this.helperRequestCurrentFilter = status;
    document.querySelectorAll("#helper-request-filter-tabs button").forEach(btn => {
      if (btn.getAttribute("data-filter") === status) {
        btn.className = "px-3 py-1.5 rounded-lg bg-saffron-600 text-white font-bold";
      } else {
        btn.className = "px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 font-bold";
      }
    });
    this.renderHelperRequests();
  }

  handleAcceptRequest(reqId) {
    const req = this.db.requests.find(r => r.id === reqId);
    if (!req) return;

    req.status = "ACCEPTED";
    req.assignedHelperId = this.currentUser.id;
    req.assignedHelperName = this.currentUser.name;

    // Create notification for needer
    this.addNotification({
      userId: req.neederId,
      title: "Request Accepted!",
      message: `${this.currentUser.name} accepted your seva request for ${req.title}. You can now message or call via the platform.`,
      type: "request",
      link: "needer-my-requests"
    });

    this.saveDatabase();
    this.showToast(`Accepted request "${req.title}"! Session scheduled.`, "success");
    this.renderCurrentView();
  }

  handleDeclineRequest(reqId) {
    const req = this.db.requests.find(r => r.id === reqId);
    if (!req) return;

    req.status = "DECLINED";

    // System automatically finds alternative suitable helpers for needer! (Section 11 & 16)
    const alternatives = window.VivekMatchingEngine.findMatches(req, this.db.users.filter(u => u.id !== this.currentUser.id));

    this.addNotification({
      userId: req.neederId,
      title: "Helper Unavailable - Alternative Matches Ready",
      message: `${this.currentUser.name} was unavailable, but the system found ${alternatives.length} other registered helpers for you.`,
      type: "request",
      link: "needer-my-requests"
    });

    this.saveDatabase();
    this.showToast("Request declined politely. (No penalty). Alternative helpers suggested to requester.", "info");
    this.renderCurrentView();

    // If active user is Needer or viewing as Needer, open alternative modal
    if (this.currentActiveRole === "needer") {
      this.showAlternativeHelpersModal(alternatives, req);
    }
  }

  showAlternativeHelpersModal(alternatives, req) {
    const container = document.getElementById("alternative-helpers-list-container");
    if (!container) return;

    if (alternatives.length === 0) {
      container.innerHTML = `<p class="text-slate-500 italic">No direct alternative found right now. Please adjust time or contact support.</p>`;
    } else {
      container.innerHTML = alternatives.map(match => `
        <div class="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
          <div class="flex items-center space-x-3">
            <img src="${match.helper.avatar}" class="w-10 h-10 rounded-full object-cover">
            <div>
              <h4 class="font-bold text-navy-900">${match.helper.name}</h4>
              <p class="text-[10px] text-slate-500">${match.helper.location} • Match ${match.score}%</p>
            </div>
          </div>
          <button onclick="window.app.reassignRequestToHelper('${req.id}', '${match.helper.id}')" class="px-3 py-1.5 bg-saffron-600 text-white rounded-lg font-bold text-xs hover:bg-saffron-700">
            Request Help
          </button>
        </div>
      `).join('');
    }
    this.openModal("modal-alternative-helpers");
  }

  reassignRequestToHelper(reqId, helperId) {
    const req = this.db.requests.find(r => r.id === reqId);
    const helper = this.db.users.find(u => u.id === helperId);
    if (!req || !helper) return;

    req.status = "REQUESTED";
    req.assignedHelperId = helper.id;
    req.assignedHelperName = helper.name;

    this.addNotification({
      userId: helper.id,
      title: "New Re-matched Seva Request",
      message: `${req.neederName} requested assistance: ${req.title}`,
      type: "request",
      link: "helper-requests"
    });

    this.saveDatabase();
    this.closeModal("modal-alternative-helpers");
    this.showToast(`Request sent to ${helper.name}!`, "success");
    this.renderCurrentView();
  }

  renderHelperMySeva() {
    this.renderHelperActiveSessionsList();
    const container = document.getElementById("helper-my-seva-sessions-list");
    const activeSessionsEl = document.getElementById("helper-active-sessions-list");
    if (container && activeSessionsEl) {
      container.innerHTML = activeSessionsEl.innerHTML;
    }
  }

  /* ========================================================
     5. SIGNATURE SECTION: WHAT CHANGES IN YOU (Section 24)
     ======================================================== */
  renderWhatChangesInYou() {
    if (!this.currentUser) return;
    const growth = this.currentUser.growth || {
      level: 3, levelName: "Dedicated Helper", points: 720, pointsToNextLevel: 80,
      servicesCompleted: 18, serviceHours: 27, peopleSupported: 12, consistencyWeeks: 6,
      categoryCounts: { education: 9, food: 5, elderly: 4, spiritual: 0 },
      reflections: []
    };

    document.getElementById("wciy-current-level").textContent = `Level ${growth.level} — ${growth.levelName}`;
    document.getElementById("wciy-current-points").textContent = growth.points;
    document.getElementById("wciy-current-services").textContent = growth.servicesCompleted;
    document.getElementById("wciy-current-hours").textContent = growth.serviceHours;
    document.getElementById("wciy-current-people").textContent = growth.peopleSupported;
    document.getElementById("wciy-next-level").textContent = `Level ${growth.level + 1} — ${this.db.levels.find(l => l.level === growth.level + 1)?.name || 'Next Horizon'}`;
    document.getElementById("wciy-remaining-points").textContent = growth.pointsToNextLevel;

    // Visual Personal Journey (Level 1 -> Level 2 -> Level 3 -> Level 4 -> Level 5)
    const stepper = document.getElementById("wciy-levels-stepper");
    if (stepper) {
      stepper.innerHTML = this.db.levels.map(lvl => {
        const isCurrent = lvl.level === growth.level;
        const isCompleted = lvl.level < growth.level;
        return `
          <div class="p-3.5 rounded-2xl border text-center space-y-1.5 ${
            isCurrent ? 'bg-saffron-50 border-saffron-500 shadow-sm ring-2 ring-saffron-400' :
            isCompleted ? 'bg-amber-50/50 border-amber-300' : 'bg-slate-50 border-slate-200 opacity-60'
          }">
            <div class="text-2xl">${lvl.badge}</div>
            <span class="text-[10px] font-extrabold uppercase tracking-wider block ${isCurrent ? 'text-saffron-800' : 'text-slate-500'}">Level ${lvl.level}</span>
            <h4 class="text-xs font-bold text-navy-900">${lvl.name}</h4>
            <span class="text-[10px] font-semibold text-slate-400 block">${lvl.minPoints}+ pts</span>
            ${isCurrent ? '<span class="inline-block px-2 py-0.5 rounded-full bg-saffron-600 text-white text-[9px] font-extrabold uppercase mt-1">You Are Here</span>' : ''}
          </div>
        `;
      }).join('');
    }

    // Category impact breakdown
    const categoryGrid = document.getElementById("wciy-category-breakdown-grid");
    if (categoryGrid) {
      categoryGrid.innerHTML = Object.values(this.db.categories).map(cat => {
        const count = growth.categoryCounts?.[cat.id] || 0;
        return `
          <div class="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <div class="w-8 h-8 rounded-lg bg-${cat.color}-100 text-${cat.color}-700 flex items-center justify-center text-sm font-bold">
              <i class="fas ${cat.icon}"></i>
            </div>
            <h4 class="text-xs font-bold text-navy-900 pt-1">${cat.name}</h4>
            <span class="text-lg font-extrabold text-navy-900 block">${count} <span class="text-[10px] font-normal text-slate-500">services</span></span>
          </div>
        `;
      }).join('');
    }

    // Personal Reflection Journal notes
    const reflContainer = document.getElementById("wciy-reflections-container");
    if (reflContainer) {
      const notes = growth.reflections || [];
      if (notes.length === 0) {
        reflContainer.innerHTML = `<p class="text-xs text-slate-400 italic">No reflection notes recorded yet. Record your realizations after any service.</p>`;
      } else {
        reflContainer.innerHTML = notes.map((note, idx) => `
          <div class="p-3 bg-white rounded-xl border border-amber-200 text-xs text-slate-700 flex items-start space-x-2.5">
            <i class="fas fa-feather-pointed text-saffron-600 text-sm mt-0.5"></i>
            <div class="flex-1">
              <p class="italic">“${note}”</p>
              <span class="text-[10px] text-slate-400 block mt-1 font-semibold">Seva Reflection #${notes.length - idx}</span>
            </div>
          </div>
        `).join('');
      }
    }
  }

  addPersonalReflection() {
    const input = document.getElementById("input-new-reflection");
    if (!input || !input.value.trim()) return;

    if (!this.currentUser.growth.reflections) this.currentUser.growth.reflections = [];
    this.currentUser.growth.reflections.unshift(input.value.trim());
    input.value = "";
    this.saveDatabase();
    this.showToast("Reflection preserved in your personal journal.", "success");
    this.renderWhatChangesInYou();
  }

  /* ========================================================
     6. ACHIEVEMENTS & CERTIFICATES (Section 25 & 26)
     ======================================================== */
  renderAchievements() {
    if (!this.currentUser) return;
    const unlockedIds = this.currentUser.unlockedAchievements || [];

    const countEl = document.getElementById("achievements-unlocked-count");
    if (countEl) countEl.textContent = `${unlockedIds.length} / ${this.db.achievements.length}`;

    const grid = document.getElementById("achievements-master-grid");
    if (!grid) return;

    grid.innerHTML = this.db.achievements.map(ach => {
      const isUnlocked = unlockedIds.includes(ach.id);
      return `
        <div class="vs-card p-5 ${isUnlocked ? 'bg-white border-amber-300 shadow-sm' : 'bg-slate-50 border-slate-200 opacity-60'} space-y-3">
          <div class="flex justify-between items-start">
            <div class="w-12 h-12 rounded-2xl ${isUnlocked ? 'bg-amber-100 text-amber-700' : 'bg-slate-200 text-slate-400'} flex items-center justify-center text-xl">
              <i class="fas ${ach.icon}"></i>
            </div>
            <span class="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${isUnlocked ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-500'}">
              ${isUnlocked ? 'UNLOCKED' : 'LOCKED'}
            </span>
          </div>

          <div>
            <h4 class="text-sm font-bold text-navy-900">${ach.title}</h4>
            <p class="text-xs text-slate-500 mt-1">${ach.description}</p>
          </div>

          <div class="pt-2 border-t border-slate-100 flex justify-between text-[11px] font-semibold text-slate-500">
            <span>Points: +${ach.pointsReward} pts</span>
            <span class="${isUnlocked ? 'text-emerald-700 font-bold' : 'text-slate-400'}">${isUnlocked ? 'Completed' : ach.condition}</span>
          </div>
        </div>
      `;
    }).join('');
  }

  renderCertificates() {
    if (!this.currentUser) return;
    const certs = this.currentUser.certificates || [];
    const grid = document.getElementById("certificates-list-grid");
    if (!grid) return;

    if (certs.length === 0) {
      grid.innerHTML = `
        <div class="col-span-full vs-card p-8 text-center text-xs text-slate-500 bg-white">
          <i class="fas fa-certificate text-3xl text-slate-300 block mb-2"></i>
          Complete milestones (such as your 1st Seva or 10 Services) to automatically generate and unlock certificates of service.
        </div>
      `;
      return;
    }

    grid.innerHTML = certs.map(c => `
      <div class="vs-card p-6 bg-gradient-to-br from-amber-50/50 to-white border-2 border-amber-300 space-y-4">
        <div class="flex justify-between items-start">
          <div class="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-lg">
            <i class="fas fa-certificate"></i>
          </div>
          <span class="font-mono text-[10px] font-bold text-slate-400">${c.id}</span>
        </div>

        <div>
          <span class="text-[10px] font-bold text-saffron-700 uppercase">${c.milestone}</span>
          <h3 class="text-base font-bold text-navy-900">${c.title}</h3>
          <p class="text-xs text-slate-600 mt-1 leading-relaxed">${c.contribution}</p>
        </div>

        <div class="pt-3 border-t border-amber-200/70 flex justify-between items-center text-xs">
          <span class="text-slate-400 text-[11px]">Issued: ${c.date}</span>
          <button onclick="window.app.previewCertificate('${c.id}')" class="px-3.5 py-1.5 rounded-lg bg-saffron-600 hover:bg-saffron-700 text-white font-bold text-xs shadow-xs">
            View / Print Certificate
          </button>
        </div>
      </div>
    `).join('');
  }

  previewCertificate(certId) {
    const cert = (this.currentUser.certificates || []).find(c => c.id === certId);
    if (!cert) return;

    document.getElementById("cert-helper-name").textContent = this.currentUser.name;
    document.getElementById("cert-title-badge").textContent = cert.title;
    document.getElementById("cert-contribution-text").textContent = cert.contribution;
    document.getElementById("cert-date-text").textContent = cert.date;
    document.getElementById("cert-id-text").textContent = cert.id;

    this.openModal("modal-certificate");
  }

  /* ========================================================
     7. NEEDER DASHBOARD & CREATE NEED WIZARD
     ======================================================== */
  renderNeederDashboard() {
    if (!this.currentUser) return;
    const title = document.getElementById("needer-welcome-title");
    if (title) title.textContent = `Welcome, ${this.currentUser.name}`;

    // 4 Category Cards
    const catGrid = document.getElementById("needer-categories-grid");
    if (catGrid) {
      catGrid.innerHTML = Object.values(this.db.categories).map(cat => `
        <div class="vs-card p-5 category-${cat.id} cursor-pointer hover:border-saffron-400 transition-all bg-white" onclick="window.app.startNeedRequestForCategory('${cat.id}')">
          <div class="w-10 h-10 rounded-xl bg-${cat.color}-100 text-${cat.color}-700 flex items-center justify-center text-lg mb-3">
            <i class="fas ${cat.icon}"></i>
          </div>
          <h4 class="text-sm font-bold text-navy-900">${cat.name}</h4>
          <p class="text-[11px] text-slate-500 mt-1">${cat.tagline}</p>
          <span class="mt-3 inline-block text-[11px] font-bold text-saffron-700">Request Support →</span>
        </div>
      `).join('');
    }

    // Active requests list
    const activeList = document.getElementById("needer-active-requests-list");
    if (activeList) {
      const myReqs = this.db.requests.filter(r => r.neederId === this.currentUser.id && r.status !== "COMPLETED" && r.status !== "CANCELLED");
      if (myReqs.length === 0) {
        activeList.innerHTML = `
          <div class="vs-card p-6 text-center text-xs text-slate-500 bg-white">
            You do not have any active requests at this moment. Click “I Need Help” above whenever you need assistance.
          </div>
        `;
      } else {
        activeList.innerHTML = myReqs.map(req => {
          const cat = this.db.categories[req.category] || { name: req.category, color: "orange" };
          return `
            <div class="vs-card p-5 bg-white border border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div class="space-y-1.5 flex-1">
                <div class="flex items-center space-x-2">
                  <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-${cat.color}-100 text-${cat.color}-800">${cat.name}</span>
                  <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">${req.status}</span>
                </div>
                <h4 class="text-sm font-bold text-navy-900">${req.title}</h4>
                <p class="text-xs text-slate-600">${req.description}</p>
                <div class="text-[11px] text-slate-400">
                  Helper: <strong>${req.assignedHelperName || 'Searching for Match...'}</strong> • Timing: ${req.preferredDate} (${req.preferredTime})
                </div>
              </div>

              <div class="flex flex-wrap gap-2 w-full md:w-auto">
                ${req.status === 'ACCEPTED' || req.status === 'SCHEDULED' || req.status === 'IN PROGRESS' ? `
                  <button onclick="window.app.openChatModal('${req.id}')" class="px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-saffron-800 text-xs font-bold">Chat</button>
                  <button onclick="window.app.startPrivateCall('${req.id}')" class="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold">Call</button>
                ` : ''}
                <button onclick="window.app.cancelNeedRequest('${req.id}')" class="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-rose-600 text-xs font-semibold">Cancel</button>
              </div>
            </div>
          `;
        }).join('');
      }
    }
  }

  quickRequestCategory(catId) {
    if (!this.currentUser) {
      this.openSignUpModal('needer');
      return;
    }
    this.startNeedRequestForCategory(catId);
  }

  startNeedRequestForCategory(catId) {
    this.currentSelectedNeedCategory = catId;
    this.navigateTo("needer-find-help");
  }

  renderNeederFindHelp() {
    // 1. Render Category Radio Buttons
    const catContainer = document.getElementById("need-wizard-category-selection");
    if (catContainer) {
      catContainer.innerHTML = Object.values(this.db.categories).map(cat => {
        const isSelected = cat.id === this.currentSelectedNeedCategory;
        return `
          <div onclick="window.app.selectNeedCategory('${cat.id}')" class="p-3 rounded-xl border text-center cursor-pointer transition-all ${
            isSelected ? 'border-saffron-600 bg-saffron-50/80 shadow-xs ring-2 ring-saffron-500' : 'border-slate-200 bg-white hover:border-slate-300'
          }">
            <i class="fas ${cat.icon} text-lg text-${cat.color}-600 block mb-1"></i>
            <span class="text-xs font-bold text-navy-900 block">${cat.name}</span>
          </div>
        `;
      }).join('');
    }

    // 2. Render Dynamic Category-Specific Fields (Section 13)
    const dynamicFields = document.getElementById("need-wizard-dynamic-category-fields");
    if (!dynamicFields) return;

    const cat = this.currentSelectedNeedCategory;
    if (cat === "education") {
      dynamicFields.innerHTML = `
        <h5 class="text-xs font-bold text-blue-900 uppercase tracking-wide">Education Seva Specifics</h5>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label class="block text-[11px] font-bold text-slate-600 mb-1">Subject *</label>
            <input type="text" id="cat-edu-subject" value="Mathematics & Science" class="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs">
          </div>
          <div>
            <label class="block text-[11px] font-bold text-slate-600 mb-1">Age / Grade Level</label>
            <input type="text" id="cat-edu-level" value="Class 10 Secondary" class="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs">
          </div>
          <div>
            <label class="block text-[11px] font-bold text-slate-600 mb-1">Type of Help</label>
            <input type="text" id="cat-edu-help" value="Homework & Exam Preparation" class="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs">
          </div>
        </div>
      `;
    } else if (cat === "food") {
      dynamicFields.innerHTML = `
        <h5 class="text-xs font-bold text-orange-900 uppercase tracking-wide">Food Seva Specifics</h5>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label class="block text-[11px] font-bold text-slate-600 mb-1">Assistance Type *</label>
            <select id="cat-food-type" class="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs">
              <option value="Ration/basic food support">Ration/basic food support</option>
              <option value="Meal assistance">Meal assistance</option>
              <option value="Food distribution">Food distribution</option>
              <option value="Community food drive">Community food drive</option>
            </select>
          </div>
          <div>
            <label class="block text-[11px] font-bold text-slate-600 mb-1">Number of People *</label>
            <input type="text" id="cat-food-people" value="2 people" class="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs">
          </div>
          <div>
            <label class="block text-[11px] font-bold text-slate-600 mb-1">Preferred Timing</label>
            <input type="text" id="cat-food-timing" value="Morning 10:00 AM" class="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs">
          </div>
        </div>
      `;
    } else if (cat === "elderly") {
      dynamicFields.innerHTML = `
        <h5 class="text-xs font-bold text-amber-900 uppercase tracking-wide">Elderly Support Specifics (Non-Medical)</h5>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label class="block text-[11px] font-bold text-slate-600 mb-1">Assistance Type *</label>
            <select id="cat-elderly-type" class="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs">
              <option value="Companionship">Companionship & Storytelling</option>
              <option value="Reading/writing assistance">Reading/writing assistance</option>
              <option value="Basic daily assistance">Basic daily assistance</option>
              <option value="Help with simple digital tasks">Help with simple digital tasks</option>
              <option value="Accompanying support">Accompanying support</option>
            </select>
          </div>
          <div>
            <label class="block text-[11px] font-bold text-slate-600 mb-1">Preferred Timing</label>
            <input type="text" id="cat-elderly-timing" value="Afternoon 4:00 PM - 6:00 PM" class="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs">
          </div>
          <div>
            <label class="block text-[11px] font-bold text-slate-600 mb-1">Preferred Duration</label>
            <input type="text" id="cat-elderly-duration" value="2 hours" class="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs">
          </div>
        </div>
      `;
    } else if (cat === "spiritual") {
      const selectedType = this.currentSpiritualNeedType || "Motivational Speech in College";
      const isCollegeSpeech = selectedType === "Motivational Speech in College";

      dynamicFields.innerHTML = `
        <div class="flex justify-between items-center pb-2 border-b border-purple-200/60">
          <h5 class="text-xs font-bold text-purple-900 uppercase tracking-wide">
            Spiritual Support &amp; Youth Guidance Specifics
          </h5>
          <span class="text-[10px] font-semibold text-purple-700 bg-purple-100 px-2.5 py-0.5 rounded-full">Universal &amp; Non-Religious</span>
        </div>

        <div class="space-y-3">
          <div>
            <label class="block text-[11px] font-bold text-slate-700 mb-1">Select Service Type *</label>
            <select id="cat-spiritual-type" onchange="window.app.handleSpiritualTypeChange(this.value)" class="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold bg-white focus:border-purple-500 focus:outline-hidden">
              <option value="Motivational Speech in College" ${isCollegeSpeech ? "selected" : ""}>Motivational Speech in College / Youth Session</option>
              <option value="Meditation" ${selectedType === "Meditation" ? "selected" : ""}>Guided Meditation &amp; Mindful Breathing</option>
              <option value="Spiritual discussion" ${selectedType === "Spiritual discussion" ? "selected" : ""}>Spiritual Discussion &amp; Universal Philosophy</option>
              <option value="Positive companionship" ${selectedType === "Positive companionship" ? "selected" : ""}>Positive Companionship &amp; Well-Being</option>
            </select>
          </div>

          ${isCollegeSpeech ? `
            <!-- Dedicated College Motivational Speech Fields -->
            <div class="p-4 rounded-xl bg-purple-50/70 border border-purple-200 space-y-3">
              <div class="flex items-center space-x-2 text-purple-900 text-xs font-bold">
                <i class="fas fa-graduation-cap text-purple-700 text-sm"></i>
                <span>College / Youth Motivation Event Details</span>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label class="block text-[11px] font-bold text-slate-700 mb-1">College / Educational Institution Name *</label>
                  <input type="text" id="cat-spiritual-college-name" placeholder="e.g. National College of Engineering, Delhi" value="Delhi Youth Leadership College" class="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs bg-white">
                </div>
                <div>
                  <label class="block text-[11px] font-bold text-slate-700 mb-1">Topic / Focus Area *</label>
                  <select id="cat-spiritual-topic" class="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs bg-white font-medium">
                    <option value="Youth Motivation & Purpose">Youth Motivation &amp; Purpose</option>
                    <option value="Character Building & Discipline">Character Building &amp; Discipline</option>
                    <option value="Mindset & Stress Management">Mindset &amp; Stress Management</option>
                    <option value="Leadership & Self-Belief">Leadership &amp; Self-Belief</option>
                    <option value="Swami Vivekananda's Message for Modern Youth">Swami Vivekananda's Message for Modern Youth</option>
                    <option value="Other Youth Development Theme">Other Youth Development Theme</option>
                  </select>
                </div>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label class="block text-[11px] font-bold text-slate-700 mb-1">Expected Audience Size *</label>
                  <select id="cat-spiritual-audience-size" class="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs bg-white">
                    <option value="50 - 100 students">50 – 100 students</option>
                    <option value="100 - 300 students" selected>100 – 300 students</option>
                    <option value="300 - 500 students">300 – 500 students</option>
                    <option value="500+ students">500+ students (Auditorium)</option>
                  </select>
                </div>
                <div>
                  <label class="block text-[11px] font-bold text-slate-700 mb-1">Session Duration *</label>
                  <select id="cat-spiritual-duration" class="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs bg-white">
                    <option value="45 minutes">45 minutes</option>
                    <option value="60 minutes" selected>60 minutes</option>
                    <option value="90 minutes">90 minutes</option>
                    <option value="Half-day workshop (3 hours)">Half-day workshop (3 hours)</option>
                  </select>
                </div>
                <div>
                  <label class="block text-[11px] font-bold text-slate-700 mb-1">Mode *</label>
                  <select id="cat-spiritual-speech-mode" class="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs bg-white">
                    <option value="In-Person (Offline on campus)">In-Person (Offline on campus)</option>
                    <option value="Online (Virtual session)">Online (Virtual session)</option>
                  </select>
                </div>
              </div>

              <div>
                <label class="block text-[11px] font-bold text-slate-700 mb-1">Approximate Location / City / College Campus</label>
                <input type="text" id="cat-spiritual-campus-loc" placeholder="e.g. North Campus, Delhi" value="North Campus, New Delhi" class="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs bg-white">
              </div>
            </div>
          ` : `
            <!-- Standard Spiritual / Meditation Fields -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block text-[11px] font-bold text-slate-600 mb-1">Preferred Timing</label>
                <input type="text" id="cat-spiritual-timing" value="Morning 08:00 AM" class="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs">
              </div>
              <div>
                <label class="block text-[11px] font-bold text-slate-600 mb-1">Preferred Delivery</label>
                <input type="text" id="cat-spiritual-mode" value="Virtual Audio/Video Call" class="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs">
              </div>
            </div>
          `}
        </div>
      `;
    }

    // Set default date
    const dateInput = document.getElementById("need-input-date");
    if (dateInput && !dateInput.value) {
      const today = new Date().toISOString().split('T')[0];
      dateInput.value = today;
    }
  }

  handleSpiritualTypeChange(type) {
    this.currentSpiritualNeedType = type;
    this.renderNeederFindHelp();
  }

  selectNeedCategory(catId) {
    this.currentSelectedNeedCategory = catId;
    this.renderNeederFindHelp();
  }

  /* ========================================================
     8. AI MATCHING EXECUTION (Section 14)
     ======================================================== */
  submitNeedRequestAndMatch() {
    const desc = document.getElementById("need-input-description").value.trim();
    const date = document.getElementById("need-input-date").value;
    const time = document.getElementById("need-input-time").value.trim() || "Flexible Timing";
    const duration = document.getElementById("need-input-duration").value;
    const mode = document.getElementById("need-input-mode").value;
    const location = document.getElementById("need-input-location").value.trim() || (this.currentUser?.location || "Local Area");

    if (!desc) {
      this.showToast("Please provide a brief description of what you need.", "error");
      return;
    }

    let finalTitle = `${this.db.categories[this.currentSelectedNeedCategory]?.name || 'Support'} for ${this.currentUser?.name || 'Community Member'}`;
    let categoryFields = {};
    let approxLoc = location;
    let serviceMode = mode;
    let finalDesc = desc;

    if (this.currentSelectedNeedCategory === "spiritual") {
      const type = document.getElementById("cat-spiritual-type")?.value || "Motivational Speech in College";
      if (type === "Motivational Speech in College") {
        const collegeName = document.getElementById("cat-spiritual-college-name")?.value.trim() || "Educational Institution";
        const topic = document.getElementById("cat-spiritual-topic")?.value || "Youth Motivation & Purpose";
        const audienceSize = document.getElementById("cat-spiritual-audience-size")?.value || "100 - 300 students";
        const durationSp = document.getElementById("cat-spiritual-duration")?.value || "60 minutes";
        const speechMode = document.getElementById("cat-spiritual-speech-mode")?.value || "In-Person (Offline on campus)";
        const campusLoc = document.getElementById("cat-spiritual-campus-loc")?.value.trim() || location;

        finalTitle = `Motivational Speech: ${topic} at ${collegeName}`;
        finalDesc = `College Motivational Youth Session at ${collegeName}. Topic: ${topic}. Expected Audience: ${audienceSize}. Duration: ${durationSp}. Mode: ${speechMode}. Notes: ${desc}`;
        categoryFields = { collegeName, topic, audienceSize, duration: durationSp, speechMode, campusLoc };
        approxLoc = campusLoc;
        serviceMode = speechMode.includes("Offline") ? "OFFLINE" : (speechMode.includes("Online") ? "ONLINE" : "BOTH");
      }
    }

    // Create temporary need object to evaluate
    const needRequest = {
      id: `REQ-${Date.now().toString().slice(-6)}`,
      neederId: this.currentUser?.id || "guest_needer",
      neederName: this.currentUser?.name || "Person Seeking Support",
      category: this.currentSelectedNeedCategory,
      title: finalTitle,
      description: finalDesc,
      preferredDate: date,
      preferredTime: time,
      duration: duration,
      serviceMode: serviceMode,
      approxLocation: approxLoc,
      categoryFields: categoryFields,
      status: "REQUESTED",
      createdAt: new Date().toISOString()
    };

    this.pendingNeedRequest = needRequest;

    // Run AI Matching against registered helpers pool
    const helpersPool = this.db.users.filter(u => u.roles.includes("helper"));
    const matches = window.VivekMatchingEngine.findMatches(needRequest, helpersPool);
    this.lastMatchResults = matches;

    // Navigate to AI results screen
    this.navigateTo("ai-matching-results");
  }

  renderAiMatchingResults() {
    const container = document.getElementById("ai-matches-cards-container");
    const fallback = document.getElementById("ai-matches-fallback-card");
    if (!container) return;

    if (!this.lastMatchResults || this.lastMatchResults.length === 0) {
      container.innerHTML = "";
      if (fallback) fallback.classList.remove("hidden");
      return;
    }

    if (fallback) fallback.classList.add("hidden");

    container.innerHTML = this.lastMatchResults.map(match => {
      const helper = match.helper;
      const cat = this.db.categories[this.pendingNeedRequest?.category || "education"];

      return `
        <div class="vs-card p-6 bg-white border border-amber-200 hover:border-saffron-400 transition-all space-y-4">
          <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div class="flex items-center space-x-4">
              <img src="${helper.avatar}" alt="${helper.name}" class="w-16 h-16 rounded-2xl object-cover border-2 border-saffron-300 shadow-xs">
              <div>
                <div class="flex items-center space-x-2">
                  <h3 class="text-base font-bold text-navy-900">${helper.name}</h3>
                  <span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    helper.availability?.status === 'AVAILABLE NOW' ? 'badge-available-now' :
                    helper.availability?.status === 'AVAILABLE LATER' ? 'badge-available-later' : 'badge-not-available'
                  }">${helper.availability?.status || 'AVAILABLE'}</span>
                </div>
                <p class="text-xs text-slate-500">${helper.location} • <span class="font-semibold text-saffron-700">${helper.serviceMode}</span></p>
                <div class="flex items-center space-x-2 text-[11px] text-slate-600 mt-1">
                  <span><strong>${helper.growth?.servicesCompleted || 0}</strong> completed services</span>
                  <span>•</span>
                  <span><strong>Level ${helper.growth?.level || 1}</strong> (${helper.growth?.levelName || 'Sevak'})</span>
                </div>
              </div>
            </div>

            <!-- Match Score Badge -->
            <div class="text-right sm:text-right w-full sm:w-auto">
              <span class="text-2xl font-extrabold text-saffron-600">${match.score}%</span>
              <span class="text-[10px] font-bold text-slate-400 block uppercase">Alignment Score</span>
            </div>
          </div>

          <!-- Matching reasons -->
          <div class="p-3 bg-amber-50/60 rounded-xl border border-amber-200/70 text-xs text-slate-700">
            <span class="font-bold text-saffron-800 text-[11px] uppercase block mb-1">Why this Helper was Matched:</span>
            <ul class="space-y-0.5 text-[11px]">
              ${match.reasons.map(r => `<li><i class="fas fa-check text-emerald-600 mr-1.5"></i> ${r}</li>`).join('')}
            </ul>
          </div>

          <!-- Helper Skills Chips -->
          <div class="flex flex-wrap gap-1.5">
            ${(helper.skills || []).map(s => `<span class="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-semibold">${s}</span>`).join('')}
          </div>

          <!-- Action Buttons -->
          <div class="pt-3 border-t border-slate-100 flex justify-end space-x-3">
            <button onclick="window.app.openHelperPublicProfile('${helper.id}')" class="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50">
              VIEW PROFILE
            </button>
            <button onclick="window.app.sendNeedRequestToHelper('${helper.id}')" class="px-6 py-2 rounded-xl bg-saffron-600 hover:bg-saffron-700 text-white text-xs font-bold shadow-md">
              REQUEST HELP
            </button>
          </div>
        </div>
      `;
    }).join('');
  }

  sendNeedRequestToHelper(helperId) {
    const helper = this.db.users.find(u => u.id === helperId);
    if (!helper || !this.pendingNeedRequest) return;

    const newReq = { ...this.pendingNeedRequest };
    newReq.assignedHelperId = helper.id;
    newReq.assignedHelperName = helper.name;
    newReq.matchScore = this.lastMatchResults.find(m => m.helper.id === helperId)?.score || 95;

    // Add to requests collection
    this.db.requests.unshift(newReq);

    // Add notification to helper
    this.addNotification({
      userId: helper.id,
      title: "New Seva Request Matched",
      message: `${newReq.neederName} requested assistance: ${newReq.title}`,
      type: "request",
      link: "helper-requests"
    });

    this.saveDatabase();
    this.showToast(`Request sent to ${helper.name}! Helper has been notified.`, "success");
    this.navigateTo("needer-my-requests");
  }

  openHelperPublicProfile(helperId) {
    const helper = this.db.users.find(u => u.id === helperId);
    if (!helper) return;

    this.activeModalHelperId = helperId;

    document.getElementById("helper-modal-name").textContent = helper.name;
    document.getElementById("helper-modal-avatar").src = helper.avatar;
    document.getElementById("helper-modal-location").textContent = helper.location;
    document.getElementById("helper-modal-status").textContent = helper.availability?.status || "AVAILABLE";
    document.getElementById("helper-modal-intro").textContent = helper.intro || "Dedicated helper on VivekSeva.";
    document.getElementById("helper-modal-mode").textContent = helper.serviceMode || "BOTH";
    document.getElementById("helper-modal-completed").textContent = helper.growth?.servicesCompleted || 0;
    document.getElementById("helper-modal-level").textContent = `Level ${helper.growth?.level || 1} (${helper.growth?.levelName || 'Sevak'})`;

    const catChips = document.getElementById("helper-modal-categories-chips");
    if (catChips) {
      catChips.innerHTML = (helper.categories || []).map(c => `
        <span class="px-2 py-0.5 rounded-full bg-amber-100 text-saffron-800 text-[10px] font-bold uppercase">${c}</span>
      `).join('');
    }

    const skillChips = document.getElementById("helper-modal-skills-chips");
    if (skillChips) {
      skillChips.innerHTML = (helper.skills || []).map(s => `
        <span class="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-semibold">${s}</span>
      `).join('');
    }

    const requestBtn = document.getElementById("helper-modal-request-btn");
    if (requestBtn) {
      requestBtn.onclick = () => {
        this.requestHelperFromProfile();
      };
    }

    this.openModal("modal-helper-profile");
  }

  requestHelperFromProfile() {
    if (this.activeModalHelperId) {
      const helperId = this.activeModalHelperId;
      this.closeModal("modal-helper-profile");
      this.sendNeedRequestToHelper(helperId);
    }
  }

  cancelNeedRequest(reqId) {
    const req = this.db.requests.find(r => r.id === reqId);
    if (!req) return;
    req.status = "CANCELLED";
    this.saveDatabase();
    this.showToast("Request cancelled.", "info");
    this.renderCurrentView();
  }

  renderNeederMyRequests() {
    this.renderNeederDashboard();
    const activeList = document.getElementById("needer-active-requests-list");
    const fullList = document.getElementById("needer-my-requests-full-list");
    if (fullList && activeList) {
      fullList.innerHTML = activeList.innerHTML;
    }
  }

  /* ========================================================
     9. IN-APP SECURE MESSAGING (Section 17)
     ======================================================== */
  openChatModal(reqId) {
    const req = this.db.requests.find(r => r.id === reqId);
    if (!req) return;

    this.activeChatRequestId = reqId;
    const partnerName = (this.currentUser.id === req.neederId) ? req.assignedHelperName : req.neederName;
    document.getElementById("chat-header-name").textContent = partnerName;
    document.getElementById("chat-header-avatar").textContent = (partnerName || "P").charAt(0);

    this.renderChatMessages();
    this.openModal("modal-chat");
  }

  renderChatMessages() {
    const scrollArea = document.getElementById("chat-messages-scroll-area");
    if (!scrollArea || !this.activeChatRequestId) return;

    const messages = this.db.chats[this.activeChatRequestId] || [];

    if (messages.length === 0) {
      scrollArea.innerHTML = `
        <div class="text-center py-8 text-slate-400">
          <i class="fas fa-comments text-2xl block mb-1"></i>
          <p>No messages yet. Start your respectful conversation below.</p>
        </div>
      `;
      return;
    }

    scrollArea.innerHTML = messages.map(msg => {
      const isMe = msg.senderId === this.currentUser?.id;
      return `
        <div class="flex flex-col ${isMe ? 'items-end' : 'items-start'}">
          <span class="text-[10px] text-slate-400 mb-0.5">${msg.senderName}</span>
          <div class="max-w-[80%] p-3 rounded-2xl ${isMe ? 'chat-bubble-me' : 'chat-bubble-them'} text-xs shadow-xs">
            ${msg.text}
          </div>
          <span class="text-[9px] text-slate-400 mt-0.5">
            ${new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      `;
    }).join('');

    scrollArea.scrollTop = scrollArea.scrollHeight;
  }

  handleSendMessage(e) {
    e.preventDefault();
    const input = document.getElementById("chat-input-text");
    if (!input || !input.value.trim() || !this.activeChatRequestId) return;

    this.postChatMessage(input.value.trim());
    input.value = "";
  }

  sendQuickReply(text) {
    if (!this.activeChatRequestId) return;
    this.postChatMessage(text);
  }

  postChatMessage(text) {
    if (!this.db.chats[this.activeChatRequestId]) {
      this.db.chats[this.activeChatRequestId] = [];
    }

    const newMsg = {
      id: `msg_${Date.now()}`,
      senderId: this.currentUser?.id || "guest",
      senderName: this.currentUser?.name || "User",
      text: text,
      timestamp: new Date().toISOString(),
      isRead: false
    };

    this.db.chats[this.activeChatRequestId].push(newMsg);
    this.saveDatabase();
    this.renderChatMessages();

    // Auto simulated response from partner for realistic interactive feel
    const req = this.db.requests.find(r => r.id === this.activeChatRequestId);
    if (req) {
      const partnerId = (this.currentUser.id === req.neederId) ? req.assignedHelperId : req.neederId;
      const partnerName = (this.currentUser.id === req.neederId) ? req.assignedHelperName : req.neederName;

      setTimeout(() => {
        const partnerReplies = [
          "Namaste! Thank you for the update. Looking forward to our session.",
          "Received! That time works wonderfully.",
          "Pranam, yes I have prepared everything with utmost care.",
          "Understood! Thank you for your warmth."
        ];
        const replyText = partnerReplies[Math.floor(Math.random() * partnerReplies.length)];

        this.db.chats[this.activeChatRequestId].push({
          id: `msg_${Date.now()}`,
          senderId: partnerId,
          senderName: partnerName,
          text: replyText,
          timestamp: new Date().toISOString(),
          isRead: true
        });
        this.saveDatabase();
        this.renderChatMessages();
      }, 1200);
    }
  }

  /* ========================================================
     10. IN-APP PRIVATE CALL INTERFACE (Section 18)
     ======================================================== */
  startPrivateCall(reqId) {
    const req = this.db.requests.find(r => r.id === reqId);
    if (!req) return;

    const partnerName = (this.currentUser.id === req.neederId) ? req.assignedHelperName : req.neederName;
    document.getElementById("call-partner-name").textContent = partnerName;
    document.getElementById("call-status-label").textContent = "Connecting through platform...";
    document.getElementById("call-timer-display").textContent = "00:00";

    this.activeCallSeconds = 0;
    this.activeCallMuted = false;
    this.activeCallSpeaker = false;

    this.openModal("modal-private-call");

    // Simulate connection after 1.5s
    setTimeout(() => {
      document.getElementById("call-status-label").textContent = "Connected • Secure Platform Call";
      this.activeCallTimer = setInterval(() => {
        this.activeCallSeconds++;
        const mins = String(Math.floor(this.activeCallSeconds / 60)).padStart(2, '0');
        const secs = String(this.activeCallSeconds % 60).padStart(2, '0');
        const timerEl = document.getElementById("call-timer-display");
        if (timerEl) timerEl.textContent = `${mins}:${secs}`;
      }, 1000);
    }, 1500);
  }

  startPrivateCallFromCurrentChat() {
    if (this.activeChatRequestId) {
      this.closeModal("modal-chat");
      this.startPrivateCall(this.activeChatRequestId);
    }
  }

  toggleCallMute() {
    this.activeCallMuted = !this.activeCallMuted;
    const btn = document.getElementById("btn-call-mute");
    if (btn) {
      btn.className = `w-12 h-12 rounded-full ${this.activeCallMuted ? 'bg-amber-600' : 'bg-slate-800'} text-white flex items-center justify-center text-lg transition-colors`;
    }
    this.showToast(this.activeCallMuted ? "Microphone muted" : "Microphone unmuted", "info");
  }

  toggleCallSpeaker() {
    this.activeCallSpeaker = !this.activeCallSpeaker;
    const btn = document.getElementById("btn-call-speaker");
    if (btn) {
      btn.className = `w-12 h-12 rounded-full ${this.activeCallSpeaker ? 'bg-amber-600' : 'bg-slate-800'} text-white flex items-center justify-center text-lg transition-colors`;
    }
    this.showToast(this.activeCallSpeaker ? "Speakerphone on" : "Speakerphone off", "info");
  }

  endPrivateCall() {
    if (this.activeCallTimer) {
      clearInterval(this.activeCallTimer);
      this.activeCallTimer = null;
    }
    this.closeModal("modal-private-call");
    this.showToast(`Call ended (${this.activeCallSeconds}s duration). Phone numbers remained completely masked.`, "info");
  }

  /* ========================================================
     11. SERVICE COMPLETION & POINT/LEVEL CALCULATION (Section 19, 22, 23, 42)
     ======================================================== */
  openServiceCompletionModal(reqId) {
    const req = this.db.requests.find(r => r.id === reqId);
    if (!req) return;

    this.pendingCompletionRequestId = reqId;
    req.status = "COMPLETED";

    // Award Points (+100 base, +20 dedication)
    const pointsToAdd = 120;
    req.pointsAwarded = pointsToAdd;

    // Update Helper growth
    const helper = this.db.users.find(u => u.id === req.assignedHelperId) || this.currentUser;
    if (helper && helper.growth) {
      helper.growth.points += pointsToAdd;
      helper.growth.servicesCompleted += 1;
      helper.growth.serviceHours += 2;
      helper.growth.peopleSupported += 1;

      // Update Category count
      if (!helper.growth.categoryCounts) helper.growth.categoryCounts = {};
      helper.growth.categoryCounts[req.category] = (helper.growth.categoryCounts[req.category] || 0) + 1;

      // Check level promotion
      this.checkLevelPromotion(helper);
      // Check achievements unlock
      this.checkAchievementUnlocks(helper);
    }

    this.saveDatabase();

    // Populate modal preview
    document.getElementById("completion-summary-text").textContent = `Service "${req.title}" has been successfully completed with honor and dignity.`;
    document.getElementById("completion-growth-note").textContent = `• Updated: ${helper.growth.servicesCompleted} completed services | ${helper.growth.points} total points | Level ${helper.growth.level} (${helper.growth.levelName})`;

    this.openModal("modal-completion-screen");
  }

  checkLevelPromotion(helper) {
    const points = helper.growth.points;
    let newLevel = 1;

    for (const lvl of this.db.levels) {
      if (points >= lvl.minPoints) {
        newLevel = lvl.level;
      }
    }

    if (newLevel > helper.growth.level) {
      const oldLevel = helper.growth.level;
      helper.growth.level = newLevel;
      const lvlConfig = this.db.levels.find(l => l.level === newLevel);
      helper.growth.levelName = lvlConfig.name;

      this.addNotification({
        userId: helper.id,
        title: `Character Growth: Reached Level ${newLevel}!`,
        message: `Congratulations on stepping into Level ${newLevel} (${lvlConfig.name}). “Character is repeated habits.”`,
        type: "level",
        link: "what-changes-in-you"
      });
      this.showToast(`Congratulations! You progressed to Level ${newLevel} (${lvlConfig.name})!`, "success");
    }

    // Points to next level
    const nextLvl = this.db.levels.find(l => l.level === helper.growth.level + 1);
    if (nextLvl) {
      helper.growth.pointsToNextLevel = Math.max(0, nextLvl.minPoints - points);
    } else {
      helper.growth.pointsToNextLevel = 0;
    }
  }

  checkAchievementUnlocks(helper) {
    const unlocked = helper.unlockedAchievements || [];
    const growth = helper.growth;

    // Conditions check
    if (growth.servicesCompleted >= 1 && !unlocked.includes("ach_first_seva")) {
      unlocked.push("ach_first_seva");
      this.addCertificate(helper, "First Seva", "Certificate of Seva Initiation", "Stepped forward into the noble path of selfless community service.");
    }
    if (growth.servicesCompleted >= 5 && !unlocked.includes("ach_5_services")) {
      unlocked.push("ach_5_services");
    }
    if (growth.servicesCompleted >= 10 && !unlocked.includes("ach_10_services")) {
      unlocked.push("ach_10_services");
      this.addCertificate(helper, "10 Services Milestone", "Certificate of Dedicated Seva", "Completed 10 community seva sessions with humility and patience.");
    }
    if (growth.servicesCompleted >= 25 && !unlocked.includes("ach_25_services")) {
      unlocked.push("ach_25_services");
      this.addCertificate(helper, "25 Services Milestone", "Certificate of Seva Champion", "Exemplary 25 acts of community transformation and service.");
    }
    if ((growth.categoryCounts?.food || 0) >= 3 && !unlocked.includes("ach_food_seva")) {
      unlocked.push("ach_food_seva");
    }
    if ((growth.categoryCounts?.education || 0) >= 3 && !unlocked.includes("ach_edu_seva")) {
      unlocked.push("ach_edu_seva");
    }
    if ((growth.categoryCounts?.elderly || 0) >= 3 && !unlocked.includes("ach_elderly")) {
      unlocked.push("ach_elderly");
    }
    if ((growth.categoryCounts?.spiritual || 0) >= 3 && !unlocked.includes("ach_spiritual")) {
      unlocked.push("ach_spiritual");
    }

    helper.unlockedAchievements = unlocked;
  }

  addCertificate(helper, milestone, title, contribution) {
    if (!helper.certificates) helper.certificates = [];
    const newCert = {
      id: `VS-CERT-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      milestone: milestone,
      title: title,
      contribution: contribution,
      date: new Date().toISOString().split('T')[0],
      issuedBy: "VivekSeva Platform"
    };
    helper.certificates.unshift(newCert);

    this.addNotification({
      userId: helper.id,
      title: "New Certificate Available",
      message: `You earned the ${title} for reaching the ${milestone}.`,
      type: "certificate",
      link: "certificates"
    });
  }

  /* ========================================================
     12. TWO-WAY FEEDBACK FLOW (Section 21)
     ======================================================== */
  openFeedbackModalFromCompletion() {
    this.closeModal("modal-completion-screen");
    this.openFeedbackModal(this.pendingCompletionRequestId);
  }

  openFeedbackModal(reqId) {
    this.pendingCompletionRequestId = reqId;
    this.setFeedbackStars(5);
    this.openModal("modal-feedback");
  }

  setFeedbackStars(stars) {
    this.feedbackStarValue = stars;
    const container = document.getElementById("feedback-stars-container");
    if (!container) return;

    container.innerHTML = [1, 2, 3, 4, 5].map(val => `
      <i class="fas fa-star ${val <= stars ? 'text-amber-400' : 'text-slate-200'} cursor-pointer" onclick="window.app.setFeedbackStars(${val})"></i>
    `).join('');
  }

  handleSubmitFeedback(e) {
    e.preventDefault();
    const req = this.db.requests.find(r => r.id === this.pendingCompletionRequestId);
    if (!req) return;

    const q1 = document.getElementById("fb-q1").value;
    const q2 = document.getElementById("fb-q2").value;
    const q3 = document.getElementById("fb-q3").value;
    const q4 = document.getElementById("fb-q4").value;
    const written = document.getElementById("fb-written-text").value.trim();

    if (!req.feedbacks) req.feedbacks = {};

    const feedbackPayload = {
      rating: this.feedbackStarValue,
      text: written || "A courteous and fulfilling seva experience.",
      answers: {
        communicationClear: q1,
        serviceCompleted: q2,
        respectful: q3,
        needFulfilled: q4
      },
      submittedBy: this.currentUser?.id,
      date: new Date().toISOString().split('T')[0]
    };

    if (this.currentActiveRole === "needer") {
      req.feedbacks.neederFeedback = feedbackPayload;
    } else {
      req.feedbacks.helperFeedback = feedbackPayload;
    }

    this.saveDatabase();
    this.closeModal("modal-feedback");
    this.showToast("Service feedback recorded with gratitude.", "success");
    this.navigateToHomeDashboard();
  }

  /* ========================================================
     13. SPREAD SEVA / SHARING (Section 28)
     ======================================================== */
  openShareModal() {
    this.openModal("modal-share-seva");
  }

  executeShare(channel) {
    const shareText = encodeURIComponent("I am participating in VivekSeva, a human-service platform inspired by Swami Vivekananda. 'They alone live who live for others.' Connect and serve: ");
    const shareUrl = encodeURIComponent("https://vivekseva.org");

    let url = "";
    if (channel === "whatsapp") {
      url = `https://api.whatsapp.com/send?text=${shareText}%20${shareUrl}`;
    } else if (channel === "twitter") {
      url = `https://twitter.com/intent/tweet?text=${shareText}&url=${shareUrl}`;
    } else if (channel === "linkedin") {
      url = `https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}`;
    } else if (channel === "copy") {
      navigator.clipboard.writeText("VivekSeva – Human service platform inspired by Swami Vivekananda: https://vivekseva.org");
      this.showToast("Link copied to clipboard!", "success");
    }

    if (url) {
      window.open(url, "_blank");
    }

    // Award +25 bonus points once per day to prevent abuse (Section 28)
    if (this.currentUser && this.currentUser.growth) {
      const today = new Date().toISOString().split('T')[0];
      if (this.currentUser.lastShareDate !== today) {
        this.currentUser.lastShareDate = today;
        this.currentUser.growth.points += 25;
        this.currentUser.growth.sharesCount = (this.currentUser.growth.sharesCount || 0) + 1;
        this.checkAchievementUnlocks(this.currentUser);
        this.saveDatabase();
        this.showToast("+25 Bonus Service Points awarded for spreading Seva awareness!", "success");
      }
    }

    this.closeModal("modal-share-seva");
  }

  /* ========================================================
     14. REPORT A PROBLEM (Section 20)
     ======================================================== */
  openReportProblemModal() {
    this.openModal("modal-report-problem");
  }

  handleSubmitReport(e) {
    e.preventDefault();
    const category = document.getElementById("report-category").value;
    const desc = document.getElementById("report-description").value.trim();

    if (!desc) {
      this.showToast("Please describe the issue.", "error");
      return;
    }

    const report = {
      id: `REP-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      reporterId: this.currentUser?.id || "guest",
      reporterName: this.currentUser?.name || "Concerned User",
      category: category,
      description: desc,
      status: "Under Review",
      createdAt: new Date().toISOString()
    };

    if (!this.db.reports) this.db.reports = [];
    this.db.reports.push(report);
    this.saveDatabase();

    this.closeModal("modal-report-problem");
    this.showToast(`Report ${report.id} submitted. Marked Under Review by platform administration.`, "success");
  }

  /* ========================================================
     15. NOTIFICATIONS CENTER (Section 30)
     ======================================================== */
  toggleNotificationDrawer() {
    const drawer = document.getElementById("notifications-drawer");
    if (!drawer) return;

    if (drawer.classList.contains("hidden")) {
      drawer.classList.remove("hidden");
      this.renderNotificationsList();
    } else {
      drawer.classList.add("hidden");
    }
  }

  renderNotificationsList() {
    const listEl = document.getElementById("notifications-list-container");
    if (!listEl) return;

    const notifs = (this.db.notifications || []).filter(n => n.userId === this.currentUser?.id);

    if (notifs.length === 0) {
      listEl.innerHTML = `<div class="p-6 text-center text-xs text-slate-400">No new notifications.</div>`;
      return;
    }

    listEl.innerHTML = notifs.map(n => `
      <div onclick="window.app.handleNotificationClick('${n.id}', '${n.link}')" class="p-3 rounded-xl border text-xs cursor-pointer transition-colors ${
        n.isRead ? 'bg-white border-slate-100 text-slate-600' : 'bg-amber-50/80 border-amber-200 text-navy-900 font-semibold'
      }">
        <div class="flex justify-between items-start mb-0.5">
          <span class="font-bold text-saffron-800 text-[11px]">${n.title}</span>
          <span class="text-[9px] text-slate-400">${new Date(n.timestamp).toLocaleDateString()}</span>
        </div>
        <p class="text-[11px] line-clamp-2">${n.message}</p>
      </div>
    `).join('');
  }

  handleNotificationClick(notifId, link) {
    const notif = (this.db.notifications || []).find(n => n.id === notifId);
    if (notif) notif.isRead = true;
    this.saveDatabase();
    this.updateNotificationBadge();
    document.getElementById("notifications-drawer")?.classList.add("hidden");
    if (link) this.navigateTo(link);
  }

  markAllNotificationsRead() {
    (this.db.notifications || []).forEach(n => {
      if (n.userId === this.currentUser?.id) n.isRead = true;
    });
    this.saveDatabase();
    this.updateNotificationBadge();
    this.renderNotificationsList();
    this.showToast("All notifications marked as read.", "info");
  }

  updateNotificationBadge() {
    const badge = document.getElementById("notif-badge-count");
    if (!badge) return;

    const unread = (this.db.notifications || []).filter(n => n.userId === this.currentUser?.id && !n.isRead).length;
    if (unread > 0) {
      badge.textContent = unread;
      badge.classList.remove("hidden");
    } else {
      badge.classList.add("hidden");
    }
  }

  addNotification(notifObj) {
    if (!this.db.notifications) this.db.notifications = [];
    const notif = {
      id: `notif_${Date.now()}`,
      timestamp: new Date().toISOString(),
      isRead: false,
      ...notifObj
    };
    this.db.notifications.unshift(notif);
    this.saveDatabase();
    this.updateNotificationBadge();
  }

  /* ========================================================
     16. PROFILE & HISTORY VIEWS
     ======================================================== */
  renderProfile() {
    if (!this.currentUser) return;
    document.getElementById("profile-display-name").textContent = this.currentUser.name;
    document.getElementById("profile-display-location").textContent = this.currentUser.location;
    document.getElementById("profile-display-avatar").src = this.currentUser.avatar;
    document.getElementById("profile-display-role-badge").textContent = this.currentUser.roles.join(' & ').toUpperCase();

    const content = document.getElementById("profile-details-content");
    if (!content) return;

    content.innerHTML = `
      <div class="space-y-4 text-xs">
        <div>
          <span class="font-bold text-slate-400 uppercase text-[10px] tracking-wider block">Bio Introduction</span>
          <p class="text-slate-700 mt-1 italic">${this.currentUser.intro || 'Serving with reverence and dignity on VivekSeva.'}</p>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-100">
          <div>
            <span class="font-bold text-slate-400 uppercase text-[10px] tracking-wider block">Service Mode</span>
            <span class="font-semibold text-navy-900">${this.currentUser.serviceMode || 'BOTH'}</span>
          </div>
          <div>
            <span class="font-bold text-slate-400 uppercase text-[10px] tracking-wider block">Contact Privacy</span>
            <span class="text-emerald-700 font-bold"><i class="fas fa-lock mr-1"></i> Phone &amp; Email Masked</span>
          </div>
        </div>

        <div class="pt-3 border-t border-slate-100">
          <span class="font-bold text-slate-400 uppercase text-[10px] tracking-wider block mb-1.5">Registered Categories</span>
          <div class="flex flex-wrap gap-1.5">
            ${(this.currentUser.categories || []).map(c => `
              <span class="px-2.5 py-1 rounded-full bg-amber-100 text-saffron-800 text-[11px] font-bold uppercase">${c}</span>
            `).join('')}
          </div>
        </div>

        <div class="pt-3 border-t border-slate-100">
          <span class="font-bold text-slate-400 uppercase text-[10px] tracking-wider block mb-1.5">Skills &amp; Capabilities</span>
          <div class="flex flex-wrap gap-1.5">
            ${(this.currentUser.skills || []).map(s => `
              <span class="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 text-[11px] font-semibold">${s}</span>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  }

  openEditProfileModal() {
    if (!this.currentUser) return;
    document.getElementById("edit-profile-name").value = this.currentUser.name;
    document.getElementById("edit-profile-location").value = this.currentUser.location;
    document.getElementById("edit-profile-mode").value = this.currentUser.serviceMode || "BOTH";
    document.getElementById("edit-profile-intro").value = this.currentUser.intro || "";
    this.openModal("modal-edit-profile");
  }

  handleSaveProfile(e) {
    e.preventDefault();
    if (!this.currentUser) return;

    this.currentUser.name = document.getElementById("edit-profile-name").value.trim();
    this.currentUser.location = document.getElementById("edit-profile-location").value.trim();
    this.currentUser.serviceMode = document.getElementById("edit-profile-mode").value;
    this.currentUser.intro = document.getElementById("edit-profile-intro").value.trim();

    this.saveDatabase();
    this.closeModal("modal-edit-profile");
    this.showToast("Profile details updated successfully.", "success");
    this.renderNavigation();
    this.renderProfile();
  }

  renderServiceHistory() {
    const listEl = document.getElementById("service-history-list");
    if (!listEl) return;

    const completed = this.db.requests.filter(r => 
      (r.assignedHelperId === this.currentUser?.id || r.neederId === this.currentUser?.id) &&
      r.status === "COMPLETED"
    );

    if (completed.length === 0) {
      listEl.innerHTML = `<div class="vs-card p-8 text-center text-xs text-slate-500 bg-white">No completed services in history yet.</div>`;
      return;
    }

    listEl.innerHTML = completed.map(req => {
      const cat = this.db.categories[req.category] || { name: req.category, color: "orange" };
      return `
        <div class="vs-card p-5 bg-white border border-slate-200 space-y-3">
          <div class="flex justify-between items-center">
            <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-${cat.color}-100 text-${cat.color}-800">${cat.name}</span>
            <span class="text-xs font-bold text-emerald-700"><i class="fas fa-check-circle mr-1"></i> Completed</span>
          </div>
          <h4 class="text-sm font-bold text-navy-900">${req.title}</h4>
          <p class="text-xs text-slate-600">${req.description}</p>
          <div class="text-[11px] text-slate-500 flex justify-between">
            <span>Served: ${req.neederName} • Helper: ${req.assignedHelperName}</span>
            <span>Completed on ${req.completedAt ? req.completedAt.split('T')[0] : '2026-09-28'}</span>
          </div>

          ${req.feedbacks?.neederFeedback ? `
            <div class="p-3 bg-amber-50/60 rounded-xl border border-amber-200 text-xs text-slate-700 italic">
              “${req.feedbacks.neederFeedback.text}” — <strong>${req.feedbacks.neederFeedback.rating} Stars</strong>
            </div>
          ` : ''}
        </div>
      `;
    }).join('');
  }

  renderNgos() {
    const listEl = document.getElementById("ngos-directory-list");
    if (!listEl) return;

    listEl.innerHTML = this.db.organizations.map(org => `
      <div class="vs-card p-6 bg-white border border-slate-200 space-y-4 hover:border-amber-300">
        <div class="flex justify-between items-start">
          <div class="w-12 h-12 rounded-2xl bg-amber-100 text-saffron-700 flex items-center justify-center text-xl font-bold">
            <i class="fas fa-building-ngo"></i>
          </div>
          <span class="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">Verified Partner</span>
        </div>

        <div>
          <h3 class="text-base font-bold text-navy-900">${org.name}</h3>
          <p class="text-xs text-slate-600 mt-1 leading-relaxed">${org.description}</p>
        </div>

        <div class="space-y-1.5 text-xs text-slate-500 pt-2 border-t border-slate-100">
          <p><i class="fas fa-location-dot mr-1.5 text-slate-400"></i> ${org.location}</p>
          <p><i class="fas fa-hand-holding-heart mr-1.5 text-slate-400"></i> <strong>Initiatives:</strong> ${org.initiatives}</p>
        </div>

        <div class="pt-2">
          <button onclick="window.app.showToast('Direct communication channel with ${org.name} active.', 'info')" class="w-full py-2 rounded-xl bg-slate-50 hover:bg-amber-50 text-saffron-800 text-xs font-bold border border-slate-200">
            Contact Through VivekSeva
          </button>
        </div>
      </div>
    `).join('');
  }

  renderHelpSupport() {
    const faqs = [
      {
        q: "How does VivekSeva protect the privacy of helpers and needers?",
        a: "We never expose personal phone numbers, emails, or residential addresses. All contact occurs via our secure in-app messaging and platform-mediated private call system."
      },
      {
        q: "Why is there no global leaderboard on VivekSeva?",
        a: "Inspired by Swami Vivekananda's philosophy of selfless service and Seva Yoga, seva is a path of self-improvement and character development. Competing with others creates vanity. Progress is measured only against who you were yesterday under 'What Changes in You'."
      },
      {
        q: "How are Service Points and Levels calculated?",
        a: "Helpers earn points for legitimate completed services (+100 base points plus dedication bonuses) and verified platform awareness sharing. Levels are qualitative character milestones, not hierarchical ranks."
      },
      {
        q: "Is Elderly Support medical care?",
        a: "No. VivekSeva provides compassionate social companionship, reading, digital assistance, and respectful friendship. We do not provide professional medical treatment."
      }
    ];

    const container = document.getElementById("help-faqs-container");
    if (container) {
      container.innerHTML = faqs.map((faq, i) => `
        <div class="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-1.5">
          <h4 class="text-xs font-bold text-navy-900"><i class="fas fa-question-circle text-saffron-600 mr-1.5"></i> ${faq.q}</h4>
          <p class="text-xs text-slate-600 leading-relaxed">${faq.a}</p>
        </div>
      `).join('');
    }
  }

  /* ========================================================
     17. AUTH & ONBOARDING FORMS (Section 6, 7, 8)
     ======================================================== */
  openLoginModal() {
    this.openModal("modal-login");
  }

  openSignUpModal(preselectRole = "helper") {
    const radio = document.querySelector(`input[name="signup-role"][value="${preselectRole}"]`);
    if (radio) radio.checked = true;
    this.openModal("modal-signup");
  }

  openForgotPasswordModal() {
    const email = prompt("Please enter your registered email address to receive password reset instructions:");
    if (email) {
      this.showToast(`Password reset link sent to ${email}`, "info");
      this.closeModal("modal-login");
    }
  }

  handleLoginForm(e) {
    e.preventDefault();
    const email = document.getElementById("login-email").value.trim().toLowerCase();
    const pass = document.getElementById("login-password").value;

    const user = this.db.users.find(u => u.email.toLowerCase() === email || u.phone === email);
    if (!user) {
      this.showToast("No registered account found with that email or phone.", "error");
      return;
    }

    this.currentUser = user;
    this.currentActiveRole = user.currentActiveRole || user.roles[0];
    this.storage.setItem("vivekseva_session_user", user.id);
    this.closeModal("modal-login");
    this.renderNavigation();
    this.navigateToHomeDashboard();
    this.showToast(`Welcome back, ${user.name}!`, "success");
  }

  handleSignUpForm(e) {
    e.preventDefault();
    const name = document.getElementById("signup-name").value.trim();
    const email = document.getElementById("signup-email").value.trim().toLowerCase();
    const phone = document.getElementById("signup-phone").value.trim();
    const password = document.getElementById("signup-password").value;
    const confirm = document.getElementById("signup-confirm-password").value;
    const location = document.getElementById("signup-location").value.trim();
    const roleChoice = document.querySelector('input[name="signup-role"]:checked').value;

    if (password !== confirm) {
      this.showToast("Passwords do not match.", "error");
      return;
    }

    // Duplicate email check
    if (this.db.users.some(u => u.email.toLowerCase() === email)) {
      this.showToast("An account with this email address already exists.", "error");
      return;
    }

    const assignedRoles = (roleChoice === "both") ? ["helper", "needer"] : [roleChoice];
    const initialActiveRole = (roleChoice === "needer") ? "needer" : "helper";

    const newUser = {
      id: `usr_${Date.now()}`,
      name: name,
      email: email,
      phone: phone,
      location: location,
      roles: assignedRoles,
      currentActiveRole: initialActiveRole,
      avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80",
      intro: "Dedicated to the spirit of Seva and human dignity.",
      serviceMode: "BOTH",
      categories: ["education", "food"],
      skills: ["Mathematics", "Companionship"],
      availability: {
        isAvailableNow: true,
        availableToday: true,
        isPaused: false,
        status: "AVAILABLE NOW",
        weeklySchedule: {
          Saturday: [{ start: "10:00", end: "13:00" }],
          Sunday: [{ start: "10:00", end: "13:00" }]
        }
      },
      growth: {
        level: 1,
        levelName: "Seva Beginner",
        points: 0,
        pointsToNextLevel: 250,
        servicesCompleted: 0,
        serviceHours: 0,
        peopleSupported: 0,
        consistencyWeeks: 1,
        categoryCounts: { food: 0, education: 0, elderly: 0, spiritual: 0 },
        sharesCount: 0,
        reflections: []
      },
      unlockedAchievements: [],
      certificates: []
    };

    this.db.users.push(newUser);
    this.currentUser = newUser;
    this.currentActiveRole = initialActiveRole;
    this.storage.setItem("vivekseva_session_user", newUser.id);
    this.saveDatabase();

    this.closeModal("modal-signup");
    this.openModal("modal-welcome");
  }

  proceedAfterWelcome() {
    this.closeModal("modal-welcome");
    if (this.currentUser.roles.includes("helper")) {
      this.openHelperOnboarding();
    } else {
      this.renderNavigation();
      this.navigateTo("needer-dashboard");
      this.showToast(`Welcome to VivekSeva, ${this.currentUser.name}!`, "success");
    }
  }

  openHelperOnboarding() {
    // Populate categories checkboxes
    const catContainer = document.getElementById("onboarding-categories-container");
    if (catContainer) {
      catContainer.innerHTML = Object.values(this.db.categories).map(cat => `
        <label class="p-2.5 rounded-xl border border-slate-200 bg-white flex items-center space-x-2 cursor-pointer hover:border-saffron-400">
          <input type="checkbox" name="onboard-cat" value="${cat.id}" checked onchange="window.app.updateOnboardingSkills()" class="accent-saffron-600 rounded">
          <span class="font-bold text-slate-800">${cat.name}</span>
        </label>
      `).join('');
    }

    this.updateOnboardingSkills();
    this.openModal("modal-helper-onboarding");
  }

  updateOnboardingSkills() {
    const selectedCats = Array.from(document.querySelectorAll('input[name="onboard-cat"]:checked')).map(cb => cb.value);
    const skillsContainer = document.getElementById("onboarding-skills-container");
    if (!skillsContainer) return;

    const availableSkills = [];
    selectedCats.forEach(catId => {
      const cat = this.db.categories[catId];
      if (cat && cat.skills) {
        cat.skills.forEach(s => {
          if (!availableSkills.includes(s)) availableSkills.push(s);
        });
      }
    });

    skillsContainer.innerHTML = availableSkills.map((skill, i) => `
      <label class="inline-flex items-center space-x-2 mr-3 mb-2 bg-white px-2.5 py-1 rounded-lg border border-slate-200 cursor-pointer">
        <input type="checkbox" name="onboard-skill" value="${skill}" checked class="accent-saffron-600 rounded">
        <span class="font-medium text-slate-700">${skill}</span>
      </label>
    `).join('');
  }

  completeHelperOnboarding() {
    const selectedCats = Array.from(document.querySelectorAll('input[name="onboard-cat"]:checked')).map(cb => cb.value);
    const selectedSkills = Array.from(document.querySelectorAll('input[name="onboard-skill"]:checked')).map(cb => cb.value);
    const mode = document.getElementById("onboarding-service-mode").value;
    const intro = document.getElementById("onboarding-intro").value.trim();

    if (selectedCats.length === 0) {
      this.showToast("Please choose at least one seva category.", "error");
      return;
    }

    this.currentUser.categories = selectedCats;
    this.currentUser.skills = selectedSkills;
    this.currentUser.serviceMode = mode;
    if (intro) this.currentUser.intro = intro;

    this.saveDatabase();
    this.closeModal("modal-helper-onboarding");
    this.renderNavigation();
    this.navigateTo("helper-dashboard");
    this.showToast("Onboarding complete! Welcome to your Seva journey.", "success");
  }

  /* ========================================================
     MODAL CONTROLS & TOAST UTILITIES
     ======================================================== */
  openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove("hidden");
      document.body.style.overflow = "hidden";
    }
  }

  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add("hidden");
      document.body.style.overflow = "auto";
    }
  }

  showToast(message, type = "info") {
    const container = document.getElementById("toast-container");
    if (!container) return;

    const toast = document.createElement("div");
    const colors = {
      success: "bg-emerald-800 text-white border-emerald-600",
      error: "bg-rose-800 text-white border-rose-600",
      info: "bg-navy-900 text-white border-amber-500"
    };

    toast.className = `toast-message px-4 py-3 rounded-xl border text-xs font-semibold flex items-center space-x-2.5 ${colors[type] || colors.info}`;
    toast.innerHTML = `
      <i class="fas ${type === 'success' ? 'fa-circle-check text-emerald-400' : type === 'error' ? 'fa-triangle-exclamation text-rose-400' : 'fa-circle-info text-amber-400'}"></i>
      <span>${message}</span>
    `;

    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transition = "opacity 0.3s ease";
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  setupGlobalHandlers() {
    // ESC key closes modals
    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        document.querySelectorAll(".fixed.z-50:not(.hidden)").forEach(modal => {
          modal.classList.add("hidden");
        });
        document.body.style.overflow = "auto";
      }
    });
  }
}

// Robust Application Initialization (Works on localhost, Netlify, Vercel, and GitHub Pages)
function initializeVivekSeva() {
  if (!window.app) {
    try {
      window.app = new VivekSevaApp();
    } catch (err) {
      console.error("Critical error instantiating VivekSevaApp:", err);
    }
  }
}

// 1. If DOM is already interactive or complete when script evaluates, start immediately!
if (document.readyState === "complete" || document.readyState === "interactive") {
  initializeVivekSeva();
} else {
  // 2. Otherwise listen for DOMContentLoaded
  document.addEventListener("DOMContentLoaded", initializeVivekSeva);
  // 3. Fallback to window load event
  window.addEventListener("load", initializeVivekSeva);
}

// 4. Expose to global window
window.initVivekSeva = initializeVivekSeva;

