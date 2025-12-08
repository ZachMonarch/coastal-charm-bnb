import type { Meta, StoryObj } from '@storybook/react';
import { BrowserRouter } from 'react-router-dom';
import NavDropdown from '@/components/layout/NavDropdown';
import { Building2, Briefcase, Wrench } from 'lucide-react';

const meta = {
  title: 'Components/Navigation/NavDropdown',
  component: NavDropdown,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <BrowserRouter>
        <div className="p-8 min-h-[400px]">
          <Story />
        </div>
      </BrowserRouter>
    ),
  ],
  argTypes: {
    label: {
      control: 'text',
      description: 'The label displayed on the dropdown trigger',
    },
    items: {
      control: 'object',
      description: 'Array of dropdown menu items',
    },
  },
} satisfies Meta<typeof NavDropdown>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Properties: Story = {
  args: {
    label: 'Properties',
    items: [
      { label: 'Residential', href: '/properties?type=residential', icon: <Building2 className="w-4 h-4" /> },
      { label: 'Commercial', href: '/properties?type=commercial', icon: <Briefcase className="w-4 h-4" /> },
      { label: 'Luxury', href: '/properties?type=luxury', description: 'High-end properties' },
    ],
  },
};

export const Services: Story = {
  args: {
    label: 'Services',
    items: [
      { label: 'Property Management', href: '/services/management', description: 'Full-service property care' },
      { label: 'Consultation', href: '/services/consultation', description: 'Expert property advice' },
      { label: 'Maintenance', href: '/services/maintenance', icon: <Wrench className="w-4 h-4" /> },
    ],
  },
};

export const WithManyItems: Story = {
  args: {
    label: 'More Options',
    items: [
      { label: 'Option 1', href: '/option-1' },
      { label: 'Option 2', href: '/option-2' },
      { label: 'Option 3', href: '/option-3' },
      { label: 'Option 4', href: '/option-4' },
      { label: 'Option 5', href: '/option-5' },
      { label: 'Option 6', href: '/option-6' },
    ],
  },
};
