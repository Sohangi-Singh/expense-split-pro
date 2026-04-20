# ExpenseSplit Pro — Setup Guide

## Prerequisites

| Tool    | Version  | Install |
|---------|----------|---------|
| Node.js | ≥ 18.x   | https://nodejs.org |
| npm     | ≥ 9.x    | bundled with Node  |
| Git     | any      | https://git-scm.com |

---

## 1. Install Dependencies

```bash
cd "ExpenseSplit Pro"
npm install
```

---

## 2. Create a Firebase Project

1. Go to **https://console.firebase.google.com**
2. Click **"Add project"** → name it `expensesplit-pro`
3. Disable Google Analytics (optional for this project)
4. Click **"Create project"**

---

## 3. Enable Authentication

1. In the Firebase Console sidebar: **Build → Authentication**
2. Click **"Get started"**
3. Under **Sign-in method**, enable **Email/Password**
4. Click **Save**

### Create a Demo User (for easy testing)

1. Go to **Authentication → Users → Add user**
2. Email: `demo@expensesplit.pro`
3. Password: `demo1234`

---

## 4. Create Firestore Database

1. In the sidebar: **Build → Firestore Database**
2. Click **"Create database"**
3. Choose **"Start in test mode"** (we'll add rules next)
4. Select your region (e.g., `asia-south1` for India) → **Enable**

### Apply Security Rules

1. In Firestore, click the **"Rules"** tab
2. Replace the content with everything inside `firestore.rules`
3. Click **"Publish"**

---

## 5. Get Your Firebase Config

1. In the Firebase Console: **Project Overview → Project settings** (⚙️ gear icon)
2. Scroll to **"Your apps"** → click the **`</>`** Web icon
3. Register app name: `ExpenseSplit Pro Web`
4. Copy the `firebaseConfig` object — you'll need these values

---

## 6. Configure Environment Variables

```bash
cp .env.example .env
```

Open `.env` and fill in your values:

```env
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=expensesplit-pro.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=expensesplit-pro
VITE_FIREBASE_STORAGE_BUCKET=expensesplit-pro.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=1234567890
VITE_FIREBASE_APP_ID=1:1234567890:web:abc123def456
```

> ⚠️ Never commit `.env` to Git. It's already in `.gitignore`.

---

## 7. Run the Development Server

```bash
npm run dev
```

Open **http://localhost:5173** in your browser.

---

## 8. Load Demo Data (Recommended for Demo)

1. Sign up with any email/password (or use `demo@expensesplit.pro` / `demo1234`)
2. After login, navigate to **Groups**
3. You'll see an empty state with a **"Load demo data"** button
4. Click it — it creates 2 groups, 8 expenses, and 1 settlement in ~5 seconds
5. Explore the Dashboard, Expenses, and Settlements pages

---

## 9. Build for Production

```bash
npm run build
```

Output goes to `dist/`. Deploy to any static host (Vercel, Netlify, Firebase Hosting).

### Deploy to Firebase Hosting (optional)

```bash
npm install -g firebase-tools
firebase login
firebase init hosting    # set "dist" as public dir, SPA: yes
npm run build
firebase deploy
```

---

## Firestore Data Structure

```
users/
  {uid}/
    name, email, groups[], createdAt

groups/
  {groupId}/
    name, description, category, createdBy, members[], inviteCode, totalExpenses, createdAt
    
    expenses/
      {expenseId}/
        description, amount, payerId, payerName, splitType
        participants[], shares[{uid, amount, owes}]
        category, settled, createdAt
    
    settlements/
      {settlementId}/
        from, to, fromName, toName, amount, note, settledAt
```

---

## Tech Stack

| Layer      | Technology               |
|------------|--------------------------|
| UI         | React 18 + Tailwind CSS  |
| Routing    | React Router v6          |
| State      | Context API + hooks      |
| Charts     | Recharts                 |
| Icons      | Lucide React             |
| Backend    | Firebase Auth + Firestore|
| Build tool | Vite 5                   |

---

## Key Features Walkthrough

| Feature | Where to find |
|---------|---------------|
| Email/password auth | `/login`, `/signup` |
| Create group + invite code | Groups → New Group |
| Add expense (equal/custom split) | Any group → Add Expense |
| NLP quick-add | Dashboard → Smart Input bar |
| Spending charts | Dashboard (donut + bar/area) |
| Debt simplification | Group Detail → Balances tab |
| Settlements | `/settlements` → Mark settled |
| Demo data | Groups page (empty state) |

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Blank screen after login | Check `.env` values are correct |
| "Permission denied" from Firestore | Re-publish `firestore.rules` |
| Groups not loading | Ensure Firestore is in the same region as your project |
| Build errors | Run `npm install` then `npm run build` |
