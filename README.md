# NeuroLearn AI

NeuroLearn AI is an AI-powered e-learning platform for Sri Lankan Advanced Level students, designed to support Sinhala-medium learning through adaptive assessments, curriculum-aware content, practical skills training, and personalized student insights.

## Components

- **skills-trainer** — AI Virtual Practical Skills Trainer
- **assessment-engine** — Adaptive Assessment and Exam Prediction Engine
- **content-engine** — Curriculum-Aware Content Generation Engine
- **digital-twin** — Student Digital Twin

## Folder overview

- `frontend/` — React, Vite, and TypeScript user interface
- `backend/` — Express API gateway and component modules
- `ai-services/` — FastAPI service for each AI component
- `docs/` — Architecture, API contracts, proposal, and team documentation
- `.github/` — Code ownership, pull request template, and CI workflows

## Run the system

Copy `.env.example` to `.env`, then start the development stack with:

```sh
docker compose up --build
```

## Branching

Use `feature/<component>-<short-name>`, `fix/<component>-<short-name>`, or `docs/<short-name>` branches. Open a pull request for changes; do not push directly to `main`.

## Component owners

| Component | Owner |
| --- | --- |
| skills-trainer | Member 1 |
| assessment-engine | Member 2 |
| content-engine | Member 3 |
| digital-twin | Member 4 |
