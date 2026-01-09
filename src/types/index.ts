
export interface Tour {
    id: string;
    title: string;
    startDate: string;
    endDate: string;
    location: string;
    description: string;
    participantLimit: number;
    ageGroupId: string;
    leaderId: string;
}

export interface UserProfile {
    id: string;
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

    