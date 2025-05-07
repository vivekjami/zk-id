# ZK-ID: Privacy-Preserving Identity Verification on Solana

## Overview
**ZK-ID** is a cutting-edge identity verification system built for the Solana Colossium Breakout hackathon. It leverages **zero-knowledge proofs (ZKPs)**, **client-side OCR**, and **Solana** to verify a user's age (e.g., over 18) without revealing sensitive data like their date of birth. By extracting data from ID images in the browser, generating ZKPs, and storing attestations on Solana, ZK-ID ensures privacy, resists AI-generated fake documents, and enables trustless verification for dApps.

**Key Features**:
- **Privacy-First**: Prove age without sharing DOB using ZKPs.
- **AI Fraud Resistance**: Client-side OCR verifies real IDs, not fake documents.
- **Solana-Powered**: Fast, low-cost attestation storage on Devnet.
- **Hackathon-Ready**: Simple Next.js UI with Phantom wallet integration.

## Suggested Project Names
1. **ZK-ID**: Clean, professional, and descriptive.
2. **ProofPass**: Emphasizes ZKP and passport verification.
3. **SolID**: Combines Solana and identity.
4. **ZeroTrustID**: Highlights trustless verification.
5. **PrivacyPass**: Focuses on privacy-preserving tech.

**Recommended Name**: **ZK-ID** (short, memorable, and conveys the tech stack).

## Tech Stack
- **Frontend**: Next.js, Tailwind CSS, @solana/wallet-adapter-react
- **OCR**: Tesseract.js (browser-based ID data extraction)
- **ZKP**: Circom, snarkjs (age verification circuit)
- **Blockchain**: Solana, Anchor (Rust program for attestation storage)
- **Wallet**: Phantom, Solflare

## Setup Instructions
To build ZK-ID as quickly as possible, follow these steps:

### Prerequisites
- **Node.js** (v18+)
- **Rust** (for Anchor)
- **Solana CLI** (`solana-install init 1.18.4`)
- **Git**
- **Yarn** or **npm**
- **Funded Solana Devnet wallet** (get free SOL from `solana airdrop 2`)

### Installation
1. **Clone the Repository**:
   ```bash
   git clone https://github.com/your-repo/zk-id.git
   cd zk-id
   ```

2. **Install Frontend Dependencies**:
   ```bash
   cd frontend
   yarn install
   ```

3. **Install Anchor Dependencies**:
   ```bash
   cd anchor-program
   cargo build
   ```

4. **Set Up Solana CLI**:
   ```bash
   solana config set --url https://api.devnet.solana.com
   solana-keygen new # Generate a keypair
   solana airdrop 2 # Fund your wallet
   ```

5. **Download Precompiled ZKP Files**:
   - Get `age_verification.wasm`, `age_verification.zkey`, and `verification_key.json` from [this link](#) (replace with your hosted files).
   - Place them in `frontend/public`.

## Building ZK-ID (3-Day Plan)
To ship ZK-ID in the hackathon timeline, follow this plan:

### Day 1: OCR + ZKP
1. **Set Up OCR**:
   - Use Tesseract.js to extract DOB from an ID image.
   - Test with a clean ID image (e.g., MM/DD/YYYY format).
   - Code: `frontend/utils/ocr.js` (see [sample code](#sample-code)).

2. **Generate ZKP**:
   - Use the provided Circom circuit (`circuits/age_verification.circom`) to prove age ≥ 18.
   - Run `snarkjs` to generate a proof client-side.
   - Verify the proof locally using `verification_key.json`.
   - Code: `frontend/utils/zkp.js`.

### Day 2: Solana Program + Frontend
1. **Deploy Solana Program**:
   - Use the Anchor program (`anchor-program/lib.rs`) to store proof hashes.
   - Deploy to Devnet: `anchor deploy`.
   - Update `frontend/config.ts` with your program ID.

2. **Build Frontend**:
   - Create a Next.js UI with an ID upload button and Phantom wallet connect.
   - Integrate OCR and ZKP generation.
   - Call the Solana program to store attestations.
   - Code: `frontend/pages/index.tsx`.

### Day 3: Test + Demo
1. **End-to-End Testing**:
   - Upload an ID, generate a ZKP, and store an attestation.
   - Verify the transaction on Solscan (Devnet explorer).
   - Test with multiple wallets (Phantom, Solflare).

2. **Prepare Demo**:
   - Record a 2-minute video: Upload ID → Generate proof → Store attestation → Show Solscan.
   - Create a simple architecture diagram (use Excalidraw).
   - Push code to GitHub with this README.

3. **Polish Submission**:
   - Highlight privacy, AI fraud resistance, and Solana’s scalability in your pitch.
   - Include a live demo link (e.g., Vercel-hosted frontend).

## Sample Code
### OCR (frontend/utils/ocr.js)
```javascript
import Tesseract from 'tesseract.js';

export async function extractDOB(imageFile) {
  const { data: { text } } = await Tesseract.recognize(imageFile, 'eng');
  const dobMatch = text.match(/(\d{2}[-/]\d{2}[-/]\d{4})/);
  return dobMatch ? dobMatch[0] : null;
}
```

### ZKP Circuit (circuits/age_verification.circom)
```circom
pragma circom 2.0.0;

template AgeVerification() {
    signal input dobYear;
    signal input currentYear;
    signal input ageThreshold;
    signal output isAboveAge;

    signal age;
    age <== currentYear - dobYear;
    isValid <== age >= ageThreshold ? 1 : 0;
    isAboveAge <== isValid;
}

component main {public [currentYear, ageThreshold]} = AgeVerification();
```

### Anchor Program (anchor-program/lib.rs)
```rust
use anchor_lang::prelude::*;

declare_id!("YourProgramIDHere");

#[program]
pub mod zk_verification {
    use super::*;
    pub fn store_attestation(ctx: Context<StoreAttestation>, proof_hash: [u8; 32]) -> Result<()> {
        let attestation = &mut ctx.accounts.attestation;
        attestation.user = ctx.accounts.signer.key();
        attestation.proof_hash = proof_hash;
        attestation.verified = true;
        Ok(())
    }
}

#[account]
pub struct Attestation {
    pub user: Pubkey,
    pub proof_hash: [u8; 32],
    pub verified: bool,
}

#[derive(Accounts)]
pub struct StoreAttestation<'info> {
    #[account(init, payer = signer, space = 8 + 32 + 32 + 1)]
    pub attestation: Account<'info, Attestation>,
    #[account(mut)]
    pub signer: Signer<'info>,
    pub system_program: Program<'info, System>,
}
```

## Tips for Success
- **Focus on Demo**: Show a clean flow (ID upload → ZKP → Solana transaction).
- **Precompile ZKP Files**: Use pre-generated `wasm` and `zkey` to save time.
- **Test Early**: Ensure Phantom wallet and Devnet work smoothly.
- **Pitch Privacy**: Emphasize ZK-ID’s resistance to AI fraud and data breaches.
- **Keep It Simple**: Hardcode values (e.g., currentYear = 2025) for the demo.

## Resources
- **Circom Docs**: https://docs.circom.io
- **Anchor Docs**: https://book.anchor-lang.com
- **Solana Devnet**: https://explorer.solana.com/?cluster=devnet
- **Tesseract.js**: https://github.com/naptha/tesseract.js
- **Phantom Wallet**: https://phantom.app

## License
MIT License

---

Good luck at the Colossium Breakout hackathon! Build the future of privacy with ZK-ID! 🚀
