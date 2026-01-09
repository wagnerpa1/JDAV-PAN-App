'use client';

import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { differenceInYears } from 'date-fns';
import { doc, setDoc } from 'firebase/firestore';
import {
  Auth,
  createUserWithEmailAndPassword,
  UserCredential,
} from 'firebase/auth';


import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth, useFirestore } from '@/firebase';
import { UserPlusIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';


// Step 1: Define Schemas
const stepOneSchema = z.object({
  dob: z.string().refine((dob) => new Date(dob).toString() !== 'Invalid Date', {
    message: 'Please enter a valid date of birth.',
  }),
});

const stepTwoSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6, 'Password must be at least 6 characters.'),
  parentEmail: z.string().email('Please enter a valid parent email.').optional(),
});

type StepOneData = z.infer<typeof stepOneSchema>;
type StepTwoData = z.infer<typeof stepTwoSchema>;

// Non-blocking sign-up and user creation
function initiateEmailSignUpAndCreateUser(
  auth: Auth,
  firestore: any,
  email: string,
  password: string
): void {
  createUserWithEmailAndPassword(auth, email, password)
    .then((userCredential: UserCredential) => {
      // User created in Auth, now create Firestore document
      const user = userCredential.user;
      const userDocRef = doc(firestore, 'users', user.uid);
      const newUser = {
        id: user.uid,
        email: user.email,
        role: email === 'privat@paulwagner.net' ? 'admin' : 'user',
        profilePictureUrl: '',
      };
      // Use non-blocking setDoc
      setDocumentNonBlocking(userDocRef, newUser, { merge: true });
    })
    .catch((error) => {
      // Handle Auth errors (e.g., email already in use)
      console.error('Error during sign up or user creation:', error);
      // Optionally, you can use a toast to notify the user of the error
    });
}


export default function SignupPage() {
  const [step, setStep] = useState(1);
  const [age, setAge] = useState<number | null>(null);
  const auth = useAuth();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const stepOneForm = useForm<StepOneData>({
    resolver: zodResolver(stepOneSchema),
    defaultValues: {
      dob: '',
    },
  });

  const stepTwoForm = useForm<StepTwoData>({
    resolver: zodResolver(stepTwoSchema),
    defaultValues: {
      email: '',
      password: '',
      parentEmail: '',
    },
  });

  const handleStepOneSubmit = (data: StepOneData) => {
    const calculatedAge = differenceInYears(new Date(), new Date(data.dob));
    setAge(calculatedAge);
    setStep(2);

    if (calculatedAge < 14) {
      stepTwoForm.trigger('parentEmail'); // Optional: trigger validation early
    }
  };

  const handleStepTwoSubmit = (data: StepTwoData) => {
    initiateEmailSignUpAndCreateUser(auth, firestore, data.email, data.password);
    toast({
      title: 'Account Creation Initiated',
      description: "We're setting up your account. You'll be redirected shortly.",
    });
    router.push('/');
  };

  const getAgeGroupDescription = () => {
    if (age === null) return '';
    if (age < 14) {
      return "You are under 14. A parent's email is required for confirmation.";
    }
    if (age >= 14 && age < 18) {
      return "You are between 14 and 18. A parent's email is recommended.";
    }
    return 'You are over 18. You can register directly.';
  };

  return (
    <div className="container mx-auto flex h-full items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 inline-block rounded-full bg-primary p-3">
            <UserPlusIcon className="h-8 w-8 text-primary-foreground" />
          </div>
          <CardTitle>Create an Account</CardTitle>
          <CardDescription>
            {step === 1 ? "First, let's get your date of birth." : getAgeGroupDescription()}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === 1 ? (
            <Form {...stepOneForm}>
              <form onSubmit={stepOneForm.handleSubmit(handleStepOneSubmit)} className="space-y-6">
                <FormField
                  control={stepOneForm.control}
                  name="dob"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date of Birth</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full">
                  Next
                </Button>
              </form>
            </Form>
          ) : (
            <Form {...stepTwoForm}>
              <form onSubmit={stepTwoForm.handleSubmit(handleStepTwoSubmit)} className="space-y-4">
                <FormField
                  control={stepTwoForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="name@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={stepTwoForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {age !== null && age < 18 && (
                  <FormField
                    control={stepTwoForm.control}
                    name="parentEmail"
                    rules={{ required: age < 14 }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Parent's Email {age < 14 ? '(Required)' : '(Optional)'}
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="parent@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                <Button type="submit" className="w-full">
                  Sign Up
                </Button>
              </form>
            </Form>
          )}
          <div className="mt-6 text-center text-sm">
            Already have an account?{' '}
            <Link href="/login" className="font-medium text-primary hover:underline">
              Sign In
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
