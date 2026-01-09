import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MountainIcon, TentIcon, CalendarDaysIcon } from "lucide-react"; // Example icons
import Link from "next/link";

export default function Home() {
  const dashboardItems = [
    { title: "Upcoming Tours", href: "/tours", icon: <MountainIcon className="h-6 w-6 text-primary" />, description: "View and manage your upcoming tours." },
    { title: "Material Reservations", href: "/reservations", icon: <TentIcon className="h-6 w-6 text-primary" />, description: "Reserve equipment for your next adventure." },
    { title: "Latest Documents", href: "/documents", icon: <CalendarDaysIcon className="h-6 w-6 text-primary" />, description: "Access important documents and guidelines." },
  ];

  return (
    <main className="flex min-h-screen flex-col items-center justify-start p-4 pt-10 sm:p-6 md:p-8 lg:p-12">
      <div className="text-center mb-10 md:mb-16">
        {/* You can replace this with the actual logo component or image later */}
        <div className="inline-block p-3 bg-primary rounded-full mb-4">
          <MountainIcon className="h-12 w-12 text-primary-foreground" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl">
          Welcome to Alpine Connect
        </h1>
        <p className="mt-3 text-base text-muted-foreground sm:mt-4 sm:text-lg md:text-xl">
          Your central hub for mountain adventures and community.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-6xl">
        {dashboardItems.map((item, index) => (
          <Link key={index} href={item.href} className="block hover:no-underline">
            <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-xl h-full">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg font-semibold">{item.title}</CardTitle>
                {item.icon}
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </main>
  );
}