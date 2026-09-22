# LocalVibe — Developer UI/UX Design Specification

## Executive Purpose Statement

`Design.md` translates the approved **Stitch.ai** visual mockups and user experience guidelines into a concrete, developer-facing technical UI specification for **LocalVibe**. 

This document defines design tokens, responsive layout rules, reusable component structures, map behavior, screen specs, interaction states, and accessibility guidelines. It ensures frontend implementation strictly mirrors the approved Stitch visual direction without copy-pasting raw Stitch-generated source code.

---

## 1. Design Principles

1. **Map-First Discovery**: The interactive map is the central UI canvas. Events are discovered primarily through geographic proximity and spatial markers.
2. **Local & Community Feeling**: Vibrant, warm aesthetic emphasizing neighborhood connection, local venues, and community gatherings.
3. **Fast Event Scanning**: Highly readable event cards prioritized by Title, Date/Time, Distance Radius, and Category.
4. **Clear Visual Hierarchy**: High contrast CTAs, distinct category badges, and scannable metadata blocks.
5. **Minimal Friction**: One-click RSVP actions (`GOING`, `INTERESTED`) and direct address geocoding with map preview.
6. **Responsive-First Execution**: Tailored layouts for Desktop (split list-map), Tablet, and Mobile (map-first with card sheet drawer).
7. **Trust & Clarity**: Transparent distance metrics (`2.3 km away`), clear pricing (`Free` vs `₹/$$`), and clear privacy boundaries.

---

## 2. Design System Tokens

### 2.1 Color System

Derived from the approved Stitch visual palette (Light-First, Vibrant, Warm Local Vibe):

```css
:root {
  /* Brand Palette */
  --color-primary: #FF5A5F;        /* Vibrant Local Coral / Magenta */
  --color-primary-hover: #E0484D;  /* Darker Coral for hover states */
  --color-primary-light: #FFF0F1;  /* Soft Coral tint for subtle highlights */
  
  --color-secondary: #00A699;      /* Teal Accent / Location Pin Highlight */
  --color-secondary-hover: #008D82;
  
  --color-featured: #FFB400;       /* Amber Gold for Featured Event Badges & Pins */

  /* Neutral Surface Palette (Light Theme First) */
  --color-bg-app: #F8F9FA;         /* Clean Off-White Background */
  --color-bg-surface: #FFFFFF;     /* Pure White Card / Modal Surface */
  --color-bg-subtle: #F1F3F5;      /* Input background / Filter pill inactive */
  
  /* Text Colors */
  --color-text-main: #2D3748;      /* Deep Charcoal for main headings and body */
  --color-text-muted: #718096;     /* Muted Grey for subtext, distance, & dates */
  --color-text-inverse: #FFFFFF;   /* White text on dark/colored buttons */

  /* Border & Divider Colors */
  --color-border-subtle: #E2E8F0;  /* Standard card and divider border */
  --color-border-focus: #FF5A5F;   /* Primary accent focus ring */

  /* Functional Status Colors */
  --color-success: #38A169;        /* Going status / Success alerts */
  --color-warning: #DD6B20;        /* Interested status / Warning toasts */
  --color-error: #E53E3E;          /* Critical errors / Delete actions */
  --color-info: #3182CE;           /* Information callouts */
}
```

### 2.2 Typography

Font Family: `Inter`, `Roboto`, or system-ui sans-serif fallback stack (`-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`).

| Scale Target | Font Size | Line Height | Weight | Usage |
| :--- | :--- | :--- | :--- | :--- |
| **Display Heading (H1)** | `32px` (`2.0rem`) | `1.2` | Bold (`700`) | Landing Page Hero Header |
| **Section Heading (H2)** | `24px` (`1.5rem`) | `1.3` | SemiBold (`600`) | Page titles, Section headers |
| **Card Heading (H3)** | `18px` (`1.125rem`) | `1.4` | SemiBold (`600`) | Event Card Titles, Modal Titles |
| **Subheading (H4)** | `16px` (`1.0rem`) | `1.4` | Medium (`500`) | Sub-headers, Filter labels |
| **Body Standard** | `14px` (`0.875rem`) | `1.5` | Regular (`400`) | Main description text, comments |
| **Body Small / Meta** | `12px` (`0.75rem`) | `1.4` | Regular (`400`) | Date/Time, Distance, Address meta |
| **Button Text** | `14px` (`0.875rem`) | `1.0` | SemiBold (`600`) | Action CTAs, Filter chips |
| **Badge / Tag** | `11px` (`0.6875rem`)| `1.0` | Bold (`700`) | Category pills, Featured tags |

### 2.3 Spacing Scale

Based on an `8px` grid system:
- `space-1`: `4px`
- `space-2`: `8px`
- `space-3`: `12px`
- `space-4`: `16px` (Standard padding/gap)
- `space-6`: `24px` (Section padding)
- `space-8`: `32px` (Large container padding)
- `space-12`: `48px` (Page section separation)

### 2.4 Border Radius Scale

- `radius-sm`: `4px` (Small tags, tooltips)
- `radius-md`: `8px` (Buttons, form inputs)
- `radius-lg`: `12px` (Event Cards, Modals, Popups)
- `radius-full`: `9999px` (Pills, Category chips, Avatars)

### 2.5 Shadows & Elevation

- `shadow-sm`: `0 1px 2px 0 rgba(0, 0, 0, 0.05)` (Standard card rest state)
- `shadow-md`: `0 4px 6px -1px rgba(0, 0, 0, 0.1)` (Card hover, Dropdown menus)
- `shadow-lg`: `0 10px 15px -3px rgba(0, 0, 0, 0.15)` (Modals, Map popups, Mobile sheets)

---

## 3. Layout System

### Global Layout Grid Structure
```
+-----------------------------------------------------------------------------------+
|  HEADER / NAVBAR (Fixed Top, Height: 64px, Logo, Search, Location, Auth Buttons)   |
+-----------------------------------------------------------------------------------+
|                                                                                   |
|  MAIN DISCOVER CONTENT AREA (Height: calc(100vh - 64px))                          |
|  +-------------------------------------+---------------------------------------+  |
|  |  LEFT SIDEBAR: EVENT FEED (40%)    |  RIGHT CONTAINER: LEAFLET MAP (60%)   |  |
|  |  ├── Filter Toolbar (Category, Date)|  ├── Zoom & Current Location Controls  |  |
|  |  ├── Radius Dropdown (1km - 50km)   |  ├── User Location Marker             |  |
|  |  └── Scrollable Cards List (20/pg) |  └── Interactive Event Markers/Popups |  |
|  +-------------------------------------+---------------------------------------+  |
+-----------------------------------------------------------------------------------+
```

---

## 4. Responsive Design System

### Desktop (`>= 1024px`)
- Split-screen layout: 40% left scrollable event feed, 60% right full-height interactive Leaflet map.
- Top navigation header with inline search bar and quick location dropdown.

### Tablet (`768px - 1023px`)
- 50/50 split view or collapsible sidebar filter drawer.
- Two-column grid for non-map list pages (`My Events`, `Admin Dashboard`).

### Mobile (`< 768px`)
- **Map-First Mobile View**: Full-screen interactive map background.
- Floating Top Search & Filter Bar (Horizontally scrollable category chips).
- **View Switcher Floating Action Button (FAB)**: Toggles between `Map View` and `List View Sheet`.
- Bottom Sheet drawer pops up when a map marker is tapped, displaying compact event preview card.

---

## 5. Global Navigation Specifications

- **Brand Logo**: `LocalVibe` logo with vibrant location pin icon.
- **Left/Center**: Search Input (`"Search events, venues..."`), Location Badge (`"Mumbai, IN ▾"`).
- **Right Items**:
  - `Explore` (Link to `/discover`)
  - `Create Event` (Button, visible to authenticated users)
  - `My Events` (Link to `/my-events`)
  - `User Avatar Dropdown` (Profile, Admin Dashboard [if role=ADMIN], Logout)
  - `Login / Register` buttons (If unauthenticated)

---

## 6. Global Reusable Components Specification

### 6.1 Event Card Component (`EventCard.jsx`)
- **Thumbnail**: `16:9` aspect ratio image with smooth skeleton loader placeholder.
- **Badges**: Floating Category Tag (Top-Left), `Featured` Amber Badge (Top-Right, if applicable).
- **Title**: 2-line clamped H3 text (`font-weight: 600`).
- **Metadata Stack**:
  - 📅 Date & Time string (`Sat, Sep 12 • 7:00 PM`)
  - 📍 Address & Distance (`Bandr, Mumbai • 2.3 km away`)
  - 🏷️ Price Tag (`Free` or `₹500`)
- **Action Bar**: Instant RSVP Toggle Button (`Going`, `Interested`).

### 6.2 Filter Bar Component (`FilterBar.jsx`)
- **Horizontal Scroll Container**: Flex container with hidden scrollbars for mobile.
- **Filter Elements**:
  - Category Pills (`All`, `Music`, `Food & Drink`, `Sports`, `Arts`, `Community`, `Markets`).
  - Date Presets (`Today`, `Tomorrow`, `This Weekend`, `Upcoming`).
  - Distance Radius Select (`1 km`, `5 km`, `10 km`, `25 km`, `50 km`).
  - Price Toggle (`All`, `Free Only`).

### 6.3 Leaflet Map Component (`MapContainer.jsx`)
- Tile Provider: OpenStreetMap tiles (`https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png`).
- Controls: Floating Zoom (`+`/`-`), Current Location Re-center FAB button.
- Markers: Custom SVG Pins colored by category; Golden Pin for `isFeatured: true`; Pulsing Blue dot for User position.

---

## 7. Screen-by-Screen Specifications

### 7.1 Landing Page (`/`)
- **Hero Section**: High-impact banner with tagline *"Discover What's Happening Near You This Weekend"*.
- **Location Auto-Detect CTA**: Big primary button *"Explore Events Near Me"* triggering geolocation request.
- **Popular Categories Bar**: Clickable category cards with icons.
- **Featured Events Carousel**: Horizontal slider showing top promoted local events.
- **Organizer CTA Section**: *"Hosting an event? Publish on LocalVibe in minutes."*

### 7.2 Discover / Map Page (`/discover`)
- **Desktop Split**: 40% feed / 60% map.
- **List-Map Synchronization**:
  - Hovering over an Event Card highlights the corresponding Map Marker pin (`scale(1.2)` + glow effect).
  - Clicking a Map Marker auto-scrolls the Event Feed to bring the target card into view and opens the map popup.
- **Empty State**: *"No events found within 5 km."* + CTA *"Expand Radius to 25 km"*.

### 7.3 Discover Mobile View (`/discover` Mobile)
- Full viewport map background.
- Top sticky filter chips bar.
- Floating View Switcher Button at bottom center: `[ 🗺️ Map ]` ↔ `[ 📋 List (24) ]`.
- Tapping a pin slides up a bottom card sheet with RSVP buttons and *"View Details"* link.

### 7.4 Event Details Page (`/events/:id`)
- **Header Banner**: Full-width image cover with title overlay.
- **Left Column (65%)**:
  - Title, category pill, featured badge.
  - Detailed markdown/formatted description.
  - Organizer profile card with avatar and event creation count.
  - Social section: *"3 friends are going"* (showing friend avatars).
- **Right Column / Floating Sticky Card (35%)**:
  - Date & Time schedule with Add-to-Calendar export link.
  - Price indicator (`Free` / `Paid`).
  - Address text + Interactive Mini-Map showing exact location pin.
  - Primary RSVP Control Buttons: `[ ✓ Going ]` | `[ ⭐ Interested ]`.
  - Attendee Counter (`42 Going • 18 Interested`).

### 7.5 Create Event Page (`/create-event`)
- **Form Layout**: Clean 2-column container.
- **Section 1: Event Info**: Title input, Category dropdown, Description textarea.
- **Section 2: Date & Time**: Start Date/Time, End Date/Time pickers.
- **Section 3: Pricing & Media**: Free toggle, Price input, Image URL or file uploader.
- **Section 4: Location & Address Geocoding**:
  - Address search input with live autocomplete suggestions dropdown.
  - Selecting an address geocodes `(lat, lng)` coordinates.
  - Dynamic mini-map preview pin updates position instantly for organizer confirmation.
- **Action**: Primary Publish Button `[ Publish Event ]`.

### 7.6 My Events Page (`/my-events`)
- Header: *"My Event Dashboard"*.
- Tabbed Navigation: `[ Going (3) ]` | `[ Interested (5) ]` | `[ Created Events (2) ]`.
- Render grid of Event Cards matching active tab state.
- `Created Events` tab renders edit button `[ ✏️ Edit ]` and delete button `[ 🗑️ Delete ]` on each card.

### 7.7 User Profile Page (`/profile`)
- Avatar image, user name, bio text, home city.
- Preferred Category Pills (`Music`, `Food & Drink`).
- Activity Statistics: `Events Attended: 12`, `Events Created: 3`.
- Edit Profile Button opening slide-over modal.

### 7.8 Admin Dashboard (`/admin`)
- Accessible ONLY if authenticated user has `role: ADMIN`.
- **Top Metric Cards**: `Total Users`, `Active Events`, `Total RSVPs`, `Featured Events`.
- **Navigation Tabs**: `Events Moderation`, `User Management`, `Platform Analytics`.
- **Event Moderation Table**:
  - Columns: Title, Organizer, Date, Category, Status, Featured Toggle (`[ ⭐ Feature ]`), Actions (`[ Delete ]`).
- **User Management Table**:
  - Columns: User, Email, Role (`USER`/`ADMIN`), Status, Actions (`[ Block ]`, `[ Change Role ]`).

---

## 8. Authentication UI Specifications

- **Login Modal / Page**: Email input, password input, *"Log In"* primary button, switch to Register link.
- **Register Modal / Page**: Name input, email input, password input, confirm password input, *"Create Account"* button.
- **Auth Error Handling**: Clear inline red text below input fields (e.g. *"Invalid email or password"*).

---

## 9. Location & Geolocation UX States (India-Only Scope)

1. **Geographic Scope**: LocalVibe is designed for discovery across Indian cities and neighborhoods (e.g., Mumbai, Pune, Bengaluru, Delhi, Hyderabad, Chennai, Kolkata, Ahmedabad, Jaipur).
2. **Prompting Permission**: Subtle toast indicator *"Detecting nearby location..."*.
3. **Permission Granted (in India)**: Map centers smoothly to `[lng, lat]`, blue pulsing dot renders at position, nearby events load.
4. **Outside India GPS**: If browser GPS detects coordinates outside India, the application displays a friendly informative empty state: *"LocalVibe currently supports events in India. Showing events near Mumbai."*
5. **Permission Denied / Blocked**: Toast notification *"Location access disabled. Displaying selected city (Mumbai)."* + CTA button *"Change Location Manually"*.
6. **Manual Location Modal**: Search input and popular Indian city suggestions (Mumbai, Pune, Bengaluru, Delhi, Hyderabad, Chennai, Kolkata, Ahmedabad, Jaipur) updating map focus.

---

## 10. Map UI Specification

- **Tile Layer**: OpenStreetMap Standard tiles.
- **Marker Design**:
  - Standard Event Pin: 32x32px SVG Teardrop Icon with inner category symbol.
  - Featured Event Pin: 40x40px Golden Pin with outer pulsing glow ring.
  - User Location Pin: 20x20px Solid Blue Circle with 40x40px semi-transparent blue pulse ring.
- **Map Popup Card**:
  - Compact width (`240px`).
  - Thumbnail image (`120px` height), Title, Date, Distance radius text, Price tag, and *"View Details →"* link button.
- **Coordinate Order Rule**:
  > **CRITICAL**: All Leaflet marker bindings must receive coordinates converted from GeoJSON `[longitude, latitude]` format to Leaflet's `[latitude, longitude]` array order at the UI boundary (`L.marker([event.location.coordinates[1], event.location.coordinates[0]])`).

---

## 11. RSVP UX Specifications

- **Default Unclicked State**:
  - Button 1: `[ + Going ]` (Outlined gray style)
  - Button 2: `[ ⭐ Interested ]` (Outlined gray style)
- **Going Active State**:
  - Button 1: `[ ✓ Going ]` (Solid Success Green background `--color-success`)
  - Button 2: `[ ⭐ Interested ]` (Disabled/Secondary outline style)
- **Interested Active State**:
  - Button 1: `[ + Going ]` (Outlined style)
  - Button 2: `[ ★ Interested ]` (Solid Warning Amber background `--color-warning`)
- **Un-RSVP Action**: Tapping an active RSVP button toggles status back to `NONE`, updating attendee counts atomically.

---

## 12. Loading, Empty & Error UI States

### 12.1 Loading Skeleton States
- Render gray shimmering skeleton blocks matching Event Card dimensions during API fetch cycles.

### 12.2 Empty States Template
- **Illustration**: Clean vector graphic / icon.
- **Title**: Large bold text (e.g. *"No Events Found Nearby"*).
- **Explanation**: Subtext (e.g. *"We couldn't find any events within 5 km of your location."*).
- **CTA Action**: Primary button (e.g. *"Expand Search Radius to 25 km"* or *"Clear Search Filters"*).

### 12.3 Error Toast Notifications
- Floating top-right notification banner with auto-dismiss (5 seconds).
- Red accent border for errors, green accent border for success feedback.

---

## 13. Accessibility & Micro-Interactions

- **Focus States**: All interactive elements display a clear `2px` focus outline (`--color-border-focus`) when tabbed via keyboard.
- **Contrast Ratios**: Body text (`--color-text-main`) against white background satisfies WCAG AA minimum 4.5:1 ratio.
- **Micro-Interactions**: Card hover state smoothly translates transform `-4px` vertically with shadow elevation transition (`transition: all 0.2s ease-in-out`).

---

## 14. Stitch Implementation Translation Rules

1. **Visual Reference Only**: Use approved Stitch mockups as the visual benchmark for colors, margins, fonts, and layout.
2. **No Code Reuse**: Do NOT copy raw HTML, CSS, or React code output generated by Stitch tools.
3. **Architectural Conformity**: All components must be built natively in React using the clean component hierarchy defined in `Architecture.md`.
4. **Source of Truth Conflict Rule**: If a visual design element from Stitch conflicts with `PRD.md` or `Architecture.md` requirements, the PRD and Architecture documents take precedence.

---

## 15. Developer Design Handoff Verification Checklist

- [x] Color design system tokens documented.
- [x] Typography hierarchy and spacing scale defined.
- [x] Global navbar, header, and filter component specs written.
- [x] Responsive layout rules for Desktop (40/60 split) and Mobile (Map FAB view switcher) specified.
- [x] Discover Page, Event Details, Create Event with address preview map, My Events, Profile, and Admin Dashboard screens specified.
- [x] Leaflet map pins, popups, and GeoJSON coordinate handling documented.
- [x] RSVP state transitions (`GOING`, `INTERESTED`, `NONE`) defined.
- [x] Skeleton loaders, empty states, and error toasts specified.
- [x] Accessibility guidelines and Stitch translation rules confirmed.
