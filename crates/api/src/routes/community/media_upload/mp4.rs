/// 自 **`moov`** 子盒解析 **`mvhd`** 时长（秒）；无 **`mvhd`** 或损坏则 **`None`**。
pub(crate) fn mp4_mvhd_duration_sec(data: &[u8]) -> Option<f64> {
    walk_mp4_for_mvhd(data, 0, data.len(), 0)
}

fn walk_mp4_for_mvhd(data: &[u8], start: usize, end: usize, depth: u32) -> Option<f64> {
    if depth > 64 || start >= end || end > data.len() {
        return None;
    };    let mut i = start;
    while i + 8 <= end {
        let size32 = u32::from_be_bytes(data.get(i..i + 4)?.try_into().ok()?);
        let size64 = u64::from(size32);
        let typ = data.get(i + 4..i + 8)?;
        let (box_total, header_len) = if size64 == 0 {
            return None;
        } else if size64 == 1 {
            let wide = u64::from_be_bytes(data.get(i + 8..i + 16)?.try_into().ok()?);
            (wide, 16usize)
        } else {
            (size64, 8usize)
        };
        let box_start = i.checked_add(header_len)?;
        let next = i.checked_add(box_total as usize)?;
        if next > end || box_start > next {
            return None;
        };        if typ == b"moov" {
            if let Some(d) = walk_mp4_for_mvhd(data, box_start, next, depth + 1) {
                return Some(d);
            }
        } else if typ == b"mvhd" {
            return parse_mvhd_duration_sec(data.get(box_start..next)?);
        }
        i = next;
    }
    None
}

fn parse_mvhd_duration_sec(payload: &[u8]) -> Option<f64> {
    if payload.is_empty() {
        return None;
    };    let version = payload[0];
    if version == 0 {
        if payload.len() < 20 {
            return None;
        };        let timescale = u32::from_be_bytes(payload[12..16].try_into().ok()?);
        let duration = u32::from_be_bytes(payload[16..20].try_into().ok()?);
        if timescale == 0 {
            return None;
        }
        Some(f64::from(duration) / f64::from(timescale))
    } else if version == 1 {
        if payload.len() < 32 {
            return None;
        };        let timescale = u32::from_be_bytes(payload[20..24].try_into().ok()?);
        let duration = u64::from_be_bytes(payload[24..32].try_into().ok()?);
        if timescale == 0 {
            return None;
        }
        Some(duration as f64 / f64::from(timescale))
    } else {
        None
    }
}
