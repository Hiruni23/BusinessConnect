# BusinessConnect Admin Dashboard

This is the separate web admin project for BusinessConnect.

## First-Time Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Get Firebase service account key:**
   - Go to [Firebase Console](https://console.firebase.google.com) → `businessconnect-b6310`
   - Project Settings → Service Accounts tab
   - Click "Generate New Private Key"
   - Save the file as `serviceAccountKey.json` in the root folder

3. **Create test admin account:**
   ```bash
   npm run setup-admin
   ```
   This creates:
   - Email: `admin@businessconnect.com`
   - Password: `AdminPassword123!`

## Start Development

```bash
npm run dev
```

Open http://localhost:5173 and log in with the admin credentials.

## Build

```bash
npm run build
```

## Architecture

- **Auth Gate**: Only role `admin` from Firestore can access the dashboard
- **Shared Backend**: Uses the same Firebase project as the mobile app
- **Live Data**: All pages pull real-time data from `pitches`, `users`, and other collections
- **Project Approvals**: Admins can approve/reject pitches which updates the mobile app instantly