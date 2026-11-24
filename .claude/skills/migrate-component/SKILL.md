# migrate-component

Find a component in the Ultra codebase and rewrite it to this app's conventions, then place it in `src/components/`.

## Invocation

```
/migrate-component --persona <persona> --client <client> --page <page label> --component <ComponentName>
```

**Examples:**
```
/migrate-component --persona david --client nfcu --page Ask the AI --component BriefingPanel
/migrate-component --persona timothy --client ussfcu --page Business Performance --component KpiCard
```

## What this skill does

Finds the named component in the Ultra codebase (using the persona + client + page label to narrow the search), reads its source, rewrites it to this app's conventions, and writes the output file to `src/components/<ComponentName>.tsx`.

**Core principle:** Ultra components fetch their own data, read from context, or receive many individual props. This app does none of that. Every component receives one `data` object and is responsible for unwrapping it. Extra fields sent in `data` are silently ignored. Missing optional fields must be handled gracefully (nullish coalescing, conditional rendering). The page — not the component — is responsible for fetching data and passing the right slice down.

**View components in Ultra:** Ultra often wraps multiple components inside a single `*View` component (e.g. `BusinessPerformanceView`) which is then used on the page. **Do not migrate the View.** Migrate each individual component that the View composes. Those components are used directly on the page in this app.

## Steps

### 0. Resolve the persona short name to a UltraMaster folder

The `--persona` argument is the **short name** used in this app (e.g. `timothy`, `fiona`, `david`). UltraMaster folder names are often different. Resolve the folder before reading any manifest.

**Known mappings (use as a fast path):**

| Client | Short name | Folder |
|--------|------------|--------|
| ussfcu | fiona      | finance |
| ussfcu | timothy    | ceo |
| ussfcu | sylvia     | cfo |
| ussfcu | evelyn     | evelyn |
| ussfcu | nadia      | nadia |
| nfcu   | david      | agent |
| nfcu   | derek      | analyst |
| nfcu   | marcus     | director |
| nfcu   | elena      | member |
| nfcu   | daniel     | platform-admin |
| nfcu   | priya      | supervisor |
| nfcu   | janelle    | workforce |
| penfed | sowmya     | capmarkets |
| esfcu  | girado     | ceo |
| esfcu  | renata     | cro |

If the short name matches a folder name exactly (e.g. `evelyn`, `nadia`), use it directly. If the persona is not in this table, list all folders for the client, read each manifest, extract the first word of `identity.name` lowercased, and match. Report if no match is found.

Use the resolved folder as `<persona_folder>` for all manifest paths below.

### 1. Locate the component file in Ultra

Search the Ultra tree for the component file:
```bash
find /Users/charansaikondapaneni/Desktop/UltraMaster/app/src -name "<ComponentName>.tsx" | grep -v node_modules
```

If multiple matches exist, use the persona/client/page context to pick the most relevant one (prefer paths that match the client or persona name, or that are referenced from the page's manifest).

**If the component is a View (`*View.tsx`):** Do not migrate the View itself. Read its file to identify which individual components it composes, then migrate those instead. Report to the user which individual components were found and confirm which one to proceed with.

**If the target component is inlined inside a View file** (a named function or JSX section defined inside the View, not its own file): locate the View file by reading the manifest at:
```
/Users/charansaikondapaneni/Desktop/UltraMaster/app/src/markets/financial-services/clients/<client>/personas/<persona_folder>/manifest.tsx
```
Find the View component for the given `--page`, then read that View file and extract the named function or inline JSX section.

**If the component is not found anywhere:** Report it and stop. Do not guess or fabricate a component.

### 2. Read the component source

Read the full file (or the extracted section for inlined components). Understand:
- What data it consumes — props, imported JSON files, context reads, hardcoded constants
- What it renders visually — the full visual structure
- Which sub-components it imports and renders locally
- Which library components it uses (Recharts, framer-motion, lucide-react)
- How Ultra passes data to it (individual props, a context, spreading a large object, inline constants)

### 3. Rewrite to this app's conventions

Apply every rule below. Do not skip any.

#### 3a. Single `data` object prop

The component must accept **exactly one prop named `data`**, typed as a named exported interface. No individual props. No context reads. No prop spreading.

```tsx
export interface <ComponentName>Data {
  field1: string
  field2?: number       // optional — component must handle undefined gracefully
  items: ItemType[]
}

export default function <ComponentName>({ data }: { data: <ComponentName>Data }) {
```

**Handling missing data:** Any field that may not always be provided must be marked `?` in the interface. The component must guard against it with optional chaining, nullish coalescing, or conditional rendering — never assume it is present.

```tsx
// ✓ correct
{data.subtitle && <p>{data.subtitle}</p>}
const count = data.count ?? 0

// ✗ wrong — crashes when field is absent
<p>{data.subtitle}</p>
const count = data.count
```

**Handling extra data:** The interface only declares fields the component actually uses. Extra fields the API sends are automatically ignored — do not add `[key: string]: unknown` just to absorb them.

**Exception:** purely static components with no data (e.g. `BoardRecommendation`) take no props at all.

#### 3b. No static data

Remove everything that belongs to the data layer:
- No imported JSON files
- No hardcoded strings, amounts, dates, labels, counts, percentages that vary per persona or over time
- No inline constant arrays of data items (rows, cards, chips, etc.)
- Replace every such value with a field on the `data` interface

Hardcoded UI constants are fine and must stay: Tailwind classes, icon name mappings, animation durations, color tokens, layout constants.

#### 3c. TypeScript — strict and explicit

- Type every interface field explicitly — no `any`
- Mark fields `?` when they may be absent
- For list items, define a named sub-interface (e.g. `SignalItem`, `KpiItem`) rather than inlining `{ label: string; value: string }[]`
- Export the data interface and any sub-interfaces that pages or other components will need

#### 3d. Tailwind CSS v4

- Use only Tailwind utility classes and CSS variables from the design system
- CSS variables in use: `--color-brand`, `--color-text`, `--color-text-muted`, `--color-surface`, `--color-border-subtle`
- Do not use arbitrary `style={{}}` values unless they come from the `data` object (e.g. a dynamic width percentage)
- Do not import any CSS files

#### 3e. Imports

Keep only what is used. Allowed external imports:
- `react` (`useState`, `useEffect`, etc.)
- `framer-motion` (`motion`)
- `lucide-react` (icons)
- `recharts` (chart primitives)

Local imports from this app (use `@/` alias):
- Other migrated components: `@/components/<Name>`

**Do NOT import from Ultra paths:** `@core/`, `@/data/`, `@/hooks/`, `@/context/`, or any path under UltraMaster.

#### 3f. No View wrappers

If the Ultra source renders a `*View` component or wraps content in a layout shell that includes navigation, sidebars, or a chat panel — strip all of that. Migrate only the visual content component. The page in this app handles layout via `PageWithChat`.

#### 3g. No comments except the non-obvious

Remove all existing comments. Only add a comment if the WHY is non-obvious (a subtle invariant, a workaround for a specific behavior). Never describe what the code does.

### 4. Check for existing implementations

Before writing, search for any file in this app that might already implement the same component:

```bash
find /Users/charansaikondapaneni/Desktop/Ultra-v2.0/src -name "<ComponentName>.tsx" | grep -v node_modules
grep -r "export default function <ComponentName>" /Users/charansaikondapaneni/Desktop/Ultra-v2.0/src --include="*.tsx" -l
```

If a match is found:
- Read it and compare it to the Ultra source
- If **functionally equivalent** (same visual output, same data shape after accounting for naming): **stop** — report the path and ask if the user wants to overwrite
- If **different** (different interface, missing fields, different rendering): report the conflict — what exists vs what Ultra has — and ask whether to overwrite, merge, or skip
- Only continue to step 5 if the user explicitly confirms

### 5. Write the output file

Write the rewritten component to:
```
src/components/<ComponentName>.tsx
```

### 6. Report

After writing, print a short summary:
- **Source:** the Ultra file (or View + extracted section) the component was taken from
- **Output:** the file written (or "skipped — already exists at `<path>`")
- **Duplicate check:** what was found (or "none")
- **Data interface:** list every top-level field of `<ComponentName>Data` with its type and whether it is optional
- **Sub-components used:** any local components imported
- **Notes:** everything removed (JSON imports, context reads, hardcoded data, View wrappers, individual props) and any assumption made about field names or types
