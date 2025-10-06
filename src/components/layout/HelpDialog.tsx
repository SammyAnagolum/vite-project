// src/components/layout/HelpDialog.tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
};

export default function HelpDialog({ open, onOpenChange }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Help & Shortcuts</DialogTitle>
          <DialogDescription>Quick links, docs, and handy keyboard tips.</DialogDescription>
        </DialogHeader>

        <p>Coming soon...</p>
      </DialogContent>
    </Dialog>
  );
}
