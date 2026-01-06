"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

// ১. যেই কম্পোনেন্টে useSearchParams ব্যবহার করবেন, সেটি আলাদা করুন
const SearchContent = () => {
  const searchParams = useSearchParams();

  // URL থেকে ডাটা রিড করা (Example)
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const date = searchParams.get("date");

  return (
    <div className="p-10 text-center">
      <h2 className="text-xl font-bold">Search Results</h2>
      <p>From: {from}</p>
      <p>To: {to}</p>
      <p>Date: {date}</p>
    </div>
  );
};

// ২. মেইন পেজ কম্পোনেন্টে Suspense দিয়ে র‍্যাপ (Wrap) করে দিন
export default function Page() {
  return (
    <Suspense fallback={<div className="text-center p-10">Loading Search Data...</div>}>
      <SearchContent />
    </Suspense>
  );
}