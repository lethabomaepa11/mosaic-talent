"use client";
import Link from "next/link";
import { AppOperatorPanel } from "@/components/app-operator";
import { useJourneyStyles } from "@/components/journey/styles";
import { useStyles } from "./style";
const HelpPage=()=>{
  const {styles}=useStyles();
  const {styles:ui}=useJourneyStyles();
  return <div className={styles.page}><p className={ui.eyebrow}>A little help moving forward</p><h1 className={ui.title}>You don’t need to figure it all out.</h1><p className={ui.lead}>Open the assistant for guidance, or follow the getting started guide at your own pace.</p><Link className={ui.link} href="/app/how-to">Read the getting started guide</Link><AppOperatorPanel/></div>;
};
export default HelpPage;
