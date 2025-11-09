import { useEffect, useMemo, useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { onAuthStateChanged, User } from 'firebase/auth'
import {
  addDoc,
  arrayRemove,
  arrayUnion,
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc
} from 'firebase/firestore'
import { auth, db } from '../config/firebase'
import Header from '../components/Header'

interface EventForm {
  title: string
  date: string
  time: string
  location: string
  description: string
  distance: string
}

interface EventRecord {
  id: string
  title: string
  date: string
  time?: string
  location: string
  description?: string
  distance?: string
  eventDateTime?: string
  createdBy: string
  createdByName?: string
  participants?: string[]
  createdAt?: { seconds: number; nanoseconds: number }
}

export default function EventsPage() {
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [events, setEvents] = useState<EventRecord[]>([])
  const [form, setForm] = useState<EventForm>({
    title: '',
    date: '',
    time: '',
    location: '',
    description: '',
    distance: ''
  })
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user)
    })

    const eventsQuery = query(collection(db, 'events'), orderBy('eventDateTime', 'asc'))
    const unsubEvents = onSnapshot(eventsQuery, (snapshot) => {
      const mapped = snapshot.docs.map((docSnap) => {
        const data = docSnap.data() as any
        return {
          id: docSnap.id,
          ...data,
          participants: data.participants || [],
        } as EventRecord
      })
      setEvents(mapped)
      setLoading(false)
    }, (err) => {
      console.error('Error loading events:', err)
      setError('We could not load events right now. Please try again shortly.')
      setLoading(false)
    })

    return () => {
      unsubAuth()
      unsubEvents()
    }
  }, [])

  const upcomingEvents = useMemo(() => {
    const now = new Date()
    return events.filter(ev => {
      if (!ev.eventDateTime) return true
      return new Date(ev.eventDateTime) >= now
    })
  }, [events])

  const pastEvents = useMemo(() => {
    const now = new Date()
    return events.filter(ev => {
      if (!ev.eventDateTime) return false
      return new Date(ev.eventDateTime) < now
    })
  }, [events])

  const resetForm = () => {
    setForm({ title: '', date: '', time: '', location: '', description: '', distance: '' })
  }

  const handleChange = (field: keyof EventForm) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }))
  }

  const validateForm = () => {
    if (!form.title.trim()) return 'Please add an event name.'
    if (!form.date) return 'Pick a date so everyone can plan.'
    if (!form.location.trim()) return 'Add a meetup location.'
    return null
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    const validationError = validateForm()
    if (validationError) {
      setError(validationError)
      return
    }
    if (!currentUser) {
      setError('You need to be logged in to create an event.')
      return
    }

    try {
      setIsSubmitting(true)
      const profileRef = doc(db, 'users', currentUser.uid)
      const profileSnap = await getDoc(profileRef)
      const profileData = profileSnap.exists() ? profileSnap.data() : null
      const eventDateTime = form.time
        ? new Date(`${form.date}T${form.time}`)
        : new Date(`${form.date}T00:00:00`)

      await addDoc(collection(db, 'events'), {
        title: form.title.trim(),
        date: form.date,
        time: form.time,
        location: form.location.trim(),
        distance: form.distance.trim(),
        description: form.description.trim(),
        eventDateTime: eventDateTime.toISOString(),
        createdAt: serverTimestamp(),
        createdBy: currentUser.uid,
        createdByName: profileData?.name || currentUser.email,
        participants: [currentUser.uid],
      })

      setSuccess('Event published! You can see it in the upcoming list below.')
      resetForm()
    } catch (err) {
      console.error('Error creating event:', err)
      setError('We could not save that event. Please try again.')
    } finally {
      setIsSubmitting(false)
      setTimeout(() => setSuccess(null), 4000)
    }
  }

  const handleJoin = async (record: EventRecord) => {
    if (!currentUser) {
      router.push('/login?redirect=/events')
      return
    }

    try {
      const ref = doc(db, 'events', record.id)
      await updateDoc(ref, {
        participants: arrayUnion(currentUser.uid),
      })
      setSuccess('You are on the list!')
    } catch (err) {
      console.error('Error joining event:', err)
      setError('We could not add you right now. Please try again.')
    }
  }

  const handleLeave = async (record: EventRecord) => {
    if (!currentUser) return
    try {
  const ref = doc(db, 'events', record.id)
  await updateDoc(ref, { participants: arrayRemove(currentUser.uid) })
      setSuccess('Event updated.')
    } catch (err) {
      console.error('Error leaving event:', err)
      setError('We could not update that event right now.')
    }
  }

  const isJoining = (record: EventRecord) => {
    if (!currentUser) return false
    return (record.participants || []).includes(currentUser.uid)
  }

  return (
    <>
      <Head>
        <title>Events | Sweat Socks Society</title>
        <meta
          name="description"
          content="Find and create group workouts, shakeouts, and training sessions with Sweat Socks Society."
        />
      </Head>

  <Header />

  <div className="min-h-screen bg-gray-50 pt-32 pb-16 px-6 md:px-16 lg:px-24">
        <div className="max-w-5xl mx-auto space-y-10">
          <header className="space-y-3 text-center md:text-left">
            <p className="uppercase tracking-wide text-sm text-blue-700/80">Events</p>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900">Plan your next sweat session</h1>
            <p className="text-base text-slate-600 max-w-2xl">
              Browse upcoming workouts hosted by the community or publish your own run, ride, or strength meetup.
            </p>
          </header>

          {error && (
            <div role="alert" className="card border border-red-300 bg-red-50 text-red-700">
              {error}
            </div>
          )}
          {success && (
            <div role="status" className="card border border-emerald-300 bg-emerald-50 text-emerald-700">
              {success}
            </div>
          )}

          <section className="card" aria-labelledby="create-event-heading">
            <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
              <h2 id="create-event-heading" className="text-xl font-semibold text-slate-900">Host an event</h2>
              {!currentUser && (
                <Link href="/login" className="btn-secondary text-sm">Login to publish</Link>
              )}
            </div>

            <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
              <label className="flex flex-col text-sm font-medium text-slate-700">
                Event name
                <input
                  value={form.title}
                  onChange={handleChange('title')}
                  className="mt-1 rounded-md border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  placeholder="Sunrise tempo run"
                  required
                />
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col text-sm font-medium text-slate-700">
                  Date
                  <input
                    type="date"
                    value={form.date}
                    onChange={handleChange('date')}
                    className="mt-1 rounded-md border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    required
                  />
                </label>
                <label className="flex flex-col text-sm font-medium text-slate-700">
                  Time
                  <input
                    type="time"
                    value={form.time}
                    onChange={handleChange('time')}
                    className="mt-1 rounded-md border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  />
                </label>
              </div>

              <label className="flex flex-col text-sm font-medium text-slate-700 md:col-span-2">
                Meetup location
                <input
                  value={form.location}
                  onChange={handleChange('location')}
                  className="mt-1 rounded-md border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  placeholder="City park, trailhead, gym..."
                  required
                />
              </label>

              <label className="flex flex-col text-sm font-medium text-slate-700">
                Distance (optional)
                <input
                  value={form.distance}
                  onChange={handleChange('distance')}
                  className="mt-1 rounded-md border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  placeholder="10K, 40km ride, 60min"
                />
              </label>

              <label className="flex flex-col text-sm font-medium text-slate-700 md:col-span-2">
                Details
                <textarea
                  value={form.description}
                  onChange={handleChange('description')}
                  rows={3}
                  className="mt-1 rounded-md border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  placeholder="Pace, terrain, bring a towel..."
                />
              </label>

              <div className="md:col-span-2 flex justify-end">
                <button type="submit" className="btn-primary px-6 disabled:opacity-60" disabled={isSubmitting}>
                  {isSubmitting ? 'Publishing…' : 'Publish event'}
                </button>
              </div>
            </form>
          </section>

          <section className="space-y-6" aria-live="polite">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <h2 className="text-xl font-semibold text-slate-900">Upcoming events</h2>
              <span className="text-sm text-slate-500">{upcomingEvents.length} planned</span>
            </div>

            {loading ? (
              <div className="card text-center">Loading events…</div>
            ) : upcomingEvents.length === 0 ? (
              <div className="card text-center text-slate-500">
                No upcoming sessions yet. Be the first to host something inspiring!
              </div>
            ) : (
              <div className="grid gap-4">
                {upcomingEvents.map((event) => {
                  const joined = isJoining(event)
                  const count = event.participants?.length || 0
                  return (
                    <article key={event.id} className="card">
                      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                        <div>
                          <h3 className="text-lg font-semibold text-slate-900">{event.title}</h3>
                          <p className="text-sm text-slate-600">
                            {event.date && new Date(event.eventDateTime || event.date).toLocaleString([], { dateStyle: 'medium', timeStyle: event.time ? 'short' : undefined })}
                          </p>
                        </div>
                        <div className="text-sm text-slate-500">
                          Hosted by {event.createdByName || 'Sweat Socks Society' }
                        </div>
                      </header>

                      <dl className="mt-4 grid gap-2 text-sm text-slate-600 md:grid-cols-3">
                        <div>
                          <dt className="font-medium text-slate-700">Where</dt>
                          <dd>{event.location}</dd>
                        </div>
                        {event.distance && (
                          <div>
                            <dt className="font-medium text-slate-700">Distance</dt>
                            <dd>{event.distance}</dd>
                          </div>
                        )}
                        <div>
                          <dt className="font-medium text-slate-700">Crew</dt>
                          <dd>{count} going</dd>
                        </div>
                      </dl>

                      {event.description && (
                        <p className="mt-4 text-sm text-slate-600">{event.description}</p>
                      )}

                      <div className="mt-6 flex flex-col sm:flex-row sm:items-center gap-3">
                        <button
                          onClick={() => (joined ? handleLeave(event) : handleJoin(event))}
                          className="btn-primary text-sm px-5"
                        >
                          {joined ? 'Leave event' : 'I’m in'}
                        </button>
                        <a
                          className="btn-secondary text-sm px-5"
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.location)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Open in Maps
                        </a>
                      </div>
                    </article>
                  )
                })}
              </div>
            )}
          </section>

          {pastEvents.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900">Past events</h2>
                <span className="text-sm text-slate-400">For reference & inspo</span>
              </div>
              <div className="grid gap-3">
                {pastEvents.slice(0, 5).map((event) => (
                  <article key={event.id} className="card">
                    <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                      <h3 className="font-semibold text-slate-900">{event.title}</h3>
                      <span className="text-sm text-slate-500">
                        {event.date && new Date(event.eventDateTime || event.date).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                      </span>
                    </header>
                    {event.description && (
                      <p className="mt-2 text-sm text-slate-600">{event.description}</p>
                    )}
                  </article>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </>
  )
}
