// components/AvatarCropModal.tsx - Modal avec crop interactif pour avatar
import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Camera, ZoomIn, ZoomOut, RotateCw, Check, X } from "lucide-react";

interface AvatarCropModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageSrc: string;
  onCropComplete: (croppedImage: Blob) => void;
  uploading?: boolean;
}

interface Point {
  x: number;
  y: number;
}

interface Area {
  x: number;
  y: number;
  width: number;
  height: number;
}

export const AvatarCropModal: React.FC<AvatarCropModalProps> = ({
  isOpen,
  onClose,
  imageSrc,
  onCropComplete,
  uploading = false
}) => {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  const onCropChange = useCallback((location: Point) => {
    setCrop(location);
  }, []);

  const onZoomChange = useCallback((zoom: number) => {
    setZoom(zoom);
  }, []);

  const onCropCompleteCallback = useCallback(
    (croppedArea: Area, croppedAreaPixels: Area) => {
      setCroppedAreaPixels(croppedAreaPixels);
    },
    []
  );

  const createCroppedImage = async (): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.src = imageSrc;
      
      image.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx || !croppedAreaPixels) {
          reject(new Error('Canvas non disponible'));
          return;
        }

        // Dimensions de sortie (avatar carré 400x400)
        const outputSize = 400;
        canvas.width = outputSize;
        canvas.height = outputSize;

        // Configuration de qualité
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Appliquer la rotation si nécessaire
        if (rotation !== 0) {
          ctx.translate(outputSize / 2, outputSize / 2);
          ctx.rotate((rotation * Math.PI) / 180);
          ctx.translate(-outputSize / 2, -outputSize / 2);
        }

        // Dessiner l'image rognée
        ctx.drawImage(
          image,
          croppedAreaPixels.x,
          croppedAreaPixels.y,
          croppedAreaPixels.width,
          croppedAreaPixels.height,
          0,
          0,
          outputSize,
          outputSize
        );

        // Convertir en blob
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Échec de création du blob'));
            }
          },
          'image/jpeg',
          0.92
        );
      };

      image.onerror = () => reject(new Error('Impossible de charger l\'image'));
    });
  };

  const handleSave = async () => {
    try {
      const croppedImage = await createCroppedImage();
      onCropComplete(croppedImage);
    } catch (error) {
      console.error('Erreur lors du crop:', error);
    }
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Ajuster votre photo
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Zone de crop */}
          <div className="relative h-[400px] bg-gray-900 rounded-lg overflow-hidden">
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              rotation={rotation}
              aspect={1}
              cropShape="round"
              showGrid={false}
              onCropChange={onCropChange}
              onZoomChange={onZoomChange}
              onCropComplete={onCropCompleteCallback}
            />
          </div>

          {/* Contrôles de zoom */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <ZoomOut className="h-4 w-4" />
                Zoom
              </span>
              <span className="flex items-center gap-1">
                <ZoomIn className="h-4 w-4" />
              </span>
            </div>
            <Slider
              value={[zoom]}
              min={1}
              max={3}
              step={0.1}
              onValueChange={(values) => setZoom(values[0])}
              className="w-full"
            />
          </div>

          {/* Bouton de rotation */}
          <div className="flex justify-center">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRotate}
              disabled={uploading}
            >
              <RotateCw className="h-4 w-4 mr-2" />
              Rotation (90°)
            </Button>
          </div>

          {/* Instructions */}
          <div className="text-xs text-muted-foreground text-center space-y-1">
            <p>• Glissez pour repositionner</p>
            <p>• Utilisez le slider pour zoomer</p>
            <p>• Cliquez sur rotation pour pivoter</p>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={uploading}
            >
              <X className="h-4 w-4 mr-2" />
              Annuler
            </Button>
            
            <Button
              onClick={handleSave}
              className="flex-1"
              disabled={uploading}
            >
              {uploading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                  Upload...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Valider
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};