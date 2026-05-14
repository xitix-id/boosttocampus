import { ClaimStatusCard } from "@/components/claim-shell";

type SuccessPageProps = {
  searchParams: {
    count?: string;
    phone?: string;
  };
};

export default function SuccessPage({ searchParams }: SuccessPageProps) {
  return <ClaimStatusCard status="success" count={searchParams.count} phone={searchParams.phone} />;
}
