# build-page

Generate a page file that composes a given set of components and wires up an API call.

## Invocation

```
/build-page --client <client> --persona <persona> --page <PageName> --components <ComponentA,ComponentB,...> --api <fetchFunctionName>
```

**Examples:**
```
/build-page --client nfcu --persona supervisor --page AgentObservabilityPage --components SystemHealthOverview,ComponentFleetTable,ComponentDetailPanel,ComponentPicker --api fetchGeneric
/build-page --client nfcu --persona supervisor --page PrioritySignalsPage --components HeroSignal,SignalCard,ExecutivePosture,BoardRecommendation --api fetchSignals
```

## What this skill does

Generates a typed React page at `src/pages/clients/<client>/<persona>/<PageName>.tsx`. The page:
- Calls the given API function on mount
- Holds the response in `useState`
- Passes data slices down to each component via their `data` prop
- Wraps content in `PageWithChat`

## Steps

### 1. Verify and read the existing component files

For each component in `--components`, check that its migrated file exists:
```
src/components/<ComponentName>.tsx
```

**If any component file is missing — stop immediately.** Do not generate the page. Report which components are missing and tell the user to migrate them first with `/migrate-component` before running this skill again.

For each file that exists, extract:
- The exported `<ComponentName>Data` interface and its fields
- Whether the component takes a `data` prop, `children`, or no props

This tells you what data shape each component expects so the page can pass the right slice.

### 2. Determine the API import

The `--api` value is a function name exported from `src/api/<client>Api.ts`. Import it from there.

### 3. Generate the page file

Apply these rules:

#### 3a. Data fetching pattern

Use `useState` + `useEffect` with an inflight-request guard (deduplicate concurrent mounts).

**Single-component pages** (one component in `--components`): send one item in the category array and use `.find()` to extract the slice:

```tsx
let inflightRequest: Promise<PageDataType | null> | null = null

function fetchPageData(): Promise<PageDataType | null> {
  if (inflightRequest) return inflightRequest
  inflightRequest = <apiFunction>('<persona>', [{ component: '<ComponentName>', variant: null }])
    .then(res => {
      const raw = (res.visualization as { type: string; data: unknown }[])
        ?.find(v => v.type === '<ComponentName>')?.data as PageDataType | undefined
      return raw ?? null
    })
    .catch(() => null)
    .finally(() => { inflightRequest = null })
  return inflightRequest
}
```

**Multi-component pages** (two or more components in `--components`): send ALL components in the category array and use `.reduce()` to assemble the page data object from each visualization slice:

```tsx
let inflightRequest: Promise<PageDataType | null> | null = null

function fetchPageData(): Promise<PageDataType | null> {
  if (inflightRequest) return inflightRequest
  inflightRequest = <apiFunction>('<persona>', [
      { component: '<ComponentA>', variant: null },
      { component: '<ComponentB>', variant: null },
      { component: '<ComponentC>', variant: null },
    ])
    .then(res => {
      const raw = (res.visualization as { type: string; data: unknown }[])
        ?.reduce((acc, v) => {
          if (v.type === '<ComponentA>') acc.<fieldA> = v.data as <ComponentA>Data
          if (v.type === '<ComponentB>') acc.<fieldB> = v.data as <ComponentB>Data
          if (v.type === '<ComponentC>') acc.<fieldC> = v.data as <ComponentC>Data
          return acc
        }, {} as PageDataType) as PageDataType | undefined
      return raw ?? null
    })
    .catch(() => null)
    .finally(() => { inflightRequest = null })
  return inflightRequest
}
```

Never send only the first component when multiple are needed — the backend only returns data for components it receives in the request.

#### 3b. Loading state

While data is null, render `PageWithChat` with an empty `<div />` as children — never a spinner or skeleton text.

#### 3c. PageWithChat wrapper

Always wrap the page content in `PageWithChat`:

```tsx
import PageWithChat from '@/components/chat/PageWithChat'

<PageWithChat persona="<persona>" chips={CHIPS} placeholder="Ask about …">
  {/* page content */}
</PageWithChat>
```

`CHIPS` is a `const` array of 4 placeholder chip strings relevant to the page topic. Use the page name and component names to infer sensible chip text — these are placeholder values the developer will replace.

#### 3d. Layout

Compose the components inside a `<div className="py-8 px-4 sm:px-6 lg:px-8 max-w-6xl">`. Do not add a page-level title or subtitle — components own their own headings.

Pass each component the appropriate slice of the fetched data object via its `data` prop. If the exact field mapping cannot be inferred from the data interface alone, pass the whole data object and add a `{/* TODO: pass the correct slice */}` comment on that line only.

#### 3e. Imports

```tsx
import { useEffect, useState } from 'react'
import { <apiFunction> } from '@/api/<client>Api'
import <ComponentA> from '@/components/<ComponentA>'
import <ComponentB> from '@/components/<ComponentB>'
// ... one import per component
import PageWithChat from '@/components/chat/PageWithChat'
```

Do not import types-only files. Do not import from Ultra paths.

#### 3f. TypeScript

Define a `PageDataType` interface at the top of the file that represents the expected shape of the API response data, inferred from the component data interfaces. If the shape is unknown, use `Record<string, unknown>`.

### 4. Check for existing file

```bash
find /Users/charansaikondapaneni/Desktop/Ultra-v2.0/src/pages/clients/<client>/<persona> -name "<PageName>.tsx"
```

If it exists, inform the user and ask whether to overwrite. Only proceed if confirmed.

### 5. Write the file

Write to:
```
src/pages/clients/<client>/<persona>/<PageName>.tsx
```

Create the directory if it does not exist.

### 6. Register the page

#### 6a. Determine the correct registry key for the client

**Critical:** The registry is keyed by the JWT `clientId`, which comes from `src/config-db/clients.json`. The `--client` argument (e.g. `newfold-digital`) is the folder name, not necessarily the registry key. These often differ.

Before writing any registry entry, read the client's `id` from config-db:
```bash
grep -A3 '"<client>"' /Users/charansaikondapaneni/Desktop/Ultra-v2.0/src/config-db/clients.json
# or search by name if the id key doesn't match the folder:
grep -B1 -A5 "newfold\|<client>" /Users/charansaikondapaneni/Desktop/Ultra-v2.0/src/config-db/clients.json
```

Use the `"id"` field value as the registry key — not the folder name, not the `--client` argument.

**Known mappings (fast path):**

| `--client` folder | `clients.json` id (registry key) |
|---|---|
| `rshs` | `riverside_health` |
| `newfold-digital` | `newfold_digital` |
| `ussfcu` | `ussfcu` |
| `nfcu` | `nfcu` |
| `penfed` | `penfed` |

If the client is not in this table, always read clients.json before registering.

The page file lives at `src/pages/clients/<folder>/` (using the folder name), but the registry entry must use the `clients.json` id as the top-level key.

#### 6b. Check and update resolvePersona overrides

`PersonaPageDispatcher` does `registry[clientId][resolvePersona(activePersonaId)][path]`. `resolvePersona` strips the client prefix from the persona ID: `newfold_director` → `director`, `newfold_ops` → `ops`. The registry persona key must match what `resolvePersona` returns.

After step 6a, check whether the persona's short name (the registry key — e.g. `marisol`, `sofia`) matches what `resolvePersona` would produce by default:

- Default strip rule: `newfold_director` → `director` (strips everything up to and including the first `_`)
- If the registry key differs from the stripped result, add an override to `src/utils/resolvePersona.ts`:

```ts
const OVERRIDES: Record<string, string> = {
  // existing entries...
  newfold_director: 'marisol',
  newfold_ops:      'sofia',
}
```

**When an override is needed:** whenever the persona's display name (e.g. `marisol`) does not equal the suffix of their config-db ID after stripping the client prefix (e.g. `director`).

**Known overrides already in place:**

| config-db persona ID | resolvePersona result |
|---|---|
| `ussfcu_finance` | `fiona` |
| `ussfcu_evelyn` | `evelyn` |
| `ussfcu_ceo` | `timothy` |
| `ussfcu_cfo` | `sylvia` |
| `ussfcu_nadia` | `nadia` |
| `nfcu_platform_admin` | `platform-admin` |
| `newfold_director` | `marisol` |
| `newfold_ops` | `sofia` |

#### 6c. Add the import and registry entry

Add an import at the top under the client's import block:
```ts
import <Persona><PageName> from './clients/<client-folder>/<persona>/<PageName>'
```

Add the path entry under `registry.<clients-json-id>.<persona>`:
```ts
'/<path>': <Persona><PageName>,
```

The path key should match the nav path used in the client's config. If unknown, derive it from the page name (e.g. `AgentObservabilityPage` → `/agent-observability`).

### 7. Report

- **Output:** the file written
- **Registered:** the path added to `src/pages/registry.ts`
- **API call:** function used and component name passed as the category key
- **Components composed:** list with their data prop mapping (or TODO note)
- **Notes:** any fields that could not be inferred and need manual wiring
