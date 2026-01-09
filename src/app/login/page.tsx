'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth, initiateEmailSignUp, initiateEmailSignIn, initiateAnonymousSignIn, useUser } from '@/firebase';
import { LogInIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

const formSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
});

type FormData = z.infer<typeof formSchema>;

export default function LoginPage() {
  const auth = useAuth();
  const { user } = useUser();
  const router = useRouter();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  useEffect(() => {
    if (user) {
      router.push('/');
    }
  }, [user, router]);

  const handleSignUp = (data: FormData) => {
    initiateEmailSignUp(auth, data.email, data.password);
  };

  const handleSignIn = (data: FormData) => {
    initiateEmailSignIn(auth, data.email, data.password);
  };

  const handleAnonymousSignIn = () => {
    initiateAnonymousSignIn(auth);
  };

  return (
    <div className="container mx-auto flex h-full items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 inline-block rounded-full bg-primary p-3">
            <LogInIcon className="h-8 w-8 text-primary-foreground" />
          </div>
          <CardTitle>Welcome</CardTitle>
          <CardDescription>Sign in to your account or create a new one</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form className="space-y-6">
              <FormField
                control={form.control}
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
                control={form.control}
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
              <div className="flex flex-col gap-4 sm:flex-row">
                <Button onClick={form.handleSubmit(handleSignIn)} className="flex-1">
                  Sign In
                </Button>
                <Button onClick={form.handleSubmit(handleSignUp)} variant="secondary" className="flex-1">
                  Sign Up
                </Button>
              </div>
            </form>
          </Form>
          <div className="my-6 flex items-center">
            <div className="flex-grow border-t border-muted" />
            <span className="mx-4 flex-shrink text-xs uppercase text-muted-foreground">Or</span>
            <div className="flex-grow border-t border-muted" />
          </div>
          <Button onClick={handleAnonymousSignIn} variant="outline" className="w-full">
            Continue as Guest
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
