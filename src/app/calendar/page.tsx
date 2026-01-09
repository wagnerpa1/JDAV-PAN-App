'use client';

import { useState, useMemo } from 'react';
import {
  collection,
  query,
  where,
  Timestamp,
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
} from 'date-fns';
import type { DayModifiers } from 'react-day-picker';

interface Tour {
  id: string;
  title: string;
  location: string;
  date: string; // ISO string
}

export default function CalendarPage() {
  const firestore = useFirestore();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | undefined>(new Date());

  const monthStart = useMemo(() => startOfMonth(currentMonth), [currentMonth]);
  const monthEnd = useMemo(() => endOfMonth(currentMonth), [currentMonth]);

  const toursQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'tours'),
      where('date', '>=', monthStart.toISOString()),
      where('date', '<=', monthEnd.toISOString()),
      orderBy('date', 'asc')
    );
  }, [firestore, monthStart, monthEnd]);

  const { data: tours, isLoading, error } = useCollection<Tour>(toursQuery);

  const tourDays = useMemo(() => {
    return tours?.map((tour) => new Date(tour.date)) || [];
  }, [tours]);

  const toursOnSelectedDay = useMemo(() => {
    if (!selectedDay || !tours) return [];
    const dayStart = startOfDay(selectedDay);
    const dayEnd = endOfDay(selectedDay);
    return tours.filter((tour) => {
      const tourDate = new Date(tour.date);
      return tourDate >= dayStart && tourDate <= dayEnd;
    });
  }, [selectedDay, tours]);

  const handleMonthChange = (month: Date) => {
    setCurrentMonth(month);
  };
  
  const handleDayClick = (day: Date, modifiers: DayModifiers) => {
    if (modifiers.tour) {
      setSelectedDay(day);
    } else {
      setSelectedDay(undefined);
    }
  };

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleDateString('de-DE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
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
          <CardContent className="p-2 md:p-6">
            <Calendar
              mode="single"
              selected={selectedDay}
              onDayClick={handleDayClick}
              month={currentMonth}
              onMonthChange={handleMonthChange}
              modifiers={{ tour: tourDays }}
              modifiersClassNames={{
                tour: 'bg-primary text-primary-foreground rounded-full',
                selected: 'bg-background text-primary border-2 border-primary rounded-full',
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
              <Skeleton className="h-20 w-full" />
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
                          <span>{formatDate(tour.date)}</span>
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
