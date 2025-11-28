const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI;

const app = express();
app.use(cors());
app.use(express.json());

// Minimal model + adapter: Mongoose model when MONGO_URI provided, else in-memory store
let EventModel = null;
let inMemory = false;
let events = [];

if (MONGO_URI) {
  mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB connected'))
    .catch(err => {
      console.error('MongoDB connection error', err);
      process.exit(1);
    });

  const eventSchema = new mongoose.Schema({
    type: { type: String, default: 'deforestation' },
    date: { type: Date, required: true },
    area: { type: Number, required: true }, // hectares
    location: String,
    notes: String,
    satelliteImageUrl: String,
    createdAt: { type: Date, default: Date.now }
  });

  EventModel = mongoose.model('Event', eventSchema);
} else {
  inMemory = true;
}

// Helper: generate ID for memory
function id() {
  return Math.random().toString(36).slice(2, 9);
}

// Routes
app.get('/', (req, res) => {
  res.send({ name: 'Deforestation Tracker API', status: 'ok' });
});

app.get('/events', async (req, res) => {
  if (!inMemory) {
    const list = await EventModel.find().sort({ date: -1 }).lean();
    return res.json(list);
  }
  res.json(events);
});

app.post('/events', async (req, res) => {
  const { type = 'deforestation', date, area, location, notes, satelliteImageUrl } = req.body;
  if (!date || area == null) return res.status(400).json({ error: 'date and area are required' });

  if (!inMemory) {
    const e = new EventModel({ type, date, area, location, notes, satelliteImageUrl });
    await e.save();
    return res.status(201).json(e);
  }

  const e = { id: id(), type, date, area, location, notes, satelliteImageUrl, createdAt: new Date() };
  events.push(e);
  res.status(201).json(e);
});

app.get('/events/:id', async (req, res) => {
  const { id: paramId } = req.params;
  if (!inMemory) {
    try {
      const e = await EventModel.findById(paramId).lean();
      if (!e) return res.status(404).json({ error: 'not found' });
      return res.json(e);
    } catch (err) { return res.status(400).json({ error: 'invalid id' }); }
  }

  const e = events.find(x => x.id === paramId);
  if (!e) return res.status(404).json({ error: 'not found' });
  res.json(e);
});

app.put('/events/:id', async (req, res) => {
  const { id: paramId } = req.params;
  const updates = req.body;
  if (!inMemory) {
    try {
      const e = await EventModel.findByIdAndUpdate(paramId, updates, { new: true, runValidators: true }).lean();
      if (!e) return res.status(404).json({ error: 'not found' });
      return res.json(e);
    } catch (err) { return res.status(400).json({ error: err.message }); }
  }

  const idx = events.findIndex(x => x.id === paramId);
  if (idx === -1) return res.status(404).json({ error: 'not found' });
  events[idx] = { ...events[idx], ...updates };
  res.json(events[idx]);
});

app.delete('/events/:id', async (req, res) => {
  const { id: paramId } = req.params;
  if (!inMemory) {
    try {
      const e = await EventModel.findByIdAndDelete(paramId).lean();
      if (!e) return res.status(404).json({ error: 'not found' });
      return res.json({ deleted: true });
    } catch (err) { return res.status(400).json({ error: 'invalid id' }); }
  }

  const idx = events.findIndex(x => x.id === paramId);
  if (idx === -1) return res.status(404).json({ error: 'not found' });
  events.splice(idx, 1);
  res.json({ deleted: true });
});

app.listen(PORT, () => {
  console.log(`Deforestation Tracker API listening on port ${PORT} (${inMemory ? 'in-memory' : 'mongo'})`);
});
