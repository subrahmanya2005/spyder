import mongoose from "mongoose";

const TransactionSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, required: true, enum: ['income', 'save', 'withdraw', 'invest'] },
  amount: { type: Number, required: true },
  source: { type: String, required: true, enum: ['bank', 'cash', 'wallet', 'investment', 'external', 'partner_api', 'goal'] },
  date: { type: Date, default: Date.now }
});

export default mongoose.models.Transaction || mongoose.model("Transaction", TransactionSchema);
