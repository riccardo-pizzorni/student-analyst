import {
  Sidebar,
  SidebarContent,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
import Logo from './Logo';
import {
  InputIcon,
  AnalisiStoricaIcon,
  PerformanceIcon,
  VolatilitaIcon,
  InterAssetIcon,
  FondamentaleIcon,
  OttimizzazioneIcon,
  StrategyIcon,
} from './icons/CustomIcons';
import { FileText } from 'lucide-react';
import React from 'react';

const SIDEBAR_STEPS = [
  { key: 'input', label: 'Input & Validazione', icon: InputIcon },
  { key: 'storica', label: 'Analisi Storica', icon: AnalisiStoricaIcon },
  { key: 'performance', label: 'Performance', icon: PerformanceIcon },
  { key: 'rischio', label: 'Volatilità & Rischio', icon: VolatilitaIcon },
  { key: 'diversificazione', label: 'Inter-Asset', icon: InterAssetIcon },
  { key: 'fondamentale', label: 'Fondamentale', icon: FondamentaleIcon },
  { key: 'ottimizzazione', label: 'Ottimizzazione', icon: OttimizzazioneIcon },
  { key: 'strategie', label: 'Strategie', icon: StrategyIcon },
  { key: 'regressiva', label: 'Analisi Regressiva', icon: FileText },
];

export default function FullSidebar({
  activeStep,
  onStepChange,
}: {
  activeStep: string;
  onStepChange: (step: string) => void;
}) {
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';

  return (
    <div className="relative">
      <Sidebar
        className="border-r-0 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 shadow-2xl transition-all duration-300 ease-out"
        collapsible="icon"
      >
        <SidebarContent className="overflow-hidden bg-transparent">
          {/* Header con Logo */}
          <div
            className={`flex items-center justify-center transition-all duration-300 ease-out ${isCollapsed ? 'p-3' : 'p-6'}`}
          >
            {!isCollapsed ? (
              <div className="w-full flex justify-center">
                <Logo />
              </div>
            ) : (
              <div className="flex justify-center items-center w-full">
                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-cyan-400/20 via-blue-500/25 to-cyan-400/20 rounded-xl blur-md opacity-0 group-hover:opacity-100 transition-all duration-500" />
                  <img
                    src="/lovable-uploads/abe9914b-c524-4d1c-b7ee-eeb4091ba47b.png"
                    alt="Student Analyst Logo"
                    className="w-8 h-8 relative z-10 drop-shadow-2xl filter brightness-110 contrast-110 transition-all duration-300 group-hover:scale-105 object-contain"
                    draggable={false}
                    style={{
                      imageRendering: 'crisp-edges',
                      objectFit: 'contain',
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Menu di Navigazione */}
          <SidebarGroupContent
            className={`transition-all duration-300 ${isCollapsed ? 'px-1 py-2' : 'px-4 py-2'}`}
          >
            <SidebarMenu className="space-y-1">
              {SIDEBAR_STEPS.map((item, index) => {
                const isActive = activeStep === item.key;

                return (
                  <SidebarMenuItem
                    key={item.key}
                    className="transition-all duration-300"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <SidebarMenuButton
                      onClick={() => onStepChange(item.key)}
                      className={`
                        group relative ${isCollapsed ? 'min-h-[44px] p-2 justify-center' : 'min-h-[52px]'} rounded-xl transition-all duration-300 overflow-hidden backdrop-blur-sm
                        ${
                          isActive
                            ? 'text-white shadow-xl scale-[1.02] glow-active'
                            : 'text-slate-300 hover:text-white hover:bg-gradient-to-r hover:from-slate-700/40 hover:to-slate-600/40 hover:scale-[1.01] hover:shadow-lg border-0'
                        }
                        sidebar-item-hover premium-hover border-0
                      `}
                      tooltip={isCollapsed ? item.label : undefined}
                    >
                      <div
                        className={`flex items-center w-full relative z-10 ${isCollapsed ? 'justify-center' : 'gap-4'}`}
                      >
                        <div
                          className={`
                          flex-shrink-0 w-6 h-6 flex items-center justify-center transition-all duration-200 rounded-lg individual-icon-hover
                          ${
                            isActive
                              ? 'text-cyan-300 bg-gradient-to-br from-cyan-500/15 to-blue-500/15 shadow-md transform scale-110 glow-icon'
                              : 'text-slate-400 group-hover:text-slate-200'
                          }
                        `}
                        >
                          <item.icon size={18} />
                        </div>

                        {!isCollapsed && (
                          <>
                            <div className="flex-1 text-left transition-all duration-300">
                              <span
                                className={`font-medium text-base transition-all duration-300 ${
                                  isActive
                                    ? 'text-white'
                                    : 'group-hover:text-white'
                                }`}
                              >
                                {item.label}
                              </span>
                            </div>

                            {isActive && (
                              <div className="w-1 h-10 bg-gradient-to-b from-cyan-400 via-blue-500 to-cyan-400 rounded-full shadow-lg animate-pulse glow-indicator" />
                            )}
                          </>
                        )}
                      </div>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarContent>
      </Sidebar>

      {/* Level 3 Cool Toggle Button */}
      <div className="absolute top-6 -right-3 z-50">
        <SidebarTrigger className="sidebar-toggle-level-3" />
      </div>
    </div>
  );
}
