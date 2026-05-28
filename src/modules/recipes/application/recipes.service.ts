import type { RecipesInputServiceInterface } from '../domain/ports/recipes.input-service.interface'
import type { RecipesOutputRepositoryInterface } from '../domain/ports/recipes.output-repository.interface'
import type { CreateRecipeDTO, UpdateRecipeDTO } from '../domain/recipe.model'

export class RecipesService implements RecipesInputServiceInterface {
  constructor(private readonly repository: RecipesOutputRepositoryInterface) {}

  findAll(token: string) {
    return this.repository.findAll(token)
  }

  findById(id: number, token: string) {
    return this.repository.findById(id, token)
  }

  create(payload: CreateRecipeDTO, token: string) {
    return this.repository.create(payload, token)
  }

  update(id: number, payload: UpdateRecipeDTO, token: string) {
    return this.repository.update(id, payload, token)
  }

  remove(id: number, token: string) {
    return this.repository.remove(id, token)
  }
}
