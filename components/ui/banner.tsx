"use client";

import { type LucideIcon, XIcon } from "lucide-react";
import {
  type ComponentProps,
  createContext,
  type HTMLAttributes,
  type MouseEventHandler,
  useContext,
  useState,
  useCallback,
} from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function useControllableState<T>({
  prop,
  defaultProp,
  onChange,
}: {
  prop?: T;
  defaultProp?: T;
  onChange?: (state: T) => void;
}) {
  const [uncontrolledState, setUncontrolledState] = useState<T | undefined>(defaultProp);
  const isControlled = prop !== undefined;
  const value = isControlled ? prop : uncontrolledState;

  const setValue = useCallback(
    (next: T | ((prev: T) => T)) => {
      const setter = next as (prev: T) => T;
      const nextValue = typeof next === "function" ? setter(value as T) : next;
      if (!isControlled) {
        setUncontrolledState(nextValue);
      }
      onChange?.(nextValue);
    },
    [isControlled, value, onChange]
  );

  return [value, setValue] as const;
}

type BannerContextProps = {
  show: boolean;
  setShow: (show: boolean) => void;
};

export const BannerContext = createContext<BannerContextProps>({
  show: true,
  setShow: () => {},
});

export type BannerProps = HTMLAttributes<HTMLDivElement> & {
  visible?: boolean;
  defaultVisible?: boolean;
  onClose?: () => void;
  inset?: boolean;
};

export const Banner = ({
  children,
  visible,
  defaultVisible = true,
  onClose,
  className,
  inset = false,
  ...props
}: BannerProps) => {
  const [show, setShow] = useControllableState({
    defaultProp: defaultVisible,
    prop: visible,
    onChange: onClose,
  });

  if (!show) {
    return null;
  }

  return (
    <BannerContext.Provider value={{ show: !!show, setShow: (val) => setShow(val) }}>
      <div
        className={cn(
          "flex w-full items-center justify-between gap-2 bg-primary px-4 py-2 text-primary-foreground",
          inset && "rounded-lg",
          className
        )}
        {...props}
      >
        {children}
      </div>
    </BannerContext.Provider>
  );
};

export type BannerIconProps = HTMLAttributes<HTMLDivElement> & {
  icon: LucideIcon;
};

export const BannerIcon = ({
  icon: Icon,
  className,
  ...props
}: BannerIconProps) => (
  <div className={cn("shrink-0", className)} {...props}>
    <Icon className="size-4" />
  </div>
);

export type BannerTitleProps = HTMLAttributes<HTMLParagraphElement>;

export const BannerTitle = ({
  children,
  className,
  ...props
}: BannerTitleProps) => (
  <p className={cn("text-sm font-medium", className)} {...props}>
    {children}
  </p>
);

export type BannerActionProps = ComponentProps<typeof Button>;

export const BannerAction = ({
  children,
  className,
  variant = "outline",
  size = "sm",
  ...props
}: BannerActionProps) => (
  <Button
    className={cn(
      "shrink-0 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground",
      className
    )}
    variant={variant}
    size={size}
    {...props}
  >
    {children}
  </Button>
);

export type BannerCloseProps = ComponentProps<typeof Button>;

export const BannerClose = ({
  children,
  className,
  variant = "ghost",
  size = "icon-sm",
  onClick,
  ...props
}: BannerCloseProps) => {
  const { setShow } = useContext(BannerContext);

  const handleClick: MouseEventHandler<HTMLButtonElement> = (e) => {
    setShow(false);
    (onClick as any)?.(e);
  };

  return (
    <Button
      className={cn(
        "shrink-0 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground",
        className
      )}
      variant={variant}
      size={size}
      onClick={handleClick}
      {...props}
    >
      {children ?? <XIcon className="size-4" />}
    </Button>
  );
};
