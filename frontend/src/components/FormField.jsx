/**
 * One labelled input, used by all six forms.
 *
 * The `error` prop is fed straight from the backend's fieldErrors map, so a
 * @NotBlank message written in the Java entity shows up under the right input
 * without the frontend repeating the rule.
 */
export default function FormField({
  label,
  name,
  value,
  onChange,
  type = 'text',
  as = 'input',
  options = [],
  required = false,
  error,
  hint,
  placeholder,
  full = false,
  ...rest
}) {
  const cls = error ? ' invalid' : ''

  return (
    <div className={'field' + (full ? ' full' : '')}>
      <label htmlFor={name}>
        {label}
        {required && <span className="req">*</span>}
      </label>

      {as === 'select' && (
        <select id={name} name={name} className={'select' + cls} value={value ?? ''} onChange={onChange} {...rest}>
          <option value="">Select…</option>
          {options.map((o) => {
            const val = typeof o === 'object' ? o.value : o
            const lbl = typeof o === 'object' ? o.label : o
            return (
              <option key={val} value={val}>
                {lbl}
              </option>
            )
          })}
        </select>
      )}

      {as === 'textarea' && (
        <textarea
          id={name}
          name={name}
          className={'textarea' + cls}
          value={value ?? ''}
          onChange={onChange}
          placeholder={placeholder}
          {...rest}
        />
      )}

      {as === 'input' && (
        <input
          id={name}
          name={name}
          type={type}
          className={'input' + cls}
          value={value ?? ''}
          onChange={onChange}
          placeholder={placeholder}
          {...rest}
        />
      )}

      {error && <div className="field-error">{error}</div>}
      {!error && hint && <div className="field-hint">{hint}</div>}
    </div>
  )
}

/** Small helper for the top-of-form / top-of-page message strip. */
export function Alert({ kind = 'error', children, onClose }) {
  if (!children) return null
  return (
    <div className={`alert alert-${kind}`}>
      <span>{children}</span>
      {onClose && (
        <button type="button" className="close" onClick={onClose} aria-label="Dismiss">
          ×
        </button>
      )}
    </div>
  )
}
