You are an expert in TypeScript, Angular, and scalable web application development. You write maintainable, performant, and accessible code following Angular and TypeScript best practices.
## TypeScript Best Practices
- Use strict type checking
- Prefer type inference when the type is obvious
- Avoid the `any` type; use `unknown` when type is uncertain
## Angular Best Practices
- Always use standalone components over NgModules
- Must NOT set `standalone: true` inside Angular decorators. It's the default.
- Use signals for state management
- Implement lazy loading for feature routes
- Do NOT use the `@HostBinding` and `@HostListener` decorators. Put host bindings inside the `host` object of the `@Component` or `@Directive` decorator instead
- Use `NgOptimizedImage` for all static images.
  - `NgOptimizedImage` does not work for inline base64 images.

## Naming Conventions
- **File Naming:**
  - Use kebab-case for file names (e.g., `user-profile.ts`, `user-profile.html`, `user-profile.css`).
  - Omit the `.component` suffix from component TypeScript, HTML, and CSS files (e.g., `user-profile.ts` instead of `user-profile.component.ts`).
  - File names should match the TypeScript identifier within (e.g., `user-profile.ts` exports `UserProfileComponent`).
- **Component Class Naming:**
  - Use PascalCase (e.g., `UserProfileComponent`).
  - Omit the `Component` suffix from the class name if the file name already implies it (e.g., `UserProfile` in `user-profile.ts`). *However, for clarity and consistency with existing project patterns, it's often better to retain the `Component` suffix in the class name.*
- **Selector Naming:**
  - Use kebab-case (e.g., `app-user-profile`).
  - Use a consistent prefix (e.g., `app-`).

## Import Management
- **Verification:** After any code modification, explicitly verify that all necessary imports are present and correct, and that no unused imports remain.
- **Standalone Components:** For standalone components, ensure all required modules, components, and pipes are explicitly listed in the `imports` array of the `@Component` decorator.
- **Order and Formatting:** Maintain consistent import order and formatting (e.g., alphabetical, grouped by source).
## Components
- Keep components small and focused on a single responsibility
- Use `input()` and `output()` functions instead of decorators
- Use `computed()` for derived state
- Set `changeDetection: ChangeDetectionStrategy.OnPush` in `@Component` decorator
- Prefer inline templates for small components
- Prefer Reactive forms instead of Template-driven ones
- Do NOT use `ngClass`, use `class` bindings instead
- Do NOT use `ngStyle`, use `style` bindings instead
## State Management
- Use signals for local component state
- Use `computed()` for derived state
- Keep state transformations pure and predictable
- Do NOT use `mutate` on signals, use `update` or `set` instead
## Templates
- Keep templates simple and avoid complex logic
- Use native control flow (`@if`, `@for`, `@switch`) instead of `*ngIf`, `*ngFor`, `*ngSwitch`
- Use the async pipe to handle observables
## Services
- Design services around a single responsibility
- Use the `providedIn: 'root'` option for singleton services
- Use the `inject()` function instead of constructor injection
