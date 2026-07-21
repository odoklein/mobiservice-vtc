'use client';

import { useState } from 'react';
import {
  IconCheck,
  IconClock,
  IconArrowRight,
  IconArrowLeft,
  IconPlus,
  IconMinus,
  IconChevronLeft,
  IconChevronRight,
  IconMapPin,
  IconCalendar,
  IconUsers,
  IconLuggage,
  IconPhone,
  IconShieldCheck,
} from '@tabler/icons-react';

type Step = 1 | 2 | 3 | 4;

const STEP_LABELS = ['Trajet', 'Quand', 'Voyageurs', 'Confirmation'];

const WEEKS = [
  [29, 30, 1, 2, 3, 4, 5],
  [6, 7, 8, 9, 10, 11, 12],
  [13, 14, 15, 16, 17, 18, 19],
  [20, 21, 22, 23, 24, 25, 26],
  [27, 28, 29, 30, 31, 1, 2],
];

export default function NotreIdeePage() {
  const [step, setStep] = useState<Step>(1);

  const [pickup, setPickup] = useState('47 avenue des Marmottes, Fontaine-sur-Saône');
  const [dropoff, setDropoff] = useState('Gare d\'Annecy, 74000 Annecy');
  const [tripType, setTripType] = useState<'transfer' | 'hourly'>('transfer');
  const [direction, setDirection] = useState<'one-way' | 'round-trip'>('one-way');

  const [selectedDate, setSelectedDate] = useState(22);
  const [selectedTime, setSelectedTime] = useState('');
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [returnChoice, setReturnChoice] = useState<'' | 'same' | 'next' | 'custom'>('');
  const [returnDate, setReturnDate] = useState(0);
  const [returnTime, setReturnTime] = useState('');
  const [showReturnCalendar, setShowReturnCalendar] = useState(false);
  const [showReturnTime, setShowReturnTime] = useState(false);

  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [babies, setBabies] = useState(0);
  const [suitcases, setSuitcases] = useState(2);
  const [babySeat, setBabySeat] = useState(false);
  const [wheelchair, setWheelchair] = useState(false);
  const [largeLuggage, setLargeLuggage] = useState(false);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [note, setNote] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);

  const [showSuccess, setShowSuccess] = useState(false);

  const totalPassengers = adults + children + babies;
  const estimatedPrice = direction === 'round-trip' ? 178 : 98;
  const showPrice = selectedDate > 0 && selectedTime !== '';

  const canContinue = (s: Step) => {
    if (s === 1) return pickup.length > 0 && dropoff.length > 0;
    if (s === 2) return selectedDate > 0 && selectedTime !== '';
    if (s === 3) return adults >= 1;
    return acceptTerms;
  };

  const goNext = () => {
    if (step < 4) setStep((step + 1) as Step);
    else setShowSuccess(true);
  };
  const goBack = () => {
    if (step > 1) setStep((step - 1) as Step);
  };

  const reset = () => {
    setShowSuccess(false);
    setStep(1);
    setSelectedTime('');
    setShowTimePicker(false);
    setReturnChoice('');
    setReturnDate(0);
    setReturnTime('');
    setShowReturnCalendar(false);
    setShowReturnTime(false);
  };

  const formatDate = (day: number) => {
    const days = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
    const d = new Date(2026, 6, day);
    return `${days[d.getDay()].charAt(0).toUpperCase() + days[d.getDay()].slice(1)} ${day} juillet 2026`;
  };

  const shortDate = (day: number) => `${day} juil. 2026`;

  const passengersText = () => {
    const parts = [];
    if (adults > 0) parts.push(`${adults} adulte${adults > 1 ? 's' : ''}`);
    if (children > 0) parts.push(`${children} enfant${children > 1 ? 's' : ''}`);
    if (babies > 0) parts.push(`${babies} bébé${babies > 1 ? 's' : ''}`);
    return parts.join(', ');
  };

  if (showSuccess) {
    return (
      <div className="min-h-screen relative overflow-hidden flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #0a1628 0%, #0d2847 30%, #0f3060 50%, #0d2847 70%, #0a1628 100%)' }}>
        <HeroBg />
        <div className="relative z-10 text-center max-w-md mx-auto px-4">
          <div className="w-20 h-20 rounded-full bg-[#4BC449] flex items-center justify-center mx-auto mb-6">
            <IconCheck size={40} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-3">Réservation <span className="text-[#4BC449]">confirmée</span></h1>
          <p className="text-white/60 mb-2">{formatDate(selectedDate)} à {selectedTime}</p>
          <p className="text-white/30 text-xs mb-8">Démonstration uniquement — aucune réservation réelle.</p>
          <button onClick={reset} className="bg-[#4BC449] hover:bg-[#3fb340] text-white px-8 py-3 rounded-xl font-semibold transition-colors">Recommencer</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #0a1628 0%, #0d2847 30%, #0f3060 50%, #0d2847 70%, #0a1628 100%)' }}>
      <HeroBg />

      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Step bar */}
        <div className="max-w-3xl mx-auto w-full px-6 pt-8 pb-4">
          <div className="flex items-center justify-between">
            {STEP_LABELS.map((label, i) => {
              const num = i + 1;
              const active = step === num;
              const done = step > num;
              return (
                <div key={label} className="flex items-center flex-1 last:flex-none">
                  <div className="flex flex-col items-center gap-1.5">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                      done ? 'bg-[#4BC449] text-white' : active ? 'bg-white text-[#0d2847]' : 'bg-white/10 text-white/40'
                    }`}>
                      {done ? <IconCheck size={14} /> : num}
                    </div>
                    <span className={`text-[11px] font-medium transition-colors ${done ? 'text-[#4BC449]' : active ? 'text-white' : 'text-white/30'}`}>{label}</span>
                  </div>
                  {i < STEP_LABELS.length - 1 && (
                    <div className={`flex-1 h-[2px] mx-3 mb-5 transition-colors duration-300 ${done ? 'bg-[#4BC449]' : 'bg-white/10'}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Main area */}
        <div className="flex-1 pb-8">
          <div className="max-w-5xl mx-auto px-6">
            <div className="flex gap-8">
              <div className="flex-1 min-w-0">

                {/* STEP 1: WHERE */}
                {step === 1 && (
                  <div className="space-y-5">
                    <div className="mb-2">
                      <h2 className="text-2xl font-bold text-white mb-1">Où allez-vous ?</h2>
                      <p className="text-white/50 text-sm">Indiquez votre point de départ et votre destination.</p>
                    </div>

                    <div className="bg-white rounded-2xl shadow-xl p-6 space-y-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-1.5 block">Départ</label>
                        <div className="relative">
                          <IconMapPin size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#4BC449]" />
                          <input
                            type="text" value={pickup} onChange={(e) => setPickup(e.target.value)}
                            placeholder="Adresse de départ"
                            className="w-full pl-10 pr-4 py-3.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#4BC449]/20 focus:border-[#4BC449] text-sm"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-1.5 block">Destination</label>
                        <div className="relative">
                          <IconMapPin size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-red-400" />
                          <input
                            type="text" value={dropoff} onChange={(e) => setDropoff(e.target.value)}
                            placeholder="Adresse d'arrivée"
                            className="w-full pl-10 pr-4 py-3.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#4BC449]/20 focus:border-[#4BC449] text-sm"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-xl p-6 space-y-4">
                      <label className="text-sm font-medium text-gray-700 block">Type de service</label>
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { id: 'transfer' as const, label: 'Transfert', desc: 'Point A → Point B' },
                          { id: 'hourly' as const, label: 'Mise à disposition', desc: 'Chauffeur à l\'heure' },
                        ].map((t) => (
                          <button key={t.id} onClick={() => setTripType(t.id)}
                            className={`p-4 rounded-xl border-2 text-left transition-all ${
                              tripType === t.id ? 'border-[#4BC449] bg-[#4BC449]/5' : 'border-gray-200 hover:border-gray-300'
                            }`}>
                            <span className={`text-sm font-semibold block ${tripType === t.id ? 'text-[#4BC449]' : 'text-gray-900'}`}>{t.label}</span>
                            <span className="text-xs text-gray-500">{t.desc}</span>
                          </button>
                        ))}
                      </div>

                      <label className="text-sm font-medium text-gray-700 block pt-2">Direction</label>
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { id: 'one-way' as const, label: 'Aller simple' },
                          { id: 'round-trip' as const, label: 'Aller-retour' },
                        ].map((d) => (
                          <button key={d.id} onClick={() => setDirection(d.id)}
                            className={`py-3 rounded-xl border-2 text-sm font-medium text-center transition-all ${
                              direction === d.id ? 'border-[#4BC449] bg-[#4BC449]/5 text-[#4BC449]' : 'border-gray-200 text-gray-700 hover:border-gray-300'
                            }`}>
                            {d.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <Nav step={step} ok={canContinue(1)} next={goNext} back={goBack} />
                  </div>
                )}

                {/* STEP 2: WHEN */}
                {step === 2 && (
                  <div className="space-y-5">
                    <div className="mb-2">
                      <h2 className="text-2xl font-bold text-white mb-1">Quand partez-vous ?</h2>
                      <p className="text-white/50 text-sm">Choisissez votre date et horaire de départ.</p>
                    </div>

                    <div className="bg-white rounded-2xl shadow-xl p-6">
                      <h3 className="text-sm font-semibold text-gray-900 mb-4">Date de départ</h3>
                      <div className="flex items-center justify-between mb-4">
                        <button className="text-gray-400 hover:text-gray-600"><IconChevronLeft size={20} /></button>
                        <span className="text-sm font-semibold text-gray-900">Juillet 2026</span>
                        <button className="text-gray-400 hover:text-gray-600"><IconChevronRight size={20} /></button>
                      </div>
                      <div className="grid grid-cols-7 gap-0 mb-1">
                        {['Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa', 'Di'].map((d) => (
                          <div key={d} className="text-center text-xs font-medium text-gray-400 py-2">{d}</div>
                        ))}
                      </div>
                      {WEEKS.map((week, wi) => (
                        <div key={wi} className="grid grid-cols-7 gap-0">
                          {week.map((day, di) => {
                            const isPrev = wi === 0 && day > 20;
                            const isNext = wi === WEEKS.length - 1 && day < 7;
                            const isCurr = !isPrev && !isNext;
                            const isPast = isCurr && day < 21;
                            const isSel = isCurr && day === selectedDate;
                            return (
                              <button key={`${wi}-${di}`}
                                onClick={() => { if (isCurr && !isPast) { setSelectedDate(day); if (!showTimePicker) setShowTimePicker(true); } }}
                                disabled={!isCurr || isPast}
                                className={`h-10 text-sm rounded-lg transition-all ${
                                  isSel ? 'bg-[#4BC449] text-white font-bold' : !isCurr || isPast ? 'text-gray-300' : 'text-gray-700 hover:bg-gray-50'
                                }`}>
                                {day}
                              </button>
                            );
                          })}
                        </div>
                      ))}
                    </div>

                    {showTimePicker && (
                      <div className="bg-white rounded-2xl shadow-xl p-6">
                        <h3 className="text-sm font-semibold text-gray-900 mb-4">Heure de départ</h3>
                        <div className="grid grid-cols-4 gap-2">
                          {['08:00', '09:00', '10:00', '11:00', '12:00', '14:00', '16:00', '18:00'].map((t) => (
                            <button key={t} onClick={() => setSelectedTime(t)}
                              className={`py-3 rounded-xl text-sm font-medium transition-all border ${
                                selectedTime === t ? 'bg-[#4BC449] text-white border-[#4BC449]' : 'border-gray-200 text-gray-700 hover:border-gray-300'
                              }`}>
                              {t}
                            </button>
                          ))}
                        </div>
                        <button onClick={() => setSelectedTime('10:30')} className="mt-3 text-sm text-[#4BC449] font-medium hover:underline">
                          Heure personnalisée
                        </button>
                      </div>
                    )}

                    {direction === 'round-trip' && selectedTime && (
                      <div className="bg-white rounded-2xl shadow-xl p-6 space-y-4">
                        <h3 className="text-sm font-semibold text-gray-900">Retour</h3>
                        <div className="space-y-2">
                          {[
                            { id: 'same' as const, label: 'Le même jour', detail: formatDate(selectedDate) },
                            { id: 'next' as const, label: 'Le lendemain', detail: formatDate(selectedDate + 1) },
                            { id: 'custom' as const, label: 'Choisir une autre date', detail: '' },
                          ].map((opt) => (
                            <button key={opt.id}
                              onClick={() => {
                                setReturnChoice(opt.id);
                                if (opt.id === 'same') { setReturnDate(selectedDate); setShowReturnTime(true); setShowReturnCalendar(false); }
                                else if (opt.id === 'next') { setReturnDate(selectedDate + 1); setShowReturnTime(true); setShowReturnCalendar(false); }
                                else { setShowReturnCalendar(true); setShowReturnTime(false); }
                              }}
                              className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all ${
                                returnChoice === opt.id ? 'border-[#4BC449] bg-[#4BC449]/5' : 'border-gray-200 hover:border-gray-300'
                              }`}>
                              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${returnChoice === opt.id ? 'border-[#4BC449]' : 'border-gray-300'}`}>
                                {returnChoice === opt.id && <div className="w-2.5 h-2.5 rounded-full bg-[#4BC449]" />}
                              </div>
                              <div>
                                <span className={`text-sm font-medium ${returnChoice === opt.id ? 'text-[#4BC449]' : 'text-gray-900'}`}>{opt.label}</span>
                                {opt.detail && <span className="text-xs text-gray-400 ml-2">{opt.detail}</span>}
                              </div>
                            </button>
                          ))}
                        </div>

                        {showReturnCalendar && (
                          <div className="pt-2">
                            <div className="flex items-center justify-between mb-3">
                              <button className="text-gray-400 hover:text-gray-600"><IconChevronLeft size={18} /></button>
                              <span className="text-xs font-semibold text-gray-700">Juillet 2026</span>
                              <button className="text-gray-400 hover:text-gray-600"><IconChevronRight size={18} /></button>
                            </div>
                            <div className="grid grid-cols-7 gap-0">
                              {['Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa', 'Di'].map((d) => (
                                <div key={d} className="text-center text-[10px] font-medium text-gray-400 py-1">{d}</div>
                              ))}
                            </div>
                            {WEEKS.map((week, wi) => (
                              <div key={wi} className="grid grid-cols-7 gap-0">
                                {week.map((day, di) => {
                                  const isPrev = wi === 0 && day > 20;
                                  const isNext = wi === WEEKS.length - 1 && day < 7;
                                  const isCurr = !isPrev && !isNext;
                                  const isBefore = isCurr && day <= selectedDate;
                                  const isSel = isCurr && day === returnDate;
                                  return (
                                    <button key={`r${wi}-${di}`}
                                      onClick={() => { if (isCurr && !isBefore) { setReturnDate(day); setShowReturnTime(true); } }}
                                      disabled={!isCurr || isBefore}
                                      className={`h-8 text-xs rounded transition-all ${
                                        isSel ? 'bg-[#4BC449] text-white font-bold' : !isCurr || isBefore ? 'text-gray-300' : 'text-gray-600 hover:bg-gray-50'
                                      }`}>
                                      {day}
                                    </button>
                                  );
                                })}
                              </div>
                            ))}
                          </div>
                        )}

                        {showReturnTime && (
                          <div className="pt-2">
                            <h4 className="text-xs font-semibold text-gray-700 mb-3">Heure de retour</h4>
                            <div className="grid grid-cols-4 gap-2">
                              {['10:00', '12:00', '14:00', '16:00', '18:00', '20:00'].map((t) => (
                                <button key={t} onClick={() => setReturnTime(t)}
                                  className={`py-2.5 rounded-lg text-xs font-medium border transition-all ${
                                    returnTime === t ? 'bg-[#4BC449] text-white border-[#4BC449]' : 'border-gray-200 text-gray-600 hover:border-gray-300'
                                  }`}>
                                  {t}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {showPrice && (
                      <div className="bg-white rounded-2xl shadow-xl p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-sm font-semibold text-gray-900">Estimation du prix</h3>
                            <p className="text-xs text-gray-400 mt-0.5">
                              {direction === 'round-trip' ? 'Aller-retour' : 'Aller simple'} • Transfert VTC
                            </p>
                          </div>
                          <div className="text-right">
                            <span className="text-3xl font-bold text-[#4BC449]">{estimatedPrice}€</span>
                            <p className="text-[10px] text-gray-400 mt-0.5">Prix estimé TTC</p>
                          </div>
                        </div>
                        <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap gap-2">
                          {[
                            { icon: IconShieldCheck, text: 'Prix fixe garanti' },
                            { icon: IconClock, text: '60 min d\'annulation gratuite' },
                            { icon: IconClock, text: '10 min d\'attente gratuits' },
                            { icon: IconCalendar, text: 'Aucun paiement immédiat' },
                          ].map((chip) => (
                            <div key={chip.text} className="flex items-center gap-1.5 bg-[#4BC449]/5 border border-[#4BC449]/15 rounded-full px-3 py-1.5">
                              <chip.icon size={13} className="text-[#4BC449] shrink-0" />
                              <span className="text-xs font-medium text-[#4BC449]">{chip.text}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <Nav step={step} ok={canContinue(2)} next={goNext} back={goBack} />
                  </div>
                )}

                {/* STEP 3: PASSENGERS */}
                {step === 3 && (
                  <div className="space-y-5">
                    <div className="mb-2">
                      <h2 className="text-2xl font-bold text-white mb-1">Qui voyage ?</h2>
                      <p className="text-white/50 text-sm">Indiquez le nombre de passagers et vos bagages.</p>
                    </div>

                    <div className="bg-white rounded-2xl shadow-xl p-6">
                      <h3 className="text-sm font-semibold text-gray-900 mb-4">Passagers</h3>
                      <div className="divide-y divide-gray-100">
                        {[
                          { label: 'Adultes', sub: '13 ans et +', value: adults, set: setAdults, min: 1, max: 4 },
                          { label: 'Enfants', sub: '2–12 ans', value: children, set: setChildren, min: 0, max: 3 },
                          { label: 'Bébés', sub: 'Moins de 2 ans', value: babies, set: setBabies, min: 0, max: 2 },
                        ].map((item) => (
                          <div key={item.label} className="flex items-center justify-between py-4 first:pt-0 last:pb-0">
                            <div>
                              <span className="text-sm font-medium text-gray-900">{item.label}</span>
                              <span className="text-xs text-gray-400 ml-2">{item.sub}</span>
                            </div>
                            <div className="flex items-center gap-4">
                              <button onClick={() => item.set(Math.max(item.min, item.value - 1))} disabled={item.value <= item.min}
                                className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:border-gray-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                                <IconMinus size={14} />
                              </button>
                              <span className="text-lg font-bold text-gray-900 w-6 text-center">{item.value}</span>
                              <button onClick={() => item.set(Math.min(item.max, item.value + 1))} disabled={item.value >= item.max}
                                className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:border-gray-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                                <IconPlus size={14} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="border-t border-gray-100 mt-4 pt-4">
                        <h3 className="text-sm font-semibold text-gray-900 mb-4">Bagages</h3>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-900">Valises</span>
                          <div className="flex items-center gap-4">
                            <button onClick={() => setSuitcases(Math.max(0, suitcases - 1))} disabled={suitcases <= 0}
                              className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:border-gray-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                              <IconMinus size={14} />
                            </button>
                            <span className="text-lg font-bold text-gray-900 w-6 text-center">{suitcases}</span>
                            <button onClick={() => setSuitcases(Math.min(6, suitcases + 1))} disabled={suitcases >= 6}
                              className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:border-gray-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                              <IconPlus size={14} />
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="border-t border-gray-100 mt-4 pt-4">
                        <h3 className="text-sm font-semibold text-gray-900 mb-3">Besoins supplémentaires</h3>
                        <div className="space-y-2">
                          {[
                            { label: 'Siège bébé', active: babySeat, toggle: () => setBabySeat(!babySeat) },
                            { label: 'Accessibilité PMR', active: wheelchair, toggle: () => setWheelchair(!wheelchair) },
                            { label: 'Bagage volumineux', active: largeLuggage, toggle: () => setLargeLuggage(!largeLuggage) },
                          ].map((opt) => (
                            <label key={opt.label} className="flex items-center gap-3 cursor-pointer py-1">
                              <div onClick={opt.toggle}
                                className={`w-[18px] h-[18px] rounded border-2 flex items-center justify-center transition-colors ${
                                  opt.active ? 'bg-[#4BC449] border-[#4BC449]' : 'border-gray-300'
                                }`}>
                                {opt.active && <IconCheck size={11} className="text-white" />}
                              </div>
                              <span className="text-sm text-gray-700">{opt.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>

                    <Nav step={step} ok={canContinue(3)} next={goNext} back={goBack} />
                  </div>
                )}

                {/* STEP 4: CONFIRMATION */}
                {step === 4 && (
                  <div className="space-y-5">
                    <div className="mb-2">
                      <h2 className="text-2xl font-bold text-white mb-1">Confirmation</h2>
                      <p className="text-white/50 text-sm">Vérifiez votre réservation et finalisez.</p>
                    </div>

                    <div className="bg-white rounded-2xl shadow-xl p-6">
                      <h3 className="text-sm font-semibold text-gray-900 mb-4">Récapitulatif</h3>
                      <div className="divide-y divide-gray-100">
                        {[
                          { label: 'Départ', value: pickup.split(',')[0] },
                          { label: 'Destination', value: dropoff.split(',')[0] },
                          { label: 'Date', value: formatDate(selectedDate) },
                          { label: 'Heure', value: selectedTime },
                          ...(direction === 'round-trip' && returnDate ? [{ label: 'Retour', value: `${shortDate(returnDate)}${returnTime ? ` à ${returnTime}` : ''}` }] : []),
                          { label: 'Passagers', value: passengersText() || '1 adulte' },
                          { label: 'Bagages', value: `${suitcases} valise${suitcases > 1 ? 's' : ''}` },
                          { label: 'Prix estimé', value: `${estimatedPrice}€`, highlight: true },
                        ].map((row) => (
                          <div key={row.label} className="flex items-center justify-between py-3">
                            <span className="text-sm text-gray-500">{row.label}</span>
                            <span className={`text-sm font-medium ${(row as any).highlight ? 'text-[#4BC449] text-lg font-bold' : 'text-gray-900'}`}>{row.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-xl p-6 space-y-4">
                      <h3 className="text-sm font-semibold text-gray-900">Vos coordonnées</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-medium text-gray-600 mb-1 block">Prénom</label>
                          <input type="text" placeholder="Votre prénom" value={firstName} onChange={(e) => setFirstName(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#4BC449]/20 focus:border-[#4BC449]" />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-gray-600 mb-1 block">Nom</label>
                          <input type="text" placeholder="Votre nom" value={lastName} onChange={(e) => setLastName(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#4BC449]/20 focus:border-[#4BC449]" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-medium text-gray-600 mb-1 block">Téléphone</label>
                          <input type="tel" placeholder="+33 6 00 00 00 00" value={phone} onChange={(e) => setPhone(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#4BC449]/20 focus:border-[#4BC449]" />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-gray-600 mb-1 block">E-mail</label>
                          <input type="email" placeholder="votre@email.com" value={email} onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#4BC449]/20 focus:border-[#4BC449]" />
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-600 mb-1 block">Note au chauffeur (optionnel)</label>
                        <textarea placeholder="Numéro de vol, accès particulier..." value={note} onChange={(e) => setNote(e.target.value)} rows={2}
                          className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#4BC449]/20 focus:border-[#4BC449] resize-none" />
                      </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-xl p-5">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <div onClick={() => setAcceptTerms(!acceptTerms)}
                          className={`w-[18px] h-[18px] rounded border-2 flex items-center justify-center transition-colors shrink-0 ${
                            acceptTerms ? 'bg-[#4BC449] border-[#4BC449]' : 'border-gray-300'
                          }`}>
                          {acceptTerms && <IconCheck size={11} className="text-white" />}
                        </div>
                        <span className="text-sm text-gray-700">
                          J'accepte les <button className="text-[#4BC449] font-medium hover:underline">conditions générales</button>
                        </span>
                      </label>
                    </div>

                    <Nav step={step} ok={canContinue(4)} next={goNext} back={goBack} lastLabel="Réserver maintenant" />

                    <div className="flex items-center justify-center gap-4 text-white/40 text-xs pb-2">
                      <span className="flex items-center gap-1"><IconShieldCheck size={14} /> Paiement sécurisé</span>
                      <span>•</span>
                      <span>Aucun paiement immédiat</span>
                      <span>•</span>
                      <span>Confirmation rapide</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Sticky sidebar */}
              <div className="hidden lg:block w-[260px] shrink-0">
                <div className="sticky top-6 bg-white rounded-2xl shadow-xl overflow-hidden" style={{ maxHeight: '350px' }}>
                  <div className="p-5">
                    <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Votre trajet</h3>
                    <div className="space-y-3">
                      <div className="flex items-start gap-2.5">
                        <IconMapPin size={14} className="text-[#4BC449] mt-0.5 shrink-0" />
                        <span className="text-sm text-gray-900 leading-snug">{pickup.split(',')[0]}</span>
                      </div>
                      <div className="flex items-start gap-2.5">
                        <IconMapPin size={14} className="text-red-400 mt-0.5 shrink-0" />
                        <span className="text-sm text-gray-900 leading-snug">{dropoff.split(',')[0]}</span>
                      </div>
                      <div className="border-t border-gray-100 my-1" />
                      {selectedDate > 0 && (
                        <div className="flex items-center gap-2.5">
                          <IconCalendar size={14} className="text-gray-400 shrink-0" />
                          <span className="text-sm text-gray-700">{selectedDate} juil.</span>
                        </div>
                      )}
                      {selectedTime && (
                        <div className="flex items-center gap-2.5">
                          <IconClock size={14} className="text-gray-400 shrink-0" />
                          <span className="text-sm text-gray-700">{selectedTime}</span>
                        </div>
                      )}
                      {step >= 3 && (
                        <div className="flex items-center gap-2.5">
                          <IconUsers size={14} className="text-gray-400 shrink-0" />
                          <span className="text-sm text-gray-700">{totalPassengers} passager{totalPassengers > 1 ? 's' : ''}</span>
                        </div>
                      )}
                      {step >= 3 && (
                        <div className="flex items-center gap-2.5">
                          <IconLuggage size={14} className="text-gray-400 shrink-0" />
                          <span className="text-sm text-gray-700">{suitcases} valise{suitcases > 1 ? 's' : ''}</span>
                        </div>
                      )}
                      {showPrice && (
                        <>
                          <div className="border-t border-gray-100 my-1" />
                          <div className="flex items-center justify-between pt-1">
                            <span className="text-xs text-gray-400">Prix estimé</span>
                            <span className="text-xl font-bold text-[#4BC449]">{estimatedPrice}€</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="bg-[#4BC449]/5 border-t border-[#4BC449]/10 px-5 py-3">
                    <p className="text-[#4BC449] text-xs font-semibold flex items-center gap-1.5">
                      <IconPhone size={13} />
                      Besoin d'aide ?
                    </p>
                    <p className="text-gray-900 text-sm font-bold mt-0.5">+33 6 20 87 19 89</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Demo banner */}
        <div className="mt-auto bg-white/[0.04] border-t border-white/5 py-3 text-center">
          <p className="text-white/30 text-xs">
            Démonstration UI/UX — aucune donnée réelle.
            <button onClick={reset} className="ml-2 underline hover:no-underline text-white/50">Recommencer</button>
          </p>
        </div>
      </div>
    </div>
  );
}

function Nav({ step, ok, next, back, lastLabel }: { step: Step; ok: boolean; next: () => void; back: () => void; lastLabel?: string }) {
  return (
    <div className="flex items-center gap-4 pt-2">
      {step > 1 && (
        <button onClick={back} className="flex items-center gap-2 px-5 py-3 rounded-xl bg-white/10 border border-white/10 text-sm font-medium text-white hover:bg-white/15 transition-colors">
          <IconArrowLeft size={16} />
          Retour
        </button>
      )}
      <button onClick={next} disabled={!ok}
        className={`flex items-center gap-2 ml-auto px-6 py-3 rounded-xl text-sm font-semibold transition-all ${
          ok ? 'bg-[#4BC449] hover:bg-[#3fb340] text-white shadow-lg shadow-[#4BC449]/25' : 'bg-white/10 text-white/20 cursor-not-allowed'
        }`}>
        {step === 4 ? (lastLabel || 'Confirmer') : 'Continuer'}
        <IconArrowRight size={16} />
      </button>
    </div>
  );
}

function HeroBg() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <div className="absolute top-[40%] left-[45%] -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-[#1a6090]/25 rounded-full blur-[150px]" />
      <div className="absolute bottom-[10%] right-[20%] w-[400px] h-[300px] bg-[#145580]/20 rounded-full blur-[100px]" />
      <svg className="absolute top-[10%] left-[6%]" width="26" height="34" viewBox="0 0 24 32" fill="none">
        <path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 20 12 20s12-11 12-20C24 5.4 18.6 0 12 0z" fill="rgba(255,255,255,0.12)" />
        <circle cx="12" cy="12" r="4" fill="rgba(255,255,255,0.2)" />
      </svg>
      <svg className="absolute top-[6%] left-[3%] w-[250px] h-[600px]" viewBox="0 0 250 600" fill="none">
        <path d="M140 30 C 190 90, 40 140, 100 240 C 160 340, 30 380, 90 480 C 110 530, 70 570, 100 600" stroke="rgba(255,255,255,0.08)" strokeWidth="1.5" strokeDasharray="5 7" fill="none" />
      </svg>
      <div className="absolute top-[40%] left-[5.5%] w-3 h-3 rounded-full bg-[#4BC449] shadow-[0_0_16px_rgba(75,196,73,0.6)]" />
      <svg className="absolute bottom-[12%] left-[9%]" width="22" height="30" viewBox="0 0 24 32" fill="none">
        <path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 20 12 20s12-11 12-20C24 5.4 18.6 0 12 0z" fill="rgba(255,255,255,0.1)" />
        <circle cx="12" cy="12" r="4" fill="rgba(255,255,255,0.15)" />
      </svg>
      <svg className="absolute bottom-0 left-[20%] w-[60%] h-[220px] opacity-[0.06]" viewBox="0 0 800 220" fill="none" preserveAspectRatio="xMidYMax meet">
        <path d="M0 220 L60 90 L100 140 L160 40 L220 130 L260 80 L320 150 L380 55 L440 135 L480 85 L540 155 L600 45 L660 125 L720 95 L800 220 Z" stroke="white" strokeWidth="1.2" fill="none" />
        <rect x="230" y="155" width="22" height="65" stroke="white" strokeWidth="0.8" fill="none" rx="1" />
        <rect x="258" y="135" width="28" height="85" stroke="white" strokeWidth="0.8" fill="none" rx="1" />
        <rect x="292" y="145" width="18" height="75" stroke="white" strokeWidth="0.8" fill="none" rx="1" />
        <rect x="316" y="120" width="16" height="100" stroke="white" strokeWidth="0.8" fill="none" rx="1" />
        <rect x="338" y="140" width="24" height="80" stroke="white" strokeWidth="0.8" fill="none" rx="1" />
        <rect x="368" y="150" width="20" height="70" stroke="white" strokeWidth="0.8" fill="none" rx="1" />
        <rect x="394" y="118" width="14" height="102" stroke="white" strokeWidth="0.8" fill="none" rx="1" />
        <rect x="414" y="155" width="26" height="65" stroke="white" strokeWidth="0.8" fill="none" rx="1" />
        <path d="M446 150 L455 90 L464 150" stroke="white" strokeWidth="0.8" fill="none" />
        <rect x="448" y="150" width="14" height="70" stroke="white" strokeWidth="0.8" fill="none" rx="1" />
        <rect x="470" y="142" width="22" height="78" stroke="white" strokeWidth="0.8" fill="none" rx="1" />
        <rect x="498" y="158" width="16" height="62" stroke="white" strokeWidth="0.8" fill="none" rx="1" />
        <path d="M180 220 C 300 195, 420 200, 560 220" stroke="white" strokeWidth="1" fill="none" />
      </svg>
    </div>
  );
}
