'use client';

import { useMemo } from 'react';
import { collection, query, orderBy } from 'firebase/firestore';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
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
  MountainIcon,
  PlusCircleIcon,
  AlertTriangleIcon,
  PencilIcon,
} from 'lucide-react';

interface Tour {
  id: string;
  title: string;
  location: string;
  date: string; // ISO string
  participantLimit: number;
}

export default function TourManagementPage() {
  const firestore = useFirestore();

  const toursQuery = useMemoFirebase(
    () => query(collection(firestore, 'tours'), orderBy('date', 'desc')),
    [firestore]
  );

  const { data: tours, isLoading, error } = useCollection<Tour>(toursQuery);

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleDateString('de-DE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="flex items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <MountainIcon className="h-10 w-10 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Tour Management
          </h1>
        </div>
        <Button asChild>
          <Link href="/admin/tours/new">
            <PlusCircleIcon className="mr-2 h-4 w-4" />
            Create Tour
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Tours</CardTitle>
          <CardDescription>
            Here you can see and manage all existing tours.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Limit</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading &&
                [...Array(5)].map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <Skeleton className="h-5 w-3/4" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-1/2" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-24" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-12" />
                    </TableCell>
                    <TableCell className="text-right">
                      <Skeleton className="h-8 w-8 ml-auto" />
                    </TableCell>
                  </TableRow>
                ))}
              {error && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-destructive">
                    <AlertTriangleIcon className="mr-2 inline h-4 w-4" />
                    Error loading tours: {error.message}
                  </TableCell>
                </TableRow>
              )}
              {!isLoading && tours?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground p-8">
                    No tours found. Create the first one!
                  </TableCell>
                </TableRow>
              )}
              {!isLoading &&
                tours?.map((tour) => (
                  <TableRow key={tour.id}>
                    <TableCell className="font-medium">{tour.title}</TableCell>
                    <TableCell>{tour.location}</TableCell>
                    <TableCell>{formatDate(tour.date)}</TableCell>
                    <TableCell>{tour.participantLimit}</TableCell>
                    <TableCell className="text-right">
                      <Button asChild variant="ghost" size="icon">
                        <Link href={`/admin/tours/edit/${tour.id}`}>
                          <PencilIcon className="h-4 w-4" />
                        </Link>
                      </Button>
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
