'use client';

import { useState } from 'react';
import { collection, writeBatch, doc } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { RocketIcon, AlertTriangleIcon } from 'lucide-react';

const sampleTours = [
  {
    id: 'tour-1',
    title: "Sunset Hike to Eagle's Peak",
    startDate: new Date(new Date().setDate(new Date().getDate() + 7)).toISOString(),
    endDate: new Date(new Date().setDate(new Date().getDate() + 7)).toISOString(),
    location: 'Alpine National Park',
    description: 'A scenic hike to the famous Eagle\'s Peak, timed perfectly to watch the sunset over the mountains. This is a moderately challenging trail suitable for most fitness levels.',
    participantLimit: 20,
    ageGroupId: 'adults',
    leaderId: 'tour-leader-1'
  },
  {
    id: 'tour-2',
    title: '3-Day Glacier Lake Kayak Adventure',
    startDate: new Date(new Date().setDate(new Date().getDate() + 14)).toISOString(),
    endDate: new Date(new Date().setDate(new Date().getDate() + 16)).toISOString(),
    location: 'Glacier Lake',
    description: 'Spend three days kayaking on the crystal-clear waters of Glacier Lake. We will explore hidden coves and enjoy a picnic on a secluded beach. Basic swimming skills required.',
    participantLimit: 15,
    ageGroupId: 'adults',
    leaderId: 'tour-leader-2'
  },
  {
    id: 'tour-3',
    title: 'Beginner\'s Rock Climbing at Granite Falls',
    startDate: new Date(new Date().setDate(new Date().getDate() + 21)).toISOString(),
    endDate: new Date(new Date().setDate(new Date().getDate() + 21)).toISOString(),
    location: 'Granite Falls',
    description: 'Learn the basics of rock climbing and rappelling in a safe and supportive environment. All equipment is provided. No prior experience necessary!',
    participantLimit: 10,
    ageGroupId: 'youth',
    leaderId: 'tour-leader-3'
  }
];

const sampleMaterials = [
  { id: "climbing-rope", name: "Climbing Rope", description: "60m dynamic rope for all climbing activities.", price: 5, quantityAvailable: 10 },
  { id: "harness", name: "Harness", description: "Standard climbing harness, adjustable.", price: 3, quantityAvailable: 10 },
  { 
    id: "climbing-shoes", 
    name: "Climbing Shoes", 
    description: "High-performance climbing shoes for grip and precision.", 
    price: 4, 
    quantityAvailable: 100, // Total quantity across all sizes
    sizes: { "38": 10, "39": 10, "40": 10, "41": 10, "42": 10, "43": 10, "44": 10, "45": 10, "46": 10, "47": 10 } 
  },
  { id: "via-ferrata-set", name: "Via Ferrata Set", description: "Includes energy-absorbing lanyards and carabiners.", price: 8, quantityAvailable: 10 },
  { id: "helmet", name: "Helmet", description: "Essential for climbing and via ferrata.", price: 2, quantityAvailable: 10 },
  { id: "crampons", name: "Crampons", description: "For glacier travel and icy conditions.", price: 7, quantityAvailable: 10 },
  { id: "ice-axe", name: "Ice Axe", description: "General-purpose ice axe for mountaineering.", price: 6, quantityAvailable: 10 },
  { id: "bivi-sack", name: "Bivy Sack", description: "Emergency waterproof bivouac sack.", price: 3, quantityAvailable: 10 },
  { id: "avalanche-safety-kit", name: "Avalanche Safety Equipment", description: "Kit includes a transceiver, shovel, and probe.", price: 15, quantityAvailable: 10 },
  { id: "snowshoes", name: "Snowshoes", description: "For winter hiking in deep snow.", price: 5, quantityAvailable: 10 },
];

export default function SeedDataPage() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSeed = async (dataType: 'tours' | 'materials') => {
    if (!firestore) {
      setError("Firestore is not initialized.");
      return;
    }

    setIsLoading(true);
    setError(null);
    const batch = writeBatch(firestore);
    
    try {
      if (dataType === 'tours') {
        sampleTours.forEach(tour => {
          const docRef = doc(firestore, 'tours', tour.id);
          batch.set(docRef, tour);
        });
      } else if (dataType === 'materials') {
        sampleMaterials.forEach(item => {
          const docRef = doc(firestore, 'materials', item.id);
          batch.set(docRef, item);
        });
      }

      await batch.commit();

      toast({
        title: "Success!",
        description: `Sample ${dataType} have been added to the database.`,
      });
    } catch (e: any) {
      console.error("Error seeding data:", e);
      setError(e.message);
      toast({
        variant: "destructive",
        title: "Uh oh! Something went wrong.",
        description: `Could not seed ${dataType}. Check the console for more details.`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="flex items-center gap-4 mb-8">
        <RocketIcon className="h-10 w-10 text-primary" />
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Database Seed Utility
        </h1>
      </div>

      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Seed Sample Tours</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Click the button below to add three fictional tours to your 'tours' collection in Firestore. This will overwrite any existing tours with the same IDs.
            </p>
            <Button onClick={() => handleSeed('tours')} disabled={isLoading}>
              {isLoading ? 'Seeding...' : 'Seed Tours'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Seed Sample Materials</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Click the button below to add the standard set of rental materials to your 'materials' collection in Firestore. This will overwrite any existing materials with the same IDs.
            </p>
            <Button onClick={() => handleSeed('materials')} disabled={isLoading}>
              {isLoading ? 'Seeding...' : 'Seed Materials'}
            </Button>
          </CardContent>
        </Card>

        {error && (
          <Alert variant="destructive">
            <AlertTriangleIcon className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
}

    