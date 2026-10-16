import { AnimatePresence } from "motion/react";
import { ClaimNotice } from "./components/dashboard/ClaimNotice";
import { DashboardSummary } from "./components/dashboard/DashboardSummary";
import { HelpContent } from "./components/help/HelpContent";
import { EducationFooter } from "./components/layout/EducationFooter";
import { Header } from "./components/layout/Header";
import { PageHeading } from "./components/layout/PageHeading";
import { RoleSwitcher } from "./components/layout/RoleSwitcher";
import { Sidebar } from "./components/layout/Sidebar";
import { CreateLeaseForm } from "./components/leases/CreateLeaseForm";
import { LeaseDetails } from "./components/leases/LeaseDetails";
import { LeaseList } from "./components/leases/LeaseList";
import { Modal } from "./components/ui/Modal";
import { Toast } from "./components/ui/Toast";
import useAppDemoContext from "./contexts/AppDemoContext";
export function App() {
  const app = useAppDemoContext();
  const closeModal = () => {
    app.setCreate(false);
    app.setSelected(null);
    app.setHelp(false);
  };
  return (
    <div className="app">
      <Sidebar />
      <div className="main">
        <Header />
        <main>
          <PageHeading />
          <RoleSwitcher />
          {app.page === "Vue d’ensemble" && (
            <>
              <DashboardSummary />
              {app.leases.some((lease) => lease.status === "Réclamation") && (
                <ClaimNotice />
              )}
            </>
          )}
          <LeaseList />
          <EducationFooter />
        </main>
      </div>
      <AnimatePresence>
        {(app.create || app.selected || app.help) && (
          <Modal
            title={
              app.create
                ? "Créer un bail"
                : app.help
                  ? "Comprendre Caution"
                  : "Détail du bail"
            }
            onClose={closeModal}
          >
            {app.create ? (
              <CreateLeaseForm />
            ) : app.help ? (
              <HelpContent />
            ) : (
              <LeaseDetails />
            )}
          </Modal>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {app.toast && (
          <Toast message={app.toast} onDismiss={() => app.setToast("")} />
        )}
      </AnimatePresence>
    </div>
  );
}
