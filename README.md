# BusinessConnect 🚀  
A Multi-Role Business Networking, Investment & Marketplace Platform

## 📌 Project Overview
**BusinessConnect** is a mobile-based business collaboration platform developed to connect **Entrepreneurs**, **Investors**, **Customers**, and **Stakeholders** within a unified digital ecosystem.  
The system provides a complete solution for business networking, marketplace transactions, investment opportunities, real-time notifications, and administrative monitoring.

This project was developed as part of the **PUSL3190 Final Year Project**.

---

## 🎯 Project Objectives
- Develop a multi-role platform supporting Entrepreneurs, Investors, Customers, Stakeholders, and Admins.
- Provide an integrated marketplace system for buying and selling products.
- Allow entrepreneurs to pitch business ideas and attract investors.
- Enable investors to browse business opportunities and invest.
- Integrate a secure payment system using **Stripe Sandbox**.
- Implement an AI-based recommendation system for matching investors and businesses.
- Provide an Admin Dashboard for managing users, products, and system activities.
- Improve system reliability using testing and CI/CD automation.

---

## 👥 User Roles & Features

### 👨‍💼 Entrepreneur
- Register/Login with role-based access
- Create business pitch / business profile
- Add and manage marketplace products
- View orders and transactions
- Receive real-time notifications
- View recommended investors using AI matching system

### 💰 Investor
- Register/Login with investor role
- Browse entrepreneur business ideas
- Make investments
- View investment history
- Receive real-time notifications
- View recommended businesses using AI matching system

### 🛒 Customer
- Browse marketplace products
- Add items to cart
- Checkout and make payments
- View order history
- Receive order notifications

### 🧑‍💻 Stakeholder
- View business activities
- Track marketplace progress
- Monitor investment performance

### 🛠 Admin Dashboard (Web)
- Manage users (view/edit/delete)
- Manage investors and entrepreneurs
- Manage marketplace products and categories
- Manage orders and transactions
- View analytics and reports (charts)
- Send notifications and monitor system operations

---

## 🤖 AI Recommendation System
BusinessConnect includes an **AI-based Matching Algorithm** to recommend:
- **Investors to Entrepreneurs**
- **Businesses to Investors**

The algorithm uses multiple factors such as:
- Industry/Interest matching
- Location similarity
- Budget compatibility
- Rating/engagement score

Recommendations are displayed in real-time using Firebase integration.

---

## 🏪 Marketplace Module
Marketplace features include:
- Product listing system
- Category-based browsing
- Search and filter options
- Cart and checkout system
- Order tracking and order history
- Admin-controlled product management

---

## 💳 Payment Integration (Stripe Sandbox)
Stripe Sandbox is integrated for payment simulation.
- Secure checkout flow
- Transaction validation
- Order confirmation after payment

> Note: This project uses Stripe test keys for sandbox testing (no real payments).

---

## 🔔 Notification System
The system supports real-time notifications for:
- New orders
- Investment updates
- Admin alerts
- User connection requests

Firebase Firestore is used to store and update notifications dynamically.

---

## 🛠 Technologies Used

### Mobile Application (Frontend)
- React Native (Expo)
- React Navigation
- JavaScript (JSX)

### Backend
- Firebase Authentication
- Firebase Firestore Database
- Firebase Storage

### Payment
- Stripe API (Sandbox Mode)

### Admin Dashboard (Web)
- React.js
- Firebase Firestore

### Tools
- Git & GitHub
- GitHub Actions (CI/CD)
- Jest (Unit Testing)
- VS Code

---

## 📂 Project Structure (Main)
