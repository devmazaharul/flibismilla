import { UseFormRegister, FieldErrors } from "react-hook-form";
import { User, CreditCard } from "lucide-react";
import { BookingFormData } from "../utils/validation";

interface PassengerFormProps {
  index: number;
  type: "adult" | "child" | "infant";
  register: UseFormRegister<BookingFormData>;
  errors: FieldErrors<BookingFormData>;
}

export const PassengerForm = ({ index, type, register, errors }: PassengerFormProps) => {
  const error = errors.passengers?.[index];

  return (
    <div className="bg-white p-6 rounded-2xl shadow-2xl shadow-gray-100 border border-slate-200 mb-6 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
        <div className={`p-2 rounded-lg ${type === 'adult' ? 'bg-rose-100 text-rose-600' : 'bg-blue-100 text-blue-600'}`}>
          <User className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-lg font-black text-slate-800 capitalize">
            Passenger {index + 1} <span className="text-sm font-medium text-slate-500">({type})</span>
          </h3>
          <p className="text-xs text-slate-400">Enter details exactly as they appear on the passport</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        
        {/* Title Field */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-500 uppercase">Title</label>
          <select
            {...register(`passengers.${index}.title`)}
            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none transition-all"
          >
            <option value="">Select</option>
            <option value="mr">Mr</option>
            <option value="ms">Ms</option>
            <option value="mrs">Mrs</option>
            {type === 'child' || type === 'infant' ? <option value="mstr">Master</option> : null}
          </select>
          {error?.title && <p className="text-xs text-red-500 font-bold">{error.title.message}</p>}
        </div>

        {/* First Name */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-500 uppercase">First Name / Given Name</label>
          <input
            {...register(`passengers.${index}.firstName`)}
            placeholder="e.g. John"
            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none transition-all placeholder:font-normal"
          />
          {error?.firstName && <p className="text-xs text-red-500 font-bold">{error.firstName.message}</p>}
        </div>

        {/* Middle Name (Optional) - NEW ADDITION */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-500 uppercase flex justify-between">
            Middle Name
            <span className="text-[10px] text-slate-400 font-normal lowercase">(optional)</span>
          </label>
          <input
            {...register(`passengers.${index}.middleName`)}
            placeholder="e.g. Quincy"
            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none transition-all placeholder:font-normal"
          />
          {/* Validation error displayed only if needed (e.g., max length exceeded), though it's optional */}
          {error?.middleName && <p className="text-xs text-red-500 font-bold">{error.middleName.message}</p>}
        </div>

        {/* Last Name */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-500 uppercase">Last Name / Surname</label>
          <input
            {...register(`passengers.${index}.lastName`)}
            placeholder="e.g. Doh"
            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none transition-all placeholder:font-normal"
          />
          {error?.lastName && <p className="text-xs text-red-500 font-bold">{error.lastName.message}</p>}
        </div>

        {/* Date of Birth */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
             Date of Birth
          </label>
          <input
            type="date"
            {...register(`passengers.${index}.dob`)}
            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none transition-all"
          />
          {error?.dob && <p className="text-xs text-red-500 font-bold">{error.dob.message}</p>}
        </div>

        {/* Gender */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-500 uppercase">Gender</label>
          <div className="flex gap-4 pt-1">
            <label className="flex items-center gap-2 cursor-pointer group">
              <input type="radio" value="male" {...register(`passengers.${index}.gender`)} className="accent-rose-600 w-4 h-4" />
              <span className="text-sm font-medium text-slate-700 group-hover:text-rose-600 transition-colors">Male</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer group">
              <input type="radio" value="female" {...register(`passengers.${index}.gender`)} className="accent-rose-600 w-4 h-4" />
              <span className="text-sm font-medium text-slate-700 group-hover:text-rose-600 transition-colors">Female</span>
            </label>
          </div>
          {error?.gender && <p className="text-xs text-red-500 font-bold">{error.gender.message}</p>}
        </div>

        {/* Passport Number */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-500 uppercase">Passport Number</label>
          <div className="relative">
             <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
             <input
               {...register(`passengers.${index}.passportNumber`)}
               placeholder="A12345678"
               className="w-full p-3 pl-10 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none transition-all uppercase placeholder:normal-case"
             />
          </div>
          {error?.passportNumber && <p className="text-xs text-red-500 font-bold">{error.passportNumber.message}</p>}
        </div>

        {/* Passport Expiry */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-500 uppercase">Passport Expiry Date</label>
          <input
            type="date"
            {...register(`passengers.${index}.passportExpiry`)}
            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none transition-all"
          />
          {error?.passportExpiry && <p className="text-xs text-red-500 font-bold">{error.passportExpiry.message}</p>}
        </div>

      </div>
    </div>
  );
};