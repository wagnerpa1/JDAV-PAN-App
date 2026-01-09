'use client';

import { useMemo, useState } from 'react';
import { collection, query, orderBy, doc, writeBatch, serverTimestamp } from 'firebase/firestore';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { TentIcon, AlertTriangleIcon, PackageIcon, CircleDollarSignIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import type { Material } from '@/types';

const reservationSchema = z.object({
  startDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Please enter a valid start date.',
  }),
  endDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Please enter a valid end date.',
  }),
  quantity: z.coerce.number().int().min(1, 'Quantity must be at least 1.'),
}).refine(data => new Date(data.endDate) >= new Date(data.startDate), {
  message: 'End date must be on or after the start date.',
  path: ['endDate'],
});

type ReservationFormData = z.infer<typeof reservationSchema>;

function ReservationDialog({ material, children }: { material: Material, children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();

  const form = useForm<ReservationFormData>({
    resolver: zodResolver(reservationSchema),
    defaultValues: {
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
      quantity: 1,
    },
  });

  const onSubmit = (data: ReservationFormData) => {
    if (!firestore || !user) {
      toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in to make a reservation.' });
      return;
    }

    const reservationData = {
      userId: user.uid,
      materialId: material.id,
      quantityReserved: data.quantity,
      startDate: new Date(data.startDate).toISOString(),
      endDate: new Date(data.endDate).toISOString(),
      status: 'pending',
      reservationDate: new Date().toISOString(),
    };

    // Reservations are created under the user's subcollection
    const reservationRef = collection(firestore, 'users', user.uid, 'materialReservations');
    addDocumentNonBlocking(reservationRef, reservationData);

    toast({
      title: 'Reservation Request Sent',
      description: `Your request for ${material.name} has been sent for approval.`,
    });
    setOpen(false);
    form.reset();
  };


  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reserve: {material.name}</DialogTitle>
          <DialogDescription>
            Select the dates and quantity you need. Your request will be sent to an admin for approval.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
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
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantity</FormLabel>
                    <FormControl>
                      <Input type="number" min="1" max={material.quantityAvailable} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Submitting...' : 'Submit Request'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

export default function MaterialPage() {
  const firestore = useFirestore();

  const materialsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'materials'),
      orderBy('name', 'asc')
    );
  }, [firestore]);

  const { data: materials, isLoading, error } = useCollection<Material>(materialsQuery);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
    }).format(price);
  };

  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="flex items-center gap-4 mb-8">
        <TentIcon className="h-10 w-10 text-primary" />
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Material & Equipment
        </h1>
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="shadow-lg rounded-xl">
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full mt-2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
              <CardFooter className="flex justify-between items-center">
                 <Skeleton className="h-6 w-1/4" />
                 <Skeleton className="h-10 w-1/3" />
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertTriangleIcon className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Could not fetch materials. Please check your connection or permissions.
          </AlertDescription>
        </Alert>
      )}

      {!isLoading && !error && materials && (
        <>
          {materials.length > 0 ? (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {materials.map((item) => (
                <Card key={item.id} className="shadow-lg rounded-xl flex flex-col">
                  <CardHeader>
                    <CardTitle className="text-xl font-semibold">{item.name}</CardTitle>
                    <CardDescription className="text-sm pt-2">{item.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-grow space-y-4">
                     <div className="flex items-center gap-2 text-muted-foreground">
                        <PackageIcon className="h-4 w-4"/>
                        <span>{item.quantityAvailable > 0 ? `${item.quantityAvailable} available` : 'Out of stock'}</span>
                     </div>
                     <div className="flex items-center gap-2 text-muted-foreground">
                        <CircleDollarSignIcon className="h-4 w-4"/>
                        <span>{formatPrice(item.price)} / day</span>
                     </div>
                     {item.sizes && (
                        <div className="pt-2">
                            <h4 className="text-sm font-medium mb-2">Available Sizes:</h4>
                            <div className="flex flex-wrap gap-2">
                                {Object.keys(item.sizes).map(size => (
                                    <Badge key={size} variant="secondary">{size}</Badge>
                                ))}
                            </div>
                        </div>
                     )}
                  </CardContent>
                  <CardFooter>
                    <ReservationDialog material={item}>
                       <Button className="w-full" disabled={item.quantityAvailable === 0}>
                        {item.quantityAvailable > 0 ? 'Request Reservation' : 'Unavailable'}
                      </Button>
                    </ReservationDialog>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 border-2 border-dashed rounded-xl">
              <p className="text-muted-foreground">No materials found in the database.</p>
              <p className="text-sm text-muted-foreground mt-2">Try seeding the database from the Seed Data page.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
