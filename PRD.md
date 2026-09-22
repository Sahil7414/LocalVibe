# LocalVibe — Product Requirements Document (PRD)

## 1. Product Information

- **Product Name**: LocalVibe
- **Product Type**: Hyperlocal Event Discovery and Social RSVP Platform
- **Core Question**: *"What’s happening near me this weekend?"*
- **Product Goal**: LocalVibe helps users discover events and activities happening near them, unifying fragmented event listings into a single location-aware, map-based experience.
- **Geographic Scope**: **India Only**. LocalVibe currently supports events located within India only (Latitude: 6.0°N to 38.0°N, Longitude: 68.0°E to 98.0°E). All demonstration events, seed data, and user-published events are strictly constrained to Indian locations (e.g., Mumbai, Pune, Bengaluru, Delhi, Hyderabad, Chennai, Kolkata, Ahmedabad, Jaipur). The architecture is extensible to other regions in future releases.

### Main User Journey
`User Location` → `Nearby Events` → `Interactive Map` → `Event Details` → `RSVP`

### Activity Examples
- Farmers markets
- Open mic nights
- Garage sales
- Music events
- Food festivals
- Workshops
- Community gatherings
- Sports activities
- Cultural events
- Local meetups
- Shopping events
- Educational activities

---

## 2. Problem Statement

Finding interesting local events is difficult because information is spread across:
- Social media
- Event platforms
- Community websites
- Local business websites
- Posters and flyers
- Word of mouth

Users frequently face the question: *"What can I do near me this weekend?"*

LocalVibe solves this by providing a location-aware event discovery platform where users can:
- Discover nearby events effortlessly
- Explore events on an interactive map
- Filter events by category, date, distance, and price
- View detailed event information
- Persist RSVP statuses (Going / Interested)
- See social attendee information
- Create and publish local events
- Receive personalized recommendations

---

## 3. Product Vision

LocalVibe aims to be the simplest and most vibrant platform for local activity discovery.

### Key Priorities
- **Local Discovery**: High emphasis on proximity and neighborhood activities.
- **Location Awareness**: Automatic browser geolocation with seamless manual fallback.
- **Map-Based Exploration**: Map is the central interaction paradigm.
- **Community Participation**: Organic RSVP and organizer event creation.
- **Mobile Usability**: First-class experience on mobile browsers and touch devices.

---

## 4. Target Users

### 4.1 Event Explorer
People who want to discover activities and events near them (students, local residents, tourists, young professionals, families).

**Primary Capabilities:**
- Discover nearby events
- Search and filter events
- View events on an interactive map
- View event details and RSVP
- Track upcoming and saved events under "My Events"
- Manage personal profile

### 4.2 Event Organizer
Local businesses, community leaders, artists, restaurants, workshop hosts, student organizations, and event hosts.

**Primary Capabilities:**
- Create and edit events
- Set event details, categories, date/time, and pricing
- Select address and pin location on map preview
- Upload/add event media
- Publish events and track attendee counts

### 4.3 Administrator
Platform administrators responsible for health, content moderation, and curation.

**Primary Capabilities:**
- User management and account moderation
- Event content moderation and removal
- Featured event management
- Platform usage analytics and report review
- **Note**: Admin authorization MUST be strictly enforced on the backend, not just by frontend UI conditional rendering.

---

## 5. Product Goals

### Goal 1 — Nearby Event Discovery
Users can find events near their current location (e.g., *"Show events within 5 km"*).

### Goal 2 — Map-First Experience
The interactive map is the central UI feature, enabling marker exploration, user location display, popups, zoom/pan, and seamless switching between map and card views.

### Goal 3 — Easy Event Creation
Organizers can publish events quickly through a clean, intuitive multi-step form with address geocoding and map preview.

### Goal 4 — RSVP
Users can mark events as **Going** or **Interested**, with full database persistence and attendee counting.

### Goal 5 — Social Discovery
Users can see social context such as *"3 friends are going"*, strictly reflecting verified relationship links.

### Goal 6 — Personalization
Rule-based recommendation engine offering context-driven suggestions based on prior RSVPs and preferred categories (e.g., attending a Jazz Concert prompts suggestions for upcoming Music events nearby).

### Goal 7 — Featured Events
Promoted/featured events receive distinctive visual treatment on the map and event feed.

---

## 6. MVP Scope

The MVP focuses on the core discovery, map, creation, and RSVP loops:

- **Authentication**: Registration, login, logout, persistent auth state, user profile.
- **Location**: Browser geolocation (`navigator.geolocation`), radius filter, manual search fallback.
- **Event Discovery**: Search, category filter, date filter, distance filter, detailed modal/page.
- **Interactive Map**: Leaflet + React Leaflet + OpenStreetMap tiles with custom markers and popups.
- **Event Creation**: Form for title, description, category, date/time, price, address, image, and map preview.
- **RSVP**: Going / Interested toggles with backend persistence.
- **My Events**: Tabs for Going, Interested, and Created events.

---

## 7. Event Requirements

Every event entity must include:
- `title` (String)
- `description` (String)
- `startDate` (DateTime)
- `endDate` (DateTime)
- `category` (String)
- `price` (Number, 0 for free)
- `image` (String URL)
- `address` (String)
- `location` (GeoJSON Point format)
- `organizer` (User Reference)
- `isFeatured` (Boolean)
- `status` (Enum: active, cancelled, draft)
- `createdAt` & `updatedAt` (Timestamps)

### Location Format Standard
Geographic coordinates must strictly follow GeoJSON specification:
```json
{
  "type": "Point",
  "coordinates": [longitude, latitude]
}
```
> **CRITICAL**: GeoJSON format requires `[longitude, latitude]`, NOT `[latitude, longitude]`.

---

## 8. Event Categories

Initial supported categories:
- Music
- Food & Drink
- Sports
- Arts & Culture
- Community
- Markets
- Workshops
- Entertainment
- Shopping
- Education
- Social
- Other

The category schema must be extensible for future category additions.

---

## 9. Event Discovery & Proximity

Discovers events via geospatial queries using MongoDB 2dsphere indexing.

### Supported Radius Options
- 1 km
- 5 km *(Default)*
- 10 km
- 25 km
- 50 km

Sample query parameters: `lat: 19.0760`, `lng: 72.8777`, `radius: 5km`.

---

## 10. Date Filtering

Users can filter events using predefined and custom ranges:
- **Today**
- **Tomorrow**
- **This Weekend**
- **Upcoming**
- **Custom Date Range**

---

## 11. Search and Filters

Filter bar accessible on both map and list views:
- **Keyword Search**: Matches title, description, and address.
- **Category**: Select single or multiple categories.
- **Date**: Predefined presets or custom date selection.
- **Distance**: Radio/dropdown choices (1 km - 50 km).
- **Price**: Free vs Paid filtering.
- **Featured**: Quick toggle for featured events.

---

## 12. Map Requirements

- **Map Engine**: Leaflet with OpenStreetMap tiles.
- **Event Markers**: Visual markers categorized or colored by status/category.
- **Featured Event Markers**: Distinctive badge, animation, or custom pin styling.
- **User Location Marker**: Distinct blue pulsing dot or indicator showing current user position.
- **Marker Popup Content**:
  - Event title & thumbnail
  - Date & time
  - Distance from user (e.g., `2.3 km away`)
  - Price indicator
  - "View Event Details" CTA button

---

## 13. Geolocation Handling

Uses standard `navigator.geolocation` API with explicit state handling:

| Scenario | Behavior / Fallback |
| :--- | :--- |
| **Permission Granted** | Extract `(lat, lng)`, center map, automatically fetch nearby events. |
| **Permission Denied** | Show non-blocking toast, load default location (e.g., city center), allow manual address selection. |
| **Location Unavailable** | Display friendly notification: *"We couldn't access your location"* + CTA *"Choose Location Manually"*. |
| **Unsupported Browser**| Fallback cleanly to text-based location search bar without throwing runtime exceptions. |

---

## 14. Address Search & Location Creation

When an organizer creates an event:
1. Enters address in location input.
2. Receives autocomplete suggestions via geocoding provider (e.g., OpenStreetMap Nominatim or Google Places).
3. Selects an address option to resolve `(lat, lng)`.
4. Interactive map preview updates dynamically with a draggable marker for fine-tuning coordinates.
5. Saves clean address string alongside `[longitude, latitude]` GeoJSON point.

---

## 15. Event Details Screen

Displays complete event details:
- Hero image banner
- Event title, category badge, and featured indicator
- Organizer information & verified host profile
- Date and time formatting
- **Add to Google Calendar** (*Authenticated Feature Only*):
  - Logged-in users: Generates and opens a Google Calendar template URL with event title, dates, details, and location.
  - Guests: Clicking "Add to Google Calendar" displays a prompt (`"Please log in to add events to your Google Calendar"`) and opens the `AuthModal` login modal. Guests are NOT permitted to generate calendar events directly.
  - Independent of RSVP: Triggering calendar actions never modifies RSVP counts or user RSVP status.
- Location address with mini-map and navigation directions link
- Ticket price (Free / ₹)
- Detailed event description
- RSVP control bar (Going / Interested toggle)
- Attendee counts & public attendee list
- Related events in same category

---

## 15.1 Geographic Scope & Location State Specification

### Geographic Restriction
- **India Only**: LocalVibe is restricted to events located within the sovereign geographic bounds of India (Latitude: 6.0°N to 38.0°N, Longitude: 68.0°E to 98.0°E).
- Events outside India are rejected at both API validator level (HTTP 400) and client creation level.
- Geolocation outside India displays a friendly empty state message: *"LocalVibe currently supports events in India."*

### Location State Decoupling
1. **Selected Location (`selectedLocation`)**:
   - Explicitly chosen by user via Location Selector Modal (e.g., "Bandra West, Mumbai", "Pune, Maharashtra").
   - Displayed in the top navigation header.
   - Preserved across user navigation and persisted in localStorage.
   - **MUST NEVER be overwritten automatically by browser GPS geolocation.**
2. **Current GPS Location (`currentLocation`)**:
   - Acquired via `navigator.geolocation.getCurrentPosition()`.
   - Used for proximity discovery (`/api/events/nearby`), map centering, radius circle, and distance calculations (`distanceKm`).
   - Clicking *"Use my current location"* updates discovery and map context without altering the selected header location.

### Demo Dataset & Accounts Strategy
- **Curated Demo Events**: ~25–40 events (current count: 30) distributed across key Indian hubs:
  - Maharashtra: Mumbai (Bandra, Juhu, Lower Parel, Powai, Colaba, Dadar, BKC, Andheri), Pune (Koregaon Park, Baner, Viman Nagar, Kothrud, Hinjawadi), Thane (Talao Pali, Ghodbunder), Navi Mumbai (Vashi, Nerul).
  - Other Hubs: Bengaluru (Cubbon Park, Indiranagar, Koramangala, HSR), Delhi (Hauz Khas, Connaught Place, Cyber Hub), Hyderabad (HITEC City, Banjara Hills), Chennai (Besant Nagar), Kolkata (Park Street), Ahmedabad (Sabarmati Riverfront), Jaipur (C-Scheme).
- **Accurate Coordinates**: Every event uses real Indian venue coordinates in GeoJSON `[longitude, latitude]` format.
- **Demo Accounts**: 8 development accounts with bcrypt-hashed passwords (`password123`):
  - `curator@localvibe.app` (ADMIN / Lead Curator - LocalVibe Curator)
  - `demo.mumbai@localvibe.demo` (ORGANIZER - Mumbai Community Events)
  - `demo.pune@localvibe.demo` (ORGANIZER - Pune Local Events)
  - `demo.bengaluru@localvibe.demo` (ORGANIZER - Bengaluru Events Hub)
  - `demo.delhi@localvibe.demo` (ORGANIZER - Delhi Community Collective)
  - `demo.events@localvibe.demo` (ORGANIZER - LocalVibe Demo Organizer)
  - `demo.user1@localvibe.demo` (USER - Aarav Patel)
  - `demo.user2@localvibe.demo` (USER - Ananya Sharma)
- **Event-Organizer References**: All demo events reference real organizer account IDs.
- **Idempotent Seeding**: Seeding script (`backend/src/seed/seedDatabase.js`) safely clears and re-inserts fixed demo IDs and clean references without duplicate generation.

---

## 16. RSVP Requirements

- **Supported States**: `GOING`, `INTERESTED`, or `NONE` (Un-RSVP).
- Single active status per user per event (switching from `GOING` to `INTERESTED` updates the existing record).
- Immediate local UI update + persistent MongoDB atomic update.
- Attendee counters dynamically adjust in real time.

---

## 17. Social Features (Post-MVP Ready)

- Follow/Unfollow user system.
- Social connection graph (Friends / Connections).
- Social attendee badges ("3 friends are going").
- Friend activity feeds under profile.

---

## 18. My Events Screen

Tabbed interface for tracking user engagement:
- **Going**: Events where user status is `GOING`.
- **Interested**: Events where user status is `INTERESTED`.
- **Created**: Events authored by the logged-in user with edit/delete controls.

---

## 19. User Profile

User profile includes:
- Avatar image & banner
- Name, username, & bio
- Default home location
- Category interests
- Event stats (Events attended, created)
- Following / Followers count

---

## 20. Event Creation Form

- **Event Details**: Title, description, category select.
- **Date & Time**: Start date/time, end date/time.
- **Pricing**: Free toggle, numeric price field if paid.
- **Media**: Image URL or upload.
- **Location**: Address search, geocoded coordinates, interactive map marker placement preview.
- **Publish Action**: Submit and publish event to the platform.

---

## 21. Featured Events

- Configured via `isFeatured: true` by admins or authorized organizers.
- Visual emphasis: Highlighted card borders, featured badges, priority placement in search results, and special map pins.
- Monetization hook for future organizer promotions.

---

## 22. Recommendations Engine

- **Rule-Based Engine (No complex AI/ML required for MVP)**:
  - Aggregates category counts of user's past `GOING` and `INTERESTED` RSVPs.
  - Matches upcoming events in top categories within selected distance radius.
  - Generates recommendations panel: *"Because you went to Jazz Concert..."*

---

## 23. Seed Data Requirements

The database must be pre-populated with realistic seed data across key target cities so maps are rich and vibrant during evaluation:
- **Cities**: Mumbai, Pune, New York, London.
- **Data Attributes**: Title, detailed description, realistic address & coordinates, category, high-quality Unsplash image URLs, price, start/end dates.
- **Isolation**: Seed scripts must be isolated from production database migrations.

---

## 24. Admin Requirements

Admin Dashboard capabilities:
- User moderation (view, block, manage roles).
- Event moderation (approve, edit, flag, delete).
- Featured event toggle management.
- Basic platform metrics (total users, active events, RSVPs count).
- Report management for user-flagged listings.
- **Security Rule**: Admin endpoints protected by backend role-based middleware (`verifyAdmin`).

---

## 25. Responsive Design Principles

- **Desktop**: Split-view layout (Left: Search + Filters + Event Cards List; Right: Fixed Full-Height Interactive Map).
- **Mobile**: Map-first layout with bottom sheet drawer or toggle button to switch between Map View and Card Feed View. Touch-optimized filter chips and floating action buttons.

---

## 26. Main Screens Overview

1. **Landing Page**: Hero, location search CTA, popular category pills, trending events carousel.
2. **Discover Page**: Primary map + list hybrid discovery view with search and filter controls.
3. **Event Details Page**: Full event view, RSVP controls, organizer info, location map.
4. **Create Event Page**: Multi-step form with address geocoding map preview.
5. **My Events Page**: Tabs for Going, Interested, and Created events.
6. **Profile Page**: User bio, interests, stats, and activity.
7. **Admin Dashboard**: Moderation tables, featured event manager, and basic analytics.

---

## 27. UI/UX Principles

- **Aesthetics**: Modern, vibrant, local, friendly, clean typography, dark/light contrast.
- **Usability**: Low friction, instant map interaction, scannable event cards, responsive touch targets.
- **Clarity**: Unambiguous event dates, clear pricing, transparent distance badges.

---

## 28. Empty States

Clear messaging with actionable recovery options:
- **No Nearby Events**: *"No events found within 5 km."* → Button: *"Expand radius to 25 km"*.
- **No RSVPs**: *"You haven't RSVP'd to any events yet."* → Button: *"Explore nearby events"*.
- **No Search Results**: *"No events match your current filters."* → Button: *"Reset filters"*.

---

## 29. Error Handling Requirements

- **Location Permission Denied**: Gracefully fallback to default city coordinates with user prompt.
- **Geocoding Failures**: Allow manual pinpoint adjustment on map.
- **Network Disconnection**: Toast notification with retry button.
- **API Errors**: Sanitized user-friendly messages without exposing raw database stack traces.

---

## 30. Security Requirements

- **Authentication**: JWT token / HTTP-only cookie authentication.
- **Password Safety**: Bcrypt hashing.
- **Input Validation**: Backend schema validation (Joi/Zod/Mongoose validation).
- **Authorization**: Backend middleware verifying resource ownership (editing events) and admin roles.
- **Secrets**: Store all keys in `.env` files; never commit `.env` to Git repository.

---

## 31. Performance Requirements

- MongoDB `2dsphere` index on `location` coordinates for sub-50ms spatial queries.
- Pagination or infinite scrolling for event feeds (limit 20 events per page).
- Debounced search inputs (300ms delay).
- Optimized map rendering using marker clustering or bounding-box viewport queries.

---

## 32. Data Requirements

Core Mongoose models:
- `User`
- `Event`
- `RSVP`
- `Follow` / `Connection` *(Post-MVP)*

---

## 33. Technology Direction

- **Frontend**: React (Vite), JavaScript (ES6+), React Router, Leaflet, React Leaflet, Vanilla CSS.
- **Backend**: Node.js, Express.js.
- **Database**: MongoDB Atlas, Mongoose ODM.
- **Maps & Geocoding**: Leaflet, OpenStreetMap tiles, Nominatim / OpenStreetMap Geocoding.

---

## 34. Deployment Requirements

- **Frontend Host**: Vercel.
- **Backend Host**: Render.
- **Database Host**: MongoDB Atlas.
- **Environment Variables**: Managed securely through hosting dashboard configuration.

---

## 35. Project Deliverables

1. Clean, structured GitHub repository.
2. Complete React + Vite frontend application.
3. Express.js REST API with geospatial endpoints.
4. MongoDB database schemas with `2dsphere` indexes.
5. Rich seed dataset (Mumbai, Pune, NYC, London).
6. Leaflet map integration with interactive markers and location detection.
7. Full RSVP flow & Create Event flow with address search.
8. Comprehensive PRD documentation (`PRD.md`).

---

## 36. Four-Week Development Roadmap

### Week 1 — Geospatial Backend
- Project setup & MongoDB Atlas connection.
- User, Event, and RSVP Mongoose schemas.
- GeoJSON location field + `2dsphere` index implementation.
- Event CRUD REST APIs & geospatial radius search endpoint (`$near`).
- Comprehensive seed data script.

### Week 2 — Map Interface & Discovery
- React + Vite setup with Leaflet integration.
- Geolocation hook (`navigator.geolocation`).
- Map view with event pins, custom popups, and user marker.
- Filter toolbar (Category, Distance, Date, Price, Search).
- Responsive split-screen (Desktop) / bottom-drawer (Mobile) views.

### Week 3 — Event Creation & RSVP Flow
- Authentication system (JWT, login, register, profile).
- Event Creation form with address geocoding and map pin preview.
- RSVP state management (Going / Interested buttons + database sync).
- "My Events" page (Going, Interested, Created).

### Week 4 — Personalization, Curation & Polish
- Featured events badges and map marker styling.
- Rule-based category recommendation engine.
- Admin moderation dashboard.
- Responsive UX polish, empty states, and error handling.
- Production deployment to Vercel + Render.

---

## 37. Out of Scope for Initial MVP

- Real-time chat & messaging.
- Native mobile app builds (iOS/Android binaries).
- Payment gateway & ticket transaction processing.
- Complex AI/ML models.
- In-app live streaming.

---

## 38. Success Criteria

A successful MVP allows a user to:
1. Load LocalVibe on desktop or mobile.
2. Allow browser location access and see map centered on their position.
3. View nearby events on the map and in the side list.
4. Filter by category, date, and radius.
5. Click a marker to preview event details and navigate to full details.
6. Toggle RSVP (Going / Interested) and see it saved under "My Events".
7. Create a new event with address search, preview position on map, and publish it.
8. See newly created event appear instantly on the map for nearby users.

---

## 39. Product Principles

1. Local discovery comes first.
2. The map is central to the user experience.
3. Proximity-based results are primary.
4. RSVP is effortless.
5. Event creation is intuitive.
6. Mobile experience is first-class.
7. Security and access control are strictly backend-enforced.
8. Avoid unnecessary complexity or unneeded AI dependencies.

---

## 40. Definition of Done

A feature is complete ONLY when:
- Frontend UI renders correctly and handles state gracefully.
- Backend API endpoints validate, process, and persist data securely.
- Authorizations & permissions are verified on the server.
- Error states and empty states are covered.
- Mobile responsiveness is verified.
- Existing features remain unbroken.

---

## 41. Documentation Boundaries

- **PRD.md** *(This Document)*: Product vision, requirements, features, MVP scope, roadmap, and user stories.
- **Architecture.md**: System architecture, API contracts, database schemas, directory structure.
- **Rules.md**: Code standards, linting, git conventions, safety guidelines.
- **Phases.md**: Granular step-by-step implementation tasks.
- **Design.md**: UI specifications, design tokens, color system, component guidelines.
- **Memory.md**: Active context log tracking implementation decisions during coding.
