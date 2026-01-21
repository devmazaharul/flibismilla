"use client";
import Image from "next/image";
import Link from "next/link";
import { blogsData } from "@/constant/data";

import { FaCalendarAlt, FaUser, FaArrowRight } from "react-icons/fa";
import { appTheme } from "@/constant/theme/global";

const Blog = () => {
  const { colors, layout, typography } = appTheme;

  return (
    <section className={`bg-white ${layout.sectionPadding}`}>
      <div className={layout.container}>
        
        {/* ================= Section Header ================= */}
        <div className="text-center mb-16">
          <span className={`${typography.subtitle} block mb-2`}>
            Our Blog
          </span>
          <h2 className={`${typography.h2} ${colors.text.heading} mb-4`}>
            Latest <span className="text-rose-600">Travel News</span> & Tips
          </h2>
          <p className={`${colors.text.body} max-w-2xl mx-auto`}>
            Stay updated with the latest travel guides, Hajj & Umrah news, and exclusive offers.
          </p>
        </div>

        {/* ================= Blog Grid ================= */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {blogsData.map((blog) => (
            <article 
              key={blog.id} 
              className={`group bg-white ${layout.radius.card} overflow-hidden border border-gray-200/80 shadow-2xl shadow-gray-100 hover:shadow-xl transition-all duration-300 flex flex-col h-full`}
            >
              
              {/* Image Wrapper */}
              <div className="relative h-60 w-full overflow-hidden">
                <Image
                  src={blog.image}
                  alt={blog.title}
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-700"
                />
                
                {/* Date Badge (Overlay) */}
                <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-md text-sm font-bold text-gray-800 shadow-2xl shadow-gray-100 flex items-center gap-2">
                  <FaCalendarAlt className="text-rose-600" /> {blog.date}
                </div>
              </div>

              {/* Content Wrapper */}
              <div className="p-6 flex flex-col flex-grow">
                
                {/* Author Meta */}
                <div className="flex items-center gap-2 text-xs font-semibold text-rose-600 mb-3 uppercase tracking-wider">
                  <FaUser /> 
                  <span>By {blog.author}</span>
                </div>

                {/* Title */}
                <h3 className={`${typography.h3} text-xl mb-3 line-clamp-2 group-hover:text-rose-600 transition-colors`}>
                  <Link href={`#`}>
                    {blog.title}
                  </Link>
                </h3>

                {/* Excerpt */}
                <p className={`${colors.text.body} mb-6 line-clamp-3 flex-grow`}>
                  {blog.excerpt}
                </p>

                {/* Read More Link */}
                <div className="pt-4 border-t border-gray-100">
                  <Link 
                    href={`#`} 
                    className="inline-flex items-center gap-2 font-bold text-gray-800 hover:text-rose-600 transition-colors group/link"
                  >
                    Read More 
                    <FaArrowRight className="text-sm transition-transform group-hover/link:translate-x-1" />
                  </Link>
                </div>

              </div>
            </article>
          ))}
        </div>

      </div>
    </section>
  );
};

export default Blog;