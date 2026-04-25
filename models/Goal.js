import mongoose from "mongoose";

const GoalSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  target_amount: { type: Number, required: true },
  saved_amount: { type: Number, default: 0 },
  duration_days: { type: Number, required: true },
  created_at: { type: Date, default: Date.now },
  shared_with: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  invite_token: { type: String, sparse: true },
  contributions: [{
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    amount: { type: Number, default: 0 }
  }]
});

delete mongoose.models.Goal;
export default mongoose.model("Goal", GoalSchema);
