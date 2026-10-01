import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Search,
  Navigation,
  ExternalLink,
  Compass,
  Coffee,
  ShoppingBag,
  HeartPulse,
  Train,
  BookOpen,
  Dumbbell,
  Sparkles,
  Loader2,
  AlertCircle,
  LocateFixed,
} from 'lucide-react';
import { api } from '../../services/api';

interface PlaceItem {
  id: string;
  title: string;
  uri: string;
  reviewSnippets: string[];
  address?: string;
}

interface MapsSearchResponse {
  text: string;
  places: PlaceItem[];
  groundingMetadata?: any;
}

const CATEGORIES = [
  { id: 'all', label: 'All Essentials', icon: Compass, query: 'essential places, groceries, pharmacy, food' },
  { id: 'cafes', label: 'Study Cafes & Workspaces', icon: Coffee, query: 'study cafes with good wifi and coffee' },
  { id: 'food', label: 'Budget Food & Dining', icon: ShoppingBag, query: 'affordable student dining and restaurants' },
  { id: 'grocery', label: 'Supermarkets & Groceries', icon: ShoppingBag, query: 'supermarkets and convenience stores' },
  { id: 'health', label: 'Pharmacies & Medical', icon: HeartPulse, query: '24/7 pharmacies, clinics, and hospitals' },
  { id: 'transit', label: 'Metro & Bus Transit', icon: Train, query: 'metro stations and public bus stops' },
  { id: 'study', label: 'Libraries & Quiet Study', icon: BookOpen, query: 'public libraries, reading halls, and bookstores' },
  { id: 'gym', label: 'Gyms & Fitness', icon: Dumbbell, query: 'gyms, fitness clubs, and sports grounds' },
];

export const HostelMapsExplorer: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('cafes');
  const [searchQuery, setSearchQuery] = useState<string>('study cafes with good wifi');
  const [locationName, setLocationName] = useState<string>('Near Hostel Campus');
  const [userCoords, setUserCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locatingUser, setLocatingUser] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<MapsSearchResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchNearbyPlaces = async (
    queryToRun: string,
    catId?: string,
    coordsOverride?: { latitude: number; longitude: number } | null
  ) => {
    setLoading(true);
    setError(null);

    const activeCoords = coordsOverride !== undefined ? coordsOverride : userCoords;

    try {
      const data = await api.searchMaps({
        query: queryToRun,
        category: catId || selectedCategory,
        location: locationName.trim() || undefined,
        latLng: activeCoords || undefined,
      });

      setResult(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to search places with Google Maps. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Perform initial search on mount
  useEffect(() => {
    fetchNearbyPlaces('study cafes with good wifi', 'cafes');
  }, []);

  const handleCategorySelect = (category: typeof CATEGORIES[0]) => {
    setSelectedCategory(category.id);
    setSearchQuery(category.query);
    fetchNearbyPlaces(category.query, category.id);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    fetchNearbyPlaces(searchQuery.trim(), selectedCategory);
  };

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    setLocatingUser(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        };
        setUserCoords(coords);
        setLocationName(`Current Location (${coords.latitude.toFixed(3)}, ${coords.longitude.toFixed(3)})`);
        setLocatingUser(false);
        fetchNearbyPlaces(searchQuery, selectedCategory, coords);
      },
      (err) => {
        console.warn('Geolocation error:', err);
        setLocatingUser(false);
        alert('Could not determine your GPS location. You can specify a city or landmark instead.');
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-stone-900 rounded-2xl p-6 sm:p-8 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-200 text-xs font-semibold uppercase tracking-wider mb-3 border border-emerald-400/30">
            <MapPin className="w-3.5 h-3.5" />
            <span>Google Maps Grounded Neighborhood Explorer</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-2">
            Hostel Neighborhood & Local Guide
          </h1>
          <p className="text-stone-300 text-sm sm:text-base leading-relaxed">
            Real-time live Google Maps data powered by <span className="font-semibold text-emerald-300">gemini-3.5-flash</span>. Discover essential spots, study hubs, medical services, and student discounts around the hostel.
          </p>
        </div>

        {/* Decorative corner element */}
        <div className="absolute right-4 bottom-[-20px] opacity-10 pointer-events-none">
          <Navigation className="w-56 h-56 text-white" />
        </div>
      </div>

      {/* Search & Location Controls */}
      <div className="bg-white rounded-xl shadow-xs border border-stone-200 p-5 space-y-4">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-6 relative">
            <Search className="w-5 h-5 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="What are you looking for? (e.g. 24h study cafe, cheap biryani, pharmacy...)"
              className="w-full pl-10 pr-4 py-2.5 bg-stone-50 border border-stone-300 rounded-lg text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-colors"
            />
          </div>

          <div className="md:col-span-4 relative">
            <MapPin className="w-5 h-5 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={locationName}
              onChange={(e) => setLocationName(e.target.value)}
              placeholder="Hostel area or city landmark..."
              className="w-full pl-10 pr-4 py-2.5 bg-stone-50 border border-stone-300 rounded-lg text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-colors"
            />
          </div>

          <div className="md:col-span-2 flex gap-2">
            <button
              type="button"
              onClick={handleDetectLocation}
              disabled={locatingUser}
              title="Detect device GPS coordinates"
              className="p-2.5 border border-stone-300 rounded-lg text-stone-600 hover:text-emerald-700 hover:bg-emerald-50 transition-colors flex items-center justify-center shrink-0 disabled:opacity-50"
            >
              <LocateFixed className={`w-5 h-5 ${locatingUser ? 'animate-spin text-emerald-600' : ''}`} />
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm rounded-lg transition-colors flex items-center justify-center gap-2 shadow-xs disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Searching...</span>
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  <span>Search</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Quick Category Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => handleCategorySelect(cat)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                  isSelected
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-stone-100 text-stone-700 hover:bg-stone-200 border border-stone-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3 text-red-800">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div className="flex-1 text-sm">
            <p className="font-semibold">Unable to fetch Google Maps results</p>
            <p className="text-red-700 text-xs mt-0.5">{error}</p>
          </div>
          <button
            onClick={() => fetchNearbyPlaces(searchQuery, selectedCategory)}
            className="text-xs font-semibold text-red-700 underline hover:text-red-900"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading state indicator */}
      {loading && (
        <div className="bg-white rounded-xl border border-stone-200 p-12 text-center shadow-xs">
          <div className="inline-flex p-3 rounded-full bg-emerald-50 text-emerald-600 mb-3 animate-pulse">
            <Compass className="w-8 h-8 animate-spin" />
          </div>
          <h3 className="text-base font-semibold text-stone-800">Grounding with Google Maps</h3>
          <p className="text-xs text-stone-500 max-w-sm mx-auto mt-1">
            Retrieving real place locations, review snippets, and nearby coordinates using gemini-3.5-flash with googleMaps tool...
          </p>
        </div>
      )}

      {/* Search Results Display */}
      {!loading && result && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Places List with Direct Google Maps URLs (MUST ALWAYS list as links per skill instructions) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-wider text-stone-700 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-emerald-600" />
                <span>Verified Google Maps Places ({result.places.length})</span>
              </h2>
              <span className="text-xs text-stone-500">Click to navigate</span>
            </div>

            {result.places.length === 0 ? (
              <div className="bg-white rounded-xl border border-stone-200 p-6 text-center">
                <MapPin className="w-8 h-8 text-stone-400 mx-auto mb-2 opacity-60" />
                <p className="text-sm text-stone-600 font-medium">No direct pin locations returned</p>
                <p className="text-xs text-stone-500 mt-1">
                  Check the neighborhood guide summary or try a broader search query.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {result.places.map((place) => (
                  <div
                    key={place.id}
                    className="bg-white rounded-xl border border-stone-200 p-4 hover:border-emerald-400 hover:shadow-md transition-all group"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                          <h3 className="font-bold text-stone-900 text-sm group-hover:text-emerald-700 transition-colors">
                            {place.title}
                          </h3>
                        </div>

                        {place.address && (
                          <p className="text-xs text-stone-500 mt-1 pl-4 flex items-center gap-1">
                            <MapPin className="w-3 h-3 shrink-0 text-stone-400" />
                            <span>{place.address}</span>
                          </p>
                        )}
                      </div>

                      {/* Direct Google Maps Link Button */}
                      <a
                        href={place.uri}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white text-xs font-semibold transition-colors shrink-0 border border-emerald-200 hover:border-emerald-600"
                        title="Open place directly in Google Maps"
                      >
                        <span>Open Maps</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>

                    {/* Review Snippets from Grounding Metadata */}
                    {place.reviewSnippets && place.reviewSnippets.length > 0 && (
                      <div className="mt-3 pt-2.5 border-t border-stone-100 text-xs text-stone-600 italic bg-stone-50/70 p-2.5 rounded-lg border">
                        <p className="line-clamp-3">"{place.reviewSnippets[0]}"</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* AI Neighborhood Recommendations Summary */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-wider text-stone-700 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>Hostel Resident Insights & Recommendations</span>
              </h2>
            </div>

            <div className="bg-white rounded-xl border border-stone-200 p-6 shadow-xs space-y-4">
              <div className="prose prose-stone prose-sm max-w-none text-stone-800 leading-relaxed whitespace-pre-line">
                {result.text}
              </div>

              {result.places.length > 0 && (
                <div className="pt-4 border-t border-stone-100 flex flex-wrap items-center gap-2 text-xs text-stone-500">
                  <span className="font-semibold text-stone-700">Quick Links:</span>
                  {result.places.slice(0, 5).map((p, idx) => (
                    <a
                      key={p.id}
                      href={p.uri}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-emerald-600 hover:text-emerald-800 underline font-medium"
                    >
                      <span>{p.title}</span>
                      <ExternalLink className="w-3 h-3" />
                      {idx < Math.min(result.places.length, 5) - 1 && <span className="text-stone-300">·</span>}
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
