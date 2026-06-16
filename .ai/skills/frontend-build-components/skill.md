---
name: frontend-build-components
description: Step-by-step guide for building front-end React components and pages in this Next.js + Tailwind app. Use when adding a UI primitive, a shared component, a feature component, or a frontend page (anything under src/components or src/app/[locale]/(frontend)). Do NOT use for Payload admin views - use payload-build-modules instead.
---

# Front-end — building components and pages

Front-end code lives under `src/components/` (React components) and `src/app/[locale]/(frontend)/` (routed pages). Styling is Tailwind with design tokens; every reusable class string is centralised in `src/lib/class-names.ts`. Text goes through `next-intl`.

The single most important decision is **where a component belongs**. Get that right and the rest follows.

---

## Where does it go? (decision tree)

```
Is it a generic primitive with ZERO domain knowledge
(Button, Input, Alert, Field, Logo, PageHeader)?
        └── yes → src/components/ui/{name}/

Is it app-specific but shared across unrelated features
(LogoutButton)?
        └── yes → src/components/common/{name}/

Is it tied to one domain feature (workout, plan, ...)?
        └── yes → src/components/{domain}/{feature}/

Is it a routed screen?
        └── yes → src/app/[locale]/(frontend)/{route}/page.tsx
```

Rule of thumb: if it imports a domain type (`TExercise`, `SetLog`, `MetricField`) or a domain helper (`@/lib/metrics`), it does **not** belong in `ui/`.

---

## Structure per location

### `ui/` and `common/` — one folder + barrel per component

```
src/components/ui/{name}/
├── {name}.tsx        # the component
└── index.ts          # export { Name } from './{name}'
```

Real examples: `ui/button`, `ui/input` (exports `Input` and `Select`), `ui/field`, `ui/page-header`, `common/logout-button`.

### `{domain}/{feature}/` — main file + `components/` + hooks

```
src/components/{domain}/{feature}/
├── {feature}.tsx              # main component (composer / orchestrator)
├── index.ts                  # export { Feature } from './{feature}'
├── hooks/                    # (optional) feature-level hooks, one file each
│   └── use-{feature}-{type}.ts
└── components/                # every sub-component gets its own folder + barrel
    └── {sub-component}/
        ├── {sub-component}.tsx
        └── index.ts
```

Real example — `workout/exercise-card/`:
```
exercise-card.tsx              # composer: header + meta + list + actions
index.ts
components/
├── exercise-header/
│   ├── exercise-header.tsx
│   └── index.ts
├── add-set-actions/
│   ├── add-set-actions.tsx
│   └── index.ts
├── series-list/
│   ├── series-list.tsx
│   └── index.ts
└── meta-line/
    ├── meta-line.tsx
    └── index.ts
```

Real example — `workout/workout-plans/`:
```
workout-plans.tsx
index.ts
hooks/use-workout-selection.ts
components/
├── active-context-banner/
│   ├── active-context-banner.tsx
│   └── index.ts
└── workout-pickers/            # one folder may export a few closely-related components
    ├── workout-pickers.tsx     # MicrocyclePicker, WorkoutPicker
    └── index.ts
```

**Rule:** every React component gets its own kebab-case folder with an `index.ts` barrel - in `ui/`, in `common/`, and inside a feature's `components/`. The only `.tsx` allowed directly at a feature root is the `{feature}.tsx` entry itself. No flat sub-component files. (Mirrors `payload-build-modules`: one folder per component.)

Sub-component-specific hooks go in `components/{sub-component}/hooks/`; hooks for the feature entry stay in `{feature}/hooks/`.

---

## Steps

### 1. Pick the location (decision tree above) and create the folder

`ui`/`common`: `{name}/{name}.tsx` + `index.ts`. Feature: add `components/{name}/{name}.tsx` + `index.ts` in the existing feature folder, or a new `{feature}/` folder with `{feature}.tsx` + `index.ts`.

### 2. Style via `class-names.ts`, not inline strings

Reusable class strings live in `src/lib/class-names.ts`. Compose with `joinClasses`. Prefer a typed `variant` prop over passing class strings around.

```tsx
// src/components/ui/button/button.tsx
import { joinClasses, primaryButtonClass, secondaryButtonClass } from '@/lib/class-names'

type Variant = 'primary' | 'secondary'
const variantClass: Record<Variant, string> = {
  primary: primaryButtonClass,
  secondary: secondaryButtonClass,
}

export function Button({ className, variant = 'primary', ...props }: ButtonProps) {
  return <button className={joinClasses(variantClass[variant], className)} {...props} />
}
```

When a class string is repeated in 2+ places, promote it to `class-names.ts`. When a layout/markup block repeats, extract a component instead.

### 3. Server page → loader → client component

Pages are **server components**. They fetch through a loader in `src/loaders/`, then pass plain data to client components. Never query inside the JSX.

```tsx
// src/app/[locale]/(frontend)/page.tsx  (server)
import { getTranslations } from 'next-intl/server'
import { loadTrainingPlans } from '@/loaders/training-plan-loader'
import { PageContainer } from '@/components/ui/page-container'
import { PageHeader } from '@/components/ui/page-header'
import { WorkoutPlans } from '@/components/workout/workout-plans'

export default async function HomePage() {
  const t = await getTranslations('home')
  const result = await loadTrainingPlans()
  if (!result.user) redirect('/login')

  return (
    <PageContainer>
      <PageHeader title={t('greeting', { name: result.user.name ?? '' })} right={<LogoutButton />} />
      {result.plans.length > 0 ? (
        <WorkoutPlans plans={result.plans} />
      ) : (
        <div className="py-10 text-center text-sm text-ui-fg-muted">{t('noPlans')}</div>
      )}
    </PageContainer>
  )
}
```

Loaders are plain async functions returning a typed result (e.g. a discriminated union for auth state). Reuse `PageContainer` / `PageHeader` for every page shell.

### 4. Client components own UI state; mutations go through `sdk`

```tsx
'use client'
import { useState } from 'react'
```

A component is `'use client'` only when it needs state, effects, or event handlers. Data mutations use `@/lib/sdk`. When a component has complex state or 2+ mutations, extract a hook (step 5).

### 5. Extract a hook when state/mutations get heavy

Place it in `hooks/` inside the feature folder: `components/{domain}/{feature}/hooks/use-{feature}-{type}.ts`.

```ts
// workout/workout-tracker/hooks/use-workout-session.ts
'use client'
export function useWorkoutSession(workout: TWorkout, opts: { readOnly?: boolean; showResults?: boolean }) {
  // session state, derived selectors, addSet/updateSet/deleteSet
  return { session, error, addSet, updateSet, deleteSet /* ... */ }
}
```

Trigger: extract a hook when there are >= 2 mutations sharing loading/error state, or non-trivial derived state. A single piece of `useState` stays inline.

### 6. Text and dates through `next-intl`

- Client component: `const t = useTranslations('namespace')`.
- Server component: `const t = await getTranslations('namespace')`; dates via `const format = await getFormatter()` (never hardcode a locale like `'pl-PL'`).
- Add keys to BOTH `messages/pl.json` and `messages/en.json`.
- Plain ASCII in UI strings (see the `code-style` skill).

---

## Key rules

| Rule | Detail |
|---|---|
| Location first | `ui/` (generic) vs `common/` (shared app) vs `{domain}/{feature}/` (domain) |
| No domain deps in `ui/` | If it imports a domain type/helper, it is not a UI primitive |
| One folder + barrel per component | `{name}/{name}.tsx` + `index.ts` everywhere - `ui/`, `common/`, and feature `components/{name}/` |
| Only `{feature}.tsx` at a feature root | All sub-components live under `{feature}/components/{name}/` - never a flat sub-component `.tsx` |
| Classes in `class-names.ts` | Promote any class string reused 2+ times; use `joinClasses` + `variant` props |
| Pages = server + loader | Fetch in `src/loaders/`, render with `PageContainer`/`PageHeader`; never query in JSX |
| `'use client'` only when needed | State, effects, handlers - otherwise keep it a server component |
| Hooks inside the feature | `{feature}/hooks/use-*.ts`, not a global hooks folder |
| i18n both locales | Every key in `messages/pl.json` AND `messages/en.json`; dates via `getFormatter` |

---

## Naming conventions

| What | Convention | Example |
|---|---|---|
| Component folder / file | `kebab-case` | `page-header/`, `exercise-header.tsx` |
| Exported component | `PascalCase` | `PageHeader`, `ExerciseCard` |
| Barrel | `index.ts` re-export | `export { Field } from './field'` |
| Hook file / function | `use-{feature}-{type}.ts` / `use{Feature}{Type}` | `use-workout-session.ts` / `useWorkoutSession` |
| Loader function | `load{Feature}` camelCase | `loadTrainingPlans` |
| Variant prop | `variant` union, mapped to class via `Record` | `variant: 'primary' \| 'secondary'` |
| Class-name export | `{name}Class` / `{name}Class(arg)` | `primaryButtonClass`, `statusBadgeClass(status)` |
