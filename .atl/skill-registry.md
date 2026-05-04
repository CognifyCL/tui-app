# Skill Registry — kinetic-console

## Project Standards (auto-resolved)

### Typography Rules (mobile-app)
- **Primary Rule**: Use `fontFamily: MONO` for ALL text elements in React Native. No system UI fonts.
- **Labels**: All labels MUST be `UPPERCASE` with `letterSpacing: 1.5` or higher.
- **Headers**: Uppercase headers MUST have `letterSpacing: 2` or higher.

### Architecture Rules (mobile-app)
- **Context Access**: ONLY screens (`screens/`) are allowed to consume `TerminalContext` or custom hooks.
- **Pure Components**: Components in `components/` MUST be pure presentational units (data via props only).
- **Navigation**: `AppNavigator.js` should use standard theme constants where possible.

### Proxy Server Standards
- **Configuration**: ALL configuration (PORT, PATHS, ENV) MUST be imported from `../config/index.js`.
- **No Direct Env**: Never access `process.env` directly within service files (`services/*.service.js`).
- **Singletons**: All services must be exported as instantiated singletons.

## User Skills (Trigger Map)

| Skill | Pattern | Trigger Context |
|---|---|---|
| app-modularization | `mobile-app/**` | React Native architectural refactoring |
| proxy-logic | `proxy-server/**` | Proxy service implementation or refactoring |
| go-testing | `**/*.go` | Go testing (Bubbletea TUI) |
| sdd-apply | `**/*` | Implementation of SDD tasks |
| sdd-verify | `**/*` | Verification of changes against specs |
