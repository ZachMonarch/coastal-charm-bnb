import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useState } from "react";

const meta: Meta = {
  title: "Animations/Showcase",
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj;

export const AccordionAnimations: Story = {
  render: () => (
    <div className="max-w-2xl mx-auto space-y-4">
      <h2 className="text-2xl font-bold mb-4">Accordion Animations</h2>
      <p className="text-muted-foreground mb-6">
        Smooth expand/collapse animations with height and opacity transitions.
      </p>
      
      <Accordion type="single" collapsible>
        <AccordionItem value="item-1">
          <AccordionTrigger>Accordion Down Animation</AccordionTrigger>
          <AccordionContent>
            This content smoothly animates down with both height and opacity changes.
            The animation uses <code>accordion-down</code> with a 0.2s ease-out timing.
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-2">
          <AccordionTrigger>Height Calculation</AccordionTrigger>
          <AccordionContent>
            The animation automatically calculates the content height using CSS variables
            (<code>--radix-accordion-content-height</code>) for smooth transitions regardless
            of content size.
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-3">
          <AccordionTrigger>Multiple Items</AccordionTrigger>
          <AccordionContent>
            Each accordion item has independent animation timing, creating a polished
            interaction experience. Try opening multiple items to see the smooth transitions.
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <div className="mt-8 p-4 bg-muted rounded-lg">
        <h3 className="font-semibold mb-2">Animation Details</h3>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• <strong>Keyframes</strong>: <code>accordion-down</code> and <code>accordion-up</code></li>
          <li>• <strong>Duration</strong>: 0.2s</li>
          <li>• <strong>Timing</strong>: ease-out</li>
          <li>• <strong>Properties</strong>: height, opacity</li>
        </ul>
      </div>
    </div>
  ),
};

export const FadeAnimations: Story = {
  render: () => {
    const [show1, setShow1] = useState(false);
    const [show2, setShow2] = useState(false);

    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <h2 className="text-2xl font-bold mb-4">Fade Animations</h2>
        <p className="text-muted-foreground mb-6">
          Smooth fade in/out with subtle vertical translation for depth.
        </p>

        <div className="space-y-4">
          <div>
            <Button onClick={() => setShow1(!show1)} variant="outline">
              Toggle Fade In
            </Button>
            {show1 && (
              <Card className="mt-4 animate-fade-in">
                <CardHeader>
                  <CardTitle>Fade In Animation</CardTitle>
                  <CardDescription>
                    Animates from opacity 0 → 1 with 10px upward translation
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  The element smoothly fades in over 0.3s with ease-out timing,
                  creating a polished entrance effect.
                </CardContent>
              </Card>
            )}
          </div>

          <div>
            <Button onClick={() => setShow2(!show2)} variant="outline">
              Toggle Fade Out
            </Button>
            {!show2 && (
              <Card className="mt-4 animate-fade-out">
                <CardHeader>
                  <CardTitle>Fade Out Animation</CardTitle>
                  <CardDescription>
                    Animates from opacity 1 → 0 with 10px downward translation
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  The element smoothly fades out over 0.3s, removing itself
                  gracefully from the interface.
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        <div className="mt-8 p-4 bg-muted rounded-lg">
          <h3 className="font-semibold mb-2">Animation Details</h3>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• <strong>Fade In</strong>: opacity 0→1, translateY(10px)→0</li>
            <li>• <strong>Fade Out</strong>: opacity 1→0, translateY(0)→10px</li>
            <li>• <strong>Duration</strong>: 0.3s</li>
            <li>• <strong>Timing</strong>: ease-out</li>
          </ul>
        </div>
      </div>
    );
  },
};

export const ScaleAnimations: Story = {
  render: () => {
    const [show, setShow] = useState(true);

    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <h2 className="text-2xl font-bold mb-4">Scale Animations</h2>
        <p className="text-muted-foreground mb-6">
          Zoom in/out effects combined with opacity for emphasis.
        </p>

        <Button onClick={() => setShow(!show)} variant="outline">
          Toggle Scale Animation
        </Button>

        {show && (
          <Card className="animate-scale-in">
            <CardHeader>
              <CardTitle>Scale In Animation</CardTitle>
              <CardDescription>
                Scales from 95% → 100% while fading in
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                The scale-in effect creates a subtle "pop" that draws attention
                to the element without being overwhelming.
              </p>
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-primary/10 rounded-lg text-center hover-scale cursor-pointer">
                  <div className="text-2xl mb-2">🎯</div>
                  <div className="text-sm font-medium">Hover Scale</div>
                </div>
                <div className="p-4 bg-primary/10 rounded-lg text-center hover-scale cursor-pointer">
                  <div className="text-2xl mb-2">✨</div>
                  <div className="text-sm font-medium">Interactive</div>
                </div>
                <div className="p-4 bg-primary/10 rounded-lg text-center hover-scale cursor-pointer">
                  <div className="text-2xl mb-2">🚀</div>
                  <div className="text-sm font-medium">Smooth</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="mt-8 p-4 bg-muted rounded-lg">
          <h3 className="font-semibold mb-2">Animation Details</h3>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• <strong>Scale In</strong>: scale(0.95)→1, opacity 0→1</li>
            <li>• <strong>Scale Out</strong>: scale(1)→0.95, opacity 1→0</li>
            <li>• <strong>Duration</strong>: 0.2s</li>
            <li>• <strong>Timing</strong>: ease-out</li>
            <li>• <strong>Hover Scale</strong>: scale(1)→1.05 on hover (200ms)</li>
          </ul>
        </div>
      </div>
    );
  },
};

export const SlideAnimations: Story = {
  render: () => {
    const [showSlide, setShowSlide] = useState(false);

    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <h2 className="text-2xl font-bold mb-4">Slide Animations</h2>
        <p className="text-muted-foreground mb-6">
          Directional slide effects for sidebars, drawers, and panels.
        </p>

        <Button onClick={() => setShowSlide(!showSlide)} variant="outline">
          Toggle Slide In
        </Button>

        {showSlide && (
          <div className="fixed inset-0 z-50 bg-black/50" onClick={() => setShowSlide(false)}>
            <div
              className="absolute right-0 top-0 bottom-0 w-80 bg-background border-l shadow-xl animate-slide-in-right"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <h3 className="text-xl font-bold mb-4">Slide In Panel</h3>
                <p className="text-muted-foreground mb-4">
                  This panel slides in from the right side with smooth animation.
                </p>
                <Button onClick={() => setShowSlide(false)} className="w-full">
                  Close Panel
                </Button>
              </div>
            </div>
          </div>
        )}

        <div className="mt-8 p-4 bg-muted rounded-lg">
          <h3 className="font-semibold mb-2">Animation Details</h3>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• <strong>Slide In Right</strong>: translateX(100%)→0</li>
            <li>• <strong>Slide Out Right</strong>: translateX(0)→100%</li>
            <li>• <strong>Duration</strong>: 0.3s</li>
            <li>• <strong>Timing</strong>: ease-out</li>
            <li>• <strong>Use Cases</strong>: Sidebars, drawers, mobile menus</li>
          </ul>
        </div>
      </div>
    );
  },
};

export const CombinedAnimations: Story = {
  render: () => {
    const [show, setShow] = useState(false);

    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <h2 className="text-2xl font-bold mb-4">Combined Animations</h2>
        <p className="text-muted-foreground mb-6">
          Multiple animations working together for complex effects.
        </p>

        <Button onClick={() => setShow(!show)} variant="outline">
          Toggle Enter/Exit Animation
        </Button>

        {show && (
          <Card className="animate-enter">
            <CardHeader>
              <CardTitle>Combined Enter Animation</CardTitle>
              <CardDescription>
                Fade in + Scale in working simultaneously
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                The enter animation combines both fade and scale effects,
                creating a smooth and attention-grabbing entrance.
              </p>
              <div className="space-y-2">
                <div className="story-link">
                  <a href="#" className="text-primary">Hover to see underline animation</a>
                </div>
                <div className="story-link">
                  <a href="#" className="text-primary">Smooth left-to-right transition</a>
                </div>
                <div className="story-link">
                  <a href="#" className="text-primary">Using custom utility classes</a>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="mt-8 p-4 bg-muted rounded-lg">
          <h3 className="font-semibold mb-2">Animation Details</h3>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• <strong>Enter</strong>: fade-in 0.3s + scale-in 0.2s</li>
            <li>• <strong>Exit</strong>: fade-out 0.3s + scale-out 0.2s</li>
            <li>• <strong>Story Link</strong>: Underline animation on hover (300ms)</li>
            <li>• <strong>Timing</strong>: Staggered for depth perception</li>
          </ul>
        </div>
      </div>
    );
  },
};

export const AllAnimationsReference: Story = {
  render: () => (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h2 className="text-3xl font-bold mb-2">Animation System Reference</h2>
        <p className="text-muted-foreground">
          Complete overview of all available animations in the Monarch design system.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b">
              <th className="text-left p-3 font-semibold">Animation</th>
              <th className="text-left p-3 font-semibold">CSS Class</th>
              <th className="text-left p-3 font-semibold">Duration</th>
              <th className="text-left p-3 font-semibold">Properties</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b">
              <td className="p-3 font-medium">Accordion Down</td>
              <td className="p-3"><code>animate-accordion-down</code></td>
              <td className="p-3">0.2s ease-out</td>
              <td className="p-3">height, opacity</td>
            </tr>
            <tr className="border-b">
              <td className="p-3 font-medium">Accordion Up</td>
              <td className="p-3"><code>animate-accordion-up</code></td>
              <td className="p-3">0.2s ease-out</td>
              <td className="p-3">height, opacity</td>
            </tr>
            <tr className="border-b">
              <td className="p-3 font-medium">Fade In</td>
              <td className="p-3"><code>animate-fade-in</code></td>
              <td className="p-3">0.3s ease-out</td>
              <td className="p-3">opacity, translateY</td>
            </tr>
            <tr className="border-b">
              <td className="p-3 font-medium">Fade Out</td>
              <td className="p-3"><code>animate-fade-out</code></td>
              <td className="p-3">0.3s ease-out</td>
              <td className="p-3">opacity, translateY</td>
            </tr>
            <tr className="border-b">
              <td className="p-3 font-medium">Scale In</td>
              <td className="p-3"><code>animate-scale-in</code></td>
              <td className="p-3">0.2s ease-out</td>
              <td className="p-3">scale, opacity</td>
            </tr>
            <tr className="border-b">
              <td className="p-3 font-medium">Scale Out</td>
              <td className="p-3"><code>animate-scale-out</code></td>
              <td className="p-3">0.2s ease-out</td>
              <td className="p-3">scale, opacity</td>
            </tr>
            <tr className="border-b">
              <td className="p-3 font-medium">Slide In Right</td>
              <td className="p-3"><code>animate-slide-in-right</code></td>
              <td className="p-3">0.3s ease-out</td>
              <td className="p-3">translateX</td>
            </tr>
            <tr className="border-b">
              <td className="p-3 font-medium">Slide Out Right</td>
              <td className="p-3"><code>animate-slide-out-right</code></td>
              <td className="p-3">0.3s ease-out</td>
              <td className="p-3">translateX</td>
            </tr>
            <tr className="border-b">
              <td className="p-3 font-medium">Enter (Combined)</td>
              <td className="p-3"><code>animate-enter</code></td>
              <td className="p-3">0.3s ease-out</td>
              <td className="p-3">fade-in + scale-in</td>
            </tr>
            <tr className="border-b">
              <td className="p-3 font-medium">Exit (Combined)</td>
              <td className="p-3"><code>animate-exit</code></td>
              <td className="p-3">0.3s ease-out</td>
              <td className="p-3">fade-out + scale-out</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div>
        <h3 className="text-xl font-bold mb-4">Utility Classes</h3>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-left p-3 font-semibold">Class</th>
                <th className="text-left p-3 font-semibold">Effect</th>
                <th className="text-left p-3 font-semibold">Use Case</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="p-3"><code>.hover-scale</code></td>
                <td className="p-3">Scale to 105% on hover</td>
                <td className="p-3">Cards, images, interactive elements</td>
              </tr>
              <tr className="border-b">
                <td className="p-3"><code>.story-link</code></td>
                <td className="p-3">Underline animation on hover</td>
                <td className="p-3">Text links, navigation items</td>
              </tr>
              <tr className="border-b">
                <td className="p-3"><code>.pulse</code></td>
                <td className="p-3">Continuous pulse effect</td>
                <td className="p-3">Loading indicators, notifications</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="p-6 bg-muted rounded-lg">
        <h3 className="font-bold text-lg mb-3">Best Practices</h3>
        <ul className="space-y-2 text-muted-foreground">
          <li>• <strong>Performance</strong>: Use transform/opacity for GPU acceleration</li>
          <li>• <strong>Duration</strong>: Keep animations under 0.3s for responsiveness</li>
          <li>• <strong>Timing</strong>: Use ease-out for enter, ease-in for exit</li>
          <li>• <strong>Accessibility</strong>: Respect prefers-reduced-motion</li>
          <li>• <strong>Consistency</strong>: Use design system animations for cohesion</li>
        </ul>
      </div>
    </div>
  ),
};
