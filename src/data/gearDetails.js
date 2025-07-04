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
  }
  // Add more gear items as needed
};

export default gearDetails; 