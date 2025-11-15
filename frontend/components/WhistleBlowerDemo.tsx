"use client";

import { useFhevm } from "../fhevm/useFhevm";
import { useInMemoryStorage } from "../hooks/useInMemoryStorage";
import { useMetaMaskEthersSigner } from "../hooks/metamask/useMetaMaskEthersSigner";
import { useWhistleBlower } from "@/hooks/useWhistleBlower";
import { errorNotDeployed } from "./ErrorNotDeployed";
import { ActivityLogPanel } from "./ActivityLogPanel";
import { useActivityLog } from "@/hooks/useActivityLog";
import { Shield, Send, Eye, RefreshCw, AlertCircle } from "lucide-react";
import { useState, useEffect, useRef } from "react";

/*
 * Main WhistleBlower React component
 * Allows users to:
 *  - Submit encrypted reports with content and severity
 *  - View all submitted reports
 *  - Decrypt reports (for authorized users)
 *  - Update report status (admin only)
 */
type WhistleBlowerDemoProps = {
  mode?: "full" | "decryptOnly" | "noReports";
};

export const WhistleBlowerDemo = ({ mode = "full" }: WhistleBlowerDemoProps) => {
  const { storage: fhevmDecryptionSignatureStorage } = useInMemoryStorage();
  const {
    provider,
    chainId,
    accounts,
    isConnected,
    connect,
    ethersSigner,
    ethersReadonlyProvider,
    sameChain,
    sameSigner,
    initialMockChains,
  } = useMetaMaskEthersSigner();

  const [reportContent, setReportContent] = useState("");
  const [reportSeverity, setReportSeverity] = useState(3);

  const { add: addLog } = useActivityLog();
  const lastMessageRef = useRef<string>("");

  //////////////////////////////////////////////////////////////////////////////
  // FHEVM instance
  //////////////////////////////////////////////////////////////////////////////

  const {
    instance: fhevmInstance,
    status: fhevmStatus,
  } = useFhevm({
    provider,
    chainId,
    initialMockChains,
    enabled: true,
  });

  //////////////////////////////////////////////////////////////////////////////
  // useWhistleBlower hook containing all the WhistleBlower logic
  //////////////////////////////////////////////////////////////////////////////

  const whistleBlower = useWhistleBlower({
    instance: fhevmInstance,
    fhevmDecryptionSignatureStorage,
    eip1193Provider: provider,
    chainId,
    ethersSigner,
    ethersReadonlyProvider,
    sameChain,
    sameSigner,
  });

  //////////////////////////////////////////////////////////////////////////////
  // Activity Log Integration
  //////////////////////////////////////////////////////////////////////////////

  // Mirror whistleBlower messages into activity log
  useEffect(() => {
    const m = whistleBlower.message || "";
    if (!m || m === lastMessageRef.current) return;
    lastMessageRef.current = m;

    if (m.includes("successfully")) {
      addLog({ type: "report_submit", title: "Report Submitted", details: m });
      setReportContent("");
      setReportSeverity(3);
    } else if (m.toLowerCase().includes("failed") || m.toLowerCase().includes("error")) {
      addLog({ type: "error", title: "Operation Failed", details: m });
    } else if (m.toLowerCase().includes("decrypt")) {
      addLog({ type: "decrypt", title: "FHEVM Decryption", details: m });
    } else if (m) {
      addLog({ type: "info", title: "Status Update", details: m });
    }
  }, [whistleBlower.message, addLog]);

  //////////////////////////////////////////////////////////////////////////////
  // UI Styles
  //////////////////////////////////////////////////////////////////////////////

  const buttonClass =
    "btn btn-primary font-semibold text-white shadow-lg " +
    "transition-all duration-200 hover:scale-105 active:scale-95 " +
    "disabled:opacity-50 disabled:cursor-not-allowed";

  const cardClass = "card bg-base-100 shadow-xl border-2 border-base-300";
  const titleClass = "text-xl font-bold text-primary mb-4";

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
        <Shield className="w-24 h-24 text-primary animate-pulse" />
        <h1 className="text-4xl font-bold text-center">Fair Whistle Shield</h1>
        <p className="text-lg text-center text-base-content/70 max-w-md">
          Anonymous encrypted whistleblower system powered by FHEVM
        </p>
        <button className={buttonClass + " btn-lg"} onClick={connect}>
          <Shield className="w-5 h-5" />
          Connect Wallet to Start
        </button>
      </div>
    );
  }

  if (whistleBlower.isDeployed === false) {
    return errorNotDeployed(chainId);
  }

  return (
    <div className="grid w-full gap-6 px-4">
      {/* Header */}
      <div className="col-span-full">
        <div className={cardClass}>
          <div className="card-body">
            <h1 className="card-title text-3xl">
              <Shield className="w-8 h-8 text-primary" />
              Fair Whistle Shield
            </h1>
            <p className="text-base-content/70">
              Submit anonymous encrypted reports securely on the blockchain
            </p>
          </div>
        </div>
      </div>

      {/* Contract Info */}
      <div className="col-span-full">
        <div className={cardClass}>
          <div className="card-body">
            <h2 className={titleClass}>Contract Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-base-content/60">Chain ID</p>
                <p className="font-mono font-semibold">{chainId}</p>
              </div>
              <div>
                <p className="text-sm text-base-content/60">Your Address</p>
                <p className="font-mono font-semibold text-sm">
                  {accounts && accounts.length > 0 ? accounts[0] : "N/A"}
                </p>
              </div>
              <div>
                <p className="text-sm text-base-content/60">Contract Address</p>
                <p className="font-mono font-semibold text-sm">
                  {whistleBlower.contractAddress}
                </p>
              </div>
              <div>
                <p className="text-sm text-base-content/60">Total Reports</p>
                <p className="font-mono font-semibold text-2xl">
                  {whistleBlower.totalReports ?? 0}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Submit Report Form */}
      {mode !== "decryptOnly" && (
        <div className="col-span-full">
          <div className={cardClass}>
            <div className="card-body">
              <h2 className={titleClass}>
                <Send className="w-6 h-6 inline mr-2" />
                Submit Encrypted Report
              </h2>

              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text font-semibold">Report Content</span>
                  <span className="label-text-alt text-base-content/60">
                    Will be encrypted on-chain
                  </span>
                </label>
                <textarea
                  className="textarea textarea-bordered h-32 w-full"
                  placeholder="Describe the issue you want to report (this will be encrypted)..."
                  value={reportContent}
                  onChange={(e) => setReportContent(e.target.value)}
                  disabled={whistleBlower.isSubmitting}
                  aria-label="Report content (will be encrypted)"
                />
              </div>

              <div className="form-control w-full mt-4">
                <label className="label">
                  <span className="label-text font-semibold">
                    Severity Level: {reportSeverity}
                  </span>
                  <span className="label-text-alt text-base-content/60">
                    1 (Low) - 5 (Critical)
                  </span>
                </label>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={reportSeverity}
                  onChange={(e) => setReportSeverity(Number(e.target.value))}
                  className="range range-primary"
                  step="1"
                  disabled={whistleBlower.isSubmitting}
                  aria-label={`Report severity level: ${reportSeverity}`}
                />
                <div className="w-full flex justify-between text-xs px-2 mt-2">
                  <span>Low</span>
                  <span>Medium</span>
                  <span>High</span>
                  <span>Severe</span>
                  <span>Critical</span>
                </div>
              </div>

              <div className="card-actions justify-end mt-6">
                <button
                  className={buttonClass}
                  disabled={
                    !whistleBlower.canSubmit ||
                    whistleBlower.isSubmitting ||
                    !reportContent.trim()
                  }
                  onClick={() => {
                    addLog({ 
                      type: "report_submit", 
                      title: "Submit Encrypted Report", 
                      details: `severity=${reportSeverity}` 
                    });
                    whistleBlower.submitReport(reportContent, reportSeverity);
                  }}
                >
                  {whistleBlower.isSubmitting ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Submit Encrypted Report
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Activity Log (on Report page) or Reports List (on Decrypt page) */}
      {mode === "noReports" ? (
        <div className="col-span-full">
          <ActivityLogPanel />
        </div>
      ) : (
        <div className="col-span-full">
          <div className={cardClass}>
            <div className="card-body">
              <div className="flex justify-between items-center mb-4">
                <h2 className={titleClass}>
                  <Eye className="w-6 h-6 inline mr-2" />
                  Submitted Reports
                </h2>
                <button
                  className="btn btn-sm btn-outline"
                  onClick={whistleBlower.refreshReports}
                  disabled={whistleBlower.isRefreshing}
                >
                  <RefreshCw
                    className={`w-4 h-4 ${whistleBlower.isRefreshing ? "animate-spin" : ""}`}
                  />
                  Refresh
                </button>
              </div>

              {whistleBlower.reports.length === 0 ? (
                <div className="text-center py-12 text-base-content/60">
                  <AlertCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg">No reports submitted yet</p>
                  <p className="text-sm">Be the first to submit an encrypted report</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {whistleBlower.reports.map((report, index) => (
                    <div
                      key={index}
                      className="border-2 border-base-300 rounded-lg p-4 hover:border-primary transition-colors"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-base-content/60">Report ID</p>
                          <p className="font-mono font-semibold">{report.id}</p>
                        </div>
                        <div>
                          <p className="text-sm text-base-content/60">Status</p>
                          <div className="badge badge-primary">{report.status}</div>
                        </div>
                        <div>
                          <p className="text-sm text-base-content/60">Reporter</p>
                          <p className="font-mono text-sm">{report.reporter}</p>
                        </div>
                        <div>
                          <p className="text-sm text-base-content/60">Timestamp</p>
                          <p className="text-sm">
                            {new Date(report.timestamp * 1000).toLocaleString()}
                          </p>
                        </div>
                        {report.decryptedContent && (
                          <div className="col-span-full">
                            <p className="text-sm text-base-content/60">
                              Decrypted Content Hash
                            </p>
                            <p className="font-semibold">{report.decryptedContent}</p>
                          </div>
                        )}
                        {report.decryptedSeverity !== undefined && (
                          <div>
                            <p className="text-sm text-base-content/60">
                              Decrypted Severity
                            </p>
                            <p className="font-semibold">{report.decryptedSeverity}</p>
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2 mt-4">
                        <button
                          className="btn btn-sm btn-outline"
                          onClick={() => whistleBlower.decryptReport(report.id)}
                          disabled={
                            whistleBlower.isDecrypting ||
                            report.decryptedContent !== undefined
                          }
                        >
                          {whistleBlower.isDecrypting ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                          {report.decryptedContent ? "Decrypted" : "Decrypt"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Status Messages */}
      {whistleBlower.message && (
        <div className="col-span-full">
          <div className="alert alert-info shadow-lg">
            <AlertCircle className="w-6 h-6" />
            <span>{whistleBlower.message}</span>
          </div>
        </div>
      )}

      {/* FHEVM Status */}
      <div className="col-span-full">
        <div className={cardClass}>
          <div className="card-body">
            <h2 className={titleClass}>System Status</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-base-content/60">FHEVM Instance</p>
                <p className="font-semibold">
                  {fhevmInstance ? "✓ Ready" : "✗ Not Ready"}
                </p>
              </div>
              <div>
                <p className="text-base-content/60">FHEVM Status</p>
                <p className="font-semibold">{fhevmStatus}</p>
              </div>
              <div>
                <p className="text-base-content/60">Contract Deployed</p>
                <p className="font-semibold">
                  {whistleBlower.isDeployed ? "✓ Yes" : "✗ No"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
