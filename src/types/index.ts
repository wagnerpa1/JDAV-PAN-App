

export interface Tour {
    id: string;
    title: string;
    startDate: string;
    endDate: string;
    registrationDeadline: string;
    location: string;
    description: string;
    participantLimit: number;
    ageGroupId: string;
    leaderId: string;
    duration: string;
    elevationGain: number;
    fee: number;
}

export interface UserProfile {
    id: string;
    name: string;
    email: string;
    role: 'user' | 'admin';
    profilePictureUrl?: string;
}

export interface Participant {
    userId: string;
    tourId: string;
    joinedAt: string;
    user?: UserProfile; // Optional: denormalized user data
}

export interface Post {
    id: string;
    content: string;
    authorId: string;
    authorName: string;
    createdAt: string;
    color: string;
}

export interface Comment {
    id: string;
    postId: string;
    content: string;
    authorId: string;
    authorName: string;
    createdAt: string;
}

export interface Material {
  id: string;
  name: string;
  description: string;
  quantityAvailable: number;
  price: number;
  sizes?: Record<string, number>;
}

export interface MaterialReservation {
  id: string;
  userId: string;
  materialId: string;
  quantityReserved: number;
  startDate: string;
  endDate: string;
  status: 'pending' | 'approved' | 'rejected';
  reservationDate: string;
}
