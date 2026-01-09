
'use client';

import { useMemo, useState } from 'react';
import { collection, query, orderBy, doc } from 'firebase/firestore';
import { useCollection, useFirestore, useMemoFirebase, deleteDocumentNonBlocking } from '@/firebase';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Skeleton } from '@/components/ui/skeleton';
import {
  MountainIcon,
  PlusCircleIcon,
  AlertTriangleIcon,
  PencilIcon,
  MoreHorizontal,
  UsersIcon,
  Trash2Icon,
} from 'lucide-react';
import { format } from 'date-fns';
import type { Tour } from '@/types';
import { useToast } from '@/hooks/use-toast';

function DeleteTourDialog({ tour, onOpenChange, open }: { tour: Tour, open: boolean, onOpenChange: (open: boolean) => void }) {
  const firestore = useFirestore();
  const { toast } = useToast();

  const handleDelete = () => {
    const tourRef = doc(firestore, 'tours', tour.id);
    deleteDocumentNonBlocking(tourRef);
    toast({
        title: "Tour Deleted",
        description: `"${tour.title}" has been successfully deleted.`,
    });
    onOpenChange(false);
  }

  return (
      <AlertDialog open={open} onOpenChange={onOpenChange}>
        <AlertDialogContent>
            <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the tour
                <span className="font-bold"> &quot;{tour.title}&quot;</span> and all its associated data.
            </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
                Delete Tour
            </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
  )
}


export default function TourManagementPage() {
  const firestore = useFirestore();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedTour, setSelectedTour] = useState<Tour | null>(null);

  const toursQuery = useMemoFirebase(
    () => query(collection(firestore, 'tours'), orderBy('startDate', 'desc')),
    [firestore]
  );

  const { data: tours, isLoading, error } = useCollection<Tour>(toursQuery);

  const formatDateRange = (startDateIso: string, endDateIso: string) => {
    const start = new Date(startDateIso);
    const end = new Date(endDateIso);
    if (start.toDateString() === end.toDateString()) {
      return format(start, 'PPP');
    }
    return `${format(start, 'PPP')} - ${format(end, 'PPP')}`;
  };

  const handleDeleteClick = (tour: Tour) => {
    setSelectedTour(tour);
    setDialogOpen(true);
  }

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
                <TableHead>Dates</TableHead>
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
                    <TableCell>{formatDateRange(tour.startDate, tour.endDate)}</TableCell>
                    <TableCell>{tour.participantLimit}</TableCell>
                    <TableCell className="text-right">
                       <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                             <DropdownMenuItem asChild>
                                <Link href={`/admin/tours/participants/${tour.id}`} className="flex items-center">
                                    <UsersIcon className="mr-2 h-4 w-4" />
                                    <span>View Participants</span>
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                                <Link href={`/admin/tours/edit/${tour.id}`} className="flex items-center">
                                    <PencilIcon className="mr-2 h-4 w-4" />
                                    <span>Edit</span>
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleDeleteClick(tour)}
                              className="text-destructive focus:text-destructive focus:bg-destructive/10"
                            >
                                <Trash2Icon className="mr-2 h-4 w-4" />
                                <span>Delete</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      {selectedTour && <DeleteTourDialog tour={selectedTour} open={dialogOpen} onOpenChange={setDialogOpen} />}
    </div>
  );
}
