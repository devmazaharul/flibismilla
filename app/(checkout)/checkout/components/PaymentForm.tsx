import React from 'react';
import { UseFormRegister, FieldErrors, UseFormSetValue } from 'react-hook-form';
import { CreditCard, Lock, MapPin, Globe } from 'lucide-react';
import { BookingFormData } from '../utils/validation';

interface PaymentFormProps {
  register: UseFormRegister<BookingFormData>;
  errors: FieldErrors<BookingFormData>;
  setValue: UseFormSetValue<BookingFormData>;
}

export const PaymentForm: React.FC<PaymentFormProps> = ({ register, errors, setValue }) => {
  
  // 🟢 Logic: Auto-format Card Number (1234 5678...)
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, ''); // Strip non-digits
    if (val.length > 16) val = val.slice(0, 16); // Limit
    const formatted = val.replace(/(\d{4})(?=\d)/g, '$1 '); // Add space
    
    e.target.value = formatted; 
    setValue('payment.cardNumber', formatted, { shouldValidate: true });
  };

  // 🟢 Logic: Auto-format Expiry (MM/YY)
  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, ''); // Strip non-digits
    if (val.length >= 2) {
        // Auto-insert slash
        val = val.substring(0, 2) + '/' + val.substring(2, 4);
    }
    e.target.value = val;
    setValue('payment.expiryDate', val, { shouldValidate: true });
  };

  // Shared Input Class (Vercel Style)
  const inputClass = (error?: any) => `
    w-full bg-white text-sm font-medium text-gray-900 placeholder:text-gray-400
    border rounded-xl px-3 py-3 transition-all duration-200 outline-none
    ${error 
      ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500' 
      : 'border-gray-200 hover:border-ews-300 focus:border-rose-500 focus:ring-1 focus:ring-rose-500'}
  `;

  return (
    <div className="w-full space-y-6 bg-white p-6 rounded-xl shadow-2xl shadow-gray-100 border border-gray-200/80">
      
      {/* Section Header */}
      <div className="flex items-center justify-between pb-4 border-b border-gray-100">
        <h3 className="text-base font-semibold text-gray-900">Payment Method</h3>
        <div className="flex items-center gap-1.5 text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded-full border border-gray-100">
           <Lock className="w-3 h-3" />
           <span>Secured by SSL</span>
        </div>
      </div>

      {/* --- Card Details (Grouped Look) --- */}
      <div className="space-y-4">
        
        {/* Card Number */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Card Number</label>
          <div className="relative group">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                 <CreditCard className="w-4 h-4 text-gray-400 group-focus-within:text-black transition-colors" />
            </div>
            <input 
              {...register('payment.cardNumber')}
              onChange={handleCardNumberChange}
              placeholder="0000 0000 0000 0000" 
              className={`${inputClass(errors.payment?.cardNumber)} pl-9 font-mono`} // Mono font for numbers
            />
          </div>
          {errors.payment?.cardNumber && <p className="text-[11px] text-red-600 mt-1 font-medium">{errors.payment.cardNumber.message}</p>}
        </div>

        {/* Grid for Name, Expiry, CVC */}
        <div className="grid grid-cols-12 gap-3">
            
            {/* Card Holder Name (Span 6) */}
            <div className="col-span-12 md:col-span-6 space-y-1.5">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Cardholder Name</label>
                <input 
                  {...register('payment.cardHolderName')} 
                  placeholder="John Doe" 
                  className={inputClass(errors.payment?.cardHolderName)}
                />
                {errors.payment?.cardHolderName && <p className="text-[11px] text-red-600 mt-1 font-medium">{errors.payment.cardHolderName.message}</p>}
            </div>

            {/* Expiry (Span 3) */}
            <div className="col-span-6 md:col-span-3 space-y-1.5">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Expiry</label>
                <input 
                  {...register('payment.expiryDate')} 
                  onChange={handleExpiryChange}
                  placeholder="MM / YY" 
                  maxLength={5}
                  className={`${inputClass(errors.payment?.expiryDate)} text-center`}
                />
                 {errors.payment?.expiryDate && <p className="text-[11px] text-red-600 mt-1 font-medium">Invalid</p>}
            </div>

            {/* CVC (Span 3) */}
            <div className="col-span-6 md:col-span-3 space-y-1.5">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide flex items-center justify-between">
                    CVC
                    <Lock className="w-3 h-3 text-gray-300" />
                </label>
                <input 
                  {...register('payment.cvv')} 
                  placeholder="123" 
                  maxLength={4}
                  className={`${inputClass(errors.payment?.cvv)} text-center`}
                />
                 {errors.payment?.cvv && <p className="text-[11px] text-red-600 mt-1 font-medium">Required</p>}
            </div>
        </div>
      </div>

      {/* --- Billing Address (Clean Grid) --- */}
      <div className="pt-2 space-y-4">
         <h3 className="text-sm font-medium text-gray-900 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-gray-400" /> Billing Address
         </h3>

         <div className="grid grid-cols-12 gap-3">
             {/* Country */}
             <div className="col-span-12 md:col-span-4 space-y-1">
                 <div className="relative">
                    <Globe className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-3" />
                    <input 
                    {...register('payment.billingAddress.country')} 
                    placeholder="Country"
                    className={`${inputClass(errors.payment?.billingAddress?.country)} pl-8`}
                    />
                 </div>
             </div>

             {/* State */}
             <div className="col-span-6 md:col-span-4 space-y-1">
                <input 
                  {...register('payment.billingAddress.state')} 
                  placeholder="State / Province"
                  className={inputClass(errors.payment?.billingAddress?.state)}
                />
             </div>

             {/* Zip */}
             <div className="col-span-6 md:col-span-4 space-y-1">
                <input 
                  {...register('payment.billingAddress.zipCode')} 
                  placeholder="Postal Code"
                  className={inputClass(errors.payment?.billingAddress?.zipCode)}
                />
             </div>
             
             {/* Full Address */}
             <div className="col-span-12 space-y-1">
                <input 
                  {...register('payment.billingAddress.line1')} 
                  placeholder="Street Address"
                  className={inputClass(errors.payment?.billingAddress?.line1)}
                />
             </div>
             
             {/* City */}
             <div className="col-span-12 space-y-1">
                <input 
                  {...register('payment.billingAddress.city')} 
                  placeholder="City"
                  className={inputClass(errors.payment?.billingAddress?.city)}
                />
             </div>
         </div>
      </div>
    </div>
  );
};