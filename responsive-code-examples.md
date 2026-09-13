# Responsive Code — First Avenue Dentistry (Tailwind CSS v4)

Real responsive patterns extracted from this project. Share freely.

## Breakpoints (Tailwind defaults)

| Class     | Min width | Target                          |
| --------- | --------- | ------------------------------- |
| (none)    | 0         | mobile (phone) — base by default |
| `sm:`     | 640px     | small phones landscape / big phones |
| `md:`     | 768px     | tablet                          |
| `lg:`     | 1024px    | laptop                          |
| `xl:`     | 1280px    | desktop                         |
| `2xl:`    | 1536px    | large desktop                   |

Rule of thumb: design **mobile-first**. Base classes are the phone layout;
`sm:`/`md:`/`lg:` etc. only override for bigger screens.

## Responsive utilities used in this project

**Grid columns** — the #1 layout trick:
`sm:grid-cols-2`, `md:grid-cols-2`, `md:grid-cols-3`, `md:grid-cols-4`,
`sm:grid-cols-2`, `sm:grid-cols-3`, `lg:grid-cols-2`, `lg:grid-cols-3`,
`lg:grid-cols-4`, `lg:grid-cols-12`, `lg:col-span-2/5/7`

**Show/hide panels** (mobile menu vs desktop menu):
`lg:flex`, `lg:block`, `lg:hidden`, `md:block`, `md:hidden`

**Text sizing:**
`sm:text-lg`, `sm:text-3xl`, `sm:text-4xl`, `sm:text-5xl`, `sm:text-6xl`

**Padding / spacing:**
`sm:p-10`, `sm:p-12`, `sm:px-5`, `sm:px-6`, `sm:px-0`, `sm:mx-0`
`lg:px-8`, `lg:p-8`, `lg:pt-44`, `lg:pb-28`

**Alignment & layout:**
`sm:flex-row`, `lg:flex-row`, `sm:text-left`, `lg:items-center`, `lg:mr-auto`

**Sizing:**
`sm:h-80`, `sm:w-auto`, `sm:w-[420px]`

**Sticky sidebar:**
`lg:sticky`, `lg:top-24`

## Real examples from this codebase

### 1. Two-column hero that stacks on mobile (Home/Services/Service pages)

```tsx
<div className="grid grid-cols-1 lg:grid-cols-2">   {/* 1 col phone -> 2 cols laptop */}
  <div className="p-8 sm:p-12 space-y-6">
    <h1 className="text-3xl sm:text-4xl font-extrabold">Title</h1>
    <p className="text-sm text-slate-600 leading-relaxed">Text...</p>
    <button>Book Appointment</button>
  </div>
  <div className="h-80 lg:h-auto bg-slate-100">
    <img src="..." className="w-full h-full object-cover" />
  </div>
</div>
```

### 2. Card grid: 1 -> 2 -> 4 columns (Services categories)

```tsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
  {SERVICE_CATEGORIES_HOME.map(cat => (
    <div key={cat.id} className="bg-white rounded-2xl p-6 border shadow-lg">
      <img src={cat.image} className="w-14 h-14 object-contain mb-4" />
      <h3 className="font-bold text-sm mb-3">{cat.title}</h3>
      <ul>...</ul>
    </div>
  ))}
</div>
```

### 3. Desktop dropdown menu vs mobile hamburger menu (Navbar)

```tsx
{/* Desktop nav - only visible from laptop up */}
<nav className="hidden lg:flex items-center gap-0.5">
  {navItems.map(item => <button>{item.label}</button>)}
</nav>

{/* Mobile menu button - only visible below laptop */}
<button className="p-2 rounded-xl bg-slate-100 text-slate-800 lg:hidden">
  <Menu />
</button>
```

### 4. Side-by-side blocks that stack on phones (Our Team page)

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
  <div className="rounded-3xl overflow-hidden shadow-2xl">
    <img src="..." className="w-full h-80 md:h-96 object-cover" />
  </div>
  <div className="space-y-4">Text content...</div>
</div>
```

## Quick tips

- Base = mobile; add min-width variants only for bigger screens (mobile-first).
- `grid-cols-1 md:grid-cols-2 lg:grid-cols-4` = classic responsive card row.
- `hidden lg:flex` / `lg:hidden` = swap UI between phone and laptop.
- Use `sm:`/`lg:` for text scale: `text-3xl sm:text-5xl`.
- Tailwind v4 note: buttons no longer get a `pointer` cursor by default —
  add this once to your CSS: `button:not(:disabled) { cursor: pointer; }`'





  