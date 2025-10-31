RGIPT Home — Local site and developer guide By Team Devayani.

This repository is a small static website (HTML/CSS/JS) intended as a hostel portal demo (mess menu, announcements, feedback, complaints, daily quote, etc.). The site lives in the project root and can be opened directly or served from a local HTTP server for best browser compatibility.

Table of contents
- Quick start (open locally)
- File layout
- How the site works — feature by feature
- Development notes (where to edit content)
- Troubleshooting & testing

Quick start — open the site

Option A — Open directly (quick preview)
- Double-click `index.html` to open in your default browser. Note: some features (iframes, fetch, some browser policies) behave better when served over HTTP.

Option B — Serve with a minimal local HTTP server (recommended)
From the project folder (PowerShell):

```powershell
# Python 3 built-in server (recommended)
python -m http.server 8080

# Then open: http://localhost:8080
```

If you prefer a helper script or Node-based server, you can add one — the site is static and needs no build step.

Project file layout (important files)
- `index.html` — main page and all visible content (navigation, sections, markup for menus, announcements, forms).
- `styles.css` — primary stylesheet; controls layout, themes and components.
- `script.js` — application logic: event wiring, settings, announcements ticker, meal tab handling, feedback & complaints storage, daily quote logic and tooltips.
- `README.md` — this file.

How the site works — feature guide and how to use each part

Navigation
- Top navigation links jump to sections: Home, Announcements, Meal Menu, Complaints, Feedback, Creators. Click a link to scroll to the section.

Daily Quote (top banner)
- Shows a daily inspirational quote. Quotes are defined in `script.js` (the `QUOTES` array).
- Hover or keyboard-focus the quote to see the English meaning/translation (tooltip). There is a small "T" toggle on the banner to quickly show or hide the translation — the toggle state is saved to localStorage.
- Settings → Preferred quote language lets you set the default behavior (Auto / English / Original). Save in the Settings panel to persist.

Announcements
- A rotating announcements ticker shows short messages (top-right of Announcements section). The list is defined in `script.js` (the `ANNOUNCEMENTS` array). The ticker automatically fetches from a configured URL if `announcements_url` is set in localStorage.

Meal Menu
- The Meal Menu section has three tabs: Today, Week 1, Week 2. Click the tabs to switch views.
- Weekly menus (both weeks) are static HTML tables inside `index.html`. The "Today" cards are synchronized from the weekly table by `syncTodayFromWeekly()` (script.js). To change menu items, edit the weekly tables in `index.html`.
- The section title shows the effective date to indicate when the menu applies.

Snacks
- A small grid of snack cards showing evening snacks and desserts. Edit content in `index.html` under the Snacks section.

Feedback (user ratings and suggestions)
- The Feedback section includes a form for name, room, type, emoji ratings, and comments.
- Submissions are stored in localStorage under `feedback_entries` and displayed in the "My Feedback" list. If a server endpoint is configured (localStorage `feedback_endpoint`), the app will attempt to POST entries and queue pending items (key: `feedback_pending`) for retry when offline.
- You can edit or delete entries from the UI; deletes remove them from localStorage.

Complaints / Maintenance Requests
- Similar to Feedback, complaints are submitted via a form (name, room, category, description, urgency). Complaints are saved in localStorage (`complaints`) and optionally queued if a `complaint_endpoint` is configured.
- Complaint items in the list show status badges and can be edited or deleted.

Creators section
- A simple list of the authors/creators with contact details (near the page end). Edit `index.html` to update names or contact info.

Settings panel
- Open via the cog icon. Available controls:
  - Animation speed slider (respects reduced motion preference)
  - Accent colors for complaint/urgency UI
  - Require all three ratings toggle (when enabled, Feedback requires all three ratings)
  - Preferred quote language (Auto / English / Original)
  - Save / Reset buttons to persist to localStorage (`rgipt_settings` key)

Theme toggle
- The theme toggle button switches between dark and light modes. The selection is saved to localStorage (`theme` key).

Keyboard shortcuts
- `t` — toggle theme
- `h` — jump to Home

Notifications & Toasts
- Short feedback messages (toasts) appear at bottom-right for confirmations and alerts.

Development notes & where to edit content
- Edit announcements: open `script.js` and update the `ANNOUNCEMENTS` array near the top.
- Edit daily quotes/translations: update the `QUOTES` array in `script.js`. Each entry can have `text`, `meaning`, and `author`.
- Edit weekly meal menus: open `index.html` and update the tables inside the Meal Menu section (`#weekly-menu-1` and `#weekly-menu-2`). The "Today" cards are populated from those tables by script.
- Feedback and complaint endpoints: change localStorage keys `feedback_endpoint` and `complaint_endpoint` (or add a small backend and point these to your API).

Testing & troubleshooting
- If something looks off, open the browser DevTools console (F12) to view JS errors.
- If features involving fetch/iframe behave unexpectedly, try serving the folder with the Python server above (some browsers restrict behavior on file://).

Notes about removed/experimental features
- A desktop mobile-preview simulator was implemented during development but later removed — the current site no longer includes the simulated preview overlay. (If you need it again I can reintroduce a simpler device preview.)

Contributing
- This is a small static project. Fork or copy the files and open a pull request or send diffs. When changing public behavior (forms or localStorage keys), update this README accordingly.

Contact
- For questions about this demo, update the Creators section in `index.html` with your preferred contact details.

Enjoy exploring the RGIPT Home demo site. If you want me to make specific content changes (menu updates, translations, or add sample backend endpoints), tell me which files to edit and I'll update them.

Creators
--------

This project was created by the following team members. Their contact details are included below for reference — edit `index.html` if you need to change any entry.

- S.Mukunda Rama Chary
  - Roll: 25MC3060
  - Phone: +91 9398863107
  - Email: 25mc3060@rgipt.ac.in

- Sai Badrishwar S S
  - Roll: 25MC3054
  - Phone: +91 7483 960 412
  - Email: 25mc3054@rgipt.ac.in

- B. Bhargav Venkat Dora
  - Roll: 25MC3018
  - Phone: +91 63096 30559
  - Email: 25mc3018@rgipt.ac.in

If you'd like, I can also add mailto links or small profile pictures to the README; tell me which format you prefer.
