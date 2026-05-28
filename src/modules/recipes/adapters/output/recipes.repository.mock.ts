import { RecipeModel } from '../../domain/recipe.model'
import type { CreateRecipeDTO, UpdateRecipeDTO } from '../../domain/recipe.model'
import { createSeedRecipes } from '../../domain/recipes-seed.data'
import type { RecipesOutputRepositoryInterface } from '../../domain/ports/recipes.output-repository.interface'

export class RecipesRepositoryMock implements RecipesOutputRepositoryInterface {
  private readonly recipes: RecipeModel[] = createSeedRecipes()

  findAll(_token: string) {
    return Promise.resolve(this.recipes.filter((recipe) => recipe.isActive))
  }

  findById(id: number, _token: string) {
    const recipe = this.recipes.find((item) => item.id === id && item.isActive)

    if (!recipe) {
      return Promise.reject(new Error(`Recipe ${id} not found`))
    }

    return Promise.resolve(recipe)
  }

  create(payload: CreateRecipeDTO, _token: string) {
    const recipe = new RecipeModel({
      ...payload,
      id: this.recipes.length + 1,
      isActive: payload.isActive ?? true,
    })

    this.recipes.push(recipe)
    return Promise.resolve(recipe)
  }

  update(id: number, payload: UpdateRecipeDTO, _token: string) {
    const index = this.recipes.findIndex((item) => item.id === id)

    if (index === -1) {
      return Promise.reject(new Error(`Recipe ${id} not found`))
    }

    const updated = new RecipeModel({
      ...this.recipes[index],
      ...payload,
      id,
    })

    this.recipes[index] = updated
    return Promise.resolve(updated)
  }

  remove(id: number, _token: string) {
    const index = this.recipes.findIndex((item) => item.id === id)

    if (index === -1) {
      return Promise.reject(new Error(`Recipe ${id} not found`))
    }

    this.recipes[index] = new RecipeModel({
      ...this.recipes[index],
      isActive: false,
    })

    return Promise.resolve()
  }
}
