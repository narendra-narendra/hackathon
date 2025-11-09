import { useEffect, useMemo, useState } from 'react'
import { auth, db } from '../config/firebase'
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  getDoc
} from 'firebase/firestore'
import { useRouter } from 'next/router'
import { createChat } from '../utils/connections'

type Request = {
  id: string
  fromUserId: string
  fromUserName: string
  fromUserAvatar?: string
  status: string
  createdAt: any
}

export default function ConnectionRequests() {
  const router = useRouter()
  const [requests, setRequests] = useState<Request[]>([])
  const [loading, setLoading] = useState(true)
  const [connecting, setConnecting] = useState<string | null>(null)

  useEffect(() => {
    fetchRequests()
  }, [])

  const fetchRequests = async () => {
    try {
      const currentUser = auth.currentUser
      if (!currentUser) return

      const requestsQuery = query(
        collection(db, 'connections'),
        where('toUserId', '==', currentUser.uid),
        where('status', '==', 'pending')
      )

      const snapshot = await getDocs(requestsQuery)
      const requestsData = await Promise.all(
        snapshot.docs.map(async (requestDoc) => {
          const data = requestDoc.data()
          // Get sender's user details
          const senderDoc = await getDoc(doc(db, 'users', data.fromUserId))
          const senderData = senderDoc.data()
          return {
            id: requestDoc.id,
            ...data,
            fromUserName: senderData?.name || 'Unknown User',
            fromUserAvatar: senderData?.avatar || null
          }
        })
      )
      setRequests(requestsData as Request[])
    } catch (error) {
      console.error('Error fetching requests:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAccept = async (requestId: string) => {
    try {
      const requestRef = doc(db, 'connections', requestId)
      await updateDoc(requestRef, {
        status: 'connected',
        acceptedAt: new Date().toISOString()
      })
      
      // Refresh the requests list
      fetchRequests()
    } catch (error) {
      console.error('Error accepting request:', error)
    }
  }

  const activeRequests = useMemo(
    () => requests.filter((request) => request.status === 'pending'),
    [requests]
  )

  const handleMessage = async (request: Request) => {
    try {
      setConnecting(request.id)
      const chatId = await createChat(request.fromUserId)
      router.push(`/messages?chat=${chatId}`)
    } catch (error) {
      console.error('Error starting chat:', error)
    } finally {
      setConnecting(null)
    }
  }

  const handleDecline = async (requestId: string) => {
    try {
      const requestRef = doc(db, 'connections', requestId)
      await deleteDoc(requestRef)
      
      // Refresh the requests list
      fetchRequests()
    } catch (error) {
      console.error('Error declining request:', error)
    }
  }

  if (loading) {
    return <div className="text-center py-4">Loading requests...</div>
  }

  // Always show the component even if there are no requests
  if (activeRequests.length === 0 && !loading) {
    return (
      <div className="mb-6 rounded-2xl bg-white p-6 shadow">
        <h2 className="text-lg font-semibold mb-2">Connection Requests</h2>
        <p className="text-sm text-gray-500">No pending requests</p>
      </div>
    )
  }

  return (
    <div className="mb-6 rounded-2xl bg-white p-6 shadow">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-lg font-semibold">Connection Requests</h2>
          <p className="text-sm text-slate-500">Approve and jump straight into a conversation.</p>
        </div>
        <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-600">
          {activeRequests.length} pending
        </span>
      </div>
      <div className="space-y-3">
        {activeRequests.map((request) => (
          <div key={request.id} className="flex flex-wrap items-center justify-between gap-4 border-b pb-4 last:border-none">
            <div className="flex items-center gap-3">
              <img
                src={request.fromUserAvatar || "/avatar-placeholder.png"}
                alt={`${request.fromUserName}'s avatar`}
                className="w-10 h-10 rounded-full object-cover"
              />
              <div>
                <div className="font-medium">{request.fromUserName}</div>
                <div className="text-xs text-gray-500">
                  Sent {new Date(request.createdAt?.toDate()).toLocaleDateString()}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleDecline(request.id)}
                className="rounded px-3 py-1 text-sm border border-red-500 text-red-500 hover:bg-red-50"
              >
                Decline
              </button>
              <button
                onClick={() => handleAccept(request.id)}
                className="rounded px-3 py-1 text-sm bg-primary text-white hover:bg-primary-dark"
              >
                Accept
              </button>
              <button
                onClick={() => handleMessage(request)}
                disabled={connecting === request.id}
                className="rounded px-3 py-1 text-sm border border-indigo-500 text-indigo-600 hover:bg-indigo-50 disabled:opacity-60"
              >
                {connecting === request.id ? 'Opening…' : 'Message'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}