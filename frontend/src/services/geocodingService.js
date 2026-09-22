/**
 * Geocoding Service for LocalVibe
 * Supports OpenStreetMap Nominatim search + reverse geocoding with local neighborhood fallbacks
 */

const PRESET_NEIGHBORHOODS = [
  // Mumbai
  { name: 'Bandra West, Mumbai', display: 'The Corner Club, Pali Naka, Bandra West, Mumbai, Maharashtra 400050', city: 'Mumbai', lat: 19.0596, lng: 72.8295 },
  { name: 'Carter Road Promenade, Mumbai', display: 'Carter Road Amphitheatre, Bandra West, Mumbai, Maharashtra 400050', city: 'Mumbai', lat: 19.0657, lng: 72.8252 },
  { name: 'Juhu Beach, Mumbai', display: 'Juhu Tara Road, Juhu, Mumbai, Maharashtra 400049', city: 'Mumbai', lat: 19.0988, lng: 72.8267 },
  { name: 'Kala Ghoda, Mumbai', display: 'Kala Ghoda Arts Precinct, Fort, Mumbai, Maharashtra 400001', city: 'Mumbai', lat: 18.9272, lng: 72.8335 },
  { name: 'BKC, Mumbai', display: 'G Block, Bandra Kurla Complex, Mumbai, Maharashtra 400051', city: 'Mumbai', lat: 19.0664, lng: 72.8687 },
  { name: 'Powai Lake, Mumbai', display: 'Hiranandani Gardens, Powai, Mumbai, Maharashtra 400076', city: 'Mumbai', lat: 19.1197, lng: 72.9051 },
  { name: 'Lower Parel, Mumbai', display: 'High Street Phoenix, Lower Parel, Mumbai, Maharashtra 400013', city: 'Mumbai', lat: 18.9950, lng: 72.8297 },
  { name: 'Colaba Causeway, Mumbai', display: 'Colaba Causeway, Apollo Bandar, Colaba, Mumbai, Maharashtra 400001', city: 'Mumbai', lat: 18.9220, lng: 72.8317 },
  { name: 'Thane West, Mumbai MMR', display: 'Gokhale Road, Naupada, Thane West, Maharashtra 400602', city: 'Thane', lat: 19.1970, lng: 72.9712 },
  { name: 'Vashi, Navi Mumbai', display: 'Sector 17, Vashi, Navi Mumbai, Maharashtra 400703', city: 'Navi Mumbai', lat: 19.0771, lng: 72.9986 },

  // Delhi NCR
  { name: 'Hauz Khas Village, New Delhi', display: 'Hauz Khas Village, Deer Park, New Delhi, Delhi 110016', city: 'Delhi', lat: 28.5535, lng: 77.1944 },
  { name: 'Connaught Place, New Delhi', display: 'Connaught Place, Central Delhi, New Delhi, Delhi 110001', city: 'Delhi', lat: 28.6315, lng: 77.2167 },
  { name: 'CyberHub, Gurugram', display: 'DLF CyberHub, DLF Phase 2, Gurugram, Haryana 122002', city: 'Gurugram', lat: 28.4950, lng: 77.0895 },
  { name: 'Sector 18, Noida', display: 'Atta Market, Sector 18, Noida, Uttar Pradesh 201301', city: 'Noida', lat: 28.5708, lng: 77.3260 },
  { name: 'Khan Market, New Delhi', display: 'Khan Market, Rabindra Nagar, New Delhi, Delhi 110003', city: 'Delhi', lat: 28.6003, lng: 77.2270 },
  { name: 'Saket, New Delhi', display: 'Select CITYWALK, District Centre, Saket, New Delhi, Delhi 110017', city: 'Delhi', lat: 28.5284, lng: 77.2185 },

  // Bengaluru
  { name: 'Indiranagar, Bengaluru', display: '100ft Road, Indiranagar, Bengaluru, Karnataka 560038', city: 'Bengaluru', lat: 12.9784, lng: 77.6408 },
  { name: 'Koramangala, Bengaluru', display: '80ft Road, 4th Block, Koramangala, Bengaluru, Karnataka 560034', city: 'Bengaluru', lat: 12.9352, lng: 77.6245 },
  { name: 'Church Street, Bengaluru', display: 'Church Street, Shanthala Nagar, Ashok Nagar, Bengaluru, Karnataka 560001', city: 'Bengaluru', lat: 12.9752, lng: 77.6044 },
  { name: 'HSR Layout, Bengaluru', display: '27th Main Road, Sector 1, HSR Layout, Bengaluru, Karnataka 560102', city: 'Bengaluru', lat: 12.9121, lng: 77.6446 },
  { name: 'Whitefield, Bengaluru', display: 'ITPL Main Road, Whitefield, Bengaluru, Karnataka 560066', city: 'Bengaluru', lat: 12.9698, lng: 77.7500 },

  // Pune
  { name: 'Koregaon Park, Pune', display: 'Lane 7, Koregaon Park, Pune, Maharashtra 411001', city: 'Pune', lat: 18.5362, lng: 73.8940 },
  { name: 'FC Road, Pune', display: 'Fergusson College Road, Shivajinagar, Pune, Maharashtra 411004', city: 'Pune', lat: 18.5246, lng: 73.8415 },
  { name: 'Baner, Pune', display: 'Balewadi High Street, Baner, Pune, Maharashtra 411045', city: 'Pune', lat: 18.5590, lng: 73.7868 },
  { name: 'Viman Nagar, Pune', display: 'Phoenix Marketcity, Viman Nagar, Pune, Maharashtra 411014', city: 'Pune', lat: 18.5679, lng: 73.9143 },

  // Hyderabad
  { name: 'Jubilee Hills, Hyderabad', display: 'Road No. 36, Jubilee Hills, Hyderabad, Telangana 500033', city: 'Hyderabad', lat: 17.4319, lng: 78.4073 },
  { name: 'Banjara Hills, Hyderabad', display: 'Road No. 12, Banjara Hills, Hyderabad, Telangana 500034', city: 'Hyderabad', lat: 17.4156, lng: 78.4350 },
  { name: 'Hitec City, Hyderabad', display: 'Cyber Towers, Hitec City, Madhapur, Hyderabad, Telangana 500081', city: 'Hyderabad', lat: 17.4504, lng: 78.3808 },

  // Chennai
  { name: 'Besant Nagar, Chennai', display: 'Elliot Beach Road, Besant Nagar, Chennai, Tamil Nadu 600090', city: 'Chennai', lat: 13.0001, lng: 80.2667 },
  { name: 'Nungambakkam, Chennai', display: 'Khader Nawaz Khan Road, Nungambakkam, Chennai, Tamil Nadu 600006', city: 'Chennai', lat: 13.0604, lng: 80.2405 },
  { name: 'T. Nagar, Chennai', display: 'Pondy Bazaar, T. Nagar, Chennai, Tamil Nadu 600017', city: 'Chennai', lat: 13.0418, lng: 80.2341 },

  // Kolkata
  { name: 'Park Street, Kolkata', display: 'Park Street, Kolkata, West Bengal 700016', city: 'Kolkata', lat: 22.5516, lng: 88.3516 },
  { name: 'Salt Lake Sector V, Kolkata', display: 'Sector V, Bidhannagar, Kolkata, West Bengal 700091', city: 'Kolkata', lat: 22.5804, lng: 88.4378 },

  // Ahmedabad
  { name: 'Bodakdev, Ahmedabad', display: 'SG Highway, Bodakdev, Ahmedabad, Gujarat 380054', city: 'Ahmedabad', lat: 23.0373, lng: 72.5119 },
  { name: 'Sindhu Bhavan Road, Ahmedabad', display: 'Sindhu Bhavan Marg, Bodakdev, Ahmedabad, Gujarat 380058', city: 'Ahmedabad', lat: 23.0425, lng: 72.5020 },

  // Jaipur
  { name: 'C-Scheme, Jaipur', display: 'Ashok Nagar, C-Scheme, Jaipur, Rajasthan 302001', city: 'Jaipur', lat: 26.9124, lng: 75.8056 },
  { name: 'Malviya Nagar, Jaipur', display: 'GT Central, Malviya Nagar, Jaipur, Rajasthan 302017', city: 'Jaipur', lat: 26.8529, lng: 75.8054 },

  // Goa
  { name: 'Anjuna Beach, Goa', display: 'Anjuna Flea Market Grounds, Anjuna, Goa 403509', city: 'Goa', lat: 15.5733, lng: 73.7411 },
  { name: 'Fontainhas, Panaji Goa', display: 'Latin Quarter, Fontainhas, Panaji, Goa 403001', city: 'Panaji', lat: 15.4989, lng: 73.8278 },

  // Kochi / Kerala
  { name: 'Fort Kochi, Kochi', display: 'Princess Street, Fort Kochi, Kochi, Kerala 682001', city: 'Kochi', lat: 9.9656, lng: 76.2421 },
  { name: 'Marine Drive, Kochi', display: 'Rainbow Bridge Walkway, Marine Drive, Kochi, Kerala 682031', city: 'Kochi', lat: 9.9790, lng: 76.2764 },

  // Chandigarh & Punjab
  { name: 'Sector 17, Chandigarh', display: 'Sector 17 Plaza, Chandigarh, 160017', city: 'Chandigarh', lat: 30.7398, lng: 76.7827 },
  { name: 'Ranjit Avenue, Amritsar', display: 'Ranjit Avenue B Block, Amritsar, Punjab 143001', city: 'Amritsar', lat: 31.6510, lng: 74.8625 },

  // Lucknow & Central India
  { name: 'Hazratganj, Lucknow', display: 'Hazratganj Market, Lucknow, Uttar Pradesh 226001', city: 'Lucknow', lat: 26.8467, lng: 80.9462 },
  { name: '56 Dukan, Indore', display: 'Chappan Dukan, New Palasia, Indore, Madhya Pradesh 452001', city: 'Indore', lat: 22.7244, lng: 75.8839 },
  { name: 'Arera Colony, Bhopal', display: 'E-3, Arera Colony, Bhopal, Madhya Pradesh 462016', city: 'Bhopal', lat: 23.2156, lng: 77.4305 },

  // Gujarat & West
  { name: 'Vesu, Surat', display: 'VIP Road, Vesu, Surat, Gujarat 395007', city: 'Surat', lat: 21.1418, lng: 72.7709 },
  { name: 'Alkapuri, Vadodara', display: 'RC Dutt Road, Alkapuri, Vadodara, Gujarat 390007', city: 'Vadodara', lat: 22.3107, lng: 73.1812 },

  // South & Coastal
  { name: 'RS Puram, Coimbatore', display: 'DB Road, RS Puram, Coimbatore, Tamil Nadu 641002', city: 'Coimbatore', lat: 11.0089, lng: 76.9507 },
  { name: 'RK Beach, Visakhapatnam', display: 'Beach Road, Pandurangapuram, Visakhapatnam, Andhra Pradesh 530003', city: 'Visakhapatnam', lat: 17.7126, lng: 83.3177 },
  { name: 'White Town, Pondicherry', display: 'Goubert Avenue, White Town, Puducherry 605001', city: 'Pondicherry', lat: 11.9338, lng: 79.8359 },
  { name: 'Gokulam, Mysore', display: '3rd Stage, Gokulam, Mysuru, Karnataka 570002', city: 'Mysore', lat: 12.3300, lng: 76.6267 },

  // North & East
  { name: 'Assi Ghat, Varanasi', display: 'Assi Ghat Promenade, Shivala, Varanasi, Uttar Pradesh 221005', city: 'Varanasi', lat: 25.2882, lng: 83.0064 },
  { name: 'Rajpur Road, Dehradun', display: 'Rajpur Road, Hathibarkala Salwala, Dehradun, Uttarakhand 248001', city: 'Dehradun', lat: 30.3414, lng: 78.0583 },
  { name: 'GS Road, Guwahati', display: 'Christian Basti, GS Road, Guwahati, Assam 781005', city: 'Guwahati', lat: 26.1524, lng: 91.7766 },
  { name: 'Saheed Nagar, Bhubaneswar', display: 'Janpath Road, Saheed Nagar, Bhubaneswar, Odisha 751007', city: 'Bhubaneswar', lat: 20.2880, lng: 85.8450 }
];

export const geocodingService = {
  /**
   * Comprehensive list of major Indian cities with coordinates and states
   */
  getIndianCitiesHub() {
    return [
      { name: 'Mumbai', state: 'Maharashtra', lat: 19.0760, lng: 72.8777 },
      { name: 'Delhi NCR', state: 'Delhi', lat: 28.7041, lng: 77.1025 },
      { name: 'Bengaluru', state: 'Karnataka', lat: 12.9716, lng: 77.5946 },
      { name: 'Pune', state: 'Maharashtra', lat: 18.5204, lng: 73.8567 },
      { name: 'Hyderabad', state: 'Telangana', lat: 17.3850, lng: 78.4867 },
      { name: 'Chennai', state: 'Tamil Nadu', lat: 13.0827, lng: 80.2707 },
      { name: 'Kolkata', state: 'West Bengal', lat: 22.5726, lng: 88.3639 },
      { name: 'Ahmedabad', state: 'Gujarat', lat: 23.0225, lng: 72.5714 },
      { name: 'Jaipur', state: 'Rajasthan', lat: 26.9124, lng: 75.7873 },
      { name: 'Goa', state: 'Goa', lat: 15.4989, lng: 73.8278 },
      { name: 'Kochi', state: 'Kerala', lat: 9.9312, lng: 76.2673 },
      { name: 'Chandigarh', state: 'Punjab / Haryana', lat: 30.7333, lng: 76.7794 },
      { name: 'Lucknow', state: 'Uttar Pradesh', lat: 26.8467, lng: 80.9462 },
      { name: 'Indore', state: 'Madhya Pradesh', lat: 22.7196, lng: 75.8577 },
      { name: 'Surat', state: 'Gujarat', lat: 21.1702, lng: 72.8311 },
      { name: 'Bhopal', state: 'Madhya Pradesh', lat: 23.2599, lng: 77.4126 },
      { name: 'Vadodara', state: 'Gujarat', lat: 22.3072, lng: 73.1812 },
      { name: 'Coimbatore', state: 'Tamil Nadu', lat: 11.0168, lng: 76.9558 },
      { name: 'Visakhapatnam', state: 'Andhra Pradesh', lat: 17.6868, lng: 83.2185 },
      { name: 'Varanasi', state: 'Uttar Pradesh', lat: 25.3176, lng: 82.9739 },
      { name: 'Amritsar', state: 'Punjab', lat: 31.6340, lng: 74.8723 },
      { name: 'Dehradun', state: 'Uttarakhand', lat: 30.3165, lng: 78.0322 },
      { name: 'Guwahati', state: 'Assam', lat: 26.1445, lng: 91.7362 },
      { name: 'Bhubaneswar', state: 'Odisha', lat: 20.2961, lng: 85.8245 },
      { name: 'Mysore', state: 'Karnataka', lat: 12.2958, lng: 76.6394 },
      { name: 'Pondicherry', state: 'Puducherry', lat: 11.9416, lng: 79.8083 },
      { name: 'Nagpur', state: 'Maharashtra', lat: 21.1458, lng: 79.0882 },
      { name: 'Patna', state: 'Bihar', lat: 25.5941, lng: 85.1376 }
    ];
  },

  /**
   * Normalize any input city name or coordinate into standard canonical city name
   * @param {string} rawCity Raw city name / locality string
   * @param {number} [lat] Latitude
   * @param {number} [lng] Longitude
   * @returns {string} Standardized City Name
   */
  normalizeCity(rawCity = '', lat = null, lng = null) {
    const clean = (rawCity || '').trim().toLowerCase();

    // Specific Alias Map
    if (/delhi|ncr|gurgaon|gurugram|noida|ghaziabad|faridabad/i.test(clean)) return 'Delhi NCR';
    if (/mumbai|bombay|thane|navi mumbai|kalyan|dombivli|vasai|virar|borivali|bandra|andheri|juhu/i.test(clean)) return 'Mumbai';
    if (/bengaluru|bangalore|koramangala|indiranagar|whitefield|hsr layout/i.test(clean)) return 'Bengaluru';
    if (/pune|poona|pimpri|chinchwad|koregaon/i.test(clean)) return 'Pune';
    if (/hyderabad|secunderabad|cyberabad|hitec/i.test(clean)) return 'Hyderabad';
    if (/chennai|madras/i.test(clean)) return 'Chennai';
    if (/kolkata|calcutta|howrah|bidhannagar/i.test(clean)) return 'Kolkata';
    if (/ahmedabad|gandhinagar|bodakdev/i.test(clean)) return 'Ahmedabad';
    if (/jaipur/i.test(clean)) return 'Jaipur';
    if (/goa|panaji|panjim|margao|vasco|mapusa|anjuna|calangute|candolim|vagator|arambol/i.test(clean)) return 'Goa';
    if (/kochi|cochin|ernakulam/i.test(clean)) return 'Kochi';
    if (/chandigarh|mohali|panchkula/i.test(clean)) return 'Chandigarh';
    if (/lucknow/i.test(clean)) return 'Lucknow';
    if (/indore/i.test(clean)) return 'Indore';
    if (/surat/i.test(clean)) return 'Surat';
    if (/bhopal/i.test(clean)) return 'Bhopal';
    if (/vadodara|baroda/i.test(clean)) return 'Vadodara';
    if (/coimbatore|kovai/i.test(clean)) return 'Coimbatore';
    if (/visakhapatnam|vizag/i.test(clean)) return 'Visakhapatnam';
    if (/varanasi|banaras|kashi/i.test(clean)) return 'Varanasi';
    if (/amritsar/i.test(clean)) return 'Amritsar';
    if (/dehradun/i.test(clean)) return 'Dehradun';
    if (/guwahati|gauhati/i.test(clean)) return 'Guwahati';
    if (/bhubaneswar/i.test(clean)) return 'Bhubaneswar';
    if (/mysore|mysuru/i.test(clean)) return 'Mysore';
    if (/pondicherry|puducherry/i.test(clean)) return 'Pondicherry';
    if (/nagpur/i.test(clean)) return 'Nagpur';
    if (/patna/i.test(clean)) return 'Patna';

    // Direct match against known hub
    const hub = this.getIndianCitiesHub();
    const directMatch = hub.find(c => c.name.toLowerCase() === clean);
    if (directMatch) return directMatch.name;

    // If coordinates are valid, find nearest Indian city
    if (lat !== null && lng !== null && !isNaN(lat) && !isNaN(lng)) {
      const nearest = this.findNearestCity(lat, lng);
      if (nearest && nearest.distanceKm < 80) {
        return nearest.name;
      }
    }

    // Capitalize properly if unmatched string
    if (rawCity && rawCity.trim().length > 0) {
      return rawCity.trim().charAt(0).toUpperCase() + rawCity.trim().slice(1);
    }

    return 'Mumbai';
  },

  /**
   * Search for locations matching query string
   * @param {string} query Search keyword or address
   * @returns {Promise<Array<{address: string, city: string, rawCity: string, lat: number, lng: number}>>}
   */
  async searchAddresses(query) {
    if (!query || query.trim().length < 2) {
      return [];
    }

    const cleanQuery = query.trim().toLowerCase();

    // First, check local matching presets
    const localMatches = PRESET_NEIGHBORHOODS.filter(
      p => p.name.toLowerCase().includes(cleanQuery) || p.display.toLowerCase().includes(cleanQuery)
    ).map(p => ({
      address: p.display,
      city: this.normalizeCity(p.city, p.lat, p.lng),
      rawCity: p.city,
      lat: p.lat,
      lng: p.lng
    }));

    try {
      // Query OpenStreetMap Nominatim API with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      // Prioritize results within India (countrycodes=in)
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=in&limit=6&addressdetails=1`;
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'Accept-Language': 'en'
        }
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        let data = await response.json();

        // If no results within India and query is long enough, fallback to global search
        if (!data || data.length === 0) {
          const fallbackRes = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`,
            { headers: { 'Accept-Language': 'en' } }
          );
          if (fallbackRes.ok) {
            data = await fallbackRes.json();
          }
        }

        const apiResults = (data || []).map(item => {
          const lat = parseFloat(item.lat);
          const lng = parseFloat(item.lon);
          const rawCity =
            item.address?.city ||
            item.address?.town ||
            item.address?.suburb ||
            item.address?.neighbourhood ||
            item.address?.state_district ||
            item.address?.state ||
            '';

          const normalizedCity = this.normalizeCity(rawCity, lat, lng);

          return {
            address: item.display_name,
            city: normalizedCity,
            rawCity,
            lat,
            lng
          };
        });

        // Merge local matches with API results, de-duplicating by coordinates proximity
        const combined = [...localMatches];
        for (const item of apiResults) {
          const isDuplicate = combined.some(
            c => Math.abs(c.lat - item.lat) < 0.001 && Math.abs(c.lng - item.lng) < 0.001
          );
          if (!isDuplicate) {
            combined.push(item);
          }
        }
        return combined.slice(0, 6);
      }
    } catch (err) {
      // Fallback gracefully on network error or abort
      console.warn('[GeocodingService] Nominatim fetch failed or timed out, using presets:', err.message);
    }

    return localMatches.length > 0 ? localMatches : PRESET_NEIGHBORHOODS.slice(0, 4).map(p => ({
      address: p.display,
      city: this.normalizeCity(p.city, p.lat, p.lng),
      rawCity: p.city,
      lat: p.lat,
      lng: p.lng
    }));
  },

  /**
   * Calculates distance between two coordinates in kilometers using Haversine formula
   */
  calculateDistanceKm(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  },

  /**
   * Find nearest city from known Indian cities hub
   */
  findNearestCity(lat, lng) {
    const cities = this.getIndianCitiesHub();

    let nearest = cities[0];
    let minDistance = Infinity;

    for (const city of cities) {
      const d = this.calculateDistanceKm(lat, lng, city.lat, city.lng);
      if (d < minDistance) {
        minDistance = d;
        nearest = { ...city, distanceKm: Math.round(d * 10) / 10 };
      }
    }

    return nearest;
  },

  /**
   * Reverse geocode GPS coordinates [lat, lng] into human-readable address with city and neighborhood
   * @param {number} lat Latitude
   * @param {number} lng Longitude
   * @returns {Promise<{name: string, address: string, city: string, rawCity: string, state: string, suburb: string, lat: number, lng: number}>}
   */
  async reverseGeocode(lat, lng) {
    const nearest = this.findNearestCity(lat, lng);

    // Check if close to a preset neighborhood (< 2 km)
    const closePreset = PRESET_NEIGHBORHOODS.find(
      p => this.calculateDistanceKm(lat, lng, p.lat, p.lng) < 2.0
    );
    if (closePreset) {
      return {
        name: closePreset.name,
        address: closePreset.display,
        city: this.normalizeCity(closePreset.city, lat, lng),
        rawCity: closePreset.city,
        state: nearest?.state || '',
        suburb: closePreset.name.split(',')[0],
        lat,
        lng
      };
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`;
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'Accept-Language': 'en'
        }
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        const item = await response.json();
        const addr = item.address || {};
        
        // Accurate city extraction from Nominatim address hierarchy
        let rawCity =
          addr.city ||
          addr.town ||
          addr.municipality ||
          addr.city_district ||
          addr.county ||
          addr.state_district ||
          '';

        // Strip " District" or " Zone" suffixes if present
        rawCity = rawCity.replace(/ District| Zone \d+| Suburban/gi, '').trim();

        // If Nominatim gave a suburb or neighborhood
        const suburb = addr.suburb || addr.neighbourhood || addr.residential || '';
        const state = addr.state || nearest?.state || '';

        // Determine best normalized city
        const city = this.normalizeCity(rawCity || (nearest?.distanceKm < 80 ? nearest.name : 'Mumbai'), lat, lng);
        
        let displayName = '';
        if (suburb && city && suburb.toLowerCase() !== city.toLowerCase()) {
          displayName = `${suburb}, ${city}`;
        } else if (city && state) {
          displayName = `${city}, ${state}`;
        } else {
          displayName = city || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
        }

        return {
          name: displayName,
          address: item.display_name || `${displayName}, India`,
          city,
          rawCity,
          state,
          suburb,
          lat,
          lng
        };
      }
    } catch (err) {
      console.warn('[GeocodingService] Reverse geocoding failed, using nearest city:', err.message);
    }

    // High reliability fallback using nearest city calculation
    const fallbackName = nearest.distanceKm < 80 ? nearest.name : `Location (${lat.toFixed(3)}, ${lng.toFixed(3)})`;
    const fallbackCity = this.normalizeCity(nearest.distanceKm < 150 ? nearest.name : 'Mumbai', lat, lng);

    return {
      name: fallbackName,
      address: `${fallbackName}, ${nearest.state || 'India'}`,
      city: fallbackCity,
      rawCity: fallbackCity,
      state: nearest.state || '',
      suburb: '',
      lat,
      lng
    };
  },

  /**
   * Return popular neighborhood presets for quick venue selection
   */
  getPresetNeighborhoods() {
    return PRESET_NEIGHBORHOODS;
  }
};
