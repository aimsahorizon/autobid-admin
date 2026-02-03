import { getBrands, getModels, getVariants } from './actions'
import VehiclesClient from './VehiclesClient'

export const dynamic = 'force-dynamic'

export default async function VehiclesPage() {
  const [brands, models, variants] = await Promise.all([
    getBrands(),
    getModels(),
    getVariants()
  ])

  return (
    <VehiclesClient 
      initialBrands={brands || []} 
      initialModels={models || []} 
      initialVariants={variants || []} 
    />
  )
}
