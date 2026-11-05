<div align="center">

# 🎬 PulseStream — Frontend

**A cinematic, Netflix-inspired streaming platform built with React + Vite**

[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white&style=flat-square)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white&style=flat-square)](https://vitejs.dev/)
[![Redux Toolkit](https://img.shields.io/badge/Redux_Toolkit-764ABC?logo=redux&logoColor=white&style=flat-square)](https://redux-toolkit.js.org/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3-06B6D4?logo=tailwindcss&logoColor=white&style=flat-square)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)

[Live Demo](https://pulsestream-frontend.vercel.app) · [Backend Repo](https://github.com/yourusername/pulsestream-backend) · [Report Bug](https://github.com/yourusername/PulseStreamFrontend/issues)

</div>

---

## ✨ Overview

PulseStream is a **full-stack streaming platform** with a rich, dark-themed UI that rivals modern OTT experiences. The frontend delivers a seamless, cinema-grade interface — complete with animated hero banners, HLS video playback, real-time watchlists, Google OAuth, and subscription management powered by Razorpay.

> This repository contains the **React + Vite frontend**. The Spring Boot backend lives [here](https://github.com/yourusername/pulsestream-backend).

---

## 🚀 Features

### 🎥 Streaming & Content
- **HLS Video Playback** — adaptive bitrate streaming via Azure Blob Storage
- **Custom Video Player** — built with HLS.js, supporting quality switching
- **Cinematic Hero Banner** — auto-cycling crossfade with Ken Burns effect
- **Rich Content Grid** — movies, TV shows, series seasons & episodes

### 🔐 Authentication
- **JWT-based login/signup** with email OTP verification
- **Google OAuth 2.0** via Spring Security's OAuth2 flow
- **Secure token handling** — automatic expiry detection on startup, no redirect loops
- **Forgot password** — OTP-based reset flow

### 👤 User Experience
- **Personal Watchlist** — add/remove with optimistic UI updates
- **Continue Watching** — resume from where you left off
- **Search** — instant fuzzy search with dropdown suggestions
- **Responsive Design** — pixel-perfect on mobile, tablet, and desktop

### 💳 Subscriptions
- **Razorpay Integration** — subscription tiers with in-app payment flow
- **Plan Management** — upgrade / downgrade with live status

### 🛡️ Admin Panel
- **Upload Movies & Series** — with poster, banner, and video
- **System Storage Monitor** — real-time storage stats
- **Role-based Access Control** — admin-only routes guarded on both frontend and backend

---

## 🏗️ Tech Stack

| Layer | Technology |
|---|---|
| **UI Framework** | React 18 (Vite) |
| **Styling** | Tailwind CSS v3 + Custom CSS animations |
| **State Management** | Redux Toolkit + Redux Thunk |
| **HTTP Client** | Axios (with request/response interceptors) |
| **Video** | HLS.js |
| **Auth** | JWT + Google OAuth 2.0 |
| **Payments** | Razorpay Web SDK |
| **Notifications** | React Hot Toast |
| **Icons** | React Icons (FA) |

---

## 🗂️ Project Structure

```
src/
├── api/
│   └── axiosConfig.js       # Centralized Axios instance + interceptors
├── Components/
│   ├── browse/              # Movie rows, cards
│   ├── common/              # Navbar, Modal, Footer, Toaster
│   ├── layout/              # GlassNavbar, PrivateRoute
│   └── video/               # HLS player (PulsePlayer)
├── pages/
│   ├── Auth.jsx             # Login / Signup / Forgot Password
│   ├── Home.jsx             # Landing page + hero + content rows
│   ├── Watch.jsx            # Video watch page
│   ├── Profile.jsx          # User profile
│   ├── Subscription.jsx     # Razorpay subscription flow
│   ├── MyWatchlist.jsx      # Personal watchlist
│   ├── Content.jsx          # Browse all content
│   ├── SessionExpired.jsx   # Graceful session timeout page
│   └── OAuth2RedirectHandler.jsx
├── store/
│   ├── slices/
│   │   ├── authSlice.js     # JWT rehydration + expiry check
│   │   ├── contentSlice.js  # Movies / series state
│   │   └── watchlistSlice.js
│   └── actions/
│       └── authActions.js   # Login, signup, OTP, forgot-password
└── App.jsx                  # Global session-expiry listener + routing
```

---

## ⚡ Getting Started

### Prerequisites
- Node.js >= 18
- A running instance of the [PulseStream backend](https://github.com/yourusername/pulsestream-backend) (Spring Boot)

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/PulseStreamFrontend.git
cd PulseStreamFrontend/pulsestream-frontend

# Install dependencies
npm install
```

### Environment Variables

Create a `.env` file in the project root:

```env
# Spring Boot backend URL
VITE_BACK_END_URL=http://localhost:8080

# Razorpay test key
VITE_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxx

# TMDB API key (for fallback images)
VITE_TMDB_API_KEY=your_tmdb_api_key
```

### Run in Development

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Build for Production

```bash
npm run build
```

---

## 🔒 Security Architecture

PulseStream implements multiple layers of client-side security:

| Concern | Implementation |
|---|---|
| **Expired JWT on startup** | `authSlice.js` decodes the JWT and checks the `exp` claim before trusting it. Stale tokens are wiped before the app renders. |
| **401 handling** | The Axios interceptor globally catches `401` responses from authenticated routes and fires a custom `auth:session-expired` DOM event. |
| **Session cleanup** | `App.jsx` listens for the event and dispatches `logout()` + `clearWatchlist()`, then navigates to the graceful `/session-expired` page. |
| **No infinite loops** | All `/auth/*` and `/oauth2` routes are excluded from the 401 interceptor — wrong credentials never trigger a fake "session expired". |
| **Token hygiene** | Token is stored in a structured `pulse_auth` key and never logged. The OAuth2 redirect handler immediately strips the token from the URL using `history.replaceState`. |

---

## 🌐 Deployment

The frontend is optimized for **Vercel** (recommended) or any static host.

```bash
npm run build   # outputs to /dist
npm run preview # test the production build locally
```

For Vercel: connect the repo, set the output directory to `dist`, and add your environment variables in the dashboard.

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'feat: add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

## 📄 License

Distributed under the MIT License. See [`LICENSE`](LICENSE) for more information.

---

<div align="center">

Made with ❤️ by **Vipul Choudhary**

⭐ Star this repo if you found it useful!

</div>
