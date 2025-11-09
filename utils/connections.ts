import { auth, db } from '../config/firebase'
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs,
  doc,
  getDoc,
  serverTimestamp,
  updateDoc,
  onSnapshot
} from 'firebase/firestore'

export async function sendConnectionRequest(targetUserId: string) {
  const currentUser = auth.currentUser
  if (!currentUser) throw new Error('Not authenticated')

  // Check if connection already exists in either direction
  const connectionsRef = collection(db, 'connections')
  const existingQuery = query(
    connectionsRef,
    where('fromUserId', '==', currentUser.uid),
    where('toUserId', '==', targetUserId)
  )
  const reverseQuery = query(
    connectionsRef,
    where('fromUserId', '==', targetUserId),
    where('toUserId', '==', currentUser.uid)
  )

  const [existingDocs, reverseDocs] = await Promise.all([
    getDocs(existingQuery),
    getDocs(reverseQuery)
  ])

  if (!existingDocs.empty || !reverseDocs.empty) {
    throw new Error('Connection already exists')
  }

  // Create new connection request
  await addDoc(connectionsRef, {
    fromUserId: currentUser.uid,
    toUserId: targetUserId,
    status: 'pending',
    createdAt: serverTimestamp()
  })

  return true
}

export function subscribeToConnectionStatus(
  userId: string,
  targetUserId: string,
  callback: (status: string | null) => void
) {
  const connectionsRef = collection(db, 'connections')
  
  // Query for connections in both directions
  const q1 = query(
    connectionsRef,
    where('fromUserId', '==', userId),
    where('toUserId', '==', targetUserId)
  )
  const q2 = query(
    connectionsRef,
    where('fromUserId', '==', targetUserId),
    where('toUserId', '==', userId)
  )

  // Set up listeners for both queries
  const unsubscribe1 = onSnapshot(q1, (snapshot) => {
    if (!snapshot.empty) {
      const connection = snapshot.docs[0].data()
      callback(connection.status)
    }
  })

  const unsubscribe2 = onSnapshot(q2, (snapshot) => {
    if (!snapshot.empty) {
      const connection = snapshot.docs[0].data()
      callback(connection.status)
    }
  })

  // Return function to unsubscribe from both listeners
  return () => {
    unsubscribe1()
    unsubscribe2()
  }
}

export function subscribeToConnectionRequests(
  userId: string,
  callback: (count: number) => void
) {
  const q = query(
    collection(db, 'connections'),
    where('toUserId', '==', userId),
    where('status', '==', 'pending')
  )

  return onSnapshot(q, (snapshot) => {
    callback(snapshot.size)
  })
}

export async function createChat(targetUserId: string) {
  try {
    const currentUser = auth.currentUser
    if (!currentUser) throw new Error('Not authenticated')

    // Check if chat already exists
    const chatsQuery = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', currentUser.uid)
    )
    const chatsSnapshot = await getDocs(chatsQuery)
    const existingChat = chatsSnapshot.docs.find(doc => 
      doc.data().participants.includes(targetUserId)
    )

    if (existingChat) {
      return existingChat.id
    }

    // Get user details
    const [currentUserDoc, targetUserDoc] = await Promise.all([
      getDoc(doc(db, 'users', currentUser.uid)),
      getDoc(doc(db, 'users', targetUserId))
    ])

    // Create new chat
    const chatRef = await addDoc(collection(db, 'chats'), {
      participants: [currentUser.uid, targetUserId],
      participantDetails: {
        [currentUser.uid]: {
          name: currentUserDoc.data()?.name || 'Unknown',
          avatar: currentUserDoc.data()?.avatar
        },
        [targetUserId]: {
          name: targetUserDoc.data()?.name || 'Unknown',
          avatar: targetUserDoc.data()?.avatar
        }
      },
      lastMessage: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })

    return chatRef.id
  } catch (error) {
    console.error('Error creating chat:', error)
    throw error
  }
}

export async function getConnectionStatus(targetUserId: string) {
  try {
    const currentUser = auth.currentUser
    if (!currentUser) return null

    const connectionsQuery = query(
      collection(db, 'connections'),
      where('fromUserId', 'in', [currentUser.uid, targetUserId]),
      where('toUserId', 'in', [currentUser.uid, targetUserId])
    )

    const snapshot = await getDocs(connectionsQuery)
    return snapshot.empty ? null : snapshot.docs[0].data().status
  } catch (error) {
    console.error('Error getting connection status:', error)
    return null
  }
}