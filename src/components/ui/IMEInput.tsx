import { useState, useRef, useEffect } from 'react'

interface IMEInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value: string
  onChange: (value: string) => void
}

/**
 * 兼容 CJK 输入法的受控 input：
 * 组合期间（composing）只更新本地 state，compositionend 或 blur 后才写入外部状态。
 * 避免 Zustand 异步更新在组合期间重置 DOM 值，中断 IME。
 */
export function IMEInput({ value, onChange, onBlur, ...rest }: IMEInputProps) {
  const [local, setLocal] = useState(value)
  const composing = useRef(false)

  // 仅在非组合状态下同步外部值（防止抢占正在输入的内容）
  useEffect(() => {
    if (!composing.current) setLocal(value)
  }, [value])

  return (
    <input
      {...rest}
      value={local}
      onChange={e => {
        setLocal(e.target.value)
        if (!composing.current) onChange(e.target.value)
      }}
      onCompositionStart={() => { composing.current = true }}
      onCompositionEnd={e => {
        composing.current = false
        const v = (e.target as HTMLInputElement).value
        setLocal(v)
        onChange(v)
      }}
      onBlur={e => {
        composing.current = false
        onChange(e.target.value)
        onBlur?.(e)
      }}
    />
  )
}
