import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { config as loadEnv } from "dotenv";
import solc from "solc";
import { createPublicClient, createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { celo } from "viem/chains";

loadEnv();

type SolcOutput = {
  contracts: {
    "CForgeToken.sol": {
      CForgeToken: {
        abi: unknown[];
        evm: { bytecode: { object: string } };
      };
    };
  };
  errors?: Array<{ severity: string; formattedMessage: string }>;
};

function compileContract() {
  const source = readFileSync(resolve("contracts/CForgeToken.sol"), "utf8");
  const input = {
    language: "Solidity",
    sources: {
      "CForgeToken.sol": { content: source },
    },
    settings: {
      optimizer: { enabled: true, runs: 200 },
      outputSelection: {
        "*": {
          "*": ["abi", "evm.bytecode.object"],
        },
      },
    },
  };

  const output = JSON.parse(solc.compile(JSON.stringify(input))) as SolcOutput;
  const errors = output.errors?.filter((error) => error.severity === "error") ?? [];
  if (errors.length > 0) {
    throw new Error(errors.map((error) => error.formattedMessage).join("\n"));
  }

  const contract = output.contracts["CForgeToken.sol"].CForgeToken;
  return {
    abi: contract.abi,
    bytecode: `0x${contract.evm.bytecode.object}` as `0x${string}`,
  };
}

async function main() {
  const privateKey = process.env.CELO_PRIVATE_KEY;
  if (!privateKey) throw new Error("CELO_PRIVATE_KEY is required");

  const account = privateKeyToAccount(privateKey as `0x${string}`);
  const treasury = (process.env.CFORGE_TREASURY || account.address) as `0x${string}`;
  const rpcUrl = process.env.CELO_RPC_URL || "https://forno.celo.org";
  const { abi, bytecode } = compileContract();

  const publicClient = createPublicClient({
    chain: celo,
    transport: http(rpcUrl),
  });

  const walletClient = createWalletClient({
    account,
    chain: celo,
    transport: http(rpcUrl),
  });

  console.log(`Deploying cforge/CFRG from ${account.address}`);
  console.log(`Treasury: ${treasury}`);

  const hash = await walletClient.deployContract({
    abi,
    bytecode,
    args: [treasury],
  });
  const receipt = await publicClient.waitForTransactionReceipt({ hash });

  if (!receipt.contractAddress) throw new Error("Deployment receipt has no contract address");

  console.log(`Deployment tx: ${hash}`);
  console.log(`CFRG token deployed: ${receipt.contractAddress}`);
  console.log(`Set NEXT_PUBLIC_CFORGE_TOKEN_ADDRESS=${receipt.contractAddress}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
