export class RecipeModel {
  id: number
  name: string
  description?: string | null
  ingredients: string[]
  steps: string
  isActive: boolean
  createdAt?: string
  updatedAt?: string

  constructor(partial: Partial<RecipeModel>) {
    Object.assign(this, partial)
  }

  static fromApi(data: RecipeModel): RecipeModel {
    return new RecipeModel({
      id: data.id,
      name: data.name,
      description: data.description,
      ingredients: data.ingredients,
      steps: data.steps,
      isActive: data.isActive ?? true,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    })
  }
}

export type CreateRecipeDTO = {
  name: string
  description?: string
  ingredients: string[]
  steps: string
  isActive?: boolean
}

export type UpdateRecipeDTO = Partial<CreateRecipeDTO>
