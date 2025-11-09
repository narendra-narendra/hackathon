#  Sweat Socks Society# Sweat Socks Society



*Find your crew. Track your progress. Stay motivated together.*Sweat Socks Society is a community hub for finding workout partners, planning events, sharing training stories, and curating recovery gear — all in one place.



Sweat Socks Society is a full-featured social fitness platform that connects athletes, runners, cyclists, and fitness enthusiasts. Built for communities who want to train together, share their journey, and stay accountable.Tech stack: Next.js (Pages Router) + TypeScript + Tailwind CSS (preconfigured)



---What’s included

- Authenticated dashboard with activity planner, connection suggestions, and previews for events, community feed, and gear picks

##  Features- Firebase-powered Events page for hosting and joining meetups

- Community feed for sharing session recaps and cheering teammates

###  Smart Dashboard- Curated gear shop with quick filters

- *Personalized activity feed* with real-time updates from your network- Shared components in components/ and utilities in utils/

- *Connection suggestions* based on shared location and interests- Tailwind CSS config and global styles with color-blind-friendly palette

- *Upcoming events preview* - never miss a group workout

- *Community highlights* - see what your crew is up toQuick start (macOS, zsh)

- *Gear recommendations* - curated picks from popular brands

1. Install dependencies:

###  Events & Meetups

- *Create and host* group workouts, runs, rides, and training sessionsbash

- **Join events** with one click - see who's attending# use npm or yarn — npm example

- **Smart filtering** - upcoming vs. past eventscd /Users/harshithreddy/Desktop/Project

- **Location integration** - Google Maps links for easy navigationnpm install

- **Real-time participant tracking** - know who's in before you commit



###  Community Feed2. Run development server:

- *Share training stories* with titles, activity types, and rich media

- *Photo uploads* - show off your PRs and scenic routesbash

- **Cheer system** - support your training partnersnpm run dev

- **Activity categorization** - Run, Ride, Swim, Strength, Yoga, Triathlon, and more

- *Real-time updates* - see posts as they happen

Open http://localhost:3000 in your browser.

###  Athlete Connections

- *Smart matching algorithm* - find partners by location and interestsNotes

- *Connection requests* - build your fitness network- Placeholder images are in public/ — replace with high-res photos for production.

- *Profile system* - showcase your level, goals, and favorite activities- Tailwind is preconfigured; run npx tailwindcss -i ./styles/globals.css -o ./public/output.css only if you need to build standalone CSS (not necessary when using Next.js dev server).

- *Search functionality* - find athletes by name or location

Next steps

###  Curated Gear Shop- Implement UI per the design (landing hero, auth flows, dashboard, profile). I can continue and implement the landing page UI next if you want.
- *Hand-picked equipment* from trusted brands
- *Recovery essentials* - compression gear, foam rollers, nutrition
- *Quick links* to official stores
- *Sidebar highlights* on the dashboard

###  Authentication & Security
- *Firebase Authentication* - secure login and registration
- *Protected routes* - authentication required for key features
- *User profiles* - customizable athlete pages

---

##  Tech Stack

| Category | Technology |
|----------|-----------|
| *Framework* | [Next.js 14](https://nextjs.org/) (Pages Router) |
| *Language* | [TypeScript](https://www.typescriptlang.org/) |
| *Styling* | [Tailwind CSS](https://tailwindcss.com/) |
| *Backend* | [Firebase](https://firebase.google.com/) (Firestore, Auth, Storage) |
| *Deployment* | Optimized for Vercel |

---

##  Project Structure


sweat-socks-society/
├── components/          # Reusable React components
│   ├── ActivityFeed.tsx      # Activity feed display
│   ├── ActivityForm.tsx      # Create new activities
│   ├── AthleteCard.tsx       # Athlete profile cards
│   ├── AuthForm.tsx          # Login/Register forms
│   ├── Comments.tsx          # Comment threads
│   ├── ConnectionRequests.tsx # Connection management
│   ├── Footer.tsx            # Site footer
│   ├── Header.tsx            # Navigation header
│   └── Hero.tsx              # Landing page hero
├── config/              # Configuration files
│   └── firebase.ts           # Firebase initialization
├── pages/               # Next.js pages (routes)
│   ├── _app.tsx              # App wrapper
│   ├── _document.tsx         # HTML document template
│   ├── index.tsx             # Landing page
│   ├── dashboard.tsx         # Main dashboard
│   ├── events.tsx            # Events page
│   ├── feed.tsx              # Community feed
│   ├── login.tsx             # Login page
│   ├── register.tsx          # Registration page
│   ├── profile.tsx           # User profile
│   ├── search.tsx            # Search athletes
│   ├── messages.tsx          # Direct messaging
│   └── shop.tsx              # Gear shop
├── utils/               # Utility functions
│   ├── connections.ts        # Connection management logic
│   ├── distance.ts           # Distance calculations
│   └── shopItems.ts          # Product catalog
├── styles/              # Global styles
│   └── globals.css           # Tailwind + custom CSS
├── public/              # Static assets
│   ├── avatar-placeholder.png
│   ├── hero.jpg
│   └── webpage.jpg
└── config files         # Various config files
    ├── next.config.js
    ├── tsconfig.json
    ├── tailwind.config.js
    └── postcss.config.js


---

##  Getting Started

### Prerequisites

- *Node.js* 18+ and npm
- *Firebase project* with Firestore, Authentication, and Storage enabled
- macOS, Linux, or Windows with WSL

### 1. Clone the Repository

bash
git clone https://github.com/narendra-narendra/hackathon.git
cd Sweat_Socks_Society


### 2. Install Dependencies

bash
npm install


### 3. Configure Firebase

Create a .env.local file in the root directory:

env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id


*Get your Firebase credentials:*
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project (or create a new one)
3. Go to Project Settings → General
4. Scroll to "Your apps" and select the web app
5. Copy the config values

### 4. Set Up Firebase Services

*Firestore Database:*
- Enable Firestore in your Firebase project
- Create these collections: users, events, communityPosts, connections, activities, chats

*Authentication:*
- Enable Email/Password authentication in Firebase Console

*Storage:*
- Enable Firebase Storage for image uploads
- Set up security rules for authenticated uploads

### 5. Run Development Server

bash
npm run dev


Open [http://localhost:3000](http://localhost:3000) to see your app.

### 6. Build for Production

bash
npm run build
npm start


---

##  Available Scripts

| Command | Description |
|---------|-------------|
| npm run dev | Start development server on port 3000 |
| npm run build | Build production-ready app |
| npm start | Start production server |
| npm run lint | Run ESLint for code quality |
| npm run clean | Clean cache and reinstall dependencies |
| npm run restart | Clean, install, and restart dev server |

---

##  Key Features Explained

### Dashboard Intelligence
The dashboard uses real-time Firestore queries to:
- Match you with athletes in your city/state who share your interests
- Calculate match scores based on location proximity and shared activities
- Display upcoming events you're attending or might be interested in
- Show recent posts from your connected athletes

### Smart Matching Algorithm
typescript
// Match scoring:
- Same city: +2 points
- Same state: +1 point
- Each shared interest: +1 point
- Results sorted by total score (highest first)


### Real-Time Updates
All major features use Firestore's onSnapshot for live updates:
- Connection requests appear instantly
- Event participants update in real-time
- Community feed posts show immediately
- Cheer counts update without page refresh

### Media Handling
- Image uploads to Firebase Storage
- Progress tracking during upload
- 10MB file size limit
- Support for JPG, PNG, GIF formats
- Automatic thumbnail generation (coming soon)

---

##  Firebase Data Structure

### Users Collection
typescript
{
  uid: string
  name: string
  email: string
  location: string // "City, State"
  interests: string[] // ["Running", "Cycling", etc.]
  level: string // "Beginner" | "Intermediate" | "Advanced"
  avatar: string | null
  bio?: string
}


### Events Collection
typescript
{
  id: string
  title: string
  date: string
  time: string
  location: string
  description: string
  distance: string
  eventDateTime: string // ISO format
  createdBy: string // user uid
  createdByName: string
  participants: string[] // array of user uids
  createdAt: Timestamp
}


### Community Posts Collection
typescript
{
  id: string
  title: string
  activityType: string
  content: string
  createdBy: string
  createdByName: string
  cheers: string[] // array of user uids who cheered
  mediaUrl?: string
  mediaType?: string
  mediaStoragePath?: string
  createdAt: Timestamp
}


### Connections Collection
typescript
{
  fromUserId: string
  toUserId: string
  status: "pending" | "connected" | "declined"
  createdAt: Timestamp
}


---

##  Roadmap

- [ ] Direct messaging between connected athletes
- [ ] Activity tracking integration (Strava, Garmin)
- [ ] Workout plan templates
- [ ] Achievement badges and streaks
- [ ] Group challenges and leaderboards
- [ ] Mobile app (React Native)
- [ ] Video upload support
- [ ] Advanced search filters
- [ ] Push notifications
- [ ] Calendar integration

---

##  Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (git checkout -b feature/amazing-feature)
3. Commit your changes (git commit -m 'Add amazing feature')
4. Push to the branch (git push origin feature/amazing-feature)
5. Open a Pull Request

---

##  License

This project is available for educational and non-commercial use.

---

## Team

Built by Sweat Socks Society team

---

##  Known Issues & Troubleshooting

### Port Already in Use
bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
npm run dev


### Firebase Connection Issues
- Verify .env.local variables are correct
- Check Firebase project settings
- Ensure Firestore rules allow authenticated access

### Build Errors
bash
# Clean and rebuild
npm run clean
npm install
npm run build


---

##  Support

For questions or issues:
- Open an issue on GitHub
- Check existing issues for solutions
- Contact the development team

---

*Built with Next.js, Firebase, and a passion for fitness communities* 
