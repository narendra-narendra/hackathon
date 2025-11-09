import { useState } from 'react'
import { auth, db } from '../config/firebase'
import { collection, addDoc } from 'firebase/firestore'

export default function ActivityForm() {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    activityType: 'Run',
    startLocation: '',
    endLocation: '',
    time: '',
    targetPace: '',
    description: '',
    experienceLevel: 'All Levels',
    maxParticipants: 0,
    distance: '',
    duration: '',
    terrainType: 'Road',
    weatherPreference: 'Any'
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const user = auth.currentUser
      if (!user) return

      await addDoc(collection(db, 'activities'), {
        ...formData,
        userId: user.uid,
        userName: user.displayName || 'Anonymous',
        createdAt: new Date().toISOString(),
        status: 'active'
      })

      // Reset form
      setFormData({
        activityType: 'Run',
        startLocation: '',
        endLocation: '',
        time: '',
        targetPace: '',
        description: '',
        experienceLevel: 'All Levels',
        maxParticipants: 0,
        distance: '',
        duration: '',
        terrainType: 'Road',
        weatherPreference: 'Any'
      })
      
    } catch (error) {
      console.error('Error posting activity:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
  <div className="bg-white rounded-lg shadow p-4 transition-transform duration-150">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Activity Type</label>
          <select
            name="activityType"
            value={formData.activityType}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2 bg-white"
          >
            <option>Run</option>
            <option>Bike</option>
            <option>Swim</option>
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Start Location</label>
            <input
              name="startLocation"
              value={formData.startLocation}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
              placeholder="Enter start location"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">End Location</label>
            <input
              name="endLocation"
              value={formData.endLocation}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
              placeholder="Enter end location"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Preferred Time</label>
            <input
              name="time"
              value={formData.time}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
              placeholder="e.g., 6:00 AM"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Target Pace/Distance</label>
            <input
              name="targetPace"
              value={formData.targetPace}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
              placeholder="e.g., 5:30/km or 10km"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
            rows={3}
            placeholder="Add any additional details..."
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Distance</label>
            <input
              name="distance"
              value={formData.distance}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
              placeholder="e.g., 5km"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Duration</label>
            <input
              name="duration"
              value={formData.duration}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
              placeholder="e.g., 30 minutes"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Experience Level</label>
            <select
              name="experienceLevel"
              value={formData.experienceLevel}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2 bg-white"
            >
              <option>All Levels</option>
              <option>Beginner</option>
              <option>Intermediate</option>
              <option>Advanced</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Max Participants</label>
            <input
              name="maxParticipants"
              type="number"
              value={formData.maxParticipants}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
              placeholder="0 for unlimited"
              min="0"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Terrain Type</label>
            <select
              name="terrainType"
              value={formData.terrainType}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2 bg-white"
            >
              <option>Road</option>
              <option>Trail</option>
              <option>Track</option>
              <option>Mixed</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Weather Preference</label>
            <select
              name="weatherPreference"
              value={formData.weatherPreference}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2 bg-white"
            >
              <option>Any</option>
              <option>Fair weather only</option>
              <option>Rain or shine</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="bg-primary text-white rounded-full px-6 py-3 font-semibold hover:opacity-95 shadow-md transition-all duration-150 transform disabled:opacity-50"
          >
            {loading ? 'Posting...' : 'Post Activity'}
          </button>
        </div>
      </form>
    </div>
  )
}
