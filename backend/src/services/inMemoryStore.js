const bcrypt = require('bcryptjs');

// Haversine formula to compute great-circle distance in kilometers
const calculateDistanceKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
};

// Date helper for seeding
const now = new Date();
const addDays = (days, hours = 0) => {
  const date = new Date(now);
  date.setDate(date.getDate() + days);
  date.setHours(date.getHours() + hours);
  return date.toISOString();
};

const DEMO_USERS = [
  {
    _id: '670000000000000000000001',
    id: '670000000000000000000001',
    name: 'LocalVibe Curator',
    email: 'curator@localvibe.app',
    passwordHash: '$2b$10$dz6iakfJRuhwjBmQgTQdCOUPTvmRHBCBgEG4TcRZn5QaCX66IAK3i', // password123
    profileImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
    bio: 'Official LocalVibe community event host and curator.',
    role: 'ADMIN',
    location: { city: 'Mumbai', coordinates: [72.8777, 19.0760] },
    createdAt: new Date().toISOString()
  },
  {
    _id: '670000000000000000000002',
    id: '670000000000000000000002',
    name: 'Mumbai Community Events',
    email: 'demo.mumbai@localvibe.demo',
    passwordHash: '$2b$10$dz6iakfJRuhwjBmQgTQdCOUPTvmRHBCBgEG4TcRZn5QaCX66IAK3i', // password123
    profileImage: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80',
    bio: 'Hyperlocal community host curating premier gatherings across Mumbai.',
    role: 'ORGANIZER',
    location: { city: 'Mumbai', coordinates: [72.8358, 19.0596] },
    createdAt: new Date().toISOString()
  },
  {
    _id: '670000000000000000000003',
    id: '670000000000000000000003',
    name: 'Pune Local Events',
    email: 'demo.pune@localvibe.demo',
    passwordHash: '$2b$10$dz6iakfJRuhwjBmQgTQdCOUPTvmRHBCBgEG4TcRZn5QaCX66IAK3i', // password123
    profileImage: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=300&q=80',
    bio: 'Organizing art walks, jazz evenings, and active meetups across Pune.',
    role: 'ORGANIZER',
    location: { city: 'Pune', coordinates: [73.8567, 18.5204] },
    createdAt: new Date().toISOString()
  },
  {
    _id: '670000000000000000000004',
    id: '670000000000000000000004',
    name: 'Bengaluru Events Hub',
    email: 'demo.bengaluru@localvibe.demo',
    passwordHash: '$2b$10$dz6iakfJRuhwjBmQgTQdCOUPTvmRHBCBgEG4TcRZn5QaCX66IAK3i', // password123
    profileImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
    bio: 'Connecting techies, artists, and nature lovers in the Silicon Plateau.',
    role: 'ORGANIZER',
    location: { city: 'Bengaluru', coordinates: [77.5946, 12.9716] },
    createdAt: new Date().toISOString()
  },
  {
    _id: '670000000000000000000005',
    id: '670000000000000000000005',
    name: 'Delhi Community Collective',
    email: 'demo.delhi@localvibe.demo',
    passwordHash: '$2b$10$dz6iakfJRuhwjBmQgTQdCOUPTvmRHBCBgEG4TcRZn5QaCX66IAK3i', // password123
    profileImage: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80',
    bio: 'Heritage walks, open mics, and food festivals across the Capital.',
    role: 'ORGANIZER',
    location: { city: 'Delhi', coordinates: [77.2090, 28.6139] },
    createdAt: new Date().toISOString()
  },
  {
    _id: '670000000000000000000006',
    id: '670000000000000000000006',
    name: 'LocalVibe Demo Organizer',
    email: 'demo.events@localvibe.demo',
    passwordHash: '$2b$10$dz6iakfJRuhwjBmQgTQdCOUPTvmRHBCBgEG4TcRZn5QaCX66IAK3i', // password123
    profileImage: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80',
    bio: 'National event curator for cultural and community experiences.',
    role: 'ORGANIZER',
    location: { city: 'Mumbai', coordinates: [72.8777, 19.0760] },
    createdAt: new Date().toISOString()
  },
  {
    _id: '670000000000000000000007',
    id: '670000000000000000000007',
    name: 'Aarav Patel',
    email: 'demo.user1@localvibe.demo',
    passwordHash: '$2b$10$dz6iakfJRuhwjBmQgTQdCOUPTvmRHBCBgEG4TcRZn5QaCX66IAK3i', // password123
    profileImage: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=300&q=80',
    bio: 'Music enthusiast and coffee explorer in Bandra.',
    role: 'USER',
    location: { city: 'Mumbai', coordinates: [72.8358, 19.0596] },
    interests: ['Music', 'Food & Drink', 'Markets'],
    createdAt: new Date().toISOString()
  },
  {
    _id: '670000000000000000000008',
    id: '670000000000000000000008',
    name: 'Ananya Sharma',
    email: 'demo.user2@localvibe.demo',
    passwordHash: '$2b$10$dz6iakfJRuhwjBmQgTQdCOUPTvmRHBCBgEG4TcRZn5QaCX66IAK3i', // password123
    profileImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
    bio: 'Yoga practitioner and weekend workshop enthusiast.',
    role: 'USER',
    location: { city: 'Pune', coordinates: [73.8913, 18.5362] },
    interests: ['Sports', 'Workshops', 'Arts & Culture'],
    createdAt: new Date().toISOString()
  }
];

const sanitizeOrganizer = (org) => {
  if (!org) return null;
  const obj = typeof org === 'object' ? org : {};
  return {
    _id: obj._id || obj.id,
    id: obj._id || obj.id,
    name: obj.name || 'Local Curator',
    email: obj.email || '',
    profileImage: obj.profileImage || '',
    bio: obj.bio || ''
  };
};

const defaultCurator = sanitizeOrganizer(DEMO_USERS[0]);
const mumbaiOrg = sanitizeOrganizer(DEMO_USERS[1]);
const puneOrg = sanitizeOrganizer(DEMO_USERS[2]);
const blrOrg = sanitizeOrganizer(DEMO_USERS[3]);
const delhiOrg = sanitizeOrganizer(DEMO_USERS[4]);
const demoEventsOrg = sanitizeOrganizer(DEMO_USERS[5]);

const initialEvents = [
  // --- 1. MUMBAI (8 Events) ---
  {
    _id: '670000000000000000000101',
    id: '670000000000000000000101',
    title: 'Bandra Organic Farmers Market',
    description: 'Discover fresh organic produce, artisanal cheeses, sourdough breads, and local honey direct from regional farmers.',
    category: 'Markets',
    startDate: addDays(1, 2),
    endDate: addDays(1, 6),
    location: {
      type: 'Point',
      coordinates: [72.8258, 19.0596], // [lng, lat] Bandra West, Mumbai
      address: 'Carter Road Promenade, Bandra West, Mumbai',
      city: 'Mumbai'
    },
    price: 0,
    image: 'https://images.unsplash.com/photo-1488459716781-31db52582fe9?auto=format&fit=crop&w=1200&q=80',
    organizer: mumbaiOrg,
    isFeatured: true,
    status: 'ACTIVE',
    attendeesCount: 42,
    goingCount: 36,
    interestedCount: 6,
    createdAt: new Date().toISOString()
  },
  {
    _id: '670000000000000000000102',
    id: '670000000000000000000102',
    title: 'Juhu Beach Acoustic Sunset Jam',
    description: 'Unwind by the Arabian Sea with live indie folk, blues, and acoustic performances under the sunset.',
    category: 'Music',
    startDate: addDays(2, 4),
    endDate: addDays(2, 7),
    location: {
      type: 'Point',
      coordinates: [72.8258, 19.1075], // [lng, lat] Juhu Beach, Mumbai
      address: 'Juhu Tara Road, Juhu, Mumbai',
      city: 'Mumbai'
    },
    price: 350,
    image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1200&q=80',
    organizer: mumbaiOrg,
    isFeatured: false,
    status: 'ACTIVE',
    attendeesCount: 28,
    goingCount: 20,
    interestedCount: 8,
    createdAt: new Date().toISOString()
  },
  {
    _id: '670000000000000000000103',
    id: '670000000000000000000103',
    title: 'Lower Parel Street Food Festival',
    description: 'Sample culinary delights from over 30 street food masters featuring gourmet Pav Bhaji, Frankies, and fusion desserts.',
    category: 'Food & Drink',
    startDate: addDays(3, 1),
    endDate: addDays(3, 8),
    location: {
      type: 'Point',
      coordinates: [72.8313, 19.0016], // [lng, lat] Lower Parel, Mumbai
      address: 'High Street Phoenix Courtyard, Lower Parel, Mumbai',
      city: 'Mumbai'
    },
    price: 0,
    image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80',
    organizer: mumbaiOrg,
    isFeatured: true,
    status: 'ACTIVE',
    attendeesCount: 156,
    goingCount: 120,
    interestedCount: 36,
    createdAt: new Date().toISOString()
  },
  {
    _id: '670000000000000000000104',
    id: '670000000000000000000104',
    title: 'Powai Pottery & Ceramic Studio Workshop',
    description: 'Hands-on pottery workshop guided by master ceramic artists. Includes clay, potter wheel time, and glazing.',
    category: 'Workshops',
    startDate: addDays(4, 3),
    endDate: addDays(4, 6),
    location: {
      type: 'Point',
      coordinates: [72.9051, 19.1176], // [lng, lat] Powai, Mumbai
      address: 'Hiranandani Gardens, Powai, Mumbai',
      city: 'Mumbai'
    },
    price: 800,
    image: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?auto=format&fit=crop&w=1200&q=80',
    organizer: defaultCurator,
    isFeatured: false,
    status: 'ACTIVE',
    attendeesCount: 18,
    goingCount: 14,
    interestedCount: 4,
    createdAt: new Date().toISOString()
  },
  {
    _id: '670000000000000000000105',
    id: '670000000000000000000105',
    title: 'Colaba Art Walk & Heritage Trail',
    description: 'Immerse yourself in Victorian Gothic architecture, contemporary art galleries, and historic streets of South Mumbai.',
    category: 'Arts & Culture',
    startDate: addDays(5, 2),
    endDate: addDays(5, 5),
    location: {
      type: 'Point',
      coordinates: [72.8347, 18.9220], // [lng, lat] Colaba, Mumbai
      address: 'Gateway of India Plaza, Colaba, Mumbai',
      city: 'Mumbai'
    },
    price: 299,
    image: 'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?auto=format&fit=crop&w=1200&q=80',
    organizer: defaultCurator,
    isFeatured: true,
    status: 'ACTIVE',
    attendeesCount: 52,
    goingCount: 44,
    interestedCount: 8,
    createdAt: new Date().toISOString()
  },
  {
    _id: '670000000000000000000106',
    id: '670000000000000000000106',
    title: 'Dadar Shivaji Park Morning Yoga & Pranayama',
    description: 'Energizing open-air community yoga, breathwork, and meditation under the trees of iconic Shivaji Park.',
    category: 'Sports',
    startDate: addDays(1, 1),
    endDate: addDays(1, 3),
    location: {
      type: 'Point',
      coordinates: [72.8384, 19.0269], // [lng, lat] Dadar, Mumbai
      address: 'Shivaji Park Grounds, Dadar West, Mumbai',
      city: 'Mumbai'
    },
    price: 0,
    image: 'https://images.unsplash.com/photo-1545205597-3d9d02c29597?auto=format&fit=crop&w=1200&q=80',
    organizer: mumbaiOrg,
    isFeatured: false,
    status: 'ACTIVE',
    attendeesCount: 60,
    goingCount: 50,
    interestedCount: 10,
    createdAt: new Date().toISOString()
  },
  {
    _id: '670000000000000000000107',
    id: '670000000000000000000107',
    title: 'BKC Tech & Startup Networking Mixer',
    description: 'Connect with tech founders, AI researchers, product managers, and venture investors at Jio World Drive.',
    category: 'Meetups',
    startDate: addDays(3, 5),
    endDate: addDays(3, 8),
    location: {
      type: 'Point',
      coordinates: [72.8687, 19.0657], // [lng, lat] BKC, Mumbai
      address: 'Jio World Drive, Bandra Kurla Complex (BKC), Mumbai',
      city: 'Mumbai'
    },
    price: 0,
    image: 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?auto=format&fit=crop&w=1200&q=80',
    organizer: demoEventsOrg,
    isFeatured: true,
    status: 'ACTIVE',
    attendeesCount: 95,
    goingCount: 80,
    interestedCount: 15,
    createdAt: new Date().toISOString()
  },
  {
    _id: '670000000000000000000108',
    id: '670000000000000000000108',
    title: 'Andheri Indie Stand-Up & Open Mic Night',
    description: 'An evening of unfiltered humor, comedic storytelling, and rising talents in the heart of Lokhandwala.',
    category: 'Entertainment',
    startDate: addDays(4, 5),
    endDate: addDays(4, 8),
    location: {
      type: 'Point',
      coordinates: [72.8311, 19.1363], // [lng, lat] Andheri West, Mumbai
      address: 'Lokhandwala Complex, Andheri West, Mumbai',
      city: 'Mumbai'
    },
    price: 250,
    image: 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&w=1200&q=80',
    organizer: mumbaiOrg,
    isFeatured: false,
    status: 'ACTIVE',
    attendeesCount: 40,
    goingCount: 32,
    interestedCount: 8,
    createdAt: new Date().toISOString()
  },

  // --- 2. PUNE (5 Events) ---
  {
    _id: '670000000000000000000109',
    id: '670000000000000000000109',
    title: 'Koregaon Park Indie Jazz Jam',
    description: 'An intimate evening of live improvisational jazz featuring top brass and saxophone artists from Pune.',
    category: 'Music',
    startDate: addDays(1, 3),
    endDate: addDays(1, 7),
    location: {
      type: 'Point',
      coordinates: [73.8913, 18.5362], // [lng, lat] Koregaon Park, Pune
      address: 'Lane 6, Koregaon Park, Pune',
      city: 'Pune'
    },
    price: 500,
    image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=80',
    organizer: puneOrg,
    isFeatured: true,
    status: 'ACTIVE',
    attendeesCount: 35,
    goingCount: 29,
    interestedCount: 6,
    createdAt: new Date().toISOString()
  },
  {
    _id: '670000000000000000000110',
    id: '670000000000000000000110',
    title: 'Baner High Street Craft Coffee Tasting',
    description: 'Explore single-origin Indian specialty roasts, brewing methods (Aeropress, V60, Chemex), and cupping sessions.',
    category: 'Food & Drink',
    startDate: addDays(2, 2),
    endDate: addDays(2, 5),
    location: {
      type: 'Point',
      coordinates: [73.7844, 18.5590], // [lng, lat] Baner, Pune
      address: 'Baner High Street, Baner, Pune',
      city: 'Pune'
    },
    price: 350,
    image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1200&q=80',
    organizer: puneOrg,
    isFeatured: false,
    status: 'ACTIVE',
    attendeesCount: 22,
    goingCount: 18,
    interestedCount: 4,
    createdAt: new Date().toISOString()
  },
  {
    _id: '670000000000000000000111',
    id: '670000000000000000000111',
    title: 'Viman Nagar Community 5K Morning Run',
    description: 'Morning community run promoting wellness and fitness. Includes hydration stations and finisher badges.',
    category: 'Sports',
    startDate: addDays(3, 0),
    endDate: addDays(3, 2),
    location: {
      type: 'Point',
      coordinates: [73.9143, 18.5679], // [lng, lat] Viman Nagar, Pune
      address: 'Joggers Park, Viman Nagar, Pune',
      city: 'Pune'
    },
    price: 0,
    image: 'https://images.unsplash.com/photo-1452626038306-9aae5e071dd3?auto=format&fit=crop&w=1200&q=80',
    organizer: puneOrg,
    isFeatured: false,
    status: 'ACTIVE',
    attendeesCount: 50,
    goingCount: 40,
    interestedCount: 10,
    createdAt: new Date().toISOString()
  },
  {
    _id: '670000000000000000000112',
    id: '670000000000000000000112',
    title: 'Kothrud Sourdough Baking Masterclass',
    description: 'Learn wild yeast starter cultivation, sourdough shaping, hydration techniques, and dutch oven baking.',
    category: 'Workshops',
    startDate: addDays(4, 2),
    endDate: addDays(4, 6),
    location: {
      type: 'Point',
      coordinates: [73.8052, 18.5074], // [lng, lat] Kothrud, Pune
      address: 'Paud Road, Kothrud, Pune',
      city: 'Pune'
    },
    price: 650,
    image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=1200&q=80',
    organizer: puneOrg,
    isFeatured: false,
    status: 'ACTIVE',
    attendeesCount: 16,
    goingCount: 12,
    interestedCount: 4,
    createdAt: new Date().toISOString()
  },
  {
    _id: '670000000000000000000113',
    id: '670000000000000000000113',
    title: 'Hinjawadi Tech Developers & AI Meetup',
    description: 'Deep dive into LLM deployment, open source tools, and scalable system architecture for Pune engineers.',
    category: 'Meetups',
    startDate: addDays(5, 4),
    endDate: addDays(5, 7),
    location: {
      type: 'Point',
      coordinates: [73.7378, 18.5913], // [lng, lat] Hinjawadi, Pune
      address: 'Phase 1 Tech Park, Hinjawadi, Pune',
      city: 'Pune'
    },
    price: 0,
    image: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=1200&q=80',
    organizer: puneOrg,
    isFeatured: false,
    status: 'ACTIVE',
    attendeesCount: 75,
    goingCount: 60,
    interestedCount: 15,
    createdAt: new Date().toISOString()
  },

  // --- 3. THANE (2 Events) ---
  {
    _id: '670000000000000000000114',
    id: '670000000000000000000114',
    title: 'Thane Talao Pali Evening Music by the Lake',
    description: 'Open-air lakeside instrumental music, flute recitals, and classical fusion as twilight sets over Talao Pali.',
    category: 'Music',
    startDate: addDays(2, 3),
    endDate: addDays(2, 6),
    location: {
      type: 'Point',
      coordinates: [72.9734, 19.1970], // [lng, lat] Thane West, Thane
      address: 'Talao Pali Promenade, Thane West, Thane',
      city: 'Thane'
    },
    price: 0,
    image: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?auto=format&fit=crop&w=1200&q=80',
    organizer: mumbaiOrg,
    isFeatured: false,
    status: 'ACTIVE',
    attendeesCount: 45,
    goingCount: 38,
    interestedCount: 7,
    createdAt: new Date().toISOString()
  },
  {
    _id: '670000000000000000000115',
    id: '670000000000000000000115',
    title: 'Ghodbunder Upvan Nature Photowalk',
    description: 'Capture migratory birds, scenic Yeoor hills reflections, and lakeside biodiversity on a guided morning photo walk.',
    category: 'Arts & Culture',
    startDate: addDays(3, 1),
    endDate: addDays(3, 4),
    location: {
      type: 'Point',
      coordinates: [72.9555, 19.2274], // [lng, lat] Ghodbunder Road, Thane
      address: 'Upvan Lake, Ghodbunder Road, Thane West',
      city: 'Thane'
    },
    price: 200,
    image: 'https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&w=1200&q=80',
    organizer: demoEventsOrg,
    isFeatured: false,
    status: 'ACTIVE',
    attendeesCount: 24,
    goingCount: 20,
    interestedCount: 4,
    createdAt: new Date().toISOString()
  },

  // --- 4. NAVI MUMBAI (2 Events) ---
  {
    _id: '670000000000000000000116',
    id: '670000000000000000000116',
    title: 'Vashi Sector 17 Street Flea & Food Bazaar',
    description: 'Weekend bazaar featuring handcrafted jewellery, sustainable clothing, and delicious local street food stalls.',
    category: 'Markets',
    startDate: addDays(1, 4),
    endDate: addDays(1, 8),
    location: {
      type: 'Point',
      coordinates: [72.9986, 19.0664], // [lng, lat] Vashi, Navi Mumbai
      address: 'Sector 17, Vashi, Navi Mumbai',
      city: 'Navi Mumbai'
    },
    price: 0,
    image: 'https://images.unsplash.com/photo-1531058020387-3be344556be6?auto=format&fit=crop&w=1200&q=80',
    organizer: demoEventsOrg,
    isFeatured: false,
    status: 'ACTIVE',
    attendeesCount: 65,
    goingCount: 52,
    interestedCount: 13,
    createdAt: new Date().toISOString()
  },
  {
    _id: '670000000000000000000117',
    id: '670000000000000000000117',
    title: 'Nerul Rock Garden Botanical Sketching',
    description: 'Learn plein-air watercolor and botanical sketching techniques amidst sculpted rockeries and manicured greenery.',
    category: 'Workshops',
    startDate: addDays(4, 2),
    endDate: addDays(4, 5),
    location: {
      type: 'Point',
      coordinates: [73.0180, 19.0330], // [lng, lat] Nerul, Navi Mumbai
      address: 'Rock Garden, Sector 21, Nerul, Navi Mumbai',
      city: 'Navi Mumbai'
    },
    price: 300,
    image: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=1200&q=80',
    organizer: demoEventsOrg,
    isFeatured: false,
    status: 'ACTIVE',
    attendeesCount: 20,
    goingCount: 16,
    interestedCount: 4,
    createdAt: new Date().toISOString()
  },

  // --- 5. BENGALURU (4 Events) ---
  {
    _id: '670000000000000000000118',
    id: '670000000000000000000118',
    title: 'Cubbon Park Morning Yoga & Mindfulness',
    description: 'Recharge your mind and body with an open-air morning yoga and breathwork session in Bengaluru.',
    category: 'Sports',
    startDate: addDays(1, 4),
    endDate: addDays(1, 5),
    location: {
      type: 'Point',
      coordinates: [77.5925, 12.9763], // [lng, lat] Cubbon Park, Bengaluru
      address: 'Kasturba Road, Sampangi Rama Nagara, Bengaluru, Karnataka',
      city: 'Bengaluru'
    },
    price: 0,
    image: 'https://images.unsplash.com/photo-1545205597-3d9d02c29597?auto=format&fit=crop&w=1200&q=80',
    organizer: blrOrg,
    isFeatured: true,
    status: 'ACTIVE',
    attendeesCount: 65,
    goingCount: 55,
    interestedCount: 10,
    createdAt: new Date().toISOString()
  },
  {
    _id: '670000000000000000000119',
    id: '670000000000000000000119',
    title: 'Indiranagar 100ft Road Art & Heritage Walk',
    description: 'Explore vibrant indie wall murals, colonial-era heritage, and boutique cafe culture across Indiranagar.',
    category: 'Arts & Culture',
    startDate: addDays(2, 1),
    endDate: addDays(2, 3),
    location: {
      type: 'Point',
      coordinates: [77.6412, 12.9719], // [lng, lat] Indiranagar, Bengaluru
      address: '100 Feet Road, Indiranagar, Bengaluru, Karnataka',
      city: 'Bengaluru'
    },
    price: 250,
    image: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=1200&q=80',
    organizer: blrOrg,
    isFeatured: true,
    status: 'ACTIVE',
    attendeesCount: 45,
    goingCount: 38,
    interestedCount: 7,
    createdAt: new Date().toISOString()
  },
  {
    _id: '670000000000000000000120',
    id: '670000000000000000000120',
    title: 'Koramangala Rooftop Acoustic & Poetry Slam',
    description: 'An intimate candlelit rooftop evening of soulful acoustic melodies and multilingual spoken word poetry.',
    category: 'Music',
    startDate: addDays(3, 4),
    endDate: addDays(3, 7),
    location: {
      type: 'Point',
      coordinates: [77.6229, 12.9352], // [lng, lat] Koramangala, Bengaluru
      address: '80 Feet Road, 4th Block, Koramangala, Bengaluru, Karnataka',
      city: 'Bengaluru'
    },
    price: 300,
    image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1200&q=80',
    organizer: blrOrg,
    isFeatured: false,
    status: 'ACTIVE',
    attendeesCount: 32,
    goingCount: 26,
    interestedCount: 6,
    createdAt: new Date().toISOString()
  },
  {
    _id: '670000000000000000000121',
    id: '670000000000000000000121',
    title: 'HSR Layout Weekend Farmers & Artisans Market',
    description: 'Farm-to-table organic vegetables, cold pressed oils, handmade pottery, and artisanal kombucha in HSR.',
    category: 'Markets',
    startDate: addDays(4, 2),
    endDate: addDays(4, 6),
    location: {
      type: 'Point',
      coordinates: [77.6476, 12.9121], // [lng, lat] HSR Layout, Bengaluru
      address: '27th Main Road, Sector 2, HSR Layout, Bengaluru, Karnataka',
      city: 'Bengaluru'
    },
    price: 0,
    image: 'https://images.unsplash.com/photo-1488459716781-31db52582fe9?auto=format&fit=crop&w=1200&q=80',
    organizer: blrOrg,
    isFeatured: false,
    status: 'ACTIVE',
    attendeesCount: 55,
    goingCount: 46,
    interestedCount: 9,
    createdAt: new Date().toISOString()
  },

  // --- 6. DELHI (3 Events) ---
  {
    _id: '670000000000000000000122',
    id: '670000000000000000000122',
    title: 'Hauz Khas Village Indie Open Mic & Poetry',
    description: 'An expressive evening of live acoustic melodies, poetry, and stand-up comedy in the heart of HKV.',
    category: 'Entertainment',
    startDate: addDays(2, 5),
    endDate: addDays(2, 8),
    location: {
      type: 'Point',
      coordinates: [77.1947, 28.5535], // [lng, lat] Hauz Khas Village, New Delhi
      address: 'Hauz Khas Village, Deer Park, New Delhi',
      city: 'Delhi'
    },
    price: 150,
    image: 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&w=1200&q=80',
    organizer: delhiOrg,
    isFeatured: false,
    status: 'ACTIVE',
    attendeesCount: 30,
    goingCount: 22,
    interestedCount: 8,
    createdAt: new Date().toISOString()
  },
  {
    _id: '670000000000000000000123',
    id: '670000000000000000000123',
    title: 'Connaught Place Heritage Photowalk & Architecture',
    description: 'Guided architectural photowalk exploring the Georgian-style colonnades, circular avenues, and historic cafes.',
    category: 'Arts & Culture',
    startDate: addDays(3, 1),
    endDate: addDays(3, 4),
    location: {
      type: 'Point',
      coordinates: [77.2197, 28.6328], // [lng, lat] Connaught Place, New Delhi
      address: 'Inner Circle, Connaught Place, New Delhi',
      city: 'Delhi'
    },
    price: 200,
    image: 'https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&w=1200&q=80',
    organizer: delhiOrg,
    isFeatured: true,
    status: 'ACTIVE',
    attendeesCount: 42,
    goingCount: 35,
    interestedCount: 7,
    createdAt: new Date().toISOString()
  },
  {
    _id: '670000000000000000000124',
    id: '670000000000000000000124',
    title: 'Cyber Hub Gurgaon Culinary Fest & Live DJ',
    description: 'Gourmet street food trucks, craft microbrew pairings, and electronic ambient sets at Cyber Hub.',
    category: 'Food & Drink',
    startDate: addDays(5, 4),
    endDate: addDays(5, 8),
    location: {
      type: 'Point',
      coordinates: [77.0878, 28.4950], // [lng, lat] DLF Cyber Hub, Gurugram
      address: 'DLF Cyber Hub, DLF Phase 2, Gurugram, Delhi NCR',
      city: 'Delhi'
    },
    price: 400,
    image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80',
    organizer: delhiOrg,
    isFeatured: false,
    status: 'ACTIVE',
    attendeesCount: 88,
    goingCount: 72,
    interestedCount: 16,
    createdAt: new Date().toISOString()
  },

  // --- 7. HYDERABAD (2 Events) ---
  {
    _id: '670000000000000000000125',
    id: '670000000000000000000125',
    title: 'HITEC City Founders & Tech Mixer',
    description: 'Connect with software engineers, designers, AI builders, and startup founders in Cyberabad.',
    category: 'Meetups',
    startDate: addDays(3, 4),
    endDate: addDays(3, 7),
    location: {
      type: 'Point',
      coordinates: [78.3813, 17.4474], // [lng, lat] HITEC City, Hyderabad
      address: 'Madhapur, HITEC City, Hyderabad, Telangana',
      city: 'Hyderabad'
    },
    price: 0,
    image: 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?auto=format&fit=crop&w=1200&q=80',
    organizer: demoEventsOrg,
    isFeatured: false,
    status: 'ACTIVE',
    attendeesCount: 80,
    goingCount: 65,
    interestedCount: 15,
    createdAt: new Date().toISOString()
  },
  {
    _id: '670000000000000000000126',
    id: '670000000000000000000126',
    title: 'Banjara Hills Contemporary Art & Clay Exhibition',
    description: 'Exhibition of progressive South Indian terracotta, mixed media installations, and studio ceramic sculptures.',
    category: 'Arts & Culture',
    startDate: addDays(4, 2),
    endDate: addDays(4, 6),
    location: {
      type: 'Point',
      coordinates: [78.4482, 17.4156], // [lng, lat] Banjara Hills, Hyderabad
      address: 'Road No 10, Banjara Hills, Hyderabad, Telangana',
      city: 'Hyderabad'
    },
    price: 150,
    image: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?auto=format&fit=crop&w=1200&q=80',
    organizer: demoEventsOrg,
    isFeatured: false,
    status: 'ACTIVE',
    attendeesCount: 36,
    goingCount: 28,
    interestedCount: 8,
    createdAt: new Date().toISOString()
  },

  // --- 8. CHENNAI (1 Event) ---
  {
    _id: '670000000000000000000127',
    id: '670000000000000000000127',
    title: 'Besant Nagar Beach Sunrise Meditation & Coastal Walk',
    description: 'Start your weekend with dawn breathing techniques, meditation, and a coastal ecology heritage walk.',
    category: 'Sports',
    startDate: addDays(2, 0),
    endDate: addDays(2, 2),
    location: {
      type: 'Point',
      coordinates: [80.2667, 13.0002], // [lng, lat] Besant Nagar, Chennai
      address: "Elliot's Beach Promenade, Besant Nagar, Chennai, Tamil Nadu",
      city: 'Chennai'
    },
    price: 0,
    image: 'https://images.unsplash.com/photo-1545205597-3d9d02c29597?auto=format&fit=crop&w=1200&q=80',
    organizer: demoEventsOrg,
    isFeatured: false,
    status: 'ACTIVE',
    attendeesCount: 48,
    goingCount: 40,
    interestedCount: 8,
    createdAt: new Date().toISOString()
  },

  // --- 9. KOLKATA (1 Event) ---
  {
    _id: '670000000000000000000128',
    id: '670000000000000000000128',
    title: 'Park Street Jazz & Heritage Literature Club',
    description: 'Celebration of classic jazz melodies, Bengali poetry recitations, and literary storytelling on iconic Park Street.',
    category: 'Music',
    startDate: addDays(4, 4),
    endDate: addDays(4, 8),
    location: {
      type: 'Point',
      coordinates: [88.3516, 22.5516], // [lng, lat] Park Street, Kolkata
      address: 'Park Street, Kolkata, West Bengal',
      city: 'Kolkata'
    },
    price: 250,
    image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=80',
    organizer: demoEventsOrg,
    isFeatured: false,
    status: 'ACTIVE',
    attendeesCount: 54,
    goingCount: 45,
    interestedCount: 9,
    createdAt: new Date().toISOString()
  },

  // --- 10. AHMEDABAD (1 Event) ---
  {
    _id: '670000000000000000000129',
    id: '670000000000000000000129',
    title: 'Sabarmati Riverfront Crafts & Textile Fair',
    description: 'Traditional Gujarati handloom, Ajrakh block prints, Bandhani textiles, and pottery along the Sabarmati promenade.',
    category: 'Markets',
    startDate: addDays(3, 2),
    endDate: addDays(3, 7),
    location: {
      type: 'Point',
      coordinates: [72.5714, 23.0225], // [lng, lat] Sabarmati Riverfront, Ahmedabad
      address: 'Sabarmati Riverfront Promenade, Ahmedabad, Gujarat',
      city: 'Ahmedabad'
    },
    price: 0,
    image: 'https://images.unsplash.com/photo-1531058020387-3be344556be6?auto=format&fit=crop&w=1200&q=80',
    organizer: demoEventsOrg,
    isFeatured: false,
    status: 'ACTIVE',
    attendeesCount: 68,
    goingCount: 56,
    interestedCount: 12,
    createdAt: new Date().toISOString()
  },

  // --- 11. JAIPUR (1 Event) ---
  {
    _id: '670000000000000000000130',
    id: '670000000000000000000130',
    title: 'C-Scheme Folk Music & Blue Pottery Showcase',
    description: 'Rajasthani folk instruments (Kamayacha, Ravanahatha), blue pottery live crafting demonstrations, and culinary treats.',
    category: 'Arts & Culture',
    startDate: addDays(5, 3),
    endDate: addDays(5, 7),
    location: {
      type: 'Point',
      coordinates: [75.8056, 26.9124], // [lng, lat] C-Scheme, Jaipur
      address: 'Ashok Nagar, C-Scheme, Jaipur, Rajasthan',
      city: 'Jaipur'
    },
    price: 200,
    image: 'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?auto=format&fit=crop&w=1200&q=80',
    organizer: demoEventsOrg,
    isFeatured: false,
    status: 'ACTIVE',
    attendeesCount: 44,
    goingCount: 36,
    interestedCount: 8,
    createdAt: new Date().toISOString()
  }
];

class InMemoryStore {
  constructor() {
    this.users = DEMO_USERS.map(u => ({ ...u, status: u.status || 'ACTIVE', isSuspended: !!u.isSuspended }));
    this.events = [...initialEvents];
    this.rsvps = [];
    console.log(`[InMemoryStore] Initialized with ${this.users.length} demo users and ${this.events.length} Indian events.`);
  }

  // --- USER METHODS ---
  async findUserByEmail(email) {
    const normalized = (email || '').toLowerCase().trim();
    return this.users.find(u => u.email.toLowerCase() === normalized || (normalized === 'curator@localvibe.com' && u.email.toLowerCase() === 'curator@localvibe.app')) || null;
  }

  async findUserByGoogleId(googleId) {
    if (!googleId) return null;
    return this.users.find(u => u.googleId === googleId) || null;
  }

  async findUserById(id) {
    return this.users.find(u => u._id === id || u.id === id) || null;
  }

  async createUser(userData) {
    const newId = 'user_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);
    const passwordHash = userData.password ? await bcrypt.hash(userData.password, 10) : undefined;

    const newUser = {
      _id: newId,
      id: newId,
      name: userData.name.trim(),
      email: userData.email.toLowerCase().trim(),
      passwordHash,
      googleId: userData.googleId || undefined,
      role: userData.role ? userData.role.toUpperCase() : 'USER',
      status: 'ACTIVE',
      isSuspended: false,
      profileImage: userData.profileImage || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=160&q=80',
      bio: userData.bio || '',
      location: userData.location || { city: 'Mumbai', coordinates: [72.8777, 19.0760] },
      interests: Array.isArray(userData.interests) ? userData.interests : [],
      createdAt: new Date().toISOString()
    };

    this.users.push(newUser);
    return newUser;
  }

  async createGoogleUser({ name, email, googleId, profileImage }) {
    return this.createUser({
      name,
      email,
      googleId,
      profileImage,
      role: 'USER'
    });
  }

  async getAllUsers() {
    return this.users.map(u => {
      const isSuspended = !!u.isSuspended || u.status === 'SUSPENDED';
      const eventsCount = this.events.filter(ev => {
        const orgId = ev.organizer?._id || ev.organizer?.id || ev.organizer;
        return orgId === u._id || orgId === u.id;
      }).length;

      return {
        id: u._id || u.id,
        _id: u._id || u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        city: u.location?.city || 'India',
        status: isSuspended ? 'SUSPENDED' : (u.status || 'ACTIVE'),
        isSuspended,
        eventsCount,
        createdAt: u.createdAt
      };
    });
  }

  async updateUserStatus(userId, status) {
    const index = this.users.findIndex(u => u._id === userId || u.id === userId);
    if (index === -1) return null;
    const isSuspended = status === 'SUSPENDED';
    this.users[index].status = status;
    this.users[index].isSuspended = isSuspended;
    this.users[index].updatedAt = new Date().toISOString();
    return {
      id: this.users[index]._id || this.users[index].id,
      _id: this.users[index]._id || this.users[index].id,
      name: this.users[index].name,
      email: this.users[index].email,
      status: this.users[index].status,
      isSuspended: this.users[index].isSuspended
    };
  }

  async updateUser(id, updateData) {
    const index = this.users.findIndex(u => u._id === id || u.id === id);
    if (index === -1) return null;

    const existing = this.users[index];
    const allowedUpdates = {};
    if (updateData.name !== undefined) allowedUpdates.name = updateData.name.trim();
    if (updateData.bio !== undefined) allowedUpdates.bio = updateData.bio.trim();
    if (updateData.profileImage !== undefined) allowedUpdates.profileImage = updateData.profileImage.trim();
    if (updateData.googleId !== undefined) allowedUpdates.googleId = updateData.googleId;
    if (updateData.location !== undefined) {
      if (typeof updateData.location === 'object' && updateData.location !== null) {
        allowedUpdates.location = {
          city: updateData.location.city !== undefined ? updateData.location.city.trim() : (existing.location?.city || ''),
          coordinates: updateData.location.coordinates || existing.location?.coordinates || [72.8777, 19.0760]
        };
      } else if (typeof updateData.location === 'string') {
        allowedUpdates.location = {
          city: updateData.location.trim(),
          coordinates: existing.location?.coordinates || [72.8777, 19.0760]
        };
      }
    }
    if (Array.isArray(updateData.interests)) {
      allowedUpdates.interests = updateData.interests;
    }

    const updated = {
      ...existing,
      ...allowedUpdates,
      updatedAt: new Date().toISOString()
    };
    this.users[index] = updated;
    return updated;
  }

  // --- EVENT METHODS ---
  async createEvent(eventData, organizerUser) {
    const newId = 'event_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);

    const organizerObj = organizerUser || eventData.organizer || this.users[0] || {};

    const newEvent = {
      _id: newId,
      id: newId,
      title: eventData.title.trim(),
      description: eventData.description.trim(),
      category: eventData.category,
      startDate: new Date(eventData.startDate).toISOString(),
      endDate: new Date(eventData.endDate).toISOString(),
      location: {
        type: 'Point',
        coordinates: [
          parseFloat(eventData.location.coordinates[0]),
          parseFloat(eventData.location.coordinates[1])
        ],
        address: eventData.location.address ? eventData.location.address.trim() : '',
        city: eventData.location.city ? eventData.location.city.trim() : 'Mumbai'
      },
      price: Number(eventData.price) || 0,
      image: eventData.image ? eventData.image.trim() : '',
      organizer: {
        _id: organizerObj._id || organizerObj.id,
        id: organizerObj._id || organizerObj.id,
        name: organizerObj.name || 'Local Curator',
        email: organizerObj.email || 'curator@localvibe.app',
        profileImage: organizerObj.profileImage || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=160&q=80',
        bio: organizerObj.bio || ''
      },
      isFeatured: Boolean(eventData.isFeatured),
      status: eventData.status || 'ACTIVE',
      attendeesCount: 0,
      goingCount: 0,
      interestedCount: 0,
      createdAt: new Date().toISOString()
    };

    this.events.unshift(newEvent);
    return newEvent;
  }

  async getNearbyEvents({ lat, lng, radiusKm = 10, search, category, date, price, featured, page = 1, limit = 20 }) {
    const userLat = parseFloat(lat);
    const userLng = parseFloat(lng);
    const maxRadius = parseFloat(radiusKm) || 10;

    let filtered = this.events.map(ev => {
      const [eLng, eLat] = ev.location.coordinates;
      const distanceKm = calculateDistanceKm(userLat, userLng, eLat, eLng);
      const counts = this.getEventRSVPCounts(ev._id || ev.id);
      return {
        ...ev,
        distanceKm,
        goingCount: counts.goingCount,
        interestedCount: counts.interestedCount,
        attendeesCount: counts.attendeesCount
      };
    });

    // Distance filter
    filtered = filtered.filter(ev => ev.distanceKm <= maxRadius);

    // Search query
    if (search && search.trim()) {
      const q = search.toLowerCase().trim();
      filtered = filtered.filter(ev =>
        ev.title.toLowerCase().includes(q) ||
        ev.description.toLowerCase().includes(q) ||
        ev.location.address.toLowerCase().includes(q) ||
        ev.location.city.toLowerCase().includes(q)
      );
    }

    // Category filter
    if (category && category !== 'All') {
      filtered = filtered.filter(ev => ev.category.toLowerCase() === category.toLowerCase());
    }

    // Price filter
    if (price === 'free') {
      filtered = filtered.filter(ev => ev.price === 0);
    } else if (price === 'paid') {
      filtered = filtered.filter(ev => ev.price > 0);
    }

    // Featured filter
    if (featured === true || featured === 'true') {
      filtered = filtered.filter(ev => ev.isFeatured);
    }

    // Sort by distance ascending
    filtered.sort((a, b) => a.distanceKm - b.distanceKm);

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;
    const paginated = filtered.slice(skip, skip + limitNum);

    return {
      events: paginated,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: filtered.length,
        totalPages: Math.ceil(filtered.length / limitNum) || 1
      }
    };
  }

  async getAllEvents({ search, category, date, price, featured, status = 'ACTIVE', page = 1, limit = 20 }) {
    let filtered = this.events.map(ev => {
      const counts = this.getEventRSVPCounts(ev._id || ev.id);
      return {
        ...ev,
        goingCount: counts.goingCount,
        interestedCount: counts.interestedCount,
        attendeesCount: counts.attendeesCount
      };
    });

    if (status) {
      filtered = filtered.filter(ev => ev.status === status);
    }

    if (category && category !== 'All') {
      filtered = filtered.filter(ev => ev.category.toLowerCase() === category.toLowerCase());
    }

    if (price === 'free') {
      filtered = filtered.filter(ev => ev.price === 0);
    } else if (price === 'paid') {
      filtered = filtered.filter(ev => ev.price > 0);
    }

    if (featured === true || featured === 'true') {
      filtered = filtered.filter(ev => ev.isFeatured);
    }

    if (search && search.trim()) {
      const q = search.toLowerCase().trim();
      filtered = filtered.filter(ev =>
        ev.title.toLowerCase().includes(q) ||
        ev.description.toLowerCase().includes(q) ||
        ev.location.address.toLowerCase().includes(q) ||
        ev.location.city.toLowerCase().includes(q)
      );
    }

    // Sort by date soonest first
    filtered.sort((a, b) => new Date(a.startDate) - new Date(b.startDate));

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;
    const paginated = filtered.slice(skip, skip + limitNum);

    return {
      events: paginated,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: filtered.length,
        totalPages: Math.ceil(filtered.length / limitNum) || 1
      }
    };
  }

  async getEventById(id, currentUserId = null, currentUserRole = null) {
    const event = this.events.find(ev => ev._id === id || ev.id === id);
    if (!event) return null;

    const counts = this.getEventRSVPCounts(id);
    let userRSVPStatus = null;
    if (currentUserId) {
      const userRSVP = this.rsvps.find(r => (r.userId === currentUserId || r.user === currentUserId) && (r.eventId === id || r.event === id));
      userRSVPStatus = userRSVP ? userRSVP.status : null;
    }

    const orgId = (event.organizer?._id || event.organizer?.id || event.organizer || '').toString();
    const isHost = currentUserId && orgId === currentUserId.toString();
    const isAdmin = currentUserRole === 'ADMIN';
    const isSuspended = event.status === 'SUSPENDED';
    const isCancelled = event.status === 'CANCELLED';

    let suspendedMessage = null;
    if (isSuspended) {
      if (isHost) {
        suspendedMessage = 'Your event has been suspended by administration. Only you and platform admins can view this event.';
      } else {
        suspendedMessage = 'sorry, this event has been suspended';
      }
    }

    return {
      ...event,
      organizer: sanitizeOrganizer(event.organizer),
      goingCount: counts.goingCount,
      interestedCount: counts.interestedCount,
      attendeesCount: counts.attendeesCount,
      userRSVPStatus,
      isHost,
      isSuspended,
      isCancelled,
      suspendedMessage,
      cancelledMessage: isCancelled ? 'This event has been cancelled by the host.' : null
    };
  }

  async cancelEvent(id, requestingUserId, requestingUserRole = 'USER') {
    const index = this.events.findIndex(ev => ev._id === id || ev.id === id);
    if (index === -1) {
      const error = new Error(`Event not found with ID ${id}`);
      error.statusCode = 404;
      throw error;
    }

    const event = this.events[index];
    const orgId = (event.organizer?._id || event.organizer?.id || event.organizer || '').toString();
    const isOwner = requestingUserId && orgId === requestingUserId.toString();
    const isAdmin = requestingUserRole === 'ADMIN';

    if (!isOwner && !isAdmin) {
      const error = new Error('Unauthorized: Only the host or an administrator can cancel this event.');
      error.statusCode = 403;
      throw error;
    }

    this.events[index].status = 'CANCELLED';
    this.events[index].updatedAt = new Date().toISOString();
    return this.events[index];
  }

  async updateEvent(id, updateData) {
    const index = this.events.findIndex(ev => ev._id === id || ev.id === id);
    if (index === -1) return null;

    const existing = this.events[index];
    const updated = {
      ...existing,
      ...updateData,
      location: updateData.location ? {
        ...existing.location,
        ...updateData.location,
        coordinates: updateData.location.coordinates ? [
          parseFloat(updateData.location.coordinates[0]),
          parseFloat(updateData.location.coordinates[1])
        ] : existing.location.coordinates
      } : existing.location
    };

    this.events[index] = updated;
    return updated;
  }

  async deleteEvent(id) {
    const index = this.events.findIndex(ev => ev._id === id || ev.id === id);
    if (index === -1) return null;
    // Also remove any rsvps for this event
    this.rsvps = this.rsvps.filter(r => r.eventId !== id && r.event !== id);
    const deleted = this.events.splice(index, 1);
    return deleted[0];
  }

  // --- RSVP METHODS ---
  getEventRSVPCounts(eventId) {
    const eventRsvps = this.rsvps.filter(r => r.eventId === eventId || r.event === eventId);
    const goingCount = eventRsvps.filter(r => r.status === 'GOING').length;
    const interestedCount = eventRsvps.filter(r => r.status === 'INTERESTED').length;
    return {
      goingCount,
      interestedCount,
      attendeesCount: goingCount + interestedCount
    };
  }

  async upsertRSVP(userId, eventId, status) {
    const normalizedStatus = status.toUpperCase().trim();
    const existingIndex = this.rsvps.findIndex(
      r => (r.userId === userId || r.user === userId) && (r.eventId === eventId || r.event === eventId)
    );

    const nowIso = new Date().toISOString();
    let rsvpRecord;

    if (existingIndex >= 0) {
      // Update existing single record (Atomic change)
      this.rsvps[existingIndex].status = normalizedStatus;
      this.rsvps[existingIndex].updatedAt = nowIso;
      rsvpRecord = this.rsvps[existingIndex];
    } else {
      // Create new record
      rsvpRecord = {
        _id: 'rsvp_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8),
        userId,
        user: userId,
        eventId,
        event: eventId,
        status: normalizedStatus,
        createdAt: nowIso,
        updatedAt: nowIso
      };
      this.rsvps.push(rsvpRecord);
    }

    const counts = this.getEventRSVPCounts(eventId);

    return {
      rsvp: rsvpRecord,
      status: normalizedStatus,
      ...counts
    };
  }

  async deleteRSVP(userId, eventId) {
    const initialLen = this.rsvps.length;
    this.rsvps = this.rsvps.filter(
      r => !((r.userId === userId || r.user === userId) && (r.eventId === eventId || r.event === eventId))
    );

    const counts = this.getEventRSVPCounts(eventId);

    return {
      removed: this.rsvps.length < initialLen,
      status: null,
      ...counts
    };
  }

  async getRSVPStatus(userId, eventId) {
    const counts = this.getEventRSVPCounts(eventId);
    let status = null;
    if (userId) {
      const userRSVP = this.rsvps.find(
        r => (r.userId === userId || r.user === userId) && (r.eventId === eventId || r.event === eventId)
      );
      status = userRSVP ? userRSVP.status : null;
    }

    return {
      status,
      ...counts
    };
  }

  async getUserEvents(userId) {
    const userRsvps = this.rsvps.filter(r => r.userId === userId || r.user === userId);

    const goingEventIds = userRsvps.filter(r => r.status === 'GOING').map(r => r.eventId || r.event);
    const interestedEventIds = userRsvps.filter(r => r.status === 'INTERESTED').map(r => r.eventId || r.event);

    const going = this.events
      .filter(ev => goingEventIds.includes(ev._id) || goingEventIds.includes(ev.id))
      .map(ev => ({ ...ev, userRSVPStatus: 'GOING', ...this.getEventRSVPCounts(ev._id || ev.id) }));

    const interested = this.events
      .filter(ev => interestedEventIds.includes(ev._id) || interestedEventIds.includes(ev.id))
      .map(ev => ({ ...ev, userRSVPStatus: 'INTERESTED', ...this.getEventRSVPCounts(ev._id || ev.id) }));

    const created = this.events
      .filter(ev => {
        const orgId = ev.organizer?._id || ev.organizer?.id || ev.organizer;
        return orgId === userId;
      })
      .map(ev => ({ ...ev, ...this.getEventRSVPCounts(ev._id || ev.id) }));

    return {
      going,
      interested,
      created,
      counts: {
        going: going.length,
        interested: interested.length,
        created: created.length
      }
    };
  }

  async getEventAttendees(eventId, page = 1, limit = 20) {
    const eventRsvps = this.rsvps.filter(r => (r.eventId === eventId || r.event === eventId) && r.status === 'GOING');
    const userIds = eventRsvps.map(r => r.userId || r.user);

    const attendees = this.users
      .filter(u => userIds.includes(u._id) || userIds.includes(u.id))
      .map(u => ({
        _id: u._id || u.id,
        name: u.name,
        profileImage: u.profileImage,
        bio: u.bio
      }));

    const counts = this.getEventRSVPCounts(eventId);

    return {
      attendees,
      ...counts
    };
  }
}

const store = new InMemoryStore();

module.exports = store;

