'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PricingTable } from '@/components/admin/pricing-table';
import { AdminPageHeader, AdminPageContainer } from '@/components/admin/admin-components';
import { DollarSign, RefreshCw, Loader2, AlertCircle } from 'lucide-react';

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

type TabType = 'forfaits' | 'day-rates' | 'night-rates' | 'agglomeration' | 'airports' | 'mda' | 'other';

export default function PricingSettingsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('forfaits');
  const [rules, setRules] = useState<PricingRule[]>([]);
  const [grouped, setGrouped] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadPricingRules();
  }, []);

  const loadPricingRules = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/settings/pricing');
      const data = await response.json();
      if (data.success) {
        setRules(data.rules);
        setGrouped(data.grouped);
      }
    } catch (error) {
      console.error('Error loading pricing rules:', error);
      setMessage({ type: 'error', text: 'Erreur lors du chargement des tarifs' });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveRule = async (rule: PricingRule) => {
    setSaving(true);
    try {
      if (rule.id) {
        // Update existing
        const response = await fetch(`/api/admin/settings/pricing/${rule.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(rule),
        });

        const data = await response.json();
        if (!data.success) {
          throw new Error(data.message || 'Erreur lors de la mise à jour');
        }
      } else {
        // Create new
        const response = await fetch('/api/admin/settings/pricing', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ rules: [rule] }),
        });

        const data = await response.json();
        if (!data.success) {
          throw new Error(data.message || 'Erreur lors de la création');
        }
      }

      // Reload rules
      await loadPricingRules();
    } catch (error) {
      throw error;
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!confirm('Êtes-vous sûr de vouloir réinitialiser tous les tarifs aux valeurs par défaut ?')) {
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/admin/settings/pricing/reset?action=reset', {
        method: 'POST',
      });

      const data = await response.json();
      if (data.success) {
        setMessage({ type: 'success', text: 'Tarification réinitialisée avec succès' });
        await loadPricingRules();
      } else {
        throw new Error(data.message || 'Erreur lors de la réinitialisation');
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Erreur lors de la réinitialisation',
      });
    } finally {
      setSaving(false);
    }
  };

  const tabs: Array<{ id: TabType; label: string }> = [
    { id: 'forfaits', label: 'Forfaits' },
    { id: 'day-rates', label: 'Tarifs Jour' },
    { id: 'night-rates', label: 'Tarifs Nuit' },
    { id: 'agglomeration', label: 'Forfait Agglo' },
    { id: 'airports', label: 'Aéroports' },
    { id: 'mda', label: 'MDA' },
    { id: 'other', label: 'Divers' },
  ];

  const renderTabContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-slate-500" />
        </div>
      );
    }

    switch (activeTab) {
      case 'forfaits':
        return (
          <PricingTable
            rules={grouped.forfaits || []}
            columns={[
              { key: 'forfaitHours', label: 'Heures', editable: true, type: 'number' },
              { key: 'forfaitMaxKm', label: 'Max Km', editable: true, type: 'number' },
              {
                key: 'timeSlot',
                label: 'Période',
                editable: true,
                type: 'select',
                options: [
                  { value: 'day', label: 'Jour' },
                  { value: 'night', label: 'Nuit' },
                ],
              },
              {
                key: 'priceTTC',
                label: 'Prix TTC (€)',
                editable: true,
                type: 'number',
                format: (v) => (v ? parseFloat(v).toFixed(2) : '0.00'),
              },
              {
                key: 'priceHT',
                label: 'Prix HT (€)',
                editable: true,
                type: 'number',
                format: (v) => (v ? parseFloat(v).toFixed(2) : '0.00'),
              },
              { key: 'description', label: 'Description', editable: true },
            ]}
            onSave={handleSaveRule}
            title="Forfaits horaires"
          />
        );

      case 'day-rates':
        return (
          <div className="space-y-6">
            <PricingTable
              rules={(grouped.perKm || []).filter((r: PricingRule) => r.timeSlot === 'day' && r.zoneType === 'tp')}
              columns={[
                {
                  key: 'priceTTC',
                  label: 'Prix TTC/km (€)',
                  editable: true,
                  type: 'number',
                  format: (v) => (v ? parseFloat(v).toFixed(2) : '0.00'),
                },
                { key: 'description', label: 'Description', editable: true },
              ]}
              onSave={handleSaveRule}
              title="Tarif TP (Jour) - Prix constant"
            />

            <PricingTable
              rules={(grouped.perKm || []).filter((r: PricingRule) => r.timeSlot === 'day' && r.zoneType === 'ca')}
              columns={[
                {
                  key: 'maxKm',
                  label: 'Tranche (km)',
                  editable: true,
                  type: 'number',
                },
                {
                  key: 'priceTTC',
                  label: 'Prix TTC/km (€)',
                  editable: true,
                  type: 'number',
                  format: (v) => (v ? parseFloat(v).toFixed(2) : '0.00'),
                },
                { key: 'description', label: 'Description', editable: true },
              ]}
              onSave={handleSaveRule}
              title="Tarifs CA (Jour) - Paliers progressifs"
            />
          </div>
        );

      case 'night-rates':
        return (
          <div className="space-y-6">
            <PricingTable
              rules={(grouped.perKm || []).filter((r: PricingRule) => r.timeSlot === 'night' && r.zoneType === 'tp')}
              columns={[
                {
                  key: 'priceTTC',
                  label: 'Prix TTC/km (€)',
                  editable: true,
                  type: 'number',
                  format: (v) => (v ? parseFloat(v).toFixed(2) : '0.00'),
                },
                { key: 'description', label: 'Description', editable: true },
              ]}
              onSave={handleSaveRule}
              title="Tarif TP (Nuit) - Prix constant"
            />

            <PricingTable
              rules={(grouped.perKm || []).filter((r: PricingRule) => r.timeSlot === 'night' && r.zoneType === 'ca')}
              columns={[
                {
                  key: 'maxKm',
                  label: 'Tranche (km)',
                  editable: true,
                  type: 'number',
                },
                {
                  key: 'priceTTC',
                  label: 'Prix TTC/km (€)',
                  editable: true,
                  type: 'number',
                  format: (v) => (v ? parseFloat(v).toFixed(2) : '0.00'),
                },
                { key: 'description', label: 'Description', editable: true },
              ]}
              onSave={handleSaveRule}
              title="Tarifs CA (Nuit) - Paliers progressifs"
            />
          </div>
        );

      case 'agglomeration':
        return (
          <PricingTable
            rules={grouped.agglomeration || []}
            columns={[
              {
                key: 'timeSlot',
                label: 'Période',
                editable: true,
                type: 'select',
                options: [
                  { value: 'day', label: 'Jour' },
                  { value: 'night', label: 'Nuit' },
                ],
              },
              {
                key: 'priceTTC',
                label: 'Prix TTC (€)',
                editable: true,
                type: 'number',
                format: (v) => (v ? parseFloat(v).toFixed(2) : '0.00'),
              },
              {
                key: 'maxKm',
                label: 'Max Km',
                editable: true,
                type: 'number',
              },
              { key: 'description', label: 'Description', editable: true },
            ]}
            onSave={handleSaveRule}
            title="Forfait agglomération (≤25km A/R)"
          />
        );

      case 'airports':
        return (
          <PricingTable
            rules={grouped.airports || []}
            columns={[
              {
                key: 'timeSlot',
                label: 'Période',
                editable: true,
                type: 'select',
                options: [
                  { value: 'day', label: 'Jour' },
                  { value: 'night', label: 'Nuit' },
                ],
              },
              {
                key: 'priceTTC',
                label: 'Prix TTC (€)',
                editable: true,
                type: 'number',
                format: (v) => (v ? parseFloat(v).toFixed(2) : '0.00'),
              },
              { key: 'description', label: 'Aéroport', editable: true },
            ]}
            onSave={handleSaveRule}
            title="Tarifs aéroports"
          />
        );

      case 'mda':
        return (
          <PricingTable
            rules={grouped.mda || []}
            columns={[
              {
                key: 'timeSlot',
                label: 'Période',
                editable: true,
                type: 'select',
                options: [
                  { value: 'day', label: 'Jour' },
                  { value: 'night', label: 'Nuit' },
                ],
              },
              {
                key: 'perMinute',
                label: 'Prix/minute TTC (€)',
                editable: true,
                type: 'number',
                format: (v) => (v ? parseFloat(v).toFixed(2) : '0.00'),
              },
              { key: 'description', label: 'Description', editable: true },
            ]}
            onSave={handleSaveRule}
            title="Mise à disposition (MDA) - Par minute après 10 min gratuites"
          />
        );

      case 'other':
        return (
          <div className="space-y-6">
            <PricingTable
              rules={grouped.extraHour || []}
              columns={[
                {
                  key: 'timeSlot',
                  label: 'Période',
                  editable: true,
                  type: 'select',
                  options: [
                    { value: 'day', label: 'Jour' },
                    { value: 'night', label: 'Nuit' },
                  ],
                },
                {
                  key: 'priceTTC',
                  label: 'Prix TTC (€)',
                  editable: true,
                  type: 'number',
                  format: (v) => (v ? parseFloat(v).toFixed(2) : '0.00'),
                },
                { key: 'description', label: 'Description', editable: true },
              ]}
              onSave={handleSaveRule}
              title="Heure supplémentaire"
            />

            <PricingTable
              rules={grouped.minPrice || []}
              columns={[
                {
                  key: 'priceTTC',
                  label: 'Prix minimum TTC (€)',
                  editable: true,
                  type: 'number',
                  format: (v) => (v ? parseFloat(v).toFixed(2) : '0.00'),
                },
                { key: 'description', label: 'Description', editable: true },
              ]}
              onSave={handleSaveRule}
              title="Prix minimum"
            />
          </div>
        );

      default:
        return <div>Onglet non reconnu</div>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <AdminPageHeader
        title="Gestion de la tarification"
        description="Configurez tous les tarifs et forfaits"
        actions={
          <>
            <Button
              onClick={loadPricingRules}
              disabled={loading}
              variant="admin-outline"
              size="admin"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Actualiser
            </Button>
            <Button
              onClick={handleReset}
              disabled={saving}
              variant="admin-danger"
              size="admin"
            >
              <AlertCircle className="h-4 w-4" />
              Réinitialiser
            </Button>
          </>
        }
      />

      <AdminPageContainer>
        {message && (
          <div
            className={`p-4 rounded-lg flex items-start gap-3 ${message.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200'
              : 'bg-red-50 border border-red-200'
              }`}
          >
            <AlertCircle
              className={`h-5 w-5 flex-shrink-0 mt-0.5 ${message.type === 'success' ? 'text-emerald-600' : 'text-red-600'
                }`}
            />
            <p
              className={`font-medium ${message.type === 'success' ? 'text-emerald-900' : 'text-red-900'
                }`}
            >
              {message.text}
            </p>
          </div>
        )}

        <Card className="border-0 shadow-md bg-white">
          <CardHeader className="border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-emerald-50">
                <DollarSign className="h-5 w-5 text-emerald-600" />
              </div>
              <CardTitle className="text-lg font-bold text-slate-900">Configuration des tarifs</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {/* Tabs */}
            <div className="border-b border-slate-200 mb-6">
              <nav className="flex space-x-1 flex-wrap">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.id
                      ? 'border-slate-800 text-slate-900'
                      : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                      }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>

            {/* Tab Content */}
            <div className="min-h-[400px]">{renderTabContent()}</div>
          </CardContent>
        </Card>
      </AdminPageContainer>
    </div>
  );
}
