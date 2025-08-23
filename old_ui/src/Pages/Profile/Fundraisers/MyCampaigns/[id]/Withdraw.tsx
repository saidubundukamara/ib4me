import type React from 'react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { ArrowLeft, BanknoteIcon as BankIcon, CreditCard, InfoIcon, Wallet } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import Footer from '@/components/utils/Footer';
import { Navbar } from '@/components/utils/Navbar';

const Withdraw: React.FC<{ params: { id: string } }> = ({ params }) => {
  const navigate = useNavigate();
  const campaignId = params.id;

  const campaign = {
    id: Number.parseInt(campaignId),
    title: "Help Sarah's Cancer Treatment",
    raised: 12500,
    goal: 25000,
    availableToWithdraw: 11875,
    previouslyWithdrawn: 0,
    platformFee: 625,
    status: 'active',
  };

  const [withdrawalAmount, setWithdrawalAmount] = useState<string>(
    campaign.availableToWithdraw.toString(),
  );
  const [paymentMethod, setPaymentMethod] = useState('bank');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleWithdrawal = (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    // Simulate API call
    setTimeout(() => {
      setIsProcessing(false);
      toast('Withdrawal initiated', {});
      navigate(`/campaign/${campaignId}`);
    }, 1500);
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '' || /^\d+(\.\d{0,2})?$/.test(value)) {
      const numValue = Number.parseFloat(value || '0');
      if (numValue <= campaign.availableToWithdraw) {
        setWithdrawalAmount(value);
      }
    }
  };

  const handleMaxAmount = () => {
    setWithdrawalAmount(campaign.availableToWithdraw.toString());
  };

  return (
    <div>
      <Navbar />
      <main className="flex-1 py-8">
        <div className="container max-w-4xl px-4 md:px-6">
          <div className="mb-6">
            <Button variant="ghost" size="sm" asChild className="mb-4">
              <Link to={`/my-campaigns`}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to My Campaigns
              </Link>
            </Button>
            <h1 className="text-3xl font-bold tracking-tight">Withdraw Funds</h1>
            <p className="text-muted-foreground mt-1">
              Withdraw available funds from your campaign to your bank account or payment method
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-[1fr_350px]">
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Withdrawal Details</CardTitle>
                  <CardDescription>
                    Enter the amount you want to withdraw and select your payment method
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleWithdrawal}>
                    <div className="grid gap-6">
                      <div className="grid gap-3">
                        <Label htmlFor="amount">Withdrawal Amount</Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                            $
                          </span>
                          <Input
                            id="amount"
                            type="text"
                            className="pl-7"
                            value={withdrawalAmount}
                            onChange={handleAmountChange}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 text-xs"
                            onClick={handleMaxAmount}
                          >
                            Max
                          </Button>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Available to withdraw: ${campaign.availableToWithdraw.toLocaleString()}
                        </p>
                      </div>

                      <div className="grid gap-3">
                        <Label>Payment Method</Label>
                        <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                          <div className="flex items-center space-x-2 border rounded-md p-3">
                            <RadioGroupItem value="bank" id="bank" />
                            <Label htmlFor="bank" className="flex items-center cursor-pointer">
                              <BankIcon className="mr-2 h-4 w-4" />
                              Bank Account
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2 border rounded-md p-3">
                            <RadioGroupItem value="card" id="card" />
                            <Label htmlFor="card" className="flex items-center cursor-pointer">
                              <CreditCard className="mr-2 h-4 w-4" />
                              Debit Card
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2 border rounded-md p-3">
                            <RadioGroupItem value="paypal" id="paypal" />
                            <Label htmlFor="paypal" className="flex items-center cursor-pointer">
                              <Wallet className="mr-2 h-4 w-4" />
                              PayPal
                            </Label>
                          </div>
                        </RadioGroup>
                      </div>

                      {paymentMethod === 'bank' && (
                        <div className="grid gap-4">
                          <div className="grid gap-2">
                            <Label htmlFor="account-name">Account Holder Name</Label>
                            <Input id="account-name" placeholder="John Doe" />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="account-number">Account Number</Label>
                            <Input id="account-number" placeholder="XXXX-XXXX-XXXX-XXXX" />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="routing-number">Routing Number</Label>
                            <Input id="routing-number" placeholder="XXXXXXXXX" />
                          </div>
                        </div>
                      )}

                      {paymentMethod === 'card' && (
                        <div className="grid gap-4">
                          <div className="grid gap-2">
                            <Label htmlFor="card-name">Name on Card</Label>
                            <Input id="card-name" placeholder="John Doe" />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="card-number">Card Number</Label>
                            <Input id="card-number" placeholder="XXXX-XXXX-XXXX-XXXX" />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                              <Label htmlFor="expiry">Expiry Date</Label>
                              <Input id="expiry" placeholder="MM/YY" />
                            </div>
                            <div className="grid gap-2">
                              <Label htmlFor="cvc">CVC</Label>
                              <Input id="cvc" placeholder="XXX" />
                            </div>
                          </div>
                        </div>
                      )}

                      {paymentMethod === 'paypal' && (
                        <div className="grid gap-2">
                          <Label htmlFor="paypal-email">PayPal Email</Label>
                          <Input
                            id="paypal-email"
                            type="email"
                            placeholder="your-email@example.com"
                          />
                        </div>
                      )}

                      <div className="mt-4">
                        <Button type="submit" className="w-full" disabled={isProcessing}>
                          {isProcessing ? 'Processing...' : 'Withdraw Funds'}
                        </Button>
                      </div>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Campaign Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-medium mb-1">{campaign.title}</h3>
                      <Badge variant="outline" className="mb-2">
                        {campaign.status === 'active' ? 'Active Campaign' : 'Ended Campaign'}
                      </Badge>

                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium">${campaign.raised.toLocaleString()}</span>
                          <span className="text-muted-foreground">
                            of ${campaign.goal.toLocaleString()}
                          </span>
                        </div>
                        <Progress value={(campaign.raised / campaign.goal) * 100} className="h-2" />
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Total Raised</span>
                        <span className="font-medium">${campaign.raised.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <div className="flex items-center">
                          <span className="text-sm">Platform Fee (5%)</span>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <InfoIcon className="h-3.5 w-3.5 ml-1 text-muted-foreground" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="w-[200px] text-xs">
                                  A 5% platform fee is applied to all donations to cover operating
                                  costs and payment processing.
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          -${campaign.platformFee.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Previously Withdrawn</span>
                        <span className="text-sm text-muted-foreground">
                          ${campaign.previouslyWithdrawn.toLocaleString()}
                        </span>
                      </div>
                      <Separator />
                      <div className="flex justify-between">
                        <span className="font-medium">Available to Withdraw</span>
                        <span className="font-medium">
                          ${campaign.availableToWithdraw.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Withdrawal Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 text-sm">
                    <p>
                      Funds are typically processed within 3-5 business days after withdrawal is
                      initiated.
                    </p>
                    <p>
                      For security purposes, your first withdrawal may require additional
                      verification.
                    </p>
                    <p>
                      There is no minimum withdrawal amount, but a $0.25 fee applies to withdrawals
                      under $100.
                    </p>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button variant="outline" size="sm" asChild className="w-full">
                    <Link to="/help-center/withdrawals">Learn more about withdrawals</Link>
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Withdraw;
