"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var mongoose_1 = require("mongoose");
var submissionSchema = new mongoose_1.default.Schema({
    submissionId: { type: Number, required: true, unique: true },
    user: { type: String, required: true },
    problemId: { type: Number, required: true },
    code: { type: String, required: false },
    status: { type: String, required: true },
    time: { type: String, required: true }
});
exports.default = mongoose_1.default.models.Submission || mongoose_1.default.model("Submissions", submissionSchema, "Submissions");
