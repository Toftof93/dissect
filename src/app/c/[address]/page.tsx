import type { Metadata } from "next";
import { cachedDissect } from "@/lib/cached";
import { DissectForm } from "@/components/DissectForm";
import { Report } from "@/components/Report";

type Props = { params: Promise<{ address: string }> };
const LABEL = { clean: "Clean", suspicious: "Suspicious", malignant: "Malignant" };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { address } = await params;
  const r = await cachedDissect(address);
  if (!r.ok) return { title: "Dissect" };
  const s = r.specimen;
  const title = `${s.symbol ? "$" + s.symbol : "Contract"}: ${LABEL[s.diagnosis.verdict]} · Dissect`;
  const description = s.diagnosis.headline;
  return { title, description, openGraph: { title, description }, twitter: { card: "summary_large_image", title, description } };
}

export default async function Page({ params }: Props) {
  const { address } = await params;
  const r = await cachedDissect(address);
  return (
    <main className="wrap">
      <DissectForm compact />
      {r.ok ? (
        <Report s={r.specimen} at={r.at} />
      ) : (
        <div className="block error-box">
          <p className="label">Can’t cut this one</p>
          <h2>{r.error}</h2>
        </div>
      )}
    </main>
  );
}
