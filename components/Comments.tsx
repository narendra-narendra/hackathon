import { useState, useEffect } from 'react'
import { auth, db } from '../config/firebase'
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  getDocs,
  serverTimestamp 
} from 'firebase/firestore'

type Comment = {
  id: string
  userId: string
  userName: string
  text: string
  createdAt: any
}

type Props = {
  activityId: string
}

export default function Comments({ activityId }: Props) {
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchComments()
  }, [activityId])

  const fetchComments = async () => {
    try {
      const commentsQuery = query(
        collection(db, 'comments'),
        where('activityId', '==', activityId),
        orderBy('createdAt', 'desc')
      )
      
      const snapshot = await getDocs(commentsQuery)
      const fetchedComments = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Comment[]
      
      setComments(fetchedComments)
    } catch (error) {
      console.error('Error fetching comments:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim()) return
    
    const user = auth.currentUser
    if (!user) return

    setLoading(true)
    try {
      await addDoc(collection(db, 'comments'), {
        activityId,
        userId: user.uid,
        userName: user.displayName || 'Anonymous',
        text: newComment,
        createdAt: serverTimestamp()
      })

      setNewComment('')
      fetchComments() // Refresh comments
    } catch (error) {
      console.error('Error posting comment:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mt-4">
      <h4 className="text-sm font-medium mb-2">Comments</h4>
      
      {/* Comment Form */}
      <form onSubmit={handleSubmit} className="mb-4">
        <div className="flex gap-2">
          <input
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="flex-1 border rounded px-3 py-1 text-sm"
            placeholder="Add a comment..."
          />
          <button
            type="submit"
            disabled={loading}
            className="btn-primary text-sm px-3 py-1"
          >
            {loading ? '...' : 'Post'}
          </button>
        </div>
      </form>

      {/* Comments List */}
      <div className="space-y-2">
        {comments.map(comment => (
          <div key={comment.id} className="text-sm bg-gray-50 rounded p-2">
            <div className="flex justify-between items-start">
              <span className="font-medium">{comment.userName}</span>
              <span className="text-xs text-gray-500">
                {comment.createdAt?.toDate().toLocaleDateString()}
              </span>
            </div>
            <p className="mt-1 text-gray-700">{comment.text}</p>
          </div>
        ))}
      </div>
    </div>
  )
}