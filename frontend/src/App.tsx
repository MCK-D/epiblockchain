import { AnimatePresence, MotionConfig } from "motion/react";
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
import { useDemoApp } from "./hooks/useDemoApp";
export function App() {
  const app = useDemoApp();
  const closeModal = () => {
    app.setCreate(false);
    app.setSelected(null);
    app.setHelp(false);
  };
  return (
    <MotionConfig reducedMotion="user">
      <div className="app">
        <Sidebar
          mobile={app.mobile}
          page={app.page}
          setPage={app.setPage}
          setMobile={app.setMobile}
          leases={app.leases}
          setHelp={app.setHelp}
        />
        <div className="main">
          <Header
            mobile={app.mobile}
            setMobile={app.setMobile}
            page={app.page}
            connected={app.connected}
            setConnected={app.setConnected}
            notify={app.notify}
          />
          <main>
            <PageHeading page={app.page} setCreate={app.setCreate} />
            <RoleSwitcher
              role={app.role}
              setRole={app.setRole}
              setPage={app.setPage}
            />
            {app.page === "Vue d’ensemble" && (
              <>
                <DashboardSummary
                  leases={app.leases}
                  balance={app.balance}
                  connected={app.connected}
                  setBalance={app.setBalance}
                  notify={app.notify}
                />
                {app.leases.some((lease) => lease.status === "Réclamation") && (
                  <ClaimNotice
                    leases={app.leases}
                    setSelected={app.setSelected}
                  />
                )}
              </>
            )}
            <LeaseList
              leases={app.leases}
              filter={app.filter}
              setFilter={app.setFilter}
              page={app.page}
              setPage={app.setPage}
              query={app.query}
              setQuery={app.setQuery}
              setSelected={app.setSelected}
            />
            <EducationFooter setHelp={app.setHelp} />
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
                <CreateLeaseForm
                  leases={app.leases}
                  save={app.save}
                  setCreate={app.setCreate}
                  notify={app.notify}
                />
              ) : app.help ? (
                <HelpContent
                  setLeases={app.setLeases}
                  setBalance={app.setBalance}
                  notify={app.notify}
                  setHelp={app.setHelp}
                />
              ) : (
                <LeaseDetails
                  selected={app.selected}
                  role={app.role}
                  act={app.act}
                  notify={app.notify}
                />
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
    </MotionConfig>
  );
}
