import * as React from "react";

interface TabsProps {
  children: React.ReactNode;
  defaultValue: string;
  className?: string;
}

const TabsContext = React.createContext<{
  activeTab: string;
  setActiveTab: (tab: string) => void;
} | undefined>(undefined);

export const Tabs: React.FC<TabsProps> = ({ children, defaultValue, className }) => {
  const [activeTab, setActiveTab] = React.useState(defaultValue);
  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  );
};

export const TabsList: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <div className={className}>{children}</div>
);

export const TabsTrigger: React.FC<{ children: React.ReactNode; value: string; className?: string }> = ({ children, value, className }) => {
  const context = React.useContext(TabsContext);
  if (!context) throw new Error('TabsTrigger must be used within Tabs');
  const { activeTab, setActiveTab } = context;
  return (
    <button
      className={className + (activeTab === value ? ' active' : '')}
      onClick={() => setActiveTab(value)}
      type="button"
    >
      {children}
    </button>
  );
};

export const TabsContent: React.FC<{ children: React.ReactNode; value: string; className?: string }> = ({ children, value, className }) => {
  const context = React.useContext(TabsContext);
  if (!context) throw new Error('TabsContent must be used within Tabs');
  const { activeTab } = context;
  if (activeTab !== value) return null;
  return <div className={className}>{children}</div>;
}; 