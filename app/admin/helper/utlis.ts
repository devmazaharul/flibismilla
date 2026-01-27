// Menu Configuration (Static Items)
import {
    LayoutDashboard,
    Plane,
    Users,
    CreditCard,
    Settings,
    LifeBuoy,
    MapPin,
    Package,
    TicketPercent,
    User2
} from 'lucide-react';

export const navMain = [
    {
        title: 'Platform',
        items: [
            { title: 'Dashboard', url: '/admin', icon: LayoutDashboard },
            { title: 'Flight Bookings', url: '/admin/bookings', icon: Plane },
            { title: 'Customers', url: '/admin/customers', icon: Users },
            { title: 'Transactions', url: '/admin/transactions', icon: CreditCard },
        ],
    },
    {
        title: 'Content Management',
        items: [
            { title: 'Tour Packages', url: '/admin/packages', icon: Package },
            { title: 'Destinations', url: '/admin/destinations', icon: MapPin },
            { title: 'Special Offers', url: '/admin/offers', icon: TicketPercent },
        ],
    },
    {
        title: 'Settings',
        items: [
            { title: 'General', url: '/admin/settings', icon: Settings },
            { title: 'Internal Users', url: '/admin/internal-users', icon: User2 },
            { title: 'Support', url: '/admin/support', icon: LifeBuoy },
        ],
    },
];
