import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function FormInput({
  id,
  label,
  labelAction,
  required = false,
  icon: Icon,
  endAdornment,
  error,
  className,
  inputClassName,
  ...inputProps
}) {
  const errorId = error ? `${id}-error` : undefined

  return (
    <div className={cn("space-y-1.5", className)}>
      {(label || labelAction) && (
        <div className="flex items-center justify-between gap-4">
          {label && (
            <Label htmlFor={id} className="text-sm font-medium">
              {label}
              {required && <span className="ml-0.5 text-destructive">*</span>}
            </Label>
          )}

          {labelAction}
        </div>
      )}

      <div className="relative">
        {Icon && (
          <Icon
            aria-hidden="true"
            className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          />
        )}

        <Input
          id={id}
          aria-invalid={Boolean(error)}
          aria-describedby={errorId}
          className={cn("h-11", Icon && "pl-10", endAdornment && "pr-10", inputClassName)}
          {...inputProps}
        />

        {endAdornment && (
          <div className="absolute inset-y-0 right-0 flex w-10 items-center justify-center">
            {endAdornment}
          </div>
        )}
      </div>

      {error && (
        <p id={errorId} role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}