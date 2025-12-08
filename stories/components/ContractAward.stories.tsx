import type { Meta, StoryObj } from "@storybook/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const meta: Meta = {
  title: "Components/Contracts/ContractAward",
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Card>;

export const Default: Story = {
  render: () => (
    <Card className="w-[540px]">
      <CardHeader className="p-4">
        <CardTitle>Award Contract</CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-medium">Acme Renovations</div>
            <div className="text-sm text-muted-foreground">Awarded for Lot 3</div>
          </div>
          <Badge>Active</Badge>
        </div>

        <div className="text-sm text-muted-foreground">Start: 2025-11-01</div>
        <div className="text-sm">Contract value: $12,500</div>

        <div className="flex gap-2 mt-4">
          <Button>View Contract</Button>
          <Button variant="ghost">Download</Button>
        </div>
      </CardContent>
    </Card>
  ),
};
