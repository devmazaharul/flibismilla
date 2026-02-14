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
  Shield,
  Sparkles,
} from 'lucide-react';
import { BookingFormData } from '../utils/validation';

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
  const handleCardNumberChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.length > 19) val = val.slice(0, 19);
    const formatted = val.replace(/(\d{4})(?=\d)/g, '$1 ');
    e.target.value = formatted;
    setValue('payment.cardNumber', formatted, { shouldValidate: true });
  };

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

  const inputBase = (hasError?: any) => `
    w-full min-w-0 bg-gray-50/80 text-sm font-semibold text-gray-900
    placeholder:text-gray-400 placeholder:font-normal
    border rounded-xl sm:rounded-2xl px-3 sm:px-4 py-3 sm:py-3.5
    transition-all duration-300 outline-none box-border
    ${
      hasError
        ? 'border-red-300 bg-red-50/50 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 focus:bg-white'
        : 'border-gray-100 hover:border-rose-200 hover:bg-white focus:border-rose-500 focus:ring-1 focus:ring-rose-500 focus:bg-white'
    }
  `;

  return (
    <div className="w-full overflow-hidden bg-white rounded-2xl">
      <div className="p-4 sm:p-6 md:p-8 space-y-6 sm:space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 sm:p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl sm:rounded-2xl text-white shadow-lg shadow-indigo-500/25 shrink-0">
              <CreditCard className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base sm:text-xl font-black text-gray-900 tracking-tight">
                Payment Details
              </h3>
              <p className="text-[10px] sm:text-xs text-gray-400 font-medium mt-0.5">
                Enter your card information securely
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 text-[9px] sm:text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full border border-emerald-200/60 uppercase tracking-widest shrink-0">
            <Shield className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-500" />
            <span>256-bit SSL</span>
          </div>
        </div>

        {/* Amount Banner */}
        {amount && (
          <div className="relative overflow-hidden rounded-xl sm:rounded-2xl">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600" />
            <div className="relative flex justify-between items-center p-4 sm:p-5">
              <div className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-200" />
                <span className="text-xs sm:text-sm font-semibold text-indigo-100">
                  Total Amount
                </span>
              </div>
              <span className="text-2xl sm:text-3xl font-black text-white font-mono tracking-tight">
                {amount}
              </span>
            </div>
          </div>
        )}

        {/* Card Details */}
        <div className="space-y-4 sm:space-y-5">
          {/* Card Number */}
          <div className="space-y-1.5 sm:space-y-2 min-w-0">
            <label className="flex items-center gap-1.5 text-[10px] sm:text-[11px] font-bold text-gray-500 uppercase tracking-widest">
              <CreditCard className="w-3 h-3" />
              Card Number
            </label>
            <div className="relative group">
              <CreditCard className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 group-focus-within:text-indigo-500 transition-colors duration-300 pointer-events-none" />
              <input
                {...register('payment.cardNumber')}
                onChange={handleCardNumberChange}
                placeholder="0000 0000 0000 0000"
                maxLength={23}
                inputMode="numeric"
                className={`${inputBase(
                  errors.payment?.cardNumber
                )} pl-10 sm:pl-12 font-mono tracking-[0.12em] sm:tracking-[0.2em] text-sm sm:text-base`}
              />
            </div>
            {errors.payment?.cardNumber && (
              <p className="flex items-center gap-1 text-[10px] sm:text-[11px] text-red-500 font-bold">
                <span className="w-1 h-1 bg-red-500 rounded-full shrink-0" />
                {errors.payment.cardNumber.message}
              </p>
            )}
          </div>

          {/* Name + Expiry */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 sm:gap-4">
            {/* Cardholder Name */}
            <div className="sm:col-span-7 space-y-1.5 sm:space-y-2 min-w-0">
              <label className="flex items-center gap-1.5 text-[10px] sm:text-[11px] font-bold text-gray-500 uppercase tracking-widest">
                <User className="w-3 h-3" />
                Cardholder Name
              </label>
              <div className="relative group">
                <User className="w-4 h-4 text-gray-300 absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 group-focus-within:text-rose-500 transition-colors duration-300 pointer-events-none" />
                <input
                  {...register('payment.cardName')}
                  placeholder="Full name on card"
                  className={`${inputBase(
                    errors.payment?.cardName
                  )} pl-10 sm:pl-12 uppercase tracking-wide`}
                />
              </div>
              {errors.payment?.cardName && (
                <p className="flex items-center gap-1 text-[10px] sm:text-[11px] text-red-500 font-bold">
                  <span className="w-1 h-1 bg-red-500 rounded-full shrink-0" />
                  {errors.payment.cardName.message}
                </p>
              )}
            </div>

            {/* Expiry */}
            <div className="sm:col-span-5 space-y-1.5 sm:space-y-2 min-w-0">
              <label className="flex items-center gap-1.5 text-[10px] sm:text-[11px] font-bold text-gray-500 uppercase tracking-widest">
                <Calendar className="w-3 h-3" />
                Expiry Date
              </label>
              <div className="relative group">
                <Calendar className="w-4 h-4 text-gray-300 absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 group-focus-within:text-indigo-500 transition-colors duration-300 pointer-events-none" />
                <input
                  {...register('payment.expiryDate')}
                  onChange={handleExpiryChange}
                  placeholder="MM / YY"
                  maxLength={5}
                  inputMode="numeric"
                  className={`${inputBase(
                    errors.payment?.expiryDate
                  )} pl-10 sm:pl-12 text-center tracking-[0.2em] sm:tracking-[0.3em] font-mono`}
                />
              </div>
              {errors.payment?.expiryDate && (
                <p className="flex items-center gap-1 text-[10px] sm:text-[11px] text-red-500 font-bold">
                  <span className="w-1 h-1 bg-red-500 rounded-full shrink-0" />
                  Invalid
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t-2 border-dashed border-gray-100" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-white px-4 py-1">
              <MapPin className="w-4 h-4 text-indigo-400" />
            </span>
          </div>
        </div>

        {/* Billing Address */}
        <div className="space-y-4 sm:space-y-5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-rose-50 rounded-xl border border-rose-100 shrink-0">
              <MapPin className="w-4 h-4 text-rose-500" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-extrabold text-gray-900 tracking-tight">
                Billing Address
              </h3>
              <p className="text-[10px] text-gray-400 font-medium">
                Must match your card statement address
              </p>
            </div>
          </div>

          {/* Street */}
          <div className="space-y-1.5 sm:space-y-2 min-w-0">
            <label className="flex items-center gap-1.5 text-[10px] sm:text-[11px] font-bold text-gray-500 uppercase tracking-widest">
              <Home className="w-3 h-3" />
              Street Address
            </label>
            <div className="relative group">
              <Home className="w-4 h-4 text-gray-300 absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 group-focus-within:text-indigo-500 transition-colors duration-300 pointer-events-none" />
              <input
                {...register('payment.billingAddress.street')}
                placeholder="123 Main Street, Apt 4B"
                className={`${inputBase(
                  errors.payment?.billingAddress?.street
                )} pl-10 sm:pl-12`}
              />
            </div>
            {errors.payment?.billingAddress?.street && (
              <p className="flex items-center gap-1 text-[10px] sm:text-[11px] text-red-500 font-bold">
                <span className="w-1 h-1 bg-red-500 rounded-full shrink-0" />
                {errors.payment.billingAddress.street.message}
              </p>
            )}
          </div>

          {/* City + State */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <div className="space-y-1.5 sm:space-y-2 min-w-0">
              <label className="text-[10px] sm:text-[11px] font-bold text-gray-500 uppercase tracking-widest">
                City
              </label>
              <input
                {...register('payment.billingAddress.city')}
                placeholder="New York"
                className={inputBase(
                  errors.payment?.billingAddress?.city
                )}
              />
              {errors.payment?.billingAddress?.city && (
                <p className="flex items-center gap-1 text-[10px] text-red-500 font-bold">
                  <span className="w-1 h-1 bg-red-500 rounded-full shrink-0" />
                  Required
                </p>
              )}
            </div>

            <div className="space-y-1.5 sm:space-y-2 min-w-0">
              <label className="text-[10px] sm:text-[11px] font-bold text-gray-500 uppercase tracking-widest">
                State / Province
              </label>
              <input
                {...register('payment.billingAddress.state')}
                placeholder="NY"
                className={inputBase(
                  errors.payment?.billingAddress?.state
                )}
              />
              {errors.payment?.billingAddress?.state && (
                <p className="flex items-center gap-1 text-[10px] text-red-500 font-bold">
                  <span className="w-1 h-1 bg-red-500 rounded-full shrink-0" />
                  Required
                </p>
              )}
            </div>
          </div>

          {/* Zip + Country */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <div className="space-y-1.5 sm:space-y-2 min-w-0">
              <label className="flex items-center gap-1.5 text-[10px] sm:text-[11px] font-bold text-gray-500 uppercase tracking-widest">
                <Hash className="w-3 h-3" />
                Zip Code
              </label>
              <div className="relative group">
                <Hash className="w-4 h-4 text-gray-300 absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 group-focus-within:text-indigo-500 transition-colors duration-300 pointer-events-none" />
                <input
                  {...register('payment.billingAddress.zipCode')}
                  placeholder="10001"
                  inputMode="numeric"
                  className={`${inputBase(
                    errors.payment?.billingAddress?.zipCode
                  )} pl-10 sm:pl-12 font-mono`}
                />
              </div>
              {errors.payment?.billingAddress?.zipCode && (
                <p className="flex items-center gap-1 text-[10px] text-red-500 font-bold">
                  <span className="w-1 h-1 bg-red-500 rounded-full shrink-0" />
                  {errors.payment.billingAddress.zipCode.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5 sm:space-y-2 min-w-0">
              <label className="flex items-center gap-1.5 text-[10px] sm:text-[11px] font-bold text-gray-500 uppercase tracking-widest">
                <Globe className="w-3 h-3" />
                Country
              </label>
              <div className="relative group">
                <Globe className="w-4 h-4 text-gray-300 absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 z-10 group-focus-within:text-indigo-500 transition-colors duration-300 pointer-events-none" />
                <select
                  {...register('payment.billingAddress.country')}
                  defaultValue="US"
                  className={`${inputBase(
                    errors.payment?.billingAddress?.country
                  )} pl-10 sm:pl-12 pr-8 sm:pr-10 appearance-none cursor-pointer`}
                >
                  <option value="" disabled>
                    Select
                  </option>
                  {COUNTRIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.name} ({c.code})
                    </option>
                  ))}
                </select>
                <div className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </div>
              </div>
              {errors.payment?.billingAddress?.country && (
                <p className="flex items-center gap-1 text-[10px] text-red-500 font-bold">
                  <span className="w-1 h-1 bg-red-500 rounded-full shrink-0" />
                  {errors.payment.billingAddress.country.message}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-center gap-2 pt-2 text-[9px] sm:text-[10px] text-gray-400 font-medium text-center">
          <Lock className="w-3 h-3 shrink-0" />
          <span>
            Your payment information is encrypted and secure. We never store your card details.
          </span>
        </div>
      </div>
    </div>
  );
};