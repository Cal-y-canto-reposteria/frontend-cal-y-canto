import type { CreateProductDTO, ProductModel } from '../product.model'

export interface ProductsOutputRepositoryInterface {
  findAll(): Promise<ProductModel[]>
  findById(id: number): Promise<ProductModel>
  create(payload: CreateProductDTO, token: string): Promise<ProductModel>
}
