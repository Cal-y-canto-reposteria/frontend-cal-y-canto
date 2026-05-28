import { providerFactory } from '@common/providers/repository-provider.factory'
import { EnvironmentEnum } from '@environments/environment.enum'
import type { RecipesOutputRepositoryInterface } from '../../domain/ports/recipes.output-repository.interface'
import { RecipesHttpRepository } from './recipes-http.repository'
import { RecipesRepositoryMock } from './recipes.repository.mock'

export const recipesRepository = providerFactory<RecipesOutputRepositoryInterface>(
  {
    [EnvironmentEnum.Mocked]: new RecipesRepositoryMock(),
  },
  new RecipesHttpRepository(),
)
