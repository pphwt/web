"use client";

import React, { useId, createContext, useContext } from "react";

// ─── Field context ─────────────────────────────────────────────────────────────

interface FieldCtx {
  id: string;
  required: boolean;
  disabled: boolean;
  error: string | undefined;
}

const FieldContext = createContext<FieldCtx>({
  id: "",
  required: false,
  disabled: false,
  error: undefined,
});

// ─── Types ─────────────────────────────────────────────────────────────────────

export type InputVariant = "default" | "filled" | "ghost";
export type InputSize    = "sm" | "md" | "lg";

export interface FieldProps {
  children: React.ReactNode;
  /** Marks all child inputs/labels as required */
  required?: boolean;
  /** Marks all child inputs as disabled */
  disabled?: boolean;
  /** If set, shows error styling + message below the input */
  error?: string;
  className?: string;
}

export interface LabelProps {
  children: React.ReactNode;
  /** Override field context id */
  htmlFor?: string;
  className?: string;
}

export interface HelperTextProps {
  children: React.ReactNode;
  className?: string;
}

export interface ErrorMessageProps {
  children?: React.ReactNode;
  className?: string;
}

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
  variant?: InputVariant;
  size?: InputSize;
  /** Icon/element before the input text */
  prefix?: React.ReactNode;
  /** Icon/element after the input text */
  suffix?: React.ReactNode;
  error?: boolean;
  className?: string;
}

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  variant?: InputVariant;
  error?: boolean;
  className?: string;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  variant?: InputVariant;
  size?: InputSize;
  error?: boolean;
  placeholder?: string;
  className?: string;
}

export interface InputGroupProps {
  /** Left addon — icon, text, or button */
  left?: React.ReactNode;
  /** Right addon — icon, text, or button */
  right?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

// ─── Style maps ───────────────────────────────────────────────────────────────

const inputBase =
  "w-full outline-none transition-all duration-150 text-zinc-900 placeholder:text-zinc-400 disabled:opacity-50 disabled:cursor-not-allowed";

const variantStyles: Record<InputVariant, string> = {
  default: "bg-white border border-zinc-200 focus:border-zinc-400 focus:ring-2 focus:ring-zinc-900/10",
  filled:  "bg-zinc-100 border border-transparent focus:border-zinc-300 focus:bg-white focus:ring-2 focus:ring-zinc-900/10",
  ghost:   "bg-transparent border border-transparent focus:border-zinc-200 focus:bg-white focus:ring-2 focus:ring-zinc-900/10",
};

const errorStyles: Record<InputVariant, string> = {
  default: "border-red-400 focus:border-red-500 focus:ring-red-500/15",
  filled:  "bg-red-50 border-red-300 focus:border-red-400 focus:ring-red-500/15",
  ghost:   "border-red-300 focus:border-red-400 focus:ring-red-500/15",
};

const sizeStyles: Record<InputSize, { input: string; text: string; rounded: string }> = {
  sm: { input: "h-8  px-2.5", text: "text-xs", rounded: "rounded-lg"  },
  md: { input: "h-9  px-3",   text: "text-sm", rounded: "rounded-xl"  },
  lg: { input: "h-11 px-4",   text: "text-sm", rounded: "rounded-xl"  },
};

// ─── Field ────────────────────────────────────────────────────────────────────

export function Field({
  children,
  required = false,
  disabled = false,
  error,
  className = "",
}: FieldProps) {
  const id = useId();
  return (
    <FieldContext.Provider value={{ id, required, disabled, error }}>
      <div className={["flex flex-col gap-1.5", className].join(" ")}>
        {children}
      </div>
    </FieldContext.Provider>
  );
}

// ─── Label ────────────────────────────────────────────────────────────────────

export function Label({ children, htmlFor, className = "" }: LabelProps) {
  const { id, required } = useContext(FieldContext);
  return (
    <label
      htmlFor={htmlFor ?? id}
      className={["text-xs font-medium text-zinc-700 leading-none", className].join(" ")}
    >
      {children}
      {required && <span className="ml-1 text-red-500">*</span>}
    </label>
  );
}

// ─── HelperText ───────────────────────────────────────────────────────────────

export function HelperText({ children, className = "" }: HelperTextProps) {
  const { error } = useContext(FieldContext);
  if (error) return null; // hide when error is shown
  return (
    <p className={["text-xs text-zinc-400 leading-relaxed", className].join(" ")}>
      {children}
    </p>
  );
}

// ─── ErrorMessage ─────────────────────────────────────────────────────────────

export function ErrorMessage({ children, className = "" }: ErrorMessageProps) {
  const { error } = useContext(FieldContext);
  const msg = children ?? error;
  if (!msg) return null;
  return (
    <p className={["flex items-center gap-1 text-xs text-red-500 leading-none", className].join(" ")}>
      <svg width="11" height="11" viewBox="0 0 11 11" fill="none" className="shrink-0 mt-px">
        <circle cx="5.5" cy="5.5" r="5" stroke="currentColor" strokeWidth="1.2" />
        <path d="M5.5 3v3M5.5 7.5v.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      </svg>
      {msg}
    </p>
  );
}

// ─── Input ────────────────────────────────────────────────────────────────────

export function Input({
  variant = "default",
  size    = "md",
  prefix,
  suffix,
  error: errorProp,
  className = "",
  id: idProp,
  disabled: disabledProp,
  ...props
}: InputProps) {
  const ctx      = useContext(FieldContext);
  const id       = idProp       ?? ctx.id       ?? undefined;
  const disabled = disabledProp ?? ctx.disabled ?? false;
  const hasError = errorProp    ?? !!ctx.error;
  const sz       = sizeStyles[size];

  // No addons — plain input
  if (!prefix && !suffix) {
    return (
      <input
        id={id}
        disabled={disabled}
        className={[
          inputBase,
          variantStyles[variant],
          hasError ? errorStyles[variant] : "",
          sz.input, sz.text, sz.rounded,
          className,
        ].join(" ")}
        {...props}
      />
    );
  }

  // With prefix/suffix — flex wrapper so width auto-adjusts
  const px = size === "sm" ? "px-2.5" : size === "lg" ? "px-4" : "px-3";

  return (
    <div className={[
      "flex items-center w-full overflow-hidden gap-0.5",
      px,
      sz.rounded,
      "focus-within:ring-2",
      variant === "default"
        ? "bg-white border border-zinc-200 focus-within:border-zinc-400 focus-within:ring-zinc-900/10"
        : variant === "filled"
          ? "bg-zinc-100 border border-transparent focus-within:border-zinc-300 focus-within:bg-white focus-within:ring-zinc-900/10"
          : "bg-transparent border border-transparent focus-within:border-zinc-200 focus-within:bg-white focus-within:ring-zinc-900/10",
      hasError ? "border-red-400 focus-within:border-red-500 focus-within:ring-red-500/15" : "",
      className,
    ].join(" ")}>
      {prefix && (
        <span className="shrink-0 text-zinc-400 leading-none">
          {prefix}
        </span>
      )}
      <input
        id={id}
        disabled={disabled}
        className={[
          "flex-1 min-w-0 bg-transparent outline-none border-none p-0",
          "text-zinc-900 placeholder:text-zinc-400",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          sz.text,
          size === "sm" ? "h-8" : size === "lg" ? "h-11" : "h-9",
        ].join(" ")}
        {...props}
      />
      {suffix && (
        <span className="shrink-0 text-zinc-400 leading-none">
          {suffix}
        </span>
      )}
    </div>
  );
}

// ─── Textarea ─────────────────────────────────────────────────────────────────

export function Textarea({
  variant  = "default",
  error: errorProp,
  className = "",
  id: idProp,
  disabled: disabledProp,
  ...props
}: TextareaProps) {
  const ctx     = useContext(FieldContext);
  const id       = idProp      ?? ctx.id      ?? undefined;
  const disabled = disabledProp ?? ctx.disabled ?? false;
  const hasError = errorProp   ?? !!ctx.error;

  return (
    <textarea
      id={id}
      disabled={disabled}
      className={[
        inputBase,
        "resize-none rounded-xl px-3 py-2.5 text-sm leading-relaxed",
        variantStyles[variant],
        hasError ? errorStyles[variant] : "",
        className,
      ].join(" ")}
      {...props}
    />
  );
}

// ─── Select ───────────────────────────────────────────────────────────────────

export function Select({
  variant   = "default",
  size      = "md",
  error: errorProp,
  placeholder,
  className = "",
  id: idProp,
  disabled: disabledProp,
  children,
  ...props
}: SelectProps) {
  const ctx     = useContext(FieldContext);
  const id       = idProp      ?? ctx.id      ?? undefined;
  const disabled = disabledProp ?? ctx.disabled ?? false;
  const hasError = errorProp   ?? !!ctx.error;
  const sz       = sizeStyles[size];

  return (
    <div className="relative flex items-center">
      <select
        id={id}
        disabled={disabled}
        className={[
          inputBase,
          "appearance-none pr-8 cursor-pointer",
          variantStyles[variant],
          hasError ? errorStyles[variant] : "",
          sz.input,
          sz.text,
          sz.rounded,
          className,
        ].join(" ")}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {children}
      </select>
      {/* Chevron */}
      <span className="absolute right-2.5 pointer-events-none text-zinc-400">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    </div>
  );
}

// ─── InputGroup ───────────────────────────────────────────────────────────────
// Attaches a fixed addon (text/button) to left or right of an input

export function InputGroup({ left, right, children, className = "" }: InputGroupProps) {
  return (
    <div className={["flex", className].join(" ")}>
      {left && (
        <div className="flex items-center px-3 bg-zinc-50 border border-r-0 border-zinc-200 rounded-l-xl text-sm text-zinc-500 shrink-0 whitespace-nowrap">
          {left}
        </div>
      )}
      <div className={["flex-1 [&_input]:rounded-none", left ? "" : "", right ? "" : ""].join(" ")}>
        {React.Children.map(children, child => {
          if (!React.isValidElement(child)) return child;
          return React.cloneElement(child as React.ReactElement<{ className?: string }>, {
            className: [
              (child.props as { className?: string }).className ?? "",
              left  ? "!rounded-l-none" : "",
              right ? "!rounded-r-none" : "",
            ].join(" "),
          });
        })}
      </div>
      {right && (
        <div className="flex items-center px-3 bg-zinc-50 border border-l-0 border-zinc-200 rounded-r-xl text-sm text-zinc-500 shrink-0 whitespace-nowrap">
          {right}
        </div>
      )}
    </div>
  );
}
