# list-components

List and classify every component used on a given page from the Ultra codebase.

## Invocation

```
/list-components --persona <persona> --client <client> --page <PageName>
```

**Examples:**
```
/list-components --persona timothy --client ussfcu --page PrioritySignalsPage
/list-components --persona evelyn --client ussfcu --page ComplianceQueryPage
```

## What this skill does

Given a persona, client, and page name, locate that page in the Ultra codebase, read it and all its direct imports, then produce a classified component list.

## Steps

### 0. Resolve the persona short name to a UltraMaster folder

The `--persona` argument is the **short name** used in this app (e.g. `timothy`, `fiona`, `priya`). UltraMaster folder names are often different (e.g. `ceo`, `finance`, `supervisor`). You must resolve the folder before reading any manifest.

```bash
ls /Users/charansaikondapaneni/Desktop/UltraMaster/app/src/markets/financial-services/clients/<client>/personas/
```

For each folder returned, read its manifest and extract `identity.name` (or the leading file comment if `identity.name` is a variable reference). Take the first word of that name, lowercased — that is the short name. Match it against `--persona`.

**Known mappings (use as a fast path before scanning):**

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

If the short name matches a folder name exactly (e.g. `evelyn`, `nadia`), use it directly — no scan needed.

If the persona is not in this table and does not match a folder directly, scan all folders as described above. If still no match is found, report that the persona could not be resolved and stop.

Use the resolved folder as `<persona_folder>` for all manifest paths in the steps below.

---

### 1. Resolve the page label to a file

The `--page` argument is a **human-readable label**, not a file name. Resolve it in this order:

**Step 1a — Check the persona manifest for a matching nav label or page key.**

Read the manifest at:
```
/Users/charansaikondapaneni/Desktop/UltraMaster/app/src/markets/financial-services/clients/<client>/personas/<persona_folder>/manifest.tsx
```

Look at:
- `navLabels` — a map of page key → display label (e.g. `{ journey: 'Business Performance', risk: 'Priority Signals' }`)
- `pages` — a map of page key → component (e.g. `{ journey: BusinessPerformanceView, governance: ModelGovernancePage }`)

Match the `--page` argument (case-insensitive, partial match allowed) against the nav labels or page keys. The matched key gives you the component name imported for that page.

**Step 1b — Map well-known shared page labels to their files.**

If the label matches a shared page, use the file directly:

| Label (case-insensitive) | File |
|---|---|
| ask the ai / ask | `app/src/components/pages/AskTheAI.tsx` |
| data sources | `app/src/components/pages/DataSources.tsx` |

**Step 1c — Search the Ultra tree by component name.**

Once you have the component name from step 1a or 1b, find its file:
```bash
find /Users/charansaikondapaneni/Desktop/UltraMaster/app/src -name "<ComponentName>.tsx" | grep -v node_modules
```

### 2. Read the page file

Read the located file in full. Collect every import statement that imports from a local path (starts with `./`, `../`, or `@/components`). Ignore library imports (react, framer-motion, lucide-react, recharts, etc.).

### 3. For each imported component, classify it

Read each imported component file and apply this classification:

| Classification | Rule |
|---|---|
| **View** | The component name ends in `View`, or it is the top-level layout wrapper that composes multiple other local components inside a single exported default |
| **Complex component** | The component imports and renders two or more other local components inside it |
| **Single component** | The component renders only HTML/JSX primitives and library elements — no local component imports |
| **Single component, inlined** | A named function component defined inside the view/parent file rather than its own file |
| **Inline JSX section** | An unnamed block of JSX directly inside the view — no component function wrapping it — that renders as a cohesive visual unit (a card, a panel, a callout). These are prime candidates for extraction into named components. Note what it renders (e.g. "uses PostureRow ×4") |

### 4. Output format

Print the result as a **hierarchical tree** rooted at the page. Use indentation to show nesting. Each node shows the component name, its classification label, and — for inlined components — a note that it lives inside its parent file.

```
## Components on <PageName> — <persona> / <client>

<PageName>
└── <ViewName>  [View]
    ├── <ComponentA>  [Complex component]
    │   ├── <SubComponentA1>  [Single component]
    │   └── <SubComponentA2>  [Single component]
    ├── <ComponentB>  [Single component]
    └── <ComponentC>  [Single component, inlined]
```

**Classification labels (use exactly):**
- `[View]` — top-level layout wrapper that composes multiple local components
- `[Complex component]` — imports and renders two or more local components
- `[Single component]` — only HTML/JSX primitives and library elements, no local imports
- `[Single component, inlined]` — a named function component defined inside the parent file, not its own file
- `[Inline JSX section]` — unnamed JSX block directly in the view; no wrapping component function; note what it renders

If the page composes components directly with no view wrapper, the tree starts with the page's own children instead:

```
## Components on <PageName> — <persona> / <client>

<PageName>  (no view wrapper — composes directly)
├── <ComponentA>  [Complex component]
│   └── <SubComponentA1>  [Single component]
└── <ComponentB>  [Single component]
```

After the tree, add a one-line summary:

```
Summary: <N> view(s), <N> complex component(s), <N> single component(s), <N> inlined component(s)
```

### 5. Notes

- Trace the full depth: if a complex component imports another complex component, show that nesting too.
- If a component file is not found, mark it as `[file not found]` and do not expand it further.
- Do not list the page file itself as a component node — it is the root.
- Do not list types-only files (`.ts` files that export only interfaces/types).
- Library components (framer-motion, lucide-react, recharts, etc.) are not listed — only local components matter.
