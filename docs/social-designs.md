# SpotHitch Social Tab -- 20 Design Proposals

> **Context**: SpotHitch is a hitchhiking PWA (14,669 spots, 137 countries). The Social tab currently has 3 main tabs: Chat (zone chat rooms, private DMs, companion search), Groups (my groups, discover), and Events (upcoming, my events, create). This document presents 20 alternative design proposals ranging from simple refinements to ambitious reimaginings.

> **Current stack**: Vite 5 + vanilla JS ES Modules + Tailwind CSS + Leaflet + Firebase

---

## Table of Contents

1. [Streamlined Messenger](#1-streamlined-messenger)
2. [Social Feed (Instagram-style)](#2-social-feed)
3. [Live Map Social](#3-live-map-social)
4. [Travel Diary / Carnet de Route](#4-travel-diary)
5. [Travel Partner Matching (Tinder-style)](#5-travel-partner-matching)
6. [Forum / Community Boards](#6-forum-community-boards)
7. [Safety Network Hub](#7-safety-network-hub)
8. [Local Bulletin Board](#8-local-bulletin-board)
9. [Photo Gallery / Spot Showcase](#9-photo-gallery-spot-showcase)
10. [Activity Timeline](#10-activity-timeline)
11. [Group Trip Planner](#11-group-trip-planner)
12. [Stories & Reels](#12-stories-and-reels)
13. [Radio / Voice Channels](#13-radio-voice-channels)
14. [Hitchhiker Wiki / Knowledge Base](#14-hitchhiker-wiki)
15. [Reputation & Trust Network](#15-reputation-and-trust-network)
16. [Ride Board (Classified Ads)](#16-ride-board)
17. [Campfire (Async Gatherings)](#17-campfire)
18. [Proximity Radar](#18-proximity-radar)
19. [Mentorship Network](#19-mentorship-network)
20. [Hybrid Hub (Best-of Combination)](#20-hybrid-hub)

---

## 1. Streamlined Messenger

**Description**: A stripped-down, WhatsApp-like messaging experience focused purely on conversations. Remove clutter, prioritize speed and reliability. Everything is a conversation -- zone chats, DMs, and group chats all live in one unified inbox sorted by recency.

**Tabs/Sections**:
- Conversations (unified inbox: DMs + group chats + zone rooms)
- Contacts (friends list + add friend)

**Key Features**:
- Single scrollable list of all conversations, sorted by last message time
- Pinned conversations (up to 3)
- Swipe-left to mute/archive, swipe-right to pin
- Voice messages (record + send audio clips)
- Message reactions (tap-and-hold for emoji)
- Read receipts with double-check marks
- Typing indicators
- Offline queue: messages composed offline send when connectivity returns

**Wireframe**:
```
+------------------------------------------+
|  Social                          [+ New] |
|------------------------------------------|
| [Search conversations...]                |
|------------------------------------------|
| PIN  Marie L.            10:32           |
|      "On se retrouve a la station?"      |
|------------------------------------------|
|      Europe Zone Chat        09:15       |
|      Pedro: "Anyone near Lyon?"          |
|------------------------------------------|
|      Groupe Berlin Trip      Yesterday   |
|      3 new messages                      |
|------------------------------------------|
|      Help Room               Yesterday   |
|      "Thanks for the tip!"              |
|------------------------------------------|
|      Tom R.                  Mon         |
|      You: "Safe travels!"               |
|------------------------------------------|
|                                          |
|           (scrollable list)              |
|                                          |
+------------------------------------------+
| [Conversations]        [Contacts]        |
+------------------------------------------+
```

---

## 2. Social Feed

**Description**: An Instagram/Twitter-style vertical feed where hitchhikers post updates, photos, route completions, and tips. The feed creates a sense of community and makes the app feel alive even when you are not actively traveling. Content is generated both by users and automatically from trip milestones.

**Tabs/Sections**:
- Feed (all posts, chronological or algorithmic)
- Following (posts from friends only)
- Trending (most-liked posts this week)

**Key Features**:
- Post types: text update, photo with caption, route completed, spot review, "I'm on the road" status
- Like, comment, share, and bookmark posts
- Hashtags (#balkans, #nighthitching, #solofemale)
- Auto-generated "milestone" posts ("Marie just completed 5000 km hitchhiking!")
- Location tag on posts (optional, for safety)
- Content moderation: community flagging + auto-filter

**Wireframe**:
```
+------------------------------------------+
|  [Feed]   [Following]   [Trending]       |
|------------------------------------------|
| +--------------------------------------+ |
| | [avatar] Marie L.      2h ago        | |
| |                                      | |
| | [====== PHOTO: sunset on highway ===]| |
| |                                      | |
| | "Best spot in Croatia! Got a ride    | |
| |  in 5 minutes at 7am."              | |
| |                                      | |
| | [heart] 23  [comment] 5  [share]    | |
| +--------------------------------------+ |
|                                          |
| +--------------------------------------+ |
| | [avatar] Pedro S.     4h ago         | |
| |                                      | |
| | [ROUTE BADGE] Completed:             | |
| | Paris -> Berlin (890 km, 3 rides)    | |
| |                                      | |
| | "Made it! 12 hours total."           | |
| |                                      | |
| | [heart] 45  [comment] 12  [share]   | |
| +--------------------------------------+ |
|                                          |
| [FAB: + New Post]                        |
+------------------------------------------+
```

---

## 3. Live Map Social

**Description**: A full-screen map showing real-time positions of friends and nearby hitchhikers who have opted in to sharing their location. The social layer sits on top of the existing spot map. Tap a user avatar to see their status, send a message, or check their route.

**Tabs/Sections**:
- Map (full screen, social overlay)
- Nearby list (sorted by distance)

**Key Features**:
- Real-time friend positions on the map (with privacy controls: exact, city-level, or hidden)
- "I'm hitchhiking right now" status broadcast with destination
- Tap friend marker to see profile card + quick-message
- Ghost mode: completely invisible to others
- Heatmap overlay showing where hitchhikers are clustered right now
- "SOS visible to nearby users" emergency broadcast within 50 km radius
- Battery-efficient location sharing (updates every 5-15 min, not continuous)

**Wireframe**:
```
+------------------------------------------+
|  [Map view with friend markers]          |
|                                          |
|     [Marie avatar]                       |
|            O---->  "heading to Berlin"   |
|                                          |
|        [Pedro avatar]                    |
|          (idle, 3km away)                |
|                                          |
|                    [Tom avatar]           |
|                                          |
|                                          |
+------------------------------------------+
| [Nearby: 3 hitchhikers]        [Filter] |
|------------------------------------------|
| [Marie] 1.2 km - heading Berlin   [msg] |
| [Pedro] 3.0 km - idle             [msg] |
| [Tom]   8.5 km - heading south    [msg] |
+------------------------------------------+
| Privacy: [Exact | City | Hidden]         |
+------------------------------------------+
```

---

## 4. Travel Diary

**Description**: A chronological journal where each hitchhiker documents their journey with photos, text entries, and map pins. Think of it as a personal blog built into the app. Other users can follow your diary and leave encouragements. Perfect for long multi-day trips.

**Tabs/Sections**:
- My Diary (personal entries)
- Explore (browse others' public diaries)
- Bookmarked (saved diaries from other travelers)

**Key Features**:
- Day-by-day entries with date, location, weather, mood
- Photo galleries per entry (up to 5 photos)
- Auto-generated route map from diary entries
- "Trip summary" auto-generated at the end (total km, countries, rides, days)
- Follow a traveler's diary for real-time updates
- Export diary as PDF for personal keepsake
- Privacy: public, friends-only, or private

**Wireframe**:
```
+------------------------------------------+
|  [My Diary]  [Explore]  [Bookmarked]    |
|------------------------------------------|
|                                          |
| === June 14, 2026 - Day 3 ===           |
| Location: Split, Croatia                 |
| Weather: sunny 28C | Mood: happy         |
|                                          |
| [photo] [photo] [photo]                 |
|                                          |
| "Woke up at the hostel, walked to the   |
|  highway entrance. Got picked up by a    |
|  local family within 20 minutes..."      |
|                                          |
| Rides today: 2 | Distance: 180 km       |
| [heart 12] [comment 3]                  |
|                                          |
|------------------------------------------|
| === June 13, 2026 - Day 2 ===           |
| Location: Zagreb, Croatia                |
| ...                                      |
|                                          |
| [FAB: + New Entry]                       |
+------------------------------------------+
```

---

## 5. Travel Partner Matching

**Description**: A Tinder-like card swiping interface for finding travel companions. Users create a "trip card" with their planned route, dates, and preferences. Swipe right to express interest, and when there is a mutual match, a chat opens. Designed specifically for hitchhikers looking for someone to travel with for safety and company.

**Tabs/Sections**:
- Discover (swipeable cards)
- Matches (mutual interests)
- My Trip Card (create/edit your profile)

**Key Features**:
- Swipe right = interested, swipe left = pass
- Trip cards show: route, dates, languages spoken, experience level, travel style
- Filters: date range, route overlap, gender preference, experience level
- Mutual match triggers a chat
- Verification badge for trust (ID verified, phone verified)
- "Travel style" tags: early bird, night owl, fast traveler, slow explorer, vegan, etc.
- Safety: profiles linked to verified identity, report/block system

**Wireframe**:
```
+------------------------------------------+
|  [Discover]   [Matches (3)]   [My Card]  |
|------------------------------------------|
|                                          |
| +--------------------------------------+ |
| |                                      | |
| |  [PHOTO]                             | |
| |                                      | |
| |  Marie, 24                           | |
| |  Verified | 12,000 km hitched        | |
| |                                      | |
| |  Route: Lyon -> Istanbul             | |
| |  Dates: Jun 20 - Jul 5              | |
| |  Languages: FR, EN, ES              | |
| |                                      | |
| |  Tags: #earlybird #slowtravel       | |
| |        #vegetarian                   | |
| |                                      | |
| +--------------------------------------+ |
|                                          |
|     [ X Pass ]          [ V Match ]      |
|                                          |
+------------------------------------------+
```

---

## 6. Forum / Community Boards

**Description**: A Reddit/Discourse-style threaded forum organized by topics. Unlike ephemeral chat, forum posts persist and are searchable, building a long-term knowledge base. Great for "how to hitch from X to Y" questions, gear recommendations, and country-specific discussions.

**Tabs/Sections**:
- Hot (trending threads)
- New (latest posts)
- Categories (by region, topic, etc.)
- My Posts

**Key Features**:
- Categories: Route Advice, Gear & Tips, Country Discussions, Safety, Stories, Meetups, Off-Topic
- Threaded replies with upvote/downvote
- Search across all threads
- Pin important threads (admin/moderator)
- Flair tags: [Question], [Story], [Warning], [Tip]
- Markdown support in posts
- "Best answer" marking for question threads
- Notifications when someone replies to your thread

**Wireframe**:
```
+------------------------------------------+
|  [Hot]  [New]  [Categories]  [My Posts]  |
|------------------------------------------|
| [Search threads...]                      |
|------------------------------------------|
|                                          |
| [TIP] How to hitch out of Paris          |
|   by @Marie | 2h ago | 23 upvotes       |
|   15 replies | Route Advice              |
|------------------------------------------|
| [QUESTION] Is Romania safe for solo F?   |
|   by @Ana | 5h ago | 45 upvotes         |
|   28 replies | Safety                    |
|------------------------------------------|
| [STORY] 30 days, 12 countries, 0 euros   |
|   by @Pedro | 1d ago | 128 upvotes      |
|   42 replies | Stories                   |
|------------------------------------------|
| [WARNING] Avoid A7 rest stop near Lyon   |
|   by @Tom | 2d ago | 67 upvotes         |
|   9 replies | Safety                     |
|------------------------------------------|
|                                          |
| [FAB: + New Thread]                      |
+------------------------------------------+
```

---

## 7. Safety Network Hub

**Description**: A social tab entirely centered on safety -- the most critical need for hitchhikers, especially solo travelers and women. This design puts safety features front-and-center instead of burying them in menus. Every feature answers the question: "How can the community keep each other safe?"

**Tabs/Sections**:
- Dashboard (my safety status + trusted contacts)
- Alerts (nearby warnings + incident reports)
- Companions (find/manage travel buddies)

**Key Features**:
- Trusted contact circle: up to 5 people who get auto-notified of your location every hour
- One-tap SOS: broadcasts location to trusted contacts + nearby users + emergency services
- Live trip sharing: share a link with non-app users (family) to track your journey
- Incident report wall: anonymous reports of dangerous spots, aggressive drivers, scam warnings
- "Check-in" timer: set a timer, if you don't check in, contacts are alerted
- Safety score per area based on community reports
- Verified ride logging: log the license plate + photo of the car you get into (sent to trusted contacts)
- "Walk me home" mode: someone watches your GPS until you reach a safe point

**Wireframe**:
```
+------------------------------------------+
|  [Dashboard]   [Alerts]   [Companions]   |
|------------------------------------------|
|                                          |
| MY SAFETY STATUS                         |
| [  Currently: Safe & idle     ]          |
| [  Last check-in: 12 min ago  ]          |
|                                          |
| TRUSTED CONTACTS (3/5)                   |
| [Marie] [Pedro] [Mom]   [+ Add]         |
|                                          |
| QUICK ACTIONS                            |
| +------------------+  +----------------+ |
| | [!] SOS Alert    |  | [car] Log Ride | |
| |   Emergency      |  |   Plate+Photo  | |
| +------------------+  +----------------+ |
| +------------------+  +----------------+ |
| | [share] Share    |  | [timer] Timer  | |
| |   Live Trip      |  |   Check-in     | |
| +------------------+  +----------------+ |
|                                          |
| RECENT ALERTS NEAR YOU                   |
| [!] Aggressive driver A7 - 2h ago       |
| [!] Sketchy rest stop Km 240 - 1d ago   |
+------------------------------------------+
```

---

## 8. Local Bulletin Board

**Description**: A location-aware community board that shows posts from your current geographic area. Think Craigslist meets a hostel notice board. Hitchhikers at the same location can exchange tips, offers, and requests. The board refreshes as you move to a new city.

**Tabs/Sections**:
- Board (posts near your current location)
- Post (create a new notice)
- My Notices

**Key Features**:
- Auto-detects your current city/region and shows local posts
- Post categories: Looking for companion, Offering a ride, Accommodation available, Gear exchange, Local tip, Warning
- Posts auto-expire after 48 hours (keeps content fresh and relevant)
- Distance shown from your position to each post
- "Bump" system: users can bump a post to keep it visible
- Map view of all local posts
- Language auto-detection and basic auto-translate

**Wireframe**:
```
+------------------------------------------+
|  Local Board: Zagreb, Croatia    [map]   |
|  (12 active notices)                     |
|------------------------------------------|
| [All] [Companion] [Ride] [Accom] [Tip]  |
|------------------------------------------|
|                                          |
| COMPANION WANTED              0.5 km     |
| "Heading to Split tomorrow morning,      |
|  anyone want to join?"                   |
| by @Marie | 3h ago | Expires in 21h     |
| [Reply] [Bump]                           |
|------------------------------------------|
| FREE RIDE OFFERED             1.2 km     |
| "Driving to Budapest tomorrow 8am,       |
|  2 seats available"                      |
| by @LocalDriver | 6h ago                |
| [Reply] [Bump]                           |
|------------------------------------------|
| LOCAL TIP                     nearby     |
| "The gas station on E65 exit is great    |
|  for hitching south. Ask for Marko."     |
| by @Pedro | 12h ago                      |
| [Reply] [Bump]                           |
|------------------------------------------|
|                                          |
| [FAB: + Post Notice]                     |
+------------------------------------------+
```

---

## 9. Photo Gallery / Spot Showcase

**Description**: A visual-first design inspired by Pinterest/Unsplash where the Social tab becomes a photo gallery of hitchhiking spots, roads, and moments. Users contribute photos tied to specific spots or routes. This makes the app visually inspiring and helps newcomers see what hitchhiking actually looks like.

**Tabs/Sections**:
- Gallery (masonry grid of photos)
- Collections (curated photo sets, e.g., "Best sunsets", "Highway art")
- My Photos

**Key Features**:
- Photos tagged to specific spots (tap photo to see spot on map)
- Masonry/Pinterest-style grid layout
- "Photo of the week" featured at top
- Collections: user-curated or auto-generated (by country, by season, by rating)
- Photo challenges: weekly theme ("show us your waiting spot")
- Like and comment on photos
- Download/share with SpotHitch watermark
- EXIF data stripped for privacy, location shown only at spot level (not exact GPS)

**Wireframe**:
```
+------------------------------------------+
|  [Gallery]   [Collections]   [My Photos] |
|------------------------------------------|
| PHOTO OF THE WEEK                        |
| [========= LARGE HERO PHOTO ===========]|
| "Highway E65, Croatia" by @Marie         |
| [heart 234] [comment 18]                |
|------------------------------------------|
|                                          |
| +----------+  +----------+              |
| |  [photo] |  |  [photo] |              |
| |  [photo] |  |          |              |
| | Spain    |  | Norway   |              |
| | heart 12 |  | heart 45 |              |
| +----------+  +----------+              |
| +----------+  +----------+              |
| |          |  |  [photo] |              |
| |  [photo] |  |  [photo] |              |
| | Germany  |  | Portugal |              |
| | heart 8  |  | heart 31 |              |
| +----------+  +----------+              |
|                                          |
| [FAB: + Add Photo]                       |
+------------------------------------------+
```

---

## 10. Activity Timeline

**Description**: A chronological timeline that aggregates all social activity across the app into one scrollable stream. It shows what your friends are doing, community milestones, nearby events, and system updates. Low effort to consume, always something new to see.

**Tabs/Sections**:
- All Activity (everything)
- Friends (friends only)
- Milestones (achievements, completed trips)

**Key Features**:
- Activity types: spot reviewed, trip completed, new friend added, event joined, achievement unlocked, photo uploaded, comment posted
- Real-time updates with subtle animations
- Tap any activity to go to the source (spot, profile, event)
- "This day last year" memories
- Weekly digest notification: "This week in the SpotHitch community"
- Filter by activity type
- Mute specific users from your timeline

**Wireframe**:
```
+------------------------------------------+
|  [All]    [Friends]    [Milestones]      |
|------------------------------------------|
|                                          |
| NOW                                      |
| o  @Marie reviewed a spot in Zagreb      |
|    "Great spot, got a ride in 5 min"     |
|    [star star star star star]            |
|                                          |
| 1 HOUR AGO                              |
| o  @Pedro completed Paris -> Berlin      |
|    890 km | 3 rides | 12 hours           |
|    [congrats! 8 reactions]               |
|                                          |
| 3 HOURS AGO                             |
| o  New event near you: "Hitchhiker       |
|    meetup in Ljubljana" - Jun 20         |
|    [View event ->]                       |
|                                          |
| YESTERDAY                                |
| o  @Tom uploaded 3 photos from Norway    |
|    [photo] [photo] [photo]               |
|                                          |
| o  @Ana earned "10 Countries" badge      |
|    [Congratulate ->]                     |
|                                          |
+------------------------------------------+
```

---

## 11. Group Trip Planner

**Description**: A dedicated collaborative trip planning space. Groups of travelers plan routes together in real-time -- adding waypoints, voting on destinations, assigning who carries what gear, and sharing a live itinerary. Think Google Docs meets trip planning.

**Tabs/Sections**:
- My Trips (active group trips)
- Invitations (trip invites from others)
- Create Trip

**Key Features**:
- Shared interactive map with collaborative waypoint adding
- Day-by-day itinerary editable by all members
- Voting system for undecided stops ("Budapest or Vienna? Vote!")
- Packing checklist (assign items to people: "Pedro brings tent")
- Budget tracker (shared expenses, who owes whom)
- Trip chat integrated directly in each trip
- Auto-suggest spots along the group's planned route
- Export itinerary as PDF or share link with non-users
- "Currently" indicator: see where each group member is on the route

**Wireframe**:
```
+------------------------------------------+
|  [My Trips (2)]  [Invites (1)]  [+ New] |
|------------------------------------------|
|                                          |
| ACTIVE: Summer Balkans Trip              |
| 4 members | Jun 15 - Jul 10              |
| +--------------------------------------+ |
| | [MAP with shared waypoints]          | |
| | Lyon > Zagreb > Split > Dubrovnik    | |
| +--------------------------------------+ |
| | Day 5: Zagreb                        | |
| | - Hostel Chillout (booked)           | |
| | - Visit old town                     | |
| | - [Vote] Beach or mountains?         | |
| |   Beach: 3 votes | Mountains: 1     | |
| +--------------------------------------+ |
| | Packing:                             | |
| | [x] Tent (Pedro)                     | |
| | [x] Stove (Marie)                    | |
| | [ ] First aid (unassigned)           | |
| +--------------------------------------+ |
| | [Chat: 5 new messages]              | |
| +--------------------------------------+ |
|                                          |
| PLANNED: Portugal Coast                  |
| 2 members | Aug 1 - Aug 15              |
| [Open ->]                               |
+------------------------------------------+
```

---

## 12. Stories and Reels

**Description**: Ephemeral stories (24-hour lifespan) inspired by Instagram/Snapchat Stories. Hitchhikers share quick moments from the road -- a beautiful view, a funny sign, the car they just got into, their waiting spot. Short-form, visual, and spontaneous.

**Tabs/Sections**:
- Stories bar (horizontal scroll of friend avatars at top)
- Feed (persistent posts below)
- My Story (manage your current story)

**Key Features**:
- Photo or 15-second video stories that disappear after 24 hours
- Location sticker auto-added (country flag + city name)
- "On the road" animated sticker
- Story reactions: send emoji or quick text reply
- Story highlights: save your best stories to your profile permanently
- "Route story" mode: chain multiple stories into a trip montage
- View count visible to creator only (no public metrics, less pressure)
- Low-bandwidth mode: auto-compress photos/videos on slow connections

**Wireframe**:
```
+------------------------------------------+
|  [your] [Marie] [Pedro] [Tom] [Ana] ... |
|  story   story   story  story  story     |
|  [+]     (ring)  (ring)        (ring)    |
|------------------------------------------|
|                                          |
| +--------------------------------------+ |
| |                                      | |
| |  [FULL-SCREEN STORY VIEWER]          | |
| |                                      | |
| |  @Marie's story                      | |
| |                                      | |
| |  [PHOTO: highway exit at sunrise]    | |
| |                                      | |
| |  Location: E65, Croatia              | |
| |                                      | |
| |  "Day 3 begins!"                     | |
| |                                      | |
| |  ----progress bar----                | |
| |                                      | |
| +--------------------------------------+ |
|                                          |
| [React with emoji]  [Reply...]          |
|                                          |
+------------------------------------------+
```

---

## 13. Radio / Voice Channels

**Description**: Discord-style voice channels where hitchhikers can drop in and talk while on the road. Especially useful for long waits at highway entrances -- join a voice room and chat with other travelers who are also waiting. Low-bandwidth, hands-free (important when thumbing).

**Tabs/Sections**:
- Voice Rooms (list of active channels)
- Text Chat (traditional messaging, secondary)
- Schedule (planned voice events/hangouts)

**Key Features**:
- Always-on voice rooms by region (Europe, Asia, Americas...) and topic (General, Help, Stories)
- Push-to-talk or voice-activation modes
- Listener count shown for each room
- "Quiet mode" -- listen without speaking
- Scheduled voice events: "Friday night hitchhiker hangout 8pm CET"
- Low bandwidth: opus codec, works on 2G/3G
- Transcription for hearing-impaired users
- "Road radio" -- a curated playlist of hitchhiker stories played back in audio form

**Wireframe**:
```
+------------------------------------------+
|  [Voice Rooms]   [Text]   [Schedule]     |
|------------------------------------------|
|                                          |
| LIVE NOW                                 |
|                                          |
| General Hangout          12 listening    |
| [speaker] Marie, Pedro, Tom             |
| [Join ->]                                |
|                                          |
| Europe Chat               5 listening    |
| [speaker] Ana, Lucas                    |
| [Join ->]                                |
|                                          |
| Story Time                8 listening    |
| [speaker] @Pedro is telling a story     |
| [Join ->]                                |
|                                          |
|------------------------------------------|
| SCHEDULED                                |
|                                          |
| Friday Night Hangout                     |
| Jun 20, 8pm CET | 14 interested         |
| [Set reminder]                           |
|                                          |
| "Tips for Eastern Europe" Q&A           |
| Jun 22, 6pm CET | 23 interested         |
| [Set reminder]                           |
|                                          |
+------------------------------------------+
| [Currently in: General]  [Mic] [Leave]   |
+------------------------------------------+
```

---

## 14. Hitchhiker Wiki

**Description**: A collaborative, Wikipedia-style knowledge base written and maintained by the community. Instead of ephemeral social content, this builds lasting value. Each route, city, border crossing, and technique gets its own editable page. The Social tab becomes a tool for collective intelligence.

**Tabs/Sections**:
- Browse (categories + search)
- Recent Edits (latest community contributions)
- My Contributions

**Key Features**:
- Pages for: cities, routes, border crossings, techniques, gear, laws by country
- Anyone can edit (with revision history and rollback)
- Quality score per page (based on completeness, recency, votes)
- "Needs update" flag for stale information
- Discussion tab on each page for debate
- "Quick contribution" prompts: "You were in Zagreb. Any tips to add?"
- Offline reading mode: download pages for offline access
- Integration with spots: each spot can link to relevant wiki pages

**Wireframe**:
```
+------------------------------------------+
|  [Browse]    [Recent Edits]   [Mine]     |
|------------------------------------------|
| [Search wiki...]                         |
|------------------------------------------|
|                                          |
| CATEGORIES                               |
| [map] Routes (234 pages)                |
| [city] Cities (512 pages)               |
| [border] Border Crossings (89 pages)    |
| [book] Techniques (45 pages)            |
| [gear] Gear Reviews (67 pages)          |
| [law] Laws by Country (52 pages)        |
|                                          |
|------------------------------------------|
| POPULAR PAGES                            |
|                                          |
| "Paris to Berlin - Complete Guide"       |
|   Updated 2 days ago | Quality: 95%     |
|                                          |
| "Hitching out of London"                 |
|   Updated 1 week ago | Quality: 88%     |
|                                          |
| "Balkans Border Crossings"              |
|   Updated 3 days ago | Quality: 92%     |
|                                          |
| NEEDS YOUR HELP                          |
| "Lyon exit spots" - last updated 6mo    |
| "Turkey visa info" - flagged outdated   |
+------------------------------------------+
```

---

## 15. Reputation and Trust Network

**Description**: A social tab focused on building and displaying trust within the community. Hitchhiking requires trusting strangers, and this design makes trust visible and verifiable. Users build reputation through verified trips, reviews from travel companions, and community endorsements.

**Tabs/Sections**:
- My Trust Profile (your trust score and verifications)
- Reviews (received and given)
- Verify (verify your identity, phone, social accounts)

**Key Features**:
- Trust score (0-100) built from: verified identity, travel history, companion reviews, community reports
- Companion reviews: after traveling together, rate your companion (safe, punctual, good company)
- Verification levels: email, phone, government ID, social media links
- "Vouch" system: trusted users can vouch for others
- Trust badges displayed on profiles everywhere in the app
- "Safe to travel with" indicator visible in companion matching
- Transparency: anyone can see how the score was calculated
- Penalty system for false reports or bad behavior

**Wireframe**:
```
+------------------------------------------+
|  [My Trust]    [Reviews]    [Verify]     |
|------------------------------------------|
|                                          |
|         [Avatar]                         |
|         Marie L.                         |
|     Trust Score: 87 / 100               |
|    [===================    ]             |
|                                          |
| VERIFICATIONS                            |
| [x] Email verified                      |
| [x] Phone verified                      |
| [x] Government ID                       |
| [ ] Social media linked (0/3)           |
| [-> Complete verification]              |
|                                          |
| STATS                                    |
| Trips completed:     23                  |
| Companions traveled:  8                  |
| Avg companion rating: 4.8/5             |
| Community vouches:    12                 |
| Reports received:     0                  |
|                                          |
|------------------------------------------|
| RECENT REVIEWS                           |
| @Pedro: "Marie is great to travel with.  |
|  Always punctual, positive attitude."    |
|  [5 stars] - Jun 10                      |
|                                          |
| @Tom: "Safe and reliable companion."     |
|  [4 stars] - May 28                      |
+------------------------------------------+
```

---

## 16. Ride Board

**Description**: A classified-ads style board specifically for ride offers and requests. Unlike the existing companion search, this is more structured and visible -- like a digital version of the corkboard at a hostel. Drivers who want to pick up hitchhikers can also post here.

**Tabs/Sections**:
- Rides Offered (drivers offering seats)
- Rides Wanted (hitchhikers looking for rides)
- My Posts

**Key Features**:
- Structured post format: departure city, destination, date, time, number of seats, vehicle type
- "Instant match" notification when a new offer matches your request
- Map view showing all current ride offers/requests
- Verified driver profiles (license plate, photo of car)
- Price: always free (this is hitchhiking, not BlaBlaCar), but "coffee money" or gas share optional
- Expiry: posts auto-expire after the departure date passes
- One-tap "I'm interested" + automatic chat creation
- Filter by date, route, flexibility (exact vs. "anywhere south")

**Wireframe**:
```
+------------------------------------------+
|  [Offered (8)]  [Wanted (15)]  [My (1)]  |
|------------------------------------------|
| [map] Map View | [filter] Filters        |
|------------------------------------------|
|                                          |
| RIDES OFFERED                            |
|                                          |
| +--------------------------------------+ |
| | [car icon] Lyon -> Marseille         | |
| | Tomorrow 8:00 | 2 seats | VW Golf    | |
| | @Driver_Jean | Trust: 72             | |
| | [I'm interested!]                    | |
| +--------------------------------------+ |
|                                          |
| +--------------------------------------+ |
| | [car icon] Berlin -> Prague          | |
| | Jun 22 14:00 | 3 seats | Van         | |
| | @Local_Hans | Trust: 85              | |
| | [I'm interested!]                    | |
| +--------------------------------------+ |
|                                          |
| +--------------------------------------+ |
| | [car icon] Zagreb -> Split           | |
| | Today 16:00 | 1 seat | Peugeot      | |
| | @Ana_CRO | Trust: 91                | |
| | [I'm interested!]                    | |
| +--------------------------------------+ |
|                                          |
| [FAB: + Post Ride / Request]             |
+------------------------------------------+
```

---

## 17. Campfire

**Description**: Themed async discussion spaces inspired by Basecamp's "Campfire" concept. Each campfire is a slow-paced, topic-focused conversation space -- not real-time chat, but more like a shared journal. Designed for deeper discussions than chat allows, but less formal than a forum.

**Tabs/Sections**:
- Active Campfires (ongoing discussions)
- Archive (past campfires)
- Start a Campfire

**Key Features**:
- Time-boxed discussions: each campfire runs for 1 week, then auto-archives
- Themes: "Solo female safety tips", "Best spots in Portugal", "Budget gear recommendations"
- Max 30 participants per campfire (intimate, not noisy)
- One post per person per day (forces thoughtful contributions)
- No likes or upvotes -- everyone's voice is equal
- Host can pose daily questions or prompts
- Summary generated at the end of the week
- Notification: one daily digest, not per-message

**Wireframe**:
```
+------------------------------------------+
|  [Active (5)]    [Archive]    [+ New]    |
|------------------------------------------|
|                                          |
| THIS WEEK'S CAMPFIRES                    |
|                                          |
| +--------------------------------------+ |
| | [fire] Balkans Route Planning        | |
| | Day 4/7 | 18 participants            | |
| | Today's question: "Best border       | |
| | crossing Serbia -> Bulgaria?"        | |
| | [12 responses today]                 | |
| | [Enter campfire ->]                  | |
| +--------------------------------------+ |
|                                          |
| +--------------------------------------+ |
| | [fire] Budget Gear Exchange          | |
| | Day 2/7 | 24 participants            | |
| | Today: "What's your sleep system?"   | |
| | [8 responses today]                  | |
| | [Enter campfire ->]                  | |
| +--------------------------------------+ |
|                                          |
| +--------------------------------------+ |
| | [fire] First Time Hitchhiker Q&A    | |
| | Day 6/7 | 30 participants (full)     | |
| | Today: "How do you deal with fear?"  | |
| | [22 responses today]                 | |
| | [Enter campfire ->]                  | |
| +--------------------------------------+ |
|                                          |
+------------------------------------------+
```

---

## 18. Proximity Radar

**Description**: A minimalist radar-style interface that shows other hitchhikers around you in real-time, organized by distance rings. Think of it as a hitchhiker-specific "people nearby" feature. Ultra-simple, focused on one thing: connecting you with other travelers in your immediate area.

**Tabs/Sections**:
- Radar (visual proximity display)
- Messages (conversations with nearby people)

**Key Features**:
- Visual radar with concentric rings (1 km, 5 km, 25 km, 100 km)
- Avatars appear as dots on the radar at their approximate position
- Tap a dot to see profile summary + send a quick "wave" or message
- "Wave" gesture: a no-commitment way to say "hey I'm here too"
- Status broadcast: "Waiting at E65 exit", "Looking for companion to Split"
- Completely anonymous by default -- no real name shown until you choose to reveal
- Auto-disables when you leave hitchhiking mode
- Extremely battery-efficient (Bluetooth LE for ultra-nearby, GPS for wider range)

**Wireframe**:
```
+------------------------------------------+
|  [Radar]              [Messages (2)]     |
|------------------------------------------|
|                                          |
|           Proximity Radar                |
|                                          |
|              100 km                      |
|         ___________________              |
|        /    25 km          \             |
|       /   ___________      \            |
|      /   /   5 km    \     \            |
|     /   /  _______    \     \           |
|    |   |  / 1 km  \   |     |           |
|    |   | |  [YOU]  |   |     |           |
|    |   | | @dot    |   |     |           |
|    |   |  \_______/    |     |           |
|    |   |   @dot @dot   |     |           |
|     \   \___________/  /     |           |
|      \      @dot      /      |           |
|       \_______________/      |           |
|        \          @dot/      |           |
|         \_________________/  |           |
|                              |           |
|------------------------------------------|
| 5 hitchhikers nearby                    |
| [Wave to all]                            |
|------------------------------------------|
| @Marie (1.2km) "Heading to Split"       |
| @??? (4.8km) - anonymous                |
| @Pedro (12km) - waved at you!           |
+------------------------------------------+
```

---

## 19. Mentorship Network

**Description**: A social design that pairs experienced hitchhikers with beginners. Experienced travelers ("Mentors") volunteer to guide newcomers through their first trips via chat, shared routes, and live check-ins. This addresses the biggest barrier to hitchhiking: fear of the unknown.

**Tabs/Sections**:
- Find a Mentor (for beginners)
- My Mentees (for experienced users)
- Resources (curated beginner guides)

**Key Features**:
- Mentor profiles: countries traveled, years of experience, languages, specialties (solo female, winter hitching, with pets, etc.)
- Mentee can request a mentor for a specific trip or general guidance
- Structured mentorship: pre-trip prep checklist, during-trip check-ins, post-trip debrief
- Mentor badges and recognition (community karma)
- Group mentorship: one mentor + up to 3 mentees for a first trip together
- Video/voice call scheduling within the app
- Curated "First Trip Toolkit" with checklists and tips
- Mentor rating system (so the best mentors are visible)

**Wireframe**:
```
+------------------------------------------+
|  [Find Mentor]   [My Mentees]  [Guides]  |
|------------------------------------------|
|                                          |
| I WANT A MENTOR FOR...                   |
| [My first ever trip            v]        |
|                                          |
| RECOMMENDED MENTORS                      |
|                                          |
| +--------------------------------------+ |
| | [photo] Sarah K.                     | |
| | Mentor since 2022 | 45,000 km        | |
| | Specialty: Solo female travel        | |
| | Languages: EN, DE, FR               | |
| | Rating: 4.9/5 (23 mentees)          | |
| | "Happy to help first-timers feel    | |
| |  safe and confident on the road."   | |
| | [Request mentorship]                | |
| +--------------------------------------+ |
|                                          |
| +--------------------------------------+ |
| | [photo] Marco P.                     | |
| | Mentor since 2021 | 60,000 km        | |
| | Specialty: Eastern Europe routes     | |
| | Languages: EN, IT, RO               | |
| | Rating: 4.7/5 (31 mentees)          | |
| | [Request mentorship]                | |
| +--------------------------------------+ |
|                                          |
| ACTIVE MENTORSHIP                        |
| You + Sarah K.                           |
| Trip: Lyon -> Barcelona (Jun 25)        |
| Status: Pre-trip checklist (4/7 done)   |
| [Open checklist ->]                      |
+------------------------------------------+
```

---

## 20. Hybrid Hub

**Description**: A best-of combination design that takes the single strongest element from several proposals above and combines them into a cohesive Social experience with 4 main sections. This is the pragmatic "if we could only build one" option, designed for maximum value with reasonable complexity.

**Tabs/Sections**:
- Feed (from Proposal #2 + #10: social feed with activity timeline)
- Chat (from Proposal #1: streamlined unified inbox)
- Nearby (from Proposal #8 + #18: local board + proximity)
- Safety (from Proposal #7: safety dashboard, always accessible)

**Key Features**:
- **Feed**: Scrollable mix of friend updates, spot reviews, trip completions, and community highlights. Simple post creation (text + optional photo + location tag).
- **Chat**: Unified conversation list (DMs, group chats, zone rooms). Voice messages. Read receipts.
- **Nearby**: Location-aware bulletin board + simple radar showing other travelers within 25 km. Post notices, find companions, see who else is around.
- **Safety**: Trusted contacts, SOS button, check-in timer, ride logging. Always 1 tap away.
- Cross-cutting: Every user card anywhere in the app shows trust badge. Companion search accessible from Nearby. Events integrated into Feed.

**Wireframe**:
```
+------------------------------------------+
| [Feed]  [Chat (3)]  [Nearby]  [Safety]  |
|------------------------------------------|
|                                          |
| === FEED TAB ===                         |
|                                          |
| +--------------------------------------+ |
| | @Marie completed Lyon -> Zagreb      | |
| | 890 km | 4 rides | 2 days            | |
| | [photo] [photo]                      | |
| | [heart 23] [comment 5]              | |
| +--------------------------------------+ |
|                                          |
| +--------------------------------------+ |
| | @Pedro reviewed spot #4521           | |
| | "Best spot near Budapest"            | |
| | [star x 5]                           | |
| | [heart 8]                            | |
| +--------------------------------------+ |
|                                          |
| +--------------------------------------+ |
| | EVENT: Hitchhiker meetup Ljubljana   | |
| | Jun 20 | 14 going                    | |
| | [Join ->]                            | |
| +--------------------------------------+ |
|                                          |
| [FAB: + Post]                            |
|                                          |
|==========================================|
|                                          |
| === CHAT TAB ===                         |
|                                          |
| [Search conversations...]               |
| Marie L.             "See you there" 10m |
| Europe Zone          Pedro: "Nice!" 1h   |
| Balkans Trip Group   3 new msgs    2h    |
| Tom R.               "Safe!" yesterday   |
|                                          |
|==========================================|
|                                          |
| === NEARBY TAB ===                       |
|                                          |
| Your location: Zagreb, Croatia           |
| 3 travelers nearby                       |
|                                          |
| [Radar view: 3 dots around you]         |
|                                          |
| LOCAL BOARD (8 notices)                  |
| "Companion to Split?" - @Marie 0.5km    |
| "Ride to Budapest 8am" - @Jean 2km      |
| "Great cafe w/ wifi" - @Ana 0.3km       |
|                                          |
|==========================================|
|                                          |
| === SAFETY TAB ===                       |
|                                          |
| Status: Safe & idle                      |
| Trusted contacts: Marie, Mom, Pedro      |
|                                          |
| [!!! SOS ALERT !!!]  [Log Ride]         |
| [Share Live Trip]     [Check-in Timer]   |
|                                          |
| Alerts near you: 0                       |
+------------------------------------------+
```

---

## Comparison Matrix

| # | Proposal | Complexity | Safety Focus | Social Depth | Unique Value | Offline Support |
|---|----------|------------|-------------|-------------|-------------|----------------|
| 1 | Streamlined Messenger | Low | Low | Medium | Reliability | High |
| 2 | Social Feed | Medium | Low | High | Inspiration | Medium |
| 3 | Live Map Social | High | High | Medium | Real-time awareness | Low |
| 4 | Travel Diary | Medium | Low | Medium | Personal memories | High |
| 5 | Travel Partner Matching | Medium | Medium | Medium | Companion discovery | Medium |
| 6 | Forum / Community Boards | Medium | Medium | High | Persistent knowledge | High |
| 7 | Safety Network Hub | Medium | Very High | Low | Peace of mind | Medium |
| 8 | Local Bulletin Board | Low | Low | Medium | Hyperlocal relevance | Medium |
| 9 | Photo Gallery | Medium | Low | Medium | Visual inspiration | High |
| 10 | Activity Timeline | Low | Low | Medium | Passive engagement | High |
| 11 | Group Trip Planner | High | Medium | High | Collaborative planning | Medium |
| 12 | Stories & Reels | Medium | Low | High | Real-time sharing | Low |
| 13 | Radio / Voice Channels | High | Low | High | Hands-free social | Low |
| 14 | Hitchhiker Wiki | Medium | Medium | Medium | Lasting knowledge base | High |
| 15 | Reputation & Trust | Medium | Very High | Medium | Trust visibility | High |
| 16 | Ride Board | Low | Medium | Low | Practical ride matching | High |
| 17 | Campfire | Low | Low | High | Deep discussions | High |
| 18 | Proximity Radar | Medium | Medium | Low | Instant nearby discovery | Low |
| 19 | Mentorship Network | Medium | High | High | Beginner onboarding | Medium |
| 20 | Hybrid Hub | High | High | High | Best-of-all | Medium |

---

## Recommendations

Based on what hitchhikers actually need most:

**If you can only pick one**: Proposal **#20 (Hybrid Hub)** gives the most value by combining Feed + Chat + Nearby + Safety into a cohesive experience.

**If you want to start simple and iterate**: Start with **#1 (Streamlined Messenger)** as the foundation, then layer on **#8 (Local Bulletin Board)** for the nearby features, and **#7 (Safety Network Hub)** as a permanent safety panel.

**If you want to differentiate from all other apps**: **#19 (Mentorship Network)** is something no hitchhiking app has done, and it directly addresses the number-one barrier to hitchhiking (fear/inexperience). Combined with **#15 (Reputation & Trust)**, this would make SpotHitch the safest hitchhiking platform in the world.

**If you want maximum engagement**: **#2 (Social Feed)** + **#12 (Stories)** create a content flywheel that keeps users coming back even when they are not traveling. But beware: this can drift away from the core utility of the app.

**The features that should exist regardless of which design you choose**:
1. SOS / emergency alert (from #7)
2. Trusted contacts + check-in timer (from #7)
3. Some form of trust/reputation display (from #15)
4. Companion search / ride board (from #5 or #16)
5. Offline message queue (from #1)
