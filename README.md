# Deforestation Tracker — Backend (Minimal)

A small, minimal backend to store and query deforestation events. Uses MongoDB via Mongoose when `MONGO_URI` is set; otherwise it runs with an in-memory store (no persistence). Keep the backend tiny and easy to run locally.

## Features
- Minimal Express server
- CRUD endpoints for `events`
- Mongoose when `MONGO_URI` is available, otherwise in-memory storage

## Quick start

1. Install dependencies:

```powershell
cd backend
npm install
```

2. Set environment variables (either by copying `.env.example` to `.env` or setting them directly):

```powershell
# Use local MongoDB or Atlas connection string
$env:MONGO_URI = 'mongodb://localhost:27017/deforestation'
$env:PORT = '3000'
```

3. Run (dev):

```powershell
npm run dev
```

or run without nodemon:

```powershell
npm start
```

## Endpoints

- GET / => basic API info
- GET /events => list events
- POST /events => create event (body: {date, area, location?, notes?, satelliteImageUrl?})
- GET /events/:id => get single event
- PUT /events/:id => update event
- DELETE /events/:id => delete event

## Example requests

Create an event:

```powershell
curl -X POST http://localhost:3000/events -H "Content-Type: application/json" -d '{"date":"2024-01-01","area":10.5,"location":"Amazon - Peru"}'
```

List events:

```powershell
curl http://localhost:3000/events
```

Delete (in-memory):

```powershell
curl -X DELETE http://localhost:3000/events/<id>
```

## Notes
- If you provide `MONGO_URI`, data persists in MongoDB. If not, the server uses a temporary in-memory store.
- The goal was to keep code minimal and easy to read — expand as needed.
