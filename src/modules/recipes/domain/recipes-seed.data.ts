import { RecipeModel } from './recipe.model'
import type { CreateRecipeDTO } from './recipe.model'

export const RECIPES_SEED_DATA: CreateRecipeDTO[] = [
  {
    name: 'Alfajores',
    description: 'Dulce tradicional de maicena relleno con dulce de leche.',
    ingredients: [
      '200 g harina de maicena',
      '150 g harina de trigo',
      '200 g mantequilla',
      '100 g azúcar impalpable',
      '2 yemas de huevo',
      '1 cucharadita de esencia de vainilla',
      '300 g dulce de leche repostero',
      'Azúcar impalpable para decorar',
    ],
    steps:
      '1. Batir la mantequilla con el azúcar impalpable hasta obtener un crema.\n' +
      '2. Incorporar las yemas y la vainilla; mezclar.\n' +
      '3. Agregar las harinas tamizadas y formar una masa suave.\n' +
      '4. Estirar, cortar círculos y hornear a 160 °C por 12 minutos.\n' +
      '5. Unir dos tapas con dulce de leche y espolvorear azúcar impalpable.',
  },
  {
    name: 'Torta de naranja con semillas de amapola',
    description: 'Bizcocho húmedo con ralladura de naranja y semillas de amapola.',
    ingredients: [
      '250 g harina de trigo',
      '200 g azúcar',
      '150 g mantequilla',
      '3 huevos',
      'Ralladura de 2 naranjas',
      '100 ml jugo de naranja',
      '2 cucharadas de semillas de amapola',
      '1 cucharadita de polvo de hornear',
      'Pizca de sal',
    ],
    steps:
      '1. Precalentar el horno a 170 °C.\n' +
      '2. Batir mantequilla con azúcar hasta blanquear; agregar huevos uno a uno.\n' +
      '3. Incorporar ralladura, jugo de naranja y semillas de amapola.\n' +
      '4. Mezclar harina, polvo de hornear y sal; integrar sin sobrebatir.\n' +
      '5. Hornear 35–40 minutos hasta que al pinchar salga limpio.',
  },
  {
    name: 'Galletas New York',
    description: 'Galletas estilo chocolate chip crujientes por fuera y suaves por dentro.',
    ingredients: [
      '250 g harina de trigo',
      '200 g chocolate semiamargo en trozos',
      '150 g mantequilla',
      '120 g azúcar morena',
      '80 g azúcar blanco',
      '2 huevos',
      '1 cucharadita de esencia de vainilla',
      '1 cucharadita de bicarbonato',
      'Pizca de sal',
    ],
    steps:
      '1. Batir mantequilla con ambos azúcares hasta integrar.\n' +
      '2. Agregar huevos y vainilla; mezclar.\n' +
      '3. Incorporar harina, bicarbonato y sal.\n' +
      '4. Añadir el chocolate en trozos y mezclar.\n' +
      '5. Formar porciones, refrigerar 30 minutos y hornear a 180 °C por 12–14 minutos.',
  },
]

export function createSeedRecipes(): RecipeModel[] {
  return RECIPES_SEED_DATA.map(
    (recipe, index) =>
      new RecipeModel({
        ...recipe,
        id: index + 1,
        isActive: true,
      }),
  )
}
