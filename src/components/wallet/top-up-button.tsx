"use client";

import { RefreshCcw } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { STARTING_BALANCE, useCasino } from "@/store/casino";
import { useCurrency } from "@/hooks/use-currency";
import { playSound } from "@/lib/sound";
import { toast } from "@/store/toast";
import { cn } from "@/lib/utils";

/**
 * Refills the virtual wallet back to the starting demo balance.
 * Free, unlimited and entirely without value - there is nothing to buy.
 */
export function TopUpButton({
  className,
  label = "Demo-Guthaben auffüllen",
  ...props
}: ButtonProps & { label?: string }) {
  const topUp = useCasino((state) => state.topUp);
  const balance = useCasino((state) => state.balance);
  const { format } = useCurrency();

  return (
    <Button
      variant="gold"
      className={cn("gap-2", className)}
      onClick={() => {
        topUp();
        playSound("cashout");
        toast("Demo-Guthaben aufgefüllt", {
          description: `Dein virtuelles Guthaben steht wieder bei ${format(STARTING_BALANCE)}. Ohne realen Gegenwert.`,
          variant: "gold",
        });
      }}
      title={
        balance < STARTING_BALANCE
          ? "Setzt das Demo-Guthaben auf den Startbetrag zurück"
          : "Setzt das Demo-Guthaben auf den Startbetrag"
      }
      {...props}
    >
      <RefreshCcw className="h-4 w-4" />
      {label}
    </Button>
  );
}
