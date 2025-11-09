import type { NextApiRequest, NextApiResponse } from 'next'
import { db } from '../../../config/firebase'
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { uid } = req.query
  if (!uid || typeof uid !== 'string') {
    return res.status(400).json({ error: 'Missing uid query param' })
  }

  try {
    const requestsQuery = query(
      collection(db, 'connections'),
      where('toUserId', '==', uid),
      where('status', '==', 'pending')
    )

    const snapshot = await getDocs(requestsQuery)
    const results = await Promise.all(
      snapshot.docs.map(async (snap) => {
        const data = snap.data()
        let sender = null
        try {
          const senderDoc = await getDoc(doc(db, 'users', data.fromUserId))
          sender = senderDoc.exists() ? senderDoc.data() : null
        } catch (e) {
          sender = null
        }
        return {
          id: snap.id,
          ...data,
          sender
        }
      })
    )

    return res.status(200).json({ count: results.length, requests: results })
  } catch (error: any) {
    console.error('API debug/requests error:', error)
    return res.status(500).json({ error: error.message || 'unknown' })
  }
}
