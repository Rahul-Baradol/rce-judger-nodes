"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var mongoose_1 = require("mongoose");
var systemDataSchema = new mongoose_1.default.Schema({
    title: { type: String, required: true },
    nextSubmissionId: { type: Number, required: true }
});
exports.default = mongoose_1.default.models.systemDataSchema || mongoose_1.default.model("systemData", systemDataSchema, "systemData");
