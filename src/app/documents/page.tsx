'use client';

import { useState } from 'react';
import {
  useUser,
  useFirestore,
  useCollection,
  useMemoFirebase,
  useDoc,
} from '@/firebase';
import {
  collection,
  query,
  orderBy,
  doc,
} from 'firebase/firestore';
import { uploadFileAndCreateDocument } from '@/firebase/storage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import {
  FileTextIcon,
  UploadIcon,
  DownloadIcon,
  AlertTriangleIcon,
  Trash2Icon,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { deleteObject, getStorage, ref } from 'firebase/storage';

interface UserProfile {
  role: 'user' | 'admin';
}

interface Document {
  id: string;
  name: string;
  url: string;
  uploadedAt: string;
  uploaderId: string;
}

function AdminDocumentUploader({
  user,
  firestore,
}: {
  user: any;
  firestore: any;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file || !user) return;

    setIsUploading(true);
    try {
      await uploadFileAndCreateDocument(file, user.uid, firestore);
      toast({
        title: 'Upload Successful',
        description: `${file.name} has been uploaded.`,
      });
      setFile(null); // Clear the input
    } catch (error: any) {
      console.error('Upload failed:', error);
      toast({
        variant: 'destructive',
        title: 'Upload Failed',
        description:
          error.message || 'There was a problem uploading your file.',
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card className="mb-8 shadow-md">
      <CardHeader>
        <CardTitle>Upload Document</CardTitle>
        <CardDescription>
          Select a file to upload. It will be visible to all users.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col sm:flex-row gap-4">
        <Input type="file" onChange={handleFileChange} className="flex-grow" />
        <Button
          onClick={handleUpload}
          disabled={!file || isUploading}
          className="w-full sm:w-auto"
        >
          <UploadIcon className="mr-2 h-4 w-4" />
          {isUploading ? 'Uploading...' : 'Upload'}
        </Button>
      </CardContent>
    </Card>
  );
}

function DeleteDocumentButton({ document }: { document: Document }) {
  const { toast } = useToast();
  const firestore = useFirestore();

  const handleDelete = async () => {
    try {
      const storage = getStorage();
      // Create a reference to the file to delete
      const fileRef = ref(storage, `documents/${document.name}`);
      
      // Delete the file from Storage
      await deleteObject(fileRef);

      // Delete the Firestore document
      const docRef = doc(firestore, 'documents', document.id);
      deleteDocumentNonBlocking(docRef);

      toast({
        title: 'Document Deleted',
        description: `${document.name} has been successfully deleted.`,
      });
    } catch (error: any) {
      console.error('Error deleting document:', error);
      toast({
        variant: 'destructive',
        title: 'Deletion Failed',
        description:
          error.message ||
          'There was a problem deleting the document.',
      });
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <Trash2Icon className="h-4 w-4 text-destructive" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the
            document <span className="font-bold">{document.name}</span>.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default function DocumentsPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const userDocRef = useMemoFirebase(
    () => (user ? doc(firestore, 'users', user.uid) : null),
    [firestore, user]
  );
  const { data: userProfile, isLoading: isProfileLoading } =
    useDoc<UserProfile>(userDocRef);

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
    return new Date(isoString).toLocaleDateString('de-DE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const isLoading = isUserLoading || isProfileLoading || isDocumentsLoading;

  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="flex items-center gap-4 mb-8">
        <FileTextIcon className="h-10 w-10 text-primary" />
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Documents
        </h1>
      </div>

      {userProfile?.role === 'admin' && (
        <AdminDocumentUploader user={user} firestore={firestore} />
      )}

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Available Documents</CardTitle>
          <CardDescription>
            Here is a list of all shared documents.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>File Name</TableHead>
                <TableHead className="hidden sm:table-cell">
                  Upload Date
                </TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <>
                  {[...Array(3)].map((_, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <Skeleton className="h-5 w-3/4" />
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Skeleton className="h-5 w-24" />
                      </TableCell>
                      <TableCell className="text-right">
                        <Skeleton className="h-8 w-8 ml-auto" />
                      </TableCell>
                    </TableRow>
                  ))}
                </>
              )}
              {documentsError && (
                <TableRow>
                  <TableCell colSpan={3}>
                    <div className="flex items-center justify-center p-4 text-destructive">
                      <AlertTriangleIcon className="mr-2 h-4 w-4" />
                      <span>
                        Error loading documents: {documentsError.message}
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              )}
              {!isLoading && !documentsError && documents?.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={3}
                    className="text-center text-muted-foreground p-8"
                  >
                    No documents have been uploaded yet.
                  </TableCell>
                </TableRow>
              )}
              {!isLoading &&
                documents?.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell className="font-medium">{doc.name}</TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {formatDate(doc.uploadedAt)}
                    </TableCell>
                    <TableCell className="text-right">
                       <div className="flex items-center justify-end gap-2">
                        <Button asChild variant="ghost" size="icon">
                            <a href={doc.url} target="_blank" rel="noopener noreferrer">
                                <DownloadIcon className="h-4 w-4" />
                            </a>
                        </Button>
                        {userProfile?.role === 'admin' && <DeleteDocumentButton document={doc} />}
                       </div>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
