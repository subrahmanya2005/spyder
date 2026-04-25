import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  // Core
  name:     { type: String, required: true },
  gender:   { type: String, enum: ['Male', 'Female', 'Other'] },
  email:    { type: String, required: true, unique: true },
  phone:    { type: String },
  password: { type: String }, // bcrypt hash; null for OTP-only users

  // Address
  address: { type: String },
  pincode: { type: String },

  // Financial profile
  occupation:     { type: String },
  average_income: { type: Number },
  current_salary: { type: Number },
  days_of_work:   { type: Number },

  // Banking
  bank_name:           { type: String },
  bank_account_number: { type: String },
  bank_ifsc:           { type: String },

  // Documents (Cloudinary URLs)
  aadhaar_number:  { type: String },
  pan_photo_url:   { type: String },
  profile_photo_url: { type: String },

  // Auth helpers
  is_profile_complete:   { type: Boolean, default: false },
  password_reset_token:  { type: String },
  password_reset_expiry: { type: Date },
  otp:                   { type: String },
  otpExpiry:             { type: Date },
  otp_attempts:          { type: Number, default: 0 },
  otp_locked_until:      { type: Date },

  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.User || mongoose.model("User", UserSchema);
