export class ProductModel {
  id: number
  name: string
  description?: string | null
  price: number
  isActive: boolean

  constructor(partial: Partial<ProductModel>) {
    Object.assign(this, partial)
  }

  static fromApi(data: ProductModel): ProductModel {
    return new ProductModel({
      id: data.id,
      name: data.name,
      description: data.description,
      price: Number(data.price),
      isActive: data.isActive ?? true,
    })
  }
}

export type CreateProductDTO = {
  name: string
  description?: string
  price: number
  isActive?: boolean
}
