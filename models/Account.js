import mongoose from "mongoose";

const AccountSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  main_balance: { type: Number, default: 0 },
  savings_wallet: { type: Number, default: 0 },
  cash_savings: { type: Number, default: 0 },
  investment_balance: { type: Number, default: 0 },
  lastActionAt: { type: Date, default: null },
  currentStreak: { type: Number, default: 0 },
});

export default mongoose.models.Account || mongoose.model("Account", AccountSchema);
