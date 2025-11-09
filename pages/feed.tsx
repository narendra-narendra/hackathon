import { useEffect, useMemo, useRef, useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
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
import { getDownloadURL, ref, uploadBytesResumable } from 'firebase/storage'
import { auth, db, storage } from '../config/firebase'
import Header from '../components/Header'

interface FeedForm {
  title: string
  activityType: string
  content: string
}

interface FeedPost {
  id: string
  title?: string
  activityType?: string
  content: string
  createdAt?: { seconds: number; nanoseconds: number }
  createdBy: string
  createdByName?: string
  cheers?: string[]
  mediaUrl?: string | null
  mediaType?: string
}

const activityOptions = ['Run', 'Ride', 'Swim', 'Strength', 'Yoga', 'Triathlon', 'Other']
const MAX_MEDIA_SIZE = 10 * 1024 * 1024 // 10MB

const formatTimestamp = (post: FeedPost) => {
  if (post.createdAt?.seconds) {
    return new Date(post.createdAt.seconds * 1000).toLocaleString([], {
      dateStyle: 'medium',
      timeStyle: 'short'
    })
  }
  return 'Just now'
}

export default function CommunityFeedPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [posts, setPosts] = useState<FeedPost[]>([])
  const [form, setForm] = useState<FeedForm>({ title: '', activityType: '', content: '' })
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [mediaFile, setMediaFile] = useState<File | null>(null)
  const [mediaPreview, setMediaPreview] = useState<string>('')
  const [uploadProgress, setUploadProgress] = useState<number | null>(null)
  const [showComposer, setShowComposer] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (user) => setCurrentUser(user))
    const feedQuery = query(collection(db, 'communityPosts'), orderBy('createdAt', 'desc'))
    const unsubFeed = onSnapshot(feedQuery, (snapshot) => {
      setPosts(snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...(docSnap.data() as any) })))
    })

    return () => {
      unsubAuth()
      unsubFeed()
    }
  }, [])

  useEffect(() => {
    if (!currentUser) {
      setShowComposer(false)
    }
  }, [currentUser])

  useEffect(() => {
    if (showComposer && typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [showComposer])

  const setField = (field: keyof FeedForm) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }))
  }

  const resetForm = () => {
    setForm({ title: '', activityType: '', content: '' })
    setMediaFile(null)
    setMediaPreview('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleMediaChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setError(null)
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setError('For now you can upload images (JPG, PNG, GIF).')
      event.target.value = ''
      return
    }

    if (file.size > MAX_MEDIA_SIZE) {
      setError('Images must be 10MB or smaller.')
      event.target.value = ''
      return
    }

    setMediaFile(file)
    const reader = new FileReader()
    reader.onloadend = () => setMediaPreview(reader.result as string)
    reader.readAsDataURL(file)
  }

  const clearMedia = () => {
    setMediaFile(null)
    setMediaPreview('')
    setUploadProgress(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const toggleComposer = () => {
    if (!currentUser) {
      setError('Please login to post to the community feed.')
      return
    }

    if (showComposer) {
      resetForm()
      setShowComposer(false)
    } else {
      setError(null)
      setSuccess(null)
      setShowComposer(true)
    }
  }

  const uploadFeedMedia = async (): Promise<{ url: string; type: string; path: string } | null> => {
    if (!mediaFile) return null

    try {
      if (!currentUser) {
        throw new Error('You must be signed in to upload images.')
      }
      const fileExtension = mediaFile.name.split('.').pop() || mediaFile.type.split('/')[1] || 'jpg'
      const storagePath = `feed/${currentUser.uid}/${Date.now()}_${mediaFile.size}.${fileExtension}`
      const storageRef = ref(storage, storagePath)
      setUploadProgress(0)

      const uploadTask = uploadBytesResumable(storageRef, mediaFile)

      return await new Promise((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          (snapshot) => {
            const percent = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100)
            setUploadProgress(percent)
          },
          (error) => {
            setUploadProgress(null)
            reject(error)
          },
          async () => {
            const url = await getDownloadURL(uploadTask.snapshot.ref)
            setUploadProgress(null)
            resolve({ url, type: mediaFile.type, path: storagePath })
          }
        )
      })
    } catch (uploadError) {
      console.error('Error uploading feed media:', uploadError)
      setError('We could not upload that image right now. Try again or post without it.')
      return null
    }
  }

  const hasCheered = (post: FeedPost) => {
    if (!currentUser) return false
    return (post.cheers || []).includes(currentUser.uid)
  }

  const cheerCount = (post: FeedPost) => (post.cheers ? post.cheers.length : 0)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    if (!form.content.trim()) {
      setError('What did you experience? Share a quick note before posting.')
      return
    }
    if (!currentUser) {
      setError('Please login to post to the community feed.')
      return
    }

    try {
      setIsSubmitting(true)
      const profileSnap = await getDoc(doc(db, 'users', currentUser.uid))
      const profileData = profileSnap.exists() ? profileSnap.data() : null

      const uploadedMedia = await uploadFeedMedia()
      if (mediaFile && !uploadedMedia) {
        throw new Error('Media upload failed. Try again or remove the image.')
      }

      const postPayload: Record<string, any> = {
        title: form.title.trim(),
        activityType: form.activityType,
        content: form.content.trim(),
        createdAt: serverTimestamp(),
        createdBy: currentUser.uid,
        createdByName: profileData?.name || currentUser.email,
        cheers: []
      }

      if (uploadedMedia) {
        postPayload.mediaUrl = uploadedMedia.url
        postPayload.mediaType = uploadedMedia.type
        postPayload.mediaStoragePath = uploadedMedia.path
      }

      await addDoc(collection(db, 'communityPosts'), postPayload)

      resetForm()
  setShowComposer(false)
      setSuccess('Thanks for sharing! Your story is live.')
      setTimeout(() => setSuccess(null), 3500)
    } catch (err) {
      console.error('Error publishing post:', err)
      const message = err instanceof Error ? err.message : 'We could not share that story right now. Please try again.'
      setError(message)
    } finally {
      setIsSubmitting(false)
      setUploadProgress(null)
    }
  }

  const toggleCheer = async (post: FeedPost) => {
    if (!currentUser) {
      setError('Login to send a cheer!')
      return
    }

    try {
      const ref = doc(db, 'communityPosts', post.id)
      if (hasCheered(post)) {
        await updateDoc(ref, { cheers: arrayRemove(currentUser.uid) })
      } else {
        await updateDoc(ref, { cheers: arrayUnion(currentUser.uid) })
      }
    } catch (err) {
      console.error('Error toggling cheer:', err)
      setError('We could not update cheers right now.')
    }
  }

  const highlightedPosts = useMemo(() => posts.slice(0, 3), [posts])
  const composerButtonIcon = showComposer ? '×' : '+'
  const composerButtonLabel = showComposer
    ? 'Close post composer'
    : currentUser
      ? 'Share a new post'
      : 'Login to share a post'
  const composerButtonDisabled = showComposer && (isSubmitting || uploadProgress !== null)

  return (
    <>
      <Head>
        <title>Community Feed | Sweat Socks Society</title>
        <meta
          name="description"
          content="Share workout highs, get tips, and cheer on the Sweat Socks Society community."
        />
      </Head>

  <Header />

  <div className="min-h-screen bg-gradient-to-b from-indigo-50 via-white to-white pt-32 pb-16 px-6 md:px-16 lg:px-24">
        <div className="max-w-5xl mx-auto space-y-10">
          <header className="space-y-3 text-center md:text-left">
            <p className="uppercase tracking-wide text-sm text-blue-700/80">Community feed</p>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900">Swap stories. Stay motivated.</h1>
            <p className="text-base text-slate-600 max-w-2xl">
              Drop a note about today’s sweat, get advice from the crew, or cheer on someone crushing their goals.
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

          <section className="space-y-6" aria-live="polite">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <h2 className="text-xl font-semibold text-slate-900">Latest from the crew</h2>
              <span className="text-sm text-slate-500">{posts.length} stories</span>
            </div>

            {posts.length === 0 ? (
              <div className="card text-center text-slate-500">
                Be the first to post and set the tone for today’s grind.
              </div>
            ) : (
              <div className="grid gap-4">
                {posts.map((post) => {
                  const cheered = hasCheered(post)
                  return (
                    <article key={post.id} className="card">
                      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                        <div>
                          <h3 className="text-lg font-semibold text-slate-900">
                            {post.title || 'Untitled session'}
                          </h3>
                          <p className="text-sm text-slate-600">
                            {post.createdByName || 'Sweat Socks Society athlete'} · {formatTimestamp(post)}
                          </p>
                        </div>
                        {post.activityType && (
                          <span className="self-start rounded-full bg-blue-100 text-blue-700 px-3 py-1 text-xs font-medium">
                            {post.activityType}
                          </span>
                        )}
                      </header>

                      {post.mediaUrl && (
                        <figure className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                          <img src={post.mediaUrl} alt={post.title || 'Community highlight'} className="w-full h-72 object-cover" />
                        </figure>
                      )}

                      <p className="mt-4 text-sm leading-relaxed text-slate-700 whitespace-pre-wrap">{post.content}</p>

                      <footer className="mt-6 flex flex-wrap items-center gap-3 text-sm text-slate-500">
                        <button
                          type="button"
                          onClick={() => toggleCheer(post)}
                          className={`px-4 py-2 rounded-full border ${cheered ? 'bg-orange-500 text-white border-orange-500' : 'border-slate-200 text-slate-600 hover:border-orange-400 hover:text-orange-600'}`}
                        >
                          {cheered ? 'Cheered' : 'Cheer'} · {cheerCount(post)}
                        </button>
                        <span>
                          Want to join? <Link href="/events" className="text-indigo-600 hover:underline">Check the events board</Link>
                        </span>
                      </footer>
                    </article>
                  )
                })}
              </div>
            )}
          </section>

            {showComposer && (
              <section className="card" aria-labelledby="share-story-heading">
                <div className="flex items-center justify-between gap-4 flex-wrap mb-6">
                  <h2 id="share-story-heading" className="text-xl font-semibold text-slate-900">Share your experience</h2>
                  <button
                    type="button"
                    onClick={toggleComposer}
                    className="w-10 h-10 flex items-center justify-center rounded-full border border-slate-200 text-2xl text-slate-500 hover:bg-slate-100"
                    aria-label="Close post composer"
                  >
                    ×
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="grid gap-4">
                  <label className="flex flex-col text-sm font-medium text-slate-700">
                    Headline (optional)
                    <input
                      value={form.title}
                      onChange={setField('title')}
                      className="mt-1 rounded-md border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      placeholder="Sunrise ladders with the crew"
                    />
                  </label>

                  <label className="flex flex-col text-sm font-medium text-slate-700">
                    Activity type
                    <select
                      value={form.activityType}
                      onChange={(event) => setForm((prev) => ({ ...prev, activityType: event.target.value }))}
                      className="mt-1 rounded-md border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      <option value="">Choose one</option>
                      {activityOptions.map((option) => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </label>

                  <label className="flex flex-col text-sm font-medium text-slate-700">
                    Story
                    <textarea
                      value={form.content}
                      onChange={setField('content')}
                      rows={4}
                      className="mt-1 rounded-md border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      placeholder="Share the vibe, route, and how it felt..."
                      required
                    />
                  </label>

                  <div className="flex flex-col gap-3 text-sm text-slate-700">
                    <span className="font-medium">Add a photo (optional)</span>
                    <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="btn-secondary text-sm px-5"
                      >
                        {mediaFile ? 'Replace image' : 'Upload image'}
                      </button>
                      {mediaFile && (
                        <button
                          type="button"
                          onClick={clearMedia}
                          className="text-xs text-slate-500 hover:underline"
                        >
                          Remove
                        </button>
                      )}
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleMediaChange}
                      />
                    </div>
                    {mediaPreview && (
                      <figure className="rounded-lg border border-slate-200 overflow-hidden max-w-sm">
                        <img src={mediaPreview} alt="Selected upload preview" className="w-full h-48 object-cover" />
                      </figure>
                    )}
                    {uploadProgress !== null && (
                      <div className="w-full max-w-sm">
                        <div className="flex justify-between text-xs text-slate-500 mb-1">
                          <span>Uploading</span>
                          <span>{uploadProgress}%</span>
                        </div>
                        <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
                          <div
                            className="h-full bg-indigo-500 transition-all"
                            style={{ width: `${uploadProgress}%` }}
                          />
                        </div>
                      </div>
                    )}
                    <p className="text-xs text-slate-500">
                      We support JPG, PNG, and GIF up to 10MB. Videos and other files coming soon.
                    </p>
                  </div>

                  <div className="flex justify-end">
                    <button type="submit" className="btn-primary px-6 disabled:opacity-60" disabled={isSubmitting}>
                      {uploadProgress !== null ? `Uploading… ${uploadProgress}%` : isSubmitting ? 'Posting…' : 'Post to feed'}
                    </button>
                  </div>
                </form>
              </section>
            )}

          {highlightedPosts.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-slate-900">Spotlight stories</h2>
              <div className="grid gap-3 md:grid-cols-3">
                {highlightedPosts.map((post) => (
                  <article key={`highlight-${post.id}`} className="card space-y-3">
                    {post.mediaUrl && (
                      <figure className="overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
                        <img src={post.mediaUrl} alt={post.title || 'Spotlight story'} className="w-full h-36 object-cover" />
                      </figure>
                    )}
                    <h3 className="text-base font-semibold text-slate-900 line-clamp-2">
                      {post.title || 'Community highlight'}
                    </h3>
                    <p className="text-sm text-slate-600 line-clamp-3">{post.content}</p>
                    <span className="block text-xs uppercase tracking-wide text-slate-400">
                      {post.createdByName || 'Anonymous athlete'}
                    </span>
                  </article>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={toggleComposer}
        disabled={composerButtonDisabled}
        aria-label={composerButtonLabel}
        title={composerButtonLabel}
        className="fixed bottom-8 right-8 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white text-3xl shadow-xl transition hover:bg-primary/90 focus:outline-none focus:ring-4 focus:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {composerButtonIcon}
      </button>
    </>
  )
}
