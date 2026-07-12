<!--
 * -------------------------------------------------------
 * File: folder-structure.md
 * Purpose: Project folder structure documentation.
 * Module: Documentation
 *
 * Description: Documents the base AssetFlow React project structure.
 *
 * TODO: Keep this structure updated as the application grows.
 * -------------------------------------------------------
 -->

# AssetFlow Folder Structure

```text
src/
├── components/                # Reusable UI elements (cards, tables, modals)
│   ├── cards/
│   │   └── Card.jsx
│   ├── forms/
│   │   ├── Button.jsx
│   │   └── Input.jsx
│   ├── tables/
│   │   └── Table.jsx
│   └── modals/
│       └── Modal.jsx
│   └── Loader.jsx
├── layouts/                   # Layouts (Sidebar, Navbar, ProtectedLayout)
│   ├── Sidebar.jsx
│   ├── Navbar.jsx
│   ├── ProtectedLayout.jsx
│   ├── ProtectedRoute.jsx
│   └── PageHeader.jsx
├── pages/                     # Page-specific logic
│   ├── auth/
│   │   ├── Login.jsx
│   │   ├── Signup.jsx
│   │   └── ForgotPassword.jsx
│   ├── dashboard/
│   │   └── Dashboard.jsx
│   ├── organization/
│   │   └── Organization.jsx
│   ├── assets/
│   │   ├── Assets.jsx
│   │   ├── AssetDetails.jsx
│   │   └── RegisterAsset.jsx
│   ├── allocation/
│   │   └── Allocation.jsx
│   ├── booking/
│   │   └── Booking.jsx
│   ├── maintenance/
│   │   └── Maintenance.jsx
│   ├── reports/
│   │   └── Reports.jsx
│   ├── notifications/
│   │   └── Notifications.jsx
│   ├── profile/
│   │   └── Profile.jsx
│   ├── Splash.jsx
│   └── NotFound.jsx
├── services/                  # Firebase services (auth, firestore)
│   ├── authService.jsx
│   └── firestoreService.jsx
├── hooks/                     # Custom React hooks for logic (e.g., useAuth, useAssets)
│   ├── useAuth.js
│   └── useAssets.js
├── utils/                     # Utility functions (formatDate, formatCurrency)
│   ├── formatDate.js
│   ├── formatCurrency.js
│   ├── helpers.js
│   └── validators.js
├── types/                     # TypeScript type definitions
│   └── index.ts
├── contexts/                  # Global state management (e.g., AuthContext)
│   └── auth-context.jsx
└── App.jsx                    # Main app component
└── main.jsx                   # Entry point for Vite
```

