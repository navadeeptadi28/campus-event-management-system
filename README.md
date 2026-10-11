<<<<<<< HEAD
# Campus Event Management System

React + Vite frontend, Node.js + Express backend, and SQLite database. The existing Admin dashboard layout has been retained and the registration workflow extended.

## New registration features

- Student login and student account creation are removed from the public interface. Public event registration does not require an account; `/login` is reserved for administrators and `/register` redirects to `/events`.
- Event-specific registration form configuration saved with each event.
- Admin can enable or disable each standard student field and independently choose whether an enabled field is required. Department, course and year use dropdowns; extra department/course options can be configured per event.
- Custom questions support text, number, email, phone, dropdown, radio, checkbox and date input types, required/optional rules, and options.
- Hosting-campus-only or all-campus eligibility, enforced by the backend.
- Individual or team registration with configurable team size, team name, required member details (name, roll number, department, course and year), optional configured email/mobile/section fields, normalized SQLite team-member records, and duplicate-team-name checks.
- Registration data snapshots, college, team data, and custom answers are persisted in SQLite so edits to a student's profile or event form do not rewrite earlier submissions.
- Full-size poster link and Download Poster option on event details.
- Admin registration search/filter by event and college; report exports can choose columns and filter by college, department, year and campus type.
- Excel exports contain selected columns plus separate Team Registrations and Team Members worksheets for team events. Team IDs link every member row to the correct team, and selected member attributes are honored. PDF exports use the same selected fields/filters and repeat headings on additional pages.

## Requirements

- Node.js 20 or newer recommended
- npm

## Install (Windows CMD)

Open CMD in the extracted `campus-event-management-system` folder:

```cmd
npm run install:all
```

This installs the root process runner plus all backend and frontend dependencies (including `axios` and `lucide-react`). If you already ran `npm install` only at the root, that does **not** install packages inside `frontend` or `backend`; run `npm run setup` or `npm run install:all`.

## Start both applications

From the project root:

```cmd
npm run dev
```

Or double-click `start.bat` in the project root. It checks and installs missing dependencies before starting both services.

To start them separately in two CMD windows:

Backend:

```cmd
cd backend
npm install
npm run dev
```

Frontend:

```cmd
cd frontend
npm install
npm run dev
```

Frontend: `http://localhost:5173`
Backend health check: `http://localhost:5000/api/health`

## Default System Administrator

- Email: `admin@college.edu`
- Password: `Admin@123`

If you need to repair only the default admin account, stop the backend and run:

```cmd
cd backend
npm run reset-admin
```

This command does not delete the SQLite database.

## Database and environment

The SQLite database is created under `backend/data/college_event_management.db` by default. Keep this file to preserve existing data. Database initialization performs additive migrations; do not delete the database when updating the project.

Review `backend/.env` for `PORT`, `JWT_SECRET`, `CLIENT_URL`, `SQLITE_DB`, and `COLLEGE_NAME`. Change `COLLEGE_NAME` to the actual hosting college name before collecting registrations.

## Registration workflow

1. A visitor opens Events without signing in.
2. The visitor opens a particular event and selects Register for Event.
3. Student completes that event's form; external college name appears only when all-campus participation is enabled and external participation is selected.
4. The backend validates the event status, registration dates, seats, campus scope, required fields, custom answers, team size and duplicate registration rules.
5. Registration and submitted answers are saved to SQLite.
6. Admin selects the event in Reports to inspect progress and choose export columns/filters before downloading Excel or PDF.

## Notes

- Existing registration answers are snapshots. Editing an event's form affects new registrations and does not rewrite past submissions.
- Admin reports and export endpoints require Admin authentication.
- Event poster uploads remain image files; event detail pages link to the original uploaded image so it can be opened full-size or downloaded.


## Public event registration and invoice workflow

- Opening `/` redirects visitors to the public Events listing. Students can browse events and open event details without signing in.
- The event details page shows the Register for Event action while registration is open and the event has seats available.
- Submitting the event-specific form stores a permanent registration record in SQLite, including student snapshots, campus, team members and custom answers. No student login is required. The existing Admin login and authorization remain protected.
- On success, the student receives a registration reference and can download a PDF registration receipt containing the actual submitted data.
- Start both apps from this project root with `npm run setup` (once) and `npm run dev`. If using separate terminals, run `npm run dev` in `backend` and `frontend`.


## Public student registration (no student login)

- The home page opens the public Events listing.
- Visitors can view event details and submit the event-specific registration form without creating an account or signing in.
- After submission, the registration reference and PDF invoice are shown.
- `/register` redirects to `/events`; student account creation is not part of public event registration.
- `/login` is reserved for administrators only.

## Certificate functionality removed

Certificate generation, certificate-template uploads, certificate download UI, and certificate template fields are not part of this project workflow. Events use only their poster and event-registration configuration.

## Team-member storage and exports

Team registrations persist the team leader in the registration snapshot and store each team member both in the registration snapshot and in the normalized `team_members` SQLite table. Startup migrations backfill the normalized table for older JSON-only team registrations. Event permanent deletion cascades through registrations, attendance, and team-member rows; moving an event to Bin hides it from public listings and active dashboard totals while allowing restoration.

For a quick Windows startup after the first install, run `start.bat` from the project root. Alternatively, run `npm run setup` once and `npm run dev` whenever you want to start both services.


## Troubleshooting: Vite dependency errors

If Vite reports `Failed to resolve import "axios"` or `Failed to resolve import "lucide-react"`, install the frontend dependencies from the project root with `npm install --prefix frontend`, or run `npm run install:all`. Running `npm install` only at the project root does not install these nested frontend dependencies.

If Vite reports `Unexpected token` in `frontend/src/pages/EventRegistration.jsx`, ensure you are running the updated project from this ZIP rather than an older `enhanced-v2` extraction. The EventRegistration component in this release has been replaced with the valid current implementation. Do not mix files between the old and updated project folders.

## Latest registration configuration and team export improvements

- Standard student fields in event creation use one row per field, with **Enabled** and **Required** checkboxes aligned in columns. Required is disabled when a field is disabled.
- The Additional Department Options and Additional Course Options inputs have been removed. The existing standard Department and Course dropdown values are unchanged.
- Team-event Excel and PDF exports use the same filtered registration dataset and selected attributes. Teams are listed sequentially; each team leader appears first, followed by each member on a separate row. Team label, Team ID, Team Name, and Member Role are repeated on each row so members remain linked to the correct team.
- Excel exports use a consolidated worksheet with a header row, filters, frozen headers, and sized columns. PDF exports use a landscape A3 layout with repeating column headers on subsequent pages.
=======
# 🎓 CampusEvents — College Event Management System

CampusEvents is a responsive, full-stack web application that simplifies college event management. Students can explore events, register individually or in teams, and download registration invoices without signing in. Administrators can manage events, configure registration forms, monitor participation, and export reports from a centralized dashboard.

## ✨ Features

- **Public Event Browsing:** Explore upcoming events and view complete event details without student login.
- **Event Registration:** Dynamic registration forms with configurable fields, custom questions, and validation.
- **Team Participation:** Register teams and maintain individual member details.
- **Registration Invoices:** Generate and download PDF invoices containing submitted registration information.
- **Admin Dashboard:** Create, update, approve, and manage college events.
- **Registration Management:** View individual registrations, team details, and submitted responses.
- **Attendance Management:** Maintain student attendance records for events.
- **Excel and PDF Reports:** Export event-specific registration data for analysis.
- **Persistent Database:** Store events and registrations using SQLite.
- **Responsive Interface:** Support desktop, tablet, and mobile devices.

## 🛠️ Technology Stack

| Component | Technologies |
|---|---|
| Frontend | React.js, JSX, HTML, CSS, JavaScript |
| Backend | Node.js, Express.js |
| Database | SQLite |
| Authentication | JWT, bcrypt |
| Reports | Excel and PDF exports |

## 📁 Project Structure

```text
campus-event-management-system/
├── frontend/
│   └── src/
├── backend/
│   ├── config/
│   ├── routes/
│   ├── controllers/
│   └── server.js
├── database/
│   └── schema.sql
└── README.md
```

## 🚀 Getting Started

### Prerequisites

- Node.js and npm
- A Windows, Linux, or macOS development environment

### Installation

Clone the repository:

```bash
git clone <your-github-repository-url>
cd campus-event-management-system
```

Install dependencies using the scripts provided in the project:

```bash
npm run install:all
```

Configure the backend environment variables in `backend/.env`, including the server port, JWT secret, frontend URL, and SQLite database filename.

Start the application:

```bash
npm run dev
```

Open the frontend at `http://localhost:5173/`.

**Note:** Available npm scripts may vary by project version. Check the root `package.json` before running these commands.

## 🎯 Project Objective

The objective of CampusEvents is to reduce manual paperwork, simplify event registration, improve team coordination, and provide administrators with reliable registration records and participation reports.

## 🔐 Security

- Role-based access control for administrative functions.
- Password hashing using bcrypt.
- JWT-based authentication.
- Environment-based configuration.
- Database validation and persistent storage.

Never commit real passwords, private JWT secrets, or sensitive database files to a public repository.

## 👨‍💻 Future Enhancements

- Email notifications for registration confirmations.
- Advanced event analytics and participation statistics.
- Improved reporting and filtering.
- Additional accessibility and multilingual support.

## 📄 License

Choose and add an appropriate open-source license before distributing the project.

---

**CampusEvents — One place for every campus event.**
>>>>>>> b5aa0bd4ab00ff7faa3998f63a3e22150a84579a
