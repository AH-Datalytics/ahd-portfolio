// Fixed cards (non-Vercel projects, always shown first)
const FIXED_CARDS = [
  {
    title: 'Real-Time Crime Index',
    url: 'https://www.realtimecrimeindex.com',
    screenshot: 'realtimecrimeindex',
    description: 'Aggregates reported crime data from hundreds of law enforcement agencies nationwide to track crime trends with minimal lag through interactive graphs, tables, and maps.'
  },
  {
    title: 'Data for Community Trust',
    url: 'https://dataforcommunitytrust.org/hazel-crest',
    screenshot: 'hazel-crest',
    description: 'Public safety data platform for the Village of Hazel Crest, IL, providing transparent information on crime, calls for service, and traffic stops.'
  }
];

// Human-written descriptions for known Vercel projects
const DESCRIPTIONS = {
  'nola-crime-dashboard': 'Interactive dashboard tracking major crime incidents across New Orleans with district-level filtering, year-over-year trends, and an AI-powered assistant.',
  'fpa-lens': 'Transparency dashboard for the Southeast Louisiana Flood Protection Authority, displaying system readiness, finances, maintenance, and safety records.',
  'govdash': 'Leadership intelligence platform providing government officials with data-driven insights for strategic decision-making.',
  'police-staffing-dashboard': 'Staffing optimization tool that calculates optimal patrol levels by analyzing calls-for-service data, unit configuration, and demand patterns.',
  'nola-dashboard': 'Centralized operations dashboard for the City of New Orleans, consolidating key municipal metrics and departmental data.',
  'lmpd-analytics': 'Citizen-facing platform for exploring Louisville Metro Police stop data, enabling public transparency into law enforcement patterns.',
  'smc-beach-safety': 'Real-time beach conditions monitor for San Mateo County, pulling wave, wind, and water temperature data from NOAA and NWS.',
  'nopd-bias-demo': 'Interactive demonstration of NOPD bias-free policing analytics, visualizing stop, search, and use of force data for compliance monitoring.',
  'shooting-dashboard': 'Year-to-date shooting incident tracker across major US cities, built on open data portals with filtering, comparison, and export tools.',
  'real-estate-explorer': 'Interactive real estate market explorer with state-level pricing trends, market statistics, and multiple visualization modes.'
};

// URL overrides (when Vercel API returns a hashed/broken URL)
const URL_OVERRIDES = {
  'nopd-bias-demo': 'https://nopd-bias-demo.vercel.app',
  'real-estate-explorer': 'https://ahd-real-estate-explorer.vercel.app'
};

// Pretty display names for Vercel project slugs
const DISPLAY_NAMES = {
  'nola-crime-dashboard': 'NOLA Crime Dashboard',
  'fpa-lens': 'FPA Lens',
  'govdash': 'GovDash',
  'police-staffing-dashboard': 'Police Staffing Dashboard',
  'nola-dashboard': 'NOLA Operations Dashboard',
  'lmpd-analytics': 'Louisville PD Analytics',
  'smc-beach-safety': 'SMC Beach Safety',
  'nopd-bias-demo': 'NOPD Bias-Free Policing',
  'shooting-dashboard': 'City Shooting Tracker',
  'real-estate-explorer': 'Real Estate Explorer'
};

function prettifySlug(slug) {
  return DISPLAY_NAMES[slug] || slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

function microlinkScreenshot(url) {
  return `https://api.microlink.io/?url=${encodeURIComponent(url)}&screenshot=true&meta=false&embed=screenshot.url&viewport.width=1280&viewport.height=800`;
}

function createCard(project) {
  const card = document.createElement('div');
  card.className = 'card';

  const screenshotKey = project.screenshot || project.slug || '';
  const localSrc = screenshotKey ? `/screenshots/${screenshotKey}.png` : '';

  const img = new Image();
  img.className = 'card-img';
  img.alt = project.title;
  img.loading = 'lazy';

  if (localSrc) {
    // Try local screenshot first; on 404 fall back to Microlink API
    img.src = localSrc;
    img.onerror = function () {
      this.onerror = function () {
        // Microlink also failed — show gradient
        this.removeAttribute('src');
        this.style.background = 'linear-gradient(135deg, #123A6C 0%, #169FEB 100%)';
      };
      this.src = microlinkScreenshot(project.url);
    };
  } else {
    // No local key — go straight to Microlink
    img.src = microlinkScreenshot(project.url);
    img.onerror = function () {
      this.removeAttribute('src');
      this.style.background = 'linear-gradient(135deg, #123A6C 0%, #169FEB 100%)';
    };
  }

  const shortUrl = project.url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');
  const demoBadge = project.isDemo ? '<span class="card-badge">Demo</span>' : '';

  card.innerHTML = `
    <a href="${project.url}" target="_blank" rel="noopener">
      <div class="card-img-wrap"></div>
      <div class="card-body">
        <div class="card-title">${demoBadge}${project.title}</div>
        <div class="card-desc">${project.description}</div>
        <span class="card-url">${shortUrl} &rarr;</span>
      </div>
    </a>
  `;

  card.querySelector('.card-img-wrap').replaceWith(img);
  return card;
}

async function loadProjects() {
  const grid = document.getElementById('portfolio-grid');
  const loading = document.getElementById('loading');

  // Render fixed cards immediately
  FIXED_CARDS.forEach(p => grid.appendChild(createCard(p)));

  // Fetch dynamic Vercel projects
  try {
    const res = await fetch('/api/projects');
    if (!res.ok) throw new Error('API error');
    const projects = await res.json();

    // Render known projects in fixed order, then append any new ones at the end
    const KNOWN_ORDER = [
      'lmpd-analytics', 'fpa-lens', 'govdash', 'police-staffing-dashboard',
      'nola-dashboard', 'smc-beach-safety', 'nola-crime-dashboard', 'shooting-dashboard',
      'nopd-bias-demo', 'real-estate-explorer'
    ];
    const knownSet = new Set(KNOWN_ORDER);
    const sorted = [
      ...KNOWN_ORDER.filter(name => projects.some(p => p.name === name)),
      ...projects.filter(p => !knownSet.has(p.name)).map(p => p.name)
    ];

    sorted.forEach(name => {
      const p = projects.find(pr => pr.name === name);
      if (!p) return;
      const title = DISPLAY_NAMES[p.name] || p.title || prettifySlug(p.name);
      const url = URL_OVERRIDES[p.name] || p.url;
      const description = DESCRIPTIONS[p.name] || p.description || 'Custom data tool built by AH Datalytics.';
      grid.appendChild(createCard({ title, url, description, slug: p.name, isDemo: true }));
    });
  } catch (err) {
    console.error('Failed to load Vercel projects:', err);
  }

  loading.classList.add('hidden');
}

document.addEventListener('DOMContentLoaded', loadProjects);
