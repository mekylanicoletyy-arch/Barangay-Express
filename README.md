# Barangay Express (React + Tailwind + Firebase)

## 1. Setup
1. Create a Firebase project. Enable **Authentication (Email/Password)**, **Firestore**, **Storage**, **Hosting**.
2. Add a Web App, copy its config into `.env` (copy `.env.example` to `.env`).
3. `npm install` then `npm run dev`.

## 2. First Captain account (one time)
1. Register a normal resident account in the app (or add a user in Firebase Console > Authentication).
2. In Firestore, open `users/<that uid>` and change the field `role` to `captain`
   (if the doc does not exist, create it: name, email, address, role = "captain").
3. Log in via the "Staff / Admin" tab. Captain can now create Staff accounts.

## 3. Deploy
```
npm i -g firebase-tools
firebase login
firebase init   # reuse existing firebase.json; pick your project
firebase deploy --only firestore:rules,storage
npm run build && firebase deploy --only hosting
```
(Deploy the rules BEFORE using the app, they enforce RBAC.)

## CRUD map
| Entity | Create | Read (realtime) | Update | Delete |
|---|---|---|---|---|
| Requests | Resident submits | All roles (scoped) | Staff status/note; Resident edits purpose while Pending | Resident cancels Pending; Captain any |
| Residents | Self-register | Staff/Captain | Staff/Captain edit | Captain |
| Staff | Captain | Captain | Captain | Captain |
| Logs | Auto on staff actions | Captain | - | - |
