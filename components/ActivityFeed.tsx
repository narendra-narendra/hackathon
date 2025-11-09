import { useState, useEffect } from 'react'
import { auth, db } from '../config/firebase'
import { collection, query, getDocs, orderBy, where, limit } from 'firebase/firestore'
import { calculateDistance, geocodeLocation } from '../utils/distance'
import Comments from './Comments'

type Activity = {
  id: string
  userId: string
  userName: string
  activityType: string
  startLocation: string
  endLocation: string
  time: string
  targetPace: string
  description: string
  createdAt: string
  status: string
  experienceLevel: string
  maxParticipants: number
  distance: string
  duration: string
  terrainType: string
  weatherPreference: string
  distanceFromUser?: number
}

type Props = {
  userLocation?: string
  userInterests?: string[]
}

export default function ActivityFeed({ userLocation, userInterests }: Props) {
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [maxDistance, setMaxDistance] = useState<number>(10) // 10km default
  const [selectedActivityType, setSelectedActivityType] = useState<string>('All')
  const [experienceLevel, setExperienceLevel] = useState<string>('All')

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const currentUser = auth.currentUser
        if (!currentUser) return

        // Get user's coordinates
        const userCoords = userLocation ? await geocodeLocation(userLocation) : null

        // Query activities
        const activitiesQuery = query(
          collection(db, 'activities'),
          where('status', '==', 'active'),
          orderBy('createdAt', 'desc'),
          limit(20)
        )

        const snapshot = await getDocs(activitiesQuery)
        const fetchedActivities = await Promise.all(
          snapshot.docs.map(async doc => {
            const activity = { id: doc.id, ...doc.data() } as Activity
            
            // Calculate distance if we have user location
            if (userCoords) {
              const activityCoords = await geocodeLocation(activity.startLocation)
              if (activityCoords) {
                activity.distanceFromUser = calculateDistance(userCoords, activityCoords)
              }
            }
            
            return activity
          })
        )

        // Sort by distance and relevance
        const sortedActivities = fetchedActivities
          .sort((a, b) => {
            // Prioritize distance if available
            if (a.distanceFromUser && b.distanceFromUser) {
              if (Math.abs(a.distanceFromUser - b.distanceFromUser) > 1) {
                return a.distanceFromUser - b.distanceFromUser
              }
            }
            
            // Then consider activity type match
            const aActivityMatch = userInterests?.includes(a.activityType) || false
            const bActivityMatch = userInterests?.includes(b.activityType) || false
            
            if (aActivityMatch !== bActivityMatch) {
              return aActivityMatch ? -1 : 1
            }
            
            // Finally sort by date
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          })

        setActivities(fetchedActivities)
      } catch (error) {
        console.error('Error fetching activities:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchActivities()
  }, [userLocation, userInterests])

  if (loading) {
    return <div className="text-center py-4">Loading activities...</div>
  }

  if (activities.length === 0) {
    return (
      <div className="text-center py-4 text-gray-500">
        No activities found in your area. Be the first to post one!
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
        <h3 className="text-sm font-semibold mb-3">Filter Activities</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs mb-1">Distance (km)</label>
            <select
              value={maxDistance}
              onChange={(e) => setMaxDistance(Number(e.target.value))}
              className="w-full border rounded px-2 py-1 text-sm"
            >
              <option value={5}>Within 5km</option>
              <option value={10}>Within 10km</option>
              <option value={20}>Within 20km</option>
              <option value={50}>Within 50km</option>
              <option value={9999}>Any distance</option>
            </select>
          </div>
          <div>
            <label className="block text-xs mb-1">Activity Type</label>
            <select
              value={selectedActivityType}
              onChange={(e) => setSelectedActivityType(e.target.value)}
              className="w-full border rounded px-2 py-1 text-sm"
            >
              <option>All</option>
              <option>Run</option>
              <option>Bike</option>
              <option>Swim</option>
            </select>
          </div>
          <div>
            <label className="block text-xs mb-1">Experience Level</label>
            <select
              value={experienceLevel}
              onChange={(e) => setExperienceLevel(e.target.value)}
              className="w-full border rounded px-2 py-1 text-sm"
            >
              <option>All</option>
              <option>Beginner</option>
              <option>Intermediate</option>
              <option>Advanced</option>
            </select>
          </div>
        </div>
      </div>

      {/* Activities */}
      {activities
        .filter(activity => 
          (selectedActivityType === 'All' || activity.activityType === selectedActivityType) &&
          (experienceLevel === 'All' || activity.experienceLevel === experienceLevel || activity.experienceLevel === 'All Levels') &&
          (!activity.distanceFromUser || activity.distanceFromUser <= maxDistance)
        )
        .map(activity => (
  <div key={activity.id} className="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow transition-transform duration-150 hover:-translate-y-1">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h3 className="font-semibold text-lg">{activity.activityType}</h3>
              <p className="text-sm text-gray-600">{activity.userName}</p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">
                {new Date(activity.createdAt).toLocaleDateString()}
              </div>
              {activity.distanceFromUser && (
                <div className="text-xs text-blue-600 mt-1">
                  {activity.distanceFromUser.toFixed(1)}km away
                </div>
              )}
            </div>
          </div>
          
          <div className="space-y-2">
            <p className="text-sm">
              <span className="font-medium">Location: </span>
              {activity.startLocation}
              {activity.endLocation && ` to ${activity.endLocation}`}
            </p>
            
            <div className="grid grid-cols-2 gap-2 text-sm">
              <p>
                <span className="font-medium">Time: </span>
                {activity.time}
              </p>
              
              {activity.targetPace && (
                <p>
                  <span className="font-medium">Target Pace: </span>
                  {activity.targetPace}
                </p>
              )}
              
              <p>
                <span className="font-medium">Distance: </span>
                {activity.distance || 'Not specified'}
              </p>
              
              <p>
                <span className="font-medium">Duration: </span>
                {activity.duration || 'Not specified'}
              </p>
              
              <p>
                <span className="font-medium">Experience: </span>
                {activity.experienceLevel}
              </p>
              
              <p>
                <span className="font-medium">Terrain: </span>
                {activity.terrainType}
              </p>
            </div>
            
            {activity.description && (
              <p className="text-sm mt-2 text-gray-700">{activity.description}</p>
            )}

            <div className="text-xs text-gray-500 mt-2">
              {activity.maxParticipants > 0 ? 
                `Limited to ${activity.maxParticipants} participants` : 
                'Unlimited participants'}
              {activity.weatherPreference !== 'Any' && ` • ${activity.weatherPreference}`}
            </div>
          </div>

          <div className="mt-4 flex justify-end space-x-2">
            <button className="bg-white text-primary rounded-full px-6 py-3 font-semibold hover:opacity-95 shadow-md transition-all duration-150 text-sm border border-primary disabled:opacity-50">Message</button>
            <button className="bg-primary text-white rounded-full px-6 py-3 font-semibold hover:opacity-95 shadow-md transition-all duration-150 text-sm disabled:opacity-50">Join Activity</button>
          </div>

          {/* Comments Section */}
          <Comments activityId={activity.id} />
        </div>
      ))}
    </div>
  )
}