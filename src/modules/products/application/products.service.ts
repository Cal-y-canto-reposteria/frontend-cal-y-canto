import type { ProductsInputServiceInterface } from '../domain/ports/products.input-service.interface'
import type { ProductsOutputRepositoryInterface } from '../domain/ports/products.output-repository.interface'
import type { CreateProductDTO } from '../domain/product.model'

export class ProductsService implements ProductsInputServiceInterface {
  constructor(private readonly repository: ProductsOutputRepositoryInterface) {}

  findAll() {
    return this.repository.findAll()
  }

  findById(id: number) {
    return this.repository.findById(id)
  }

  create(payload: CreateProductDTO, token: string) {
    return this.repository.create(payload, token)
  }
}
