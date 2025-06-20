import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import {
  BookOpen,
  FolderKanban,
  BarChart3,
  Zap,
  Info,
  Smile,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const items = [
  {
    title: 'Input & Dati',
    icon: FolderKanban,
    active: true,
  },
  {
    title: 'Storico',
    icon: BarChart3,
  },
  {
    title: 'Performance',
    icon: Zap,
  },
  {
    title: 'Fondamentale',
    icon: BookOpen,
  },
];

export function AppSidebar() {
  return (
    <Sidebar className="bg-[--sidebar-background] min-h-screen border-r">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>
            <span className="font-extrabold text-lg tracking-tight text-[--sidebar-primary]">
              Student Analyst
            </span>
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item, i) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    isActive={item.active}
                    className="gap-3 rounded-lg"
                  >
                    <item.icon
                      className={`bg-blue-100 text-blue-700 rounded-full p-1`}
                      size={22}
                    />
                    <span className="text-md font-semibold">{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup className="mt-12">
          <SidebarGroupLabel>Roadmap</SidebarGroupLabel>
          <SidebarGroupContent>
            <div className="flex flex-col gap-2 px-2">
              <Badge variant="secondary" className="w-fit px-3 py-1">
                🎓 Step 1 di 8
              </Badge>
              <div className="w-full pt-2">
                <div className="h-2 w-full bg-gray-200 rounded-full relative overflow-hidden">
                  <div
                    className="bg-blue-500 h-2 rounded-full"
                    style={{ width: '18%' }}
                  />
                </div>
                <span className="text-xs text-muted-foreground mt-1 block text-right">
                  Quasi fatto!
                </span>
              </div>
            </div>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

export default AppSidebar;
