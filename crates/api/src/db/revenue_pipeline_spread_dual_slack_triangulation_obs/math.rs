pub(crate) fn spread_i64(min_v: i64, max_v: i64) -> i64 {
    let d = i128::from(max_v) - i128::from(min_v);
    if d > i64::MAX as i128 {
        i64::MAX
    } else if d < i64::MIN as i128 {
        i64::MIN
    } else {
        d as i64
    }
}

pub(crate) fn gap_blocks_i64(checkpoint: u64, union_max: i64) -> i64 {
    let c = i128::from(checkpoint);
    let u = i128::from(union_max);
    let g = c - u;
    if g > i64::MAX as i128 {
        i64::MAX
    } else if g < i64::MIN as i128 {
        i64::MIN
    } else {
        g as i64
    }
}

pub(crate) fn tail_slack_i64(event_log_max: i64, union_max: i64) -> i64 {
    let e = i128::from(event_log_max);
    let u = i128::from(union_max);
    let s = e - u;
    if s > i64::MAX as i128 {
        i64::MAX
    } else if s < i64::MIN as i128 {
        i64::MIN
    } else {
        s as i64
    }
}
