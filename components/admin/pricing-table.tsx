'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Save, X, AlertCircle, CheckCircle } from 'lucide-react';

const TVA_RATE = 0.10;

interface PricingRule {
  id?: number;
  ruleType: string;
  serviceType?: string | null;
  timeSlot: 'day' | 'night';
  priceHT: string;
  priceTTC: string;
  forfaitHours?: number | null;
  forfaitMaxKm?: number | null;
  hourlyRateTTC?: string | null;
  zoneType?: string | null;
  maxKm?: number | null;
  perKm?: string | null;
  perMinute?: string | null;
  perHour?: string | null;
  minPrice?: string | null;
  description?: string | null;
  isActive?: boolean;
}

interface PricingTableProps {
  rules: PricingRule[];
  columns: Array<{
    key: string;
    label: string;
    editable?: boolean;
    type?: 'text' | 'number' | 'select';
    options?: Array<{ value: string; label: string }>;
    format?: (value: any) => string;
  }>;
  onSave: (rule: PricingRule) => Promise<void>;
  title?: string;
}

export function PricingTable({ rules, columns, onSave, title }: PricingTableProps) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editedRule, setEditedRule] = useState<PricingRule | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleEdit = (rule: PricingRule) => {
    setEditingId(rule.id || null);
    setEditedRule({ ...rule });
    setMessage(null);
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditedRule(null);
    setMessage(null);
  };

  const handleFieldChange = (field: keyof PricingRule, value: any) => {
    if (!editedRule) return;

    const updated = { ...editedRule, [field]: value };

    // Auto-calculate HT/TTC when one changes
    if (field === 'priceTTC') {
      const ttc = parseFloat(value) || 0;
      const ht = Math.round((ttc / (1 + TVA_RATE)) * 100) / 100;
      updated.priceHT = ht.toString();
    } else if (field === 'priceHT') {
      const ht = parseFloat(value) || 0;
      const ttc = Math.round(ht * (1 + TVA_RATE) * 100) / 100;
      updated.priceTTC = ttc.toString();
    }

    setEditedRule(updated);
  };

  const handleSave = async () => {
    if (!editedRule) return;

    setSaving(true);
    setMessage(null);

    try {
      await onSave(editedRule);
      setEditingId(null);
      setEditedRule(null);
      setMessage({ type: 'success', text: 'Modifications enregistrées' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Erreur lors de l\'enregistrement',
      });
    } finally {
      setSaving(false);
    }
  };

  const isDirty = editingId !== null && editedRule !== null;

  return (
    <div className="space-y-4">
      {title && (
        <div>
          <h3 className="text-xl font-semibold text-[#0A0A0A]">{title}</h3>
        </div>
      )}

      {message && (
        <div
          className={`p-4 rounded-lg flex items-start gap-3 ${
            message.type === 'success'
              ? 'bg-green-50 border border-green-200'
              : 'bg-red-50 border border-red-200'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          )}
          <div>
            <p
              className={`font-medium ${
                message.type === 'success' ? 'text-green-900' : 'text-red-900'
              }`}
            >
              {message.type === 'success' ? 'Succès' : 'Erreur'}
            </p>
            <p
              className={`text-sm mt-1 ${
                message.type === 'success' ? 'text-green-700' : 'text-red-700'
              }`}
            >
              {message.text}
            </p>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-gray-200">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="px-4 py-3 text-left text-sm font-semibold text-[#0A0A0A] bg-gray-50"
                >
                  {col.label}
                </th>
              ))}
              <th className="px-4 py-3 text-left text-sm font-semibold text-[#0A0A0A] bg-gray-50">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {rules.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 1} className="px-4 py-8 text-center text-gray-500">
                  Aucune règle trouvée
                </td>
              </tr>
            ) : (
              rules.map((rule) => {
                const isEditing = editingId === rule.id;
                const currentRule = isEditing && editedRule ? editedRule : rule;

                return (
                  <tr key={rule.id} className="border-b border-gray-100 hover:bg-gray-50">
                    {columns.map((col) => {
                      const value = currentRule[col.key as keyof PricingRule];
                      const displayValue = col.format ? col.format(value) : value;

                      return (
                        <td key={col.key} className="px-4 py-3 text-sm">
                          {isEditing && col.editable !== false ? (
                            col.type === 'select' && col.options ? (
                              <select
                                value={String(value || '')}
                                onChange={(e) => handleFieldChange(col.key as keyof PricingRule, e.target.value)}
                                className="w-full h-10 px-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5CD85A] focus:border-transparent"
                              >
                                {col.options.map((opt) => (
                                  <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <input
                                type={col.type || 'text'}
                                value={String(value || '')}
                                onChange={(e) =>
                                  handleFieldChange(
                                    col.key as keyof PricingRule,
                                    col.type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value
                                  )
                                }
                                className="w-full h-10 px-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5CD85A] focus:border-transparent"
                                step={col.type === 'number' ? '0.01' : undefined}
                              />
                            )
                          ) : (
                            <span className="text-[#0A0A0A]">{displayValue || '-'}</span>
                          )}
                        </td>
                      );
                    })}
                    <td className="px-4 py-3">
                      {isEditing ? (
                        <div className="flex items-center gap-2">
                          <Button
                            onClick={handleSave}
                            disabled={saving}
                            size="sm"
                            className="bg-[#5CD85A] hover:bg-[#4BC449] text-[#0A0A0A] h-8"
                          >
                            <Save className="h-3 w-3 mr-1" />
                            {saving ? '...' : 'Sauver'}
                          </Button>
                          <Button
                            onClick={handleCancel}
                            disabled={saving}
                            size="sm"
                            variant="outline"
                            className="h-8"
                          >
                            <X className="h-3 w-3 mr-1" />
                            Annuler
                          </Button>
                        </div>
                      ) : (
                        <Button
                          onClick={() => handleEdit(rule)}
                          size="sm"
                          variant="outline"
                          className="h-8"
                        >
                          Modifier
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

