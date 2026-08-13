import LandingNavbar from '@/components/shared/landing/Navbar';
import HeroSection from '@/components/shared/landing/Hero';
import ProblemSection from '@/components/shared/landing/ProblemSection';
import ConnectedOperationsSection from '@/components/shared/landing/ConnectedOperations';
import SmartInventorySection from '@/components/shared/landing/SmartInventory';
import RecipeCostSection from '@/components/shared/landing/RecipeCostIntelligence';
import ProductionPlanningSection from '@/components/shared/landing/ProductionPlanning';
import ForecastingSection from '@/components/shared/landing/Forecasting';
import AiPlanningSection from '@/components/shared/landing/AIAssistedPlanning';
import AiDashboardSection from '@/components/shared/landing/AIDashboardAgent';
import ChatbotSection from '@/components/shared/landing/ConversationalAI';
import PosIntegrationSection from '@/components/shared/landing/POSIntegration';
import BenefitsSection from '@/components/shared/landing/Benefits';
import FinalCtaSection from '@/components/shared/landing/FinalCTA';
import LandingFooter from '@/components/shared/landing/Footer';

import {
  heroStats,
  heroLowStock,
  heroTopMenu,
  heroInsight,
  problems,
  workflowSteps,
  posFlowSteps,
  inventoryBatches,
  inventoryMovements,
  recipeExample,
  productionSimulation,
  forecastInputs,
  nextPlanRecommendation,
  aiRecommendation,
  aiDashboardInsight,
  chatQuestions,
  chatAnswer,
  posStatement,
  benefits,
} from '@/lib/landingContent';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <LandingNavbar />

        <main>
        <HeroSection
            stats={heroStats}
            lowStock={heroLowStock}
            topMenu={heroTopMenu}
            insight={heroInsight}
        />

        <div id="platform" className="scroll-mt-16">
            <ProblemSection problems={problems} />
            <ConnectedOperationsSection steps={workflowSteps} />
        </div>

        <div id="inventory" className="scroll-mt-16">
            <SmartInventorySection
            batches={inventoryBatches}
            movements={inventoryMovements}
            />

            <RecipeCostSection recipe={recipeExample} />
        </div>

        <div id="planning" className="scroll-mt-16">
            <ProductionPlanningSection simulation={productionSimulation} />
        </div>

        <div id="intelligence" className="scroll-mt-16">
            <ForecastingSection
            inputs={forecastInputs}
            recommendation={nextPlanRecommendation}
            />

            <AiPlanningSection recommendation={aiRecommendation} />
            <AiDashboardSection insight={aiDashboardInsight} />
            <ChatbotSection questions={chatQuestions} answer={chatAnswer} />
        </div>

        <div id="pos" className="scroll-mt-16">
            <PosIntegrationSection
            steps={posFlowSteps}
            statement={posStatement}
            />

            <BenefitsSection benefits={benefits} />
        </div>
        </main>

      <FinalCtaSection />
      <LandingFooter />
    </div>
  );
}