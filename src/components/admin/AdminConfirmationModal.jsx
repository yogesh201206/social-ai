import { AlertTriangle, Info, CheckCircle2, Trash2, X } from 'lucide-react'
import Button from '../Button'

const variantStyles = {
  danger: {
    icon: Trash2,
    iconColor: 'text-red-600 dark:text-red-400',
    iconBg: 'bg-red-100 dark:bg-red-900/30',
    buttonVariant: 'danger',
  },
  warning: {
    icon: AlertTriangle,
    iconColor: 'text-amber-600 dark:text-amber-400',
    iconBg: 'bg-amber-100 dark:bg-amber-900/30',
    buttonVariant: 'primary',
  },
  success: {
    icon: CheckCircle2,
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    iconBg: 'bg-emerald-100 dark:bg-emerald-900/30',
    buttonVariant: 'primary',
  },
  info: {
    icon: Info,
    iconColor: 'text-brand-600 dark:text-brand-400',
    iconBg: 'bg-brand-100 dark:bg-brand-900/30',
    buttonVariant: 'primary',
  },
}

export default function AdminConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  message = 'This action will update the platform record.',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'warning',
  loading = false,
}) {
  if (!isOpen) return null

  const style = variantStyles[type] || variantStyles.warning
  const IconComponent = style.icon

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div
        className="relative w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden transform transition-all p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-2xl ${style.iconBg} flex-shrink-0`}>
            <IconComponent className={`h-6 w-6 ${style.iconColor}`} />
          </div>

          <div className="flex-1 pr-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white leading-6">
              {title}
            </h3>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
              {message}
            </p>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
          <Button variant="ghost" size="md" onClick={onClose} disabled={loading}>
            {cancelText}
          </Button>
          <Button
            variant={style.buttonVariant}
            size="md"
            onClick={() => {
              onConfirm()
            }}
            loading={loading}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  )
}
