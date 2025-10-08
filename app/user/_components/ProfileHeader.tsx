import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Calendar, Edit, LayoutDashboard } from "lucide-react";


const ProfileHeader = () => {
    return (
        <div>
            <Card className="p-6 sm:p-8 rounded-3xl border-0 shadow-[var(--shadow-lift)] mb-8 bg-gradient-to-br from-background to-muted/20">
                <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                    <Avatar className="w-24 h-24 sm:w-32 sm:h-32 border-4 border-primary shadow-lg">
                        <AvatarImage src="" />
                        <AvatarFallback className="text-2xl">JD</AvatarFallback>
                    </Avatar>

                    <div className="flex-1 space-y-3">
                        <div className="flex flex-wrap items-center gap-3">
                            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">John Doe</h1>
                        </div>
                        <p className="text-muted-foreground leading-relaxed">nice guy</p>
                        <div className="flex flex-wrap gap-4 text-sm">
                            <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-muted-foreground" />
                                <span className="text-muted-foreground">Member since 2025</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-3 w-full md:w-auto">
                        <Link href="/user/profile" className="flex-1 md:flex-none">
                            <Button
                                variant="default"
                                className="w-full rounded-2xl"
                            >
                                <LayoutDashboard className="w-4 h-4 mr-2" />
                                Dashboard
                            </Button>
                        </Link>
                        <Link href="/user/settings" className="flex-1 md:flex-none">
                            <Button variant="outline" className="w-full rounded-2xl">
                                <Edit className="w-4 h-4 mr-2" />
                                Edit Profile
                            </Button>
                        </Link>
                    </div>
                </div>
            </Card>
        </div>
    )
}

export default ProfileHeader