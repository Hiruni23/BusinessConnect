# 🖥 Admin Dashboard Setup

Navigate to the admin dashboard project:

```bash
cd admin-dashboard
```

---

## 1️⃣ Install Dependencies

```bash
npm install
```

---

## 2️⃣ Configure Firebase Admin SDK

To enable secure Firebase Admin access for the dashboard:

### Generate Firebase Service Account Key

1. Open Firebase Console
2. Select project:

```text
businessconnect-b6310
```

3. Navigate to:

```text
Project Settings → Service Accounts
```

4. Click:

```text
Generate New Private Key
```

5. Download the JSON file

6. Save the file as:

```text
admin-dashboard/serviceAccountKey.json
```

inside the `admin-dashboard` root folder.

> ⚠️ IMPORTANT: Never upload `serviceAccountKey.json` to GitHub or public repositories.

---

## 3️⃣ Create Admin Account

Run the admin setup script:

```bash
npm run setup-admin
```

This automatically creates a test administrator account.

### Default Admin Credentials

| Field | Value |
|---|---|
| Email | admin@businessconnect.com |
| Password | AdminPassword123! |

---

## 4️⃣ Start Development Server

```bash
npm run dev
```

Open the dashboard in your browser:

```text
http://localhost:5173
```

Log in using the administrator credentials above.

---

# 🔐 Dashboard Security

The admin dashboard uses:

- Firebase Admin SDK
- Firestore Role-Based Authentication
- Protected Admin Routes
- Real-Time Firestore Data Access

Only users with:

```text
role: admin
```

inside Firestore can access the dashboard.
