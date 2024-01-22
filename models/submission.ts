import mongoose from "mongoose";

const submissionSchema = new mongoose.Schema({
   submissionId: { type: Number, required: true, unique: true },
   user: { type: String, required: true },
   problemTitle: { type: String, required: true },
   lang: { type: String, required: true },
   code: { type: String, required: false },
   status: { type: String, required: true },
   message: { type: String, required: false },
   time: { type: String, required: true }
});

export default mongoose.models.Submission || mongoose.model("Submissions", submissionSchema, "Submissions");