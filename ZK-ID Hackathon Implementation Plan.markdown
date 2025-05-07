# Comprehensive Plan to Build ZK-ID for Solana Breakout Hackathon

This guide provides a detailed roadmap to build the ZK-ID project, a privacy-preserving identity verification system for the Solana Breakout hackathon. ZK-ID uses zero-knowledge proofs (ZKPs), client-side OCR, and Solana to verify a user’s age (e.g., over 18) without revealing sensitive data like their date of birth (DOB). The plan is optimized for rapid development within a 3-day hackathon timeline, leveraging the provided tech stack and sample code.

## Project Overview
ZK-ID enables users to prove their age using a ZKP generated from an ID image processed in the browser. The proof is stored as an attestation on Solana’s Devnet, allowing decentralized applications (dApps) to verify age without accessing personal data. Key features include:
- **Privacy-First**: ZKPs ensure no sensitive data is shared.
- **AI Fraud Resistance**: Client-side OCR verifies real IDs, reducing the risk of fake documents.
- **Solana Integration**: Fast, low-cost attestation storage on Devnet.
- **User-Friendly**: Simple Next.js UI with Phantom wallet integration.

## Tech Stack
The project uses the following tools and libraries:
- **Frontend**: Next.js, Tailwind CSS, [@solana/wallet-adapter-react](https://github.com/solana-labs/wallet-adapter)
- **OCR**: [Tesseract.js](https://github.com/naptha/tesseract.js) for browser-based DOB extraction
- **ZKP**: [Circom](https://docs.circom.io), [SnarkJS](https://github.com/iden3/snarkjs) for age verification proofs
- **Blockchain**: Solana, [Anchor](https://www.anchor-lang.com) (Rust) for attestation storage
- **Wallet**: Phantom, Solflare

## 3-Day Development Plan
To complete ZK-ID within the hackathon timeline, follow this structured plan.

### Day 1: Environment Setup and OCR/ZKP Implementation
#### Environment Setup
1. **Install Prerequisites**:
   - **Node.js (v18+)**: Download from [nodejs.org](https://nodejs.org).
   - **Rust**: Install via `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh` ([rust-lang.org](https://www.rust-lang.org)).
   - **Solana CLI (v1.18.4)**: Run `sh -c "$(curl -sSfL https://release.solana.com/v1.18.4/install)"` ([solana.com](https://solana.com/docs/intro/installation)).
   - **Anchor (v0.30.1)**: Install via Anchor Version Manager (AVM) with `cargo install --git https://github.com/coral-xyz/anchor avm --locked` and `avm install 0.30.1` ([anchor-lang.com](https://www.anchor-lang.com/docs/installation)).
   - **Git, Yarn**: Install Git (`apt-get install git` on Linux, or similar) and Yarn (`npm install -g yarn`).
2. **Configure Solana CLI**:
   - Set Devnet: `solana config set --url https://api.devnet.solana.com`.
   - Generate a keypair: `solana-keygen new`.
   - Fund wallet: `solana airdrop 2` (request 2 SOL on Devnet).
3. **Clone Repository**:
   - Clone the ZK-ID repo: `git clone https://github.com/your-repo/zk-id.git` (replace with your repo URL).
   - Navigate to project: `cd zk-id`.

#### OCR Implementation
1. **Install Frontend Dependencies**:
   - Navigate to frontend: `cd frontend`.
   - Install dependencies: `yarn install`.
2. **Extract DOB with Tesseract.js**:
   - Use the provided sample code to extract DOB from an ID image.
   - Test with a clear ID image in MM/DD/YYYY format.
   - **Sample Code** (save as `frontend/utils/ocr.js`):
     ```javascript
     import Tesseract from 'tesseract.js';

     export async function extractDOB(imageFile) {
       const { data: { text } } = await Tesseract.recognize(imageFile, 'eng');
       const dobMatch = text.match(/(\d{2}[-/]\d{2}[-/]\d{4})/);
       return dobMatch ? dobMatch[0] : null;
     }
     ```
   - **Note**: OCR accuracy depends on image quality. For the hackathon, assume clean images. For production, consider preprocessing (e.g., contrast adjustment) to improve accuracy ([PyImageSearch](https://pyimagesearch.com/2021/12/01/ocr-passports-with-opencv-and-tesseract)).

#### ZKP Generation
1. **Download Precompiled ZKP Files**:
   - Obtain `age_verification.wasm`, `age_verification.zkey`, and `verification_key.json` from the provided link (replace with your hosted files).
   - Place in `frontend/public`.
2. **Use Provided Circom Circuit**:
   - The circuit proves age ≥ 18 without revealing DOB.
   - **Sample Circuit** (save as `circuits/age_verification.circom`):
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
3. **Generate and Verify Proof**:
   - Use SnarkJS to generate a proof client-side and verify it locally.
   - **Sample Code** (save as `frontend/utils/zkp.js`):
     ```javascript
     import { exportCallDataGroth16 } from 'snarkjs';

     export async function generateProof(dobYear, currentYear, ageThreshold) {
       const input = { dobYear, currentYear, ageThreshold };
       const { proof, publicSignals } = await exportCallDataGroth16(
         input,
         '/age_verification.wasm',
         '/age_verification.zkey'
       );
       return { proof, publicSignals };
     }
     ```
   - Hardcode `currentYear = 2025` and `ageThreshold = 18` for the demo.

### Day 2: Solana Program and Frontend Development
#### Solana Program Deployment
1. **Build Anchor Program**:
   - Navigate to Anchor program: `cd anchor-program`.
   - Build: `cargo build`.
2. **Deploy to Devnet**:
   - Deploy: `anchor deploy`.
   - Note the program ID and update `frontend/config.ts` with it.
3. **Anchor Program Code**:
   - Use the provided code to store proof hashes.
   - **Sample Code** (save as `anchor-program/lib.rs`):
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
   - Replace `YourProgramIDHere` with the actual program ID after deployment.

#### Frontend Development
1. **Set Up Next.js UI**:
   - Create a page with an ID upload button and Phantom wallet connect.
   - Use Tailwind CSS for styling.
2. **Integrate OCR and ZKP**:
   - Call `extractDOB` from `ocr.js` on image upload.
   - Pass the extracted DOB year to `generateProof` from `zkp.js`.
3. **Connect to Solana Program**:
   - Use @solana/wallet-adapter-react to connect the Phantom wallet.
   - Send the ZKP hash to the Anchor program.
   - **Sample Code** (save as `frontend/pages/index.tsx`):
     ```typescript
     import { useWallet } from '@solana/wallet-adapter-react';
     import { extractDOB } from '../utils/ocr';
     import { generateProof } from '../utils/zkp';
     import { Program, AnchorProvider, web3 } from '@project-serum/anchor';

     export default function Home() {
       const { publicKey, signTransaction } = useWallet();

       const handleUpload = async (event) => {
         const file = event.target.files[0];
         const dob = await extractDOB(file);
         if (dob) {
           const dobYear = parseInt(dob.split('/')[-1]);
           const { proof } = await generateProof(dobYear, 2025, 18);
           const proofHash = Buffer.from(proof).slice(0, 32); // Simplified
           await storeAttestation(proofHash);
         }
       };

       const storeAttestation = async (proofHash) => {
         const provider = new AnchorProvider(
           new web3.Connection('https://api.devnet.solana.com'),
           { publicKey, signTransaction },
           {}
         );
         const program = new Program(idl, 'YourProgramIDHere', provider);
         const attestation = web3.Keypair.generate();
         await program.rpc.storeAttestation(proofHash, {
           accounts: {
             attestation: attestation.publicKey,
             signer: publicKey,
             systemProgram: web3.SystemProgram.programId,
           },
           signers: [attestation],
         });
       };

       return (
         <div>
           <input type="file" onChange={handleUpload} />
           <button>Connect Wallet</button>
         </div>
       );
     }
     ```
   - Replace `YourProgramIDHere` with the actual program ID and provide the IDL file.

### Day 3: Testing and Demo Preparation
#### End-to-End Testing
1. **Test the Flow**:
   - Upload an ID image, extract DOB, generate ZKP, and store attestation.
   - Verify the transaction on [Solscan](https://explorer.solana.com/?cluster=devnet).
   - Test with multiple wallets (Phantom, Solflare).
2. **Debug Issues**:
   - Ensure wallet connections work.
   - Check OCR accuracy with different ID formats.
   - Verify ZKP generation and program interaction.

#### Demo Preparation
1. **Record Demo Video**:
   - Create a 2-minute video showing: ID upload → ZKP generation → Attestation storage → Solscan verification.
   - Use tools like OBS Studio for recording.
2. **Create Architecture Diagram**:
   - Use [Excalidraw](https://excalidraw.com) to draw a simple diagram of the flow (browser → OCR → ZKP → Solana).
3. **Polish Submission**:
   - Push code to GitHub with a detailed README.
   - Host the frontend on [Vercel](https://vercel.com) for a live demo.
   - Highlight privacy, AI fraud resistance, and Solana’s scalability in your pitch.

## Potential Challenges and Mitigations
| Challenge | Mitigation |
|-----------|------------|
| **OCR Accuracy** | Use clean ID images for the demo. Consider preprocessing for production ([PyImageSearch](https://pyimagesearch.com/2021/12/01/ocr-passports-with-opencv-and-tesseract)). |
| **ZKP Performance** | Use precompiled ZKP files to avoid circuit compilation. Optimize for desktop browsers for the demo. |
| **Wallet Integration** | Test Phantom and Solflare early to resolve connection issues. Use latest @solana/wallet-adapter-react. |
| **Devnet Rate Limits** | Request SOL in small batches (`solana airdrop 2`). Use Solana Web Faucet if needed ([anchor-lang.com](https://www.anchor-lang.com/docs/installation)). |

## Tips for Hackathon Success
- **Simplify**: Hardcode values (e.g., `currentYear = 2025`) to reduce complexity.
- **Precompiled Files**: Use provided ZKP files to save time ([SnarkJS](https://github.com/iden3/snarkjs)).
- **Early Testing**: Verify wallet and Devnet interactions on Day 1 to avoid delays.
- **Strong Pitch**: Emphasize ZK-ID’s privacy benefits and resistance to AI-generated fake IDs.
- **Demo Focus**: Show a clean flow in the video: ID upload → ZKP → Solana transaction.

## Additional Resources
- **Circom Documentation**: [docs.circom.io](https://docs.circom.io)
- **Anchor Documentation**: [anchor-lang.com](https://www.anchor-lang.com)
- **Solana Devnet Explorer**: [explorer.solana.com](https://explorer.solana.com/?cluster=devnet)
- **Tesseract.js**: [github.com/naptha/tesseract.js](https://github.com/naptha/tesseract.js)
- **Phantom Wallet**: [phantom.app](https://phantom.app)
- **ZKP Age Verification Example**: [github.com/appliedblockchain/zkp-rangeproof-age-verification](https://github.com/appliedblockchain/zkp-rangeproof-age-verification)

## License
MIT License

Good luck at the Solana Breakout hackathon! Build ZK-ID to showcase the future of privacy-preserving identity verification! 🚀