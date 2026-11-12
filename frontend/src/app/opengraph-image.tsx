import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { getAntdTheme } from "@/theme/antdTheme";

export const alt = "mosaic.talent — build projects with other developers";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const SocialImage = async () => {
  const logo = await readFile(join(process.cwd(), "public/text-logo-light.svg"));
  const token = getAntdTheme("light").token!;
  // ImageResponse renders a fixed-size PNG; it requires inline styles rather than browser CSS.
  return new ImageResponse(<div style={{ display: "flex", flexDirection: "column", width: "100%", height: "100%", padding: 64, gap: 48, background: token.colorBgContainer, color: token.colorText, borderBottom: `16px solid ${token.colorPrimary}` }}>
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img src={`data:image/svg+xml;base64,${logo.toString("base64")}`} width={440} height={70} alt="mosaic.talent"/>
    <div style={{ display: "flex", maxWidth: 1000, fontSize: 70, fontWeight: 600, lineHeight: 1.15 }}>Build a project with other developers.</div>
    <div style={{ display: "flex", fontSize: 30, color: token.colorTextSecondary }}>Developer projects, teammates, and peer feedback.</div>
  </div>, size);
};
export default SocialImage;
