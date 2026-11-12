"use client";
import { InputNumber, Select } from "antd";
import type { IDeveloperProfile } from "@/providers/developer-provider/context";
import { PURPOSES } from "@/lib/buildJourney";
import { useJourneyStyles } from "./styles";
export const BuildPreferences = ({ value, onChange }: { value: Partial<IDeveloperProfile>; onChange: (patch: Partial<IDeveloperProfile>) => void }) => {
  const { styles: ui } = useJourneyStyles();
  const zones = typeof Intl.supportedValuesOf === "function" ? Intl.supportedValuesOf("timeZone") : ["Africa/Johannesburg", "Europe/London", "America/New_York", "Asia/Kolkata"];
  return <div className={ui.preferenceFields}>
    <div><label htmlFor="collaboration-intent">Your main goal</label><Select id="collaboration-intent" value={value.collaborationIntent ?? 0} onChange={(collaborationIntent) => onChange({ collaborationIntent })} options={PURPOSES.map((label, value) => ({label,value}))}/></div>
    <div><label htmlFor="weekly-hours">Hours available per week</label><InputNumber id="weekly-hours" min={1} max={40} value={value.weeklyHours} placeholder="For example, 4" onChange={(weeklyHours) => onChange({weeklyHours:weeklyHours??undefined})}/><small>Optional. Include time for tasks, meetings, and reviews.</small></div>
    <div><label htmlFor="working-timezone">Time zone</label><Select id="working-timezone" showSearch allowClear optionFilterProp="label" placeholder="Choose a time zone" value={value.timeZone || undefined} onChange={(timeZone) => onChange({timeZone:timeZone??""})} options={["UTC",...zones].map((value) => ({value,label:value.replaceAll("_"," ")}))}/><small className={ui.small}>Agree on meeting times with your team.</small></div>
  </div>;
};
