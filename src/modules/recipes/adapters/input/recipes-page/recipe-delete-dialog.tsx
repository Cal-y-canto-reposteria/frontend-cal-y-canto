import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { RecipeModel } from '@modules/recipes/domain/recipe.model'

type RecipeDeleteDialogProps = {
  recipe: RecipeModel | null
  loading: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function RecipeDeleteDialog({
  recipe,
  loading,
  onConfirm,
  onCancel,
}: RecipeDeleteDialogProps) {
  if (!recipe) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Eliminar receta</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-stone-600">
            ¿Eliminar la receta <span className="font-medium text-stone-900">{recipe.name}</span>?
            Esta acción no se puede deshacer.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onCancel} disabled={loading}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={onConfirm} disabled={loading}>
              {loading ? 'Eliminando...' : 'Eliminar'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
