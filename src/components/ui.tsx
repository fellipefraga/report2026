import { type ReactNode } from 'react'
import clsx from 'clsx'

// Card
interface CardProps {
  children: ReactNode
  className?: string
  onClick?: () => void
}

export function Card({ children, className, onClick }: CardProps) {
  return (
    <div
      className={clsx(
        'rounded-xl border p-4',
        onClick && 'cursor-pointer hover:border-[#3A3A36] transition-colors',
        className
      )}
      style={{ backgroundColor: '#1A1A16', borderColor: '#2A2A26' }}
      onClick={onClick}
    >
      {children}
    </div>
  )
}

// Button
interface ButtonProps {
  children: ReactNode
  onClick?: () => void
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  loading?: boolean
  className?: string
  type?: 'button' | 'submit' | 'reset'
  fullWidth?: boolean
}

export function Button({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled,
  loading,
  className,
  type = 'button',
  fullWidth,
}: ButtonProps) {
  const base = 'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed'

  const variants = {
    primary: 'text-black hover:opacity-90',
    secondary: 'text-white border hover:bg-white/5',
    ghost: 'text-gray-400 hover:text-white hover:bg-white/5',
    danger: 'text-white bg-red-500/20 border border-red-500/30 hover:bg-red-500/30',
  }

  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-5 py-2.5 text-sm',
  }

  const variantStyles: Record<string, React.CSSProperties> = {
    primary: { backgroundColor: '#C8F000' },
    secondary: { borderColor: '#2A2A26' },
    ghost: {},
    danger: {},
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={clsx(base, variants[variant], sizes[size], fullWidth && 'w-full', className)}
      style={variantStyles[variant]}
    >
      {loading ? (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : null}
      {children}
    </button>
  )
}

// Badge
interface BadgeProps {
  children: ReactNode
  variant?: 'accent' | 'muted' | 'success' | 'error' | 'warning'
  className?: string
}

export function Badge({ children, variant = 'muted', className }: BadgeProps) {
  const variants = {
    accent: 'text-black',
    muted: 'text-gray-400',
    success: 'text-green-400',
    error: 'text-red-400',
    warning: 'text-yellow-400',
  }

  const bgVariants: Record<string, React.CSSProperties> = {
    accent: { backgroundColor: '#C8F000', color: '#0D1117' },
    muted: { backgroundColor: '#2A2A26', color: '#A0A09A' },
    success: { backgroundColor: 'rgba(34, 197, 94, 0.15)', color: '#4ade80' },
    error: { backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#f87171' },
    warning: { backgroundColor: 'rgba(234, 179, 8, 0.15)', color: '#facc15' },
  }

  return (
    <span
      className={clsx('inline-flex items-center px-2 py-0.5 rounded text-xs font-medium', variants[variant], className)}
      style={bgVariants[variant]}
    >
      {children}
    </span>
  )
}

// StatusBadge
interface StatusBadgeProps {
  status: string
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const map: Record<string, { label: string; variant: BadgeProps['variant'] }> = {
    pending: { label: 'Pendente', variant: 'muted' },
    processing: { label: 'Processando', variant: 'warning' },
    done: { label: 'Concluído', variant: 'success' },
    error: { label: 'Erro', variant: 'error' },
    draft: { label: 'Rascunho', variant: 'muted' },
    approved: { label: 'Aprovado', variant: 'success' },
    revision: { label: 'Revisão', variant: 'warning' },
  }

  const config = map[status] || { label: status, variant: 'muted' as const }
  return <Badge variant={config.variant}>{config.label}</Badge>
}

// PageHeader
interface PageHeaderProps {
  title: string
  description?: string
  action?: ReactNode
}

export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h1 className="text-xl font-semibold text-white">{title}</h1>
        {description && (
          <p className="text-sm mt-1" style={{ color: '#A0A09A' }}>
            {description}
          </p>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}

// EmptyState
interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {icon && (
        <div className="mb-4" style={{ color: '#A0A09A' }}>
          {icon}
        </div>
      )}
      <h3 className="text-base font-medium text-white mb-2">{title}</h3>
      {description && (
        <p className="text-sm mb-6 max-w-sm" style={{ color: '#A0A09A' }}>
          {description}
        </p>
      )}
      {action}
    </div>
  )
}

// Spinner
export function Spinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizes = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-8 h-8' }
  return (
    <div
      className={clsx('border-2 border-t-transparent rounded-full animate-spin', sizes[size])}
      style={{ borderColor: '#C8F000', borderTopColor: 'transparent' }}
    />
  )
}

// Input
interface InputProps {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  type?: string
  className?: string
  disabled?: boolean
}

export function Input({ value, onChange, placeholder, type = 'text', className, disabled }: InputProps) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      className={clsx(
        'w-full px-3 py-2 rounded-lg text-sm text-white placeholder-gray-500 border outline-none focus:border-[#C8F000] transition-colors',
        className
      )}
      style={{ backgroundColor: '#0D1117', borderColor: '#2A2A26' }}
    />
  )
}

// Textarea
interface TextareaProps {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  rows?: number
  className?: string
  disabled?: boolean
}

export function Textarea({ value, onChange, placeholder, rows = 4, className, disabled }: TextareaProps) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      disabled={disabled}
      className={clsx(
        'w-full px-3 py-2 rounded-lg text-sm text-white placeholder-gray-500 border outline-none focus:border-[#C8F000] transition-colors resize-none',
        className
      )}
      style={{ backgroundColor: '#0D1117', borderColor: '#2A2A26' }}
    />
  )
}

// Divider
export function Divider() {
  return <hr className="border-0 border-t" style={{ borderColor: '#2A2A26' }} />
}

// formatDate
export function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

// formatDateTime
export function formatDateTime(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
