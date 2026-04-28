# SmartSched 📅

An AI-powered scheduling assistant designed to help college students manage their time effectively. SmartSched integrates class schedules, assignments, and personal preferences to automatically generate an optimized weekly plan that balances study time, rest, and deadlines.

---

## Tech Stack

**Frontend:** React, Vite, Tailwind CSS, FullCalendar.js  
**Backend:** Node.js, Express.js  
**Database:** SQLite (via better-sqlite3)  
**Auth:** Supabase (Google OAuth)  
**ML/AI:** Azure Machine Learning (planned)

---

## Project Structure

```
smartsched/
  starter-frontend/     # React/Vite frontend
  starter-backend/      # Express backend
```

---

## Getting Started

### Prerequisites
- Node.js
- npm

### Installation

Clone the repo and install dependencies for both frontend and backend:

```bash
git clone <your-repo-url>
cd smartsched

cd starter-frontend
npm install

cd ../starter-backend
npm install
```

### Environment Variables

Create a `.env` file in `starter-backend/`:

```
SUPABASE_URL=your-supabase-project-url
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

> Never commit your `.env` file. It's already in `.gitignore`.

### Running the App

In one terminal, start the backend:

```bash
cd starter-backend
node server.js
```

In another terminal, start the frontend:

```bash
cd starter-frontend
npm run dev
```

Frontend runs on `http://localhost:5173`  
Backend runs on `http://localhost:3001`

---

## API Endpoints

### Events
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/events` | Get all events |
| GET | `/api/events/:id` | Get a single event |
| POST | `/api/events` | Create a new event |
| DELETE | `/api/events/:id` | Delete an event |

### Assignments
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/assignments` | Get all active assignments |
| POST | `/api/assignments` | Create a new assignment |
| PUT | `/api/assignments/:id` | Update an assignment |
| DELETE | `/api/assignments/:id` | Delete an assignment |

---

## MVP Features

- [x] Calendar UI with week/month/day views
- [x] Event creation and deletion
- [x] Assignment management (add, update, complete)
- [x] SQLite persistent storage
- [ ] Google login via Supabase
- [ ] Class schedule import (.ics)
- [ ] AI-generated optimized schedule
- [ ] Canvas / Google Calendar sync

---

## Contributing

This project uses a PR-based workflow.

1. Create a new branch for your feature:
   ```bash
   git checkout -b your-feature-name
   ```
2. Make your changes and commit:
   ```bash
   git add .
   git commit -m "feat: description of your change"
   ```
3. Push and open a PR:
   ```bash
   git push origin your-feature-name
   ```
4. Get at least one review before merging into main.

---

## Team

| Role | Members |
|------|---------|
| Frontend | Jessica, Xander, Dana |
| Backend | Stephanie, Dana, Sid |
| AI/ML | Sid, Jessica, Dana |
| Project Lead | Rotating monthly |
| Guide | Medha |