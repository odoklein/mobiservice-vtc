'use client';

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Ref } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  IconAlertTriangle,
  IconArrowLeft,
  IconArrowRight,
  IconArrowsUpDown,
  IconCalendar,
  IconCash,
  IconCheck,
  IconClock,
  IconClockHour4,
  IconCar,
  IconInfoCircle,
  IconLoader2,
  IconLuggage,
  IconMapPin,
  IconPhone,
  IconRoute,
  IconSparkles,
  IconUsers,
} from '@tabler/icons-react';
import { FORFAITS } from '@/lib/pricing';
import { CONTACT } from '@/lib/constants';
import { getImmobilisationMAD, isAR13DaysAllowed, type ReturnDaysAfter } from '@/lib/booking/immobilisation-mad';
import { bookingStepThreeSchema } from '@/lib/validations/booking';
import { useBookingStorage } from '@/hooks/use-local-storage';
import { AddressField } from '@/components/reservation/address-field';
import { Card, CardTitle, CheckRow, Choice, Stepper, TextField } from '@/components/reservation/controls';
import { HeroBg } from '@/components/reservation/hero-bg';
import { OtpStep } from '@/components/reservation/otp-step';
import { Calendar, TimeGrid, isBeforeMin } from '@/components/reservation/pickers';
import { QuoteCard } from '@/components/reservation/quote-card';
import { useQuote, type Place, type ServiceType, type TripType } from '@/components/reservation/use-quote';
import {
  addDays,
  formatEuro,
  formatHours,
  formatLongDate,
  formatMediumDate,
  formatTime,
  parseTime,
  startOfDay,
  toNoonISO,
} from '@/components/reservation/utils';

type Step = 1 | 2 | 3 | 4;
type ReturnOffset = 1 | 2 | 3;

const STEP_LABELS = ['Trajet', 'Quand', 'Voyageurs', 'Confirmation'];
const MAX_PASSENGERS = 4;
const DRAFT_KEY = 'mobiservice_reservation_draft_v2';
const BACKGROUND = 'linear-gradient(135deg, #0a1628 0%, #0d2847 30%, #0f3060 50%, #0d2847 70%, #0a1628 100%)';

interface Draft {
  step: Step;
  serviceType: ServiceType;
  tripType: TripType;
  pickup: Place | null;
  pickupText: string;
  dropoff: Place | null;
  dropoffText: string;
  hours: number;
  date: string | null;
  time: string;
  returnOffset: ReturnOffset | null;
  returnTime: string;
  waitingMinutes: number;
  adults: number;
  children: number;
  childAge: number;
  babies: number;
  luggage: number;
  maxArrival: string;
}

const isPlace = (p: unknown): p is Place =>
  !!p && typeof (p as Place).label === 'string' && typeof (p as Place).lat === 'number' && typeof (p as Place).lng === 'number';

const num = (v: unknown, fallback: number, min: number, max: number) =>
  typeof v === 'number' && Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : fallback;

/* ---------------------------------- page ---------------------------------- */

function ReservationFlow() {
  const searchParams = useSearchParams();
  const { addToHistory, clearBookingDraft } = useBookingStorage();

  const [step, setStep] = useState<Step>(1);
  const [attempted, setAttempted] = useState(false);

  const [serviceType, setServiceType] = useState<ServiceType>(() => (searchParams.get('type') === 'hourly' ? 'hourly' : 'transfer'));
  const [tripType, setTripType] = useState<TripType>('one-way');
  const [pickupText, setPickupText] = useState('');
  const [pickup, setPickup] = useState<Place | null>(null);
  const [dropoffText, setDropoffText] = useState('');
  const [dropoff, setDropoff] = useState<Place | null>(null);
  const [hours, setHours] = useState(2);

  const [now, setNow] = useState(() => new Date());
  const [viewMonth, setViewMonth] = useState(() => new Date(now.getFullYear(), now.getMonth(), 1));
  const [date, setDate] = useState<Date | null>(null);
  const [time, setTime] = useState('');
  const [returnOffset, setReturnOffset] = useState<ReturnOffset | null>(null);
  const [returnTime, setReturnTime] = useState('');
  const [waitingMinutes, setWaitingMinutes] = useState(0);
  const [earliestPickup, setEarliestPickup] = useState<Date | null>(null);

  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [childAge, setChildAge] = useState(5);
  const [babies, setBabies] = useState(0);
  const [luggage, setLuggage] = useState(1);
  const [maxArrival, setMaxArrival] = useState('');
  const [babySeat, setBabySeat] = useState(false);
  const [wheelchair, setWheelchair] = useState(false);
  const [largeLuggage, setLargeLuggage] = useState(false);

  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [note, setNote] = useState('');
  const [cgv, setCgv] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [showOtp, setShowOtp] = useState(false);
  const [otpCode, setOtpCode] = useState<string[]>(['', '', '', '', '', '']);
  const [otpError, setOtpError] = useState('');
  const [otpInfo, setOtpInfo] = useState('');
  const [resendIn, setResendIn] = useState(0);
  const [createdBookingId, setCreatedBookingId] = useState<number | null>(null);
  const [hydrated, setHydrated] = useState(false);

  const submittingRef = useRef(false);
  const lastFingerprint = useRef('');
  const headingRef = useRef<HTMLHeadingElement>(null);
  const firstRender = useRef(true);

  const isHourly = serviceType === 'hourly';
  const effectiveTrip: TripType = isHourly ? 'one-way' : tripType;
  const isRoundTrip = !isHourly && tripType === 'round-trip';
  const totalPassengers = adults + children + babies;
  const returnDate = date && returnOffset ? addDays(date, returnOffset) : null;

  /* ------------------------------ horloge + brouillon ------------------------ */

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  // Restauration du brouillon (côté client uniquement) puis paramètre ?type=
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(DRAFT_KEY);
      const d: Partial<Draft> | null = raw ? JSON.parse(raw) : null;
      if (d && typeof d === 'object') {
        const svc: ServiceType = d.serviceType === 'hourly' ? 'hourly' : 'transfer';
        const restoredPickup = isPlace(d.pickup) ? d.pickup : null;
        const restoredDropoff = isPlace(d.dropoff) ? d.dropoff : null;
        const today = startOfDay(new Date());
        let restoredDate: Date | null = null;
        if (typeof d.date === 'string') {
          const parsed = new Date(d.date);
          if (!isNaN(parsed.getTime()) && startOfDay(parsed) >= today) restoredDate = startOfDay(parsed);
        }
        setServiceType(svc);
        setTripType(d.tripType === 'round-trip' ? 'round-trip' : 'one-way');
        setPickup(restoredPickup);
        setPickupText(restoredPickup ? restoredPickup.label : typeof d.pickupText === 'string' ? d.pickupText : '');
        setDropoff(restoredDropoff);
        setDropoffText(restoredDropoff ? restoredDropoff.label : typeof d.dropoffText === 'string' ? d.dropoffText : '');
        const savedHours = num(d.hours, 2, 0.5, 8);
        setHours(FORFAITS.some((f) => f.hours === savedHours) ? savedHours : 2);
        if (restoredDate) {
          setDate(restoredDate);
          setViewMonth(new Date(restoredDate.getFullYear(), restoredDate.getMonth(), 1));
          if (typeof d.time === 'string' && parseTime(d.time)) setTime(d.time);
          if (d.returnOffset === 1 || d.returnOffset === 2 || d.returnOffset === 3) setReturnOffset(d.returnOffset);
          if (typeof d.returnTime === 'string' && parseTime(d.returnTime)) setReturnTime(d.returnTime);
        }
        setWaitingMinutes(Math.round(num(d.waitingMinutes, 0, 0, 480) / 15) * 15);
        const a = num(d.adults, 1, 1, MAX_PASSENGERS);
        const c = num(d.children, 0, 0, MAX_PASSENGERS - a);
        const b = num(d.babies, 0, 0, MAX_PASSENGERS - a - c);
        setAdults(a);
        setChildren(c);
        setBabies(b);
        setChildAge(Math.round(num(d.childAge, 5, 1, 10)));
        setLuggage(Math.round(num(d.luggage, 1, 0, 5)));
        if (typeof d.maxArrival === 'string' && parseTime(d.maxArrival)) setMaxArrival(d.maxArrival);

        const savedStep = Number(d.step);
        const reachable: Step = !(restoredPickup && restoredDropoff) ? 1 : !restoredDate ? 2 : 3;
        if (savedStep >= 1) setStep(Math.min(Math.min(savedStep, 3), reachable) as Step);
      }
    } catch {
      /* brouillon illisible : on repart de zéro */
    }

    const type = searchParams.get('type');
    if (type === 'hourly' || type === 'transfer') setServiceType(type);
    setHydrated(true);
    // une seule fois au montage
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sauvegarde du brouillon (coordonnées personnelles exclues)
  useEffect(() => {
    if (!hydrated || showOtp) return;
    const timer = setTimeout(() => {
      try {
        const draft: Draft = {
          step: Math.min(step, 3) as Step,
          serviceType,
          tripType,
          pickup,
          pickupText,
          dropoff,
          dropoffText,
          hours,
          date: date ? toNoonISO(date) : null,
          time,
          returnOffset,
          returnTime,
          waitingMinutes,
          adults,
          children,
          childAge,
          babies,
          luggage,
          maxArrival,
        };
        window.localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
      } catch {
        /* stockage indisponible */
      }
    }, 600);
    return () => clearTimeout(timer);
  }, [
    hydrated, showOtp, step, serviceType, tripType, pickup, pickupText, dropoff, dropoffText, hours, date, time,
    returnOffset, returnTime, waitingMinutes, adults, children, childAge, babies, luggage, maxArrival,
  ]);

  /* --------------------------- délai minimum de réservation ------------------- */

  useEffect(() => {
    if (!pickup) {
      setEarliestPickup(null);
      return;
    }
    const controller = new AbortController();
    (async () => {
      try {
        const res = await fetch('/api/booking/lead-time', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pickupLat: pickup.lat, pickupLng: pickup.lng }),
          signal: controller.signal,
        });
        const data = await res.json();
        setEarliestPickup(data.success && data.earliestPickup ? new Date(data.earliestPickup) : null);
      } catch {
        if (!controller.signal.aborted) setEarliestPickup(null);
      }
    })();
    return () => controller.abort();
  }, [pickup]);

  const minPickup = earliestPickup && earliestPickup > now ? earliestPickup : now;
  const minPickupDay = startOfDay(minPickup);

  // La date choisie devient invalide si le délai minimum la dépasse
  useEffect(() => {
    if (date && date < startOfDay(minPickup)) {
      setDate(null);
      setTime('');
      setReturnOffset(null);
      setReturnTime('');
    }
  }, [date, minPickup]);

  /* ---------------------------------- tarif ---------------------------------- */

  const { quote, loading: quoteLoading, error: quoteError, ready: quoteReady, retry } = useQuote({
    serviceType,
    tripType: effectiveTrip,
    pickup,
    dropoff,
    date,
    time,
    returnDate: isRoundTrip ? returnDate : null,
    returnTime: isRoundTrip ? returnTime : '',
    hours,
    waitingMinutes: isHourly ? 0 : waitingMinutes,
  });

  const immobilisation = useMemo(() => {
    const totalAR = quote?.totalAR;
    if (!isRoundTrip || !returnOffset || typeof totalAR !== 'number') return null;
    return getImmobilisationMAD(totalAR, returnOffset as ReturnDaysAfter);
  }, [quote, isRoundTrip, returnOffset]);

  // A/R avec retour 1–3 jours interdit sous 25 km au total (forfait agglomération conseillé)
  const arTooShort = isRoundTrip && quote?.kind === 'transfer' && typeof quote.totalAR === 'number' && !isAR13DaysAllowed(quote.totalAR);

  const timeTooEarly = isBeforeMin(date, time, minPickup);
  const sameCoords = !!pickup && !!dropoff && !isHourly && pickup.lat === dropoff.lat && pickup.lng === dropoff.lng;

  const priceLabel = quote ? formatEuro(quote.totalTTC) : '—';

  /* ------------------------------ notes + payload ----------------------------- */

  const notes = useMemo(() => {
    const parts: string[] = [];
    if (note.trim()) parts.push(`Note du client : ${note.trim()}`);
    const needs = [babySeat && 'siège bébé / rehausseur', wheelchair && 'accessibilité PMR', largeLuggage && 'bagage volumineux'].filter(Boolean);
    if (needs.length) parts.push(`Besoins : ${needs.join(', ')}`);
    if (children > 0) parts.push(`Âge de l'enfant : ${childAge} an${childAge > 1 ? 's' : ''}`);
    if (maxArrival) parts.push(`Heure d'arrivée maximale : ${maxArrival}`);
    if (!isHourly && waitingMinutes > 0) parts.push(`Temps d'attente demandé : ${waitingMinutes} min`);
    if (immobilisation && immobilisation.priceTTC > 0) parts.push(`Immobilisation retour J+${returnOffset} : ${immobilisation.label}`);
    return parts.length ? parts.join('\n') : undefined;
  }, [note, babySeat, wheelchair, largeLuggage, children, childAge, maxArrival, isHourly, waitingMinutes, immobilisation, returnOffset]);

  const bookingBase = useMemo(() => {
    if (!quote || !pickup || !dropoff || !date) return null;
    return {
      pickupAddress: pickup.label,
      pickupLat: pickup.lat,
      pickupLng: pickup.lng,
      dropoffAddress: dropoff.label,
      dropoffLat: dropoff.lat,
      dropoffLng: dropoff.lng,
      // Midi local : le même jour calendaire quel que soit le fuseau du serveur
      pickupDate: toNoonISO(date),
      pickupTime: time,
      ...(isRoundTrip && returnDate ? { returnDate: toNoonISO(returnDate), returnTime } : {}),
      ...(maxArrival ? { maxArrivalTime: maxArrival } : {}),
      passengers: totalPassengers,
      adults,
      children,
      ...(children > 0 ? { childAge } : {}),
      babies,
      luggage,
      serviceType,
      tripType: effectiveTrip,
      ...(isHourly ? { hours } : { waitingMinutes, tollCost: quote.toll?.cost ?? 0 }),
      distanceCA: quote.distanceCA,
      distanceTP: quote.distanceTP,
      distanceReturn: quote.distanceReturn,
      distance: quote.distanceTP,
      duration: quote.duration,
      totalPrice: quote.totalTTC,
      totalPriceHT: quote.totalHT,
      totalPriceTTC: quote.totalTTC,
      tvaAmount: quote.tva,
      basePrice: isHourly ? quote.totalTTC : quote.totalHT,
      isNightRate: quote.isNightRate,
      rateType: quote.rateType,
      breakdown: quote.breakdown,
      priceBreakdown: quote.breakdown,
      debugInfo: quote.debugInfo,
      ...(isHourly ? { isForfait: true, forfaitName: quote.forfait?.name } : {}),
      ...(notes ? { notes } : {}),
    };
  }, [
    quote, pickup, dropoff, date, time, isRoundTrip, returnDate, returnTime, maxArrival, totalPassengers, adults, children,
    childAge, babies, luggage, serviceType, effectiveTrip, isHourly, hours, waitingMinutes, notes,
  ]);

  /* ------------------------------- validations ------------------------------- */

  const blocker = (s: Step): string | null => {
    if (s === 1) {
      if (!pickup) return pickupText.trim() ? 'Sélectionnez l’adresse de départ dans la liste de suggestions.' : 'Indiquez votre adresse de départ.';
      if (!dropoff) return dropoffText.trim() ? 'Sélectionnez l’adresse d’arrivée dans la liste de suggestions.' : 'Indiquez votre adresse d’arrivée.';
      if (sameCoords) return 'Le départ et la destination doivent être différents.';
      return null;
    }
    if (s === 2) {
      if (!date) return 'Choisissez votre date de départ.';
      if (!time || !parseTime(time)) return 'Choisissez votre heure de départ.';
      if (timeTooEarly) return 'Choisissez une heure de départ plus tardive.';
      if (isRoundTrip) {
        if (!returnOffset) return 'Choisissez la date de retour (1 à 3 jours après l’aller).';
        if (!returnTime || !parseTime(returnTime)) return 'Choisissez l’heure de retour.';
      }
      if (quoteLoading) return 'Calcul du tarif en cours…';
      if (quoteError) return 'L’estimation est indisponible : utilisez « Réessayer » ou appelez-nous.';
      if (arTooShort) return 'Un aller-retour de moins de 25 km n’est pas possible sur 1 à 3 jours : passez en aller simple.';
      if (!quote) return 'Calcul du tarif en cours…';
      return null;
    }
    if (s === 3) {
      if (adults < 1) return 'Au moins un adulte est requis.';
      if (totalPassengers > MAX_PASSENGERS) return `Maximum ${MAX_PASSENGERS} passagers.`;
      return null;
    }
    return null;
  };

  const contactErrors = useMemo(() => {
    const result = bookingStepThreeSchema.safeParse({
      guestName: guestName.trim(),
      guestEmail: guestEmail.trim(),
      guestPhone: guestPhone.trim(),
      cgvAccepted: cgv,
      paymentMethod: 'cash',
    });
    const errors: Partial<Record<'guestName' | 'guestEmail' | 'guestPhone' | 'cgvAccepted', string>> = {};
    if (!result.success) {
      for (const issue of result.error.issues) {
        const key = issue.path[0] as keyof typeof errors;
        if (key && !errors[key]) errors[key] = issue.message;
      }
    }
    if (!errors.guestPhone && guestPhone.replace(/\D/g, '').length < 9) errors.guestPhone = 'Numéro de téléphone valide requis';
    return errors;
  }, [guestName, guestEmail, guestPhone, cgv]);
  const contactValid = Object.keys(contactErrors).length === 0;
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const touch = (k: string) => setTouched((t) => (t[k] ? t : { ...t, [k]: true }));
  const showErr = (k: keyof typeof contactErrors) => (attempted || touched[k] ? contactErrors[k] ?? null : null);

  /* -------------------------------- navigation ------------------------------- */

  const goTo = useCallback((s: Step) => {
    setStep(s);
    setAttempted(false);
  }, []);

  // Focus + défilement vers le titre de l'étape à chaque changement d'étape
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    const el = headingRef.current;
    if (!el) return;
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    el.focus({ preventScroll: true });
    el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  }, [step, showOtp]);

  const goNext = () => {
    if (step < 4) {
      const b = blocker(step);
      if (b) {
        setAttempted(true);
        return;
      }
      goTo((step + 1) as Step);
    }
  };

  /* ------------------------------ réservation + OTP -------------------------- */

  useEffect(() => {
    if (resendIn <= 0) return;
    const id = setTimeout(() => setResendIn((n) => n - 1), 1000);
    return () => clearTimeout(id);
  }, [resendIn]);

  const sendOtp = async (bookingId: number): Promise<boolean> => {
    try {
      const res = await fetch('/api/bookings/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId }),
      });
      const data = await res.json();
      return !!data.success;
    } catch {
      return false;
    }
  };

  const submit = async () => {
    setAttempted(true);
    if (!bookingBase || !contactValid) {
      setTimeout(() => document.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus(), 0);
      return;
    }
    if (submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);
    setSubmitError('');
    try {
      // Le détail de debug et le doublon du breakdown ne servent qu'à l'affichage : on ne les envoie pas
      const { debugInfo: _debugInfo, priceBreakdown: _priceBreakdown, ...bookingFields } = bookingBase;
      const payload = {
        ...bookingFields,
        guestName: guestName.trim(),
        guestEmail: guestEmail.trim(),
        guestPhone: guestPhone.trim(),
        cgvAccepted: true,
        paymentMethod: 'cash',
      };
      const fingerprint = JSON.stringify(payload);

      let bookingId = createdBookingId;
      let created = false;
      // Même demande déjà enregistrée (retour arrière depuis l'écran du code) : pas de doublon
      if (!bookingId || fingerprint !== lastFingerprint.current) {
        const res = await fetch('/api/bookings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...payload, submittedAt: new Date().toISOString() }),
        });
        const data = await res.json().catch(() => ({}));
        if (!data.success || !data.bookingId) throw new Error('create-failed');
        bookingId = data.bookingId as number;
        created = true;
        setCreatedBookingId(bookingId);
        lastFingerprint.current = fingerprint;
      }

      setOtpCode(['', '', '', '', '', '']);
      setOtpError('');
      setShowOtp(true);
      if (created) {
        const sent = await sendOtp(bookingId as number);
        if (sent) {
          setOtpInfo('Code envoyé.');
          setResendIn(30);
        } else {
          setOtpError('Le code n’a pas pu être envoyé. Utilisez « Renvoyer le code ».');
        }
      }
    } catch {
      setSubmitError(`Impossible d’enregistrer votre demande pour le moment. Réessayez dans un instant ou appelez-nous au ${CONTACT.phone}.`);
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  const verifyOtp = async () => {
    if (!createdBookingId) return;
    const code = otpCode.join('');
    if (code.length !== 6) {
      setOtpError('Saisissez le code à 6 chiffres.');
      return;
    }
    setSubmitting(true);
    setOtpError('');
    try {
      const res = await fetch('/api/bookings/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId: createdBookingId, otpCode: code }),
      });
      const data = await res.json();
      if (data.success && data.redirectUrl) {
        addToHistory({ ...bookingBase, id: createdBookingId.toString(), status: 'confirmed' });
        clearBookingDraft();
        try {
          window.localStorage.removeItem(DRAFT_KEY);
        } catch {
          /* ignore */
        }
        window.location.href = data.redirectUrl;
        return; // on garde l'état « chargement » pendant la redirection
      }
      setOtpError(data.error || 'Code invalide ou expiré.');
    } catch {
      setOtpError('Erreur de vérification. Réessayez.');
    }
    setSubmitting(false);
  };

  const resendOtp = async () => {
    if (!createdBookingId || resendIn > 0) return;
    setOtpCode(['', '', '', '', '', '']);
    setOtpError('');
    setOtpInfo('');
    const sent = await sendOtp(createdBookingId);
    if (sent) {
      setOtpInfo('Un nouveau code vient de vous être envoyé.');
      setResendIn(30);
    } else {
      setOtpError('Le code n’a pas pu être envoyé. Réessayez dans un instant.');
    }
  };

  /* ---------------------------------- actions -------------------------------- */

  const swapAddresses = () => {
    setPickup(dropoff);
    setPickupText(dropoffText);
    setDropoff(pickup);
    setDropoffText(pickupText);
  };

  const updateDate = (d: Date) => {
    setDate(d);
    // le retour est toujours relatif à l'aller (J+1 à J+3) : il suit la nouvelle date
  };

  /* ----------------------------------- vue ----------------------------------- */

  const stepBlocker = step < 4 ? blocker(step) : null;
  const passengersText = [
    `${adults} adulte${adults > 1 ? 's' : ''}`,
    children > 0 && `${children} enfant${children > 1 ? 's' : ''}`,
    babies > 0 && `${babies} bébé${babies > 1 ? 's' : ''}`,
  ]
    .filter(Boolean)
    .join(', ');

  const dateTimeText = date && time ? `${formatLongDate(date)} à ${time}` : '—';
  const returnText = returnDate && returnTime ? `${formatLongDate(returnDate)} à ${returnTime}` : '—';

  const recap: { label: string; value: string; step: Step }[] = [
    { label: 'Service', value: isHourly ? `Mise à disposition ${formatHours(hours)}` : isRoundTrip ? 'Transfert aller-retour' : 'Transfert aller simple', step: 1 },
    { label: 'Départ', value: pickup?.label ?? '—', step: 1 },
    { label: 'Arrivée', value: dropoff?.label ?? '—', step: 1 },
    { label: 'Aller', value: dateTimeText, step: 2 },
    ...(isRoundTrip ? [{ label: 'Retour', value: returnText, step: 2 as Step }] : []),
    ...(!isHourly && waitingMinutes > 0 ? [{ label: 'Attente (MAD)', value: `${waitingMinutes} min`, step: 2 as Step }] : []),
    { label: 'Passagers', value: passengersText, step: 3 },
    { label: 'Bagages', value: `${luggage} bagage${luggage > 1 ? 's' : ''}`, step: 3 },
  ];

  return (
    <main className="min-h-screen relative overflow-x-clip" style={{ background: BACKGROUND }}>
      {/* L'en-tête du site est collant : on laisse de la marge pour les éléments focalisés */}
      <style>{`html { scroll-padding-top: 6rem; }`}</style>
      <HeroBg />

      <div className="relative z-10 flex flex-col min-h-screen">
        {/* En-tête + étapes */}
        <div className="max-w-3xl mx-auto w-full px-4 sm:px-6 pt-8 pb-4">
          <div className="text-center mb-6">
            <p className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/15 text-xs text-white/80">
              <IconSparkles size={14} aria-hidden className="text-[#4BC449]" /> Devis instantané gratuit
            </p>
            <h1 className="mt-3 text-2xl sm:text-3xl font-bold text-white">
              Réservez votre <span className="text-[#4BC449]">VTC</span> en Haute-Savoie
            </h1>
          </div>
          <nav aria-label="Progression de la réservation">
            <ol className="flex items-center justify-between">
              {STEP_LABELS.map((label, i) => {
                const num = i + 1;
                const active = step === num;
                const done = step > num;
                const clickable = done && !submitting;
                const circle = `w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-colors duration-300 ${
                  done ? 'bg-[#4BC449] text-[#0a1628]' : active ? 'bg-white text-[#0d2847]' : 'bg-white/10 text-white/50'
                }`;
                const inner = (
                  <>
                    <span className={circle} aria-hidden>
                      {done ? <IconCheck size={15} /> : num}
                    </span>
                    <span className={`text-[11px] font-medium ${done ? 'text-[#4BC449]' : active ? 'text-white' : 'text-white/60'}`}>
                      {label}
                    </span>
                  </>
                );
                return (
                  <li key={label} className="flex items-center flex-1 last:flex-none" aria-current={active ? 'step' : undefined}>
                    {clickable ? (
                      <button
                        type="button"
                        onClick={() => {
                          setShowOtp(false);
                          goTo(num as Step);
                        }}
                        aria-label={`Revenir à l’étape ${num} : ${label}`}
                        className="flex flex-col items-center gap-1.5 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
                      >
                        {inner}
                      </button>
                    ) : (
                      <div className="flex flex-col items-center gap-1.5">
                        {inner}
                        <span className="sr-only">{active ? '(étape en cours)' : '(à venir)'}</span>
                      </div>
                    )}
                    {i < STEP_LABELS.length - 1 && (
                      <div aria-hidden className={`flex-1 h-[2px] mx-2 sm:mx-3 mb-5 transition-colors duration-300 ${done ? 'bg-[#4BC449]' : 'bg-white/15'}`} />
                    )}
                  </li>
                );
              })}
            </ol>
          </nav>
        </div>

        {/* Contenu */}
        <div className="flex-1 pb-6">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="flex gap-8 items-start">
              <div className="flex-1 min-w-0">
                {/* ------------------------------ ÉTAPE 1 ------------------------------ */}
                {step === 1 && (
                  <div className="space-y-5">
                    <StepHeading headingRef={headingRef} title="Où allez-vous ?" sub="Choisissez votre service, puis votre itinéraire." />

                    <Card>
                      <CardTitle>Type de service</CardTitle>
                      <div role="radiogroup" aria-label="Type de service" className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <Choice selected={!isHourly} onClick={() => setServiceType('transfer')} className="p-4 rounded-xl">
                          <span className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                            <IconCar size={18} aria-hidden className="text-[#27802a]" /> Transfert
                          </span>
                          <span className="text-xs text-gray-600 block mt-1">Aller simple (A/S) ou aller-retour (A/R) de votre point de départ à votre destination.</span>
                          <span className="text-xs font-semibold text-[#27802a] block mt-2">À partir de 33 €</span>
                        </Choice>
                        <Choice selected={isHourly} onClick={() => setServiceType('hourly')} className="p-4 rounded-xl">
                          <span className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                            <IconClockHour4 size={18} aria-hidden className="text-blue-600" /> Transfert forfaitaire
                          </span>
                          <span className="text-xs text-gray-600 block mt-1">Mise à disposition d’un chauffeur de 1 h à 8 h (paliers de 30 min).</span>
                          <span className="text-xs font-semibold text-blue-700 block mt-2">Forfaits sur mesure</span>
                        </Choice>
                      </div>

                      {!isHourly ? (
                        <div className="mt-5 pt-5 border-t border-gray-100">
                          <p id="trip-type-label" className="text-sm font-medium text-gray-700 mb-2">Type de trajet</p>
                          <div role="radiogroup" aria-labelledby="trip-type-label" className="grid grid-cols-2 gap-3">
                            <Choice selected={tripType === 'one-way'} onClick={() => setTripType('one-way')} className="p-3.5 rounded-xl">
                              <span className="block text-sm font-semibold text-gray-900">Aller simple</span>
                              <span className="block text-xs text-gray-600 mt-0.5">Trajet unique</span>
                            </Choice>
                            <Choice selected={tripType === 'round-trip'} onClick={() => setTripType('round-trip')} className="p-3.5 rounded-xl">
                              <span className="block text-sm font-semibold text-gray-900">Aller-retour</span>
                              <span className="block text-xs text-gray-600 mt-0.5">Retour 1 à 3 jours après l’aller</span>
                            </Choice>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-5 pt-5 border-t border-gray-100">
                          <p id="duration-label" className="text-sm font-medium text-gray-700">Durée de mise à disposition</p>
                          <p className="text-xs text-gray-500 mb-3">Paliers de 30 minutes · tarif jour affiché</p>
                          <div role="radiogroup" aria-labelledby="duration-label" className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                            {FORFAITS.map((f) => (
                              <Choice key={f.hours} selected={hours === f.hours} onClick={() => setHours(f.hours)} className="py-2.5 px-1 rounded-xl text-center">
                                <span className="block text-sm font-bold text-gray-900">{formatHours(f.hours)}</span>
                                <span className="block text-[11px] text-gray-600">{formatEuro(f.day)}</span>
                              </Choice>
                            ))}
                          </div>
                          <p className="mt-3 text-xs text-blue-800 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2 leading-relaxed">
                            Les forfaits incluent la distance et le temps indiqué. Tout dépassement sera facturé au tarif en vigueur.
                          </p>
                        </div>
                      )}
                    </Card>

                    <Card>
                      <CardTitle hint="Sélectionnez une adresse dans la liste pour lancer le calcul du tarif.">Votre itinéraire</CardTitle>
                      <div className="space-y-3">
                        <AddressField
                          label="Adresse de départ"
                          placeholder="D’où partez-vous ?"
                          pinClass="text-[#4BC449]"
                          value={pickupText}
                          confirmed={!!pickup}
                          hint="Pour une adresse en Haute-Savoie, précisez « 74 » ou le code postal si le mauvais département s’affiche."
                          error={attempted && !pickup ? (pickupText.trim() ? 'Sélectionnez une adresse dans la liste.' : 'Adresse de départ requise.') : null}
                          onTextChange={(t) => {
                            setPickupText(t);
                            setPickup(null);
                          }}
                          onSelect={(p) => {
                            setPickupText(p.label);
                            setPickup(p);
                          }}
                        />
                        <div className="flex justify-center">
                          <button
                            type="button"
                            onClick={swapAddresses}
                            disabled={!pickupText && !dropoffText}
                            aria-label="Inverser le départ et l’arrivée"
                            className="w-9 h-9 rounded-full border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4BC449]"
                          >
                            <IconArrowsUpDown size={16} />
                          </button>
                        </div>
                        <AddressField
                          label="Adresse d’arrivée"
                          placeholder="Où allez-vous ?"
                          pinClass="text-red-400"
                          value={dropoffText}
                          confirmed={!!dropoff}
                          error={
                            attempted && pickup && !dropoff
                              ? dropoffText.trim() ? 'Sélectionnez une adresse dans la liste.' : 'Adresse d’arrivée requise.'
                              : attempted && sameCoords ? 'Le départ et la destination doivent être différents.' : null
                          }
                          onTextChange={(t) => {
                            setDropoffText(t);
                            setDropoff(null);
                          }}
                          onSelect={(p) => {
                            setDropoffText(p.label);
                            setDropoff(p);
                          }}
                        />
                      </div>
                    </Card>

                    <Nav step={step} blocker={stepBlocker} attempted={attempted} onNext={goNext} onBack={() => undefined} price={null} />
                  </div>
                )}

                {/* ------------------------------ ÉTAPE 2 ------------------------------ */}
                {step === 2 && (
                  <div className="space-y-5">
                    <StepHeading headingRef={headingRef} title="Quand partez-vous ?" sub="Choisissez la date et l’heure de prise en charge." />

                    <Card>
                      <CardTitle>{isRoundTrip ? 'Date de l’aller' : 'Date de départ'}</CardTitle>
                      <Calendar
                        label="Date de départ"
                        viewMonth={viewMonth}
                        onMonthChange={setViewMonth}
                        selected={date}
                        minDate={minPickupDay}
                        onSelect={updateDate}
                      />
                      {earliestPickup && earliestPickup > now && (
                        <p className="text-xs text-gray-500 mt-3 flex items-center gap-1.5">
                          <IconClock size={13} aria-hidden />
                          Première prise en charge possible : {formatMediumDate(earliestPickup)} à {formatTime(earliestPickup)}
                        </p>
                      )}
                    </Card>

                    {date && (
                      <Card>
                        <CardTitle>{isRoundTrip ? 'Heure de l’aller' : 'Heure de prise en charge'}</CardTitle>
                        <TimeGrid
                          label="Heure de départ"
                          value={time}
                          onChange={setTime}
                          minDateTime={minPickup}
                          day={date}
                          minHint={`Première prise en charge possible à ${formatTime(minPickup)} ce jour-là.`}
                        />
                      </Card>
                    )}

                    {isRoundTrip && date && time && parseTime(time) && !timeTooEarly && (
                      <Card>
                        <CardTitle hint="Même trajet, retour entre 1 et 3 jours après l’aller (jusqu’à 23 h 59 le jour 3).">Trajet retour</CardTitle>
                        <div role="radiogroup" aria-label="Date de retour" className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          {([1, 2, 3] as const).map((n) => {
                            const d = addDays(date, n);
                            return (
                              <Choice key={n} selected={returnOffset === n} onClick={() => setReturnOffset(n)} className="p-3.5 rounded-xl">
                                <span className="block text-xs font-semibold text-[#27802a]">J+{n}</span>
                                <span className="block text-sm font-medium text-gray-900 mt-0.5">{formatMediumDate(d)}</span>
                              </Choice>
                            );
                          })}
                        </div>
                        {returnDate && (
                          <div className="mt-5">
                            <h4 className="text-xs font-semibold text-gray-700 mb-3">Heure de retour — {formatLongDate(returnDate)}</h4>
                            <TimeGrid label="Heure de retour" value={returnTime} onChange={setReturnTime} minDateTime={null} day={returnDate} />
                          </div>
                        )}
                      </Card>
                    )}

                    {!isHourly && date && time && parseTime(time) && !timeTooEarly && (
                      <Card>
                        <CardTitle hint="Optionnel — le chauffeur vous attend sur place (par tranche de 15 minutes).">Mise à disposition (temps d’attente)</CardTitle>
                        <Stepper
                          label="Durée d’attente"
                          sub="10 min gratuites, puis par tranche de 15 min"
                          value={waitingMinutes}
                          min={0}
                          max={480}
                          step={15}
                          format={(v) => (v === 0 ? 'Aucune' : `${v} min`)}
                          onChange={setWaitingMinutes}
                        />
                        <div className="mt-3 text-xs text-gray-600 bg-blue-50/60 border border-blue-100 rounded-lg px-3 py-2.5 space-y-1 leading-relaxed">
                          <p className="font-semibold text-emerald-700">10 premières minutes gratuites</p>
                          <p>
                            Ensuite : <strong className="text-blue-800">1,20 € TTC / minute</strong> (jour) ·{' '}
                            <strong className="text-indigo-800">1,80 € TTC / minute</strong> (nuit)
                          </p>
                          <p className="italic text-gray-500">Tarif jour ou nuit selon l’heure de prise en charge. Valable en aller simple comme en aller-retour.</p>
                        </div>
                      </Card>
                    )}

                    {quoteReady && (
                      <QuoteCard
                        quote={quote}
                        loading={quoteLoading}
                        error={quoteError}
                        tripType={effectiveTrip}
                        waitingMinutes={isHourly ? 0 : waitingMinutes}
                        immobilisation={immobilisation}
                        returnDaysAfter={returnOffset}
                        arTooShort={arTooShort}
                        onRetry={retry}
                        onSwitchToOneWay={() => {
                          setTripType('one-way');
                          setReturnOffset(null);
                          setReturnTime('');
                        }}
                        debugData={(bookingBase as Record<string, unknown>) ?? {}}
                      />
                    )}

                    <Nav
                      step={step}
                      blocker={stepBlocker}
                      attempted={attempted}
                      onNext={goNext}
                      onBack={() => goTo(1)}
                      price={quote && !quoteLoading ? priceLabel : null}
                    />
                  </div>
                )}

                {/* ------------------------------ ÉTAPE 3 ------------------------------ */}
                {step === 3 && (
                  <div className="space-y-5">
                    <StepHeading headingRef={headingRef} title="Qui voyage ?" sub="Indiquez les passagers, les bagages et vos besoins." />

                    <Card>
                      <CardTitle>Passagers</CardTitle>
                      <div className="divide-y divide-gray-100">
                        <Stepper
                          label="Adultes et enfants de + de 10 ans"
                          value={adults}
                          min={1}
                          max={MAX_PASSENGERS}
                          incrementDisabled={totalPassengers >= MAX_PASSENGERS}
                          onChange={setAdults}
                        />
                        <div>
                          <Stepper
                            label="Enfants de moins de 10 ans"
                            sub="Avec âge (1 à 10 ans)"
                            value={children}
                            min={0}
                            max={MAX_PASSENGERS}
                            incrementDisabled={totalPassengers >= MAX_PASSENGERS}
                            onChange={setChildren}
                          />
                          {children > 0 && (
                            <div className="pb-3.5 -mt-1">
                              <label htmlFor="child-age" className="text-xs text-gray-600 mr-2">
                                Âge de l’enfant
                              </label>
                              <select
                                id="child-age"
                                value={childAge}
                                onChange={(e) => setChildAge(Number(e.target.value))}
                                className="h-10 rounded-lg border border-gray-200 bg-white px-3 text-base sm:text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#4BC449]/25 focus:border-[#4BC449]"
                              >
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((age) => (
                                  <option key={age} value={age}>
                                    {age} an{age > 1 ? 's' : ''}
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}
                        </div>
                        <Stepper
                          label="Bébés"
                          sub="Moins de 2 ans"
                          value={babies}
                          min={0}
                          max={MAX_PASSENGERS}
                          incrementDisabled={totalPassengers >= MAX_PASSENGERS}
                          onChange={setBabies}
                        />
                      </div>
                      <div className="mt-4 flex items-center justify-between rounded-xl bg-[#4BC449]/10 border border-[#4BC449]/20 px-3.5 py-2.5">
                        <span className="text-xs font-medium text-gray-700">Total passagers</span>
                        <span className="text-sm font-bold text-[#27802a]">
                          {totalPassengers} / {MAX_PASSENGERS}
                        </span>
                      </div>
                      {totalPassengers >= MAX_PASSENGERS && (
                        <p className="mt-2 text-xs text-gray-500">
                          Capacité maximale du véhicule atteinte. Pour un groupe plus important, appelez-nous au {CONTACT.phone}.
                        </p>
                      )}
                    </Card>

                    <Card>
                      <CardTitle>Bagages et besoins</CardTitle>
                      <Stepper label="Bagages" icon={IconLuggage} value={luggage} min={0} max={5} onChange={setLuggage} />

                      <div className="border-t border-gray-100 mt-4 pt-4">
                        <p className="text-sm font-semibold text-gray-900 mb-2">Besoins supplémentaires</p>
                        <CheckRow checked={babySeat} onChange={setBabySeat}>Siège bébé / rehausseur</CheckRow>
                        <CheckRow checked={wheelchair} onChange={setWheelchair}>Accessibilité PMR</CheckRow>
                        <CheckRow checked={largeLuggage} onChange={setLargeLuggage}>Bagage volumineux</CheckRow>
                      </div>

                      <div className="border-t border-gray-100 mt-4 pt-4">
                        <label htmlFor="max-arrival" className="text-sm font-semibold text-gray-900 block">
                          Heure d’arrivée max <span className="text-gray-500 font-normal">(optionnel)</span>
                        </label>
                        <p className="text-xs text-gray-500 mb-2">Pour une correspondance train ou avion.</p>
                        <input
                          id="max-arrival"
                          type="time"
                          value={maxArrival}
                          onChange={(e) => setMaxArrival(e.target.value)}
                          className="px-3 py-2.5 rounded-lg bg-gray-50 border border-gray-200 text-base sm:text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#4BC449]/25 focus:border-[#4BC449]"
                        />
                      </div>
                    </Card>

                    <Nav
                      step={step}
                      blocker={stepBlocker}
                      attempted={attempted}
                      onNext={goNext}
                      onBack={() => goTo(2)}
                      price={quote ? priceLabel : null}
                    />
                  </div>
                )}

                {/* ------------------------------ ÉTAPE 4 ------------------------------ */}
                {step === 4 && !showOtp && (
                  <div className="space-y-5">
                    <StepHeading headingRef={headingRef} title="Confirmation" sub="Vérifiez votre demande et laissez-nous vos coordonnées." />

                    <Card>
                      <CardTitle>Récapitulatif</CardTitle>
                      <dl className="divide-y divide-gray-100">
                        {recap.map((row) => (
                          <div key={row.label} className="flex items-start justify-between gap-4 py-2.5">
                            <dt className="text-sm text-gray-500 shrink-0">{row.label}</dt>
                            <dd className="text-sm font-medium text-gray-900 text-right flex items-start gap-2 min-w-0">
                              <span className="break-words min-w-0">{row.value}</span>
                              <button
                                type="button"
                                onClick={() => goTo(row.step)}
                                aria-label={`Modifier : ${row.label}`}
                                className="text-xs font-medium text-[#27802a] hover:underline shrink-0 px-2 py-2.5 -mx-2 -my-2.5 focus-visible:outline-2 focus-visible:outline-[#4BC449] rounded"
                              >
                                Modifier
                              </button>
                            </dd>
                          </div>
                        ))}
                        {quote && (
                          <>
                            <div className="flex items-center justify-between gap-4 py-2.5">
                              <dt className="text-sm text-gray-500">Sous-total HT · TVA</dt>
                              <dd className="text-sm font-medium text-gray-900">
                                {formatEuro(quote.totalHT)} · {formatEuro(quote.tva)}
                              </dd>
                            </div>
                            {immobilisation && immobilisation.priceTTC > 0 && (
                              <div className="flex items-center justify-between gap-4 py-2.5">
                                <dt className="text-sm text-gray-500">Immobilisation (en sus)</dt>
                                <dd className="text-sm font-medium text-gray-900">+ {formatEuro(immobilisation.priceTTC)} TTC</dd>
                              </div>
                            )}
                            <div className="flex items-center justify-between gap-4 pt-3">
                              <dt className="text-sm font-semibold text-gray-900">Prix estimé TTC</dt>
                              <dd className="text-xl font-bold text-[#27802a]">{priceLabel}</dd>
                            </div>
                          </>
                        )}
                      </dl>
                    </Card>

                    <Card>
                      <form
                        noValidate
                        onSubmit={(e) => {
                          e.preventDefault();
                          void submit();
                        }}
                        className="space-y-4"
                      >
                        <CardTitle hint="Pour vous envoyer votre confirmation et vous joindre le jour du trajet.">Vos coordonnées</CardTitle>
                        <TextField
                          label="Nom complet"
                          name="name"
                          autoComplete="name"
                          placeholder="Jean Dupont"
                          value={guestName}
                          onChange={setGuestName}
                          onBlur={() => touch('guestName')}
                          error={showErr('guestName')}
                        />
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <TextField
                            label="E-mail"
                            name="email"
                            type="email"
                            autoComplete="email"
                            inputMode="email"
                            placeholder="jean@exemple.com"
                            value={guestEmail}
                            onChange={setGuestEmail}
                            onBlur={() => touch('guestEmail')}
                            error={showErr('guestEmail')}
                          />
                          <TextField
                            label="Téléphone"
                            name="tel"
                            type="tel"
                            autoComplete="tel"
                            inputMode="tel"
                            placeholder="+33 6 00 00 00 00"
                            value={guestPhone}
                            onChange={setGuestPhone}
                            onBlur={() => touch('guestPhone')}
                            error={showErr('guestPhone')}
                          />
                        </div>
                        <TextField
                          label="Note au chauffeur"
                          optional
                          multiline
                          placeholder="Numéro de vol, accès particulier…"
                          value={note}
                          onChange={setNote}
                        />

                        <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-4 text-sm text-emerald-900">
                          <p className="flex items-center gap-2 font-semibold">
                            <IconCash size={16} aria-hidden /> Paiement à la prise en charge
                          </p>
                          <p className="mt-1 text-xs leading-relaxed text-emerald-800">
                            Espèces, carte bancaire (ou lien de paiement) ou virement. Une facture vous est remise obligatoirement pour tout
                            paiement supérieur ou égal à 33 €.
                          </p>
                        </div>
                        <div className="rounded-xl bg-amber-50 border border-amber-100 p-4 text-xs text-amber-900 leading-relaxed">
                          <p className="font-semibold text-sm flex items-center gap-2">
                            <IconClock size={16} aria-hidden /> Politique d’annulation
                          </p>
                          <ul className="mt-1.5 space-y-1 list-disc pl-5">
                            <li>
                              Plus de <strong>8 heures</strong> avant la prestation : <strong>annulation gratuite</strong>.
                            </li>
                            <li>
                              Moins de <strong>8 heures</strong> avant : frais d’annulation de <strong>20 € TTC maximum</strong>.
                            </li>
                          </ul>
                          <p className="mt-1.5">Prévenez MobiService VTC au plus vite en cas de problème.</p>
                        </div>

                        <div>
                          <CheckRow
                            checked={cgv}
                            onChange={(v) => {
                              setCgv(v);
                              touch('cgvAccepted');
                            }}
                            invalid={!!showErr('cgvAccepted')}
                            describedBy="cgv-error"
                          >
                            J’accepte les{' '}
                            <Link href="/cgv" target="_blank" rel="noopener noreferrer" className="text-[#27802a] font-medium underline">
                              conditions générales
                            </Link>{' '}
                            et la grille tarifaire
                          </CheckRow>
                          {showErr('cgvAccepted') && (
                            <p id="cgv-error" role="alert" className="text-xs text-red-600 mt-1">
                              Vous devez accepter les CGV et la grille tarifaire.
                            </p>
                          )}
                        </div>

                        {submitError && (
                          <p role="alert" className="flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-100 rounded-xl p-3.5">
                            <IconAlertTriangle size={16} aria-hidden className="mt-0.5 shrink-0" /> {submitError}
                          </p>
                        )}

                        <div className="flex items-center gap-3 pt-1">
                          <button
                            type="button"
                            onClick={() => goTo(3)}
                            disabled={submitting}
                            className="flex items-center gap-2 px-4 py-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4BC449]"
                          >
                            <IconArrowLeft size={16} aria-hidden /> <span className="hidden sm:inline">Retour</span>
                            <span className="sm:hidden sr-only">Retour</span>
                          </button>
                          <button
                            type="submit"
                            disabled={submitting || !bookingBase}
                            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold bg-[#4BC449] hover:bg-[#3fb340] text-[#0a1628] shadow-lg shadow-[#4BC449]/25 disabled:opacity-60 disabled:cursor-not-allowed transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4BC449]"
                          >
                            {submitting ? (
                              <>
                                <IconLoader2 size={16} aria-hidden className="animate-spin" /> Envoi en cours…
                              </>
                            ) : (
                              <>
                                Envoyer ma demande <IconArrowRight size={16} aria-hidden />
                              </>
                            )}
                          </button>
                        </div>
                        <p className="text-center text-xs text-gray-500">Aucun paiement immédiat · un code de vérification vous sera envoyé par e-mail</p>
                      </form>
                    </Card>
                  </div>
                )}

                {step === 4 && showOtp && (
                  <div className="space-y-5">
                    <StepHeading headingRef={headingRef} title="Vérification" sub="Dernière étape : confirmez votre adresse e-mail." />
                    <OtpStep
                      email={guestEmail.trim()}
                      code={otpCode}
                      onCodeChange={(c) => {
                        setOtpCode(c);
                        setOtpError('');
                      }}
                      error={otpError}
                      info={otpInfo}
                      loading={submitting}
                      resendIn={resendIn}
                      onVerify={verifyOtp}
                      onResend={resendOtp}
                      onBack={() => {
                        setShowOtp(false);
                        setOtpCode(['', '', '', '', '', '']);
                        setOtpError('');
                      }}
                      summary={[
                        { label: 'Départ', value: pickup?.label ?? '' },
                        { label: 'Arrivée', value: dropoff?.label ?? '' },
                        { label: 'Date', value: dateTimeText },
                      ]}
                      total={priceLabel}
                    />
                  </div>
                )}
              </div>

              {/* Récapitulatif latéral (≥ lg) */}
              <aside aria-label="Votre trajet" className="hidden lg:block w-[270px] shrink-0">
                <div className="sticky top-24 bg-white rounded-2xl shadow-xl overflow-hidden">
                  <div className="p-5">
                    <h2 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4">Votre trajet</h2>
                    <ul className="space-y-3 text-sm">
                      <li className="flex items-start gap-2.5">
                        <IconMapPin size={14} aria-hidden className="text-[#4BC449] mt-0.5 shrink-0" />
                        <span className="leading-snug text-gray-900 break-words min-w-0">
                          {pickupText.split(',')[0] || <span className="text-gray-500">Départ</span>}
                        </span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <IconMapPin size={14} aria-hidden className="text-red-400 mt-0.5 shrink-0" />
                        <span className="leading-snug text-gray-900 break-words min-w-0">
                          {dropoffText.split(',')[0] || <span className="text-gray-500">Arrivée</span>}
                        </span>
                      </li>
                      <li className="border-t border-gray-100 pt-3 flex items-center gap-2.5 text-gray-700">
                        {isHourly ? <IconClockHour4 size={14} aria-hidden className="text-gray-500" /> : <IconRoute size={14} aria-hidden className="text-gray-500" />}
                        {isHourly ? `Mise à disposition ${formatHours(hours)}` : isRoundTrip ? 'Aller-retour' : 'Aller simple'}
                      </li>
                      {date && (
                        <li className="flex items-center gap-2.5 text-gray-700">
                          <IconCalendar size={14} aria-hidden className="text-gray-500" />
                          {formatMediumDate(date)}
                          {time && ` · ${time}`}
                        </li>
                      )}
                      {isRoundTrip && returnDate && (
                        <li className="flex items-center gap-2.5 text-gray-700">
                          <IconCalendar size={14} aria-hidden className="text-gray-500" />
                          Retour {formatMediumDate(returnDate)}
                          {returnTime && ` · ${returnTime}`}
                        </li>
                      )}
                      {quote && (
                        <li className="flex items-center gap-2.5 text-gray-700">
                          <IconRoute size={14} aria-hidden className="text-gray-500" />
                          {quote.distanceTP.toFixed(1).replace('.', ',')} km
                        </li>
                      )}
                      {step >= 3 && (
                        <>
                          <li className="flex items-center gap-2.5 text-gray-700">
                            <IconUsers size={14} aria-hidden className="text-gray-500" />
                            {totalPassengers} passager{totalPassengers > 1 ? 's' : ''}
                          </li>
                          <li className="flex items-center gap-2.5 text-gray-700">
                            <IconLuggage size={14} aria-hidden className="text-gray-500" />
                            {luggage} bagage{luggage > 1 ? 's' : ''}
                          </li>
                        </>
                      )}
                      {(quote || quoteLoading) && (
                        <li className="border-t border-gray-100 pt-3 flex items-center justify-between">
                          <span className="text-xs text-gray-500">Prix estimé</span>
                          {quoteLoading ? (
                            <IconLoader2 size={16} aria-label="Calcul en cours" className="text-[#4BC449] animate-spin" />
                          ) : (
                            <span className="text-xl font-bold text-[#27802a] tabular-nums">{priceLabel}</span>
                          )}
                        </li>
                      )}
                    </ul>
                  </div>
                  <div className="bg-[#4BC449]/5 border-t border-[#4BC449]/10 px-5 py-3">
                    <p className="text-[#27802a] text-xs font-semibold flex items-center gap-1.5">
                      <IconPhone size={13} aria-hidden /> Besoin d’aide ?
                    </p>
                    <a href={`tel:${CONTACT.whatsapp}`} className="text-gray-900 text-sm font-bold mt-0.5 block hover:underline">
                      {CONTACT.phone}
                    </a>
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-white/50 pb-6 px-4 flex items-center justify-center gap-1.5">
          <IconInfoCircle size={13} aria-hidden /> Prix estimé calculé en temps réel · paiement à la prise en charge
        </p>
      </div>
    </main>
  );
}

/* --------------------------------- helpers -------------------------------- */

function StepHeading({ title, sub, headingRef }: { title: string; sub: string; headingRef: Ref<HTMLHeadingElement> }) {
  return (
    <div className="mb-1">
      <h2 ref={headingRef} tabIndex={-1} className="text-2xl font-bold text-white mb-1 scroll-mt-24 focus:outline-none">
        {title}
      </h2>
      <p className="text-white/70 text-sm">{sub}</p>
    </div>
  );
}

interface NavProps {
  step: Step;
  blocker: string | null;
  attempted: boolean;
  onNext: () => void;
  onBack: () => void;
  /** Prix affiché dans la barre sur mobile (le récapitulatif latéral est masqué). */
  price: string | null;
}

/**
 * Barre de navigation. Fragment : la barre doit être enfant direct du conteneur de l'étape
 * pour pouvoir rester collée en bas d'écran sur mobile (prix + action toujours visibles).
 */
function Nav({ step, blocker, attempted, onNext, onBack, price }: NavProps) {
  const blocked = !!blocker;
  return (
    <>
      {blocker && (
        <p
          role={attempted ? 'alert' : undefined}
          className={`text-xs flex items-start gap-1.5 ${attempted ? 'text-amber-200' : 'text-white/60'}`}
        >
          <IconInfoCircle size={14} aria-hidden className="mt-px shrink-0" />
          {blocker}
        </p>
      )}
      <div className="sticky bottom-0 z-20 -mx-4 px-4 py-3 sm:mx-0 sm:px-0 sm:py-0 bg-[#0d2847]/95 backdrop-blur sm:bg-transparent sm:backdrop-blur-none lg:static flex items-center gap-3 border-t border-white/10 sm:border-0">
        {step > 1 && (
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-3 rounded-xl bg-white/10 border border-white/10 text-sm font-medium text-white hover:bg-white/15 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            <IconArrowLeft size={16} aria-hidden />
            <span className="hidden sm:inline">Retour</span>
            <span className="sr-only sm:hidden">Retour</span>
          </button>
        )}
        {price && (
          <div className="lg:hidden text-white leading-tight min-w-0">
            <p className="text-[10px] text-white/60 uppercase tracking-wide">Prix estimé</p>
            <p className="text-lg font-bold text-[#6fe06d] tabular-nums">{price}</p>
          </div>
        )}
        <button
          type="button"
          onClick={onNext}
          aria-disabled={blocked}
          className={`flex items-center gap-2 ml-auto px-6 py-3 rounded-xl text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${
            blocked ? 'bg-white/10 text-white/50 cursor-not-allowed' : 'bg-[#4BC449] hover:bg-[#3fb340] text-[#0a1628] shadow-lg shadow-[#4BC449]/25'
          }`}
        >
          Continuer
          <IconArrowRight size={16} aria-hidden />
        </button>
      </div>
    </>
  );
}

export default function ReservationPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" style={{ background: BACKGROUND }} />}>
      <ReservationFlow />
    </Suspense>
  );
}
