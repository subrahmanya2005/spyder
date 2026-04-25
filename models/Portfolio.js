import mongoose from "mongoose";

const PortfolioSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  risk_level: { type: String, required: true, enum: ['Low', 'Medium', 'High'] },
  principal: { type: Number, required: true },
  current_value: { type: Number, required: true },
  created_at: { type: Date, default: Date.now },
  last_updated: { type: Date, default: Date.now }
});

export default mongoose.models.Portfolio || mongoose.model("Portfolio", PortfolioSchema);
