'use client';

import { useMemo } from 'react';
import {
  useFirestore,
  useCollection,
  useMemoFirebase,
} from '@/firebase';
import {
  collection,
  query,
  orderBy,
} from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  NewspaperIcon,
  DownloadIcon,
  AlertTriangleIcon,
} from 'lucide-react';
import { format } from 'date-fns';

interface Document {
  id: string;
  name: string;
  url: string;
  uploadedAt: string;
  uploaderId: string;
}

export default function NewsPage() {
  const firestore = useFirestore();

  const documentsQuery = useMemoFirebase(
    () =>
      query(collection(firestore, 'documents'), orderBy('uploadedAt', 'desc')),
    [firestore]
  );
  const {
    data: documents,
    isLoading: isDocumentsLoading,
    error: documentsError,
  } = useCollection<Document>(documentsQuery);

  const formatDate = (isoString: string) => {
    if (!isoString) return 'N/A';
    return format(new Date(isoString), 'PPP');
  };

  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="flex items-center gap-4 mb-8">
        <NewspaperIcon className="h-10 w-10 text-primary" />
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          News & Updates
        </h1>
      </div>
      
      <div className="space-y-6">
        {isDocumentsLoading && (
          <>
            {[...Array(3)].map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/4 mt-2" />
                </CardHeader>
                <CardFooter>
                  <Skeleton className="h-10 w-32" />
                </CardFooter>
              </Card>
            ))}
          </>
        )}
        
        {documentsError && (
            <Alert variant="destructive">
                <AlertTriangleIcon className="h-4 w-4" />
                <CardTitle>Error</CardTitle>
                <CardDescription>
                Could not load news updates. Please check your connection.
                </CardDescription>
            </Alert>
        )}

        {!isDocumentsLoading && documents && (
           <>
            {documents.length > 0 ? (
                documents.map((doc) => (
                    <Card key={doc.id} className="shadow-md">
                        <CardHeader>
                            <CardTitle>{doc.name}</CardTitle>
                            <CardDescription>
                            Posted on {formatDate(doc.uploadedAt)}
                            </CardDescription>
                        </CardHeader>
                        <CardFooter>
                            <Button asChild>
                                <a href={doc.url} target="_blank" rel="noopener noreferrer">
                                    <DownloadIcon className="mr-2 h-4 w-4" />
                                    View Document
                                </a>
                            </Button>
                        </CardFooter>
                    </Card>
                ))
            ) : (
                <div className="text-center py-16 border-2 border-dashed rounded-xl">
                    <p className="text-muted-foreground">No news updates have been posted yet.</p>
                </div>
            )}
           </>
        )}
      </div>
    </div>
  );
}
