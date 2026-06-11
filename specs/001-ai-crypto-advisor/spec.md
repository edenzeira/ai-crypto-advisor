# Feature Specification: AI Crypto Advisor Dashboard

**Feature Branch**: `001-ai-crypto-advisor`

**Created**: 2026-06-11

**Status**: Draft

**Input**: User description: "Full-stack personalized crypto investor dashboard with auth, onboarding, live data sections, AI insight, meme feed, and thumbs-up/down voting."

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 – Account Registration & Login (Priority: P1)

A new visitor arrives at the app and creates an account using their name, email, and password. On subsequent visits they log in and are taken directly to their dashboard.

**Why this priority**: Without authentication, no personalized experience exists. This is the entry point for every other story.

**Independent Test**: Register a new account, log out, log back in, and verify the session persists (JWT). Delivers a working auth flow with no dashboard functionality needed.

**Acceptance Scenarios**:

1. **Given** a visitor on the signup page, **When** they submit a valid name, email, and password, **Then** an account is created, a JWT is issued, and they are redirected to onboarding.
2. **Given** a visitor on the login page, **When** they submit correct credentials, **Then** a JWT is issued and they are redirected to the dashboard (or onboarding if preferences are missing).
3. **Given** a visitor on the login page, **When** they submit incorrect credentials, **Then** a clear error message is shown and no JWT is issued.
4. **Given** a logged-in user, **When** they access a protected page without a valid JWT, **Then** they are redirected to the login page.

---

### User Story 2 – First-Login Onboarding (Priority: P2)

After registering, a new user is walked through three onboarding questions so the app can tailor their experience. Their answers are saved and never asked again.

**Why this priority**: Onboarding captures preference data that drives content filtering and provides the foundation for future personalization and recommendation improvements.

**Independent Test**: Complete onboarding with sample answers, verify preferences are persisted in the database, and confirm the user is not shown onboarding again on next login.

**Acceptance Scenarios**:

1. **Given** a newly registered user with no saved preferences, **When** they log in for the first time, **Then** the onboarding screen is shown before the dashboard.
2. **Given** the onboarding screen, **When** the user selects crypto assets, investor type, and content preferences and submits, **Then** their choices are saved as user preferences and they are redirected to the dashboard.
3. **Given** a returning user who has completed onboarding, **When** they log in, **Then** the onboarding screen is skipped and they land directly on the dashboard.
4. **Given** the onboarding screen, **When** the user submits without selecting any assets, **Then** an error is shown requesting at least one asset selection.

---

### User Story 3 – Daily Dashboard View (Priority: P3)

A logged-in user opens their dashboard and sees four content sections populated with live or cached data: Market News, Coin Prices, AI Insight of the Day, and a Fun Crypto Meme.

**Why this priority**: This is the core product experience. Without dashboard content, the app has no value proposition beyond auth.

**Independent Test**: Load the dashboard and verify all four sections render with either live data or a visible static fallback. Delivers the full dashboard shell even before personalization or voting exists.

**Acceptance Scenarios**:

1. **Given** a logged-in user on the dashboard, **When** the page loads, **Then** all four sections (Market News, Coin Prices, AI Insight, Fun Meme) are visible and contain at least one content item each.
2. **Given** a logged-in user, **When** the external Market News API is unavailable, **Then** the Market News section displays fallback static articles and a subtle "using cached data" indicator.
3. **Given** a logged-in user, **When** the Coin Prices API is unavailable, **Then** the Coin Prices section shows static price data with a "prices may be delayed" notice.
4. **Given** a logged-in user whose preferences include specific coins, **When** the Coin Prices section loads, **Then** those preferred coins appear at the top of the list.
5. **Given** a logged-in user, **When** the AI Insight API is unavailable or quota is exceeded, **Then** a pre-written static insight is shown so the section never appears empty.

---

### User Story 4 – Content Voting (Priority: P4)

A user can vote thumbs up or thumbs down on any content item in any dashboard section. Their votes are saved and visible on the item.

**Why this priority**: Voting is the feedback mechanism for future recommendation improvements. It adds interactivity to an otherwise read-only dashboard.

**Independent Test**: Vote on a news item, refresh the page, and verify the vote is still shown. Delivers persistent user feedback independently of recommendation logic.

**Acceptance Scenarios**:

1. **Given** a logged-in user viewing a dashboard section, **When** they click the thumbs-up icon on a content item, **Then** the item records a positive vote for that user and the icon reflects the active state.
2. **Given** a logged-in user viewing a dashboard section, **When** they click thumbs-down on an already thumbs-up item, **Then** the vote switches to thumbs-down and the previous vote is removed.
3. **Given** a logged-in user who has voted on an item, **When** they reload the dashboard, **Then** their vote state is restored for each item.
4. **Given** an unauthenticated user, **When** they attempt to vote, **Then** they are prompted to log in rather than silently failing.

---

### Edge Cases

- What happens when a user's JWT expires mid-session? The app should redirect them to login with a clear "session expired" message rather than silently failing API calls.
- What if an external API returns malformed or empty data? Each section must degrade gracefully to static fallback data without causing the whole dashboard to crash.
- What if a user rapidly clicks both thumbs-up and thumbs-down? The last click wins; duplicate vote requests for the same item are idempotent.
- What if Reddit scraping is blocked or rate-limited? The meme section falls back to a curated static JSON of memes.
- What if a user navigates directly to `/dashboard` without completing onboarding? They are redirected to onboarding first.

---

## Requirements *(mandatory)*

### Functional Requirements

**Authentication**

- **FR-001**: System MUST allow users to register with a unique email address, a display name, and a password.
- **FR-002**: System MUST hash passwords before storage; plaintext passwords MUST never be persisted.
- **FR-003**: System MUST issue a signed JWT upon successful login or registration.
- **FR-004**: System MUST reject requests to protected routes that do not carry a valid, non-expired JWT.
- **FR-005**: System MUST store all secrets (JWT secret, API keys) in environment variables, never in source code.

**Onboarding**

- **FR-006**: System MUST present three onboarding questions to users who have not yet completed onboarding: (1) crypto assets of interest, (2) investor type (HODLer, Day Trader, NFT Collector), (3) preferred content types (Market News, Charts, Social, Fun).
- **FR-007**: System MUST persist onboarding answers as user preferences in the database.
- **FR-008**: System MUST show the onboarding screen exactly once per user (on first login after registration); subsequent logins skip directly to the dashboard.
- **FR-009**: Users MUST be able to select multiple crypto assets and multiple content types during onboarding.

**Dashboard – Market News Section**

- **FR-010**: System MUST display at least 5 market news headlines per dashboard load.
- **FR-011**: System MUST attempt to fetch news from the CryptoPanic API; if unavailable, MUST fall back to a bundled static JSON of news articles.
- **FR-012**: Each news item MUST display a headline, source name, and publication date.

**Dashboard – Coin Prices Section**

- **FR-013**: System MUST display current prices for at least the top 10 coins by market capitalisation.
- **FR-014**: System MUST prioritise the display of coins the user selected during onboarding.
- **FR-015**: System MUST attempt to fetch prices from the CoinGecko API; if unavailable, MUST fall back to static price data.
- **FR-016**: Each coin entry MUST show the coin name, ticker symbol, current price (USD), and 24-hour percentage change.

**Dashboard – AI Insight of the Day Section**

- **FR-017**: System MUST display one AI-generated insight per day, shared across all users (not per-user personalised in MVP).
- **FR-018**: System MUST generate or retrieve the daily insight using a free-tier AI service (OpenRouter or Hugging Face Inference API).
- **FR-019**: If the AI service is unavailable or quota is exceeded, System MUST display a pre-written static insight.
- **FR-020**: The insight MUST refresh no more than once every 24 hours to stay within free-tier limits.

**Dashboard – Fun Crypto Meme Section**

- **FR-021**: System MUST display at least one crypto meme image or text per dashboard load.
- **FR-022**: System MUST attempt to fetch a meme from Reddit (r/CryptoCurrency or r/CryptoMemes); if unavailable, MUST fall back to a curated static JSON meme list.

**Voting**

- **FR-023**: Every content item across all four dashboard sections MUST have a thumbs-up and thumbs-down control.
- **FR-024**: System MUST persist each vote (user, content reference, content type, vote direction) in the database.
- **FR-025**: A user MAY change or remove their vote on any item; the most recent action is the authoritative vote.
- **FR-026**: Vote counts (aggregate thumbs-up and thumbs-down totals) MUST be visible to the user on each content item.
- **FR-027**: Voting MUST be restricted to authenticated users.

**General / Non-Functional**

- **FR-028**: System MUST use only free public APIs and free-tier AI services; no paid external services.
- **FR-029**: System MUST be deployable and publicly accessible via a permanent URL.
- **FR-030**: All external API keys MUST be configurable via environment variables with documented fallback behaviour when keys are absent.

---

### Key Entities *(include if feature involves data)*

- **User**: Represents a registered account. Attributes: unique ID, display name, email (unique), hashed password, onboarding-completed flag, registration timestamp.
- **UserPreference**: Stores onboarding answers linked to a User. Attributes: preferred crypto asset list, investor type, preferred content type list.
- **Vote**: Records a single user's vote on a content item. Attributes: user ID (FK), content item identifier (external ID or slug), content type (news | coin | insight | meme), vote direction (up | down), timestamp.
- **DailyInsight**: Caches the AI-generated insight for the day. Attributes: date, insight text, generation source (ai | static).

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A new user can complete signup, onboarding, and reach a populated dashboard in under 3 minutes.
- **SC-002**: The dashboard loads all four sections within 5 seconds on a standard broadband connection; each section falls back gracefully within that same window if an API is unavailable.
- **SC-003**: All four dashboard sections display content (live or fallback) 100% of the time — no section should ever render empty or as a crash error.
- **SC-004**: Votes are persisted and correctly restored for a returning user 100% of the time (no lost votes on page reload).
- **SC-005**: The deployed app is publicly accessible via a stable URL with zero configuration required from a reviewer (no local setup to view the live version).
- **SC-006**: The repository README allows a developer to run the project locally within 15 minutes following the documented setup steps.
- **SC-007**: No API keys or secrets appear in the public repository or client-side code bundles.

---

## Assumptions

- Users access the app via a modern desktop or mobile browser; no native mobile app is in scope.
- The Coin Prices and Market News sections are refreshed on each dashboard page load; real-time streaming (WebSockets) is out of scope for MVP.
- The AI Insight of the Day is the same for all users; personalised per-user insights are a future enhancement.
- Onboarding preferences are captured once and cannot be edited by the user in the MVP; a "settings" page is out of scope.
- Reddit meme fetching uses the public JSON API (no OAuth required for read-only access); if that endpoint is rate-limited the static fallback is sufficient.
- Vote counts shown on items are aggregate totals visible to the voting user; a leaderboard or social feed of other users' votes is out of scope.
- The SQLite database is sufficient for the assignment submission; a production migration path (e.g., PostgreSQL) is documented but not implemented.
- The daily AI insight generation is triggered server-side (e.g., on first request of the day) rather than via a cron job, to avoid infrastructure complexity on free-tier hosting.
- Email verification and password-reset flows are out of scope for the MVP.
