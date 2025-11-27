'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { AddressAutocomplete } from '@/components/booking/address-autocomplete';
import { useMapbox, calculateDistance } from '@/hooks/use-mapbox';
import { calculatePrice, formatPrice } from '@/lib/pricing';
import { SERVICES, CONTACT } from '@/lib/constants';
import { useBookingStorage } from '@/hooks/use-local-storage';
import {
  bookingStepOneSchema,
  bookingStepThreeSchema,
  type BookingStepOneData,
  type BookingStepThreeData,
} from '@/lib/validations/booking';
import { 
  IconArrowRight, 
  IconArrowLeft, 
  IconMapPin, 
  IconCalendar, 
  IconUsers, 
  IconBriefcase, 
  IconCheck, 
  IconLoader2,
  IconClock,
  IconLuggage,
  IconCar,
  IconPlane,
  IconClockHour4,
  IconBuilding,
  IconCreditCard,
  IconShieldLock
} from '@tabler/icons-react';

type BookingStep = 1 | 2 | 3;

export default function ReservationPage() {
  const [step, setStep] = useState<BookingStep>(1);
  const [bookingData, setBookingData] = useState<any>({});
  const [isCalculating, setIsCalculating] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const { isLoaded: mapsLoaded, error: mapsError } = useMapbox();
  const { bookingData: savedBookingData, bookingHistory, saveBookingDraft, clearBookingDraft, addToHistory } = useBookingStorage();

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
        // Convert date string to Date object when loading from localStorage
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
  }, []); // Only run on mount

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
    }, 1000); // Debounce for 1 second

    return () => clearTimeout(timer);
  }, [step1Data, step, saveBookingDraft]);

  // Step 3 form
  const {
    register: registerStep3,
    handleSubmit: handleSubmitStep3,
    formState: { errors: errorsStep3 },
  } = useForm<BookingStepThreeData>({
    resolver: zodResolver(bookingStepThreeSchema),
  });

  const onStep1Submit = async (data: BookingStepOneData) => {
    setIsCalculating(true);
    try {
      let distance = 0;
      let duration = 0;

      // Calculate distance if coordinates available
      if (data.pickupLat && data.pickupLng && data.dropoffLat && data.dropoffLng) {
        const result = await calculateDistance(
          { lat: data.pickupLat, lng: data.pickupLng },
          { lat: data.dropoffLat, lng: data.dropoffLng }
        );
        distance = result.distance;
        duration = result.duration;
      }

      // Combine date and time for day/night rate calculation
      let pickupDateTime: Date | undefined;
      if (data.pickupDate && data.pickupTime) {
        const [hours, minutes] = data.pickupTime.split(':').map(Number);
        pickupDateTime = new Date(data.pickupDate);
        pickupDateTime.setHours(hours, minutes, 0, 0);
      }

      // Calculate price with day/night rates
      const pricing = calculatePrice({
        serviceType: data.serviceType,
        distance,
        duration,
        pickupTime: pickupDateTime,
        hours: data.serviceType === 'hourly' ? (data.hours || 2) : undefined,
      });

      const completeBookingData = {
        ...data,
        distance,
        duration,
        ...pricing,
        step: 2,
        // Keep pickupDate as Date object for display
        pickupDate: data.pickupDate,
      };

      setBookingData(completeBookingData);
      // Convert to string only when saving to localStorage
      saveBookingDraft({
        ...completeBookingData,
        pickupDate: data.pickupDate ? data.pickupDate.toISOString() : undefined,
      });
      setStep(2);
    } catch (error) {
      console.error('Error calculating distance:', error);
      // Continue without distance
      let pickupDateTime: Date | undefined;
      if (data.pickupDate && data.pickupTime) {
        const [hours, minutes] = data.pickupTime.split(':').map(Number);
        pickupDateTime = new Date(data.pickupDate);
        pickupDateTime.setHours(hours, minutes, 0, 0);
      }
      const pricing = calculatePrice({
        serviceType: data.serviceType,
        pickupTime: pickupDateTime,
        hours: data.serviceType === 'hourly' ? (data.hours || 2) : undefined,
      });

      const completeBookingData = {
        ...data,
        ...pricing,
        step: 2,
        // Keep pickupDate as Date object for display
        pickupDate: data.pickupDate,
      };

      setBookingData(completeBookingData);
      // Convert to string only when saving to localStorage
      saveBookingDraft({
        ...completeBookingData,
        pickupDate: data.pickupDate ? data.pickupDate.toISOString() : undefined,
      });
      setStep(2);
    } finally {
      setIsCalculating(false);
    }
  };

  const onStep3Submit = async (data: BookingStepThreeData) => {
    const completeData = {
      ...bookingData,
      ...data,
      submittedAt: new Date().toISOString(),
    };

    try {
      // Submit booking to API
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(completeData),
      });

      const result = await response.json();

      if (result.success && result.checkoutUrl) {
        // Save to history before redirecting
        addToHistory({
          ...completeData,
          id: result.bookingId || Date.now().toString(),
          status: 'pending',
        });
        
        // Clear draft data
        clearBookingDraft();
        
        // Redirect to payment success page (mock payment)
        window.location.href = result.checkoutUrl;
      } else {
        alert('Erreur lors de la création de la réservation');
      }
    } catch (error) {
      console.error('Booking submission error:', error);
      alert('Erreur lors de la création de la réservation');
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#FAFAFA]">
      {/* Premium Hero */}
      <section className="bg-gradient-premium-hero text-white py-20 relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-pattern-dots opacity-30"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#5CD85A]/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-[#B8D4E3]/5 rounded-full blur-3xl"></div>
        
        <div className="container mx-auto px-4 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-[#5CD85A]/20 mb-6">
            <IconCar className="h-4 w-4 text-[#5CD85A]" />
            <span className="text-sm font-medium text-white/90">Réservation Premium</span>
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
            Réservez votre <span className="text-gradient-emerald">trajet</span>
          </h1>
          <p className="text-xl text-white/60 max-w-xl mx-auto">
            Une expérience de réservation simple et élégante en moins de 30 secondes
          </p>
        </div>
      </section>

      {/* Premium Progress Steps */}
      <section className="bg-white border-b border-[#E8E8E8] py-10 shadow-sm relative">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center gap-2">
            {[
              { num: 1, label: 'Détails du trajet', icon: IconMapPin },
              { num: 2, label: 'Confirmation', icon: IconCheck },
              { num: 3, label: 'Paiement', icon: IconCreditCard },
            ].map((s, index) => (
              <div key={s.num} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={`flex items-center justify-center w-14 h-14 rounded-2xl font-semibold transition-all duration-500 ${
                      step >= s.num
                        ? 'bg-gradient-to-br from-[#5CD85A] to-[#4BC449] text-[#0A0A0A] shadow-lg shadow-[#5CD85A]/30 scale-110'
                        : 'bg-[#F5F5F5] text-[#A0A0A0] border-2 border-[#E8E8E8]'
                    }`}
                  >
                    {step > s.num ? (
                      <IconCheck className="h-6 w-6" />
                    ) : (
                      <s.icon className="h-6 w-6" />
                    )}
                  </div>
                  <span className={`text-xs font-medium mt-3 transition-colors ${
                    step >= s.num ? 'text-[#4BC449]' : 'text-[#A0A0A0]'
                  }`}>
                    {s.label}
                  </span>
                </div>
                {index < 2 && (
                  <div className="relative mx-4">
                    <div className="w-16 md:w-24 h-1 bg-[#E8E8E8] rounded-full overflow-hidden">
                      <div
                        className={`h-full bg-gradient-to-r from-[#5CD85A] to-[#4BC449] rounded-full transition-all duration-500 ${
                          step > s.num ? 'w-full' : 'w-0'
                        }`}
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Form */}
      <section className="flex-1 py-12">
        <div className="container mx-auto px-4" style={{ width: '80%', maxWidth: '1400px' }}>
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 transition-all duration-300">
            {/* Left Column - Main Form (60%) */}
            <div className="lg:col-span-3">
              {/* Step 1: Trip Details */}
              {step === 1 && (
                <Card className="card-premium border-0 shadow-xl overflow-hidden">
                  <CardHeader className="pb-4 bg-gradient-to-r from-[#FAFAFA] to-white border-b border-[#E8E8E8]">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#5CD85A]/20 to-[#5CD85A]/5 flex items-center justify-center">
                        <IconMapPin className="h-6 w-6 text-[#4BC449]" />
                      </div>
                      <div>
                        <CardTitle className="text-2xl text-[#0A0A0A]">Détails de votre trajet</CardTitle>
                        <CardDescription className="text-base text-[#A0A0A0]">
                          Renseignez les informations de votre déplacement
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <form onSubmit={handleSubmitStep1(onStep1Submit)} className="space-y-6">
                  {/* Service Type */}
                  <div className="space-y-3">
                    <Label className="text-sm font-semibold text-[#0A0A0A]">Type de service</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {SERVICES.map((service) => {
                        const IconComponent = 
                          service.id === 'transfer' ? IconCar :
                          service.id === 'airport' ? IconPlane :
                          service.id === 'hourly' ? IconClockHour4 :
                          IconBuilding;
                        
                        return (
                          <div
                            key={service.id}
                            onClick={() => setValueStep1('serviceType', service.id as any)}
                            className={`cursor-pointer p-5 rounded-xl transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${
                              step1Data.serviceType === service.id
                                ? 'bg-gradient-to-br from-[#5CD85A]/10 to-[#5CD85A]/5 border-2 border-[#5CD85A] shadow-lg shadow-[#5CD85A]/10 scale-[1.02]'
                                : 'bg-white border-2 border-[#E8E8E8] hover:border-[#5CD85A]/50'
                            }`}
                          >
                            <div className="flex items-start gap-4">
                              <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 ${
                                step1Data.serviceType === service.id
                                  ? 'bg-gradient-to-br from-[#5CD85A] to-[#4BC449] text-[#0A0A0A]'
                                  : 'bg-[#F5F5F5] text-[#A0A0A0]'
                              }`}>
                                <IconComponent className="h-6 w-6" />
                              </div>
                              <div className="flex-1">
                                <div className="font-semibold text-base mb-1 text-[#0A0A0A]">{service.name}</div>
                                <div className="text-sm text-[#A0A0A0]">{service.priceInfo}</div>
                              </div>
                              {step1Data.serviceType === service.id && (
                                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[#5CD85A] flex items-center justify-center">
                                  <IconCheck className="h-4 w-4 text-[#0A0A0A]" />
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Addresses */}
                  {mapsError ? (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-2">
                      <p className="text-sm font-medium text-red-800">
                        Erreur Mapbox
                      </p>
                      <p className="text-sm text-red-700">
                        {mapsError.message}
                      </p>
                      <div className="text-xs text-red-600 mt-2 space-y-1">
                        <p><strong>Pour résoudre ce problème :</strong></p>
                        <ol className="list-decimal list-inside space-y-1 ml-2">
                          <li>Créez un fichier <code className="bg-red-100 px-1 rounded">.env.local</code> à la racine du projet</li>
                          <li>Ajoutez votre access token Mapbox : <code className="bg-red-100 px-1 rounded">NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=votre_token_ici</code></li>
                          <li>Créez un compte sur <a href="https://account.mapbox.com" target="_blank" rel="noopener noreferrer" className="underline">mapbox.com</a> si vous n'en avez pas</li>
                          <li>Générez un access token dans votre compte Mapbox avec les permissions :
                            <ul className="list-disc list-inside ml-4 mt-1">
                              <li>Geocoding API</li>
                              <li>Directions API</li>
                            </ul>
                          </li>
                        </ol>
                      </div>
                    </div>
                  ) : !mapsLoaded ? (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <p className="text-sm text-yellow-800">
                        Chargement de la carte...
                      </p>
                    </div>
                  ) : (
                    <>
                      <AddressAutocomplete
                        label="Adresse de départ"
                        placeholder="Ex: 1 Place Bellecour, Lyon"
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
                        placeholder="Ex: Aéroport Lyon Saint-Exupéry"
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
                    </>
                  )}

                  {/* Date & Time */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-slate-900">Date de prise en charge</Label>
                      <div className="border rounded-lg p-2">
                        <Calendar
                          mode="single"
                          selected={selectedDate}
                          onSelect={(date) => {
                            setSelectedDate(date);
                            if (date) {
                              setValueStep1('pickupDate', date);
                            }
                          }}
                          disabled={(date) => date < new Date()}
                          className="rounded-md"
                        />
                      </div>
                      {errorsStep1.pickupDate && (
                        <p className="text-sm text-red-500">{errorsStep1.pickupDate.message}</p>
                      )}
                    </div>

                    <div className="space-y-5">
                      <div className="space-y-2">
                        <Label htmlFor="pickupTime" className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                          <IconClock className="h-4 w-4 text-slate-700" />
                          Heure de prise en charge
                        </Label>
                        <Input
                          id="pickupTime"
                          type="time"
                          className="h-12 text-base"
                          {...registerStep1('pickupTime')}
                        />
                        {errorsStep1.pickupTime && (
                          <p className="text-sm text-red-500 mt-1">{errorsStep1.pickupTime.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="passengers" className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                          <IconUsers className="h-4 w-4 text-slate-700" />
                          Nombre de passagers
                        </Label>
                        <Input
                          id="passengers"
                          type="number"
                          min="1"
                          max="4"
                          className="h-12 text-base"
                          {...registerStep1('passengers', { valueAsNumber: true })}
                        />
                        {errorsStep1.passengers && (
                          <p className="text-sm text-red-500 mt-1">{errorsStep1.passengers.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="luggage" className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                          <IconLuggage className="h-4 w-4 text-slate-700" />
                          Nombre de bagages
                        </Label>
                        <Input
                          id="luggage"
                          type="number"
                          min="0"
                          max="5"
                          className="h-12 text-base"
                          {...registerStep1('luggage', { valueAsNumber: true })}
                        />
                        {errorsStep1.luggage && (
                          <p className="text-sm text-red-500 mt-1">{errorsStep1.luggage.message}</p>
                        )}
                      </div>
                    </div>
                  </div>

                      <Button 
                        type="submit" 
                        className="w-full h-14 text-base font-semibold bg-gradient-to-r from-[#5CD85A] to-[#4BC449] hover:from-[#4BC449] hover:to-[#5CD85A] text-[#0A0A0A] border-0 shadow-lg shadow-[#5CD85A]/30 hover:shadow-xl hover:shadow-[#5CD85A]/40 transition-all duration-300" 
                        size="lg" 
                        disabled={isCalculating}
                      >
                        {isCalculating ? (
                          <>
                            <IconLoader2 className="mr-2 h-5 w-5 animate-spin" />
                            Calcul en cours...
                          </>
                        ) : (
                          <>
                            Continuer
                            <IconArrowRight className="ml-2 h-5 w-5" />
                          </>
                        )}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              )}

              {/* Step 2: Price Confirmation */}
              {step === 2 && (
                <Card className="card-premium border-0 shadow-xl overflow-hidden">
                  <CardHeader className="pb-4 bg-gradient-to-r from-[#FAFAFA] to-white border-b border-[#E8E8E8]">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#B8D4E3]/20 to-[#B8D4E3]/5 flex items-center justify-center">
                        <IconCheck className="h-6 w-6 text-[#B8D4E3]" />
                      </div>
                      <div>
                        <CardTitle className="text-2xl text-[#0A0A0A]">Récapitulatif et prix</CardTitle>
                        <CardDescription className="text-base text-[#A0A0A0]">
                          Vérifiez les détails de votre réservation
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6 pt-6">
                {/* Trip Summary */}
                <div className="space-y-4 p-6 bg-gradient-to-br from-[#5CD85A]/5 to-[#FAFAFA] rounded-xl border border-[#5CD85A]/20">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-[#5CD85A] to-[#4BC449] flex items-center justify-center">
                      <IconMapPin className="h-5 w-5 text-[#0A0A0A]" />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-[#0A0A0A] mb-1">Départ</div>
                      <div className="text-sm text-[#A0A0A0]">{bookingData.pickupAddress}</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-[#B8D4E3] to-[#9CC4D9] flex items-center justify-center">
                      <IconMapPin className="h-5 w-5 text-[#0A0A0A]" />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-[#0A0A0A] mb-1">Arrivée</div>
                      <div className="text-sm text-[#A0A0A0]">{bookingData.dropoffAddress}</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-[#F5F5F5] border border-[#E8E8E8] flex items-center justify-center">
                      <IconCalendar className="h-5 w-5 text-[#0A0A0A]" />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-[#0A0A0A] mb-1">Date et heure</div>
                      <div className="text-sm text-[#A0A0A0]">
                        {bookingData.pickupDate 
                          ? (bookingData.pickupDate instanceof Date 
                              ? bookingData.pickupDate.toLocaleDateString('fr-FR')
                              : new Date(bookingData.pickupDate).toLocaleDateString('fr-FR'))
                          : ''} {bookingData.pickupTime ? `à ${bookingData.pickupTime}` : ''}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-[#F5F5F5] border border-[#E8E8E8] flex items-center justify-center">
                      <IconUsers className="h-5 w-5 text-[#0A0A0A]" />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-[#0A0A0A] mb-1">Passagers et bagages</div>
                      <div className="text-sm text-[#A0A0A0]">
                        {bookingData.passengers} passager(s) • {bookingData.luggage} bagage(s)
                      </div>
                    </div>
                  </div>
                </div>

                {/* Price Breakdown */}
                <div className="border-t border-[#E8E8E8] pt-6">
                  <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                    <h3 className="font-semibold text-lg text-[#0A0A0A]">Détail du prix</h3>
                    <div className="flex gap-2 flex-wrap">
                      {/* Day/Night Rate Badge */}
                      <Badge className={`${bookingData.isNightRate ? 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20' : 'bg-amber-500/10 text-amber-600 border-amber-500/20'} border font-medium`}>
                        {bookingData.isNightRate ? '🌙 Tarif nuit' : '☀️ Tarif jour'}
                      </Badge>
                      {/* Forfait Badge */}
                      {bookingData.isForfait && (
                        <Badge className="bg-[#5CD85A]/10 text-[#4BC449] border border-[#5CD85A]/20 font-semibold">
                          🎉 {bookingData.breakdown?.forfaitName || 'Forfait'}
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  {/* Rate Info */}
                  {bookingData.rateType && (
                    <div className="text-xs text-[#A0A0A0] mb-3 flex items-center gap-1">
                      <span>📋</span>
                      <span>{bookingData.rateType}</span>
                      <span className="ml-2">•</span>
                      <span className="ml-2">{bookingData.isNightRate ? '20h-7h + Dim/JF' : '7h-20h (sauf Dim/JF)'}</span>
                    </div>
                  )}
                  
                  <div className="space-y-3 bg-[#FAFAFA] p-5 rounded-xl border border-[#E8E8E8]">
                    {bookingData.breakdown?.baseFare && (
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-[#A0A0A0]">Prise en charge</span>
                        <span className="font-medium text-[#0A0A0A]">{formatPrice(bookingData.breakdown.baseFare)}</span>
                      </div>
                    )}
                    {bookingData.breakdown?.distanceCharge && (
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-[#A0A0A0]">
                          Distance ({Math.round(bookingData.distance)} km)
                        </span>
                        <span className="font-medium text-[#0A0A0A]">{formatPrice(bookingData.breakdown.distanceCharge)}</span>
                      </div>
                    )}
                    {bookingData.breakdown?.hourlyCharge && !bookingData.isForfait && (
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-[#A0A0A0]">Heures supplémentaires</span>
                        <span className="font-medium text-[#0A0A0A]">{formatPrice(bookingData.breakdown.hourlyCharge)}</span>
                      </div>
                    )}
                    {bookingData.breakdown?.forfaitDiscount > 0 && (
                      <div className="flex justify-between items-center text-sm bg-[#5CD85A]/10 p-3 rounded-lg -mx-2">
                        <span className="text-[#4BC449] font-medium">💰 Économie forfait</span>
                        <span className="font-semibold text-[#4BC449]">-{formatPrice(bookingData.breakdown.forfaitDiscount)}</span>
                      </div>
                    )}
                    
                    {/* HT Price */}
                    {bookingData.totalPriceHT && (
                      <div className="flex justify-between items-center text-sm pt-3 border-t border-[#E8E8E8]">
                        <span className="text-[#A0A0A0]">Total HT</span>
                        <span className="font-medium text-[#0A0A0A]">{formatPrice(bookingData.totalPriceHT)}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center">
                      <span className="text-[#A0A0A0] text-sm">TVA (10%)</span>
                      <span className="font-medium text-[#0A0A0A] text-sm">{formatPrice(bookingData.totalPrice - (bookingData.totalPriceHT || 0))}</span>
                    </div>
                    
                    {/* TTC Price */}
                    <div className="flex justify-between items-center text-xl font-bold pt-3 border-t border-[#E8E8E8]">
                      <span className="text-[#0A0A0A]">Total TTC</span>
                      <span className="text-[#5CD85A] text-2xl">{formatPrice(bookingData.totalPrice)}</span>
                    </div>
                  </div>
                  
                  {/* Pricing notes */}
                  <p className="text-xs text-[#A0A0A0] mt-3">
                    * Hors frais de péage et mise à disposition. Devis valable 5 jours.
                  </p>
                </div>

                    <div className="flex gap-4 pt-6">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setStep(1);
                          saveBookingDraft({ ...bookingData, step: 1 });
                        }}
                        className="flex-1 h-12 border-2 border-[#E8E8E8] hover:border-[#5CD85A] hover:bg-[#5CD85A]/5 text-[#0A0A0A] transition-all duration-300"
                      >
                        <IconArrowLeft className="mr-2 h-4 w-4" />
                        Modifier
                      </Button>
                      <Button
                        onClick={() => {
                          setStep(3);
                          saveBookingDraft({ ...bookingData, step: 3 });
                        }}
                        className="flex-1 h-12 bg-gradient-to-r from-[#5CD85A] to-[#4BC449] hover:from-[#4BC449] hover:to-[#5CD85A] text-[#0A0A0A] font-semibold border-0 shadow-lg shadow-[#5CD85A]/30 transition-all duration-300"
                      >
                        Continuer
                        <IconArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Step 3: Customer Info & Payment */}
              {step === 3 && (
                <Card className="card-premium border-0 shadow-xl overflow-hidden">
                  <CardHeader className="pb-4 bg-gradient-to-r from-[#FAFAFA] to-white border-b border-[#E8E8E8]">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#5CD85A]/20 to-[#5CD85A]/5 flex items-center justify-center">
                        <IconCreditCard className="h-6 w-6 text-[#4BC449]" />
                      </div>
                      <div>
                        <CardTitle className="text-2xl text-[#0A0A0A]">Vos informations</CardTitle>
                        <CardDescription className="text-base text-[#A0A0A0]">
                          Dernière étape avant la réservation
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <form onSubmit={handleSubmitStep3(onStep3Submit)} className="space-y-6">
                  <div className="space-y-5">
                    <div className="space-y-2">
                      <Label htmlFor="guestName" className="text-sm font-semibold text-slate-900">Nom complet *</Label>
                      <Input
                        id="guestName"
                        placeholder="Jean Dupont"
                        className="h-12 text-base"
                        {...registerStep3('guestName')}
                      />
                      {errorsStep3.guestName && (
                        <p className="text-sm text-red-500 mt-1">{errorsStep3.guestName.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="guestEmail" className="text-sm font-semibold text-slate-900">Email *</Label>
                      <Input
                        id="guestEmail"
                        type="email"
                        placeholder="jean.dupont@email.com"
                        className="h-12 text-base"
                        {...registerStep3('guestEmail')}
                      />
                      {errorsStep3.guestEmail && (
                        <p className="text-sm text-red-500 mt-1">{errorsStep3.guestEmail.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="guestPhone" className="text-sm font-semibold text-slate-900">Téléphone *</Label>
                      <Input
                        id="guestPhone"
                        type="tel"
                        placeholder="+33 6 12 34 56 78"
                        className="h-12 text-base"
                        {...registerStep3('guestPhone')}
                      />
                      {errorsStep3.guestPhone && (
                        <p className="text-sm text-red-500 mt-1">{errorsStep3.guestPhone.message}</p>
                      )}
                    </div>

                    <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <input
                        id="acceptTerms"
                        type="checkbox"
                        className="mt-1 w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        {...registerStep3('acceptTerms')}
                      />
                      <Label htmlFor="acceptTerms" className="font-normal text-sm cursor-pointer text-slate-700 leading-relaxed">
                        J'accepte les conditions générales de vente et la politique de confidentialité
                      </Label>
                    </div>
                    {errorsStep3.acceptTerms && (
                      <p className="text-sm text-red-500 mt-1">{errorsStep3.acceptTerms.message}</p>
                    )}
                  </div>

                  {/* Price Summary */}
                  <div className="bg-gradient-to-br from-[#0A0A0A] to-[#1E1E1E] p-6 rounded-xl text-white shadow-xl border border-[#5CD85A]/20">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-[#5CD85A]/20 flex items-center justify-center">
                          <IconShieldLock className="h-5 w-5 text-[#5CD85A]" />
                        </div>
                        <span className="text-sm font-medium text-white/80">Montant à payer</span>
                      </div>
                      <span className="text-3xl font-bold text-[#5CD85A]">
                        {formatPrice(bookingData.totalPrice)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-white/60 pt-3 border-t border-white/10">
                      <IconCreditCard className="h-4 w-4" />
                      <span>Paiement sécurisé par carte bancaire</span>
                    </div>
                  </div>

                      <div className="flex gap-4 pt-6">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setStep(2);
                            saveBookingDraft({ ...bookingData, step: 2 });
                          }}
                          className="flex-1 h-12 border-2 border-[#E8E8E8] hover:border-[#5CD85A] hover:bg-[#5CD85A]/5 text-[#0A0A0A] transition-all duration-300"
                        >
                          <IconArrowLeft className="mr-2 h-4 w-4" />
                          Retour
                        </Button>
                        <Button 
                          type="submit" 
                          className="flex-1 h-14 text-base font-semibold bg-gradient-to-r from-[#5CD85A] to-[#4BC449] hover:from-[#4BC449] hover:to-[#5CD85A] text-[#0A0A0A] border-0 shadow-lg shadow-[#5CD85A]/30 hover:shadow-xl hover:shadow-[#5CD85A]/40 transition-all duration-300" 
                          size="lg"
                        >
                          Payer et réserver
                          <IconArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Right Column - Summary Sidebar (40%) */}
            <div className="lg:col-span-2 space-y-6">
              {/* Trip Summary Card */}
              <Card className="border-2 shadow-xl sticky top-6 transition-all duration-300 hover:shadow-2xl">
                <CardHeader className="pb-4 bg-gradient-to-br from-blue-50 to-slate-50 rounded-t-lg">
                  <CardTitle className="text-xl flex items-center gap-2">
                    <IconMapPin className="h-5 w-5 text-blue-600" />
                    Récapitulatif
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                  {/* Service Type Preview */}
                  {step1Data.serviceType && (
                    <div className="space-y-3">
                      <div className="text-sm font-medium text-slate-600">Type de service</div>
                      <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200 transition-all duration-300 hover:bg-slate-100 hover:shadow-md">
                        {(() => {
                          const service = SERVICES.find(s => s.id === step1Data.serviceType);
                          const IconComponent = 
                            step1Data.serviceType === 'transfer' ? IconCar :
                            step1Data.serviceType === 'airport' ? IconPlane :
                            step1Data.serviceType === 'hourly' ? IconClockHour4 :
                            IconBuilding;
                          return (
                            <>
                              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center transition-transform duration-300 hover:scale-110">
                                <IconComponent className="h-5 w-5" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="font-semibold text-sm text-slate-900 truncate">
                                  {service?.name}
                                </div>
                                <div className="text-xs text-slate-600">{service?.priceInfo}</div>
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  )}

                  {/* Addresses Preview */}
                  {(step1Data.pickupAddress || step1Data.dropoffAddress) && (
                    <div className="space-y-3">
                      <div className="text-sm font-medium text-slate-600">Itinéraire</div>
                      <div className="space-y-3">
                        {step1Data.pickupAddress && (
                          <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border border-blue-100 transition-all duration-300 hover:bg-blue-100 hover:shadow-md">
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center mt-0.5 transition-transform duration-300 hover:scale-110">
                              <IconMapPin className="h-4 w-4 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-medium text-blue-900 mb-1">Départ</div>
                              <div className="text-sm text-slate-700 line-clamp-2">{step1Data.pickupAddress}</div>
                            </div>
                          </div>
                        )}
                        {step1Data.dropoffAddress && (
                          <div className="flex items-start gap-3 p-3 bg-red-50 rounded-lg border border-red-100 transition-all duration-300 hover:bg-red-100 hover:shadow-md">
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-red-500 flex items-center justify-center mt-0.5 transition-transform duration-300 hover:scale-110">
                              <IconMapPin className="h-4 w-4 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-medium text-red-900 mb-1">Arrivée</div>
                              <div className="text-sm text-slate-700 line-clamp-2">{step1Data.dropoffAddress}</div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Date & Time Preview */}
                  {(step1Data.pickupDate || step1Data.pickupTime) && (
                    <div className="space-y-3">
                      <div className="text-sm font-medium text-slate-600">Date et heure</div>
                      <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200 transition-all duration-300 hover:bg-slate-100 hover:shadow-md">
                        <IconCalendar className="h-5 w-5 text-slate-600 flex-shrink-0 transition-transform duration-300 hover:scale-110" />
                        <div className="flex-1">
                          {step1Data.pickupDate && (
                            <div className="text-sm font-medium text-slate-900">
                              {new Date(step1Data.pickupDate).toLocaleDateString('fr-FR', {
                                weekday: 'long',
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric'
                              })}
                            </div>
                          )}
                          {step1Data.pickupTime && (
                            <div className="text-xs text-slate-600 mt-1">
                              À {step1Data.pickupTime}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Passengers & Luggage Preview */}
                  {(step1Data.passengers || step1Data.luggage) && (
                    <div className="space-y-3">
                      <div className="text-sm font-medium text-slate-600">Détails</div>
                      <div className="grid grid-cols-2 gap-3">
                        {step1Data.passengers && (
                          <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200 transition-all duration-300 hover:bg-slate-100 hover:shadow-md">
                            <IconUsers className="h-4 w-4 text-slate-600 transition-transform duration-300 hover:scale-110" />
                            <div>
                              <div className="text-xs text-slate-600">Passagers</div>
                              <div className="text-sm font-semibold text-slate-900">{step1Data.passengers}</div>
                            </div>
                          </div>
                        )}
                        {step1Data.luggage && (
                          <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200 transition-all duration-300 hover:bg-slate-100 hover:shadow-md">
                            <IconLuggage className="h-4 w-4 text-slate-600 transition-transform duration-300 hover:scale-110" />
                            <div>
                              <div className="text-xs text-slate-600">Bagages</div>
                              <div className="text-sm font-semibold text-slate-900">{step1Data.luggage}</div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Price Preview (Step 2+) */}
                  {step >= 2 && bookingData.totalPrice && (
                    <div className="space-y-3 pt-4 border-t border-slate-200">
                      <div className="text-sm font-medium text-slate-600">Prix estimé</div>
                      <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-4 rounded-lg text-white">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Total</span>
                          <span className="text-2xl font-bold">{formatPrice(bookingData.totalPrice)}</span>
                        </div>
                        {bookingData.distance && (
                          <div className="text-xs text-blue-100 mt-2">
                            {Math.round(bookingData.distance)} km • ~{Math.round(bookingData.duration / 60)} min
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Help Section */}
                  <div className="pt-4 border-t border-slate-200">
                    <div className="p-4 bg-gradient-to-br from-slate-50 to-blue-50 rounded-lg border border-slate-200">
                      <div className="flex items-start gap-3">
                        <IconBriefcase className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <div className="text-sm font-semibold text-slate-900 mb-1">Besoin d'aide ?</div>
                          <div className="text-xs text-slate-600 mb-2">
                            Notre équipe est disponible pour vous accompagner dans votre réservation.
                          </div>
                          <a 
                            href={`tel:${CONTACT.phone}`}
                            className="text-xs text-blue-600 hover:text-blue-700 font-medium inline-flex items-center gap-1"
                          >
                            Appeler maintenant
                            <IconArrowRight className="h-3 w-3" />
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Additional Info Card */}
              <Card className="border shadow-lg">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Pourquoi choisir MobiService ?</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-mobiservice-green/10 flex items-center justify-center">
                      <IconCheck className="h-4 w-4 text-mobiservice-green" />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-slate-900">Réservation en 30 secondes</div>
                      <div className="text-xs text-slate-600">Processus simple et rapide</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-mobiservice-green/10 flex items-center justify-center">
                      <IconCheck className="h-4 w-4 text-mobiservice-green" />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-slate-900">Paiement sécurisé</div>
                      <div className="text-xs text-slate-600">Transactions sécurisées et protégées</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-mobiservice-green/10 flex items-center justify-center">
                      <IconCheck className="h-4 w-4 text-mobiservice-green" />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-slate-900">Chauffeur professionnel</div>
                      <div className="text-xs text-slate-600">15+ ans d'expérience</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Booking History Card */}
              {bookingHistory && bookingHistory.length > 0 && (
                <Card className="border shadow-lg">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Vos réservations récentes</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {bookingHistory.slice(0, 3).map((booking, index) => (
                      <div
                        key={booking.id || index}
                        className="p-3 bg-slate-50 rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors cursor-pointer"
                        onClick={() => {
                          // Restore booking data
                          if (booking.pickupDate) {
                            const date = typeof booking.pickupDate === 'string' 
                              ? new Date(booking.pickupDate) 
                              : booking.pickupDate;
                            setSelectedDate(date);
                            setValueStep1('pickupDate', date);
                          }
                          if (booking.pickupAddress) {
                            setValueStep1('pickupAddress', booking.pickupAddress);
                            if (booking.pickupLat && booking.pickupLng) {
                              setValueStep1('pickupLat', booking.pickupLat);
                              setValueStep1('pickupLng', booking.pickupLng);
                            }
                          }
                          if (booking.dropoffAddress) {
                            setValueStep1('dropoffAddress', booking.dropoffAddress);
                            if (booking.dropoffLat && booking.dropoffLng) {
                              setValueStep1('dropoffLat', booking.dropoffLat);
                              setValueStep1('dropoffLng', booking.dropoffLng);
                            }
                          }
                          if (booking.serviceType) {
                            setValueStep1('serviceType', booking.serviceType);
                          }
                          if (booking.passengers) {
                            setValueStep1('passengers', booking.passengers);
                          }
                          if (booking.luggage) {
                            setValueStep1('luggage', booking.luggage);
                          }
                          if (booking.pickupTime) {
                            setValueStep1('pickupTime', booking.pickupTime);
                          }
                          setStep(1);
                        }}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-slate-900 truncate">
                              {booking.pickupAddress || 'Adresse de départ'}
                            </div>
                            <div className="text-xs text-slate-600 truncate mt-1">
                              {booking.dropoffAddress || 'Adresse d\'arrivée'}
                            </div>
                            {booking.pickupDate && (
                              <div className="text-xs text-slate-500 mt-1">
                                {new Date(booking.pickupDate).toLocaleDateString('fr-FR', {
                                  day: 'numeric',
                                  month: 'short',
                                })}
                              </div>
                            )}
                          </div>
                          {booking.totalPrice && (
                            <div className="text-sm font-semibold text-blue-600 flex-shrink-0">
                              {formatPrice(booking.totalPrice)}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    {bookingHistory.length > 3 && (
                      <div className="text-xs text-slate-500 text-center pt-2">
                        +{bookingHistory.length - 3} autre(s) réservation(s)
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}



