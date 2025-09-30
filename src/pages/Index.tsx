import { Header } from "@/components/Header"
import { HeroSection } from "@/components/HeroSection"
import {CategoriesGrid } from "@/components/CategoriesGrid"
import { RecentListings } from "@/components/RecentListings"
import { CTASection } from "@/components/CTASection"
import { Footer } from "@/components/Footer"

const Index = () => {
  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <HeroSection />
        <CategoriesGrid />
        <RecentListings />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
