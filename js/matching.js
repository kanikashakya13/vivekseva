/**
 * VivekSeva - AI Seva Matching Engine
 * Evaluates Category, Skills, Availability, Preferred Time, Service Mode,
 * Approximate Location, and Helper Experience.
 */

class VivekMatchingEngine {
  constructor() {
    this.weights = {
      category: 0.30,
      skills: 0.25,
      availability: 0.20,
      serviceMode: 0.15,
      location: 0.10
    };
  }

  /**
   * Find matching helpers for a need request
   * @param {Object} needRequest The need request object
   * @param {Array} helpersPool Array of helper user objects
   * @returns {Array} Ranked array of match objects { helper, score, reasons }
   */
  findMatches(needRequest, helpersPool) {
    if (!needRequest || !helpersPool || !helpersPool.length) {
      return [];
    }

    const matches = [];

    helpersPool.forEach(helper => {
      // Must be a helper role and not paused
      if (!helper.roles.includes('helper') || helper.availability?.isPaused) {
        return;
      }

      let categoryScore = 0;
      let skillsScore = 0;
      let availabilityScore = 0;
      let modeScore = 0;
      let locationScore = 0;
      const reasons = [];

      // 1. Category Alignment (30%)
      if (helper.categories && helper.categories.includes(needRequest.category)) {
        categoryScore = 1.0;
        reasons.push(`Experienced in ${this.getCategoryName(needRequest.category)}`);
      } else {
        // If helper does not support this category, heavily down-weight or skip
        categoryScore = 0.1;
      }

      // 2. Skill Overlap (25%)
      const reqSkills = this.extractKeywords(needRequest.title + " " + needRequest.description);
      const helperSkills = helper.skills || [];
      let matchedSkills = [];

      helperSkills.forEach(skill => {
        const words = skill.toLowerCase().split(/\s+/);
        if (words.some(w => reqSkills.includes(w) || (needRequest.categoryFields && JSON.stringify(needRequest.categoryFields).toLowerCase().includes(w)))) {
          matchedSkills.push(skill);
        }
      });

      if (matchedSkills.length > 0) {
        skillsScore = Math.min(1.0, 0.4 + matchedSkills.length * 0.2);
        reasons.push(`Relevant skills: ${matchedSkills.slice(0, 2).join(', ')}`);
      } else if (helperSkills.length > 0) {
        skillsScore = 0.5; // General capability in category
        reasons.push(`Registered skills in service domain`);
      }

      // 3. Availability Alignment (20%)
      if (helper.availability) {
        if (helper.availability.isAvailableNow) {
          availabilityScore = 1.0;
          reasons.push("Available now for prompt response");
        } else if (helper.availability.availableToday) {
          availabilityScore = 0.85;
          reasons.push("Available today in afternoon/evening slots");
        } else {
          availabilityScore = 0.65;
          reasons.push("Available in upcoming scheduled days");
        }
      } else {
        availabilityScore = 0.5;
      }

      // 4. Service Mode Compatibility (15%)
      const reqMode = needRequest.serviceMode || "BOTH";
      const helperMode = helper.serviceMode || "BOTH";

      if (helperMode === "BOTH" || reqMode === "BOTH" || helperMode === reqMode) {
        modeScore = 1.0;
        reasons.push(`Matches requested format (${reqMode === "BOTH" ? "Online/Offline" : reqMode})`);
      } else {
        modeScore = 0.2; // Mismatch in delivery mode
      }

      // 5. Location / Regional Compatibility (10%)
      if (reqMode === "ONLINE" || helperMode === "ONLINE") {
        locationScore = 1.0;
        reasons.push("Virtual/Digital seva compatible across locations");
      } else {
        const reqLoc = (needRequest.approxLocation || "").toLowerCase();
        const helperLoc = (helper.location || "").toLowerCase();
        if (reqLoc && helperLoc && (reqLoc.includes(helperLoc.split(',')[0].trim().toLowerCase()) || helperLoc.includes(reqLoc.split(',')[0].trim().toLowerCase()))) {
          locationScore = 1.0;
          reasons.push("Close geographical proximity for in-person seva");
        } else {
          locationScore = 0.6; // Same state or neighboring area
        }
      }

      // Experience & Level Boost
      const experienceBoost = Math.min(0.08, (helper.growth?.servicesCompleted || 0) * 0.004);

      // Total Weighted Score (0 to 100)
      const rawScore = (
        categoryScore * this.weights.category +
        skillsScore * this.weights.skills +
        availabilityScore * this.weights.availability +
        modeScore * this.weights.serviceMode +
        locationScore * this.weights.location
      ) + experienceBoost;

      const finalPercentage = Math.min(99, Math.max(55, Math.round(rawScore * 100)));

      // Only include candidates with meaningful alignment (>= 60%)
      if (finalPercentage >= 60 && categoryScore > 0.2) {
        matches.push({
          helper,
          score: finalPercentage,
          reasons: reasons.slice(0, 3)
        });
      }
    });

    // Sort by descending score
    matches.sort((a, b) => b.score - a.score);

    // Return top 3-4 matches as requested
    return matches.slice(0, 4);
  }

  getCategoryName(catId) {
    const map = {
      food: "Food Seva",
      education: "Education Seva",
      elderly: "Elderly Support",
      spiritual: "Spiritual Support"
    };
    return map[catId] || catId;
  }

  extractKeywords(text) {
    if (!text) return [];
    return text.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 2);
  }
}

// Global export
if (typeof window !== "undefined") {
  window.VivekMatchingEngine = new VivekMatchingEngine();
}
if (typeof globalThis !== "undefined") {
  globalThis.VivekMatchingEngine = (typeof window !== "undefined" && window.VivekMatchingEngine) ? window.VivekMatchingEngine : new VivekMatchingEngine();
}

