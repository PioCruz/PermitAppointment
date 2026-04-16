<div align="center">
<img width="100" height="100" alt="Calendar Icon" src="public/favicon.svg" />

# Permit Appointment System

A modern calendar and permit management application built with React, TypeScript, and Firebase.

</div>

## Overview

**Permit Appointment System** is a collaborative schedule management platform that allows teams to manage events, request permits, and coordinate appointments. Perfect for teams that need to coordinate schedules and approve/schedule appointments based on permit requests.

## Features

### Calendar Views
- **Agenda View** - Sequential list of upcoming events
- **Day View** - Detailed hourly breakdown for a single day
- **Week View** - 7-day calendar overview
- **Month View** - Full month grid with event indicators
- **Year View** - Yearly overview of events

### Permit System
- **Request Permits** - Submit appointment requests to team members
- **Approve/Reject** - Accept or cancel permit requests
- **Schedule from Permits** - Create calendar events directly from permit requests
- **Track Status** - Monitor pending, accepted, and cancelled permits

### Team Management
- **Groups** - Organize teams and departments
- **Members** - Add team members with role-based access
- **Roles** - Admin or Member roles with appropriate permissions
- **Personal Events** - Toggle visibility of personal calendar events

### Customization
- **Dark/Light Mode** - Theme toggle for comfortable viewing
- **Category Filtering** - Filter events by category
- **12/24 Hour Format** - Choose your preferred time format
- **Search** - Find events by title or description

## Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Animation**: Motion (Framer Motion)
- **Calendar**: date-fns
- **Icons**: lucide-react
- **UI/Notifications**: Sonner (toast notifications)
- **Authentication**: Firebase Auth
- **Database**: Firebase Firestore
- **Build Tool**: Vite

## Getting Started

### Prerequisites
- Node.js (v16+)
- Firebase project with Firestore database
- Gemini API key (optional, for AI features)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/permit-appointment-system.git
   cd permit-appointment-system
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env.local` file in the root directory:
   ```
   VITE_FIREBASE_API_KEY=your_firebase_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   GEMINI_API_KEY=your_gemini_api_key
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

   The app will start at `http://localhost:3000`

## Usage

### Creating Events
1. Click "Add Event" in the header
2. Fill in event details (title, date, time, category)
3. Optionally assign to team members
4. Click "Create" to save

### Requesting Permits
1. Go to the "Permits" view
2. Click "Add Permit"
3. Select the team member to request from
4. Write your request and submit
5. Wait for approval or rejection

### Scheduling from Permits
1. View pending permits in "Permits" tab
2. Click "Schedule" on a permit
3. A new event will be created pre-filled with permit details
4. Adjust time and details as needed
5. Save to schedule the appointment

### Managing Team
1. Go to Settings
2. Select a group or create a new one
3. Add members by email
4. Assign roles (Admin or Member)
5. Admins can approve permits and manage members

## Project Structure

```
src/
├── components/        # React components (views, modals, popovers)
├── hooks/            # Custom React hooks
├── lib/              # Utility functions
├── types.ts          # TypeScript type definitions
├── firebase.ts       # Firebase configuration
├── App.tsx           # Main app component
└── main.tsx          # Entry point
```

## Building for Production

```bash
npm run build
```

The optimized build will be in the `dist/` directory.

## License

This project is provided as-is. Modify and use as needed.

---
