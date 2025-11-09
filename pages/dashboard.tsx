import { useState, useEffect } from 'react'
import Link from 'next/link'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { auth, db } from '../config/firebase'
import { onAuthStateChanged, User } from 'firebase/auth'
import { collection, doc, getDoc, getDocs, limit, orderBy, query, where } from 'firebase/firestore'
import AthleteCard from '../components/AthleteCard'
import ConnectionRequests from '../components/ConnectionRequests'
import { SHOP_ITEMS } from '../utils/shopItems'
import Header from '../components/Header'

type EventPreview = {
  id: string
  title?: string
  eventDateTime?: string
  date?: string
  time?: string
  location?: string
  distance?: string
  participants?: string[]
  createdByName?: string
}

type FeedPreview = {
  id: string
  title?: string
  content?: string
  createdByName?: string
  createdAt?: { seconds: number; nanoseconds: number }
  mediaUrl?: string | null
  mediaType?: string
}

export default function Dashboard() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [connections, setConnections] = useState([])
  const [suggestions, setSuggestions] = useState([])
  const [upcomingEvents, setUpcomingEvents] = useState<EventPreview[]>([])
  const [recentPosts, setRecentPosts] = useState<FeedPreview[]>([])
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        setUser(null)
        setConnections([])
        setSuggestions([])
        setLoading(false)
        router.replace('/login')
        return
      }

      setLoading(true)
      await loadDashboardData(currentUser)
    })

    return () => unsubscribe()
  }, [router])

  const loadDashboardData = async (currentUser: User) => {
    try {
      // Get user data
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid))
      if (userDoc.exists()) {
        setUser(userDoc.data())
      }

      // Get connections (both where user is sender or receiver)
      const [incomingConnections, outgoingConnections] = await Promise.all([
        getDocs(query(
          collection(db, 'connections'),
          where('toUserId', '==', currentUser.uid),
          where('status', '==', 'connected')
        )),
        getDocs(query(
          collection(db, 'connections'),
          where('fromUserId', '==', currentUser.uid),
          where('status', '==', 'connected')
        ))
      ])

      // Combine and process connections
      const allConnections = [...incomingConnections.docs, ...outgoingConnections.docs]
      const connectionsData = await Promise.all(
        allConnections.map(async (connectionDoc) => {
          const connection = connectionDoc.data()
          const otherUserId = connection.fromUserId === currentUser.uid 
            ? connection.toUserId 
            : connection.fromUserId

          const userDoc = await getDoc(doc(db, 'users', otherUserId))
          const userData = userDoc.data()

          return {
            id: otherUserId,
            name: userData?.name || 'Unknown User',
            avatar: userData?.avatar,
            level: userData?.level,
            location: userData?.location,
            interests: userData?.interests || [],
            connectionId: connectionDoc.id,
            status: 'connected'
          }
        })
      )
      setConnections(connectionsData)

      // Get suggestions based on interests
      if (userDoc.exists()) {
        const userData = userDoc.data()
        const userInterests = userData.interests || []
        const userLocation = userData.location || ''
        
        // Get all users
        const usersQuery = query(collection(db, 'users'))
        const usersSnapshot = await getDocs(usersQuery)
        
        // Process and filter users
        const suggestionsData = usersSnapshot.docs
          .filter(doc => doc.id !== currentUser.uid) // Exclude current user
          .map(doc => {
            const userData = doc.data()
            const userLoc = userData.location?.toLowerCase() || ''
            const currentLoc = userLocation.toLowerCase()
            
            // Calculate match scores
            const sameCity = userLoc.split(',')[0] === currentLoc.split(',')[0]
            const sameState = userLoc.split(',')[1]?.trim() === currentLoc.split(',')[1]?.trim()
            const locationScore = sameCity ? 2 : sameState ? 1 : 0
            
            const matchingInterests = userData.interests?.filter((interest: string) => 
              userInterests.includes(interest)
            ) || []
            const interestScore = matchingInterests.length
            
            // Calculate total match score
            const totalScore = locationScore + interestScore
            
            return {
              id: doc.id,
              ...userData,
              matchScore: totalScore,
              matchReason: {
                location: sameCity || sameState,
                locationDetail: sameCity ? 'Same city' : sameState ? 'Same state' : '',
                interests: matchingInterests.length > 0,
                sharedInterests: matchingInterests,
              }
            }
          })
          // Filter out users with no matches
          .filter(user => user.matchScore > 0)
          // Sort by match score (highest first)
          .sort((a, b) => b.matchScore - a.matchScore)
        setSuggestions(suggestionsData)
      }

      const [eventsSnapshot, postsSnapshot] = await Promise.all([
        getDocs(query(
          collection(db, 'events'),
          orderBy('eventDateTime', 'asc'),
          limit(8)
        )),
        getDocs(query(
          collection(db, 'communityPosts'),
          orderBy('createdAt', 'desc'),
          limit(3)
        ))
      ])

      const now = new Date()
      const eventsData = eventsSnapshot.docs
        .map(docSnap => {
          const data = docSnap.data() as any
          return {
            id: docSnap.id,
            ...data,
            participants: data.participants || []
          } as EventPreview
        })
        .filter(event => {
          if (!event.eventDateTime) return true
          return new Date(event.eventDateTime) >= now
        })
      setUpcomingEvents(eventsData)

      const postsData = postsSnapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...(docSnap.data() as any)
      })) as FeedPreview[]
      setRecentPosts(postsData)
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const shopHighlights = SHOP_ITEMS.slice(0, 3)
  const topSuggestions = suggestions.slice(0, 6)

  const formatEventDate = (event: EventPreview) => {
    if (event.eventDateTime) {
      return new Date(event.eventDateTime).toLocaleString([], { dateStyle: 'medium', timeStyle: event.time ? 'short' : undefined })
    }
    if (event.date) {
      return new Date(event.date).toLocaleDateString([], { dateStyle: 'medium' })
    }
    return 'TBD'
  }

  const formatPostDate = (post: FeedPreview) => {
    if (post.createdAt?.seconds) {
      return new Date(post.createdAt.seconds * 1000).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })
    }
    return 'Just now'
  }

  return (
    <>
      <Head>
        <title>Dashboard | Sweat Socks Society</title>
        <meta
          name="description"
          content="Catch up on your Sweat Socks Society network, discover upcoming events, and see what the crew is sharing."
        />
      </Head>

      <Header />

      <div className="min-h-screen bg-gradient-to-b from-indigo-50 via-white to-white pt-32 pb-16 px-6 md:px-12 lg:px-16">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-10">
          <section className="space-y-2 text-center md:text-left">
            <p className="text-sm uppercase tracking-wide text-indigo-600/80">Dashboard</p>
            <h1 className="text-3xl font-bold text-slate-900 md:text-4xl">Welcome back, {user?.name || 'Athlete'}</h1>
            <p className="mx-auto max-w-2xl text-base text-slate-600 md:mx-0">
              Catch up on your crew’s latest sessions, track upcoming meetups, and find new training partners without leaving the hub.
            </p>
          </section>

          {loading ? (
            <div className="rounded-2xl bg-white p-10 text-center text-slate-500 shadow-lg">
              Loading your community...
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-3">
              <div className="space-y-6 md:col-span-2">
                <ConnectionRequests />

                <div className="card">
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-slate-900">Community feed</h2>
                    <Link
                      href="/feed"
                      className="text-sm text-indigo-600 underline-offset-2 hover:text-indigo-700 hover:underline"
                    >
                      View all
                    </Link>
                  </div>
                  <div className="space-y-4">
                    {recentPosts.length === 0 ? (
                      <p className="text-slate-600">Share your latest session to spark the conversation.</p>
                    ) : (
                      recentPosts.map((post) => (
                        <div key={post.id} className="space-y-3 rounded-lg bg-indigo-50/80 p-4">
                          {post.mediaUrl && (
                            <figure className="overflow-hidden rounded-lg border border-indigo-200 bg-white">
                              <img
                                src={post.mediaUrl}
                                alt={post.title || 'Community highlight'}
                                className="h-32 w-full object-cover"
                              />
                            </figure>
                          )}
                          <h3 className="text-lg font-semibold text-slate-900">{post.title || 'Community highlight'}</h3>
                          <p className="text-sm text-indigo-700">
                            {post.createdByName || 'Sweat Socks Society athlete'} · {formatPostDate(post)}
                          </p>
                          <p className="mt-2 text-sm text-slate-700 line-clamp-3">{post.content}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="card p-6">
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div>
                      <h2 className="text-xl font-semibold text-slate-900">Upcoming events</h2>
                      <p className="text-sm text-slate-600">See what the crew is planning next and join the sessions that fit your schedule.</p>
                    </div>
                    <Link
                      href="/events"
                      className="text-sm text-indigo-600 underline-offset-2 hover:text-indigo-700 hover:underline"
                    >
                      View all
                    </Link>
                  </div>
                  {upcomingEvents.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-indigo-200 bg-indigo-50/60 p-6 text-center text-slate-600">
                      No events yet. Head over to the events page to start one.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {upcomingEvents.map((event) => (
                        <article key={event.id} className="rounded-xl border border-indigo-100 bg-indigo-50/70 p-5 shadow-sm">
                          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                            <div>
                              <h3 className="text-lg font-semibold text-slate-900">{event.title || 'Community workout'}</h3>
                              <p className="text-sm text-indigo-700">{formatEventDate(event)}</p>
                            </div>
                            <span className="inline-flex items-center rounded-full bg-white px-3 py-1 text-xs font-medium text-indigo-700 shadow-sm">
                              {(event.participants?.length || 0)} going
                            </span>
                          </div>
                          <dl className="mt-3 grid gap-3 text-sm text-slate-600 md:grid-cols-3">
                            <div>
                              <dt className="font-medium text-slate-700">Where</dt>
                              <dd>{event.location || 'TBD location'}</dd>
                            </div>
                            {event.distance && (
                              <div>
                                <dt className="font-medium text-slate-700">Distance</dt>
                                <dd>{event.distance}</dd>
                              </div>
                            )}
                            {event.createdByName && (
                              <div>
                                <dt className="font-medium text-slate-700">Host</dt>
                                <dd>{event.createdByName}</dd>
                              </div>
                            )}
                          </dl>
                          <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
                            <Link href="/events" className="text-indigo-600 underline-offset-2 hover:text-indigo-700 hover:underline">
                              Join or see details
                            </Link>
                          </div>
                        </article>
                      ))}
                    </div>
                  )}
                </div>

                <div className="card p-6">
                  <h2 className="mb-4 text-xl font-semibold">Your Connections</h2>
                  <div className="space-y-4">
                    {connections.length === 0 ? (
                      <p className="text-slate-500">No connections yet. Check out some suggestions below!</p>
                    ) : (
                      connections.map((connection) => <AthleteCard key={connection.id} athlete={connection} />)
                    )}
                  </div>
                </div>

              </div>

              <aside className="space-y-6">
                <div className="card p-6">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                    <div>
                      <h2 className="text-lg font-semibold">Suggested Athletes</h2>
                      <p className="text-xs text-slate-500">We found training partners who share location or interests with you.</p>
                    </div>
                    {suggestions.length > topSuggestions.length && (
                      <Link
                        href="/search"
                        className="text-xs font-medium text-indigo-600 underline-offset-2 hover:text-indigo-700 hover:underline"
                      >
                        View more
                      </Link>
                    )}
                  </div>
                  <div className="space-y-4">
                    {topSuggestions.length === 0 ? (
                      <p className="text-gray-500">No suggestions available</p>
                    ) : (
                      topSuggestions.map((athlete) => <AthleteCard key={athlete.id} athlete={athlete} />)
                    )}
                  </div>
                </div>

                <div className="card p-6">
                  <h2 className="mb-4 text-lg font-semibold">Gear picks</h2>
                  <div className="space-y-3">
                    {shopHighlights.map((item) => (
                      <div key={item.id} className="rounded-lg bg-slate-100 p-4 text-sm">
                        <div className="flex items-center justify-between gap-3">
                          <h3 className="font-semibold text-slate-900">{item.name}</h3>
                          <span className="text-xs text-slate-500">{item.price}</span>
                        </div>
                        <p className="mt-1 text-slate-600 line-clamp-2">{item.description}</p>
                        <Link
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-2 inline-block text-xs text-indigo-600 underline-offset-2 hover:underline"
                        >
                          Visit store
                        </Link>
                      </div>
                    ))}
                  </div>
                  <Link
                    href="/shop"
                    className="mt-4 inline-block text-sm text-indigo-600 underline-offset-4 hover:text-indigo-700 hover:underline"
                  >
                    Browse the full shop →
                  </Link>
                </div>
              </aside>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
