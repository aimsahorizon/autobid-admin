import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

// =============================================================================
// VEHICLE SEED DATA
// =============================================================================

const vehicleBrands = [
  { name: 'Toyota', logo_url: null },
  { name: 'Honda', logo_url: null },
  { name: 'Ford', logo_url: null },
  { name: 'Mitsubishi', logo_url: null },
  { name: 'Nissan', logo_url: null },
  { name: 'Hyundai', logo_url: null },
  { name: 'Kia', logo_url: null },
  { name: 'Suzuki', logo_url: null },
  { name: 'Isuzu', logo_url: null },
  { name: 'Mazda', logo_url: null },
  { name: 'Chevrolet', logo_url: null },
  { name: 'Subaru', logo_url: null },
  { name: 'BMW', logo_url: null },
  { name: 'Mercedes-Benz', logo_url: null },
  { name: 'Volkswagen', logo_url: null },
  { name: 'Geely', logo_url: null },
  { name: 'Chery', logo_url: null },
  { name: 'MG', logo_url: null },
  { name: 'GAC', logo_url: null },
  { name: 'Foton', logo_url: null },
]

interface ModelDef {
  name: string
  body_type: string
  variants: { name: string; transmission: string; fuel_type: string }[]
}

const vehicleModels: Record<string, ModelDef[]> = {
  Toyota: [
    { name: 'Vios', body_type: 'Sedan', variants: [
      { name: '1.3 XE MT', transmission: 'Manual', fuel_type: 'Gasoline' },
      { name: '1.3 XLE CVT', transmission: 'CVT', fuel_type: 'Gasoline' },
      { name: '1.5 G CVT', transmission: 'CVT', fuel_type: 'Gasoline' },
      { name: '1.5 GR-S CVT', transmission: 'CVT', fuel_type: 'Gasoline' },
    ]},
    { name: 'Fortuner', body_type: 'SUV', variants: [
      { name: '2.4 G MT', transmission: 'Manual', fuel_type: 'Diesel' },
      { name: '2.4 G AT', transmission: 'Automatic', fuel_type: 'Diesel' },
      { name: '2.8 V AT', transmission: 'Automatic', fuel_type: 'Diesel' },
      { name: '2.8 GR-S AT', transmission: 'Automatic', fuel_type: 'Diesel' },
    ]},
    { name: 'Hilux', body_type: 'Pickup', variants: [
      { name: '2.4 J MT', transmission: 'Manual', fuel_type: 'Diesel' },
      { name: '2.4 E AT', transmission: 'Automatic', fuel_type: 'Diesel' },
      { name: '2.4 G AT', transmission: 'Automatic', fuel_type: 'Diesel' },
      { name: '2.8 GR-S AT', transmission: 'Automatic', fuel_type: 'Diesel' },
    ]},
    { name: 'Innova', body_type: 'MPV', variants: [
      { name: '2.0 J MT', transmission: 'Manual', fuel_type: 'Gasoline' },
      { name: '2.8 E AT', transmission: 'Automatic', fuel_type: 'Diesel' },
      { name: '2.8 V AT', transmission: 'Automatic', fuel_type: 'Diesel' },
    ]},
    { name: 'Wigo', body_type: 'Hatchback', variants: [
      { name: '1.0 E MT', transmission: 'Manual', fuel_type: 'Gasoline' },
      { name: '1.0 G AT', transmission: 'Automatic', fuel_type: 'Gasoline' },
    ]},
    { name: 'Rush', body_type: 'SUV', variants: [
      { name: '1.5 E MT', transmission: 'Manual', fuel_type: 'Gasoline' },
      { name: '1.5 G AT', transmission: 'Automatic', fuel_type: 'Gasoline' },
    ]},
    { name: 'Raize', body_type: 'SUV', variants: [
      { name: '1.0 Turbo CVT', transmission: 'CVT', fuel_type: 'Gasoline' },
      { name: '1.2 G CVT', transmission: 'CVT', fuel_type: 'Gasoline' },
    ]},
    { name: 'Avanza', body_type: 'MPV', variants: [
      { name: '1.5 E MT', transmission: 'Manual', fuel_type: 'Gasoline' },
      { name: '1.5 G CVT', transmission: 'CVT', fuel_type: 'Gasoline' },
      { name: '1.5 Veloz CVT', transmission: 'CVT', fuel_type: 'Gasoline' },
    ]},
    { name: 'HiAce', body_type: 'Van', variants: [
      { name: 'Commuter Deluxe MT', transmission: 'Manual', fuel_type: 'Diesel' },
      { name: 'GL Grandia AT', transmission: 'Automatic', fuel_type: 'Diesel' },
      { name: 'Super Grandia Elite AT', transmission: 'Automatic', fuel_type: 'Diesel' },
    ]},
  ],
  Honda: [
    { name: 'Civic', body_type: 'Sedan', variants: [
      { name: '1.5 RS Turbo CVT', transmission: 'CVT', fuel_type: 'Gasoline' },
      { name: '1.5 V Turbo CVT', transmission: 'CVT', fuel_type: 'Gasoline' },
      { name: '2.0 Type R MT', transmission: 'Manual', fuel_type: 'Gasoline' },
    ]},
    { name: 'City', body_type: 'Sedan', variants: [
      { name: '1.5 S CVT', transmission: 'CVT', fuel_type: 'Gasoline' },
      { name: '1.5 V CVT', transmission: 'CVT', fuel_type: 'Gasoline' },
      { name: '1.5 RS CVT', transmission: 'CVT', fuel_type: 'Gasoline' },
    ]},
    { name: 'CR-V', body_type: 'SUV', variants: [
      { name: '2.0 S CVT', transmission: 'CVT', fuel_type: 'Gasoline' },
      { name: '1.5 V Turbo CVT', transmission: 'CVT', fuel_type: 'Gasoline' },
      { name: '1.5 SX Turbo CVT', transmission: 'CVT', fuel_type: 'Gasoline' },
    ]},
    { name: 'BR-V', body_type: 'MPV', variants: [
      { name: '1.5 S CVT', transmission: 'CVT', fuel_type: 'Gasoline' },
      { name: '1.5 V CVT', transmission: 'CVT', fuel_type: 'Gasoline' },
    ]},
    { name: 'HR-V', body_type: 'SUV', variants: [
      { name: '1.8 S CVT', transmission: 'CVT', fuel_type: 'Gasoline' },
      { name: '1.5 V Turbo CVT', transmission: 'CVT', fuel_type: 'Gasoline' },
    ]},
  ],
  Ford: [
    { name: 'Ranger', body_type: 'Pickup', variants: [
      { name: '2.0 XLS MT', transmission: 'Manual', fuel_type: 'Diesel' },
      { name: '2.0 XLT AT', transmission: 'Automatic', fuel_type: 'Diesel' },
      { name: '2.0 Wildtrak AT', transmission: 'Automatic', fuel_type: 'Diesel' },
      { name: '3.0 Raptor AT', transmission: 'Automatic', fuel_type: 'Diesel' },
    ]},
    { name: 'Everest', body_type: 'SUV', variants: [
      { name: '2.0 Ambiente MT', transmission: 'Manual', fuel_type: 'Diesel' },
      { name: '2.0 Trend AT', transmission: 'Automatic', fuel_type: 'Diesel' },
      { name: '2.0 Titanium+ AT', transmission: 'Automatic', fuel_type: 'Diesel' },
      { name: '2.0 Sport AT', transmission: 'Automatic', fuel_type: 'Diesel' },
    ]},
    { name: 'Territory', body_type: 'SUV', variants: [
      { name: '1.5 Trend EcoBoost AT', transmission: 'CVT', fuel_type: 'Gasoline' },
      { name: '1.5 Titanium+ EcoBoost AT', transmission: 'CVT', fuel_type: 'Gasoline' },
    ]},
  ],
  Mitsubishi: [
    { name: 'Xpander', body_type: 'MPV', variants: [
      { name: '1.5 GLX MT', transmission: 'Manual', fuel_type: 'Gasoline' },
      { name: '1.5 GLS AT', transmission: 'Automatic', fuel_type: 'Gasoline' },
      { name: '1.5 Cross AT', transmission: 'Automatic', fuel_type: 'Gasoline' },
    ]},
    { name: 'Montero Sport', body_type: 'SUV', variants: [
      { name: '2.4 GLX MT', transmission: 'Manual', fuel_type: 'Diesel' },
      { name: '2.4 GLS AT', transmission: 'Automatic', fuel_type: 'Diesel' },
      { name: '2.4 GT AT', transmission: 'Automatic', fuel_type: 'Diesel' },
    ]},
    { name: 'Strada', body_type: 'Pickup', variants: [
      { name: '2.4 GL MT', transmission: 'Manual', fuel_type: 'Diesel' },
      { name: '2.4 GLS AT', transmission: 'Automatic', fuel_type: 'Diesel' },
      { name: '2.4 Athlete AT', transmission: 'Automatic', fuel_type: 'Diesel' },
    ]},
    { name: 'Mirage', body_type: 'Hatchback', variants: [
      { name: '1.2 GLX MT', transmission: 'Manual', fuel_type: 'Gasoline' },
      { name: '1.2 GLX CVT', transmission: 'CVT', fuel_type: 'Gasoline' },
    ]},
    { name: 'Mirage G4', body_type: 'Sedan', variants: [
      { name: '1.2 GLX MT', transmission: 'Manual', fuel_type: 'Gasoline' },
      { name: '1.2 GLS CVT', transmission: 'CVT', fuel_type: 'Gasoline' },
    ]},
  ],
  Nissan: [
    { name: 'Navara', body_type: 'Pickup', variants: [
      { name: '2.5 EL MT', transmission: 'Manual', fuel_type: 'Diesel' },
      { name: '2.5 VE AT', transmission: 'Automatic', fuel_type: 'Diesel' },
      { name: '2.5 VL AT', transmission: 'Automatic', fuel_type: 'Diesel' },
      { name: '2.5 PRO-4X AT', transmission: 'Automatic', fuel_type: 'Diesel' },
    ]},
    { name: 'Terra', body_type: 'SUV', variants: [
      { name: '2.5 EL MT', transmission: 'Manual', fuel_type: 'Diesel' },
      { name: '2.5 VE AT', transmission: 'Automatic', fuel_type: 'Diesel' },
      { name: '2.5 VL AT', transmission: 'Automatic', fuel_type: 'Diesel' },
    ]},
    { name: 'Almera', body_type: 'Sedan', variants: [
      { name: '1.0 Turbo E MT', transmission: 'Manual', fuel_type: 'Gasoline' },
      { name: '1.0 Turbo VE CVT', transmission: 'CVT', fuel_type: 'Gasoline' },
      { name: '1.0 Turbo VL CVT', transmission: 'CVT', fuel_type: 'Gasoline' },
    ]},
  ],
  Hyundai: [
    { name: 'Accent', body_type: 'Sedan', variants: [
      { name: '1.4 GL MT', transmission: 'Manual', fuel_type: 'Gasoline' },
      { name: '1.4 GL AT', transmission: 'Automatic', fuel_type: 'Gasoline' },
    ]},
    { name: 'Tucson', body_type: 'SUV', variants: [
      { name: '2.0 GL AT', transmission: 'Automatic', fuel_type: 'Gasoline' },
      { name: '2.0 GLS AT', transmission: 'Automatic', fuel_type: 'Diesel' },
    ]},
    { name: 'Creta', body_type: 'SUV', variants: [
      { name: '1.5 GL MT', transmission: 'Manual', fuel_type: 'Gasoline' },
      { name: '1.5 GLS AT', transmission: 'Automatic', fuel_type: 'Gasoline' },
    ]},
    { name: 'Stargazer', body_type: 'MPV', variants: [
      { name: '1.5 GL MT', transmission: 'Manual', fuel_type: 'Gasoline' },
      { name: '1.5 GLS CVT', transmission: 'CVT', fuel_type: 'Gasoline' },
    ]},
  ],
  Kia: [
    { name: 'Seltos', body_type: 'SUV', variants: [
      { name: '2.0 EX AT', transmission: 'Automatic', fuel_type: 'Gasoline' },
      { name: '2.0 SX AT', transmission: 'Automatic', fuel_type: 'Gasoline' },
    ]},
    { name: 'Stonic', body_type: 'SUV', variants: [
      { name: '1.4 LX AT', transmission: 'Automatic', fuel_type: 'Gasoline' },
      { name: '1.4 EX AT', transmission: 'Automatic', fuel_type: 'Gasoline' },
    ]},
    { name: 'Carnival', body_type: 'MPV', variants: [
      { name: '2.2 EX AT', transmission: 'Automatic', fuel_type: 'Diesel' },
      { name: '2.2 SX AT', transmission: 'Automatic', fuel_type: 'Diesel' },
    ]},
  ],
  Suzuki: [
    { name: 'Ertiga', body_type: 'MPV', variants: [
      { name: '1.5 GA MT', transmission: 'Manual', fuel_type: 'Gasoline' },
      { name: '1.5 GL AT', transmission: 'Automatic', fuel_type: 'Gasoline' },
      { name: '1.5 GLX AT', transmission: 'Automatic', fuel_type: 'Gasoline' },
    ]},
    { name: 'Swift', body_type: 'Hatchback', variants: [
      { name: '1.2 GL MT', transmission: 'Manual', fuel_type: 'Gasoline' },
      { name: '1.2 GL CVT', transmission: 'CVT', fuel_type: 'Gasoline' },
    ]},
    { name: 'Jimny', body_type: 'SUV', variants: [
      { name: '1.5 GL MT', transmission: 'Manual', fuel_type: 'Gasoline' },
      { name: '1.5 GLX AT', transmission: 'Automatic', fuel_type: 'Gasoline' },
    ]},
    { name: 'Carry', body_type: 'Utility', variants: [
      { name: '1.5 Cab & Chassis MT', transmission: 'Manual', fuel_type: 'Gasoline' },
      { name: '1.5 Utility Van MT', transmission: 'Manual', fuel_type: 'Gasoline' },
    ]},
  ],
  Isuzu: [
    { name: 'D-Max', body_type: 'Pickup', variants: [
      { name: '3.0 LS-E MT', transmission: 'Manual', fuel_type: 'Diesel' },
      { name: '3.0 LS-E AT', transmission: 'Automatic', fuel_type: 'Diesel' },
      { name: '3.0 LS-A AT', transmission: 'Automatic', fuel_type: 'Diesel' },
    ]},
    { name: 'mu-X', body_type: 'SUV', variants: [
      { name: '3.0 LS-E MT', transmission: 'Manual', fuel_type: 'Diesel' },
      { name: '3.0 LS-E AT', transmission: 'Automatic', fuel_type: 'Diesel' },
      { name: '3.0 LS-A AT', transmission: 'Automatic', fuel_type: 'Diesel' },
    ]},
    { name: 'Traviz', body_type: 'Utility', variants: [
      { name: 'L MT', transmission: 'Manual', fuel_type: 'Diesel' },
      { name: 'S MT', transmission: 'Manual', fuel_type: 'Diesel' },
    ]},
  ],
  Mazda: [
    { name: 'Mazda3', body_type: 'Sedan', variants: [
      { name: '1.5 Elite AT', transmission: 'Automatic', fuel_type: 'Gasoline' },
      { name: '2.0 Premium AT', transmission: 'Automatic', fuel_type: 'Gasoline' },
    ]},
    { name: 'CX-5', body_type: 'SUV', variants: [
      { name: '2.0 FWD Sport AT', transmission: 'Automatic', fuel_type: 'Gasoline' },
      { name: '2.2 AWD Sport AT', transmission: 'Automatic', fuel_type: 'Diesel' },
    ]},
    { name: 'CX-30', body_type: 'SUV', variants: [
      { name: '2.0 FWD Sport AT', transmission: 'Automatic', fuel_type: 'Gasoline' },
      { name: '2.0 FWD Premium AT', transmission: 'Automatic', fuel_type: 'Gasoline' },
    ]},
  ],
  Chevrolet: [
    { name: 'Tracker', body_type: 'SUV', variants: [
      { name: '1.0 LT Turbo AT', transmission: 'Automatic', fuel_type: 'Gasoline' },
      { name: '1.2 Premier Turbo AT', transmission: 'Automatic', fuel_type: 'Gasoline' },
    ]},
    { name: 'Tahoe', body_type: 'SUV', variants: [
      { name: '5.3 LT AT', transmission: 'Automatic', fuel_type: 'Gasoline' },
      { name: '6.2 High Country AT', transmission: 'Automatic', fuel_type: 'Gasoline' },
    ]},
  ],
  Subaru: [
    { name: 'XV', body_type: 'SUV', variants: [
      { name: '2.0i-S EyeSight CVT', transmission: 'CVT', fuel_type: 'Gasoline' },
      { name: '2.0i-S CVT', transmission: 'CVT', fuel_type: 'Gasoline' },
    ]},
    { name: 'Forester', body_type: 'SUV', variants: [
      { name: '2.0i-L EyeSight CVT', transmission: 'CVT', fuel_type: 'Gasoline' },
      { name: '2.0i-S EyeSight CVT', transmission: 'CVT', fuel_type: 'Gasoline' },
    ]},
  ],
  BMW: [
    { name: '3 Series', body_type: 'Sedan', variants: [
      { name: '318i Sport AT', transmission: 'Automatic', fuel_type: 'Gasoline' },
      { name: '320i M Sport AT', transmission: 'Automatic', fuel_type: 'Gasoline' },
    ]},
    { name: 'X1', body_type: 'SUV', variants: [
      { name: 'sDrive18i xLine AT', transmission: 'Automatic', fuel_type: 'Gasoline' },
      { name: 'sDrive20i M Sport AT', transmission: 'Automatic', fuel_type: 'Gasoline' },
    ]},
  ],
  'Mercedes-Benz': [
    { name: 'A-Class', body_type: 'Sedan', variants: [
      { name: 'A200 Progressive AT', transmission: 'Automatic', fuel_type: 'Gasoline' },
      { name: 'A200 AMG Line AT', transmission: 'Automatic', fuel_type: 'Gasoline' },
    ]},
    { name: 'GLA', body_type: 'SUV', variants: [
      { name: 'GLA200 Progressive AT', transmission: 'Automatic', fuel_type: 'Gasoline' },
      { name: 'GLA200 AMG Line AT', transmission: 'Automatic', fuel_type: 'Gasoline' },
    ]},
  ],
  Volkswagen: [
    { name: 'Santana', body_type: 'Sedan', variants: [
      { name: '1.5 MPI MT', transmission: 'Manual', fuel_type: 'Gasoline' },
      { name: '1.5 MPI AT', transmission: 'Automatic', fuel_type: 'Gasoline' },
    ]},
    { name: 'T-Cross', body_type: 'SUV', variants: [
      { name: '1.5 MPI AT', transmission: 'Automatic', fuel_type: 'Gasoline' },
      { name: '1.5 SE AT', transmission: 'Automatic', fuel_type: 'Gasoline' },
    ]},
  ],
  Geely: [
    { name: 'Coolray', body_type: 'SUV', variants: [
      { name: '1.5 Comfort DCT', transmission: 'DCT', fuel_type: 'Gasoline' },
      { name: '1.5 Sport DCT', transmission: 'DCT', fuel_type: 'Gasoline' },
    ]},
    { name: 'Emgrand', body_type: 'Sedan', variants: [
      { name: '1.5 Premium CVT', transmission: 'CVT', fuel_type: 'Gasoline' },
    ]},
    { name: 'Azkarra', body_type: 'SUV', variants: [
      { name: '1.5 Luxury DCT', transmission: 'DCT', fuel_type: 'Gasoline' },
    ]},
  ],
  Chery: [
    { name: 'Tiggo 2 Pro', body_type: 'SUV', variants: [
      { name: '1.5 Luxury CVT', transmission: 'CVT', fuel_type: 'Gasoline' },
    ]},
    { name: 'Tiggo 5X Pro', body_type: 'SUV', variants: [
      { name: '1.5 Turbo Luxury CVT', transmission: 'CVT', fuel_type: 'Gasoline' },
    ]},
    { name: 'Tiggo 7 Pro', body_type: 'SUV', variants: [
      { name: '1.5 Turbo Luxury DCT', transmission: 'DCT', fuel_type: 'Gasoline' },
    ]},
  ],
  MG: [
    { name: 'ZS', body_type: 'SUV', variants: [
      { name: '1.5 Style MT', transmission: 'Manual', fuel_type: 'Gasoline' },
      { name: '1.5 Alpha CVT', transmission: 'CVT', fuel_type: 'Gasoline' },
    ]},
    { name: 'MG5', body_type: 'Sedan', variants: [
      { name: '1.5 Core MT', transmission: 'Manual', fuel_type: 'Gasoline' },
      { name: '1.5 Alpha CVT', transmission: 'CVT', fuel_type: 'Gasoline' },
    ]},
    { name: 'RX5', body_type: 'SUV', variants: [
      { name: '1.5 Turbo Alpha AT', transmission: 'Automatic', fuel_type: 'Gasoline' },
    ]},
  ],
  GAC: [
    { name: 'GS3', body_type: 'SUV', variants: [
      { name: '1.5 Turbo AT', transmission: 'Automatic', fuel_type: 'Gasoline' },
    ]},
    { name: 'Emkoo', body_type: 'SUV', variants: [
      { name: '1.5 Turbo AT', transmission: 'Automatic', fuel_type: 'Gasoline' },
    ]},
    { name: 'GN6', body_type: 'MPV', variants: [
      { name: '1.5 Turbo AT', transmission: 'Automatic', fuel_type: 'Gasoline' },
    ]},
  ],
  Foton: [
    { name: 'Thunder', body_type: 'Pickup', variants: [
      { name: '2.0 Comfort MT', transmission: 'Manual', fuel_type: 'Diesel' },
      { name: '2.0 Luxury AT', transmission: 'Automatic', fuel_type: 'Diesel' },
    ]},
    { name: 'Toano', body_type: 'Van', variants: [
      { name: '2.8 HR MT', transmission: 'Manual', fuel_type: 'Diesel' },
    ]},
    { name: 'Gratour', body_type: 'MPV', variants: [
      { name: '1.5 TM MT', transmission: 'Manual', fuel_type: 'Gasoline' },
    ]},
  ],
}

// =============================================================================
// LOCATION SEED DATA
// =============================================================================

interface BarangayData {
  city: string
  barangays: string[]
}

interface ProvinceData {
  province: string
  cities: BarangayData[]
}

interface RegionData {
  region: string
  code: string
  provinces: ProvinceData[]
}

const locationData: RegionData[] = [
  // =========================================================================
  // REGION IX - ZAMBOANGA PENINSULA (PRIMARY - Full barangays for Zamboanga City)
  // =========================================================================
  {
    region: 'Region IX - Zamboanga Peninsula',
    code: 'IX',
    provinces: [
      {
        province: 'Zamboanga del Sur',
        cities: [
          {
            city: 'Zamboanga City',
            barangays: [
              'Arena Blanco', 'Ayala', 'Baliwasan', 'Baluno', 'Boalan',
              'Cabatangan', 'Cabaluay', 'Cacao', 'Calarian', 'Campo Islam',
              'Canelar', 'Cawit', 'Culianan', 'Curuan', 'Dita',
              'Divisoria', 'Dulian (Upper Bunguiao)', 'Dulian (Lower Bunguiao)', 'Guisao', 'Guiwan',
              'La Paz', 'Labuan', 'Lamisahan', 'Landang Gua', 'Landang Laum',
              'Lanzones', 'Lapakan', 'Latuan', 'Licomo', 'Limaong',
              'Limpapa', 'Lubigan', 'Lunzuran', 'Maasin', 'Malagutay',
              'Mampang', 'Manalipa', 'Mangusu', 'Manicahan', 'Mariki',
              'Mercedes', 'Muti', 'Pamucutan', 'Pangapuyan', 'Panubigan',
              'Pasilmanta', 'Pasonanca', 'Patalon', 'Putik', 'Quiniput',
              'Recodo', 'Rio Hondo', 'Salaan', 'San Jose Cawa-Cawa', 'San Jose Gusu',
              'San Roque', 'Sangali', 'Santa Barbara', 'Santa Catalina', 'Santa Maria',
              'Santo Niño', 'Sibulao', 'Sinunoc', 'Sinubung', 'Sta. Lucia',
              'Tagasilay', 'Talisayan', 'Taluksangay', 'Talon-Talon', 'Tictapul',
              'Tigbalabag', 'Tolosa', 'Tugbungan', 'Tumaga', 'Tumalutab',
              'Tumitus', 'Vitali', 'Zambowood', 'Zone I (Poblacion)', 'Zone II (Poblacion)',
              'Zone III (Poblacion)', 'Zone IV (Poblacion)',
            ],
          },
          {
            city: 'Pagadian City',
            barangays: [
              'Balangasan', 'Baloyboan', 'Banale', 'Buenavista', 'Dampalan',
              'Danlugan', 'Dao', 'Dumagoc', 'Gatas', 'Kawit',
              'Lala', 'Lenienza', 'Lumbia', 'Muricay', 'Napolan',
              'San Francisco', 'San Jose', 'San Pedro', 'Santa Lucia', 'Santa Maria',
              'Santiago', 'Santo Niño', 'Tuburan',
            ],
          },
          {
            city: 'Molave',
            barangays: ['Bliss', 'Culo', 'Dipolo', 'Miligan', 'Parasan', 'Poblacion'],
          },
          {
            city: 'Aurora',
            barangays: ['Anonang', 'Bagong Silang', 'Lanao', 'Poblacion', 'San Jose'],
          },
          {
            city: 'Dinas',
            barangays: ['Legarda', 'Poblacion', 'San Isidro', 'Simpak', 'Sominot'],
          },
        ],
      },
      {
        province: 'Zamboanga del Norte',
        cities: [
          {
            city: 'Dipolog City',
            barangays: [
              'Biasong', 'Central', 'Cogon', 'Dicayas', 'Diwan',
              'Estaka', 'Galas', 'Gulayon', 'Lugdungan', 'Minaog',
              'Miputak', 'Olingan', 'Polanco', 'Santa Filomena', 'Santa Isabel',
              'Sicayab', 'Sinaman', 'Turno',
            ],
          },
          {
            city: 'Dapitan City',
            barangays: [
              'Banbanan', 'Banonong', 'Cawa-Cawa', 'Dawo', 'Ilaya',
              'Linabo', 'Maria Cristina', 'Polo', 'Potol', 'San Francisco',
              'San Nicolas', 'San Pedro', 'Santa Cruz', 'Sunset',
              'Talisay', 'Tag-olo',
            ],
          },
        ],
      },
      {
        province: 'Zamboanga Sibugay',
        cities: [
          {
            city: 'Ipil',
            barangays: [
              'Bacalan', 'Bangkerohan', 'Caparan', 'Don Andres', 'Ipil Heights',
              'Logpond', 'Lower Taway', 'Naga-Naga', 'Sanito', 'Tenan',
              'Tiayon', 'Tukuran', 'Upper Pangi',
            ],
          },
        ],
      },
    ],
  },

  // =========================================================================
  // REGION NCR - NATIONAL CAPITAL REGION (Sample)
  // =========================================================================
  {
    region: 'NCR - National Capital Region',
    code: 'NCR',
    provinces: [
      {
        province: 'Metro Manila',
        cities: [
          {
            city: 'Quezon City',
            barangays: [
              'Bagong Pag-Asa', 'Bahay Toro', 'Batasan Hills', 'Commonwealth',
              'Diliman', 'Fairview', 'Holy Spirit', 'Kamuning', 'Loyola Heights',
              'New Era', 'Novaliches Proper', 'Project 6', 'Scout Area', 'South Triangle',
              'Tandang Sora', 'UP Campus', 'Vasra',
            ],
          },
          {
            city: 'Manila',
            barangays: [
              'Binondo', 'Ermita', 'Intramuros', 'Malate', 'Paco',
              'Pandacan', 'Port Area', 'Quiapo', 'Sampaloc', 'San Andres',
              'San Miguel', 'San Nicolas', 'Santa Ana', 'Santa Cruz', 'Tondo',
            ],
          },
          {
            city: 'Makati',
            barangays: [
              'Bel-Air', 'Carmona', 'Dasmarinas', 'Forbes Park', 'Guadalupe Nuevo',
              'Guadalupe Viejo', 'Kasilawan', 'La Paz', 'Magallanes', 'Olympia',
              'Palanan', 'Pio del Pilar', 'Poblacion', 'San Antonio', 'San Lorenzo',
              'Santa Cruz', 'Tejeros', 'Urdaneta', 'Valenzuela',
            ],
          },
          {
            city: 'Taguig',
            barangays: [
              'Bagumbayan', 'Bambang', 'Calzada', 'Fort Bonifacio', 'Hagonoy',
              'Ibayo-Tipas', 'Ligid-Tipas', 'Lower Bicutan', 'New Lower Bicutan',
              'North Daang Hari', 'Palingon', 'Pinagsama', 'Signal Village',
              'South Daang Hari', 'Tanyag', 'Tuktukan', 'Upper Bicutan', 'Western Bicutan',
            ],
          },
          {
            city: 'Pasig',
            barangays: [
              'Bagong Ilog', 'Bagong Katipunan', 'Bambang', 'Buting', 'Caniogan',
              'Kapitolyo', 'Manggahan', 'Maybunga', 'Oranbo', 'Palatiw',
              'Pineda', 'Rosario', 'San Antonio', 'San Joaquin', 'Santa Lucia',
              'Santolan', 'Ugong',
            ],
          },
        ],
      },
    ],
  },

  // =========================================================================
  // REGION IV-A - CALABARZON (Sample)
  // =========================================================================
  {
    region: 'Region IV-A - CALABARZON',
    code: 'IV-A',
    provinces: [
      {
        province: 'Cavite',
        cities: [
          {
            city: 'Bacoor',
            barangays: ['Alima', 'Aniban', 'Habay', 'Ligas', 'Mabolo', 'Molino', 'Niog', 'Panapaan', 'Real', 'Talaba'],
          },
          {
            city: 'Dasmariñas',
            barangays: ['Burol', 'Datu Esmael', 'Fatima', 'Langkaan', 'Paliparan', 'Sabang', 'Salawag', 'Sampaloc', 'San Agustin', 'Zone I'],
          },
          {
            city: 'Imus',
            barangays: ['Alapan', 'Anabu', 'Bayan Luma', 'Bucandala', 'Malagasang', 'Medicion', 'Palico', 'Pasong Buaya', 'Tanzang Luma', 'Toclong'],
          },
        ],
      },
      {
        province: 'Laguna',
        cities: [
          {
            city: 'Santa Rosa',
            barangays: ['Balibago', 'Dila', 'Dita', 'Don Jose', 'Ibaba', 'Malitlit', 'Pulong Santa Cruz', 'Santo Domingo', 'Tagapo', 'Macabling'],
          },
          {
            city: 'Calamba',
            barangays: ['Bagong Kalsada', 'Bañadero', 'Batino', 'Bucal', 'Halang', 'Lawa', 'Lecheria', 'Pansol', 'Real', 'Saimsim'],
          },
        ],
      },
      {
        province: 'Batangas',
        cities: [
          {
            city: 'Lipa',
            barangays: ['Adio', 'Anilao', 'Bagong Pook', 'Balintawak', 'Bolbok', 'Dagatan', 'Halang', 'Inosluban', 'Marauoy', 'Mataas na Lupa'],
          },
        ],
      },
    ],
  },

  // =========================================================================
  // REGION VII - CENTRAL VISAYAS (Sample)
  // =========================================================================
  {
    region: 'Region VII - Central Visayas',
    code: 'VII',
    provinces: [
      {
        province: 'Cebu',
        cities: [
          {
            city: 'Cebu City',
            barangays: [
              'Apas', 'Banilad', 'Basak San Nicolas', 'Capitol Site', 'Guadalupe',
              'Lahug', 'Mabolo', 'Mambaling', 'Pardo', 'San Nicolas Proper',
              'Talamban', 'Tisa',
            ],
          },
          {
            city: 'Mandaue',
            barangays: ['Banilad', 'Basak', 'Cabancalan', 'Casili', 'Centro', 'Guizo', 'Ibabao-Estancia', 'Looc', 'Maguikay', 'Subangdaku'],
          },
          {
            city: 'Lapu-Lapu',
            barangays: ['Basak', 'Buaya', 'Gun-ob', 'Mactan', 'Marigondon', 'Pajo', 'Poblacion', 'Pusok', 'Soong'],
          },
        ],
      },
    ],
  },

  // =========================================================================
  // REGION XI - DAVAO REGION (Sample)
  // =========================================================================
  {
    region: 'Region XI - Davao Region',
    code: 'XI',
    provinces: [
      {
        province: 'Davao del Sur',
        cities: [
          {
            city: 'Davao City',
            barangays: [
              'Agdao', 'Bajada', 'Bangkal', 'Buhangin Proper', 'Bunawan Proper',
              'Calinan Proper', 'Catalunan Grande', 'Catalunan Pequeño', 'Ecoland',
              'Langub', 'Ma-a', 'Matina Crossing', 'Mintal', 'Pampanga',
              'Sasa', 'Talomo Proper', 'Toril Proper',
            ],
          },
        ],
      },
      {
        province: 'Davao del Norte',
        cities: [
          {
            city: 'Tagum',
            barangays: ['Apokon', 'Canocotan', 'Magdum', 'Mankilam', 'Pagsabangan', 'Pandapan', 'Poblacion', 'San Agustin', 'Visayan Village'],
          },
          {
            city: 'Panabo',
            barangays: ['Datu Abdul Dadia', 'Gredu', 'J.P. Laurel', 'Kasilak', 'New Pandan', 'New Visayas', 'Poblacion', 'San Francisco', 'Santo Niño'],
          },
        ],
      },
    ],
  },

  // =========================================================================
  // REGION III - CENTRAL LUZON (Sample)
  // =========================================================================
  {
    region: 'Region III - Central Luzon',
    code: 'III',
    provinces: [
      {
        province: 'Pampanga',
        cities: [
          {
            city: 'Angeles',
            barangays: ['Amsic', 'Anunas', 'Balibago', 'Cutcut', 'Hensonville', 'Lourdes North West', 'Malabanias', 'Mining', 'Pampang', 'Pulung Maragul'],
          },
          {
            city: 'San Fernando',
            barangays: ['Dolores', 'Juliana', 'Lara', 'Maimpis', 'Sindalan', 'Telabastagan'],
          },
        ],
      },
      {
        province: 'Bulacan',
        cities: [
          {
            city: 'Meycauayan',
            barangays: ['Bagbaguin', 'Bahay Pare', 'Bancal', 'Banga', 'Bayugo', 'Caingin', 'Calvario', 'Camalig', 'Hulo', 'Iba'],
          },
        ],
      },
    ],
  },
]

// =============================================================================
// SEED API HANDLER
// =============================================================================

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: adminUser } = await supabase
    .from('admin_users')
    .select('id, admin_roles(role_name)')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .single()

  if (!adminUser) {
    return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 })
  }

  const admin = createAdminClient()
  const log: string[] = []

  try {
    // =========================================================================
    // 1. Seed Vehicle Brands
    // =========================================================================
    log.push('Seeding vehicle brands...')
    const brandMap: Record<string, string> = {}

    for (const brand of vehicleBrands) {
      const { data, error } = await admin
        .from('vehicle_brands')
        .upsert({ name: brand.name, logo_url: brand.logo_url, is_active: true }, { onConflict: 'name' })
        .select('id, name')
        .single()

      if (error) {
        log.push(`  WARN brand "${brand.name}": ${error.message}`)
        // Try to fetch existing
        const { data: existing } = await admin
          .from('vehicle_brands')
          .select('id')
          .eq('name', brand.name)
          .single()
        if (existing) brandMap[brand.name] = existing.id
      } else if (data) {
        brandMap[data.name] = data.id
      }
    }
    log.push(`  ${Object.keys(brandMap).length} brands seeded`)

    // =========================================================================
    // 2. Seed Vehicle Models & Variants
    // =========================================================================
    log.push('Seeding vehicle models & variants...')
    let modelCount = 0
    let variantCount = 0

    for (const [brandName, models] of Object.entries(vehicleModels)) {
      const brandId = brandMap[brandName]
      if (!brandId) {
        log.push(`  SKIP models for "${brandName}" - brand not found`)
        continue
      }

      for (const model of models) {
        const { data: modelData, error: modelErr } = await admin
          .from('vehicle_models')
          .upsert(
            { brand_id: brandId, name: model.name, body_type: model.body_type, is_active: true },
            { onConflict: 'brand_id,name' }
          )
          .select('id')
          .single()

        let modelId = modelData?.id
        if (modelErr) {
          const { data: existing } = await admin
            .from('vehicle_models')
            .select('id')
            .eq('brand_id', brandId)
            .eq('name', model.name)
            .single()
          modelId = existing?.id
        } else {
          modelCount++
        }

        if (!modelId) continue

        for (const variant of model.variants) {
          const { error: varErr } = await admin
            .from('vehicle_variants')
            .upsert(
              {
                model_id: modelId,
                name: variant.name,
                transmission: variant.transmission,
                fuel_type: variant.fuel_type,
                is_active: true,
              },
              { onConflict: 'model_id,name' }
            )

          if (!varErr) variantCount++
        }
      }
    }
    log.push(`  ${modelCount} models, ${variantCount} variants seeded`)

    // =========================================================================
    // 3. Seed Locations
    // =========================================================================
    log.push('Seeding locations...')
    let regionCount = 0, provinceCount = 0, cityCount = 0, barangayCount = 0

    for (const regionData of locationData) {
      // Upsert region
      const { data: region, error: regErr } = await admin
        .from('addr_regions')
        .upsert({ name: regionData.region, code: regionData.code, is_active: true }, { onConflict: 'name' })
        .select('id')
        .single()

      let regionId = region?.id
      if (regErr) {
        // name might not have unique constraint, try insert or select
        const { data: existing } = await admin
          .from('addr_regions')
          .select('id')
          .eq('name', regionData.region)
          .single()
        regionId = existing?.id
        if (!regionId) {
          const { data: created } = await admin
            .from('addr_regions')
            .insert({ name: regionData.region, code: regionData.code, is_active: true })
            .select('id')
            .single()
          regionId = created?.id
        }
      } else {
        regionCount++
      }
      if (!regionId) { log.push(`  SKIP region ${regionData.region}`); continue }

      for (const provData of regionData.provinces) {
        // Check existing province
        const { data: existingProv } = await admin
          .from('addr_provinces')
          .select('id')
          .eq('region_id', regionId)
          .eq('name', provData.province)
          .single()

        let provinceId = existingProv?.id
        if (!provinceId) {
          const { data: prov } = await admin
            .from('addr_provinces')
            .insert({ region_id: regionId, name: provData.province, is_active: true })
            .select('id')
            .single()
          provinceId = prov?.id
          provinceCount++
        }
        if (!provinceId) continue

        for (const cityData of provData.cities) {
          const { data: existingCity } = await admin
            .from('addr_cities')
            .select('id')
            .eq('province_id', provinceId)
            .eq('name', cityData.city)
            .single()

          let cityId = existingCity?.id
          if (!cityId) {
            const { data: city } = await admin
              .from('addr_cities')
              .insert({ province_id: provinceId, name: cityData.city, is_active: true })
              .select('id')
              .single()
            cityId = city?.id
            cityCount++
          }
          if (!cityId) continue

          // Batch insert barangays
          const barangayRows = cityData.barangays.map(name => ({
            city_id: cityId!,
            name,
            is_active: true,
          }))

          // Check existing barangays to avoid duplicates
          const { data: existingBarangays } = await admin
            .from('addr_barangays')
            .select('name')
            .eq('city_id', cityId)

          const existingNames = new Set((existingBarangays || []).map(b => b.name))
          const newBarangays = barangayRows.filter(b => !existingNames.has(b.name))

          if (newBarangays.length > 0) {
            const { error: brgErr } = await admin
              .from('addr_barangays')
              .insert(newBarangays)

            if (!brgErr) {
              barangayCount += newBarangays.length
            } else {
              log.push(`  WARN barangays for ${cityData.city}: ${brgErr.message}`)
            }
          }
        }
      }
    }
    log.push(`  ${regionCount} regions, ${provinceCount} provinces, ${cityCount} cities, ${barangayCount} barangays seeded`)

    return NextResponse.json({
      success: true,
      message: 'Seed data inserted successfully',
      log,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: `Seed failed: ${message}`, log }, { status: 500 })
  }
}
