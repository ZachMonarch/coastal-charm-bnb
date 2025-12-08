import type { Meta, StoryObj } from '@storybook/react';
import { BrowserRouter } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { AuthProvider } from '@/contexts/OptimizedAuthContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

const meta = {
  title: 'Components/Navbar',
  component: Navbar,
  parameters: { layout: 'fullscreen' },
  decorators: [
    (Story) => (
      <BrowserRouter>
        <QueryClientProvider client={queryClient}>
          <LanguageProvider>
            <AuthProvider>
              <Story />
            </AuthProvider>
          </LanguageProvider>
        </QueryClientProvider>
      </BrowserRouter>
    ),
  ],
  tags: ['autodocs'],
} satisfies Meta<typeof Navbar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const MobileView: Story = {
  parameters: { viewport: { defaultViewport: 'mobile1' } },
};
export const DarkMode: Story = {
  parameters: { backgrounds: { default: 'dark' } },
};
