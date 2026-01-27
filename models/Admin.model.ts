import mongoose, { Schema, model, models } from 'mongoose';

const AdminSchema = new Schema({
  name: { 
    type: String, 
    required: true,
    trim: true 
  },
  email: { 
    type: String, 
    required: true, 
    unique: true,
    lowercase: true,
    trim: true
  },
  password: { 
    type: String, 
    required: true 
  },
  role: { 
    type: String, 
    enum: ['admin', "viewer",'editor'], 
    default: 'admin' 
  },
  
  // 🛡️ Security & Rate Limiting Fields
  failedLoginAttempts: { 
    type: Number, 
    default: 0 
  },
  lockUntil: { 
    type: Date 
  },
  
  // 🔄 Password Reset Functionality
  resetPasswordToken: String,
  resetPasswordExpire: Date,

  lastLogin: { type: Date, required: true, default: Date.now },

  // ✅ Device Login History (Stores last 5 successful logins)
  loginHistory: [
    {
      device: { type: String },    // e.g., "iPhone 14 (iOS 17)" or "Windows PC"
      browser: { type: String },   // e.g., "Chrome 120.0"
      ip: { type: String },        // e.g., "192.168.1.1"
      location: { type: String },  // e.g., "Dhaka, Bangladesh"
      time: { type: Date, default: Date.now },
      status: { type: String, enum:["current","completed"],default: 'current' }
    }
  ],
 twoFactorSecret: { 
  type: String, 
  default: null 
},
isTwoFactorEnabled: { 
  type: Boolean, 
  default: false
},
adminId:String,
isVerified:{
  type:Boolean,
  default:true
}

}, { timestamps: true });

const Admin = models.Admin || model('Admin', AdminSchema);
export default Admin; //<Maza@112/> 