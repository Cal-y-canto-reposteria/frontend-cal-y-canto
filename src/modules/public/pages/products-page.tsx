import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const sampleProducts = [
  { name: 'Torta de vainilla', description: 'Bizcocho suave con buttercream artesanal.' },
  { name: 'Cupcakes surtidos', description: 'Caja de 6 unidades con sabores de temporada.' },
  { name: 'Brownie clásico', description: 'Textura húmeda con chocolate intenso.' },
]

export function ProductsPage() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-12">
      <div className="mb-8 space-y-2">
        <h2 className="text-3xl font-semibold text-stone-900">Productos</h2>
        <p className="text-stone-600">
          Catálogo público de la repostería. Los datos vendrán del módulo de productos.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {sampleProducts.map((product) => (
          <Card key={product.name}>
            <CardHeader>
              <CardTitle>{product.name}</CardTitle>
            </CardHeader>
            <CardContent className="text-stone-600">{product.description}</CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}
