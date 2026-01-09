'use client';

import { TourForm } from '../TourForm';

export default function NewTourPage() {
  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Create New Tour</h1>
        <TourForm />
      </div>
    </div>
  );
}
