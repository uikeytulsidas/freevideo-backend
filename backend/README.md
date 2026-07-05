# Video Downloader Backend

Modular Node.js/Express backend for the Astro video downloader frontend.

## Folder structure

```txt
backend/
  src/
    app.js
    server.js
    config/
      index.js
    constants/
      platforms.js
    controllers/
      video.controller.js
    jobs/
      cleanup.job.js
    middleware/
      error.middleware.js
      rateLimit.middleware.js
    routes/
      index.js
      video.routes.js
    services/
      ytdlp.service.js
    utils/
      file.js
      format.js
      platform.js
      urlValidator.js
  downloads/
  .env.example
  package.json
```

## Run locally

```bash
npm install
copy .env.example .env
npm run dev
```

Backend runs on:

```txt
http://localhost:5000
```

## APIs

```txt
GET  /api/health
POST /api/info
POST /api/download
GET  /api/file/:filename
```

## Notes

- Supports public videos only.
- Does not support private, login-only, or DRM-protected content.
- MP4 quality limit is capped by MAX_QUALITY; default is 4320p / 8K when the source video provides it.
- MP3 and merged MP4 require FFmpeg installed on your system.


## Fix for backend disconnecting after one download

When running `npm run dev`, nodemon must not watch the `downloads/` folder. Otherwise, each downloaded file triggers a backend restart and the frontend may show a backend connection error. This project includes `nodemon.json` and the `dev` script watches only `src/` and ignores `downloads/`.

Use:

```bash
npm run dev
```

Or for final testing without auto-restart:

```bash
npm start
```
