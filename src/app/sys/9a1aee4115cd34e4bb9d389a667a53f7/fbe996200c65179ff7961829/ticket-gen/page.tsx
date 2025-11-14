import { Metadata } from 'next';
import TicketGeneratorApp from '@/components/internal/ticket-generator/TicketGeneratorApp';

export const metadata: Metadata = {
  title: 'Sistema Interno',
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      'max-image-preview': 'none',
      'max-snippet': 0,
      'max-video-preview': 0,
    },
  },
  other: {
    'X-Robots-Tag': 'noindex, nofollow, noarchive, nosnippet',
  },
};

export default function TicketGeneratorPage() {
  return <TicketGeneratorApp />;
}
