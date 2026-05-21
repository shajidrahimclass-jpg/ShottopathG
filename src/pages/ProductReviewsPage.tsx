import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layouts/MainLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { ImageZoomDialog } from '@/components/ImageZoomDialog';
import { getProductBySlug, getProductReviews, createReviewResponse, voteReviewHelpful, getUserReviewVote } from '@/db/api';
import type { Product, ReviewWithUser } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Star, ArrowLeft, Eye, MessageSquare, Send, ThumbsUp, ThumbsDown } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/db/supabase';
import { maskUsername } from '@/lib/utils';

export default function ProductReviewsPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<ReviewWithUser[]>([]);
  const [filteredReviews, setFilteredReviews] = useState<ReviewWithUser[]>([]);
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [showReviewImageZoom, setShowReviewImageZoom] = useState(false);
  const [reviewImages, setReviewImages] = useState<string[]>([]);
  const [reviewImageIndex, setReviewImageIndex] = useState(0);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userVotes, setUserVotes] = useState<Record<string, boolean>>({});
  const [votingReviewId, setVotingReviewId] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!slug) return;

      try {
        const [productData, reviewsData] = await Promise.all([
          getProductBySlug(slug),
          getProductReviews(slug),
        ]);

        if (!productData) {
          toast.error('Product not found');
          navigate('/products');
          return;
        }

        setProduct(productData);
        setReviews(reviewsData);
        setFilteredReviews(reviewsData);
      } catch (error) {
        console.error('Failed to fetch data:', error);
        toast.error('Failed to load reviews');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [slug, navigate]);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
      
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
        setUserProfile(profile);
      }
    };
    checkUser();
  }, []);

  // Load user votes for reviews
  useEffect(() => {
    const loadUserVotes = async () => {
      if (!currentUser || reviews.length === 0) return;

      const votes: Record<string, boolean> = {};
      await Promise.all(
        reviews.map(async (review) => {
          try {
            const vote = await getUserReviewVote(review.id);
            if (vote) {
              votes[review.id] = vote.is_helpful;
            }
          } catch (error) {
            console.error('Failed to load vote for review:', review.id, error);
          }
        })
      );
      setUserVotes(votes);
    };

    loadUserVotes();
  }, [reviews, currentUser]);

  useEffect(() => {
    if (selectedRating === null) {
      setFilteredReviews(reviews);
    } else {
      setFilteredReviews(reviews.filter((review) => review.rating === selectedRating));
    }
  }, [selectedRating, reviews]);

  const getRatingCount = (rating: number) => {
    return reviews.filter((review) => review.rating === rating).length;
  };

  const handleVoteReview = async (reviewId: string, isHelpful: boolean) => {
    if (!currentUser) {
      toast.error('Please sign in to vote');
      return;
    }

    if (userProfile?.role === 'banned') {
      toast.error('Banned users cannot vote on reviews');
      return;
    }

    setVotingReviewId(reviewId);

    try {
      await voteReviewHelpful(reviewId, isHelpful);
      
      // Update local state
      setUserVotes(prev => ({ ...prev, [reviewId]: isHelpful }));
      
      // Update review counts locally
      setReviews(prevReviews => 
        prevReviews.map(review => {
          if (review.id === reviewId) {
            const hadVote = userVotes[reviewId] !== undefined;
            const wasHelpful = userVotes[reviewId];
            
            let newHelpfulCount = review.helpful_count;
            let newNotHelpfulCount = review.not_helpful_count;
            
            if (hadVote) {
              // Changing vote
              if (wasHelpful && !isHelpful) {
                newHelpfulCount--;
                newNotHelpfulCount++;
              } else if (!wasHelpful && isHelpful) {
                newHelpfulCount++;
                newNotHelpfulCount--;
              }
            } else {
              // New vote
              if (isHelpful) {
                newHelpfulCount++;
              } else {
                newNotHelpfulCount++;
              }
            }
            
            return {
              ...review,
              helpful_count: newHelpfulCount,
              not_helpful_count: newNotHelpfulCount
            };
          }
          return review;
        })
      );
      
      toast.success('Thank you for your feedback!');
    } catch (error: any) {
      console.error('Failed to vote:', error);
      toast.error(error.message || 'Failed to submit vote');
    } finally {
      setVotingReviewId(null);
    }
  };

  const handleReply = async (reviewId: string) => {
    if (!currentUser) {
      toast.error('Please sign in to reply');
      return;
    }

    if (!replyContent.trim()) {
      toast.error('Please enter a reply');
      return;
    }

    try {
      await createReviewResponse(reviewId, replyContent, false);
      toast.success('Reply added successfully');
      setReplyContent('');
      setReplyingTo(null);
      
      // Refresh reviews
      if (slug) {
        const reviewsData = await getProductReviews(slug);
        setReviews(reviewsData);
        setFilteredReviews(reviewsData);
      }
    } catch (error) {
      console.error('Failed to add reply:', error);
      toast.error('Failed to add reply');
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <Skeleton className="h-8 w-48 mb-6" />
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i}>
                <CardContent className="pt-6">
                  <Skeleton className="h-6 w-32 mb-2" />
                  <Skeleton className="h-4 w-24 mb-4" />
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!product) {
    return null;
  }

  const averageRating = reviews.length > 0
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
    : 0;

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-6 md:py-8 max-w-4xl">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate(`/products/${slug}`)}
          className="mb-4 md:mb-6 text-sm md:text-base"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Product
        </Button>

        {/* Header */}
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold mb-2">Customer Reviews</h1>
          <p className="text-sm md:text-base text-muted-foreground mb-4">{product.name}</p>
          
          {reviews.length > 0 && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 md:h-5 md:w-5 ${
                      i < Math.round(averageRating)
                        ? 'fill-warning text-warning'
                        : 'text-muted-foreground'
                    }`}
                  />
                ))}
              </div>
              <span className="text-base md:text-lg font-semibold">
                {averageRating.toFixed(1)} out of 5
              </span>
              <span className="text-sm md:text-base text-muted-foreground">
                ({reviews.length} {reviews.length === 1 ? 'review' : 'reviews'})
              </span>
            </div>
          )}
        </div>

        {/* Star Rating Filter */}
        {reviews.length > 0 && (
          <div className="mb-4 md:mb-6">
            <h3 className="text-sm md:text-base font-semibold mb-2 md:mb-3">Filter by Rating</h3>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedRating === null ? 'default' : 'outline'}
                onClick={() => setSelectedRating(null)}
                size="sm"
                className="text-xs md:text-sm"
              >
                All ({reviews.length})
              </Button>
              {[1, 2, 3, 4, 5].map((rating) => {
                const count = getRatingCount(rating);
                return (
                  <Button
                    key={rating}
                    variant={selectedRating === rating ? 'default' : 'outline'}
                    onClick={() => setSelectedRating(rating)}
                    size="sm"
                    disabled={count === 0}
                    className="text-xs md:text-sm"
                  >
                    <Star className="h-3 w-3 mr-1 fill-current" />
                    {rating} ({count})
                  </Button>
                );
              })}
            </div>
          </div>
        )}

        {/* Reviews List */}
        {reviews.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-sm md:text-base text-muted-foreground">
                No reviews yet. Be the first to review this product!
              </p>
            </CardContent>
          </Card>
        ) : filteredReviews.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-sm md:text-base text-muted-foreground">
                No reviews found for {selectedRating} star rating.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3 md:space-y-4">
            {filteredReviews.map((review) => (
              <Card key={review.id}>
                <CardContent className="pt-4 md:pt-6 px-4 md:px-6">
                  <div className="flex flex-col sm:flex-row items-start justify-between mb-2 gap-2">
                    <div className="flex-1">
                      <p className="text-sm md:text-base font-semibold">
                        {review.is_anonymous 
                          ? maskUsername(review.user.username)
                          : review.user.username
                        }
                      </p>
                      <div className="flex items-center mt-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-3 w-3 md:h-4 md:w-4 ${
                              i < review.rating
                                ? 'fill-warning text-warning'
                                : 'text-muted-foreground'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <span className="text-xs md:text-sm text-muted-foreground">
                      {new Date(review.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  {review.comment && (
                    <p className="text-sm md:text-base text-muted-foreground mb-3">{review.comment}</p>
                  )}
                  {review.images && review.images.length > 0 && (
                    <div className="flex gap-2 flex-wrap mb-4">
                      {review.images.map((img, idx) => (
                        <div
                          key={idx}
                          className="relative group cursor-pointer overflow-hidden rounded-lg border-2 border-border hover:border-primary transition-all duration-300"
                          onClick={() => {
                            setReviewImages(review.images || []);
                            setReviewImageIndex(idx);
                            setShowReviewImageZoom(true);
                          }}
                        >
                          <img
                            src={img}
                            alt={`Review ${idx + 1}`}
                            className="h-24 w-24 object-cover transition-transform duration-300 group-hover:scale-110"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center">
                            <Eye className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Helpful Voting */}
                  <div className="mt-4 flex items-center gap-4 border-t pt-4">
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant={userVotes[review.id] === true ? "default" : "outline"}
                        className="gap-2"
                        onClick={() => handleVoteReview(review.id, true)}
                        disabled={votingReviewId === review.id || !currentUser || userProfile?.role === 'banned'}
                      >
                        <ThumbsUp className={`h-4 w-4 ${votingReviewId === review.id ? 'animate-pulse' : ''}`} />
                        <span>{review.helpful_count}</span>
                      </Button>
                      <Button
                        size="sm"
                        variant={userVotes[review.id] === false ? "default" : "outline"}
                        className="gap-2"
                        onClick={() => handleVoteReview(review.id, false)}
                        disabled={votingReviewId === review.id || !currentUser || userProfile?.role === 'banned'}
                      >
                        <ThumbsDown className={`h-4 w-4 ${votingReviewId === review.id ? 'animate-pulse' : ''}`} />
                      </Button>
                    </div>
                    {(review.helpful_count + review.not_helpful_count) > 0 && (
                      <span className="text-sm text-muted-foreground">
                        {Math.round((review.helpful_count / (review.helpful_count + review.not_helpful_count)) * 100)}% found this helpful
                      </span>
                    )}
                    {review.helpful_count >= 5 && (
                      <Badge variant="secondary" className="ml-auto">
                        Most Helpful
                      </Badge>
                    )}
                  </div>

                  {/* Responses */}
                  {review.responses && review.responses.length > 0 && (
                    <div className="mt-4 space-y-3 border-t pt-4">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <MessageSquare className="h-4 w-4" />
                        <span>Responses ({review.responses.length})</span>
                      </div>
                      {review.responses.map((response) => (
                        <div key={response.id} className="bg-muted/50 rounded-lg p-3 space-y-2">
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
                          <p className="text-sm">{response.content}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Reply Form */}
                  {currentUser && (
                    <>
                      {replyingTo === review.id ? (
                        <div className="mt-4 space-y-2 border-t pt-4">
                          <Textarea
                            value={replyContent}
                            onChange={(e) => setReplyContent(e.target.value)}
                            placeholder="Write your reply..."
                            className="min-h-[80px]"
                          />
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleReply(review.id)}
                            >
                              <Send className="h-4 w-4 mr-2" />
                              Send Reply
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
                        <div className="mt-4 border-t pt-4">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setReplyingTo(review.id)}
                          >
                            <MessageSquare className="h-4 w-4 mr-2" />
                            Reply
                          </Button>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
      {/* Review Image Zoom Dialog */}
      {reviewImages.length > 0 && (
        <ImageZoomDialog
          images={reviewImages}
          currentIndex={reviewImageIndex}
          open={showReviewImageZoom}
          onClose={() => {
            setShowReviewImageZoom(false);
            setReviewImages([]);
            setReviewImageIndex(0);
          }}
          onNavigate={(index) => setReviewImageIndex(index)}
        />
      )}
    </MainLayout>
  );
}
