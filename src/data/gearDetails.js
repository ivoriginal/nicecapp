// Gear details with usedBy data
const gearDetails = {
  'Hario V60 Ceramic Dripper': {
    id: 'gear-v60',
    brand: 'Hario',
    type: 'Pour Over',
    image: 'https://www.hario-europe.com/cdn/shop/files/VDC-01R_web.png?v=1683548122&width=1400',
    usedBy: [
      { id: 'user1', name: 'Ivo Vilches', avatar: 'assets/users/ivo-vilches.jpg' },
      { id: 'user7', name: 'Sophia Miller', avatar: 'https://randomuser.me/api/portraits/women/68.jpg' }
    ]
  },
  
  'AeroPress Coffee Maker': {
    id: 'gear-aeropress',
    brand: 'AeroPress',
    type: 'Brewer',
    image: 'https://aeropress.com/cdn/shop/files/Hero_Original_87a4958c-7df9-43b6-af92-0edc12c126cf_900x.png?v=1744683381',
    usedBy: [
      { id: 'user1', name: 'Ivo Vilches', avatar: 'assets/users/ivo-vilches.jpg' },
      { id: 'user6', name: 'David Kim', avatar: 'https://randomuser.me/api/portraits/men/45.jpg' }
    ]
  },
  
  'Chemex 6-Cup Coffee Maker': {
    id: 'gear-chemex',
    brand: 'Chemex',
    type: 'Pour Over',
    image: 'https://ryfqzshdgfrrkizlpnqg.supabase.co/storage/v1/object/public/gear/chemex.jpg',
    usedBy: [
      { id: 'user1', name: 'Ivo Vilches', avatar: 'assets/users/ivo-vilches.jpg' },
      { id: 'user5', name: 'Emma Garcia', avatar: 'https://randomuser.me/api/portraits/women/33.jpg' }
    ]
  },
  
  'Hario Ceramic Coffee Mill Slim': {
    id: 'gear-hario-slim',
    brand: 'Hario',
    type: 'Grinder',
    image: 'https://ryfqzshdgfrrkizlpnqg.supabase.co/storage/v1/object/public/gear/hario-ceramic-slim.jpg',
    usedBy: [
      { id: 'user1', name: 'Ivo Vilches', avatar: 'assets/users/ivo-vilches.jpg' },
      { id: 'user3', name: 'Carlos Hernández', avatar: 'assets/users/carlos-hernandez.jpg' }
    ]
  },
  
  'Hario Range Server 600ml': {
    id: 'gear-hario-server',
    brand: 'Hario',
    type: 'Brewer',
    image: 'https://ryfqzshdgfrrkizlpnqg.supabase.co/storage/v1/object/public/gear/hario-range-server.jpg',
    usedBy: [
      { id: 'user1', name: 'Ivo Vilches', avatar: 'assets/users/ivo-vilches.jpg' },
      { 
        id: 'cafe-cafelab-cartagena', 
        businessId: 'business-cafelab',
        name: 'CaféLab Cartagena', 
        avatar: 'assets/businesses/cafelab-logo.png',
        type: 'cafe',
        location: 'Cartagena, Spain'
      }
    ]
  },
  
  'Comandante C40 MK3 Grinder': {
    id: 'gear-comandante',
    brand: 'Comandante',
    type: 'Grinder',
    image: 'https://ryfqzshdgfrrkizlpnqg.supabase.co/storage/v1/object/public/gear/comandante-c40-mk4.jpg',
    usedBy: [
      { id: 'user2', name: 'Vértigo y Calambre', avatar: 'assets/businesses/vertigo-logo.jpg' },
      { id: 'user8', name: 'James Wilson', avatar: 'https://randomuser.me/api/portraits/men/22.jpg' }
    ]
  },
  
  'Fellow Stagg EKG Electric Kettle': {
    id: 'gear-stagg',
    brand: 'Fellow',
    type: 'Kettle',
    image: 'https://hola.coffee/cdn/shop/files/FELLOW-STAGG_1024x1024@2x.jpg?v=1732719228',
    usedBy: [
      { id: 'user11', name: 'Elias Veris', avatar: 'assets/users/elias-veris.jpg' },
      { id: 'user7', name: 'Sophia Miller', avatar: 'https://randomuser.me/api/portraits/women/68.jpg' },
      { id: 'user5', name: 'Emma Garcia', avatar: 'https://randomuser.me/api/portraits/women/33.jpg' }
    ]
  },
  
  'Baratza Encore Coffee Grinder': {
    id: 'gear-encore',
    brand: 'Baratza',
    type: 'Grinder',
    image: 'https://images.unsplash.com/photo-1606855637090-c6b478ca2635',
    usedBy: [
      { id: 'user9', name: 'Olivia Taylor', avatar: 'https://randomuser.me/api/portraits/women/12.jpg' },
      { id: 'user5', name: 'Emma Garcia', avatar: 'https://randomuser.me/api/portraits/women/33.jpg' }
    ]
  },
  
  '9Barista Espresso Maker': {
    id: 'gear-9barista',
    brand: '9Barista',
    type: 'Espresso Machine',
    image: 'https://9barista.com/wp-content/uploads/2022/10/9Barista-espresso-machine-front-800x800.jpg',
    usedBy: [
      { id: 'user7', name: 'Sophia Miller', avatar: 'https://randomuser.me/api/portraits/women/68.jpg' },
      { id: 'user6', name: 'David Kim', avatar: 'https://randomuser.me/api/portraits/men/45.jpg' }
    ]
  },
  
  'Fellow Opus Conical Burr Grinder': {
    id: 'gear-fellow-opus',
    brand: 'Fellow',
    type: 'Grinder',
    image: 'https://fellowproducts.com/cdn/shop/products/FellowProducts_OpusConicalBurrGrinder_MatteBlack_01.png',
    usedBy: [
      { id: 'user9', name: 'Olivia Taylor', avatar: 'https://randomuser.me/api/portraits/women/12.jpg' },
      { id: 'user7', name: 'Sophia Miller', avatar: 'https://randomuser.me/api/portraits/women/68.jpg' }
    ]
  },
  
  'Acaia Pearl Scale': {
    id: 'gear-acaia-pearl',
    brand: 'Acaia',
    type: 'Scale',
    image: 'https://ryfqzshdgfrrkizlpnqg.supabase.co/storage/v1/object/public/gear/acaia-pearl.jpg',
    usedBy: [
      { id: 'user1', name: 'Ivo Vilches', avatar: 'assets/users/ivo-vilches.jpg' },
      { id: 'user3', name: 'Carlos Hernández', avatar: 'assets/users/carlos-hernandez.jpg' }
    ]
  },
  
  // -----------------------------------------------------------------
  // Newly added gear items (gear14 – gear43)
  // -----------------------------------------------------------------

  '1Zpresso JX-Pro': {
    id: 'gear-jxpro',
    brand: '1Zpresso',
    type: 'Grinder',
    image: 'https://ryfqzshdgfrrkizlpnqg.supabase.co/storage/v1/object/public/gear/1zpresso-jx-pro.jpg',
    usedBy: []
  },

  'Acaia Lunar Scale': {
    id: 'gear-acaia-lunar',
    brand: 'Acaia',
    type: 'Scale',
    image: 'https://ryfqzshdgfrrkizlpnqg.supabase.co/storage/v1/object/public/gear/acaia-lunar.jpg',
    usedBy: []
  },

  'Bonavita Variable-Temp Kettle': {
    id: 'gear-bonavita-kettle',
    brand: 'Bonavita',
    type: 'Kettle',
    image: 'https://ryfqzshdgfrrkizlpnqg.supabase.co/storage/v1/object/public/gear/bonavita-kettle.jpg',
    usedBy: []
  },

  'Baratza Forté AP Grinder': {
    id: 'gear-forte-ap',
    brand: 'Baratza',
    type: 'Grinder',
    image: 'https://ryfqzshdgfrrkizlpnqg.supabase.co/storage/v1/object/public/gear/baratza-forte-ap.jpg',
    usedBy: []
  },

  'Baratza Vario Grinder': {
    id: 'gear-vario',
    brand: 'Baratza',
    type: 'Grinder',
    image: 'https://ryfqzshdgfrrkizlpnqg.supabase.co/storage/v1/object/public/gear/baratza-vario.jpg',
    usedBy: []
  },

  'Comandante C40 MK3 Grinder': {
    id: 'gear-comandante-mk3',
    brand: 'Comandante',
    type: 'Grinder',
    image: 'https://ryfqzshdgfrrkizlpnqg.supabase.co/storage/v1/object/public/gear/comandante-c40-mk3.jpg',
    usedBy: []
  },

  'Eureka Mignon Specialità': {
    id: 'gear-eureka-mignon',
    brand: 'Eureka',
    type: 'Grinder',
    image: 'https://ryfqzshdgfrrkizlpnqg.supabase.co/storage/v1/object/public/gear/eureka-mignon.jpg',
    usedBy: []
  },

  'Fellow Stagg X Dripper': {
    id: 'gear-stagg-x',
    brand: 'Fellow',
    type: 'Pour Over',
    image: 'https://ryfqzshdgfrrkizlpnqg.supabase.co/storage/v1/object/public/gear/fellow-stagg-x.jpg',
    usedBy: []
  },

  'GrowlerWerks uKeg Nitro': {
    id: 'gear-ukeg-nitro',
    brand: 'GrowlerWerks',
    type: 'Accessories',
    image: 'https://ryfqzshdgfrrkizlpnqg.supabase.co/storage/v1/object/public/gear/ukeg-nitro.jpg',
    usedBy: []
  },

  'Ikawa Pro V3 Sample Roaster': {
    id: 'gear-ikawa-pro-v3',
    brand: 'Ikawa',
    type: 'Roaster',
    image: 'https://ryfqzshdgfrrkizlpnqg.supabase.co/storage/v1/object/public/gear/ikawa-pro-v3.jpg',
    usedBy: []
  },

  'Kalita Wave 185 Dripper': {
    id: 'gear-kalita-wave',
    brand: 'Kalita',
    type: 'Pour Over',
    image: 'https://ryfqzshdgfrrkizlpnqg.supabase.co/storage/v1/object/public/gear/kalita-wave.jpg',
    usedBy: []
  },

  'KitchenAid Pro Line Grinder': {
    id: 'gear-kitchenaid-pro',
    brand: 'KitchenAid',
    type: 'Grinder',
    image: 'https://ryfqzshdgfrrkizlpnqg.supabase.co/storage/v1/object/public/gear/kitchenaid-pro-line.jpg',
    usedBy: []
  },

  'Kees van der Westen Speedster': {
    id: 'gear-speedster',
    brand: 'Kees van der Westen',
    type: 'Espresso Machine',
    image: 'https://ryfqzshdgfrrkizlpnqg.supabase.co/storage/v1/object/public/gear/speedster.jpg',
    usedBy: []
  },

  'La Marzocco GS3 Espresso Machine': {
    id: 'gear-gs3',
    brand: 'La Marzocco',
    type: 'Espresso Machine',
    image: 'https://ryfqzshdgfrrkizlpnqg.supabase.co/storage/v1/object/public/gear/gs3.jpg',
    usedBy: []
  },

  'La Marzocco Linea Mini': {
    id: 'gear-linea-mini',
    brand: 'La Marzocco',
    type: 'Espresso Machine',
    image: 'https://ryfqzshdgfrrkizlpnqg.supabase.co/storage/v1/object/public/gear/linea-mini.jpg',
    usedBy: []
  },

  'Loring S15 Falcon Roaster': {
    id: 'gear-loring-s15',
    brand: 'Loring',
    type: 'Roaster',
    image: 'https://ryfqzshdgfrrkizlpnqg.supabase.co/storage/v1/object/public/gear/loring-s15.jpg',
    usedBy: []
  },

  'Mahlkönig EK43 Grinder': {
    id: 'gear-ek43',
    brand: 'Mahlkönig',
    type: 'Grinder',
    image: 'https://ryfqzshdgfrrkizlpnqg.supabase.co/storage/v1/object/public/gear/ek43.jpg',
    usedBy: []
  },

  'Moccamaster KBGV Brewer': {
    id: 'gear-moccamaster-kbgv',
    brand: 'Technivorm',
    type: 'Brewer',
    image: 'https://ryfqzshdgfrrkizlpnqg.supabase.co/storage/v1/object/public/gear/moccamaster-kbgv.jpg',
    usedBy: []
  },

  'Origami Dripper': {
    id: 'gear-origami',
    brand: 'Origami',
    type: 'Pour Over',
    image: 'https://ryfqzshdgfrrkizlpnqg.supabase.co/storage/v1/object/public/gear/origami-dripper.jpg',
    usedBy: []
  },

  'Profitec Pro 700': {
    id: 'gear-pro-700',
    brand: 'Profitec',
    type: 'Espresso Machine',
    image: 'https://ryfqzshdgfrrkizlpnqg.supabase.co/storage/v1/object/public/gear/pro-700.jpg',
    usedBy: []
  },

  'Rocket Appartamento': {
    id: 'gear-rocket-appartamento',
    brand: 'Rocket Espresso',
    type: 'Espresso Machine',
    image: 'https://ryfqzshdgfrrkizlpnqg.supabase.co/storage/v1/object/public/gear/rocket-appartamento.jpg',
    usedBy: []
  },

  'Rancilio Silvia': {
    id: 'gear-rancilio-silvia',
    brand: 'Rancilio',
    type: 'Espresso Machine',
    image: 'https://ryfqzshdgfrrkizlpnqg.supabase.co/storage/v1/object/public/gear/rancilio-silvia.jpg',
    usedBy: []
  },

  'SAI Phoenix Brewer': {
    id: 'gear-phoenix',
    brand: 'Saint Anthony Industries',
    type: 'Pour Over',
    image: 'https://ryfqzshdgfrrkizlpnqg.supabase.co/storage/v1/object/public/gear/phoenix-brewer.jpg',
    usedBy: []
  },

  'Slayer Espresso Single Group': {
    id: 'gear-slayer-sg',
    brand: 'Slayer Espresso',
    type: 'Espresso Machine',
    image: 'https://ryfqzshdgfrrkizlpnqg.supabase.co/storage/v1/object/public/gear/slayer-sg.jpg',
    usedBy: []
  },

  'Synesso S200': {
    id: 'gear-synesso-s200',
    brand: 'Synesso',
    type: 'Espresso Machine',
    image: 'https://ryfqzshdgfrrkizlpnqg.supabase.co/storage/v1/object/public/gear/synesso-s200.jpg',
    usedBy: []
  },

  'Toddy Cold Brew System': {
    id: 'gear-toddy',
    brand: 'Toddy',
    type: 'Brewer',
    image: 'https://ryfqzshdgfrrkizlpnqg.supabase.co/storage/v1/object/public/gear/toddy.jpg',
    usedBy: []
  },

  'Victoria Arduino Eagle One': {
    id: 'gear-eagle-one',
    brand: 'Victoria Arduino',
    type: 'Espresso Machine',
    image: 'https://ryfqzshdgfrrkizlpnqg.supabase.co/storage/v1/object/public/gear/eagle-one.jpg',
    usedBy: []
  },

  'Weber Workshops Key Grinder': {
    id: 'gear-key-grinder',
    brand: 'Weber Workshops',
    type: 'Grinder',
    image: 'https://ryfqzshdgfrrkizlpnqg.supabase.co/storage/v1/object/public/gear/key-grinder.jpg',
    usedBy: []
  },

  'Yama Glass Cold Brew Tower': {
    id: 'gear-yama-tower',
    brand: 'Yama',
    type: 'Brewer',
    image: 'https://ryfqzshdgfrrkizlpnqg.supabase.co/storage/v1/object/public/gear/yama-tower.jpg',
    usedBy: []
  },

  'Nitro Cold Brew Kegerator': {
    id: 'gear-kegerator',
    brand: 'Generic',
    type: 'Accessories',
    image: 'https://ryfqzshdgfrrkizlpnqg.supabase.co/storage/v1/object/public/gear/kegerator.jpg',
    usedBy: []
  },

  // -----------------------------------------------------------------
  // End of added gear items
  // -----------------------------------------------------------------
};

export default gearDetails; 