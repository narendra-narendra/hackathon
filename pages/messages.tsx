import { useEffect, useMemo, useState } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { onAuthStateChanged, User } from 'firebase/auth'
import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where
} from 'firebase/firestore'
import Header from '../components/Header'
import { auth, db } from '../config/firebase'

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ')
}

interface ChatPreview {
  id: string
  participants: string[]
  participantDetails?: Record<string, { name?: string; avatar?: string | null }>
  lastMessage?: {
    text?: string
    senderId?: string
    createdAt?: { seconds: number; nanoseconds: number }
  } | null
  updatedAt?: { seconds: number; nanoseconds: number }
}

interface ChatMessage {
  id: string
  text: string
  senderId: string
  createdAt?: { seconds: number; nanoseconds: number }
}

function formatTimestamp(timestamp?: { seconds: number; nanoseconds: number }) {
  if (!timestamp?.seconds) return 'Just now'
  return new Date(timestamp.seconds * 1000).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  })
}

export default function MessagesPage() {
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [loadingChats, setLoadingChats] = useState(true)
  const [chats, setChats] = useState<ChatPreview[]>([])
  const [activeChatId, setActiveChatId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [messageInput, setMessageInput] = useState('')
  const [sending, setSending] = useState(false)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.replace('/login')
        return
      }
      setCurrentUser(user)
    })

    return () => unsubscribe()
  }, [router])

  useEffect(() => {
    if (!currentUser) return

    setLoadingChats(true)
    const chatsQuery = query(collection(db, 'chats'), where('participants', 'array-contains', currentUser.uid))

    const unsubscribe = onSnapshot(chatsQuery, (snapshot) => {
      const relevantChats = snapshot.docs
        .map((docSnap) => ({ id: docSnap.id, ...(docSnap.data() as ChatPreview) }))

      relevantChats.sort((a, b) => {
        const aTime = a.updatedAt?.seconds ?? 0
        const bTime = b.updatedAt?.seconds ?? 0
        return bTime - aTime
      })

      setChats(relevantChats)
      setLoadingChats(false)
    })

    return () => unsubscribe()
  }, [currentUser])

  useEffect(() => {
    if (!router.isReady) return
    const chatFromQuery = typeof router.query.chat === 'string' ? router.query.chat : null
    if (chatFromQuery) {
      setActiveChatId(chatFromQuery)
    }
  }, [router.isReady, router.query.chat])

  useEffect(() => {
    if (!activeChatId && chats.length > 0) {
      setActiveChatId(chats[0].id)
    }
  }, [activeChatId, chats])

  useEffect(() => {
    if (!activeChatId) {
      setMessages([])
      return
    }

    const messagesQuery = query(
      collection(db, 'chats', activeChatId, 'messages'),
      orderBy('createdAt', 'asc')
    )

    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const chatMessages = snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...(docSnap.data() as ChatMessage) }))
      setMessages(chatMessages)
    })

    return () => unsubscribe()
  }, [activeChatId])

  const activeChat = useMemo(
    () => chats.find((chat) => chat.id === activeChatId) || null,
    [chats, activeChatId]
  )

  const peerDetails = useMemo(() => {
    if (!currentUser || !activeChat?.participantDetails) return null
    const peerId = activeChat.participants.find((participant) => participant !== currentUser.uid)
    if (!peerId) return null
    return { id: peerId, ...(activeChat.participantDetails[peerId] || {}) }
  }, [activeChat, currentUser])

  const handleSelectChat = (chatId: string) => {
    setActiveChatId(chatId)
    router.push({ pathname: '/messages', query: chatId ? { chat: chatId } : {} }, undefined, { shallow: true })
  }

  const handleSendMessage = async () => {
    if (!activeChatId || !currentUser || !messageInput.trim()) return

    setSending(true)
    try {
      const trimmed = messageInput.trim()
      await addDoc(collection(db, 'chats', activeChatId, 'messages'), {
        text: trimmed,
        senderId: currentUser.uid,
        createdAt: serverTimestamp()
      })

      await updateDoc(doc(db, 'chats', activeChatId), {
        lastMessage: {
          text: trimmed,
          senderId: currentUser.uid,
          createdAt: serverTimestamp()
        },
        updatedAt: serverTimestamp()
      })

      setMessageInput('')
    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      setSending(false)
    }
  }

  const handleKeyPress = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <>
      <Head>
        <title>Messages | Sweat Socks Society</title>
        <meta
          name="description"
          content="Chat with your Sweat Socks Society connections and coordinate your next session."
        />
      </Head>

      <Header />

      <div className="min-h-screen bg-gradient-to-b from-indigo-50 via-white to-white pt-32 pb-16">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 md:flex-row md:gap-10 md:px-12 lg:px-16">
          <aside className="flex w-full flex-col gap-4 rounded-2xl bg-white p-5 shadow-lg md:max-w-xs">
            <div>
              <h1 className="text-xl font-semibold text-slate-900">Messages</h1>
              <p className="text-sm text-slate-500">Stay connected with athletes you follow or recently met.</p>
            </div>

            {loadingChats ? (
              <div className="rounded-lg bg-slate-100 p-4 text-sm text-slate-500">Loading conversations...</div>
            ) : chats.length === 0 ? (
              <div className="rounded-lg bg-slate-100 p-4 text-sm text-slate-500">
                No conversations yet. Start by connecting with an athlete and sending a request.
              </div>
            ) : (
              <ul className="space-y-2">
                {chats.map((chat) => {
                  const peerId = currentUser
                    ? chat.participants.find((participant) => participant !== currentUser.uid)
                    : null
                  const peer = peerId ? chat.participantDetails?.[peerId] : undefined

                  return (
                    <li key={chat.id}>
                      <button
                        type="button"
                        onClick={() => handleSelectChat(chat.id)}
                        className={cn(
                          'w-full rounded-xl border px-4 py-3 text-left transition hover:border-indigo-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2',
                          activeChatId === chat.id
                            ? 'border-indigo-500 bg-indigo-50 shadow-sm'
                            : 'border-slate-200 bg-white'
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={peer?.avatar || '/avatar-placeholder.png'}
                            alt={peer?.name || 'Athlete avatar'}
                            className="h-10 w-10 rounded-full object-cover"
                          />
                          <div className="flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-medium text-slate-900">{peer?.name || 'Athlete'}</span>
                              <span className="text-xs text-slate-400">
                                {formatTimestamp(chat.lastMessage?.createdAt || chat.updatedAt)}
                              </span>
                            </div>
                            <p className="line-clamp-1 text-xs text-slate-500">
                              {chat.lastMessage?.text || 'Start a conversation'}
                            </p>
                          </div>
                        </div>
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </aside>

          <section className="flex w-full flex-1 flex-col rounded-2xl bg-white shadow-lg">
            {activeChat && currentUser ? (
              <>
                <header className="flex items-center gap-3 border-b border-slate-100 px-6 py-4">
                  <img
                    src={peerDetails?.avatar || '/avatar-placeholder.png'}
                    alt={peerDetails?.name || 'Athlete avatar'}
                    className="h-12 w-12 rounded-full object-cover"
                  />
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">{peerDetails?.name || 'Athlete'}</h2>
                    <p className="text-xs text-slate-500">Keep the momentum going with a quick check-in.</p>
                  </div>
                </header>

                <div className="flex-1 space-y-3 overflow-y-auto px-6 py-6">
                  {messages.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
                      No messages yet. Say hello and plan your next session!
                    </div>
                  ) : (
                    messages.map((message) => {
                      const isOwnMessage = message.senderId === currentUser.uid
                      return (
                        <div key={message.id} className={cn('flex flex-col', isOwnMessage ? 'items-end' : 'items-start')}>
                          <span
                            className={cn(
                              'max-w-sm rounded-2xl px-4 py-2 text-sm shadow-sm',
                              isOwnMessage ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-800'
                            )}
                          >
                            {message.text}
                          </span>
                          <span className="mt-1 text-xs text-slate-400">
                            {formatTimestamp(message.createdAt)}
                          </span>
                        </div>
                      )
                    })
                  )}
                </div>

                <footer className="border-t border-slate-100 px-6 py-4">
                  <div className="flex items-end gap-3">
                    <textarea
                      rows={1}
                      value={messageInput}
                      onChange={(event) => setMessageInput(event.target.value)}
                      onKeyDown={handleKeyPress}
                      placeholder="Write a message..."
                      className="flex-1 resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                    />
                    <button
                      type="button"
                      onClick={handleSendMessage}
                      disabled={sending || !messageInput.trim()}
                      className="inline-flex items-center rounded-full bg-indigo-600 px-6 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-60"
                    >
                      Send
                    </button>
                  </div>
                </footer>
              </>
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
                <div className="rounded-full bg-indigo-100 p-6">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-10 w-10 text-indigo-500">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M7 8h10M7 12h5m-9 7v-5a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v5l-3-2-3 2-3-2-3 2-3-2-3 2z"
                    />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Pick a conversation</h2>
                  <p className="text-sm text-slate-500">
                    Select a connection on the left to view your messages or start a new chat from an athlete card.
                  </p>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </>
  )
}
