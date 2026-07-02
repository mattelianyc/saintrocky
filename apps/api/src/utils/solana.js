let publicKeyConstructorPromise = null;

async function getPublicKeyConstructor() {
  if (!publicKeyConstructorPromise) {
    publicKeyConstructorPromise = import('@solana/web3.js').then((module) => module.PublicKey);
  }

  return publicKeyConstructorPromise;
}

export async function isValidSolanaPublicKey(value) {
  if (!value) {
    return false;
  }

  try {
    const PublicKey = await getPublicKeyConstructor();
    new PublicKey(String(value));
    return true;
  } catch {
    return false;
  }
}
