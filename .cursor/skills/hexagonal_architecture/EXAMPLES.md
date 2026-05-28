# Ejemplos Prácticos - Antigravity Hexagonal

## Ejemplo Completo: Módulo de Tareas

Este ejemplo muestra un módulo completo siguiendo todas las prácticas de Antigravity.

---

## Estructura del Módulo

```
modules/task/
├── domain/
│   ├── models/
│   │   └── task.model.ts
│   ├── value-objects/
│   │   ├── task-title.vo.ts
│   │   └── task-description.vo.ts
│   ├── events/
│   │   ├── task-created.event.ts
│   │   ├── task-completed.event.ts
│   │   └── task-assigned.event.ts
│   ├── errors/
│   │   └── task.errors.ts
│   └── ports/
│       ├── task.input-service.interface.ts
│       └── task.output-repository.interface.ts
├── application/
│   ├── use-cases/
│   │   ├── create-task.use-case.ts
│   │   ├── update-task.use-case.ts
│   │   ├── complete-task.use-case.ts
│   │   └── assign-task.use-case.ts
│   ├── dtos/
│   │   └── task.dto.ts
│   └── task.service.ts
├── adapters/
│   ├── input/
│   │   └── components/
│   │       ├── create-task-form.tsx
│   │       └── task-list.tsx
│   └── output/
│       ├── task-http.repository.ts
│       ├── task.repository.mock.ts
│       └── repository.provider.ts
└── index.ts
```

---

## 1. Value Objects

### task-title.vo.ts

```typescript
import { DomainError } from '@common/domain/errors/domain.error'

export class TaskTitle {
  private static readonly MIN_LENGTH = 3
  private static readonly MAX_LENGTH = 250

  private constructor(private readonly value: string) {}

  static create(value: string): TaskTitle {
    const trimmed = value?.trim() ?? ''

    if (!trimmed) {
      throw new DomainError('Title is required', 'TITLE_REQUIRED')
    }

    if (trimmed.length < this.MIN_LENGTH) {
      throw new DomainError(
        `Title must be at least ${this.MIN_LENGTH} characters`,
        'TITLE_TOO_SHORT'
      )
    }

    if (trimmed.length > this.MAX_LENGTH) {
      throw new DomainError(`Title must not exceed ${this.MAX_LENGTH} characters`, 'TITLE_TOO_LONG')
    }

    return new TaskTitle(trimmed)
  }

  getValue(): string {
    return this.value
  }

  equals(other: TaskTitle): boolean {
    if (!(other instanceof TaskTitle)) return false
    return this.value === other.value
  }

  toString(): string {
    return this.value
  }
}
```

### task-description.vo.ts

```typescript
import { DomainError } from '@common/domain/errors/domain.error'

export class TaskDescription {
  private static readonly MAX_LENGTH = 2000

  private constructor(private readonly value: string) {}

  static create(value: string | null | undefined): TaskDescription {
    const trimmed = value?.trim() ?? ''

    if (trimmed.length > this.MAX_LENGTH) {
      throw new DomainError(
        `Description must not exceed ${this.MAX_LENGTH} characters`,
        'DESCRIPTION_TOO_LONG'
      )
    }

    return new TaskDescription(trimmed)
  }

  getValue(): string {
    return this.value
  }

  isEmpty(): boolean {
    return this.value.length === 0
  }

  equals(other: TaskDescription): boolean {
    if (!(other instanceof TaskDescription)) return false
    return this.value === other.value
  }
}
```

---

## 2. Errores de Dominio

### task.errors.ts

```typescript
import { DomainError } from '@common/domain/errors/domain.error'

export class TaskNotFoundError extends DomainError {
  constructor(taskId: number) {
    super(`Task with id ${taskId} not found`, 'TASK_NOT_FOUND', { taskId })
    this.name = 'TaskNotFoundError'
  }
}

export class TaskAlreadyCompletedError extends DomainError {
  constructor(taskId: number) {
    super(`Task ${taskId} is already completed`, 'TASK_ALREADY_COMPLETED', { taskId })
    this.name = 'TaskAlreadyCompletedError'
  }
}

export class TaskCannotBeAssignedError extends DomainError {
  constructor(taskId: number, reason: string) {
    super(`Task ${taskId} cannot be assigned: ${reason}`, 'TASK_CANNOT_BE_ASSIGNED', {
      taskId,
      reason,
    })
    this.name = 'TaskCannotBeAssignedError'
  }
}

export class InvalidEndDateError extends DomainError {
  constructor() {
    super('End date cannot be in the past', 'INVALID_END_DATE')
    this.name = 'InvalidEndDateError'
  }
}
```

---

## 3. Eventos de Dominio

### task-created.event.ts

```typescript
import { DomainEvent } from '@common/domain/events/domain-event.interface'
import { TaskModel } from '../models/task.model'

export class TaskCreatedEvent implements DomainEvent {
  readonly eventType = 'task.created'
  readonly occurredOn: Date

  constructor(
    public readonly taskId: number,
    public readonly title: string,
    public readonly creatorId: number,
    public readonly assigneeId: number | null
  ) {
    this.occurredOn = new Date()
  }

  static fromTask(task: TaskModel): TaskCreatedEvent {
    return new TaskCreatedEvent(task.id, task.title.getValue(), task.creatorId, task.assigneeId)
  }
}
```

### task-completed.event.ts

```typescript
import { DomainEvent } from '@common/domain/events/domain-event.interface'

export class TaskCompletedEvent implements DomainEvent {
  readonly eventType = 'task.completed'
  readonly occurredOn: Date

  constructor(
    public readonly taskId: number,
    public readonly completedBy: number,
    public readonly completedAt: Date = new Date()
  ) {
    this.occurredOn = new Date()
  }
}
```

---

## 4. Modelo de Dominio

### task.model.ts

```typescript
import { DomainEvent } from '@common/domain/events/domain-event.interface'
import { TaskTitle } from '../value-objects/task-title.vo'
import { TaskDescription } from '../value-objects/task-description.vo'
import { TaskCreatedEvent } from '../events/task-created.event'
import { TaskCompletedEvent } from '../events/task-completed.event'
import { TaskAssignedEvent } from '../events/task-assigned.event'
import {
  TaskAlreadyCompletedError,
  TaskCannotBeAssignedError,
  InvalidEndDateError,
} from '../errors/task.errors'

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

interface TaskProps {
  id?: number
  title: string
  description?: string
  status?: TaskStatus
  priority?: TaskPriority
  endDate?: Date | null
  creatorId: number
  assigneeId?: number | null
  createdAt?: Date
  updatedAt?: Date
}

export class TaskModel {
  private _domainEvents: DomainEvent[] = []

  public readonly id: number
  public title: TaskTitle
  public description: TaskDescription
  public status: TaskStatus
  public priority: TaskPriority
  public endDate: Date | null
  public readonly creatorId: number
  public assigneeId: number | null
  public readonly createdAt: Date
  public updatedAt: Date

  private constructor(props: {
    id: number
    title: TaskTitle
    description: TaskDescription
    status: TaskStatus
    priority: TaskPriority
    endDate: Date | null
    creatorId: number
    assigneeId: number | null
    createdAt: Date
    updatedAt: Date
  }) {
    this.id = props.id
    this.title = props.title
    this.description = props.description
    this.status = props.status
    this.priority = props.priority
    this.endDate = props.endDate
    this.creatorId = props.creatorId
    this.assigneeId = props.assigneeId
    this.createdAt = props.createdAt
    this.updatedAt = props.updatedAt
  }

  // ============ Factory Methods ============

  static create(props: TaskProps): TaskModel {
    // Validar fecha de vencimiento
    if (props.endDate && props.endDate < new Date()) {
      throw new InvalidEndDateError()
    }

    const now = new Date()
    const task = new TaskModel({
      id: props.id ?? 0,
      title: TaskTitle.create(props.title),
      description: TaskDescription.create(props.description),
      status: props.status ?? TaskStatus.Active,
      priority: props.priority ?? TaskPriority.Medium,
      endDate: props.endDate ?? null,
      creatorId: props.creatorId,
      assigneeId: props.assigneeId ?? null,
      createdAt: props.createdAt ?? now,
      updatedAt: props.updatedAt ?? now,
    })

    // Solo emitir evento si es una nueva tarea
    if (!props.id) {
      task.addDomainEvent(TaskCreatedEvent.fromTask(task))
    }

    return task
  }

  static reconstitute(props: TaskProps): TaskModel {
    // Para rehidratar desde persistencia sin validaciones ni eventos
    return new TaskModel({
      id: props.id!,
      title: TaskTitle.create(props.title),
      description: TaskDescription.create(props.description),
      status: props.status!,
      priority: props.priority ?? TaskPriority.Medium,
      endDate: props.endDate ?? null,
      creatorId: props.creatorId,
      assigneeId: props.assigneeId ?? null,
      createdAt: props.createdAt!,
      updatedAt: props.updatedAt!,
    })
  }

  // ============ Behavior Methods ============

  complete(completedBy: number): void {
    if (this.status === TaskStatus.Completed) {
      throw new TaskAlreadyCompletedError(this.id)
    }

    this.status = TaskStatus.Completed
    this.updatedAt = new Date()
    this.addDomainEvent(new TaskCompletedEvent(this.id, completedBy))
  }

  assign(assigneeId: number): void {
    if (this.status === TaskStatus.Completed) {
      throw new TaskCannotBeAssignedError(this.id, 'Task is completed')
    }

    if (this.status === TaskStatus.Deleted) {
      throw new TaskCannotBeAssignedError(this.id, 'Task is deleted')
    }

    const previousAssignee = this.assigneeId
    this.assigneeId = assigneeId
    this.updatedAt = new Date()

    this.addDomainEvent(new TaskAssignedEvent(this.id, assigneeId, previousAssignee))
  }

  unassign(): void {
    if (this.status !== TaskStatus.Active) {
      throw new TaskCannotBeAssignedError(this.id, 'Task is not active')
    }

    this.assigneeId = null
    this.updatedAt = new Date()
  }

  updateTitle(newTitle: string): void {
    this.title = TaskTitle.create(newTitle)
    this.updatedAt = new Date()
  }

  updateDescription(newDescription: string): void {
    this.description = TaskDescription.create(newDescription)
    this.updatedAt = new Date()
  }

  updatePriority(newPriority: TaskPriority): void {
    this.priority = newPriority
    this.updatedAt = new Date()
  }

  updateEndDate(newEndDate: Date | null): void {
    if (newEndDate && newEndDate < new Date()) {
      throw new InvalidEndDateError()
    }
    this.endDate = newEndDate
    this.updatedAt = new Date()
  }

  delete(): void {
    this.status = TaskStatus.Deleted
    this.updatedAt = new Date()
  }

  // ============ Query Methods ============

  isOverdue(): boolean {
    return this.status === TaskStatus.Active && this.endDate !== null && this.endDate < new Date()
  }

  isActive(): boolean {
    return this.status === TaskStatus.Active
  }

  isCompleted(): boolean {
    return this.status === TaskStatus.Completed
  }

  isAssigned(): boolean {
    return this.assigneeId !== null
  }

  isAssignedTo(userId: number): boolean {
    return this.assigneeId === userId
  }

  // ============ Domain Events ============

  private addDomainEvent(event: DomainEvent): void {
    this._domainEvents.push(event)
  }

  getDomainEvents(): DomainEvent[] {
    return [...this._domainEvents]
  }

  clearDomainEvents(): void {
    this._domainEvents = []
  }
}
```

---

## 5. Caso de Uso

### create-task.use-case.ts

```typescript
import { TaskModel, TaskPriority } from '../domain/models/task.model'
import { TaskOutputRepositoryInterface } from '../domain/ports/task.output-repository.interface'
import { CreateTaskDTO } from './dtos/task.dto'
import { EventPublisher } from '@common/events/event-publisher'

export class CreateTaskUseCase {
  constructor(
    private readonly taskRepository: TaskOutputRepositoryInterface,
    private readonly eventPublisher: EventPublisher
  ) {}

  async execute(dto: CreateTaskDTO, creatorId: number): Promise<TaskModel> {
    // 1. Crear entidad de dominio (validación automática)
    const task = TaskModel.create({
      title: dto.title,
      description: dto.description,
      priority: dto.priority ?? TaskPriority.Medium,
      endDate: dto.endDate,
      creatorId: creatorId,
      assigneeId: dto.assigneeId,
    })

    // 2. Persistir
    const savedTask = await this.taskRepository.save(task)

    // 3. Publicar eventos de dominio
    await this.publishDomainEvents(savedTask)

    return savedTask
  }

  private async publishDomainEvents(task: TaskModel): Promise<void> {
    const events = task.getDomainEvents()

    for (const event of events) {
      await this.eventPublisher.publish(event)
    }

    task.clearDomainEvents()
  }
}
```

### complete-task.use-case.ts

```typescript
import { TaskModel } from '../domain/models/task.model'
import { TaskOutputRepositoryInterface } from '../domain/ports/task.output-repository.interface'
import { TaskNotFoundError } from '../domain/errors/task.errors'
import { EventPublisher } from '@common/events/event-publisher'

export class CompleteTaskUseCase {
  constructor(
    private readonly taskRepository: TaskOutputRepositoryInterface,
    private readonly eventPublisher: EventPublisher
  ) {}

  async execute(taskId: number, completedBy: number): Promise<TaskModel> {
    // 1. Obtener la tarea
    const task = await this.taskRepository.findById(taskId)

    if (!task) {
      throw new TaskNotFoundError(taskId)
    }

    // 2. Aplicar lógica de negocio (validación dentro del modelo)
    task.complete(completedBy)

    // 3. Persistir
    const savedTask = await this.taskRepository.save(task)

    // 4. Publicar eventos
    await this.publishDomainEvents(savedTask)

    return savedTask
  }

  private async publishDomainEvents(task: TaskModel): Promise<void> {
    const events = task.getDomainEvents()

    for (const event of events) {
      await this.eventPublisher.publish(event)
    }

    task.clearDomainEvents()
  }
}
```

---

## 6. DTOs

### task.dto.ts

```typescript
import { TaskPriority, TaskStatus } from '../domain/models/task.model'

// ============ Input DTOs ============

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
}

export interface AssignTaskDTO {
  taskId: number
  assigneeId: number
}

// ============ Output DTOs ============

export interface TaskResponseDTO {
  id: number
  title: string
  description: string
  status: string
  priority: number
  endDate: string | null
  creatorId: number
  assigneeId: number | null
  createdAt: string
  updatedAt: string
  isOverdue: boolean
}

// ============ Mapper ============

import { TaskModel } from '../domain/models/task.model'

export class TaskMapper {
  static toResponseDTO(task: TaskModel): TaskResponseDTO {
    return {
      id: task.id,
      title: task.title.getValue(),
      description: task.description.getValue(),
      status: task.status,
      priority: task.priority,
      endDate: task.endDate?.toISOString() ?? null,
      creatorId: task.creatorId,
      assigneeId: task.assigneeId,
      createdAt: task.createdAt.toISOString(),
      updatedAt: task.updatedAt.toISOString(),
      isOverdue: task.isOverdue(),
    }
  }

  static toResponseDTOList(tasks: TaskModel[]): TaskResponseDTO[] {
    return tasks.map(this.toResponseDTO)
  }
}
```

---

## 7. Servicio de Aplicación

### task.service.ts

```typescript
import { TaskInputServiceInterface } from '../domain/ports/task.input-service.interface'
import { TaskOutputRepositoryInterface } from '../domain/ports/task.output-repository.interface'
import { TaskModel } from '../domain/models/task.model'
import { CreateTaskUseCase } from './use-cases/create-task.use-case'
import { CompleteTaskUseCase } from './use-cases/complete-task.use-case'
import { AssignTaskUseCase } from './use-cases/assign-task.use-case'
import { CreateTaskDTO, UpdateTaskDTO } from './dtos/task.dto'
import { TaskNotFoundError } from '../domain/errors/task.errors'
import { FilterWithPagination, PaginatedResponse } from '@common/domain/interfaces'

export class TaskService implements TaskInputServiceInterface {
  constructor(
    private readonly createTaskUseCase: CreateTaskUseCase,
    private readonly completeTaskUseCase: CompleteTaskUseCase,
    private readonly assignTaskUseCase: AssignTaskUseCase,
    private readonly taskRepository: TaskOutputRepositoryInterface
  ) {}

  async createTask(dto: CreateTaskDTO, creatorId: number): Promise<TaskModel> {
    return await this.createTaskUseCase.execute(dto, creatorId)
  }

  async completeTask(taskId: number, completedBy: number): Promise<TaskModel> {
    return await this.completeTaskUseCase.execute(taskId, completedBy)
  }

  async assignTask(taskId: number, assigneeId: number): Promise<TaskModel> {
    return await this.assignTaskUseCase.execute(taskId, assigneeId)
  }

  async updateTask(dto: UpdateTaskDTO): Promise<TaskModel> {
    const task = await this.taskRepository.findById(dto.id)

    if (!task) {
      throw new TaskNotFoundError(dto.id)
    }

    // Aplicar cambios usando métodos del modelo
    if (dto.title !== undefined) {
      task.updateTitle(dto.title)
    }

    if (dto.description !== undefined) {
      task.updateDescription(dto.description)
    }

    if (dto.priority !== undefined) {
      task.updatePriority(dto.priority)
    }

    if (dto.endDate !== undefined) {
      task.updateEndDate(dto.endDate)
    }

    return await this.taskRepository.save(task)
  }

  async deleteTask(taskId: number): Promise<void> {
    const task = await this.taskRepository.findById(taskId)

    if (!task) {
      throw new TaskNotFoundError(taskId)
    }

    task.delete()
    await this.taskRepository.save(task)
  }

  async getTask(taskId: number): Promise<TaskModel> {
    const task = await this.taskRepository.findById(taskId)

    if (!task) {
      throw new TaskNotFoundError(taskId)
    }

    return task
  }

  async search(filter: FilterWithPagination<TaskModel>): Promise<PaginatedResponse<TaskModel>> {
    return await this.taskRepository.findAll(filter)
  }
}
```

---

## 8. Componente UI (Adaptador de Entrada)

### create-task-form.tsx

Componentes de `@flux-ui/core`. Asegúrate de importar los CSS necesarios en
`src/assets/flux-ui.scss`.

```typescript
import React, { useState } from 'react'
import { useTaskServices } from '@common/context/di-context'
import { useCurrentUser } from '@common/hooks/use-current-user'
import { DomainError } from '@common/domain/errors/domain.error'
import { CreateTaskDTO } from '../../application/dtos/task.dto'
import { TaskPriority } from '../../domain/models/task.model'
import {
  ButtonSizeEnum,
  ButtonVariantEnum,
  FxButton,
  FxDatePicker,
  FxInput,
  FxSelect,
} from '@flux-ui/core'

const PRIORITY_OPTIONS = [
  { label: 'Low', value: String(TaskPriority.Low) },
  { label: 'Medium', value: String(TaskPriority.Medium) },
  { label: 'High', value: String(TaskPriority.High) },
]

interface CreateTaskFormProps {
  onSuccess?: () => void
  onCancel?: () => void
}

export const CreateTaskForm: React.FC<CreateTaskFormProps> = ({
  onSuccess,
  onCancel,
}) => {
  const taskService = useTaskServices()
  const { user } = useCurrentUser()

  const [formData, setFormData] = useState<CreateTaskDTO>({
    title: '',
    description: '',
    priority: TaskPriority.Medium,
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleInputChange = (
    field: keyof CreateTaskDTO,
    value: string | number | Date | undefined
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setError(null) // Limpiar error al escribir
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      // ✅ Toda la validación ocurre en el servicio/dominio
      await taskService.createTask(formData, user.id)
      onSuccess?.()
    } catch (err) {
      // ✅ Manejo centralizado de errores de dominio
      if (err instanceof DomainError) {
        setError(err.message)
      } else {
        setError('An unexpected error occurred. Please try again.')
        console.error('CreateTaskForm error:', err)
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="create-task-form">
      {error && (
        <div className="error-message" role="alert">
          {error}
        </div>
      )}

      <div className="form-field">
        <label htmlFor="title">Title *</label>
        <FxInput
          id="title"
          type="text"
          value={formData.title}
          onChange={(e) => handleInputChange('title', e.target.value)}
          placeholder="Enter task title"
          disabled={isLoading}
        />
      </div>

      <div className="form-field">
        <label htmlFor="description">Description</label>
        <FxInput
          id="description"
          type="text"
          value={formData.description ?? ''}
          onChange={(e) => handleInputChange('description', e.target.value)}
          placeholder="Enter task description"
          disabled={isLoading}
        />
      </div>

      <div className="form-field">
        <label htmlFor="priority">Priority</label>
        <FxSelect
          mode="single"
          label=""
          options={PRIORITY_OPTIONS}
          value={String(formData.priority)}
          onValueChange={(value) => handleInputChange('priority', Number(value))}
          placeholder="Select priority"
          disabled={isLoading}
        />
      </div>

      <div className="form-field">
        <label htmlFor="endDate">Due Date</label>
        <FxDatePicker
          mode="single"
          value={formData.endDate ?? null}
          onChange={(date) => handleInputChange('endDate', date ?? undefined)}
          placeholder="Select due date"
          dateFormat="dd/MM/yyyy"
        />
      </div>

      <div className="form-actions">
        <FxButton
          type="button"
          size={ButtonSizeEnum.MD}
          variant={ButtonVariantEnum.Secondary}
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancel
        </FxButton>
        <FxButton
          type="submit"
          size={ButtonSizeEnum.MD}
          variant={ButtonVariantEnum.Primary}
          disabled={isLoading}
        >
          {isLoading ? 'Creating...' : 'Create Task'}
        </FxButton>
      </div>
    </form>
  )
}
```

---

## 9. Tests Unitarios

### task.model.spec.ts

```typescript
import { TaskModel, TaskStatus, TaskPriority } from '../task.model'
import { TaskAlreadyCompletedError, InvalidEndDateError } from '../errors/task.errors'

describe('TaskModel', () => {
  const validProps = {
    title: 'Test Task',
    description: 'A test task description',
    creatorId: 1,
  }

  describe('create', () => {
    it('should create a task with valid properties', () => {
      const task = TaskModel.create(validProps)

      expect(task.title.getValue()).toBe('Test Task')
      expect(task.description.getValue()).toBe('A test task description')
      expect(task.status).toBe(TaskStatus.Active)
      expect(task.priority).toBe(TaskPriority.Medium)
    })

    it('should throw error for empty title', () => {
      expect(() => TaskModel.create({ ...validProps, title: '' })).toThrow('Title is required')
    })

    it('should throw error for title too short', () => {
      expect(() => TaskModel.create({ ...validProps, title: 'ab' })).toThrow(
        'Title must be at least 3 characters'
      )
    })

    it('should throw error for end date in the past', () => {
      const pastDate = new Date()
      pastDate.setDate(pastDate.getDate() - 1)

      expect(() => TaskModel.create({ ...validProps, endDate: pastDate })).toThrow(
        InvalidEndDateError
      )
    })

    it('should emit TaskCreatedEvent for new task', () => {
      const task = TaskModel.create(validProps)
      const events = task.getDomainEvents()

      expect(events).toHaveLength(1)
      expect(events[0].eventType).toBe('task.created')
    })
  })

  describe('complete', () => {
    it('should complete an active task', () => {
      const task = TaskModel.create(validProps)
      task.complete(1)

      expect(task.status).toBe(TaskStatus.Completed)
    })

    it('should throw error when completing already completed task', () => {
      const task = TaskModel.create(validProps)
      task.complete(1)

      expect(() => task.complete(1)).toThrow(TaskAlreadyCompletedError)
    })

    it('should emit TaskCompletedEvent', () => {
      const task = TaskModel.create(validProps)
      task.clearDomainEvents() // Limpiar evento de creación

      task.complete(1)
      const events = task.getDomainEvents()

      expect(events).toHaveLength(1)
      expect(events[0].eventType).toBe('task.completed')
    })
  })

  describe('assign', () => {
    it('should assign a user to the task', () => {
      const task = TaskModel.create(validProps)
      task.assign(42)

      expect(task.assigneeId).toBe(42)
    })

    it('should throw error when assigning completed task', () => {
      const task = TaskModel.create(validProps)
      task.complete(1)

      expect(() => task.assign(42)).toThrow('Task is completed')
    })
  })

  describe('isOverdue', () => {
    it('should return true for overdue active task', () => {
      const pastDate = new Date()
      pastDate.setDate(pastDate.getDate() - 1)

      // Usar reconstitute para evitar validación de fecha
      const task = TaskModel.reconstitute({
        ...validProps,
        id: 1,
        status: TaskStatus.Active,
        endDate: pastDate,
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      expect(task.isOverdue()).toBe(true)
    })

    it('should return false for completed task with past date', () => {
      const pastDate = new Date()
      pastDate.setDate(pastDate.getDate() - 1)

      const task = TaskModel.reconstitute({
        ...validProps,
        id: 1,
        status: TaskStatus.Completed,
        endDate: pastDate,
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      expect(task.isOverdue()).toBe(false)
    })
  })
})
```

### create-task.use-case.spec.ts

```typescript
import { CreateTaskUseCase } from '../create-task.use-case'
import { TaskModel, TaskPriority } from '../../domain/models/task.model'

describe('CreateTaskUseCase', () => {
  let useCase: CreateTaskUseCase
  let mockRepository: jest.Mocked<TaskOutputRepositoryInterface>
  let mockEventPublisher: jest.Mocked<EventPublisher>

  beforeEach(() => {
    mockRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      delete: jest.fn(),
    }

    mockEventPublisher = {
      publish: jest.fn(),
    }

    useCase = new CreateTaskUseCase(mockRepository, mockEventPublisher)
  })

  it('should create a task successfully', async () => {
    const dto = {
      title: 'New Task',
      description: 'Task description',
      priority: TaskPriority.High,
    }

    mockRepository.save.mockImplementation(async (task) => task)

    const result = await useCase.execute(dto, 1)

    expect(result.title.getValue()).toBe('New Task')
    expect(result.priority).toBe(TaskPriority.High)
    expect(mockRepository.save).toHaveBeenCalledTimes(1)
    expect(mockEventPublisher.publish).toHaveBeenCalled()
  })

  it('should throw error for invalid title', async () => {
    const dto = {
      title: 'ab', // Too short
      description: 'Task description',
    }

    await expect(useCase.execute(dto, 1)).rejects.toThrow('Title must be at least 3 characters')

    expect(mockRepository.save).not.toHaveBeenCalled()
  })
})
```

---

## Resumen de Beneficios

| Antes                               | Después                                  |
| ----------------------------------- | ---------------------------------------- |
| Validación en UI dispersa           | Validación centralizada en Value Objects |
| Servicios anémicos (solo delegaban) | Servicios con casos de uso y lógica      |
| Modelos sin comportamiento          | Modelos ricos con métodos de dominio     |
| DTOs mezclados con modelos          | DTOs separados con Mappers               |
| Difícil de testear                  | Tests unitarios claros y enfocados       |
| Lógica duplicada                    | Reutilización a través de dominio        |
