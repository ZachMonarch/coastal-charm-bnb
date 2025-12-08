import type { Meta, StoryObj } from "@storybook/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const meta: Meta = {
  title: "Components/RFQ/BidSummary",
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Card>;

export const Default: Story = {
  render: () => (
    <Card className="w-[520px]">
      <CardHeader className="p-4">
        <CardTitle>Bid Summary</CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-medium">Acme Renovations</div>
            <div className="text-sm text-muted-foreground">Unit price: $1,250</div>
          </div>
          <Badge>Selected</Badge>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <div className="font-medium">BuildRight LLC</div>
            <div className="text-sm text-muted-foreground">Unit price: $1,350</div>
          </div>
          <span className="text-sm text-muted-foreground">2 days ago</span>
        </div>

        <div>
          <div className="text-sm text-muted-foreground">Notes:</div>
          <div className="text-sm">Experienced crew, includes material costs.</div>
        </div>
      </CardContent>
    </Card>
  ),
};
