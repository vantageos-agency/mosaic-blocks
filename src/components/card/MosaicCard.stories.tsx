import type { Meta, StoryObj } from "@storybook/react";

import {
  MosaicCard,
  MosaicCardContent,
  MosaicCardDescription,
  MosaicCardFooter,
  MosaicCardHeader,
  MosaicCardTitle,
} from "./MosaicCard.js";

// Storybook needs a component whose PROPS are the story's realistic args —
// MosaicCard itself is a style-only <div> wrapper (HTMLAttributes), so this
// thin composition wrapper carries the French property-listing content while
// still rendering the real MosaicCard/*Header/*Title/*Content/*Footer parts.
interface AnnonceBienProps {
  title: string;
  description: string;
  loyer: string;
  statut: string;
}

function AnnonceBienCard({ title, description, loyer, statut }: AnnonceBienProps) {
  return (
    <MosaicCard style={{ maxWidth: 360 }}>
      <MosaicCardHeader>
        <MosaicCardTitle>{title}</MosaicCardTitle>
        <MosaicCardDescription>{description}</MosaicCardDescription>
      </MosaicCardHeader>
      <MosaicCardContent>
        <p>Loyer : {loyer}</p>
      </MosaicCardContent>
      <MosaicCardFooter>
        <span>{statut}</span>
      </MosaicCardFooter>
    </MosaicCard>
  );
}

const meta = {
  title: "Blocks/MosaicCard",
  component: AnnonceBienCard,
  tags: ["autodocs"],
} satisfies Meta<typeof AnnonceBienCard>;

export default meta;
type Story = StoryObj<typeof meta>;

// Property listing card — realistic French real-estate content.
export const AnnonceBien: Story = {
  name: "Fiche bien",
  args: {
    title: "Appartement T3 — 12 rue de la Paix, 75002 Paris",
    description: "68 m², 3e étage avec ascenseur, proche métro Opéra.",
    loyer: "1 850 €/mois charges comprises",
    statut: "Loué",
  },
};
