# LocalVibe — Development Rules & Constraints

## 1. Purpose of Rules.md

`Rules.md` defines the mandatory technical standards, architectural boundaries, coding guidelines, security rules, and agent workflows for building **LocalVibe**.

This document ensures that all future development agents (including Antigravity and subagents) implement features consistently while strictly adhering to `PRD.md`, `Architecture.md`, and the approved **Stitch.ai** visual design direction.

---

## 2. Source of Truth Hierarchy

When making development decisions, agents must respect the following priority order:

1. **Explicit User Directives** (Current conversation instructions)
2. **`PRD.md`** (Product requirements, features, MVP scope)
3. **`Architecture.md`** (System design, data models, API contracts, infrastructure)
4. **`Rules.md`** (This document — development guidelines, constraints, workflows)
5. **`Design.md`** (Approved UI/UX design specifications)
6. **`Phases.md`** (Implementation roadmap and phase breakdowns)
7. **Existing Working Implementation** (Current codebase baseline)

> **Conflict Resolution Protocol**: Newer approved documentation may refine implementation details of earlier documents, but must **never silently contradict** `PRD.md` or `Architecture.md`. If a conflict arises between requested features and existing code:
> 1. Inspect the codebase baseline first.
> 2. Identify the exact scope of the conflict.
> 3. Determine the smallest safe change.
> 4. Preserve all unrelated working functionality.
> 5. Report the conflict to the user before proceeding.

---

## 3. General Development Principles

1. **Build Only What Is Required**: Implement features matching active specifications. Do not invent unprompted features.
2. **Avoid Unnecessary Complexity**: Simple, clean, maintainable code is superior to over-engineered abstractions.
3. **Do Not Over-Engineer the MVP**: Focus strictly on the core discovery, map, event creation, and RSVP loops.
4. **Reuse Existing Code**: Check existing utilities, hooks, components, and services before creating new ones.
5. **Keep Changes Focused**: Make small, incremental modifications. Avoid unrelated code refactoring or mass reformatting.
6. **Preserve Working Functionality**: Ensure existing features (e.g., map rendering, auth) remain unbroken when adding new capabilities.
7. **Empirical Verification Required**: Never declare a feature complete simply because its UI renders. Execute runtime checks.

---

## 4. Agent Workflow

Before making any code edits, a development agent **MUST**:

1. Inspect the workspace directory structure.
2. Read all relevant documentation (`PRD.md`, `Architecture.md`, `Rules.md`, `Design.md`, `Phases.md`).
3. Inspect existing files related to the request.
4. Trace data flow across frontend components, services, Express routes, controllers, services, and Mongoose models.
5. Plan the minimal, safest set of edits.

After code edits, the agent **MUST**:
6. Run build/test verification commands.
7. Perform local regression checks on adjacent flows.
8. Review modified diffs to ensure no sensitive credentials or unnecessary edits were added.
9. Report exact changes made following the standard reporting template.

---

## 5. Change Control

- **File Scoping**: Modify *only* files directly relevant to the task.
- **Formatting Constraints**: Do not apply aggressive auto-formatting or indentation rewrites across untouched code.
- **Architectural Escalation**: If a task requires changing a database schema, API contract, or framework choice:
  - **STOP execution**.
  - Explain the current architecture, why the change is necessary, impacted files, and potential risks.
  - Wait for explicit user approval.

---

## 6. Frontend Rules

- **Tech Stack**: React + Vite (JavaScript / ES6+).
- **Directory Alignment**: Follow `frontend/src/` structure defined in `Architecture.md` (`components`, `pages`, `layouts`, `hooks`, `services`, `context`, `utils`, `constants`, `styles`).
- **File Sizing**: Keep component files focused and concise (aim for < 250 lines per component file). Split large sub-views into logical sub-components.

---

## 7. React Component Rules

- **Single Responsibility Principle**: Components handle UI presentation and layout.
- **Logic Extraction**: Extract asynchronous data fetching, state calculations, and helper functions into hooks (`hooks/`), services (`services/`), or utilities (`utils/`).
- **Props Validation**: Explicitly handle missing or undefined props with default fallback values.

---

## 8. API Communication Rules

- **Centralized Service Modules**: All client HTTP requests must go through `frontend/src/services/` (e.g., `eventService.js`, `authService.js`).
- **Forbidden Pattern**: Do NOT write inline `fetch()` or `axios.get()` calls directly inside UI view components.
- **Request Lifecycle**: Always handle and render all 4 UI API states:
  1. `Loading` (Skeletons / spinners)
  2. `Success` (Data rendering)
  3. `Empty` (Zero results messaging)
  4. `Error` (User-friendly toast/alert)

---

## 9. Frontend State Management

- **Library Usage**: Use local React state (`useState`, `useReducer`), custom hooks, and React Context. Do NOT install Redux, MobX, or Zustand unless explicitly requested.
- **State Separation**: Keep transient UI state (modal toggles, active tab) strictly separate from server-side state (fetched events list).

---

## 10. UI/UX Rules & Stitch Integration

- **Stitch.ai Design Standard**: The approved **Stitch.ai** visual mockups represent the official visual and interaction benchmark.
- **Independent Redesign Ban**: Agents must NOT arbitrarily change color palettes, typography, card layouts, or core visual themes.
- **Stitch Code Import Rule**:
  > **CRITICAL**: Stitch-generated HTML/React snippets must **NOT** be blindly copy-pasted or imported directly into the codebase. Agents must inspect Stitch to understand visual hierarchy, colors, spacing, and micro-interactions, and then write clean, modular React components adhering to `Architecture.md`.

---

## 11. Map-First Rule

- **Central Paradigm**: The map is the primary discovery engine of LocalVibe.
- **Map Interaction**: The map must never be reduced to a static background image or decorative element. It must support user geolocation pins, category-coded markers, popups, zooming, panning, and sync with the adjacent event list.

---

## 12. Responsive Design Rules

- **Multi-Device Support**: Layouts must be intentionally tailored for Desktop, Laptop, Tablet, and Mobile viewports.
- **Desktop Layout**: Split-screen view (Left: Filter bar + Event Feed; Right: Fixed Interactive Map).
- **Mobile Layout**: Map-first interface with collapsible bottom drawer or view switcher button (Map View vs. Card Feed View).
- **Touch Targets**: All buttons, chips, and pins must have a minimum interactive tap size of `44x44px` on mobile screens.

---

## 13. Accessibility Rules

- **Contrast**: Text elements must meet WCAG AA contrast ratios (minimum 4.5:1 for standard text).
- **Form Controls**: All form inputs must have associated `<label>` tags or explicit `aria-label` attributes.
- **Keyboard Navigation**: Interactive elements must respond to `Tab`, `Space`, and `Enter` keys with visible focus rings.

---

## 14. Backend Rules

- **Tech Stack**: Node.js + Express.js REST API.
- **Processing Layer Pipeline**: `Route` → `Middleware` → `Controller` → `Service` → `Model` → `MongoDB`.
- **Logic Placement**: Express route files contain only path bindings. Business logic resides in `src/services/`. Controller functions format request/response payloads.

---

## 15. API Rules

- **RESTful Conventions**: Plural resource endpoints (`/api/events`, `/api/users`), standard HTTP verbs (`GET`, `POST`, `PUT`, `DELETE`, `PATCH`).
- **Response Format Standard**:
  - Success: `{ "success": true, "data": { ... } }`
  - Error: `{ "success": false, "message": "User-friendly message string" }`
  - Paginated List: `{ "success": true, "data": [...], "pagination": { "page": 1, "limit": 20, "total": 100 } }`

---

## 16. Validation Rules

- **Backend Enforcement**: Never rely on client-side form validation alone. Validate all incoming request payloads using backend middleware (Zod/Joi).
- **Date Validation**: `endDate` must be greater than or equal to `startDate`. Event dates must be valid ISO-8601 timestamps.
- **Numeric Validation**: Event `price` must be `>= 0`.

---

## 17. Database Rules

- **ODM Standard**: Use Mongoose with MongoDB Atlas.
- **Direct Client Access Ban**: Frontend applications must never access MongoDB directly. All queries pass through the Express REST API.
- **Single Model Truth**: Maintain one authoritative schema file per entity in `backend/src/models/`.

---

## 18. GeoJSON Coordinate Rule

> **CRITICAL ARCHITECTURAL MANDATE**:
> All event locations stored in MongoDB must strictly follow the GeoJSON Point specification:
> ```json
> {
>   "type": "Point",
>   "coordinates": [longitude, latitude]
> }
> ```
> **Longitude (`-180` to `180`) comes FIRST; Latitude (`-90` to `90`) comes SECOND**.
> Inverting coordinates to `[latitude, longitude]` breaks spatial indexes and is strictly prohibited.

---

## 19. Geospatial Query Rule

- **Server-Side Execution**: Proximity searches (`GET /api/events/nearby`) MUST execute server-side using MongoDB's native `$near` or `$geoNear` spatial query operators against a **`2dsphere`** index on `location`.
- **Client-Side Search Ban**: Loading all database events into React to compute distances client-side is strictly forbidden.

---

## 20. Distance Unit Rule

- **Internal Database Unit**: MongoDB geospatial queries require distance values in **meters**.
- **API Unit**: API query parameters accept radius in **kilometers** (e.g., `radius=5`).
- **Conversion Rule**: The backend service layer must explicitly convert kilometers to meters: `meters = radiusKm * 1000`. Mixing units without conversion is forbidden.

---

## 21. Event Management & Geographic Scope Rules

- **Geographic Scope**: **India Only**. LocalVibe currently supports events located within India only.
- **Coordinate Bounds**: Latitude must be between `6.0` and `38.0` (°N). Longitude must be between `68.0` and `98.0` (°E). Any coordinates outside India must be rejected by backend validation with a 400 Bad Request error.
- **Required Event Payload**: Title, description, category, start date, end date, address, valid GeoJSON coordinates within India, price, image URL, organizer ID.

---

## 22. Event Ownership Rules

- **Resource Protection**: Users can edit or delete only the events they created (`event.organizer === req.user.id`), unless the authenticated user has `ADMIN` role.
- **ID Security**: Never trust client-provided user IDs in payload bodies. Read the user identity directly from the authenticated server-side JWT (`req.user.id`).

---

## 23. RSVP Rules

- **Supported States**: `GOING`, `INTERESTED`.
- **Uniqueness Constraint**: A user can have only one active RSVP entry per event (enforced by compound unique index `{ user: 1, event: 1 }`).
- **Atomic Operations**: Changing state from `INTERESTED` to `GOING` updates the existing RSVP document via atomic `findOneAndUpdate`. Removing an RSVP removes the record.

---

## 24. Social Feature Rules (Post-MVP)

- **Strict Validation**: Display social indicators (e.g. *"3 friends are going"*) ONLY when users meet verified follow/connection graph rules.
- **Privacy First**: Never expose private user attendee details without user consent.

---

## 25. Featured Event Rules

- **Field Flag**: `isFeatured: Boolean` (Default `false`).
- **Authorization Restriction**: Normal users cannot set `isFeatured = true` during event creation. Setting or modifying featured status is restricted to backend `ADMIN` middleware routes.

---

## 26. Authentication Rules

- **Mechanism**: JWT (JSON Web Token) stateless authentication.
- **Server-Side Boundary**: Frontend route guards are for UX only; backend API middleware (`authenticateToken`) is the sole security boundary. Unauthenticated requests to protected routes must return `401 Unauthorized`.

---

## 27. Authorization Rules

- **Role Definitions**:
  - `USER`: Manage own profile, create events, manage owned events, submit RSVPs.
  - `ADMIN`: User management, event moderation, featuring events, reviewing platform analytics.
- **Role Verification**: Checked via server-side role claims inside `req.user.role`. Frontend button hiding is non-security presentation logic.

---

## 28. Admin Security Rules

- **Protected API Endpoints**: All `/api/admin/*` endpoints must pass through `requireRole('ADMIN')` middleware.
- **Registration Safeguard**: Public user registration routes (`POST /api/auth/register`) must default role strictly to `USER`. Admin accounts must be created via internal database scripts.

---

## 29. Location Rules

- **Browser API**: Use `navigator.geolocation`.
- **Graceful Degradation**: If permission is denied or unavailable, display a non-intrusive warning, set a default fallback city position (e.g., Mumbai / NYC), and allow manual location entry. The application must never crash when location is blocked.

---

## 30. Geocoding Rules

- **Geocoding Flow**: Address strings entered by organizers must resolve to valid `[longitude, latitude]` coordinates via a geocoding service (e.g. Nominatim / Google Places) before publishing.
- **API Key Security**: Private backend geocoding API keys must be kept in `.env` and never exposed via frontend `VITE_` variables.

---

## 31. Map Provider Rules

- **Tile Provider**: Leaflet + React Leaflet with OpenStreetMap tiles.
- **Performance Boundary**: Cap active map markers to a maximum of 100 markers per viewport query payload to prevent browser rendering degradation.

---

## 32. External Services Isolation

- **Modularization**: Third-party external services (geocoding, image storage, map tile providers) must be wrapped in isolated service abstractions (`services/geocodingService.js`) to allow seamless swapping in the future.

---

## 33. Environment Variables & Secret Protection

- **Commit Ban**: Secret keys must NEVER be committed to Git repositories.
- **Files**: Maintain `.env` locally (ignored in `.gitignore`) and provide `.env.example` with blank keys as documentation.
- **Forbidden Secrets in Version Control**: Database URIs, JWT secret strings, API secret tokens.

---

## 34. Frontend Environment Variables Rule

- **Public Scope**: Variables prefixed with `VITE_` in Vite applications are embedded into client bundle outputs and visible to the public.
- **Rule**: NEVER place database credentials, backend secret keys, or private tokens inside `VITE_` environment variables.

---

## 35. Error Handling Rules

- **Centralized Catch**: Backend Express app must use centralized error middleware.
- **User Messages**: Sanitized, friendly messages returned to clients. Raw database exception stack traces must be suppressed in production builds.

---

## 36. Loading States

- **Visual Feedback**: Every async action (fetching events, creating event, submitting RSVP, location detection) must render visual loading state indicators (Skeleton cards, spinner icons, or button loading states).

---

## 37. Empty States

- **Component Guidance**: Major list components (Event List, My Events Tabs, Search Results) must render contextual empty state UI when zero items are returned.
- **Empty State Requirements**: Must explain (1) What happened, (2) Why zero items exist, and (3) Provide a clear action CTA button (e.g. *"Clear Filters"*, *"Expand Search Radius"*).

---

## 38. Performance Rules

- **Index Optimization**: Mandatory `2dsphere` spatial index on `Event.location`.
- **Query Pagination**: Default paginated queries (`limit=20`).
- **Input Debouncing**: Search inputs debounced by `300ms` to avoid query flooding.

---

## 39. Security Rules

- **Input Sanitization**: Validate and sanitize all user input strings to mitigate XSS and injection attacks.
- **CORS Configuration**: Restrict origin access to authorized client domains (`CLIENT_URL`).
- **Password Safety**: Password hashes stored using `bcryptjs` (min 10 salt rounds). Plaintext passwords must never be stored or logged.

---

## 40. Logging Rules

- **Permitted Logs**: Server start events, database connection status, sanitized error instances, admin operations.
- **Forbidden Logs**: Plaintext passwords, JWT secrets, database connection strings containing credentials, personal user tokens.

---

## 41. Dependency Rules

- **Justification Required**: Do not install new `npm` packages without evaluating existing repository packages first.
- **Duplication Ban**: Avoid installing competing libraries for solved problems (e.g. do not install both `axios` and `node-fetch` if `fetch` is natively available).

---

## 42. File Structure Rules

- **Repository Hygiene**: Follow the repository structure defined in `Architecture.md`.
- **Root Directory Rule**: Do not drop temporary scratch files, test scripts, or arbitrary markdown files in the project root folder.

---

## 43. Naming Conventions

- **React Components / Views**: `PascalCase` (e.g., `EventCard.jsx`, `DiscoverPage.jsx`).
- **Hooks**: `camelCase` with `use` prefix (e.g., `useNearbyEvents.js`).
- **Controllers / Services / Utilities**: `camelCase` (e.g., `eventController.js`, `geoUtils.js`).
- **Mongoose Models**: `PascalCase` singular (e.g., `User.js`, `Event.js`, `RSVP.js`).

---

## 44. Code Quality & Clean Code Rules

- **Readability**: Write self-documenting code with clear variable names.
- **Refactoring Avoidance**: Do not rewrite working functions or change coding styles across untouched code files.
- **Magic Numbers**: Replace hard-coded magic values with named constants in `constants/`.

---

## 45. Local Testing Rules

Before considering a feature complete, test locally:
1. **Happy Path**: Successfully execute primary action (e.g. creating event, submitting RSVP).
2. **Edge Cases**: Empty search results, invalid address inputs, missing permissions.
3. **Geospatial Checks**: Verify coordinates are in `[longitude, latitude]` order and correctly rendered on map pins.
4. **Mobile Layout**: Confirm buttons and map interaction function on small screen viewports.

---

## 46. Regression Testing Rules

- **Cross-Component Safety**: Modifying core services (e.g., `eventService.js`) requires testing all dependant view pages (`DiscoverPage`, `EventDetailsPage`, `MyEventsPage`) to ensure zero regressions occurred.

---

## 47. Git & Version Control Rules

- **Agent Git Ban**: Development agents must **NOT** execute `git add`, `git commit`, `git push`, or `git checkout` commands unless explicitly requested by the user.
- **Pre-Commit Checks**: Ensure `.env` is un-tracked and build commands succeed cleanly prior to committing.

---

## 48. Deployment Rules

- **Deploy Trigger**: Deployments must occur strictly when explicitly instructed by the user.
- **Target Topology**: Frontend on Vercel, Backend REST API on Render, Database on MongoDB Atlas.
- **Pre-Deployment Audit**: Verify all production environment variables are registered in hosting dashboards.

---

## 49. Seed Data Rules

- **Script Isolation**: Seed data resides in `backend/src/seed/seedDatabase.js`.
- **Target Cities**: Realistic event coverage for **Mumbai, Pune, New York, London**.
- **Production Guardrail**: Seed execution must never trigger automatically in production environments.

---

## 50. No Unnecessary AI/ML Rule

- **Architecture Constraint**: Do NOT install or integrate machine learning frameworks, OpenAI APIs, LLM tools, or complex neural recommendation models.
- **MVP Logic**: Event recommendations must remain rule-based (matching user's past RSVP category preferences with nearby active events).

---

## 51. Feature Development Rule

- **Phased Implementation**: Development must proceed according to `Phases.md`. Do not skip ahead or implement post-MVP phase features prematurely.

---

## 52. Documentation Synchronization Rule

- **Living Architecture**: If implementation necessities dictate a approved architectural change, `Architecture.md` must be updated immediately to remain synchronized with source code realities.

---

## 53. Stitch Design Integration Rule

- **Visual Reference Only**: Stitch.ai mockups provide visual guidelines for color palette, spacing, typography, and layout.
- **No Direct Imports**: Stitch generated code must be translated into clean, hand-crafted React components matching `Architecture.md`.

---

## 54. Ban on Unauthorized Visual Redesigns

- **Visual Stability**: Agents are strictly forbidden from altering established color themes, changing typography, or redesigning layouts without explicit user approval. Usability bug fixes and responsive alignment tweaks are permitted.

---

## 55. Backward Compatibility

- **API Preservation**: Modifications to existing API endpoints must be additive. Do not remove or rename response fields expected by active frontend components.

---

## 56. Data Integrity

- **User Data Protection**: Database migrations or schema updates must preserve existing user documents without data corruption or destructive field deletion.

---

## 57. Production Safety

- **Release Checklist**: Before marking production deployment complete: verify CORS origins, database connection strings, JWT secret strength, map tile availability, and HTTPS endpoint URLs.

---

## 58. Definition of Done (Completion Standard)

A feature is considered **COMPLETE** only when:
1. Frontend UI is rendered cleanly adhering to Stitch design guidelines.
2. Backend REST API routes process payloads securely.
3. Database persistence is verified in MongoDB Atlas / In-Memory development store.
4. Input validation and server-side authorization checks are active.
5. Loading, empty, and error UI states function properly.
6. Mobile touch interaction is verified.
7. Local empirical testing confirms clean execution with zero regressions.

---

## 58.1 India-Only Geographic Scope & Calendar Rules

1. **Geographic Boundaries**: LocalVibe is strictly restricted to India (Latitude: 6.0°N to 38.0°N, Longitude: 68.0°E to 98.0°E). All non-Indian locations (e.g., London, New York) are prohibited from event inventory.
2. **Accurate Coordinates**: Random coordinates are forbidden. Every event must use real venue addresses with corresponding GeoJSON `[longitude, latitude]` coordinates.
3. **Location State Separation**:
   - `selectedLocation` (Header display) MUST NEVER be overwritten by browser GPS.
   - `currentLocation` (Browser GPS) is strictly used for `/api/events/nearby` queries and map centering.
4. **Authenticated Add to Calendar**:
   - Guests clicking "Add to Google Calendar" must be prompted to log in via `AuthModal` without generating the calendar event.
   - Only authenticated users may export calendar events.
   - Calendar actions must never alter RSVP state or database records.
5. **Demo Accounts & Passwords**: Demo passwords must never be stored in plaintext. Always use bcrypt hashing.

---

## 59. Standard Agent Reporting Format

Upon completing any development task, agents must report progress using the following structured template:

```markdown
### Changed
- [List modified or created files]

### Implemented
- [Summary of implemented features]

### Data/API Changes
- [Details of API endpoint or database schema updates]

### Testing
- [Summary of local tests executed]

### Issues
- [Any remaining open questions or blockers]

### Git Status
- Not committed / Not pushed (Unless explicitly requested)
```

---

## 60. Final Rule — "When Uncertain, Ask"

> **GOLDEN RULE**:
> If a requested feature or bug fix creates ambiguity between documentation and codebase reality, the agent must **INSPECT**, **ANALYZE**, and **ASK** for clarification rather than guessing or making unauthorized architectural alterations.
