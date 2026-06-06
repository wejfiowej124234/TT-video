//! EIP-191 personal_sign recovery for wallet ownership verification.

use secp256k1::{ecdsa::RecoverableSignature, Message, Secp256k1};
use sha3::{Digest, Keccak256};

pub fn eip191_message_hash(message: &str) -> [u8; 32] {
    let prefix = format!("\x19Ethereum Signed Message:\n{}", message.len());
    let mut hasher = Keccak256::new();
    hasher.update(prefix.as_bytes());
    hasher.update(message.as_bytes());
    let out = hasher.finalize();
    let mut hash = [0u8; 32];
    hash.copy_from_slice(&out[..32]);
    hash
}

/// Parse `0x` + 65-byte ECDSA signature; returns (v, r, s) compact for recovery.
pub fn parse_eth_signature_hex(sig: &str) -> Result<[u8; 65], &'static str> {
    let hex_str = sig.trim().strip_prefix("0x").unwrap_or(sig.trim());
    let bytes = hex::decode(hex_str).map_err(|_| "invalid_signature_length")?;
    if bytes.len() != 65 {
        return Err("invalid_signature_length");
    };    let mut out = [0u8; 65];
    out.copy_from_slice(&bytes);
    Ok(out)
}

pub fn recover_wallet_from_personal_sign(message: &str, sig_bytes: &[u8; 65]) -> Result<String, &'static str> {
    let hash = eip191_message_hash(message);
    let msg = Message::from_digest_slice(&hash).map_err(|_| "invalid_signature_length")?;
    let mut compact_sig = *sig_bytes;
    // Ledger / Ganache / some MetaMask paths return v ∈ {0,1}; ecrecover expects {27,28}.
    let v = compact_sig[64];
    compact_sig[64] = if v < 27 { v + 27 } else { v };
    if compact_sig[64] != 27 && compact_sig[64] != 28 {
        return Err("invalid_signature_length");
    };    let rec_id = secp256k1::ecdsa::RecoveryId::from_i32((compact_sig[64] - 27) as i32)
        .map_err(|_| "invalid_signature_length")?;
    let sig = RecoverableSignature::from_compact(&compact_sig[..64], rec_id)
        .map_err(|_| "invalid_signature_length")?;
    let secp = Secp256k1::new();
    let pk = secp
        .recover_ecdsa(&msg, &sig)
        .map_err(|_| "wallet_signature_mismatch")?;
    let ser = pk.serialize_uncompressed();
    let h = Keccak256::digest(&ser[1..]);
    Ok(format!("0x{}", hex::encode(&h[12..32])))
}

pub fn normalize_wallet_address(s: &str) -> Option<String> {
    let t = s.trim();
    let rest = t.strip_prefix("0x").or_else(|| t.strip_prefix("0X"))?;
    if rest.len() != 40 || !rest.chars().all(|c| c.is_ascii_hexdigit()) {
        return None;
    }
    Some(format!("0x{}", rest.to_lowercase()))
}

#[cfg(test)]
mod tests {
    use super::*;
    use secp256k1::{Secp256k1, SecretKey};

    fn sign_personal(sk: &SecretKey, message: &str) -> String {
        let secp = Secp256k1::new();
        let hash = eip191_message_hash(message);
        let msg = Message::from_digest_slice(&hash).unwrap();
        let sig = secp.sign_ecdsa_recoverable(&msg, sk);
        let (rid, compact) = sig.serialize_compact();
        let v = (rid.to_i32() as u8) + 27;
        let mut out = [0u8; 65];
        out[..64].copy_from_slice(&compact);
        out[64] = v;
        format!("0x{}", hex::encode(out))
    }

    #[test]
    fn recover_matches_signer() {
        let sk = SecretKey::from_slice(&[7u8; 32]).unwrap();
        let msg = "TravelTrust test";
        let sig = parse_eth_signature_hex(&sign_personal(&sk, msg)).unwrap();
        let recovered = recover_wallet_from_personal_sign(msg, &sig).unwrap();
        let secp = Secp256k1::new();
        let pk = sk.public_key(&secp);
        let ser = pk.serialize_uncompressed();
        let h = Keccak256::digest(&ser[1..]);
        let expected = format!("0x{}", hex::encode(&h[12..32]));
        assert_eq!(recovered.to_lowercase(), expected.to_lowercase());
    }

    #[test]
    fn recover_accepts_v0_and_v1() {
        let sk = SecretKey::from_slice(&[9u8; 32]).unwrap();
        let msg = "TravelTrust v0";
        let sig = parse_eth_signature_hex(&sign_personal(&sk, msg)).unwrap();
        let secp = Secp256k1::new();
        let pk = sk.public_key(&secp);
        let ser = pk.serialize_uncompressed();
        let h = Keccak256::digest(&ser[1..]);
        let expected = format!("0x{}", hex::encode(&h[12..32]));

        let mut sig_raw_v = sig;
        // Wallets may emit recovery id as 0/1 instead of 27/28.
        sig_raw_v[64] = sig[64] - 27;
        let recovered = recover_wallet_from_personal_sign(msg, &sig_raw_v).unwrap();
        assert_eq!(recovered.to_lowercase(), expected.to_lowercase());
    }
}
