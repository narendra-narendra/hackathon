import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect, useRef, useState } from 'react'
import { onAuthStateChanged, signOut, User } from 'firebase/auth'
import { auth } from '../config/firebase'

export default function Header() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [profileOpen, setProfileOpen] = useState(false)
  const profileButtonRef = useRef<HTMLButtonElement | null>(null)
  const profileMenuRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => setCurrentUser(user))
    return () => unsubscribe()
  }, [])

  useEffect(() => {
    const handleRouteChange = () => {
      setOpen(false)
      setProfileOpen(false)
    }

    router.events?.on('routeChangeStart', handleRouteChange)
    return () => {
      router.events?.off('routeChangeStart', handleRouteChange)
    }
  }, [router])

  useEffect(() => {
    if (!profileOpen) return

    const handleClickAway = (event: MouseEvent) => {
      const target = event.target as Node
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(target) &&
        profileButtonRef.current &&
        !profileButtonRef.current.contains(target)
      ) {
        setProfileOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickAway)
    return () => document.removeEventListener('mousedown', handleClickAway)
  }, [profileOpen])

  useEffect(() => {
    if (!currentUser) {
      setProfileOpen(false)
    }
  }, [currentUser])

  const handleEditProfile = () => {
    setProfileOpen(false)
    router.push('/profile?edit=true')
  }

  const handleLogout = async () => {
    try {
      await signOut(auth)
      setProfileOpen(false)
      router.push('/')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const displayName = currentUser?.displayName || currentUser?.email || 'Profile'
  const initials = displayName?.trim()?.charAt(0)?.toUpperCase() || 'P'

  const isActive = (path: string) =>
    router.pathname === path
      ? 'text-white font-semibold underline underline-offset-4'
      : 'text-white/90 hover:text-white'

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-primary/95 text-white shadow-lg backdrop-blur-sm">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 md:px-6">
        <Link
          href="/"
          aria-label="Go to Sweat Socks Society home"
          className="text-xl font-bold tracking-tight hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          Sweat Socks Society
        </Link>

        <nav className="hidden items-center space-x-6 md:flex">
          <Link href="/dashboard" className={isActive('/dashboard')}>Dashboard</Link>
          <Link href="/events" className={isActive('/events')}>Events</Link>
          <Link href="/feed" className={isActive('/feed')}>Community Feed</Link>
          <Link href="/shop" className={isActive('/shop')}>Shop</Link>
          <Link
            href="/messages"
            className={`flex items-center gap-2 ${isActive('/messages')}`}
            aria-label="Open messages"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="h-5 w-5"
            >
              <path d="M4 4h16a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-5l-3.2 2.4a1 1 0 0 1-1.6-.8V17H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zm1 3v5h14V7H5z" />
            </svg>
            <span className="hidden lg:inline">Messages</span>
          </Link>
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {!currentUser && (
            <Link
              href="/login"
              className="inline-flex items-center rounded-full bg-white px-4 py-2 text-sm font-medium text-primary transition hover:opacity-95"
            >
              Login
            </Link>
          )}
          {currentUser && (
            <div className="relative">
              <button
                ref={profileButtonRef}
                type="button"
                onClick={() => setProfileOpen((prev) => !prev)}
                className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-2 text-sm font-medium text-white transition hover:bg-white/25 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                aria-haspopup="menu"
                aria-expanded={profileOpen}
              >
                <span className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-white/25 text-base font-semibold uppercase">
                  {currentUser.photoURL ? (
                    <img
                      src={currentUser.photoURL}
                      alt="Profile avatar"
                      className="h-8 w-8 rounded-full object-cover"
                    />
                  ) : (
                    initials
                  )}
                </span>
                <span className="hidden max-w-[140px] truncate lg:inline-block">{displayName}</span>
              </button>

              {profileOpen && (
                <div
                  ref={profileMenuRef}
                  className="absolute right-0 z-50 mt-3 w-48 overflow-hidden rounded-xl border border-white/10 bg-white text-slate-900 shadow-lg"
                  role="menu"
                  aria-label="Profile options"
                >
                  <button
                    onClick={handleEditProfile}
                    className="flex w-full items-center gap-2 px-4 py-3 text-sm hover:bg-indigo-50"
                    role="menuitem"
                  >
                    <span className="h-2 w-2 rounded-full bg-indigo-500"></span>
                    Edit profile
                  </button>
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 px-4 py-3 text-sm text-red-600 hover:bg-red-50"
                    role="menuitem"
                  >
                    <span className="h-2 w-2 rounded-full bg-red-500"></span>
                    Logout
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Mobile menu button */}
        <div className="md:hidden">
          <button
            aria-label="Toggle menu"
            onClick={() => setOpen((prev) => !prev)}
            className="rounded-md bg-white/15 px-3 py-2 text-sm font-medium text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            {open ? 'Close' : 'Menu'}
          </button>
        </div>
      </div>

      {open && (
        <div className="mx-auto mt-2 flex w-full max-w-6xl flex-col gap-3 rounded-lg bg-primary/98 px-4 py-4 text-white md:hidden">
          <Link href="/dashboard" className={isActive('/dashboard')}>Dashboard</Link>
          <Link href="/events" className={isActive('/events')}>Events</Link>
          <Link href="/feed" className={isActive('/feed')}>Community Feed</Link>
          <Link href="/shop" className={isActive('/shop')}>Shop</Link>
          <Link href="/messages" className={isActive('/messages')}>Messages</Link>

          {!currentUser && (
            <Link
              href="/login"
              className="mt-2 inline-flex items-center justify-center rounded-full bg-white px-4 py-2 text-sm font-medium text-primary"
            >
              Login
            </Link>
          )}
          {currentUser && (
            <div className="mt-3 flex flex-col gap-2 border-t border-white/20 pt-3">
              <button
                onClick={() => {
                  setOpen(false)
                  handleEditProfile()
                }}
                className="w-full rounded-lg bg-white/10 px-4 py-2 text-left text-sm font-medium hover:bg-white/20"
              >
                Edit profile
              </button>
              <button
                onClick={() => {
                  setOpen(false)
                  handleLogout()
                }}
                className="w-full rounded-lg bg-white/10 px-4 py-2 text-left text-sm font-medium text-red-200 hover:bg-red-200/20"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  )
}
