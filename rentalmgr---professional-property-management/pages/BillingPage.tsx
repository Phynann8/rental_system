import React, { useEffect, useState, useCallback } from 'react';
import { api } from '../services/api';

interface PlanDefinition {
  name: string;
  price: number;
  maxBuildings: number;
  maxRooms: number;
  maxTenants: number;
  pdfExport: boolean;
  aiInsights: boolean;
}

interface PlanOption {
  tier: string;
  name: string;
  price: number;
  maxBuildings: string;
  maxRooms: string;
  maxTenants: string;
  pdfExport: boolean;
  aiInsights: boolean;
}

interface BillingOverview {
  currentPlan: string;
  tier: string;
  status: string;
  monthlyPrice: number;
  startDate: string;
  trialEndsAt: string | null;
  nextBillingDate: string | null;
  isTrialing: boolean;
  daysLeftInTrial: number;
  availablePlans: PlanOption[];
  currentPlanLimits: PlanDefinition;
}

interface BillingTransaction {
  id: number;
  type: string;
  status: string;
  amount: number;
  description: string;
  cardLast4: string | null;
  gatewayReference: string | null;
  failureReason: string | null;
  createdAtUtc: string;
}

const tierOrder = ['Free', 'Basic', 'Pro', 'Enterprise'];
const tierColors: Record<string, string> = {
  Free: 'bg-gray-100 text-gray-700 border-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600',
  Basic: 'bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700',
  Pro: 'bg-primary/10 text-primary border-primary/40',
  Enterprise: 'bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700',
};
const tierAccent: Record<string, string> = {
  Free: 'from-gray-400 to-gray-500',
  Basic: 'from-blue-500 to-blue-600',
  Pro: 'from-primary to-primary-dark',
  Enterprise: 'from-amber-500 to-amber-600',
};

const statusBadge: Record<string, string> = {
  Active: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  PastDue: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  Canceled: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400',
  Trialing: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
};

const txnStatusStyle: Record<string, string> = {
  Succeeded: 'text-green-600 dark:text-green-400',
  Failed: 'text-red-600 dark:text-red-400',
  Pending: 'text-amber-600 dark:text-amber-400',
  Refunded: 'text-blue-600 dark:text-blue-400',
};

const TEST_CARDS = [
  { number: '4242 4242 4242 4242', label: 'Success (Visa)', outcome: 'Always succeeds' },
  { number: '4000 0000 0000 0002', label: 'Decline', outcome: 'Card declined' },
  { number: '4000 0000 0000 9995', label: 'Insufficient Funds', outcome: 'NSF decline' },
  { number: '4000 0000 0000 0069', label: 'Expired Card', outcome: 'Card expired' },
];

const BillingPage: React.FC = () => {
  const [overview, setOverview] = useState<BillingOverview | null>(null);
  const [history, setHistory] = useState<BillingTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedCard, setSelectedCard] = useState(TEST_CARDS[0].number);
  const [customCard, setCustomCard] = useState('');
  const [useCustomCard, setUseCustomCard] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [targetPlan, setTargetPlan] = useState<PlanOption | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [ov, hist] = await Promise.all([
        api.getBillingOverview(),
        api.getBillingHistory(),
      ]);
      setOverview(ov);
      setHistory(hist);
    } catch (err) {
      console.error('Failed to load billing data', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void fetchData(); }, [fetchData]);

  const getCardNumber = () => {
    const raw = useCustomCard ? customCard : selectedCard;
    return raw.replace(/\s+/g, '');
  };

  const handleChangePlan = async (plan: PlanOption) => {
    setActionLoading(true);
    setFeedback(null);
    try {
      await api.changeBillingPlan(plan.tier, getCardNumber());
      setFeedback({ type: 'success', message: `Successfully switched to ${plan.name}!` });
      setShowPlanModal(false);
      await fetchData();
    } catch (err) {
      setFeedback({ type: 'error', message: err instanceof Error ? err.message : 'Plan change failed.' });
    } finally {
      setActionLoading(false);
    }
  };

  const handlePayNow = async () => {
    setActionLoading(true);
    setFeedback(null);
    try {
      await api.simulateBillingPayment(getCardNumber());
      setFeedback({ type: 'success', message: 'Payment processed successfully!' });
      await fetchData();
    } catch (err) {
      setFeedback({ type: 'error', message: err instanceof Error ? err.message : 'Payment failed.' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel your subscription? You will lose access to paid features.')) return;
    setActionLoading(true);
    setFeedback(null);
    try {
      await api.cancelBillingSubscription();
      setFeedback({ type: 'success', message: 'Subscription has been canceled.' });
      await fetchData();
    } catch (err) {
      setFeedback({ type: 'error', message: err instanceof Error ? err.message : 'Cancellation failed.' });
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white px-6 py-4 dark:border-gray-700 dark:bg-gray-800 shadow-xl">
          <span className="material-symbols-outlined animate-spin text-primary">progress_activity</span>
          <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Loading billing...</span>
        </div>
      </div>
    );
  }

  if (!overview) return null;

  const currentTierIdx = tierOrder.indexOf(overview.currentPlan);

  return (
    <div className="space-y-8 p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Feedback Banner */}
      {feedback && (
        <div className={`rounded-xl border px-5 py-4 text-sm font-medium flex items-center gap-3 animate-in fade-in shadow-sm ${
          feedback.type === 'success'
            ? 'bg-green-50 border-green-200 text-green-700 dark:bg-green-900/20 dark:border-green-700 dark:text-green-400'
            : 'bg-red-50 border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-700 dark:text-red-400'
        }`}>
          <span className="material-symbols-outlined text-lg">
            {feedback.type === 'success' ? 'check_circle' : 'error'}
          </span>
          {feedback.message}
          <button onClick={() => setFeedback(null)} className="ml-auto opacity-60 hover:opacity-100">
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        </div>
      )}

      {/* Current Plan Card */}
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-surface-dark shadow-lg overflow-hidden">
        <div className={`h-2 bg-gradient-to-r ${tierAccent[overview.currentPlan] ?? tierAccent.Free}`} />
        <div className="p-6 lg:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-2xl font-black text-gray-900 dark:text-white">
                  {overview.currentPlan} Plan
                </h2>
                <span className={`rounded-full px-3 py-1 text-xs font-bold ${statusBadge[overview.status] ?? statusBadge.Active}`}>
                  {overview.isTrialing ? `Trial (${overview.daysLeftInTrial}d left)` : overview.status}
                </span>
              </div>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                {overview.monthlyPrice > 0
                  ? <><span className="text-3xl font-black text-gray-900 dark:text-white">${overview.monthlyPrice}</span>{' '}<span className="text-gray-400">/month</span></>
                  : <span className="text-3xl font-black text-gray-900 dark:text-white">Free</span>
                }
              </p>
            </div>
            <div className="flex items-center gap-3">
              {overview.monthlyPrice > 0 && overview.status !== 'Canceled' && (
                <button
                  onClick={handlePayNow}
                  disabled={actionLoading}
                  className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-primary/20 transition hover:bg-primary-dark active:scale-95 disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-lg">credit_card</span>
                  Pay Now
                </button>
              )}
              {overview.status !== 'Canceled' && (
                <button
                  onClick={handleCancel}
                  disabled={actionLoading}
                  className="rounded-xl border border-red-200 px-4 py-2.5 text-sm font-bold text-red-600 hover:bg-red-50 transition dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20 disabled:opacity-50"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>

          {/* Plan Limits */}
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-5 gap-4">
            {[
              { label: 'Buildings', value: overview.currentPlanLimits.maxBuildings === -1 ? '∞' : overview.currentPlanLimits.maxBuildings, icon: 'domain' },
              { label: 'Rooms', value: overview.currentPlanLimits.maxRooms === -1 ? '∞' : overview.currentPlanLimits.maxRooms, icon: 'grid_view' },
              { label: 'Tenants', value: overview.currentPlanLimits.maxTenants === -1 ? '∞' : overview.currentPlanLimits.maxTenants, icon: 'group' },
              { label: 'PDF Export', value: overview.currentPlanLimits.pdfExport ? '✓' : '✗', icon: 'picture_as_pdf' },
              { label: 'AI Insights', value: overview.currentPlanLimits.aiInsights ? '✓' : '✗', icon: 'auto_awesome' },
            ].map((item) => (
              <div key={item.label} className="rounded-xl border border-gray-100 bg-gray-50 p-4 text-center dark:border-gray-700 dark:bg-gray-800/50">
                <span className="material-symbols-outlined text-primary mb-1 block">{item.icon}</span>
                <div className="text-xl font-black text-gray-900 dark:text-white">{item.value}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">{item.label}</div>
              </div>
            ))}
          </div>

          {/* Billing Dates */}
          <div className="mt-6 flex flex-wrap gap-6 text-sm text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-base">calendar_today</span>
              Started: {new Date(overview.startDate).toLocaleDateString()}
            </div>
            {overview.trialEndsAt && (
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-base">hourglass_top</span>
                Trial ends: {new Date(overview.trialEndsAt).toLocaleDateString()}
              </div>
            )}
            {overview.nextBillingDate && (
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-base">event_upcoming</span>
                Next billing: {new Date(overview.nextBillingDate).toLocaleDateString()}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Test Card Selector */}
      <div className="rounded-2xl border border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-900/10 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/40">
            <span className="material-symbols-outlined text-blue-600 dark:text-blue-400">science</span>
          </div>
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white">Mock Payment Gateway</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">Select a test card to simulate payment outcomes. No real charges.</p>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {TEST_CARDS.map((card) => (
            <button
              key={card.number}
              onClick={() => { setSelectedCard(card.number); setUseCustomCard(false); }}
              className={`rounded-xl border p-3 text-left transition-all ${
                !useCustomCard && selectedCard === card.number
                  ? 'border-primary bg-primary/5 ring-2 ring-primary/20 shadow-md'
                  : 'border-gray-200 bg-white hover:border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-gray-600'
              }`}
            >
              <div className="font-mono text-sm font-bold text-gray-900 dark:text-white">{card.number}</div>
              <div className="flex items-center justify-between mt-1">
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">{card.label}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  card.outcome === 'Always succeeds' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                }`}>{card.outcome}</span>
              </div>
            </button>
          ))}
        </div>
        <div className="mt-4 flex items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={useCustomCard}
              onChange={(e) => setUseCustomCard(e.target.checked)}
              className="rounded border-gray-300 text-primary focus:ring-primary"
            />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Custom card</span>
          </label>
          {useCustomCard && (
            <input
              className="flex-1 h-10 max-w-xs rounded-xl border border-gray-200 bg-white px-4 font-mono text-sm outline-none focus:border-primary dark:border-gray-700 dark:bg-gray-800"
              placeholder="Enter card number..."
              value={customCard}
              onChange={(e) => setCustomCard(e.target.value)}
            />
          )}
        </div>
      </div>

      {/* Available Plans Grid */}
      <div>
        <h3 className="text-xl font-black text-gray-900 dark:text-white mb-4">Available Plans</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {overview.availablePlans.map((plan) => {
            const isCurrent = plan.name === overview.currentPlan;
            const planIdx = tierOrder.indexOf(plan.name);
            const isUpgrade = planIdx > currentTierIdx;
            return (
              <div
                key={plan.tier}
                className={`relative rounded-2xl border p-6 transition-all ${
                  isCurrent
                    ? `${tierColors[plan.name]} ring-2 ring-primary/30 shadow-lg`
                    : 'border-gray-200 bg-white hover:shadow-lg hover:-translate-y-0.5 dark:border-gray-700 dark:bg-surface-dark'
                }`}
              >
                {plan.name === 'Pro' && !isCurrent && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-0.5 text-[10px] font-black text-white shadow-lg">
                    POPULAR
                  </div>
                )}
                <h4 className="text-lg font-black text-gray-900 dark:text-white">{plan.name}</h4>
                <div className="mt-2 mb-4">
                  {plan.price > 0
                    ? <><span className="text-3xl font-black text-gray-900 dark:text-white">${plan.price}</span><span className="text-gray-400 text-sm">/mo</span></>
                    : <span className="text-3xl font-black text-gray-900 dark:text-white">Free</span>
                  }
                </div>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400 mb-6">
                  <li className="flex items-center gap-2"><span className="material-symbols-outlined text-base text-primary">domain</span> {plan.maxBuildings} buildings</li>
                  <li className="flex items-center gap-2"><span className="material-symbols-outlined text-base text-primary">grid_view</span> {plan.maxRooms} rooms</li>
                  <li className="flex items-center gap-2"><span className="material-symbols-outlined text-base text-primary">group</span> {plan.maxTenants} tenants</li>
                  <li className="flex items-center gap-2">
                    <span className={`material-symbols-outlined text-base ${plan.pdfExport ? 'text-green-500' : 'text-gray-300'}`}>
                      {plan.pdfExport ? 'check_circle' : 'cancel'}
                    </span>
                    PDF Export
                  </li>
                  <li className="flex items-center gap-2">
                    <span className={`material-symbols-outlined text-base ${plan.aiInsights ? 'text-green-500' : 'text-gray-300'}`}>
                      {plan.aiInsights ? 'check_circle' : 'cancel'}
                    </span>
                    AI Insights
                  </li>
                </ul>
                {isCurrent ? (
                  <div className="text-center text-sm font-bold text-primary">Current Plan</div>
                ) : (
                  <button
                    onClick={() => { setTargetPlan(plan); setShowPlanModal(true); }}
                    disabled={actionLoading}
                    className={`w-full rounded-xl py-2.5 text-sm font-bold transition active:scale-95 disabled:opacity-50 ${
                      isUpgrade
                        ? 'bg-primary text-white shadow-lg shadow-primary/20 hover:bg-primary-dark'
                        : 'border border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800'
                    }`}
                  >
                    {isUpgrade ? 'Upgrade' : 'Downgrade'}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Transaction History */}
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-surface-dark shadow-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Transaction History</h3>
          <span className="text-xs font-medium text-gray-400">{history.length} transactions</span>
        </div>
        {history.length === 0 ? (
          <div className="p-12 text-center text-gray-400 dark:text-gray-500">
            <span className="material-symbols-outlined text-4xl mb-2 block">receipt_long</span>
            No transactions yet.
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {history.map((txn) => (
              <div key={txn.id} className="flex items-center justify-between px-6 py-4 hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition">
                <div className="flex items-center gap-4 min-w-0">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                    txn.status === 'Succeeded' ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'
                  }`}>
                    <span className={`material-symbols-outlined text-lg ${
                      txn.status === 'Succeeded' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                    }`}>
                      {txn.status === 'Succeeded' ? 'check_circle' : 'cancel'}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <div className="font-medium text-gray-900 dark:text-white truncate">{txn.description}</div>
                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                      <span>{new Date(txn.createdAtUtc).toLocaleDateString()}</span>
                      {txn.cardLast4 && <span>•••• {txn.cardLast4}</span>}
                      {txn.gatewayReference && <span className="font-mono text-[10px] opacity-50">{txn.gatewayReference}</span>}
                    </div>
                    {txn.failureReason && (
                      <div className="text-xs text-red-500 mt-0.5">{txn.failureReason}</div>
                    )}
                  </div>
                </div>
                <div className="text-right shrink-0 ml-4">
                  <div className={`font-bold ${txnStatusStyle[txn.status] ?? 'text-gray-900'}`}>
                    {txn.amount > 0 ? `$${txn.amount.toFixed(2)}` : 'Free'}
                  </div>
                  <div className={`text-[10px] font-bold uppercase ${txnStatusStyle[txn.status]}`}>{txn.status}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Plan Change Confirmation Modal */}
      {showPlanModal && targetPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setShowPlanModal(false)}>
          <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 shadow-2xl dark:border-gray-700 dark:bg-surface-dark" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2">
              Switch to {targetPlan.name}?
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              {targetPlan.price > 0
                ? `You will be charged $${targetPlan.price}/month using the selected test card.`
                : 'You will be downgraded to the free tier. Paid features will be disabled.'
              }
            </p>
            {targetPlan.price > 0 && (
              <div className="mb-6 rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
                <div className="text-xs font-bold text-gray-500 mb-1">Payment Card</div>
                <div className="font-mono text-sm text-gray-900 dark:text-white">
                  {useCustomCard ? customCard || 'No card entered' : selectedCard}
                </div>
              </div>
            )}
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowPlanModal(false)}
                className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={() => void handleChangePlan(targetPlan)}
                disabled={actionLoading}
                className="rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-primary/20 hover:bg-primary-dark transition active:scale-95 disabled:opacity-50"
              >
                {actionLoading ? 'Processing...' : `Confirm ${tierOrder.indexOf(targetPlan.name) > currentTierIdx ? 'Upgrade' : 'Downgrade'}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BillingPage;
