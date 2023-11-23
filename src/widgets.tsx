import _ from 'lodash'
import React from 'react'

interface ButtonProps extends React.ComponentPropsWithRef<'button'> {}
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ disabled, className, ...props }, ref) => (
  <button
    ref={ref}
    disabled={disabled}
    {...props}
    className={_.compact([
      `text-white focus:ring-4 focus:outline-none focus:ring-violet-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center`,
      `flex items-center justify-center`,
      disabled ? 'cursor-not-allowed bg-violet-300' : 'cursor-pointer bg-violet-600 hover:bg-violet-700',
      className,
    ]).join(' ')}
  />
))

interface LabeledInputProps extends React.ComponentPropsWithRef<'input'> {
  label: string
  id: string
}
export const LabeledInput = React.forwardRef<HTMLDivElement, LabeledInputProps>(({ label, id, ...props }, ref) => (
  <div ref={ref}>
    <label htmlFor={id} className="block mb-2 text-sm font-medium">
      {label}
    </label>
    <input
      id={id}
      className="rounded w-full py-2 px-3 focus:outline-none focus:shadow-outline text-black"
      {...props}
    />
  </div>
))