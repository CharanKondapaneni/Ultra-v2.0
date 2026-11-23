import { AlertTriangle, RefreshCw } from 'lucide-react'

interface PageErrorProps {
  message?: string
  onRetry?: () => void
}

export default function PageError({ message, onRetry }: PageErrorProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[320px] gap-4 text-center px-6">
      <div className="w-12 h-12 rounded-2xl bg-critical/10 flex items-center justify-center">
        <AlertTriangle className="w-6 h-6 text-critical" />
      </div>
      <div>
        <p className="text-sm font-semibold text-text">Unable to load data</p>
        <p className="text-[13px] text-text-muted mt-1 max-w-xs">
          {message ?? 'The response from the data layer was unexpected. Check the API or try again.'}
        </p>
      </div>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-medium bg-surface-2 text-text-muted hover:bg-surface-3 hover:text-text transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Retry
        </button>
      )}
    </div>
  )
}
