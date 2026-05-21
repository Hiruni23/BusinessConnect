# BusinessConnect 🚀  
A Multi-Role Business Networking, Investment & Marketplace Platform

## 📌 Overview
**BusinessConnect** is a mobile and web-based platform developed to connect **Entrepreneurs**, **Investors**, **Customers**, and **Stakeholders**.  
It provides business networking, investment management, a marketplace system, AI-based recommendations, and an admin dashboard.

This project was developed as part of the **PUSL3190 Academic Project**.

---

## ✨ Key Features
- Multi-role Authentication (Entrepreneur / Investor / Customer / Stakeholder)
- Marketplace (Products, Cart, Checkout, Orders)
- Stripe Payment Integration (Sandbox)
- AI-Based Recommendation System (Investor ↔ Business Matching)
- Real-time Notifications (Firebase Firestore)
- Web Admin Dashboard (User & Marketplace Management)
- Firebase Backend Integration (Auth, Firestore, Storage, Functions)
- Unit Testing (Jest) + CI/CD (GitHub Actions)

---

## 🛠 Technologies Used
- React Native (Expo)
- React.js (Admin Dashboard - Vite)
- Firebase (Auth, Firestore, Storage, Cloud Functions)
- Stripe Sandbox
- Jest (Testing)
- GitHub Actions (CI/CD)

---
# 📱 Mobile App Setup

## Install Dependencies
```bash
npm install
Run Mobile App
npx expo start
---
🖥 Admin Dashboard Setup
Go to Admin Dashboard
cd admin-dashboard
Install Dependencies
npm install
Run Admin Dashboard
npm run dev
Runs on:
http://localhost:5173
---
☁️ Firebase Functions Setup (Optional)
cd functions
npm install
firebase deploy --only functions
---
💳 Stripe Sandbox Test Card
Card Number: 4242 4242 4242 4242
Expiry: Any future date
CVC: Any 3 digits
---
🧪 Testing
Run Unit Tests
npm test

CI/CD is configured using GitHub Actions.
