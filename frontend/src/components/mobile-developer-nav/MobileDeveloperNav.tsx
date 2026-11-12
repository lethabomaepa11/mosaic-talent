"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BriefcaseBusiness, Compass, Home, Lightbulb } from "lucide-react";
import { useStyles } from "./styles";
const items=[{href:"/app",label:"Home",icon:Home},{href:"/app/projects/open",label:"Explore",icon:Compass},{href:"/app/ideator",label:"Ideas",icon:Lightbulb},{href:"/app/work",label:"Projects",icon:BriefcaseBusiness}];
export const MobileDeveloperNav=()=>{
  const pathname=usePathname()??"";
  const {styles,cx}=useStyles();
  return <div className={styles.wrap}><nav className={styles.nav} aria-label="Developer mobile navigation">{items.map(({href,label,icon:Icon})=>{
    const active=href==="/app"?pathname===href:pathname.startsWith(href)||(href==="/app/work"&&pathname.startsWith("/app/build/"));
    return <Link key={href} href={href} className={cx(styles.item,active&&styles.itemActive)} aria-current={active?"page":undefined}><Icon size={21}/><span>{label}</span></Link>;
  })}</nav></div>;
};
