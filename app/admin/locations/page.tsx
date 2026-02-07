import LocationsClient from './LocationsClient'

export const metadata = {
  title: 'Location Management | AutoBid Admin',
  description: 'Manage supported regions, provinces, cities, and barangays',
}

export default function LocationsPage() {
  return <LocationsClient />
}
