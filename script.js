// ===== Global Variables =====
let currentCourse = null;


// ===== Initialize =====
// Play boot animation first (returns a Promise) then initialize rest of UI.
document.addEventListener('DOMContentLoaded', () => {
    runBootAnimation().then(() => {
    initializeSettings();
    initializeNavigation();
    initializeThemeToggle();
    initializeMealTabs();
        initializeComplaintForms();
    initializeFeedbackForms();
        loadComplaints();
        initializeDateTime();
        syncTodayFromWeekly();
        // render quote after initialization
        renderDailyQuote();
    }).catch(() => {
        // if animation fails or reduced-motion requested, continue immediately
    initializeSettings();
    initializeNavigation();
    initializeThemeToggle();
    initializeMealTabs();
        initializeComplaintForms();
    initializeFeedbackForms();
        loadComplaints();
        initializeDateTime();
        syncTodayFromWeekly();
        renderDailyQuote();
    });
});


// Sync 'Today' meal cards from the weekly menu table (keeps Today consistent with the weekly schedule)
function syncTodayFromWeekly() {
    try {
        const table = document.querySelector('.weekly-menu');
        if (!table) return;

        const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
        const todayIndex = new Date().getDay(); // 0 = Sunday
        const todayName = days[todayIndex];

        // find the row that has the first cell matching todayName
        const rows = Array.from(table.querySelectorAll('tbody tr'));
        const row = rows.find(r => r.querySelector('td') && r.querySelector('td').textContent.trim().toLowerCase() === todayName.toLowerCase());
        if (!row) return;

        const cells = row.querySelectorAll('td');
        // expected order: Day, Breakfast, Lunch, Snacks, Dinner
        const breakfastText = cells[1] ? cells[1].innerHTML : '';
        const lunchText = cells[2] ? cells[2].innerHTML : '';
        const snacksText = cells[3] ? cells[3].innerHTML : '';
        const dinnerText = cells[4] ? cells[4].innerHTML : '';

        // find the Today cards in the DOM and replace their inner lists
        const todayContainer = document.querySelector('.meal-day.active');
        if (!todayContainer) return;

        const mealCards = todayContainer.querySelectorAll('.meal-card');
    // breakfast -> mealCards[0], lunch -> mealCards[1], snacks -> mealCards[2], dinner -> mealCards[3]
        function htmlToListInner(html) {
            // try splitting by <br> or commas; keep simple by wrapping in <li> per line
            const tmp = document.createElement('div');
            tmp.innerHTML = html.replace(/<br\s*\/?/gi, '\n');
            const lines = tmp.textContent.split(/\n|\+|\//).map(s => s.trim()).filter(Boolean);
            return lines.map(l => `<li><i class="fas fa-circle dot"></i> ${l}</li>`).join('');
        }

    if (mealCards[0]) mealCards[0].querySelector('ul').innerHTML = htmlToListInner(breakfastText);
    if (mealCards[1]) mealCards[1].querySelector('ul').innerHTML = htmlToListInner(lunchText);
    if (mealCards[2]) mealCards[2].querySelector('ul').innerHTML = htmlToListInner(snacksText);
    if (mealCards[3]) mealCards[3].querySelector('ul').innerHTML = htmlToListInner(dinnerText);

        // optionally insert snacks into a visible snack area — if you added .snacks-grid, update first snack card
        const snackGrid = document.querySelector('.snacks-grid');
        if (snackGrid) {
            const firstSnack = snackGrid.querySelector('.snack-card');
            if (firstSnack) firstSnack.querySelector('ul').innerHTML = htmlToListInner(snacksText);
        }

    } catch (e) {
        console.error('syncTodayFromWeekly failed', e);
    }
}

// ===== Daily Quote =====
// Bhagavad Gita quotations with concise English meanings where available.
// Each quote may include an explicit `meaning` field (English) which will be used
// when the user prefers English display.
const QUOTES = [
    {
        text: 'कर्मण्येवाधिकारस्ते मा फलेषु कदाचन',
        meaning: 'Your right is to perform your duty only, never to its fruits.',
        author: 'Bhagavad Gita 2.47'
    },
    {
        text: 'योगस्थः कुरु कर्माणि',
        meaning: 'Perform your actions while established in yoga (equanimity).',
        author: 'Bhagavad Gita 2.48'
    },
    {
        text: 'सुखदुःखे समे कृत्वा लाभालाभौ जयाजयौ',
        meaning: 'Treat pleasure and pain, gain and loss, victory and defeat alike.',
        author: 'Bhagavad Gita 2.38'
    },
    {
        text: 'निर्विकारो भव',
        meaning: 'Be without attachment and remain steady in mind.',
        author: 'Bhagavad Gita (paraphrase)'
    },
    {
        text: 'व्यासेन ब्रह्मविदां वदितं',
        meaning: 'As Vyasa has taught the knowers of Brahman — true knowledge guides.',
        author: 'Bhagavad Gita (inspired)'
    },
    // keep some previous inspirational quotes too for variety
    { text: 'Small daily improvements are the key to staggering long-term results.', author: 'Unknown' },
    { text: 'The journey of a thousand miles begins with one step.', author: 'Lao Tzu' },
    { text: 'Consistency is what transforms average into excellence.', author: 'Unknown' },
    { text: 'Believe you can and you’re halfway there.', author: 'Theodore Roosevelt' },
    { text: 'The only way to do great work is to love what you do.', author: 'Steve Jobs' }
];

// Helper to get user preference for quote language and quick-toggle state
function getQuotePreferences() {
    const cfg = (function(){ try { return JSON.parse(localStorage.getItem('rgipt_settings') || '{}'); } catch (e) { return {}; } })();
    const lang = cfg.quoteLanguage || 'auto';
    const quick = localStorage.getItem('quote_show_translation');
    const quickBool = quick === 'true';
    return { lang, quick: quickBool };
}

function getDailyQuote() {
    const now = new Date();
    // day of year
    const start = new Date(now.getFullYear(), 0, 0);
    const diff = now - start + ((start.getTimezoneOffset() - now.getTimezoneOffset()) * 60 * 1000);
    const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
    const idx = dayOfYear % QUOTES.length;
    return QUOTES[idx];
}

function renderDailyQuote() {
    const banner = document.getElementById('dailyQuote');
    if (!banner) return;
    const quoteText = banner.querySelector('.quote-text');
    const quoteAuthor = banner.querySelector('.quote-author');
    const q = getDailyQuote();
    // Parse the quote to separate original and meaning if the quote text contains a separator (— or -)
    let display = q.text;
    let meaning = '';
    // prefer explicit fields if present
    if (q.meaning) {
        meaning = q.meaning;
        display = q.text;
    } else {
        // try to split on em-dash '—' or long dash or hyphen
        const sep = q.text.includes('—') ? '—' : (q.text.includes(' - ') ? ' - ' : (q.text.includes('–') ? '–' : null));
        if (sep) {
            const parts = q.text.split(sep).map(s => s.trim()).filter(Boolean);
            if (parts.length >= 2) {
                // treat left as original, right as meaning
                display = parts[0];
                meaning = parts.slice(1).join(' — ');
            }
        }
    }

    // determine whether to show translation in banner
    const prefs = getQuotePreferences();
    let showTranslation = prefs.quick;
    if (!prefs.quick) {
        // respect settings: if user prefers English, show translation by default
        if (prefs.lang === 'english') showTranslation = true;
        if (prefs.lang === 'original') showTranslation = false;
    }

    // choose text to display in banner based on showTranslation
    const translationText = q.meaning || meaning || '';
    if (showTranslation && translationText) {
        quoteText.textContent = translationText;
        // set aria to indicate translation shown
        banner.setAttribute('data-translation-shown', 'true');
    } else {
        quoteText.textContent = display;
        banner.setAttribute('data-translation-shown', 'false');
    }

    quoteAuthor.textContent = q.author ? `— ${q.author}` : '';

    // attach meaning data for tooltip use (only used when banner shows original)
    if (meaning) quoteText.dataset.meaning = meaning; else quoteText.dataset.meaning = q.meaning || '';

    // ensure tooltip behaviour is wired
    attachQuoteMeaningHandlers(quoteText);
    // show animation
    banner.classList.add('show');
}

// Create or reuse tooltip element and wire hover handlers
function attachQuoteMeaningHandlers(quoteEl) {
    if (!quoteEl) return;
    // create tooltip if missing
    let tooltip = document.getElementById('quoteMeaningTooltip');
    if (!tooltip) {
        tooltip = document.createElement('div');
        tooltip.id = 'quoteMeaningTooltip';
        tooltip.className = 'quote-meaning-tooltip';
        tooltip.setAttribute('role', 'tooltip');
        document.body.appendChild(tooltip);
    }

    let moveHandler = null;

    function showTooltip(e) {
        // only show tooltip when banner is showing the original (not translation)
        const banner = document.getElementById('dailyQuote');
        if (banner && banner.getAttribute('data-translation-shown') === 'true') return;

        const meaning = (quoteEl.dataset && quoteEl.dataset.meaning) ? quoteEl.dataset.meaning : '';
        if (!meaning) return;
        // choose preferred language from settings (if implemented)
        const pref = (function(){ try { const cfg = JSON.parse(localStorage.getItem('rgipt_settings') || '{}'); return cfg.quoteLanguage || 'auto'; } catch (e) { return 'auto'; } })();
        // For now we only have one 'meaning' string; in future we can store per-language. Show meaning regardless of pref unless pref === 'original'
        if (pref === 'original') return; // user asked to see original only

        tooltip.innerHTML = `<div>${escapeHtml(meaning)}</div><span class="tip-lang">${pref === 'english' ? 'Meaning (English)' : 'Meaning'}</span>`;
        tooltip.classList.add('show');
        // position near mouse
        positionTooltip(e.pageX, e.pageY, tooltip);

        // track mousemove to follow cursor while over element
        moveHandler = function(evt) { positionTooltip(evt.pageX, evt.pageY, tooltip); };
        document.addEventListener('mousemove', moveHandler);
    }

    function hideTooltip() {
        const t = document.getElementById('quoteMeaningTooltip');
        if (t) t.classList.remove('show');
        if (moveHandler) { document.removeEventListener('mousemove', moveHandler); moveHandler = null; }
    }

    // ensure duplicate handlers not added
    quoteEl.removeEventListener('mouseenter', quoteEl._qm_show || function(){});
    quoteEl.removeEventListener('mouseleave', quoteEl._qm_hide || function(){});
    quoteEl.removeEventListener('focus', quoteEl._qm_show || function(){});
    quoteEl.removeEventListener('blur', quoteEl._qm_hide || function(){});

    quoteEl._qm_show = showTooltip;
    quoteEl._qm_hide = hideTooltip;

    quoteEl.addEventListener('mouseenter', showTooltip);
    quoteEl.addEventListener('mouseleave', hideTooltip);
    quoteEl.addEventListener('focus', showTooltip);
    quoteEl.addEventListener('blur', hideTooltip);
}

function positionTooltip(pageX, pageY, tooltip) {
    if (!tooltip) return;
    const pad = 12;
    const rect = tooltip.getBoundingClientRect();
    let x = pageX + pad;
    let y = pageY + pad;
    const vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
    const vh = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);
    // adjust if overflowing right
    if (x + rect.width + 20 > vw) x = pageX - rect.width - pad;
    if (y + rect.height + 20 > vh) y = pageY - rect.height - pad;
    tooltip.style.left = x + 'px';
    tooltip.style.top = y + 'px';
}

// ===== Boot Animation Controller =====
function runBootAnimation() {
    return new Promise((resolve) => {
        const loadingScreen = document.getElementById('loadingScreen');

        // Respect reduced-motion preference
        const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
        if (mq && mq.matches) {
            // hide immediately and resolve
            if (loadingScreen) {
                loadingScreen.style.opacity = '0';
                loadingScreen.style.display = 'none';
            }
            resolve();
            return;
        }

        if (!loadingScreen) { resolve(); return; }

        // play animation timeline: show for ~1000ms then fade (shorter total duration)
        loadingScreen.style.display = 'flex';
        loadingScreen.style.opacity = '1';

        // allow CSS entry animations to run, then fade out after ~1s
        setTimeout(() => {
            loadingScreen.style.transition = 'opacity 300ms ease';
            loadingScreen.style.opacity = '0';
            setTimeout(() => {
                loadingScreen.style.display = 'none';
                resolve();
            }, 350);
        }, 1000);
    });
}

// render quote on load
document.addEventListener('DOMContentLoaded', renderDailyQuote);

// wire quick toggle button for quote translation (present on banner)
document.addEventListener('DOMContentLoaded', () => {
    const toggle = document.getElementById('toggleQuoteTranslation');
    const banner = document.getElementById('dailyQuote');
    if (!toggle || !banner) return;
    // initialize state
    const prefs = getQuotePreferences();
    const qShown = (prefs.quick || prefs.lang === 'english');
    toggle.setAttribute('aria-pressed', qShown ? 'true' : 'false');
    // when toggled, update localStorage and re-render
    toggle.addEventListener('click', () => {
        const cur = toggle.getAttribute('aria-pressed') === 'true';
        const next = !cur;
        toggle.setAttribute('aria-pressed', next ? 'true' : 'false');
        localStorage.setItem('quote_show_translation', next ? 'true' : 'false');
        // re-render daily quote to reflect change
        renderDailyQuote();
    });
});

// ===== Date & Time =====
function initializeDateTime() {
    const dateTimeElement = document.getElementById('datetime');

    function updateDateTime() {
        const now = new Date();
        const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const dateString = now.toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        dateTimeElement.innerHTML = `
            <div class="time">${timeString}</div>
            <div class="date">${dateString}</div>
        `;
    }

    updateDateTime();
    setInterval(updateDateTime, 1000);
}

// ===== Settings (animation speed and per-control accents) =====
function initializeSettings() {
    const settingsBtn = document.getElementById('settingsBtn');
    const settingsPanel = document.getElementById('settingsPanel');
    const closeSettings = document.getElementById('closeSettings');
    const animSpeed = document.getElementById('animSpeed');
    const accentComplaint = document.getElementById('accentComplaint');
    const accentUrgency = document.getElementById('accentUrgency');
    const saveSettings = document.getElementById('saveSettings');
    const resetSettings = document.getElementById('resetSettings');

    if (!settingsPanel) return;

    function applySettings(cfg) {
        const root = document.documentElement;
        if (!cfg) cfg = {};
        // respects prefers-reduced-motion
        const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
        if (mq && mq.matches) {
            root.style.setProperty('--anim-scale', '1');
        } else if (cfg.animScale) {
            root.style.setProperty('--anim-scale', cfg.animScale);
        }

    if (cfg.accentComplaint) root.style.setProperty('--accent-complaint', cfg.accentComplaint);
    if (cfg.accentUrgency) root.style.setProperty('--accent-urgency', cfg.accentUrgency);
    if (cfg.quoteLanguage) {
        const sel = document.getElementById('quoteLanguage');
        if (sel) sel.value = cfg.quoteLanguage;
    }

        // update input values if present
    if (animSpeed && cfg.animScale) animSpeed.value = cfg.animScale;
    if (accentComplaint && cfg.accentComplaint) accentComplaint.value = cfg.accentComplaint;
    if (accentUrgency && cfg.accentUrgency) accentUrgency.value = cfg.accentUrgency;
    // preferred quote language
    const ql = document.getElementById('quoteLanguage');
    if (ql && cfg.quoteLanguage) ql.value = cfg.quoteLanguage;
    // requireAllRatings checkbox
    const requireAllEl = document.getElementById('requireAllRatings');
    if (requireAllEl) requireAllEl.checked = !!cfg.requireAllRatings;
    }

    function loadSettings() {
        try {
            const raw = localStorage.getItem('rgipt_settings');
            if (!raw) return null;
            return JSON.parse(raw);
        } catch (e) { return null; }
    }

    function saveSettingsToStorage(cfg) {
        localStorage.setItem('rgipt_settings', JSON.stringify(cfg));
    }

    // open/close handlers
    if (settingsBtn) settingsBtn.addEventListener('click', () => {
        settingsPanel.setAttribute('aria-hidden', 'false');
    });
    if (closeSettings) closeSettings.addEventListener('click', () => settingsPanel.setAttribute('aria-hidden', 'true'));

    // save
    if (saveSettings) saveSettings.addEventListener('click', () => {
            const cfg = {
            animScale: animSpeed ? animSpeed.value : '1',
            accentComplaint: accentComplaint ? accentComplaint.value : null,
            accentUrgency: accentUrgency ? accentUrgency.value : null,
            requireAllRatings: (document.getElementById('requireAllRatings') ? !!document.getElementById('requireAllRatings').checked : false),
            quoteLanguage: (document.getElementById('quoteLanguage') ? document.getElementById('quoteLanguage').value : 'auto')
        };
        applySettings(cfg);
        saveSettingsToStorage(cfg);
        showToast('Settings saved');
        settingsPanel.setAttribute('aria-hidden', 'true');
    });

    if (resetSettings) resetSettings.addEventListener('click', () => {
        localStorage.removeItem('rgipt_settings');
        // reset to defaults
        applySettings({ animScale: '1', accentComplaint: '#ff7a59', accentUrgency: '#f5576c' });
        showToast('Settings reset to defaults');
    });

    // Live preview while adjusting inputs
    if (animSpeed) {
        animSpeed.addEventListener('input', () => {
            const val = animSpeed.value;
            const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
            if (mq && mq.matches) return; // don't apply if reduced-motion
            document.documentElement.style.setProperty('--anim-scale', val);
        });
    }
    if (accentComplaint) accentComplaint.addEventListener('input', () => document.documentElement.style.setProperty('--accent-complaint', accentComplaint.value));
    if (accentUrgency) accentUrgency.addEventListener('input', () => document.documentElement.style.setProperty('--accent-urgency', accentUrgency.value));

    // Close settings on outside click or Escape
    document.addEventListener('click', (e) => {
        if (!settingsPanel) return;
        if (settingsPanel.getAttribute('aria-hidden') === 'false') {
            const inner = settingsPanel.querySelector('.settings-inner');
            if (inner && !inner.contains(e.target) && !document.getElementById('settingsBtn').contains(e.target)) {
                settingsPanel.setAttribute('aria-hidden', 'true');
            }
        }
    });
    document.addEventListener('keydown', (e) => {
        if (!settingsPanel) return;
        if (e.key === 'Escape' && settingsPanel.getAttribute('aria-hidden') === 'false') {
            settingsPanel.setAttribute('aria-hidden', 'true');
        }
    });

    // initialize from storage
    const cfg = loadSettings();
    if (cfg) applySettings(cfg);
}

// ===== Loading Screen =====
function initializeLoadingScreen() {
    const loadingScreen = document.getElementById('loadingScreen');
    
    setTimeout(() => {
        loadingScreen.style.opacity = '0';
        setTimeout(() => {
            loadingScreen.style.display = 'none';
        }, 500);
    }, 2500);
}

// ===== Navigation =====
function initializeNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('.section');

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href').substring(1);
            
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            
            sections.forEach(s => s.classList.remove('active'));
            document.getElementById(targetId).classList.add('active');
            
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    });

    // Notification button: jump to Announcements
    const notifBtn = document.getElementById('notifBtn');
    if (notifBtn) {
        // Replace dead button with a lightweight popover that lists recent announcements
        let popover = null;
        function closePopover() {
            if (popover) { popover.remove(); popover = null; document.removeEventListener('click', outsideHandler); }
        }
        function outsideHandler(ev) {
            if (!popover) return;
            if (!popover.contains(ev.target) && !notifBtn.contains(ev.target)) closePopover();
        }

        notifBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            // toggle
            if (popover) { closePopover(); return; }

            const ann = (typeof ANNOUNCEMENTS !== 'undefined' && Array.isArray(ANNOUNCEMENTS)) ? ANNOUNCEMENTS : [];
            const badge = notifBtn.querySelector('.notif-badge');

            if (!ann.length) {
                // show a small toast when there are no notifications
                if (badge) badge.style.display = 'none';
                showToast('No new notifications');
                return;
            }

            // build popover
            popover = document.createElement('div');
            popover.className = 'notification-popover';
            // minimal inline styles so this works without CSS changes
            popover.style.position = 'absolute';
            popover.style.minWidth = '220px';
            popover.style.maxWidth = '360px';
            popover.style.background = 'var(--select-bg, #fff)';
            popover.style.border = '1px solid var(--border-color, rgba(0,0,0,0.08))';
            popover.style.boxShadow = '0 8px 30px rgba(0,0,0,0.12)';
            popover.style.padding = '10px';
            popover.style.borderRadius = '8px';
            popover.style.zIndex = '9999';

            // position it under the button (try to keep within viewport)
            const btnRect = notifBtn.getBoundingClientRect();
            const top = window.scrollY + btnRect.bottom + 8;
            let right = Math.max(12, (document.documentElement.clientWidth - btnRect.right) + 12);
            popover.style.top = top + 'px';
            popover.style.right = right + 'px';

            // small escaper
            const esc = (s) => String(s).replace(/[&<>"'`]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;",'`':'&#96;' }[c]));

            // build content: header + up to 3 latest announcements
            const items = ann.slice(0,3).map(a => `<div style="padding:6px 0;border-bottom:1px solid rgba(0,0,0,0.06);font-size:0.95rem">${esc(a)}</div>`).join('');
            popover.innerHTML = `
                <div style="font-weight:700;margin-bottom:6px">Notifications</div>
                <div>${items}</div>
                <div style="display:flex;gap:8px;margin-top:8px;justify-content:flex-end">
                    <button class="btn btn-primary" id="viewAllNotifs">View All</button>
                    <button class="btn" id="dismissNotifs">Dismiss</button>
                </div>
            `;

            document.body.appendChild(popover);

            // wire buttons
            const viewAll = document.getElementById('viewAllNotifs');
            const dismiss = document.getElementById('dismissNotifs');
            if (viewAll) viewAll.addEventListener('click', () => { closePopover(); scrollToSection('announcements'); if (badge) badge.style.display = 'none'; });
            if (dismiss) dismiss.addEventListener('click', () => { closePopover(); if (badge) badge.style.display = 'none'; });

            // close on outside click
            setTimeout(() => document.addEventListener('click', outsideHandler), 10);
        });
    }
}

// Scroll-spy removed per user request. Navigation active state is managed by click handlers.

function scrollToSection(sectionId) {
    const navLink = document.querySelector(`[href="#${sectionId}"]`);
    if (navLink) {
        navLink.click();
    }
}

// ===== Theme Toggle =====
function initializeThemeToggle() {
    const themeToggle = document.getElementById('themeToggle');
    const body = document.body;
    const icon = themeToggle.querySelector('i');
    
    // Load saved theme (default to dark)
    const savedTheme = localStorage.getItem('theme') || 'dark';
    if (savedTheme === 'dark') {
        body.classList.add('theme-dark');
        // show sun icon when dark (indicates click -> switch to light)
        icon.classList.remove('fa-moon');
        icon.classList.add('fa-sun');
        icon.classList.add('theme-icon-active');
    } else {
        body.classList.remove('theme-dark');
        // show moon icon when light (indicates click -> switch to dark)
        icon.classList.remove('fa-sun');
        icon.classList.add('fa-moon');
        icon.classList.add('theme-icon-active');
    }
    
    themeToggle.addEventListener('click', () => {
        // add a transient class to smooth transitions
        document.body.classList.add('theme-switching');
        setTimeout(() => document.body.classList.remove('theme-switching'), 420);
        body.classList.toggle('theme-dark');
        
        if (body.classList.contains('theme-dark')) {
            icon.classList.remove('fa-moon');
            icon.classList.add('fa-sun');
            icon.classList.add('theme-icon-active');
            localStorage.setItem('theme', 'dark');
        } else {
            icon.classList.remove('fa-sun');
            icon.classList.add('fa-moon');
            icon.classList.add('theme-icon-active');
            localStorage.setItem('theme', 'light');
        }
    });
}

// ===== Meal Tabs =====
function initializeMealTabs() {
    const tabs = document.querySelectorAll('.meal-tab');
    const days = document.querySelectorAll('.meal-day');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const day = tab.getAttribute('data-day');
            
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            days.forEach(d => {
                d.style.display = 'none';
                if (d.getAttribute('data-day') === day) {
                    d.style.display = 'block';
                }
            });
        });
    });
}

// ===== Forms (feedback) =====
function initializeFeedbackForms() {
    try {
        const EMOJI_MAP = { '1': '😡', '2': '😕', '3': '😐', '4': '🙂', '5': '😁' };

        // Emoji buttons: click to select, update corresponding select fallback
        document.querySelectorAll('.emoji-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const target = btn.dataset.target;
                const val = btn.dataset.value;
                if (!target) return;

                // deselect siblings, select this one
                document.querySelectorAll(`.emoji-btn[data-target="${target}"]`).forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');

                const sel = document.getElementById(`${target}Select`);
                if (sel) sel.value = val;
            });
        });

        // When select fallback changes, update emoji highlight
        ['facilities','food','clean'].forEach(target => {
            const sel = document.getElementById(`${target}Select`);
            if (!sel) return;
            sel.addEventListener('change', () => {
                const v = sel.value;
                document.querySelectorAll(`.emoji-btn[data-target="${target}"]`).forEach(b => {
                    b.classList.toggle('selected', b.dataset.value === v);
                });
            });
        });

        // Build custom feedback-type dropdown (icons + background)
        const feedbackSelect = document.getElementById('feedbackType');
        const customFeedbackRoot = document.getElementById('customFeedbackSelect');
        const customFeedbackList = document.getElementById('customFeedbackOptions');
        function refreshFeedbackIcon() {
            const iconEl = customFeedbackRoot ? customFeedbackRoot.querySelector('.select-icon') : null;
            if (!feedbackSelect || !customFeedbackRoot) return;
            const opt = feedbackSelect.options[feedbackSelect.selectedIndex];
            const iconClass = opt ? opt.getAttribute('data-icon') : null;
            // ensure the select-with-icon's select-icon shows the icon (if present)
            const containerIcon = customFeedbackRoot.closest('.select-with-icon') ? customFeedbackRoot.closest('.select-with-icon').querySelector('.select-icon') : null;
            if (containerIcon) containerIcon.innerHTML = iconClass ? `<i class="${iconClass}"></i>` : '';
        }

        if (customFeedbackRoot && customFeedbackList && feedbackSelect) {
            const options = Array.from(feedbackSelect.options).map(o => ({ value: o.value, label: o.text, icon: o.getAttribute('data-icon') }));
            customFeedbackList.innerHTML = options.map((opt, idx) => {
                const iconHtml = opt.icon ? `<i class="${opt.icon} fa-fw"></i>` : '';
                return `<div class="custom-option" role="option" data-value="${opt.value}" tabindex="-1" style="transition-delay:${idx*30}ms">${iconHtml}<span>${opt.label}</span></div>`;
            }).join('');

            const listEls = Array.from(customFeedbackList.querySelectorAll('.custom-option'));
            function openFeedbackCustom() { customFeedbackRoot.classList.add('open'); customFeedbackList.classList.add('open'); customFeedbackRoot.setAttribute('aria-expanded','true'); customFeedbackList.setAttribute('aria-hidden','false'); if (listEls[0]) listEls[0].focus(); }
            function closeFeedbackCustom() { customFeedbackRoot.classList.remove('open'); customFeedbackList.classList.remove('open'); customFeedbackRoot.setAttribute('aria-expanded','false'); customFeedbackList.setAttribute('aria-hidden','true'); customFeedbackRoot.focus(); }

            customFeedbackRoot.addEventListener('click', () => { if (customFeedbackList.classList.contains('open')) closeFeedbackCustom(); else openFeedbackCustom(); });
            customFeedbackRoot.addEventListener('keydown', (e) => { if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openFeedbackCustom(); } if (e.key === 'Escape') closeFeedbackCustom(); });

            listEls.forEach((el, i) => {
                el.addEventListener('click', () => {
                    const v = el.getAttribute('data-value');
                    feedbackSelect.value = v; feedbackSelect.dispatchEvent(new Event('change'));
                    customFeedbackRoot.querySelector('.custom-value').textContent = el.querySelector('span').textContent.trim();
                    listEls.forEach(o => o.setAttribute('aria-selected','false'));
                    el.setAttribute('aria-selected','true');
                    refreshFeedbackIcon();
                    closeFeedbackCustom();
                });
                el.addEventListener('keydown', (e) => { if (e.key === 'ArrowDown') { e.preventDefault(); if (listEls[i+1]) listEls[i+1].focus(); } if (e.key === 'ArrowUp') { e.preventDefault(); if (listEls[i-1]) listEls[i-1].focus(); else customFeedbackRoot.focus(); } if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); el.click(); } if (e.key === 'Escape') { e.preventDefault(); closeFeedbackCustom(); } });
            });

            // init displayed text
            const initOpt = feedbackSelect.options[feedbackSelect.selectedIndex];
            customFeedbackRoot.querySelector('.custom-value').textContent = initOpt ? initOpt.text : 'General';
            refreshFeedbackIcon();
        }

        // Render saved feedback
        function renderFeedbackList() {
            const listEl = document.getElementById('feedbackList');
            if (!listEl) return;
            const raw = localStorage.getItem('feedback_entries');
            let entries = [];
            try { entries = raw ? JSON.parse(raw) : []; } catch (e) { entries = []; }

            // apply name filter if present
            const filterName = (document.getElementById('feedbackFilterName') ? document.getElementById('feedbackFilterName').value.trim().toLowerCase() : '');
            if (filterName) entries = entries.filter(en => (en.name || '').toLowerCase().includes(filterName));

            if (!entries.length) {
                listEl.innerHTML = '<div class="muted">No feedback submitted yet.</div>';
                return;
            }

            listEl.innerHTML = entries.slice().reverse().map(e => {
                const fac = e.ratings.facilities ? `${e.ratings.facilities} ${EMOJI_MAP[e.ratings.facilities] || ''}` : '—';
                const food = e.ratings.food ? `${e.ratings.food} ${EMOJI_MAP[e.ratings.food] || ''}` : '—';
                const clean = e.ratings.clean ? `${e.ratings.clean} ${EMOJI_MAP[e.ratings.clean] || ''}` : '—';
                const when = new Date(e.createdAt).toLocaleString();
                return `
                    <div class="complaint-item card-hero" style="padding:12px;margin-bottom:10px;border-radius:8px;">
                        <div class="complaint-item-header" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                            <div style="font-weight:700">${e.name || 'Anonymous'}</div>
                            <div style="font-size:12px;color:var(--text-secondary)">${when}</div>
                        </div>
                        <div style="color:var(--text-secondary);margin-bottom:6px">${e.room ? e.room + ' • ' : ''}<em>${e.type || 'General'}</em></div>
                        <div style="display:flex;gap:1rem;flex-wrap:wrap;margin-bottom:8px;">
                            <div><strong>Facilities:</strong> ${fac}</div>
                            <div><strong>Food:</strong> ${food}</div>
                            <div><strong>Cleanliness:</strong> ${clean}</div>
                        </div>
                        <div>${e.comments ? `<div style="margin-top:6px">${escapeHtml(e.comments)}</div>` : ''}</div>
                        <div style="display:flex;gap:0.5rem;margin-top:8px;">
                            <button class="btn btn-secondary edit-feedback" data-id="${e.id}">Edit</button>
                            <button class="btn btn-secondary delete-feedback" data-id="${e.id}">Delete</button>
                        </div>
                    </div>
                `;
            }).join('');

            // wire edit/delete buttons
            listEl.querySelectorAll('.edit-feedback').forEach(btn => btn.addEventListener('click', (ev) => {
                const id = Number(btn.getAttribute('data-id'));
                try {
                    const entries = JSON.parse(localStorage.getItem('feedback_entries') || '[]');
                    const entry = entries.find(en => en.id === id);
                    if (!entry) return;
                    // populate form
                    document.getElementById('feedbackName').value = entry.name || '';
                    document.getElementById('feedbackRoom').value = entry.room || '';
                    document.getElementById('feedbackComments').value = entry.comments || '';
                    if (document.getElementById('feedbackType')) document.getElementById('feedbackType').value = entry.type || 'general';
                    // set select visible value if custom exists
                    const cf = document.getElementById('customFeedbackSelect'); if (cf && cf.querySelector('.custom-value')) cf.querySelector('.custom-value').textContent = (document.getElementById('feedbackType').selectedOptions[0] || {}).text || 'General';
                    // clear emoji selected and set according to entry
                    document.querySelectorAll('.emoji-btn.selected').forEach(b => b.classList.remove('selected'));
                    if (entry.ratings) {
                        ['facilities','food','clean'].forEach(t => {
                            if (entry.ratings[t]) {
                                const b = document.querySelector(`.emoji-btn[data-target="${t}"][data-value="${entry.ratings[t]}"]`);
                                if (b) b.classList.add('selected');
                                const sel = document.getElementById(t + 'Select'); if (sel) sel.value = entry.ratings[t];
                            }
                        });
                    }
                    // enter editing mode
                    editingId = id;
                    const submitBtn = document.getElementById('submitFeedback'); if (submitBtn) submitBtn.innerHTML = '<i class="fas fa-save"></i> Save Changes';
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                } catch (e) { console.error('edit failed', e); }
            }));

            listEl.querySelectorAll('.delete-feedback').forEach(btn => btn.addEventListener('click', (ev) => {
                const id = Number(btn.getAttribute('data-id'));
                if (!confirm('Delete this feedback? This cannot be undone.')) return;
                try {
                    let entries = JSON.parse(localStorage.getItem('feedback_entries') || '[]');
                    entries = entries.filter(en => en.id !== id);
                    localStorage.setItem('feedback_entries', JSON.stringify(entries));
                    // remove from pending
                    removePendingById(id);
                    renderFeedbackList();
                    if (typeof showToast === 'function') showToast('Feedback deleted');
                } catch (e) { console.error('delete failed', e); }
            }));
        }

        // simple escape
        function escapeHtml(s) { return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

        // Network + local fallback helpers
        const FEEDBACK_ENDPOINT = (localStorage.getItem('feedback_endpoint') || '/api/feedback');

        function postWithTimeout(url, data, timeout = 8000) {
            return new Promise((resolve, reject) => {
                let done = false;
                const timer = setTimeout(() => {
                    if (done) return;
                    done = true;
                    reject(new Error('timeout'));
                }, timeout);

                fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                }).then(resp => {
                    if (done) return;
                    clearTimeout(timer);
                    done = true;
                    if (!resp.ok) return reject(new Error('server ' + resp.status));
                    resolve(resp.json ? resp.json().catch(() => null) : null);
                }).catch(err => {
                    if (done) return;
                    clearTimeout(timer);
                    done = true;
                    reject(err);
                });
            });
        }

        async function sendToServer(entry) {
            try {
                await postWithTimeout(FEEDBACK_ENDPOINT, entry, 8000);
                return true;
            } catch (e) {
                console.warn('Feedback send failed:', e);
                return false;
            }
        }

        function enqueuePending(entry) {
            try {
                const pending = JSON.parse(localStorage.getItem('feedback_pending') || '[]');
                pending.push(entry);
                localStorage.setItem('feedback_pending', JSON.stringify(pending));
            } catch (e) { console.error('enqueuePending error', e); }
        }

        function removePendingById(id) {
            try {
                let pending = JSON.parse(localStorage.getItem('feedback_pending') || '[]');
                pending = pending.filter(p => p.id !== id);
                localStorage.setItem('feedback_pending', JSON.stringify(pending));
            } catch (e) { console.error('removePending error', e); }
        }

        async function flushPending() {
            try {
                const pending = JSON.parse(localStorage.getItem('feedback_pending') || '[]');
                if (!pending || !pending.length) return;
                // attempt each in sequence
                for (const p of pending.slice()) {
                    const ok = await sendToServer(p);
                    if (ok) removePendingById(p.id);
                }
            } catch (e) { console.error('flushPending error', e); }
        }

        // Submit handler + edit flow
        const form = document.getElementById('feedbackForm');
        let editingId = null;
        const cancelBtn = document.getElementById('cancelFeedback');
        if (cancelBtn) cancelBtn.addEventListener('click', () => {
            editingId = null;
            if (form) form.reset();
            document.querySelectorAll('.emoji-btn.selected').forEach(b => b.classList.remove('selected'));
            const submitBtn = document.getElementById('submitFeedback'); if (submitBtn) submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Submit Feedback';
        });

        if (form) {
            form.addEventListener('submit', async (ev) => {
                ev.preventDefault();
                const name = document.getElementById('feedbackName') ? document.getElementById('feedbackName').value.trim() : '';
                const room = document.getElementById('feedbackRoom') ? document.getElementById('feedbackRoom').value.trim() : '';
                const type = document.getElementById('feedbackType') ? document.getElementById('feedbackType').value : 'general';
                const comments = document.getElementById('feedbackComments') ? document.getElementById('feedbackComments').value.trim() : '';

                function getRating(target) {
                    const sel = document.getElementById(target + 'Select');
                    const emoji = document.querySelector(`.emoji-btn[data-target="${target}"].selected`);
                    if (emoji && emoji.dataset && emoji.dataset.value) return emoji.dataset.value;
                    if (sel) return sel.value || '';
                    return '';
                }

                // Validation: require either at least one rating or all three based on settings
                const requireAll = (() => {
                    try { const cfg = JSON.parse(localStorage.getItem('rgipt_settings') || '{}'); return !!cfg.requireAllRatings || !!document.getElementById('requireAllRatings') && document.getElementById('requireAllRatings').checked; } catch (e) { return false; }
                })();

                const rFac = getRating('facilities'); const rFood = getRating('food'); const rClean = getRating('clean');
                if (requireAll) {
                    if (!rFac || !rFood || !rClean) { if (typeof showToast === 'function') showToast('Please provide all three ratings.'); return; }
                } else {
                    if (!rFac && !rFood && !rClean) { if (typeof showToast === 'function') showToast('Please provide at least one rating.'); return; }
                }


                const entry = {
                    id: editingId || Date.now(),
                    name, room, type, comments,
                    ratings: { facilities: rFac, food: rFood, clean: rClean },
                    createdAt: editingId ? (new Date().toISOString()) : new Date().toISOString()
                };

                // If editing, update existing record and pending queue where necessary
                if (editingId) {
                    // update feedback_entries
                    try {
                        let entries = JSON.parse(localStorage.getItem('feedback_entries') || '[]');
                        entries = entries.map(en => en.id === editingId ? entry : en);
                        localStorage.setItem('feedback_entries', JSON.stringify(entries));
                    } catch (e) { console.error('update entries failed', e); }
                    // update pending queue if present
                    try {
                        let pending = JSON.parse(localStorage.getItem('feedback_pending') || '[]');
                        pending = pending.map(p => p.id === editingId ? entry : p);
                        localStorage.setItem('feedback_pending', JSON.stringify(pending));
                    } catch (e) { /* ignore */ }
                } else {
                    // persist new
                    try {
                        const entries = JSON.parse(localStorage.getItem('feedback_entries') || '[]');
                        entries.push(entry);
                        localStorage.setItem('feedback_entries', JSON.stringify(entries));
                    } catch (e) { console.error('persist feedback_entries failed', e); }
                }

                // persist locally (for UI and audit)
                try {
                    const entries = JSON.parse(localStorage.getItem('feedback_entries') || '[]');
                    entries.push(entry);
                    localStorage.setItem('feedback_entries', JSON.stringify(entries));
                } catch (e) { console.error('persist feedback_entries failed', e); }

                // reset UI
                form.reset();
                document.querySelectorAll('.emoji-btn.selected').forEach(b => b.classList.remove('selected'));

                renderFeedbackList();

                // Attempt to send to server; if fails, queue for retry
                const sent = await sendToServer(entry);
                if (sent) {
                    if (typeof showToast === 'function') showToast(editingId ? 'Feedback updated on server' : 'Feedback sent to server — thank you!');
                    // if it was in pending, remove
                    removePendingById(entry.id);
                } else {
                    enqueuePending(entry);
                    if (typeof showToast === 'function') showToast('Offline: feedback saved locally and will be retried.');
                }

                editingId = null;
                const submitBtn = document.getElementById('submitFeedback'); if (submitBtn) submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Submit Feedback';
            });
        }

        // try flushing pending items now and periodically
        flushPending();
        setInterval(() => flushPending(), 30000);

        // Clear all feedback helper
        function clearAllFeedback() {
            if (!confirm('Are you sure you want to delete ALL feedback? This cannot be undone.')) return;
            try {
                localStorage.removeItem('feedback_entries');
                localStorage.removeItem('feedback_pending');
                renderFeedbackList();
                if (typeof showToast === 'function') showToast('All feedback cleared');
            } catch (e) { console.error('clearAllFeedback failed', e); }
        }

        // Wire clear all buttons if present
        const clearAllBtns = document.querySelectorAll('#clearAllFeedbackBtn');
        clearAllBtns.forEach(b => b.addEventListener('click', clearAllFeedback));

        // Expose helper on window for CLI convenience
        window.clearAllFeedback = clearAllFeedback;

        // initial render
        renderFeedbackList();

        // Filter controls
        const filterBtn = document.getElementById('filterFeedbackBtn');
        const clearBtn = document.getElementById('clearFilterBtn');
        if (filterBtn) filterBtn.addEventListener('click', () => renderFeedbackList());
        if (clearBtn) clearBtn.addEventListener('click', () => { const f = document.getElementById('feedbackFilterName'); if (f) f.value = ''; renderFeedbackList(); });

        // add bouncy animation to random emoji occasionally to draw attention
        const emojiButtons = Array.from(document.querySelectorAll('.emoji-btn'));
        if (emojiButtons.length) {
            setInterval(() => {
                // clear any current bouncy
                emojiButtons.forEach(b => b.classList.remove('bouncy'));
                const i = Math.floor(Math.random() * emojiButtons.length);
                emojiButtons[i].classList.add('bouncy');
                // remove after 2.4s
                setTimeout(() => emojiButtons[i].classList.remove('bouncy'), 2400);
            }, 4200);
        }
    } catch (e) {
        console.error('initializeFeedbackForms failed', e);
    }
}

// Rating feature removed — related UI was deleted. Keep this placeholder in case it's reintroduced.

// ===== Complaint-related Forms =====
function initializeComplaintForms() {
    const complaintForm = document.getElementById('complaintForm');
    if (complaintForm) complaintForm.addEventListener('submit', handleComplaintSubmit);

    // Interactive complaint logo behaviour
    const complaintLogo = document.getElementById('complaintLogo');
    if (complaintLogo) {
        complaintLogo.addEventListener('click', () => {
            const roomInput = document.getElementById('roomNumber');
            if (roomInput) roomInput.focus();
            showToast('Ready to submit your complaint — form focused');
        });

        complaintLogo.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                complaintLogo.click();
            }
        });
    }

    // Update category icon beside select
    const categorySelect = document.getElementById('complaintCategory');
    const categoryIcon = document.getElementById('complaintCategoryIcon');
    // keep a visual icon next to the native select using Font Awesome
    function refreshCategoryIcon() {
        if (!categorySelect || !categoryIcon) return;
        const val = categorySelect.value;
        // find the native option and read its data-icon attribute
        const opt = categorySelect.querySelector(`option[value="${val}"]`);
        const iconClass = (opt && opt.getAttribute('data-icon')) || 'fas fa-search';
        categoryIcon.innerHTML = `<i class="${iconClass}"></i>`;
    }

    if (categorySelect) {
        categorySelect.addEventListener('change', refreshCategoryIcon);
        // init
        refreshCategoryIcon();
    }

    // Build a custom animated dropdown to replace white native select visuals
    const customRoot = document.getElementById('customComplaintSelect');
    const customList = document.getElementById('customComplaintOptions');
    if (customRoot && customList && categorySelect) {
        // populate options (read data-icon for consistent FA icons)
        const options = Array.from(categorySelect.options).map(opt => ({ value: opt.value, label: opt.text, icon: opt.getAttribute('data-icon') }));

        customList.innerHTML = options.slice(1).map((opt, idx) => {
            // Skip the placeholder option at index 0 for listing
            const iconHtml = opt.icon ? `<i class="${opt.icon} fa-fw"></i>` : '';
            const label = opt.label;
            return `<div class="custom-option" role="option" data-value="${opt.value}" tabindex="-1" style="transition-delay:${idx*40}ms">${iconHtml}<span>${label}</span></div>`;
        }).join('');

        const customOptions = Array.from(customList.querySelectorAll('.custom-option'));

        // initialize aria-selected according to native select
        customOptions.forEach(o => o.setAttribute('aria-selected', (o.getAttribute('data-value') === categorySelect.value) ? 'true' : 'false'));

        // Type-ahead for complaint custom select
        let compTypeBuffer = '';
        let compLastType = 0;
        const COMP_TYPE_TIMEOUT = 900;
        function clearCompBufferIfStale() { if (Date.now() - compLastType > COMP_TYPE_TIMEOUT) compTypeBuffer = ''; }
        customRoot.addEventListener('keydown', (e) => {
            if (e.key && e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
                e.preventDefault(); clearCompBufferIfStale(); compTypeBuffer += e.key.toLowerCase(); compLastType = Date.now();
                const match = customOptions.find(optEl => (optEl.querySelector('span') ? optEl.querySelector('span').textContent : optEl.textContent).trim().toLowerCase().startsWith(compTypeBuffer));
                if (match) { if (!customList.classList.contains('open')) openCustom(); match.focus(); }
                setTimeout(() => clearCompBufferIfStale(), COMP_TYPE_TIMEOUT + 10);
            }
        });

        function openCustom() {
            customRoot.classList.add('open');
            // also mark the outer select-with-icon container so CSS can show glow
            const container = customRoot.closest('.select-with-icon'); if (container) container.classList.add('open');
            customList.classList.add('open');
            customRoot.setAttribute('aria-expanded', 'true');
            customList.setAttribute('aria-hidden', 'false');
            // focus first option
            if (customOptions[0]) customOptions[0].focus();
        }

        function closeCustom() {
            customRoot.classList.remove('open');
            const container = customRoot.closest('.select-with-icon'); if (container) container.classList.remove('open');
            customList.classList.remove('open');
            customRoot.setAttribute('aria-expanded', 'false');
            customList.setAttribute('aria-hidden', 'true');
            customRoot.focus();
        }

        customRoot.addEventListener('click', () => {
            if (customList.classList.contains('open')) closeCustom(); else openCustom();
        });

        customRoot.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                openCustom();
            }
            if (e.key === 'Escape') closeCustom();
        });

        customOptions.forEach((optEl, i) => {
            optEl.addEventListener('click', () => {
                const val = optEl.getAttribute('data-value');
                categorySelect.value = val;
                categorySelect.dispatchEvent(new Event('change'));
                refreshCategoryIcon();
                // set displayed value (remove any icon text from displayed label)
                customRoot.querySelector('.custom-value').textContent = optEl.querySelector('span') ? optEl.querySelector('span').textContent.trim() : optEl.textContent.trim();
                // announce change to screen readers
                const live = document.getElementById('ariaLive');
                if (live) live.textContent = `Category changed to ${customRoot.querySelector('.custom-value').textContent}`;
                // set aria-selected
                customOptions.forEach(o => o.setAttribute('aria-selected', 'false'));
                optEl.setAttribute('aria-selected', 'true');
                closeCustom();
                // focus complaint description so user can write details
                const desc = document.getElementById('complaintDescription'); if (desc) desc.focus();
            });

            optEl.addEventListener('keydown', (e) => {
                if (e.key === 'ArrowDown') { e.preventDefault(); if (customOptions[i+1]) customOptions[i+1].focus(); }
                if (e.key === 'ArrowUp') { e.preventDefault(); if (customOptions[i-1]) customOptions[i-1].focus(); else customRoot.focus(); }
                if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); optEl.click(); }
                if (e.key === 'Escape') { e.preventDefault(); closeCustom(); }
            });
        });

        // Close on outside click
        document.addEventListener('click', (e) => {
            if (!customRoot.contains(e.target) && !customList.contains(e.target)) {
                closeCustom();
            }
        });

        // initialize displayed text from select
        const initOpt = categorySelect.options[categorySelect.selectedIndex];
        const initText = (initOpt && initOpt.text) ? initOpt.text.replace(/^\S+\s*/, '') : 'Select Category';
        customRoot.querySelector('.custom-value').textContent = initText || 'Select Category';
        // init icon
        refreshCategoryIcon();
    }

    // UI removed

    // --- Urgency custom select (complaint urgency) ---
    const urgencySelect = document.getElementById('urgencyLevel');
    const urgencyIconEl = document.getElementById('urgencyIcon');
    const customUrgRoot = document.getElementById('customUrgencySelect');
    const customUrgList = document.getElementById('customUrgencyOptions');

    function refreshUrgencyIcon() {
        if (!urgencySelect || !urgencyIconEl) return;
        const val = urgencySelect.value;
        const opt = urgencySelect.querySelector(`option[value="${val}"]`);
        const iconClass = (opt && opt.getAttribute('data-icon')) || 'fas fa-clock';
        urgencyIconEl.innerHTML = `<i class="${iconClass}"></i>`;
    }

    if (urgencySelect && customUrgRoot && customUrgList) {
        const urgOptions = Array.from(urgencySelect.options).map(o => ({ value: o.value, label: o.text, icon: o.getAttribute('data-icon') }));

        customUrgList.innerHTML = urgOptions.map((opt, idx) => {
            const iconHtml = opt.icon ? `<i class="${opt.icon} fa-fw"></i>` : '';
            return `<div class="custom-option" role="option" data-value="${opt.value}" tabindex="-1" style="transition-delay:${idx*30}ms">${iconHtml}<span>${opt.label}</span></div>`;
        }).join('');

        const urgEls = Array.from(customUrgList.querySelectorAll('.custom-option'));

        // initialize aria-selected
        urgEls.forEach(o => o.setAttribute('aria-selected', (o.getAttribute('data-value') === urgencySelect.value) ? 'true' : 'false'));

        // type-ahead for urgency
        let urgTypeBuf = '';
        let urgLast = 0;
        function clearUrgBufIfStale() { if (Date.now() - urgLast > 900) urgTypeBuf = ''; }
        customUrgRoot.addEventListener('keydown', (e) => {
            if (e.key && e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
                e.preventDefault(); clearUrgBufIfStale(); urgTypeBuf += e.key.toLowerCase(); urgLast = Date.now();
                const match = urgEls.find(optEl => (optEl.querySelector('span') ? optEl.querySelector('span').textContent : optEl.textContent).trim().toLowerCase().startsWith(urgTypeBuf));
                if (match) { if (!customUrgList.classList.contains('open')) openUrg(); match.focus(); }
                setTimeout(() => clearUrgBufIfStale(), 910);
            }
        });

    function openUrg() { customUrgRoot.classList.add('open'); const container = customUrgRoot.closest('.select-with-icon'); if (container) container.classList.add('open'); customUrgList.classList.add('open'); customUrgRoot.setAttribute('aria-expanded','true'); customUrgList.setAttribute('aria-hidden','false'); if (urgEls[0]) urgEls[0].focus(); }
    function closeUrg() { customUrgRoot.classList.remove('open'); const container = customUrgRoot.closest('.select-with-icon'); if (container) container.classList.remove('open'); customUrgList.classList.remove('open'); customUrgRoot.setAttribute('aria-expanded','false'); customUrgList.setAttribute('aria-hidden','true'); customUrgRoot.focus(); }

        customUrgRoot.addEventListener('click', () => { if (customUrgList.classList.contains('open')) closeUrg(); else openUrg(); });
        customUrgRoot.addEventListener('keydown', (e) => { if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openUrg(); } if (e.key === 'Escape') closeUrg(); });

        urgEls.forEach((el, i) => {
            el.addEventListener('click', () => {
                const v = el.getAttribute('data-value');
                urgencySelect.value = v; urgencySelect.dispatchEvent(new Event('change'));
                customUrgRoot.querySelector('.custom-value').textContent = el.querySelector('span').textContent.trim();
                urgEls.forEach(o => o.setAttribute('aria-selected','false'));
                el.setAttribute('aria-selected','true');
                // refresh icon
                refreshUrgencyIcon();
                // announce
                const live = document.getElementById('ariaLive'); if (live) live.textContent = `Urgency set to ${customUrgRoot.querySelector('.custom-value').textContent}`;
                closeUrg();
            });
            el.addEventListener('keydown', (e) => { if (e.key === 'ArrowDown') { e.preventDefault(); if (urgEls[i+1]) urgEls[i+1].focus(); } if (e.key === 'ArrowUp') { e.preventDefault(); if (urgEls[i-1]) urgEls[i-1].focus(); else customUrgRoot.focus(); } if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); el.click(); } if (e.key === 'Escape') { e.preventDefault(); closeUrg(); } });
        });

        document.addEventListener('click', (e) => { if (!customUrgRoot.contains(e.target) && !customUrgList.contains(e.target)) closeUrg(); });

        // init
        const initUrg = urgencySelect.options[urgencySelect.selectedIndex];
        if (initUrg) customUrgRoot.querySelector('.custom-value').textContent = initUrg.text;
        refreshUrgencyIcon();
    }
}

function handleComplaintSubmit(e) {
    e.preventDefault();
    const complaintForm = document.getElementById('complaintForm');
    
    const complaint = {
        id: Date.now(),
        name: (document.getElementById('complaintName') ? document.getElementById('complaintName').value : ''),
        category: document.getElementById('complaintCategory').value,
        room: document.getElementById('roomNumber').value,
        description: document.getElementById('complaintDescription').value,
        // urgency selector was removed from the form; read only if present
        urgency: (document.getElementById('urgencyLevel') ? document.getElementById('urgencyLevel').value : ''),
        status: 'pending',
        date: new Date().toLocaleDateString()
    };
    
    const complaints = JSON.parse(localStorage.getItem('complaints') || '[]');
    complaints.push(complaint);
    localStorage.setItem('complaints', JSON.stringify(complaints));
    
    showToast('Complaint submitted successfully!');
    complaintForm.reset();
    // Reset custom selects
    const complaintCategorySelect = document.getElementById('customComplaintSelect');
    if (complaintCategorySelect) {
        complaintCategorySelect.querySelector('.custom-value').textContent = 'Select Category';
    }
    loadComplaints();
}

// --- Complaint server + pending queue (reusing feedback network helpers) ---
const COMPLAINT_ENDPOINT = (localStorage.getItem('complaint_endpoint') || '/api/complaints');

function enqueueComplaintPending(entry) {
    try {
        const pending = JSON.parse(localStorage.getItem('complaint_pending') || '[]');
        pending.push(entry);
        localStorage.setItem('complaint_pending', JSON.stringify(pending));
    } catch (e) { console.error('enqueueComplaintPending error', e); }
}

function removeComplaintPendingById(id) {
    try {
        let pending = JSON.parse(localStorage.getItem('complaint_pending') || '[]');
        pending = pending.filter(p => p.id !== id);
        localStorage.setItem('complaint_pending', JSON.stringify(pending));
    } catch (e) { console.error('removeComplaintPendingById error', e); }
}

async function sendComplaintToServer(entry) {
    try {
        await postWithTimeout(COMPLAINT_ENDPOINT, entry, 8000);
        return true;
    } catch (e) {
        console.warn('Complaint send failed:', e);
        return false;
    }
}

async function flushComplaintPending() {
    try {
        const pending = JSON.parse(localStorage.getItem('complaint_pending') || '[]');
        if (!pending || !pending.length) return;
        for (const p of pending.slice()) {
            const ok = await sendComplaintToServer(p);
            if (ok) removeComplaintPendingById(p.id);
        }
    } catch (e) { console.error('flushComplaintPending error', e); }
}

// Submit handling removed

function loadComplaints() {
    const complaints = JSON.parse(localStorage.getItem('complaints') || '[]');
    const complaintsList = document.getElementById('complaintsList');
    const filterName = (document.getElementById('complaintFilterName') || {}).value || '';

    const filtered = complaints.filter(c => {
        if (!filterName) return true;
        return (c.name || '').toLowerCase().includes(filterName.toLowerCase());
    });

    if (!filtered.length) {
        complaintsList.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">No complaints submitted yet.</p>';
        return;
    }

    // read pending ids to show status
    const pending = JSON.parse(localStorage.getItem('complaint_pending') || '[]');
    const pendingIds = new Set((pending || []).map(p => p.id));

    complaintsList.innerHTML = filtered.slice(-20).reverse().map(complaint => {
        const urgencyPart = complaint.urgency ? ` | <i class="fas fa-exclamation-triangle"></i> ${complaint.urgency}` : '';
        const namePart = complaint.name ? `<div style="color:var(--text-secondary);font-size:0.95rem;margin-bottom:0.25rem;"><i class="fas fa-user"></i> ${complaint.name}</div>` : '';
        const statusBadge = pendingIds.has(complaint.id) ? `<span class="complaint-status status-pending">PENDING</span>` : `<span class="complaint-status status-${complaint.status}">${complaint.status.toUpperCase()}</span>`;
        const severity = complaint.severity ? `<div style="margin-top:0.5rem;">Severity: ${escapeHtml(complaint.severity)}</div>` : '';
        return `
        <div class="complaint-item">
            <div class="complaint-item-header">
                <h4>${complaint.category.toUpperCase()} - ${complaint.room}</h4>
                ${statusBadge}
            </div>
            ${namePart}
            <p style="margin: 0.5rem 0;">${escapeHtml(complaint.description)}</p>
            ${severity}
            <div style="display:flex;gap:0.6rem;align-items:center;margin-top:0.6rem;">
                <div style="color: var(--text-secondary); font-size: 0.9rem;">
                    <i class="fas fa-calendar"></i> ${escapeHtml(complaint.date || '')}${urgencyPart}
                </div>
                <div style="margin-left:auto;display:flex;gap:0.4rem;">
                    <button class="btn btn-small edit-complaint" data-id="${complaint.id}"><i class="fas fa-edit"></i></button>
                    <button class="btn btn-small delete-complaint" data-id="${complaint.id}"><i class="fas fa-trash"></i></button>
                </div>
            </div>
        </div>
    `;
    }).join('');
}



// Timetable functionality removed

// ===== Toast Notification =====
function showToast(message) {
    const toast = document.getElementById('toast');
    const messageElement = toast.querySelector('.toast-message');
    messageElement.textContent = message;
    
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// ===== Announcements ticker (rotate every second) =====
const ANNOUNCEMENTS_URL = localStorage.getItem('announcements_url') || '';
let ANNOUNCEMENTS = [
    'New mess menu will be implemented from November 1st, 2025!',
    'Welcome to RGIPT Home — check the events calendar for updates.',
    'Hostel inspection scheduled next week — please maintain cleanliness.',
    'Mess timings updated: Breakfast 7:30-9:30 AM starting next week.',
    'Register for Urjotsav 2025 events now — deadlines approaching.'
];
let annIndex = 0;

async function fetchAnnouncementsOnce() {
    if (!ANNOUNCEMENTS_URL) return;
    try {
        const resp = await fetch(ANNOUNCEMENTS_URL);
        if (!resp.ok) return;
        const data = await resp.json();
        if (Array.isArray(data) && data.length) {
            ANNOUNCEMENTS = data;
            annIndex = 0;
        }
    } catch (e) {
        console.warn('fetchAnnouncementsOnce failed', e);
    }
}

function rotateAnnouncements() {
    const textEl = document.getElementById('announcementText');
    const counter = document.getElementById('announcementCounter');
    if (!textEl) return;
    if (!ANNOUNCEMENTS || !ANNOUNCEMENTS.length) {
        textEl.textContent = 'No announcements available.';
        if (counter) counter.textContent = '0/0';
        return;
    }
    annIndex = (annIndex + 1) % ANNOUNCEMENTS.length;
    // update text with a short fade
    const prev = textEl.textContent;
    textEl.style.opacity = '0';
    setTimeout(() => {
        textEl.textContent = ANNOUNCEMENTS[annIndex];
        textEl.style.opacity = '1';
    }, 180);
    if (counter) counter.textContent = `${annIndex+1}/${ANNOUNCEMENTS.length}`;
}

// try fetching announcements from configured URL once, then rotate every second
fetchAnnouncementsOnce().finally(() => {
    rotateAnnouncements();
    setInterval(rotateAnnouncements, 1000);
});

// ===== Boot animation trigger on RGIPT logo click =====
const rgiptLogoEl = document.querySelector('.rgipt-logo');
if (rgiptLogoEl) {
    rgiptLogoEl.addEventListener('click', () => {
        const loader = document.getElementById('loadingScreen');
        if (!loader) return;
        // show loader and then hide after a short delay to simulate boot
        loader.style.display = 'flex';
        loader.style.pointerEvents = 'auto';
        setTimeout(() => {
            // reverse the animation by setting display none after some time
            loader.style.pointerEvents = 'none';
            loader.style.display = 'none';
        }, 1800);
    });
    // keyboard accessible
    rgiptLogoEl.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); rgiptLogoEl.click(); } });
}

// Wire complaint list actions (edit/delete) after rendering
document.addEventListener('click', (ev) => {
    const editBtn = ev.target.closest && ev.target.closest('.edit-complaint');
    const delBtn = ev.target.closest && ev.target.closest('.delete-complaint');
    if (editBtn) {
        const id = Number(editBtn.getAttribute('data-id'));
        try {
            const complaints = JSON.parse(localStorage.getItem('complaints') || '[]');
            const item = complaints.find(c => c.id === id);
            if (!item) return;
            // populate form
            document.getElementById('complaintName').value = item.name || '';
            document.getElementById('roomNumber').value = item.room || '';
            document.getElementById('complaintDescription').value = item.description || '';
            if (document.getElementById('complaintCategory')) document.getElementById('complaintCategory').value = item.category || '';
            // severity: set emoji/select
            document.querySelectorAll('.emoji-btn.selected').forEach(b => b.classList.remove('selected'));
            if (item.severity) {
                const b = document.querySelector(`.emoji-btn[data-target="severity"][data-value="${item.severity}"]`);
                if (b) b.classList.add('selected');
                const sel = document.getElementById('severitySelect'); if (sel) sel.value = item.severity;
            }
            // set editing marker
            window._editingComplaintId = id;
            // scroll to form
            document.getElementById('complaintForm').scrollIntoView({ behavior: 'smooth' });
            showToast('Loaded complaint for editing. Submit to save changes.');
        } catch (e) { console.error('edit complaint failed', e); }
    }
    if (delBtn) {
        const id = Number(delBtn.getAttribute('data-id'));
        if (!confirm('Delete this complaint? This cannot be undone.')) return;
        try {
            let complaints = JSON.parse(localStorage.getItem('complaints') || '[]');
            complaints = complaints.filter(c => c.id !== id);
            localStorage.setItem('complaints', JSON.stringify(complaints));
            removeComplaintPendingById(id);
            loadComplaints();
            showToast('Complaint deleted');
        } catch (e) { console.error('delete complaint failed', e); }
    }
});

// Handle complaint form submit for edit/save
const complaintFormEl = document.getElementById('complaintForm');
if (complaintFormEl) {
    complaintFormEl.addEventListener('submit', async (ev) => {
        ev.preventDefault();
        const isEditing = !!window._editingComplaintId;
        const id = window._editingComplaintId || Date.now();
        const complaint = {
            id,
            name: (document.getElementById('complaintName') ? document.getElementById('complaintName').value : ''),
            category: document.getElementById('complaintCategory').value,
            room: document.getElementById('roomNumber').value,
            description: document.getElementById('complaintDescription').value,
            urgency: (document.getElementById('urgencyLevel') ? document.getElementById('urgencyLevel').value : ''),
            severity: (function(){ const sel = document.getElementById('severitySelect'); const emoji = document.querySelector('.emoji-btn[data-target="severity"].selected'); if (emoji && emoji.dataset && emoji.dataset.value) return emoji.dataset.value; if (sel) return sel.value || ''; return ''; })(),
            status: 'pending',
            date: new Date().toLocaleDateString()
        };

        try {
            let complaints = JSON.parse(localStorage.getItem('complaints') || '[]');
            if (isEditing) {
                complaints = complaints.map(c => c.id === id ? complaint : c);
            } else {
                complaints.push(complaint);
            }
            localStorage.setItem('complaints', JSON.stringify(complaints));
        } catch (e) { console.error('persist complaint failed', e); }

        // attempt send
        const ok = await sendComplaintToServer(complaint);
        if (ok) {
            showToast('Complaint sent to server');
            removeComplaintPendingById(complaint.id);
        } else {
            enqueueComplaintPending(complaint);
            showToast('Offline: complaint saved locally and will be retried.');
        }

        // reset
        complaintFormEl.reset();
        document.querySelectorAll('.emoji-btn.selected').forEach(b => b.classList.remove('selected'));
        window._editingComplaintId = null;
        loadComplaints();
    });
}

// Clear all complaints helper
function clearAllComplaints() {
    if (!confirm('Are you sure you want to delete ALL complaints? This cannot be undone.')) return;
    try {
        localStorage.removeItem('complaints');
        localStorage.removeItem('complaint_pending');
        loadComplaints();
        if (typeof showToast === 'function') showToast('All complaints cleared');
    } catch (e) { console.error('clearAllComplaints failed', e); }
}

// Wire clear/filter buttons
const filterBtn = document.getElementById('filterComplaintsBtn');
const clearFilterBtn = document.getElementById('clearComplaintsFilterBtn');
const clearAllBtn = document.getElementById('clearAllComplaintsBtn');
if (filterBtn) filterBtn.addEventListener('click', () => loadComplaints());
if (clearFilterBtn) clearFilterBtn.addEventListener('click', () => { const f = document.getElementById('complaintFilterName'); if (f) f.value = ''; loadComplaints(); });
if (clearAllBtn) clearAllBtn.addEventListener('click', clearAllComplaints);

// Attempt to flush complaint pending periodically
flushComplaintPending();
setInterval(() => flushComplaintPending(), 30000);

// ===== Keyboard Shortcuts =====
document.addEventListener('keydown', (e) => {
    // Press 't' to toggle theme
    if (e.key === 't' && !e.ctrlKey && !e.altKey) {
        document.getElementById('themeToggle').click();
    }
    
    // Press 'h' to go home
    if (e.key === 'h' && !e.ctrlKey && !e.altKey) {
        scrollToSection('home');
    }
});

// ===== Smooth Scroll =====
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// UI removed per request
