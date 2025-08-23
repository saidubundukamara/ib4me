import { useState, useEffect } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { commentService, Comment } from '@/services/supabaseService';

interface CommentSectionProps {
  campaignId: string;
}

const CommentSection = ({ campaignId }: CommentSectionProps) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { user, authenticated } = usePrivy();

  useEffect(() => {
    loadComments();
  }, [campaignId]);

  const loadComments = async () => {
    try {
      const campaignComments = await commentService.getCampaignComments(campaignId);
      setComments(campaignComments);
    } catch (error) {
      console.error('Error loading comments:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!authenticated || !user) {
      console.error('User not authenticated');
      return;
    }

    setIsSubmitting(true);

    try {
      const comment: Comment = {
        campaign_id: campaignId,
        privy_user_id: user.id,
        user_name: user.email?.address || 'Anonymous',
        content: newComment,
      };

      await commentService.createComment(comment);
      setNewComment('');
      loadComments();
    } catch (error) {
      console.error('Error posting comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <h3>Comments</h3>

      {comments.length > 0 ? (
        <div className="space-y-4">
          {comments.map((comment) => (
            <div key={comment.id} className="p-4 border rounded">
              <div className="flex justify-between">
                <p className="font-medium">{comment.user_name}</p>
                <span className="text-sm text-gray-500">
                  {new Date(comment.created_at!).toLocaleDateString()}
                </span>
              </div>
              <p className="mt-2">{comment.content}</p>
            </div>
          ))}
        </div>
      ) : (
        <p>No comments yet. Be the first to comment!</p>
      )}

      {authenticated ? (
        <form onSubmit={handleSubmit} className="mt-6">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Write your comment..."
            className="w-full p-2 border rounded"
            rows={4}
            required
          />
          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-2 px-4 py-2 bg-blue-600 text-white rounded"
          >
            {isSubmitting ? 'Posting...' : 'Post Comment'}
          </button>
        </form>
      ) : (
        <div className="mt-6 p-4 border rounded text-center">
          <p className="mb-2">Please sign in to leave a comment</p>
          <a href="/auth/sign-in" className="px-4 py-2 bg-blue-600 text-white rounded">
            Sign In
          </a>
        </div>
      )}
    </div>
  );
};

export default CommentSection;
