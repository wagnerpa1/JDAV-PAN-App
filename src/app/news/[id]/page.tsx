'use client';

import { useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  useFirestore,
  useDoc,
  useCollection,
  useMemoFirebase,
  useUser,
  addDocumentNonBlocking,
} from '@/firebase';
import { doc, collection, query, orderBy } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  AlertTriangleIcon,
  MessageSquareIcon,
  SendIcon,
  ArrowLeftIcon,
  UserIcon
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import type { Post, Comment, UserProfile } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';


const commentSchema = z.object({
  content: z.string().min(1, 'Comment cannot be empty.'),
});
type CommentFormData = z.infer<typeof commentSchema>;

function CommentForm({ postId }: { postId: string }) {
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();

  const userProfileRef = useMemoFirebase(() => user ? doc(firestore, 'users', user.uid) : null, [user, firestore]);
  const { data: userProfile } = useDoc<UserProfile>(userProfileRef);

  const form = useForm<CommentFormData>({
    resolver: zodResolver(commentSchema),
    defaultValues: { content: '' },
  });

  const onSubmit = (data: CommentFormData) => {
    if (!firestore || !user || !userProfile || !postId) return;

    const commentsCollection = collection(firestore, 'posts', postId, 'comments');
    const newComment = {
      postId,
      content: data.content,
      authorId: user.uid,
      authorName: userProfile.name || user.email,
      createdAt: new Date().toISOString(),
    };

    addDocumentNonBlocking(commentsCollection, newComment);

    toast({
      title: 'Comment Posted!',
    });
    form.reset();
  };
  
  if (!user) return null;

  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle>Add a Comment</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Textarea placeholder="Share your thoughts..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={form.formState.isSubmitting}>
              <SendIcon className="mr-2 h-4 w-4" />
              Post Comment
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

function CommentList({ postId }: { postId: string }) {
  const firestore = useFirestore();
  const commentsQuery = useMemoFirebase(
    () => query(collection(firestore, 'posts', postId, 'comments'), orderBy('createdAt', 'asc')),
    [firestore, postId]
  );
  const { data: comments, isLoading, error } = useCollection<Comment>(commentsQuery);

  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase();

  return (
    <div className="mt-8">
      <h3 className="text-2xl font-semibold mb-4 flex items-center gap-2"><MessageSquareIcon /> Comments</h3>
      {isLoading && <Skeleton className="h-20 w-full" />}
      {error && <Alert variant="destructive"><AlertTriangleIcon className="h-4 w-4" /><AlertTitle>Error</AlertTitle><AlertDescription>Could not load comments.</AlertDescription></Alert>}
      {!isLoading && comments && (
        <div className="space-y-6">
          {comments.length === 0 ? (
            <p className="text-muted-foreground">Be the first to comment!</p>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="flex gap-4">
                <Avatar>
                  <AvatarFallback>{getInitials(comment.authorName)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-baseline justify-between">
                    <p className="font-semibold">{comment.authorName}</p>
                    <p className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}</p>
                  </div>
                  <p className="text-muted-foreground mt-1 whitespace-pre-wrap">{comment.content}</p>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default function PostDetailPage() {
  const { id } = useParams();
  const firestore = useFirestore();
  const router = useRouter();
  const postId = id as string;

  const postDocRef = useMemoFirebase(
    () => doc(firestore, 'posts', postId),
    [firestore, postId]
  );

  const { data: post, isLoading, error } = useDoc<Post>(postDocRef);

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 md:p-8 max-w-2xl">
        <Skeleton className="h-10 w-48 mb-8" />
        <Card><CardContent className="p-6"><Skeleton className="h-64 w-full" /></CardContent></Card>
      </div>
    );
  }

  if (error) {
    return <Alert variant="destructive" className="m-8"><AlertTriangleIcon className="h-4 w-4" /><AlertTitle>Error</AlertTitle><AlertDescription>{error.message}</AlertDescription></Alert>;
  }
  
  if (!post) {
      return (
          <div className="container mx-auto p-4 md:p-8 max-w-2xl">
              <Alert>
                <AlertTriangleIcon className="h-4 w-4" />
                <AlertTitle>Post not found</AlertTitle>
                <AlertDescription>This post may have been deleted or never existed.</AlertDescription>
              </Alert>
          </div>
      )
  }

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-3xl">
      <div className="mb-8">
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeftIcon className="mr-2 h-4 w-4" />
          Back to Board
        </Button>
      </div>

      <Card className={`${post.color} shadow-xl`}>
        <CardContent className="p-6">
          <p className="text-xl text-gray-800 whitespace-pre-wrap">{post.content}</p>
        </CardContent>
        <CardFooter className="bg-black/5 p-4">
            <div className="text-sm text-gray-700">
                <p className="font-bold">{post.authorName}</p>
                <p>Posted on {format(new Date(post.createdAt), 'PPP p')}</p>
            </div>
        </CardFooter>
      </Card>
      
      <CommentList postId={postId} />
      <CommentForm postId={postId} />

    </div>
  );
}
