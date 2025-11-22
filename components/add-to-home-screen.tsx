'use client';

import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { IconX, IconShare } from '@tabler/icons-react';

export function AddToHomeScreenPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Détecter si c'est iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    // Détecter si l'app est déjà installée (en mode standalone)
    const standalone = window.matchMedia('(display-mode: standalone)').matches || 
                      (window.navigator as any).standalone === true;
    
    setIsIOS(iOS);
    setIsStandalone(standalone);

    // Vérifier si l'utilisateur a déjà vu le prompt
    const hasSeenPrompt = localStorage.getItem('hasSeenAddToHomeScreenPrompt');
    
    // Afficher le prompt seulement si :
    // - C'est iOS
    // - L'app n'est pas déjà installée
    // - L'utilisateur n'a pas encore vu le prompt
    if (iOS && !standalone && !hasSeenPrompt) {
      // Attendre un peu avant d'afficher le prompt pour une meilleure UX
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 3000); // Afficher après 3 secondes

      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    setShowPrompt(false);
    // Marquer comme vu pour ne plus l'afficher
    localStorage.setItem('hasSeenAddToHomeScreenPrompt', 'true');
  };

  if (!isIOS || isStandalone) {
    return null;
  }

  return (
    <Dialog open={showPrompt} onOpenChange={setShowPrompt}>
      <DialogContent className="sm:max-w-md" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            Ajouter MobiService à votre écran d'accueil
          </DialogTitle>
          <DialogDescription className="text-base pt-2">
            Accédez rapidement à MobiService directement depuis votre écran d'accueil iPhone.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <p className="font-semibold text-sm mb-3 text-slate-900">
              Comment ajouter :
            </p>
            <ol className="space-y-2 text-sm text-slate-700 list-decimal list-inside">
              <li>
                Appuyez sur le bouton <span className="font-semibold">Partager</span>
                <IconShare className="inline-block w-4 h-4 mx-1 text-slate-600" />
                en bas de l'écran
              </li>
              <li>Sélectionnez <span className="font-semibold">"Sur l'écran d'accueil"</span></li>
              <li>Appuyez sur <span className="font-semibold">"Ajouter"</span></li>
            </ol>
          </div>

          <div className="flex items-center gap-2 text-sm text-slate-600">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
              M
            </div>
            <p>L'icône MobiService apparaîtra sur votre écran d'accueil</p>
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={handleClose}
            className="flex-1"
          >
            Plus tard
          </Button>
          <Button
            onClick={handleClose}
            className="flex-1 bg-blue-600 hover:bg-blue-700"
          >
            Compris
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

