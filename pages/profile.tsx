import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { auth, db } from '../config/firebase'
import { signOut } from 'firebase/auth'
import { doc, getDoc, updateDoc } from 'firebase/firestore'

export default function Profile(){
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  
  const handleLogout = async () => {
    try {
      await signOut(auth)
      router.push('/')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const [profile, setProfile] = useState({
    name: '',
    age: '',
    gender: '',
    location: '',
    interests: [],
    level: 'Beginner'
  })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const user = auth.currentUser
        if (!user) {
          router.push('/login')
          return
        }

        const userDoc = await getDoc(doc(db, 'users', user.uid))
        if (userDoc.exists()) {
          const data = userDoc.data()
          setProfile({
            name: data.name || '',
            age: data.age || '',
            gender: data.gender || '',
            location: data.location || '',
            interests: data.interests || [],
            level: data.level || 'Beginner'
          })
        }
        setLoading(false)
      } catch (error) {
        console.error('Error loading profile:', error)
        setLoading(false)
      }
    }

    loadProfile()
  }, [router])

  useEffect(() => {
    if (!router.isReady) return
    const editQuery = router.query.edit
    if (editQuery === 'true') {
      setEditing(true)
    } else if (editQuery === 'false') {
      setEditing(false)
    }
  }, [router.isReady, router.query.edit])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSaving(true)

    try {
      const user = auth.currentUser
      if (!user) {
        setError('You must be logged in to update your profile')
        return
      }

      // Validate required fields
      if (!profile.name || !profile.location) {
        setError('Name and location are required')
        return
      }

      await updateDoc(doc(db, 'users', user.uid), profile)
      setEditing(false)
    } catch (error) {
      console.error('Error updating profile:', error)
      setError('Failed to update profile. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  function onChange(e: any){
    const { name, value } = e.target
    setProfile(prev => ({ ...prev, [name]: value }))
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-12">
      <div className="max-w-3xl mx-auto">
        <header className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Profile</h1>
          <div className="flex gap-3">
            <button className="btn-primary" onClick={() => setEditing(!editing)}>{editing ? 'Cancel' : 'Edit Profile'}</button>
            <button onClick={handleLogout} className="border rounded px-3 py-2 hover:bg-gray-50">Logout</button>
          </div>
        </header>

        <section className="card p-6">
          {!editing ? (
            <div className="space-y-4">
              <div>
                <div className="text-2xl font-semibold">{profile.name}</div>
                <div className="text-sm text-gray-600 mt-1">
                  {profile.age && `${profile.age} years old`} 
                  {profile.age && profile.gender && ' • '}
                  {profile.gender}
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="text-sm font-medium text-gray-500">Location</div>
                <div className="mt-1">{profile.location || 'No location set'}</div>
              </div>

              <div className="border-t pt-4">
                <div className="text-sm font-medium text-gray-500">Activity Level</div>
                <div className="mt-1">{profile.level}</div>
              </div>

              <div className="border-t pt-4">
                <div className="text-sm font-medium text-gray-500">Activity Interests</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {profile.interests.length === 0 ? (
                    <span className="text-gray-500">No interests selected</span>
                  ) : (
                    profile.interests.map(interest => (
                      <span 
                        key={interest}
                        className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm"
                      >
                        {interest}
                      </span>
                    ))
                  )}
                </div>
              </div>
            </div>
          ) : (
            <form className="space-y-4" onSubmit={handleSubmit}>
              {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded">
                  {error}
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input 
                  name="name" 
                  value={profile.name} 
                  onChange={onChange} 
                  className="w-full border rounded px-3 py-2" 
                  placeholder="Your name"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Age</label>
                  <input 
                    name="age" 
                    value={profile.age as any} 
                    onChange={onChange} 
                    className="w-full border rounded px-3 py-2" 
                    placeholder="Your age"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Gender</label>
                  <select 
                    name="gender" 
                    value={profile.gender} 
                    onChange={onChange} 
                    className="w-full border rounded px-3 py-2"
                  >
                    <option value="">Select Gender</option>
                    <option>Female</option>
                    <option>Male</option>
                    <option>Non-binary</option>
                    <option>Prefer not to say</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Location</label>
                <input 
                  name="location" 
                  value={profile.location} 
                  onChange={onChange} 
                  className="w-full border rounded px-3 py-2" 
                  placeholder="City, State"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Activity Level</label>
                <select 
                  name="level" 
                  value={profile.level} 
                  onChange={onChange} 
                  className="w-full border rounded px-3 py-2"
                >
                  <option>Beginner</option>
                  <option>Intermediate</option>
                  <option>Advanced</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Activity Interests</label>
                <div className="flex flex-wrap gap-2">
                  {['Run', 'Bike', 'Swim'].map(activity => (
                    <button
                      key={activity}
                      type="button"
                      onClick={() => {
                        const newInterests = profile.interests.includes(activity)
                          ? profile.interests.filter(i => i !== activity)
                          : [...profile.interests, activity]
                        setProfile(prev => ({ ...prev, interests: newInterests }))
                      }}
                      className={`px-4 py-2 rounded-full border transition-colors ${
                        profile.interests.includes(activity)
                          ? 'bg-primary text-white border-primary'
                          : 'bg-white text-gray-700 border-gray-300 hover:border-primary'
                      }`}
                    >
                      {activity}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setEditing(false)} 
                  className="px-4 py-2 border rounded hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={saving}
                  className="btn-primary disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          )}
        </section>
        {loading && (
          <div className="text-center py-4">
            Loading...
          </div>
        )}
      </div>
    </div>
  )
}
