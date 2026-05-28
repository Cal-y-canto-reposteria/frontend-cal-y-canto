import { providerFactory } from '@common/providers/repository-provider.factory'
import { EnvironmentEnum } from '@environments/environment.enum'
import type { ProductsOutputRepositoryInterface } from '../../domain/ports/products.output-repository.interface'
import { ProductsHttpRepository } from './products-http.repository'
import { ProductsRepositoryMock } from './products.repository.mock'

export const productsRepository = providerFactory<ProductsOutputRepositoryInterface>(
  {
    [EnvironmentEnum.Mocked]: new ProductsRepositoryMock(),
  },
  new ProductsHttpRepository(),
)
