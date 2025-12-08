import type { Meta, StoryObj } from "@storybook/react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const meta: Meta = {
  title: "Components/RFQ/VendorBidForm",
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Card>;

export const Default: Story = {
  render: () => <DemoBidForm />,
};

function DemoBidForm() {
  const [unitPrice, setUnitPrice] = useState(1250);
  const [notes, setNotes] = useState('Experienced in renovation work.');
  const [loading, setLoading] = useState(false);

  return (
    <Card className="w-[420px] p-4">
      <CardContent>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setLoading(true);
            setTimeout(() => setLoading(false), 700);
            // in Storybook we just simulate success
          }}
          className="space-y-4"
        >
          <Input
            type="number"
            label="Unit price"
            value={unitPrice}
            onChange={(e) => setUnitPrice(Number(e.target.value))}
            min={0}
          />

          <Textarea label="Notes (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} />

          <div className="flex gap-2">
            <Button type="submit" loading={loading}>
              Submit Bid
            </Button>
            <Button variant="ghost" onClick={() => { setUnitPrice(0); setNotes(''); }}>
              Reset
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
