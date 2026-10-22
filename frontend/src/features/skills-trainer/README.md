# Skills Trainer (Lab Studio)

Frontend feature for AI-powered practical skills training. Students perform physics/chemistry practicals through an interactive 2D bench or a guided lab procedure.

## Requirements

1. **2D SVG bench** – drag apparatus, hang masses, read scales, record values.
2. **Action events only** – every interaction emits an action event (`drag_start`, `drop`, `nudge`, `read`, `record`, `plot`, `submit_gradient`, `submit_mass`, `action`, `reset`). The UI never decides correctness; events are forwarded to the assessment engine, which is the sole judge. Step completion only reflects which actions have happened.
3. **i18n** – the step panel and all lab strings come from `shared/i18n/skillsTrainerStrings.ts` (English and Sinhala, switched via `LanguageContext`).
4. **Design** – Apple-like, uses the shared design tokens (`canvas`, `elevated`, `accent`, `line`, `shadow-soft`) and supports light/dark.

## Practical 1: Mass of a body using the principle of moments

Apparatus: metre ruler, knife edge on a wooden block, 50 g known weight, stone (unknown mass).

Flow: place ruler on knife edge → hang known mass and unknown mass on opposite sides → slide `y` until the ruler balances for a chosen `x` → read → record (6 readings) → plot `y` against `x` → enter gradient → enter `m = gradient × m0`.

## Structure

```
components/   MomentsBench (SVG), StepPanel, ReadingsTable, GraphPanel, ActionLog
hooks/        useLabSession (event log + emit), useMomentsLab (bench state)
services/     labEventBus (event types, emitter)
pages/        SkillsTrainerPage
```

## Action event shape

```ts
{ id, sessionId, labId, type, payload, at /* ISO time */ }
```

Events are available through `labEventBus.subscribe()`; sending them to the backend is a later step.

## TODO

- [x] Moments practical UI
- [x] Steam-distillation practical (Experiment 42) as an interactive virtual bench: drag-and-drop glassware, heater/tap controls, timed simulation across Week 01/02 (Sinhala strings pending)
- [ ] Send events to the backend assessment API
- [ ] More practicals (registry of lab definitions)
