import FullSidebar from "@/components/FullSidebar";
import MainTabs from "@/components/MainTabs";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import WelcomeBox from "@/components/WelcomeBox";
import React from "react";

export default function Index() {
  const [activeStep, setActiveStep] = React.useState("input");
  const [showGlossary, setShowGlossary] = React.useState(false);

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100 w-full">
        <FullSidebar activeStep={activeStep} onStepChange={setActiveStep} />
        
        <SidebarInset className="flex-1 relative">
          <main className="flex flex-col px-8 py-8 overflow-auto">
            <div className="w-full max-w-6xl mx-auto space-y-8">
              <WelcomeBox activeStep={activeStep} />
              
              <section className="space-y-6">
                <MainTabs 
                  activeStep={activeStep}
                  onShowGlossary={() => setShowGlossary(true)} 
                />
              </section>
              
              <div className="flex justify-end items-center">
                <div className="flex gap-3">
                  <button 
                    className="text-sm px-4 py-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100 transition-all duration-200 hover:shadow-sm"
                    onClick={() => setShowGlossary(true)}
                  >
                    Glossario
                  </button>
                  <button className="text-sm px-4 py-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100 transition-all duration-200 hover:shadow-sm">
                    Esporta
                  </button>
                </div>
              </div>
            </div>
            
            {showGlossary && (
              <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center backdrop-blur-sm">
                <div className="bg-white rounded-2xl p-8 shadow-2xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h3 className="text-2xl font-bold mb-2 text-slate-800">Glossario</h3>
                      <p className="text-slate-600">Definizioni tecniche</p>
                    </div>
                    <button
                      onClick={() => setShowGlossary(false)}
                      className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
                    >
                      <span className="text-2xl text-slate-400 hover:text-slate-600">&times;</span>
                    </button>
                  </div>
                  
                  <div className="space-y-6">
                    <div className="border-l-2 border-blue-500 pl-4">
                      <h4 className="font-bold text-lg text-blue-700 mb-2">Sharpe Ratio</h4>
                      <p className="text-slate-700 mb-3">
                        Misura il rendimento extra per unità di rischio.
                      </p>
                      <div className="bg-slate-100 rounded-lg p-3 mb-2 font-mono text-sm text-slate-700">
                        (Rendimento - Risk Free) / Volatilità
                      </div>
                    </div>
                    
                    <div className="border-l-2 border-blue-500 pl-4">
                      <h4 className="font-bold text-lg text-blue-700 mb-2">VaR</h4>
                      <p className="text-slate-700 mb-3">
                        Value at Risk - Perdita massima probabile.
                      </p>
                      <div className="bg-slate-100 rounded-lg p-3 font-mono text-sm text-slate-700">
                        μ - z × σ
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
} 