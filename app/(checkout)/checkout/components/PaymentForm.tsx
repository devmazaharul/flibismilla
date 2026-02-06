'use client';

import React from 'react';
import {
  UseFormRegister,
  FieldErrors,
  UseFormSetValue,
} from 'react-hook-form';
import {
  CreditCard,
  Lock,
  MapPin,
  Globe,
  User,
  Calendar,
  Hash,
  Home,
  ChevronDown,
} from 'lucide-react';
import { BookingFormData } from '../utils/validation';

// 🟢 Country list with ISO 2-letter codes (name দেখাবে, value হবে code)
const COUNTRIES = [
  { name: 'Afghanistan', code: 'AF' },
  { name: 'Albania', code: 'AL' },
  { name: 'Algeria', code: 'DZ' },
  { name: 'Andorra', code: 'AD' },
  { name: 'Angola', code: 'AO' },
  { name: 'Antigua and Barbuda', code: 'AG' },
  { name: 'Argentina', code: 'AR' },
  { name: 'Armenia', code: 'AM' },
  { name: 'Australia', code: 'AU' },
  { name: 'Austria', code: 'AT' },
  { name: 'Azerbaijan', code: 'AZ' },
  { name: 'Bahamas', code: 'BS' },
  { name: 'Bahrain', code: 'BH' },
  { name: 'Bangladesh', code: 'BD' },
  { name: 'Barbados', code: 'BB' },
  { name: 'Belarus', code: 'BY' },
  { name: 'Belgium', code: 'BE' },
  { name: 'Belize', code: 'BZ' },
  { name: 'Benin', code: 'BJ' },
  { name: 'Bhutan', code: 'BT' },
  { name: 'Bolivia', code: 'BO' },
  { name: 'Bosnia and Herzegovina', code: 'BA' },
  { name: 'Botswana', code: 'BW' },
  { name: 'Brazil', code: 'BR' },
  { name: 'Brunei', code: 'BN' },
  { name: 'Bulgaria', code: 'BG' },
  { name: 'Burkina Faso', code: 'BF' },
  { name: 'Burundi', code: 'BI' },
  { name: 'Cambodia', code: 'KH' },
  { name: 'Cameroon', code: 'CM' },
  { name: 'Canada', code: 'CA' },
  { name: 'Cape Verde', code: 'CV' },
  { name: 'Central African Republic', code: 'CF' },
  { name: 'Chad', code: 'TD' },
  { name: 'Chile', code: 'CL' },
  { name: 'China', code: 'CN' },
  { name: 'Colombia', code: 'CO' },
  { name: 'Comoros', code: 'KM' },
  { name: 'Congo (Democratic Republic)', code: 'CD' },
  { name: 'Congo (Republic)', code: 'CG' },
  { name: 'Costa Rica', code: 'CR' },
  { name: 'Croatia', code: 'HR' },
  { name: 'Cuba', code: 'CU' },
  { name: 'Cyprus', code: 'CY' },
  { name: 'Czech Republic', code: 'CZ' },
  { name: 'Denmark', code: 'DK' },
  { name: 'Djibouti', code: 'DJ' },
  { name: 'Dominica', code: 'DM' },
  { name: 'Dominican Republic', code: 'DO' },
  { name: 'East Timor', code: 'TL' },
  { name: 'Ecuador', code: 'EC' },
  { name: 'Egypt', code: 'EG' },
  { name: 'El Salvador', code: 'SV' },
  { name: 'Equatorial Guinea', code: 'GQ' },
  { name: 'Eritrea', code: 'ER' },
  { name: 'Estonia', code: 'EE' },
  { name: 'Eswatini', code: 'SZ' },
  { name: 'Ethiopia', code: 'ET' },
  { name: 'Fiji', code: 'FJ' },
  { name: 'Finland', code: 'FI' },
  { name: 'France', code: 'FR' },
  { name: 'Gabon', code: 'GA' },
  { name: 'Gambia', code: 'GM' },
  { name: 'Georgia', code: 'GE' },
  { name: 'Germany', code: 'DE' },
  { name: 'Ghana', code: 'GH' },
  { name: 'Greece', code: 'GR' },
  { name: 'Grenada', code: 'GD' },
  { name: 'Guatemala', code: 'GT' },
  { name: 'Guinea', code: 'GN' },
  { name: 'Guinea-Bissau', code: 'GW' },
  { name: 'Guyana', code: 'GY' },
  { name: 'Haiti', code: 'HT' },
  { name: 'Honduras', code: 'HN' },
  { name: 'Hong Kong', code: 'HK' },
  { name: 'Hungary', code: 'HU' },
  { name: 'Iceland', code: 'IS' },
  { name: 'India', code: 'IN' },
  { name: 'Indonesia', code: 'ID' },
  { name: 'Iran', code: 'IR' },
  { name: 'Iraq', code: 'IQ' },
  { name: 'Ireland', code: 'IE' },
  { name: 'Israel', code: 'IL' },
  { name: 'Italy', code: 'IT' },
  { name: 'Ivory Coast', code: 'CI' },
  { name: 'Jamaica', code: 'JM' },
  { name: 'Japan', code: 'JP' },
  { name: 'Jordan', code: 'JO' },
  { name: 'Kazakhstan', code: 'KZ' },
  { name: 'Kenya', code: 'KE' },
  { name: 'Kiribati', code: 'KI' },
  { name: 'Kosovo', code: 'XK' },
  { name: 'Kuwait', code: 'KW' },
  { name: 'Kyrgyzstan', code: 'KG' },
  { name: 'Laos', code: 'LA' },
  { name: 'Latvia', code: 'LV' },
  { name: 'Lebanon', code: 'LB' },
  { name: 'Lesotho', code: 'LS' },
  { name: 'Liberia', code: 'LR' },
  { name: 'Libya', code: 'LY' },
  { name: 'Liechtenstein', code: 'LI' },
  { name: 'Lithuania', code: 'LT' },
  { name: 'Luxembourg', code: 'LU' },
  { name: 'Macau', code: 'MO' },
  { name: 'Madagascar', code: 'MG' },
  { name: 'Malawi', code: 'MW' },
  { name: 'Malaysia', code: 'MY' },
  { name: 'Maldives', code: 'MV' },
  { name: 'Mali', code: 'ML' },
  { name: 'Malta', code: 'MT' },
  { name: 'Marshall Islands', code: 'MH' },
  { name: 'Mauritania', code: 'MR' },
  { name: 'Mauritius', code: 'MU' },
  { name: 'Mexico', code: 'MX' },
  { name: 'Micronesia', code: 'FM' },
  { name: 'Moldova', code: 'MD' },
  { name: 'Monaco', code: 'MC' },
  { name: 'Mongolia', code: 'MN' },
  { name: 'Montenegro', code: 'ME' },
  { name: 'Morocco', code: 'MA' },
  { name: 'Mozambique', code: 'MZ' },
  { name: 'Myanmar', code: 'MM' },
  { name: 'Namibia', code: 'NA' },
  { name: 'Nauru', code: 'NR' },
  { name: 'Nepal', code: 'NP' },
  { name: 'Netherlands', code: 'NL' },
  { name: 'New Zealand', code: 'NZ' },
  { name: 'Nicaragua', code: 'NI' },
  { name: 'Niger', code: 'NE' },
  { name: 'Nigeria', code: 'NG' },
  { name: 'North Korea', code: 'KP' },
  { name: 'North Macedonia', code: 'MK' },
  { name: 'Norway', code: 'NO' },
  { name: 'Oman', code: 'OM' },
  { name: 'Pakistan', code: 'PK' },
  { name: 'Palau', code: 'PW' },
  { name: 'Palestine', code: 'PS' },
  { name: 'Panama', code: 'PA' },
  { name: 'Papua New Guinea', code: 'PG' },
  { name: 'Paraguay', code: 'PY' },
  { name: 'Peru', code: 'PE' },
  { name: 'Philippines', code: 'PH' },
  { name: 'Poland', code: 'PL' },
  { name: 'Portugal', code: 'PT' },
  { name: 'Qatar', code: 'QA' },
  { name: 'Romania', code: 'RO' },
  { name: 'Russia', code: 'RU' },
  { name: 'Rwanda', code: 'RW' },
  { name: 'Saint Kitts and Nevis', code: 'KN' },
  { name: 'Saint Lucia', code: 'LC' },
  { name: 'Saint Vincent and the Grenadines', code: 'VC' },
  { name: 'Samoa', code: 'WS' },
  { name: 'San Marino', code: 'SM' },
  { name: 'Sao Tome and Principe', code: 'ST' },
  { name: 'Saudi Arabia', code: 'SA' },
  { name: 'Senegal', code: 'SN' },
  { name: 'Serbia', code: 'RS' },
  { name: 'Seychelles', code: 'SC' },
  { name: 'Sierra Leone', code: 'SL' },
  { name: 'Singapore', code: 'SG' },
  { name: 'Slovakia', code: 'SK' },
  { name: 'Slovenia', code: 'SI' },
  { name: 'Solomon Islands', code: 'SB' },
  { name: 'Somalia', code: 'SO' },
  { name: 'South Africa', code: 'ZA' },
  { name: 'South Korea', code: 'KR' },
  { name: 'South Sudan', code: 'SS' },
  { name: 'Spain', code: 'ES' },
  { name: 'Sri Lanka', code: 'LK' },
  { name: 'Sudan', code: 'SD' },
  { name: 'Suriname', code: 'SR' },
  { name: 'Sweden', code: 'SE' },
  { name: 'Switzerland', code: 'CH' },
  { name: 'Syria', code: 'SY' },
  { name: 'Taiwan', code: 'TW' },
  { name: 'Tajikistan', code: 'TJ' },
  { name: 'Tanzania', code: 'TZ' },
  { name: 'Thailand', code: 'TH' },
  { name: 'Togo', code: 'TG' },
  { name: 'Tonga', code: 'TO' },
  { name: 'Trinidad and Tobago', code: 'TT' },
  { name: 'Tunisia', code: 'TN' },
  { name: 'Turkey', code: 'TR' },
  { name: 'Turkmenistan', code: 'TM' },
  { name: 'Tuvalu', code: 'TV' },
  { name: 'Uganda', code: 'UG' },
  { name: 'Ukraine', code: 'UA' },
  { name: 'United Arab Emirates', code: 'AE' },
  { name: 'United Kingdom', code: 'GB' },
  { name: 'United States', code: 'US' },
  { name: 'Uruguay', code: 'UY' },
  { name: 'Uzbekistan', code: 'UZ' },
  { name: 'Vanuatu', code: 'VU' },
  { name: 'Vatican City', code: 'VA' },
  { name: 'Venezuela', code: 'VE' },
  { name: 'Vietnam', code: 'VN' },
  { name: 'Yemen', code: 'YE' },
  { name: 'Zambia', code: 'ZM' },
  { name: 'Zimbabwe', code: 'ZW' },
].sort((a, b) => a.name.localeCompare(b.name));

interface PaymentFormProps {
  register: UseFormRegister<BookingFormData>;
  errors: FieldErrors<BookingFormData>;
  setValue: UseFormSetValue<BookingFormData>;
  amount?: string;
}

export const PaymentForm: React.FC<PaymentFormProps> = ({
  register,
  errors,
  setValue,
  amount,
}) => {
  // Card Number auto-format
  const handleCardNumberChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.length > 19) val = val.slice(0, 19);
    const formatted = val.replace(/(\d{4})(?=\d)/g, '$1 ');
    e.target.value = formatted;
    setValue('payment.cardNumber', formatted, { shouldValidate: true });
  };

  // Expiry auto-format (MM/YY)
  const handleExpiryChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.length > 4) val = val.slice(0, 4);
    if (val.length >= 2) {
      val = val.substring(0, 2) + '/' + val.substring(2, 4);
    }
    e.target.value = val;
    setValue('payment.expiryDate', val, { shouldValidate: true });
  };

  const inputClass = (error?: any) => `
    w-full bg-white text-sm font-medium text-gray-900 placeholder:text-gray-400
    border rounded-xl px-3 py-3 transition-all duration-200 outline-none
    ${
      error
        ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500'
        : 'border-gray-200 hover:border-gray-300 focus:border-slate-900 focus:ring-1 focus:ring-slate-900'
    }
  `;

  return (
    <div className="w-full space-y-6 bg-white p-6 md:p-8 rounded-2xl shadow-xl shadow-gray-100 border border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-slate-100 rounded-full text-slate-700">
            <CreditCard className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-black text-gray-900">
            Payment Details
          </h3>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100 uppercase tracking-wide">
          <Lock className="w-3 h-3" />
          <span>SSL Secured</span>
        </div>
      </div>

      {amount && (
        <div className="bg-slate-900 text-white p-4 rounded-xl flex justify-between items-center shadow-lg shadow-slate-200">
          <span className="text-sm font-medium text-slate-300">
            Amount to Pay
          </span>
          <span className="text-xl font-bold font-mono">
            {amount}
          </span>
        </div>
      )}

      <div className="space-y-5">
        {/* Card Number */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">
            Card Number
          </label>
          <div className="relative group">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
              <CreditCard className="w-4 h-4 text-gray-400 group-focus-within:text-slate-900 transition-colors" />
            </div>
            <input
              {...register('payment.cardNumber')}
              onChange={handleCardNumberChange}
              placeholder="0000 0000 0000 0000"
              maxLength={23}
              className={`${inputClass(
                errors.payment?.cardNumber
              )} pl-10 font-mono tracking-widest`}
            />
          </div>
          {errors.payment?.cardNumber && (
            <p className="text-[11px] text-red-600 mt-1 font-bold">
              {errors.payment.cardNumber.message}
            </p>
          )}
        </div>

        {/* Grid: Name, Expiry */}
        <div className="grid grid-cols-12 gap-4">
          {/* Name */}
          <div className="col-span-12 md:col-span-6 space-y-1.5">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">
              Cardholder Name
            </label>
            <div className="relative group">
              <User className="w-4 h-4 text-gray-400 absolute left-3 top-3.5 group-focus-within:text-slate-900" />
              <input
                {...register('payment.cardName')}
                placeholder="NAME ON CARD"
                className={`${inputClass(
                  errors.payment?.cardName
                )} pl-10 uppercase`}
              />
            </div>
            {errors.payment?.cardName && (
              <p className="text-[11px] text-red-600 mt-1 font-bold">
                {errors.payment.cardName.message}
              </p>
            )}
          </div>

          {/* Expiry */}
          <div className="col-span-6 md:col-span-3 space-y-1.5">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">
              Expiry
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-gray-400 absolute left-3 top-3.5" />
              <input
                {...register('payment.expiryDate')}
                onChange={handleExpiryChange}
                placeholder="MM/YY"
                maxLength={5}
                className={`${inputClass(
                  errors.payment?.expiryDate
                )} pl-9 text-center`}
              />
            </div>
            {errors.payment?.expiryDate && (
              <p className="text-[11px] text-red-600 mt-1 font-bold">
                Invalid
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="w-full h-px bg-gray-100" />

      {/* --- Billing Address --- */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
          <MapPin className="w-4 h-4 text-rose-500" /> Billing Address
        </h3>

        {/* Street Address */}
        <div className="space-y-1">
          <div className="relative group">
            <Home className="w-4 h-4 text-gray-400 absolute left-3 top-3.5 group-focus-within:text-slate-900" />
            <input
              {...register('payment.billingAddress.street')}
              placeholder="Street Address"
              className={`${inputClass(
                errors.payment?.billingAddress?.street
              )} pl-10`}
            />
          </div>
          {errors.payment?.billingAddress?.street && (
            <p className="text-[11px] text-red-600 font-bold">
              {errors.payment.billingAddress.street.message}
            </p>
          )}
        </div>

        <div className="grid grid-cols-12 gap-4">
          {/* City */}
          <div className="col-span-6 space-y-1">
            <input
              {...register('payment.billingAddress.city')}
              placeholder="City"
              className={inputClass(
                errors.payment?.billingAddress?.city
              )}
            />
          </div>

          {/* State */}
          <div className="col-span-6 space-y-1">
            <input
              {...register('payment.billingAddress.state')}
              placeholder="State"
              className={inputClass(
                errors.payment?.billingAddress?.state
              )}
            />
          </div>

          {/* Zip */}
          <div className="col-span-6 space-y-1">
            <div className="relative group">
              <Hash className="w-4 h-4 text-gray-400 absolute left-3 top-3.5" />
              <input
                {...register('payment.billingAddress.zipCode')}
                placeholder="Zip Code"
                className={`${inputClass(
                  errors.payment?.billingAddress?.zipCode
                )} pl-9`}
              />
            </div>
            {errors.payment?.billingAddress?.zipCode && (
              <p className="text-[11px] text-red-600 font-bold">
                {errors.payment.billingAddress.zipCode.message}
              </p>
            )}
          </div>

          {/* Country Dropdown */}
          <div className="col-span-6 space-y-1">
            <div className="relative group">
              <Globe className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-3.5 z-10" />
              <select
                {...register('payment.billingAddress.country')}
                defaultValue="US"
                className={`${inputClass(
                  errors.payment?.billingAddress?.country
                )} pl-9 pr-8 appearance-none cursor-pointer`}
              >
                <option value="" disabled>
                  Select Country
                </option>
                {COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.name} ({c.code})
                  </option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                <ChevronDown className="w-4 h-4" />
              </div>
            </div>
            {errors.payment?.billingAddress?.country && (
              <p className="text-[11px] text-red-600 font-bold">
                {errors.payment.billingAddress.country.message}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};