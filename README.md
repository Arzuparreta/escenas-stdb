# escenas-stdb

Web app for browsing and searching movie scenes indexed from a YouTube playlist.

This repo **consumes** [stdbKit](https://github.com/Arzuparreta/stdbKit) as an external dependency — the same way any user would after cloning both projects.

## How it works

1. Your uncle adds scenes to a YouTube playlist (only curation step).
2. The API starts stdbKit's relay in the background.
3. Relay detects playlist changes → webhooks → subtitle indexing.
4. This web UI searches scenes by **phrase**, **film**, or **director**.

Film metadata is parsed from YouTube titles using this convention:

```text
El Padrino (1972) · Coppola — Escena del restaurante
```

## Requirements

- Python 3.12+
- Node.js 20+
- [`yt-dlp`](https://github.com/yt-dlp/yt-dlp) on your `PATH`

## Setup

```bash
# Clone this repo
git clone https://github.com/Arzuparreta/escenas-stdb.git
cd escenas-stdb

# Configure
cp .env.example .env
# Edit .env — set YOUTUBE_PLAYLIST_URL

# Backend (installs stdbKit from GitHub)
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"

# Frontend
cd ../web
npm install
```

## Run locally

Terminal 1 — API (starts stdbKit webhook server + relay + REST):

```bash
cd backend
source .venv/bin/activate
# Load .env from repo root
export $(grep -v '^#' ../.env | xargs) 2>/dev/null || true
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Terminal 2 — Web:

```bash
cd web
NEXT_PUBLIC_API_URL=http://localhost:8000 npm run dev
```

Open http://localhost:6173

The API embeds stdbKit's webhook server (port 8787) and playlist relay. Set `YOUTUBE_PLAYLIST_URL` in `.env` before starting.

## Deploy with Docker Compose

The production stack runs the Next.js frontend and FastAPI backend behind Caddy.
Only ports 80 and 443 are public; API requests use the same-origin `/api` path.
The SQLite catalog persists in `data/cinema.db`.

On the server:

```bash
cp .env.example .env
# Set YOUTUBE_PLAYLIST_URL and keep SITE_ADDRESS=:80 until DNS is ready.
docker compose up -d --build
docker compose ps
curl http://127.0.0.1/api/health
```

Before replacing the database, stop the API and create a backup:

```bash
docker compose stop api
cp data/cinema.db "data/cinema.db.backup.$(date +%s)"
docker compose up -d api
```

After pointing the domain's `A` record to the server, set
`SITE_ADDRESS=your-domain.example` in `.env` and reload Caddy:

```bash
docker compose up -d
```

Caddy will obtain and renew the HTTPS certificate automatically.

## Automatic deployment from GitHub

The `Deploy` GitHub Actions workflow redeploys production after every push to
`main`. It connects to the production server over SSH, fast-forwards its clone
to the current `main`, rebuilds the containers, waits for them to become
healthy, and checks `http://127.0.0.1/api/health`.

The server must have this repository cloned, a configured `.env`, Docker with
the Compose plugin, and an SSH user with permission to run Docker. Add these
repository secrets under **Settings → Secrets and variables → Actions**:

- `DEPLOY_HOST`: server hostname or IP address.
- `DEPLOY_USER`: SSH user on the server.
- `DEPLOY_PORT`: SSH port; use `22` unless it was changed.
- `DEPLOY_PATH`: absolute path of the repository clone on the server.
- `DEPLOY_SSH_KEY`: private SSH key authorized for `DEPLOY_USER`.
- `DEPLOY_KNOWN_HOSTS`: trusted server host key, generated from a trusted
  machine with `ssh-keyscan -H -p 22 your-server`.

The production `.env` and `data/cinema.db` remain on the server and are not
replaced by the deployment. A deployment can also be started manually from
**Actions → Deploy → Run workflow**.

## Updating stdbKit

When the library changes:

```bash
cd backend
source .venv/bin/activate
pip install --upgrade --force-reinstall "stdbkit @ git+https://github.com/Arzuparreta/stdbKit.git"
```

## API endpoints

- `GET /health`
- `GET /status`
- `GET /scenes?status=ready`
- `GET /search?q=...&mode=phrase|film|director|all`

## Project layout

```
backend/     FastAPI app — installs stdbKit from GitHub
web/         Next.js frontend
data/        SQLite database (gitignored)
```

## License

MIT
