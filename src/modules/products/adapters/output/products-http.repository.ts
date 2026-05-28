import { httpClient } from '@common/adapters/output/http/http-client'
import { environment } from '@environments/environment'
import { ProductModel } from '../../domain/product.model'
import type { CreateProductDTO } from '../../domain/product.model'
import type { ProductsOutputRepositoryInterface } from '../../domain/ports/products.output-repository.interface'

export class ProductsHttpRepository implements ProductsOutputRepositoryInterface {
  private readonly baseUrl = `${environment.apiUrl}/products`

  async findAll() {
    const products = await httpClient<ProductModel[]>(this.baseUrl)
    return products.map((product) => ProductModel.fromApi(product))
  }

  async findById(id: number) {
    const product = await httpClient<ProductModel>(`${this.baseUrl}/${id}`)
    return ProductModel.fromApi(product)
  }

  async create(payload: CreateProductDTO, token: string) {
    const product = await httpClient<ProductModel>(this.baseUrl, {
      method: 'POST',
      body: JSON.stringify(payload),
      token,
    })

    return ProductModel.fromApi(product)
  }
}
