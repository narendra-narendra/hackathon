import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { sendConnectionRequest, createChat, getConnectionStatus } from '../utils/connections'

type Athlete = {
  id: string,
  name: string,
  interests?: string[],
  level?: string,
  location?: string,
  avatar?: string,
  matchReason?: {
    location: boolean,
    locationDetail: string,
    interests: boolean,
    sharedInterests: string[]
  },
  matchScore?: number
}

export default function AthleteCard({ athlete }: { athlete: Athlete }) {
  const router = useRouter()
  const [connectionStatus, setConnectionStatus] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Get initial connection status
    getConnectionStatus(athlete.id).then(status => setConnectionStatus(status))
  }, [athlete.id])

  const handleConnect = async () => {
    setLoading(true)
    try {
      await sendConnectionRequest(athlete.id)
      setConnectionStatus('pending')
    } catch (error: any) {
      alert(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleMessage = async () => {
    setLoading(true)
    try {
      const chatId = await createChat(athlete.id)
      router.push(`/messages?chat=${chatId}`)
    } catch (error: any) {
      alert(error.message)
    } finally {
      setLoading(false)
    }
  }

  const canMessage = connectionStatus === 'connected' || connectionStatus === 'pending'
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-indigo-100 bg-indigo-50/80 p-4 shadow-[0_20px_45px_-25px_rgba(79,70,229,0.45)] transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-[0_30px_60px_-35px_rgba(79,70,229,0.5)]">
      <div className="relative">
        <img
          src={athlete.avatar || "/avatar-placeholder.png"}
          alt={`${athlete.name}'s avatar`}
          className="h-16 w-16 rounded-full bg-gray-100 object-cover"
        />
        <div
          className={`absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-white
            ${connectionStatus === 'connected' ? 'bg-green-500' :
              connectionStatus === 'pending' ? 'bg-yellow-500' : 'bg-gray-300'}`}
        />
      </div>

      <div className="flex-1">
        <div className="font-semibold text-slate-900">{athlete.name}</div>
        <div className="text-sm text-slate-600">Level: {athlete.level}</div>
        <div className="text-sm text-slate-500">{athlete.location}</div>
        {athlete.interests && (
          <div className="mt-1 text-sm text-slate-600">
            Interests: {athlete.interests.join(', ')}
          </div>
        )}
        {athlete.matchReason && (
          <div className="mt-1 text-xs text-indigo-700">
            {athlete.matchReason.location && (
              <span>📍 {athlete.matchReason.locationDetail}</span>
            )}
            {athlete.matchReason.location && athlete.matchReason.interests && ' • '}
            {athlete.matchReason.interests && (
              <span>🎯 {athlete.matchReason.sharedInterests.length} shared {athlete.matchReason.sharedInterests.length === 1 ? 'activity' : 'activities'}</span>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2">
        {connectionStatus === 'connected' ? (
          <span className="text-center text-sm font-medium text-indigo-700">Connected ✓</span>
        ) : connectionStatus === 'pending' ? (
          <span className="text-center text-sm font-medium text-amber-600">Request Sent</span>
        ) : (
          <button
            onClick={handleConnect}
            disabled={loading}
            className="btn-primary w-28 disabled:opacity-50"
          >
            {loading ? '...' : 'Connect'}
          </button>
        )}

        <button
          onClick={handleMessage}
          disabled={loading || !canMessage}
          className="rounded border border-indigo-200 bg-white/70 px-3 py-1 text-sm font-medium text-indigo-700 transition hover:bg-white disabled:opacity-50 disabled:hover:bg-white"
        >
          {connectionStatus === 'pending' ? 'Message (pending)' : 'Message'}
        </button>
        {!canMessage && (
          <span className="text-center text-xs text-indigo-500/70">Send a request to unlock chat.</span>
        )}
      </div>
    </div>
  )
}
