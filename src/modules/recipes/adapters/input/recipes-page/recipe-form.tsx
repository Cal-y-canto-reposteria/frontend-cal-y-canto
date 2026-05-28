import { type FormEvent, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { CreateRecipeDTO, RecipeModel } from '@modules/recipes/domain/recipe.model'

type RecipeFormProps = {
  recipe?: RecipeModel | null
  loading: boolean
  onSubmit: (payload: CreateRecipeDTO) => Promise<void>
  onCancel: () => void
}

function truncateDescription(description?: string | null, maxLength = 80) {
  if (!description) {
    return '—'
  }

  return description.length > maxLength
    ? `${description.slice(0, maxLength)}…`
    : description
}

export function RecipeForm({ recipe, loading, onSubmit, onCancel }: RecipeFormProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [ingredients, setIngredients] = useState<string[]>([''])
  const [steps, setSteps] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (recipe) {
      setName(recipe.name)
      setDescription(recipe.description ?? '')
      setIngredients(recipe.ingredients.length > 0 ? recipe.ingredients : [''])
      setSteps(recipe.steps)
    } else {
      setName('')
      setDescription('')
      setIngredients([''])
      setSteps('')
    }
    setError(null)
  }, [recipe])

  const handleIngredientChange = (index: number, value: string) => {
    setIngredients((current) => current.map((item, itemIndex) => (itemIndex === index ? value : item)))
  }

  const addIngredient = () => {
    setIngredients((current) => [...current, ''])
  }

  const removeIngredient = (index: number) => {
    setIngredients((current) => current.filter((_, itemIndex) => itemIndex !== index))
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)

    const normalizedIngredients = ingredients.map((item) => item.trim()).filter(Boolean)

    if (!name.trim()) {
      setError('El nombre es obligatorio.')
      return
    }

    if (normalizedIngredients.length === 0) {
      setError('Agrega al menos un ingrediente.')
      return
    }

    if (steps.trim().length < 10) {
      setError('Los pasos deben tener al menos 10 caracteres.')
      return
    }

    try {
      await onSubmit({
        name: name.trim(),
        description: description.trim() || undefined,
        ingredients: normalizedIngredients,
        steps: steps.trim(),
      })
    } catch {
      setError('No fue posible guardar la receta.')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 px-4 py-8">
      <Card className="max-h-[90vh] w-full max-w-2xl overflow-y-auto">
        <CardHeader>
          <CardTitle>{recipe ? 'Editar receta' : 'Nueva receta'}</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="recipe-name">Nombre</Label>
              <Input
                id="recipe-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="recipe-description">Descripción (opcional)</Label>
              <Input
                id="recipe-description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
              />
              {recipe?.description ? (
                <p className="text-xs text-stone-500">
                  Vista previa: {truncateDescription(description)}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Ingredientes</Label>
                <Button type="button" variant="outline" size="sm" onClick={addIngredient}>
                  Agregar ingrediente
                </Button>
              </div>
              <div className="space-y-2">
                {ingredients.map((ingredient, index) => (
                  <div key={`ingredient-${index}`} className="flex gap-2">
                    <Input
                      value={ingredient}
                      onChange={(event) => handleIngredientChange(index, event.target.value)}
                      placeholder={`Ingrediente ${index + 1}`}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => removeIngredient(index)}
                      disabled={ingredients.length === 1}
                    >
                      Quitar
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="recipe-steps">Pasos de preparación</Label>
              <textarea
                id="recipe-steps"
                className="min-h-32 w-full rounded-md border border-stone-200 px-3 py-2 text-sm text-stone-900 outline-none focus:border-rose-300 focus:ring-2 focus:ring-rose-100"
                value={steps}
                onChange={(event) => setSteps(event.target.value)}
                required
              />
            </div>

            {error ? <p className="text-sm text-red-600">{error}</p> : null}

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Guardando...' : recipe ? 'Guardar cambios' : 'Crear receta'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export { truncateDescription }
