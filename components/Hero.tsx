import { FormEvent, useEffect, useState } from 'react'
import Link from 'next/link'
import Header from './Header'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '../config/firebase'
import { useRouter } from 'next/router'

export default function Hero(){
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const router = useRouter()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAuthenticated(!!user)
    })

    return () => unsubscribe()
  }, [])

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const query = searchTerm.trim()
    if (!query) return

    router.push({
      pathname: '/search',
      query: { query }
    })
  }

  return (
    <section className="relative h-screen w-full bg-center bg-cover" style={{backgroundImage: `url('/hero.jpg')`}}>
      <div className="hero-overlay absolute inset-0" aria-hidden></div>
      <Header />
    <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-6 pt-32 md:pt-40">
  <h1 className="text-white text-4xl md:text-6xl font-bold mb-4 tracking-tight">Sweat Socks Society</h1>
  <p className="text-white text-lg md:text-2xl mb-8 max-w-2xl">every miles hurts less together</p>
        {isAuthenticated ? (
          <div className="flex flex-col items-center gap-5 w-full">
            <form onSubmit={handleSearch} className="w-full max-w-xl">
              <div className="flex items-center bg-white/95 rounded-full shadow-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-500">
                <input
                  type="search"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  className="flex-1 px-5 py-3 text-base text-slate-700 placeholder-slate-400 focus:outline-none bg-transparent"
                  placeholder="Search people or locations"
                  aria-label="Search people or locations"
                />
                <button
                  type="submit"
                  className="btn-primary rounded-none rounded-r-full px-6 py-3"
                >
                  Search
                </button>
              </div>
            </form>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/dashboard" className="btn-secondary inline-block">Open dashboard</Link>
              <Link href="/feed" className="btn-secondary inline-block">See community feed</Link>
            </div>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row gap-3">
            <Link href="/login" className="btn-primary inline-block px-8">Login</Link>
            <Link href="/register" className="btn-secondary inline-block">Register</Link>
          </div>
        )}
      </div>
      <div className="absolute bottom-8 left-0 right-0 flex justify-center z-10">
        <div className="bg-black/30 text-white rounded-full px-4 py-2 text-sm">Sporty • Local • Safe</div>
      </div>
    </section>
  )
}
