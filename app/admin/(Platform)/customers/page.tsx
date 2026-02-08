'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Download,
  User,
  Calendar,
  MapPin,
  Phone,
  Mail,
  Eye,
  EyeOff,
  Loader2,
  Plane,
  IdCard,
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

export interface Passenger {
  id: string;
  firstName: string;
  lastName: string;
  type: string;
  gender: string;
  dob: string;
  passportNumber: string;
  passportExpiry: string;
  passportCountry: string;
  email: string;
  phone: string;
  lastPnr: string;
  lastBookingRef: string;
  lastTravelDate: string;
  cardNumber: string;
  cardHolderName: string;
  cardExpiry: string;
  fullBillingAddress: string;
}

type PassengerApiResponse = {
  success: boolean;
  data: Passenger[];
};

// নিরাপদ date format helper
const safeFormat = (value: string, fmt: string) => {
  if (!value || value === 'N/A') return 'N/A';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return format(d, fmt);
};

const SensitiveData: React.FC<{ value: string }> = ({ value }) => {
  const [show, setShow] = useState(false);

  if (!value || value === 'N/A') {
    return <span className="text-slate-400 text-xs">N/A</span>;
  }

  const masked = `•••• •••• •••• ${value.slice(-4)}`;

  return (
    <div className="flex items-center gap-2">
      <span
        className={`font-mono text-xs ${
          show ? 'text-slate-800' : 'text-slate-500 tracking-widest'
        }`}
      >
        {show ? value : masked}
      </span>
      <button
        type="button"
        onClick={() => setShow((prev) => !prev)}
        className="inline-flex cursor-pointer h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400 hover:text-slate-700 hover:border-slate-300 transition"
      >
        {show ? <EyeOff size={12} /> : <Eye size={12} />}
      </button>
    </div>
  );
};

const PassengerListPage: React.FC = () => {
  const [passengers, setPassengers] = useState<Passenger[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Data fetch
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/dashboard/passengers');
        const data: PassengerApiResponse = await res.json();

        if (data.success) {
          setPassengers(data.data);
        } else {
          toast.error('Failed to load passengers');
        }
      } catch (error) {
        toast.error('Server error');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter
  const filteredData = useMemo(
    () =>
      passengers.filter((p) => {
        const term = searchTerm.trim().toLowerCase();
        if (!term) return true;

        return (
          p.firstName?.toLowerCase().includes(term) ||
          p.lastName?.toLowerCase().includes(term) ||
          p.phone?.includes(term) ||
          p.lastPnr?.toLowerCase().includes(term) ||
          p.email?.toLowerCase().includes(term)
        );
      }),
    [passengers, searchTerm]
  );

  // Small stats
  const totalPassengers = passengers.length;
  const withCardProfile = useMemo(
    () => passengers.filter((p) => p.cardNumber && p.cardNumber !== 'N/A').length,
    [passengers]
  );
  const withPassport = useMemo(
    () => passengers.filter((p) => p.passportNumber && p.passportNumber !== 'N/A').length,
    [passengers]
  );



  // Loading state – layout theke height asbe, tai h-full use kora
  if (loading && passengers.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="h-12 w-12 rounded-full bg-white shadow-md flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-slate-500" />
          </div>
          <p className="text-sm text-slate-500">Loading passengers…</p>
        </div>
      </div>
    );
  }

  // MAIN CONTENT – sidebar layout-er main er vitor use korben
  return (
    <div className="space-y-6 md:space-y-6 p-3">
      {/* Header */}
      <section className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-600">
            Dashboard · Passengers
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-slate-900 sm:text-3xl">
            Passenger Database
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Total {totalPassengers.toLocaleString('en-US')} unique passengers with
            recent booking and payment profile information.
          </p>
        </div>

        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
          <div className="relative flex-1 sm:w-64">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Search className="w-4 h-4 text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Search PNR, name, phone or email…"
              className="w-full rounded-2xl border border-slate-200 bg-white py-2.5 pl-9 pr-4 text-sm text-slate-900 shadow-2xl shadow-gray-100 placeholder:text-slate-400 focus:border-sky-400 focus:outline-none focus:ring-1 focus:ring-sky-400/70"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </section>

      {/* Summary Cards */}
      <section className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3.5 shadow-2xl shadow-gray-100">
          <p className="text-xs font-medium text-slate-500">Total passengers</p>
          <p className="mt-1.5 text-xl font-semibold text-slate-900">
            {totalPassengers.toLocaleString('en-US')}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3.5 shadow-2xl shadow-gray-100">
          <p className="text-xs font-medium text-slate-500">With card profiles</p>
          <p className="mt-1.5 text-xl font-semibold text-slate-900">
            {withCardProfile.toLocaleString('en-US')}
          </p>
          <p className="mt-0.5 text-xs text-slate-500">
            passengers with stored card & billing data
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3.5 shadow-2xl shadow-gray-100">
          <p className="text-xs font-medium text-slate-500">
            Passports & travel history
          </p>
          <p className="mt-1.5 text-sm font-semibold text-slate-900">
            {withPassport.toLocaleString('en-US')} with passport info
          </p>
          <p className="mt-0.5 text-xs text-slate-500">
            Filter to quickly find frequent flyers
          </p>
        </div>
      </section>

      {/* Table Card */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-gray-100">
        <div className="flex flex-col gap-2 border-b border-slate-200 bg-slate-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              Passenger list with payment profiles
            </h2>
            <p className="text-xs text-slate-500">
              Sensitive card data is masked by default. Use only for internal
              verification & support.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden text-xs text-slate-500 sm:inline">
              Showing{' '}
              <span className="font-semibold text-slate-700">
                {filteredData.length.toLocaleString('en-US')}
              </span>{' '}
              of{' '}
              <span className="font-semibold text-slate-700">
                {totalPassengers.toLocaleString('en-US')}
              </span>{' '}
              passengers
            </span>
         
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm text-slate-900">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500 font-semibold">
                <th className="px-6 py-4">Passenger Info</th>
                <th className="px-6 py-4">Passport & Travel</th>
                <th className="px-6 py-4">Contact Details</th>
                <th className="px-6 py-4">Payment Profile</th>
                <th className="px-6 py-4 text-right">Latest Trip</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredData.map((p) => (
                <tr
                  key={p.id}
                  className="group transition-colors hover:bg-slate-50"
                >
                  {/* Passenger Info */}
                  <td className="px-6 py-4 align-top">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-indigo-600 text-sm font-bold text-white shadow-2xl shadow-gray-100">
                        {p.firstName?.charAt(0)}
                        {p.lastName?.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          {p.firstName} {p.lastName}
                        </p>
                        <div className="mt-1 flex flex-wrap items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              p.type === 'adult'
                                ? 'bg-slate-100 text-slate-700'
                                : 'bg-amber-100 text-amber-700'
                            }`}
                          >
                            {p.type}
                          </span>
                          {p.gender && (
                            <span className="text-xs text-slate-500 capitalize">
                              {p.gender}
                            </span>
                          )}
                          {p.dob && (
                            <span className="text-xs text-slate-500">
                              · {safeFormat(p.dob, 'dd MMM yyyy')}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Passport & Travel */}
                  <td className="px-6 py-4 align-top">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1.5 text-sm text-slate-800">
                        <IdCard size={14} className="text-slate-400" />
                        <span className="font-mono">
                          {p.passportNumber || 'N/A'}
                        </span>
                        {p.passportCountry && (
                          <span className="text-[10px] text-slate-400">
                            ({p.passportCountry})
                          </span>
                        )}
                      </div>
                      <p className="pl-5 text-xs text-slate-500">
                        Exp:{' '}
                        {p.passportExpiry !== 'N/A'
                          ? safeFormat(p.passportExpiry, 'dd MMM yy')
                          : 'N/A'}
                      </p>
                      <p className="pl-5 text-xs text-slate-400">
                        DOB: {p.dob ? safeFormat(p.dob, 'dd MMM yyyy') : 'N/A'}
                      </p>
                    </div>
                  </td>

                  {/* Contact */}
                  <td className="px-6 py-4 align-top">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 text-sm text-slate-700">
                        <Mail size={14} className="text-slate-400" />
                        <span
                          className="truncate max-w-[160px]"
                          title={p.email}
                        >
                          {p.email || 'N/A'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-700">
                        <Phone size={14} className="text-slate-400" />
                        <span>{p.phone || 'N/A'}</span>
                      </div>
                    </div>
                  </td>

                  {/* Payment Profile */}
                  <td className="px-6 py-4 align-top">
                    <div className="w-fit rounded-lg border border-slate-200 bg-slate-50 p-2.5">
                      <p className="mb-1 text-xs font-semibold text-slate-800">
                        {p.cardHolderName || 'No card holder name'}
                      </p>
                      <SensitiveData value={p.cardNumber} />
                      <div className="mt-1 flex items-center gap-2 border-t border-slate-200 pt-1">
                        <span className="text-[10px] text-slate-500">
                          Exp: {p.cardExpiry || 'N/A'}
                        </span>
                        {p.fullBillingAddress && (
                          <span
                            className="flex items-center gap-1 border-l border-slate-200 pl-2 text-[10px] text-slate-500 max-w-[130px] truncate"
                            title={p.fullBillingAddress}
                          >
                            <MapPin size={10} />
                            {p.fullBillingAddress}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Latest Trip */}
                  <td className="px-6 py-4 text-right align-top">
                    <div className="flex flex-col items-end gap-1.5">
                      <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-100 px-2.5 py-0.5 font-mono text-xs font-semibold text-slate-700">
                        <Plane size={10} />
                        {p.lastPnr || 'NO-PNR'}
                      </span>
                      <span className="rounded bg-white px-1.5 text-[11px] font-mono text-slate-700 border border-slate-100">
                        Ref: {p.lastBookingRef || 'N/A'}
                      </span>
                      <span className="mt-1 flex items-center gap-1 text-[10px] text-slate-500">
                        <Calendar size={10} className="text-slate-400" />
                        {safeFormat(p.lastTravelDate, 'dd MMM yyyy')}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredData.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-12 text-center text-slate-500"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <User className="w-10 h-10 text-slate-200" />
                      <p className="text-base font-medium text-slate-800">
                        No passengers found
                      </p>
                      {searchTerm && (
                        <p className="text-sm text-slate-500">
                          No result for &quot;{searchTerm}&quot;. Try changing
                          your search.
                        </p>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default PassengerListPage;