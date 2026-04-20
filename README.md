# ExpenseSplit Pro — Smart Group Expense Manager

A full-stack React web application for tracking shared expenses across groups and 1-on-1 personal money records. Built with React 18, Firebase, Tailwind CSS, and Recharts.

---

## Features

### Group Expense Management
- Create groups (trips, flatmates, events, etc.) with invite codes
- Add members by email or share an invite code
- Add expenses with equal or custom unequal splits
- NLP smart input — type "Dinner 1200 split 4" and it parses automatically
- Automatic debt simplification (minimises number of transactions)
- One-click settlement recording

### Personal DMs
- 1-on-1 chat with any registered user
- Send +Charge (they owe you) or -Pay (you paid them) transactions inline in chat
- Running balance shown in the conversation header
- Line graph showing daily balance history (green = owed to you, red = you owe)

### Dashboard
- Overview of total owed / total owing / net balance across all groups
- Spending analytics — category donut chart + monthly bar/area chart
- Recent activity feed
- NLP quick-add bar

### Auth
- Email + password sign up / login
- Persistent sessions (stays logged in on refresh)

---

## Tech Stack

| Layer | Technology |
|---|---|
| UI | React 18 + Tailwind CSS |
| Routing | React Router v6 |
| State | Context API (Auth, Group, Toast) |
| Charts | Recharts |
| Backend | Firebase Auth + Cloud Firestore |
| Build | Vite 5 |

---

## Project Structure

```
src/
├── components/
│   ├── common/          # LoadingSpinner, Modal, Toast, DemoSetup
│   ├── dashboard/       # SpendingChart, BalanceCard, ActivityFeed
│   ├── dms/             # MessageBubble, BalanceGraph
│   ├── expenses/        # ExpenseCard, AddExpenseModal
│   ├── groups/          # GroupCard, CreateGroupModal, MemberList
│   ├── layout/          # Layout, Sidebar, TopBar
│   └── settlements/     # SettlementCard
├── context/             # AuthContext, GroupContext, ToastContext
├── hooks/               # useAuth, useGroup, useToast
├── pages/               # DashboardPage, GroupsPage, GroupDetailPage,
│                        # ExpensesPage, SettlementsPage, DMsPage,
│                        # DMConversationPage, AuthPage, LandingPage
├── services/            # firebase.js, authService, groupService,
│                        # expenseService, settlementService, dmService
└── utils/               # debtSimplifier, nlpParser, splitCalculator, seedData
```

---

## Getting Started

### Prerequisites
- Node.js 18+
- A Firebase project (free Spark plan is enough)

### 1. Clone and install

```bash
git clone <your-repo-url>
cd "ExpenseSplit Pro"
npm install
```

### 2. Set up Firebase

1. Go to [Firebase Console](https://console.firebase.google.com) and create a project
2. Enable **Authentication** → Sign-in method → **Email/Password**
3. Enable **Firestore Database** → Build → Firestore Database → Create database (test mode)
4. Go to Project Settings → Your apps → Add a Web app → copy the config

### 3. Configure environment variables

Create a `.env` file in the project root:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 4. Deploy Firestore security rules

```bash
npx firebase-tools login
npx firebase-tools use your-project-id
npx firebase-tools deploy --only firestore:rules
```

### 5. Start the dev server

```bash
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## How to Use

### Creating an Account
1. Open the app and click **Get Started**
2. Click **Sign up** and enter your name, email, and password
3. You'll be taken to the Dashboard automatically

### Creating a Group
1. Click **Groups** in the sidebar
2. Click **New Group**
3. Enter a name, optional description, and category (Trip, Home, Food, etc.)
4. Click **Create** — you'll get an invite code to share with friends

### Adding Members to a Group
- **By email** — open the group → Members tab → Add by email (they must already have an account)
- **By invite code** — share the 6-character code; others can join via Groups → Join with code

### Adding an Expense
1. Open a group → click **Add Expense**
2. Fill in description, amount, category, and who paid
3. Choose **Equal split** (divided automatically) or **Custom split** (enter per-person amounts)
4. Click **Add Expense**

**NLP shortcut:** On the Dashboard, type something like `"Hotel 5000 split 3"` in the Quick Add bar and press Enter — it parses the description, amount, and participant count automatically.

### Settling Debts
1. Go to **Settlements** in the sidebar
2. See the simplified debt list (minimum transactions needed)
3. Click **Mark Settled** on any debt when the payment is made

### Personal DMs
1. Click **Personal DMs** in the sidebar
2. Click **New Chat** → search for a user by name or email
3. In the conversation:
   - **Message tab** — send a regular chat message
   - **+Charge tab** — record that they owe you money (e.g. you paid for lunch)
   - **-Pay tab** — record that you paid them back
   - **Settle tab** — mark everything as cleared
4. Click the **Graph** button in the header to see the balance history chart

### Viewing Analytics
- Go to **Dashboard** → scroll to **Spending Analytics**
- Toggle between **Donut** (category breakdown) and **Bar/Area** (monthly trend)
- Charts update automatically as you add expenses

---

## Building for Production

```bash
npm run build
```

Output is in the `dist/` folder. Deploy to any static host (Firebase Hosting, Vercel, Netlify).

To deploy to Firebase Hosting:
```bash
npx firebase-tools deploy --only hosting
```

---

## Firestore Data Model

```
users/{uid}
  name, email, groups[]

groups/{groupId}
  name, description, category, createdBy, inviteCode,
  members[{uid, name, email, role}], totalExpenses
  └── expenses/{expenseId}
        description, amount, category, paidBy, splits[{uid, amount}]
  └── settlements/{settlementId}
        fromUid, toUid, amount, settledAt

dms/{uid1_uid2}
  participants[], participantUids[], balances{uid: amount}
  └── messages/{messageId}
        senderUid, type, text, amount, createdAt
  └── balanceHistory/{YYYY-MM-DD}
        date, balance_{uid1}, balance_{uid2}
```

---

## React Concepts Demonstrated

| Concept | Where used |
|---|---|
| `useState` | All pages and modals — local UI state |
| `useEffect` | Data fetching, Firebase subscriptions, scroll-to-bottom |
| `useContext` | `useAuth`, `useGroup`, `useToast` throughout the app |
| `useMemo` | Context value objects, chart data transforms |
| `useCallback` | All service call handlers to avoid stale closures |
| `useRef` | Chat scroll anchor (`bottomRef`) |
| `React.lazy` + `Suspense` | All page-level components (code splitting) |
| Context API | AuthContext, GroupContext, ToastContext |
| Custom hooks | `useAuth`, `useGroup`, `useToast` |
| Portal | Modal component renders outside the root div |
