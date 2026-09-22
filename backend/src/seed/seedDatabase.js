require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const { Event } = require('../models/Event');
const RSVP = require('../models/RSVP');

const seedData = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/localvibe';
    console.log(`[Seed Script] Connecting to MongoDB at ${mongoUri}...`);
    await mongoose.connect(mongoUri);

    console.log('[Seed Script] Safely resetting demo collections for idempotent seeding...');
    await User.deleteMany({});
    await Event.deleteMany({});
    await RSVP.deleteMany({});

    console.log('[Seed Script] Creating 8 demo users with bcrypt password hashing (password: password123)...');
    const passwordHash = await User.hashPassword('password123');

    const demoUsersData = [
      {
        _id: new mongoose.Types.ObjectId('670000000000000000000001'),
        name: 'LocalVibe Curator',
        email: 'curator@localvibe.app',
        passwordHash,
        profileImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
        bio: 'Official LocalVibe community event host and curator.',
        role: 'ADMIN',
        location: { city: 'Mumbai', coordinates: [72.8777, 19.0760] }
      },
      {
        _id: new mongoose.Types.ObjectId('670000000000000000000002'),
        name: 'Mumbai Community Events',
        email: 'demo.mumbai@localvibe.demo',
        passwordHash,
        profileImage: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80',
        bio: 'Hyperlocal community host curating premier gatherings across Mumbai.',
        role: 'ORGANIZER',
        location: { city: 'Mumbai', coordinates: [72.8358, 19.0596] }
      },
      {
        _id: new mongoose.Types.ObjectId('670000000000000000000003'),
        name: 'Pune Local Events',
        email: 'demo.pune@localvibe.demo',
        passwordHash,
        profileImage: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=300&q=80',
        bio: 'Organizing art walks, jazz evenings, and active meetups across Pune.',
        role: 'ORGANIZER',
        location: { city: 'Pune', coordinates: [73.8567, 18.5204] }
      },
      {
        _id: new mongoose.Types.ObjectId('670000000000000000000004'),
        name: 'Bengaluru Events Hub',
        email: 'demo.bengaluru@localvibe.demo',
        passwordHash,
        profileImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
        bio: 'Connecting techies, artists, and nature lovers in the Silicon Plateau.',
        role: 'ORGANIZER',
        location: { city: 'Bengaluru', coordinates: [77.5946, 12.9716] }
      },
      {
        _id: new mongoose.Types.ObjectId('670000000000000000000005'),
        name: 'Delhi Community Collective',
        email: 'demo.delhi@localvibe.demo',
        passwordHash,
        profileImage: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80',
        bio: 'Heritage walks, open mics, and food festivals across the Capital.',
        role: 'ORGANIZER',
        location: { city: 'Delhi', coordinates: [77.2090, 28.6139] }
      },
      {
        _id: new mongoose.Types.ObjectId('670000000000000000000006'),
        name: 'LocalVibe Demo Organizer',
        email: 'demo.events@localvibe.demo',
        passwordHash,
        profileImage: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80',
        bio: 'National event curator for cultural and community experiences.',
        role: 'ORGANIZER',
        location: { city: 'Mumbai', coordinates: [72.8777, 19.0760] }
      },
      {
        _id: new mongoose.Types.ObjectId('670000000000000000000007'),
        name: 'Aarav Patel',
        email: 'demo.user1@localvibe.demo',
        passwordHash,
        profileImage: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=300&q=80',
        bio: 'Music enthusiast and coffee explorer in Bandra.',
        role: 'USER',
        location: { city: 'Mumbai', coordinates: [72.8358, 19.0596] },
        interests: ['Music', 'Food & Drink', 'Markets']
      },
      {
        _id: new mongoose.Types.ObjectId('670000000000000000000008'),
        name: 'Ananya Sharma',
        email: 'demo.user2@localvibe.demo',
        passwordHash,
        profileImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
        bio: 'Yoga practitioner and weekend workshop enthusiast.',
        role: 'USER',
        location: { city: 'Pune', coordinates: [73.8913, 18.5362] },
        interests: ['Sports', 'Workshops', 'Arts & Culture']
      }
    ];

    const users = await User.insertMany(demoUsersData);
    const curator = users[0];
    const mumbaiOrg = users[1];
    const puneOrg = users[2];
    const blrOrg = users[3];
    const delhiOrg = users[4];
    const demoEventsOrg = users[5];

    const now = new Date();
    const addDays = (days, hours = 0) => {
      const date = new Date(now);
      date.setDate(date.getDate() + days);
      date.setHours(date.getHours() + hours);
      return date;
    };

    console.log('[Seed Script] Seeding 30 curated Indian demo events...');

    const sampleEvents = [
      // --- 1. MUMBAI (8 Events) ---
      {
        _id: new mongoose.Types.ObjectId('670000000000000000000101'),
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
        organizer: mumbaiOrg._id,
        isFeatured: true,
        status: 'ACTIVE'
      },
      {
        _id: new mongoose.Types.ObjectId('670000000000000000000102'),
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
        organizer: mumbaiOrg._id,
        isFeatured: false,
        status: 'ACTIVE'
      },
      {
        _id: new mongoose.Types.ObjectId('670000000000000000000103'),
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
        organizer: mumbaiOrg._id,
        isFeatured: true,
        status: 'ACTIVE'
      },
      {
        _id: new mongoose.Types.ObjectId('670000000000000000000104'),
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
        organizer: curator._id,
        isFeatured: false,
        status: 'ACTIVE'
      },
      {
        _id: new mongoose.Types.ObjectId('670000000000000000000105'),
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
        organizer: curator._id,
        isFeatured: true,
        status: 'ACTIVE'
      },
      {
        _id: new mongoose.Types.ObjectId('670000000000000000000106'),
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
        organizer: mumbaiOrg._id,
        isFeatured: false,
        status: 'ACTIVE'
      },
      {
        _id: new mongoose.Types.ObjectId('670000000000000000000107'),
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
        organizer: demoEventsOrg._id,
        isFeatured: true,
        status: 'ACTIVE'
      },
      {
        _id: new mongoose.Types.ObjectId('670000000000000000000108'),
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
        organizer: mumbaiOrg._id,
        isFeatured: false,
        status: 'ACTIVE'
      },

      // --- 2. PUNE (5 Events) ---
      {
        _id: new mongoose.Types.ObjectId('670000000000000000000109'),
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
        organizer: puneOrg._id,
        isFeatured: true,
        status: 'ACTIVE'
      },
      {
        _id: new mongoose.Types.ObjectId('670000000000000000000110'),
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
        organizer: puneOrg._id,
        isFeatured: false,
        status: 'ACTIVE'
      },
      {
        _id: new mongoose.Types.ObjectId('670000000000000000000111'),
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
        organizer: puneOrg._id,
        isFeatured: false,
        status: 'ACTIVE'
      },
      {
        _id: new mongoose.Types.ObjectId('670000000000000000000112'),
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
        organizer: puneOrg._id,
        isFeatured: false,
        status: 'ACTIVE'
      },
      {
        _id: new mongoose.Types.ObjectId('670000000000000000000113'),
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
        organizer: puneOrg._id,
        isFeatured: false,
        status: 'ACTIVE'
      },

      // --- 3. THANE (2 Events) ---
      {
        _id: new mongoose.Types.ObjectId('670000000000000000000114'),
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
        organizer: mumbaiOrg._id,
        isFeatured: false,
        status: 'ACTIVE'
      },
      {
        _id: new mongoose.Types.ObjectId('670000000000000000000115'),
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
        organizer: demoEventsOrg._id,
        isFeatured: false,
        status: 'ACTIVE'
      },

      // --- 4. NAVI MUMBAI (2 Events) ---
      {
        _id: new mongoose.Types.ObjectId('670000000000000000000116'),
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
        organizer: demoEventsOrg._id,
        isFeatured: false,
        status: 'ACTIVE'
      },
      {
        _id: new mongoose.Types.ObjectId('670000000000000000000117'),
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
        organizer: demoEventsOrg._id,
        isFeatured: false,
        status: 'ACTIVE'
      },

      // --- 5. BENGALURU (4 Events) ---
      {
        _id: new mongoose.Types.ObjectId('670000000000000000000118'),
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
        organizer: blrOrg._id,
        isFeatured: true,
        status: 'ACTIVE'
      },
      {
        _id: new mongoose.Types.ObjectId('670000000000000000000119'),
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
        organizer: blrOrg._id,
        isFeatured: true,
        status: 'ACTIVE'
      },
      {
        _id: new mongoose.Types.ObjectId('670000000000000000000120'),
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
        organizer: blrOrg._id,
        isFeatured: false,
        status: 'ACTIVE'
      },
      {
        _id: new mongoose.Types.ObjectId('670000000000000000000121'),
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
        organizer: blrOrg._id,
        isFeatured: false,
        status: 'ACTIVE'
      },

      // --- 6. DELHI (3 Events) ---
      {
        _id: new mongoose.Types.ObjectId('670000000000000000000122'),
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
        organizer: delhiOrg._id,
        isFeatured: false,
        status: 'ACTIVE'
      },
      {
        _id: new mongoose.Types.ObjectId('670000000000000000000123'),
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
        organizer: delhiOrg._id,
        isFeatured: true,
        status: 'ACTIVE'
      },
      {
        _id: new mongoose.Types.ObjectId('670000000000000000000124'),
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
        organizer: delhiOrg._id,
        isFeatured: false,
        status: 'ACTIVE'
      },

      // --- 7. HYDERABAD (2 Events) ---
      {
        _id: new mongoose.Types.ObjectId('670000000000000000000125'),
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
        organizer: demoEventsOrg._id,
        isFeatured: false,
        status: 'ACTIVE'
      },
      {
        _id: new mongoose.Types.ObjectId('670000000000000000000126'),
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
        organizer: demoEventsOrg._id,
        isFeatured: false,
        status: 'ACTIVE'
      },

      // --- 8. CHENNAI (1 Event) ---
      {
        _id: new mongoose.Types.ObjectId('670000000000000000000127'),
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
        organizer: demoEventsOrg._id,
        isFeatured: false,
        status: 'ACTIVE'
      },

      // --- 9. KOLKATA (1 Event) ---
      {
        _id: new mongoose.Types.ObjectId('670000000000000000000128'),
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
        organizer: demoEventsOrg._id,
        isFeatured: false,
        status: 'ACTIVE'
      },

      // --- 10. AHMEDABAD (1 Event) ---
      {
        _id: new mongoose.Types.ObjectId('670000000000000000000129'),
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
        organizer: demoEventsOrg._id,
        isFeatured: false,
        status: 'ACTIVE'
      },

      // --- 11. JAIPUR (1 Event) ---
      {
        _id: new mongoose.Types.ObjectId('670000000000000000000130'),
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
        organizer: demoEventsOrg._id,
        isFeatured: false,
        status: 'ACTIVE'
      }
    ];

    const createdEvents = await Event.insertMany(sampleEvents);
    console.log(`[Seed Script] Successfully created ${createdEvents.length} seed events across 11 Indian cities.`);

    console.log('[Seed Script] Creating sample demo RSVPs...');
    await RSVP.create({
      user: users[6]._id, // Aarav Patel
      event: createdEvents[0]._id, // Bandra Farmers Market
      status: 'GOING'
    });
    await RSVP.create({
      user: users[7]._id, // Ananya Sharma
      event: createdEvents[8]._id, // Koregaon Park Jazz
      status: 'GOING'
    });

    console.log('[Seed Script] Database seed finished successfully!');
    process.exit(0);
  } catch (error) {
    console.error(`[Seed Script Error]: ${error.message}`);
    process.exit(1);
  }
};

seedData();
