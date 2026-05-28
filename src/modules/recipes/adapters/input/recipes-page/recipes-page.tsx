import { useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@common/context/auth-context'
import { useRecipeServices } from '@common/context/di-context'
import type { CreateRecipeDTO, RecipeModel } from '@modules/recipes/domain/recipe.model'
import { RecipeDeleteDialog } from './recipe-delete-dialog'
import { RecipeForm, truncateDescription } from './recipe-form'

export function RecipesPage() {
  const recipeServices = useRecipeServices()
  const { token } = useAuth()
  const [recipes, setRecipes] = useState<RecipeModel[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [editingRecipe, setEditingRecipe] = useState<RecipeModel | null>(null)
  const [recipeToDelete, setRecipeToDelete] = useState<RecipeModel | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const loadRecipes = useCallback(async () => {
    if (!token) {
      setError('No hay sesión activa.')
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const items = await recipeServices.findAll(token)
      setRecipes(items)
    } catch {
      setError('No fue posible cargar las recetas.')
    } finally {
      setLoading(false)
    }
  }, [recipeServices, token])

  useEffect(() => {
    void loadRecipes()
  }, [loadRecipes])

  const handleCreate = () => {
    setEditingRecipe(null)
    setFormOpen(true)
  }

  const handleEdit = (recipe: RecipeModel) => {
    setEditingRecipe(recipe)
    setFormOpen(true)
  }

  const handleSubmit = async (payload: CreateRecipeDTO) => {
    if (!token) {
      throw new Error('Missing token')
    }

    setSubmitting(true)

    try {
      if (editingRecipe) {
        const updated = await recipeServices.update(editingRecipe.id, payload, token)
        setRecipes((current) =>
          current.map((recipe) => (recipe.id === updated.id ? updated : recipe)),
        )
      } else {
        const created = await recipeServices.create(payload, token)
        setRecipes((current) => [created, ...current])
      }

      setFormOpen(false)
      setEditingRecipe(null)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!token || !recipeToDelete) {
      return
    }

    setDeleting(true)

    try {
      await recipeServices.remove(recipeToDelete.id, token)
      setRecipes((current) => current.filter((recipe) => recipe.id !== recipeToDelete.id))
      setRecipeToDelete(null)
    } catch {
      setError('No fue posible eliminar la receta.')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold text-stone-900">Recetas</h2>
          <p className="text-stone-600">
            Gestiona ingredientes, pasos y preparaciones del catálogo interno.
          </p>
        </div>
        <Button onClick={handleCreate}>Nueva receta</Button>
      </div>

      {loading ? <p className="text-stone-500">Cargando recetas...</p> : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      {!loading && !error && recipes.length === 0 ? (
        <div className="rounded-lg border border-dashed border-stone-200 p-8 text-center">
          <p className="text-stone-600">No hay recetas registradas.</p>
          <Button className="mt-4" onClick={handleCreate}>
            Crear primera receta
          </Button>
        </div>
      ) : null}

      {!loading && recipes.length > 0 ? (
        <div className="overflow-x-auto rounded-lg border">
          <table className="min-w-full divide-y divide-stone-200 text-sm">
            <thead className="bg-stone-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-stone-700">Nombre</th>
                <th className="px-4 py-3 text-left font-medium text-stone-700">Descripción</th>
                <th className="px-4 py-3 text-left font-medium text-stone-700">Ingredientes</th>
                <th className="px-4 py-3 text-right font-medium text-stone-700">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 bg-white">
              {recipes.map((recipe) => (
                <tr key={recipe.id}>
                  <td className="px-4 py-3 font-medium text-stone-900">{recipe.name}</td>
                  <td className="px-4 py-3 text-stone-600">
                    {truncateDescription(recipe.description)}
                  </td>
                  <td className="px-4 py-3 text-stone-600">{recipe.ingredients.length}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(recipe)}>
                        Editar
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setRecipeToDelete(recipe)}
                      >
                        Eliminar
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {formOpen ? (
        <RecipeForm
          recipe={editingRecipe}
          loading={submitting}
          onSubmit={handleSubmit}
          onCancel={() => {
            setFormOpen(false)
            setEditingRecipe(null)
          }}
        />
      ) : null}

      <RecipeDeleteDialog
        recipe={recipeToDelete}
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setRecipeToDelete(null)}
      />
    </div>
  )
}
