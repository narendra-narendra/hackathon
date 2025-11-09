interface Coordinates {
  lat: number;
  lng: number;
}

// Function to calculate distance between two points using Haversine formula
export function calculateDistance(coords1: Coordinates, coords2: Coordinates): number {
  const R = 6371; // Earth's radius in kilometers

  const dLat = toRad(coords2.lat - coords1.lat);
  const dLon = toRad(coords2.lng - coords1.lng);
  const lat1 = toRad(coords1.lat);
  const lat2 = toRad(coords2.lat);

  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
           Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

function toRad(degrees: number): number {
  return degrees * (Math.PI/180);
}

// Function to geocode a location string to coordinates
export async function geocodeLocation(location: string): Promise<Coordinates | null> {
  try {
    const response = await fetch(
      `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(location)}&key=${process.env.NEXT_PUBLIC_GEOCODING_API_KEY}`
    );
    const data = await response.json();
    
    if (data.results && data.results.length > 0) {
      const { lat, lng } = data.results[0].geometry;
      return { lat, lng };
    }
    return null;
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
}