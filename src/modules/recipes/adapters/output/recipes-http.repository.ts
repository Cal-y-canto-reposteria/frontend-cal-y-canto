import { httpClient } from '@common/adapters/output/http/http-client'
import { environment } from '@environments/environment'
import { RecipeModel } from '../../domain/recipe.model'
import type { CreateRecipeDTO, UpdateRecipeDTO } from '../../domain/recipe.model'
import type { RecipesOutputRepositoryInterface } from '../../domain/ports/recipes.output-repository.interface'

export class RecipesHttpRepository implements RecipesOutputRepositoryInterface {
  private readonly baseUrl = `${environment.apiUrl}/recipes`

  async findAll(token: string) {
    const recipes = await httpClient<RecipeModel[]>(this.baseUrl, { token })
    return recipes.map((recipe) => RecipeModel.fromApi(recipe))
  }

  async findById(id: number, token: string) {
    const recipe = await httpClient<RecipeModel>(`${this.baseUrl}/${id}`, { token })
    return RecipeModel.fromApi(recipe)
  }

  async create(payload: CreateRecipeDTO, token: string) {
    const recipe = await httpClient<RecipeModel>(this.baseUrl, {
      method: 'POST',
      body: JSON.stringify(payload),
      token,
    })

    return RecipeModel.fromApi(recipe)
  }

  async update(id: number, payload: UpdateRecipeDTO, token: string) {
    const recipe = await httpClient<RecipeModel>(`${this.baseUrl}/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
      token,
    })

    return RecipeModel.fromApi(recipe)
  }

  async remove(id: number, token: string) {
    await httpClient<void>(`${this.baseUrl}/${id}`, {
      method: 'DELETE',
      token,
    })
  }
}
