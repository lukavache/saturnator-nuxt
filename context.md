# Saturnator — Web Platform Specification

## 🪐 Project Overview
**Saturnator** is an online music label platform inspired by Bandcamp, focusing on hosting, sharing, and promoting music from independent artists. The platform allows listeners to explore and filter music, while registered artists can submit tracks for approval. Admins manage the platform through a secure admin panel.

---

## 🧱 Technology Stack

| Layer       | Stack                     | Purpose                        |
|------------|---------------------------|--------------------------------|
| Frontend    | Nuxt 3 + Tailwind CSS      | User Interface and Experience  |
| Backend     | Strapi (Node.js)           | Content Management, User Roles, File Uploads |
| Optional API Layer | Node.js (Express)   | Advanced Data Logic (Optional) |
| Database    | PostgreSQL (via Strapi)    | Data Storage                   |
| Hosting     | Vercel (Frontend), Render/DigitalOcean (Strapi) | Deployment                     |

---

## 🚀 Website User Flow

### 1. **Home / Library Page (`/`)**
- Displays **list of tracks/samples**.
- Supports **filters**:
  - Artist
  - Genre
  - BPM
  - Track Type (Sample / Track / Album)
- List items display:
  - Cover Art / Waveform Preview (optional)
  - Artist Name
  - Track Title
  - Genre Tags
  - BPM Info
- Pagination or Lazy Loading
- Clicking on a track opens **track detail page**.

### 2. **Track Detail Page (`/track/:slug`)**
- Displays:
  - Audio Player (Stream)
  - Full Track Info (Artist, Genre, BPM, Description)
  - Cover Art
- If track is **not approved**, it remains **hidden** to public users.

### 3. **Registration & Login (`/register`, `/login`)**
- Email + Password based authentication (Strapi Users & Permissions Plugin)
- User Roles:
  - Public (Guest)
  - Registered User (Can submit tracks)
  - Admin (Can approve/reject/manage users and content)

### 4. **Upload Page (`/upload`)**
- **Form for Registered Users**:
  - Track Title
  - Description
  - Artist Name (or link to their artist profile if already exists)
  - Genre (Multi-select)
  - BPM (Numeric Input)
  - File Upload (Audio file + Cover Art)
- Submission goes to **pending state**.
- Admin reviews submissions in Admin Panel.

### 5. **Language Switcher**
- Located in the site header.
- **Language Codes:**
  - `ka` for Georgian
  - `en` for English
- Switches content localization.
- User preference can be saved in cookies/local storage.

---

## 🛠️ Admin Panel (Strapi)

### Admin Roles & Permissions
- **View and Manage Users**
- **Review Track Submissions**
  - Approve / Reject / Edit Track Info
- **Manage Artist Profiles**
- **Manage Genres**
- **Manage Site Content** (About page, Policies, etc.)

### Admin Features
- Dashboard Overview (Pending Approvals, New Users)
- Content Management Sections:
  - **Tracks**
  - **Artists**
  - **Users**
  - **Genres**
  - **Site Content**

---

## 🗄️ Data Models

### 1. **User**
- `username`
- `email`
- `password`
- `role` (public, user, admin)

### 2. **Track**
- `title`
- `description`
- `artist` (relation to Artist)
- `genre` (relation to Genre)
- `bpm`
- `audio_file` (upload)
- `cover_image` (upload)
- `status` (pending, approved, rejected)

### 3. **Artist**
- `name`
- `bio`
- `social_links`
- `profile_image` (optional)

### 4. **Genre**
- `name`

---

## 🌐 Routes Overview

| Route              | Purpose                                     |
|--------------------|---------------------------------------------|
| `/`                | Music Library (with filters)                |
| `/track/:slug`     | Track Detail Page                           |
| `/register`        | User Registration                           |
| `/login`           | User Login                                  |
| `/upload`          | Track Upload Form (Authenticated Users)     |
| `/admin`           | Strapi Admin Panel (Admins Only)            |

---

## 🧩 Optional Features (Phase 2)
- **User Profile Pages**
- **Playlist or Cart System**
- **Email Notifications on Approval**
- **Live Player / Radio Stream**
- **Event Announcements**
- **Merchandise Store**

---

## 📝 Final Notes
- Use Strapi’s REST or GraphQL API for all data fetching in Nuxt.
- Ensure all **file uploads** (tracks, images) are properly handled by Strapi’s media library.
- Role-based permissions must restrict:
  - **Public access to approved tracks only**
  - **Submission access to registered users only**
  - **Management access to admins only**

---
