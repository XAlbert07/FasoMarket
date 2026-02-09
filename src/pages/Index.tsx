import { Header } from "@/components/Header"
import { Footer } from "@/components/Footer"
import { PremiumHome } from "@/components/home/PremiumHome"

const Index = () => {
  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <PremiumHome />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
