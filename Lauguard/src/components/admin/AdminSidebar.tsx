
import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Sidebar, 
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton
} from '@/components/ui/sidebar';
import { ChartBar, Database, FileText, Settings, Shield } from 'lucide-react';

const AdminSidebar: React.FC = () => {
  const navigation = [
    { name: 'Dashboard', href: '/admin', icon: ChartBar },
    { name: 'Adversarial Prompts', href: '/admin/adversarial', icon: Shield },
    { name: 'Prompt Logs', href: '/admin/logs', icon: FileText },
    { name: 'Departments', href: '/admin/departments', icon: Database },
    { name: 'Security Rules', href: '/admin/rules', icon: Settings },
  ];

  return (
    <Sidebar>
      <SidebarHeader className="px-4 py-6">
        <div className="flex items-center">
          <Shield className="h-6 w-6 text-guard-blue" />
          <span className="ml-2 text-lg font-semibold">LauGuard</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Administration</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigation.map((item) => (
                <SidebarMenuItem key={item.name}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.href}
                      className={({ isActive }) => isActive ? "text-guard-blue" : "text-gray-600 hover:text-guard-blue"}
                    >
                      <item.icon className="h-5 w-5" />
                      <span>{item.name}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="px-4 py-6">
        <div className="text-xs text-gray-500">
          Lauguard v6.0
        </div>
      </SidebarFooter>
    </Sidebar>
  );
};

export default AdminSidebar;
