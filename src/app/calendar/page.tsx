'use client';

import { useState, useMemo } from 'react';
import {
  collection,
  query,
  where,
  orderBy,
} from 'firebase/firestore';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CalendarIcon, AlertTriangleIcon, MapPinIcon } from 'lucide-react';
import Link from 'next/link';
import {
  startOfMonth,
  endOfMonth,
  startOfDay,
  endOfDay,
  format,
  eachDayOfInterval,
  isSameDay,
} from 'date-fns';
import type { DayModifiers } from 'react-day-picker';
import type { Tour } from '@/types';

export default function CalendarPage() {
  const firestore = useFirestore();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | undefined>(new Date());

  const monthStart = useMemo(() => startOfMonth(currentMonth), [currentMonth]);
  const monthEnd = useMemo(() => endOfMonth(currentMonth), [currentMonth]);

  const toursQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    // Query for tours that *end* after the start of the month
    // and *start* before the end of the month.
    return query(
      collection(firestore, 'tours'),
      where('endDate', '>=', monthStart.toISOString()),
      where('startDate', '<=', monthEnd.toISOString()),
      orderBy('startDate', 'asc')
    );
  }, [firestore, monthStart, monthEnd]);

  const { data: tours, isLoading, error } = useCollection<Tour>(toursQuery);

  const tourDays = useMemo(() => {
    if (!tours) return [];
    const allTourDays: Date[] = [];
    tours.forEach(tour => {
      const tourInterval = eachDayOfInterval({
        start: new Date(tour.startDate),
        end: new Date(tour.endDate),
      });
      allTourDays.push(...tourInterval);
    });
    return allTourDays;
  }, [tours]);

  const toursOnSelectedDay = useMemo(() => {
    if (!selectedDay || !tours) return [];
    return tours.filter((tour) => {
      const tourStart = startOfDay(new Date(tour.startDate));
      const tourEnd = endOfDay(new Date(tour.endDate));
      return selectedDay >= tourStart && selectedDay <= tourEnd;
    });
  }, [selectedDay, tours]);

  const handleMonthChange = (month: Date) => {
    setCurrentMonth(month);
  };
  
  const handleDayClick = (day: Date, modifiers: DayModifiers) => {
    // Only select the day if there's a tour on it
    if (tourDays.some(tourDay => isSameDay(day, tourDay))) {
      setSelectedDay(day);
    } else {
      setSelectedDay(undefined);
    }
  };

  const formatDateRange = (startDateIso: string, endDateIso: string) => {
    const start = new Date(startDateIso);
    const end = new Date(endDateIso);
    if (isSameDay(start, end)) {
      return format(start, 'PPP');
    }
    return `${format(start, 'PPP')} - ${format(end, 'PPP')}`;
  };

  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="flex items-center gap-4 mb-8">
        <CalendarIcon className="h-10 w-10 text-primary" />
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Tour Calendar
        </h1>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="shadow-lg rounded-xl">
          <CardContent className="p-2 md:p-6 flex justify-center">
            <Calendar
              mode="single"
              selected={selectedDay}
              onDayClick={handleDayClick}
              month={currentMonth}
              onMonthChange={handleMonthChange}
              modifiers={{ tour: tourDays }}
              modifiersClassNames={{
                tour: 'bg-primary/80 text-primary-foreground rounded-full',
              }}
              className="w-full"
            />
          </CardContent>
        </Card>
        
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">
            Tours on {selectedDay ? format(selectedDay, 'PPP') : 'selected day'}
          </h2>
          {isLoading && (
            <div className="space-y-4">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          )}
          {error && (
            <Alert variant="destructive">
              <AlertTriangleIcon className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                Could not fetch tours for this month.
              </AlertDescription>
            </Alert>
          )}
          {!isLoading && !error && (
            <>
              {toursOnSelectedDay.length > 0 ? (
                toursOnSelectedDay.map((tour) => (
                  <Link key={tour.id} href={`/tours/${tour.id}`} className="block hover:no-underline group">
                    <Card className="shadow-md hover:shadow-lg transition-shadow duration-300 rounded-xl group-hover:border-primary">
                      <CardHeader>
                        <CardTitle className="text-xl font-semibold group-hover:text-primary transition-colors">
                          {tour.title}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="grid gap-2 text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <MapPinIcon className="h-4 w-4" />
                          <span>{tour.location}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CalendarIcon className="h-4 w-4" />
                          <span>{formatDateRange(tour.startDate, tour.endDate)}</span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))
              ) : (
                <div className="text-center py-10 border-2 border-dashed rounded-xl h-full flex items-center justify-center">
                  <p className="text-muted-foreground">
                    {selectedDay ? 'No tours on this day.' : 'Select a day with a tour to see details.'}
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

    