# Daily Ground

Minimal React/Vite personal improvement PWA. Singapore calendar dates, Supabase email/password authentication, IndexedDB offline storage, and explicit sync status.

## 1. Create your Supabase project

Create a project at https://supabase.com/dashboard using a suitable region. Choose the free plan if available; no paid services are required by this code. Run `supabase/schema.sql` in the SQL editor once.

In Authentication → Users, create your personal user with email/password and confirm the email. Disable new user signups in Authentication settings after creating your user. The app deliberately has no public signup form. Password recovery can be performed through the dashboard for this first personal version.

Get your project URL and **publishable** key from the project connection/API settings. Never use a secret or service-role key in Vite or Cloudflare frontend variables.

## 2. Run locally

Install Node.js 22 or newer and pnpm. In this folder:

```sh
pnpm install --frozen-lockfile
```

Copy `.env.example` to `.env.local` and fill in the two public Supabase values. Then:

```sh
pnpm dev
```

Open the printed localhost URL. Sign in while online. First sign-in requires internet. On later launches, a cached session can open this account’s locally stored records offline. Browser storage must be available; use a normal browser profile on a personal device.

## 3. Verify before using real records

```sh
pnpm test
pnpm build
pnpm preview
```

The automated tests cover Singapore midnight and preservation of conflicting offline edits. Complete these live checks with your project:

- Add a habit, check it, add a dated task, a goal/milestone and save all three journal fields. Sync, reload, and confirm each remains.
- Open the same account on a second device and confirm records appear after Sync now.
- Open the production build online once, go offline, reload, create entries and save writing, reload again. Reconnect and sync. Confirm the second device receives the changes.
- Edit the same existing journal on two offline devices, reconnect one and sync, then the other. Both versions must be offered for review. Export first, choose a version and sync again.
- Sign in as a different temporary test user: no other account’s data should appear. Test the database RLS through API requests with each account, not merely through the UI.
- Check an expired session/offline device and a denied storage write. The UI must report the error and never claim cloud sync succeeded.
- Export JSON; inspect records and pending/conflicting versions. This version exports backups; it has no in-app restore/import yet.

## 4. Put the source in GitHub

Create a private repository in your GitHub account. Upload this folder’s source files including `pnpm-lock.yaml` and `pnpm-workspace.yaml`. Do not upload `.env.local`, `node_modules`, or `dist`. Using Git locally is also fine: initialize a repository here, create `codex/daily-ground`, commit, add your repository remote, and push.

## 5. Deploy to Cloudflare Pages

In Cloudflare → Workers & Pages, create a **Pages** project, connect GitHub, and select that repository. If you uploaded the contents directly, the root directory is blank; if nested, set the root to this folder’s repository path.

- Build command: `pnpm build`
- Build output: `dist`
- Node version environment variable: `NODE_VERSION=22`
- Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` for production and any preview environments you use.

Deploy, then add the actual HTTPS Pages URL as your Supabase Authentication Site URL. Environment values are embedded at build time; rebuild after changing them. The public web shell is accessible to anyone with its URL; personal entries require sign-in and owner-only RLS.

## 6. Install on your phone

Open the HTTPS deployment in Safari (iOS) or Chrome (Android), sign in, and wait for “All changes synced”. Use Share → Add to Home Screen on iOS, or Install app/Add to Home Screen in Android Chrome. Open it online once to cache the app shell. Repeat the offline check above from the installed app.

## Persistence rules and practical limits

Every checkbox/list change is committed to IndexedDB before it appears as saved. Journal text uses explicit Save buttons; unsaved writing is not a record. Draft writing stays in memory while switching dates or tabs, and is included in JSON exports. Save writing before closing or reloading; the app warns about unsaved drafts. Offline edits survive reloads once saved. Sync runs at startup, every 15 seconds, on focus and reconnection, or through Sync now. It requires the app to be open; background sync while closed is not provided.

Records use per-entry versions and an atomic compare-and-swap database function. Conflicts stop that record from syncing until you choose a version; no automatic last-write-wins. Journaling conflicts apply to the entire day. Archive/remove uses tombstones, keeping history in exports. There is no unarchive UI yet.

Local writes are serialized across browser tabs with Web Locks. IndexedDB data is scoped by user ID. Sign-out retains local data to prevent accidental loss and is blocked while unsynced entries remain. Local data is not separately encrypted: protect your device and browser profile. This is private account access, not end-to-end encryption. Clearing browser data may remove unsynced data. Browser storage is not a replacement for cloud sync or regular JSON exports.

Updates wait for existing app windows to close; save and sync first, then close all tabs/installed windows and reopen. No reminders, analytics, AI services, or paid integrations are included.

Deployment is not complete until the real Supabase project, GitHub repository and Pages deployment have been configured and the live checks have passed.

Official references: https://supabase.com/docs/guides/database/postgres/row-level-security and https://developers.cloudflare.com/pages/framework-guides/deploy-a-react-site/
