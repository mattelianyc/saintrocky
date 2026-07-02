import mongoose from "mongoose";

const ExtensionSessionSchema = new mongoose.Schema(
  {
    sessionId: { type: String, required: true, unique: true, index: true },
    ownerUserId: { type: String, required: true, index: true },
    ownerEmail: { type: String, required: true, index: true },
    ownerDisplayName: { type: String, default: "" },
    runtimeSurface: { type: String, default: "browser_extension" },
    browserName: { type: String, default: "" },
    browserVersion: { type: String, default: "" },
    extensionVersion: { type: String, default: "" },
    platform: { type: String, default: "" },
    connectionState: { type: String, default: "disconnected" },
    lastSeenAt: { type: String, default: "" },
    connectedAt: { type: String, default: "" },
    disconnectedAt: { type: String, default: "" },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    runtimeState: { type: mongoose.Schema.Types.Mixed, default: {} }
  },
  { timestamps: true }
);

export const ExtensionSession =
  mongoose.models.ExtensionSession || mongoose.model("ExtensionSession", ExtensionSessionSchema);
