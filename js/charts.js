/**
 * VivekSeva - Interactive Data Visualizations & Charts
 * Renders lightweight, responsive, accessible SVG/Canvas charts for Impact, User Dashboard & NGO Analytics
 */

class VivekCharts {
  constructor() {
    this.palette = {
      primary: "#E65100",    // Saffron Deep
      secondary: "#F57C00",  // Saffron Bright
      maroon: "#881337",     // Temple Maroon
      amber: "#D97706",      // Warm Amber
      emerald: "#059669",    // Leaf Green
      indigo: "#4F46E5",     // Indigo
      slate: "#64748B",      // Slate
      lightBg: "#FFF7ED"
    };
  }

  /**
   * Render Categories Breakdown Donut / Progress Bar Chart
   */
  renderCategoryDonut(containerId, data) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const categories = Object.entries(data);
    const colors = [this.palette.primary, this.palette.secondary, this.palette.amber, this.palette.emerald, this.palette.indigo];

    let html = `
      <div class="space-y-3.5">
    `;

    categories.forEach(([cat, pct], idx) => {
      const color = colors[idx % colors.length];
      html += `
        <div>
          <div class="flex justify-between items-center text-xs font-semibold mb-1">
            <span class="flex items-center text-slate-700">
              <span class="w-3 h-3 rounded-full mr-2" style="background-color: ${color}"></span>
              ${cat}
            </span>
            <span class="font-bold text-slate-800">${pct}%</span>
          </div>
          <div class="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
            <div class="h-2.5 rounded-full transition-all duration-700 ease-out" 
                 style="width: ${pct}%; background-color: ${color};" 
                 role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100">
            </div>
          </div>
        </div>
      `;
    });

    html += `</div>`;
    container.innerHTML = html;
  }

  /**
   * Render Monthly Activity Trend Bar Chart (SVG-based)
   */
  renderMonthlyBarChart(containerId, monthlyData) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const maxHours = Math.max(...monthlyData.map(d => d.hours), 1000);
    const chartHeight = 160;

    let barsHtml = monthlyData.map((item, idx) => {
      const barHeight = Math.round((item.hours / maxHours) * (chartHeight - 30));
      return `
        <div class="flex-1 flex flex-col items-center group cursor-pointer">
          <div class="text-[11px] font-bold text-amber-700 mb-1 opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all">
            ${item.hours}h
          </div>
          <div class="w-full max-w-[36px] bg-amber-100 rounded-t-lg relative flex items-end justify-center overflow-hidden" style="height: ${chartHeight - 30}px;">
            <div class="w-full bg-gradient-to-t from-orange-600 to-amber-500 rounded-t-lg transition-all duration-700 group-hover:from-orange-700 group-hover:to-amber-400"
                 style="height: ${barHeight}px;">
            </div>
          </div>
          <div class="text-[11px] font-medium text-slate-600 mt-2 truncate w-full text-center">
            ${item.month.split(' ')[0]}
          </div>
        </div>
      `;
    }).join("");

    container.innerHTML = `
      <div class="flex items-end justify-between space-x-2 pt-4 px-1" style="height: ${chartHeight}px;">
        ${barsHtml}
      </div>
      <div class="flex justify-between items-center text-[11px] text-slate-500 mt-2 pt-2 border-t border-slate-100">
        <span><i class="fas fa-circle text-orange-500 text-[9px] mr-1"></i> Monthly Seva Hours Contributed</span>
        <span class="font-medium text-slate-700">Prototype Demo Trend</span>
      </div>
    `;
  }

  /**
   * Render Pipeline Status Breakdown Badges & Funnel
   */
  renderPipelineFunnel(containerId, statusData) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const steps = [
      { key: "Pending Verification", icon: "fa-hourglass-start", color: "bg-amber-50 text-amber-800 border-amber-200" },
      { key: "Verified", icon: "fa-check-circle", color: "bg-blue-50 text-blue-800 border-blue-200" },
      { key: "Matched", icon: "fa-handshake", color: "bg-purple-50 text-purple-800 border-purple-200" },
      { key: "In Progress", icon: "fa-person-running", color: "bg-orange-50 text-orange-800 border-orange-200" },
      { key: "Completed", icon: "fa-award", color: "bg-emerald-50 text-emerald-800 border-emerald-200" }
    ];

    let html = `<div class="grid grid-cols-2 sm:grid-cols-5 gap-2.5">`;

    steps.forEach(step => {
      const count = statusData[step.key] || 0;
      html += `
        <div class="p-3 rounded-xl border ${step.color} flex flex-col justify-between items-center text-center shadow-xs">
          <i class="fas ${step.icon} text-lg mb-1 opacity-90"></i>
          <span class="text-xs font-semibold leading-tight line-clamp-1">${step.key}</span>
          <span class="text-xl font-extrabold mt-1">${count}</span>
        </div>
      `;
    });

    html += `</div>`;
    container.innerHTML = html;
  }

  /**
   * Render Qualitative Growth Themes (Non-competitive reflective pillars)
   * Note: As per Vivekananda service philosophy, we do NOT assign a "humility score"
   * or claim AI can measure someone's character. Themes track qualitative reflection topics.
   */
  renderGrowthThemes(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const themes = [
      { 
        name: "Communication", 
        focus: "Active Listening & Patient Dialogue", 
        reflectionsLogged: 12, 
        milestone: "Empathetic communication demonstrated in audio narration & mentorship", 
        icon: "fa-comments" 
      },
      { 
        name: "Patience", 
        focus: "Unhurried Service & Reverence", 
        reflectionsLogged: 14, 
        milestone: "Maintained patient presence in elderly care & special education sessions", 
        icon: "fa-hands-holding-heart" 
      },
      { 
        name: "Consistency", 
        focus: "Regular Commitment & Reliability", 
        reflectionsLogged: 18, 
        milestone: "Weekly regular seva commitment maintained consecutively for 6+ months", 
        icon: "fa-calendar-check" 
      },
      { 
        name: "Teamwork", 
        focus: "Collaborative Grassroots Coordination", 
        reflectionsLogged: 9, 
        milestone: "Worked seamlessly alongside village Anganwadi workers & 3 partner NGOs", 
        icon: "fa-people-group" 
      }
    ];

    let html = `
      <div class="space-y-3.5">
        <div class="p-3 bg-amber-50/70 rounded-xl border border-amber-200/80 text-[11px] text-amber-900 flex items-center justify-between">
          <span class="flex items-center">
            <i class="fas fa-heart text-amber-700 mr-2"></i>
            <strong>Sadhana Principle:</strong> No competitive leaderboards or AI "character/humility scores". Growth is an inward reflective journey.
          </span>
          <span class="font-bold bg-amber-200/70 px-2 py-0.5 rounded text-[10px]">Self-Observed Reflections</span>
        </div>
    `;

    themes.forEach(t => {
      html += `
        <div class="p-3.5 rounded-xl bg-orange-50/40 border border-orange-100 hover:border-amber-300 transition-all">
          <div class="flex justify-between items-center text-xs font-bold text-slate-800 mb-1">
            <span class="flex items-center text-amber-900">
              <i class="fas ${t.icon} text-amber-600 mr-2 text-sm"></i>
              ${t.name} <span class="font-normal text-slate-500 ml-1.5">— ${t.focus}</span>
            </span>
            <span class="text-amber-800 font-extrabold bg-amber-100 px-2.5 py-0.5 rounded-full text-[11px]">
              ${t.reflectionsLogged} Reflections Logged
            </span>
          </div>
          <p class="text-[11px] text-slate-600 mb-2">${t.milestone}</p>
          <div class="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-orange-200/60">
            <div class="h-2 rounded-full bg-gradient-to-r from-amber-500 to-orange-600 transition-all duration-700" style="width: ${Math.min(100, t.reflectionsLogged * 7)}%"></div>
          </div>
        </div>
      `;
    });
    html += `</div>`;

    container.innerHTML = html;
  }
}

// Global instance
if (typeof window !== "undefined") {
  window.vivekCharts = new VivekCharts();
}
