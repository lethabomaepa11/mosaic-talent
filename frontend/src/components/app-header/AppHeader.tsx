"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Avatar, Button, Dropdown } from "antd";
import { Compass, Moon, Sun } from "lucide-react";
import { useAppearanceAction,useAppearanceState } from "@/providers/appearance-provider";
import { useDeveloperState } from "@/providers/developer-provider";
import { useAuthAction } from "@/providers/auth-provider";
import { NotificationCenter } from "@/components/notification-center";
import { Brand } from "@/components/journey/Brand";
import { useStyles } from "./styles";
export const AppHeader=()=>{
  const {styles}=useStyles();
  const {mode}=useAppearanceState();
  const {toggleMode}=useAppearanceAction();
  const {currentUser,profile}=useDeveloperState();
  const {logout}=useAuthAction();
  const router=useRouter();
  const path=usePathname()??"";
  const name=[currentUser?.name,currentUser?.surname].filter(Boolean).join(" ");
  const initials=name.split(" ").filter(Boolean).slice(0,2).map(value=>value[0]).join("")||"You";
  const label=path==="/app"?"Home":path.includes("/ideator")?"Ideas":path.includes("/work")?"My projects":path.includes("/build-profile")?"Profile":path.includes("/projects/open")?"Find a project":"Projects";
  return <header className={styles.header}>
    <div className={styles.mobileBrand}><Brand/></div><span className={styles.context}>{label}</span>
    <div className={styles.actions}>
      <Link href="/app/projects/open" className={styles.findLink}><Compass size={17}/> Find a project</Link>
      <NotificationCenter buttonAriaLabel="Notifications"/>
      <Button type="text" icon={mode==="dark"?<Sun size={19}/>:<Moon size={19}/>} aria-label={mode==="dark"?"Switch to light mode":"Switch to dark mode"} onClick={toggleMode}/>
      <Dropdown trigger={["click"]} menu={{items:[
        {key:"profile",label:"Your profile & preferences",onClick:()=>router.push("/app/build-profile")},
        {key:"work",label:"My projects",onClick:()=>router.push("/app/work")},
        {key:"reviews",label:"Peer feedback",onClick:()=>router.push("/app/reviews")},
        {key:"guide",label:"Getting started",onClick:()=>router.push("/app/how-to")},
        {key:"help",label:"Ask for help",onClick:()=>router.push("/app/help")},
        {key:"settings",label:"Settings",onClick:()=>router.push("/app/preferences")},
        {type:"divider"},
        {key:"logout",label:"Sign out",onClick:async()=>{await logout();router.replace("/login");}},
      ]}}><button className={styles.avatarButton} aria-label="Your profile and settings"><Avatar src={profile.avatarUrl||undefined} size={34}>{initials}</Avatar></button></Dropdown>
    </div>
  </header>;
};
