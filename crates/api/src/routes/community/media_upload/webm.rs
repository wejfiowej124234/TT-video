// --- WebM / Matroska `Info`（RFC 8794 VINT + Matroska 元素 ID 类）---

pub(crate) const EBML_HEADER_ID: &[u8] = &[0x1A, 0x45, 0xDF, 0xA3];
pub(crate) const SEGMENT_ID: &[u8] = &[0x18, 0x53, 0x80, 0x67];
pub(crate) const INFO_ID: &[u8] = &[0x15, 0x49, 0xA9, 0x66];
pub(crate) const TIMESTAMP_SCALE_ID: &[u8] = &[0x2A, 0xD7, 0xB1];
pub(crate) const DURATION_ID: &[u8] = &[0x44, 0x89];

#[derive(Default, Clone)]
struct WebmInfoScratch {
    timestamp_scale: Option<u64>,
    duration_ticks: Option<f64>,
}

/// EBML Element ID 宽度（RFC 8794 · Class A～D）。
fn read_element_id_bytes<'a>(buf: &'a [u8], pos: &mut usize) -> Option<&'a [u8]> {
    let s = *pos;
    let b0 = *buf.get(s)?;
    let len = if (0x80..=0xFE).contains(&b0) {
        1usize
    } else if (0x40..=0x7F).contains(&b0) {
        2
    } else if (0x20..=0x3F).contains(&b0) {
        3
    } else if (0x10..=0x1F).contains(&b0) {
        4
    } else {
        return None;
    };    let e = s.checked_add(len)?;
    let sl = buf.get(s..e)?;
    *pos = e;
    Some(sl)
}

fn ebml_vint_width(b0: u8) -> Option<usize> {
    if b0 == 0 {
        return None;
    };    let mut mask = 0x80u8;
    let mut w = 1usize;
    while w <= 8 {
        if (b0 & mask) != 0 {
            return Some(w);
        }
        mask >>= 1;
        w += 1;
    }
    None
}

/// Element Data Size；**unknown-length**（数据位全 1）返回 **`None`**。
fn read_ebml_size(buf: &[u8], pos: &mut usize) -> Option<u64> {
    let s = *pos;
    let b0 = *buf.get(s)?;
    let width = ebml_vint_width(b0)?;
    if s + width > buf.len() {
        return None;
    };    let marker = 0x80u8 >> (width - 1);
    let mut val = (b0 & !marker) as u64;
    for j in 1..width {
        val = (val << 8) | buf[s + j] as u64;
    }
    *pos += width;
    let max_v = (1u128 << (7 * width)) - 1;
    if u128::from(val) == max_v {
        return None;
    }
    Some(val)
}

fn read_ebml_uint(data: &[u8]) -> Option<u64> {
    if data.is_empty() || data.len() > 8 {
        return None;
    };    let mut v = 0u64;
    for &b in data {
        v = (v << 8) | u64::from(b);
    }
    Some(v)
}

fn read_ebml_float(data: &[u8]) -> Option<f64> {
    match data.len() {
        4 => Some(f64::from(f32::from_be_bytes(data.try_into().ok()?))),
        8 => Some(f64::from_be_bytes(data.try_into().ok()?)),
        _ => None,
    }
}

fn parse_info_children(
    data: &[u8],
    start: usize,
    end: usize,
    st: &mut WebmInfoScratch,
) -> Option<()> {
    let end = end.min(data.len());
    let mut pos = start;
    while pos < end {
        let id = read_element_id_bytes(data, &mut pos)?;
        let sz = read_ebml_size(data, &mut pos)?;
        let body_end = pos.checked_add(sz as usize)?;
        if body_end > end {
            return None;
        };        if id == TIMESTAMP_SCALE_ID {
            st.timestamp_scale = read_ebml_uint(data.get(pos..body_end)?);
        } else if id == DURATION_ID {
            st.duration_ticks = read_ebml_float(data.get(pos..body_end)?);
        }
        pos = body_end;
    }
    Some(())
}

/// 自 **`Duration`** 与可选 **`TimestampScale`** 得秒数（与 Matroska / WebM **`Info`** 一致）。
fn finalize_webm_duration_sec(st: &WebmInfoScratch) -> Option<f64> {
    let d = st.duration_ticks?;
    if !d.is_finite() || d <= 0.0 {
        return None;
    };    if let Some(ts) = st.timestamp_scale {
        if ts == 0 {
            return None;
        }
        Some((d * ts as f64) / 1e9)
    } else {
        Some(d)
    }
}

/// 遍历顶层 **`EBML` / `Segment`**，解析 **`Info`**（不深入 **`Cluster`** 体，仅跳过）。
fn walk_webm_top_level(
    data: &[u8],
    start: usize,
    end: usize,
    depth: u32,
    st: &mut WebmInfoScratch,
) -> Option<()> {
    if depth > 64 {
        return Some(());
    };    let end = end.min(data.len());
    let mut pos = start;
    while pos < end {
        let id = read_element_id_bytes(data, &mut pos)?;
        let sz = read_ebml_size(data, &mut pos)?;
        let body_start = pos;
        let body_end = body_start.checked_add(sz as usize)?;
        if body_end > end {
            return None;
        }
        pos = body_end;
        if id == EBML_HEADER_ID || id == SEGMENT_ID {
            walk_webm_top_level(data, body_start, body_end, depth + 1, st)?;
        } else if id == INFO_ID {
            parse_info_children(data, body_start, body_end, st)?;
        }
    }
    Some(())
}

pub(crate) fn webm_segment_duration_sec(data: &[u8]) -> Option<f64> {
    let mut st = WebmInfoScratch::default();
    walk_webm_top_level(data, 0, data.len(), 0, &mut st)?;
    finalize_webm_duration_sec(&st)
}
