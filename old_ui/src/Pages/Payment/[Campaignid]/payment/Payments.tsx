import type React from 'react';
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Check, Info, Lock, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { campaigns } from '@/components/Campaigns/campaign-data';
import { Campaigninfo } from '../../../../Types/campaign.types';
import OrangeMoney from '../../../../assets/Orange_Money.svg';
import Qmoney from '../../../../assets/qmoney.svg';
import Paypal from '../../../../assets/paypal.svg';
import Afrimoney from '../../../../assets/afrimoney.svg';
import VisaCard from '../../../../assets/visa.svg';
import Mastercard from '../../../../assets/mastercard.svg';
import Logo from '../../../../assets/ib4me_logo.png';

const Payments: React.FC = () => {
  const [campaign, setCampaign] = useState<Campaigninfo | null>(null);
  const { campaignId } = useParams<{ campaignId: string }>();
  const [paymentMethod, setPaymentMethod] = useState('credit-card');
  const [donationAmount, setDonationAmount] = useState<string>('50');
  const [customAmount, setCustomAmount] = useState<string>('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [message, setMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    const foundCampaign = campaigns.find((c) => c.id === campaignId);
    if (foundCampaign) {
      setCampaign(foundCampaign);
    }
  }, [campaignId]);

  // Credit card form state
  const [cardDetails, setCardDetails] = useState({
    name: '',
    number: '',
    expiry: '',
    cvc: '',
  });

  // Mobile money form state
  const [mobileMoneyDetails, setMobileMoneyDetails] = useState({
    provider: 'orange',
    phoneNumber: '',
    accountName: '',
  });

  // PayPal form state
  const [paypalEmail, setPaypalEmail] = useState('');

  // Personal details form state
  const [personalDetails, setPersonalDetails] = useState({
    firstName: '',
    lastName: '',
    email: '',
    country: 'Sierra Leone',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form based on payment method
    if (paymentMethod === 'credit-card') {
      if (!cardDetails.name || !cardDetails.number || !cardDetails.expiry || !cardDetails.cvc) {
        toast('Missing information', {
          description: 'Please fill in all required card details.',
          action: {
            label: 'destructive',
            onClick: () => console.log('Undo'),
          },
        });
        return;
      }

      if (cardDetails.number.replace(/\s/g, '').length !== 16) {
        toast('Invalid card number', {
          description: 'Please enter a valid 16-digit card number.',
          action: {
            label: 'destructive',
            onClick: () => console.log('Undo'),
          },
        });
        return;
      }
    } else if (paymentMethod === 'mobile-money') {
      if (!mobileMoneyDetails.phoneNumber || !mobileMoneyDetails.accountName) {
        toast('Missing information', {
          description: 'Please fill in all required mobile money details.',
          action: {
            label: 'destructive',
            onClick: () => console.log('Undo'),
          },
        });
        return;
      }

      if (mobileMoneyDetails.phoneNumber.length < 10) {
        toast('Invalid phone number', {
          description: 'Please enter a valid phone number.',
          action: {
            label: 'destructive',
            onClick: () => console.log('Undo'),
          },
        });
        return;
      }
    } else if (paymentMethod === 'paypal') {
      if (!paypalEmail) {
        toast('Missing information', {
          description: 'Please enter your PayPal email address.',
          action: {
            label: 'destructive',
            onClick: () => console.log('Undo'),
          },
        });
        return;
      }

      if (!paypalEmail.includes('@')) {
        toast('Invalid email', {
          description: 'Please enter a valid email address.',
          action: {
            label: 'destructive',
            onClick: () => console.log('Undo'),
          },
        });
        return;
      }
    }

    // Validate personal details
    if (!personalDetails.firstName || !personalDetails.lastName || !personalDetails.email) {
      toast('Missing information', {
        description: 'Please fill in all required personal details.',
        action: {
          label: 'destructive',
          onClick: () => console.log('Undo'),
        },
      });
      return;
    }

    // Validate donation amount
    const finalAmount = donationAmount === 'custom' ? Number(customAmount) : Number(donationAmount);
    if (isNaN(finalAmount) || finalAmount <= 0) {
      toast('Invalid amount', {
        description: 'Please enter a valid donation amount.',
        action: {
          label: 'destructive',
          onClick: () => console.log('Undo'),
        },
      });
      return;
    }

    // Process payment
    setIsProcessing(true);

    // Simulate API call
    setTimeout(() => {
      setIsProcessing(false);
      setIsComplete(true);

      // In a real app, you would redirect to a success page or show a success message
      toast('Donation successful!', {
        description: `Thank you for your donation of $${finalAmount.toFixed(2)}.`,
      });
    }, 2000);
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }

    if (parts.length) {
      return parts.join(' ');
    } else {
      return value;
    }
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedValue = formatCardNumber(e.target.value);
    setCardDetails({ ...cardDetails, number: formattedValue });
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');

    if (value.length > 2) {
      value = value.substring(0, 2) + '/' + value.substring(2, 4);
    }

    setCardDetails({ ...cardDetails, expiry: value });
  };

  if (!campaign) {
    return <div>Loading campaign...</div>;
  }

  return (
    <div className="flex flex-col min-h-screen">
      <header className="border-b">
        <div className="container mx-auto max-w-7xl flex h-16 items-center justify-between">
          <div className="flex items-center gap-6">
            <Link to={`/campaign/${campaignId}`} className="flex items-center gap-2">
              <ArrowLeft className="h-5 w-5" />
              <span>Back to Campaign</span>
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center gap-2">
              <img src={Logo} alt="ib4me logo" className="w-34 h-24 object-contain" />
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 py-8">
        <div className="container mx-auto px-4 md:px-6 max-w-5xl">
          {isComplete ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="rounded-full bg-neutral-100 p-4 mb-4">
                <Check className="h-8 w-8 text-green-600" />
              </div>
              <h1 className="text-3xl font-Lora font-bold mb-2">Thank You for Your Donation!</h1>
              <p className="text-muted-foreground font-pt-serif mb-6 max-w-md">
                Your generous contribution will help make a difference. A confirmation receipt has
                been sent to your email.
              </p>

              <Card className="w-full max-w-md mb-8">
                <CardHeader>
                  <CardTitle>Donation Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Campaign:</span>
                    <span className="font-medium">{campaign.title}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Amount:</span>
                    <span className="font-medium">
                      ${donationAmount === 'custom' ? customAmount : donationAmount}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Date:</span>
                    <span className="font-medium">{new Date().toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Transaction ID:</span>
                    <span className="font-medium">
                      TXN-{Math.random().toString(36).substring(2, 10).toUpperCase()}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link to={`/campaign/${campaignId}`}>
                  <Button variant="outline">Return to Campaign</Button>
                </Link>
                <Link to="/campaigns">
                  <Button>Explore More Campaigns</Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-8">
              <div className="md:col-span-2">
                <div className="mb-6">
                  <h1 className="text-2xl font-bold font-Lora mb-2">Make a Donation</h1>
                  <p className="text-muted-foreground font-pt-serif">
                    Your contribution will help fund {campaign.title}
                  </p>
                </div>

                <form onSubmit={handleSubmit}>
                  <div className="space-y-6">
                    {/* Donation Amount */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Donation Amount</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <RadioGroup
                          value={donationAmount}
                          onValueChange={setDonationAmount}
                          className="grid grid-cols-2 sm:grid-cols-4 gap-4"
                        >
                          <div>
                            <RadioGroupItem value="25" id="amount-25" className="sr-only peer" />
                            <Label
                              htmlFor="amount-25"
                              className="flex h-12 items-center justify-center rounded-md border border-muted bg-popover peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/10 peer-data-[state=checked]:text-primary"
                            >
                              $25
                            </Label>
                          </div>
                          <div>
                            <RadioGroupItem value="50" id="amount-50" className="sr-only peer" />
                            <Label
                              htmlFor="amount-50"
                              className="flex h-12 items-center justify-center rounded-md border border-muted bg-popover peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/10 peer-data-[state=checked]:text-primary"
                            >
                              $50
                            </Label>
                          </div>
                          <div>
                            <RadioGroupItem value="100" id="amount-100" className="sr-only peer" />
                            <Label
                              htmlFor="amount-100"
                              className="flex h-12 items-center justify-center rounded-md border border-muted bg-popover peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/10 peer-data-[state=checked]:text-primary"
                            >
                              $100
                            </Label>
                          </div>
                          <div>
                            <RadioGroupItem
                              value="custom"
                              id="amount-custom"
                              className="sr-only peer"
                            />
                            <Label
                              htmlFor="amount-custom"
                              className="flex h-12 items-center justify-center rounded-md border border-muted bg-popover peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/10 peer-data-[state=checked]:text-primary"
                            >
                              Custom
                            </Label>
                          </div>
                        </RadioGroup>

                        {donationAmount === 'custom' && (
                          <div className="mt-4">
                            <Label htmlFor="custom-amount">Custom Amount ($)</Label>
                            <div className="relative mt-1">
                              <Input
                                id="custom-amount"
                                placeholder="Enter amount"
                                value={customAmount}
                                onChange={(e) => setCustomAmount(e.target.value)}
                                className="pl-7"
                                type="number"
                                min="1"
                                step="0.01"
                              />
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Payment Method */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Payment Method</CardTitle>
                        <CardDescription>Select your preferred payment method</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Tabs value={paymentMethod} onValueChange={setPaymentMethod}>
                          <TabsList className="grid grid-cols-3 mb-4">
                            <TabsTrigger value="credit-card">Credit Card</TabsTrigger>
                            <TabsTrigger value="mobile-money">Mobile Money</TabsTrigger>
                            <TabsTrigger value="paypal">PayPal</TabsTrigger>
                          </TabsList>

                          <TabsContent value="credit-card" className="space-y-4">
                            <div className="grid gap-4">
                              <div className="space-y-2">
                                <Label htmlFor="card-name">Name on Card</Label>
                                <Input
                                  id="card-name"
                                  placeholder="John Smith"
                                  value={cardDetails.name}
                                  onChange={(e) =>
                                    setCardDetails({ ...cardDetails, name: e.target.value })
                                  }
                                />
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor="card-number">Card Number</Label>
                                <div className="relative">
                                  <Input
                                    id="card-number"
                                    placeholder="1234 5678 9012 3456"
                                    value={cardDetails.number}
                                    onChange={handleCardNumberChange}
                                    maxLength={19}
                                  />
                                  <div className="absolute right-3 top-2.5 flex items-center gap-1">
                                    <img
                                      src={VisaCard}
                                      alt="VisaCard"
                                      width={36}
                                      height={24}
                                      className="h-6 w-auto"
                                    />
                                    <img
                                      src={Mastercard}
                                      alt="Mastercard"
                                      width={36}
                                      height={24}
                                      className="h-6 w-auto"
                                    />
                                  </div>
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label htmlFor="expiry">Expiry Date</Label>
                                  <Input
                                    id="expiry"
                                    placeholder="MM/YY"
                                    value={cardDetails.expiry}
                                    onChange={handleExpiryChange}
                                    maxLength={5}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="cvc">CVC</Label>
                                  <Input
                                    id="cvc"
                                    placeholder="123"
                                    value={cardDetails.cvc}
                                    onChange={(e) =>
                                      setCardDetails({
                                        ...cardDetails,
                                        cvc: e.target.value.replace(/\D/g, '').substring(0, 3),
                                      })
                                    }
                                    maxLength={3}
                                  />
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-md">
                              <Lock className="h-4 w-4 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">
                                Your payment information is encrypted and secure.
                              </span>
                            </div>
                          </TabsContent>

                          <TabsContent value="mobile-money" className="space-y-4">
                            <div className="grid gap-4">
                              <div className="space-y-2">
                                <Label>Mobile Money Provider</Label>
                                <RadioGroup
                                  value={mobileMoneyDetails.provider}
                                  onValueChange={(value: string) =>
                                    setMobileMoneyDetails({
                                      ...mobileMoneyDetails,
                                      provider: value,
                                    })
                                  }
                                  className="grid grid-cols-3 gap-4"
                                >
                                  <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="orange" id="orange-money" />
                                    <Label
                                      htmlFor="orange-money"
                                      className="flex items-center gap-2"
                                    >
                                      <img src={OrangeMoney} alt="" className="h-14 w-28 " />
                                    </Label>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="afrimoney" id="afrimoney" />
                                    <Label htmlFor="afrimoney" className="flex items-center gap-2">
                                      <img src={Qmoney} alt="" className="h-14 w-24" />
                                    </Label>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="qcell" id="q-money" />
                                    <Label htmlFor="q-money" className="flex items-center gap-2">
                                      <img src={Afrimoney} alt="" className="h-14 w-28 " />
                                    </Label>
                                  </div>
                                </RadioGroup>
                              </div>
                            </div>

                            <Alert className="bg-blue-50 border-blue-200 text-blue-800">
                              <AlertDescription className="flex items-center gap-2">
                                <Info className="h-4 w-4" />
                                <span>
                                  You will receive a confirmation prompt on your mobile device to
                                  complete the payment.
                                </span>
                              </AlertDescription>
                            </Alert>
                          </TabsContent>

                          <TabsContent value="paypal" className="space-y-4">
                            <div className="flex justify-center mb-4">
                              <img src={Paypal} className=" h-24 w-48" />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="paypal-email">PayPal Email</Label>
                              <Input
                                id="paypal-email"
                                type="email"
                                placeholder="your-email@example.com"
                                value={paypalEmail}
                                onChange={(e) => setPaypalEmail(e.target.value)}
                              />
                            </div>

                            <p className="text-sm text-muted-foreground">
                              You will be redirected to PayPal to complete your payment securely.
                            </p>
                          </TabsContent>
                        </Tabs>
                      </CardContent>
                    </Card>

                    {/* Personal Details */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Personal Details</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid gap-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="first-name">First Name</Label>
                              <Input
                                id="first-name"
                                placeholder="John"
                                value={personalDetails.firstName}
                                onChange={(e) =>
                                  setPersonalDetails({
                                    ...personalDetails,
                                    firstName: e.target.value,
                                  })
                                }
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="last-name">Last Name</Label>
                              <Input
                                id="last-name"
                                placeholder="Smith"
                                value={personalDetails.lastName}
                                onChange={(e) =>
                                  setPersonalDetails({
                                    ...personalDetails,
                                    lastName: e.target.value,
                                  })
                                }
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                              id="email"
                              type="email"
                              placeholder="john.smith@example.com"
                              value={personalDetails.email}
                              onChange={(e) =>
                                setPersonalDetails({ ...personalDetails, email: e.target.value })
                              }
                            />
                            <p className="text-xs text-muted-foreground">
                              Your receipt will be sent to this email address.
                            </p>
                          </div>

                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              id="anonymous"
                              className="h-4 w-4"
                              checked={isAnonymous}
                              onChange={(e) => setIsAnonymous(e.target.checked)}
                            />
                            <Label htmlFor="anonymous" className="text-sm cursor-pointer">
                              Make this donation anonymous
                            </Label>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Message (Optional) */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Leave a Message (Optional)</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <Label htmlFor="message">Your Message</Label>
                          <textarea
                            id="message"
                            className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                            placeholder="Add a message of support or encouragement..."
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                          />
                        </div>
                      </CardContent>
                    </Card>

                    {/* Submit Button */}
                    <div className="flex flex-col gap-4">
                      <Button type="submit" size="lg" disabled={isProcessing}>
                        {isProcessing ? (
                          <>Processing...</>
                        ) : (
                          <>
                            Donate $
                            {donationAmount === 'custom' ? customAmount || '0' : donationAmount}
                          </>
                        )}
                      </Button>

                      <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                        <Shield className="h-4 w-4" />
                        <span>Secure donation processed by Ib4me</span>
                      </div>
                    </div>
                  </div>
                </form>
              </div>

              {/* Campaign Summary */}
              <div className="md:col-span-1">
                <div className="sticky top-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Donation Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-md overflow-hidden">
                          <img
                            src={campaign.image || '/placeholder.svg'}
                            alt={campaign.title}
                            width={64}
                            height={64}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <h3 className="font-medium line-clamp-2">{campaign.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            by {campaign.organizer.name}
                          </p>
                        </div>
                      </div>

                      <Separator />

                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm text-muted-foreground">Campaign Progress</span>
                          <span className="text-sm font-medium">
                            {Math.round((campaign.raised / campaign.goal) * 100)}%
                          </span>
                        </div>
                        <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full"
                            style={{ width: `${(campaign.raised / campaign.goal) * 100}%` }}
                          />
                        </div>
                        <div className="flex justify-between mt-1">
                          <span className="text-sm font-medium">
                            ${campaign.raised.toLocaleString()}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            of ${campaign.goal.toLocaleString()}
                          </span>
                        </div>
                      </div>

                      <Separator />

                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Your Donation</span>
                          <span className="font-medium">
                            ${donationAmount === 'custom' ? customAmount || '0' : donationAmount}
                          </span>
                        </div>

                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Processing Fee</span>
                          <span className="text-muted-foreground">$0.00</span>
                        </div>

                        <Separator />

                        <div className="flex justify-between font-medium">
                          <span>Total</span>
                          <span>
                            ${donationAmount === 'custom' ? customAmount || '0' : donationAmount}
                          </span>
                        </div>
                      </div>

                      <Alert className="bg-green-50 border-green-200 text-green-800">
                        <AlertDescription className="flex items-center gap-2 text-xs">
                          <Check className="h-4 w-4" />
                          <span>100% of your donation goes directly to the campaign.</span>
                        </AlertDescription>
                      </Alert>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
      <footer>
        <div className="py-10 mx-auto  px-10 flex flex-col justify-between gap-4 border-t pt-8 text-sm font-medium text-muted-foreground md:flex-row md:items-center">
          <p>© {new Date().getFullYear()} Copyright. All rights reserved.</p>
          <ul className="flex gap-4">
            <li className="underline gap-2 hover:text-primary">
              <a href="">Terms and Conditions</a>
              <a href="">Privacy Policy</a>
            </li>
          </ul>
        </div>
      </footer>
      <Toaster />
    </div>
  );
};

export default Payments;
