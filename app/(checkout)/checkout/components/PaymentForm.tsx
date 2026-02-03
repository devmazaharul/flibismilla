'use client';

import React from 'react';
import { UseFormRegister, FieldErrors, UseFormSetValue } from 'react-hook-form';
import { CreditCard, Lock, MapPin, Globe, User, Calendar, Hash, Home, ChevronDown } from 'lucide-react';
import { BookingFormData } from '../utils/validation';

// 🟢 Comprehensive List of Countries (Updated & Expanded)
const COUNTRIES = [
  "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Antigua and Barbuda", "Argentina", "Armenia", "Australia", "Austria", "Azerbaijan",
  "Bahamas", "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize", "Benin", "Bhutan", "Bolivia", "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei", "Bulgaria", "Burkina Faso", "Burundi",
  "Cambodia", "Cameroon", "Canada", "Cape Verde", "Central African Republic", "Chad", "Chile", "China", "Colombia", "Comoros", "Congo (Democratic Republic)", "Congo (Republic)", "Costa Rica", "Croatia", "Cuba", "Cyprus", "Czech Republic",
  "Denmark", "Djibouti", "Dominica", "Dominican Republic",
  "East Timor", "Ecuador", "Egypt", "El Salvador", "Equatorial Guinea", "Eritrea", "Estonia", "Eswatini", "Ethiopia",
  "Fiji", "Finland", "France",
  "Gabon", "Gambia", "Georgia", "Germany", "Ghana", "Greece", "Grenada", "Guatemala", "Guinea", "Guinea-Bissau", "Guyana",
  "Haiti", "Honduras", "Hong Kong", "Hungary",
  "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland", "Israel", "Italy", "Ivory Coast",
  "Jamaica", "Japan", "Jordan",
  "Kazakhstan", "Kenya", "Kiribati", "Kosovo", "Kuwait", "Kyrgyzstan",
  "Laos", "Latvia", "Lebanon", "Lesotho", "Liberia", "Libya", "Liechtenstein", "Lithuania", "Luxembourg",
  "Macau", "Madagascar", "Malawi", "Malaysia", "Maldives", "Mali", "Malta", "Marshall Islands", "Mauritania", "Mauritius", "Mexico", "Micronesia", "Moldova", "Monaco", "Mongolia", "Montenegro", "Morocco", "Mozambique", "Myanmar",
  "Namibia", "Nauru", "Nepal", "Netherlands", "New Zealand", "Nicaragua", "Niger", "Nigeria", "North Korea", "North Macedonia", "Norway",
  "Oman",
  "Pakistan", "Palau", "Palestine", "Panama", "Papua New Guinea", "Paraguay", "Peru", "Philippines", "Poland", "Portugal",
  "Qatar",
  "Romania", "Russia", "Rwanda",
  "Saint Kitts and Nevis", "Saint Lucia", "Saint Vincent and the Grenadines", "Samoa", "San Marino", "Sao Tome and Principe", "Saudi Arabia", "Senegal", "Serbia", "Seychelles", "Sierra Leone", "Singapore", "Slovakia", "Slovenia", "Solomon Islands", "Somalia", "South Africa", "South Korea", "South Sudan", "Spain", "Sri Lanka", "Sudan", "Suriname", "Sweden", "Switzerland", "Syria",
  "Taiwan", "Tajikistan", "Tanzania", "Thailand", "Togo", "Tonga", "Trinidad and Tobago", "Tunisia", "Turkey", "Turkmenistan", "Tuvalu",
  "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom", "United States", "Uruguay", "Uzbekistan",
  "Vanuatu", "Vatican City", "Venezuela", "Vietnam",
  "Yemen",
  "Zambia", "Zimbabwe"
].sort();


interface PaymentFormProps {
  register: UseFormRegister<BookingFormData>;
  errors: FieldErrors<BookingFormData>;
  setValue: UseFormSetValue<BookingFormData>;
  amount?: string;
}

export const PaymentForm: React.FC<PaymentFormProps> = ({ register, errors, setValue, amount }) => {
  
  // 🟢 Auto-format Card Number
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, ''); 
    if (val.length > 19) val = val.slice(0, 19); 
    const formatted = val.replace(/(\d{4})(?=\d)/g, '$1 '); 
    e.target.value = formatted; 
    setValue('payment.cardNumber', formatted, { shouldValidate: true });
  };

  // 🟢 Auto-format Expiry (MM/YY)
  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.length > 4) val = val.slice(0, 4);

    if (val.length >= 2) {
        val = val.substring(0, 2) + '/' + val.substring(2, 4);
    }
    e.target.value = val;
    setValue('payment.expiryDate', val, { shouldValidate: true });
  };

  // Shared Input Style
  const inputClass = (error?: any) => `
    w-full bg-white text-sm font-medium text-gray-900 placeholder:text-gray-400
    border rounded-xl px-3 py-3 transition-all duration-200 outline-none
    ${error 
      ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500' 
      : 'border-gray-200 hover:border-gray-300 focus:border-slate-900 focus:ring-1 focus:ring-slate-900'}
  `;

  return (
    <div className="w-full space-y-6 bg-white p-6 md:p-8 rounded-2xl shadow-xl shadow-gray-100 border border-gray-200">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-gray-100">
         <div className='flex items-center gap-2'>
            <div className="p-2 bg-slate-100 rounded-full text-slate-700">
                <CreditCard className="w-5 h-5"/>
            </div>
            <h3 className="text-lg font-black text-gray-900">Payment Details</h3>
         </div>
         <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100 uppercase tracking-wide">
            <Lock className="w-3 h-3" />
            <span>SSL Secured</span>
         </div>
      </div>

      {amount && (
        <div className="bg-slate-900 text-white p-4 rounded-xl flex justify-between items-center shadow-lg shadow-slate-200">
            <span className="text-sm font-medium text-slate-300">Amount to Pay</span>
            <span className="text-xl font-bold font-mono">{amount}</span>
        </div>
      )}

      <div className="space-y-5">
        
        {/* Card Number */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Card Number</label>
          <div className="relative group">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                 <CreditCard className="w-4 h-4 text-gray-400 group-focus-within:text-slate-900 transition-colors" />
            </div>
            <input 
              {...register('payment.cardNumber')}
              onChange={handleCardNumberChange}
              placeholder="0000 0000 0000 0000" 
              maxLength={23} 
              className={`${inputClass(errors.payment?.cardNumber)} pl-10 font-mono tracking-widest`} 
            />
          </div>
          {errors.payment?.cardNumber && <p className="text-[11px] text-red-600 mt-1 font-bold">{errors.payment.cardNumber.message}</p>}
        </div>

        {/* Grid: Name, Expiry */}
        <div className="grid grid-cols-12 gap-4">
            
            {/* Name */}
            <div className="col-span-12 md:col-span-6 space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Cardholder Name</label>
                <div className="relative group">
                    <User className="w-4 h-4 text-gray-400 absolute left-3 top-3.5 group-focus-within:text-slate-900" />
                    <input 
                        {...register('payment.cardName')} 
                        placeholder="NAME ON CARD" 
                        className={`${inputClass(errors.payment?.cardName)} pl-10 uppercase`}
                    />
                </div>
                {errors.payment?.cardName && <p className="text-[11px] text-red-600 mt-1 font-bold">{errors.payment.cardName.message}</p>}
            </div>

            {/* Expiry */}
            <div className="col-span-6 md:col-span-3 space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Expiry</label>
                <div className="relative">
                    <Calendar className="w-4 h-4 text-gray-400 absolute left-3 top-3.5" />
                    <input 
                        {...register('payment.expiryDate')} 
                        onChange={handleExpiryChange}
                        placeholder="MM/YY" 
                        maxLength={5}
                        className={`${inputClass(errors.payment?.expiryDate)} pl-9 text-center`}
                    />
                </div>
                 {errors.payment?.expiryDate && <p className="text-[11px] text-red-600 mt-1 font-bold">Invalid</p>}
            </div>
        </div>
      </div>

      <div className="w-full h-px bg-gray-100"></div>

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
                 className={`${inputClass(errors.payment?.billingAddress?.street)} pl-10`}
               />
            </div>
            {errors.payment?.billingAddress?.street && <p className="text-[11px] text-red-600 font-bold">{errors.payment.billingAddress.street.message}</p>}
         </div>

         <div className="grid grid-cols-12 gap-4">
             {/* City */}
             <div className="col-span-6 space-y-1">
                <input 
                  {...register('payment.billingAddress.city')} 
                  placeholder="City"
                  className={inputClass(errors.payment?.billingAddress?.city)}
                />
             </div>

             {/* State */}
             <div className="col-span-6 space-y-1">
                <input 
                  {...register('payment.billingAddress.state')} 
                  placeholder="State"
                  className={inputClass(errors.payment?.billingAddress?.state)}
                />
             </div>

             {/* Zip */}
             <div className="col-span-6 space-y-1">
                <div className="relative group">
                    <Hash className="w-4 h-4 text-gray-400 absolute left-3 top-3.5" />
                    <input 
                    {...register('payment.billingAddress.zipCode')} 
                    placeholder="Zip Code"
                    className={`${inputClass(errors.payment?.billingAddress?.zipCode)} pl-9`}
                    />
                </div>
                {errors.payment?.billingAddress?.zipCode && <p className="text-[11px] text-red-600 font-bold">{errors.payment.billingAddress.zipCode.message}</p>}
             </div>
             
             {/* 🟢 Country Dropdown (Updated) */}
             <div className="col-span-6 space-y-1">
                 <div className="relative group">
                    <Globe className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-3.5 z-10" />
                    
                    <select 
                      {...register('payment.billingAddress.country')} 
                      defaultValue="United States"
                      className={`${inputClass(errors.payment?.billingAddress?.country)} pl-9 pr-8 appearance-none cursor-pointer`}
                    >
                      <option value="" disabled>Select Country</option>
                      {COUNTRIES.map((country) => (
                        <option key={country} value={country}>{country}</option>
                      ))}
                    </select>

                    {/* Custom Dropdown Arrow for better styling */}
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                        <ChevronDown className="w-4 h-4" />
                    </div>
                 </div>
             </div>
         </div>
      </div>
    </div>
  );
};