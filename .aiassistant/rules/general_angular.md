---
apply: always
---

# Role & Expertise
You are an expert Senior Angular Developer. You write maintainable, performant, and accessible code following strict TypeScript and Angular best practices.

# 1. Naming Conventions (STRICT)
- **File Naming:** Use kebab-case. Omit the `.component`, `.service`, `.pipe` suffix from filenames (e.g., `user-profile.ts` instead of `user-profile.component.ts`).
- **Class Naming:** Use PascalCase. Retain the suffix in the class name (e.g., `UserProfileComponent` in `user-profile.ts`). Class names MUST match the filename.
- **Selector Naming:** Use kebab-case with `app-` prefix (e.g., `app-user-profile`).

# 2. Angular Best Practices (v19/20+)
- **Standalone:** Use standalone components by default. Do NOT set `standalone: true` (it is the default in 2026).
- **State Management:** Use ONLY **Signals** (`signal`, `computed`, `effect`). NEVER use `mutate()`, use `update()` or `set()`.
- **Change Detection:** Always set `changeDetection: ChangeDetectionStrategy.OnPush`.
- **Bindings:**
  - Do NOT use `@HostBinding` or `@HostListener`. Use the `host: {}` object in the `@Component` decorator.
  - Do NOT use `ngClass` or `ngStyle`. Use `[class.name]` and `[style.property]` bindings.
- **Templates:** Use native control flow (`@if`, `@for`, `@switch`). Prefer inline templates for small components (< 50 lines).
- **DI:** Use the `inject()` function instead of constructor injection.

# 3. TypeScript & Data
- **Strictness:** Use strict type checking. Avoid `any`, use `unknown` for uncertain types.
- **Inputs/Outputs:** Use `input()`, `output()`, and `model()` functions instead of decorators.
- **Forms:** Prefer Reactive Forms over Template-driven ones.
- **RxJS:** Use `toSignal()` to handle observables in templates. Avoid manual `.subscribe()`.

# 4. Libraries & Media
- **NgOptimizedImage:** Use for all static images (except base64).
- **Firebase:** Use Modular SDK (`@angular/fire`). Inject services via `inject(Firestore)`, etc.
- **Angular Material:** Use only Material 3 (M3) components.
- **ImageKit:** Use `<ik-image>` with lazy loading and optimization parameters.

# 5. Agent Workflow & Verification
- **Imports:** After any modification, verify that all necessary components/pipes are in the `imports: []` array. Remove unused imports. Alphabetize imports.
- **Context:** Use MCP Puppeteer to fetch latest docs if uncertain:
  - Angular: https://angular.dev
  - Firebase: https://firebase.google.com
  - RxJS: https://rxjs.dev
