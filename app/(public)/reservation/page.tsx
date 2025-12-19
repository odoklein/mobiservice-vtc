'use client';

import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { AddressAutocomplete } from '@/components/booking/address-autocomplete';
import { calculatePrice, formatPrice, FORFAITS } from '@/lib/pricing';
import { SERVICES, CONTACT, VTC_DEPOT, BRAND } from '@/lib/constants';
import { useBookingStorage } from '@/hooks/use-local-storage';
import {
  bookingStepOneSchema,
  bookingStepThreeSchema,
  cardDetailsSchema,
  type BookingStepOneData,
  type BookingStepThreeData,
  type CardDetails,
} from '@/lib/validations/booking';
import {
  IconArrowRight,
  IconArrowLeft,
  IconMapPin,
  IconCalendar,
  IconUsers,
  IconCheck,
  IconLoader2,
  IconClock,
  IconLuggage,
  IconCar,
  IconPlane,
  IconClockHour4,
  IconBuilding,
  IconCreditCard,
  IconShieldCheck,
  IconPhone,
  IconStar,
  IconCash,
  IconLock,
} from '@tabler/icons-react';

type BookingStep = 1 | 2 | 3;
type PaymentMethod = 'card' | 'cash';

export default function ReservationPage() {
  const [step, setStep] = useState<BookingStep>(1);
  const [bookingData, setBookingData] = useState<any>({});
  const [isCalculating, setIsCalculating] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [otpCode, setOtpCode] = useState(['', '', '', '', '', '']);
  const [otpError, setOtpError] = useState('');
  const [createdBookingId, setCreatedBookingId] = useState<number | null>(null);
  const [cardData, setCardData] = useState<CardDetails>({
    cardHolder: '',
    cardNumber: '',
    expiry: '',
    cvv: '',
  });
  const [cardErrors, setCardErrors] = useState<Partial<Record<keyof CardDetails, string>>>({});
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const { bookingData: savedBookingData, saveBookingDraft, clearBookingDraft, addToHistory } = useBookingStorage();

  // Step 1 form
  const {
    register: registerStep1,
    handleSubmit: handleSubmitStep1,
    formState: { errors: errorsStep1 },
    setValue: setValueStep1,
    watch: watchStep1,
  } = useForm<BookingStepOneData>({
    resolver: zodResolver(bookingStepOneSchema),
    defaultValues: {
      passengers: 1,
      luggage: 1,
      serviceType: 'transfer',
      ...(savedBookingData && {
        pickupAddress: savedBookingData.pickupAddress,
        dropoffAddress: savedBookingData.dropoffAddress,
        pickupLat: savedBookingData.pickupLat,
        pickupLng: savedBookingData.pickupLng,
        dropoffLat: savedBookingData.dropoffLat,
        dropoffLng: savedBookingData.dropoffLng,
        pickupDate: savedBookingData.pickupDate ? new Date(savedBookingData.pickupDate) : undefined,
        pickupTime: savedBookingData.pickupTime,
        passengers: savedBookingData.passengers || 1,
        luggage: savedBookingData.luggage || 1,
        serviceType: savedBookingData.serviceType || 'transfer',
      }),
    },
  });

  const step1Data = watchStep1();

  // Load saved booking data on mount
  useEffect(() => {
    if (savedBookingData) {
      if (savedBookingData.pickupDate) {
        setSelectedDate(new Date(savedBookingData.pickupDate));
      }
      if (savedBookingData.step) {
        setStep(savedBookingData.step as BookingStep);
      }
      if (savedBookingData.totalPrice || savedBookingData.distance) {
        setBookingData({
          ...savedBookingData,
          pickupDate: savedBookingData.pickupDate
            ? (typeof savedBookingData.pickupDate === 'string'
              ? new Date(savedBookingData.pickupDate)
              : savedBookingData.pickupDate)
            : undefined,
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save form data to localStorage as user types (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (step === 1 && step1Data) {
        const draftData = {
          ...step1Data,
          step: 1,
          pickupDate: step1Data.pickupDate ? step1Data.pickupDate.toISOString() : undefined,
        };
        saveBookingDraft(draftData);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [step1Data, step, saveBookingDraft]);

  // Step 3 form
  const {
    register: registerStep3,
    handleSubmit: handleSubmitStep3,
    formState: { errors: errorsStep3 },
    setValue: setValueStep3,
    watch: watchStep3,
  } = useForm<BookingStepThreeData>({
    resolver: zodResolver(bookingStepThreeSchema),
    defaultValues: {
      paymentMethod: 'card',
    },
  });

  const onStep1Submit = async (data: BookingStepOneData) => {
    setIsCalculating(true);
    try {
      // Pour les services transfer, utiliser le nouvel endpoint d'estimation
      if (data.serviceType === 'transfer' && data.pickupLat && data.pickupLng && data.dropoffLat && data.dropoffLng) {
        try {
          // Construire la date complète
          const pickupDateStr = data.pickupDate instanceof Date 
            ? data.pickupDate.toISOString().split('T')[0]
            : typeof data.pickupDate === 'string'
            ? data.pickupDate.split('T')[0]
            : '';

          const response = await fetch('/api/pricing/estimate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              pickupAddress: data.pickupAddress,
              pickupLat: data.pickupLat,
              pickupLng: data.pickupLng,
              dropoffAddress: data.dropoffAddress,
              dropoffLat: data.dropoffLat,
              dropoffLng: data.dropoffLng,
              pickupDate: pickupDateStr,
              pickupTime: data.pickupTime,
              tripType: data.tripType || 'one-way',
              tollCost: 0, // TODO: Intégrer calcul péages si disponible
            }),
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || error.error || 'Estimation échouée');
          }

          const result = await response.json();
          if (!result.success || !result.estimation) {
            throw new Error(result.error || 'Estimation échouée');
          }

          const est = result.estimation;

          const completeBookingData = {
            ...data,
            distanceCA: est.distances.ca_out,
            distanceTP: est.distances.tp,
            distanceReturn: est.distances.ca_return,
            distance: est.distances.tp,
            duration: est.duration,
            totalPrice: est.pricing.totalTTC,
            totalPriceHT: est.pricing.totalHT,
            totalPriceTTC: est.pricing.totalTTC,
            tvaAmount: est.pricing.tva,
            basePrice: est.pricing.totalHT,
            isNightRate: est.pricing.isNightRate,
            rateType: est.pricing.rateType,
            breakdown: est.pricing.breakdown, // For validation schema
            priceBreakdown: est.pricing.breakdown, // For database
            step: 2,
            pickupDate: data.pickupDate,
          };

          setBookingData(completeBookingData);
          saveBookingDraft({
            ...completeBookingData,
            pickupDate: data.pickupDate ? (data.pickupDate instanceof Date ? data.pickupDate.toISOString() : data.pickupDate) : undefined,
          });
          setStep(2);
          return;
        } catch (apiError) {
          console.error('API error:', apiError);
          throw apiError;
        }
      }

      // Pour les autres services (airport, hourly, etc.), utiliser l'ancienne logique
      let distanceCA = 0;
      let distanceTP = 0;
      let distanceReturn = 0;
      let duration = 0;

      if (data.pickupLat && data.pickupLng && data.dropoffLat && data.dropoffLng) {
        try {
          const response = await fetch('/api/routing/distances', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              depot: { lat: VTC_DEPOT.lat, lng: VTC_DEPOT.lng },
              pickup: { lat: data.pickupLat, lng: data.pickupLng },
              dropoff: { lat: data.dropoffLat, lng: data.dropoffLng },
            }),
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Distance calculation failed');
          }

          const segments = await response.json();
          distanceCA = segments.distanceCA;
          distanceTP = segments.distanceTP;
          distanceReturn = segments.distanceReturn;
          duration = segments.totalDuration;
        } catch (apiError) {
          console.error('API error:', apiError);
          throw apiError;
        }
      }

      let pickupDateTime: Date | undefined;
      if (data.pickupDate && data.pickupTime) {
        const [hours, minutes] = data.pickupTime.split(':').map(Number);
        pickupDateTime = new Date(data.pickupDate);
        pickupDateTime.setHours(hours, minutes, 0, 0);
      }

      const pricing = calculatePrice({
        serviceType: data.serviceType,
        tripType: data.tripType,
        distanceCA,
        distanceTP,
        distanceReturn,
        pickupTime: pickupDateTime,
        hours: data.serviceType === 'hourly' ? (data.hours || 2) : undefined,
      });

      const completeBookingData = {
        ...data,
        distanceCA,
        distanceTP,
        distanceReturn,
        distance: distanceTP,
        duration,
        ...pricing,
        basePrice: pricing.totalPrice,
        totalPrice: pricing.totalPrice,
        totalPriceHT: pricing.totalPriceHT,
        totalPriceTTC: pricing.totalPrice,
        tvaAmount: pricing.tva,
        step: 2,
        pickupDate: data.pickupDate,
      };

      setBookingData(completeBookingData);
      saveBookingDraft({
        ...completeBookingData,
        pickupDate: data.pickupDate ? (data.pickupDate instanceof Date ? data.pickupDate.toISOString() : data.pickupDate) : undefined,
      });
      setStep(2);
    } catch (error) {
      console.error('Error calculating distance:', error);
      const errorMessage = error instanceof Error && error.message.includes('temporairement indisponible')
        ? error.message
        : 'Impossible de calculer la distance automatiquement. Merci de nous contacter pour un devis personnalisé.';
      alert(errorMessage);
      setIsCalculating(false);
      return;
    } finally {
      setIsCalculating(false);
    }
  };

  // Format card number with spaces
  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    const groups = cleaned.match(/.{1,4}/g);
    return groups ? groups.join(' ').substring(0, 19) : cleaned;
  };

  // Format expiry date
  const formatExpiry = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length >= 2) {
      return cleaned.substring(0, 2) + '/' + cleaned.substring(2, 4);
    }
    return cleaned;
  };

  // Get card type icon
  const getCardType = (number: string) => {
    const cleaned = number.replace(/\s/g, '');
    if (cleaned.startsWith('4')) return 'VISA';
    if (/^5[1-5]/.test(cleaned) || /^2[2-7]/.test(cleaned)) return 'MC';
    if (/^3[47]/.test(cleaned)) return 'AMEX';
    return '';
  };

  // Validate card details
  const validateCardDetails = (): boolean => {
    try {
      cardDetailsSchema.parse(cardData);
      setCardErrors({});
      return true;
    } catch (error: any) {
      const errors: Partial<Record<keyof CardDetails, string>> = {};
      error.errors?.forEach((err: any) => {
        if (err.path[0]) {
          errors[err.path[0] as keyof CardDetails] = err.message;
        }
      });
      setCardErrors(errors);
      return false;
    }
  };

  // Create booking in database
  const createBooking = async (guestData: BookingStepThreeData): Promise<number | null> => {
    try {
      const completeData = {
        ...bookingData,
        ...guestData,
        submittedAt: new Date().toISOString(),
      };

      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(completeData),
      });

      const result = await response.json();

      if (result.success && result.bookingId) {
        return result.bookingId;
      }
      return null;
    } catch (error) {
      console.error('Error creating booking:', error);
      return null;
    }
  };

  // Handle OTP input change
  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otpCode];
    newOtp[index] = value.slice(-1);
    setOtpCode(newOtp);
    setOtpError('');

    // Move to next input
    if (value && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  // Handle OTP key down
  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otpCode[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  // Handle OTP paste
  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const newOtp = [...otpCode];
    pastedData.split('').forEach((char, index) => {
      if (index < 6) newOtp[index] = char;
    });
    setOtpCode(newOtp);
  };

  // Send OTP for cash payment
  const sendOtp = async (bookingId: number) => {
    try {
      const response = await fetch('/api/bookings/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId }),
      });

      const contentType = response.headers.get('content-type') || '';
      let result: any;
      if (contentType.includes('application/json')) {
        result = await response.json();
      } else {
        // If Next.js crashes (dev overlay) the API can return HTML; avoid blowing up on `.json()`.
        const text = await response.text();
        const excerpt = text.slice(0, 300).replace(/\s+/g, ' ').trim();
        throw new Error(`Réponse serveur non-JSON (HTTP ${response.status}): ${excerpt}`);
      }

      if (!result.success) {
        // Display detailed error message with debug info
        let errorMessage = result.error || 'Erreur lors de l\'envoi du code';

        if (result.debug) {
          console.error('[OTP-CLIENT-ERROR]', result.debug);

          // Add user-friendly context based on error type
          switch (result.debug.errorType) {
            case 'MISSING_EMAIL':
              errorMessage = 'Email manquant dans la réservation. Veuillez contacter le support.';
              break;
            case 'BOOKING_NOT_FOUND':
              errorMessage = 'Réservation introuvable. Veuillez réessayer.';
              break;
            case 'DB_QUERY_ERROR':
            case 'DB_INSERT_ERROR':
              errorMessage = `Erreur de base de données: ${result.debug.details || 'Impossible de sauvegarder le code'}`;
              break;
            case 'RESEND_API_ERROR':
              errorMessage = `Erreur d'envoi d'email: ${JSON.stringify(result.debug.details) || 'Le service d\'email a retourné une erreur'}`;
              console.error('[RESEND-ERROR]', result.debug.details);
              break;
            case 'EMAIL_EXCEPTION':
              errorMessage = `Exception lors de l'envoi: ${result.debug.details || 'Erreur de connexion au service d\'email'}`;
              break;
            case 'INVALID_JSON':
              errorMessage = 'Données invalides. Veuillez recharger la page.';
              break;
            default:
              errorMessage = `${result.error} (Type: ${result.debug.errorType})`;
          }

          // Display technical details in development
          if (process.env.NODE_ENV !== 'production') {
            console.log('[OTP-DEBUG-INFO]', {
              step: result.debug.step,
              errorType: result.debug.errorType,
              bookingId: result.debug.bookingId,
              hasResendKey: result.debug.hasResendKey,
              details: result.debug.details,
            });
          }
        }

        throw new Error(errorMessage);
      }

      return true;
    } catch (error) {
      console.error('Error sending OTP:', error);

      // Show detailed error to user
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue lors de l\'envoi du code';
      alert(`Erreur d'envoi du code de vérification:\n\n${errorMessage}`);

      return false;
    }
  };

  // Verify OTP
  const verifyOtp = async () => {
    if (!createdBookingId) return;

    const code = otpCode.join('');
    if (code.length !== 6) {
      setOtpError('Veuillez entrer le code à 6 chiffres');
      return;
    }

    setIsProcessingPayment(true);
    try {
      const response = await fetch('/api/bookings/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId: createdBookingId, otpCode: code }),
      });

      const result = await response.json();

      if (result.success && result.redirectUrl) {
        addToHistory({
          ...bookingData,
          id: createdBookingId.toString(),
          status: 'confirmed',
        });
        clearBookingDraft();
        window.location.href = result.redirectUrl;
      } else {
        const errorMsg = result.error || 'Code invalide';
        setOtpError(errorMsg);

        // Log debug info if available
        if (result.debug) {
          console.error('[VERIFY-OTP-ERROR]', result.debug);
        }
      }
    } catch (error) {
      console.error('OTP verification error:', error);
      setOtpError('Erreur de vérification. Réessayez.');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  // Resend OTP
  const resendOtp = async () => {
    if (!createdBookingId) return;
    setOtpCode(['', '', '', '', '', '']);
    setOtpError('');

    const success = await sendOtp(createdBookingId);
    if (success) {
      alert('✅ Un nouveau code a été envoyé à votre email');
    } else {
      // Error already shown by sendOtp
      setOtpError('Impossible d\'envoyer le code. Voir les détails ci-dessus.');
    }
  };

  // Handle card payment
  const handleCardPayment = async (bookingId: number) => {
    if (!validateCardDetails()) return false;

    try {
      const response = await fetch('/api/bookings/pay-card', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId,
          cardDetails: {
            ...cardData,
            cardNumber: cardData.cardNumber.replace(/\s/g, ''),
          },
        }),
      });

      const result = await response.json();

      if (result.success && result.redirectUrl) {
        addToHistory({
          ...bookingData,
          id: bookingId.toString(),
          status: 'confirmed',
        });
        clearBookingDraft();
        window.location.href = result.redirectUrl;
        return true;
      } else {
        alert(result.error || 'Erreur de paiement');
        return false;
      }
    } catch (error) {
      console.error('Card payment error:', error);
      alert('Erreur lors du paiement');
      return false;
    }
  };

  const onStep3Submit = async (data: BookingStepThreeData) => {
    setIsProcessingPayment(true);

    try {
      // Create booking first
      const bookingId = await createBooking(data);

      if (!bookingId) {
        alert('Erreur lors de la création de la réservation');
        setIsProcessingPayment(false);
        return;
      }

      setCreatedBookingId(bookingId);

      if (paymentMethod === 'card') {
        await handleCardPayment(bookingId);
      } else {
        // Cash payment - send OTP
        const otpSent = await sendOtp(bookingId);
        if (otpSent) {
          setShowOtpInput(true);
        } else {
          alert('Erreur lors de l\'envoi du code de vérification');
        }
      }
    } catch (error) {
      console.error('Booking submission error:', error);
      alert('Erreur lors de la création de la réservation');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Minimal Header */}
      <div className="bg-[#0A0A0A] py-12 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/3 w-[400px] h-[400px] bg-[#5CD85A]/10 rounded-full blur-[120px]"></div>
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
              Réservation
            </h1>
            <p className="text-white/70">
              Estimez et réservez votre trajet en quelques clics
            </p>
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="bg-white border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center justify-between">
              {[
                { num: 1, label: 'Trajet' },
                { num: 2, label: 'Récapitulatif' },
                { num: 3, label: 'Paiement' },
              ].map((s, i) => (
                <div key={s.num} className="flex items-center flex-1">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-all ${step >= s.num
                        ? 'bg-[#5CD85A] text-[#0A0A0A]'
                        : 'bg-gray-100 text-gray-400'
                        }`}
                    >
                      {step > s.num ? <IconCheck className="h-5 w-5" /> : s.num}
                    </div>
                    <span className={`text-xs mt-2 font-medium ${step >= s.num ? 'text-[#0A0A0A]' : 'text-gray-400'}`}>
                      {s.label}
                    </span>
                  </div>
                  {i < 2 && (
                    <div className={`flex-1 h-0.5 mx-4 ${step > s.num ? 'bg-[#5CD85A]' : 'bg-gray-200'}`}></div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Form */}
            <div className="lg:col-span-2">
              {/* Step 1: Trip Details */}
              {step === 1 && (
                <div className="space-y-6">
                  {/* Service Type */}
                  <Card className="border-0 shadow-lg">
                    <CardContent className="p-6">
                      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <IconCar className="h-5 w-5 text-[#5CD85A]" />
                        Type de service
                      </h2>
                      <div className="grid grid-cols-2 gap-3">
                        {SERVICES.map((service) => {
                          const IconComponent =
                            service.id === 'transfer' ? IconCar :
                              service.id === 'airport' ? IconPlane :
                                service.id === 'hourly' ? IconClockHour4 : IconBuilding;

                          return (
                            <button
                              key={service.id}
                              type="button"
                              onClick={() => setValueStep1('serviceType', service.id as any)}
                              className={`p-4 rounded-xl text-left transition-all border-2 ${step1Data.serviceType === service.id
                                ? 'border-[#5CD85A] bg-[#5CD85A]/5'
                                : 'border-gray-100 hover:border-gray-200 bg-white'
                                }`}
                            >
                              <div className={`w-10 h-10 rounded-lg mb-3 flex items-center justify-center ${step1Data.serviceType === service.id
                                ? 'bg-[#5CD85A] text-white'
                                : 'bg-gray-100 text-gray-500'
                                }`}>
                                <IconComponent className="h-5 w-5" />
                              </div>
                              <div className="font-medium text-sm">{service.name}</div>
                              <div className="text-xs text-gray-500 mt-1">{service.priceInfo}</div>
                            </button>
                          );
                        })}
                      </div>
                      {/* Trip Type (A/S vs A/R) - Only for transfer service */}
                      {step1Data.serviceType === 'transfer' && (
                        <div className="mt-4 pt-4 border-t">
                          <Label className="text-sm font-medium mb-3 block">Type de trajet</Label>
                          <div className="grid grid-cols-2 gap-3">
                            <button
                              type="button"
                              onClick={() => setValueStep1('tripType', 'one-way')}
                              className={`p-3 rounded-xl text-left transition-all border-2 ${
                                (step1Data.tripType || 'one-way') === 'one-way'
                                  ? 'border-[#5CD85A] bg-[#5CD85A]/5'
                                  : 'border-gray-100 hover:border-gray-200 bg-white'
                              }`}
                            >
                              <div className="font-medium text-sm">Aller Simple (A/S)</div>
                              <div className="text-xs text-gray-500 mt-1">Trajet unique</div>
                            </button>
                            <button
                              type="button"
                              onClick={() => setValueStep1('tripType', 'round-trip')}
                              className={`p-3 rounded-xl text-left transition-all border-2 ${
                                step1Data.tripType === 'round-trip'
                                  ? 'border-[#5CD85A] bg-[#5CD85A]/5'
                                  : 'border-gray-100 hover:border-gray-200 bg-white'
                              }`}
                            >
                              <div className="font-medium text-sm">Aller-Retour (A/R)</div>
                              <div className="text-xs text-gray-500 mt-1">Même jour</div>
                            </button>
                          </div>
                        </div>
                      )}
                      {/* Hour Selection - Only for hourly (MDA) service */}
                      {step1Data.serviceType === 'hourly' && (
                        <div className="mt-4 pt-4 border-t">
                          <Label className="text-sm font-medium mb-3 block">Durée de mise à disposition</Label>
                          <div className="grid grid-cols-4 gap-2">
                            {[2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6, 6.5, 7, 7.5, 8].map((h) => {
                              const forfait = FORFAITS.find(f => f.hours === h);
                              return (
                                <button
                                  key={h}
                                  type="button"
                                  onClick={() => setValueStep1('hours', h)}
                                  className={`p-2 rounded-xl text-center transition-all border-2 ${
                                    (step1Data.hours || 2) === h
                                      ? 'border-[#5CD85A] bg-[#5CD85A]/5'
                                      : 'border-gray-100 hover:border-gray-200 bg-white'
                                  }`}
                                >
                                  <div className="font-bold text-sm">{h}H</div>
                                  {forfait && (
                                    <div className="text-xs text-gray-500">{forfait.day}€</div>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                          <div className="mt-4 p-3 bg-blue-50 rounded-xl text-sm text-blue-800">
                            {(() => {
                              const selectedHours = step1Data.hours || 2;
                              const forfait = FORFAITS.find(f => f.hours === selectedHours) || FORFAITS[0];
                              return (
                                <>
                                  <strong>Forfait {selectedHours}H :</strong> {forfait.day}€ TTC jour / {forfait.night}€ TTC nuit.
                                  <br />
                                  <span className="text-blue-600">Inclut jusqu'à {forfait.maxKm} km et péages. Heure supplémentaire : 116€ TTC jour / 140€ TTC nuit.</span>
                                </>
                              );
                            })()}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Addresses */}
                  <Card className="border-0 shadow-lg">
                    <CardContent className="p-6">
                      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <IconMapPin className="h-5 w-5 text-[#5CD85A]" />
                        Itinéraire
                      </h2>
                      <div className="space-y-4">
                        <AddressAutocomplete
                          label="Adresse de départ"
                          placeholder="Entrez l'adresse de départ"
                          value={step1Data.pickupAddress || ''}
                          onChange={(address, lat, lng) => {
                            setValueStep1('pickupAddress', address);
                            if (lat && lng) {
                              setValueStep1('pickupLat', lat);
                              setValueStep1('pickupLng', lng);
                            }
                          }}
                          error={errorsStep1.pickupAddress?.message}
                        />
                        <AddressAutocomplete
                          label="Adresse d'arrivée"
                          placeholder="Entrez l'adresse d'arrivée"
                          value={step1Data.dropoffAddress || ''}
                          onChange={(address, lat, lng) => {
                            setValueStep1('dropoffAddress', address);
                            if (lat && lng) {
                              setValueStep1('dropoffLat', lat);
                              setValueStep1('dropoffLng', lng);
                            }
                          }}
                          error={errorsStep1.dropoffAddress?.message}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Date & Time */}
                  <Card className="border-0 shadow-lg">
                    <CardContent className="p-6">
                      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <IconCalendar className="h-5 w-5 text-[#5CD85A]" />
                        Date et heure
                      </h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <Label className="text-sm font-medium mb-2 block">Date</Label>
                          <div className="border rounded-xl p-3 bg-white">
                            <Calendar
                              mode="single"
                              selected={selectedDate}
                              onSelect={(date) => {
                                setSelectedDate(date);
                                if (date) setValueStep1('pickupDate', date);
                              }}
                              disabled={(date) => date < new Date()}
                              className="rounded-md"
                            />
                          </div>
                          {errorsStep1.pickupDate && (
                            <p className="text-sm text-red-500 mt-2">{errorsStep1.pickupDate.message}</p>
                          )}
                        </div>
                        <div className="space-y-4">
                          <div>
                            <Label className="text-sm font-medium mb-2 block">Heure de prise en charge</Label>
                            <Input
                              type="time"
                              className="h-12"
                              {...registerStep1('pickupTime')}
                            />
                            {errorsStep1.pickupTime && (
                              <p className="text-sm text-red-500 mt-1">{errorsStep1.pickupTime.message}</p>
                            )}
                          </div>
                          <div>
                            <Label className="text-sm font-medium mb-2 block">
                              Heure maximale d'arrivée <span className="text-gray-400 font-normal">(optionnel)</span>
                            </Label>
                            <Input
                              type="time"
                              className="h-12"
                              {...registerStep1('maxArrivalTime')}
                              placeholder="HH:mm"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              Pour correspondance train/avion ou contrainte horaire
                            </p>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <Label className="text-sm font-medium mb-2 block">Passagers</Label>
                              <Input
                                type="number"
                                min="1"
                                max="4"
                                className="h-12"
                                {...registerStep1('passengers', { valueAsNumber: true })}
                              />
                            </div>
                            <div>
                              <Label className="text-sm font-medium mb-2 block">Bagages</Label>
                              <Input
                                type="number"
                                min="0"
                                max="5"
                                className="h-12"
                                {...registerStep1('luggage', { valueAsNumber: true })}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Submit Button */}
                  <Button
                    onClick={handleSubmitStep1(onStep1Submit)}
                    className="w-full h-14 text-base font-semibold bg-[#5CD85A] hover:bg-[#4BC449] text-[#0A0A0A] rounded-xl"
                    disabled={isCalculating}
                  >
                    {isCalculating ? (
                      <>
                        <IconLoader2 className="mr-2 h-5 w-5 animate-spin" />
                        Calcul en cours...
                      </>
                    ) : (
                      <>
                        Voir l'estimation
                        <IconArrowRight className="ml-2 h-5 w-5" />
                      </>
                    )}
                  </Button>
                </div>
              )}

              {/* Step 2: Summary & Price */}
              {step === 2 && (
                <div className="space-y-6">
                  <Card className="border-0 shadow-lg overflow-hidden">
                    <div className="bg-[#0A0A0A] p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-white/60 text-sm mb-1">Prix total</div>
                          <div className="text-4xl font-bold text-[#5CD85A]">
                            {formatPrice(bookingData.totalPrice)}
                          </div>
                        </div>
                        <Badge className={`${bookingData.isNightRate ? 'bg-indigo-500' : 'bg-amber-500'} text-white`}>
                          {bookingData.isNightRate ? '🌙 Nuit' : '☀️ Jour'}
                        </Badge>
                      </div>
                    </div>
                    <CardContent className="p-6 space-y-4">
                      {/* Trip Details */}
                      <div className="space-y-3">
                        <div className="flex items-start gap-3">
                          <div className="w-2 h-2 rounded-full bg-[#5CD85A] mt-2"></div>
                          <div className="flex-1">
                            <div className="text-xs text-gray-500">Départ</div>
                            <div className="text-sm font-medium">{bookingData.pickupAddress}</div>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="w-2 h-2 rounded-full bg-red-500 mt-2"></div>
                          <div className="flex-1">
                            <div className="text-xs text-gray-500">Arrivée</div>
                            <div className="text-sm font-medium">{bookingData.dropoffAddress}</div>
                          </div>
                        </div>
                      </div>

                      <div className="border-t pt-4 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Distance</span>
                          <span>{Math.round(bookingData.distance)} km</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Durée estimée</span>
                          <span>~{Math.round(bookingData.duration)} min</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Date</span>
                          <span>{bookingData.pickupDate?.toLocaleDateString('fr-FR')}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Heure</span>
                          <span>{bookingData.pickupTime}</span>
                        </div>
                      </div>

                      <div className="border-t pt-4 space-y-2">
                        {bookingData.breakdown?.baseFare && (
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Prise en charge</span>
                            <span>{formatPrice(bookingData.breakdown.baseFare)}</span>
                          </div>
                        )}
                        {bookingData.breakdown?.distanceCharge && (
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Distance</span>
                            <span>{formatPrice(bookingData.breakdown.distanceCharge)}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">TVA (10%)</span>
                          <span>{formatPrice(bookingData.tvaAmount || 0)}</span>
                        </div>
                        <div className="flex justify-between font-semibold pt-2 border-t">
                          <span>Total TTC</span>
                          <span className="text-[#5CD85A]">{formatPrice(bookingData.totalPrice)}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={() => setStep(1)}
                      className="flex-1 h-12"
                    >
                      <IconArrowLeft className="mr-2 h-4 w-4" />
                      Modifier
                    </Button>
                    <Button
                      onClick={() => setStep(3)}
                      className="flex-1 h-12 bg-[#5CD85A] hover:bg-[#4BC449] text-[#0A0A0A]"
                    >
                      Continuer
                      <IconArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 3: Customer Info & Payment */}
              {step === 3 && !showOtpInput && (
                <div className="space-y-6">
                  <Card className="border-0 shadow-lg">
                    <CardContent className="p-6">
                      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <IconUsers className="h-5 w-5 text-[#5CD85A]" />
                        Vos coordonnées
                      </h2>
                      <form onSubmit={handleSubmitStep3(onStep3Submit)} className="space-y-4">
                        <div>
                          <Label className="text-sm font-medium mb-2 block">Nom complet</Label>
                          <Input
                            placeholder="Jean Dupont"
                            className="h-12"
                            {...registerStep3('guestName')}
                          />
                          {errorsStep3.guestName && (
                            <p className="text-sm text-red-500 mt-1">{errorsStep3.guestName.message}</p>
                          )}
                        </div>
                        <div>
                          <Label className="text-sm font-medium mb-2 block">Email</Label>
                          <Input
                            type="email"
                            placeholder="jean@example.com"
                            className="h-12"
                            {...registerStep3('guestEmail')}
                          />
                          {errorsStep3.guestEmail && (
                            <p className="text-sm text-red-500 mt-1">{errorsStep3.guestEmail.message}</p>
                          )}
                        </div>
                        <div>
                          <Label className="text-sm font-medium mb-2 block">Téléphone</Label>
                          <Input
                            type="tel"
                            placeholder="+33 6 00 00 00 00"
                            className="h-12"
                            {...registerStep3('guestPhone')}
                          />
                          {errorsStep3.guestPhone && (
                            <p className="text-sm text-red-500 mt-1">{errorsStep3.guestPhone.message}</p>
                          )}
                        </div>

                        {/* Payment Method Selection */}
                        <div className="pt-6 border-t">
                          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <IconCreditCard className="h-5 w-5 text-[#5CD85A]" />
                            Mode de paiement
                          </h3>
                          <div className="grid grid-cols-2 gap-4">
                            <button
                              type="button"
                              onClick={() => {
                                setPaymentMethod('card');
                                setValueStep3('paymentMethod', 'card');
                              }}
                              className={`p-4 rounded-xl border-2 transition-all ${paymentMethod === 'card'
                                ? 'border-[#5CD85A] bg-[#5CD85A]/5'
                                : 'border-gray-200 hover:border-gray-300'
                                }`}
                            >
                              <div className={`w-12 h-12 rounded-xl mx-auto mb-3 flex items-center justify-center ${paymentMethod === 'card' ? 'bg-[#5CD85A] text-white' : 'bg-gray-100 text-gray-500'
                                }`}>
                                <IconCreditCard className="h-6 w-6" />
                              </div>
                              <div className="font-medium text-sm">Carte bancaire</div>
                              <div className="text-xs text-gray-500 mt-1">Paiement immédiat sécurisé</div>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setPaymentMethod('cash');
                                setValueStep3('paymentMethod', 'cash');
                              }}
                              className={`p-4 rounded-xl border-2 transition-all ${paymentMethod === 'cash'
                                ? 'border-[#5CD85A] bg-[#5CD85A]/5'
                                : 'border-gray-200 hover:border-gray-300'
                                }`}
                            >
                              <div className={`w-12 h-12 rounded-xl mx-auto mb-3 flex items-center justify-center ${paymentMethod === 'cash' ? 'bg-[#5CD85A] text-white' : 'bg-gray-100 text-gray-500'
                                }`}>
                                <IconCash className="h-6 w-6" />
                              </div>
                              <div className="font-medium text-sm">Espèces</div>
                              <div className="text-xs text-gray-500 mt-1">Paiement au chauffeur</div>
                            </button>
                          </div>
                        </div>

                        {/* Card Details (shown only when card is selected) */}
                        {paymentMethod === 'card' && (
                          <div className="space-y-4 p-4 bg-gray-50 rounded-xl mt-4">
                            <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                              <IconLock className="h-4 w-4" />
                              Paiement sécurisé - Vos données sont protégées
                            </div>
                            <div>
                              <Label className="text-sm font-medium mb-2 block">Titulaire de la carte</Label>
                              <Input
                                placeholder="JEAN DUPONT"
                                className="h-12 uppercase"
                                value={cardData.cardHolder}
                                onChange={(e) => setCardData({ ...cardData, cardHolder: e.target.value.toUpperCase() })}
                              />
                              {cardErrors.cardHolder && (
                                <p className="text-sm text-red-500 mt-1">{cardErrors.cardHolder}</p>
                              )}
                            </div>
                            <div>
                              <Label className="text-sm font-medium mb-2 block">Numéro de carte</Label>
                              <div className="relative">
                                <Input
                                  placeholder="1234 5678 9012 3456"
                                  className="h-12 pr-16"
                                  value={cardData.cardNumber}
                                  onChange={(e) => setCardData({ ...cardData, cardNumber: formatCardNumber(e.target.value) })}
                                  maxLength={19}
                                />
                                {getCardType(cardData.cardNumber) && (
                                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-500">
                                    {getCardType(cardData.cardNumber)}
                                  </span>
                                )}
                              </div>
                              {cardErrors.cardNumber && (
                                <p className="text-sm text-red-500 mt-1">{cardErrors.cardNumber}</p>
                              )}
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label className="text-sm font-medium mb-2 block">Date d'expiration</Label>
                                <Input
                                  placeholder="MM/YY"
                                  className="h-12"
                                  value={cardData.expiry}
                                  onChange={(e) => setCardData({ ...cardData, expiry: formatExpiry(e.target.value) })}
                                  maxLength={5}
                                />
                                {cardErrors.expiry && (
                                  <p className="text-sm text-red-500 mt-1">{cardErrors.expiry}</p>
                                )}
                              </div>
                              <div>
                                <Label className="text-sm font-medium mb-2 block">CVV</Label>
                                <Input
                                  type="password"
                                  placeholder="123"
                                  className="h-12"
                                  value={cardData.cvv}
                                  onChange={(e) => setCardData({ ...cardData, cvv: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                                  maxLength={4}
                                />
                                {cardErrors.cvv && (
                                  <p className="text-sm text-red-500 mt-1">{cardErrors.cvv}</p>
                                )}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Cash info message */}
                        {paymentMethod === 'cash' && (
                          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl mt-4">
                            <div className="flex items-start gap-3">
                              <IconCash className="h-5 w-5 text-amber-600 mt-0.5" />
                              <div>
                                <div className="font-medium text-amber-800">Paiement en espèces</div>
                                <p className="text-sm text-amber-700 mt-1">
                                  Vous recevrez un code de vérification par email. Entrez ce code pour confirmer votre réservation.
                                  Le paiement sera effectué directement au chauffeur.
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
                          <input
                            id="cgvAccepted"
                            type="checkbox"
                            className="mt-1 w-5 h-5 rounded border-gray-300 text-[#5CD85A] focus:ring-[#5CD85A]"
                            {...registerStep3('cgvAccepted')}
                          />
                          <Label htmlFor="cgvAccepted" className="text-sm text-gray-600 cursor-pointer">
                            J'accepte les <Link href="/cgv" className="text-[#5CD85A] underline">conditions générales</Link> et la politique de confidentialité
                          </Label>
                        </div>
                        {errorsStep3.cgvAccepted && (
                          <p className="text-sm text-red-500">{errorsStep3.cgvAccepted.message}</p>
                        )}

                        {/* Total to Pay */}
                        <div className="bg-[#0A0A0A] p-6 rounded-xl mt-6">
                          <div className="flex items-center justify-between mb-4">
                            <span className="text-white/60">Montant à payer</span>
                            <span className="text-3xl font-bold text-[#5CD85A]">
                              {formatPrice(bookingData.totalPrice)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-white/40 text-sm">
                            {paymentMethod === 'card' ? (
                              <>
                                <IconCreditCard className="h-4 w-4" />
                                Paiement par carte bancaire
                              </>
                            ) : (
                              <>
                                <IconCash className="h-4 w-4" />
                                Paiement en espèces au chauffeur
                              </>
                            )}
                          </div>
                        </div>

                        <div className="flex gap-3 pt-4">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setStep(2)}
                            className="flex-1 h-12"
                            disabled={isProcessingPayment}
                          >
                            <IconArrowLeft className="mr-2 h-4 w-4" />
                            Retour
                          </Button>
                          <Button
                            type="submit"
                            className="flex-1 h-12 bg-[#5CD85A] hover:bg-[#4BC449] text-[#0A0A0A]"
                            disabled={isProcessingPayment}
                          >
                            {isProcessingPayment ? (
                              <>
                                <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                                Traitement...
                              </>
                            ) : paymentMethod === 'card' ? (
                              <>
                                Payer et réserver
                                <IconArrowRight className="ml-2 h-4 w-4" />
                              </>
                            ) : (
                              <>
                                Recevoir le code
                                <IconArrowRight className="ml-2 h-4 w-4" />
                              </>
                            )}
                          </Button>
                        </div>
                      </form>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* OTP Verification Step */}
              {step === 3 && showOtpInput && (
                <div className="space-y-6">
                  <Card className="border-0 shadow-lg">
                    <CardContent className="p-6">
                      <div className="text-center mb-6">
                        <div className="w-16 h-16 rounded-full bg-[#5CD85A]/10 flex items-center justify-center mx-auto mb-4">
                          <IconLock className="h-8 w-8 text-[#5CD85A]" />
                        </div>
                        <h2 className="text-xl font-semibold mb-2">Vérification par email</h2>
                        <p className="text-gray-600">
                          Un code à 6 chiffres a été envoyé à votre adresse email.
                          <br />
                          Entrez-le ci-dessous pour confirmer votre réservation.
                        </p>
                      </div>

                      {/* OTP Input */}
                      <div className="flex justify-center gap-2 mb-6">
                        {otpCode.map((digit, index) => (
                          <input
                            key={index}
                            ref={(el) => { otpInputRefs.current[index] = el; }}
                            type="text"
                            inputMode="numeric"
                            maxLength={1}
                            value={digit}
                            onChange={(e) => handleOtpChange(index, e.target.value)}
                            onKeyDown={(e) => handleOtpKeyDown(index, e)}
                            onPaste={handleOtpPaste}
                            className={`w-12 h-14 text-center text-2xl font-bold border-2 rounded-xl focus:outline-none focus:border-[#5CD85A] transition-colors ${otpError ? 'border-red-300' : 'border-gray-200'
                              }`}
                          />
                        ))}
                      </div>

                      {otpError && (
                        <p className="text-center text-red-500 text-sm mb-4">{otpError}</p>
                      )}

                      <Button
                        onClick={verifyOtp}
                        className="w-full h-12 bg-[#5CD85A] hover:bg-[#4BC449] text-[#0A0A0A] mb-4"
                        disabled={isProcessingPayment || otpCode.some(d => !d)}
                      >
                        {isProcessingPayment ? (
                          <>
                            <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                            Vérification...
                          </>
                        ) : (
                          <>
                            Confirmer ma réservation
                            <IconCheck className="ml-2 h-4 w-4" />
                          </>
                        )}
                      </Button>

                      <div className="text-center">
                        <button
                          type="button"
                          onClick={resendOtp}
                          className="text-[#5CD85A] text-sm hover:underline"
                        >
                          Renvoyer le code
                        </button>
                      </div>

                      <div className="mt-6 p-4 bg-gray-50 rounded-xl">
                        <div className="text-sm text-gray-600">
                          <strong>Récapitulatif :</strong>
                          <div className="mt-2 space-y-1">
                            <div>📍 {bookingData.pickupAddress}</div>
                            <div>🏁 {bookingData.dropoffAddress}</div>
                            <div>📅 {bookingData.pickupDate?.toLocaleDateString('fr-FR')} à {bookingData.pickupTime}</div>
                            <div className="font-semibold text-[#5CD85A]">💰 {formatPrice(bookingData.totalPrice)} (espèces)</div>
                          </div>
                        </div>
                      </div>

                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowOtpInput(false);
                          setOtpCode(['', '', '', '', '', '']);
                          setOtpError('');
                        }}
                        className="w-full h-12 mt-4"
                      >
                        <IconArrowLeft className="mr-2 h-4 w-4" />
                        Modifier mes informations
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 space-y-4">
                {/* Trust Badges */}
                <Card className="border-0 shadow-lg">
                  <CardContent className="p-5 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#5CD85A]/10 flex items-center justify-center">
                        <IconShieldCheck className="h-5 w-5 text-[#5CD85A]" />
                      </div>
                      <div>
                        <div className="font-medium text-sm">Paiement sécurisé</div>
                        <div className="text-xs text-gray-500">SSL 256-bit</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#5CD85A]/10 flex items-center justify-center">
                        <IconClock className="h-5 w-5 text-[#5CD85A]" />
                      </div>
                      <div>
                        <div className="font-medium text-sm">Confirmation immédiate</div>
                        <div className="text-xs text-gray-500">Par email et SMS</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#5CD85A]/10 flex items-center justify-center">
                        <IconStar className="h-5 w-5 text-[#5CD85A]" />
                      </div>
                      <div>
                        <div className="font-medium text-sm">Note 5/5</div>
                        <div className="text-xs text-gray-500">100% satisfaction</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Need Help */}
                <Card className="border-0 shadow-lg bg-[#0A0A0A]">
                  <CardContent className="p-5">
                    <div className="text-white">
                      <div className="font-medium mb-2">Besoin d'aide ?</div>
                      <p className="text-sm text-white/70 mb-4">
                        Notre équipe est disponible pour vous accompagner
                      </p>
                      <a
                        href={`tel:${CONTACT.phone}`}
                        className="inline-flex items-center gap-2 text-[#5CD85A] text-sm font-medium"
                      >
                        <IconPhone className="h-4 w-4" />
                        {CONTACT.phone}
                      </a>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
