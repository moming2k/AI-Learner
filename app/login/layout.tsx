import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Login - AI Learner',
  description: 'Access the AI-powered learning platform',
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
