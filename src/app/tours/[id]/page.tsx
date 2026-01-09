'use client';

import { useMemo } from 'react';
import { useParams } from 'next/navigation';
import {
  useDoc,
  useFirestore,
  useUser,
  useCollection,
  updateDocumentNonBlocking,
  deleteDocumentNonBlocking,
} from '@/firebase';
import { doc, collection, query } from 'firebase/firestore';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  AlertTriangleIcon,
  CalendarIcon,
  InfoIcon,
  MapPinIcon,
  UsersIcon,
  UserCheckIcon,
  ClockIcon,
  TrendingUpIcon,
  EuroIcon,
  CalendarClockIcon,
  UserX,
} from 'lucide-react';
import { format, isSameDay, isPast } from 'date-fns';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import type { Tour, UserProfile, Participant } from '@/types';
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
} from "@/components/ui/alert-dialog"

function TourDetailsSkeleton() {
  return (
    <Card className="shadow-lg rounded-xl">
      <CardHeader>
        <Skeleton className="h-8 w-3/4 mb-2" />
        <Skeleton className="h-5 w-1/2" />
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-16 w-full" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </div>
      </CardContent>
      <CardFooter>
        <Skeleton className="h-12 w-full" />
      </CardFooter>
    </Card>
  );
}

export default function TourDetailPage() {
  const { id } = useParams();
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();

  const tourId = id as string;

  const tourDocRef = useMemo(
    () => {
      if (!firestore) return null;
      return doc(firestore, 'tours', tourId)
    },
    [firestore, tourId]
  );
  const { data: tour, isLoading, error } = useDoc<Tour>(tourDocRef);

  const leaderDocRef = useMemo(
    () => (tour?.leaderId && firestore ? doc(firestore, 'users', tour.leaderId) : null),
    [firestore, tour]
  );
  const { data: leader } = useDoc<UserProfile>(leaderDocRef);

  const participantDocRef = useMemo(() => {
    if (!user || !firestore) return null;
    return doc(firestore, `tours/${tourId}/participants/${user.uid}`);
  }, [firestore, tourId, user]);
  const { data: userParticipation } = useDoc<Participant>(participantDocRef);

  const participantsQuery = useMemo(
    () => {
      if (!firestore) return null;
      return query(collection(firestore, 'tours', tourId, 'participants'))
    },
    [firestore, tourId]
  );
  const { data: participants } = useCollection<Participant>(participantsQuery);

  const formatDateRange = (startDateIso: string, endDateIso: string) => {
    const start = new Date(startDateIso);
    const end = new Date(endDateIso);
    if (isSameDay(start, end)) {
      return format(start, 'PPP');
    }
    return `${format(start, 'PPP')} to ${format(end, 'PPP')}`;
  };

  const handleParticipate = () => {
    if (!user || !tour || !firestore) return;

    const participantRef = doc(firestore, `tours/${tourId}/participants/${user.uid}`);
    const participantData: Participant = {
      userId: user.uid,
      tourId: tour.id,
      joinedAt: new Date().toISOString(),
    };

    updateDocumentNonBlocking(participantRef, participantData);

    toast({
      title: "You're in!",
      description: `You have successfully joined the "${tour.title}" tour.`,
    });
  };

  const handleLeaveTour = () => {
    if (!user || !tour || !firestore) return;

    const participantRef = doc(firestore, `tours/${tourId}/participants/${user.uid}`);
    deleteDocumentNonBlocking(participantRef);

    toast({
        title: "You've left the tour",
        description: `You are no longer participating in "${tour.title}".`,
        variant: "destructive"
    });
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 md:p-8 max-w-4xl">
        <TourDetailsSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4 md:p-8 max-w-4xl">
        <Alert variant="destructive">
          <AlertTriangleIcon className="h-4 w-4" />
          <AlertTitle>Error Loading Tour</AlertTitle>
          <AlertDescription>
            The requested tour could not be loaded. It may not exist or there
            was a problem fetching the data.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!tour) {
    return (
      <div className="container mx-auto p-4 md:p-8 max-w-4xl text-center">
        <h2 className="text-2xl font-semibold">Tour Not Found</h2>
        <p className="text-muted-foreground mt-2">
          The tour you are looking for does not exist.
        </p>
      </div>
    );
  }
  
  const isParticipating = !!userParticipation;
  const isTourFull = participants ? participants.length >= tour.participantLimit : false;
  const isDeadlinePassed = isPast(new Date(tour.registrationDeadline));
  
  const getParticipationButton = () => {
    if (isParticipating) {
      return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button variant="destructive" className="w-full text-lg py-6">
                    <UserX className="mr-2 h-5 w-5" />
                    Leave Tour
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure you want to leave?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This will remove you from the participant list for this tour. You can rejoin as long as there is space and the registration deadline has not passed.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleLeaveTour} className="bg-destructive hover:bg-destructive/90">
                        Leave Tour
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
      );
    }
    if (isDeadlinePassed) {
      return (
        <Button disabled className="w-full text-lg py-6">
          Registration Closed
        </Button>
      );
    }
    if (isTourFull) {
      return (
        <Button disabled className="w-full text-lg py-6">
          Tour is Full
        </Button>
      );
    }
    return (
      <Button onClick={handleParticipate} className="w-full text-lg py-6">
        <UserCheckIcon className="mr-2 h-5 w-5" />
        Participate
      </Button>
    );
  };


  return (
    <div className="container mx-auto p-4 md:p-8 max-w-4xl">
      <Card className="shadow-lg rounded-xl">
        <CardHeader>
          <CardTitle className="text-3xl font-bold tracking-tight">
            {tour.title}
          </CardTitle>
          <CardDescription className="pt-2 text-lg">
            Led by {leader?.name || leader?.email || '...'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-muted-foreground leading-relaxed">
            {tour.description}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <CalendarIcon className="h-5 w-5 text-primary" />
              <span className="font-medium">
                {formatDateRange(tour.startDate, tour.endDate)}
              </span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <MapPinIcon className="h-5 w-5 text-primary" />
              <span className="font-medium">{tour.location}</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <UsersIcon className="h-5 w-5 text-primary" />
                <span className="font-medium">{participants?.length || 0} / {tour.participantLimit} participants</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <InfoIcon className="h-5 w-5 text-primary" />
                <span className="font-medium">Age Group: {tour.ageGroupId}</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <ClockIcon className="h-5 w-5 text-primary" />
                <span className="font-medium">{tour.duration}</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <TrendingUpIcon className="h-5 w-5 text-primary" />
                <span className="font-medium">{tour.elevationGain}m elevation gain</span>
            </div>
             <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <EuroIcon className="h-5 w-5 text-primary" />
                <span className="font-medium">{new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(tour.fee)} fee</span>
            </div>
             <div className="flex items-center gap-3 p-3 bg-destructive/10 rounded-lg">
                <CalendarClockIcon className="h-5 w-5 text-destructive" />
                <span className="font-medium text-destructive">
                    Register by {format(new Date(tour.registrationDeadline), 'PPP')}
                </span>
            </div>
          </div>
        </CardContent>
        <CardFooter>
            {user && getParticipationButton()}
        </CardFooter>
      </Card>
    </div>
  );
}
