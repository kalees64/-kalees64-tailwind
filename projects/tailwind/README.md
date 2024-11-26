# Tailwind Angular

## Installation

```bash
ng add @kalees64/tailwind
```

## Remove

```bash
ng g @kalees64/tailwind:ng-remove
```

## Usage

app.component.html

```typescript
<h1 class="text-7xl bg-cyan-300 dark:bg-lime-300">I am Kalees</h1>
<button class="p-2 rounded bg-pink-500" (click)='toggleTheme()'>
  Toggle Theme
</button>

```

app.component.ts

```typescript
  constructor(
    private themeService: ThemeService,
  ) {}

  ngOnInit(): void {
    this.themeService.initializeTheme();
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }
```

## New Feature

Now you can use theme toggle functionality in your Angular application. This feature is available in the `ThemeService` class.
