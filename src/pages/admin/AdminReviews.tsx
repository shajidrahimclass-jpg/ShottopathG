import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { getAllReviews, toggleReviewHidden, deleteReview, createReviewResponse, updateReviewResponse, deleteReviewResponse } from '@/db/api';
import type { ReviewWithUser, ReviewResponse } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Star, Eye, EyeOff, Trash2, Package, MessageSquare, Send, Edit, X } from 'lucide-react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useNavigate } from 'react-router-dom';
import { maskUsername } from '@/lib/utils';

export default function AdminReviews() {
  const [reviews, setReviews] = useState<ReviewWithUser[]>([]);
  const [filteredReviews, setFilteredReviews] = useState<ReviewWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedReviewId, setSelectedReviewId] = useState<string | null>(null);
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [editingResponse, setEditingResponse] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const navigate = useNavigate();

  const fetchReviews = async () => {
    try {
      const data = await getAllReviews();
      setReviews(data);
      setFilteredReviews(data);
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
      toast.error('Failed to load reviews');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  useEffect(() => {
    if (selectedRating === null) {
      setFilteredReviews(reviews);
    } else {
      setFilteredReviews(reviews.filter(review => review.rating === selectedRating));
    }
  }, [selectedRating, reviews]);

  const getReviewCountByRating = (rating: number) => {
    return reviews.filter(review => review.rating === rating).length;
  };

  const handleReply = async (reviewId: string) => {
    if (!replyContent.trim()) {
      toast.error('Please enter a response');
      return;
    }

    try {
      await createReviewResponse(reviewId, replyContent, true);
      toast.success('Response added successfully');
      setReplyContent('');
      setReplyingTo(null);
      fetchReviews();
    } catch (error) {
      console.error('Failed to add response:', error);
      toast.error('Failed to add response');
    }
  };

  const handleEditResponse = async (responseId: string) => {
    if (!editContent.trim()) {
      toast.error('Please enter a response');
      return;
    }

    try {
      await updateReviewResponse(responseId, editContent);
      toast.success('Response updated successfully');
      setEditContent('');
      setEditingResponse(null);
      fetchReviews();
    } catch (error) {
      console.error('Failed to update response:', error);
      toast.error('Failed to update response');
    }
  };

  const handleDeleteResponse = async (responseId: string) => {
    try {
      await deleteReviewResponse(responseId);
      toast.success('Response deleted successfully');
      fetchReviews();
    } catch (error) {
      console.error('Failed to delete response:', error);
      toast.error('Failed to delete response');
    }
  };

  const handleToggleHidden = async (id: string, currentHidden: boolean) => {
    try {
      await toggleReviewHidden(id, !currentHidden);
      toast.success(currentHidden ? 'Review shown' : 'Review hidden');
      fetchReviews();
    } catch (error) {
      console.error('Failed to toggle review visibility:', error);
      toast.error('Failed to update review');
    }
  };

  const handleDeleteClick = (id: string) => {
    setSelectedReviewId(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedReviewId) return;

    try {
      await deleteReview(selectedReviewId);
      toast.success('Review deleted successfully');
      setDeleteDialogOpen(false);
      setSelectedReviewId(null);
      fetchReviews();
    } catch (error) {
      console.error('Failed to delete review:', error);
      toast.error('Failed to delete review');
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-muted-foreground'
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <AdminLayout>
      <div className="space-y-4 md:space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Manage Reviews</h1>
            <p className="text-sm md:text-base text-muted-foreground mt-1">
              View, hide, or delete product reviews
            </p>
          </div>
          <Badge variant="secondary" className="text-sm md:text-lg px-3 md:px-4 py-1.5 md:py-2">
            {reviews.length} Total Reviews
          </Badge>
        </div>

        {/* Star Rating Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <span className="text-sm font-medium whitespace-nowrap">Filter by Rating:</span>
              <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                <Button
                  variant={selectedRating === null ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedRating(null)}
                  className="flex items-center gap-1.5"
                >
                  All Reviews
                  <Badge variant="secondary" className="ml-1">
                    {reviews.length}
                  </Badge>
                </Button>
                {[5, 4, 3, 2, 1].map((rating) => (
                  <Button
                    key={rating}
                    variant={selectedRating === rating ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedRating(rating)}
                    className="flex items-center gap-1.5"
                  >
                    <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                    <span>{rating}</span>
                    <Badge variant="secondary" className="ml-1">
                      {getReviewCountByRating(rating)}
                    </Badge>
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-20 w-full bg-muted" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredReviews.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {selectedRating !== null 
                  ? `No ${selectedRating}-star reviews found`
                  : 'No reviews yet'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredReviews.map((review) => (
              <Card key={review.id} className={review.hidden ? 'border-orange-500/50 bg-orange-50/5' : ''}>
                <CardHeader>
                  <div className="flex flex-col sm:flex-row items-start justify-between gap-3">
                    <div className="flex-1 w-full">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                        <CardTitle className="text-base sm:text-lg">
                          {review.product?.name || 'Unknown Product'}
                        </CardTitle>
                        {review.hidden && (
                          <Badge variant="outline" className="border-orange-500 text-orange-500 w-fit">
                            <EyeOff className="h-3 w-3 mr-1" />
                            Hidden
                          </Badge>
                        )}
                        {review.is_anonymous && (
                          <Badge variant="secondary" className="text-xs">
                            Incognito
                          </Badge>
                        )}
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
                        <span>By: {review.is_anonymous ? maskUsername(review.user.username) : review.user.username}</span>
                        <span className="hidden sm:inline">•</span>
                        <span>{new Date(review.created_at).toLocaleDateString()}</span>
                        <span className="hidden sm:inline">•</span>
                        {renderStars(review.rating)}
                      </div>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 sm:flex-none"
                        onClick={() => handleToggleHidden(review.id, review.hidden)}
                      >
                        {review.hidden ? (
                          <>
                            <Eye className="h-4 w-4 sm:mr-2" />
                            <span className="hidden sm:inline">Show</span>
                          </>
                        ) : (
                          <>
                            <EyeOff className="h-4 w-4 sm:mr-2" />
                            <span className="hidden sm:inline">Hide</span>
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 sm:flex-none text-destructive hover:bg-destructive hover:text-destructive-foreground"
                        onClick={() => handleDeleteClick(review.id)}
                      >
                        <Trash2 className="h-4 w-4 sm:mr-2" />
                        <span className="hidden sm:inline">Delete</span>
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {review.comment && (
                    <p className="text-sm mb-4">{review.comment}</p>
                  )}
                  {review.images && review.images.length > 0 && (
                    <div className="grid grid-cols-4 sm:flex sm:flex-wrap gap-2 mb-4">
                      {review.images.map((image, idx) => (
                        <img
                          key={idx}
                          src={image}
                          alt={`Review image ${idx + 1}`}
                          className="h-16 w-16 sm:h-20 sm:w-20 object-cover rounded border"
                        />
                      ))}
                    </div>
                  )}

                  {/* Admin Responses */}
                  {review.responses && review.responses.length > 0 && (
                    <div className="mt-4 space-y-3 border-t pt-4">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <MessageSquare className="h-4 w-4" />
                        <span>Responses ({review.responses.length})</span>
                      </div>
                      {review.responses.map((response) => (
                        <div key={response.id} className="bg-muted/50 rounded-lg p-3 space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm font-medium">
                                  {response.is_admin ? 'Admin' : (response.user?.username || 'Unknown')}
                                </span>
                                {response.is_admin && (
                                  <Badge variant="default" className="text-xs">Admin</Badge>
                                )}
                                <span className="text-xs text-muted-foreground">
                                  {new Date(response.created_at).toLocaleDateString()}
                                </span>
                              </div>
                              {editingResponse === response.id ? (
                                <div className="space-y-2">
                                  <Textarea
                                    value={editContent}
                                    onChange={(e) => setEditContent(e.target.value)}
                                    placeholder="Edit your response..."
                                    className="min-h-[80px]"
                                  />
                                  <div className="flex gap-2">
                                    <Button
                                      size="sm"
                                      onClick={() => handleEditResponse(response.id)}
                                    >
                                      Save
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => {
                                        setEditingResponse(null);
                                        setEditContent('');
                                      }}
                                    >
                                      Cancel
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <p className="text-sm">{response.content}</p>
                              )}
                            </div>
                            {response.is_admin && editingResponse !== response.id && (
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    setEditingResponse(response.id);
                                    setEditContent(response.content);
                                  }}
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleDeleteResponse(response.id)}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Reply Form */}
                  {replyingTo === review.id ? (
                    <div className="mt-4 space-y-2 border-t pt-4">
                      <Textarea
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        placeholder="Write your response..."
                        className="min-h-[100px]"
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleReply(review.id)}
                        >
                          <Send className="h-4 w-4 mr-2" />
                          Send Response
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setReplyingTo(null);
                            setReplyContent('');
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-4 flex items-center gap-2 border-t pt-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setReplyingTo(review.id)}
                      >
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Reply to Review
                      </Button>
                      {review.responses && review.responses.length > 0 && (
                        <Badge variant="secondary">
                          {review.responses.length} {review.responses.length === 1 ? 'response' : 'responses'}
                        </Badge>
                      )}
                    </div>
                  )}

                  {review.product?.slug && (
                    <Button
                      variant="link"
                      size="sm"
                      className="mt-2 px-0 text-xs sm:text-sm"
                      onClick={() => navigate(`/products/${review.product?.slug}`)}
                    >
                      View Product →
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="max-w-[95vw] sm:max-w-[500px]">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Review</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this review? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel className="w-full sm:w-auto">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="w-full sm:w-auto bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
