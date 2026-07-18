# Movie Night Market

Movie Night Market is a phone-first family voting app for choosing one movie from five manually entered options. It supports anonymous device voting, one ballot per device per movie night, live results, admin controls, and manual poster URLs/uploads.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Prisma + SQLite
- Server Actions for admin controls and vote/rating submission

## Local Setup

```bash
npm install
cp .env.example .env
npm run db:push
npm run dev
```

Open `http://localhost:3000` on the computer. For phone testing on the same Wi-Fi, run:

```bash
npm run dev -- --hostname 0.0.0.0 --port 3000
```

Then open `http://YOUR_COMPUTER_LAN_IP:3000` on the phone.

## Environment

```bash
ADMIN_PASSCODE=popcorn
DATABASE_URL="file:./dev.db"
POSTER_UPLOAD_DIR="./public/uploads"
```

For deployment with a persistent disk, use paths on that disk, for example:

```bash
DATABASE_URL="file:/data/dev.db"
POSTER_UPLOAD_DIR="/data/uploads"
```

## Deploy Notes

The current app uses SQLite and uploaded poster files. Deploy it to a Node host that can provide persistent disk storage, such as a Docker-based Render/Railway/Fly-style deployment. A purely serverless Vercel deployment is not recommended for this version because votes and uploaded posters need durable storage.

Docker support is included:

```bash
docker build -t movie-night-market .
docker run -p 3000:3000 \
  -e ADMIN_PASSCODE=change-me \
  -e DATABASE_URL="file:/data/dev.db" \
  -e POSTER_UPLOAD_DIR="/data/uploads" \
  -v movie-night-data:/data \
  movie-night-market
```

The deploy start command is:

```bash
npm run start:deploy
```

That runs `prisma db push` before `next start`.

## Render Deployment

**Requirements:** Render Starter plan or higher (persistent disk is not available on the free tier).

### 1. Push the repo to GitHub

Push this repository to a GitHub repo you own. If the `movie-night-market/` folder is a subdirectory inside the repo (not the root), note the path — you will need it in step 3.

### 2. Create a new Web Service on Render

1. Go to [render.com](https://render.com) → **New** → **Web Service**.
2. Connect your GitHub account and select your repository.

### 3. Configure the service

| Field | Value |
|---|---|
| **Environment** | Docker |
| **Root Directory** | `movie-night-market` (if the app is in a subdirectory; leave blank if it is the repo root) |
| **Region** | Closest to you |
| **Instance Type** | Starter ($7/mo) or higher |

Leave Build Command and Start Command blank — the Dockerfile handles both.

### 4. Add a Persistent Disk

In the **Advanced** section (or after creation under **Disks**):

| Field | Value |
|---|---|
| **Name** | `movie-night-data` |
| **Mount Path** | `/data` |
| **Size** | 1 GB |

### 5. Set Environment Variables

In the **Environment** section, add:

| Key | Value |
|---|---|
| `DATABASE_URL` | `file:/data/prod.db` |
| `POSTER_UPLOAD_DIR` | `/data/uploads` |
| `ADMIN_PASSCODE` | *(choose a strong passcode)* |
| `NODE_ENV` | `production` |

### 6. Deploy

Click **Create Web Service**. Render will:
1. Build the Docker image (≈ 2–4 minutes on first build).
2. Mount `/data` from the persistent disk.
3. Run `prisma db push` to initialize the SQLite database at `/data/prod.db`.
4. Start `next start` on port 3000.

Your app will be live at `https://<your-service-name>.onrender.com`.

### Re-deploys

Push to your GitHub branch and Render will rebuild and redeploy automatically. The persistent disk (database + uploaded posters) survives re-deploys unchanged. `prisma db push` runs on every start and is safe to run repeatedly — it only applies schema changes.

## Admin

- Admin login page: `/admin/login`
- Default passcode: `popcorn`
- Change it with `ADMIN_PASSCODE`

Admin can create one active movie night at a time, enter exactly five movie options, paste poster URLs, upload poster images, close voting, reveal the winner, and archive the night.

## Phone Testing

Before sharing broadly, test these on a real phone browser:

1. Create a movie night in admin.
2. Confirm voting is open immediately.
3. Tap all five vote rating controls and submit.
4. Confirm the same phone cannot vote twice.
5. Reveal a winner.
6. Archive the night and confirm the last winner poster appears on the idle home screen.
