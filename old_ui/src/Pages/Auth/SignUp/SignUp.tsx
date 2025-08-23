import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FaApple } from 'react-icons/fa6';
import { FaGoogle, FaFacebook } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import Image from '../../../assets/donate_illustration.jpg';
import { usePrivy, useLoginWithEmail, useSolanaWallets } from '@privy-io/react-auth';

const SignUp = ({ className, ...props }: React.ComponentProps<'div'>) => {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const { ready, authenticated, user } = usePrivy();
  const { sendCode, loginWithCode, state } = useLoginWithEmail();
  const { createWallet } = useSolanaWallets();

  useEffect(() => {
    if (state.status === 'error') {
      setCode(''); // clear code input on error
    }
    if (code.length === 6 && state.status === 'awaiting-code-input') {
      loginWithCode({ code });
    }
  }, [code, state.status]);

  const handleEmailSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    sendCode({ email });
  };

  const handleCodeSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    loginWithCode({ code });
  };

  if (authenticated && !user?.wallet) {
    createWallet();
  }

  if (authenticated) {
    return (
      <div className="flex flex-col items-center justify-center p-6 md:p-8">
        <h2 className="text-2xl font-Lora font-bold mb-4">You're logged in!</h2>
        <p className="text-center mb-6">You can now access all features of IB4ME.</p>
        <Link to="/" className="text-blue-600 hover:underline">
          Go to Home
        </Link>
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      <Card className="overflow-hidden">
        <CardContent className="grid p-0 md:grid-cols-2">
          <div className="p-6 md:p-8">
            <div className="flex flex-col gap-6">
              <div className="flex flex-col items-center text-center">
                <h1 className="text-2xl font-Lora font-bold">Ib4me</h1>
                <p className="text-balance font-pt-serif text-neutral-800">Create an account</p>
              </div>

              {!ready ? (
                <div className="flex justify-center items-center p-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {(state.status === 'initial' ||
                    state.status === 'error' ||
                    state.status === 'sending-code') && (
                    <form onSubmit={handleEmailSubmit} className="flex flex-col gap-4">
                      <div className="grid gap-2 font-lexend-deca">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          placeholder="m@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                        />
                      </div>
                      <Button
                        type="submit"
                        className="w-full font-lexend-deca cursor-pointer"
                        disabled={state.status === 'sending-code'}
                      >
                        {state.status === 'sending-code' ? 'Sending...' : 'Continue with Email'}
                      </Button>
                    </form>
                  )}

                  {(state.status === 'awaiting-code-input' ||
                    state.status === 'submitting-code') && (
                    <form onSubmit={handleCodeSubmit} className="flex flex-col gap-4">
                      <div className="grid gap-2 font-lexend-deca">
                        <Label htmlFor="code">Verification Code</Label>
                        <p className="text-sm text-muted-foreground mb-2">
                          Enter the 6-digit code sent to {email}
                        </p>
                        <Input
                          id="code"
                          name="code"
                          type="text"
                          placeholder="123456"
                          value={code}
                          onChange={(e) => setCode(e.target.value)}
                          maxLength={6}
                          pattern="[0-9]{6}"
                          required
                        />
                      </div>
                      <Button
                        type="submit"
                        className="w-full font-lexend-deca cursor-pointer"
                        disabled={state.status === 'submitting-code' || code.length !== 6}
                      >
                        {state.status === 'submitting-code' ? 'Verifying...' : 'Verify Code'}
                      </Button>
                    </form>
                  )}

                  {state.status === 'error' && (
                    <p className="text-sm text-red-500 text-center">
                      {state.error?.message ?? 'Something went wrong. Please try again.'}
                    </p>
                  )}
                </div>
              )}
              <div className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border">
                <span className="relative z-10 bg-background px-2 text-muted-foreground">
                  Or continue with
                </span>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <Button variant="outline" className="w-full cursor-pointer">
                  <FaApple />
                  <span className="sr-only">Login with Apple</span>
                </Button>
                <Button variant="outline" className="w-full cursor-pointer">
                  <FaGoogle />
                  <span className="sr-only">Login with Google</span>
                </Button>
                <Button variant="outline" className="w-full cursor-pointer">
                  <FaFacebook />
                  <span className="sr-only">Login with Facebook</span>
                </Button>
              </div>
              <div className="text-center text-sm">
                Already have an account?{' '}
                <Link to="/auth/sign-in" className="underline underline-offset-4">
                  Sign in
                </Link>
              </div>
            </div>
          </div>
          <div className="relative hidden bg-muted md:block">
            <img
              src={Image}
              alt="Image"
              className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
            />
          </div>
        </CardContent>
      </Card>
      <div className="text-balance text-center text-neutral-700 text-xs  [&_a]:underline [&_a]:underline-offset-4 hover:[&_a]:text-primary">
        By clicking continue, you agree to our <a href="#">Terms of Service</a> and{' '}
        <a href="#">Privacy Policy</a>.
      </div>
    </div>
  );
};

export default SignUp;
