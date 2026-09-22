import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { eventService } from '../services/eventService';
import { geocodingService } from '../services/geocodingService';
import { LocationPickerMap } from '../components/map/LocationPickerMap';
import { AuthModal } from '../components/common/AuthModal';

const CATEGORIES = [
  { value: 'Music', label: 'Music', icon: '🎵', desc: 'Live gigs, acoustic, indie DJs' },
  { value: 'Food & Drink', label: 'Food & Drink', icon: '🍔', desc: 'Pop-ups, culinary, tastings' },
  { value: 'Arts & Culture', label: 'Arts & Culture', icon: '🎨', desc: 'Exhibitions, pottery, crafts' },
  { value: 'Sports', label: 'Sports & Fitness', icon: '🏃', desc: 'Morning runs, yoga, turfs' },
  { value: 'Entertainment', label: 'Open Mic & Comedy', icon: '🎤', desc: 'Stand-up, poetry, theater' },
  { value: 'Workshops', label: 'Workshops', icon: '💡', desc: 'Masterclasses, hands-on skills' },
  { value: 'Community', label: 'Community', icon: '🤝', desc: 'Social circles, neighborhood meetups' },
  { value: 'Social', label: 'Meetups & Tech', icon: '💻', desc: 'Founders, networking, book clubs' },
  { value: 'Markets', label: 'Flea & Shopping', icon: '🛍️', desc: 'Artisanal pop-ups, thrifting' },
  { value: 'Education', label: 'Education', icon: '📚', desc: 'Lectures, panel discussions' },
  { value: 'Nightlife', label: 'Nightlife', icon: '🍸', desc: 'Rooftops, lounges, evening vibes' },
  { value: 'Other', label: 'Other Gathering', icon: '✨', desc: 'Unique experiences & mixers' }
];

const VIBE_PILLS = [
  '#AcousticOnly',
  '#PetFriendly',
  '#BYOBFriendly',
  '#WheelchairAccessible',
  '#OutdoorSeating',
  '#SoloFriendly',
  '#FairyLights',
  '#FreeChai'
];

const CURATED_COVER_IMAGES = [
  // Music & Gigs
  {
    id: 'music-1',
    category: 'Music',
    title: 'Acoustic Guitar & Live Gig',
    url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=80',
    thumb: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=320&q=80'
  },
  {
    id: 'music-2',
    category: 'Music',
    title: 'Electronic DJ & Stage Lights',
    url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1200&q=80',
    thumb: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=320&q=80'
  },
  {
    id: 'music-3',
    category: 'Music',
    title: 'Jazz Lounge & Live Sax',
    url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1200&q=80',
    thumb: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=320&q=80'
  },
  {
    id: 'music-4',
    category: 'Music',
    title: 'Sunset Open-Air Concert',
    url: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?auto=format&fit=crop&w=1200&q=80',
    thumb: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?auto=format&fit=crop&w=320&q=80'
  },

  // Food & Drink
  {
    id: 'food-1',
    category: 'Food & Drink',
    title: 'Cozy Dining & Wine Table',
    url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80',
    thumb: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=320&q=80'
  },
  {
    id: 'food-2',
    category: 'Food & Drink',
    title: 'Artisanal Cafe & Bakery',
    url: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=1200&q=80',
    thumb: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=320&q=80'
  },
  {
    id: 'food-3',
    category: 'Food & Drink',
    title: 'Street Food & Tacos Fiesta',
    url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=1200&q=80',
    thumb: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=320&q=80'
  },
  {
    id: 'food-4',
    category: 'Food & Drink',
    title: 'Barbecue Grill & Open Flame',
    url: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1200&q=80',
    thumb: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=320&q=80'
  },

  // Arts & Culture
  {
    id: 'art-1',
    category: 'Arts & Culture',
    title: 'Canvas Painting & Colors',
    url: 'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?auto=format&fit=crop&w=1200&q=80',
    thumb: 'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?auto=format&fit=crop&w=320&q=80'
  },
  {
    id: 'art-2',
    category: 'Arts & Culture',
    title: 'Handmade Pottery & Clay',
    url: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?auto=format&fit=crop&w=1200&q=80',
    thumb: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?auto=format&fit=crop&w=320&q=80'
  },
  {
    id: 'art-3',
    category: 'Arts & Culture',
    title: 'Modern Art Gallery Exhibition',
    url: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=1200&q=80',
    thumb: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=320&q=80'
  },

  // Sports & Fitness
  {
    id: 'sports-1',
    category: 'Sports',
    title: 'Sunrise Yoga & Mindfulness',
    url: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=1200&q=80',
    thumb: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=320&q=80'
  },
  {
    id: 'sports-2',
    category: 'Sports',
    title: 'Morning 5K City Run',
    url: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=1200&q=80',
    thumb: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=320&q=80'
  },
  {
    id: 'sports-3',
    category: 'Sports',
    title: 'Outdoor Turf & Box Action',
    url: 'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?auto=format&fit=crop&w=1200&q=80',
    thumb: 'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?auto=format&fit=crop&w=320&q=80'
  },

  // Nightlife & Social
  {
    id: 'nightlife-1',
    category: 'Nightlife',
    title: 'Rooftop Sunset Lounge & Cocktails',
    url: 'https://images.unsplash.com/photo-1570872626485-d8ffea69f463?auto=format&fit=crop&w=1200&q=80',
    thumb: 'https://images.unsplash.com/photo-1570872626485-d8ffea69f463?auto=format&fit=crop&w=320&q=80'
  },
  {
    id: 'nightlife-2',
    category: 'Nightlife',
    title: 'Neon DJ Night & Dancefloor',
    url: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=1200&q=80',
    thumb: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=320&q=80'
  },

  // Markets & Pop-ups
  {
    id: 'market-1',
    category: 'Markets',
    title: 'Weekend Artisanal Flea Market',
    url: 'https://images.unsplash.com/photo-1533900298318-6b8da08a523e?auto=format&fit=crop&w=1200&q=80',
    thumb: 'https://images.unsplash.com/photo-1533900298318-6b8da08a523e?auto=format&fit=crop&w=320&q=80'
  },
  {
    id: 'market-2',
    category: 'Markets',
    title: 'Local Organic Farmers Market',
    url: 'https://images.unsplash.com/photo-1488459716781-31db52582fe9?auto=format&fit=crop&w=1200&q=80',
    thumb: 'https://images.unsplash.com/photo-1488459716781-31db52582fe9?auto=format&fit=crop&w=320&q=80'
  },

  // Workshops & Community
  {
    id: 'workshop-1',
    category: 'Workshops',
    title: 'Interactive Studio Workshop',
    url: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=1200&q=80',
    thumb: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=320&q=80'
  },
  {
    id: 'entertainment-1',
    category: 'Entertainment',
    title: 'Stand-up Comedy & Open Mic Stage',
    url: 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&w=1200&q=80',
    thumb: 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&w=320&q=80'
  },
  {
    id: 'community-1',
    category: 'Community',
    title: 'Neighborhood Circle & Meetup',
    url: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1200&q=80',
    thumb: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=320&q=80'
  }
];

const INDIAN_CITIES_LIST = [
  { name: 'Mumbai', state: 'Maharashtra', coords: [72.8777, 19.0760], defaultVenue: 'Carter Road Amphitheatre, Bandra West' },
  { name: 'Delhi NCR', state: 'Delhi', coords: [77.1025, 28.7041], defaultVenue: 'Hauz Khas Village, New Delhi' },
  { name: 'Bengaluru', state: 'Karnataka', coords: [77.5946, 12.9716], defaultVenue: '100ft Road, Indiranagar' },
  { name: 'Pune', state: 'Maharashtra', coords: [73.8567, 18.5204], defaultVenue: 'Lane 7, Koregaon Park' },
  { name: 'Hyderabad', state: 'Telangana', coords: [78.4867, 17.3850], defaultVenue: 'Road No. 36, Jubilee Hills' },
  { name: 'Chennai', state: 'Tamil Nadu', coords: [80.2707, 13.0827], defaultVenue: 'Elliot Beach Road, Besant Nagar' },
  { name: 'Kolkata', state: 'West Bengal', coords: [88.3639, 22.5726], defaultVenue: 'Park Street, Kolkata' },
  { name: 'Ahmedabad', state: 'Gujarat', coords: [72.5714, 23.0225], defaultVenue: 'SG Highway, Bodakdev' },
  { name: 'Jaipur', state: 'Rajasthan', coords: [75.7873, 26.9124], defaultVenue: 'Ashok Nagar, C-Scheme' },
  { name: 'Goa', state: 'Goa', coords: [73.8278, 15.4989], defaultVenue: 'Anjuna Beach Flea Grounds' },
  { name: 'Kochi', state: 'Kerala', coords: [76.2673, 9.9312], defaultVenue: 'Princess Street, Fort Kochi' },
  { name: 'Chandigarh', state: 'Punjab / Haryana', coords: [76.7794, 30.7333], defaultVenue: 'Sector 17 Plaza, Chandigarh' },
  { name: 'Lucknow', state: 'Uttar Pradesh', coords: [80.9462, 26.8467], defaultVenue: 'Hazratganj Market' },
  { name: 'Indore', state: 'Madhya Pradesh', coords: [75.8577, 22.7196], defaultVenue: 'Chappan Dukan, New Palasia' },
  { name: 'Surat', state: 'Gujarat', coords: [72.8311, 21.1702], defaultVenue: 'VIP Road, Vesu' },
  { name: 'Bhopal', state: 'Madhya Pradesh', coords: [77.4126, 23.2599], defaultVenue: 'Arera Colony, Bhopal' },
  { name: 'Vadodara', state: 'Gujarat', coords: [73.1812, 22.3072], defaultVenue: 'RC Dutt Road, Alkapuri' },
  { name: 'Coimbatore', state: 'Tamil Nadu', coords: [76.9558, 11.0168], defaultVenue: 'DB Road, RS Puram' },
  { name: 'Visakhapatnam', state: 'Andhra Pradesh', coords: [83.2185, 17.6868], defaultVenue: 'Beach Road, Siripuram' },
  { name: 'Varanasi', state: 'Uttar Pradesh', coords: [82.9739, 25.3176], defaultVenue: 'Assi Ghat Promenade' },
  { name: 'Amritsar', state: 'Punjab', coords: [74.8723, 31.6340], defaultVenue: 'Ranjit Avenue, Amritsar' },
  { name: 'Dehradun', state: 'Uttarakhand', coords: [78.0322, 30.3165], defaultVenue: 'Rajpur Road, Dehradun' },
  { name: 'Guwahati', state: 'Assam', coords: [91.7362, 26.1445], defaultVenue: 'GS Road, Christian Basti' },
  { name: 'Bhubaneswar', state: 'Odisha', coords: [85.8245, 20.2961], defaultVenue: 'Janpath Road, Saheed Nagar' },
  { name: 'Mysore', state: 'Karnataka', coords: [76.6394, 12.2958], defaultVenue: 'Gokulam 3rd Stage, Mysuru' },
  { name: 'Pondicherry', state: 'Puducherry', coords: [79.8083, 11.9416], defaultVenue: 'Goubert Avenue, White Town' }
];

export const CreateEventPage = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { success, error: toastError } = useToast();

  const fileInputRef = useRef(null);
  const searchDebounceRef = useRef(null);
  const dropdownRef = useRef(null);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    tagline: '',
    description: '',
    category: 'Music',
    startDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
    startTime: '19:00',
    endDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
    endTime: '22:00',
    noEndTime: false,
    venueName: 'Carter Road Amphitheatre',
    address: 'Carter Road Amphitheatre, Bandra West, Mumbai, Maharashtra 400050',
    city: 'Mumbai',
    coordinates: [72.8252, 19.0657], // GeoJSON [longitude, latitude]
    isFree: true,
    price: 0,
    isUnlimitedCapacity: true,
    capacity: 50,
    image: CURATED_COVER_IMAGES[0].url,
    additionalInfo: '',
    selectedVibes: ['#AcousticOnly', '#PetFriendly']
  });

  // Cover Image Selection State ('gallery' | 'upload' | 'url')
  const [coverImageTab, setCoverImageTab] = useState('gallery');
  const [coverCategoryFilter, setCoverCategoryFilter] = useState('All');
  const [customImageUrlInput, setCustomImageUrlInput] = useState('');

  // Autocomplete address search state
  const [searchQuery, setSearchQuery] = useState('');
  const [addressSuggestions, setAddressSuggestions] = useState([]);
  const [isSearchingAddress, setIsSearchingAddress] = useState(false);
  const [showAddressDropdown, setShowAddressDropdown] = useState(false);

  // Dynamic available cities list including current custom/detected city
  const availableCities = useMemo(() => {
    const currentCity = formData.city;
    const exists = INDIAN_CITIES_LIST.some(c => c.name.toLowerCase() === (currentCity || '').toLowerCase());
    if (!exists && currentCity) {
      return [
        { name: currentCity, state: 'India', coords: formData.coordinates, defaultVenue: formData.venueName || currentCity },
        ...INDIAN_CITIES_LIST
      ];
    }
    return INDIAN_CITIES_LIST;
  }, [formData.city, formData.coordinates, formData.venueName]);

  // Quick neighborhood presets for the currently selected city
  const cityPresets = useMemo(() => {
    const allPresets = geocodingService.getPresetNeighborhoods();
    const currentCityNorm = (formData.city || 'Mumbai').toLowerCase();
    const matched = allPresets.filter(p =>
      p.city.toLowerCase() === currentCityNorm ||
      geocodingService.normalizeCity(p.city, p.lat, p.lng).toLowerCase() === currentCityNorm
    );
    return matched.length > 0 ? matched : allPresets.slice(0, 4);
  }, [formData.city]);

  // UI / Submission state
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdEvent, setCreatedEvent] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Close address dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowAddressDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Handle local file upload
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toastError('Please select a valid image file (JPEG, PNG, WebP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toastError('Image size exceeds 5MB limit. Please upload a smaller image.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const base64Url = uploadEvent.target?.result;
      if (base64Url) {
        setFormData(prev => ({ ...prev, image: base64Url }));
        setErrors(prev => ({ ...prev, image: undefined }));
        success('Cover image uploaded!');
      }
    };
    reader.readAsDataURL(file);
    // Reset file input value to allow selecting the same file again if replaced
    e.target.value = '';
  };

  // Address search with debounce
  const handleAddressSearchChange = (e) => {
    const val = e.target.value;
    setSearchQuery(val);

    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);

    if (val.trim().length >= 2) {
      setIsSearchingAddress(true);
      searchDebounceRef.current = setTimeout(async () => {
        const results = await geocodingService.searchAddresses(val);
        setAddressSuggestions(results);
        setIsSearchingAddress(false);
        setShowAddressDropdown(true);
      }, 300);
    } else {
      setAddressSuggestions([]);
      setShowAddressDropdown(false);
      setIsSearchingAddress(false);
    }
  };

  // Select location from dropdown (Auto-selects City)
  const handleSelectAddress = (item) => {
    const normalizedCity = geocodingService.normalizeCity(item.city || item.rawCity, item.lat, item.lng);
    setFormData(prev => ({
      ...prev,
      address: item.address,
      venueName: item.address.split(',')[0] || 'Selected Venue',
      city: normalizedCity,
      coordinates: [item.lng, item.lat] // GeoJSON [longitude, latitude]
    }));
    setSearchQuery(item.address);
    setShowAddressDropdown(false);
    setErrors(prev => ({ ...prev, location: undefined }));
    success(`Venue set & City auto-selected: ${normalizedCity} 📍`);
  };

  // Select quick neighborhood chip (Auto-selects City)
  const handleSelectPresetNeighborhood = (preset) => {
    const normalizedCity = geocodingService.normalizeCity(preset.city, preset.lat, preset.lng);
    setFormData(prev => ({
      ...prev,
      venueName: preset.name.split(',')[0],
      address: preset.display,
      city: normalizedCity,
      coordinates: [preset.lng, preset.lat]
    }));
    setSearchQuery(preset.display);
    setErrors(prev => ({ ...prev, location: undefined }));
    success(`Selected ${preset.name.split(',')[0]} (${normalizedCity}) 📍`);
  };

  // Select City from Dropdown
  const handleSelectIndianCity = (cityName) => {
    const cityObj = availableCities.find(c => c.name === cityName) || INDIAN_CITIES_LIST.find(c => c.name === cityName);
    if (!cityObj) return;

    const newVenue = cityObj.defaultVenue || `${cityObj.name} Central`;
    setFormData(prev => ({
      ...prev,
      venueName: newVenue,
      address: `${newVenue}, ${cityObj.name}, ${cityObj.state}`,
      city: cityObj.name,
      coordinates: cityObj.coords || prev.coordinates
    }));
    setSearchQuery(`${newVenue}, ${cityObj.name}`);
    setErrors(prev => ({ ...prev, location: undefined }));
    success(`Selected city: ${cityObj.name}`);
  };

  // Select Curated Image Preset
  const handleSelectCuratedImage = (imgObj) => {
    setFormData(prev => ({ ...prev, image: imgObj.url }));
    setErrors(prev => ({ ...prev, image: undefined }));
    success(`Selected cover image: "${imgObj.title}" ✨`);
  };

  // Apply Custom URL
  const handleApplyCustomImageUrl = (e) => {
    if (e) e.preventDefault();
    if (!customImageUrlInput.trim()) {
      toastError('Please enter a valid image URL');
      return;
    }
    setFormData(prev => ({ ...prev, image: customImageUrlInput.trim() }));
    setErrors(prev => ({ ...prev, image: undefined }));
    success('Cover image URL applied!');
  };

  // Map click or drag pin update (Auto-selects City via reverse geocoding)
  const handleMapLocationChange = ({ lat, lng, address, city }) => {
    const normalizedCity = geocodingService.normalizeCity(city, lat, lng);
    setFormData(prev => ({
      ...prev,
      coordinates: [lng, lat],
      address: address || prev.address,
      venueName: address ? address.split(',')[0] : prev.venueName,
      city: normalizedCity
    }));
    setErrors(prev => ({ ...prev, location: undefined }));
  };

  // Toggle vibe pill
  const toggleVibe = (tag) => {
    setFormData(prev => {
      const exists = prev.selectedVibes.includes(tag);
      return {
        ...prev,
        selectedVibes: exists
          ? prev.selectedVibes.filter(t => t !== tag)
          : [...prev.selectedVibes, tag]
      };
    });
  };

  // Check India boundary
  const isWithinIndia = useMemo(() => {
    if (!formData.coordinates || formData.coordinates.length !== 2) return false;
    const [lng, lat] = formData.coordinates;
    return lat >= 6.0 && lat <= 38.0 && lng >= 68.0 && lng <= 98.0;
  }, [formData.coordinates]);

  // Form Validation
  const validateForm = () => {
    const errs = {};

    if (!formData.title || formData.title.trim() === '') {
      errs.title = 'Please enter an event title.';
    } else if (formData.title.length > 120) {
      errs.title = 'Title cannot exceed 120 characters.';
    }

    if (!formData.description || formData.description.trim() === '') {
      errs.description = 'Please tell people what to expect in the description.';
    } else if (formData.description.length > 3000) {
      errs.description = 'Description cannot exceed 3000 characters.';
    }

    if (!formData.category) {
      errs.category = 'Please select a primary category.';
    }

    if (!formData.startDate) {
      errs.startDate = 'Event date is required.';
    }

    if (!formData.startTime) {
      errs.startTime = 'Start time is required.';
    }

    if (!formData.noEndTime && !formData.endTime) {
      errs.endTime = 'End time is required (or check "No fixed end time").';
    }

    if (!formData.noEndTime && formData.startDate && formData.endDate && formData.startTime && formData.endTime) {
      const startDateTime = new Date(`${formData.startDate}T${formData.startTime}`);
      const endDateTime = new Date(`${formData.endDate}T${formData.endTime}`);
      if (endDateTime <= startDateTime) {
        errs.endTime = 'End time must be later than the start time.';
      }
    }

    if (!formData.address || formData.address.trim() === '') {
      errs.location = 'Please search for and select a venue address.';
    }

    if (!isWithinIndia) {
      errs.location = 'LocalVibe currently supports event locations in India only (Lat: 6.0°N–38.0°N, Lng: 68.0°E–98.0°E).';
    }

    if (!formData.isFree && (isNaN(formData.price) || Number(formData.price) <= 0)) {
      errs.price = 'Please enter a valid ticket price in ₹ (greater than 0).';
    }

    if (!formData.isUnlimitedCapacity && (isNaN(formData.capacity) || Number(formData.capacity) <= 0)) {
      errs.capacity = 'Please enter a valid maximum capacity (at least 1 attendee).';
    }

    if (!formData.image) {
      errs.image = 'Cover image is required to publish your event.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Form Submit Handler
  const handleSubmit = async (e) => {
    if (e) e.preventDefault();

    if (!isAuthenticated) {
      setIsAuthModalOpen(true);
      return;
    }

    if (!validateForm()) {
      toastError('Please resolve the highlighted items in the form before publishing.');
      const firstErrorElement = document.querySelector('[data-error="true"]');
      if (firstErrorElement) {
        firstErrorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    setIsSubmitting(true);

    try {
      const startDateTime = new Date(`${formData.startDate}T${formData.startTime}`);
      let endDateTime;
      if (formData.noEndTime) {
        // Automatically default end time to start + 3 hours
        endDateTime = new Date(startDateTime.getTime() + 3 * 3600000);
      } else {
        endDateTime = new Date(`${formData.endDate || formData.startDate}T${formData.endTime}`);
      }

      // Combine short summary and vibes into description if provided
      let fullDescription = formData.description.trim();
      if (formData.tagline && formData.tagline.trim()) {
        fullDescription = `${formData.tagline.trim()}\n\n${fullDescription}`;
      }
      if (formData.additionalInfo && formData.additionalInfo.trim()) {
        fullDescription += `\n\n📌 Organizer Notes:\n${formData.additionalInfo.trim()}`;
      }
      if (formData.selectedVibes && formData.selectedVibes.length > 0) {
        fullDescription += `\n\nVibes: ${formData.selectedVibes.join(' ')}`;
      }

      const payload = {
        title: formData.title.trim(),
        description: fullDescription,
        category: formData.category,
        startDate: startDateTime.toISOString(),
        endDate: endDateTime.toISOString(),
        location: {
          type: 'Point',
          // CRITICAL: GeoJSON [longitude, latitude]
          coordinates: [
            parseFloat(formData.coordinates[0]),
            parseFloat(formData.coordinates[1])
          ],
          address: formData.address.trim(),
          city: formData.city || 'Mumbai'
        },
        price: formData.isFree ? 0 : Number(formData.price),
        image: formData.image,
        capacity: formData.isUnlimitedCapacity ? null : Number(formData.capacity),
        isFeatured: false,
        status: 'ACTIVE'
      };

      const res = await eventService.create(payload);

      if (res && (res.success || res.data)) {
        const created = res.data;
        setCreatedEvent(created);
        setShowSuccessModal(true);
        success('Gathering published successfully! 🎉');
      } else {
        toastError(res?.message || 'Failed to publish event. Please try again.');
      }
    } catch (err) {
      console.error('Event creation error:', err);
      toastError(err.response?.data?.message || err.message || 'Failed to publish event.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formattedPreviewDate = useMemo(() => {
    try {
      const d = new Date(formData.startDate);
      return d.toLocaleDateString('en-US', {
        weekday: 'short',
        day: 'numeric',
        month: 'short'
      });
    } catch {
      return 'Upcoming Date';
    }
  }, [formData.startDate]);

  return (
    <div style={{ backgroundColor: 'var(--color-bg-app)', minHeight: '100vh', padding: '2.5rem 0 5rem 0' }}>
      <div className="container">

        {/* Top Header */}
        <div style={{ marginBottom: '2rem' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: 'rgba(0, 92, 85, 0.08)',
              border: '1px solid rgba(0, 92, 85, 0.2)',
              padding: '4px 12px',
              borderRadius: 'var(--radius-full)',
              color: 'var(--color-primary)',
              fontSize: '12px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              marginBottom: '8px'
            }}
          >
            <span className="material-symbols-outlined material-symbols-filled" style={{ fontSize: '15px' }}>
              add_circle
            </span>
            Creator Workspace
          </div>

          <h1
            style={{
              fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)',
              fontWeight: 800,
              color: 'var(--color-text-main)',
              margin: '0 0 8px 0',
              letterSpacing: '-0.02em'
            }}
          >
            Host a Gathering in Your Neighborhood
          </h1>
          <p style={{ fontSize: '15px', color: 'var(--color-text-secondary)', margin: 0, maxWidth: '720px' }}>
            Tell us what's happening, when it's happening, and where it's happening. Your gathering will instantly appear on the local neighborhood radar across India.
          </p>
        </div>

        {/* Guest Warning Banner if not logged in */}
        {!isAuthenticated && (
          <div
            style={{
              backgroundColor: '#FFFBEB',
              border: '1px solid #FDE68A',
              borderRadius: 'var(--radius-xl)',
              padding: '1rem 1.5rem',
              marginBottom: '2rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem',
              flexWrap: 'wrap'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '20px' }}>👋</span>
              <span style={{ fontSize: '14px', color: '#92400E', fontWeight: 500 }}>
                You are currently exploring as a guest. You will be prompted to sign in when you publish your event.
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsAuthModalOpen(true)}
              style={{
                backgroundColor: 'var(--color-primary)',
                color: '#FFFFFF',
                padding: '6px 14px',
                borderRadius: 'var(--radius-md)',
                fontSize: '13px',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer'
              }}
            >
              Sign In Now
            </button>
          </div>
        )}

        {/* 2-Column Workspace Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1.4fr) minmax(320px, 0.9fr)',
            gap: '2.5rem',
            alignItems: 'start'
          }}
          className="create-event-grid"
        >
          {/* ========================================================================= */}
          {/* LEFT COLUMN: FORM SECTIONS                                               */}
          {/* ========================================================================= */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

            {/* SECTION 1: EVENT BASICS */}
            <div
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 'var(--radius-2xl)',
                padding: '2rem',
                border: '1px solid rgba(189, 201, 198, 0.35)',
                boxShadow: 'var(--shadow-sm)'
              }}
            >
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-text-main)', margin: '0 0 1.25rem 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="material-symbols-outlined" style={{ color: 'var(--color-primary)' }}>
                  edit_note
                </span>
                1. Event Basics
              </h2>

              {/* SECTION 1.1: COVER IMAGE (CURATED CHOICES / UPLOAD / URL) */}
              <div style={{ marginBottom: '1.75rem' }} data-error={!!errors.image}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
                  <div>
                    <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 800, color: 'var(--color-text-main)' }}>
                      <span>Cover Image</span>
                      <span style={{ color: 'var(--color-error)' }}>*</span>
                    </label>
                    <span style={{ display: 'block', fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '1px' }}>
                      Choose from our curated photo gallery, upload your own, or paste a URL.
                    </span>
                  </div>

                  {formData.image && (
                    <span style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      padding: '3px 10px',
                      borderRadius: 'var(--radius-full)',
                      backgroundColor: 'rgba(15, 118, 110, 0.12)',
                      color: 'var(--color-primary)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      ✓ Cover image selected
                    </span>
                  )}
                </div>

                {/* Selected Cover Banner Preview */}
                {formData.image && (
                  <div style={{ position: 'relative', borderRadius: 'var(--radius-xl)', overflow: 'hidden', height: '220px', border: '1px solid rgba(189, 201, 198, 0.4)', boxShadow: 'var(--shadow-xs)', marginBottom: '14px' }}>
                    <img
                      src={formData.image}
                      alt="Cover Preview"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <div style={{ position: 'absolute', top: '12px', left: '12px', display: 'flex', gap: '6px' }}>
                      <span
                        style={{
                          backgroundColor: 'rgba(0,0,0,0.65)',
                          backdropFilter: 'blur(6px)',
                          color: '#FFFFFF',
                          padding: '4px 12px',
                          borderRadius: 'var(--radius-full)',
                          fontSize: '11px',
                          fontWeight: 700
                        }}
                      >
                        {formData.category || 'General'}
                      </span>
                    </div>
                    <div
                      style={{
                        position: 'absolute',
                        bottom: '12px',
                        left: '12px',
                        right: '12px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        backgroundColor: 'rgba(15, 23, 42, 0.75)',
                        backdropFilter: 'blur(8px)',
                        padding: '6px 12px',
                        borderRadius: 'var(--radius-lg)',
                        flexWrap: 'wrap',
                        gap: '6px'
                      }}
                    >
                      <span style={{ color: '#FFFFFF', fontSize: '12px', fontWeight: 600 }}>
                        ✨ Active Cover Preview
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setFormData(prev => ({ ...prev, image: '' }));
                          setErrors(prev => ({ ...prev, image: 'Cover image is required to publish your event.' }));
                        }}
                        style={{
                          backgroundColor: 'rgba(239, 68, 68, 0.25)',
                          color: '#FECACA',
                          padding: '4px 10px',
                          borderRadius: 'var(--radius-md)',
                          fontSize: '11px',
                          fontWeight: 600,
                          border: '1px solid rgba(239, 68, 68, 0.4)',
                          cursor: 'pointer'
                        }}
                      >
                        Remove Image
                      </button>
                    </div>
                  </div>
                )}

                {/* Source Selection Tabs */}
                <div style={{
                  display: 'flex',
                  gap: '6px',
                  backgroundColor: 'var(--color-bg-surface-secondary)',
                  padding: '4px',
                  borderRadius: 'var(--radius-lg)',
                  marginBottom: '12px',
                  width: 'fit-content'
                }}>
                  <button
                    type="button"
                    onClick={() => setCoverImageTab('gallery')}
                    style={{
                      padding: '6px 14px',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '12px',
                      fontWeight: 700,
                      border: 'none',
                      cursor: 'pointer',
                      backgroundColor: coverImageTab === 'gallery' ? 'var(--color-primary)' : 'transparent',
                      color: coverImageTab === 'gallery' ? '#FFFFFF' : 'var(--color-text-secondary)',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    ✨ Curated Gallery ({CURATED_COVER_IMAGES.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setCoverImageTab('upload')}
                    style={{
                      padding: '6px 14px',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '12px',
                      fontWeight: 700,
                      border: 'none',
                      cursor: 'pointer',
                      backgroundColor: coverImageTab === 'upload' ? 'var(--color-primary)' : 'transparent',
                      color: coverImageTab === 'upload' ? '#FFFFFF' : 'var(--color-text-secondary)',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    📁 Upload Custom File
                  </button>
                  <button
                    type="button"
                    onClick={() => setCoverImageTab('url')}
                    style={{
                      padding: '6px 14px',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '12px',
                      fontWeight: 700,
                      border: 'none',
                      cursor: 'pointer',
                      backgroundColor: coverImageTab === 'url' ? 'var(--color-primary)' : 'transparent',
                      color: coverImageTab === 'url' ? '#FFFFFF' : 'var(--color-text-secondary)',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    🔗 Image URL
                  </button>
                </div>

                {/* TAB 1: CURATED PHOTO CHOICES */}
                {coverImageTab === 'gallery' && (
                  <div style={{ backgroundColor: 'var(--color-bg-surface-secondary)', padding: '14px', borderRadius: 'var(--radius-xl)', border: '1px solid rgba(189, 201, 198, 0.35)' }}>
                    {/* Category Filter Tags */}
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' }}>
                      {['All', 'Music', 'Food & Drink', 'Arts & Culture', 'Sports', 'Nightlife', 'Markets', 'Workshops', 'Entertainment', 'Community'].map((cat) => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setCoverCategoryFilter(cat)}
                          style={{
                            padding: '4px 10px',
                            borderRadius: 'var(--radius-full)',
                            fontSize: '11px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            border: `1px solid ${coverCategoryFilter === cat ? 'var(--color-primary)' : 'rgba(189, 201, 198, 0.4)'}`,
                            backgroundColor: coverCategoryFilter === cat ? 'var(--color-primary)' : '#FFFFFF',
                            color: coverCategoryFilter === cat ? '#FFFFFF' : 'var(--color-text-secondary)'
                          }}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>

                    {/* Image Thumbnails Grid */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
                      gap: '10px',
                      maxHeight: '260px',
                      overflowY: 'auto',
                      paddingRight: '4px'
                    }}>
                      {CURATED_COVER_IMAGES
                        .filter(img => coverCategoryFilter === 'All' || img.category === coverCategoryFilter)
                        .map((img) => {
                          const isSelected = formData.image === img.url;
                          return (
                            <div
                              key={img.id}
                              onClick={() => handleSelectCuratedImage(img)}
                              style={{
                                position: 'relative',
                                borderRadius: 'var(--radius-lg)',
                                overflow: 'hidden',
                                height: '90px',
                                cursor: 'pointer',
                                border: isSelected ? '2.5px solid var(--color-primary)' : '1.5px solid transparent',
                                boxShadow: isSelected ? '0 0 0 2px rgba(15, 118, 110, 0.3)' : 'var(--shadow-xs)',
                                transition: 'all 0.15s ease'
                              }}
                              title={img.title}
                            >
                              <img
                                src={img.thumb}
                                alt={img.title}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                loading="lazy"
                              />
                              <div
                                style={{
                                  position: 'absolute',
                                  inset: 0,
                                  background: isSelected
                                    ? 'rgba(15, 118, 110, 0.35)'
                                    : 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 60%)',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  justifyContent: isSelected ? 'center' : 'flex-end',
                                  alignItems: isSelected ? 'center' : 'flex-start',
                                  padding: '6px'
                                }}
                              >
                                {isSelected ? (
                                  <span style={{
                                    backgroundColor: 'var(--color-primary)',
                                    color: '#FFFFFF',
                                    fontSize: '11px',
                                    fontWeight: 800,
                                    padding: '2px 8px',
                                    borderRadius: 'var(--radius-full)',
                                    boxShadow: '0 2px 6px rgba(0,0,0,0.3)'
                                  }}>
                                    ✓ Selected
                                  </span>
                                ) : (
                                  <span style={{ color: '#FFFFFF', fontSize: '10px', fontWeight: 600, textShadow: '0 1px 2px rgba(0,0,0,0.8)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%' }}>
                                    {img.title}
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}

                {/* TAB 2: UPLOAD CUSTOM FILE */}
                {coverImageTab === 'upload' && (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      borderRadius: 'var(--radius-xl)',
                      border: `2px dashed ${errors.image ? 'var(--color-error)' : 'rgba(15, 118, 110, 0.35)'}`,
                      backgroundColor: 'var(--color-bg-surface-secondary)',
                      padding: '28px 20px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      textAlign: 'center',
                      gap: '10px',
                      cursor: 'pointer'
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '28px', color: 'var(--color-primary)' }}>
                      add_photo_alternate
                    </span>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-text-main)' }}>
                        Upload photo from your device
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                        Supports JPG, PNG, WebP (max 5MB)
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        fileInputRef.current?.click();
                      }}
                      style={{
                        backgroundColor: 'var(--color-primary)',
                        color: '#FFFFFF',
                        border: 'none',
                        padding: '8px 18px',
                        borderRadius: 'var(--radius-md)',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        marginTop: '4px'
                      }}
                    >
                      Browse Files
                    </button>
                  </div>
                )}

                {/* TAB 3: IMAGE URL */}
                {coverImageTab === 'url' && (
                  <div style={{ backgroundColor: 'var(--color-bg-surface-secondary)', padding: '16px', borderRadius: 'var(--radius-xl)', border: '1px solid rgba(189, 201, 198, 0.35)' }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--color-text-main)', marginBottom: '6px' }}>
                      Paste Public Image URL
                    </label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input
                        type="url"
                        value={customImageUrlInput}
                        onChange={(e) => setCustomImageUrlInput(e.target.value)}
                        placeholder="https://images.unsplash.com/photo-..."
                        style={{
                          flex: 1,
                          padding: '8px 12px',
                          borderRadius: 'var(--radius-md)',
                          border: '1px solid rgba(189, 201, 198, 0.4)',
                          fontSize: '13px',
                          outline: 'none'
                        }}
                      />
                      <button
                        type="button"
                        onClick={handleApplyCustomImageUrl}
                        style={{
                          backgroundColor: 'var(--color-primary)',
                          color: '#FFFFFF',
                          border: 'none',
                          padding: '8px 16px',
                          borderRadius: 'var(--radius-md)',
                          fontSize: '12px',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        Apply
                      </button>
                    </div>
                  </div>
                )}

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/png, image/jpeg, image/webp"
                  style={{ display: 'none' }}
                />

                {errors.image && (
                  <p style={{ color: 'var(--color-error)', fontSize: '12px', marginTop: '6px', margin: 0, fontWeight: 600 }}>
                    {errors.image}
                  </p>
                )}
              </div>

              {/* Event Title */}
              <div style={{ marginBottom: '1.25rem' }} data-error={!!errors.title}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-text-main)' }}>
                    Event Title <span style={{ color: 'var(--color-error)' }}>*</span>
                  </label>
                  <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                    {formData.title.length}/120
                  </span>
                </div>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, title: e.target.value }));
                    if (errors.title) setErrors(prev => ({ ...prev, title: undefined }));
                  }}
                  placeholder="e.g. Bandra Sunset Acoustic Jam & Vinyl Session"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-lg)',
                    border: errors.title ? '1.5px solid var(--color-error)' : '1px solid rgba(189, 201, 198, 0.4)',
                    fontSize: '14px',
                    color: 'var(--color-text-main)',
                    outline: 'none'
                  }}
                />
                {errors.title && (
                  <p style={{ color: 'var(--color-error)', fontSize: '12px', marginTop: '4px', margin: 0 }}>
                    {errors.title}
                  </p>
                )}
              </div>

              {/* Short Tagline / Summary */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: 'var(--color-text-main)', marginBottom: '4px' }}>
                  Short Summary / Hook
                </label>
                <input
                  type="text"
                  value={formData.tagline}
                  onChange={(e) => setFormData(prev => ({ ...prev, tagline: e.target.value }))}
                  placeholder="e.g. Analog soul, rare bossa nova vinyls & hand-poured spiced chai."
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid rgba(189, 201, 198, 0.4)',
                    fontSize: '14px',
                    color: 'var(--color-text-main)',
                    outline: 'none'
                  }}
                />
              </div>

              {/* Full Description */}
              <div style={{ marginBottom: '1.5rem' }} data-error={!!errors.description}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: 'var(--color-text-main)', marginBottom: '4px' }}>
                  Full Description & Schedule <span style={{ color: 'var(--color-error)' }}>*</span>
                </label>
                <textarea
                  rows={5}
                  value={formData.description}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, description: e.target.value }));
                    if (errors.description) setErrors(prev => ({ ...prev, description: undefined }));
                  }}
                  placeholder="Tell people what to expect, the lineup or schedule, what's included, and the overall vibe..."
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-lg)',
                    border: errors.description ? '1.5px solid var(--color-error)' : '1px solid rgba(189, 201, 198, 0.4)',
                    fontSize: '14px',
                    color: 'var(--color-text-main)',
                    outline: 'none',
                    resize: 'vertical',
                    lineHeight: 1.5
                  }}
                />
                {errors.description && (
                  <p style={{ color: 'var(--color-error)', fontSize: '12px', marginTop: '4px', margin: 0 }}>
                    {errors.description}
                  </p>
                )}
              </div>

              {/* Visual Category Tiles */}
              <div data-error={!!errors.category}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: 'var(--color-text-main)', marginBottom: '8px' }}>
                  Select Primary Category <span style={{ color: 'var(--color-error)' }}>*</span>
                </label>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                    gap: '8px'
                  }}
                >
                  {CATEGORIES.map((cat) => {
                    const isSelected = formData.category === cat.value;
                    return (
                      <div
                        key={cat.value}
                        onClick={() => {
                          setFormData(prev => ({ ...prev, category: cat.value }));
                          if (errors.category) setErrors(prev => ({ ...prev, category: undefined }));
                        }}
                        style={{
                          padding: '10px 12px',
                          borderRadius: 'var(--radius-xl)',
                          border: isSelected ? '2px solid var(--color-primary)' : '1px solid rgba(189, 201, 198, 0.35)',
                          backgroundColor: isSelected ? 'rgba(0, 92, 85, 0.06)' : 'var(--color-bg-surface-secondary)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <span style={{ fontSize: '20px' }}>{cat.icon}</span>
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: isSelected ? 700 : 600, color: isSelected ? 'var(--color-primary)' : 'var(--color-text-main)' }}>
                            {cat.label}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {errors.category && (
                  <p style={{ color: 'var(--color-error)', fontSize: '12px', marginTop: '4px', margin: 0 }}>
                    {errors.category}
                  </p>
                )}
              </div>
            </div>

            {/* SECTION 2: WHEN IS YOUR EVENT */}
            <div
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 'var(--radius-2xl)',
                padding: '2rem',
                border: '1px solid rgba(189, 201, 198, 0.35)',
                boxShadow: 'var(--shadow-sm)'
              }}
            >
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-text-main)', margin: '0 0 1.25rem 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="material-symbols-outlined" style={{ color: 'var(--color-primary)' }}>
                  calendar_today
                </span>
                2. When is your event?
              </h2>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                {/* Date */}
                <div data-error={!!errors.startDate}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: 'var(--color-text-main)', marginBottom: '4px' }}>
                    Event Date <span style={{ color: 'var(--color-error)' }}>*</span>
                  </label>
                  <input
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    value={formData.startDate}
                    onChange={(e) => {
                      setFormData(prev => ({
                        ...prev,
                        startDate: e.target.value,
                        endDate: e.target.value
                      }));
                      if (errors.startDate) setErrors(prev => ({ ...prev, startDate: undefined }));
                    }}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 'var(--radius-lg)',
                      border: errors.startDate ? '1.5px solid var(--color-error)' : '1px solid rgba(189, 201, 198, 0.4)',
                      fontSize: '14px',
                      color: 'var(--color-text-main)',
                      outline: 'none'
                    }}
                  />
                  {errors.startDate && (
                    <p style={{ color: 'var(--color-error)', fontSize: '12px', marginTop: '4px', margin: 0 }}>
                      {errors.startDate}
                    </p>
                  )}
                </div>

                {/* Starts At */}
                <div data-error={!!errors.startTime}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: 'var(--color-text-main)', marginBottom: '4px' }}>
                    Start Time <span style={{ color: 'var(--color-error)' }}>*</span>
                  </label>
                  <input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, startTime: e.target.value }));
                      if (errors.startTime) setErrors(prev => ({ ...prev, startTime: undefined }));
                    }}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 'var(--radius-lg)',
                      border: errors.startTime ? '1.5px solid var(--color-error)' : '1px solid rgba(189, 201, 198, 0.4)',
                      fontSize: '14px',
                      color: 'var(--color-text-main)',
                      outline: 'none'
                    }}
                  />
                  {errors.startTime && (
                    <p style={{ color: 'var(--color-error)', fontSize: '12px', marginTop: '4px', margin: 0 }}>
                      {errors.startTime}
                    </p>
                  )}
                </div>

                {/* Ends At */}
                {!formData.noEndTime && (
                  <div data-error={!!errors.endTime}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: 'var(--color-text-main)', marginBottom: '4px' }}>
                      End Time <span style={{ color: 'var(--color-error)' }}>*</span>
                    </label>
                    <input
                      type="time"
                      value={formData.endTime}
                      onChange={(e) => {
                        setFormData(prev => ({ ...prev, endTime: e.target.value }));
                        if (errors.endTime) setErrors(prev => ({ ...prev, endTime: undefined }));
                      }}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: 'var(--radius-lg)',
                        border: errors.endTime ? '1.5px solid var(--color-error)' : '1px solid rgba(189, 201, 198, 0.4)',
                        fontSize: '14px',
                        color: 'var(--color-text-main)',
                        outline: 'none'
                      }}
                    />
                    {errors.endTime && (
                      <p style={{ color: 'var(--color-error)', fontSize: '12px', marginTop: '4px', margin: 0 }}>
                        {errors.endTime}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* No End Time Checkbox */}
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                <input
                  type="checkbox"
                  checked={formData.noEndTime}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, noEndTime: e.target.checked }));
                    if (errors.endTime) setErrors(prev => ({ ...prev, endTime: undefined }));
                  }}
                  style={{ width: '16px', height: '16px', accentColor: 'var(--color-primary)' }}
                />
                <span>This event doesn't have a strict end time (open-ended gathering)</span>
              </label>
            </div>

            {/* SECTION 3: WHERE IS YOUR EVENT */}
            <div
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 'var(--radius-2xl)',
                padding: '2rem',
                border: '1px solid rgba(189, 201, 198, 0.35)',
                boxShadow: 'var(--shadow-sm)'
              }}
            >
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-text-main)', margin: '0 0 1.25rem 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="material-symbols-outlined" style={{ color: 'var(--color-primary)' }}>
                  location_on
                </span>
                3. Where is your event?
              </h2>

              {/* Major Indian City Selector Dropdown & Landmark Search */}
              <div style={{ marginBottom: '1.25rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-text-main)' }}>
                      City / Metro
                    </label>
                    <span style={{ fontSize: '11px', color: 'var(--color-primary)', fontWeight: 700, backgroundColor: 'rgba(0, 92, 85, 0.08)', padding: '1px 8px', borderRadius: 'var(--radius-full)' }}>
                      ✓ {formData.city || 'Mumbai'}
                    </span>
                  </div>
                  <select
                    value={formData.city}
                    onChange={(e) => handleSelectIndianCity(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 'var(--radius-lg)',
                      border: '1px solid rgba(189, 201, 198, 0.4)',
                      fontSize: '13px',
                      fontWeight: 600,
                      color: 'var(--color-text-main)',
                      backgroundColor: 'var(--color-bg-surface-secondary)',
                      outline: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    {availableCities.map((c) => (
                      <option key={c.name} value={c.name}>
                        {c.name} {c.state ? `(${c.state})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ position: 'relative', zIndex: showAddressDropdown ? 1050 : 2 }} ref={dropdownRef} data-error={!!errors.location}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-text-main)' }}>
                      Search Street / Landmark / Cafe <span style={{ color: 'var(--color-error)' }}>*</span>
                    </label>
                    <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                      Auto-detects City
                    </span>
                  </div>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <span className="material-symbols-outlined" style={{ position: 'absolute', left: '10px', color: 'var(--color-text-muted)', fontSize: '18px' }}>
                      search
                    </span>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={handleAddressSearchChange}
                      placeholder="e.g. Carter Road Amphitheatre or CyberHub..."
                      style={{
                        width: '100%',
                        padding: '10px 14px 10px 34px',
                        borderRadius: 'var(--radius-lg)',
                        border: errors.location ? '1.5px solid var(--color-error)' : '1px solid rgba(189, 201, 198, 0.4)',
                        fontSize: '13px',
                        color: 'var(--color-text-main)',
                        outline: 'none'
                      }}
                    />
                    {isSearchingAddress && (
                      <span style={{ position: 'absolute', right: '10px', fontSize: '11px', color: 'var(--color-text-muted)' }}>
                        Searching...
                      </span>
                    )}
                  </div>

                  {/* Autocomplete Suggestions Dropdown */}
                  {showAddressDropdown && addressSuggestions.length > 0 && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        marginTop: '6px',
                        backgroundColor: '#FFFFFF',
                        borderRadius: 'var(--radius-xl)',
                        boxShadow: '0 12px 36px rgba(0,0,0,0.22)',
                        border: '1.5px solid rgba(189, 201, 198, 0.5)',
                        zIndex: 2000,
                        maxHeight: '260px',
                        overflowY: 'auto'
                      }}
                    >
                      {addressSuggestions.map((item, idx) => (
                        <div
                          key={idx}
                          onClick={() => handleSelectAddress(item)}
                          style={{
                            padding: '11px 14px',
                            borderBottom: idx < addressSuggestions.length - 1 ? '1px solid rgba(189, 201, 198, 0.25)' : 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '10px',
                            transition: 'background-color 0.15s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = 'var(--color-bg-surface-secondary)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = '#FFFFFF';
                          }}
                        >
                          <span className="material-symbols-outlined" style={{ color: 'var(--color-primary)', fontSize: '18px', marginTop: '2px', flexShrink: 0 }}>
                            pin_drop
                          </span>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-main)', lineHeight: 1.4, wordBreak: 'break-word' }}>
                              {item.address}
                            </div>
                            {item.city && (
                              <div style={{ fontSize: '11px', color: 'var(--color-primary)', fontWeight: 700, marginTop: '3px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <span>🎯 Auto-selects City:</span>
                                <span>{item.city}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Neighborhood Venues Chips for the selected city */}
              {cityPresets.length > 0 && (
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                      Popular Spots in {formData.city || 'Your City'}:
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {cityPresets.map((preset) => (
                      <button
                        key={preset.name}
                        type="button"
                        onClick={() => handleSelectPresetNeighborhood(preset)}
                        style={{
                          padding: '4px 10px',
                          borderRadius: 'var(--radius-full)',
                          fontSize: '11px',
                          fontWeight: 600,
                          backgroundColor: formData.venueName === preset.name.split(',')[0] ? 'rgba(0, 92, 85, 0.12)' : 'var(--color-bg-surface-secondary)',
                          color: formData.venueName === preset.name.split(',')[0] ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                          border: `1px solid ${formData.venueName === preset.name.split(',')[0] ? 'var(--color-primary)' : 'rgba(189, 201, 198, 0.4)'}`,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <span>📍</span>
                        <span>{preset.name.split(',')[0]}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Selected Venue Summary Card */}
              <div
                style={{
                  backgroundColor: 'var(--color-bg-surface-secondary)',
                  borderRadius: 'var(--radius-xl)',
                  padding: '12px 16px',
                  marginBottom: '1rem',
                  border: '1px solid rgba(189, 201, 198, 0.35)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--color-primary-fixed)',
                      color: 'var(--color-primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                      storefront
                    </span>
                  </div>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-text-main)' }}>
                      {formData.venueName || 'Selected Venue'}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                      {formData.address}
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    backgroundColor: '#ECFDF5',
                    color: '#065F46',
                    border: '1px solid #A7F3D0',
                    padding: '3px 8px',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '11px',
                    fontWeight: 700,
                    flexShrink: 0
                  }}
                >
                  <span>🇮🇳 India Scope</span>
                </div>
              </div>

              {/* Interactive Location Picker Map */}
              <div style={{ borderRadius: 'var(--radius-xl)', overflow: 'hidden' }}>
                <LocationPickerMap
                  coordinates={formData.coordinates}
                  address={formData.address}
                  onLocationChange={handleMapLocationChange}
                  height="260px"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                  💡 Click or drag the map pin to calibrate exact venue coordinates.
                </span>
                <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)', fontWeight: 600 }}>
                  [{formData.coordinates[1].toFixed(4)}°N, {formData.coordinates[0].toFixed(4)}°E]
                </span>
              </div>

              {!isWithinIndia && (
                <div
                  style={{
                    marginTop: '8px',
                    backgroundColor: '#FEF2F2',
                    border: '1px solid #FECACA',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-lg)',
                    color: '#991B1B',
                    fontSize: '12px',
                    fontWeight: 600
                  }}
                >
                  ⚠️ LocalVibe currently supports event locations in India only. Please pick an Indian venue.
                </div>
              )}

              {errors.location && (
                <p style={{ color: 'var(--color-error)', fontSize: '12px', marginTop: '6px', margin: 0 }}>
                  {errors.location}
                </p>
              )}
            </div>

            {/* SECTION 4: ENTRY & CAPACITY */}
            <div
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 'var(--radius-2xl)',
                padding: '2rem',
                border: '1px solid rgba(189, 201, 198, 0.35)',
                boxShadow: 'var(--shadow-sm)'
              }}
            >
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-text-main)', margin: '0 0 1.25rem 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="material-symbols-outlined" style={{ color: 'var(--color-primary)' }}>
                  confirmation_number
                </span>
                4. Entry & Capacity
              </h2>

              {/* Entry Mode (Free vs Paid) */}
              <div style={{ marginBottom: '1.5rem' }} data-error={!!errors.price}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: 'var(--color-text-main)', marginBottom: '8px' }}>
                  Event Entry <span style={{ color: 'var(--color-error)' }}>*</span>
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div
                    onClick={() => {
                      setFormData(prev => ({ ...prev, isFree: true, price: 0 }));
                      if (errors.price) setErrors(prev => ({ ...prev, price: undefined }));
                    }}
                    style={{
                      padding: '12px 14px',
                      borderRadius: 'var(--radius-xl)',
                      border: formData.isFree ? '2px solid var(--color-primary)' : '1px solid rgba(189, 201, 198, 0.35)',
                      backgroundColor: formData.isFree ? 'rgba(0, 92, 85, 0.06)' : 'var(--color-bg-surface-secondary)',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, fontSize: '14px', color: formData.isFree ? 'var(--color-primary)' : 'var(--color-text-main)' }}>
                      <span>🟢 Free Admission</span>
                    </div>
                    <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                      Guests RSVP for free on LocalVibe.
                    </p>
                  </div>

                  <div
                    onClick={() => {
                      setFormData(prev => ({ ...prev, isFree: false, price: prev.price > 0 ? prev.price : 499 }));
                      if (errors.price) setErrors(prev => ({ ...prev, price: undefined }));
                    }}
                    style={{
                      padding: '12px 14px',
                      borderRadius: 'var(--radius-xl)',
                      border: !formData.isFree ? '2px solid var(--color-primary)' : '1px solid rgba(189, 201, 198, 0.35)',
                      backgroundColor: !formData.isFree ? 'rgba(0, 92, 85, 0.06)' : 'var(--color-bg-surface-secondary)',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, fontSize: '14px', color: !formData.isFree ? 'var(--color-primary)' : 'var(--color-text-main)' }}>
                      <span>💳 Ticketed Pass</span>
                    </div>
                    <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                      Charge an entry fee in Indian Rupees.
                    </p>
                  </div>
                </div>

                {/* Price input if paid */}
                {!formData.isFree && (
                  <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '16px', fontWeight: 800, color: 'var(--color-text-main)' }}>
                      ₹
                    </span>
                    <input
                      type="number"
                      min="1"
                      value={formData.price}
                      onChange={(e) => {
                        setFormData(prev => ({ ...prev, price: e.target.value }));
                        if (errors.price) setErrors(prev => ({ ...prev, price: undefined }));
                      }}
                      placeholder="e.g. 499"
                      style={{
                        width: '160px',
                        padding: '8px 12px',
                        borderRadius: 'var(--radius-lg)',
                        border: errors.price ? '1.5px solid var(--color-error)' : '1px solid rgba(189, 201, 198, 0.4)',
                        fontSize: '14px',
                        fontWeight: 700,
                        color: 'var(--color-text-main)',
                        outline: 'none'
                      }}
                    />
                    <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                      per attendee pass
                    </span>
                  </div>
                )}
                {errors.price && (
                  <p style={{ color: 'var(--color-error)', fontSize: '12px', marginTop: '4px', margin: 0 }}>
                    {errors.price}
                  </p>
                )}
              </div>

              {/* Capacity Mode (Unlimited vs Limited) */}
              <div data-error={!!errors.capacity}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: 'var(--color-text-main)', marginBottom: '8px' }}>
                  Capacity & Guest Limit
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div
                    onClick={() => {
                      setFormData(prev => ({ ...prev, isUnlimitedCapacity: true }));
                      if (errors.capacity) setErrors(prev => ({ ...prev, capacity: undefined }));
                    }}
                    style={{
                      padding: '12px 14px',
                      borderRadius: 'var(--radius-xl)',
                      border: formData.isUnlimitedCapacity ? '2px solid var(--color-primary)' : '1px solid rgba(189, 201, 198, 0.35)',
                      backgroundColor: formData.isUnlimitedCapacity ? 'rgba(0, 92, 85, 0.06)' : 'var(--color-bg-surface-secondary)',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ fontWeight: 700, fontSize: '14px', color: formData.isUnlimitedCapacity ? 'var(--color-primary)' : 'var(--color-text-main)' }}>
                      🌐 Unlimited
                    </div>
                    <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                      Open neighborhood door policy.
                    </p>
                  </div>

                  <div
                    onClick={() => {
                      setFormData(prev => ({ ...prev, isUnlimitedCapacity: false }));
                      if (errors.capacity) setErrors(prev => ({ ...prev, capacity: undefined }));
                    }}
                    style={{
                      padding: '12px 14px',
                      borderRadius: 'var(--radius-xl)',
                      border: !formData.isUnlimitedCapacity ? '2px solid var(--color-primary)' : '1px solid rgba(189, 201, 198, 0.35)',
                      backgroundColor: !formData.isUnlimitedCapacity ? 'rgba(0, 92, 85, 0.06)' : 'var(--color-bg-surface-secondary)',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ fontWeight: 700, fontSize: '14px', color: !formData.isUnlimitedCapacity ? 'var(--color-primary)' : 'var(--color-text-main)' }}>
                      👥 Limited Spots
                    </div>
                    <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                      Cap attendance for an intimate vibe.
                    </p>
                  </div>
                </div>

                {/* Capacity Input if limited */}
                {!formData.isUnlimitedCapacity && (
                  <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="number"
                      min="1"
                      value={formData.capacity}
                      onChange={(e) => {
                        setFormData(prev => ({ ...prev, capacity: e.target.value }));
                        if (errors.capacity) setErrors(prev => ({ ...prev, capacity: undefined }));
                      }}
                      placeholder="e.g. 50"
                      style={{
                        width: '120px',
                        padding: '8px 12px',
                        borderRadius: 'var(--radius-lg)',
                        border: errors.capacity ? '1.5px solid var(--color-error)' : '1px solid rgba(189, 201, 198, 0.4)',
                        fontSize: '14px',
                        fontWeight: 700,
                        color: 'var(--color-text-main)',
                        outline: 'none'
                      }}
                    />
                    <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                      maximum attendees limit
                    </span>
                  </div>
                )}
                {errors.capacity && (
                  <p style={{ color: 'var(--color-error)', fontSize: '12px', marginTop: '4px', margin: 0 }}>
                    {errors.capacity}
                  </p>
                )}
              </div>
            </div>

            {/* SECTION 5: ADDITIONAL INFORMATION */}
            <div
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 'var(--radius-2xl)',
                padding: '2rem',
                border: '1px solid rgba(189, 201, 198, 0.35)',
                boxShadow: 'var(--shadow-sm)'
              }}
            >
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-text-main)', margin: '0 0 1.25rem 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="material-symbols-outlined" style={{ color: 'var(--color-primary)' }}>
                  info
                </span>
                5. Additional Information & Vibe Tags
              </h2>

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: 'var(--color-text-main)', marginBottom: '4px' }}>
                  Anything attendees should know? (Optional)
                </label>
                <textarea
                  rows={3}
                  value={formData.additionalInfo}
                  onChange={(e) => setFormData(prev => ({ ...prev, additionalInfo: e.target.value }))}
                  placeholder="e.g. Parking available near venue, BYOB friendly, bring your own mat, 18+ age recommendation..."
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid rgba(189, 201, 198, 0.4)',
                    fontSize: '14px',
                    color: 'var(--color-text-main)',
                    outline: 'none',
                    resize: 'vertical'
                  }}
                />
              </div>

              {/* Vibe Tags Pills */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--color-text-muted)', marginBottom: '6px', textTransform: 'uppercase' }}>
                  Select Vibe Highlights
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {VIBE_PILLS.map((pill) => {
                    const isSelected = formData.selectedVibes.includes(pill);
                    return (
                      <button
                        key={pill}
                        type="button"
                        onClick={() => toggleVibe(pill)}
                        style={{
                          padding: '4px 10px',
                          borderRadius: 'var(--radius-full)',
                          fontSize: '12px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          backgroundColor: isSelected ? 'var(--color-primary)' : 'var(--color-bg-surface-secondary)',
                          color: isSelected ? '#FFFFFF' : 'var(--color-text-secondary)',
                          border: isSelected ? '1px solid var(--color-primary)' : '1px solid rgba(189, 201, 198, 0.35)',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        {pill}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* SECTION 7: ACTIONS */}
            <div
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 'var(--radius-2xl)',
                padding: '1.75rem 2rem',
                border: '1px solid rgba(189, 201, 198, 0.35)',
                boxShadow: 'var(--shadow-sm)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '1rem'
              }}
            >
              <div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-text-main)' }}>
                  Ready to go live on the neighborhood radar?
                </div>
                <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                  Your event will be immediately discoverable across Indian metro feeds.
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Link to="/discover">
                  <button
                    type="button"
                    style={{
                      backgroundColor: 'var(--color-bg-surface-secondary)',
                      color: 'var(--color-text-secondary)',
                      padding: '12px 20px',
                      borderRadius: 'var(--radius-lg)',
                      fontSize: '14px',
                      fontWeight: 600,
                      border: '1px solid rgba(189, 201, 198, 0.4)',
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                </Link>

                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleSubmit}
                  style={{
                    backgroundColor: 'var(--color-primary)',
                    color: '#FFFFFF',
                    padding: '12px 28px',
                    borderRadius: 'var(--radius-lg)',
                    fontSize: '14px',
                    fontWeight: 700,
                    border: 'none',
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    boxShadow: '0 4px 16px rgba(0, 92, 85, 0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  {isSubmitting ? (
                    <>
                      <span className="material-symbols-outlined" style={{ fontSize: '18px', animation: 'spin 1s linear infinite' }}>
                        progress_activity
                      </span>
                      <span>Publishing Gathering...</span>
                    </>
                  ) : (
                    <>
                      <span>🚀 Publish Event</span>
                    </>
                  )}
                </button>
              </div>
            </div>

          </div>

          {/* ========================================================================= */}
          {/* RIGHT COLUMN: STICKY LIVE PREVIEW                                        */}
          {/* ========================================================================= */}
          <div
            style={{
              position: 'sticky',
              top: '96px',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem'
            }}
          >
            {/* Live Preview Container */}
            <div
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 'var(--radius-2xl)',
                border: '1px solid rgba(189, 201, 198, 0.35)',
                overflow: 'hidden',
                boxShadow: '0 12px 28px -4px rgba(0, 92, 85, 0.1)'
              }}
            >
              {/* Header Badge */}
              <div
                style={{
                  backgroundColor: 'var(--color-bg-surface-secondary)',
                  padding: '10px 16px',
                  borderBottom: '1px solid rgba(189, 201, 198, 0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <span
                  style={{
                    fontSize: '12px',
                    fontWeight: 700,
                    color: 'var(--color-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <span className="material-symbols-outlined material-symbols-filled" style={{ fontSize: '15px' }}>
                    visibility
                  </span>
                  Live Radar Card Preview
                </span>
                <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                  Updates in real time
                </span>
              </div>

              {/* Event Card Image */}
              <div style={{ position: 'relative', height: '200px', backgroundColor: 'var(--color-bg-surface-secondary)' }}>
                <img
                  src={formData.image || 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&w=800&q=80'}
                  alt="Preview Cover"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <span
                  style={{
                    position: 'absolute',
                    top: '12px',
                    left: '12px',
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(4px)',
                    color: 'var(--color-text-main)',
                    padding: '3px 10px',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '11px',
                    fontWeight: 700,
                    boxShadow: 'var(--shadow-xs)'
                  }}
                >
                  {formData.category || 'Music'}
                </span>
                <span
                  style={{
                    position: 'absolute',
                    top: '12px',
                    right: '12px',
                    backgroundColor: formData.isFree ? 'var(--color-primary)' : 'var(--color-secondary-container, #fd761a)',
                    color: '#FFFFFF',
                    padding: '3px 10px',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '11px',
                    fontWeight: 700,
                    boxShadow: 'var(--shadow-xs)'
                  }}
                >
                  {formData.isFree ? 'Free Entry' : `₹${formData.price || 0}`}
                </span>
              </div>

              {/* Event Card Details */}
              <div style={{ padding: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      color: 'var(--color-secondary)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em'
                    }}
                  >
                    {formattedPreviewDate} • {formData.startTime || '7:00 PM'}
                  </span>
                </div>

                <h3
                  style={{
                    fontSize: '1.15rem',
                    fontWeight: 800,
                    color: 'var(--color-text-main)',
                    margin: '0 0 6px 0',
                    lineHeight: 1.25
                  }}
                >
                  {formData.title || 'Your Event Title Will Appear Here'}
                </h3>

                {formData.tagline && (
                  <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', margin: '0 0 8px 0', fontStyle: 'italic' }}>
                    "{formData.tagline}"
                  </p>
                )}

                <p
                  style={{
                    fontSize: '12px',
                    color: 'var(--color-text-muted)',
                    margin: '0 0 12px 0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '15px', color: 'var(--color-primary)' }}>
                    location_on
                  </span>
                  <span>{formData.address || 'Carter Road, Bandra West, Mumbai'}</span>
                </p>

                {/* Vibe Tags */}
                {formData.selectedVibes.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '12px' }}>
                    {formData.selectedVibes.slice(0, 3).map((vibe) => (
                      <span
                        key={vibe}
                        style={{
                          backgroundColor: 'var(--color-bg-surface-secondary)',
                          color: 'var(--color-text-secondary)',
                          padding: '2px 8px',
                          borderRadius: 'var(--radius-full)',
                          fontSize: '10px',
                          fontWeight: 600
                        }}
                      >
                        {vibe}
                      </span>
                    ))}
                  </div>
                )}

                {/* Organizer Info & RSVP button preview */}
                <div
                  style={{
                    borderTop: '1px solid rgba(189, 201, 198, 0.25)',
                    paddingTop: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        backgroundColor: 'var(--color-primary-fixed)',
                        color: 'var(--color-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '11px',
                        fontWeight: 700
                      }}
                    >
                      {user?.name ? user.name.slice(0, 2).toUpperCase() : 'ME'}
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-text-main)' }}>
                        {user?.name || 'You (Host)'}
                      </div>
                      <div style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>
                        {formData.isUnlimitedCapacity ? 'Unlimited spots' : `${formData.capacity || 50} spots capacity`}
                      </div>
                    </div>
                  </div>

                  <span
                    style={{
                      backgroundColor: 'rgba(0, 92, 85, 0.1)',
                      color: 'var(--color-primary)',
                      padding: '4px 12px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: 700
                    }}
                  >
                    Quick RSVP
                  </span>
                </div>
              </div>
            </div>

            {/* Organizer Checklist Card */}
            <div
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 'var(--radius-2xl)',
                padding: '1.25rem',
                border: '1px solid rgba(189, 201, 198, 0.35)'
              }}
            >
              <h4 style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-text-main)', margin: '0 0 8px 0', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                LocalVibe Host Guarantees
              </h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                <li style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ color: '#10B981', fontWeight: 700 }}>✓</span>
                  <span>Instant indexing on Indian metro radar map</span>
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ color: '#10B981', fontWeight: 700 }}>✓</span>
                  <span>Direct attendee management in My Events</span>
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ color: '#10B981', fontWeight: 700 }}>✓</span>
                  <span>1-click calendar sync for verified attendees</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

      </div>

      {/* Post-Publish Celebration Success Modal */}
      {showSuccessModal && createdEvent && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem'
          }}
        >
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 'var(--radius-2xl)',
              maxWidth: '480px',
              width: '100%',
              padding: '2.5rem 2rem',
              textAlign: 'center',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              border: '1px solid rgba(189, 201, 198, 0.3)'
            }}
          >
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: '#ECFDF5',
                color: '#059669',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.25rem auto',
                fontSize: '32px'
              }}
            >
              🎉
            </div>

            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-text-main)', margin: '0 0 8px 0' }}>
              Gathering Published!
            </h2>
            <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', margin: '0 0 1.5rem 0', lineHeight: 1.5 }}>
              <strong>"{createdEvent.title}"</strong> is now live on the neighborhood radar for {createdEvent.location?.city || 'your city'}.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                type="button"
                onClick={() => navigate(`/events/${createdEvent._id || createdEvent.id}`)}
                style={{
                  backgroundColor: 'var(--color-primary)',
                  color: '#FFFFFF',
                  padding: '12px',
                  borderRadius: 'var(--radius-lg)',
                  fontSize: '14px',
                  fontWeight: 700,
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: 'var(--shadow-sm)'
                }}
              >
                👁️ View Event Details Page
              </button>

              <button
                type="button"
                onClick={() => navigate('/my-events')}
                style={{
                  backgroundColor: 'var(--color-bg-surface-secondary)',
                  color: 'var(--color-text-main)',
                  padding: '12px',
                  borderRadius: 'var(--radius-lg)',
                  fontSize: '14px',
                  fontWeight: 600,
                  border: '1px solid rgba(189, 201, 198, 0.35)',
                  cursor: 'pointer'
                }}
              >
                Go to My Hosted Events
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Auth Modal for Guests */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialMode="login"
      />
    </div>
  );
};
