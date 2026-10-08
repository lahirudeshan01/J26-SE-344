# Contributing

## Branch naming

- Features: `feature/<component>-<short-name>`
- Fixes: `fix/<component>-<short-name>`
- Documentation: `docs/<short-name>`

Use the component name where applicable: `skills-trainer`, `assessment-engine`, `content-engine`, or `digital-twin`.

## Commit messages

Use the Conventional Commits format: `<type>(<scope>): <description>`, for example `feat(skills-trainer): add health endpoint`. Common types include `feat`, `fix`, `docs`, `refactor`, `test`, and `chore`.

## Pull requests

- Open a pull request for every change and request at least one reviewer.
- `main` is protected. Direct pushes to `main` are not allowed.
- Cross-component changes must update the relevant documentation in `docs/api-contracts/`.
