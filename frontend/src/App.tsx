import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import axios from 'axios'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { TrendingUp, ShieldAlert, DollarSign, Activity, Plus, Trash2, RefreshCw } from 'lucide-react'

interface Metrics {
  total_value: number
  daily_var: number
  sharpe_ratio: number
  max_drawdown: number
  asset_allocation: { asset: string; percentage: number }[]
}

interface Holding {
  ticker: string
  weight: number
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899']

export default function App() {
  const [metrics, setMetrics] = useState<Metrics | null>(null)
  const [holdings, setHoldings] = useState<Holding[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [metricsRes, holdingsRes] = await Promise.all([
        axios.get('http://localhost:8000/api/portfolio/metrics'),
        axios.get('http://localhost:8000/api/portfolio/holdings')
      ])
      setMetrics(metricsRes.data)
      setHoldings(holdingsRes.data.map((h: Holding) => ({ ticker: h.ticker, weight: h.weight })))
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to connect to backend server.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleHoldingChange = (index: number, field: keyof Holding, value: string) => {
    const updated = [...holdings]
    if (field === 'weight') {
      updated[index].weight = parseFloat(value) || 0
    } else {
      updated[index].ticker = value.toUpperCase()
    }
    setHoldings(updated)
  }

  const addHolding = () => {
    setHoldings([...holdings, { ticker: '', weight: 0 }])
  }

  const removeHolding = (index: number) => {
    setHoldings(holdings.filter((_, i) => i !== index))
  }

  const handleUpdatePortfolio = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    try {
      await axios.post('http://localhost:8000/api/portfolio/holdings', holdings)
      await fetchData()
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to update holdings. Ensure weights sum to 1.0 (100%).')
    }
  }

  if (loading && !metrics) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-900 text-gray-400">
        Loading portfolio risk analytics...
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <header className="mb-8 border-b border-gray-800 pb-4 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Enterprise Portfolio Risk Analytics</h1>
          <p className="text-sm text-gray-400 mt-1">Real-time risk metrics backed by SQLite/SQLAlchemy & yfinance</p>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-sm px-4 py-2 rounded-lg border border-gray-700 transition"
        >
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </header>

      {error && (
        <div className="mb-6 p-4 bg-red-900/50 border border-red-700 rounded-xl text-red-200 text-sm">
          {error}
        </div>
      )}

      {/* KPI Cards Grid */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 flex items-center space-x-4">
            <DollarSign className="w-10 h-10 text-green-400" />
            <div>
              <p className="text-gray-400 text-xs font-medium uppercase tracking-wider">Total Value</p>
              <p className="text-2xl font-bold">${metrics.total_value.toLocaleString()}</p>
            </div>
          </div>

          <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 flex items-center space-x-4">
            <ShieldAlert className="w-10 h-10 text-red-400" />
            <div>
              <p className="text-gray-400 text-xs font-medium uppercase tracking-wider">Daily VaR (95%)</p>
              <p className="text-2xl font-bold">${metrics.daily_var.toLocaleString()}</p>
            </div>
          </div>

          <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 flex items-center space-x-4">
            <TrendingUp className="w-10 h-10 text-blue-400" />
            <div>
              <p className="text-gray-400 text-xs font-medium uppercase tracking-wider">Sharpe Ratio</p>
              <p className="text-2xl font-bold">{metrics.sharpe_ratio}</p>
            </div>
          </div>

          <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 flex items-center space-x-4">
            <Activity className="w-10 h-10 text-amber-400" />
            <div>
              <p className="text-gray-400 text-xs font-medium uppercase tracking-wider">Max Drawdown</p>
              <p className="text-2xl font-bold">{(metrics.max_drawdown * 100).toFixed(2)}%</p>
            </div>
          </div>
        </div>
      )}

      {/* Grid Layout for Allocation and Editor */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Asset Allocation Chart */}
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
          <h2 className="text-xl font-bold mb-4">Asset Allocation Breakdown</h2>
          {metrics && (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={metrics.asset_allocation}
                    dataKey="percentage"
                    nameKey="asset"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={(entry: any) => `${entry.asset}: ${entry.percentage}%`}
                  >
                    {metrics.asset_allocation.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value}%`, 'Weight']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Dynamic Portfolio Manager Form */}
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
          <h2 className="text-xl font-bold mb-4">Manage Portfolio Holdings</h2>
          <form onSubmit={handleUpdatePortfolio}>
            <div className="space-y-3 mb-4 max-h-60 overflow-y-auto pr-2">
              {holdings.map((holding, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <input
                    type="text"
                    placeholder="Ticker (e.g. NVDA)"
                    value={holding.ticker}
                    onChange={(e) => handleHoldingChange(idx, 'ticker', e.target.value)}
                    className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm w-1/2 focus:outline-none focus:border-blue-500"
                    required
                  />
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="1"
                    placeholder="Weight (0.0 to 1.0)"
                    value={holding.weight}
                    onChange={(e) => handleHoldingChange(idx, 'weight', e.target.value)}
                    className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm w-1/2 focus:outline-none focus:border-blue-500"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => removeHolding(idx)}
                    className="text-red-400 hover:text-red-300 p-2"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={addHolding}
                className="flex items-center gap-1 bg-gray-700 hover:bg-gray-600 text-xs px-3 py-2 rounded-lg transition"
              >
                <Plus className="w-4 h-4" /> Add Asset
              </button>
              <button
                type="submit"
                className="flex-1 bg-blue-600 hover:bg-blue-500 text-sm font-semibold py-2 rounded-lg transition"
              >
                Recalculate Portfolio
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}