import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "./button";
import { AlertTriangle } from "lucide-react";

interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
  itemName?: string;
  confirmText?: string;
  cancelText?: string;
}

export function ConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirm Deletion",
  message = "Are you sure you want to delete this item?",
  itemName,
  confirmText = "Confirm Delete",
  cancelText = "Cancel",
}: ConfirmationDialogProps) {
  const [isAnimating, setIsAnimating] = React.useState(false);

  React.useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const handleClose = () => {
    setIsAnimating(false);
    setTimeout(() => {
      onClose();
    }, 200);
  };

  const handleConfirm = () => {
    setIsAnimating(false);
    setTimeout(() => {
      onConfirm();
      onClose();
    }, 200);
  };

  if (!isOpen) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300",
        isAnimating ? "opacity-100" : "opacity-0"
      )}
      onClick={handleClose}
    >
      {/* Backdrop with glassmorphism */}
      <div className="absolute inset-0 bg-background/80 backdrop-blur-md" />

      {/* Dialog */}
      <div
        className={cn(
          "relative w-full max-w-md transform transition-all duration-300",
          isAnimating ? "scale-100 opacity-100" : "scale-95 opacity-0"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glassmorphism card with glow effect */}
        <div className="relative overflow-hidden rounded-3xl bg-card/95 backdrop-blur-xl border border-border/50 shadow-2xl">
          {/* Subtle gradient glow */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 pointer-events-none" />
          
          {/* Content */}
          <div className="relative p-8 space-y-6">
            {/* Icon and Title */}
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-gradient-to-br from-destructive/20 to-destructive/10 flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-destructive" />
              </div>
              <div className="flex-1 space-y-2">
                <h2 className="text-2xl font-bold text-foreground">
                  {title}
                </h2>
                {itemName && (
                  <p className="text-sm text-muted-foreground font-medium">
                    "{itemName}"
                  </p>
                )}
              </div>
            </div>

            {/* Message */}
            <p className="text-base text-muted-foreground leading-relaxed">
              {message}
            </p>

            {/* Warning note */}
            <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20">
              <p className="text-sm text-destructive/90 font-medium">
                ⚠️ This action cannot be undone
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                onClick={handleClose}
                className="flex-1 h-11 rounded-xl bg-background/50 backdrop-blur-sm border-border/50 hover:bg-background/80 hover:border-border transition-all duration-200"
              >
                {cancelText}
              </Button>
              <Button
                onClick={handleConfirm}
                className="flex-1 h-11 rounded-xl bg-gradient-to-r from-destructive to-destructive/80 hover:from-destructive/90 hover:to-destructive/70 text-destructive-foreground shadow-lg shadow-destructive/20 hover:shadow-destructive/30 transition-all duration-200"
              >
                {confirmText}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
