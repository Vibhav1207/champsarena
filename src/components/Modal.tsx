import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { usePathname } from 'next/navigation';

// We'll create a simple modal without header/footer for flexibility.
// The consumer can pass in any content, including header and footer.

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
  // Optional: we can add a title and show a close button in the header
  title?: string;
  // Size: sm, md, lg, full (for mobile)
  size?: 'sm' | 'md' | 'lg' | 'full';
}

// We'll use a portal to render the modal at the end of the body to avoid z-index issues.
// However, Next.js 13+ with app router doesn't have a built-in portal, but we can use a div in the body.
// Alternatively, we can render it in a fixed position container in the layout.
// Since we are in the app router, we can create a portal by appending to document.body.
// But note: we are in a client component.

// We'll create a simple modal that uses fixed positioning and is rendered where it's called.
// We'll rely on the parent having a high enough z-index or we'll use a fixed position and high z-index.

// Alternatively, we can create a Portal component, but for simplicity, we'll assume the modal is placed in a context that allows it to be fixed.

// We'll use the following approach:
// - The modal will be absolutely positioned relative to the viewport (fixed).
// - We'll use a backdrop that covers the entire screen.
// - We'll prevent scroll on the body when the modal is open.

// We'll use the useEffect to lock body scroll when modal opens and unlock when it closes.

// We'll also handle the ESC key and click outside.

export default function Modal({
  isOpen,
  onClose,
  children,
  className = '',
  title,
  size = 'md',
}: ModalProps) {
  const router = useRouter();
  const pathname = usePathname();

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  // Close on ESC key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Click outside to close (only if we click on the backdrop)
  // We'll handle this by having an invisible div that covers the screen and calls onClose when clicked,
  // but we must stop propagation from the modal content.

  if (!isOpen) {
    return null;
  }

  // Define size classes
  const sizeClasses = {
    sm: 'max-w-sm w-full',
    md: 'max-w-md w-full',
    lg: 'max-w-lg w-full',
    full: 'w-full max-w-[90vw]',
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/50 backdrop-blur-sm backdrop-filter
          flex items-center justify-center px-4`
        }
        onClick={onClose}
      >
        {/* Modal content */}
        <AnimatePresence>
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className={`relative z-50 bg-white rounded-2xl shadow-2xl border-4 border-primary
              ${sizeClasses[size]} ${className}
              max-h-[85vh] overflow-y-auto
            `}
            onClick={(e) => e.stopPropagation()} // Prevent clicking inside from closing
          >
            {/* Header with title and close button */}
            <div className="flex items-center justify-between p-5 border-b-4 border-primary bg-accent-yellow">
              {title && (
                <h2 className="text-xl font-black text-primary uppercase tracking-tight">
                  {title}
                </h2>
              )}
              <button
                onClick={onClose}
                className="material-symbols-outlined text-primary hover:text-primary/70 transition-colors cursor-pointer"
              >
                close
              </button>
            </div>
            <div className="p-6 space-y-4">
              {children}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </>
  );
}