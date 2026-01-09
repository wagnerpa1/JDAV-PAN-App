'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useFirestore, useUser, addDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useEffect } from 'react';

const formSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters.'),
  location: z.string().min(3, 'Location is required.'),
  startDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Please enter a valid start date.',
  }),
  endDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Please enter a valid end date.',
  }),
  registrationDeadline: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Please enter a valid registration deadline.',
  }),
  description: z.string().min(20, 'Description must be at least 20 characters.'),
  participantLimit: z.coerce.number().int().positive('Limit must be a positive number.'),
  duration: z.string().min(1, 'Duration is required.'),
  elevationGain: z.coerce.number().int().min(0, 'Elevation gain must be a positive number.'),
  fee: z.coerce.number().min(0, 'Fee must be a positive number.'),
}).refine(data => new Date(data.endDate) >= new Date(data.startDate), {
    message: 'End date must be on or after the start date.',
    path: ['endDate'],
}).refine(data => new Date(data.registrationDeadline) <= new Date(data.startDate), {
    message: 'Registration deadline must be on or before the start date.',
    path: ['registrationDeadline'],
});


type TourFormData = z.infer<typeof formSchema>;

interface TourFormProps {
  existingTour?: TourFormData & { id: string };
}

export function TourForm({ existingTour }: TourFormProps) {
  const firestore = useFirestore();
  const { user } = useUser();
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<TourFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      location: '',
      startDate: '',
      endDate: '',
      registrationDeadline: '',
      description: '',
      participantLimit: 10,
      duration: '',
      elevationGain: 0,
      fee: 0,
    },
  });

  useEffect(() => {
    if (existingTour) {
      const { startDate, endDate, registrationDeadline, ...rest } = existingTour;
      form.reset({
        ...rest,
        startDate: new Date(startDate).toISOString().split('T')[0],
        endDate: new Date(endDate).toISOString().split('T')[0],
        registrationDeadline: new Date(registrationDeadline).toISOString().split('T')[0],
      });
    }
  }, [existingTour, form]);

  const onSubmit = (data: TourFormData) => {
    if (!firestore || !user) return;

    const tourData = {
      ...data,
      startDate: new Date(data.startDate).toISOString(),
      endDate: new Date(data.endDate).toISOString(),
      registrationDeadline: new Date(data.registrationDeadline).toISOString(),
      // These are hardcoded for now, but could be dynamic
      ageGroupId: 'adults', 
      leaderId: user.uid,
    };
    
    if (existingTour) {
      // Update existing tour
      const tourRef = doc(firestore, 'tours', existingTour.id);
      updateDocumentNonBlocking(tourRef, tourData);
      toast({
        title: 'Tour Updated',
        description: `${tourData.title} has been successfully updated.`,
      });
    } else {
      // Create new tour
      const toursCol = collection(firestore, 'tours');
      addDocumentNonBlocking(toursCol, tourData);
      toast({
        title: 'Tour Created',
        description: `${tourData.title} has been successfully created.`,
      });
    }

    router.push('/admin/tours');
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tour Title</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Sunset Hike to Eagle's Peak" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="location"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Location / Meeting Point</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Alpine National Park Visitor Center" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <FormField
            control={form.control}
            name="startDate"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Start Date</FormLabel>
                <FormControl>
                    <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
            <FormField
            control={form.control}
            name="endDate"
            render={({ field }) => (
                <FormItem>
                <FormLabel>End Date</FormLabel>
                <FormControl>
                    <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
        </div>
        <FormField
            control={form.control}
            name="registrationDeadline"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Registration Deadline</FormLabel>
                <FormControl>
                    <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <FormField
            control={form.control}
            name="duration"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Duration</FormLabel>
                <FormControl>
                    <Input placeholder="e.g., 3 hours, 2 days" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
            <FormField
            control={form.control}
            name="participantLimit"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Participant Limit</FormLabel>
                <FormControl>
                    <Input type="number" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <FormField
            control={form.control}
            name="elevationGain"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Elevation Gain (in meters)</FormLabel>
                <FormControl>
                    <Input type="number" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
            <FormField
            control={form.control}
            name="fee"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Fee (€)</FormLabel>
                <FormControl>
                    <Input type="number" step="0.01" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
        </div>
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describe the tour in detail..."
                  className="min-h-[150px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancel
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Saving...' : 'Save Tour'}
            </Button>
        </div>
      </form>
    </Form>
  );
}

    