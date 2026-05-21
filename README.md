# 🚀 BusinessConnect

### A Multi-Role Business Networking, Investment & Marketplace Platform

BusinessConnect is a full-stack mobile and web platform designed to connect **Entrepreneurs**, **Investors**, **Customers**, and **Stakeholders** within a unified digital ecosystem.

The platform enables startup investment management, AI-powered business recommendations, marketplace operations, secure Stripe sandbox payments, and real-time collaboration through Firebase services.

> Developed as part of the **PUSL3190 Final Academic Project**.

---

# 📌 Features

## 👥 Multi-Role Authentication
- Entrepreneur Dashboard
- Investor Dashboard
- Customer Dashboard
- Stakeholder Dashboard
- Secure Firebase Authentication

## 💼 Investment & Startup Management
- Startup Pitch Submission
- AI-Based Investor Matching
- Pitch Evaluation & Approval
- Investment Tracking
- Real-Time Notifications

## 🛒 Marketplace System
- Product Listings
- Shopping Cart
- Checkout System
- Order Management
- Product Reviews

## 💳 Stripe Sandbox Integration
- Stripe Payment Gateway
- Stripe Connect Onboarding
- Entrepreneur Wallet
- Real-Time Payout Status
- Sandbox Testing Environment

## 🤖 AI-Powered Features
- AI Investor Recommendation Engine
- Business Pitch Generation
- Startup Evaluation & Risk Prediction
- Fraud Detection API

## 🛠 Admin Dashboard
- User Management
- Marketplace Monitoring
- Pitch Approval System
- Real-Time Firestore Data Management
- Analytics & Oversight Tools

## ☁️ Firebase Backend
- Firebase Authentication
- Cloud Firestore
- Firebase Storage
- Firebase Cloud Functions
- Real-Time Database Synchronization

## 🧪 Testing & CI/CD
- Unit Testing with Jest
- GitHub Actions CI/CD Pipeline
- Automated Test Workflows

---

# 🛠 Technology Stack

| Technology | Purpose |
|---|---|
| React Native (Expo) | Mobile Application |
| React.js + Vite | Admin Dashboard |
| Firebase | Backend Services |
| Firestore | Real-Time Database |
| Firebase Functions | Serverless Backend |
| Stripe Sandbox | Payment Gateway |
| Gemini AI API | AI Recommendation Engine |
| Jest | Unit Testing |
| GitHub Actions | Continuous Integration |

---

# 📱 Mobile App Setup

## 1️⃣ Clone Repository

```bash
git clone https://github.com/Hiruni23/BusinessConnect.git
cd BusinessConnect
```

---

## 2️⃣ Install Dependencies

```bash
npm install
```

---

## 3️⃣ Start Expo Development Server

```bash
npx expo start
```

---

# ☁️ Firebase Functions Setup

Navigate to functions directory:

```bash
cd functions
```

Install dependencies:

```bash
npm install
```

Deploy Firebase functions:

```bash
firebase deploy --only functions
```

---

# 🔐 Environment Variables

Create a `.env` file inside the `functions` folder:

```env
STRIPE_SECRET_KEY=your_key
STRIPE_WEBHOOK_SECRET=your_webhook_secret
GEMINI_API_KEY=your_api_key
EMAIL_USER=your_email
EMAIL_PASS=your_password
```

> ⚠️ Never upload `.env` or service account keys to public repositories.

---

# 💳 Stripe Sandbox Test Card

Use the following Stripe test card for sandbox payments:

| Field | Value |
|---|---|
| Card Number | 4242 4242 4242 4242 |
| Expiry Date | Any Future Date |
| CVC | Any 3 Digits |
| ZIP | Any 5 Digits |

---

# 🧪 Testing

Run unit tests:

```bash
npm test
```

CI/CD workflows are configured using GitHub Actions.

---

# 🖥 Admin Dashboard Setup

Navigate to admin dashboard:

```bash
cd admin-dashboard
```

Install dependencies:

```bash
npm install
```
### Firebase Service Account Setup

1. Go to Firebase Console
2. Select project: `businessconnect-b6310`
3. Go to **Project Settings → Service Accounts**
4. Click **Generate New Private Key**
5. Download the JSON file
6. Save it as:

```text
admin-dashboard/serviceAccountKey.json
```

> ⚠️ Do not upload `serviceAccountKey.json` to GitHub.

### Create Test Admin Account

```bash
npm run setup-admin
```

This creates:

| Email | Password |
|---|---|
| admin@businessconnect.com | AdminPassword123! |

Start development server:

```bash
npm run dev
```

Open:

```text
http://localhost:5173
```

---

# 🔑 Admin Authentication

The admin dashboard only allows users with:

```text
role: admin
```

inside Firestore.

---

# 🧱 System Architecture

```text
Mobile App (React Native)
        ↓
Firebase Authentication
        ↓
Cloud Firestore Database
        ↓
Firebase Cloud Functions
        ↓
Stripe Sandbox + AI APIs
        ↓
Admin Dashboard (React + Vite)
```

---

# 📂 Project Structure

```text
BusinessConnect/
│
├── app/                    # Mobile application
├── admin-dashboard/        # Web admin dashboard
├── functions/              # Firebase cloud functions
├── assets/                 # Images & static assets
├── components/             # Shared UI components
├── context/                # React contexts
├── ml-api/                 # AI/ML Flask API
└── .github/                # GitHub Actions workflows
```

---

# 🔒 Security Notice

Sensitive files are excluded from version control:

- `.env`
- `serviceAccountKey.json`
- Firebase Admin SDK keys
- Stripe Secret Keys

---

# 📄 License

This project was developed for academic and educational purposes.
