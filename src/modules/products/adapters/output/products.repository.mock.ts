import { ProductModel } from '../../domain/product.model'
import type { CreateProductDTO } from '../../domain/product.model'
import type { ProductsOutputRepositoryInterface } from '../../domain/ports/products.output-repository.interface'

export class ProductsRepositoryMock implements ProductsOutputRepositoryInterface {
  private readonly products: ProductModel[] = [
    new ProductModel({
      id: 1,
      name: 'Torta de vainilla',
      description: 'Bizcocho suave con buttercream artesanal.',
      price: 85000,
      isActive: true,
    }),
    new ProductModel({
      id: 2,
      name: 'Cupcakes surtidos',
      description: 'Caja de 6 unidades con sabores de temporada.',
      price: 36000,
      isActive: true,
    }),
    new ProductModel({
      id: 3,
      name: 'Brownie clásico',
      description: 'Textura húmeda con chocolate intenso.',
      price: 12000,
      isActive: true,
    }),
  ]

  findAll() {
    return Promise.resolve(this.products.filter((product) => product.isActive))
  }

  findById(id: number) {
    const product = this.products.find((item) => item.id === id)

    if (!product) {
      return Promise.reject(new Error(`Product ${id} not found`))
    }

    return Promise.resolve(product)
  }

  create(payload: CreateProductDTO, _token: string) {
    const product = new ProductModel({
      ...payload,
      id: this.products.length + 1,
      isActive: payload.isActive ?? true,
    })

    this.products.push(product)
    return Promise.resolve(product)
  }
}
