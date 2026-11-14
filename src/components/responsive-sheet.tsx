import type {ReactNode} from 'react';
import {Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle} from '@/components/ui/dialog';
import {Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle} from '@/components/ui/drawer';
import {useIsDesktop} from '@/hooks/use-media-query';
import {cn} from '@/lib/utils';

/** A dialog on laptops and a bottom drawer on phones, with the same content. */
export function ResponsiveSheet({open, onOpenChange, title, description, children, className}: {
  open: boolean; onOpenChange: (open: boolean) => void; title: ReactNode; description?: ReactNode; children: ReactNode; className?: string;
}) {
  const desktop = useIsDesktop();
  if (desktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className={cn('max-h-[88vh] overflow-y-auto sm:max-w-lg', className)}>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription className={description ? undefined : 'sr-only'}>{description ?? title}</DialogDescription>
          </DialogHeader>
          {children}
        </DialogContent>
      </Dialog>
    );
  }
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[92dvh]">
        <DrawerHeader className="text-left">
          <DrawerTitle>{title}</DrawerTitle>
          <DrawerDescription className={description ? undefined : 'sr-only'}>{description ?? title}</DrawerDescription>
        </DrawerHeader>
        <div className={cn('overflow-y-auto px-4 pb-safe', className)}>{children}</div>
      </DrawerContent>
    </Drawer>
  );
}
