import { notFound } from "next/navigation";
import { getOwnedPrepContext } from "@/lib/owned-prep-context";
import { MockInterviewClient } from "./mock-interview-client";

export default async function MockInterviewPage({ params }: { params: Promise<{ contextId: string }> }) {
  const { contextId } = await params;
  const context = await getOwnedPrepContext(contextId);
  if (!context) notFound();
  return <MockInterviewClient prepContextId={context.id} company={context.company} role={context.role} authenticated={Boolean(context.user_id)} />;
}
