"use client";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Alert, Button, Input, Select, Skeleton } from "antd";
import { ArrowLeft } from "lucide-react";
import { useDeveloperAction } from "@/providers/developer-provider";
import type { IDeveloperProfile } from "@/providers/developer-provider/context";
import { BuildPreferences } from "@/components/journey/BuildPreferences";
import { useJourneyStyles } from "@/components/journey/styles";
import { toast } from "@/components/providers";
import { useStyles } from "./style";

const BuildProfilePage=()=>{
  const [draft,setDraft]=useState<IDeveloperProfile>();
  const [error,setError]=useState("");
  const [saving,setSaving]=useState(false);
  const {styles}=useStyles();
  const {styles:ui}=useJourneyStyles();
  const {fetchMyProfile,upsertMyProfile}=useDeveloperAction();
  const fetchRef=useRef(fetchMyProfile);
  useEffect(()=>{fetchRef.current=fetchMyProfile;},[fetchMyProfile]);
  const load=useCallback(async()=>{try{setError("");const profile=await fetchRef.current();if(!profile)throw new Error("Your profile could not be loaded. Please try again.");setDraft({...profile,collaborationIntent:profile.collaborationIntent??0});}catch(error){setError(error instanceof Error?error.message:"Please try again.");}},[]);
  useEffect(()=>{void load();},[load]);
  const patch=(value:Partial<IDeveloperProfile>)=>setDraft(current=>current?{...current,...value}:current);
  const save=async()=>{if(!draft||saving)return;setSaving(true);try{setError("");setDraft(await upsertMyProfile(draft));toast.success("Preferences saved","Your team suggestions will use your updated preferences.");}catch(error){setError(error instanceof Error?error.message:"Your changes were not saved. Please try again.");}finally{setSaving(false);}};
  return <div className={styles.page}>
    <Link href="/app" className={ui.link}><ArrowLeft size={16}/> Home</Link>
    <header><h1 className={ui.title}>Profile & availability</h1><p className={ui.lead}>Set your skills, goals, and the time you can commit to a project.</p></header>
    {error&&<Alert showIcon type="error" title={error} action={!draft?<Button onClick={()=>void load()}>Try again</Button>:undefined}/>}
    {!draft?!error&&<Skeleton active/>:<form className={styles.form} onSubmit={event=>{event.preventDefault();void save();}}>
      <section className={ui.panel}><BuildPreferences value={draft} onChange={patch}/></section>
      <section className={ui.panel}><div className={styles.fields}><div><label htmlFor="build-skills">Skills you bring or want to practice</label><Select id="build-skills" mode="tags" tokenSeparators={[","]} value={draft.skills} onChange={skills=>patch({skills})} placeholder="Add a skill and press Enter"/></div><div><label htmlFor="build-goals">What would you like to learn?</label><Select id="build-goals" mode="tags" tokenSeparators={[","]} value={draft.goals} onChange={goals=>patch({goals})} placeholder="Add a goal and press Enter"/></div><div><label htmlFor="build-bio">Bio</label><Input.TextArea id="build-bio" maxLength={2000} rows={4} value={draft.bio} onChange={event=>patch({bio:event.target.value})}/></div></div></section>
      <div className={ui.sectionHeader}><Link className={ui.link} href="/app/profile">Full profile & GitHub settings</Link><Button type="primary" htmlType="submit" size="large" loading={saving}>Save preferences</Button></div>
    </form>}
  </div>;
};
export default BuildProfilePage;
