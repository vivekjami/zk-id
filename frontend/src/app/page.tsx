"use client";

import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { extractDOB } from "@/lib/ocr";

export default function Home() {
  const { publicKey } = useWallet();
  const [dob, setDob] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setIsProcessing(true);
      const extractedDob = await extractDOB(file);
      setDob(extractedDob);
      setIsProcessing(false);
    }
  };

  return (
    <main className="min-h-screen p-8 bg-gray-100">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">ZK-ID: Privacy-Preserving Age Verification</h1>
        <div className="mb-4">
          {publicKey ? (
            <p className="text-green-600">Connected: {publicKey.toString()}</p>
          ) : (
            <WalletMultiButton className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700" />
          )}
        </div>
        <div className="mt-6">
          <label htmlFor="id-upload" className="block text-lg font-medium mb-2">
            Upload ID Image
          </label>
          <input
            id="id-upload"
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="p-2 border rounded w-full"
            disabled={isProcessing}
          />
          {isProcessing && <p className="mt-2 text-blue-600">Processing...</p>}
          {dob && (
            <p className="mt-4 text-lg">
              Extracted Date of Birth: <span className="font-semibold">{dob}</span>
            </p>
          )}
          {!dob && !isProcessing && (
            <p className="mt-4 text-gray-500">No DOB extracted. Try a clearer image.</p>
          )}
        </div>
      </div>
    </main>
  );
}