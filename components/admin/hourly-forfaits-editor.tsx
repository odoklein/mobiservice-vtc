'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Save, X, Plus, Trash2, Pencil, AlertCircle, CheckCircle } from 'lucide-react';

const TVA_RATE = 0.10;

interface PricingRule {
  id?: number;
  ruleType: string;
  serviceType?: string | null;
  timeSlot: 'day' | 'night';
  priceTTC: string;
  forfaitHours?: number | null;
  forfaitMaxKm?: number | null;
  isActive?: boolean;
}

/** One hourly forfait = a day rule + a night rule sharing the same duration. */
interface Forfait {
  hours: number;
  maxKm: number;
  day?: PricingRule;
  night?: PricingRule;
}

interface Draft {
  hours: string;
  maxKm: string;
  day: string;
  night: string;
}

interface HourlyForfaitsEditorProps {
  rules: PricingRule[];
  onChange: () => Promise<void>;
}

const formatHours = (h: number) => {
  const whole = Math.floor(h);
  const minutes = Math.round((h - whole) * 60);
  return minutes > 0 ? `${whole}h${String(minutes).padStart(2, '0')}` : `${whole}h`;
};

const toNumber = (v: string) => Number(v.trim().replace(',', '.'));
const round2 = (n: number) => Math.round(n * 100) / 100;
const formatPrice = (v?: string) => (v ? `${parseFloat(v).toFixed(2)} €` : '-');

const NEW_KEY = 'new';

export function HourlyForfaitsEditor({ rules, onChange }: HourlyForfaitsEditorProps) {
  // null = nothing being edited, NEW_KEY = new forfait, otherwise the hours of the edited forfait
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>({ hours: '', maxKm: '', day: '', night: '' });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const forfaits = useMemo(() => {
    const byHours = new Map<number, Forfait>();
    for (const rule of rules) {
      if (rule.isActive === false || !rule.forfaitHours) continue;
      const hours = Number(rule.forfaitHours);
      const forfait = byHours.get(hours) || { hours, maxKm: rule.forfaitMaxKm || 0 };
      forfait[rule.timeSlot] = rule;
      if (rule.timeSlot === 'day' && rule.forfaitMaxKm) forfait.maxKm = rule.forfaitMaxKm;
      byHours.set(hours, forfait);
    }
    return [...byHours.values()].sort((a, b) => a.hours - b.hours);
  }, [rules]);

  const startAdd = () => {
    const last = forfaits[forfaits.length - 1];
    const hours = last ? last.hours + 1 : 1;
    setDraft({ hours: String(hours), maxKm: String(Math.round(hours * 90)), day: '', night: '' });
    setEditing(NEW_KEY);
    setMessage(null);
  };

  const startEdit = (forfait: Forfait) => {
    setDraft({
      hours: String(forfait.hours),
      maxKm: String(forfait.maxKm || ''),
      day: forfait.day?.priceTTC ?? '',
      night: forfait.night?.priceTTC ?? '',
    });
    setEditing(String(forfait.hours));
    setMessage(null);
  };

  const cancel = () => {
    setEditing(null);
    setMessage(null);
  };

  const validate = (): string | null => {
    const hours = toNumber(draft.hours);
    const maxKm = toNumber(draft.maxKm);
    const day = toNumber(draft.day);
    const night = toNumber(draft.night);
    if (!(hours > 0) || !Number.isInteger(hours * 2)) return 'Durée : par demi-heure (ex. 2 ou 2.5)';
    if (!(maxKm > 0) || !Number.isInteger(maxKm)) return 'Km inclus : nombre entier positif';
    if (!(day > 0)) return 'Prix jour : montant invalide';
    if (!(night > 0)) return 'Prix nuit : montant invalide';
    const clash = forfaits.find((f) => f.hours === hours && String(f.hours) !== editing);
    if (clash) return `Un forfait de ${formatHours(hours)} existe déjà`;
    return null;
  };

  const save = async () => {
    const error = validate();
    if (error) {
      setMessage({ type: 'error', text: error });
      return;
    }

    const hours = toNumber(draft.hours);
    const maxKm = toNumber(draft.maxKm);
    const existing = editing === NEW_KEY ? undefined : forfaits.find((f) => String(f.hours) === editing);

    const buildRule = (timeSlot: 'day' | 'night', priceTTC: number) => ({
      id: existing?.[timeSlot]?.id,
      ruleType: 'forfait',
      serviceType: 'hourly',
      timeSlot,
      priceTTC: round2(priceTTC),
      priceHT: round2(priceTTC / (1 + TVA_RATE)),
      forfaitHours: hours,
      forfaitMaxKm: maxKm,
      hourlyRateTTC: round2(priceTTC / hours),
      description: `Forfait ${formatHours(hours)} / ${maxKm}km (${timeSlot === 'day' ? 'Jour' : 'Nuit'})`,
      isActive: true,
    });

    setSaving(true);
    setMessage(null);
    try {
      const response = await fetch('/api/admin/settings/pricing', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rules: [buildRule('day', toNumber(draft.day)), buildRule('night', toNumber(draft.night))] }),
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.message || "Erreur lors de l'enregistrement");

      await onChange();
      setEditing(null);
      setMessage({ type: 'success', text: existing ? `Forfait ${formatHours(hours)} modifié` : `Forfait ${formatHours(hours)} ajouté` });
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : "Erreur lors de l'enregistrement" });
    } finally {
      setSaving(false);
    }
  };

  const remove = async (forfait: Forfait) => {
    if (!confirm(`Supprimer le forfait ${formatHours(forfait.hours)} (jour et nuit) ? Il ne sera plus proposé à la réservation.`)) {
      return;
    }

    setSaving(true);
    setMessage(null);
    try {
      for (const rule of [forfait.day, forfait.night]) {
        if (!rule?.id) continue;
        const response = await fetch(`/api/admin/settings/pricing/${rule.id}`, { method: 'DELETE' });
        const data = await response.json();
        if (!data.success) throw new Error(data.message || 'Erreur lors de la suppression');
      }
      await onChange();
      setMessage({ type: 'success', text: `Forfait ${formatHours(forfait.hours)} supprimé` });
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Erreur lors de la suppression' });
    } finally {
      setSaving(false);
    }
  };

  const input = (field: keyof Draft, props: { step: string; placeholder: string }) => (
    <input
      type="number"
      min="0"
      value={draft[field]}
      onChange={(e) => setDraft({ ...draft, [field]: e.target.value })}
      className="w-full h-10 px-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5CD85A] focus:border-transparent"
      {...props}
    />
  );

  const editRow = (key: string) => (
    <tr key={key} className="border-b border-gray-100 bg-gray-50">
      <td className="px-4 py-3 text-sm">{input('hours', { step: '0.5', placeholder: 'ex. 2.5' })}</td>
      <td className="px-4 py-3 text-sm">{input('maxKm', { step: '1', placeholder: 'ex. 225' })}</td>
      <td className="px-4 py-3 text-sm">{input('day', { step: '0.01', placeholder: 'Prix TTC' })}</td>
      <td className="px-4 py-3 text-sm">{input('night', { step: '0.01', placeholder: 'Prix TTC' })}</td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <Button onClick={save} disabled={saving} size="sm" className="bg-[#5CD85A] hover:bg-[#4BC449] text-[#0A0A0A] h-8">
            <Save className="h-3 w-3 mr-1" />
            {saving ? '...' : 'Sauver'}
          </Button>
          <Button onClick={cancel} disabled={saving} size="sm" variant="outline" className="h-8">
            <X className="h-3 w-3 mr-1" />
            Annuler
          </Button>
        </div>
      </td>
    </tr>
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-xl font-semibold text-[#0A0A0A]">Forfaits horaires (mise à disposition)</h3>
          <p className="text-sm text-gray-500 mt-1">
            Ces forfaits sont proposés tels quels sur la page de réservation. Prix TTC, HT calculé automatiquement.
          </p>
        </div>
        <Button onClick={startAdd} disabled={saving || editing !== null} size="sm" className="bg-[#5CD85A] hover:bg-[#4BC449] text-[#0A0A0A] h-9">
          <Plus className="h-4 w-4 mr-1" />
          Ajouter un forfait
        </Button>
      </div>

      {message && (
        <div
          className={`p-4 rounded-lg flex items-start gap-3 ${
            message.type === 'success' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          )}
          <p className={`text-sm font-medium ${message.type === 'success' ? 'text-green-900' : 'text-red-900'}`}>
            {message.text}
          </p>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-gray-200">
              {['Durée (h)', 'Km inclus', 'Prix jour TTC (€)', 'Prix nuit TTC (€)', 'Actions'].map((label) => (
                <th key={label} className="px-4 py-3 text-left text-sm font-semibold text-[#0A0A0A] bg-gray-50">
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {forfaits.length === 0 && editing !== NEW_KEY && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                  Aucun forfait : les forfaits par défaut sont appliqués
                </td>
              </tr>
            )}
            {forfaits.map((forfait) =>
              editing === String(forfait.hours) ? (
                editRow(String(forfait.hours))
              ) : (
                <tr key={forfait.hours} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-[#0A0A0A]">{formatHours(forfait.hours)}</td>
                  <td className="px-4 py-3 text-sm text-[#0A0A0A]">{forfait.maxKm ? `${forfait.maxKm} km` : '-'}</td>
                  <td className="px-4 py-3 text-sm text-[#0A0A0A]">{formatPrice(forfait.day?.priceTTC)}</td>
                  <td className="px-4 py-3 text-sm text-[#0A0A0A]">{formatPrice(forfait.night?.priceTTC)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Button onClick={() => startEdit(forfait)} disabled={saving || editing !== null} size="sm" variant="outline" className="h-8">
                        <Pencil className="h-3 w-3 mr-1" />
                        Modifier
                      </Button>
                      <Button
                        onClick={() => remove(forfait)}
                        disabled={saving || editing !== null}
                        size="sm"
                        variant="outline"
                        className="h-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Supprimer
                      </Button>
                    </div>
                  </td>
                </tr>
              )
            )}
            {editing === NEW_KEY && editRow(NEW_KEY)}
          </tbody>
        </table>
      </div>
    </div>
  );
}
