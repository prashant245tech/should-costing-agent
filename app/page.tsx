import ClientWrapper from "@/components/client-wrapper";

// Force dynamic rendering - skip static generation
export const dynamic = "force-dynamic";

export default function Home() {
  return <ClientWrapper />;
}
