import { useEffect, useState } from 'react'

interface Props {
  value: number
  onChange: (n: number) => void
  decimal?: boolean
  placeholder?: string
  ariaLabel: string
}

/** Input numérico que permite escribir estados intermedios ("62.", "") sin pelear con React. */
export function NumInput({ value, onChange, decimal, placeholder, ariaLabel }: Props) {
  const [text, setText] = useState(value ? String(value) : '')

  useEffect(() => {
    setText((t) => (parseFloat(t.replace(',', '.')) === value ? t : value ? String(value) : ''))
  }, [value])

  return (
    <input
      className="num"
      type="text"
      inputMode={decimal ? 'decimal' : 'numeric'}
      aria-label={ariaLabel}
      placeholder={placeholder}
      value={text}
      onFocus={(e) => e.target.select()}
      onChange={(e) => {
        const t = e.target.value
        if (!/^\d*([.,]\d*)?$/.test(t)) return
        setText(t)
        const n = parseFloat(t.replace(',', '.'))
        onChange(Number.isFinite(n) ? n : 0)
      }}
    />
  )
}
