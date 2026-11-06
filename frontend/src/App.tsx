import { AnimatePresence, MotionConfig } from "motion/react";
import { DashboardSummary } from "./components/dashboard/DashboardSummary";
import { HelpContent } from "./components/help/HelpContent";
import { EducationFooter } from "./components/layout/EducationFooter";
import { Header } from "./components/layout/Header";
import { PageHeading } from "./components/layout/PageHeading";
import { Sidebar } from "./components/layout/Sidebar";
import { CreateLeaseForm } from "./components/leases/CreateLeaseForm";
import { LeaseDetails } from "./components/leases/LeaseDetails";
import { LeaseList } from "./components/leases/LeaseList";
import { Modal } from "./components/ui/Modal";
import { rentalDepositAddress } from "./config/contract";
import useAppContext from "./contexts/AppContext";

export function App() {
  const { page, help, setHelp, create, setCreate, selected, setSelected } =
    useAppContext();
  return (
    <MotionConfig reducedMotion="user">
      <div className="app">
        <Sidebar />
        <div className="main">
          <Header />
          <main>
            <PageHeading />
            {!rentalDepositAddress && (
              <p className="notice" role="status">
                La connexion du portefeuille est disponible sur Base Sepolia. Le
                contrat n’est pas encore déployé : les baux ne peuvent pas être
                lus ni créés.
              </p>
            )}
            {page === "Vue d’ensemble" && <DashboardSummary />}
            <LeaseList />
            <EducationFooter />
          </main>
        </div>
        <AnimatePresence>
          {create && (
            <Modal title="Créer un bail" onClose={() => setCreate(false)}>
              <CreateLeaseForm />
            </Modal>
          )}
          {selected !== undefined && (
            <Modal
              title={`Bail n°${selected}`}
              onClose={() => setSelected(undefined)}
            >
              <LeaseDetails id={selected} />
            </Modal>
          )}
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
