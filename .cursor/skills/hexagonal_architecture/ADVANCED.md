# Patrones Avanzados - Antigravity Hexagonal

Patrones avanzados para arquitecturas hexagonales maduras.

---

## 1. Patrón Specification

Para consultas y filtros complejos en el dominio.

```typescript
// domain/specifications/specification.interface.ts
export interface Specification<T> {
  isSatisfiedBy(entity: T): boolean
  and(other: Specification<T>): Specification<T>
  or(other: Specification<T>): Specification<T>
  not(): Specification<T>
}

// domain/specifications/base.specification.ts
export abstract class BaseSpecification<T> implements Specification<T> {
  abstract isSatisfiedBy(entity: T): boolean

  and(other: Specification<T>): Specification<T> {
    return new AndSpecification(this, other)
  }

  or(other: Specification<T>): Specification<T> {
    return new OrSpecification(this, other)
  }

  not(): Specification<T> {
    return new NotSpecification(this)
  }
}

class AndSpecification<T> extends BaseSpecification<T> {
  constructor(
    private readonly left: Specification<T>,
    private readonly right: Specification<T>
  ) {
    super()
  }

  isSatisfiedBy(entity: T): boolean {
    return this.left.isSatisfiedBy(entity) && this.right.isSatisfiedBy(entity)
  }
}

// domain/specifications/task-specifications.ts
export class OverdueTaskSpecification extends BaseSpecification<TaskModel> {
  isSatisfiedBy(task: TaskModel): boolean {
    return task.isOverdue()
  }
}

export class AssignedToUserSpecification extends BaseSpecification<TaskModel> {
  constructor(private readonly userId: number) {
    super()
  }

  isSatisfiedBy(task: TaskModel): boolean {
    return task.isAssignedTo(this.userId)
  }
}

export class HighPrioritySpecification extends BaseSpecification<TaskModel> {
  isSatisfiedBy(task: TaskModel): boolean {
    return task.priority === TaskPriority.High
  }
}

export class ActiveTaskSpecification extends BaseSpecification<TaskModel> {
  isSatisfiedBy(task: TaskModel): boolean {
    return task.isActive()
  }
}

// Uso
const urgentTasksSpec = new OverdueTaskSpecification()
  .and(new HighPrioritySpecification())
  .and(new AssignedToUserSpecification(userId))

const urgentTasks = allTasks.filter((task) => urgentTasksSpec.isSatisfiedBy(task))
```

---

## 2. Domain Events con Event Bus

Sistema de eventos desacoplado.

```typescript
// common/events/event-bus.interface.ts
export interface EventBus {
  publish<T extends DomainEvent>(event: T): Promise<void>
  subscribe<T extends DomainEvent>(eventType: string, handler: EventHandler<T>): void
}

export type EventHandler<T extends DomainEvent> = (event: T) => Promise<void>

// common/events/in-memory-event-bus.ts
export class InMemoryEventBus implements EventBus {
  private handlers: Map<string, EventHandler<any>[]> = new Map()

  subscribe<T extends DomainEvent>(eventType: string, handler: EventHandler<T>): void {
    const existingHandlers = this.handlers.get(eventType) ?? []
    this.handlers.set(eventType, [...existingHandlers, handler])
  }

  async publish<T extends DomainEvent>(event: T): Promise<void> {
    const handlers = this.handlers.get(event.eventType) ?? []

    await Promise.all(handlers.map((handler) => handler(event)))
  }
}

// application/event-handlers/task-created.handler.ts
export class TaskCreatedHandler {
  constructor(
    private readonly notificationService: NotificationService,
    private readonly analyticsService: AnalyticsService
  ) {}

  async handle(event: TaskCreatedEvent): Promise<void> {
    // Enviar notificación al asignado
    if (event.assigneeId) {
      await this.notificationService.send({
        userId: event.assigneeId,
        type: 'task_assigned',
        message: `You have been assigned a new task: ${event.title}`,
      })
    }

    // Registrar en analytics
    await this.analyticsService.track('task_created', {
      taskId: event.taskId,
      creatorId: event.creatorId,
    })
  }
}

// Configuración en bootstrap
const eventBus = new InMemoryEventBus()

eventBus.subscribe('task.created', (event) => taskCreatedHandler.handle(event))

eventBus.subscribe('task.completed', (event) => taskCompletedHandler.handle(event))
```

---

## 3. Unit of Work

Manejo de transacciones y consistencia.

```typescript
// common/persistence/unit-of-work.interface.ts
export interface UnitOfWork {
  begin(): Promise<void>
  commit(): Promise<void>
  rollback(): Promise<void>
  getRepository<T>(name: string): Repository<T>
}

// application/use-cases/create-task-group-with-tasks.use-case.ts
export class CreateTaskGroupWithTasksUseCase {
  constructor(
    private readonly unitOfWork: UnitOfWork,
    private readonly eventBus: EventBus
  ) {}

  async execute(dto: CreateTaskGroupWithTasksDTO): Promise<TaskGroupModel> {
    await this.unitOfWork.begin()

    try {
      const taskGroupRepo = this.unitOfWork.getRepository<TaskGroupModel>('taskGroup')
      const taskRepo = this.unitOfWork.getRepository<TaskModel>('task')

      // Crear grupo de tareas
      const taskGroup = TaskGroupModel.create({
        name: dto.name,
        description: dto.description,
        creatorId: dto.creatorId,
      })

      const savedGroup = await taskGroupRepo.save(taskGroup)

      // Crear tareas asociadas
      const tasks = dto.tasks.map((taskDto) =>
        TaskModel.create({
          ...taskDto,
          taskGroupId: savedGroup.id,
          creatorId: dto.creatorId,
        })
      )

      for (const task of tasks) {
        await taskRepo.save(task)
      }

      await this.unitOfWork.commit()

      // Publicar eventos después del commit
      await this.publishEvents(savedGroup, tasks)

      return savedGroup
    } catch (error) {
      await this.unitOfWork.rollback()
      throw error
    }
  }

  private async publishEvents(group: TaskGroupModel, tasks: TaskModel[]): Promise<void> {
    for (const event of group.getDomainEvents()) {
      await this.eventBus.publish(event)
    }
    group.clearDomainEvents()

    for (const task of tasks) {
      for (const event of task.getDomainEvents()) {
        await this.eventBus.publish(event)
      }
      task.clearDomainEvents()
    }
  }
}
```

---

## 4. CQRS (Command Query Responsibility Segregation)

Separación de operaciones de lectura y escritura.

```typescript
// application/commands/command.interface.ts
export interface Command<TResult = void> {
  readonly type: string
}

export interface CommandHandler<TCommand extends Command<TResult>, TResult = void> {
  execute(command: TCommand): Promise<TResult>
}

// application/queries/query.interface.ts
export interface Query<TResult> {
  readonly type: string
}

export interface QueryHandler<TQuery extends Query<TResult>, TResult> {
  execute(query: TQuery): Promise<TResult>
}

// application/commands/create-task.command.ts
export class CreateTaskCommand implements Command<TaskModel> {
  readonly type = 'CreateTask'

  constructor(
    public readonly title: string,
    public readonly description: string,
    public readonly priority: TaskPriority,
    public readonly creatorId: number,
    public readonly assigneeId?: number,
    public readonly endDate?: Date
  ) {}
}

export class CreateTaskCommandHandler implements CommandHandler<CreateTaskCommand, TaskModel> {
  constructor(
    private readonly taskRepository: TaskOutputRepositoryInterface,
    private readonly eventBus: EventBus
  ) {}

  async execute(command: CreateTaskCommand): Promise<TaskModel> {
    const task = TaskModel.create({
      title: command.title,
      description: command.description,
      priority: command.priority,
      creatorId: command.creatorId,
      assigneeId: command.assigneeId,
      endDate: command.endDate,
    })

    const savedTask = await this.taskRepository.save(task)

    for (const event of savedTask.getDomainEvents()) {
      await this.eventBus.publish(event)
    }
    savedTask.clearDomainEvents()

    return savedTask
  }
}

// application/queries/get-tasks-by-user.query.ts
export class GetTasksByUserQuery implements Query<TaskResponseDTO[]> {
  readonly type = 'GetTasksByUser'

  constructor(
    public readonly userId: number,
    public readonly status?: TaskStatus,
    public readonly page?: number,
    public readonly pageSize?: number
  ) {}
}

export class GetTasksByUserQueryHandler
  implements QueryHandler<GetTasksByUserQuery, TaskResponseDTO[]>
{
  constructor(private readonly readRepository: TaskReadRepository) {}

  async execute(query: GetTasksByUserQuery): Promise<TaskResponseDTO[]> {
    // Usar repositorio optimizado para lecturas
    return await this.readRepository.findByUser(query.userId, {
      status: query.status,
      page: query.page,
      pageSize: query.pageSize,
    })
  }
}

// Mediator para dispatch
export class Mediator {
  private commandHandlers = new Map<string, CommandHandler<any, any>>()
  private queryHandlers = new Map<string, QueryHandler<any, any>>()

  registerCommandHandler<TCommand extends Command<TResult>, TResult>(
    commandType: string,
    handler: CommandHandler<TCommand, TResult>
  ): void {
    this.commandHandlers.set(commandType, handler)
  }

  registerQueryHandler<TQuery extends Query<TResult>, TResult>(
    queryType: string,
    handler: QueryHandler<TQuery, TResult>
  ): void {
    this.queryHandlers.set(queryType, handler)
  }

  async send<TResult>(command: Command<TResult>): Promise<TResult> {
    const handler = this.commandHandlers.get(command.type)
    if (!handler) {
      throw new Error(`No handler for command ${command.type}`)
    }
    return await handler.execute(command)
  }

  async query<TResult>(query: Query<TResult>): Promise<TResult> {
    const handler = this.queryHandlers.get(query.type)
    if (!handler) {
      throw new Error(`No handler for query ${query.type}`)
    }
    return await handler.execute(query)
  }
}
```

---

## 5. Aggregate Root

Patrón para mantener consistencia de un cluster de entidades.

```typescript
// domain/aggregates/task-group.aggregate.ts
export class TaskGroupAggregate {
  private _domainEvents: DomainEvent[] = []
  private _tasks: TaskModel[] = []

  private constructor(
    public readonly id: number,
    public name: string,
    public description: string,
    public status: TaskGroupStatus,
    public readonly creatorId: number,
    public endDate: Date | null,
    public readonly createdAt: Date,
    public updatedAt: Date
  ) {}

  static create(props: CreateTaskGroupProps): TaskGroupAggregate {
    const aggregate = new TaskGroupAggregate(
      props.id ?? 0,
      props.name,
      props.description ?? '',
      TaskGroupStatus.Active,
      props.creatorId,
      props.endDate ?? null,
      new Date(),
      new Date()
    )

    aggregate.addDomainEvent(new TaskGroupCreatedEvent(aggregate))
    return aggregate
  }

  // ============ Task Management ============

  addTask(taskProps: Omit<CreateTaskProps, 'taskGroupId'>): TaskModel {
    if (this.status === TaskGroupStatus.Completed) {
      throw new DomainError('Cannot add tasks to completed group')
    }

    const task = TaskModel.create({
      ...taskProps,
      taskGroupId: this.id,
    })

    this._tasks.push(task)
    this.updatedAt = new Date()

    return task
  }

  removeTask(taskId: number): void {
    const taskIndex = this._tasks.findIndex((t) => t.id === taskId)

    if (taskIndex === -1) {
      throw new DomainError(`Task ${taskId} not found in group`)
    }

    const task = this._tasks[taskIndex]
    task.delete()
    this._tasks.splice(taskIndex, 1)
    this.updatedAt = new Date()
  }

  // ============ Aggregate Invariants ============

  complete(): void {
    // Invariante: No se puede completar si hay tareas activas
    const activeTasks = this._tasks.filter((t) => t.isActive())

    if (activeTasks.length > 0) {
      throw new DomainError(`Cannot complete group: ${activeTasks.length} tasks are still active`)
    }

    this.status = TaskGroupStatus.Completed
    this.updatedAt = new Date()
    this.addDomainEvent(new TaskGroupCompletedEvent(this))
  }

  // ============ Query Methods ============

  getTasks(): readonly TaskModel[] {
    return [...this._tasks]
  }

  getActiveTasks(): TaskModel[] {
    return this._tasks.filter((t) => t.isActive())
  }

  getCompletedTasks(): TaskModel[] {
    return this._tasks.filter((t) => t.isCompleted())
  }

  getProgress(): { completed: number; total: number; percentage: number } {
    const total = this._tasks.length
    const completed = this._tasks.filter((t) => t.isCompleted()).length

    return {
      completed,
      total,
      percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
    }
  }

  // ============ Domain Events ============

  private addDomainEvent(event: DomainEvent): void {
    this._domainEvents.push(event)
  }

  getDomainEvents(): DomainEvent[] {
    // Incluir eventos de las tareas también
    const taskEvents = this._tasks.flatMap((t) => t.getDomainEvents())
    return [...this._domainEvents, ...taskEvents]
  }

  clearDomainEvents(): void {
    this._domainEvents = []
    this._tasks.forEach((t) => t.clearDomainEvents())
  }
}
```

---

## 6. Repository con Cache

Optimización de acceso a datos.

```typescript
// adapters/output/cached-task.repository.ts
export class CachedTaskRepository implements TaskOutputRepositoryInterface {
  private cache = new Map<number, { task: TaskModel; expiry: number }>()
  private readonly TTL = 5 * 60 * 1000 // 5 minutos

  constructor(private readonly innerRepository: TaskOutputRepositoryInterface) {}

  async findById(id: number): Promise<TaskModel | null> {
    // Check cache first
    const cached = this.cache.get(id)

    if (cached && cached.expiry > Date.now()) {
      return cached.task
    }

    // Cache miss - fetch from repository
    const task = await this.innerRepository.findById(id)

    if (task) {
      this.cache.set(id, {
        task,
        expiry: Date.now() + this.TTL,
      })
    }

    return task
  }

  async save(task: TaskModel): Promise<TaskModel> {
    const savedTask = await this.innerRepository.save(task)

    // Invalidate cache
    this.cache.delete(savedTask.id)

    return savedTask
  }

  async delete(id: number): Promise<void> {
    await this.innerRepository.delete(id)
    this.cache.delete(id)
  }

  async findAll(filter: FilterWithPagination<TaskModel>): Promise<PaginatedResponse<TaskModel>> {
    // No cache for list queries
    return await this.innerRepository.findAll(filter)
  }

  invalidateCache(id?: number): void {
    if (id) {
      this.cache.delete(id)
    } else {
      this.cache.clear()
    }
  }
}
```

---

## 7. Result Pattern

Manejo de errores sin excepciones.

```typescript
// common/result/result.ts
export class Result<T, E = Error> {
  private constructor(
    private readonly value: T | null,
    private readonly error: E | null,
    public readonly isSuccess: boolean
  ) {}

  static ok<T, E = Error>(value: T): Result<T, E> {
    return new Result<T, E>(value, null, true)
  }

  static fail<T, E = Error>(error: E): Result<T, E> {
    return new Result<T, E>(null, error, false)
  }

  getValue(): T {
    if (!this.isSuccess) {
      throw new Error('Cannot get value from failed result')
    }
    return this.value as T
  }

  getError(): E {
    if (this.isSuccess) {
      throw new Error('Cannot get error from successful result')
    }
    return this.error as E
  }

  map<U>(fn: (value: T) => U): Result<U, E> {
    if (!this.isSuccess) {
      return Result.fail(this.error as E)
    }
    return Result.ok(fn(this.value as T))
  }

  flatMap<U>(fn: (value: T) => Result<U, E>): Result<U, E> {
    if (!this.isSuccess) {
      return Result.fail(this.error as E)
    }
    return fn(this.value as T)
  }
}

// Uso en caso de uso
export class CreateTaskUseCase {
  async execute(dto: CreateTaskDTO): Promise<Result<TaskModel, DomainError>> {
    try {
      const task = TaskModel.create(dto)
      const savedTask = await this.taskRepository.save(task)
      return Result.ok(savedTask)
    } catch (error) {
      if (error instanceof DomainError) {
        return Result.fail(error)
      }
      return Result.fail(new DomainError('Unexpected error', 'UNEXPECTED'))
    }
  }
}

// Uso en componente
const result = await createTaskUseCase.execute(formData)

if (result.isSuccess) {
  const task = result.getValue()
  showSuccess(`Task "${task.title}" created`)
} else {
  const error = result.getError()
  showError(error.message)
}
```

---

## 8. Domain Services

Lógica de dominio que no pertenece a una entidad específica.

```typescript
// domain/services/task-assignment.service.ts
export class TaskAssignmentDomainService {
  /** Asigna una tarea a un usuario validando reglas de negocio complejas */
  assignTask(task: TaskModel, assignee: UserModel, assigner: UserModel): void {
    // Regla 1: Solo usuarios activos pueden ser asignados
    if (!assignee.isActive()) {
      throw new DomainError('Cannot assign task to inactive user')
    }

    // Regla 2: La tarea debe estar activa
    if (!task.isActive()) {
      throw new DomainError('Cannot assign inactive task')
    }

    // Regla 3: El asignador debe tener permisos
    if (!this.canAssign(assigner, task)) {
      throw new DomainError('User does not have permission to assign this task')
    }

    // Regla 4: Verificar carga de trabajo del asignado
    // (Esta regla podría requerir consultar otros servicios)

    // Aplicar la asignación
    task.assign(assignee.id)
  }

  private canAssign(user: UserModel, task: TaskModel): boolean {
    // Puede asignar si es el creador o es admin
    return task.creatorId === user.id || user.isAdmin()
  }
}

// domain/services/task-group-completion.service.ts
export class TaskGroupCompletionDomainService {
  /** Verifica y completa un grupo de tareas */
  completeTaskGroup(taskGroup: TaskGroupAggregate, completedBy: UserModel): void {
    // Regla 1: Debe tener al menos una tarea
    if (taskGroup.getTasks().length === 0) {
      throw new DomainError('Cannot complete empty task group')
    }

    // Regla 2: Todas las tareas deben estar completadas
    const progress = taskGroup.getProgress()

    if (progress.percentage < 100) {
      throw new DomainError(
        `Cannot complete group: ${progress.total - progress.completed} tasks remaining`
      )
    }

    // Regla 3: Usuario debe tener permiso
    if (!this.canComplete(completedBy, taskGroup)) {
      throw new DomainError('User does not have permission to complete this group')
    }

    taskGroup.complete()
  }

  private canComplete(user: UserModel, group: TaskGroupAggregate): boolean {
    return group.creatorId === user.id || user.isAdmin()
  }
}
```

---

## Resumen de Cuándo Usar Cada Patrón

| Patrón            | Usar Cuando                                 |
| ----------------- | ------------------------------------------- |
| Specification     | Filtros/consultas complejas reutilizables   |
| Event Bus         | Desacoplar efectos secundarios              |
| Unit of Work      | Transacciones multi-entidad                 |
| CQRS              | Lecturas y escrituras muy diferentes        |
| Aggregate Root    | Cluster de entidades con invariantes        |
| Cached Repository | Alto volumen de lecturas repetidas          |
| Result Pattern    | Manejo explícito de errores sin excepciones |
| Domain Services   | Lógica de negocio multi-entidad             |
