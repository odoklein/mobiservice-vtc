/** Décor d'arrière-plan de la page de réservation (purement décoratif). */
export function HeroBg() {
  return (
    <div aria-hidden className="absolute inset-0 pointer-events-none overflow-hidden">
      <div className="absolute top-[40%] left-[45%] -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-[#1a6090]/25 rounded-full blur-[150px]" />
      <div className="absolute bottom-[10%] right-[20%] w-[400px] h-[300px] bg-[#145580]/20 rounded-full blur-[100px]" />
      <svg className="absolute top-[10%] left-[6%] hidden sm:block" width="26" height="34" viewBox="0 0 24 32" fill="none">
        <path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 20 12 20s12-11 12-20C24 5.4 18.6 0 12 0z" fill="rgba(255,255,255,0.12)" />
        <circle cx="12" cy="12" r="4" fill="rgba(255,255,255,0.2)" />
      </svg>
      <svg className="absolute top-[6%] left-[3%] w-[250px] h-[600px] hidden sm:block" viewBox="0 0 250 600" fill="none">
        <path d="M140 30 C 190 90, 40 140, 100 240 C 160 340, 30 380, 90 480 C 110 530, 70 570, 100 600" stroke="rgba(255,255,255,0.08)" strokeWidth="1.5" strokeDasharray="5 7" fill="none" />
      </svg>
      <div className="absolute top-[40%] left-[5.5%] w-3 h-3 rounded-full bg-[#4BC449] shadow-[0_0_16px_rgba(75,196,73,0.6)] hidden sm:block" />
      <svg className="absolute bottom-0 left-[20%] w-[60%] h-[220px] opacity-[0.06]" viewBox="0 0 800 220" fill="none" preserveAspectRatio="xMidYMax meet">
        <path d="M0 220 L60 90 L100 140 L160 40 L220 130 L260 80 L320 150 L380 55 L440 135 L480 85 L540 155 L600 45 L660 125 L720 95 L800 220 Z" stroke="white" strokeWidth="1.2" fill="none" />
        <path d="M180 220 C 300 195, 420 200, 560 220" stroke="white" strokeWidth="1" fill="none" />
      </svg>
    </div>
  );
}
