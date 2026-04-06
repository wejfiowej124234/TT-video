//! big-endian **uint256**（ABI 32 字节字）十六进制串的解析与加减法，供经济投影聚合（B-084）与份额重放（B-085）。

/// 解析 `0x` + 至多 64 hex（左填充）；不足 32 字节左补零。
pub fn parse_u256_word_hex(s: &str) -> Option<[u8; 32]> {
    let s = s.trim().trim_start_matches("0x").trim_start_matches("0X");
    if s.is_empty() || s.len() > 64 {
        return None;
    }
    if !s.chars().all(|c| c.is_ascii_hexdigit()) {
        return None;
    }
    let mut v = hex::decode(s).ok()?;
    if v.len() > 32 {
        return None;
    }
    if v.len() < 32 {
        let mut pad = vec![0u8; 32 - v.len()];
        pad.extend_from_slice(&v);
        v = pad;
    }
    let mut out = [0u8; 32];
    out.copy_from_slice(&v);
    Some(out)
}

/// big-endian **`acc += x`**；溢出返回 **`Err(())`**。
pub fn add_assign_be(acc: &mut [u8; 32], x: &[u8; 32]) -> Result<(), ()> {
    let mut carry: u16 = 0;
    for i in (0..32).rev() {
        let sum = u16::from(acc[i]) + u16::from(x[i]) + carry;
        acc[i] = sum as u8;
        carry = sum >> 8;
    }
    if carry != 0 {
        return Err(());
    }
    Ok(())
}

/// big-endian **`acc -= x`**；不足返回 **`Err(())`**（下溢）。
pub fn sub_assign_be(acc: &mut [u8; 32], x: &[u8; 32]) -> Result<(), ()> {
    let mut borrow: i16 = 0;
    for i in (0..32).rev() {
        let d = i16::from(acc[i]) - i16::from(x[i]) - borrow;
        if d < 0 {
            acc[i] = (d + 256) as u8;
            borrow = 1;
        } else {
            acc[i] = d as u8;
            borrow = 0;
        }
    }
    if borrow != 0 {
        return Err(());
    }
    Ok(())
}

pub fn zero_word() -> [u8; 32] {
    [0u8; 32]
}

pub fn fmt_word_hex(w: &[u8; 32]) -> String {
    format!("0x{}", hex::encode(w))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn add_two_small_words() {
        let a = parse_u256_word_hex(
            "0x0000000000000000000000000000000000000000000000000000000000000003",
        )
        .unwrap();
        let b = parse_u256_word_hex(
            "0x0000000000000000000000000000000000000000000000000000000000000005",
        )
        .unwrap();
        let mut acc = a;
        add_assign_be(&mut acc, &b).unwrap();
        assert_eq!(
            fmt_word_hex(&acc),
            "0x0000000000000000000000000000000000000000000000000000000000000008"
        );
    }

    #[test]
    fn reject_overflow() {
        let mut acc = [0xffu8; 32];
        let one = parse_u256_word_hex(
            "0x0000000000000000000000000000000000000000000000000000000000000001",
        )
        .unwrap();
        assert!(add_assign_be(&mut acc, &one).is_err());
    }

    #[test]
    fn sub_underflow_rejects() {
        let mut acc = zero_word();
        let one = parse_u256_word_hex(
            "0x0000000000000000000000000000000000000000000000000000000000000001",
        )
        .unwrap();
        assert!(sub_assign_be(&mut acc, &one).is_err());
    }

    #[test]
    fn add_then_sub_restores() {
        let mut acc = parse_u256_word_hex(
            "0x000000000000000000000000000000000000000000000000000000000000000a",
        )
        .unwrap();
        let three = parse_u256_word_hex(
            "0x0000000000000000000000000000000000000000000000000000000000000003",
        )
        .unwrap();
        add_assign_be(&mut acc, &three).unwrap();
        sub_assign_be(&mut acc, &three).unwrap();
        assert_eq!(
            fmt_word_hex(&acc),
            "0x000000000000000000000000000000000000000000000000000000000000000a"
        );
    }
}
