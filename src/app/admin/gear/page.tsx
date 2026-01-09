'use client';

import { useMemo } from 'react';
import {
  collection,
  query,
  orderBy,
} from 'firebase/firestore';
import {
  useCollection,
  useFirestore,
  useMemoFirebase,
} from '@/firebase';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { PackageIcon, AlertTriangleIcon, ChevronRightIcon } from 'lucide-react';
import type { Material } from '@/types';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function GearManagementPage() {
  const firestore = useFirestore();

  const materialsQuery = useMemoFirebase(
    () => query(collection(firestore, 'materials'), orderBy('name', 'asc')),
    [firestore]
  );
  const {
    data: materials,
    isLoading,
    error,
  } = useCollection<Material>(materialsQuery);

  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="flex items-center gap-4 mb-8">
        <PackageIcon className="h-10 w-10 text-primary" />
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Gear Management
        </h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Equipment</CardTitle>
          <CardDescription>
            View all available gear and see current reservations by selecting an item.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Available Quantity</TableHead>
                <TableHead className="text-right">View</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                [...Array(5)].map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-5 w-3/4" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-1/2" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                  </TableRow>
                ))
              )}
              {error && (
                <TableRow>
                  <TableCell colSpan={3}>
                    <Alert variant="destructive" className="mt-4">
                      <AlertTriangleIcon className="h-4 w-4" />
                      <AlertTitle>Error Loading Gear</AlertTitle>
                      <AlertDescription>{error.message}</AlertDescription>
                    </Alert>
                  </TableCell>
                </TableRow>
              )}
              {!isLoading && materials && (
                <>
                  {materials.length > 0 ? (
                    materials.map((material) => (
                      <TableRow key={material.id}>
                        <TableCell className="font-medium">{material.name}</TableCell>
                        <TableCell>{material.quantityAvailable}</TableCell>
                        <TableCell className="text-right">
                          <Button asChild variant="ghost" size="icon">
                            <Link href={`/admin/gear/${material.id}`}>
                              <ChevronRightIcon className="h-4 w-4" />
                              <span className="sr-only">View Reservations</span>
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-muted-foreground p-8">
                        No materials found.
                      </TableCell>
                    </TableRow>
                  )}
                </>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
