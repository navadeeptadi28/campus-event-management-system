# Campus Event Management System

## Complete Project Explanation in Simple English

## 1. Introduction

The **Campus Event Management System (CampusEvents)** is a web
application for publishing college events, collecting registrations,
managing participants, and preparing reports.

Instead of collecting registrations through separate paper forms or
spreadsheets, the system keeps event and registration information in one
application. Visitors can browse events and register online.
Administrators can manage events, view registrations, and export
reports.

The project uses:

-   **Frontend:** React and Vite
-   **Backend:** Node.js and Express
-   **Database:** SQLite
-   **Report files:** Excel and PDF exports
-   **Registration receipt:** PDF registration invoice/receipt
-   **Authentication:** Administrator login with protected admin routes

The exact screens and options available depend on the event
configuration and the version of the project being run.

------------------------------------------------------------------------

## 2. Main Goals of the System

The system is designed to:

1.  Show upcoming and published college events in one place.
2.  Let visitors open event details without signing in.
3.  Collect registrations through a form made for each event.
4.  Support both individual registration and team registration when
    enabled for an event.
5.  Save registration information in a database.
6.  Let the administrator review registrations and filter the records.
7.  Export selected registration fields to Excel or PDF.
8.  Keep team details connected to the correct team members.
9.  Generate a PDF registration receipt using the submitted registration
    data.
10. Reduce manual work and help prevent missing or mismatched
    registration records.

------------------------------------------------------------------------

## 3. Who Uses the System?

### 3.1 Visitor / Participant

A visitor is someone who opens the public website. A participant can:

-   Browse the available events.
-   Open an event to read its details.
-   Check the event poster, venue, schedule, and registration
    information when provided.
-   Open the event-specific registration form.
-   Complete the required fields and submit the registration.
-   Receive a registration reference after successful submission.
-   Download the PDF registration receipt shown after registration.

**Important:** Public event browsing and registration do not require a
student account. The public registration flow is separate from
administrator login.

### 3.2 Administrator

The administrator manages the event information and registration
records. Depending on the available options in the installed version,
the administrator can:

-   Sign in through the administrator login page.
-   Create and edit event details.
-   Configure the registration form for an event.
-   Choose which standard participant fields are enabled and which are
    required.
-   Add custom questions to an event form.
-   Configure whether an event is for the hosting campus only or can
    accept registrations from other campuses.
-   Configure individual or team participation and team-size rules.
-   Review registration records.
-   Search and filter registration reports.
-   Select which columns should appear in an export.
-   Download Excel and PDF reports.

Administrator-only reports and export endpoints require administrator
authentication.

------------------------------------------------------------------------

## 4. Technology Stack Explained

### React

React builds the pages and interactive parts of the website. For
example, the event listing, event details, registration form, and
administrator dashboard are displayed through the frontend.

### Vite

Vite runs the frontend development server and prepares the React
application for development and production builds. During local
development, the website is usually available at:

`http://localhost:5173`

### Node.js

Node.js runs the JavaScript backend outside the browser.

### Express

Express provides the backend API routes. The frontend sends requests to
these routes to retrieve events, submit registrations, and request
reports.

### SQLite

SQLite stores the application's data in a database file. The default
database path documented by the project is:

`backend/data/college_event_management.db`

The database can contain event information, registration records,
submitted answers, and team-member records.

### Excel and PDF generation

The report functions create downloadable files for administrators. The
registration receipt function creates a PDF for a successful
registration. Exported content should come from saved records rather
than invented participant or payment details.

------------------------------------------------------------------------

## 5. How the Application Is Organized

The project is separated into three main parts.

### 5.1 Frontend

Folder:

`frontend/`

The frontend contains the visible pages and reusable interface
components. Important pages include:

-   `Home.jsx` --- the public landing/events experience.
-   `Events.jsx` --- the list of events.
-   `EventDetails.jsx` --- information about one event.
-   `EventRegistration.jsx` --- the public registration form.
-   `Login.jsx` --- administrator login.
-   `AdminDashboard.jsx` --- administrator management and reporting
    interface.
-   `About.jsx` --- information about the application.
-   `MyRegistrations.jsx` and other dashboard pages --- supporting pages
    included in the project.

The frontend is responsible for displaying information and collecting
user input. It should not be treated as the final authority for
important validation; the backend validates registration submissions
too.

### 5.2 Backend

Folder:

`backend/`

The backend receives requests from the frontend, checks the submitted
data, reads from or writes to SQLite, and returns a response.

Backend controller files contain logic for different features. For
example:

-   `adminController.js` --- administrator-related operations and
    report/export logic.
-   `registrationController.js` --- registration-related processing and
    registration receipt logic.
-   Other controllers handle other areas of the application.

The exact controller and route names should be checked in the installed
project if the application has been modified.

### 5.3 Database

Folder:

`backend/data/`

The SQLite database file stores the persistent application data.
Persistent means the records remain after the website is closed or the
development server is stopped.

**Do not delete the database file when updating the application if you
need to keep existing records.** The project documentation says startup
initialization performs additive migrations. Keep a separate backup
before making major changes.

------------------------------------------------------------------------

## 6. Public Website Workflow

### Step 1: A visitor opens the website

The public home route directs the visitor to the events experience. The
visitor does not have to log in just to browse events.

### Step 2: The visitor browses events

The events page displays available events. The visitor can open a
particular event to see more information.

Event information can include:

-   Event name and description
-   Event poster, if supplied
-   Date and time
-   Venue
-   Registration availability
-   Participation type and rules, when configured

Only information that has been entered for the event should be shown as
event data.

### Step 3: The visitor opens event details

The event details page explains the selected event and provides a
registration action while registration is open and seats are available.

### Step 4: The visitor fills in the registration form

The form is configured for that particular event. It may contain
standard fields, custom questions, and team-member details if team
registration is enabled.

### Step 5: The visitor submits the form

The frontend sends the registration details to the backend API. The
backend validates the data before saving it.

### Step 6: The backend saves the registration

If the submission passes validation, the system saves a registration
record and the submitted answers in SQLite.

### Step 7: The visitor sees confirmation

After a successful registration, the website displays a registration
reference and provides an option to download the PDF registration
receipt.

------------------------------------------------------------------------

## 7. Event Registration Form Configuration

Each event can have its own registration form configuration. This means
two events do not have to ask participants for exactly the same
information.

### 7.1 Standard fields

The administrator can enable or disable supported standard participant
fields and independently decide whether an enabled field is required.

For example, an event might require a participant's name and roll number
while allowing other configured fields to be optional.

The project documentation describes dropdowns for department, course,
and year. Additional department or course options can also be configured
for an event.

### 7.2 Custom questions

The administrator can add custom questions for event-specific
information. The documented input types include:

-   Text
-   Number
-   Email
-   Phone
-   Dropdown
-   Radio button
-   Checkbox
-   Date

A custom question can be marked required or optional. Dropdown and radio
questions can have configured choices.

### 7.3 Why form configuration matters

A technical event, sports event, and workshop may need different
information. Configurable forms let the administrator collect
information relevant to each event without using one fixed form for
every activity.

### 7.4 Previously submitted information

The project stores a snapshot of the submitted registration information
and answers. If an event form is edited later, the change is intended to
affect new registrations rather than silently rewriting previous
submissions.

------------------------------------------------------------------------

## 8. Campus Eligibility

An event can be configured for:

-   **Hosting campus only:** registrations are restricted to the hosting
    campus.
-   **All campuses:** participants from other campuses may be allowed.

When the event allows all-campus participation, the form can ask for an
external college name when the participant selects external
participation.

The backend checks campus eligibility. This is important because a
validation rule should not depend only on what the browser displays; a
request sent directly to the API must also be checked.

------------------------------------------------------------------------

## 9. Individual Registration

Individual registration is used when one person registers for an event
independently.

The general flow is:

1.  The participant opens the event.
2.  The participant selects the registration option.
3.  The participant completes the required form fields.
4.  The participant answers any configured custom questions.
5.  The backend validates the event and submission.
6.  The registration record and submitted answers are saved.
7.  The system returns a registration reference and PDF receipt.

For an individual registration, team-specific fields such as Team Name
or Team ID should be empty or marked as not applicable. The system
should not assign a team identifier that could be mistaken for a real
team.

------------------------------------------------------------------------

## 10. Team Registration

Team registration is available when the event is configured for team
participation.

### 10.1 Team information

A team registration can contain information such as:

-   Team name
-   Team leader details
-   Team ID / registration reference
-   Team members
-   Other enabled participant fields
-   Answers to event-specific questions

The configured team-size rules determine how many members can or must be
included.

### 10.2 Team leader and members

The team leader is recorded with the main registration information.
Team-member details are stored with the registration snapshot and in the
normalized `team_members` SQLite table, as documented by the project.

The member fields described by the project include name, roll number,
department, course, and year. Email, mobile number, and section can be
included when configured.

### 10.3 Duplicate team names

The backend checks for duplicate team names according to the event's
registration rules. This helps avoid ambiguity when reviewing team
registrations.

### 10.4 How Team ID should work

Team ID is an identifier used to connect a team registration to its team
and member records. In the current export design, the team registration
code is used as the Team ID for a team registration.

For example:

  Team ID             Team Name    Record
  ------------------- ------------ -------------------
  `REG-EXAMPLE-001`   Innovators   Team registration
  `REG-EXAMPLE-001`   Innovators   Member 1
  `REG-EXAMPLE-001`   Innovators   Member 2

These are illustrative values only, not real records from the database.
Repeating the same Team ID on each member row makes it easier to
identify which team the member belongs to.

For an individual registration, Team ID should remain blank or not
applicable.

### 10.5 Why the member table is useful

A normalized team-member table gives the application a separate place to
store member records. The registration snapshot also preserves what was
submitted at registration time. Keeping the records linked makes it
easier to display members and create exports without confusing members
from different teams.

------------------------------------------------------------------------

## 11. Administrator Dashboard and Reports

The administrator dashboard is the private area for managing events and
registrations.

The reporting workflow is generally:

1.  The administrator signs in.
2.  The administrator opens the reports/registration section.
3.  The administrator chooses an event or applies available filters.
4.  The administrator selects the columns needed for the report.
5.  The administrator chooses Excel or PDF export.
6.  The backend checks administrator access, applies the filters, and
    generates the file.
7.  The browser downloads the report.

Available filters documented for reports include college, department,
year, and campus type, alongside event selection and registration
search.

### 11.1 Select Required Columns to Export

The column-selection area lets the administrator choose which fields to
include in the export.

For example, a report might need only participant name, roll number,
department, and Team ID. Another report might need additional contact
information.

The export should use the selected columns rather than always including
every possible field. The selection should be respected in both Excel
and PDF reports.

### 11.2 Team ID as an export column

Team ID should appear as a checkbox option alongside the existing export
fields. The administrator can select or deselect it.

When selected:

-   Team rows should show the correct Team ID.
-   Member rows should carry the same Team ID as their team.
-   Team ID should remain associated with the event, team name, team
    leader, and members.
-   Individual registrations should not receive unrelated team
    identifiers.

If Team ID is deselected, it should not appear as a selected report
column.

------------------------------------------------------------------------

## 12. Excel Export for Team Events

The Excel report is intended to make registration data easy to review in
a spreadsheet.

The documented export design includes selected registration columns and
separate worksheets for team registrations and team members.

### 12.1 Team Registrations worksheet

This worksheet provides the main team-registration records, including
selected team-level fields.

### 12.2 Team Members worksheet

This worksheet lists team-member records and the selected member
attributes. Team ID and Team Name can be repeated on member rows so that
a member remains connected to the correct team even when rows are sorted
or filtered.

### 12.3 Main export worksheet and blank rows

For a team-oriented report that groups the rows by team, the desired
layout is:

``` text
Team 1 registration details
Team 1 member 1
Team 1 member 2
Team 1 member 3

Team 2 registration details
Team 2 member 1
Team 2 member 2

Team 3 registration details
Team 3 member 1
...
```

There should be exactly one completely empty worksheet row between
consecutive teams, and no blank row between members of the same team.

A completely empty row means that the row contains no placeholder text.
It should be an actual blank row in Excel.

### 12.4 Data integrity rules

A correct export should:

-   Keep values under the correct headings.
-   Include all matching teams and members.
-   Avoid duplicate or missing member records.
-   Repeat Team ID and Team Name where necessary to maintain
    relationships.
-   Insert a blank row only between teams, not between members.
-   Respect the administrator's selected columns and active filters.
-   Keep individual registrations separate from team records.

The selected fields and filters must be handled consistently across the
Excel and PDF export paths.

------------------------------------------------------------------------

## 13. PDF Report Export

The administrator can export registration reports as PDF as well as
Excel.

A PDF is useful when the report needs to be printed, shared, or read
without editing the spreadsheet.

The report should:

-   Use the selected fields and active filters.
-   Keep each value under the correct heading.
-   Repeat the report headings on additional pages when needed.
-   Include the appropriate team/member information for team events.
-   Keep Team ID associated with the correct team when selected.

Excel and PDF are two output formats for the same reporting task. They
should not silently use different filters or include different sets of
records.

------------------------------------------------------------------------

## 14. Registration Invoice / Receipt PDF

After a registration succeeds, the participant can download a PDF
registration receipt. The project documentation describes it as a
receipt containing the actual submitted registration data.

The intended invoice/receipt information includes:

### 14.1 Header

-   CampusEvents heading
-   College name configured for the application
-   Title: **EVENT REGISTRATION INVOICE**
-   Registration reference
-   Registration date

### 14.2 Event information

When the information exists for the event, the receipt can display:

-   Event name
-   Event date and time
-   Venue
-   Participation type
-   Event rules or other relevant event details
-   Poster reference or image, depending on the implementation

### 14.3 Participant information

For an individual registration, the receipt should show the participant
details saved with the registration.

For a team registration, it should show the available team information,
such as:

-   Team ID / registration reference
-   Team name
-   Team leader
-   Registered team members
-   Other submitted fields and custom answers, where supported

### 14.4 Status and accuracy

The receipt can show the saved registration status and confirmation
details.

**Important:** The receipt must not invent prices, taxes, paid amounts,
or payment status when those details were not actually collected and
saved by the application. A registration receipt is not proof of payment
unless the system genuinely records a payment.

------------------------------------------------------------------------

## 15. What Happens Behind the Scenes?

A simplified request flow looks like this:

``` text
Visitor's browser
       |
       v
React + Vite frontend
       |
       | HTTP API request
       v
Node.js + Express backend
       |
       | Validate request and permissions
       v
SQLite database
       |
       | Saved event / registration data
       v
Backend creates response, Excel, or PDF
       |
       v
Browser displays confirmation or downloads file
```

### Example: registering a team

1.  The visitor opens an event configured for teams.
2.  The frontend displays the event's registration form.
3.  The visitor enters the team information and member details.
4.  The frontend sends the form data to the backend.
5.  The backend checks the event, registration window, seats, required
    fields, team size, campus eligibility, and duplicate-team rules as
    applicable.
6.  The backend saves the registration and member information in SQLite.
7.  The backend returns a registration reference.
8.  The website displays success and offers the PDF receipt.
9.  Later, the administrator can find the registration and export its
    details.

This separation matters: the frontend collects information, the backend
validates and processes it, and SQLite preserves it.

------------------------------------------------------------------------

## 16. Validation and Data Protection

The project documentation describes several validation rules for
registration submissions, including:

-   The event must permit registration.
-   Registration dates and seat availability must be checked.
-   Required standard fields must be supplied.
-   Required custom questions must be answered.
-   Campus eligibility must be followed.
-   Team size must follow the event configuration.
-   Duplicate team names must be checked where applicable.
-   Administrator report and export routes must require administrator
    authentication.

These checks help keep registration data consistent. The exact behavior
should still be tested in the installed version, especially after source
files have been manually replaced or edited.

------------------------------------------------------------------------

## 17. Database and Record Management

SQLite is used to keep records between application runs.

The project documentation identifies the default database file as:

`backend/data/college_event_management.db`

Important points:

1.  Keep this file if existing events and registrations must be
    preserved.
2.  Back it up before replacing project files or changing database
    logic.
3.  Do not assume that deleting `node_modules` deletes the database;
    these are different folders with different purposes.
4.  Event registration snapshots preserve the information submitted at
    registration time.
5.  Team-member records are stored in the `team_members` table, and
    startup migrations can backfill this table for older JSON-only team
    registrations.
6.  The documented event deletion behavior distinguishes moving an event
    to Bin from permanently deleting it. Moving an event to Bin hides it
    from public listings and active dashboard totals while allowing
    restoration. Permanent deletion is documented to cascade through
    related registration, attendance, and team-member rows.

Because permanent deletion can remove related data, it should be used
carefully.

------------------------------------------------------------------------

## 18. Installation on Windows

### Requirements

-   Node.js 20 or newer is recommended by the project documentation.
-   npm is installed with Node.js.

### Step 1: Extract the ZIP

Extract the project ZIP to a normal folder, for example:

`C:\Users\YourName\Downloads\campus-event-management-system\`

Do not run the commands from inside the ZIP preview window.

### Step 2: Open Command Prompt

Open the extracted `campus-event-management-system` root folder in
Command Prompt.

The root folder is the folder containing the main `package.json`,
`backend`, and `frontend` folders.

### Step 3: Install dependencies

Run:

``` cmd
npm run install:all
```

This installs the packages needed by the root project, frontend, and
backend.

If you only run `npm install` inside `frontend`, that installs frontend
dependencies only; it does not install backend dependencies.

### Step 4: Start the application

From the project root, run:

``` cmd
npm run dev
```

Alternatively, use `start.bat` from the project root if provided in the
extracted project.

The frontend is usually available at:

`http://localhost:5173`

The backend health endpoint documented by the project is:

`http://localhost:5000/api/health`

### Step 5: Sign in as administrator

The project README lists these default administrator credentials:

-   Email: `admin@college.edu`
-   Password: `Admin@123`

Change default credentials and protect access appropriately before using
the system for real registrations. If these credentials have been
changed in your copy, use the credentials configured in that copy.

### Step 6: Set the college name

Review `backend/.env` and set `COLLEGE_NAME` to the correct college
name. Also check `PORT`, `JWT_SECRET`, `CLIENT_URL`, and `SQLITE_DB`.

Do not share your real `.env` file publicly because it may contain
secrets.

------------------------------------------------------------------------

## 19. Troubleshooting

### Frontend says a package is missing

From the project root, run:

``` cmd
npm run install:all
```

Or install the frontend dependencies directly:

``` cmd
npm install --prefix frontend
```

### Vite reports a Rollup Windows native-module error

A message such as `Cannot find module @rollup/rollup-win32-x64-msvc` can
mean that the installed optional dependency is missing or incompatible.

Close the Vite process, open Command Prompt in the `frontend` folder,
and run:

``` cmd
rmdir /s /q node_modules
del package-lock.json
npm cache verify
npm install
npm run dev
```

Only remove the frontend's `node_modules` and `package-lock.json` when
following this clean reinstall procedure. Do not delete the SQLite
database. If the error continues, check the Node.js version and
architecture and review the npm error output.

### Backend reports a JWT secret error

Check that `backend/.env` exists and has a non-empty `JWT_SECRET` value.
Restart the backend after changing environment settings.

### Port is already in use

If the server says a port is already in use, another process may already
be running on that port. Stop the old development server or configure a
free port and update the corresponding frontend API configuration as
required.

### Registrations disappear after an update

Check whether the application is using the same SQLite database path as
before. The documented database file is under `backend/data/`. Do not
delete or replace it when you need to retain existing records.

------------------------------------------------------------------------

## 20. Testing Checklist

Before using the system for an actual college event, test the following
cases.

### Public pages

-   [ ] The events page opens without administrator login.
-   [ ] Event details display the saved event information.
-   [ ] Registration is available only when the event permits it.

### Individual registration

-   [ ] A visitor can submit an individual registration.
-   [ ] Required fields and custom questions are validated.
-   [ ] A successful submission is saved.
-   [ ] The registration reference appears.
-   [ ] The PDF receipt downloads and contains the saved information.
-   [ ] Team ID is blank or not applicable for individual registrations.

### Team registration

-   [ ] A team can be registered when the event allows teams.
-   [ ] Team-size rules are checked.
-   [ ] Team name, leader, and member details are saved.
-   [ ] Each member is linked to the correct team.
-   [ ] Duplicate team names are handled according to the event rules.
-   [ ] Team ID is consistent across the team and its member records.
-   [ ] The team receipt includes the correct team and member
    information.

### Excel and PDF reports

-   [ ] Administrator login is required to access reports.
-   [ ] The administrator can select and deselect export columns.
-   [ ] Team ID appears as an available column.
-   [ ] Selected columns are respected in both Excel and PDF.
-   [ ] Active filters are respected in both formats.
-   [ ] Team IDs and member details are not mixed between teams.
-   [ ] Every expected team and member appears exactly once.
-   [ ] Excel has one truly blank row between teams where the grouped
    layout is used.
-   [ ] No blank rows appear between members of the same team.
-   [ ] PDF headings repeat when a report continues to another page.

### Database and startup

-   [ ] Existing event and registration data remain after restarting.
-   [ ] The application starts from the documented commands.
-   [ ] The backend health endpoint responds.
-   [ ] The college name and environment settings are correct.

------------------------------------------------------------------------

## 21. Current Scope and Important Limitations

The project README states that **certificate generation,
certificate-template uploads, and certificate downloads are not part of
this workflow**. The application focuses on event management, public
registration, registration data, reports, and registration receipts.

The system should display only information actually configured or saved.
For example, it should not invent payment amounts, taxes, or payment
confirmation if payment data is not part of the registration process.

The documentation describes intended features and workflows. A feature
should be considered fully verified only after testing it in the exact
copy of the project being used. Source changes, dependency problems,
environment settings, and database differences can affect the behavior
of a local installation.

------------------------------------------------------------------------

## 22. Summary

CampusEvents brings the main college-event tasks into one web
application:

1.  Administrators configure events and their registration forms.
2.  Visitors browse events and register without creating a student
    account.
3.  The backend validates the submitted information.
4.  SQLite stores registrations, answers, and team-member information.
5.  Participants receive a registration reference and PDF receipt.
6.  Administrators review records and export selected data to Excel or
    PDF.
7.  Team IDs connect team registrations to their member rows so that
    team data can be reviewed accurately.

The main benefit is that event information, participant registration,
team membership, and reporting are managed through one consistent
workflow instead of being maintained separately by hand.
