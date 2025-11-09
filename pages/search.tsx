import { FormEvent, useEffect, useMemo, useState } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { onAuthStateChanged } from 'firebase/auth'
import { collection, getDocs } from 'firebase/firestore'
import AthleteCard from '../components/AthleteCard'
import { auth, db } from '../config/firebase'

type AthleteResult = {
  id: string
  name: string
  location: string
  interests: string[]
  level: string
  avatar: string | null
}

export default function SearchPage() {
  const router = useRouter()
  const [searchInput, setSearchInput] = useState('')
  const [results, setResults] = useState<AthleteResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  const searchTerm = useMemo(() => {
    const queryParam = router.query.query
    return typeof queryParam === 'string' ? queryParam : ''
  }, [router.query.query])

  useEffect(() => {
    if (!router.isReady) return

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        setIsAuthenticated(false)
        setCurrentUserId(null)
        router.replace('/login')
        return
      }

      setIsAuthenticated(true)
      setCurrentUserId(user.uid)
    })

    return () => unsubscribe()
  }, [router])

  useEffect(() => {
    if (!router.isReady) return
    setSearchInput(searchTerm)
  }, [router.isReady, searchTerm])

  useEffect(() => {
    if (!searchTerm || !isAuthenticated) {
      setResults([])
      setLoading(false)
      return
    }

    let isMounted = true
    const runSearch = async () => {
      setLoading(true)
      setError(null)

      try {
        const snapshot = await getDocs(collection(db, 'users'))
        const normalizedTerm = searchTerm.trim().toLowerCase()

        const matches = snapshot.docs
          .map((docSnap) => {
            const data = docSnap.data() as any
            return {
              id: docSnap.id,
              name: data?.name ?? 'Unknown athlete',
              location: data?.location ?? 'Somewhere sweaty',
              interests: data?.interests ?? [],
              level: data?.level ?? 'Beginner',
              avatar: data?.avatar ?? null
            }
          })
          .filter((athlete) => {
            if (athlete.id === currentUserId) return false
            const nameMatch = athlete.name?.toLowerCase().includes(normalizedTerm)
            const locationMatch = athlete.location?.toLowerCase().includes(normalizedTerm)
            return nameMatch || locationMatch
          })
          .sort((a, b) => a.name.localeCompare(b.name))

        if (isMounted) {
          setResults(matches)
        }
      } catch (err: any) {
        console.error('Search error:', err)
        if (isMounted) {
          setError('We had trouble searching right now. Please try again in a moment.')
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    runSearch()

    return () => {
      isMounted = false
    }
  }, [searchTerm, isAuthenticated, currentUserId])

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const trimmed = searchInput.trim()
    if (!trimmed) return

    router.push({
      pathname: '/search',
      query: { query: trimmed }
    })
  }

  return (
    <>
      <Head>
        <title>Search • Sweat Socks Society</title>
      </Head>
      <div className="min-h-screen bg-gray-50">
        <header className="bg-primary text-white">
          <div className="max-w-5xl mx-auto px-6 py-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold">Find your crew</h1>
              <p className="text-white/80">Search by city, state, or athlete name.</p>
            </div>
            <Link href="/dashboard" className="btn-secondary inline-flex">Back to dashboard</Link>
          </div>
        </header>

        <main className="max-w-5xl mx-auto px-6 py-10 space-y-8">
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg p-6">
            <label htmlFor="search" className="text-sm font-medium text-slate-700 block mb-2">
              Search our athlete community
            </label>
            <div className="flex items-stretch gap-3 flex-col sm:flex-row">
              <input
                id="search"
                type="search"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder={"Try \"Chicago\", \"Austin\", or a partner's name"}
                className="flex-1 border border-slate-200 rounded-full px-5 py-3 text-base text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <button type="submit" className="btn-primary px-8">Search</button>
            </div>
          </form>

          {loading && (
            <div className="bg-white rounded-2xl shadow p-6 text-center text-slate-500">
              Searching our communities...
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-4">
              {error}
            </div>
          )}

          {!loading && !error && searchTerm && results.length === 0 && (
            <div className="bg-white rounded-2xl shadow p-6 text-center text-slate-500">
              No athletes or locations matched "{searchTerm}" just yet. Try another city or include full names.
            </div>
          )}

          {!loading && !error && results.length > 0 && (
            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-slate-800">
                Showing {results.length} match{results.length === 1 ? '' : 'es'} for "{searchTerm}"
              </h2>
              <div className="grid gap-4">
                {results.map((athlete) => (
                  <AthleteCard key={athlete.id} athlete={athlete} />
                ))}
              </div>
            </section>
          )}
        </main>
      </div>
    </>
  )
}
