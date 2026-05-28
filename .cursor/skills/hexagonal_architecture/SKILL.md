---
name: architecture-hexagonal
description:
  Guía de arquitectura hexagonal para proyectos React/TypeScript. Implementa validaciones en
  dominio, servicios con lógica de negocio, value objects, casos de uso y domain events. Usar al
  crear módulos, servicios, modelos, repositorios, o cuando se pregunte sobre arquitectura
  hexagonal, clean architecture o DDD.
---

# Arquitectura Hexagonal

Guía definitiva para implementar arquitectura hexagonal en proyectos React/TypeScript siguiendo las
mejores prácticas de Domain-Driven Design.

**Stack de UI:** Este proyecto usa **shadcn/ui** + Tailwind. Los componentes base viven en `src/components/ui/`.

## Estructura General del Proyecto

```
src/
├── common/                      # Código compartido (NO es un módulo de dominio)
│   ├── domain/                  # Abstracciones de dominio compartidas
│   │   ├── errors/              # Errores base reutilizables
│   │   ├── events/              # Interfaces de eventos
│   │   ├── interfaces/          # Interfaces genéricas (paginación, filtros)
│   │   ├── models/              # Modelos base abstractos
│   │   └── value-objects/       # Value objects genéricos (Email, DateRange)
│   ├── application/             # Servicios de aplicación compartidos
│   │   └── event-publisher.ts
│   ├── components/              # Componentes UI compartidos (confirmation-modal, etc.)
│   ├── adapters/                # Adaptadores compartidos
│   │   ├── input/               # UI compartida
│   │   │   ├── components/      # Componentes reutilizables
│   │   │   └── pages/           # Páginas de composición multi-módulo
│   │   └── output/              # Infraestructura HTTP compartida
│   │       └── http/
│   ├── context/                 # Contextos React (DI, estado global)
│   ├── hooks/                   # Hooks React compartidos
│   ├── guards/                  # Guards de autorización
│   └── utils/                   # Utilidades puras (sin dependencias de dominio)
├── modules/                     # Módulos de dominio (bounded contexts)
│   ├── task/
│   ├── calendar/
│   ├── users/
│   └── ...
├── routes/                      # Configuración de rutas y layouts
│   ├── index.tsx                # Definición del router
│   └── layouts/                 # Layouts de la aplicación
├── assets/                      # Estilos globales, imágenes
└── main.tsx                     # Punto de entrada
```

---

## Estructura de Common (Código Compartido)

El directorio `common` contiene código reutilizable que **NO pertenece a un módulo de dominio
específico**. Sigue la misma estructura de capas pero con un propósito diferente.

### common/domain/ - Abstracciones Compartidas

Contiene clases base, interfaces y value objects genéricos.

```typescript
// common/domain/errors/domain.error.ts
export class DomainError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
    public readonly details?: Record<string, unknown>
  ) {
    super(message)
    this.name = 'DomainError'
  }
}

// common/domain/errors/not-found.error.ts
export class NotFoundError extends DomainError {
  constructor(entity: string, id: number | string) {
    super(`${entity} with id ${id} not found`, 'NOT_FOUND', { entity, id })
  }
}

// common/domain/errors/validation.error.ts
export class ValidationError extends DomainError {
  constructor(field: string, message: string) {
    super(message, 'VALIDATION_ERROR', { field })
  }
}
```

```typescript
// common/domain/interfaces/filter-with-pagination.ts
export interface FilterWithPagination<T> {
  filter?: Partial<T> | Record<string, unknown>
  page?: number
  pageSize?: number
  orderBy?: keyof T
  orderDirection?: 'asc' | 'desc'
}

// common/domain/interfaces/paginated-response.ts
export interface PaginatedResponse<T> {
  items: T[]
  totalItems: number
  totalPages: number
  currentPage: number
}
```

```typescript
// common/domain/events/domain-event.interface.ts
export interface DomainEvent {
  readonly eventType: string
  readonly occurredOn: Date
  readonly aggregateId?: number | string
}

// common/domain/events/event-publisher.interface.ts
export interface EventPublisher {
  publish<T extends DomainEvent>(event: T): Promise<void>
}
```

```typescript
// common/domain/value-objects/email.vo.ts
import { DomainError } from '../errors/domain.error'

export class Email {
  private static readonly REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  private constructor(private readonly value: string) {}

  static create(value: string): Email {
    const normalized = value?.trim().toLowerCase() ?? ''
    if (!this.REGEX.test(normalized)) {
      throw new DomainError('Invalid email format', 'INVALID_EMAIL')
    }
    return new Email(normalized)
  }

  getValue(): string {
    return this.value
  }

  equals(other: Email): boolean {
    return this.value === other.value
  }
}
```

### common/adapters/output/http/ - Infraestructura HTTP

Clases base para repositorios HTTP y deserialización.

```typescript
// common/adapters/output/http/base-http-repository.ts
export abstract class BaseHttpRepository<T> {
  protected abstract formatJsonApiResponse(data: any): T
  protected abstract formatPaginatedJsonApiResponse(data: any): PaginatedResponse<T>

  protected buildQueryParams(filter: FilterWithPagination<T>): string {
    const params = new URLSearchParams()
    if (filter.page) params.append('page', String(filter.page))
    if (filter.pageSize) params.append('page_size', String(filter.pageSize))
    if (filter.filter) params.append('filter', JSON.stringify(filter.filter))
    return params.toString() ? `?${params.toString()}` : ''
  }
}

// common/adapters/output/http/json-api/json-api-deserializer.ts
export class JsonApiDeserializer {
  static deserialize<T>(response: SingleRecordJsonApiResponse): T {
    const { data, included } = response
    return this.denormalize(data, included) as T
  }

  static deserializePaginated<T>(response: MultipleRecordJsonApiResponse): {
    items: T[]
    total: number
    totalPages: number
    page: number
  } {
    const { data, included, meta } = response
    return {
      items: data.map((item) => this.denormalize(item, included) as T),
      total: meta.total,
      totalPages: meta.totalPages,
      page: meta.page,
    }
  }

  private static denormalize(data: any, included?: any[]): Record<string, any> {
    // Lógica de deserialización JSON:API
  }
}
```

### common/adapters/input/components/ - Componentes UI Compartidos

Componentes reutilizables que **no contienen lógica de negocio específica**.

#### Estructura (con @flux-ui/core)

```
common/
├── components/                      # Componentes compartidos del proyecto
│   ├── confirmation-modal/
│   ├── assignee-tag/
│   └── ...
└── adapters/
    └── input/
        └── components/              # Componentes personalizados compartidos
            └── confirmation-modal/
```

Los componentes base provienen de **@flux-ui/core** (se importan directamente, no se copian al
proyecto).

#### Componentes de @flux-ui/core

Importa directamente desde la librería. Los componentes disponibles incluyen:

- **FxButton** — Botones (con `ButtonSizeEnum`, `ButtonVariantEnum`, `ButtonToneEnum`)
- **FxInput** — Campos de texto
- **FxSelect** — Selectores
- **FxDatePicker** — Selector de fechas
- **FxAccordion**, **FxAccordionContent**, **FxAccordionItem**, **FxAccordionTrigger**
- **FxTabs**, **FxTabsList**, **FxTabsTrigger**
- **FxAvatar**, **FxBadge**
- **FxTooltip**, **FxTooltipContent**, **FxTooltipProvider**, **FxTooltipTrigger**
- **FxSpinner** (con `SpinnerSizeEnum`)
- **FxInputSlidingButton** — Input con botón deslizante
- **FxEmpty** — Empty states

**Configuración de estilos** (`src/assets/flux-ui.scss`):

```scss
@import '@flux-ui/core/components/ui/flux-button.css';
@import '@flux-ui/core/components/ui/flux-input.css';
@import '@flux-ui/core/components/ui/flux-dropdown.css';
@import '@flux-ui/core/components/ui/flux-calendar.css';
@import '@flux-ui/core/components/ui/flux-avatar.css';
@import '@flux-ui/core/components/ui/flux-tabs.css';
@import '@flux-ui/core/components/ui/flux-checkbox.css';
@import '@flux-ui/core/components/ui/flux-tooltip.css';
@import '@flux-ui/core/components/ui/flux-accordion.css';
@import '@flux-ui/core/components/ui/flux-select.css';
@import '@flux-ui/core/themes/flux-bolt.css';
// Importar solo los CSS de componentes que uses
```

**Uso:**

```typescript
import { ButtonSizeEnum, ButtonVariantEnum, FxButton } from '@flux-ui/core'
import { FxInput } from '@flux-ui/core'

// Ejemplo de botón
<FxButton
  size={ButtonSizeEnum.MD}
  variant={ButtonVariantEnum.Primary}
  onClick={handleSubmit}
>
  Crear tarea
</FxButton>
```

#### Componentes personalizados compartidos

```typescript
// common/components/confirmation-modal/confirmation-modal.tsx
import { ButtonSizeEnum, ButtonVariantEnum, FxButton } from '@flux-ui/core'
// Modal: en este proyecto se usa BdsModal (@bds/components-react) para modales.
// @flux-ui/core no incluye modal; usar el que provea el design system del proyecto.

interface ConfirmationModalProps {
  isOpen: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void
  onCancel: () => void
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null

  return (
    <Modal onClose={onCancel}>
      <Modal.Header>{title}</Modal.Header>
      <Modal.Body>{message}</Modal.Body>
      <Modal.Footer>
        <FxButton
          size={ButtonSizeEnum.MD}
          variant={ButtonVariantEnum.Secondary}
          onClick={onCancel}
        >
          {cancelLabel}
        </FxButton>
        <FxButton size={ButtonSizeEnum.MD} onClick={onConfirm}>
          {confirmLabel}
        </FxButton>
      </Modal.Footer>
    </Modal>
  )
}
```

### common/context/ - Contextos y DI

Inyección de dependencias y estado global.

```typescript
// common/context/di-context.tsx
// Ver sección 11. Inyección de Dependencias

// common/context/notifications/notifications.context.tsx
interface NotificationsState {
  notifications: Notification[]
}

interface NotificationsContextValue {
  state: NotificationsState
  showSuccess: (message: string) => void
  showError: (message: string) => void
  dismiss: (id: string) => void
}

export const NotificationsContext = createContext<NotificationsContextValue | undefined>(undefined)

export const useNotifications = () => {
  const context = useContext(NotificationsContext)
  if (!context) throw new Error('useNotifications must be used within NotificationsProvider')
  return context
}
```

### common/hooks/ - Hooks Compartidos

Hooks React reutilizables que no dependen de lógica de negocio específica.

```typescript
// common/hooks/use-debounce.ts
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])

  return debouncedValue
}

// common/hooks/use-pagination.ts
interface UsePaginationProps {
  totalItems: number
  pageSize: number
  initialPage?: number
}

export function usePagination({ totalItems, pageSize, initialPage = 1 }: UsePaginationProps) {
  const [currentPage, setCurrentPage] = useState(initialPage)
  const totalPages = Math.ceil(totalItems / pageSize)

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)))
  }

  return {
    currentPage,
    totalPages,
    goToPage,
    goToNext: () => goToPage(currentPage + 1),
    goToPrev: () => goToPage(currentPage - 1),
    isFirstPage: currentPage === 1,
    isLastPage: currentPage === totalPages,
  }
}
```

### common/guards/ - Guards de Autorización

Control de acceso basado en permisos.

```typescript
// common/guards/authorization.guard.tsx
interface CanProps {
  permission: string | string[]
  children: ReactNode
  fallback?: ReactNode
}

export const Can: React.FC<CanProps> = ({ permission, children, fallback = null }) => {
  const { user } = useCurrentUser()

  const hasPermission = Array.isArray(permission)
    ? permission.some(p => user.permissions.includes(p))
    : user.permissions.includes(permission)

  return hasPermission ? <>{children}</> : <>{fallback}</>
}

// Uso
<Can permission="task.create">
  <CreateTaskButton />
</Can>
```

### common/utils/ - Utilidades Puras

Funciones de utilidad sin dependencias de dominio.

```typescript
// common/utils/date.utils.ts
export function formatDate(date: Date, format: string = 'YYYY-MM-DD'): string {
  // Implementación
}

export function isDateInPast(date: Date): boolean {
  return date < new Date()
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

// common/utils/string.utils.ts
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

export function truncate(str: string, maxLength: number): string {
  return str.length > maxLength ? `${str.slice(0, maxLength)}...` : str
}
```

---

## Reglas de Dependencias en Common

### ✅ Permitido

- `common/domain` → Sin dependencias externas (solo tipos primitivos)
- `common/adapters` → Puede depender de `common/domain`
- `common/hooks` → Puede depender de `common/context` y `common/utils`
- `common/context` → Puede depender de `common/domain` y `modules/*/domain`
- `common/utils` → Sin dependencias (funciones puras)

### ❌ Prohibido

- `common/domain` → No puede depender de `modules/*`
- `common/utils` → No puede depender de nada
- `modules/*` → No pueden depender de `common/adapters/input/components`  
  (los componentes UI de common son para uso en `adapters/input` de los módulos)
- Los componentes de `@flux-ui/core` se importan directamente en cualquier capa de UI

### Flujo de Dependencias

```
┌─────────────────────────────────────────────────────────────┐
│                         modules/                            │
│  ┌─────────┐    ┌─────────────┐    ┌──────────────────┐    │
│  │ domain  │ ← │ application │ ← │     adapters     │    │
│  └────┬────┘    └──────┬──────┘    └────────┬─────────┘    │
│       │                │                     │              │
└───────┼────────────────┼─────────────────────┼──────────────┘
        │                │                     │
        ▼                ▼                     ▼
┌───────┴────────────────┴─────────────────────┴──────────────┐
│                         common/                             │
│  ┌─────────┐    ┌─────────────┐    ┌──────────────────┐    │
│  │ domain  │ ← │ application │ ← │     adapters     │    │
│  │ (base)  │    │   (base)    │    │     (base)       │    │
│  └─────────┘    └─────────────┘    └──────────────────┘    │
│                                                             │
│  ┌─────────┐    ┌─────────────┐    ┌──────────────────┐    │
│  │ context │    │    hooks    │    │      utils       │    │
│  └─────────┘    └─────────────┘    └──────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

---

## Estructura de Módulos

Cada módulo de dominio sigue esta estructura:

```
modules/
└── [module-name]/
    ├── domain/                     # Núcleo del negocio (sin dependencias externas)
    │   ├── models/                 # Entidades y agregados
    │   │   └── [entity].model.ts
    │   ├── value-objects/          # Objetos de valor inmutables
    │   │   └── [concept].vo.ts     # Exporta: clase, tipo, constantes VALID_*
    │   ├── services/               # Servicios de dominio (opcional)
    │   │   └── [domain].service.ts
    │   ├── events/                 # Eventos de dominio (opcional)
    │   │   └── [event].event.ts
    │   ├── errors/                 # Errores específicos del módulo
    │   │   └── [module].error.ts   # Extienden de DomainError
    │   └── ports/                  # Interfaces (puertos)
    │       ├── [module]-service.interface.ts
    │       └── [module]-repository.interface.ts
    ├── application/                # Casos de uso y orquestación
    │   ├── use-cases/              # Casos de uso específicos
    │   │   ├── create-[entity].use-case.ts
    │   │   └── update-[entity].use-case.ts
    │   ├── dtos/                   # DTOs de entrada/salida (opcional)
    │   │   └── [entity].dto.ts
    │   └── [module].service.ts     # Orquestador con listeners
    ├── adapters/                   # Implementaciones de puertos
    │   ├── input/                  # Adaptadores de entrada (UI)
    │   │   ├── components/         # Componentes React
    │   │   │   └── [component].tsx
    │   │   ├── context/            # Contexto para estado reactivo
    │   │   │   └── [module].context.tsx
    │   │   ├── hooks/              # Hooks del módulo
    │   │   │   ├── use-[module].ts           # Hook reactivo (re-renders)
    │   │   │   └── use-[module]-service.ts   # Hook de servicio (sin re-renders)
    │   │   └── pages/              # Páginas EXCLUSIVAS del módulo
    │   │       └── [module].page.tsx
    │   └── output/                 # Adaptadores de salida (persistencia)
    │       ├── mappers/            # Mappers dominio ↔ persistencia
    │       │   └── [module].mapper.ts
    │       └── [module].repository.ts
    ├── [module].factory.ts         # Fábrica para instanciación
    └── index.ts                    # Exportaciones públicas del módulo
```

### Ejemplo de index.ts del módulo

```typescript
// modules/task/index.ts

// Domain - Value Objects + Constantes
export { Status, VALID_STATUSES } from './domain/value-objects/status.vo'
export type { StatusName } from './domain/value-objects/status.vo'

// Domain - Models
export { TaskModel } from './domain/models/task.model'

// Domain - Ports (solo tipos)
export type { TaskServiceInterface } from './domain/ports/task-service.interface'
export type { TaskRepositoryInterface } from './domain/ports/task-repository.interface'

// Domain - Errors
export { InvalidStatusError, TaskNotFoundError } from './domain/errors/task.error'

// Application
export { TaskService } from './application/task.service'
export { TaskFactory } from './task.factory'

// Adapters - Input (UI)
export { TaskList } from './adapters/input/components/task-list'
export { TaskProvider, useTask } from './adapters/input/context/task.context'
export { useTaskService } from './adapters/input/hooks/use-task-service'

// Adapters - Output (no suelen exportarse públicamente)
// export { LocalStorageTaskRepository } from './adapters/output/task.repository'
```

---

## 1. Value Objects

Los value objects encapsulan validación y garantizan integridad a nivel de tipo.

### Patrón Base con Constantes Exportadas

```typescript
// domain/value-objects/[concept].vo.ts
import { InvalidTaskTitleError } from '../errors/task.error'

// Exportar constantes para uso en UI (generación dinámica de opciones)
export type TaskTitleValue = string
export const MIN_TITLE_LENGTH = 3
export const MAX_TITLE_LENGTH = 250

export class TaskTitle {
  private constructor(private readonly value: string) {}

  static create(value: string): TaskTitle {
    const trimmed = value?.trim() ?? ''

    if (trimmed.length < MIN_TITLE_LENGTH) {
      throw new InvalidTaskTitleError(
        `Title must be at least ${MIN_TITLE_LENGTH} characters`,
        trimmed
      )
    }

    if (trimmed.length > MAX_TITLE_LENGTH) {
      throw new InvalidTaskTitleError(
        `Title must not exceed ${MAX_TITLE_LENGTH} characters`,
        trimmed
      )
    }

    return new TaskTitle(trimmed)
  }

  getValue(): string {
    return this.value
  }

  equals(other: TaskTitle): boolean {
    return this.value === other.value
  }

  toString(): string {
    return this.value
  }
}
```

### Value Object con Valores Predefinidos (Enum-like)

```typescript
// domain/value-objects/status.vo.ts
import { InvalidStatusError } from '../errors/task.error'

export type StatusName = 'active' | 'completed' | 'archived'

// Constante exportable para uso en UI (dropdowns, selects, etc.)
export const VALID_STATUSES: readonly StatusName[] = ['active', 'completed', 'archived'] as const

export class Status {
  private constructor(private readonly value: StatusName) {}

  static create(value: string): Status {
    if (!VALID_STATUSES.includes(value as StatusName)) {
      throw new InvalidStatusError(value)
    }
    return new Status(value as StatusName)
  }

  static default(): Status {
    return new Status('active')
  }

  getValue(): StatusName {
    return this.value
  }

  isActive(): boolean {
    return this.value === 'active'
  }

  isCompleted(): boolean {
    return this.value === 'completed'
  }

  equals(other: Status): boolean {
    return this.value === other.value
  }

  toString(): string {
    return this.value
  }
}
```

### Value Objects Comunes

```typescript
// domain/value-objects/email.vo.ts
export class Email {
  private static readonly REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  private constructor(private readonly value: string) {}

  static create(value: string): Email {
    const normalized = value?.trim().toLowerCase() ?? ''

    if (!this.REGEX.test(normalized)) {
      throw new DomainError('Invalid email format')
    }

    return new Email(normalized)
  }

  getValue(): string {
    return this.value
  }
}

// domain/value-objects/date-range.vo.ts
export class DateRange {
  private constructor(
    private readonly startDate: Date,
    private readonly endDate: Date
  ) {}

  static create(startDate: Date, endDate: Date): DateRange {
    if (endDate < startDate) {
      throw new DomainError('End date cannot be before start date')
    }

    return new DateRange(startDate, endDate)
  }

  contains(date: Date): boolean {
    return date >= this.startDate && date <= this.endDate
  }

  getDurationInDays(): number {
    const diff = this.endDate.getTime() - this.startDate.getTime()
    return Math.ceil(diff / (1000 * 60 * 60 * 24))
  }
}
```

---

## 2. Modelos de Dominio

Los modelos contienen lógica de negocio, validaciones y comportamiento.

### Patrón de Entidad

```typescript
// domain/models/task.model.ts
import { DomainError } from '../errors/domain.error'
import { TaskTitle } from '../value-objects/task-title.vo'
import { TaskCreatedEvent } from '../events/task-created.event'

export enum TaskStatus {
  Active = 'active',
  Completed = 'completed',
  Deleted = 'deleted',
}

export enum TaskPriority {
  Low = 10,
  Medium = 20,
  High = 30,
}

export class TaskModel {
  private domainEvents: DomainEvent[] = []

  private constructor(
    public readonly id: number,
    public title: TaskTitle,
    public description: string,
    public status: TaskStatus,
    public priority: TaskPriority,
    public endDate: Date | null,
    public assigneeId: number | null,
    public readonly createdAt: Date,
    public updatedAt: Date
  ) {}

  // Factory method con validación
  static create(props: CreateTaskProps): TaskModel {
    const title = TaskTitle.create(props.title)

    if (props.endDate && props.endDate < new Date()) {
      throw new DomainError('End date cannot be in the past')
    }

    const task = new TaskModel(
      props.id ?? 0,
      title,
      props.description?.trim() ?? '',
      TaskStatus.Active,
      props.priority ?? TaskPriority.Medium,
      props.endDate ?? null,
      props.assigneeId ?? null,
      new Date(),
      new Date()
    )

    task.addDomainEvent(new TaskCreatedEvent(task))
    return task
  }

  // Métodos de comportamiento
  complete(): void {
    if (this.status === TaskStatus.Completed) {
      throw new DomainError('Task is already completed')
    }

    this.status = TaskStatus.Completed
    this.updatedAt = new Date()
    this.addDomainEvent(new TaskCompletedEvent(this))
  }

  assign(assigneeId: number): void {
    if (this.status === TaskStatus.Completed) {
      throw new DomainError('Cannot assign a completed task')
    }

    this.assigneeId = assigneeId
    this.updatedAt = new Date()
    this.addDomainEvent(new TaskAssignedEvent(this, assigneeId))
  }

  updateTitle(newTitle: string): void {
    this.title = TaskTitle.create(newTitle)
    this.updatedAt = new Date()
  }

  isOverdue(): boolean {
    return this.status === TaskStatus.Active && this.endDate !== null && this.endDate < new Date()
  }

  // Domain Events
  private addDomainEvent(event: DomainEvent): void {
    this.domainEvents.push(event)
  }

  getDomainEvents(): DomainEvent[] {
    return [...this.domainEvents]
  }

  clearDomainEvents(): void {
    this.domainEvents = []
  }
}

interface CreateTaskProps {
  id?: number
  title: string
  description?: string
  priority?: TaskPriority
  endDate?: Date
  assigneeId?: number
}
```

---

## 3. Errores de Dominio

### Errores Base en Common (Reutilizables)

```typescript
// common/domain/errors/domain.error.ts
export class DomainError extends Error {
  public readonly code?: string
  public readonly details?: Record<string, unknown>

  constructor(message: string, code?: string, details?: Record<string, unknown>) {
    super(message)
    this.code = code
    this.details = details
    this.name = 'DomainError'
  }
}

// common/domain/errors/common.error.ts
import { DomainError } from './domain.error'

export class ValidationError extends DomainError {
  public readonly field: string

  constructor(message: string, field: string) {
    super(message, 'VALIDATION_ERROR', { field })
    this.field = field
    this.name = 'ValidationError'
  }
}

export class NotFoundError extends DomainError {
  constructor(entity: string, id: string | number) {
    super(`${entity} with id ${id} not found`, 'NOT_FOUND', { entity, id })
    this.name = 'NotFoundError'
  }
}
```

### Errores Específicos del Módulo

Cada módulo debe tener sus propios errores que extiendan de `DomainError`:

```typescript
// modules/task/domain/errors/task.error.ts
import { DomainError } from '@/common/domain/errors/domain.error'

export class InvalidTaskTitleError extends DomainError {
  constructor(message: string, value: string) {
    super(message, 'INVALID_TASK_TITLE', { value })
    this.name = 'InvalidTaskTitleError'
  }
}

export class InvalidStatusError extends DomainError {
  constructor(value: string) {
    super(
      `Invalid status: ${value}. Valid statuses are: active, completed, archived`,
      'INVALID_STATUS',
      { value }
    )
    this.name = 'InvalidStatusError'
  }
}

export class TaskAlreadyCompletedError extends DomainError {
  constructor(taskId: number) {
    super(`Task ${taskId} is already completed`, 'TASK_ALREADY_COMPLETED', { taskId })
    this.name = 'TaskAlreadyCompletedError'
  }
}
```

### Beneficios de Errores Específicos

1. **Mensajes informativos**: Incluyen los valores válidos esperados
2. **Códigos únicos**: Permiten manejo programático en la UI
3. **Trazabilidad**: El `name` facilita identificar el origen del error
4. **Detalles contextuales**: El campo `details` permite pasar información adicional

---

## 4. Eventos de Dominio

Eventos para desacoplar efectos secundarios.

```typescript
// domain/events/domain-event.interface.ts
export interface DomainEvent {
  readonly occurredOn: Date
  readonly eventType: string
}

// domain/events/task-created.event.ts
export class TaskCreatedEvent implements DomainEvent {
  readonly occurredOn: Date
  readonly eventType = 'TaskCreated'

  constructor(public readonly task: TaskModel) {
    this.occurredOn = new Date()
  }
}

// domain/events/task-completed.event.ts
export class TaskCompletedEvent implements DomainEvent {
  readonly occurredOn: Date
  readonly eventType = 'TaskCompleted'

  constructor(
    public readonly task: TaskModel,
    public readonly completedAt: Date = new Date()
  ) {
    this.occurredOn = new Date()
  }
}
```

---

## 5. Puertos (Interfaces)

Define contratos entre capas sin implementación.

```typescript
// domain/ports/task.input-service.interface.ts
export interface TaskInputServiceInterface {
  createTask(dto: CreateTaskDTO): Promise<TaskModel>
  updateTask(dto: UpdateTaskDTO): Promise<TaskModel>
  completeTask(id: number): Promise<TaskModel>
  assignTask(taskId: number, assigneeId: number): Promise<TaskModel>
  deleteTask(id: number): Promise<void>
  getTask(id: number): Promise<TaskModel>
  search(filter: FilterWithPagination<TaskModel>): Promise<PaginatedResponse<TaskModel>>
}

// domain/ports/task.output-repository.interface.ts
export interface TaskOutputRepositoryInterface {
  save(task: TaskModel): Promise<TaskModel>
  findById(id: number): Promise<TaskModel | null>
  findAll(filter: FilterWithPagination<TaskModel>): Promise<PaginatedResponse<TaskModel>>
  delete(id: number): Promise<void>
}
```

---

## 6. Casos de Uso

Cada caso de uso es una clase con una única responsabilidad.

```typescript
// application/use-cases/create-task.use-case.ts
export class CreateTaskUseCase {
  constructor(
    private readonly taskRepository: TaskOutputRepositoryInterface,
    private readonly eventPublisher: EventPublisher
  ) {}

  async execute(dto: CreateTaskDTO): Promise<TaskModel> {
    // 1. Crear entidad de dominio (incluye validación)
    const task = TaskModel.create({
      title: dto.title,
      description: dto.description,
      priority: dto.priority,
      endDate: dto.endDate,
      assigneeId: dto.assigneeId,
    })

    // 2. Persistir
    const savedTask = await this.taskRepository.save(task)

    // 3. Publicar eventos de dominio
    const events = savedTask.getDomainEvents()
    for (const event of events) {
      await this.eventPublisher.publish(event)
    }
    savedTask.clearDomainEvents()

    return savedTask
  }
}

// application/use-cases/complete-task.use-case.ts
export class CompleteTaskUseCase {
  constructor(
    private readonly taskRepository: TaskOutputRepositoryInterface,
    private readonly eventPublisher: EventPublisher
  ) {}

  async execute(taskId: number): Promise<TaskModel> {
    // 1. Obtener entidad
    const task = await this.taskRepository.findById(taskId)

    if (!task) {
      throw new NotFoundError('Task', taskId)
    }

    // 2. Aplicar lógica de negocio
    task.complete()

    // 3. Persistir
    const savedTask = await this.taskRepository.save(task)

    // 4. Publicar eventos
    const events = savedTask.getDomainEvents()
    for (const event of events) {
      await this.eventPublisher.publish(event)
    }
    savedTask.clearDomainEvents()

    return savedTask
  }
}

// application/use-cases/assign-task.use-case.ts
export class AssignTaskUseCase {
  constructor(
    private readonly taskRepository: TaskOutputRepositoryInterface,
    private readonly userRepository: UserOutputRepositoryInterface
  ) {}

  async execute(taskId: number, assigneeId: number): Promise<TaskModel> {
    // 1. Validar que el usuario existe y está activo
    const user = await this.userRepository.findById(assigneeId)

    if (!user) {
      throw new NotFoundError('User', assigneeId)
    }

    if (!user.isActive()) {
      throw new DomainError('Cannot assign task to inactive user')
    }

    // 2. Obtener y modificar la tarea
    const task = await this.taskRepository.findById(taskId)

    if (!task) {
      throw new NotFoundError('Task', taskId)
    }

    task.assign(assigneeId)

    // 3. Persistir
    return await this.taskRepository.save(task)
  }
}
```

---

## 7. Servicio de Aplicación (Orquestador)

El servicio orquesta los casos de uso y maneja transacciones.

```typescript
// application/task.service.ts
export class TaskService implements TaskInputServiceInterface {
  constructor(
    private readonly createTaskUseCase: CreateTaskUseCase,
    private readonly completeTaskUseCase: CompleteTaskUseCase,
    private readonly assignTaskUseCase: AssignTaskUseCase,
    private readonly taskRepository: TaskOutputRepositoryInterface
  ) {}

  async createTask(dto: CreateTaskDTO): Promise<TaskModel> {
    return await this.createTaskUseCase.execute(dto)
  }

  async completeTask(id: number): Promise<TaskModel> {
    return await this.completeTaskUseCase.execute(id)
  }

  async assignTask(taskId: number, assigneeId: number): Promise<TaskModel> {
    return await this.assignTaskUseCase.execute(taskId, assigneeId)
  }

  async getTask(id: number): Promise<TaskModel> {
    const task = await this.taskRepository.findById(id)

    if (!task) {
      throw new NotFoundError('Task', id)
    }

    return task
  }

  async search(filter: FilterWithPagination<TaskModel>): Promise<PaginatedResponse<TaskModel>> {
    return await this.taskRepository.findAll(filter)
  }
}
```

---

## 8. DTOs

Los DTOs viven en la capa de aplicación, separados del dominio.

```typescript
// application/dtos/task.dto.ts
export interface CreateTaskDTO {
  title: string
  description?: string
  priority?: TaskPriority
  endDate?: Date
  assigneeId?: number
  taskGroupId?: number
}

export interface UpdateTaskDTO {
  id: number
  title?: string
  description?: string
  priority?: TaskPriority
  endDate?: Date | null
  status?: TaskStatus
}

export interface TaskResponseDTO {
  id: number
  title: string
  description: string
  status: string
  priority: number
  endDate: string | null
  assigneeId: number | null
  createdAt: string
  updatedAt: string
}

// Mapper para convertir entre dominio y DTO
export class TaskMapper {
  static toResponseDTO(task: TaskModel): TaskResponseDTO {
    return {
      id: task.id,
      title: task.title.getValue(),
      description: task.description,
      status: task.status,
      priority: task.priority,
      endDate: task.endDate?.toISOString() ?? null,
      assigneeId: task.assigneeId,
      createdAt: task.createdAt.toISOString(),
      updatedAt: task.updatedAt.toISOString(),
    }
  }
}
```

---

## 9. Adaptadores de Salida (Repositorios)

Implementación concreta de los puertos de salida.

```typescript
// adapters/output/task-http.repository.ts
export class TaskHttpRepository implements TaskOutputRepositoryInterface {
  private readonly baseUrl = `${envManager.get('API_URL')}/tasks`

  async save(task: TaskModel): Promise<TaskModel> {
    const dto = TaskMapper.toResponseDTO(task)

    const response = task.id
      ? await httpRequest.PATCH(`${this.baseUrl}/${task.id}`, dto)
      : await httpRequest.POST(this.baseUrl, dto)

    return this.mapToModel(response)
  }

  async findById(id: number): Promise<TaskModel | null> {
    try {
      const response = await httpRequest.GET(`${this.baseUrl}/${id}`)
      return this.mapToModel(response)
    } catch (error) {
      if (error.status === 404) return null
      throw error
    }
  }

  async findAll(filter: FilterWithPagination<TaskModel>): Promise<PaginatedResponse<TaskModel>> {
    const queryParams = httpArgsParse({
      page: filter.page,
      pageSize: filter.pageSize,
      filter: JSON.stringify(filter.filter),
    })

    const response = await httpRequest.GET(`${this.baseUrl}${queryParams}`)

    return {
      items: response.data.map(this.mapToModel),
      totalItems: response.meta.total,
      totalPages: response.meta.totalPages,
      currentPage: response.meta.page,
    }
  }

  async delete(id: number): Promise<void> {
    await httpRequest.DELETE(`${this.baseUrl}/${id}`)
  }

  private mapToModel(data: any): TaskModel {
    return TaskModel.create({
      id: data.id,
      title: data.title,
      description: data.description,
      priority: data.priority,
      endDate: data.endDate ? new Date(data.endDate) : undefined,
      assigneeId: data.assigneeId,
    })
  }
}
```

---

## 10. Adaptadores de Entrada (UI)

Los componentes UI solo manejan presentación, delegando lógica al servicio.

```typescript
// adapters/input/components/create-task-form.tsx
import { ButtonSizeEnum, ButtonVariantEnum, FxButton, FxInput } from '@flux-ui/core'

export const CreateTaskForm: React.FC = () => {
  const taskService = useTaskServices()
  const [formData, setFormData] = useState<CreateTaskDTO>({
    title: '',
    description: '',
    priority: TaskPriority.Medium,
  })
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async () => {
    try {
      setError(null)
      // Toda la validación ocurre en el servicio/dominio
      await taskService.createTask(formData)
      // Éxito - navegar o mostrar mensaje
    } catch (err) {
      if (err instanceof DomainError) {
        setError(err.message)
      } else {
        setError('An unexpected error occurred')
      }
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && <ErrorMessage message={error} />}
      <FxInput
        value={formData.title}
        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
        placeholder="Task title"
      />
      {/* Más campos... */}
      <FxButton type="submit" size={ButtonSizeEnum.MD} variant={ButtonVariantEnum.Primary}>
        Create Task
      </FxButton>
    </form>
  )
}
```

---

## 11. Fábricas de Módulos y Inyección de Dependencias

### Factory Pattern por Módulo

Cada módulo expone una fábrica que encapsula la creación de dependencias:

```typescript
// modules/task/task.factory.ts
import { TaskService } from './application/task.service'
import { TaskHttpRepository } from './adapters/output/task-http.repository'
import type { TaskInputServiceInterface } from './domain/ports/task.input-service.interface'

export class TaskFactory {
  static create(): TaskInputServiceInterface {
    // Aquí podrías leer variables de entorno para decidir qué repositorio usar
    // (e.g., TaskHttpRepository vs TaskLocalStorageRepository)
    const repository = new TaskHttpRepository()
    return new TaskService(
      new CreateTaskUseCase(repository, new EventPublisher()),
      new CompleteTaskUseCase(repository, new EventPublisher()),
      new AssignTaskUseCase(repository, new UserHttpRepository()),
      repository
    )
  }
}
```

### Contexto de Inyección de Dependencias Global

```typescript
// common/context/di-context.tsx
import React, { createContext, useContext, useMemo } from 'react'
import type { ReactNode } from 'react'
import { TaskFactory } from '@/modules/task'
import { UserFactory } from '@/modules/user'
import type { TaskInputServiceInterface } from '@/modules/task'
import type { UserInputServiceInterface } from '@/modules/user'

interface DIContextValue {
  taskService: TaskInputServiceInterface
  userService: UserInputServiceInterface
  // A medida que agregues módulos, añade aquí
}

const DIContext = createContext<DIContextValue | undefined>(undefined)

export const DIProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const value = useMemo<DIContextValue>(() => ({
    taskService: TaskFactory.create(),
    userService: UserFactory.create(),
  }), [])

  return <DIContext.Provider value={value}>{children}</DIContext.Provider>
}

export const useDI = () => {
  const context = useContext(DIContext)
  if (!context) {
    throw new Error('useDI must be used within a DIProvider')
  }
  return context
}
```

### Configuración en main.tsx

```typescript
// main.tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { DIProvider } from './common/context/di-context'
import { TaskProvider } from './modules/task'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <DIProvider>
      <TaskProvider>  {/* Contexto específico del módulo si es necesario */}
        <App />
      </TaskProvider>
    </DIProvider>
  </StrictMode>
)
```

---

## 12. Contexto Específico del Módulo (Estado Reactivo)

Cuando un módulo necesita estado reactivo global (que se sincronice entre componentes), usamos un
contexto específico del módulo en `adapters/input/context/`.

```typescript
// modules/task/adapters/input/context/task.context.tsx
import React, { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { TaskModel } from '../../../domain/models/task.model'
import { useDI } from '@/common/context/di-context'

interface TaskContextValue {
  tasks: TaskModel[]
  isLoading: boolean
  createTask: (title: string) => Promise<void>
  completeTask: (id: number) => Promise<void>
}

const TaskContext = createContext<TaskContextValue | undefined>(undefined)

export const TaskProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { taskService } = useDI()
  const [tasks, setTasks] = useState<TaskModel[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Carga inicial y suscripción a cambios
  useEffect(() => {
    taskService.search({}).then(result => {
      setTasks(result.items)
      setIsLoading(false)
    })

    // Suscripción a cambios (sincronización global)
    const unsubscribe = taskService.onTasksChanged((updatedTasks) => {
      setTasks(updatedTasks)
    })

    return unsubscribe
  }, [taskService])

  const createTask = async (title: string) => {
    await taskService.createTask({ title })
    // El listener onTasksChanged actualiza el estado automáticamente
  }

  const completeTask = async (id: number) => {
    await taskService.completeTask(id)
    // El listener onTasksChanged actualiza el estado automáticamente
  }

  return (
    <TaskContext.Provider value={{ tasks, isLoading, createTask, completeTask }}>
      {children}
    </TaskContext.Provider>
  )
}

export const useTask = () => {
  const context = useContext(TaskContext)
  if (!context) {
    throw new Error('useTask must be used within a TaskProvider')
  }
  return context
}
```

### Diferencia entre DIProvider y ModuleProvider

| Aspecto        | DIProvider                 | ModuleProvider (TaskProvider)              |
| -------------- | -------------------------- | ------------------------------------------ |
| **Propósito**  | Proveer servicios (lógica) | Proveer estado reactivo                    |
| **Ubicación**  | `common/context/`          | `modules/[module]/adapters/input/context/` |
| **Contenido**  | Referencias a servicios    | Estado + funciones de mutación             |
| **Re-renders** | No causa re-renders        | Causa re-renders cuando el estado cambia   |

---

## 13. Hooks Reactivos vs Hooks de Servicio

Para optimizar el rendimiento, separamos la suscripción al estado de la ejecución de lógica.

### use[Module] (Reactivo) - Para componentes que pintan datos

Componentes que **muestran datos** y deben re-renderizarse cuando el estado cambia.

```typescript
// modules/task/adapters/input/hooks/use-task.ts
import { useTask as useTaskContext } from '../context/task.context'

// Wrapper simple sobre el contexto
export function useTask() {
  return useTaskContext()
}

// O para datos específicos
export function useTaskById(id: number) {
  const { tasks } = useTaskContext()
  return tasks.find((t) => t.id === id) ?? null
}
```

### use[Module]Service (Lógica) - Para componentes que solo disparan acciones

Componentes que **solo ejecutan acciones** (botones, handlers) y NO deben re-renderizarse.

```typescript
// modules/task/adapters/input/hooks/use-task-service.ts
import { useDI } from '@/common/context/di-context'
import type { TaskInputServiceInterface } from '../../../domain/ports/task.input-service.interface'

export function useTaskService(): TaskInputServiceInterface {
  const { taskService } = useDI()
  return taskService // Acceso directo al puerto de entrada
}
```

### Ejemplo de uso en componentes

```typescript
import { ButtonSizeEnum, ButtonVariantEnum, FxButton, FxSpinner, SpinnerSizeEnum } from '@flux-ui/core'

// Componente que MUESTRA datos (usa hook reactivo)
function TaskList() {
  const { tasks, isLoading } = useTask() // Se re-renderiza cuando tasks cambia

  if (isLoading) return <FxSpinner size={SpinnerSizeEnum.MD} />
  return tasks.map(t => <TaskItem key={t.id} task={t} />)
}

// Componente que SOLO DISPARA acciones (usa hook de servicio)
function QuickCompleteButton({ taskId }: { taskId: number }) {
  const taskService = useTaskService() // NO se re-renderiza

  const handleClick = async () => {
    await taskService.completeTask(taskId)
    // El TaskProvider actualiza el estado vía listener
  }

  return (
    <FxButton size={ButtonSizeEnum.SM} variant={ButtonVariantEnum.Secondary} onClick={handleClick}>
      Complete
    </FxButton>
  )
}
```

---

## 14. Sincronización Global (Listeners)

Cuando un comando se ejecuta a través de un servicio, los componentes interesados deben ser
notificados.

### Puerto con método de suscripción

```typescript
// domain/ports/[module].input-service.interface.ts
export interface TaskInputServiceInterface {
  // Métodos de comando
  createTask(dto: CreateTaskDTO): Promise<TaskModel>
  completeTask(id: number): Promise<TaskModel>

  // Método de suscripción para sincronización
  onTasksChanged(callback: (tasks: TaskModel[]) => void): () => void
}
```

### Implementación del servicio con listeners

```typescript
// application/[module].service.ts
export class TaskService implements TaskInputServiceInterface {
  private listeners: ((tasks: TaskModel[]) => void)[] = []

  constructor(
    private readonly repository: TaskRepositoryInterface
    // ... otros casos de uso
  ) {}

  async completeTask(id: number): Promise<TaskModel> {
    const task = await this.completeTaskUseCase.execute(id)
    await this.notifyAll() // Notificar a todos los listeners
    return task
  }

  // Suscripción: retorna función de cleanup
  onTasksChanged(callback: (tasks: TaskModel[]) => void): () => void {
    this.listeners.push(callback)
    return () => {
      this.listeners = this.listeners.filter((l) => l !== callback)
    }
  }

  private async notifyAll(): Promise<void> {
    const result = await this.repository.findAll({})
    this.listeners.forEach((l) => l(result.items))
  }
}
```

### Suscripción desde el contexto del módulo

```typescript
// adapters/input/context/task.context.tsx
useEffect(() => {
  // Carga inicial
  taskService.search({}).then((result) => setTasks(result.items))

  // Suscripción a cambios futuros
  const unsubscribe = taskService.onTasksChanged(setTasks)

  return unsubscribe // Cleanup al desmontar
}, [taskService])
```

---

## 15. Mappers de Persistencia (Infraestructura)

Para evitar que el dominio se acople a los formatos de almacenamiento (JSON, API responses, DB
schemas), usamos Mappers en la capa de adaptadores de salida.

### DTO de Persistencia

```typescript
// adapters/output/mappers/[module].mapper.ts
export interface TaskPersistenceDTO {
  id: number
  title: string
  status: string
  created_at: string // snake_case del backend
}
```

### Mapper con métodos bidireccionales

```typescript
// adapters/output/mappers/[module].mapper.ts
import { TaskModel } from '../../../domain/models/task.model'
import { Status } from '../../../domain/value-objects/status.vo'

export class TaskMapper {
  // Dominio → Persistencia (para guardar)
  static toPersistence(model: TaskModel): TaskPersistenceDTO {
    return {
      id: model.id,
      title: model.title.getValue(),
      status: model.status.getValue(),
      created_at: model.createdAt.toISOString(),
    }
  }

  // Persistencia → Dominio (para cargar)
  static toDomain(dto: TaskPersistenceDTO): TaskModel {
    return TaskModel.create({
      id: dto.id,
      title: dto.title,
      status: Status.create(dto.status),
      createdAt: new Date(dto.created_at),
    })
  }
}
```

### Uso en el repositorio

```typescript
// adapters/output/local-storage-task.repository.ts
import { TaskMapper } from './mappers/task.mapper'
import type { TaskRepositoryInterface } from '../../domain/ports/task.repository.interface'

const STORAGE_KEY = 'tasks'

export class LocalStorageTaskRepository implements TaskRepositoryInterface {
  async save(task: TaskModel): Promise<void> {
    const data = TaskMapper.toPersistence(task)
    const tasks = this.loadAll()
    tasks[data.id] = data
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks))
  }

  async findById(id: number): Promise<TaskModel | null> {
    const tasks = this.loadAll()
    const data = tasks[id]

    if (!data) return null

    return TaskMapper.toDomain(data)
  }

  private loadAll(): Record<number, TaskPersistenceDTO> {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  }
}
```

### Beneficios

1. **Desacoplamiento**: El dominio no conoce el formato de persistencia
2. **Flexibilidad**: Fácil cambiar entre localStorage, HTTP, IndexedDB
3. **Transformación**: Manejo de snake_case ↔ camelCase, ISO dates, etc.
4. **Testing**: Fácil crear mocks del mapper

---

## 16. Páginas (Adaptadores de Entrada)

Las páginas son adaptadores de entrada que componen componentes de uno o varios módulos. Su
ubicación depende de si son exclusivas de un módulo o composiciones multi-módulo.

### Regla de ubicación de páginas

| Tipo de página               | Ubicación                                | Ejemplo                    |
| ---------------------------- | ---------------------------------------- | -------------------------- |
| **Exclusiva de un módulo**   | `modules/[module]/adapters/input/pages/` | Página de detalle de tarea |
| **Composición multi-módulo** | `common/adapters/input/pages/`           | Dashboard, Settings        |
| **Genérica (404, error)**    | `common/adapters/input/pages/`           | NotFound, Error            |
| **Landing (sin módulo)**     | `common/adapters/input/pages/`           | Home, About                |

### Estructura de páginas

```
src/
├── common/
│   └── adapters/
│       └── input/
│           └── pages/                    # Páginas compartidas
│               ├── home.page.tsx         # Landing - no pertenece a módulo
│               ├── dashboard.page.tsx    # Compone: tasks + calendar + theme
│               ├── settings.page.tsx     # Compone: theme + user + notifications
│               ├── not-found.page.tsx    # Genérica
│               └── index.ts              # Exportaciones
└── modules/
    ├── tasks/
    │   └── adapters/
    │       └── input/
    │           └── pages/                # Páginas exclusivas de tasks
    │               ├── tasks.page.tsx    # Lista de tareas
    │               ├── task-detail.page.tsx
    │               └── index.ts
    └── calendar/
        └── adapters/
            └── input/
                └── pages/                # Páginas exclusivas de calendar
                    └── calendar.page.tsx
```

### Convención de nombres

- Archivos: `[nombre].page.tsx` (sufijo `.page`)
- Exports: `[Nombre]Page` (sufijo `Page`)

### Ejemplo de página de composición multi-módulo

```typescript
// common/adapters/input/pages/dashboard.page.tsx
import { TaskStats, TaskList } from '@/modules/tasks'
import { CalendarWidget } from '@/modules/calendar'
import { NotificationBell } from '@/modules/notifications'

export function DashboardPage() {
    return (
        <div className="space-y-6">
            <h1>Dashboard</h1>
            {/* Compone componentes de múltiples módulos */}
            <TaskStats />
            <div className="grid grid-cols-2 gap-4">
                <TaskList />
                <CalendarWidget />
            </div>
        </div>
    )
}
```

### Ejemplo de página exclusiva de módulo

```typescript
// modules/tasks/adapters/input/pages/task-detail.page.tsx
import { useParams } from 'react-router-dom'
import { useTask } from '../hooks/use-task'
import { TaskForm } from '../components/task-form'
import { TaskComments } from '../components/task-comments'

export function TaskDetailPage() {
    const { id } = useParams<{ id: string }>()
    const { task, isLoading } = useTask(Number(id))

    if (isLoading) return <Spinner />
    if (!task) return <NotFound />

    return (
        <div>
            <TaskForm task={task} />
            <TaskComments taskId={task.id} />
        </div>
    )
}
```

### Configuración de rutas

```typescript
// routes/index.tsx
import { createBrowserRouter } from 'react-router-dom'

// Páginas compartidas (composición multi-módulo)
import {
    HomePage,
    DashboardPage,
    SettingsPage,
    NotFoundPage,
} from '@/common/adapters/input/pages'

// Páginas de módulos específicos
import { TasksPage, TaskDetailPage } from '@/modules/tasks'
import { CalendarPage } from '@/modules/calendar'

const router = createBrowserRouter([
    {
        path: '/',
        element: <RootLayout />,
        errorElement: <NotFoundPage />,
        children: [
            { index: true, element: <HomePage /> },           // common
            { path: 'dashboard', element: <DashboardPage /> }, // common
            { path: 'settings', element: <SettingsPage /> },   // common
            { path: 'tasks', element: <TasksPage /> },         // módulo tasks
            { path: 'tasks/:id', element: <TaskDetailPage /> }, // módulo tasks
            { path: 'calendar', element: <CalendarPage /> },   // módulo calendar
        ],
    },
])
```

### Principios clave

1. **Las páginas son adaptadores de entrada** - Conectan la UI con la aplicación
2. **Las páginas no contienen lógica de negocio** - Solo componen y organizan
3. **Las páginas delegan a componentes de módulos** - Cada módulo expone sus propios componentes
4. **Ubicación por pertenencia** - Si es de un módulo, va en el módulo; si es compartida, va en
   common

---

## Checklist de Implementación

### Al crear un nuevo módulo:

- [ ] **Dominio** (`modules/[module]/domain/`)
  - [ ] Value objects con validación y constantes exportadas (`VALID_*`)
  - [ ] Modelo de entidad con factory method (`create()`, `default()`)
  - [ ] Métodos de comportamiento en el modelo
  - [ ] Errores de dominio específicos del módulo (`domain/errors/[module].error.ts`)
  - [ ] Eventos de dominio (si aplica)
  - [ ] Puertos (interfaces) definidos (`ports/`)

- [ ] **Aplicación** (`modules/[module]/application/`)
  - [ ] DTOs separados del dominio (`dtos/`)
  - [ ] Casos de uso específicos (`use-cases/`)
  - [ ] Servicio orquestador con listeners (`[module].service.ts`)
  - [ ] Método `on[Entity]Changed()` para sincronización

- [ ] **Adaptadores** (`modules/[module]/adapters/`)
  - [ ] **Input**:
    - [ ] Contexto del módulo si necesita estado reactivo (`input/context/`)
    - [ ] Hook reactivo `use[Module]()` para componentes que pintan datos
    - [ ] Hook de servicio `use[Module]Service()` para acciones
    - [ ] Componentes UI sin lógica de negocio (`input/components/`)
    - [ ] Páginas exclusivas del módulo (`input/pages/[module].page.tsx`) - solo si aplica
  - [ ] **Output**:
    - [ ] Mappers de persistencia (`output/mappers/[module].mapper.ts`)
    - [ ] Repositorio implementando puerto (`output/[module].repository.ts`)

- [ ] **Módulo**
  - [ ] Factory del módulo (`[module].factory.ts`)
  - [ ] Exportaciones públicas en `index.ts`
  - [ ] Registrar en `DIProvider` (`common/context/di-context.tsx`)

- [ ] **Testing**
  - [ ] Tests unitarios de value objects
  - [ ] Tests unitarios de modelos
  - [ ] Tests de casos de uso
  - [ ] Tests de integración

### Al agregar código a common:

- [ ] **¿Es realmente compartido?**
  - [ ] Lo usan 2+ módulos diferentes
  - [ ] No tiene lógica de negocio específica de un módulo
  - [ ] Es genérico y reutilizable

- [ ] **Ubicación correcta**
  - [ ] `common/domain/errors/` → Errores base (DomainError, NotFoundError)
  - [ ] `common/domain/interfaces/` → Interfaces genéricas (paginación, filtros)
  - [ ] `common/domain/value-objects/` → Value objects genéricos (Email, DateRange)
  - [ ] `common/adapters/output/http/` → Infraestructura HTTP compartida
  - [ ] Componentes UI base → Importar de `@flux-ui/core` (FxButton, FxInput, etc.)
  - [ ] `common/adapters/input/components/` → Componentes personalizados sin lógica de negocio
  - [ ] `common/adapters/input/pages/` → Páginas de composición multi-módulo o genéricas
  - [ ] `common/context/` → Contextos React y DI
  - [ ] `common/hooks/` → Hooks React reutilizables
  - [ ] `common/guards/` → Guards de autorización
  - [ ] `common/utils/` → Funciones puras de utilidad

- [ ] **Dependencias correctas**
  - [ ] No depende de módulos específicos
  - [ ] `common/utils/` no tiene dependencias
  - [ ] `common/domain/` no depende de frameworks

### Al crear una nueva página:

- [ ] **¿Dónde va la página?**
  - [ ] **Exclusiva de un módulo** → `modules/[module]/adapters/input/pages/[nombre].page.tsx`
    - [ ] Solo usa componentes de ese módulo
    - [ ] Exportada en `modules/[module]/adapters/input/pages/index.ts`
    - [ ] Importada en `routes/index.tsx` desde el módulo
  - [ ] **Composición multi-módulo** → `common/adapters/input/pages/[nombre].page.tsx`
    - [ ] Compone componentes de 2+ módulos diferentes
    - [ ] Exportada en `common/adapters/input/pages/index.ts`
    - [ ] Importada en `routes/index.tsx` desde common
  - [ ] **Genérica (404, error)** → `common/adapters/input/pages/[nombre].page.tsx`
    - [ ] No pertenece a ningún módulo específico
    - [ ] Exportada en `common/adapters/input/pages/index.ts`

- [ ] **Convención de nombres**
  - [ ] Archivo: `[nombre].page.tsx` (sufijo `.page`)
  - [ ] Componente: `[Nombre]Page` (sufijo `Page`)
  - [ ] Export en `index.ts` del directorio

- [ ] **Reglas de la página**
  - [ ] No contiene lógica de negocio (solo composición)
  - [ ] Delega a componentes de módulos
  - [ ] Usa hooks de módulos para obtener datos
  - [ ] Registrada en `routes/index.tsx`

---

## Recursos Adicionales

- Para ejemplos completos, ver `EXAMPLES.md`
- Para patrones avanzados (CQRS, Event Sourcing), ver `ADVANCED.md`
