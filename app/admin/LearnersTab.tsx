import { AdminLearner } from "./types";

export default function LearnersTab({ learners }: { learners: AdminLearner[] }) {
  if (learners.length === 0) return <p className="text-sm text-ink/60">Aucun apprenant enregistré pour le moment.</p>;
  return (
    <div className="rounded-card border border-ink/15 overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-ink text-white text-left">
          <tr>
            <th className="px-4 py-3 font-semibold">Nom</th>
            <th className="px-4 py-3 font-semibold">Email</th>
            <th className="px-4 py-3 font-semibold">Téléphone</th>
            <th className="px-4 py-3 font-semibold">Inscrit le</th>
          </tr>
        </thead>
        <tbody>
          {learners.map((l, i) => (
            <tr key={l.id} className={i % 2 === 0 ? "bg-ink/[0.02]" : "bg-white"}>
              <td className="px-4 py-3 font-semibold">{l.name}</td>
              <td className="px-4 py-3 text-ink/60">{l.email}</td>
              <td className="px-4 py-3 text-ink/60">{l.phone}</td>
              <td className="px-4 py-3 text-xs text-ink/40">{new Date(l.createdAt).toLocaleDateString("fr-FR")}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
