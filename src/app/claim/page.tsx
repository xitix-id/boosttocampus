import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ClaimForm } from "@/components/claim-form";
import { ClaimShell } from "@/components/claim-shell";
import { evaluateClaimGate } from "@/lib/claim-service";
import { activeCampaignId, getClaimStatusPath, getClientIp } from "@/lib/claim-utils";

type ClaimPageProps = {
  searchParams: {
    code?: string;
    campaign?: string;
  };
};

export default async function ClaimPage({ searchParams }: ClaimPageProps) {
  const gate = await evaluateClaimGate({
    code: searchParams.code,
    campaignId: searchParams.campaign || activeCampaignId,
    ipAddress: getClientIp(headers())
  });

  if (gate.status !== "valid") {
    redirect(getClaimStatusPath(gate.status));
  }

  return (
    <ClaimShell>
      <ClaimForm uniqueCode={gate.uniqueCode} campaignId={gate.campaignId} />
    </ClaimShell>
  );
}
