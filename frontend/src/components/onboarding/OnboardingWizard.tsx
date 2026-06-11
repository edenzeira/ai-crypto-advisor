import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import AssetSelector from './AssetSelector'
import InvestorTypeSelector from './InvestorTypeSelector'
import ContentTypeSelector from './ContentTypeSelector'

const STEPS = ['Crypto Assets', 'Investor Type', 'Content Preferences']

export default function OnboardingWizard() {
  const { user, login } = useAuth()
  const navigate = useNavigate()

  const [step, setStep] = useState(0)
  const [cryptoAssets, setCryptoAssets] = useState<string[]>([])
  const [investorType, setInvestorType] = useState('')
  const [contentTypes, setContentTypes] = useState<string[]>([])
  const [assetError, setAssetError] = useState('')
  const [contentError, setContentError] = useState('')
  const [submitError, setSubmitError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  function validateCurrentStep(): boolean {
    if (step === 0) {
      if (cryptoAssets.length === 0) {
        setAssetError('Select at least one asset.')
        return false
      }
      setAssetError('')
    }
    if (step === 2) {
      if (contentTypes.length === 0) {
        setContentError('Select at least one content type.')
        return false
      }
      setContentError('')
    }
    return true
  }

  function handleNext() {
    if (!validateCurrentStep()) return
    setStep((s) => s + 1)
  }

  async function handleSubmit() {
    if (!validateCurrentStep()) return
    setSubmitError('')
    setIsLoading(true)
    try {
      await api.post('/api/onboarding', { cryptoAssets, investorType, contentTypes })
      const token = localStorage.getItem('token') ?? ''
      login(token, { ...user!, onboardingComplete: true })
      navigate('/dashboard', { replace: true })
    } catch {
      setSubmitError('Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full max-w-lg">
      {/* Step indicator */}
      <div className="mb-8 flex items-center gap-2">
        {STEPS.map((label, i) => (
          <div key={label} className="flex flex-1 items-center">
            <div className="flex items-center gap-2">
              <div
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                  i < step
                    ? 'bg-indigo-600 text-white'
                    : i === step
                    ? 'border-2 border-indigo-600 text-indigo-600'
                    : 'border-2 border-gray-200 text-gray-400'
                }`}
              >
                {i < step ? '✓' : i + 1}
              </div>
              <span className={`hidden text-xs sm:block ${i === step ? 'font-semibold text-gray-900' : 'text-gray-400'}`}>
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`ml-2 h-px flex-1 ${i < step ? 'bg-indigo-600' : 'bg-gray-200'}`} />
            )}
          </div>
        ))}
      </div>

      {/* Step content */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        {step === 0 && (
          <>
            <h2 className="mb-1 text-lg font-semibold text-gray-900">Which coins do you follow?</h2>
            <p className="mb-4 text-sm text-gray-500">Select all that apply — we'll prioritise these in your dashboard.</p>
            <AssetSelector selected={cryptoAssets} onChange={setCryptoAssets} error={assetError} />
          </>
        )}
        {step === 1 && (
          <>
            <h2 className="mb-1 text-lg font-semibold text-gray-900">How do you invest?</h2>
            <p className="mb-4 text-sm text-gray-500">This helps us tailor the AI insights for your strategy.</p>
            <InvestorTypeSelector selected={investorType} onChange={setInvestorType} />
          </>
        )}
        {step === 2 && (
          <>
            <h2 className="mb-1 text-lg font-semibold text-gray-900">What content do you want to see?</h2>
            <p className="mb-4 text-sm text-gray-500">Pick at least one type to include in your daily feed.</p>
            <ContentTypeSelector selected={contentTypes} onChange={setContentTypes} error={contentError} />
            {submitError && (
              <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{submitError}</p>
            )}
          </>
        )}

        {/* Navigation */}
        <div className="mt-6 flex justify-between">
          <button
            type="button"
            onClick={() => setStep((s) => s - 1)}
            disabled={step === 0}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-0"
          >
            Back
          </button>
          {step < STEPS.length - 1 ? (
            <button
              type="button"
              onClick={handleNext}
              disabled={step === 1 && investorType === ''}
              className="rounded-md bg-indigo-600 px-5 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              Next
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isLoading}
              className="rounded-md bg-indigo-600 px-5 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {isLoading ? 'Saving…' : 'Get started'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
