import { useState } from 'react';
import { useReports } from '@/hooks/useReports';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Flag } from 'lucide-react';

interface ReportDialogProps {
  listingId: string;
  trigger?: React.ReactNode;
}

const reasons = [
  { value: 'fake', label: 'Annonce frauduleuse' },
  { value: 'inappropriate', label: 'Contenu inapproprié' },
  { value: 'spam', label: 'Spam ou publicité' },
  { value: 'duplicate', label: 'Annonce en double' },
  { value: 'sold', label: 'Article déjà vendu' },
  { value: 'other', label: 'Autre raison' }
];

export const ReportDialog = ({ listingId, trigger }: ReportDialogProps) => {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const { reportListing, loading } = useReports();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason) return;

    const success = await reportListing(listingId, reason, description);
    if (success) {
      setOpen(false);
      setReason('');
      setDescription('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Flag className="h-4 w-4 mr-2" />
            Signaler
          </Button>
        )}
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Signaler cette annonce</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label className="text-base font-medium">Motif du signalement *</Label>
            <RadioGroup value={reason} onValueChange={setReason} className="mt-3">
              {reasons.map((r) => (
                <div key={r.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={r.value} id={r.value} />
                  <Label htmlFor={r.value} className="font-normal">
                    {r.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div>
            <Label htmlFor="description">Description (optionnelle)</Label>
            <Textarea
              id="description"
              placeholder="Décrivez le problème en détail..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-2"
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={!reason || loading}
              className="bg-red-600 hover:bg-red-700"
            >
              {loading ? 'Envoi...' : 'Signaler'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};