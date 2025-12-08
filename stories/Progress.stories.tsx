import React from 'react';
import { Story, Meta } from '@storybook/react';
import { ProgressIndicator, ProgressIndicatorProps } from '../components/ProgressIndicator';

export default {
  title: 'Components/Progress',
  component: ProgressIndicator,
  parameters: {
    layout: 'centered',
  },
} as Meta;

// Convert render functions to proper components
const ProgressTemplate: Story<ProgressIndicatorProps> = (args) => {
  const [progress, setProgress] = React.useState(0);

  React.useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => (prev >= 100 ? 0 : prev + 10));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return <ProgressIndicator {...args} value={progress} />;
};

export const Default = ProgressTemplate.bind({});
Default.args = {
  size: 'medium',
  showLabel: true,
};

export const Small = ProgressTemplate.bind({});
Small.args = {
  size: 'small',
  showLabel: false,
};

export const Large = ProgressTemplate.bind({});
Large.args = {
  size: 'large',
  showLabel: true,
};