import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import ProfileSidebar from '@/components/profile/ProfileSidebar';
import SubscriptionManagement from '@/components/profile/SubscriptionManagement';

export default function SubscriptionsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-[260px,1fr] gap-6">
          <ProfileSidebar />
          <div className="space-y-8">
            <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-lg">
              <CardHeader>
                <CardTitle>Підписки та тарифи</CardTitle>
                <CardDescription>Керуйте підписками на AI сервіси і тарифними планами</CardDescription>
              </CardHeader>
              <CardContent>
                <SubscriptionManagement />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
