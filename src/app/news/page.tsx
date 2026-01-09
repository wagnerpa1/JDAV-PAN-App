'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  useFirestore,
  useCollection,
  useMemoFirebase,
  useUser,
  useDoc,
  addDocumentNonBlocking,
} from '@/firebase';
import { collection, query, orderBy, doc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { Skeleton } from '@/components/ui/skeleton';
import { NewspaperIcon, SendIcon, AlertTriangleIcon } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { Post, UserProfile } from '@/types';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

const postSchema = z.object({
  content: z.string().min(1, 'Post cannot be empty.').max(280, 'Post is too long.'),
});

type PostFormData = z.infer<typeof postSchema>;

const noteColors = [
  'bg-yellow-200',
  'bg-green-200',
  'bg-blue-200',
  'bg-pink-200',
  'bg-purple-200',
  'bg-indigo-200',
];

const noteRotations = ['-rotate-2', 'rotate-2', '-rotate-1', 'rotate-1', 'rotate-3', '-rotate-3'];

function PostForm() {
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  
  const userProfileRef = useMemoFirebase(() => user ? doc(firestore, 'users', user.uid) : null, [user, firestore]);
  const { data: userProfile } = useDoc<UserProfile>(userProfileRef);

  const form = useForm<PostFormData>({
    resolver: zodResolver(postSchema),
    defaultValues: { content: '' },
  });

  const onSubmit = (data: PostFormData) => {
    if (!firestore || !user || !userProfile) return;

    const postsCollection = collection(firestore, 'posts');
    const newPost = {
      content: data.content,
      authorId: user.uid,
      authorName: userProfile.name || user.email,
      createdAt: new Date().toISOString(),
      color: noteColors[Math.floor(Math.random() * noteColors.length)],
    };

    addDocumentNonBlocking(postsCollection, newPost);

    toast({
      title: 'Note Posted!',
      description: 'Your note has been added to the board.',
    });
    form.reset();
  };

  if (!user) {
    return null; // Don't show form if not logged in
  }

  return (
    <Card className="mb-8 shadow-lg sticky top-4 z-10">
      <CardHeader>
        <h2 className="text-xl font-semibold">Post a New Note</h2>
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
                    <Textarea
                      placeholder="What's on your mind?"
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={form.formState.isSubmitting}>
              <SendIcon className="mr-2" />
              Post Note
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

export default function NewsPage() {
  const firestore = useFirestore();

  const postsQuery = useMemoFirebase(
    () => query(collection(firestore, 'posts'), orderBy('createdAt', 'desc')),
    [firestore]
  );
  const {
    data: posts,
    isLoading,
    error,
  } = useCollection<Post>(postsQuery);

  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="flex items-center gap-4 mb-8">
        <NewspaperIcon className="h-10 w-10 text-primary" />
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Community Board
        </h1>
      </div>

      <PostForm />
      
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-48 w-full" />)}
        </div>
      )}
      
      {error && (
        <Card className="col-span-full">
          <CardContent className="p-8 text-center text-destructive">
            <AlertTriangleIcon className="mx-auto h-12 w-12 mb-4"/>
            <h3 className="text-xl font-semibold">Error Loading Posts</h3>
            <p className="text-sm">{error.message}</p>
          </CardContent>
        </Card>
      )}

      {!isLoading && posts && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 [masonry-fill-mode:auto]">
          {posts.length > 0 ? (
            posts.map((post, index) => (
              <Link key={post.id} href={`/news/${post.id}`} className="block hover:no-underline group">
                <Card
                  className={`${post.color || 'bg-yellow-200'} shadow-lg hover:shadow-xl transition-all duration-300 transform group-hover:-translate-y-1 ${noteRotations[index % noteRotations.length]}`}
                >
                  <CardContent className="p-4 flex flex-col h-full">
                    <p className="text-gray-800 flex-grow mb-4 whitespace-pre-wrap">{post.content}</p>
                    <div className="text-sm text-gray-600 border-t border-gray-400/50 pt-2">
                      <p className="font-semibold">{post.authorName}</p>
                      <p>{formatDistanceToNow(new Date(post.createdAt))} ago</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))
          ) : (
            <div className="col-span-full text-center py-16 border-2 border-dashed rounded-xl">
              <p className="text-muted-foreground">The board is empty. Be the first to post a note!</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
