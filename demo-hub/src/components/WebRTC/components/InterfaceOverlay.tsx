import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { useState, useEffect } from "react";

interface InterfaceOverlayProps {
  title: React.ReactNode;
  onClose: () => void;
  children: React.ReactNode;
  maxWidth?: string;
  showCloseButton?: boolean;
  transitionDuration?: number;
  show?: boolean;
  onExited?: () => void;
}

export const InterfaceOverlay = ({ 
  title, onClose, children, maxWidth = "max-w-md",
  showCloseButton = true, transitionDuration = 300,
  show = true, onExited
}: InterfaceOverlayProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => setIsVisible(true), 10);
      return () => clearTimeout(timer);
    } else {
      handleExit();
    }
  }, [show]);

  const handleExit = () => {
    setIsExiting(true);
    const timer = setTimeout(() => {
      setIsVisible(false);
      setIsExiting(false);
      onExited?.();
    }, transitionDuration);
    return () => clearTimeout(timer);
  };

  const handleClose = () => {
    handleExit();
    setTimeout(() => onClose(), transitionDuration);
  };

  if (!show && !isVisible && !isExiting) return null;

  return (
    <div 
      className={`absolute inset-0 bg-black/50 backdrop-blur-sm z-30 flex items-center justify-center p-4 transition-all duration-300 ease-in-out ${isVisible && !isExiting ? 'opacity-100' : 'opacity-0'}`}
      style={{ transitionDuration: `${transitionDuration}ms`, pointerEvents: isVisible ? 'auto' : 'none' }}
    >
      <div 
        className={`bg-white dark:bg-gray-900 rounded-xl shadow-2xl ${maxWidth} w-full max-h-[80vh] overflow-y-auto transition-all duration-300 ease-out ${isVisible && !isExiting ? 'scale-100 translate-y-0 opacity-100' : 'scale-95 translate-y-4 opacity-0'}`}
        style={{ transitionDuration: `${transitionDuration}ms` }}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">{title}</h3>
            {showCloseButton && (
              <Button variant="ghost" size="sm" onClick={handleClose}>
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
          {children}
        </div>
      </div>
    </div>
  );
};
