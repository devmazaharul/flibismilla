import { MetadataRoute } from 'next';

const BASE_URL = 'https://flybismillah.com';


interface PackageData {
  slug: string;     
  updatedAt: string; 
}


async function getPackages(): Promise<PackageData[]> {
  try {
    const res = await fetch(`${BASE_URL}/api/dashboard/packages`, {
      method: 'GET',
      next: { revalidate: 3600*24*3 } 
    });

    if (!res.ok) {
      console.error('Failed to fetch packages for sitemap');
      return [];
    }

    const data = await res.json();
    
    return Array.isArray(data) ? data : data.data || [];
    
  } catch (error) {
    console.error('Error fetching packages:', error);
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  
  const staticRoutes = [
    '',         
    '/flight/search',    
    '/packages',    
    '/destinations',
    '/hotel',
    '/offers',
    '/about',       
    '/contact',    
    '/visa-process',
  ].map((route) => ({
    url: `${BASE_URL}${route}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: route === '' ? 1 : 0.8,  
  }));

  const packages = await getPackages();
  
  const dynamicRoutes = packages.map((pkg) => ({
    url: `${BASE_URL}/packages/${pkg.slug}`, 
    lastModified: new Date(pkg.updatedAt || new Date()),
    changeFrequency: 'weekly' as const,
    priority: 0.9, 
  }));


  return [...staticRoutes, ...dynamicRoutes];
}