# Campus Mafia 🎓🕵️‍♂️🎭

**Campus Mafia** is a real-time, multiplayer social deduction web game modeled after the classic Mafia/Werewolf party game, adapted with a university/campus-themed twist. Students must work together to identify and expel the **Assignment Mafia** before their collective grades are completely sabotaged!

Built with a modern web stack inside a **Turborepo monorepo**, it features instant WebSocket communication, glassmorphic UI design, real-time private/public chat feeds, AI helper desks, and classmate matchmaking dashboards.

---

## 📋 Table of Contents
1. [Core Gameplay & Win Conditions](#-core-gameplay--win-conditions)
2. [Roles & Special Abilities](#-roles--special-abilities)
3. [Game Phases](#-game-phases)
4. [Key Features](#-key-features)
5. [Tech Stack](#-tech-stack)
6. [Local Installation & Setup](#-local-installation--setup)
7. [Environment Variables Reference](#-environment-variables-reference)
8. [Deployment & Hosting Guide](#-deployment--host-configurations)
9. [Running Tests](#-running-tests)

---

## 🏆 Core Gameplay & Win Conditions

In **Campus Mafia**, players are divided into two teams:

*   **The Students (Good)**: Your goal is to deduce who the Mafia is and expel them by voting them out during the trial.
    *   *Win Condition*: All Assignment Mafia members are successfully expelled.
*   **The Assignment Mafia (Evil)**: Your goal is to secretly sabotage students under the cover of night while blending in during the day.
    *   *Win Condition*: The number of alive Mafia members is equal to or greater than the number of surviving Students.

---

## 🎭 Roles & Special Abilities

At the start of the match, players are dealt secret role cards, each carrying unique campus abilities:

| Role | Team | Ability Description |
| :--- | :--- | :--- |
| **Student** | Students | Deduce suspects, join classroom discussions, and vote to expel players during trials. |
| **Assignment Mafia** | Mafia | Select one student each night to **sabotage** (eliminate). Can also chat privately in the secure **Mafia Chat Channel**. |
| **Teacher** | Students | Conduct a grade audit on one player each night to privately uncover whether they are the Mafia. |
| **Attendance Police** | Students | Sign a proxy attendance sheet for one player each night, **protecting** them from any Mafia sabotage. |
| **CR (Class Representative)** | Students | Can trigger a **Visual Emergency Alert** to bypass day discussion, and holds **double voting weight** (2 votes) during expulsion trials. |
| **Canteen Spy** | Students | Overhears whispers from the university canteen kitchen, receiving a **dynamic rumor** each morning about the night's activities. |
| **ChatGPT Helper** | Students | Accesses the campus AI, submitting a helper suggestion at night to be **broadcasted anonymously** to the class at dawn. |

---

## 🔄 Game Phases

The game cycles continuously between three distinct phases:

### 1. 🌙 Night Phase (Curfew)
*   The campus curfew begins. Sockets go dark and players perform their role actions.
*   *Fast-Forward Turn Execution*: If all role players (including ChatGPT Helper) submit their actions before the night timer hits zero, the server fast-forwards directly to daybreak.
*   *Secure Channels*: Sockets restrict the private Mafia channel so only alive Assignment Mafia players can broadcast or read messages.

### 2. ☀️ Day Phase (Classroom Discussion)
*   The sun rises! The server announces the night's results: who was sabotaged and if they were successfully saved.
*   The Canteen Spy receives their private rumor feed, and the ChatGPT Help Desk broadcasts the anonymous helper tip.
*   Players chat publicly to share findings, defend themselves, or accuse others.

### 3. 🗳️ Voting Phase (Trial Consensus)
*   Players cast their votes to expel a classmate.
*   If a tie occurs:
    *   *Majority mode*: The vote ends in a tie and no player is expelled.
    *   *Plurality mode*: A random candidate from the tied players is expelled.
*   Expelled players' roles are publicly revealed.

---

## ✨ Key Features
*   **Real-time Communication**: Driven by WebSockets (Socket.io) with instant state synchronizations across all players.
*   **Matchmaking & Match History**: Persistent database architecture capturing matches, wins, player roles, survival rates, and achievements.
*   **Friends & Invitation Dashboard**: Lookup classmates by name, send invitations, accept requests, and manage active classmates.
*   **Interactive Visual Alerts**: CR emergency calls flash a full-screen crimson alarm on all players' screens to gather them instantly.
*   **Curated Aesthetics**: Rich dark modes, glassmorphic panels, and harmonized color palettes with smooth Framer Motion transitions.

---

## 🛠️ Tech Stack
*   **Monorepo Coordinator**: [Turborepo](https://turbo.build/)
*   **Frontend Web Client**: [Next.js 15](https://nextjs.org/) (React, Tailwind CSS, Zustand, Framer Motion)
*   **Socket & API Backend**: [Express](https://expressjs.com/) with [Socket.io](https://socket.io/) (TypeScript, `tsx`)
*   **Database & ORM**: [Prisma Client](https://www.prisma.io/) with a remote [Neon Serverless PostgreSQL](https://neon.tech/) database

---

## 💻 Local Installation & Setup

Ensure you have [Node.js (v18+)](https://nodejs.org/) installed.

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/Shafiur0/campus-mafia.git
cd campus-mafia
npm install
```

### 2. Set Up Environment Variables
Create `.env` files in the root and app directories.

**Root `.env` (`/campus-mafia/.env`)**:
```env
DATABASE_URL="your-postgresql-connection-string"
NEXTAUTH_SECRET="your-random-32-char-secret"
NEXTAUTH_URL="http://localhost:3000"
NEXT_PUBLIC_SOCKET_URL="http://localhost:5000"
GOOGLE_CLIENT_ID="your-google-oauth-client-id"
GOOGLE_CLIENT_SECRET="your-google-oauth-client-secret"
```

**Server `.env` (`/campus-mafia/apps/server/.env`)**:
```env
DATABASE_URL="your-postgresql-connection-string"
NEXTAUTH_SECRET="your-random-32-char-secret"
```

### 3. Initialize the Database Schema
Generate the Prisma Client and push schemas to your database:
```bash
npm run db:generate
npm run db:push
```

### 4. Run the Development Server
Start both Next.js and the Express backend simultaneously:
```bash
npm run dev
```
*   Frontend will boot on `http://localhost:3000`
*   Backend Socket server will run on `http://localhost:5000`

---

## 🔑 Environment Variables Reference

| Variable Name | Scope | Description |
| :--- | :--- | :--- |
| `DATABASE_URL` | Global | PostgreSQL connection URL (Neon, local, etc.). |
| `NEXTAUTH_SECRET` | Global | Secret token signing NextAuth session JWTs. |
| `NEXTAUTH_URL` | Web Client | The root domain of the web app (e.g., `http://localhost:3000` or Vercel URL). |
| `NEXT_PUBLIC_SOCKET_URL`| Web Client | The URL of the hosted Socket backend server (e.g., Render backend). |
| `GOOGLE_CLIENT_ID` | Web Client | Google API OAuth Client ID credentials. |
| `GOOGLE_CLIENT_SECRET` | Web Client | Google API OAuth Client Secret credentials. |
| `PORT` | Server | Port for the Express backend (default: `5000` / `10000`). |

---

## ☁️ Deployment & Host Configurations

### 1. Frontend (Vercel)
Vercel is optimal for the Next.js web application.
*   **Root Directory**: `.` (leave empty)
*   **Build Command**: `npx turbo run build --filter=web`
*   **Output Directory**: `apps/web/.next`
*   **Environment Variables**: Ensure `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `NEXT_PUBLIC_SOCKET_URL`, `GOOGLE_CLIENT_ID`, and `GOOGLE_CLIENT_SECRET` are configured under Project Settings.

### 2. Backend (Render / Railway / VPS)
Because the Socket backend maintains in-memory game state loops, it requires stateful, persistent runtime hosting.
*   **Build Command**: `npm run build`
*   **Start Command**: `node apps/server/dist/index.js`
*   **Environment Variables**: Ensure `DATABASE_URL`, `PORT` (`10000`), `CLIENT_URL` (pointing to Vercel), and `NEXTAUTH_SECRET` are set.

*Tip: Free tiers on Render spin down after 15 minutes of inactivity. When a player logs in after idle periods, allow ~50 seconds for the backend instance to cycle back alive.*

---

## 🧪 Running Tests

The server uses **Vitest** for isolated unit tests and automated sockets simulation flows.

To run all unit tests (covering role distribution and win condition algorithms):
```bash
npm run test --workspace=server
```

To run the automated **4-player end-to-end integration test**:
```bash
npx tsx apps/server/src/testGameFlow.ts
```

---

## 📄 License
This project is open-source and available under the [MIT License](LICENSE).
