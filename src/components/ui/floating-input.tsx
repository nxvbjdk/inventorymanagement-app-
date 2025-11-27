import * as React from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export interface FloatingInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

const FloatingInput = React.forwardRef<HTMLInputElement, FloatingInputProps>(
  ({ className, label, error, type = "text", ...props }, ref) => {
    const [isFocused, setIsFocused] = React.useState(false);
    const [hasValue, setHasValue] = React.useState(false);

    const handleFocus = () => setIsFocused(true);
    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);
      setHasValue(!!e.target.value);
      props.onBlur?.(e);
    };

    React.useEffect(() => {
      setHasValue(!!props.value || !!props.defaultValue);
    }, [props.value, props.defaultValue]);

    const isFloating = isFocused || hasValue;

    return (
      <div className="relative w-full">
        <input
          type={type}
          className={cn(
            "peer w-full rounded-lg border border-input bg-background px-4 pt-7 pb-2 text-base",
            "transition-all duration-200",
            "focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20",
            "disabled:cursor-not-allowed disabled:opacity-50",
            error && "border-destructive focus:border-destructive focus:ring-destructive/20",
            className
          )}
          ref={ref}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder=" "
          {...props}
        />
        <motion.label
          className={cn(
            "absolute left-4 pointer-events-none",
            "transition-all duration-200 origin-left",
            error ? "text-destructive" : isFloating ? "text-primary" : "text-muted-foreground"
          )}
          animate={{
            top: isFloating ? "0.2rem" : "50%",
            fontSize: isFloating ? "0.75rem" : "1rem",
            y: isFloating ? 0 : "-50%",
          }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          {label}
        </motion.label>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-1 text-xs text-destructive"
          >
            {error}
          </motion.p>
        )}
      </div>
    );
  }
);

FloatingInput.displayName = "FloatingInput";

export { FloatingInput };
