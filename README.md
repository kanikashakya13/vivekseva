# VivekSeva – Serve. Connect. Grow.
> *“They alone live who live for others, the rest are more dead than alive.”*  
> — **Swami Vivekananda**

VivekSeva is a human-service web application inspired by the philosophy and teachings of **Swami Vivekananda**, especially the ideals of **Seva** (selfless service), human dignity, education, character development, self-improvement, and collective upliftment.

---

## 🏛️ Core Service Philosophy

1. **Dignity Over Charity:** Every person has innate worth. When serving, helpers act with reverence, humility, and gratitude, not condescension or pity.
2. **Personal Growth Over Competition (Signature Feature):**
   - **NO Global Leaderboards**
   - **NO Ranks (No "#25")**
   - **NO Comparison with Other Helpers**
   - Progress is measured **only against who you were yesterday** through the signature dashboard section:
     ### **“WHAT CHANGES IN YOU”**  
     *“Not your rank. Your growth.”*
3. **Strict Privacy First:**
   - Personal phone numbers and email addresses are **never** displayed.
   - Exact home addresses are protected; only general areas are shown.
   - All communication takes place via platform-mediated **In-App Messaging** and **Private Calling**.

---

## 👥 The Two User Roles

1. **HELPER:** A person willing to offer time, knowledge, guidance, or support.
2. **NEEDER:** A person who currently needs assistance in one of the 4 supported service categories.
3. **DUAL-ROLE:** Users can participate as both Helper and Needer, with a 1-click **“Switch Role”** toggle in the header and mobile navigation.

---

## 🌟 The 4 Service Categories

Only these four categories are active in VivekSeva:

| Category | UI Tagline | Verified Vivekananda Quote | Typical Needs & Helper Skills |
| :--- | :--- | :--- | :--- |
| **FOOD SEVA** | *“Share nourishment. Serve with dignity.”* | *“They alone live who live for others, the rest are more dead than alive.”* | Meal assistance, Food distribution, Ration kit support, Community food drives. |
| **EDUCATION SEVA** | *“Share knowledge. Empower a life.”* | *“Education is the manifestation of the perfection already in man.”* | Mathematics, Science, English, School homework support, Basic literacy, Academic guidance. |
| **ELDERLY SUPPORT** | *“Give time. Give dignity.”* | *“They alone live who live for others...”* | Companionship, Reading/writing assistance, Daily errand aid, Simple digital tasks, Friendly accompaniment. *(Non-medical assistance).* |
| **SPIRITUAL SUPPORT** | *“Find peace. Share positivity.”* | *“Purity, patience, and perseverance are the three essentials to success and, above all, love.”* | Guided meditation, Spiritual & philosophical discussion, Mindful breathing, Positive companionship. *(Universal & non-sectarian).* |

---

## 🚀 Key Modules & Interactive Features

- **Dynamic Public Landing Page:** Hero section, Vivekananda quotes, How VivekSeva Works for Helpers & Needers, 4 categories showcase, and partner NGO directory.
- **Role-Adaptive Dashboards:** Separate dedicated dashboards for Helper and Needer roles.
- **Signature "What Changes in You" System:**
  - Before vs. Now vs. Next Level historical tracking.
  - Personal journey visualization: Level 1 → Level 2 → Level 3 → Level 4 → Level 5.
  - 6 Impact Dimensions: Services Completed, Service Hours, People Supported, Consistency Weeks, Achievements, Certificates.
  - Personal Seva Reflection Journal.
- **Helper Availability Manager ("My Availability"):**
  - Toggles for *Available Now*, *Available Today*, and *Pause Availability*.
  - Status indicators: `AVAILABLE NOW`, `AVAILABLE LATER`, `NOT AVAILABLE`.
  - Weekly schedule builder: Add, edit, and delete time slots across all 7 days.
- **Dynamic Need Request Wizard & AI Matching:**
  - Category-specific forms (Education, Food, Elderly, Spiritual) with common service parameters.
  - Transparent AI matching evaluating Category (30%), Skills (25%), Availability (20%), Delivery Mode (15%), and Location (10%).
  - Returns top 3–4 matched registered helpers with explainable matching reasons.
  - Fallback flows if no match is found.
  - Auto-recommendation of alternative helpers if a request is declined (helpers are never penalized).
- **In-App Messaging & Platform-Mediated Calling:**
  - Private chat linked to each service request with instant quick-reply chips.
  - Platform-mediated in-app call modal with call timer and mute/speaker toggles (personal numbers strictly hidden).
- **Service Completion & Two-Way Feedback:**
  - Completion modal summarizing impact and points earned (+100 base, +20 dedication).
  - Two-way 5-star rating and 4 structured questions (Communication, Completion, Respect, Fulfillment).
- **Service Points & Character Levels:**
  - Level 1: Seva Beginner (0–250 pts)
  - Level 2: Active Helper (251–600 pts)
  - Level 3: Dedicated Helper (601–1200 pts)
  - Level 4: Community Helper (1201–2000 pts)
  - Level 5: Seva Champion (2001+ pts)
- **Achievements & Milestone Certificates:**
  - 10 character milestones (First Seva, 5 Services, 10 Services, 25 Services, Category Champions, Consistency, Spreading the Light).
  - High-fidelity printable / saveable Certificate of Service with unique IDs (e.g., `VS-CERT-2026-0104`).
- **Spread the Spirit of Seva:**
  - Share awareness via WhatsApp, Twitter/X, LinkedIn, and Copy Link to earn +25 bonus service points (capped to 1 share award per day).
- **Report a Problem:**
  - Safety and conduct issue reporting with administrative review tracking.
- **Communities & NGOs Directory:**
  - Partner organizational listings ready for future expansion.

---

## 👥 Preloaded Demo Personas

| Name | Role | Location | Specialization & Stats |
| :--- | :--- | :--- | :--- |
| **Arjun Sharma** | Helper | South Delhi, Delhi | Math, Science, Food & Elderly Seva (Level 3, 720 pts, 18 services). |
| **Sunita Devi** | Needer | Varanasi, UP | Senior citizen seeking weekly reading and nutritional support. |
| **Priya Nair** | Both (Dual Role) | Bengaluru, Karnataka | Content writer assisting elders and requesting Math tutoring for niece. |
| **Dr. Meenakshi Sundaram** | Helper | Chennai, Tamil Nadu | Retired professor offering meditation and elderly companionship (Level 3, 840 pts). |
| **Rajesh K. Verma** | Helper | Lucknow, UP | Community food distribution and ration drives (Level 2, 430 pts). |
| **Sneha Mukhopadhyay** | Helper | Kolkata, West Bengal | Online literacy and science tutoring (Level 2, 510 pts). |

---

## 💻 How to Run Locally

### Option 1: Direct Browser Launch (Zero Dependencies)
Double-click `index.html` or open it in any modern browser (Chrome, Edge, Firefox, Safari).

### Option 2: Local Web Server
```powershell
# Navigate to the vivekseva directory
cd c:\Users\HP\OneDrive\Desktop\vivekseva

# Start Python's built-in HTTP server
python -m http.server 8000

# Open in browser:
# http://localhost:8000
```
*(Or use `npx serve .` with Node.js)*
