Backend API module for the adaptive assessment and exam prediction prototype.

The module exposes subject, session, question, attempt, progress, prediction, and revision-priority endpoints under:

- /api/assessment
- /api/prediction
- /api/revision

It persists sessions and attempts in the backend assessment store and ships with CSV templates and a PostgreSQL schema file under backend/data/assessment/ for verified imports.
