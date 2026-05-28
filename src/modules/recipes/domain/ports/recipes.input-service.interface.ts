import type { CreateRecipeDTO, RecipeModel, UpdateRecipeDTO } from '../recipe.model'

export interface RecipesInputServiceInterface {
  findAll(token: string): Promise<RecipeModel[]>
  findById(id: number, token: string): Promise<RecipeModel>
  create(payload: CreateRecipeDTO, token: string): Promise<RecipeModel>
  update(id: number, payload: UpdateRecipeDTO, token: string): Promise<RecipeModel>
  remove(id: number, token: string): Promise<void>
}
