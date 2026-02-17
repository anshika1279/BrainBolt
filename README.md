# BrainBolt - Adaptive Quiz Platform

An intelligent, adaptive quiz platform that adjusts difficulty in real-time based on user performance. Built with modern web technologies for a seamless learning experience.

## 🎯 Features

- **Adaptive Difficulty System**: Questions automatically increase/decrease based on your performance
- **Streak Tracking**: Build streaks with correct answers and watch your score multiply
- **Gentle Streak Decay**: Wrong answers reduce your streak by 1 instead of resetting completely
- **Smart Question Rotation**: Never see the same question twice in a row across all difficulty levels
- **Inactivity Decay**: Streaks naturally decay after 10+ minutes of inactivity
- **Duplicate Prevention**: Idempotent answer submissions prevent double-counting
- **Dark Mode Support**: Beautiful light and dark themes with smooth transitions
- **Production Ready**: Rate limiting, database migrations, comprehensive error handling

## 🏗️ Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js 16 with Turbopack, Node.js
- **Database**: PostgreSQL with 5 applied migrations
- **Caching**: Redis for rate limiting
- **API**: RESTful endpoints with JSON payloads

## 📋 Prerequisites

- Node.js 18+ 
- PostgreSQL 14+
- Redis (optional, for rate limiting)
- npm or yarn

## 🚀 Quick Start (Single Command)

```bash
docker-compose up --build
```

This runs the entire stack:
- **Frontend:** http://localhost:3000
- **PostgreSQL:** localhost:5432
- **Redis:** localhost:6379

The app automatically initializes the database schema on first run.

## 🚀 Getting Started

### Local Development
```bash
git clone https://github.com/yourusername/brainbolt.git
cd brainbolt
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Setup
Create a `.env.local` file:
```bash
DATABASE_URL=postgres://brainbolt:brainbolt@localhost:5432/brainbolt
REDIS_URL=redis://localhost:6379
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000
NODE_ENV=development
```

### 4. Database Setup
```bash
createdb brainbolt
npm run migrate
npm run seed
```

### 5. Start Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 🎮 How It Works

### Starting Level
Users begin at **difficulty level 1** (1-10 scale).

### Adaptive Algorithm

**Difficulty Increases:**
- Requires 2 **consecutive correct answers**
- Difficulty +1 (max 10)
- Streak continues

**Difficulty Decreases:**
- Requires 2 **consecutive wrong answers**
- Difficulty -1 (min 1)
- Wrong streak resets

**Streak Management:**
- Correct answer: streak +1
- Wrong answer: streak -1 (min 0), streak never fully resets
- Wrong streak counter: separate tracker for difficulty changes
- 10+ minute inactivity: streak -1

### Question Pool
- **Total**: 40 questions
- **Distribution**: 4 per difficulty level (1-10)
- **Rotation**: Circular queue, no repeats within level
- **Reset**: Queue resets when difficulty changes

## 📊 Score Calculation

```
Base Score = 10 per correct answer
Multiplier = 1.0x - 1.8x (based on streak, capped at 8)

Examples:
  Streak 1-2: 1.0x → 10 points
  Streak 4:   1.3x → 13 points
  Streak 8+:  1.8x → 18 points
```

## 🔌 API Endpoints

### Get Next Question
```
GET /api/quiz/next
```
```json
{
  "sessionId": "uuid",
  "question": {
    "id": "uuid",
    "text": "Question text?",
    "options": ["A", "B", "C", "D"],
    "difficulty": 3
  },
  "difficulty": 3,
  "streak": 2
}
```

### Submit Answer
```
POST /api/quiz/answer
```
Request:
```json
{
  "sessionId": "uuid",
  "questionId": "uuid",
  "answerIndex": 1,
  "stateVersion": 1,
  "answerIdempotencyKey": "unique-key"
}
```

Response:
```json
{
  "correct": true,
  "score": 13,
  "streak": 3,
  "difficulty": 3,
  "nextDifficulty": 4,
  "explanation": "Correct!"
}
```

## 🗄️ Database Schema

**Key Tables:**
- `users`: User accounts
- `user_state`: Progress, streaks, difficulty
- `questions`: Question bank (40 total)
- `user_answers`: Answer history

**Important Columns:**
- `current_difficulty`: User's current level (1-10)
- `streak`: Consecutive correct answers
- `wrong_streak`: Consecutive wrong answers
- `queue_difficulty`: Current question pool level
- `cycle_position`: Position in circular queue

## 🔧 Configuration

### Algorithm
Edit `src/lib/quiz/engine.ts`:
```typescript
const MIN_DIFFICULTY = 1;
const MAX_DIFFICULTY = 10;
const MIN_STREAK_TO_RISE = 2;
const MIN_WRONG_STREAK_TO_DROP = 2;
```

### Starting Difficulty
Edit `src/lib/db/quiz.ts`:
```typescript
const DEFAULT_DIFFICULTY = 3;
```

## 📦 Build & Deploy

### Production Build
```bash
npm run build
npm run start
```

### Docker
```bash
docker build -t brainbolt .
docker run -e DATABASE_URL=postgres://... -p 3000:3000 brainbolt
```

## 🎨 UI/UX

- **Responsive**: Desktop, tablet, mobile
- **Dark Mode**: Navy-blue gradients for eye comfort
- **Interactive**: Smooth hover effects and transitions
- **Accessible**: Semantic HTML, ARIA labels, keyboard nav

## 🧪 Testing

```bash
# Type checking
npm run type-check

# Build validation
npm run build
```

## 🚦 Rate Limiting

- **Per User**: 300 requests/5 min
- **Per IP**: 1000 requests/5 min
- **Idempotency**: Retries don't consume limits

## 🔍 Edge Cases Handled

✅ Streak decay on wrong answers (by 1, not reset)  
✅ Inactivity decay after 10+ minutes  
✅ Duplicate submission prevention (idempotency)  
✅ Circular question queue without repeats  
✅ Difficulty bounds (1-10)  
✅ Ping-pong prevention (streak requirements)

## 📝 Project Structure

```
brainbolt/
├── src/
│   ├── app/
│   │   ├── api/quiz/           # Quiz endpoints
│   │   └── globals.css         # Theming
│   ├── lib/
│   │   ├── quiz/
│   │   │   ├── engine.ts       # Adaptive algorithm
│   │   │   └── circularQuestionPicker.ts
│   │   └── db/
│   │       ├── schema.sql      # Database structure
│   │       └── quiz.ts         # Data layer
│   └── components/             # React components
├── migrations/                 # Database migrations
├── public/                     # Static assets
└── README.md
```

## 🎯 Roadmap

- [ ] User profiles and statistics
- [ ] Question categories/tags
- [ ] Performance analytics dashboard
- [ ] Mobile app (React Native)
- [ ] Real-time multiplayer mode
- [ ] AI-generated questions
- [ ] Question difficulty calibration

---

**Built with ❤️ for learning**
