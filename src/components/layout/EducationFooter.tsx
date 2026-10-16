import { ArrowUpRight, Leaf } from "lucide-react";
import React from "react";
import useAppDemoContext from "../../contexts/AppDemoContext";

export function EducationFooter() {
  const { setHelp } = useAppDemoContext();
  return (
    <>
      <div className="bottom-grid">
        <div className="explain">
          <div className="explain-icon">
            <Leaf size={24} />
          </div>
          <div>
            <h3>Votre caution suit des règles. Pas des promesses.</h3>
            <p>
              Les fonds sont bloqués pendant le bail. En cas de désaccord, seul
              le montant contesté est soumis à un arbitre.
            </p>
            <button className="text-button" onClick={() => setHelp(true)}>
              Découvrir le fonctionnement <ArrowUpRight size={14} />
            </button>
          </div>
        </div>
        <div className="steps">
          <span className="eyebrow">UN PARCOURS TRANSPARENT</span>
          <div>
            {["Créez le bail", "Déposez la caution", "Récupérez vos fonds"].map(
              (s, i) => (
                <React.Fragment key={s}>
                  <div>
                    <span>{i + 1}</span>
                    <small>{s}</small>
                  </div>
                  {i < 2 && <span className="step-line" />}
                </React.Fragment>
              ),
            )}
          </div>
        </div>
      </div>
      <footer>
        <span>© 2026 Caution. La confiance, par contrat.</span>
        <span>
          <span className="mini-dot" />
          Prototype sur Base Sepolia · ETH de test uniquement
        </span>
      </footer>
    </>
  );
}
