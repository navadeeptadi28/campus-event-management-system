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
