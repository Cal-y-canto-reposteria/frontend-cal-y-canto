import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useProductServices } from '@common/context/di-context'
import type { ProductModel } from '@modules/products/domain/product.model'

export function ProductsPage() {
  const productServices = useProductServices()
  const [products, setProducts] = useState<ProductModel[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const items = await productServices.findAll()
        setProducts(items)
      } catch {
        setError('No fue posible cargar el catálogo de productos.')
      } finally {
        setLoading(false)
      }
    }

    loadProducts()
  }, [productServices])

  return (
    <section className="mx-auto max-w-6xl px-6 py-12">
      <div className="mb-8 space-y-2">
        <h2 className="text-3xl font-semibold text-stone-900">Productos</h2>
        <p className="text-stone-600">
          Catálogo conectado al módulo de productos vía arquitectura hexagonal.
        </p>
      </div>

      {loading ? <p className="text-stone-500">Cargando productos...</p> : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <div className="grid gap-6 md:grid-cols-3">
        {products.map((product) => (
          <Card key={product.id}>
            <CardHeader>
              <CardTitle>{product.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-stone-600">
              <p>{product.description}</p>
              <p className="font-medium text-stone-900">
                ${product.price.toLocaleString('es-CO')}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}
