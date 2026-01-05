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
  IconClockHour4,
  IconCreditCard,
  IconShieldCheck,
  IconPhone,
  IconStar,
  IconCash,
  IconLock,
  IconRoute,
  IconSparkles,
  IconCircleDot,
  IconMapPinFilled,
  IconArrowsExchange,
  IconBug,
} from '@tabler/icons-react';
import { PricingDebugPanel } from '@/components/debug-ui';

type BookingStep = 1 | 2 | 3;
type PaymentMethod = 'card' | 'cash';

export default function ReservationPage() {
  const [step, setStep] = useState<BookingStep>(1);
  const [bookingData, setBookingData] = useState<any>({});
  const [isCalculating, setIsCalculating] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [debugMode, setDebugMode] = useState(false);
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

  // Animation states
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

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
      tripType: 'one-way',
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
      if (data.serviceType === 'transfer' && data.pickupLat && data.pickupLng && data.dropoffLat && data.dropoffLng) {
        try {
          const pickupDateStr = new Date(data.pickupDate).toISOString().split('T')[0];

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
              tollCost: 0,
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
            breakdown: est.pricing.breakdown,
            priceBreakdown: est.pricing.breakdown,
            debugInfo: est.debugInfo, // Debug info for pricing calculation details
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

      // For hourly services
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

      const pricing = await calculatePrice({
        serviceType: data.serviceType,
        tripType: data.tripType,
        distanceCA,
        distanceTP,
        distanceReturn,
        pickupTime: pickupDateTime,
        hours: data.serviceType === 'hourly' ? (data.hours || 2) : undefined,
        duration, // Pass estimated duration for automatic forfait calculation
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

  // Card formatting helpers
  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    const groups = cleaned.match(/.{1,4}/g);
    return groups ? groups.join(' ').substring(0, 19) : cleaned;
  };

  const formatExpiry = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length >= 2) {
      return cleaned.substring(0, 2) + '/' + cleaned.substring(2, 4);
    }
    return cleaned;
  };

  const getCardType = (number: string) => {
    const cleaned = number.replace(/\s/g, '');
    if (cleaned.startsWith('4')) return 'VISA';
    if (/^5[1-5]/.test(cleaned) || /^2[2-7]/.test(cleaned)) return 'MC';
    if (/^3[47]/.test(cleaned)) return 'AMEX';
    return '';
  };

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

  // Create booking
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

  // OTP handlers
  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otpCode];
    newOtp[index] = value.slice(-1);
    setOtpCode(newOtp);
    setOtpError('');
    if (value && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otpCode[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const newOtp = [...otpCode];
    pastedData.split('').forEach((char, index) => {
      if (index < 6) newOtp[index] = char;
    });
    setOtpCode(newOtp);
  };

  const sendOtp = async (bookingId: number) => {
    try {
      const response = await fetch('/api/bookings/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId }),
      });

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Erreur lors de l\'envoi du code');
      }
      return true;
    } catch (error) {
      console.error('Error sending OTP:', error);
      return false;
    }
  };

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
        setOtpError(result.error || 'Code invalide');
      }
    } catch (error) {
      console.error('OTP verification error:', error);
      setOtpError('Erreur de vérification. Réessayez.');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const resendOtp = async () => {
    if (!createdBookingId) return;
    setOtpCode(['', '', '', '', '', '']);
    setOtpError('');
    const success = await sendOtp(createdBookingId);
    if (success) {
      alert('Un nouveau code a été envoyé à votre email');
    }
  };

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
      // Force payment method to cash (payment on-site with driver)
      const bookingDataWithCash = { ...data, paymentMethod: 'cash' as PaymentMethod };
      const bookingId = await createBooking(bookingDataWithCash);

      if (!bookingId) {
        alert('Erreur lors de la création de la réservation');
        setIsProcessingPayment(false);
        return;
      }

      setCreatedBookingId(bookingId);

      // Send OTP verification code
      const otpSent = await sendOtp(bookingId);
      if (otpSent) {
        setShowOtpInput(true);
      } else {
        alert('Erreur lors de l\'envoi du code de vérification');
      }
    } catch (error) {
      console.error('Booking submission error:', error);
      alert('Erreur lors de la création de la réservation');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  // Step indicator component
  const StepIndicator = () => (
    <div className="relative">
      <div className="flex items-center justify-center gap-2 md:gap-4">
        {[
          { num: 1, label: 'Trajet', icon: IconRoute },
          { num: 2, label: 'Estimation', icon: IconSparkles },
          { num: 3, label: 'Réservation', icon: IconCheck },
        ].map((s, i) => (
          <div key={s.num} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`
                  relative w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center
                  font-semibold text-sm transition-all duration-500 ease-out
                  ${step >= s.num
                    ? 'bg-gradient-to-br from-[#5CD85A] to-[#4BC449] text-[#0A0A0A] shadow-lg shadow-[#5CD85A]/25'
                    : 'bg-white/5 text-white/40 border border-white/10'
                  }
                `}
              >
                {step > s.num ? (
                  <IconCheck className="h-5 w-5 md:h-6 md:w-6" strokeWidth={2.5} />
                ) : (
                  <s.icon className="h-5 w-5 md:h-6 md:w-6" />
                )}
                {step === s.num && (
                  <div className="absolute inset-0 rounded-2xl bg-[#5CD85A] animate-ping opacity-20" />
                )}
              </div>
              <span className={`
                text-xs md:text-sm mt-2 font-medium transition-colors duration-300
                ${step >= s.num ? 'text-white' : 'text-white/40'}
              `}>
                {s.label}
              </span>
            </div>
            {i < 2 && (
              <div className={`
                w-8 md:w-16 h-0.5 mx-2 md:mx-3 rounded-full transition-all duration-500
                ${step > s.num ? 'bg-[#5CD85A]' : 'bg-white/10'}
              `} />
            )}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30">
      {/* Premium Hero Header */}
      <div className="relative overflow-hidden bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
        {/* Animated background */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-[#5CD85A]/15 rounded-full blur-[150px] animate-pulse-slow" />
          <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-emerald-400/10 rounded-full blur-[120px]" />
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.03]" />
        </div>

        <div className="relative z-10 pt-8 pb-16 md:pt-12 md:pb-20">
          <div className="container mx-auto px-6 md:px-12 lg:px-24">
            {/* Header */}
            <div className="text-center mb-10 md:mb-14">
              <div className={`
                inline-flex items-center gap-2 px-4 py-2 rounded-full 
                bg-white/10 border border-white/20 backdrop-blur-sm mb-6
                transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
              `}>
                <IconSparkles className="h-4 w-4 text-[#5CD85A]" />
                <span className="text-sm text-white/80">Réservation instantanée</span>
              </div>
              <h1 className={`
                text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4
                transition-all duration-700 delay-100 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
              `}>
                Réservez votre
                <span className="text-[#5CD85A]"> VTC</span>
              </h1>
              <p className={`
                text-lg text-white/70 max-w-xl mx-auto
                transition-all duration-700 delay-200 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
              `}>
                Service premium en Haute-Savoie • Devis instantané
              </p>
            </div>

            {/* Step Indicator */}
            <div className={`
              transition-all duration-700 delay-300 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
            `}>
              <StepIndicator />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative -mt-8 z-20">
        <div className="container mx-auto px-6 md:px-12 lg:px-24 pb-16">
          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
              {/* Main Form Area */}
              <div className="lg:col-span-2 space-y-6">
                {/* Step 1: Trip Details */}
                {step === 1 && (
                  <div className="space-y-6 animate-fade-in-up">
                    {/* Service Type Selection */}
                    <div className="bg-white rounded-3xl p-6 md:p-8 shadow-xl shadow-slate-200/60 border border-slate-100">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-[#5CD85A]/10 flex items-center justify-center">
                          <IconCar className="h-5 w-5 text-[#5CD85A]" />
                        </div>
                        <div>
                          <h2 className="text-lg font-bold text-[#0A0A0A]">Type de service</h2>
                          <p className="text-sm text-gray-500">Choisissez votre formule</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        {SERVICES.map((service) => {
                          const isSelected = step1Data.serviceType === service.id;
                          const IconComponent = service.id === 'transfer' ? IconCar : IconClockHour4;

                          return (
                            <button
                              key={service.id}
                              type="button"
                              onClick={() => setValueStep1('serviceType', service.id as any)}
                              className={`
                                relative p-5 rounded-2xl text-left transition-all duration-300
                                ${isSelected
                                  ? 'bg-gradient-to-br from-[#5CD85A] to-[#4BC449] shadow-lg shadow-[#5CD85A]/20'
                                  : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent hover:border-gray-200'
                                }
                              `}
                            >
                              <div className={`
                                w-12 h-12 rounded-xl mb-4 flex items-center justify-center transition-colors
                                ${isSelected ? 'bg-white/20 text-[#0A0A0A]' : 'bg-gray-200 text-gray-500'}
                              `}>
                                <IconComponent className="h-6 w-6" />
                              </div>
                              <div className={`font-semibold ${isSelected ? 'text-[#0A0A0A]' : 'text-gray-900'}`}>
                                {service.name}
                              </div>
                              <div className={`text-sm mt-1 ${isSelected ? 'text-[#0A0A0A]/70' : 'text-gray-500'}`}>
                                {service.priceInfo}
                              </div>
                              {isSelected && (
                                <div className="absolute top-3 right-3">
                                  <IconCheck className="h-5 w-5 text-[#0A0A0A]" />
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>

                      {/* Trip Type for Transfer */}
                      {step1Data.serviceType === 'transfer' && (
                        <div className="mt-6 pt-6 border-t border-gray-100">
                          <Label className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                            <IconArrowsExchange className="h-4 w-4 text-[#5CD85A]" />
                            Type de trajet
                          </Label>
                          <div className="grid grid-cols-2 gap-3 mt-3">
                            {[
                              { value: 'one-way', label: 'Aller Simple', sub: 'Trajet unique' },
                              { value: 'round-trip', label: 'Aller-Retour', sub: 'Même jour' },
                            ].map((option) => (
                              <button
                                key={option.value}
                                type="button"
                                onClick={() => setValueStep1('tripType', option.value as any)}
                                className={`
                                  p-4 rounded-xl text-left transition-all duration-200 border-2
                                  ${(step1Data.tripType || 'one-way') === option.value
                                    ? 'border-[#5CD85A] bg-[#5CD85A]/5'
                                    : 'border-gray-100 hover:border-gray-200'
                                  }
                                `}
                              >
                                <div className="font-medium text-sm text-gray-900">{option.label}</div>
                                <div className="text-xs text-gray-500 mt-0.5">{option.sub}</div>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Hours selection for Hourly service */}
                      {step1Data.serviceType === 'hourly' && (
                        <div className="mt-6 pt-6 border-t border-gray-100">
                          <Label className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                            <IconClock className="h-4 w-4 text-[#5CD85A]" />
                            Durée de mise à disposition
                          </Label>
                          <div className="grid grid-cols-4 md:grid-cols-6 gap-2 mt-3">
                            {[2, 3, 4, 5, 6, 7, 8].map((h) => {
                              const forfait = FORFAITS.find(f => f.hours === h);
                              const isSelected = (step1Data.hours || 2) === h;
                              return (
                                <button
                                  key={h}
                                  type="button"
                                  onClick={() => setValueStep1('hours', h)}
                                  className={`
                                    p-3 rounded-xl text-center transition-all duration-200 border-2
                                    ${isSelected
                                      ? 'border-[#5CD85A] bg-[#5CD85A]/10'
                                      : 'border-gray-100 hover:border-gray-200'
                                    }
                                  `}
                                >
                                  <div className="font-bold text-sm">{h}H</div>
                                  {forfait && (
                                    <div className="text-xs text-gray-500">{forfait.day}€</div>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Route Input */}
                    <div className="bg-white rounded-3xl p-6 md:p-8 shadow-xl shadow-slate-200/60 border border-slate-100">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-[#5CD85A]/10 flex items-center justify-center">
                          <IconRoute className="h-5 w-5 text-[#5CD85A]" />
                        </div>
                        <div>
                          <h2 className="text-lg font-bold text-[#0A0A0A]">Votre itinéraire</h2>
                          <p className="text-sm text-gray-500">Définissez votre trajet</p>
                        </div>
                      </div>

                      <div className="relative">
                        {/* Visual route line */}
                        <div className="absolute left-[22px] top-[48px] bottom-[48px] w-0.5 bg-gradient-to-b from-[#5CD85A] via-gray-200 to-red-400" />

                        <div className="space-y-4">
                          {/* Pickup */}
                          <div className="relative">
                            <div className="absolute left-0 top-1/2 -translate-y-1/2 z-10">
                              <div className="w-11 h-11 rounded-full bg-[#5CD85A] flex items-center justify-center shadow-lg shadow-[#5CD85A]/30">
                                <IconCircleDot className="h-5 w-5 text-white" />
                              </div>
                            </div>
                            <div className="pl-16">
                              <AddressAutocomplete
                                label="Adresse de départ"
                                placeholder="D'où partez-vous ?"
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
                            </div>
                          </div>

                          {/* Dropoff */}
                          <div className="relative">
                            <div className="absolute left-0 top-1/2 -translate-y-1/2 z-10">
                              <div className="w-11 h-11 rounded-full bg-red-500 flex items-center justify-center shadow-lg shadow-red-500/30">
                                <IconMapPinFilled className="h-5 w-5 text-white" />
                              </div>
                            </div>
                            <div className="pl-16">
                              <AddressAutocomplete
                                label="Adresse d'arrivée"
                                placeholder="Où allez-vous ?"
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
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Date & Time */}
                    <div className="bg-white rounded-3xl p-6 md:p-8 shadow-xl shadow-slate-200/60 border border-slate-100">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-[#5CD85A]/10 flex items-center justify-center">
                          <IconCalendar className="h-5 w-5 text-[#5CD85A]" />
                        </div>
                        <div>
                          <h2 className="text-lg font-bold text-[#0A0A0A]">Date et heure</h2>
                          <p className="text-sm text-gray-500">Planifiez votre trajet</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Calendar */}
                        <div>
                          <div className="border border-gray-100 rounded-2xl p-4 bg-gray-50/50">
                            <Calendar
                              mode="single"
                              selected={selectedDate}
                              onSelect={(date) => {
                                setSelectedDate(date);
                                if (date) setValueStep1('pickupDate', date);
                              }}
                              disabled={(date) => date < new Date()}
                              className="rounded-xl"
                            />
                          </div>
                          {errorsStep1.pickupDate && (
                            <p className="text-sm text-red-500 mt-2">{errorsStep1.pickupDate.message}</p>
                          )}
                        </div>

                        {/* Time and passengers */}
                        <div className="space-y-5">
                          <div>
                            <Label className="text-sm font-semibold text-gray-700 mb-2 block">
                              Heure de prise en charge
                            </Label>
                            <Input
                              type="time"
                              className="h-14 rounded-xl border-2 border-gray-100 focus:border-[#5CD85A] text-lg font-medium"
                              {...registerStep1('pickupTime')}
                            />
                            {errorsStep1.pickupTime && (
                              <p className="text-sm text-red-500 mt-1">{errorsStep1.pickupTime.message}</p>
                            )}
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                <IconUsers className="h-4 w-4" />
                                Passagers
                              </Label>
                              <Input
                                type="number"
                                min="1"
                                max="4"
                                className="h-14 rounded-xl border-2 border-gray-100 focus:border-[#5CD85A] text-lg font-medium text-center"
                                {...registerStep1('passengers', { valueAsNumber: true })}
                              />
                            </div>
                            <div>
                              <Label className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                <IconLuggage className="h-4 w-4" />
                                Bagages
                              </Label>
                              <Input
                                type="number"
                                min="0"
                                max="5"
                                className="h-14 rounded-xl border-2 border-gray-100 focus:border-[#5CD85A] text-lg font-medium text-center"
                                {...registerStep1('luggage', { valueAsNumber: true })}
                              />
                            </div>
                          </div>

                          <div>
                            <Label className="text-sm font-semibold text-gray-700 mb-2 block">
                              Heure d'arrivée max <span className="text-gray-400 font-normal">(optionnel)</span>
                            </Label>
                            <Input
                              type="time"
                              className="h-14 rounded-xl border-2 border-gray-100 focus:border-[#5CD85A]"
                              {...registerStep1('maxArrivalTime')}
                            />
                            <p className="text-xs text-gray-500 mt-1">Pour correspondance train/avion</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Submit Button */}
                    <Button
                      onClick={handleSubmitStep1(onStep1Submit)}
                      className="w-full h-16 text-lg font-bold bg-gradient-to-r from-[#5CD85A] to-[#4BC449] hover:from-[#4BC449] hover:to-[#3AB338] text-[#0A0A0A] rounded-2xl shadow-lg shadow-[#5CD85A]/25 transition-all duration-300 hover:shadow-xl hover:shadow-[#5CD85A]/30 hover:-translate-y-0.5"
                      disabled={isCalculating}
                    >
                      {isCalculating ? (
                        <>
                          <IconLoader2 className="mr-3 h-6 w-6 animate-spin" />
                          Calcul en cours...
                        </>
                      ) : (
                        <>
                          Calculer mon estimation
                          <IconArrowRight className="ml-3 h-6 w-6" />
                        </>
                      )}
                    </Button>
                  </div>
                )}

                {/* Step 2: Price Summary */}
                {step === 2 && (
                  <div className="space-y-6 animate-fade-in-up">
                    {/* Price Card */}
                    <div className="bg-white rounded-3xl overflow-hidden shadow-xl shadow-slate-200/60 border border-slate-100">
                      {/* Price Header */}
                      <div className="relative bg-gradient-to-br from-[#0A0A0A] to-[#1A1A1A] p-8 overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-[#5CD85A]/10 rounded-full blur-[80px]" />
                        <div className="relative z-10">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="text-white/50 text-sm font-medium mb-2">Prix estimé</p>
                              <div className="text-5xl md:text-6xl font-bold text-[#5CD85A]">
                                {formatPrice(bookingData.totalPrice)}
                              </div>
                              <p className="text-white/40 text-sm mt-2">TTC • TVA incluse</p>
                            </div>
                            <Badge className={`
                              px-4 py-2 text-sm font-semibold rounded-full
                              ${bookingData.isNightRate
                                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-400/30'
                                : 'bg-amber-500/20 text-amber-300 border border-amber-400/30'
                              }
                            `}>
                              {bookingData.isNightRate ? '🌙 Tarif nuit' : '☀️ Tarif jour'}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      {/* Trip Details */}
                      <div className="p-8">
                        {/* Route visualization */}
                        <div className="relative mb-8">
                          <div className="absolute left-[22px] top-[20px] bottom-[20px] w-0.5 bg-gradient-to-b from-[#5CD85A] to-red-400" />
                          <div className="space-y-6">
                            <div className="flex items-start gap-4">
                              <div className="w-11 h-11 rounded-full bg-[#5CD85A] flex items-center justify-center flex-shrink-0">
                                <IconCircleDot className="h-5 w-5 text-white" />
                              </div>
                              <div className="flex-1 pt-2">
                                <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">Départ</p>
                                <p className="text-gray-900 font-medium mt-1">{bookingData.pickupAddress}</p>
                              </div>
                            </div>
                            <div className="flex items-start gap-4">
                              <div className="w-11 h-11 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0">
                                <IconMapPinFilled className="h-5 w-5 text-white" />
                              </div>
                              <div className="flex-1 pt-2">
                                <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">Arrivée</p>
                                <p className="text-gray-900 font-medium mt-1">{bookingData.dropoffAddress}</p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Forfait Adjustment Warning */}
                        {bookingData.forfaitAdjusted && bookingData.suggestionMessage && (
                          <div className="mb-8 p-5 bg-amber-50 border-2 border-amber-200 rounded-2xl">
                            <div className="flex items-start gap-3">
                              <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center flex-shrink-0">
                                <IconSparkles className="h-5 w-5 text-white" />
                              </div>
                              <div className="flex-1">
                                <h4 className="font-semibold text-amber-900 mb-1">Forfait ajusté automatiquement</h4>
                                <p className="text-sm text-amber-800 leading-relaxed">
                                  {bookingData.suggestionMessage.replace('⚠️ Attention : ', '')}
                                </p>
                                <div className="mt-3 flex items-center gap-4 text-xs text-amber-700">
                                  <span>Demandé : {bookingData.requestedHours}h</span>
                                  <span className="text-amber-400">→</span>
                                  <span className="font-semibold">Appliqué : {bookingData.appliedHours}h</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Info grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                          {[
                            { label: 'Distance', value: `${Math.round(bookingData.distance)} km`, icon: IconRoute },
                            { label: 'Durée', value: `~${Math.round(bookingData.duration)} min`, icon: IconClock },
                            { label: 'Date', value: bookingData.pickupDate?.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }), icon: IconCalendar },
                            { label: 'Heure', value: bookingData.pickupTime, icon: IconClock },
                          ].map((item) => (
                            <div key={item.label} className="bg-gray-50 rounded-2xl p-4 text-center">
                              <item.icon className="h-5 w-5 text-[#5CD85A] mx-auto mb-2" />
                              <p className="text-xs text-gray-500 mb-1">{item.label}</p>
                              <p className="font-bold text-gray-900">{item.value}</p>
                            </div>
                          ))}
                        </div>

                        {/* Price breakdown */}
                        <div className="border-t border-gray-100 pt-6">
                          <div className="space-y-3">
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-500">Sous-total HT</span>
                              <span className="font-medium">{formatPrice(bookingData.totalPriceHT || bookingData.totalPrice / 1.10)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-500">TVA (10%)</span>
                              <span className="font-medium">{formatPrice(bookingData.tvaAmount || 0)}</span>
                            </div>
                            <div className="flex justify-between text-lg font-bold pt-3 border-t border-gray-100">
                              <span>Total TTC</span>
                              <span className="text-[#5CD85A]">{formatPrice(bookingData.totalPrice)}</span>
                            </div>
                          </div>
                        </div>

                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-4">
                      <Button
                        variant="outline"
                        onClick={() => setStep(1)}
                        className="flex-1 h-14 rounded-2xl border-2 border-gray-200 hover:border-gray-300 font-semibold"
                      >
                        <IconArrowLeft className="mr-2 h-5 w-5" />
                        Modifier
                      </Button>
                      <Button
                        onClick={() => setStep(3)}
                        className="flex-1 h-14 rounded-2xl bg-gradient-to-r from-[#5CD85A] to-[#4BC449] hover:from-[#4BC449] hover:to-[#3AB338] text-[#0A0A0A] font-bold shadow-lg shadow-[#5CD85A]/25"
                      >
                        Estimer votre course
                        <IconArrowRight className="ml-2 h-5 w-5" />
                      </Button>
                    </div>

                    {/* Debug Mode Toggle */}
                    <button
                      type="button"
                      onClick={() => setDebugMode(!debugMode)}
                      className={`
                        w-full flex items-center justify-between p-4 rounded-xl transition-all duration-300
                        ${debugMode
                          ? 'bg-orange-50 border-2 border-orange-200'
                          : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                        }
                      `}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`
                          w-10 h-10 rounded-lg flex items-center justify-center
                          ${debugMode ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-500'}
                        `}>
                          <IconBug className="h-5 w-5" />
                        </div>
                        <div className="text-left">
                          <div className="font-semibold text-gray-900">Mode Debug</div>
                          <div className="text-xs text-gray-500">Afficher les détails du calcul</div>
                        </div>
                      </div>
                      <div className={`
                        w-12 h-6 rounded-full transition-colors duration-300 relative
                        ${debugMode ? 'bg-orange-500' : 'bg-gray-300'}
                      `}>
                        <div className={`
                          absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform duration-300
                          ${debugMode ? 'translate-x-7' : 'translate-x-1'}
                        `} />
                      </div>
                    </button>

                    {/* Debug Panel */}
                    {debugMode && <PricingDebugPanel bookingData={bookingData} />}
                  </div>
                )}

                {/* Step 3: Payment */}
                {step === 3 && !showOtpInput && (
                  <div className="space-y-6 animate-fade-in-up">
                    <div className="bg-white rounded-3xl p-6 md:p-8 shadow-xl shadow-slate-200/60 border border-slate-100">
                      {/* Contact Info */}
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-[#5CD85A]/10 flex items-center justify-center">
                          <IconUsers className="h-5 w-5 text-[#5CD85A]" />
                        </div>
                        <div>
                          <h2 className="text-lg font-bold text-[#0A0A0A]">Vos coordonnées</h2>
                          <p className="text-sm text-gray-500">Pour vous contacter</p>
                        </div>
                      </div>

                      <form onSubmit={handleSubmitStep3(onStep3Submit)} className="space-y-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="md:col-span-2">
                            <Label className="text-sm font-semibold text-gray-700 mb-2 block">Nom complet</Label>
                            <Input
                              placeholder="Jean Dupont"
                              className="h-14 rounded-xl border-2 border-gray-100 focus:border-[#5CD85A] text-lg"
                              {...registerStep3('guestName')}
                            />
                            {errorsStep3.guestName && (
                              <p className="text-sm text-red-500 mt-1">{errorsStep3.guestName.message}</p>
                            )}
                          </div>
                          <div>
                            <Label className="text-sm font-semibold text-gray-700 mb-2 block">Email</Label>
                            <Input
                              type="email"
                              placeholder="jean@exemple.com"
                              className="h-14 rounded-xl border-2 border-gray-100 focus:border-[#5CD85A]"
                              {...registerStep3('guestEmail')}
                            />
                            {errorsStep3.guestEmail && (
                              <p className="text-sm text-red-500 mt-1">{errorsStep3.guestEmail.message}</p>
                            )}
                          </div>
                          <div>
                            <Label className="text-sm font-semibold text-gray-700 mb-2 block">Téléphone</Label>
                            <Input
                              type="tel"
                              placeholder="+33 6 00 00 00 00"
                              className="h-14 rounded-xl border-2 border-gray-100 focus:border-[#5CD85A]"
                              {...registerStep3('guestPhone')}
                            />
                            {errorsStep3.guestPhone && (
                              <p className="text-sm text-red-500 mt-1">{errorsStep3.guestPhone.message}</p>
                            )}
                          </div>
                        </div>

                        {/* Payment Info - Cash Only */}
                        <div className="pt-6 border-t border-gray-100">
                          <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200 rounded-2xl p-6">
                            <div className="flex items-start gap-4">
                              <div className="w-14 h-14 rounded-2xl bg-amber-600 flex items-center justify-center flex-shrink-0">
                                <IconCash className="h-7 w-7 text-white" />
                              </div>
                              <div className="flex-1">
                                <h3 className="text-lg font-bold text-amber-900 mb-2">Mode de paiement</h3>
                                <p className="text-amber-800 leading-relaxed">
                                  <strong>Paiement sur place avec le chauffeur</strong>
                                </p>
                                <p className="text-sm text-amber-700 mt-3 leading-relaxed">
                                  Vous pourrez régler votre course directement auprès du chauffeur à l'issue du trajet,
                                  en espèces ou par carte bancaire.
                                </p>
                                <div className="mt-4 p-3 bg-white/70 rounded-xl">
                                  <p className="text-xs text-amber-800">
                                    <strong>Note :</strong> Un code de vérification sera envoyé par email pour confirmer votre réservation.
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Terms */}
                        <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
                          <input
                            id="cgvAccepted"
                            type="checkbox"
                            className="mt-1 w-5 h-5 rounded-md border-2 border-gray-300 text-[#5CD85A] focus:ring-[#5CD85A]"
                            {...registerStep3('cgvAccepted')}
                          />
                          <Label htmlFor="cgvAccepted" className="text-sm text-gray-600 cursor-pointer">
                            J'accepte les <Link href="/cgv" className="text-[#5CD85A] font-medium hover:underline">conditions générales</Link> et la grille tarifaire
                          </Label>
                        </div>
                        {errorsStep3.cgvAccepted && (
                          <p className="text-sm text-red-500">{errorsStep3.cgvAccepted.message}</p>
                        )}

                        {/* Total */}
                        <div className="bg-gradient-to-br from-[#0A0A0A] to-[#1A1A1A] rounded-2xl p-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-white/50 text-sm">Montant total</p>
                              <p className="text-3xl font-bold text-[#5CD85A] mt-1">
                                {formatPrice(bookingData.totalPrice)}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-white/50 text-sm">{bookingData.isNightRate ? 'Tarif nuit' : 'Tarif jour'}</p>
                              <p className="text-white/70 text-sm mt-1">
                                Paiement sur place
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex gap-4 pt-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setStep(2)}
                            className="flex-1 h-14 rounded-2xl border-2 border-gray-200 font-semibold"
                            disabled={isProcessingPayment}
                          >
                            <IconArrowLeft className="mr-2 h-5 w-5" />
                            Retour
                          </Button>
                          <Button
                            type="submit"
                            className="flex-1 h-14 rounded-2xl bg-gradient-to-r from-[#5CD85A] to-[#4BC449] hover:from-[#4BC449] hover:to-[#3AB338] text-[#0A0A0A] font-bold shadow-lg shadow-[#5CD85A]/25"
                            disabled={isProcessingPayment}
                          >
                            {isProcessingPayment ? (
                              <>
                                <IconLoader2 className="mr-2 h-5 w-5 animate-spin" />
                                Envoi en cours...
                              </>
                            ) : (
                              <>
                                Envoyer la demande
                                <IconArrowRight className="ml-2 h-5 w-5" />
                              </>
                            )}
                          </Button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}

                {/* OTP Verification */}
                {step === 3 && showOtpInput && (
                  <div className="animate-fade-in-up">
                    <div className="bg-white rounded-3xl p-8 shadow-xl shadow-slate-200/60 border border-slate-100 text-center">
                      <div className="w-20 h-20 rounded-2xl bg-[#5CD85A]/10 flex items-center justify-center mx-auto mb-6">
                        <IconLock className="h-10 w-10 text-[#5CD85A]" />
                      </div>
                      <h2 className="text-2xl font-bold text-[#0A0A0A] mb-2">
                        Code de vérification
                      </h2>
                      <p className="text-gray-500 mb-2">
                        Un code à 6 chiffres a été envoyé à votre adresse email
                      </p>
                      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
                        <p className="text-sm text-blue-800">
                          <strong>Attente de confirmation du chauffeur</strong><br />
                          Votre demande sera examinée. Vous recevrez une notification par email.
                        </p>
                      </div>

                      {/* OTP Input */}
                      <div className="flex justify-center gap-3 mb-6">
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
                            className={`
                              w-14 h-16 text-center text-2xl font-bold rounded-xl border-2 transition-all
                              focus:outline-none focus:border-[#5CD85A] focus:ring-4 focus:ring-[#5CD85A]/10
                              ${otpError ? 'border-red-300 bg-red-50' : 'border-gray-200'}
                            `}
                          />
                        ))}
                      </div>

                      {otpError && (
                        <p className="text-red-500 text-sm mb-4">{otpError}</p>
                      )}

                      <Button
                        onClick={verifyOtp}
                        className="w-full h-14 rounded-2xl bg-gradient-to-r from-[#5CD85A] to-[#4BC449] text-[#0A0A0A] font-bold mb-4"
                        disabled={isProcessingPayment || otpCode.some(d => !d)}
                      >
                        {isProcessingPayment ? (
                          <>
                            <IconLoader2 className="mr-2 h-5 w-5 animate-spin" />
                            Envoi de la demande...
                          </>
                        ) : (
                          <>
                            Envoyer la demande de réservation
                            <IconCheck className="ml-2 h-5 w-5" />
                          </>
                        )}
                      </Button>

                      <button
                        type="button"
                        onClick={resendOtp}
                        className="text-[#5CD85A] text-sm font-medium hover:underline"
                      >
                        Renvoyer le code
                      </button>

                      {/* Summary */}
                      <div className="mt-8 p-5 bg-gray-50 rounded-2xl text-left">
                        <p className="font-semibold text-gray-900 mb-3">Récapitulatif</p>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2 text-gray-600">
                            <IconCircleDot className="h-4 w-4 text-[#5CD85A]" />
                            {bookingData.pickupAddress}
                          </div>
                          <div className="flex items-center gap-2 text-gray-600">
                            <IconMapPinFilled className="h-4 w-4 text-red-500" />
                            {bookingData.dropoffAddress}
                          </div>
                          <div className="flex items-center gap-2 text-gray-600">
                            <IconCalendar className="h-4 w-4" />
                            {bookingData.pickupDate?.toLocaleDateString('fr-FR')} à {bookingData.pickupTime}
                          </div>
                          <div className="flex items-center gap-2 text-[#5CD85A] font-bold pt-2 border-t border-gray-200 mt-3">
                            <IconCash className="h-4 w-4" />
                            {formatPrice(bookingData.totalPrice)} (paiement sur place)
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
                        className="w-full h-12 rounded-xl mt-6"
                      >
                        <IconArrowLeft className="mr-2 h-4 w-4" />
                        Modifier mes informations
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Sidebar */}
              <div className="lg:col-span-1">
                <div className="sticky top-8 space-y-6">
                  {/* Trust badges */}
                  <div className="bg-white rounded-3xl p-6 shadow-xl shadow-slate-200/50 border border-slate-100">
                    <h3 className="font-bold text-gray-900 mb-5">Pourquoi nous choisir</h3>
                    <div className="space-y-5">
                      {[
                        { icon: IconShieldCheck, title: 'Paiement sécurisé', desc: 'SSL 256-bit' },
                        { icon: IconClock, title: 'Confirmation instantanée', desc: 'Par email' },
                        { icon: IconStar, title: 'Service 5 étoiles', desc: '100% satisfaction' },
                      ].map((item) => (
                        <div key={item.title} className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-[#5CD85A]/10 flex items-center justify-center flex-shrink-0">
                            <item.icon className="h-6 w-6 text-[#5CD85A]" />
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900">{item.title}</div>
                            <div className="text-sm text-gray-500">{item.desc}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Help card */}
                  <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-3xl p-6 relative overflow-hidden shadow-xl shadow-emerald-200/50">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-[40px]" />
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-emerald-400/20 rounded-full blur-[30px]" />
                    <div className="relative z-10">
                      <h3 className="font-bold text-white mb-2">Besoin d'aide ?</h3>
                      <p className="text-white/80 text-sm mb-5">
                        Notre équipe est à votre disposition
                      </p>
                      <a
                        href={`tel:${CONTACT.phone}`}
                        className="flex items-center gap-3 text-white font-semibold hover:text-emerald-100 transition-colors"
                      >
                        <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
                          <IconPhone className="h-5 w-5" />
                        </div>
                        {CONTACT.phone}
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div >
        </div >
      </div >
    </div >
  );
}
