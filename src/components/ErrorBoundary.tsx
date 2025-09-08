// components/ErrorBoundary.tsx
const SellerProfileError = ({ error, onRetry }: { error: string, onRetry: () => void }) => (
  <div className="text-center py-8">
    <p className="text-red-500 mb-4">{error}</p>
    <Button onClick={onRetry}>Réessayer</Button>
  </div>
);