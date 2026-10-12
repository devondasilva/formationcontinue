import type { Metadata } from "next";
import { getClubs, getPlacements } from "@/lib/network";
import PageHero from "@/components/PageHero";
import ArrowButton from "@/components/ui/ArrowButton";
import ClubsGrid from "./ClubsGrid";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Clubs partenaires",
  description: "Les clubs qui accueillent les apprenants MADES en alternance et reçoivent du matériel pédagogique.",
};

export default function ClubsPage() {
  const placements = getPlacements();
  const clubs = getClubs()
    .filter((c) => c.status !== "suspendu")
    .map((c) => ({
      id: c.id,
      name: c.name,
      city: c.city,
      address: c.address,
      contactName: c.contactName,
      disciplines: c.disciplines,
      status: c.status,
      capacity: c.alternanceCapacity,
      active: placements.filter((p) => p.clubId === c.id && p.status === "en_cours").length,
    }))
    .sort((a, b) => a.city.localeCompare(b.city) || a.name.localeCompare(b.name));

  return (
    <div>
      <PageHero
        tag="Réseau MADES"
        title="Nos clubs"
        accent="partenaires."
        text="Pendant leur formation, les apprenants alternent entre les sessions MADES et le terrain, dans un club du réseau, aux côtés d'un coach tuteur. Les clubs reçoivent du matériel pédagogique adapté, suivi par leurs coachs."
      >
        <ArrowButton href="/login?next=/coach" variant="dark">
          Espace coach
        </ArrowButton>
      </PageHero>
      <ClubsGrid clubs={clubs} />
    </div>
  );
}
