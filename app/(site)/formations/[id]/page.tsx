import FormationDetailClient from "./FormationDetailClient";

export default function FormationDetailPage({ params }: { params: { id: string } }) {
  return <FormationDetailClient id={params.id} />;
}
