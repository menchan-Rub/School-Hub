import { UserBrowserHistory } from '@/app/components/admin/UserBrowserHistory';

interface Props {
  params: {
    id: string;
  };
}

export default function UserBrowserHistoryPage({ params }: Props) {
  return (
    <div className="container mx-auto py-6">
      <UserBrowserHistory userId={params.id} />
    </div>
  );
} 