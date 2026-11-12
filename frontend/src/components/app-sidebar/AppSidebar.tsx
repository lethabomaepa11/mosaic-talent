"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "antd";
import { BriefcaseBusiness, CircleHelp, Compass, Home, Lightbulb, LogOut, PanelLeftClose, PanelLeftOpen, Plus, UserRound } from "lucide-react";
import { useAuthAction } from "@/providers/auth-provider";
import { Brand } from "@/components/journey/Brand";
import { useStyles } from "./styles";
const navigation = [
  {href:"/app",label:"Home",icon:Home},
  {href:"/app/projects/open",label:"Find a project",icon:Compass},
  {href:"/app/ideator",label:"Ideas",icon:Lightbulb},
  {href:"/app/work",label:"My projects",icon:BriefcaseBusiness},
  {href:"/app/build-profile",label:"Profile",icon:UserRound},
];
export const AppSidebar = ({collapsed=false,onCollapseToggle}:{collapsed?:boolean;onCollapseToggle?:()=>void}) => {
  const {styles,cx}=useStyles();
  const pathname=usePathname()??"";
  const router=useRouter();
  const {logout}=useAuthAction();
  return <aside className={cx(styles.sidebar,collapsed&&styles.sidebarCollapsed)} aria-label="Workspace navigation">
    <div className={cx(styles.logoRow,collapsed&&styles.logoRowCollapsed)}><Brand compact={collapsed}/>{onCollapseToggle&&<Button type="text" className={styles.collapseButton} icon={collapsed?<PanelLeftOpen size={17}/>:<PanelLeftClose size={17}/>} aria-label={collapsed?"Expand sidebar":"Collapse sidebar"} aria-expanded={!collapsed} onClick={onCollapseToggle}/>}</div>
    <div className={styles.body}><nav className={styles.navGroup}>{navigation.map(({href,label,icon:Icon})=>{
      const active=href==="/app"?pathname===href:pathname.startsWith(href)||(href==="/app/work"&&pathname.startsWith("/app/build/"));
      return <Link key={href} href={href} aria-label={label} title={collapsed?label:undefined} aria-current={active?"page":undefined} data-ai-route={href} className={cx(styles.navLink,styles.navButton,active&&styles.navButtonActive,collapsed&&styles.iconButton)}><Icon size={20}/>{!collapsed&&label}</Link>;
    })}</nav>
    <Link href="/app/projects/create" className={cx(styles.navButton,styles.startBuild,collapsed&&styles.iconButton)} aria-label="Create project"><Plus size={18}/>{!collapsed&&"Create project"}</Link>
    </div>
    <div className={styles.footer}>{!collapsed&&<Link className={styles.navButton} href="/app/how-to"><CircleHelp size={17}/> Getting started</Link>}
      <Button type="text" aria-label="Sign Out" icon={<LogOut size={17}/>} className={styles.signOut} onClick={async()=>{await logout();router.replace("/login");}}>{!collapsed&&"Sign out"}</Button></div>
  </aside>;
};
