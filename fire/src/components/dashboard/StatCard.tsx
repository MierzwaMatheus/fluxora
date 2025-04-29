
import { Card, CardContent } from "@/components/ui/card";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

export function StatCard({ title, value, icon, trend }: StatCardProps) {
  return (
    <Card className="shadow-sm">
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm text-muted-foreground font-roboto">{title}</p>
            <p className="text-2xl font-inter font-semibold mt-1">{value}</p>
            
            {trend && (
              <div className="flex items-center mt-2">
                <span className={`text-xs ${trend.isPositive ? 'text-fluxora-green' : 'text-fluxora-red'}`}>
                  {trend.isPositive ? '+' : ''}{trend.value}%
                </span>
              </div>
            )}
          </div>
          
          <div className="bg-slate-100 p-3 rounded-full">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
