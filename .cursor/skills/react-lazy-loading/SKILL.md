---
name: react-lazy-loading
description:
  Implement lazy loading in React applications to reduce initial bundle size. Use when optimizing
  bundle size, implementing code splitting, reducing initial load time, or when the user mentions
  lazy loading, React.lazy, Suspense, or bundle optimization.
---

# React Lazy Loading Implementation

## Overview

This skill guides the implementation of lazy loading in React applications using `React.lazy()` and
`Suspense` to reduce the initial bundle size and improve load times.

## Quick Start

### 1. Convert Static Imports to Lazy Imports

**Before (static import):**

```tsx
import { MyComponent } from './components/MyComponent'
```

**After (lazy import):**

```tsx
import { lazy } from 'react'

const MyComponent = lazy(() =>
  import('./components/MyComponent').then((module) => ({
    default: module.MyComponent,
  }))
)
```

> Note: The `.then()` is needed when the component is a named export. If it's a default export, use
> `lazy(() => import('./Component'))` directly.

### 2. Wrap with Suspense

```tsx
import { Suspense } from 'react'

const withSuspense = (Component: React.LazyExoticComponent<React.ComponentType>) => (
  <Suspense fallback={<CenteredLoader />}>
    <Component />
  </Suspense>
)
```

### 3. Create a Reusable CenteredLoader

```tsx
interface CenteredLoaderProps {
  fullScreen?: boolean
  minHeight?: string
}

export const CenteredLoader = ({
  fullScreen = false,
  minHeight = '200px',
}: CenteredLoaderProps) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '100%',
      height: fullScreen ? '100vh' : '100%',
      minHeight: fullScreen ? undefined : minHeight,
    }}
  >
    <Loader />
  </div>
)
```

## Common Use Cases

### Routes with React Router

```tsx
import { lazy, Suspense } from 'react'

// Lazy load route components
const HomePage = lazy(() => import('./pages/HomePage').then((m) => ({ default: m.HomePage })))
const ProfilePage = lazy(() =>
  import('./pages/ProfilePage').then((m) => ({ default: m.ProfilePage }))
)
const SettingsPage = lazy(() =>
  import('./pages/SettingsPage').then((m) => ({ default: m.SettingsPage }))
)

// Wrapper for routes
const withSuspense = (Component) => (
  <Suspense fallback={<CenteredLoader />}>
    <Component />
  </Suspense>
)

// In routes configuration
const routes = [
  { path: '/', element: withSuspense(HomePage) },
  { path: '/profile', element: withSuspense(ProfilePage) },
  { path: '/settings', element: withSuspense(SettingsPage) },
]
```

### Factory Pattern (Drawers/Modals)

When you have a factory that creates different components based on type:

```tsx
import { lazy, Suspense } from 'react'

// Lazy load all form variants
const CreateForm = lazy(() => import('./forms/CreateForm').then((m) => ({ default: m.CreateForm })))
const EditForm = lazy(() => import('./forms/EditForm').then((m) => ({ default: m.EditForm })))
const DeleteForm = lazy(() => import('./forms/DeleteForm').then((m) => ({ default: m.DeleteForm })))

const withSuspense = (Component) => (
  <Suspense fallback={<CenteredLoader />}>
    <Component />
  </Suspense>
)

// In factory
export const getFormByType = (type: FormType) => {
  switch (type) {
    case 'create':
      return withSuspense(CreateForm)
    case 'edit':
      return withSuspense(EditForm)
    case 'delete':
      return withSuspense(DeleteForm)
  }
}
```

### Dynamic Component Initialization

For libraries that require initialization (like web components):

```tsx
// bds-initializer.service.ts

let initialized = false

export const initializeEssentialComponents = async () => {
  const { defineIcon, defineButton } = await import('@lib/components')
  defineIcon()
  defineButton()
}

export const initializeDeferredComponents = async () => {
  if (initialized) return
  initialized = true

  const { defineForm, defineInput, defineSelect } = await import('@lib/components')
  defineForm()
  defineInput()
  defineSelect()
}
```

## Webpack Configuration for Single-SPA

When using single-spa, configure splitChunks for async chunks only:

```javascript
// webpack.config.js
module.exports = {
  optimization: {
    splitChunks: {
      chunks: 'async', // Important: only async for single-spa
      minSize: 20000,
      maxSize: 244000,
      cacheGroups: {
        vendors: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'async',
          priority: -10,
        },
        // Group heavy libraries
        heavyLib: {
          test: /[\\/]node_modules[\\/]@heavy-lib[\\/]/,
          name: 'vendors-heavy-lib',
          chunks: 'async',
          priority: 20,
        },
      },
    },
  },
}
```

## Checklist

When implementing lazy loading:

- [ ] Identify heavy components/modules (routes, forms, modals)
- [ ] Convert static imports to `React.lazy()`
- [ ] Handle named exports with `.then(m => ({ default: m.Component }))`
- [ ] Wrap lazy components with `Suspense`
- [ ] Create reusable loader component
- [ ] Configure webpack splitChunks if needed
- [ ] Run bundle analyzer to verify chunk separation
- [ ] Test loading states in slow network conditions

## Common Pitfalls

### 1. Named vs Default Exports

```tsx
// Named export - needs .then()
const Component = lazy(() => import('./Component').then((m) => ({ default: m.Component })))

// Default export - direct import
const Component = lazy(() => import('./Component'))
```

### 2. Missing Suspense

Always wrap lazy components with Suspense, otherwise you'll get a runtime error.

### 3. Static Dependencies in Lazy Files

If a lazy-loaded file imports heavy dependencies at the top level, those dependencies are included
in the lazy chunk. This is often desired but verify with bundle analyzer.

### 4. Single-SPA: Don't Split Entry Point

For single-spa microfrontends, use `chunks: 'async'` to avoid splitting the entry point which must
load synchronously.

## Verification

After implementing, run your bundle analyzer:

```bash
npm run analyze
# or
webpack --analyze
```

You should see:

- Smaller main bundle
- Separate chunks for lazy-loaded components
- Vendor chunks grouped by library
