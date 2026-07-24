import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export const PublishStrip = () => (
  <section className="border-t border-border bg-background">
    <div className="container mx-auto px-4 py-8 md:py-10">
      <div className="flex flex-col items-start justify-between gap-4 border border-border bg-surface px-5 py-6 md:flex-row md:items-center md:px-8">
        <div className="max-w-xl">
          <h2 className="text-base font-heading font-semibold text-foreground md:text-lg">
            Vendez en quelques minutes, gratuitement
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Publiez votre annonce, recevez des messages et concluez la vente en direct.
          </p>
        </div>
        <Button size="lg" className="shrink-0" asChild>
          <Link to="/publish">
            Déposer une annonce
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  </section>
);
