import { AnimatePresence, MotionConfig } from "motion/react";
import { DashboardSummary } from "./components/dashboard/DashboardSummary";
import { HelpContent } from "./components/help/HelpContent";
import { EducationFooter } from "./components/layout/EducationFooter";
import { Header } from "./components/layout/Header";
import { PageHeading } from "./components/layout/PageHeading";
import { Sidebar } from "./components/layout/Sidebar";
import { LeaseList } from "./components/leases/LeaseList";
import { Modal } from "./components/ui/Modal";
import useAppContext from "./contexts/AppContext";

export function App() {
  const { page, help, setHelp } = useAppContext();
  return (
    <MotionConfig reducedMotion="user">
      <div className="app">
        <Sidebar />
        <div className="main">
          <Header />
          <main>
            <PageHeading />
            <p className="notice" role="status">
              La connexion du portefeuille est disponible sur Base Sepolia. Les
              données et opérations des baux ne sont pas encore reliées au
              contrat.
            </p>
            {page === "Vue d’ensemble" && <DashboardSummary />}
            <LeaseList />
            <EducationFooter />
          </main>
        </div>
        <AnimatePresence>
          {help && (
            <Modal title="Comprendre Caution" onClose={() => setHelp(false)}>
              <HelpContent />
            </Modal>
          )}
        </AnimatePresence>
      </div>
    </MotionConfig>
  );
}
